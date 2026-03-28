import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
    ChatConversationFilter,
    ChatConversationSummary,
    ChatGroupCreateDraft,
} from 'src/app/interfaces/chat';
import { FriendItem, SocialUserBasic } from 'src/app/interfaces/social';
import {
    FloatingWindowPlacementMinimized,
    FloatingWindowPlacementRestored,
} from 'src/app/interfaces/user-settings';
import { AppToastService } from 'src/app/services/app-toast.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { SocialApiService } from 'src/app/services/social-api.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';
import { UserService } from 'src/app/services/user.service';

type ListComposerMode = 'none' | 'new-direct' | 'new-group';

@Component({
    selector: 'app-chat-floating-list-window',
    templateUrl: './chat-floating-list-window.component.html',
    styleUrls: ['./chat-floating-list-window.component.sass'],
    standalone: false,
})
export class ChatFloatingListWindowComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('conversationBody') private conversationBodyRef?: ElementRef<HTMLElement>;
    @Input() mode: 'window' | 'minimized' | 'maximized' = 'window';
    @Input() restoredPlacement: FloatingWindowPlacementRestored | null = null;
    @Input() minimizedPlacement: FloatingWindowPlacementMinimized | null = null;
    @Input() zIndex: number | null = null;
    @Output() closeRequested = new EventEmitter<void>();
    @Output() focusRequested = new EventEmitter<void>();
    @Output() stateChange = new EventEmitter<{
        mode: 'window' | 'minimized' | 'maximized';
        restoredPlacement: FloatingWindowPlacementRestored | null;
        minimizedPlacement: FloatingWindowPlacementMinimized | null;
    }>();

    isLoggedIn = false;
    actorAllowsNonFriendDM = false;
    conversations: ChatConversationSummary[] = [];
    conversationFilter: ChatConversationFilter = 'all';
    conversationNameQuery = '';
    composerMode: ListComposerMode = 'none';
    friends: FriendItem[] = [];
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
    hasConversationOverflow = false;

    private readonly destroy$ = new Subject<void>();
    private newDirectSearchTimer: number | null = null;
    private friendsWatchStop: (() => void) | null = null;
    private overflowMeasureFrame: number | null = null;

    readonly conversationFilters: { id: ChatConversationFilter; label: string; }[] = [
        { id: 'all', label: 'Todas' },
        { id: 'direct', label: 'Directos' },
        { id: 'campaign', label: 'Campañas' },
        { id: 'group', label: 'Grupos' },
        { id: 'system', label: 'Sistema' },
    ];

    constructor(
        private userSvc: UserService,
        private userSettingsSvc: UserSettingsService,
        private socialApiSvc: SocialApiService,
        private chatApiSvc: ChatApiService,
        private chatRealtimeSvc: ChatRealtimeService,
        private chatFloatingSvc: ChatFloatingService,
        private appToastSvc: AppToastService,
    ) { }

    ngOnInit(): void {
        this.userSvc.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe((loggedIn) => {
                this.isLoggedIn = loggedIn === true;
                if (this.isLoggedIn) {
                    void this.loadProfileSettings();
                    void this.loadFriends();
                    this.startFriendsWatch();
                    return;
                }
                this.stopFriendsWatch();
                this.friends = [];
                this.actorAllowsNonFriendDM = false;
                this.resetComposer();
            });

        this.chatRealtimeSvc.conversations$
            .pipe(takeUntil(this.destroy$))
            .subscribe((items) => {
                this.conversations = [...items];
                this.scheduleConversationOverflowSync();
            });
    }

    ngAfterViewInit(): void {
        this.scheduleConversationOverflowSync();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.stopFriendsWatch();
        if (this.newDirectSearchTimer !== null)
            window.clearTimeout(this.newDirectSearchTimer);
        if (this.overflowMeasureFrame !== null && typeof window !== 'undefined')
            window.cancelAnimationFrame(this.overflowMeasureFrame);
    }

    get filteredConversations(): ChatConversationSummary[] {
        return [...this.conversations]
            .sort((a, b) => this.toDateMs(b.lastMessageAtUtc) - this.toDateMs(a.lastMessageAtUtc))
            .filter((item) => this.isConversationVisibleInFilter(item, this.conversationFilter))
            .filter((item) => this.matchesConversationNameFilter(item, this.conversationNameQuery));
    }

    get shouldShowConversationSearch(): boolean {
        return this.hasConversationOverflow || this.conversationNameQuery.trim().length > 0;
    }

    get canOpenNewDirect(): boolean {
        return this.isLoggedIn;
    }

    get canOpenComposer(): boolean {
        return this.canOpenNewDirect || this.canCreateGroup;
    }

    get isComposerExpanded(): boolean {
        return this.composerMode !== 'none';
    }

    get shouldShowComposerModes(): boolean {
        return this.canOpenNewDirect && this.canCreateGroup;
    }

    get newChatSummary(): string {
        if (this.canOpenNewDirect && this.canCreateGroup)
            return 'Buscar un usuario o preparar un grupo';
        if (this.canOpenNewDirect)
            return 'Buscar un usuario y abrir un directo';
        if (this.canCreateGroup)
            return 'Crear un grupo con tus amistades activas';
        return 'No hay acciones de chat disponibles';
    }

    get canCreateGroup(): boolean {
        return this.isLoggedIn && this.friends.length > 0;
    }

    get newDirectSearchHasMinimumQuery(): boolean {
        return this.newDirectSearchQuery.trim().length >= 2;
    }

    get visibleNewDirectResults(): SocialUserBasic[] {
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        const friendUids = new Set(
            this.friends
                .map((item) => `${item?.uid ?? ''}`.trim())
                .filter((item) => item.length > 0)
        );
        const directCounterparts = new Set(
            this.conversations
                .filter((item) => item.type === 'direct' && item.isSystemConversation !== true)
                .map((item) => `${item.counterpartUid ?? ''}`.trim())
                .filter((item) => item.length > 0)
        );
        return this.newDirectResults.filter((item) => {
            const uid = `${item?.uid ?? ''}`.trim();
            if (uid.length < 1 || uid === currentUid)
                return false;
            if (directCounterparts.has(uid))
                return false;
            return friendUids.has(uid) || item.allowDirectMessagesFromNonFriends === true;
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

    get canSubmitNewGroup(): boolean {
        return `${this.newGroupDraft.title ?? ''}`.trim().length > 0
            && this.newGroupDraft.participantUids.length > 0
            && !this.newGroupSaving;
    }

    onWindowModeChange(mode: 'window' | 'minimized' | 'maximized'): void {
        this.mode = mode;
        this.scheduleConversationOverflowSync();
        this.emitState();
    }

    onRestoredPlacementChange(placement: FloatingWindowPlacementRestored | null): void {
        this.restoredPlacement = placement ? { ...placement } : null;
        this.emitState();
    }

    onMinimizedPlacementChange(placement: FloatingWindowPlacementMinimized | null): void {
        this.minimizedPlacement = placement ? { ...placement } : null;
        this.emitState();
    }

    selectConversationFilter(filter: ChatConversationFilter): void {
        this.conversationFilter = filter;
        this.scheduleConversationOverflowSync();
    }

    selectConversation(conversation: ChatConversationSummary): void {
        this.chatFloatingSvc.openConversation(conversation.conversationId);
    }

    openNewChatComposer(): void {
        if (!this.canOpenNewDirect && !this.canCreateGroup)
            return;
        if (this.canOpenNewDirect) {
            this.openNewDirectComposer();
            return;
        }
        this.openNewGroupComposer();
    }

    openNewDirectComposer(): void {
        if (!this.canOpenNewDirect)
            return;
        this.composerMode = 'new-direct';
        this.newDirectSearchQuery = '';
        this.newDirectSearchLoading = false;
        this.newDirectSearchErrorMessage = '';
        this.newDirectResults = [];
        this.scheduleConversationOverflowSync();
    }

    openNewGroupComposer(): void {
        if (!this.canCreateGroup)
            return;
        this.composerMode = 'new-group';
        this.newGroupDraft = {
            title: '',
            participantUids: [],
        };
        this.newGroupParticipantQuery = '';
        this.newGroupSaving = false;
        this.scheduleConversationOverflowSync();
    }

    cancelComposer(): void {
        this.resetComposer();
        this.scheduleConversationOverflowSync();
    }

    onConversationNameQueryChange(): void {
        this.scheduleConversationOverflowSync();
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        this.scheduleConversationOverflowSync();
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

    async openDirectFromSearch(user: SocialUserBasic): Promise<void> {
        const uid = `${user?.uid ?? ''}`.trim();
        if (uid.length < 1)
            return;

        try {
            const detail = await this.chatApiSvc.createOrOpenDirect(uid);
            this.chatRealtimeSvc.upsertConversation(detail);
            this.resetComposer();
            this.chatFloatingSvc.openConversation(detail.conversationId);
        } catch (error: any) {
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo abrir el chat directo.'}`.trim());
        }
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
            this.resetComposer();
            this.chatFloatingSvc.openConversation(detail.conversationId);
        } catch (error: any) {
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo crear el grupo.'}`.trim());
        } finally {
            this.newGroupSaving = false;
        }
    }

    trackByConversationId(_: number, item: ChatConversationSummary): number {
        return item.conversationId;
    }

    trackByUid(_: number, item: SocialUserBasic | FriendItem): string {
        return item.uid;
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

    getConversationAvatarUrl(conversation: ChatConversationSummary | null | undefined): string {
        const photo = `${conversation?.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(conversation?.counterpartUid ?? conversation?.title ?? '');
    }

    getUserLabel(user: SocialUserBasic | FriendItem | null | undefined): string {
        const displayName = `${user?.displayName ?? ''}`.trim();
        return displayName.length > 0 ? displayName : 'Usuario';
    }

    getUserAvatarUrl(user: SocialUserBasic | FriendItem | null | undefined): string {
        const photo = `${user?.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(user?.uid ?? user?.displayName ?? '');
    }

    private emitState(): void {
        this.stateChange.emit({
            mode: this.mode,
            restoredPlacement: this.restoredPlacement ? { ...this.restoredPlacement } : null,
            minimizedPlacement: this.minimizedPlacement ? { ...this.minimizedPlacement } : null,
        });
    }

    private async loadProfileSettings(): Promise<void> {
        try {
            const settings = await this.userSettingsSvc.loadProfileSettings();
            this.actorAllowsNonFriendDM = settings.allowDirectMessagesFromNonFriends === true;
        } catch {
            this.actorAllowsNonFriendDM = false;
        }
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

    private async runNewDirectSearch(query: string): Promise<void> {
        this.newDirectSearchLoading = true;
        this.newDirectSearchErrorMessage = '';
        try {
            this.newDirectResults = await this.socialApiSvc.searchUsers(query, 12);
        } catch (error: any) {
            this.newDirectResults = [];
            this.newDirectSearchErrorMessage = `${error?.message ?? 'No se pudo buscar usuarios.'}`.trim();
        } finally {
            this.newDirectSearchLoading = false;
        }
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

    private matchesConversationNameFilter(conversation: ChatConversationSummary | null | undefined, query: string | null | undefined): boolean {
        const normalizedQuery = `${query ?? ''}`.trim().toLowerCase();
        if (normalizedQuery.length < 1)
            return true;
        const label = this.getConversationLabel(conversation).toLowerCase();
        return label.includes(normalizedQuery);
    }

    private resetComposer(): void {
        this.composerMode = 'none';
        this.newDirectSearchQuery = '';
        this.newDirectSearchLoading = false;
        this.newDirectSearchErrorMessage = '';
        this.newDirectResults = [];
        this.newGroupDraft = {
            title: '',
            participantUids: [],
        };
        this.newGroupParticipantQuery = '';
        this.newGroupSaving = false;
    }

    private scheduleConversationOverflowSync(): void {
        if (typeof window === 'undefined')
            return;
        if (this.overflowMeasureFrame !== null)
            window.cancelAnimationFrame(this.overflowMeasureFrame);
        this.overflowMeasureFrame = window.requestAnimationFrame(() => {
            this.overflowMeasureFrame = null;
            this.syncConversationOverflow();
        });
    }

    private syncConversationOverflow(): void {
        const body = this.conversationBodyRef?.nativeElement;
        if (!body) {
            this.hasConversationOverflow = false;
            return;
        }

        this.hasConversationOverflow = body.scrollHeight > (body.clientHeight + 1);
    }

    private toDateMs(value: string | null | undefined): number {
        const parsed = new Date(`${value ?? ''}`);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }
}
