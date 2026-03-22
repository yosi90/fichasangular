import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ChatConversationDetail, ChatConversationFilter, ChatConversationSummary, ChatGroupCreateDraft, ChatMessage, ChatParticipant } from 'src/app/interfaces/chat';
import {
    BlockedUserItem,
    FriendItem,
    FriendRequestItem,
    SocialHubOpenRequest,
    SocialHubSectionId,
    SocialRelationshipState,
    SocialUserBasic,
} from 'src/app/interfaces/social';
import { AppToastService } from 'src/app/services/app-toast.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { SocialApiService } from 'src/app/services/social-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';
import { UserService } from 'src/app/services/user.service';

@Component({
    selector: 'app-social-hub',
    templateUrl: './social-hub.component.html',
    styleUrls: ['./social-hub.component.sass'],
    standalone: false
})
export class SocialHubComponent implements OnInit, OnChanges, OnDestroy {
    @Input() openRequest: SocialHubOpenRequest | null = null;

    currentSection: SocialHubSectionId = 'resumen';
    isLoggedIn = false;
    loading = false;
    searchQuery = '';
    searchLoading = false;
    searchErrorMessage = '';
    searchResults: SocialUserBasic[] = [];
    friendsFilterQuery = '';
    blocksFilterQuery = '';
    friends: FriendItem[] = [];
    receivedRequests: FriendRequestItem[] = [];
    sentRequests: FriendRequestItem[] = [];
    blocks: BlockedUserItem[] = [];
    conversations: ChatConversationSummary[] = [];
    unreadUserCount = 0;
    unreadSystemCount = 0;
    actorAllowsNonFriendDM = false;
    activeConversationSummary: ChatConversationSummary | null = null;
    activeConversationDetail: ChatConversationDetail | null = null;
    activeMessages: ChatMessage[] = [];
    activeConversationLoading = false;
    activeConversationError = '';
    canLoadMoreMessages = false;
    conversationFilter: ChatConversationFilter = 'all';
    messageComposerMode: 'conversation' | 'new-direct' | 'new-group' = 'conversation';
    newDirectSearchQuery = '';
    newDirectSearchLoading = false;
    newDirectSearchErrorMessage = '';
    newDirectResults: SocialUserBasic[] = [];
    newGroupDraft: ChatGroupCreateDraft = {
        title: '',
        participantUids: [],
    };
    newGroupParticipantQuery = '';
    newGroupSaving = false;
    groupRenameDraft = '';
    groupRenameSaving = false;
    groupParticipantQuery = '';
    groupParticipantSavingUid = '';
    groupParticipantRemovingUid = '';
    sendDraft = '';
    sendingMessage = false;
    actionInFlightKey = '';

    private readonly destroy$ = new Subject<void>();
    private searchTimer: number | null = null;
    private newDirectSearchTimer: number | null = null;
    private pendingConversationId: number | null = null;
    private friendsWatchStop: (() => void) | null = null;
    private receivedRequestsWatchStop: (() => void) | null = null;
    private sentRequestsWatchStop: (() => void) | null = null;
    private socialRealtimeActive = false;
    private readonly readReceiptAckByConversation = new Map<number, number>();
    private readonly readReceiptInFlightByConversation = new Map<number, number>();

    readonly sections: { id: SocialHubSectionId; label: string; icon: string; }[] = [
        { id: 'resumen', label: 'Resumen', icon: 'hub' },
        { id: 'amistades', label: 'Amistades', icon: 'group' },
        { id: 'bloqueos', label: 'Bloqueos', icon: 'block' },
        { id: 'mensajes', label: 'Mensajes', icon: 'chat' },
    ];
    readonly conversationFilters: { id: ChatConversationFilter; label: string; }[] = [
        { id: 'all', label: 'Todas' },
        { id: 'direct', label: 'Directos' },
        { id: 'campaign', label: 'Campañas' },
        { id: 'group', label: 'Grupos' },
        { id: 'system', label: 'Sistema' },
    ];

    constructor(
        private userSvc: UserService,
        private socialApiSvc: SocialApiService,
        private chatApiSvc: ChatApiService,
        private chatRealtimeSvc: ChatRealtimeService,
        private userProfileNavSvc: UserProfileNavigationService,
        private userSettingsSvc: UserSettingsService,
        private appToastSvc: AppToastService,
    ) { }

    ngOnInit(): void {
        this.userSvc.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe((loggedIn) => {
                this.isLoggedIn = loggedIn === true;
                if (this.isLoggedIn) {
                    void this.loadAuthenticatedState();
                    return;
                }
                this.resetAuthenticatedState();
            });

        this.chatRealtimeSvc.conversations$
            .pipe(takeUntil(this.destroy$))
            .subscribe((items) => {
                this.conversations = [...items];
                if (this.pendingConversationId)
                    void this.tryOpenPendingConversation();
                if (this.activeConversationSummary) {
                    const refreshed = this.conversations.find((item) => item.conversationId === this.activeConversationSummary?.conversationId) ?? null;
                    if (refreshed)
                        this.syncActiveConversationSummary(refreshed);
                    else if (this.messageComposerMode === 'conversation')
                        this.clearActiveConversationState();
                }
                this.syncActiveConversationWithFilter();
            });
        this.chatRealtimeSvc.unreadUserCount$
            .pipe(takeUntil(this.destroy$))
            .subscribe((count) => this.unreadUserCount = count);
        this.chatRealtimeSvc.unreadSystemCount$
            .pipe(takeUntil(this.destroy$))
            .subscribe((count) => this.unreadSystemCount = count);
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
        this.chatRealtimeSvc.messageCreated$
            .pipe(takeUntil(this.destroy$))
            .subscribe((message) => {
                if (message.conversationId !== this.activeConversationSummary?.conversationId)
                    return;
                if (this.activeMessages.some((item) => item.messageId === message.messageId))
                    return;
                this.activeMessages = [...this.activeMessages, message];
                void this.markActiveConversationAsRead();
            });

        this.applyOpenRequest(this.openRequest);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['openRequest'])
            this.applyOpenRequest(changes['openRequest'].currentValue ?? null);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.stopSocialSubscriptions();
        this.chatRealtimeSvc.setActiveConversationId(null);
        if (this.searchTimer !== null)
            window.clearTimeout(this.searchTimer);
        if (this.newDirectSearchTimer !== null)
            window.clearTimeout(this.newDirectSearchTimer);
    }

    get summaryCards(): { label: string; value: number; hint: string; }[] {
        return [
            { label: 'Amigos', value: this.friends.length, hint: 'Contactos activos' },
            { label: 'Solicitudes recibidas', value: this.receivedRequests.length, hint: 'Pendientes de revisar' },
            { label: 'Solicitudes enviadas', value: this.sentRequests.length, hint: 'Pendientes de respuesta' },
            { label: 'Bloqueados', value: this.blocks.length, hint: 'No pueden escribirte' },
            { label: 'No leídos', value: this.unreadUserCount, hint: 'Mensajes de usuarios' },
            { label: 'Sistema', value: this.unreadSystemCount, hint: 'Avisos de Yosiftware' },
        ];
    }

    get sortedConversations(): ChatConversationSummary[] {
        return [...this.conversations].sort((a, b) => this.toDateMs(b.lastMessageAtUtc) - this.toDateMs(a.lastMessageAtUtc));
    }

    get filteredConversations(): ChatConversationSummary[] {
        return this.sortedConversations.filter((item) => this.isConversationVisibleInFilter(item, this.conversationFilter));
    }

    get activeConversation(): ChatConversationSummary | null {
        return this.activeConversationSummary;
    }

    get canOpenNewDirect(): boolean {
        return this.isLoggedIn && this.actorAllowsNonFriendDM;
    }

    get canCreateGroup(): boolean {
        return this.isLoggedIn && this.friends.length > 0;
    }

    get searchHasMinimumQuery(): boolean {
        return this.searchQuery.trim().length >= 2;
    }

    get visibleSearchResults(): SocialUserBasic[] {
        return this.searchResults.filter((item) => this.isVisibleSocialUser(item));
    }

    get visibleFriends(): FriendItem[] {
        const query = this.normalizeComparableText(this.friendsFilterQuery);
        return this.friends.filter((item) => this.matchesSocialUserFilter(item, query));
    }

    get visibleBlocks(): BlockedUserItem[] {
        const query = this.normalizeComparableText(this.blocksFilterQuery);
        return this.blocks.filter((item) => this.matchesSocialUserFilter(item, query));
    }

    get newDirectSearchHasMinimumQuery(): boolean {
        return this.newDirectSearchQuery.trim().length >= 2;
    }

    get visibleNewDirectResults(): SocialUserBasic[] {
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        const blockedUids = new Set(this.blocks.map((item) => item.uid));
        const directCounterparts = new Set(
            this.conversations
                .filter((item) => item.type === 'direct' && !item.isSystemConversation)
                .map((item) => `${item.counterpartUid ?? ''}`.trim())
                .filter((item) => item.length > 0)
        );
        return this.newDirectResults.filter((item) => {
            const uid = `${item?.uid ?? ''}`.trim();
            if (uid.length < 1 || uid === currentUid)
                return false;
            if (blockedUids.has(uid))
                return false;
            if (directCounterparts.has(uid))
                return false;
            return item.allowDirectMessagesFromNonFriends === true;
        });
    }

    get visibleNewGroupFriends(): FriendItem[] {
        const query = `${this.newGroupParticipantQuery ?? ''}`.trim().toLowerCase();
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        return this.friends.filter((item) => {
            const uid = `${item?.uid ?? ''}`.trim();
            if (uid.length < 1 || uid === currentUid)
                return false;
            if (query.length < 1)
                return true;
            const label = `${item.displayName ?? ''}`.trim().toLowerCase();
            return label.includes(query) || uid.toLowerCase().includes(query);
        });
    }

    get activeParticipants(): ChatParticipant[] {
        return Array.isArray(this.activeConversationDetail?.participants) ? this.activeConversationDetail!.participants : [];
    }

    get canSubmitNewGroup(): boolean {
        return `${this.newGroupDraft.title ?? ''}`.trim().length > 0
            && this.newGroupDraft.participantUids.length > 0
            && !this.newGroupSaving;
    }

    get canManageActiveGroup(): boolean {
        return this.activeConversation?.type === 'group' && this.activeConversation?.participantRole === 'admin';
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

    selectSection(section: SocialHubSectionId): void {
        this.currentSection = section;
        if (section === 'mensajes' && this.isLoggedIn && this.conversations.length < 1)
            void this.chatRealtimeSvc.refreshConversations(true);
    }

    onSearchQueryChange(): void {
        if (this.searchTimer !== null)
            window.clearTimeout(this.searchTimer);

        const query = this.searchQuery.trim();
        if (query.length < 2) {
            this.searchLoading = false;
            this.searchErrorMessage = '';
            this.searchResults = [];
            return;
        }

        this.searchTimer = window.setTimeout(() => {
            void this.runSearch(query);
        }, 250);
    }

    onNewDirectQueryChange(): void {
        if (this.newDirectSearchTimer !== null)
            window.clearTimeout(this.newDirectSearchTimer);

        const query = this.newDirectSearchQuery.trim();
        if (query.length < 2) {
            this.newDirectSearchLoading = false;
            this.newDirectSearchErrorMessage = '';
            this.newDirectResults = [];
            return;
        }

        this.newDirectSearchTimer = window.setTimeout(() => {
            void this.runNewDirectSearch(query);
        }, 250);
    }

    async runSearch(query?: string): Promise<void> {
        const normalizedQuery = `${query ?? this.searchQuery ?? ''}`.trim();
        if (normalizedQuery.length < 2)
            return;

        this.searchLoading = true;
        this.searchErrorMessage = '';
        try {
            this.searchResults = (await this.socialApiSvc.searchUsers(normalizedQuery, 12))
                .filter((item) => this.isVisibleSocialUser(item));
        } catch (error: any) {
            this.searchResults = [];
            this.searchErrorMessage = `${error?.message ?? 'No se pudo buscar usuarios.'}`.trim();
        } finally {
            this.searchLoading = false;
        }
    }

    async runNewDirectSearch(query?: string): Promise<void> {
        const normalizedQuery = `${query ?? this.newDirectSearchQuery ?? ''}`.trim();
        if (normalizedQuery.length < 2 || !this.canOpenNewDirect)
            return;

        this.newDirectSearchLoading = true;
        this.newDirectSearchErrorMessage = '';
        try {
            this.newDirectResults = (await this.socialApiSvc.searchUsers(normalizedQuery, 12))
                .filter((item) => this.isVisibleSocialUser(item));
        } catch (error: any) {
            this.newDirectResults = [];
            this.newDirectSearchErrorMessage = `${error?.message ?? 'No se pudo buscar usuarios.'}`.trim();
        } finally {
            this.newDirectSearchLoading = false;
        }
    }

    viewPublicProfile(user: SocialUserBasic | FriendItem | BlockedUserItem | FriendRequestItem): void {
        const target = this.resolveUserFromAny(user);
        if (!target)
            return;
        this.openUserPublicProfile(target.uid, this.getUserLabel(target));
    }

    getRelationshipState(user: SocialUserBasic): SocialRelationshipState {
        const uid = `${user?.uid ?? ''}`.trim();
        if (uid.length < 1)
            return 'neutral';
        if (this.blocks.some((item) => item.uid === uid))
            return 'blocked';
        if (this.friends.some((item) => item.uid === uid))
            return 'friend';
        if (this.receivedRequests.some((item) => item.target.uid === uid && item.status === 'pending'))
            return 'received_request';
        if (this.sentRequests.some((item) => item.target.uid === uid && item.status === 'pending'))
            return 'sent_request';
        return 'neutral';
    }

    canStartConversation(user: SocialUserBasic): boolean {
        if (!this.isLoggedIn || !this.isVisibleSocialUser(user))
            return false;

        const relationship = this.getRelationshipState(user);
        if (relationship === 'blocked')
            return false;
        if (relationship === 'friend')
            return true;

        return user.allowDirectMessagesFromNonFriends === true;
    }

    async sendFriendRequest(user: SocialUserBasic): Promise<void> {
        if (!this.isVisibleSocialUser(user))
            return;
        await this.runAction(async () => {
            await this.socialApiSvc.sendFriendRequest(user.uid);
            await this.reloadSocialLists('requests');
            this.appToastSvc.showSuccess('Solicitud de amistad enviada.');
        });
    }

    async cancelFriendRequest(user: SocialUserBasic): Promise<void> {
        if (!this.isVisibleSocialUser(user))
            return;
        const request = this.sentRequests.find((item) => item.target.uid === user.uid);
        if (!request)
            return;
        await this.runAction(async () => {
            await this.socialApiSvc.resolveFriendRequest(request.requestId, 'cancel');
            await this.reloadSocialLists('requests');
            this.appToastSvc.showInfo('Solicitud cancelada.');
        });
    }

    async acceptFriendRequest(request: FriendRequestItem): Promise<void> {
        await this.runAction(async () => {
            await this.socialApiSvc.resolveFriendRequest(request.requestId, 'accept');
            await this.reloadSocialLists('all');
            this.appToastSvc.showSuccess('Solicitud aceptada.');
        });
    }

    async rejectFriendRequest(request: FriendRequestItem): Promise<void> {
        await this.runAction(async () => {
            await this.socialApiSvc.resolveFriendRequest(request.requestId, 'reject');
            await this.reloadSocialLists('requests');
            this.appToastSvc.showInfo('Solicitud rechazada.');
        });
    }

    async removeFriend(user: FriendItem | SocialUserBasic): Promise<void> {
        const target = this.resolveUserFromAny(user);
        if (!target || !this.isVisibleSocialUser(target))
            return;
        await this.runAction(async () => {
            await this.socialApiSvc.deleteFriend(target.uid);
            await this.reloadSocialLists('all');
            this.appToastSvc.showInfo('Amistad eliminada.');
        });
    }

    async blockUser(user: SocialUserBasic | FriendItem | FriendRequestItem): Promise<void> {
        const target = this.resolveUserFromAny(user);
        if (!target || !this.isVisibleSocialUser(target))
            return;
        await this.runAction(async () => {
            await this.socialApiSvc.blockUser(target.uid);
            await this.reloadSocialLists('all');
            this.appToastSvc.showSuccess('Usuario bloqueado.');
        });
    }

    async unblockUser(user: BlockedUserItem | SocialUserBasic): Promise<void> {
        const target = this.resolveUserFromAny(user);
        if (!target || !this.isVisibleSocialUser(target))
            return;
        await this.runAction(async () => {
            await this.socialApiSvc.unblockUser(target.uid);
            await this.reloadSocialLists('blocks');
            this.appToastSvc.showInfo('Usuario desbloqueado.');
        });
    }

    async openDirect(user: SocialUserBasic | FriendItem | FriendRequestItem): Promise<void> {
        const target = this.resolveUserFromAny(user);
        if (!target || !this.canStartConversation(target))
            return;
        await this.runAction(async () => {
            const detail = await this.chatApiSvc.createOrOpenDirect(target.uid);
            this.chatRealtimeSvc.upsertConversation(detail);
            this.currentSection = 'mensajes';
            this.messageComposerMode = 'conversation';
            await this.selectConversation(detail, detail);
        }, 'No se pudo abrir el chat directo. Revisa bloqueos o preferencias de mensajes.');
    }

    selectConversationFilter(filter: ChatConversationFilter): void {
        this.conversationFilter = filter;
        this.syncActiveConversationWithFilter();
    }

    async selectConversation(conversation: ChatConversationSummary, prefetchedDetail?: ChatConversationDetail | null): Promise<void> {
        const conversationId = conversation?.conversationId ?? 0;
        if (conversationId <= 0)
            return;

        this.ensureConversationVisibleInFilter(conversation);
        this.currentSection = 'mensajes';
        this.messageComposerMode = 'conversation';
        this.activeConversationLoading = true;
        this.activeConversationError = '';
        this.activeConversationSummary = conversation;
        this.activeConversationDetail = prefetchedDetail ?? null;
        this.activeMessages = [];
        this.canLoadMoreMessages = false;
        this.chatRealtimeSvc.setActiveConversationId(conversationId);

        try {
            const [messagesResult, detailResult] = await Promise.allSettled([
                this.chatApiSvc.listMessages(conversationId, null, 25),
                prefetchedDetail ? Promise.resolve(prefetchedDetail) : this.chatApiSvc.getConversationDetail(conversationId),
            ]);

            if (this.activeConversationSummary?.conversationId !== conversationId)
                return;

            if (messagesResult.status === 'fulfilled') {
                this.activeMessages = messagesResult.value;
                this.canLoadMoreMessages = messagesResult.value.length >= 25;
                await this.markActiveConversationAsRead();
            } else {
                this.activeMessages = [];
                this.canLoadMoreMessages = false;
                this.activeConversationError = `${messagesResult.reason?.message ?? 'No se pudo cargar la conversación.'}`.trim();
            }

            if (detailResult.status === 'fulfilled') {
                this.activeConversationDetail = detailResult.value;
                this.syncActiveConversationSummary(detailResult.value);
                this.hydrateConversationDrafts(detailResult.value);
            } else {
                this.activeConversationDetail = prefetchedDetail ?? null;
                if (prefetchedDetail)
                    this.hydrateConversationDrafts(prefetchedDetail);
            }
        } finally {
            if (this.activeConversationSummary?.conversationId === conversationId)
                this.activeConversationLoading = false;
        }
    }

    async loadPreviousMessages(): Promise<void> {
        const conversationId = this.activeConversation?.conversationId ?? 0;
        const oldestMessageId = this.activeMessages[0]?.messageId ?? 0;
        if (conversationId <= 0 || oldestMessageId <= 0)
            return;

        this.activeConversationLoading = true;
        try {
            const previous = await this.chatApiSvc.listMessages(conversationId, oldestMessageId, 25);
            this.activeMessages = [...previous, ...this.activeMessages];
            this.canLoadMoreMessages = previous.length >= 25;
        } catch (error: any) {
            this.activeConversationError = `${error?.message ?? 'No se pudo cargar más historial.'}`.trim();
        } finally {
            this.activeConversationLoading = false;
        }
    }

    async sendMessage(): Promise<void> {
        const conversation = this.activeConversation;
        const body = `${this.sendDraft ?? ''}`.trim();
        if (!conversation || !conversation.canSend || body.length < 1 || this.sendingMessage)
            return;

        this.sendingMessage = true;
        this.activeConversationError = '';
        try {
            const envelope = await this.chatApiSvc.sendMessage(conversation.conversationId, body);
            this.activeMessages = [...this.activeMessages, envelope.message];
            this.syncActiveConversationSummary(envelope.conversation);
            if (this.activeConversationDetail)
                this.activeConversationDetail = { ...this.activeConversationDetail, ...envelope.conversation };
            this.chatRealtimeSvc.upsertConversation(envelope.conversation);
            this.sendDraft = '';
            await this.markActiveConversationAsRead();
        } catch (error: any) {
            this.activeConversationError = `${error?.message ?? 'No se pudo enviar el mensaje.'}`.trim();
        } finally {
            this.sendingMessage = false;
        }
    }

    openNewDirectComposer(): void {
        if (!this.canOpenNewDirect)
            return;
        this.currentSection = 'mensajes';
        this.messageComposerMode = 'new-direct';
        this.resetConversationPaneState();
        this.newDirectSearchQuery = '';
        this.newDirectSearchLoading = false;
        this.newDirectSearchErrorMessage = '';
        this.newDirectResults = [];
    }

    async openDirectFromSearch(user: SocialUserBasic): Promise<void> {
        await this.openDirect(user);
    }

    openNewGroupComposer(): void {
        if (!this.canCreateGroup)
            return;
        this.currentSection = 'mensajes';
        this.messageComposerMode = 'new-group';
        this.resetConversationPaneState();
        this.resetNewGroupDraft();
    }

    toggleNewGroupParticipant(friend: FriendItem): void {
        const uid = `${friend?.uid ?? ''}`.trim();
        if (uid.length < 1)
            return;

        if (this.newGroupDraft.participantUids.includes(uid)) {
            this.newGroupDraft = {
                ...this.newGroupDraft,
                participantUids: this.newGroupDraft.participantUids.filter((item) => item !== uid),
            };
            return;
        }

        this.newGroupDraft = {
            ...this.newGroupDraft,
            participantUids: [...this.newGroupDraft.participantUids, uid],
        };
    }

    isNewGroupParticipantSelected(uid: string | null | undefined): boolean {
        const normalizedUid = `${uid ?? ''}`.trim();
        return normalizedUid.length > 0 && this.newGroupDraft.participantUids.includes(normalizedUid);
    }

    async createGroup(): Promise<void> {
        if (!this.canSubmitNewGroup)
            return;

        this.newGroupSaving = true;
        try {
            const detail = await this.chatApiSvc.createGroup(this.newGroupDraft.title, this.newGroupDraft.participantUids);
            this.chatRealtimeSvc.upsertConversation(detail);
            this.appToastSvc.showSuccess('Grupo creado correctamente.');
            this.resetNewGroupDraft();
            await this.selectConversation(detail, detail);
        } catch (error: any) {
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo crear el grupo.'}`.trim());
        } finally {
            this.newGroupSaving = false;
        }
    }

    async saveActiveGroupName(): Promise<void> {
        const conversationId = this.activeConversation?.conversationId ?? 0;
        if (!this.canManageActiveGroup || conversationId <= 0 || this.groupRenameSaving)
            return;

        this.groupRenameSaving = true;
        try {
            const detail = await this.chatApiSvc.renameGroup(conversationId, this.groupRenameDraft);
            this.applyConversationMutation(detail);
            this.appToastSvc.showSuccess('Grupo actualizado.');
        } catch (error: any) {
            await this.reloadActiveConversationDetail();
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo renombrar el grupo.'}`.trim());
        } finally {
            this.groupRenameSaving = false;
        }
    }

    async addFriendToActiveGroup(friend: FriendItem): Promise<void> {
        const conversationId = this.activeConversation?.conversationId ?? 0;
        const uid = `${friend?.uid ?? ''}`.trim();
        if (!this.canManageActiveGroup || conversationId <= 0 || uid.length < 1 || this.groupParticipantSavingUid.length > 0)
            return;

        this.groupParticipantSavingUid = uid;
        try {
            const detail = await this.chatApiSvc.addGroupParticipant(conversationId, uid);
            this.applyConversationMutation(detail);
            this.groupParticipantQuery = '';
            this.appToastSvc.showSuccess('Participante añadido al grupo.');
        } catch (error: any) {
            await this.reloadActiveConversationDetail();
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo añadir al participante.'}`.trim());
        } finally {
            this.groupParticipantSavingUid = '';
        }
    }

    async removeParticipantFromActiveGroup(participant: ChatParticipant): Promise<void> {
        const conversationId = this.activeConversation?.conversationId ?? 0;
        const uid = `${participant?.uid ?? ''}`.trim();
        if (!this.canManageActiveGroup || conversationId <= 0 || uid.length < 1 || this.groupParticipantRemovingUid.length > 0)
            return;

        this.groupParticipantRemovingUid = uid;
        try {
            const detail = await this.chatApiSvc.removeGroupParticipant(conversationId, uid);
            this.applyConversationMutation(detail);
            this.appToastSvc.showSuccess('Participante retirado del grupo.');
        } catch (error: any) {
            await this.reloadActiveConversationDetail();
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo retirar al participante.'}`.trim());
        } finally {
            this.groupParticipantRemovingUid = '';
        }
    }

    trackByUid(_: number, item: SocialUserBasic): string {
        return item.uid;
    }

    trackByParticipantUid(_: number, item: ChatParticipant): string {
        return item.uid;
    }

    trackByRequestId(_: number, item: FriendRequestItem): number {
        return item.requestId;
    }

    trackByConversationId(_: number, item: ChatConversationSummary): number {
        return item.conversationId;
    }

    trackByMessageId(_: number, item: ChatMessage): number {
        return item.messageId;
    }

    getUserLabel(user: SocialUserBasic | null | undefined): string {
        const displayName = `${user?.displayName ?? ''}`.trim();
        return displayName.length > 0 ? displayName : 'Usuario';
    }

    isOwnMessage(message: ChatMessage): boolean {
        return `${message?.sender?.uid ?? ''}`.trim() === this.userSvc.CurrentUserUid;
    }

    isConversationAvatarVisible(conversation: ChatConversationSummary | null | undefined): boolean {
        return conversation?.type === 'direct' && conversation?.isSystemConversation !== true;
    }

    isConversationTypeBadgeVisible(conversation: ChatConversationSummary | null | undefined): boolean {
        return !!conversation && (conversation.isSystemConversation || conversation.type === 'campaign' || conversation.type === 'group');
    }

    hasPhotoThumb(url: string | null | undefined): boolean {
        return `${url ?? ''}`.trim().length > 0;
    }

    getUserAvatarUrl(user: SocialUserBasic | FriendItem | BlockedUserItem | null | undefined): string {
        const photo = `${user?.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(user?.uid ?? user?.displayName ?? '');
    }

    getConversationAvatarUrl(conversation: ChatConversationSummary | null | undefined): string {
        const photo = `${conversation?.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(conversation?.counterpartUid ?? conversation?.title ?? '');
    }

    getConversationTypeIcon(conversation: ChatConversationSummary | null | undefined): string {
        if (conversation?.isSystemConversation)
            return 'campaign';
        if (conversation?.type === 'campaign')
            return 'diversity_3';
        if (conversation?.type === 'group')
            return 'groups_2';
        return 'person';
    }

    getConversationTypeLabel(conversation: ChatConversationSummary | null | undefined): string {
        if (conversation?.isSystemConversation)
            return 'Sistema';
        if (conversation?.type === 'campaign')
            return 'Campaña';
        if (conversation?.type === 'group')
            return 'Grupo';
        return 'Directo';
    }

    getParticipantAvatarUrl(participant: ChatParticipant | null | undefined): string {
        if (participant?.isSystemUser === true || `${participant?.uid ?? ''}`.trim() === 'system:yosiftware')
            return '';
        const photo = `${participant?.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(participant?.uid ?? participant?.displayName ?? '');
    }

    getMessageSenderAvatarUrl(message: ChatMessage | null | undefined): string {
        if (message?.sender?.isSystemUser === true || `${message?.sender?.uid ?? ''}`.trim() === 'system:yosiftware')
            return '';
        const photo = `${message?.sender?.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(message?.sender?.uid ?? message?.sender?.displayName ?? '');
    }

    getConversationLabel(conversation: ChatConversationSummary | null | undefined): string {
        const title = `${conversation?.title ?? ''}`.trim();
        if (title.length > 0)
            return title;
        if (conversation?.isSystemConversation)
            return 'Yosiftware';
        if (conversation?.type === 'campaign')
            return 'Chat de campaña';
        if (conversation?.type === 'group')
            return 'Grupo';
        return 'Conversación';
    }

    getConversationPreview(conversation: ChatConversationSummary | null | undefined): string {
        return `${conversation?.lastMessagePreview ?? ''}`.trim() || 'Sin mensajes aún';
    }

    getParticipantLabel(participant: ChatParticipant | null | undefined): string {
        if (!participant)
            return 'Participante';
        if (participant.isSystemUser === true || `${participant.uid ?? ''}`.trim() === 'system:yosiftware')
            return 'Yosiftware';
        const displayName = `${participant.displayName ?? ''}`.trim();
        return displayName.length > 0 ? displayName : 'Participante';
    }

    getMessageSenderLabel(message: ChatMessage | null | undefined): string {
        if (!message)
            return 'Usuario';
        if (message.sender.isSystemUser === true || `${message.sender.uid ?? ''}`.trim() === 'system:yosiftware')
            return 'Yosiftware';
        const displayName = `${message.sender.displayName ?? ''}`.trim();
        return displayName.length > 0 ? displayName : 'Usuario';
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

    getRelationshipLabel(state: SocialRelationshipState): string {
        if (state === 'friend')
            return 'Amistad activa';
        if (state === 'received_request')
            return 'Solicitud recibida';
        if (state === 'sent_request')
            return 'Solicitud enviada';
        if (state === 'blocked')
            return 'Bloqueado';
        return 'Neutral';
    }

    private async loadAuthenticatedState(): Promise<void> {
        this.loading = true;
        this.startSocialSubscriptions();
        try {
            await Promise.all([
                this.reloadSocialLists(this.socialRealtimeActive ? 'blocks' : 'all'),
                this.chatRealtimeSvc.refreshConversations(true),
                this.userSettingsSvc.loadProfileSettings()
                    .then((settings) => this.actorAllowsNonFriendDM = settings.allowDirectMessagesFromNonFriends === true)
                    .catch(() => this.actorAllowsNonFriendDM = false),
            ]);
            if (this.pendingConversationId)
                await this.tryOpenPendingConversation();
        } finally {
            this.loading = false;
        }
    }

    private resetAuthenticatedState(): void {
        this.stopSocialSubscriptions();
        this.readReceiptAckByConversation.clear();
        this.readReceiptInFlightByConversation.clear();
        this.friends = [];
        this.receivedRequests = [];
        this.sentRequests = [];
        this.blocks = [];
        this.actorAllowsNonFriendDM = false;
        this.conversationFilter = 'all';
        this.resetConversationPaneState();
        this.messageComposerMode = 'conversation';
        this.newDirectSearchQuery = '';
        this.newDirectSearchLoading = false;
        this.newDirectSearchErrorMessage = '';
        this.newDirectResults = [];
        this.resetNewGroupDraft();
        this.groupRenameDraft = '';
        this.groupParticipantQuery = '';
        this.groupParticipantSavingUid = '';
        this.groupParticipantRemovingUid = '';
        this.chatRealtimeSvc.setActiveConversationId(null);
        this.currentSection = 'resumen';
    }

    private async reloadSocialLists(scope: 'all' | 'requests' | 'blocks'): Promise<void> {
        if (!this.isLoggedIn)
            return;

        const tasks: Promise<any>[] = [];
        if (scope === 'all') {
            if (!this.socialRealtimeActive) {
                tasks.push(
                    this.socialApiSvc.listFriends().then((result) => this.friends = result.items),
                    this.socialApiSvc.listReceivedFriendRequests().then((result) => this.receivedRequests = result.items.filter((item) => item.status === 'pending')),
                    this.socialApiSvc.listSentFriendRequests().then((result) => this.sentRequests = result.items.filter((item) => item.status === 'pending')),
                );
            }
            tasks.push(this.socialApiSvc.listBlocks().then((items) => this.blocks = items));
        } else if (scope === 'requests') {
            if (!this.socialRealtimeActive) {
                tasks.push(
                    this.socialApiSvc.listReceivedFriendRequests().then((result) => this.receivedRequests = result.items.filter((item) => item.status === 'pending')),
                    this.socialApiSvc.listSentFriendRequests().then((result) => this.sentRequests = result.items.filter((item) => item.status === 'pending')),
                );
            }
        } else {
            tasks.push(this.socialApiSvc.listBlocks().then((items) => this.blocks = items));
        }
        await Promise.all(tasks);
    }

    private startSocialSubscriptions(): void {
        this.stopSocialSubscriptions();
        this.socialRealtimeActive = false;

        const friendsWatch = this.socialApiSvc.watchFriends(
            (result) => this.friends = result.items,
            () => void this.reloadSocialLists('all')
        );
        const receivedWatch = this.socialApiSvc.watchReceivedFriendRequests(
            (result) => this.receivedRequests = result.items.filter((item) => item.status === 'pending'),
            () => void this.reloadSocialLists('requests')
        );
        const sentWatch = this.socialApiSvc.watchSentFriendRequests(
            (result) => this.sentRequests = result.items.filter((item) => item.status === 'pending'),
            () => void this.reloadSocialLists('requests')
        );

        this.friendsWatchStop = friendsWatch;
        this.receivedRequestsWatchStop = receivedWatch;
        this.sentRequestsWatchStop = sentWatch;
        this.socialRealtimeActive = !!friendsWatch || !!receivedWatch || !!sentWatch;
    }

    private stopSocialSubscriptions(): void {
        this.friendsWatchStop?.();
        this.receivedRequestsWatchStop?.();
        this.sentRequestsWatchStop?.();
        this.friendsWatchStop = null;
        this.receivedRequestsWatchStop = null;
        this.sentRequestsWatchStop = null;
        this.socialRealtimeActive = false;
    }

    private async tryOpenPendingConversation(): Promise<void> {
        const conversationId = this.pendingConversationId;
        if (!conversationId)
            return;

        const target = this.conversations.find((item) => item.conversationId === conversationId) ?? null;
        if (!target)
            return;

        this.pendingConversationId = null;
        this.ensureConversationVisibleInFilter(target);
        await this.selectConversation(target);
    }

    private async markActiveConversationAsRead(): Promise<void> {
        const conversation = this.activeConversation;
        const lastMessage = this.activeMessages[this.activeMessages.length - 1];
        if (!conversation || !lastMessage)
            return;

        const conversationId = this.toPositiveInt(conversation.conversationId);
        const lastMessageId = this.toPositiveInt(lastMessage.messageId);
        if (!conversationId || !lastMessageId)
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

    private applyOpenRequest(request: SocialHubOpenRequest | null): void {
        if (!request)
            return;
        this.currentSection = request.section ?? 'resumen';
        this.pendingConversationId = this.toPositiveInt(request.conversationId);
        if (this.pendingConversationId && this.isLoggedIn)
            void this.tryOpenPendingConversation();
    }

    private resolveUserFromAny(user: SocialUserBasic | FriendItem | BlockedUserItem | FriendRequestItem | null | undefined): SocialUserBasic | null {
        if (!user)
            return null;
        if ((user as FriendRequestItem).target)
            return (user as FriendRequestItem).target;
        return user as SocialUserBasic;
    }

    private openUserPublicProfile(uid: string | null | undefined, initialDisplayName?: string | null): void {
        const normalizedUid = `${uid ?? ''}`.trim();
        if (normalizedUid.length < 1 || normalizedUid === 'system:yosiftware' || this.isCurrentUserUid(normalizedUid))
            return;
        this.userProfileNavSvc.openPublicProfile({
            uid: normalizedUid,
            initialDisplayName: `${initialDisplayName ?? ''}`.trim() || null,
        });
    }

    private syncActiveConversationSummary(conversation: ChatConversationSummary): void {
        this.activeConversationSummary = conversation;
        if (this.activeConversationDetail?.conversationId === conversation.conversationId)
            this.activeConversationDetail = { ...this.activeConversationDetail, ...conversation };
        this.hydrateConversationDrafts(this.activeConversationDetail ?? conversation);
    }

    private async runAction(handler: () => Promise<void>, fallbackMessage?: string): Promise<void> {
        if (this.actionInFlightKey)
            return;

        this.actionInFlightKey = 'pending';
        try {
            await handler();
        } catch (error: any) {
            const message = `${error?.message ?? fallbackMessage ?? 'No se pudo completar la acción.'}`.trim();
            this.appToastSvc.showError(message);
        } finally {
            this.actionInFlightKey = '';
        }
    }

    private toDateMs(value: string | null | undefined): number {
        const parsed = new Date(`${value ?? ''}`);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }

    private isConversationVisibleInFilter(conversation: ChatConversationSummary | null | undefined, filter: ChatConversationFilter): boolean {
        if (!conversation)
            return false;
        if (filter === 'all')
            return true;
        if (filter === 'system')
            return conversation.isSystemConversation === true;
        if (conversation.isSystemConversation)
            return false;
        return conversation.type === filter;
    }

    private ensureConversationVisibleInFilter(conversation: ChatConversationSummary | null | undefined): void {
        if (!conversation || this.isConversationVisibleInFilter(conversation, this.conversationFilter))
            return;
        this.conversationFilter = conversation.isSystemConversation
            ? 'system'
            : conversation.type;
    }

    private syncActiveConversationWithFilter(): void {
        if (this.messageComposerMode !== 'conversation' || !this.activeConversationSummary)
            return;
        if (!this.isConversationVisibleInFilter(this.activeConversationSummary, this.conversationFilter))
            this.clearActiveConversationState();
    }

    private resetConversationPaneState(): void {
        this.clearActiveConversationState();
        this.sendDraft = '';
    }

    private clearActiveConversationState(): void {
        this.activeConversationSummary = null;
        this.activeConversationDetail = null;
        this.activeMessages = [];
        this.activeConversationError = '';
        this.canLoadMoreMessages = false;
        this.sendDraft = '';
        this.groupRenameDraft = '';
        this.groupParticipantQuery = '';
        this.groupParticipantSavingUid = '';
        this.groupParticipantRemovingUid = '';
        this.chatRealtimeSvc.setActiveConversationId(null);
    }

    private resetNewGroupDraft(): void {
        this.newGroupDraft = {
            title: '',
            participantUids: [],
        };
        this.newGroupParticipantQuery = '';
        this.newGroupSaving = false;
    }

    private hydrateConversationDrafts(conversation: Pick<ChatConversationSummary, 'type' | 'title'> | null | undefined): void {
        if (conversation?.type === 'group')
            this.groupRenameDraft = `${conversation.title ?? ''}`.trim();
        else
            this.groupRenameDraft = '';
    }

    private applyConversationMutation(detail: ChatConversationDetail): void {
        this.activeConversationDetail = detail;
        this.syncActiveConversationSummary(detail);
        this.chatRealtimeSvc.upsertConversation(detail);
    }

    private async reloadActiveConversationDetail(): Promise<void> {
        const conversationId = this.activeConversation?.conversationId ?? 0;
        if (conversationId <= 0)
            return;
        try {
            const detail = await this.chatApiSvc.getConversationDetail(conversationId);
            if (this.activeConversation?.conversationId !== conversationId)
                return;
            this.applyConversationMutation(detail);
        } catch {
            // best effort
        }
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private matchesSocialUserFilter(user: SocialUserBasic | FriendItem | BlockedUserItem | null | undefined, query: string): boolean {
        if (!this.isVisibleSocialUser(user))
            return false;
        if (query.length < 1)
            return true;

        const label = this.normalizeComparableText(user?.displayName);
        const uid = this.normalizeComparableText(user?.uid);
        return label.includes(query) || uid.includes(query);
    }

    private isVisibleSocialUser(user: SocialUserBasic | FriendItem | BlockedUserItem | null | undefined): boolean {
        const uid = `${user?.uid ?? ''}`.trim();
        return uid.length > 0 && uid !== 'system:yosiftware' && !this.isCurrentUserUid(uid);
    }

    private isCurrentUserUid(uid: string | null | undefined): boolean {
        const normalizedUid = `${uid ?? ''}`.trim();
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        return normalizedUid.length > 0 && currentUid.length > 0 && normalizedUid === currentUid;
    }

    private normalizeComparableText(value: string | null | undefined): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }
}
