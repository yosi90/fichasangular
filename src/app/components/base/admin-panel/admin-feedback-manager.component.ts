import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import {
    FeedbackAdminPatchRequestDto,
    FeedbackAdminSubmissionDetailDto,
    FeedbackAdminSubmissionSummaryDto,
    FeedbackAttachmentDto,
    FeedbackKind,
    FeedbackPriority,
    FeedbackStatus,
} from 'src/app/interfaces/usuarios-api';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { UsuariosApiService } from 'src/app/services/usuarios-api.service';

export interface AdminFeedbackQuickAction {
    label: string;
    status: FeedbackStatus;
    color?: 'primary' | 'accent' | 'warn';
}

@Component({
    selector: 'app-admin-feedback-manager',
    templateUrl: './admin-feedback-manager.component.html',
    styleUrls: ['./admin-feedback-manager.component.sass'],
    standalone: false
})
export class AdminFeedbackManagerComponent implements OnInit, OnChanges, OnDestroy {
    @Input() kind: FeedbackKind = 'bug';
    @Input() title = 'Feedback';
    @Input() description = '';
    @Input() emptyLabel = 'No hay elementos que coincidan con los filtros actuales';
    @Input() quickActions: AdminFeedbackQuickAction[] = [];

    items: FeedbackAdminSubmissionSummaryDto[] = [];
    detail: FeedbackAdminSubmissionDetailDto | null = null;
    statusFilter: '' | FeedbackStatus = '';
    reporterUidFilter = '';
    limit = 25;
    offset = 0;
    total = 0;
    loading = false;
    detailLoading = false;
    saving = false;
    error = '';
    detailError = '';
    patchStatus: '' | FeedbackStatus = '';
    patchPriority: '' | FeedbackPriority = '';
    internalComment = '';
    publicMessage = '';
    subscriptionSubscribed = false;
    subscriptionCanSubscribe = false;
    subscriptionLoading = false;
    subscriptionError = '';

    readonly statusOptions: FeedbackStatus[] = ['submitted', 'triaged', 'planned', 'in_progress', 'resolved', 'closed', 'rejected'];
    readonly priorityOptions: FeedbackPriority[] = ['low', 'medium', 'high', 'critical'];

    private loadedOnce = false;
    private initialized = false;
    private readonly subscriptions = new Subscription();
    private readonly dateFormatter = new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    constructor(
        private usuariosApiSvc: UsuariosApiService,
        private chatRealtimeSvc: ChatRealtimeService,
    ) { }

    ngOnInit(): void {
        this.initialized = true;
        this.subscriptions.add(
            this.chatRealtimeSvc.alertCandidate$.subscribe((candidate) => {
                if (!this.isRealtimeFeedbackCreatedForCurrentKind(candidate))
                    return;
                void this.load(true);
            })
        );
        void this.load(true);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['kind'] || changes['kind'].firstChange)
            return;
        this.resetState();
        if (this.initialized)
            void this.load(true);
    }

    get stateLabel(): string {
        if (this.loading)
            return `Cargando ${this.lowerTitle}...`;
        if (this.error.length > 0)
            return this.error;
        if (this.items.length < 1)
            return this.emptyLabel;
        return '';
    }

    get pageText(): string {
        if (this.total < 1)
            return 'Sin resultados';
        const from = this.offset + 1;
        const to = Math.min(this.offset + this.items.length, this.total);
        return `${from}-${to} de ${this.total}`;
    }

    get canGoPrevious(): boolean {
        return this.offset > 0 && !this.loading;
    }

    get canGoNext(): boolean {
        return !this.loading && this.offset + this.items.length < this.total;
    }

    get canSavePatch(): boolean {
        if (!this.detail || this.saving)
            return false;
        const statusChanged = !!this.patchStatus && this.patchStatus !== this.detail.status;
        const priorityValue = this.patchPriority || null;
        const priorityChanged = priorityValue !== this.detail.priority;
        return statusChanged
            || priorityChanged
            || this.internalComment.trim().length > 0
            || this.publicMessage.trim().length > 0;
    }

    get canShowSubscriptionControl(): boolean {
        return !!this.detail && this.subscriptionCanSubscribe;
    }

    get subscriptionButtonLabel(): string {
        if (this.subscriptionLoading)
            return 'Actualizando...';
        return this.subscriptionSubscribed ? 'Dejar de seguir' : 'Seguir cambios';
    }

    get subscriptionStatusLabel(): string {
        return this.subscriptionSubscribed ? 'Siguiendo cambios' : 'Sin seguimiento';
    }

    get itemFallbackTitle(): string {
        return this.kind === 'feature' ? 'Funcionalidad sin titulo' : 'Bug sin titulo';
    }

    get lowerTitle(): string {
        return this.title.trim().toLowerCase() || 'feedback';
    }

    async applyFilters(): Promise<void> {
        this.offset = 0;
        this.detail = null;
        await this.load(true);
    }

    clearFilters(): void {
        this.statusFilter = '';
        this.reporterUidFilter = '';
        this.offset = 0;
        this.detail = null;
        this.detailError = '';
        void this.load(true);
    }

    async load(forceReload: boolean = false): Promise<void> {
        if (this.loading)
            return;
        if (!forceReload && this.loadedOnce)
            return;

        this.loading = true;
        this.error = '';
        try {
            const response = await this.usuariosApiSvc.listAdminFeedbackSubmissions({
                kind: this.kind,
                status: this.statusFilter || null,
                reporterUid: this.reporterUidFilter,
                limit: this.limit,
                offset: this.offset,
            });
            this.items = response.items ?? [];
            this.total = Number(response.total ?? 0) || 0;
            this.limit = Number(response.limit ?? this.limit) || this.limit;
            this.offset = Number(response.offset ?? this.offset) || 0;
            this.loadedOnce = true;

            if (this.detail && !this.items.some((item) => item.id === this.detail?.id)) {
                this.detail = null;
                this.detailError = '';
            }
        } catch (error: any) {
            this.items = [];
            this.total = 0;
            this.error = error?.message ?? `No se pudo cargar ${this.lowerTitle}`;
        } finally {
            this.loading = false;
        }
    }

    async loadDetail(item: FeedbackAdminSubmissionSummaryDto): Promise<void> {
        if (!item?.id)
            return;

        this.detailLoading = true;
        this.detailError = '';
        try {
            const detail = await this.usuariosApiSvc.getAdminFeedbackSubmission(item.id);
            this.detail = detail;
            this.resetPatchForm(detail);
            await this.refreshSubscriptionState(detail.id);
        } catch (error: any) {
            this.detail = null;
            this.detailError = error?.message ?? 'No se pudo cargar el detalle admin';
            this.resetSubscriptionState();
        } finally {
            this.detailLoading = false;
        }
    }

    async savePatch(): Promise<void> {
        if (!this.canSavePatch || !this.detail)
            return;

        await this.update(this.buildPatchPayload());
    }

    async quickAction(status: FeedbackStatus): Promise<void> {
        if (!this.detail || this.saving)
            return;
        await this.update({ status });
    }

    async toggleSubscription(): Promise<void> {
        if (!this.detail || !this.subscriptionCanSubscribe || this.subscriptionLoading)
            return;

        const previousSubscribed = this.subscriptionSubscribed;
        this.subscriptionLoading = true;
        this.subscriptionError = '';
        try {
            const response = await this.usuariosApiSvc.setFeedbackSubscription(this.detail.id, !previousSubscribed);
            this.subscriptionSubscribed = response.subscribed;
            this.subscriptionCanSubscribe = true;
        } catch (error: any) {
            this.subscriptionSubscribed = previousSubscribed;
            this.subscriptionError = error?.message ?? 'No se pudo actualizar el seguimiento';
        } finally {
            this.subscriptionLoading = false;
        }
    }

    async downloadAttachment(attachment: FeedbackAttachmentDto): Promise<void> {
        try {
            await this.usuariosApiSvc.downloadFeedbackAttachment(attachment.id, attachment.filename);
        } catch (error: any) {
            this.detailError = error?.message ?? 'No se pudo descargar el adjunto';
        }
    }

    async previousPage(): Promise<void> {
        if (!this.canGoPrevious)
            return;
        this.offset = Math.max(0, this.offset - this.limit);
        await this.load(true);
    }

    async nextPage(): Promise<void> {
        if (!this.canGoNext)
            return;
        this.offset += this.limit;
        await this.load(true);
    }

    statusLabel(status: FeedbackStatus | string | null | undefined): string {
        const normalized = `${status ?? ''}`.trim().toLowerCase();
        if (normalized === 'triaged')
            return 'Revisado';
        if (normalized === 'planned')
            return 'Planificado';
        if (normalized === 'in_progress')
            return 'En curso';
        if (normalized === 'resolved')
            return 'Resuelto';
        if (normalized === 'closed')
            return 'Cerrado';
        if (normalized === 'rejected')
            return 'Descartado';
        return 'Enviado';
    }

    priorityLabel(priority: FeedbackPriority | string | null | undefined): string {
        const normalized = `${priority ?? ''}`.trim().toLowerCase();
        if (normalized === 'critical')
            return 'Critica';
        if (normalized === 'high')
            return 'Alta';
        if (normalized === 'medium')
            return 'Media';
        if (normalized === 'low')
            return 'Baja';
        return 'Sin prioridad';
    }

    reporterLabel(item: FeedbackAdminSubmissionSummaryDto | FeedbackAdminSubmissionDetailDto | null | undefined): string {
        return `${item?.reporter?.displayName ?? item?.reporter?.uid ?? item?.reporter?.userId ?? 'Sin reporter'}`.trim();
    }

    formatUtc(value: string | null | undefined, fallback: string = '-'): string {
        const normalized = `${value ?? ''}`.trim();
        if (normalized.length < 1)
            return fallback;
        const parsed = new Date(normalized);
        if (Number.isNaN(parsed.getTime()))
            return fallback;
        return this.dateFormatter.format(parsed);
    }

    trackByItem(index: number, item: FeedbackAdminSubmissionSummaryDto): number {
        return item?.id ?? index;
    }

    trackByAttachment(index: number, item: FeedbackAttachmentDto): number {
        return item?.id ?? index;
    }

    trackByUpdate(index: number): number {
        return index;
    }

    private resetState(): void {
        this.items = [];
        this.detail = null;
        this.statusFilter = '';
        this.reporterUidFilter = '';
        this.offset = 0;
        this.total = 0;
        this.loading = false;
        this.detailLoading = false;
        this.saving = false;
        this.error = '';
        this.detailError = '';
        this.loadedOnce = false;
        this.patchStatus = '';
        this.patchPriority = '';
        this.internalComment = '';
        this.publicMessage = '';
        this.resetSubscriptionState();
    }

    private resetPatchForm(detail: FeedbackAdminSubmissionDetailDto): void {
        this.patchStatus = detail.status;
        this.patchPriority = detail.priority ?? '';
        this.internalComment = '';
        this.publicMessage = '';
    }

    private async refreshSubscriptionState(submissionId: number): Promise<void> {
        this.resetSubscriptionState();
        try {
            const response = await this.usuariosApiSvc.getFeedbackSubscriptionStates([submissionId]);
            const state = response.items.find((item) => item.submissionId === submissionId);
            if (!state)
                return;
            this.subscriptionSubscribed = state.subscribed;
            this.subscriptionCanSubscribe = state.canSubscribe;
            this.subscriptionError = '';
        } catch {
            this.resetSubscriptionState();
        }
    }

    private resetSubscriptionState(): void {
        this.subscriptionSubscribed = false;
        this.subscriptionCanSubscribe = false;
        this.subscriptionLoading = false;
        this.subscriptionError = '';
    }

    private buildPatchPayload(): FeedbackAdminPatchRequestDto {
        const payload: FeedbackAdminPatchRequestDto = {};
        if (this.detail) {
            if (this.patchStatus && this.patchStatus !== this.detail.status)
                payload.status = this.patchStatus;
            const priorityValue = this.patchPriority || null;
            if (priorityValue !== this.detail.priority)
                payload.priority = priorityValue;
        }
        const internalComment = this.internalComment.trim();
        const publicMessage = this.publicMessage.trim();
        if (internalComment.length > 0)
            payload.internalComment = internalComment;
        if (publicMessage.length > 0)
            payload.publicMessage = publicMessage;
        return payload;
    }

    private async update(payload: FeedbackAdminPatchRequestDto): Promise<void> {
        if (!this.detail)
            return;

        this.saving = true;
        this.detailError = '';
        try {
            const detail = await this.usuariosApiSvc.updateAdminFeedbackSubmission(this.detail.id, payload);
            this.detail = detail;
            this.items = this.items.map((item) => item.id === detail.id ? this.toSummary(detail) : item);
            this.resetPatchForm(detail);
        } catch (error: any) {
            this.detailError = error?.message ?? 'No se pudo actualizar el feedback';
        } finally {
            this.saving = false;
        }
    }

    private toSummary(detail: FeedbackAdminSubmissionDetailDto): FeedbackAdminSubmissionSummaryDto {
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
            reporter: detail.reporter,
        };
    }

    private isRealtimeFeedbackCreatedForCurrentKind(candidate: any): boolean {
        const notificationCode = `${candidate?.notification?.code ?? ''}`.trim().toLowerCase();
        const actionTarget = `${candidate?.notification?.action?.target ?? ''}`.trim().toLowerCase();
        const kind = `${candidate?.notification?.context?.kind ?? ''}`.trim().toLowerCase();
        return notificationCode === 'system.feedback_created'
            && actionTarget === 'admin.feedback'
            && kind === this.kind;
    }
}
