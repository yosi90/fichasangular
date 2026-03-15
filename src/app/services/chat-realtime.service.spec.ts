import { BehaviorSubject } from 'rxjs';
import { ChatRealtimeService } from './chat-realtime.service';

describe('ChatRealtimeService', () => {
    it('deduplica alertCandidate por messageId y omite mensajes propios', () => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            {} as any,
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );

        const alertedIds: number[] = [];
        service.alertCandidate$.subscribe((message) => alertedIds.push(message.messageId));

        (service as any).handleIncomingMessage({
            messageId: 10,
            conversationId: 5,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Hola',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: null,
            announcement: null,
        });
        (service as any).handleIncomingMessage({
            messageId: 10,
            conversationId: 5,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Hola',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: null,
            announcement: null,
        });
        (service as any).handleIncomingMessage({
            messageId: 11,
            conversationId: 5,
            sender: {
                uid: 'uid-propio',
                displayName: 'Yo',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Mensaje propio',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: null,
            announcement: null,
        });

        expect(alertedIds).toEqual([10]);
    });

    it('solo considera focused la conversación activa con la pestaña visible y con foco', () => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            {} as any,
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );

        service.setActiveConversationId(5);
        spyOn(document, 'hasFocus').and.returnValue(true);
        const visibilityStateSpy = spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');

        expect(service.isConversationFocused(5)).toBeTrue();
        expect(service.isConversationFocused(6)).toBeFalse();

        (document.hasFocus as jasmine.Spy).and.returnValue(false);
        expect(service.isConversationFocused(5)).toBeFalse();

        (document.hasFocus as jasmine.Spy).and.returnValue(true);
        visibilityStateSpy.and.returnValue('hidden');
        expect(service.isConversationFocused(5)).toBeFalse();
    });

    it('mantiene un único timer de polling de respaldo y lo limpia al cerrar', () => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            {} as any,
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );
        const setIntervalSpy = spyOn(window, 'setInterval').and.returnValue(123 as any);
        const clearIntervalSpy = spyOn(window, 'clearInterval');

        (service as any).startPolling();
        (service as any).startPolling();
        (service as any).clearPolling();

        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        expect(clearIntervalSpy).toHaveBeenCalledWith(123);
        expect((service as any).pollingTimer).toBeNull();
    });
});
