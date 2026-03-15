import { Injectable, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { ChatConversationSummary, ChatMessage, ChatMessageReadPayload } from '../interfaces/chat';
import { ChatApiService } from './chat-api.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class ChatRealtimeService implements OnDestroy {
    private readonly conversationsSubject = new BehaviorSubject<ChatConversationSummary[]>([]);
    private readonly unreadUserCountSubject = new BehaviorSubject<number>(0);
    private readonly unreadSystemCountSubject = new BehaviorSubject<number>(0);
    private readonly activeConversationIdSubject = new BehaviorSubject<number | null>(null);
    private readonly messageCreatedSubject = new Subject<ChatMessage>();
    private readonly alertCandidateSubject = new Subject<ChatMessage>();
    private readonly conversationUpdatedSubject = new Subject<ChatConversationSummary>();
    private readonly messageReadSubject = new Subject<ChatMessageReadPayload>();
    private readonly notifiedMessageIdsByConversation = new Map<number, number>();
    private authSub?: Subscription;
    private socket: WebSocket | null = null;
    private pollingTimer: number | null = null;
    private pingTimer: number | null = null;
    private refreshInFlight = false;
    private initialized = false;

    readonly conversations$ = this.conversationsSubject.asObservable();
    readonly unreadUserCount$ = this.unreadUserCountSubject.asObservable();
    readonly unreadSystemCount$ = this.unreadSystemCountSubject.asObservable();
    readonly activeConversationId$ = this.activeConversationIdSubject.asObservable();
    readonly messageCreated$ = this.messageCreatedSubject.asObservable();
    readonly alertCandidate$ = this.alertCandidateSubject.asObservable();
    readonly conversationUpdated$ = this.conversationUpdatedSubject.asObservable();
    readonly messageRead$ = this.messageReadSubject.asObservable();

    constructor(
        private auth: Auth,
        private userSvc: UserService,
        private chatApiSvc: ChatApiService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.authSub = this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
            if (loggedIn === true) {
                void this.startForCurrentSession();
                return;
            }
            this.teardownSessionState();
        });
    }

    ngOnDestroy(): void {
        this.authSub?.unsubscribe();
        this.teardownSessionState();
    }

    setActiveConversationId(conversationId: number | null): void {
        this.activeConversationIdSubject.next(this.toPositiveInt(conversationId));
    }

    isConversationFocused(conversationId: number | null | undefined): boolean {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        if (!normalizedConversationId)
            return false;

        return this.activeConversationIdSubject.value === normalizedConversationId
            && typeof document !== 'undefined'
            && document.visibilityState === 'visible'
            && document.hasFocus();
    }

    upsertConversation(conversation: ChatConversationSummary): void {
        const normalized = this.sortConversations(this.upsertConversationInList(this.conversationsSubject.value, conversation));
        this.conversationsSubject.next(normalized);
        this.recomputeUnreadCounts(normalized);
        this.conversationUpdatedSubject.next(conversation);
    }

    markConversationReadLocally(conversationId: number): void {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        if (!normalizedConversationId)
            return;

        const next = this.conversationsSubject.value.map((item) => {
            if (item.conversationId !== normalizedConversationId)
                return item;
            return {
                ...item,
                unreadCount: 0,
            };
        });
        this.conversationsSubject.next(next);
        this.recomputeUnreadCounts(next);
    }

    async refreshConversations(force: boolean = false): Promise<void> {
        if (this.refreshInFlight && !force)
            return;

        this.refreshInFlight = true;
        try {
            const result = await this.chatApiSvc.listConversations();
            const normalized = this.sortConversations(result.items);
            this.conversationsSubject.next(normalized);
            this.unreadUserCountSubject.next(result.unreadUserCount);
            this.unreadSystemCountSubject.next(result.unreadSystemCount);
        } catch {
            // best effort
        } finally {
            this.refreshInFlight = false;
        }
    }

    private async startForCurrentSession(): Promise<void> {
        await this.refreshConversations(true);
        await this.connectWebSocket();
    }

    private async connectWebSocket(): Promise<void> {
        this.closeSocket();
        this.clearPolling();

        const currentUser = this.auth.currentUser;
        if (!currentUser || typeof currentUser.getIdToken !== 'function') {
            this.startPolling();
            return;
        }

        try {
            const token = await currentUser.getIdToken();
            if (`${token ?? ''}`.trim().length < 1) {
                this.startPolling();
                return;
            }

            const socketUrl = this.chatApiSvc.buildWebSocketUrl(token);
            this.socket = new WebSocket(socketUrl);
            this.socket.onopen = () => {
                this.clearPolling();
                this.startPingLoop();
            };
            this.socket.onmessage = (event) => this.onSocketMessage(event.data);
            this.socket.onerror = () => {
                this.startPolling();
            };
            this.socket.onclose = () => {
                this.stopPingLoop();
                this.socket = null;
                this.startPolling();
            };
        } catch {
            this.startPolling();
        }
    }

    private onSocketMessage(rawData: any): void {
        let parsedRaw: any = null;
        try {
            parsedRaw = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        } catch {
            return;
        }

        const event = this.chatApiSvc.parseWebSocketEvent(parsedRaw);
        if (!event)
            return;

        if (event.type === 'pong')
            return;

        if (event.type === 'conversation.updated') {
            this.upsertConversation(event.payload);
            return;
        }

        if (event.type === 'message.read') {
            this.messageReadSubject.next(event.payload);
            if (event.payload.uid === this.userSvc.CurrentUserUid)
                this.markConversationReadLocally(event.payload.conversationId);
            return;
        }

        this.handleIncomingMessage(event.payload);
    }

    private handleIncomingMessage(message: ChatMessage): void {
        this.messageCreatedSubject.next(message);
        this.emitAlertCandidate(message);
        void this.refreshConversations();
    }

    private emitAlertCandidate(message: ChatMessage): void {
        const conversationId = this.toPositiveInt(message?.conversationId);
        const messageId = this.toPositiveInt(message?.messageId);
        if (!conversationId || !messageId)
            return;
        if (`${message.sender?.uid ?? ''}`.trim() === this.userSvc.CurrentUserUid)
            return;

        const lastNotifiedId = this.notifiedMessageIdsByConversation.get(conversationId) ?? 0;
        if (messageId <= lastNotifiedId)
            return;
        this.notifiedMessageIdsByConversation.set(conversationId, messageId);
        this.alertCandidateSubject.next(message);
    }

    private startPolling(): void {
        if (this.pollingTimer !== null)
            return;

        this.pollingTimer = window.setInterval(() => {
            void this.refreshConversations();
        }, 30000);
    }

    private clearPolling(): void {
        if (this.pollingTimer !== null)
            window.clearInterval(this.pollingTimer);
        this.pollingTimer = null;
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
        if (!this.socket)
            return;
        try {
            this.socket.close();
        } catch {
            // noop
        }
        this.socket = null;
        this.stopPingLoop();
    }

    private teardownSessionState(): void {
        this.clearPolling();
        this.closeSocket();
        this.conversationsSubject.next([]);
        this.unreadUserCountSubject.next(0);
        this.unreadSystemCountSubject.next(0);
        this.activeConversationIdSubject.next(null);
        this.notifiedMessageIdsByConversation.clear();
    }

    private upsertConversationInList(list: ChatConversationSummary[], conversation: ChatConversationSummary): ChatConversationSummary[] {
        const targetId = this.toPositiveInt(conversation?.conversationId);
        if (!targetId)
            return list;

        let found = false;
        const next = list.map((item) => {
            if (item.conversationId !== targetId)
                return item;
            found = true;
            return conversation;
        });
        if (!found)
            next.push(conversation);
        return next;
    }

    private sortConversations(list: ChatConversationSummary[]): ChatConversationSummary[] {
        return [...list].sort((a, b) => this.toDateMs(b.lastMessageAtUtc) - this.toDateMs(a.lastMessageAtUtc));
    }

    private recomputeUnreadCounts(list: ChatConversationSummary[]): void {
        let unreadUser = 0;
        let unreadSystem = 0;
        list.forEach((item) => {
            if (item.isSystemConversation)
                unreadSystem += item.unreadCount;
            else
                unreadUser += item.unreadCount;
        });
        this.unreadUserCountSubject.next(unreadUser);
        this.unreadSystemCountSubject.next(unreadSystem);
    }

    private toDateMs(value: string | null | undefined): number {
        const parsed = new Date(`${value ?? ''}`);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
}
