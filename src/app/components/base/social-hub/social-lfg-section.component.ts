import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
    SocialLfgApplication,
    SocialLfgApplicationStatus,
    SocialLfgPost,
    SocialLfgPostUpsertInput,
    SocialLfgStatus,
    SocialWebSocketEvent,
} from 'src/app/interfaces/social-v3';
import { SocialHubOpenRequest } from 'src/app/interfaces/social';
import { SocialRealtimeService } from 'src/app/services/social-realtime.service';
import { SocialV3ApiService } from 'src/app/services/social-v3-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';

@Component({
    selector: 'app-social-lfg-section',
    templateUrl: './social-lfg-section.component.html',
    styleUrls: ['./social-lfg-section.component.sass'],
    standalone: false,
})
export class SocialLfgSectionComponent implements OnInit, OnChanges, OnDestroy {
    @Input() isLoggedIn = false;
    @Input() openRequest: SocialHubOpenRequest | null = null;

    readonly statuses: { value: '' | SocialLfgStatus; label: string; }[] = [
        { value: '', label: 'Todos los estados' },
        { value: 'open', label: 'Abiertas' },
        { value: 'paused', label: 'Pausadas' },
        { value: 'closed', label: 'Cerradas' },
    ];
    readonly applicationStatuses: { value: '' | SocialLfgApplicationStatus; label: string; }[] = [
        { value: '', label: 'Todas' },
        { value: 'pending', label: 'Pendientes' },
        { value: 'accepted', label: 'Aceptadas' },
        { value: 'rejected', label: 'Rechazadas' },
        { value: 'withdrawn', label: 'Retiradas' },
    ];
    readonly editableStatuses: SocialLfgStatus[] = ['open', 'paused', 'closed'];

    posts: SocialLfgPost[] = [];
    selectedPost: SocialLfgPost | null = null;
    applications: SocialLfgApplication[] = [];
    statusFilter: '' | SocialLfgStatus = 'open';
    applicationStatusFilter: '' | SocialLfgApplicationStatus = '';
    applyMessage = '';
    loading = false;
    loadingMore = false;
    detailLoading = false;
    applicationsLoading = false;
    editorSaving = false;
    applySaving = false;
    contactSaving = false;
    errorMessage = '';
    applicationsErrorMessage = '';
    hasMore = false;
    editorMode: 'view' | 'create' | 'edit' = 'view';
    draft: SocialLfgPostUpsertInput = this.buildDefaultDraft();
    private readonly pageSize = 12;
    private readonly subscriptions = new Subscription();

    constructor(
        private socialV3ApiSvc: SocialV3ApiService,
        private socialRealtimeSvc: SocialRealtimeService,
        private userSvc: UserService,
        private userProfileNavSvc: UserProfileNavigationService,
    ) { }

    ngOnInit(): void {
        this.subscriptions.add(
            this.socialRealtimeSvc.events$.subscribe((event) => this.handleRealtimeEvent(event))
        );
        this.subscriptions.add(
            this.socialRealtimeSvc.refetchRequested$.subscribe(() => {
                if (this.isLoggedIn)
                    void this.reloadAfterReconnect();
            })
        );
    }

    ngOnChanges(): void {
        if (!this.isLoggedIn) {
            this.resetState();
            return;
        }

        if (!this.loading && this.posts.length < 1)
            void this.reloadPosts(true);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    get canEditSelectedPost(): boolean {
        return !!this.selectedPost && this.selectedPost.author.uid === this.userSvc.CurrentUserUid;
    }

    get canApplyToSelectedPost(): boolean {
        if (!this.selectedPost || this.selectedPost.author.uid === this.userSvc.CurrentUserUid)
            return false;
        if (this.selectedPost.status !== 'open')
            return false;
        return !this.ownApplication || this.ownApplication.status === 'withdrawn' || this.ownApplication.status === 'rejected';
    }

    get ownApplication(): SocialLfgApplication | null {
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        if (currentUid.length < 1)
            return null;
        return this.applications.find((item) => item.applicant.uid === currentUid) ?? null;
    }

    get visibleApplications(): SocialLfgApplication[] {
        if (!this.applicationStatusFilter)
            return this.applications;
        return this.applications.filter((item) => item.status === this.applicationStatusFilter);
    }

    get selectedPostAvatarUrl(): string {
        if (!this.selectedPost)
            return resolveDefaultProfileAvatar('social-lfg');
        const photo = `${this.selectedPost.author.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(this.selectedPost.author.uid || this.selectedPost.author.displayName || `${this.selectedPost.id}`);
    }

    async reloadPosts(reset: boolean): Promise<void> {
        if (!this.isLoggedIn)
            return;

        if (reset) {
            this.loading = true;
            this.errorMessage = '';
        } else {
            this.loadingMore = true;
        }

        try {
            const result = await this.socialV3ApiSvc.listLfgPosts({
                status: this.statusFilter || null,
                limit: this.pageSize,
                offset: reset ? 0 : this.posts.length,
            });
            this.posts = reset ? result.items : this.reconcilePosts([...this.posts, ...result.items]);
            this.hasMore = result.meta.hasMore;

            const preferredId = this.editorMode === 'create'
                ? null
                : this.selectedPost?.id
                    ?? (this.openRequest?.section === 'convocatorias' ? null : null);
            if (reset && this.posts.length > 0 && !this.selectedPost && this.editorMode === 'view')
                await this.selectPost(this.posts[0]);
            else if (preferredId)
                await this.refreshSelectedIfNeeded(preferredId);
        } catch (error: any) {
            this.errorMessage = `${error?.message ?? 'No se pudieron cargar las convocatorias.'}`.trim();
            if (reset)
                this.posts = [];
        } finally {
            this.loading = false;
            this.loadingMore = false;
        }
    }

    async selectPost(post: SocialLfgPost): Promise<void> {
        this.editorMode = 'view';
        this.detailLoading = true;
        this.applicationsErrorMessage = '';
        try {
            this.selectedPost = await this.socialV3ApiSvc.getLfgPost(post.id);
            await this.reloadApplications();
        } catch (error: any) {
            this.selectedPost = post;
            this.applications = [];
            this.applicationsErrorMessage = `${error?.message ?? 'No se pudo cargar el detalle de la convocatoria.'}`.trim();
        } finally {
            this.detailLoading = false;
        }
    }

    startCreatePost(): void {
        this.editorMode = 'create';
        this.selectedPost = null;
        this.applications = [];
        this.applyMessage = '';
        this.applicationsErrorMessage = '';
        this.draft = this.buildDefaultDraft();
    }

    startEditSelectedPost(): void {
        if (!this.selectedPost)
            return;

        this.editorMode = 'edit';
        this.draft = {
            title: this.selectedPost.title,
            summary: this.selectedPost.summary,
            gameSystem: this.selectedPost.gameSystem,
            campaignStyle: this.selectedPost.campaignStyle,
            slotsTotal: this.selectedPost.slotsTotal,
            scheduleText: this.selectedPost.scheduleText,
            language: this.selectedPost.language,
            visibility: 'global',
            status: this.selectedPost.status,
        };
    }

    cancelEditor(): void {
        this.editorMode = 'view';
        this.draft = this.buildDefaultDraft();
    }

    async saveDraft(): Promise<void> {
        this.editorSaving = true;
        this.errorMessage = '';
        try {
            const saved = this.editorMode === 'edit' && this.selectedPost
                ? await this.socialV3ApiSvc.updateLfgPost(this.selectedPost.id, this.draft)
                : await this.socialV3ApiSvc.createLfgPost(this.draft);
            this.editorMode = 'view';
            this.draft = this.buildDefaultDraft();
            await this.reloadPosts(true);
            await this.selectPost(saved);
        } catch (error: any) {
            this.errorMessage = `${error?.message ?? 'No se pudo guardar la convocatoria.'}`.trim();
        } finally {
            this.editorSaving = false;
        }
    }

    async reloadApplications(): Promise<void> {
        if (!this.selectedPost)
            return;

        this.applicationsLoading = true;
        this.applicationsErrorMessage = '';
        try {
            const result = await this.socialV3ApiSvc.listLfgApplications(this.selectedPost.id, {
                status: this.applicationStatusFilter || null,
                limit: 25,
                offset: 0,
            });
            this.applications = result.items;
        } catch (error: any) {
            this.applications = [];
            this.applicationsErrorMessage = `${error?.message ?? 'No se pudieron cargar las aplicaciones.'}`.trim();
        } finally {
            this.applicationsLoading = false;
        }
    }

    async applyToSelectedPost(): Promise<void> {
        if (!this.selectedPost || this.applyMessage.trim().length < 1 || !this.canApplyToSelectedPost)
            return;

        this.applySaving = true;
        this.applicationsErrorMessage = '';
        try {
            const application = await this.socialV3ApiSvc.createLfgApplication(this.selectedPost.id, this.applyMessage);
            this.applyMessage = '';
            this.applications = this.reconcileApplications([application, ...this.applications]);
            await this.reloadApplications();
        } catch (error: any) {
            this.applicationsErrorMessage = `${error?.message ?? 'No se pudo enviar la aplicación.'}`.trim();
        } finally {
            this.applySaving = false;
        }
    }

    async resolveApplication(application: SocialLfgApplication, status: SocialLfgApplicationStatus): Promise<void> {
        if (!this.selectedPost)
            return;

        const previous = [...this.applications];
        this.applications = this.applications.map((item) => item.applicationId === application.applicationId
            ? { ...item, status }
            : item);
        try {
            await this.socialV3ApiSvc.updateLfgApplication(this.selectedPost.id, application.applicationId, status);
            await this.refreshSelectedIfNeeded(this.selectedPost.id, true);
        } catch (error: any) {
            this.applications = previous;
            this.applicationsErrorMessage = `${error?.message ?? 'No se pudo actualizar la aplicación.'}`.trim();
        }
    }

    async openContactConversation(): Promise<void> {
        if (!this.selectedPost)
            return;

        this.contactSaving = true;
        this.applicationsErrorMessage = '';
        try {
            const response = await this.socialV3ApiSvc.openLfgContactConversation(this.selectedPost.id);
            this.userProfileNavSvc.openSocial({
                section: 'mensajes',
                conversationId: response.conversationId,
                requestId: Date.now(),
            });
        } catch (error: any) {
            this.applicationsErrorMessage = `${error?.message ?? 'No se pudo abrir la conversación.'}`.trim();
        } finally {
            this.contactSaving = false;
        }
    }

    openAuthorProfile(post: SocialLfgPost | null): void {
        const uid = `${post?.author?.uid ?? ''}`.trim();
        if (uid.length < 1)
            return;
        this.userProfileNavSvc.openPublicProfile({
            uid,
            initialDisplayName: post?.author?.displayName ?? null,
            mode: 'relationship',
        });
    }

    getStatusLabel(status: SocialLfgStatus | SocialLfgApplicationStatus): string {
        if (status === 'open')
            return 'Abierta';
        if (status === 'paused')
            return 'Pausada';
        if (status === 'closed')
            return 'Cerrada';
        if (status === 'accepted')
            return 'Aceptada';
        if (status === 'rejected')
            return 'Rechazada';
        if (status === 'withdrawn')
            return 'Retirada';
        return 'Pendiente';
    }

    trackByPostId(_: number, item: SocialLfgPost): number {
        return item.id;
    }

    trackByApplicationId(_: number, item: SocialLfgApplication): number {
        return item.applicationId;
    }

    getApplicantAvatar(application: SocialLfgApplication): string {
        const photo = `${application.applicant.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(application.applicant.uid || application.applicant.displayName || `${application.applicationId}`);
    }

    private async reloadAfterReconnect(): Promise<void> {
        await this.reloadPosts(true);
        if (this.selectedPost)
            await this.refreshSelectedIfNeeded(this.selectedPost.id, true);
    }

    private async refreshSelectedIfNeeded(postId: number, forceApplications: boolean = false): Promise<void> {
        const normalizedPostId = Math.trunc(Number(postId));
        if (!Number.isFinite(normalizedPostId) || normalizedPostId <= 0)
            return;

        const match = this.posts.find((item) => item.id === normalizedPostId) ?? this.selectedPost;
        if (!match)
            return;

        await this.selectPost(match);
        if (forceApplications)
            await this.reloadApplications();
    }

    private handleRealtimeEvent(event: SocialWebSocketEvent): void {
        if (!this.isLoggedIn)
            return;
        if (event.type !== 'lfg.post_created' && event.type !== 'lfg.post_updated' && event.type !== 'lfg.post_closed')
            return;

        this.posts = this.reconcilePosts(this.upsertPost(this.posts, event.payload));
        if (this.statusFilter && event.payload.status !== this.statusFilter)
            this.posts = this.posts.filter((item) => item.id !== event.payload.id);

        if (this.selectedPost?.id === event.payload.id && this.editorMode === 'view')
            this.selectedPost = event.payload;
    }

    private upsertPost(posts: SocialLfgPost[], payload: SocialLfgPost): SocialLfgPost[] {
        const next = [...posts];
        const index = next.findIndex((item) => item.id === payload.id);
        if (index >= 0)
            next[index] = payload;
        else if (!this.statusFilter || payload.status === this.statusFilter)
            next.unshift(payload);
        return next;
    }

    private reconcilePosts(posts: SocialLfgPost[]): SocialLfgPost[] {
        const seen = new Set<number>();
        return posts.filter((item) => {
            if (!item?.id || seen.has(item.id))
                return false;
            seen.add(item.id);
            return !this.statusFilter || item.status === this.statusFilter;
        });
    }

    private reconcileApplications(applications: SocialLfgApplication[]): SocialLfgApplication[] {
        const seen = new Set<number>();
        return applications.filter((item) => {
            if (!item?.applicationId || seen.has(item.applicationId))
                return false;
            seen.add(item.applicationId);
            return true;
        });
    }

    private buildDefaultDraft(): SocialLfgPostUpsertInput {
        return {
            title: '',
            summary: '',
            gameSystem: 'D&D 3.5',
            campaignStyle: '',
            slotsTotal: 4,
            scheduleText: '',
            language: 'es',
            visibility: 'global',
            status: 'open',
        };
    }

    private resetState(): void {
        this.posts = [];
        this.selectedPost = null;
        this.applications = [];
        this.statusFilter = 'open';
        this.applicationStatusFilter = '';
        this.applyMessage = '';
        this.loading = false;
        this.loadingMore = false;
        this.detailLoading = false;
        this.applicationsLoading = false;
        this.editorSaving = false;
        this.applySaving = false;
        this.contactSaving = false;
        this.errorMessage = '';
        this.applicationsErrorMessage = '';
        this.hasMore = false;
        this.editorMode = 'view';
        this.draft = this.buildDefaultDraft();
    }
}
