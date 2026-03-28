import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ChatConversationDetail, ChatConversationSummary, ChatMessage, ChatParticipant } from 'src/app/interfaces/chat';
import { FriendItem } from 'src/app/interfaces/social';
import {
    FloatingWindowPlacementMinimized,
    FloatingWindowPlacementRestored,
} from 'src/app/interfaces/user-settings';
import { AppToastService } from 'src/app/services/app-toast.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { SocialApiService } from 'src/app/services/social-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';
import { UserService } from 'src/app/services/user.service';

@Component({
    selector: 'app-chat-floating-conversation-window',
    templateUrl: './chat-floating-conversation-window.component.html',
    styleUrls: ['./chat-floating-conversation-window.component.sass'],
    standalone: false,
})
export class ChatFloatingConversationWindowComponent implements OnInit, OnDestroy {
    @Input() conversationId = 0;
    @Input() mode: 'window' | 'bubble' | 'maximized' = 'window';
    @Input() restoredPlacement: FloatingWindowPlacementRestored | null = null;
    @Input() bubblePlacement: FloatingWindowPlacementMinimized | null = null;
    @Input() zIndex: number | null = null;
    @Output() closeRequested = new EventEmitter<void>();
    @Output() focusRequested = new EventEmitter<void>();
    @Output() stateChange = new EventEmitter<{
        mode: 'window' | 'bubble' | 'maximized';
        restoredPlacement: FloatingWindowPlacementRestored | null;
        bubblePlacement: FloatingWindowPlacementMinimized | null;
    }>();

    summary: ChatConversationSummary | null = null;
    detail: ChatConversationDetail | null = null;
    messages: ChatMessage[] = [];
    friends: FriendItem[] = [];
    loading = false;
    errorMessage = '';
    canLoadMoreMessages = false;
    sendDraft = '';
    sendingMessage = false;
    groupRenameDraft = '';
    groupRenameSaving = false;
    groupParticipantQuery = '';
    groupParticipantSavingUid = '';
    groupParticipantRemovingUid = '';

    private readonly destroy$ = new Subject<void>();
    private readonly readReceiptAckByConversation = new Map<number, number>();
    private readonly readReceiptInFlightByConversation = new Map<number, number>();
    private friendsWatchStop: (() => void) | null = null;
    private loadedConversationId = 0;

    constructor(
        private userSvc: UserService,
        private socialApiSvc: SocialApiService,
        private chatApiSvc: ChatApiService,
        private chatRealtimeSvc: ChatRealtimeService,
        private chatFloatingSvc: ChatFloatingService,
        private userProfileNavSvc: UserProfileNavigationService,
        private appToastSvc: AppToastService,
    ) { }

    ngOnInit(): void {
        this.chatRealtimeSvc.conversations$
            .pipe(takeUntil(this.destroy$))
            .subscribe((items) => {
                const nextSummary = items.find((item) => item.conversationId === this.conversationId) ?? null;
                if (nextSummary) {
                    this.summary = nextSummary;
                    if (this.detail?.conversationId === nextSummary.conversationId)
                        this.detail = { ...this.detail, ...nextSummary };
                    if (!this.groupRenameSaving)
                        this.groupRenameDraft = `${nextSummary.title ?? ''}`.trim();
                }
            });

        this.chatRealtimeSvc.messageCreated$
            .pipe(takeUntil(this.destroy$))
            .subscribe((message) => {
                if (message.conversationId !== this.conversationId)
                    return;
                if (this.messages.some((item) => item.messageId === message.messageId))
                    return;
                this.messages = [...this.messages, message];
                void this.markConversationAsRead();
            });

        this.chatRealtimeSvc.messageRead$
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload) => {
                if (`${payload?.uid ?? ''}`.trim() !== this.userSvc.CurrentUserUid)
                    return;
                const conversationId = this.toPositiveInt(payload?.conversationId);
                const lastReadMessageId = this.toPositiveInt(payload?.lastReadMessageId);
                if (!conversationId || !lastReadMessageId)
                    return;
                this.rememberReadReceiptAck(conversationId, lastReadMessageId);
            });

        void this.loadFriends();
        this.startFriendsWatch();
        void this.loadConversation();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['conversationId'] && !changes['conversationId'].firstChange) {
            this.loadedConversationId = 0;
            void this.loadConversation();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.stopFriendsWatch();
    }

    get title(): string {
        const conversation = this.detail ?? this.summary;
        const title = `${conversation?.title ?? ''}`.trim();
        if (title.length > 0)
            return title;
        if (conversation?.isSystemConversation)
            return 'Yosiftware';
        if (conversation?.type === 'campaign')
            return 'Chat de campaña';
        if (conversation?.type === 'group')
            return 'Grupo';
        return `Chat ${this.conversationId}`;
    }

    get bubbleImageUrl(): string {
        const conversation = this.detail ?? this.summary;
        if (conversation?.isSystemConversation)
            return '';
        const photo = `${conversation?.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        if (conversation?.type === 'direct')
            return resolveDefaultProfileAvatar(conversation?.counterpartUid ?? conversation?.title ?? this.conversationId);
        return '';
    }

    get bubbleIcon(): string {
        const conversation = this.detail ?? this.summary;
        if (conversation?.isSystemConversation)
            return 'campaign';
        if (conversation?.type === 'campaign')
            return 'diversity_3';
        if (conversation?.type === 'group')
            return 'groups_2';
        return 'person';
    }

    get bubbleLabel(): string {
        return `Abrir ${this.title}`;
    }

    get activeParticipants(): ChatParticipant[] {
        return this.detail?.participants ?? [];
    }

    get canManageActiveGroup(): boolean {
        return this.summary?.type === 'group' && this.summary?.participantRole === 'admin';
    }

    get visibleGroupAddCandidates(): FriendItem[] {
        if (!this.canManageActiveGroup)
            return [];
        const query = `${this.groupParticipantQuery ?? ''}`.trim().toLowerCase();
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        const participantUids = new Set(this.activeParticipants.map((item) => `${item.uid ?? ''}`.trim()).filter((item) => item.length > 0));
        return this.friends.filter((item) => {
            const uid = `${item?.uid ?? ''}`.trim();
            if (uid.length < 1 || uid === currentUid || participantUids.has(uid))
                return false;
            if (query.length < 1)
                return true;
            const label = `${item.displayName ?? ''}`.trim().toLowerCase();
            return label.includes(query) || uid.toLowerCase().includes(query);
        });
    }

    get removableGroupParticipants(): ChatParticipant[] {
        if (!this.canManageActiveGroup)
            return [];
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        return this.activeParticipants.filter((item) => {
            const uid = `${item?.uid ?? ''}`.trim();
            return uid.length > 0
                && uid !== currentUid
                && item.isSystemUser !== true
                && item.participantStatus === 'active';
        });
    }

    onWindowModeChange(mode: 'window' | 'minimized' | 'maximized'): void {
        this.mode = mode === 'minimized' ? 'bubble' : mode;
        this.emitState();
    }

    onRestoredPlacementChange(placement: FloatingWindowPlacementRestored | null): void {
        this.restoredPlacement = placement ? { ...placement } : null;
        this.emitState();
    }

    onBubblePlacementChange(placement: FloatingWindowPlacementMinimized | null): void {
        this.bubblePlacement = placement ? { ...placement } : null;
        this.emitState();
    }

    onFocusRequested(): void {
        this.focusRequested.emit();
        void this.markConversationAsRead();
    }

    async loadPreviousMessages(): Promise<void> {
        const oldestMessageId = this.messages[0]?.messageId ?? 0;
        if (this.conversationId <= 0 || oldestMessageId <= 0)
            return;

        this.loading = true;
        try {
            const previous = await this.chatApiSvc.listMessages(this.conversationId, oldestMessageId, 25);
            this.messages = [...previous, ...this.messages];
            this.canLoadMoreMessages = previous.length >= 25;
        } catch (error: any) {
            this.errorMessage = `${error?.message ?? 'No se pudo cargar más historial.'}`.trim();
        } finally {
            this.loading = false;
        }
    }

    async sendMessage(): Promise<void> {
        const conversation = this.summary;
        const body = `${this.sendDraft ?? ''}`.trim();
        if (!conversation || !conversation.canSend || body.length < 1 || this.sendingMessage)
            return;

        this.sendingMessage = true;
        this.errorMessage = '';
        try {
            const envelope = await this.chatApiSvc.sendMessage(conversation.conversationId, body);
            if (!this.messages.some((item) => item.messageId === envelope.message.messageId))
                this.messages = [...this.messages, envelope.message];
            this.summary = envelope.conversation;
            if (this.detail)
                this.detail = { ...this.detail, ...envelope.conversation };
            this.chatRealtimeSvc.upsertConversation(envelope.conversation);
            this.sendDraft = '';
            await this.markConversationAsRead();
        } catch (error: any) {
            this.errorMessage = `${error?.message ?? 'No se pudo enviar el mensaje.'}`.trim();
        } finally {
            this.sendingMessage = false;
        }
    }

    async saveActiveGroupName(): Promise<void> {
        if (!this.canManageActiveGroup || this.conversationId <= 0 || this.groupRenameSaving)
            return;

        this.groupRenameSaving = true;
        try {
            const detail = await this.chatApiSvc.renameGroup(this.conversationId, this.groupRenameDraft);
            this.applyConversationMutation(detail);
            this.appToastSvc.showSuccess('Grupo actualizado.');
        } catch (error: any) {
            await this.reloadConversationDetail();
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo renombrar el grupo.'}`.trim());
        } finally {
            this.groupRenameSaving = false;
        }
    }

    async addFriendToActiveGroup(friend: FriendItem): Promise<void> {
        const uid = `${friend?.uid ?? ''}`.trim();
        if (!this.canManageActiveGroup || this.conversationId <= 0 || uid.length < 1 || this.groupParticipantSavingUid.length > 0)
            return;

        this.groupParticipantSavingUid = uid;
        try {
            const detail = await this.chatApiSvc.addGroupParticipant(this.conversationId, uid);
            this.applyConversationMutation(detail);
            this.groupParticipantQuery = '';
            this.appToastSvc.showSuccess('Participante añadido al grupo.');
        } catch (error: any) {
            await this.reloadConversationDetail();
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo añadir al participante.'}`.trim());
        } finally {
            this.groupParticipantSavingUid = '';
        }
    }

    async removeParticipantFromActiveGroup(participant: ChatParticipant): Promise<void> {
        const uid = `${participant?.uid ?? ''}`.trim();
        if (!this.canManageActiveGroup || this.conversationId <= 0 || uid.length < 1 || this.groupParticipantRemovingUid.length > 0)
            return;

        this.groupParticipantRemovingUid = uid;
        try {
            const detail = await this.chatApiSvc.removeGroupParticipant(this.conversationId, uid);
            this.applyConversationMutation(detail);
            this.appToastSvc.showSuccess('Participante retirado del grupo.');
        } catch (error: any) {
            await this.reloadConversationDetail();
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo retirar al participante.'}`.trim());
        } finally {
            this.groupParticipantRemovingUid = '';
        }
    }

    isOwnMessage(message: ChatMessage): boolean {
        return `${message?.sender?.uid ?? ''}`.trim() === this.userSvc.CurrentUserUid;
    }

    getParticipantLabel(participant: ChatParticipant | null | undefined): string {
        if (!participant)
            return 'Participante';
        if (participant.isSystemUser === true || `${participant.uid ?? ''}`.trim() === 'system:yosiftware')
            return 'Yosiftware';
        const displayName = `${participant.displayName ?? ''}`.trim();
        return displayName.length > 0 ? displayName : 'Participante';
    }

    getParticipantAvatarUrl(participant: ChatParticipant | null | undefined): string {
        if (participant?.isSystemUser === true || `${participant?.uid ?? ''}`.trim() === 'system:yosiftware')
            return '';
        const photo = `${participant?.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(participant?.uid ?? participant?.displayName ?? '');
    }

    getMessageSenderLabel(message: ChatMessage | null | undefined): string {
        if (!message)
            return 'Usuario';
        if (message.sender.isSystemUser === true || `${message.sender.uid ?? ''}`.trim() === 'system:yosiftware')
            return 'Yosiftware';
        const displayName = `${message.sender.displayName ?? ''}`.trim();
        return displayName.length > 0 ? displayName : 'Usuario';
    }

    getMessageSenderAvatarUrl(message: ChatMessage | null | undefined): string {
        if (message?.sender?.isSystemUser === true || `${message?.sender?.uid ?? ''}`.trim() === 'system:yosiftware')
            return '';
        const photo = `${message?.sender?.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(message?.sender?.uid ?? message?.sender?.displayName ?? '');
    }

    canLinkParticipant(participant: ChatParticipant | null | undefined): boolean {
        const uid = `${participant?.uid ?? ''}`.trim();
        return uid.length > 0 && participant?.isSystemUser !== true && uid !== 'system:yosiftware';
    }

    canLinkMessageSender(message: ChatMessage | null | undefined): boolean {
        const uid = `${message?.sender?.uid ?? ''}`.trim();
        return uid.length > 0 && message?.sender?.isSystemUser !== true && uid !== 'system:yosiftware';
    }

    openParticipantProfile(participant: ChatParticipant): void {
        this.openUserPublicProfile(participant.uid, this.getParticipantLabel(participant));
    }

    openMessageSenderProfile(message: ChatMessage): void {
        this.openUserPublicProfile(message.sender.uid, this.getMessageSenderLabel(message));
    }

    hasMessageAction(message: ChatMessage | null | undefined): boolean {
        return this.getMessageActionLabel(message).length > 0;
    }

    getMessageActionLabel(message: ChatMessage | null | undefined): string {
        const notification = message?.notification;
        if (!notification)
            return '';

        const campaignId = this.extractNotificationCampaignId(notification);
        if (campaignId > 0 && (notification.code === 'system.campaign_invitation_received' || notification.code === 'system.campaign_invitation_resolved'))
            return 'Abrir campaña';

        if (notification.code === 'system.role_request_resolved')
            return 'Abrir perfil';
        if (notification.code === 'system.role_request_created' || notification.action?.target === 'admin.role_requests')
            return 'Abrir solicitudes';

        const profileUid = this.extractNotificationProfileUid(notification);
        if (profileUid.length > 0)
            return 'Ver perfil';

        const actionConversationId = this.toPositiveInt(notification.action?.conversationId);
        if (notification.action?.target === 'social.messages' && actionConversationId && actionConversationId !== this.summary?.conversationId)
            return 'Abrir conversación';

        return '';
    }

    runMessageAction(message: ChatMessage): void {
        const notification = message?.notification;
        if (!notification)
            return;

        const campaignId = this.extractNotificationCampaignId(notification);
        if (campaignId > 0 && (notification.code === 'system.campaign_invitation_received' || notification.code === 'system.campaign_invitation_resolved')) {
            this.userProfileNavSvc.openSocial({
                section: 'campanas',
                campaignId,
                requestId: Date.now(),
            });
            return;
        }

        if (notification.code === 'system.role_request_resolved') {
            this.userProfileNavSvc.openPrivateProfile({
                section: 'resumen',
                requestId: Date.now(),
            });
            return;
        }
        if (notification.code === 'system.role_request_created' || notification.action?.target === 'admin.role_requests') {
            this.userProfileNavSvc.openAdminPanel({
                section: 'role-requests',
                pendingOnly: true,
                requestId: Date.now(),
            });
            return;
        }

        const profileUid = this.extractNotificationProfileUid(notification);
        if (profileUid.length > 0) {
            this.openUserPublicProfile(profileUid);
            return;
        }

        const actionConversationId = this.toPositiveInt(notification.action?.conversationId);
        if (notification.action?.target === 'social.messages' && actionConversationId)
            this.chatFloatingSvc.openConversation(actionConversationId);
    }

    trackByMessageId(_: number, item: ChatMessage): number {
        return item.messageId;
    }

    trackByParticipantUid(_: number, item: ChatParticipant): string {
        return item.uid;
    }

    trackByFriendUid(_: number, item: FriendItem): string {
        return item.uid;
    }

    private emitState(): void {
        this.stateChange.emit({
            mode: this.mode,
            restoredPlacement: this.restoredPlacement ? { ...this.restoredPlacement } : null,
            bubblePlacement: this.bubblePlacement ? { ...this.bubblePlacement } : null,
        });
    }

    private async loadConversation(): Promise<void> {
        if (this.conversationId <= 0 || this.loadedConversationId === this.conversationId)
            return;

        this.loadedConversationId = this.conversationId;
        this.loading = true;
        this.errorMessage = '';
        this.messages = [];
        this.canLoadMoreMessages = false;
        this.chatRealtimeSvc.setActiveConversationId(this.conversationId);

        try {
            const [messages, detail] = await Promise.all([
                this.chatApiSvc.listMessages(this.conversationId, null, 25),
                this.chatApiSvc.getConversationDetail(this.conversationId),
            ]);

            if (this.conversationId !== this.loadedConversationId)
                return;

            this.messages = messages;
            this.canLoadMoreMessages = messages.length >= 25;
            this.detail = detail;
            this.summary = detail;
            this.groupRenameDraft = `${detail.title ?? ''}`.trim();
            await this.markConversationAsRead();
        } catch (error: any) {
            this.errorMessage = `${error?.message ?? 'No se pudo cargar la conversación.'}`.trim();
        } finally {
            this.loading = false;
        }
    }

    private async reloadConversationDetail(): Promise<void> {
        if (this.conversationId <= 0)
            return;
        try {
            const detail = await this.chatApiSvc.getConversationDetail(this.conversationId);
            this.applyConversationMutation(detail);
        } catch {
            // best effort
        }
    }

    private applyConversationMutation(detail: ChatConversationDetail): void {
        this.detail = detail;
        this.summary = detail;
        this.groupRenameDraft = `${detail.title ?? ''}`.trim();
        this.chatRealtimeSvc.upsertConversation(detail);
    }

    private async loadFriends(): Promise<void> {
        try {
            const result = await this.socialApiSvc.listFriends();
            this.friends = result.items ?? [];
        } catch {
            this.friends = [];
        }
    }

    private startFriendsWatch(): void {
        if (this.friendsWatchStop)
            return;
        this.friendsWatchStop = this.socialApiSvc.watchFriends(
            (result) => this.friends = result.items,
            () => void this.loadFriends()
        );
    }

    private stopFriendsWatch(): void {
        this.friendsWatchStop?.();
        this.friendsWatchStop = null;
    }

    private async markConversationAsRead(): Promise<void> {
        const conversation = this.summary;
        const lastMessage = this.messages[this.messages.length - 1];
        if (!conversation || !lastMessage)
            return;

        const conversationId = this.toPositiveInt(conversation.conversationId);
        const lastMessageId = this.toPositiveInt(lastMessage.messageId);
        if (!conversationId || !lastMessageId)
            return;
        if (!this.chatRealtimeSvc.isConversationFocused(conversationId))
            return;
        if (!this.shouldSendReadReceipt(conversationId, lastMessageId))
            return;

        this.readReceiptInFlightByConversation.set(conversationId, lastMessageId);
        try {
            await this.chatApiSvc.markAsRead(conversationId, lastMessageId);
            this.rememberReadReceiptAck(conversationId, lastMessageId);
            this.chatRealtimeSvc.markConversationReadLocally(conversationId);
        } catch {
            const pending = this.readReceiptInFlightByConversation.get(conversationId) ?? 0;
            if (pending <= lastMessageId)
                this.readReceiptInFlightByConversation.delete(conversationId);
        }
    }

    private shouldSendReadReceipt(conversationId: number, messageId: number): boolean {
        const ack = this.readReceiptAckByConversation.get(conversationId) ?? 0;
        const inFlight = this.readReceiptInFlightByConversation.get(conversationId) ?? 0;
        return messageId > ack && messageId > inFlight;
    }

    private rememberReadReceiptAck(conversationId: number, messageId: number): void {
        const currentAck = this.readReceiptAckByConversation.get(conversationId) ?? 0;
        if (messageId > currentAck)
            this.readReceiptAckByConversation.set(conversationId, messageId);

        const pending = this.readReceiptInFlightByConversation.get(conversationId) ?? 0;
        if (pending <= messageId)
            this.readReceiptInFlightByConversation.delete(conversationId);
    }

    private extractNotificationCampaignId(notification: ChatMessage['notification'] | null | undefined): number {
        return this.toPositiveInt(
            notification?.context?.['campaignId']
            ?? notification?.context?.['idCampana']
            ?? notification?.context?.['campaign_id']
        ) ?? 0;
    }

    private extractNotificationProfileUid(notification: ChatMessage['notification'] | null | undefined): string {
        const raw = notification?.context?.['targetUid']
            ?? notification?.context?.['uid']
            ?? notification?.context?.['userUid']
            ?? notification?.context?.['fromUid']
            ?? notification?.context?.['requesterUid'];
        return `${raw ?? ''}`.trim();
    }

    private openUserPublicProfile(uid: string | null | undefined, initialDisplayName?: string | null): void {
        const normalizedUid = `${uid ?? ''}`.trim();
        if (normalizedUid.length < 1 || normalizedUid === 'system:yosiftware' || normalizedUid === `${this.userSvc.CurrentUserUid ?? ''}`.trim())
            return;
        this.userProfileNavSvc.openPublicProfile({
            uid: normalizedUid,
            initialDisplayName: `${initialDisplayName ?? ''}`.trim() || null,
        });
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
}
