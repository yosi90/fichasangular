import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { SesionDialogComponent } from 'src/app/components/sesion-dialog/sesion-dialog.component';
import {
    FeedbackAttachmentDto,
    FeedbackCreateBugRequestDto,
    FeedbackCreateFeatureRequestDto,
    FeedbackKind,
    FeedbackSubmissionDetailDto,
    FeedbackSubmissionSummaryDto,
} from 'src/app/interfaces/usuarios-api';
import { AppToastService } from 'src/app/services/app-toast.service';
import { UserService } from 'src/app/services/user.service';
import { UsuariosApiService } from 'src/app/services/usuarios-api.service';

interface FeedbackSelectedImage {
    file: File;
    previewUrl: string;
}

interface FeedbackSubscriptionUiState {
    subscribed: boolean;
    canSubscribe: boolean;
    loading: boolean;
    error: string;
}

type PrivateFeedbackWorkspaceView = 'compose' | 'detail' | 'community';

@Component({
    selector: 'app-help-feedback',
    templateUrl: './help-feedback.component.html',
    styleUrls: ['./help-feedback.component.sass'],
    standalone: false
})
export class HelpFeedbackComponent implements OnInit, OnDestroy {
    @Input() kind: FeedbackKind = 'feature';

    readonly pageSize = 25;
    readonly maxImages = 5;
    readonly maxImageSizeBytes = 5 * 1024 * 1024;
    readonly acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    readonly form = this.fb.nonNullable.group({
        title: [''],
        description: ['', [Validators.required]],
        pageUrl: [this.resolveCurrentPageUrl()],
        stepsToReproduce: [''],
        expectedBehavior: [''],
        actualBehavior: [''],
        useCase: [''],
        desiredOutcome: [''],
    });

    isLoggedIn = false;
    submitting = false;

    publicLoading = false;
    publicError = '';
    publicItems: FeedbackSubmissionSummaryDto[] = [];
    publicHasMore = false;
    private readonly expandedPublicIds = new Set<number>();

    privateLoading = false;
    privateError = '';
    privateItems: FeedbackSubmissionSummaryDto[] = [];
    privateHasMore = false;
    selectedPrivateSubmissionId: number | null = null;
    privateWorkspaceView: PrivateFeedbackWorkspaceView = 'compose';
    selectedPrivateDetailLoading = false;
    selectedPrivateDetailError = '';
    private readonly privateDetailById = new Map<number, FeedbackSubmissionDetailDto>();
    readonly subscriptionStateById = new Map<number, FeedbackSubscriptionUiState>();

    selectedImages: FeedbackSelectedImage[] = [];
    fileSelectionError = '';

    private readonly destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private usuariosApiSvc: UsuariosApiService,
        private userSvc: UserService,
        private appToastSvc: AppToastService,
        private dialog: MatDialog,
    ) { }

    get isBug(): boolean {
        return this.kind === 'bug';
    }

    get isFeature(): boolean {
        return this.kind === 'feature';
    }

    get usePrivateWorkspaceLayout(): boolean {
        return this.isLoggedIn;
    }

    get canSubmit(): boolean {
        return this.isLoggedIn
            && !this.submitting
            && this.form.controls.description.valid
            && this.fileSelectionError.length < 1;
    }

    get selectedPrivateDetail(): FeedbackSubmissionDetailDto | null {
        if (!this.selectedPrivateSubmissionId)
            return null;
        return this.privateDetailById.get(this.selectedPrivateSubmissionId) ?? null;
    }

    get publicCommunityItems(): FeedbackSubmissionSummaryDto[] {
        if (!this.isFeature)
            return [];
        const ownIds = new Set(this.privateItems.map((item) => item.id));
        return this.publicItems.filter((item) => !ownIds.has(item.id));
    }

    ngOnInit(): void {
        this.userSvc.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe((loggedIn) => {
                this.isLoggedIn = loggedIn === true;
                if (this.isLoggedIn) {
                    void this.loadPrivateSubmissions(true);
                    return;
                }
                this.resetPrivateState();
            });

        if (this.isFeature)
            void this.loadPublicSubmissions(true);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearSelectedImages();
    }

    isPublicExpanded(id: number): boolean {
        return this.expandedPublicIds.has(id);
    }

    togglePublicExpanded(id: number): void {
        if (this.expandedPublicIds.has(id)) {
            this.expandedPublicIds.delete(id);
            return;
        }
        this.expandedPublicIds.add(id);
    }

    async loadPublicSubmissions(reset: boolean = false): Promise<void> {
        if (!this.isFeature || this.publicLoading)
            return;

        this.publicLoading = true;
        if (reset)
            this.publicError = '';

        try {
            const response = await this.usuariosApiSvc.listPublicFeatureRequests(
                this.pageSize,
                reset ? 0 : this.publicItems.length
            );
            this.publicItems = reset
                ? response.items
                : this.mergeSubmissionLists(this.publicItems, response.items);
            this.publicHasMore = response.hasMore;
            if (reset) {
                this.expandedPublicIds.clear();
                if (this.publicItems[0]?.id)
                    this.expandedPublicIds.add(this.publicItems[0].id);
            }
            if (this.isLoggedIn)
                await this.refreshSubscriptionStates(response.items.map((item) => item.id));
        } catch (error: any) {
            this.publicError = `${error?.message ?? 'No se pudieron cargar las peticiones públicas.'}`.trim();
        } finally {
            this.publicLoading = false;
        }
    }

    async loadPrivateSubmissions(reset: boolean = false): Promise<void> {
        if (!this.isLoggedIn || this.privateLoading)
            return;

        this.privateLoading = true;
        if (reset)
            this.privateError = '';

        try {
            const response = this.isBug
                ? await this.usuariosApiSvc.listMyBugReports(this.pageSize, reset ? 0 : this.privateItems.length)
                : await this.usuariosApiSvc.listMyFeatureRequests(this.pageSize, reset ? 0 : this.privateItems.length);

            this.privateItems = reset
                ? response.items
                : this.mergeSubmissionLists(this.privateItems, response.items);
            this.privateHasMore = response.hasMore;

            const selectedId = this.selectedPrivateSubmissionId;
            if (selectedId && this.privateItems.some((item) => item.id === selectedId)) {
                await this.selectPrivateSubmission(selectedId);
            } else if (selectedId && !this.privateItems.some((item) => item.id === selectedId)) {
                this.selectedPrivateSubmissionId = null;
                this.privateWorkspaceView = 'compose';
            }
            await this.refreshSubscriptionStates(response.items.map((item) => item.id));
        } catch (error: any) {
            this.privateError = `${error?.message ?? 'No se pudo cargar tu historial.'}`.trim();
        } finally {
            this.privateLoading = false;
        }
    }

    async selectPrivateSubmission(id: number): Promise<void> {
        if (!this.isLoggedIn || id <= 0) {
            this.selectedPrivateSubmissionId = null;
            this.privateWorkspaceView = 'compose';
            return;
        }

        this.selectedPrivateSubmissionId = id;
        this.privateWorkspaceView = 'detail';
        this.selectedPrivateDetailError = '';

        if (this.privateDetailById.has(id))
            return;

        this.selectedPrivateDetailLoading = true;
        try {
            const detail = this.isBug
                ? await this.usuariosApiSvc.getMyBugReport(id)
                : await this.usuariosApiSvc.getMyFeatureRequest(id);
            this.privateDetailById.set(id, detail);
            await this.refreshSubscriptionStates([id]);
        } catch (error: any) {
            if (this.selectedPrivateSubmissionId === id)
                this.selectedPrivateDetailError = `${error?.message ?? 'No se pudo cargar el detalle.'}`.trim();
        } finally {
            if (this.selectedPrivateSubmissionId === id)
                this.selectedPrivateDetailLoading = false;
        }
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement | null;
        const selectedFiles = Array.from(input?.files ?? []);
        this.fileSelectionError = '';

        if (selectedFiles.length < 1)
            return;

        const validFiles: File[] = [];
        for (const file of selectedFiles) {
            if (!this.acceptedImageTypes.includes(file.type)) {
                this.registerFileSelectionError(`"${file.name}" no es una imagen compatible.`);
                if (input)
                    input.value = '';
                return;
            }
            if (file.size > this.maxImageSizeBytes) {
                this.registerFileSelectionError(`"${file.name}" supera el máximo de 5 MB.`);
                if (input)
                    input.value = '';
                return;
            }
            validFiles.push(file);
        }

        if (this.selectedImages.length + validFiles.length > this.maxImages) {
            this.registerFileSelectionError(`Solo puedes adjuntar hasta ${this.maxImages} imágenes.`);
            if (input)
                input.value = '';
            return;
        }

        this.selectedImages = [
            ...this.selectedImages,
            ...validFiles.map((file) => ({
                file,
                previewUrl: this.createPreviewUrl(file),
            })),
        ];

        if (input)
            input.value = '';
    }

    removeSelectedImage(index: number): void {
        const candidate = this.selectedImages[index];
        if (!candidate)
            return;

        this.revokePreviewUrl(candidate.previewUrl);
        this.selectedImages = this.selectedImages.filter((_, currentIndex) => currentIndex !== index);
        this.fileSelectionError = '';
    }

    async submit(): Promise<void> {
        if (!this.isLoggedIn) {
            this.openLoginDialog();
            return;
        }

        if (!this.canSubmit) {
            this.form.controls.description.markAsTouched();
            return;
        }

        this.submitting = true;
        this.privateError = '';

        try {
            const response = this.isBug
                ? await this.usuariosApiSvc.createBugReport(this.buildBugPayload())
                : await this.usuariosApiSvc.createFeatureRequest(this.buildFeaturePayload());

            this.privateDetailById.set(response.id, response);
            this.subscriptionStateById.set(response.id, {
                subscribed: true,
                canSubscribe: true,
                loading: false,
                error: '',
            });
            this.resetForm();
            this.appToastSvc.showSuccess(this.isBug
                ? 'El reporte de bug se ha enviado.'
                : 'La petición de funcionalidad se ha enviado.');

            await this.loadPrivateSubmissions(true);
            if (!this.privateItems.some((item) => item.id === response.id))
                this.privateItems = this.mergeSubmissionLists([this.toSummary(response)], this.privateItems);
            this.selectedPrivateSubmissionId = response.id;
            this.privateWorkspaceView = 'detail';
        } catch (error: any) {
            const message = `${error?.message ?? 'No se pudo enviar el feedback.'}`.trim();
            this.privateError = message;
            this.appToastSvc.showError(message);
        } finally {
            this.submitting = false;
        }
    }

    async toggleFeedbackSubscription(submissionId: number): Promise<void> {
        if (!this.isLoggedIn || submissionId <= 0)
            return;
        const current = this.subscriptionStateById.get(submissionId);
        if (!current?.canSubscribe || current.loading)
            return;

        this.subscriptionStateById.set(submissionId, {
            ...current,
            loading: true,
            error: '',
        });

        const desired = !current.subscribed;
        try {
            const response = await this.usuariosApiSvc.setFeedbackSubscription(submissionId, desired);
            this.subscriptionStateById.set(submissionId, {
                subscribed: response.subscribed,
                canSubscribe: true,
                loading: false,
                error: '',
            });
            this.appToastSvc.showSuccess(response.subscribed
                ? 'Ahora sigues los cambios de este feedback.'
                : 'Has dejado de seguir los cambios de este feedback.');
        } catch (error: any) {
            const message = `${error?.message ?? 'No se pudo actualizar el seguimiento.'}`.trim();
            this.subscriptionStateById.set(submissionId, {
                ...current,
                loading: false,
                error: message,
            });
            this.appToastSvc.showError(message);
        }
    }

    getSubscriptionState(submissionId: number): FeedbackSubscriptionUiState | null {
        return this.subscriptionStateById.get(submissionId) ?? null;
    }

    canShowSubscriptionControl(submissionId: number): boolean {
        return this.isLoggedIn && this.subscriptionStateById.get(submissionId)?.canSubscribe === true;
    }

    getSubscriptionButtonLabel(submissionId: number): string {
        const state = this.subscriptionStateById.get(submissionId);
        if (state?.loading)
            return 'Actualizando...';
        return state?.subscribed ? 'Dejar de seguir' : 'Seguir cambios';
    }

    getSubscriptionStatusLabel(submissionId: number): string {
        const state = this.subscriptionStateById.get(submissionId);
        return state?.subscribed ? 'Siguiendo cambios' : 'Sin seguimiento';
    }

    openLoginDialog(): void {
        this.dialog.open(SesionDialogComponent);
    }

    async downloadAttachment(attachment: FeedbackAttachmentDto): Promise<void> {
        try {
            await this.usuariosApiSvc.downloadFeedbackAttachment(attachment.id, attachment.filename);
        } catch (error: any) {
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo descargar el adjunto.'}`.trim());
        }
    }

    trackBySubmissionId(_: number, item: FeedbackSubmissionSummaryDto): number {
        return item.id;
    }

    trackByAttachmentId(_: number, item: FeedbackAttachmentDto): number {
        return item.id;
    }

    openNewSubmission(): void {
        this.privateWorkspaceView = 'compose';
        this.selectedPrivateSubmissionId = null;
        this.selectedPrivateDetailLoading = false;
        this.selectedPrivateDetailError = '';
        this.resetForm();
    }

    openCommunitySubmissions(): void {
        if (!this.isFeature)
            return;
        this.privateWorkspaceView = 'community';
        this.selectedPrivateSubmissionId = null;
        this.selectedPrivateDetailLoading = false;
        this.selectedPrivateDetailError = '';
        if (this.publicItems.length < 1 && !this.publicLoading)
            void this.loadPublicSubmissions(true);
        else
            void this.refreshSubscriptionStates(this.publicCommunityItems.map((item) => item.id));
    }

    getStatusLabel(status: FeedbackSubmissionSummaryDto['status']): string {
        switch (status) {
            case 'triaged':
                return 'Revisado';
            case 'planned':
                return 'Planificado';
            case 'in_progress':
                return 'En curso';
            case 'resolved':
                return 'Resuelto';
            case 'closed':
                return 'Cerrado';
            case 'rejected':
                return 'Descartado';
            default:
                return 'Enviado';
        }
    }

    getPriorityLabel(priority: FeedbackSubmissionSummaryDto['priority']): string {
        switch (priority) {
            case 'critical':
                return 'Crítica';
            case 'high':
                return 'Alta';
            case 'medium':
                return 'Media';
            case 'low':
                return 'Baja';
            default:
                return 'Sin prioridad';
        }
    }

    getAttachmentSizeLabel(sizeBytes: number): string {
        if (sizeBytes >= 1024 * 1024)
            return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        if (sizeBytes >= 1024)
            return `${Math.round(sizeBytes / 1024)} KB`;
        return `${sizeBytes} B`;
    }

    private buildBugPayload(): FeedbackCreateBugRequestDto {
        const raw = this.form.getRawValue();
        return {
            title: raw.title,
            description: raw.description,
            pageUrl: raw.pageUrl,
            stepsToReproduce: raw.stepsToReproduce,
            expectedBehavior: raw.expectedBehavior,
            actualBehavior: raw.actualBehavior,
            images: this.selectedImages.map((item) => item.file),
        };
    }

    private buildFeaturePayload(): FeedbackCreateFeatureRequestDto {
        const raw = this.form.getRawValue();
        return {
            title: raw.title,
            description: raw.description,
            pageUrl: raw.pageUrl,
            useCase: raw.useCase,
            desiredOutcome: raw.desiredOutcome,
            images: this.selectedImages.map((item) => item.file),
        };
    }

    private toSummary(detail: FeedbackSubmissionDetailDto): FeedbackSubmissionSummaryDto {
        return {
            id: detail.id,
            kind: detail.kind,
            status: detail.status,
            priority: detail.priority,
            title: detail.title,
            description: detail.description,
            pageUrl: detail.pageUrl,
            details: detail.details,
            createdAtUtc: detail.createdAtUtc,
            updatedAtUtc: detail.updatedAtUtc,
        };
    }

    private mergeSubmissionLists(
        current: FeedbackSubmissionSummaryDto[],
        incoming: FeedbackSubmissionSummaryDto[]
    ): FeedbackSubmissionSummaryDto[] {
        const byId = new Map<number, FeedbackSubmissionSummaryDto>();
        [...current, ...incoming].forEach((item) => byId.set(item.id, item));
        return Array.from(byId.values()).sort((left, right) => right.id - left.id);
    }

    private resetPrivateState(): void {
        this.privateLoading = false;
        this.privateError = '';
        this.privateItems = [];
        this.privateHasMore = false;
        this.selectedPrivateSubmissionId = null;
        this.privateWorkspaceView = 'compose';
        this.selectedPrivateDetailLoading = false;
        this.selectedPrivateDetailError = '';
        this.privateDetailById.clear();
        this.subscriptionStateById.clear();
    }

    private async refreshSubscriptionStates(submissionIds: number[]): Promise<void> {
        if (!this.isLoggedIn)
            return;
        const ids = Array.from(new Set((submissionIds ?? []).filter((id) => Number.isFinite(id) && id > 0)));
        if (ids.length < 1)
            return;

        try {
            const response = await this.usuariosApiSvc.getFeedbackSubscriptionStates(ids);
            response.items.forEach((item) => {
                const previous = this.subscriptionStateById.get(item.submissionId);
                this.subscriptionStateById.set(item.submissionId, {
                    subscribed: item.subscribed,
                    canSubscribe: item.canSubscribe,
                    loading: previous?.loading === true ? previous.loading : false,
                    error: previous?.error ?? '',
                });
            });
        } catch {
            // Si el backend aun no expone lectura de estado, ocultamos controles en vez de inventar estado.
        }
    }

    private resetForm(): void {
        this.form.reset({
            title: '',
            description: '',
            pageUrl: this.resolveCurrentPageUrl(),
            stepsToReproduce: '',
            expectedBehavior: '',
            actualBehavior: '',
            useCase: '',
            desiredOutcome: '',
        });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.clearSelectedImages();
        this.fileSelectionError = '';
    }

    private clearSelectedImages(): void {
        this.selectedImages.forEach((item) => this.revokePreviewUrl(item.previewUrl));
        this.selectedImages = [];
    }

    private registerFileSelectionError(message: string): void {
        this.fileSelectionError = message;
        this.appToastSvc.showError(message);
    }

    private createPreviewUrl(file: File): string {
        const urlApi = window.URL ?? window.webkitURL;
        if (!urlApi?.createObjectURL)
            return '';
        return urlApi.createObjectURL(file);
    }

    private revokePreviewUrl(previewUrl: string): void {
        if (`${previewUrl ?? ''}`.trim().length < 1)
            return;
        const urlApi = window.URL ?? window.webkitURL;
        if (urlApi?.revokeObjectURL)
            urlApi.revokeObjectURL(previewUrl);
    }

    private resolveCurrentPageUrl(): string {
        const pathname = `${window.location?.pathname ?? ''}`.trim();
        const search = `${window.location?.search ?? ''}`.trim();
        const hash = `${window.location?.hash ?? ''}`.trim();
        const pageUrl = `${pathname}${search}${hash}`.trim();
        return pageUrl.length > 0 ? pageUrl : '/';
    }
}
