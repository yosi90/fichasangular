import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { ChatAlertCandidate, ChatConversationSummary, ChatMessage, ChatMessageReadPayload, getChatConversationDisplayTitle } from '../interfaces/chat';
import { ProfileApiError } from '../interfaces/user-account';
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
    private readonly alertCandidateSubject = new Subject<ChatAlertCandidate>();
    private readonly conversationUpdatedSubject = new Subject<ChatConversationSummary>();
    private readonly messageReadSubject = new Subject<ChatMessageReadPayload>();
    private readonly notifiedMessageIdsByConversation = new Map<number, number>();
    private readonly handledAlertKeys = new Set<string>();
    private readonly pendingConversationRefreshIds = new Set<number>();
    private authSub?: Subscription;
    private profileSub?: Subscription;
    private socket: WebSocket | null = null;
    private pollingTimer: number | null = null;
    private pingTimer: number | null = null;
    private reconnectTimer: number | null = null;
    private refreshDebounceTimer: number | null = null;
    private refreshInFlight = false;
    private initialized = false;
    private bootstrapFailureCount = 0;
    private suppressAutomaticRealtimeReconnect = false;
    private complianceRealtimeBlocked = false;
    private activeSessionUid = '';
    private startInFlightUid = '';
    private sessionRunToken = 0;

    readonly conversations$ = this.conversationsSubject.asObservable();
    readonly unreadUserCount$ = this.unreadUserCountSubject.asObservable();
    readonly unreadSystemCount$ = this.unreadSystemCountSubject.asObservable();
    readonly activeConversationId$ = this.activeConversationIdSubject.asObservable();
    readonly messageCreated$ = this.messageCreatedSubject.asObservable();
    readonly alertCandidate$ = this.alertCandidateSubject.asObservable();
    readonly conversationUpdated$ = this.conversationUpdatedSubject.asObservable();
    readonly messageRead$ = this.messageReadSubject.asObservable();

    constructor(
        private userSvc: UserService,
        private chatApiSvc: ChatApiService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.authSub = this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
            if (loggedIn === true) {
                this.startCurrentSessionIfNeeded();
                return;
            }
            this.teardownSessionState();
        });
        this.profileSub = this.userSvc.currentPrivateProfile$.subscribe(() => {
            this.handleComplianceRealtimeStateChange();
        });
    }

    ngOnDestroy(): void {
        this.authSub?.unsubscribe();
        this.profileSub?.unsubscribe();
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

    findSystemConversationId(counterpartUid: string = 'system:yosiftware'): number | null {
        const normalizedCounterpartUid = `${counterpartUid ?? ''}`.trim();
        if (normalizedCounterpartUid.length < 1)
            return null;

        const match = this.conversationsSubject.value.find((item) =>
            item.isSystemConversation === true && `${item.counterpartUid ?? ''}`.trim() === normalizedCounterpartUid
        );
        return this.toPositiveInt(match?.conversationId);
    }

    async refreshConversations(force: boolean = false): Promise<void> {
        if (this.isRealtimeAccessBlocked()) {
            this.applyComplianceRealtimeBlock();
            return;
        }
        if (this.refreshInFlight && !force)
            return;

        this.refreshInFlight = true;
        try {
            const previous = this.conversationsSubject.value;
            const result = await this.chatApiSvc.listConversations();
            const normalized = this.sortConversations(result.items);
            this.conversationsSubject.next(normalized);
            this.unreadUserCountSubject.next(result.unreadUserCount);
            this.unreadSystemCountSubject.next(result.unreadSystemCount);
            this.emitSummaryAlertCandidates(previous, normalized);
        } catch (error) {
            if (this.isRealtimeComplianceBlockError(error))
                this.applyComplianceRealtimeBlock();
        } finally {
            this.refreshInFlight = false;
        }
    }

    private startCurrentSessionIfNeeded(force: boolean = false): void {
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        if (currentUid.length < 1)
            return;
        if (!force && (this.activeSessionUid === currentUid || this.startInFlightUid === currentUid))
            return;

        this.activeSessionUid = currentUid;
        this.startInFlightUid = currentUid;
        const sessionRunToken = ++this.sessionRunToken;
        void this.startForCurrentSession(currentUid, sessionRunToken)
            .finally(() => {
                if (this.startInFlightUid === currentUid)
                    this.startInFlightUid = '';
            });
    }

    private async startForCurrentSession(sessionUid: string, sessionRunToken: number): Promise<void> {
        if (!this.isCurrentSessionRun(sessionUid, sessionRunToken))
            return;
        if (this.isRealtimeAccessBlocked()) {
            this.applyComplianceRealtimeBlock();
            return;
        }
        this.resetRealtimeBootstrapState();
        await this.refreshConversations(true);
        if (!this.isCurrentSessionRun(sessionUid, sessionRunToken) || this.complianceRealtimeBlocked || this.isRealtimeAccessBlocked())
            return;
        await this.connectWebSocket(sessionUid, sessionRunToken);
    }

    private async connectWebSocket(sessionUid: string, sessionRunToken: number): Promise<void> {
        if (!this.isCurrentSessionRun(sessionUid, sessionRunToken))
            return;
        if (this.suppressAutomaticRealtimeReconnect || this.isRealtimeAccessBlocked()) {
            this.applyComplianceRealtimeBlock();
            return;
        }

        this.closeSocket();
        this.clearPolling();

        if (`${this.userSvc.CurrentUserUid ?? ''}`.trim().length < 1) {
            this.startPolling();
            return;
        }

        try {
            const ticketResponse = await this.chatApiSvc.requestWebSocketTicket();
            if (!this.isCurrentSessionRun(sessionUid, sessionRunToken))
                return;
            if (`${ticketResponse.ticket ?? ''}`.trim().length < 1) {
                this.startPolling();
                return;
            }

            const socketUrl = this.chatApiSvc.buildWebSocketUrl(ticketResponse.websocketUrl, ticketResponse.ticket);
            const socket = new WebSocket(socketUrl);
            if (!this.isCurrentSessionRun(sessionUid, sessionRunToken)) {
                socket.close();
                return;
            }

            this.socket = socket;
            socket.onopen = () => {
                if (this.socket !== socket || !this.isCurrentSessionRun(sessionUid, sessionRunToken))
                    return;
                this.clearPolling();
                this.clearReconnect();
                this.resetRealtimeBootstrapState();
                this.startPingLoop();
            };
            socket.onmessage = (event) => {
                if (this.socket !== socket)
                    return;
                this.onSocketMessage(event.data);
            };
            socket.onerror = () => {
                if (this.socket !== socket)
                    return;
                this.startPolling();
                this.scheduleReconnect();
            };
            socket.onclose = () => {
                if (this.socket !== socket)
                    return;
                this.stopPingLoop();
                this.socket = null;
                this.startPolling();
                this.scheduleReconnect();
            };
        } catch (error) {
            if (!this.isCurrentSessionRun(sessionUid, sessionRunToken))
                return;
            this.startPolling();
            const shouldRetry = this.shouldRetryRealtimeBootstrap(error);
            this.reportRealtimeBootstrapError(error);
            if (shouldRetry)
                this.scheduleReconnect();
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
            this.resolvePendingConversationRefresh(event.payload.conversationId);
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
        this.emitAlertCandidateFromMessage(message);
        this.queueConversationRefresh(message.conversationId);
    }

    private emitAlertCandidateFromMessage(message: ChatMessage): void {
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

        const candidate = this.buildMessageAlertCandidate(message);
        if (!candidate || this.handledAlertKeys.has(candidate.alertKey))
            return;

        this.handledAlertKeys.add(candidate.alertKey);
        this.alertCandidateSubject.next(candidate);
    }

    private emitSummaryAlertCandidates(previous: ChatConversationSummary[], next: ChatConversationSummary[]): void {
        const previousMap = new Map<number, ChatConversationSummary>();
        previous.forEach((item) => {
            if (item.conversationId > 0)
                previousMap.set(item.conversationId, item);
        });

        next.forEach((item) => {
            if (!item.isSystemConversation || !item.lastMessageNotification)
                return;
            if (item.unreadCount < 1)
                return;

            const previousItem = previousMap.get(item.conversationId);
            const previousUnread = previousItem?.unreadCount ?? 0;
            if (item.unreadCount <= previousUnread)
                return;

            const candidate = this.buildSummaryAlertCandidate(item);
            if (!candidate || this.handledAlertKeys.has(candidate.alertKey))
                return;

            this.handledAlertKeys.add(candidate.alertKey);
            this.alertCandidateSubject.next(candidate);
        });
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

    private queueConversationRefresh(conversationId: number | null | undefined): void {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        if (!normalizedConversationId)
            return;

        this.pendingConversationRefreshIds.add(normalizedConversationId);
        if (this.refreshDebounceTimer !== null)
            return;

        this.refreshDebounceTimer = window.setTimeout(() => {
            const shouldRefresh = this.pendingConversationRefreshIds.size > 0;
            this.pendingConversationRefreshIds.clear();
            this.refreshDebounceTimer = null;
            if (shouldRefresh)
                void this.refreshConversations();
        }, 250);
    }

    private resolvePendingConversationRefresh(conversationId: number | null | undefined): void {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        if (!normalizedConversationId)
            return;

        this.pendingConversationRefreshIds.delete(normalizedConversationId);
        if (this.pendingConversationRefreshIds.size > 0 || this.refreshDebounceTimer === null)
            return;

        window.clearTimeout(this.refreshDebounceTimer);
        this.refreshDebounceTimer = null;
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
        const socket = this.socket;
        if (!socket)
            return;
        this.socket = null;
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        try {
            socket.close();
        } catch {
            // noop
        }
        this.stopPingLoop();
    }

    private teardownSessionState(): void {
        this.activeSessionUid = '';
        this.startInFlightUid = '';
        this.sessionRunToken += 1;
        this.clearPolling();
        this.clearReconnect();
        this.clearQueuedConversationRefresh();
        this.closeSocket();
        this.conversationsSubject.next([]);
        this.unreadUserCountSubject.next(0);
        this.unreadSystemCountSubject.next(0);
        this.activeConversationIdSubject.next(null);
        this.notifiedMessageIdsByConversation.clear();
        this.handledAlertKeys.clear();
        this.complianceRealtimeBlocked = false;
        this.resetRealtimeBootstrapState();
    }

    private handleComplianceRealtimeStateChange(): void {
        if (!this.initialized || this.userSvc.CurrentUserUid.length < 1)
            return;

        if (this.isRealtimeAccessBlocked()) {
            this.applyComplianceRealtimeBlock();
            return;
        }

        if (!this.complianceRealtimeBlocked)
            return;

        this.complianceRealtimeBlocked = false;
        this.resetRealtimeBootstrapState();
        this.activeSessionUid = '';
        this.startInFlightUid = '';
        this.startCurrentSessionIfNeeded();
    }

    private clearQueuedConversationRefresh(): void {
        this.pendingConversationRefreshIds.clear();
        if (this.refreshDebounceTimer !== null)
            window.clearTimeout(this.refreshDebounceTimer);
        this.refreshDebounceTimer = null;
    }

    private shouldRetryRealtimeBootstrap(error: unknown): boolean {
        if (this.isRealtimeComplianceBlockError(error)) {
            this.applyComplianceRealtimeBlock();
            return false;
        }

        if (this.isPublishedRealtimeContractError(error)) {
            this.suppressAutomaticRealtimeReconnect = true;
            return false;
        }

        if (this.isGatewayBootstrapUnavailableError(error)) {
            this.bootstrapFailureCount += 1;
            if (this.bootstrapFailureCount >= 2) {
                this.suppressAutomaticRealtimeReconnect = true;
                return false;
            }
        }

        return true;
    }

    private reportRealtimeBootstrapError(error: unknown): void {
        if (this.isRealtimeComplianceBlockError(error)) {
            console.info(
                '[chat-realtime] Se detienen polling y reintentos websocket mientras el actor tenga normas de uso pendientes o la cuenta esté bloqueada.',
                error
            );
            return;
        }

        if (this.isPublishedRealtimeContractError(error)) {
            console.error(
                '[chat-realtime] El ticket realtime no devolvio websocketUrl en despliegue no local. Se mantiene polling pero no se reintentara websocket automaticamente.',
                error
            );
            return;
        }

        if (this.isGatewayBootstrapUnavailableError(error) && this.bootstrapFailureCount >= 2) {
            console.warn(
                '[chat-realtime] El gateway realtime publicado sigue devolviendo error de red/gateway. Se mantiene polling y se detienen los reintentos websocket automaticos en esta sesion.',
                error
            );
        }
    }

    private isPublishedRealtimeContractError(error: unknown): boolean {
        return error instanceof ProfileApiError && error.code === 'CHAT_WS_URL_MISSING';
    }

    private isGatewayBootstrapUnavailableError(error: unknown): boolean {
        return error instanceof ProfileApiError
            && [0, 502, 503, 504].includes(Number(error.status ?? 0));
    }

    private isRealtimeComplianceBlockError(error: unknown): boolean {
        const restriction = typeof this.userSvc.resolveComplianceRestrictionFromError === 'function'
            ? this.userSvc.resolveComplianceRestrictionFromError(error, 'usage')
            : null;
        return restriction === 'mustAcceptUsage' || restriction === 'temporaryBan' || restriction === 'permanentBan';
    }

    private isRealtimeAccessBlocked(): boolean {
        const restriction = typeof this.userSvc.getAccessRestriction === 'function'
            ? this.userSvc.getAccessRestriction('usage')
            : null;
        return restriction === 'mustAcceptUsage' || restriction === 'temporaryBan' || restriction === 'permanentBan';
    }

    private applyComplianceRealtimeBlock(): void {
        this.complianceRealtimeBlocked = true;
        this.suppressAutomaticRealtimeReconnect = true;
        this.clearPolling();
        this.clearReconnect();
        this.closeSocket();
    }

    private resetRealtimeBootstrapState(): void {
        this.bootstrapFailureCount = 0;
        this.suppressAutomaticRealtimeReconnect = false;
    }

    private buildMessageAlertCandidate(message: ChatMessage): ChatAlertCandidate | null {
        const conversationId = this.toPositiveInt(message?.conversationId);
        if (!conversationId)
            return null;
        const conversation = this.conversationsSubject.value.find((item) => item.conversationId === conversationId) ?? null;

        const alertKey = this.buildAlertKey(
            conversationId,
            message?.sentAtUtc,
            message?.notification?.code,
            message?.notification?.title,
            message?.body,
        );
        if (!alertKey)
            return null;

        return {
            alertKey,
            source: 'message',
            messageId: this.toPositiveInt(message?.messageId),
            conversationId,
            conversationType: conversation?.type ?? null,
            conversationTitle: getChatConversationDisplayTitle(conversation) || null,
            campaignId: this.toPositiveInt(conversation?.campaignId),
            isSystemConversation: conversation?.isSystemConversation === true,
            sender: {
                uid: `${message?.sender?.uid ?? ''}`.trim(),
                displayName: message?.sender?.displayName ?? null,
                photoThumbUrl: message?.sender?.photoThumbUrl ?? null,
                isSystemUser: message?.sender?.isSystemUser === true,
            },
            body: `${message?.body ?? ''}`.trim(),
            sentAtUtc: `${message?.sentAtUtc ?? ''}`.trim() || null,
            notification: message?.notification ?? null,
            announcement: message?.announcement ?? null,
        };
    }

    private buildSummaryAlertCandidate(conversation: ChatConversationSummary): ChatAlertCandidate | null {
        const conversationId = this.toPositiveInt(conversation?.conversationId);
        if (!conversationId)
            return null;

        const alertKey = this.buildAlertKey(
            conversationId,
            conversation?.lastMessageAtUtc,
            conversation?.lastMessageNotification?.code,
            conversation?.lastMessageNotification?.title,
            conversation?.lastMessagePreview,
        );
        if (!alertKey)
            return null;

        return {
            alertKey,
            source: 'conversation_summary',
            messageId: null,
            conversationId,
            conversationType: conversation?.type ?? null,
            conversationTitle: getChatConversationDisplayTitle(conversation) || null,
            campaignId: this.toPositiveInt(conversation?.campaignId),
            isSystemConversation: conversation?.isSystemConversation === true,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: `${conversation?.lastMessagePreview ?? ''}`.trim(),
            sentAtUtc: `${conversation?.lastMessageAtUtc ?? ''}`.trim() || null,
            notification: conversation?.lastMessageNotification ?? null,
            announcement: null,
        };
    }

    private buildAlertKey(
        conversationId: number,
        sentAtUtc: string | null | undefined,
        notificationCode: string | null | undefined,
        notificationTitle: string | null | undefined,
        body: string | null | undefined
    ): string | null {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        const normalizedSentAtUtc = `${sentAtUtc ?? ''}`.trim();
        const normalizedCode = `${notificationCode ?? ''}`.trim();
        const normalizedTitle = `${notificationTitle ?? ''}`.trim();
        const normalizedBody = `${body ?? ''}`.replace(/\s+/g, ' ').trim();
        if (!normalizedConversationId || normalizedSentAtUtc.length < 1)
            return null;

        return [
            normalizedConversationId,
            normalizedSentAtUtc,
            normalizedCode,
            normalizedTitle,
            normalizedBody,
        ].join('|');
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer !== null)
            return;

        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
            if (currentUid.length < 1)
                return;
            void this.connectWebSocket(currentUid, this.sessionRunToken);
        }, 3000);
    }

    private clearReconnect(): void {
        if (this.reconnectTimer !== null)
            window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    private isCurrentSessionRun(sessionUid: string, sessionRunToken: number): boolean {
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        return sessionUid.length > 0
            && currentUid.length > 0
            && this.activeSessionUid === sessionUid
            && currentUid === sessionUid
            && this.sessionRunToken === sessionRunToken;
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
