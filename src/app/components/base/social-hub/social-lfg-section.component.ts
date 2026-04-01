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
import { AppToastService } from 'src/app/services/app-toast.service';

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
    readonly weekdayOptions: { value: string; label: string; aliases: string[]; }[] = [
        { value: 'monday', label: 'Lunes', aliases: ['lunes'] },
        { value: 'tuesday', label: 'Martes', aliases: ['martes'] },
        { value: 'wednesday', label: 'Miércoles', aliases: ['miercoles', 'miércoles'] },
        { value: 'thursday', label: 'Jueves', aliases: ['jueves'] },
        { value: 'friday', label: 'Viernes', aliases: ['viernes'] },
        { value: 'saturday', label: 'Sábados', aliases: ['sabado', 'sábado', 'sabados', 'sábados'] },
        { value: 'sunday', label: 'Domingos', aliases: ['domingo', 'domingos'] },
    ];
    readonly campaignStyleOptions: string[] = [
        'Sandbox',
        'Dungeon crawl',
        'Intriga política',
        'Exploración',
        'Supervivencia',
        'Investigación',
        'Urbana',
        'West Marches',
        'Alta fantasía heroica',
        'Terror',
        'Aventura episódica',
    ];
    readonly languageOptions: string[] = [
        'Español',
        'Inglés',
        'Francés',
        'Alemán',
        'Italiano',
        'Portugués',
        'Catalán',
        'Euskera',
        'Gallego',
        'Japonés',
        'Otro',
    ];

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
    selectedScheduleDays: string[] = [];
    scheduleTimeMasked = '__:__';
    private readonly pageSize = 12;
    private readonly subscriptions = new Subscription();

    constructor(
        private socialV3ApiSvc: SocialV3ApiService,
        private socialRealtimeSvc: SocialRealtimeService,
        private userSvc: UserService,
        private userProfileNavSvc: UserProfileNavigationService,
        private appToastSvc: AppToastService,
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

    get canOpenContactConversation(): boolean {
        return !!this.selectedPost && !this.canEditSelectedPost;
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

    get applicationsSectionHelperText(): string {
        if (this.canEditSelectedPost)
            return 'Aquí puedes revisar y gestionar las solicitudes recibidas para esta convocatoria.';
        if (this.ownApplication)
            return 'Aquí puedes consultar el estado actual de tu solicitud.';
        return 'Aquí aparecerán las solicitudes relacionadas con esta convocatoria.';
    }

    get selectedPostAvatarUrl(): string {
        if (!this.selectedPost)
            return resolveDefaultProfileAvatar('social-lfg');
        const photo = `${this.selectedPost.author.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(this.selectedPost.author.uid || this.selectedPost.author.displayName || `${this.selectedPost.id}`);
    }

    get filteredCampaignStyleOptions(): string[] {
        return this.filterAutocompleteOptions(this.campaignStyleOptions, this.draft?.campaignStyle);
    }

    get filteredLanguageOptions(): string[] {
        return this.filterAutocompleteOptions(this.languageOptions, this.draft?.language);
    }

    get hasSelectedScheduleDays(): boolean {
        return this.selectedScheduleDays.length > 0;
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
        this.resetScheduleUi();
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
            language: this.expandKnownLanguageAlias(this.selectedPost.language),
            visibility: 'global',
            status: this.selectedPost.status,
        };
        this.hydrateScheduleUiFromText(this.selectedPost.scheduleText);
    }

    cancelEditor(): void {
        this.editorMode = 'view';
        this.draft = this.buildDefaultDraft();
        this.resetScheduleUi();
    }

    async saveDraft(): Promise<void> {
        this.normalizeDraftAutocompleteFields();
        this.syncScheduleTextFromUi();
        const validationError = this.validateDraft(this.draft);
        if (validationError.length > 0) {
            this.appToastSvc.showError(validationError);
            return;
        }

        const wasEditing = this.editorMode === 'edit';
        this.editorSaving = true;
        this.errorMessage = '';
        try {
            const saved = this.editorMode === 'edit' && this.selectedPost
                ? await this.socialV3ApiSvc.updateLfgPost(this.selectedPost.id, this.draft)
                : await this.socialV3ApiSvc.createLfgPost(this.draft);
            this.editorMode = 'view';
            this.draft = this.buildDefaultDraft();
            this.appToastSvc.showSuccess(
                wasEditing
                    ? 'Convocatoria actualizada.'
                    : 'Convocatoria creada.'
            );
            await this.reloadPosts(true);
            await this.selectPost(saved);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapLfgActionError(error, 'No se pudo guardar la convocatoria.'));
        } finally {
            this.editorSaving = false;
        }
    }

    toggleScheduleDay(dayValue: string): void {
        const normalizedDay = `${dayValue ?? ''}`.trim();
        if (normalizedDay.length < 1)
            return;

        if (this.isScheduleDaySelected(normalizedDay)) {
            this.selectedScheduleDays = this.selectedScheduleDays.filter((item) => item !== normalizedDay);
            return;
        }

        const allowedOrder = this.weekdayOptions.map((item) => item.value);
        this.selectedScheduleDays = [...this.selectedScheduleDays, normalizedDay]
            .filter((value, index, array) => array.indexOf(value) === index)
            .sort((left, right) => allowedOrder.indexOf(left) - allowedOrder.indexOf(right));
    }

    isScheduleDaySelected(dayValue: string): boolean {
        return this.selectedScheduleDays.includes(dayValue);
    }

    onScheduleTimeMaskedChange(value: string | null | undefined): void {
        const digits = `${value ?? ''}`.replace(/\D/g, '').slice(0, 4);
        this.scheduleTimeMasked = this.buildScheduleTimeMask(digits);
    }

    onScheduleTimeFocus(event: FocusEvent): void {
        const input = event.target as HTMLInputElement | null;
        if (!input)
            return;
        this.setScheduleCaret(input, this.findNextEditableScheduleIndex(0));
    }

    onScheduleTimeClick(event: MouseEvent): void {
        const input = event.target as HTMLInputElement | null;
        if (!input)
            return;

        const cursor = input.selectionStart ?? 0;
        if (cursor === 2)
            this.setScheduleCaret(input, 3);
    }

    onScheduleTimeKeydown(event: KeyboardEvent): void {
        const input = event.target as HTMLInputElement | null;
        if (!input)
            return;

        const key = `${event.key ?? ''}`;
        if (key === 'Tab')
            return;

        if (key === 'ArrowLeft') {
            event.preventDefault();
            const current = Math.max(0, input.selectionStart ?? 0);
            this.setScheduleCaret(input, this.findPreviousEditableScheduleIndex(current - 1));
            return;
        }

        if (key === 'ArrowRight') {
            event.preventDefault();
            const current = Math.max(0, input.selectionStart ?? 0);
            this.setScheduleCaret(input, this.findNextEditableScheduleIndex(current + 1));
            return;
        }

        if (key === 'Backspace') {
            event.preventDefault();
            this.removeScheduleDigit(input, true);
            return;
        }

        if (key === 'Delete') {
            event.preventDefault();
            this.removeScheduleDigit(input, false);
            return;
        }

        if (!/^\d$/.test(key)) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        this.insertScheduleDigit(input, key);
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
            this.appToastSvc.showSuccess('Solicitud enviada.');
            await this.reloadApplications();
        } catch (error: any) {
            this.appToastSvc.showError(this.mapLfgActionError(error, 'No se pudo enviar la aplicación.'));
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
            this.appToastSvc.showSuccess('Solicitud actualizada.');
            await this.refreshSelectedIfNeeded(this.selectedPost.id, true);
        } catch (error: any) {
            this.applications = previous;
            this.appToastSvc.showError(this.mapLfgActionError(error, 'No se pudo actualizar la aplicación.'));
        }
    }

    async openContactConversation(): Promise<void> {
        if (!this.selectedPost || !this.canOpenContactConversation)
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
            this.appToastSvc.showError(this.mapLfgActionError(error, 'No se pudo abrir la conversación.'));
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
            language: 'Español',
            visibility: 'global',
            status: 'open',
        };
    }

    private validateDraft(draft: SocialLfgPostUpsertInput): string {
        if (!this.isMeaningfulText(draft?.title))
            return 'El título debe incluir texto real y no solo números.';
        if (!this.isMeaningfulText(draft?.summary))
            return 'El resumen debe incluir texto real y no solo números.';
        if (!this.isMeaningfulText(draft?.gameSystem))
            return 'El sistema debe incluir texto real y no solo números.';
        if (!this.isMeaningfulText(draft?.campaignStyle))
            return 'El estilo de campaña debe incluir texto real y no solo números.';
        if (this.selectedScheduleDays.length < 1)
            return 'Debes seleccionar al menos un día de la semana.';
        if (!this.isScheduleTextValid(draft?.scheduleText))
            return 'El horario debe incluir una hora válida en formato 00:00.';
        if (!this.isMeaningfulText(draft?.language))
            return 'El idioma debe incluir texto real y no solo números.';
        if (!Number.isInteger(Number(draft?.slotsTotal)) || Number(draft?.slotsTotal) <= 0)
            return 'Las plazas totales deben ser un número mayor que 0.';
        return '';
    }

    private isMeaningfulText(value: string | null | undefined): boolean {
        const normalized = `${value ?? ''}`.trim();
        if (normalized.length < 1)
            return false;
        return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(normalized);
    }

    private isScheduleTextValid(value: string | null | undefined): boolean {
        const normalized = `${value ?? ''}`.trim();
        if (normalized.length < 1)
            return false;
        return /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/.test(normalized);
    }

    private filterAutocompleteOptions(options: string[], query: string | null | undefined): string[] {
        const normalizedQuery = this.normalizeAutocompleteText(query);
        const exactValue = `${query ?? ''}`.trim();
        const filtered = options.filter((option) => {
            if (normalizedQuery.length < 1)
                return true;
            return this.normalizeAutocompleteText(option).includes(normalizedQuery);
        });

        if (exactValue.length > 0 && !filtered.some((option) => option.localeCompare(exactValue, 'es', { sensitivity: 'base' }) === 0))
            return [exactValue, ...filtered];
        return filtered;
    }

    private normalizeDraftAutocompleteFields(): void {
        this.draft = {
            ...this.draft,
            campaignStyle: `${this.draft?.campaignStyle ?? ''}`.trim(),
            language: this.expandKnownLanguageAlias(this.draft?.language),
        };
    }

    private syncScheduleTextFromUi(): void {
        const time = this.extractCompleteScheduleTime(this.scheduleTimeMasked);
        const selectedLabels = this.weekdayOptions
            .filter((item) => this.selectedScheduleDays.includes(item.value))
            .map((item) => item.label);

        if (selectedLabels.length < 1 || time.length < 1) {
            this.draft = {
                ...this.draft,
                scheduleText: '',
            };
            return;
        }

        this.draft = {
            ...this.draft,
            scheduleText: `${this.formatScheduleDaysLabel(selectedLabels)} a las ${time}`,
        };
    }

    private hydrateScheduleUiFromText(scheduleText: string | null | undefined): void {
        const normalizedText = `${scheduleText ?? ''}`.trim();
        if (normalizedText.length < 1) {
            this.resetScheduleUi();
            return;
        }

        const normalizedSearch = this.normalizeAutocompleteText(normalizedText);
        this.selectedScheduleDays = this.weekdayOptions
            .filter((item) => item.aliases.some((alias) => normalizedSearch.includes(alias)))
            .map((item) => item.value);

        const timeMatch = normalizedText.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/);
        const digits = `${timeMatch?.[0] ?? ''}`.replace(/\D/g, '').slice(0, 4);
        this.scheduleTimeMasked = digits.length > 0 ? this.buildScheduleTimeMask(digits) : '__:__';
    }

    private resetScheduleUi(): void {
        this.selectedScheduleDays = [];
        this.scheduleTimeMasked = '__:__';
    }

    private buildScheduleTimeMask(digits: string): string {
        const safeDigits = `${digits ?? ''}`.replace(/\D/g, '').slice(0, 4);
        const parts = ['_', '_', ':', '_', '_'];
        if (safeDigits.length > 0)
            parts[0] = safeDigits[0];
        if (safeDigits.length > 1)
            parts[1] = safeDigits[1];
        if (safeDigits.length > 2)
            parts[3] = safeDigits[2];
        if (safeDigits.length > 3)
            parts[4] = safeDigits[3];
        return parts.join('');
    }

    private extractCompleteScheduleTime(value: string | null | undefined): string {
        const normalized = `${value ?? ''}`.trim();
        if (!/^\d{2}:\d{2}$/.test(normalized))
            return '';
        return this.isScheduleTextValid(normalized) ? normalized : '';
    }

    private insertScheduleDigit(input: HTMLInputElement, digit: string): void {
        const currentChars = this.scheduleTimeMasked.split('');
        const selectionStart = input.selectionStart ?? 0;
        const selectionEnd = input.selectionEnd ?? selectionStart;
        let targetIndex = this.findNextEditableScheduleIndex(selectionStart);

        if (selectionEnd > selectionStart) {
            for (let index = selectionStart; index < selectionEnd; index++) {
                if (this.isScheduleEditableIndex(index))
                    currentChars[index] = '_';
            }
            targetIndex = this.findNextEditableScheduleIndex(selectionStart);
        }

        if (!this.isScheduleEditableIndex(targetIndex))
            return;

        currentChars[targetIndex] = digit;
        this.scheduleTimeMasked = currentChars.join('');
        this.setScheduleCaret(input, this.findNextEditableScheduleIndex(targetIndex + 1));
    }

    private removeScheduleDigit(input: HTMLInputElement, removePrevious: boolean): void {
        const currentChars = this.scheduleTimeMasked.split('');
        const selectionStart = input.selectionStart ?? 0;
        const selectionEnd = input.selectionEnd ?? selectionStart;

        if (selectionEnd > selectionStart) {
            for (let index = selectionStart; index < selectionEnd; index++) {
                if (this.isScheduleEditableIndex(index))
                    currentChars[index] = '_';
            }
            this.scheduleTimeMasked = currentChars.join('');
            this.setScheduleCaret(input, this.findNextEditableScheduleIndex(selectionStart));
            return;
        }

        const targetIndex = removePrevious
            ? this.findPreviousEditableScheduleIndex(selectionStart - 1)
            : this.findNextEditableScheduleIndex(selectionStart);

        if (!this.isScheduleEditableIndex(targetIndex))
            return;

        currentChars[targetIndex] = '_';
        this.scheduleTimeMasked = currentChars.join('');
        this.setScheduleCaret(input, removePrevious ? targetIndex : this.findNextEditableScheduleIndex(targetIndex));
    }

    private isScheduleEditableIndex(index: number): boolean {
        return index === 0 || index === 1 || index === 3 || index === 4;
    }

    private findNextEditableScheduleIndex(index: number): number {
        if (index <= 0)
            return 0;
        if (index <= 1)
            return index;
        if (index <= 3)
            return 3;
        if (index <= 4)
            return 4;
        return 5;
    }

    private findPreviousEditableScheduleIndex(index: number): number {
        if (index >= 4)
            return 4;
        if (index >= 3)
            return 3;
        if (index >= 1)
            return 1;
        if (index >= 0)
            return 0;
        return 0;
    }

    private setScheduleCaret(input: HTMLInputElement, index: number): void {
        const safeIndex = index === 2 ? 3 : Math.max(0, Math.min(5, index));
        setTimeout(() => input.setSelectionRange(safeIndex, safeIndex));
    }

    private formatScheduleDaysLabel(labels: string[]): string {
        if (labels.length < 1)
            return '';
        if (labels.length === 1)
            return labels[0];
        if (labels.length === 2)
            return `${labels[0]} y ${labels[1]}`;
        return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
    }

    private expandKnownLanguageAlias(value: string | null | undefined): string {
        const normalized = `${value ?? ''}`.trim();
        if (normalized.length < 1)
            return '';

        const aliasMap = new Map<string, string>([
            ['es', 'Español'],
            ['esp', 'Español'],
            ['español', 'Español'],
            ['en', 'Inglés'],
            ['eng', 'Inglés'],
            ['ingles', 'Inglés'],
            ['inglés', 'Inglés'],
            ['fr', 'Francés'],
            ['fra', 'Francés'],
            ['frances', 'Francés'],
            ['francés', 'Francés'],
            ['de', 'Alemán'],
            ['deu', 'Alemán'],
            ['aleman', 'Alemán'],
            ['alemán', 'Alemán'],
            ['it', 'Italiano'],
            ['ita', 'Italiano'],
            ['pt', 'Portugués'],
            ['por', 'Portugués'],
            ['ca', 'Catalán'],
            ['cat', 'Catalán'],
            ['eu', 'Euskera'],
            ['gl', 'Gallego'],
            ['ja', 'Japonés'],
        ]);
        return aliasMap.get(this.normalizeAutocompleteText(normalized)) ?? normalized;
    }

    private normalizeAutocompleteText(value: string | null | undefined): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private mapLfgActionError(error: any, fallback: string): string {
        const complianceError = this.userSvc.getComplianceErrorMessage(error, 'usage');
        if (complianceError.length > 0)
            return complianceError;
        return `${error?.message ?? fallback}`.trim() || fallback;
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
        this.resetScheduleUi();
    }
}
