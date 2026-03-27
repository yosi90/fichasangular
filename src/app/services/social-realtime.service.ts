import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ProfileApiError } from '../interfaces/user-account';
import { SocialWebSocketEvent } from '../interfaces/social-v3';
import { SocialV3ApiService } from './social-v3-api.service';

@Injectable({
    providedIn: 'root'
})
export class SocialRealtimeService implements OnDestroy {
    private readonly connectedSubject = new BehaviorSubject<boolean>(false);
    private readonly eventSubject = new Subject<SocialWebSocketEvent>();
    private readonly refetchRequestedSubject = new Subject<void>();
    private socket: WebSocket | null = null;
    private pingTimer: number | null = null;
    private reconnectTimer: number | null = null;
    private active = false;
    private hasConnectedOnce = false;
    private shouldRefetchOnNextOpen = false;

    readonly connected$ = this.connectedSubject.asObservable();
    readonly events$ = this.eventSubject.asObservable();
    readonly refetchRequested$ = this.refetchRequestedSubject.asObservable();

    constructor(private socialV3ApiSvc: SocialV3ApiService) { }

    activate(): void {
        if (this.active)
            return;

        this.active = true;
        void this.connectWebSocket();
    }

    deactivate(): void {
        this.active = false;
        this.clearReconnect();
        this.closeSocket();
        this.connectedSubject.next(false);
        this.hasConnectedOnce = false;
        this.shouldRefetchOnNextOpen = false;
    }

    ngOnDestroy(): void {
        this.deactivate();
    }

    private async connectWebSocket(): Promise<void> {
        if (!this.active)
            return;

        this.closeSocket();
        this.connectedSubject.next(false);

        try {
            const ticket = await this.socialV3ApiSvc.requestWebSocketTicket();
            if (`${ticket.ticket ?? ''}`.trim().length < 1) {
                this.scheduleReconnect();
                return;
            }

            const socketUrl = this.socialV3ApiSvc.buildWebSocketUrl(ticket.websocketUrl, ticket.ticket);
            const socket = new WebSocket(socketUrl);
            this.socket = socket;

            socket.onopen = () => {
                this.connectedSubject.next(true);
                this.clearReconnect();
                this.startPingLoop();
                if (this.shouldRefetchOnNextOpen) {
                    this.shouldRefetchOnNextOpen = false;
                    this.refetchRequestedSubject.next();
                }
                this.hasConnectedOnce = true;
            };
            socket.onmessage = (event) => this.handleSocketMessage(event.data);
            socket.onerror = () => {
                this.connectedSubject.next(false);
                this.prepareReconnect();
            };
            socket.onclose = () => {
                this.connectedSubject.next(false);
                this.prepareReconnect();
            };
        } catch (error) {
            this.reportRealtimeBootstrapError(error);
            if (this.shouldRetryRealtimeBootstrap(error))
                this.scheduleReconnect();
        }
    }

    private handleSocketMessage(rawData: any): void {
        let parsedRaw: any = null;
        try {
            parsedRaw = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        } catch {
            return;
        }

        const event = this.socialV3ApiSvc.parseWebSocketEvent(parsedRaw);
        if (!event || event.type === 'pong')
            return;

        this.eventSubject.next(event);
    }

    private prepareReconnect(): void {
        this.closeSocket();
        if (!this.active)
            return;

        if (this.hasConnectedOnce)
            this.shouldRefetchOnNextOpen = true;

        this.scheduleReconnect();
    }

    private scheduleReconnect(): void {
        if (!this.active || this.reconnectTimer !== null)
            return;

        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            if (!this.active)
                return;
            void this.connectWebSocket();
        }, 3000);
    }

    private clearReconnect(): void {
        if (this.reconnectTimer !== null)
            window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    private startPingLoop(): void {
        this.stopPingLoop();
        this.pingTimer = window.setInterval(() => {
            try {
                this.socket?.send(JSON.stringify({ type: 'ping' }));
            } catch {
                // noop
            }
        }, 20000);
    }

    private stopPingLoop(): void {
        if (this.pingTimer !== null)
            window.clearInterval(this.pingTimer);
        this.pingTimer = null;
    }

    private closeSocket(): void {
        this.stopPingLoop();
        if (!this.socket)
            return;
        try {
            this.socket.close();
        } catch {
            // noop
        }
        this.socket = null;
    }

    private shouldRetryRealtimeBootstrap(error: unknown): boolean {
        return !this.isPublishedRealtimeContractError(error);
    }

    private reportRealtimeBootstrapError(error: unknown): void {
        if (!this.isPublishedRealtimeContractError(error))
            return;

        console.error(
            '[social-realtime] El ticket realtime no devolvio websocketUrl en despliegue no local. Se reintentara solo si el contrato cambia.',
            error
        );
    }

    private isPublishedRealtimeContractError(error: unknown): boolean {
        return error instanceof ProfileApiError && error.code === 'SOCIAL_WS_URL_MISSING';
    }
}
