import { fakeAsync, tick } from '@angular/core/testing';
import { ProfileApiError } from '../interfaces/user-account';
import { SocialRealtimeService } from './social-realtime.service';
import { SocialV3ApiService } from './social-v3-api.service';

class FakeWebSocket {
    static instances: FakeWebSocket[] = [];

    onopen: (() => void) | null = null;
    onmessage: ((event: { data: any; }) => void) | null = null;
    onerror: (() => void) | null = null;
    onclose: (() => void) | null = null;
    send = jasmine.createSpy('send');
    close = jasmine.createSpy('close').and.callFake(() => this.onclose?.());

    constructor(public readonly url: string) {
        FakeWebSocket.instances.push(this);
    }

    emitOpen(): void {
        this.onopen?.();
    }

    emitMessage(payload: any): void {
        this.onmessage?.({ data: typeof payload === 'string' ? payload : JSON.stringify(payload) });
    }

    emitError(): void {
        this.onerror?.();
    }
}

describe('SocialRealtimeService', () => {
    const originalWebSocket = (window as any).WebSocket;
    let socialV3ApiSvc: jasmine.SpyObj<SocialV3ApiService>;
    let service: SocialRealtimeService;

    beforeEach(() => {
        FakeWebSocket.instances = [];
        (window as any).WebSocket = FakeWebSocket as any;
        socialV3ApiSvc = jasmine.createSpyObj<SocialV3ApiService>('SocialV3ApiService', [
            'requestWebSocketTicket',
            'buildWebSocketUrl',
            'parseWebSocketEvent',
        ]);
        socialV3ApiSvc.requestWebSocketTicket.and.resolveTo({
            ticket: 'ticket-1',
            expiresAtUtc: null,
            websocketUrl: 'ws://127.0.0.1:3000/ws/social',
        });
        socialV3ApiSvc.buildWebSocketUrl.and.returnValue('ws://127.0.0.1:3000/ws/social?ticket=ticket-1');
        socialV3ApiSvc.parseWebSocketEvent.and.callFake((raw: any) => raw?.type === 'feed.item_created'
            ? { type: 'feed.item_created', payload: { id: 'feed-1' } } as any
            : raw?.type === 'pong'
                ? { type: 'pong', payload: {} } as any
                : null);
        service = new SocialRealtimeService(socialV3ApiSvc);
    });

    afterEach(() => {
        (window as any).WebSocket = originalWebSocket;
        service.deactivate();
    });

    it('abre websocket al activarse y reemite eventos conocidos', fakeAsync(() => {
        const events: any[] = [];
        service.events$.subscribe((event) => events.push(event));

        service.activate();
        tick();

        expect(socialV3ApiSvc.requestWebSocketTicket).toHaveBeenCalledTimes(1);
        expect(FakeWebSocket.instances.length).toBe(1);

        FakeWebSocket.instances[0].emitOpen();
        FakeWebSocket.instances[0].emitMessage({ type: 'feed.item_created', payload: {} });
        FakeWebSocket.instances[0].emitMessage({ type: 'pong', payload: {} });
        FakeWebSocket.instances[0].emitMessage('{invalid json');
        tick();

        expect(events).toEqual([{ type: 'feed.item_created', payload: { id: 'feed-1' } }]);
    }));

    it('al reconectar pide ticket nuevo y solicita refetch', fakeAsync(() => {
        const refetches: number[] = [];
        service.refetchRequested$.subscribe(() => refetches.push(Date.now()));
        socialV3ApiSvc.requestWebSocketTicket.and.returnValues(
            Promise.resolve({
                ticket: 'ticket-1',
                expiresAtUtc: null,
                websocketUrl: 'ws://127.0.0.1:3000/ws/social',
            }),
            Promise.resolve({
                ticket: 'ticket-2',
                expiresAtUtc: null,
                websocketUrl: 'ws://127.0.0.1:3000/ws/social',
            })
        );
        socialV3ApiSvc.buildWebSocketUrl.and.callFake((_: string, ticket: string) => `ws://127.0.0.1:3000/ws/social?ticket=${ticket}`);

        service.activate();
        tick();
        FakeWebSocket.instances[0].emitOpen();
        FakeWebSocket.instances[0].emitError();
        tick(3000);

        expect(socialV3ApiSvc.requestWebSocketTicket).toHaveBeenCalledTimes(2);
        expect(FakeWebSocket.instances.length).toBe(2);

        FakeWebSocket.instances[1].emitOpen();
        tick();

        expect(refetches.length).toBe(1);
        expect(FakeWebSocket.instances[1].url).toContain('ticket=ticket-2');
    }));

    it('no reintenta automáticamente si falla por contrato publicado sin websocketUrl', fakeAsync(() => {
        socialV3ApiSvc.requestWebSocketTicket.and.rejectWith(
            new ProfileApiError('Falta websocketUrl', 'SOCIAL_WS_URL_MISSING', 500)
        );
        spyOn(console, 'error');

        service.activate();
        tick(4000);

        expect(socialV3ApiSvc.requestWebSocketTicket).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalled();
    }));
});
