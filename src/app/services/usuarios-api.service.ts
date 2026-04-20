import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    AdminPolicyDraftDto,
    AdminPolicyDraftUpdateRequestDto,
    CreationAuditEventDetailDto,
    CreationAuditListFiltersDto,
    CreationAuditListResponseDto,
    FeedbackAttachmentDto,
    FeedbackActorSummaryDto,
    FeedbackAdminListFiltersDto,
    FeedbackAdminListResponseDto,
    FeedbackAdminPatchRequestDto,
    FeedbackAdminSubmissionDetailDto,
    FeedbackAdminSubmissionSummaryDto,
    FeedbackCreateBugRequestDto,
    FeedbackCreateFeatureRequestDto,
    FeedbackDetailsDto,
    FeedbackKind,
    FeedbackListResponseDto,
    FeedbackPriority,
    FeedbackStatus,
    FeedbackSubscriptionResponseDto,
    FeedbackSubscriptionStateDto,
    FeedbackSubscriptionStateListResponseDto,
    FeedbackSubmissionDetailDto,
    FeedbackSubmissionSummaryDto,
    FeedbackUpdateAdminDto,
    FeedbackUpdateDto,
    ModerationAdminHistoryItemDto,
    ModerationAdminHistoryResponseDto,
    ModerationCaseProgressDto,
    ModerationCaseCreateRequestDto,
    ModerationCaseListItemDto,
    ModerationCasePatchRequestDto,
    ModerationCaseSourceMode,
    ModerationCaseStageDto,
    ModerationCaseStagesReplaceRequestDto,
    ModerationCaseStageUpsertDto,
    ModerationIncidentCreateRequestDto,
    ModerationIncidentCreateResponseDto,
    ModerationIncidentListItemDto,
    ModerationProgressCaseDto,
    ModerationSanctionListItemDto,
    ModerationSanctionRevokeRequestDto,
    ModerationSanctionRevokeResponseDto,
    UsuarioAclResponseDto,
    UsuarioListadoItemDto,
    UsuarioUpsertRequestDto,
    UsuarioUpsertResponseDto,
} from '../interfaces/usuarios-api';
import {
    UserCompliancePolicyKind,
    UserComplianceActivePolicy,
    UserModerationHistoryItem,
    UserModerationHistoryResult,
    UserModerationSanction,
    UserModerationSummary,
} from '../interfaces/user-moderation';

@Injectable({
    providedIn: 'root'
})
export class UsuariosApiService {
    private readonly usuariosBaseUrl = `${environment.apiUrl}usuarios`;

    constructor(private http: HttpClient, private auth: Auth) { }

    async getAclByUid(uid: string, historyLimit?: number | null): Promise<UsuarioAclResponseDto> {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            throw new Error('UID inválido');

        try {
            const response = await firstValueFrom(
                this.http.get<UsuarioAclResponseDto>(`${this.usuariosBaseUrl}/acl/${encodeURIComponent(uidNormalizado)}`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.buildAclQueryParams(historyLimit),
                })
            );
            return this.normalizeAclResponse(response, uidNormalizado);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo leer ACL de usuario desde API');
        }
    }

    async getAdminPolicyDraft(policyKind: UserCompliancePolicyKind): Promise<AdminPolicyDraftDto> {
        const normalizedKind = this.normalizePolicyKind(policyKind);
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/admin/policies/${normalizedKind}/draft`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeAdminPolicyDraft(response, normalizedKind);
        } catch (error) {
            throw this.toApiError(error, `No se pudo cargar el borrador de política ${normalizedKind}`);
        }
    }

    async updateAdminPolicyDraft(policyKind: UserCompliancePolicyKind, payload: AdminPolicyDraftUpdateRequestDto): Promise<AdminPolicyDraftDto> {
        const normalizedKind = this.normalizePolicyKind(policyKind);
        const normalizedPayload = this.normalizeAdminPolicyDraftUpdatePayload(payload);
        try {
            const response = await firstValueFrom(
                this.http.put<any>(`${this.usuariosBaseUrl}/admin/policies/${normalizedKind}/draft`, normalizedPayload, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeAdminPolicyDraft(response, normalizedKind);
        } catch (error) {
            throw this.toApiError(error, `No se pudo actualizar el borrador de política ${normalizedKind}`);
        }
    }

    async publishAdminPolicy(policyKind: UserCompliancePolicyKind): Promise<UserComplianceActivePolicy> {
        const normalizedKind = this.normalizePolicyKind(policyKind);
        try {
            const response = await firstValueFrom(
                this.http.post<any>(`${this.usuariosBaseUrl}/admin/policies/${normalizedKind}/publish`, {}, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeActivePolicy(response?.policy ?? response?.activePolicy ?? response, normalizedKind);
        } catch (error) {
            throw this.toApiError(error, `No se pudo publicar la política ${normalizedKind}`);
        }
    }

    async createBugReport(payload: FeedbackCreateBugRequestDto): Promise<FeedbackSubmissionDetailDto> {
        const formData = this.buildFeedbackBugFormData(payload);
        try {
            const response = await firstValueFrom(
                this.http.post<any>(`${this.usuariosBaseUrl}/me/bug-reports`, formData, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeFeedbackSubmissionDetail(response, 'bug');
        } catch (error) {
            throw this.toApiError(error, 'No se pudo enviar el reporte de bug');
        }
    }

    async listMyBugReports(limit: number = 25, offset: number = 0): Promise<FeedbackListResponseDto> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/me/bug-reports`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.buildPaginationParams(limit, offset),
                })
            );
            return this.normalizeFeedbackListResponse(response, 'bug', limit, offset);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar tu historial de bugs');
        }
    }

    async getMyBugReport(id: number): Promise<FeedbackSubmissionDetailDto> {
        const normalizedId = this.normalizeFeedbackSubmissionId(id);
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/me/bug-reports/${normalizedId}`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeFeedbackSubmissionDetail(response, 'bug');
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar el detalle del bug');
        }
    }

    async createFeatureRequest(payload: FeedbackCreateFeatureRequestDto): Promise<FeedbackSubmissionDetailDto> {
        const formData = this.buildFeedbackFeatureFormData(payload);
        try {
            const response = await firstValueFrom(
                this.http.post<any>(`${this.usuariosBaseUrl}/me/feature-requests`, formData, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeFeedbackSubmissionDetail(response, 'feature');
        } catch (error) {
            throw this.toApiError(error, 'No se pudo enviar la petición de funcionalidad');
        }
    }

    async listMyFeatureRequests(limit: number = 25, offset: number = 0): Promise<FeedbackListResponseDto> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/me/feature-requests`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.buildPaginationParams(limit, offset),
                })
            );
            return this.normalizeFeedbackListResponse(response, 'feature', limit, offset);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar tu historial de peticiones');
        }
    }

    async getMyFeatureRequest(id: number): Promise<FeedbackSubmissionDetailDto> {
        const normalizedId = this.normalizeFeedbackSubmissionId(id);
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/me/feature-requests/${normalizedId}`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeFeedbackSubmissionDetail(response, 'feature');
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar el detalle de la petición');
        }
    }

    async listPublicFeatureRequests(limit: number = 25, offset: number = 0): Promise<FeedbackListResponseDto> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/feature-requests/public`, {
                    params: this.buildPaginationParams(limit, offset),
                })
            );
            return this.normalizeFeedbackListResponse(response, 'feature', limit, offset);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar el listado público de peticiones');
        }
    }

    async getFeedbackSubscriptionStates(submissionIds: number[]): Promise<FeedbackSubscriptionStateListResponseDto> {
        const ids = this.normalizeFeedbackSubscriptionIds(submissionIds);
        if (ids.length < 1)
            return { items: [] };

        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/feedback/submissions/subscriptions`, {
                    headers: await this.buildAuthHeaders(),
                    params: { ids: ids.join(',') },
                })
            );
            return {
                items: this.extractListItems(response)
                    .map((item: any) => this.normalizeFeedbackSubscriptionState(item))
                    .filter((item): item is FeedbackSubscriptionStateDto => item !== null),
            };
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar el estado de seguimiento del feedback');
        }
    }

    async setFeedbackSubscription(submissionId: number, subscribed: boolean): Promise<FeedbackSubscriptionResponseDto> {
        const normalizedId = this.normalizeFeedbackSubmissionId(submissionId);
        try {
            const response = await firstValueFrom(
                this.http.put<any>(`${this.usuariosBaseUrl}/feedback/submissions/${normalizedId}/subscription`, {
                    subscribed: subscribed === true,
                }, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeFeedbackSubscriptionResponse(response, normalizedId);
        } catch (error) {
            throw this.toApiError(error, subscribed
                ? 'No se pudo activar el seguimiento del feedback'
                : 'No se pudo desactivar el seguimiento del feedback');
        }
    }

    async downloadFeedbackAttachment(attachmentId: number, filenameHint?: string | null): Promise<string> {
        const normalizedAttachmentId = this.normalizeFeedbackAttachmentId(attachmentId);
        try {
            const response = await firstValueFrom(
                this.http.get(`${this.usuariosBaseUrl}/feedback/attachments/${normalizedAttachmentId}`, {
                    observe: 'response',
                    responseType: 'blob',
                    headers: await this.buildAuthHeaders(),
                })
            );
            const fallbackName = `${`${filenameHint ?? ''}`.trim() || `feedback-attachment-${normalizedAttachmentId}`}`;
            const filename = this.resolveDownloadFilename(response, fallbackName);
            const blob = response.body ?? new Blob([]);
            saveAs(blob, filename);
            return filename;
        } catch (error) {
            throw await this.toApiErrorAsync(error, 'No se pudo descargar el adjunto de feedback');
        }
    }

    async listAdminFeedbackSubmissions(filters: FeedbackAdminListFiltersDto = {}): Promise<FeedbackAdminListResponseDto> {
        const requestedLimit = this.normalizeModerationPageSize(filters?.limit, 25);
        const requestedOffset = this.toNonNegativeInt(filters?.offset, 0) ?? 0;
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/admin/feedback/submissions`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.buildAdminFeedbackQueryParams(filters),
                })
            );
            return this.normalizeAdminFeedbackListResponse(response, filters?.kind ?? 'bug', requestedLimit, requestedOffset);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar la cola admin de feedback');
        }
    }

    async getAdminFeedbackSubmission(id: number): Promise<FeedbackAdminSubmissionDetailDto> {
        const normalizedId = this.normalizeFeedbackSubmissionId(id);
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/admin/feedback/submissions/${normalizedId}`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeAdminFeedbackSubmissionDetail(response, 'bug');
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar el detalle admin del feedback');
        }
    }

    async updateAdminFeedbackSubmission(id: number, payload: FeedbackAdminPatchRequestDto): Promise<FeedbackAdminSubmissionDetailDto> {
        const normalizedId = this.normalizeFeedbackSubmissionId(id);
        const normalizedPayload = this.normalizeFeedbackAdminPatchRequest(payload);
        try {
            const response = await firstValueFrom(
                this.http.patch<any>(`${this.usuariosBaseUrl}/admin/feedback/submissions/${normalizedId}`, normalizedPayload, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeAdminFeedbackSubmissionDetail(response, 'bug');
        } catch (error) {
            throw this.toApiError(error, 'No se pudo actualizar el feedback');
        }
    }

    async listUsers(): Promise<UsuarioListadoItemDto[]> {
        try {
            const response = await firstValueFrom(
                this.http.get<UsuarioListadoItemDto[]>(this.usuariosBaseUrl, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return Array.isArray(response)
                ? response.map((item) => this.normalizeListadoItem(item))
                : [];
        } catch (error) {
            throw this.toApiError(error, 'No se pudo listar usuarios desde API');
        }
    }

    async listModerationCases(includeDeleted: boolean = false): Promise<ModerationCaseListItemDto[]> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/admin/moderation/cases`, {
                    headers: await this.buildAuthHeaders(),
                    params: includeDeleted ? { includeDeleted: 'true' } : {},
                })
            );
            return this.normalizeModerationCasesResponse(response);
        } catch (error) {
            throw this.toApiError(error, 'No se pudieron cargar los supuestos moderables');
        }
    }

    async createModerationCase(payload: ModerationCaseCreateRequestDto): Promise<ModerationCaseListItemDto> {
        const normalizedPayload = this.normalizeModerationCaseCreateRequest(payload);
        try {
            const response = await firstValueFrom(
                this.http.post<any>(`${this.usuariosBaseUrl}/admin/moderation/cases`, normalizedPayload, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeModerationCaseItem(response);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo crear el supuesto moderable');
        }
    }

    async updateModerationCase(caseId: number, payload: ModerationCasePatchRequestDto): Promise<ModerationCaseListItemDto> {
        const normalizedCaseId = this.normalizeModerationCaseId(caseId);
        const normalizedPayload = this.normalizeModerationCasePatchRequest(payload);
        try {
            const response = await firstValueFrom(
                this.http.patch<any>(`${this.usuariosBaseUrl}/admin/moderation/cases/${normalizedCaseId}`, normalizedPayload, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeModerationCaseItem(response);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo actualizar el supuesto moderable');
        }
    }

    async replaceModerationCaseStages(caseId: number, payload: ModerationCaseStagesReplaceRequestDto): Promise<ModerationCaseListItemDto> {
        const normalizedCaseId = this.normalizeModerationCaseId(caseId);
        const normalizedPayload = this.normalizeModerationCaseStagesReplaceRequest(payload);
        try {
            const response = await firstValueFrom(
                this.http.put<any>(`${this.usuariosBaseUrl}/admin/moderation/cases/${normalizedCaseId}/stages`, normalizedPayload, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeModerationCaseItem(response);
        } catch (error) {
            throw this.toApiError(error, 'No se pudieron sustituir las etapas del supuesto moderable');
        }
    }

    async listModerationIncidents(): Promise<ModerationIncidentListItemDto[]> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/admin/moderation/incidents`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeModerationIncidentsResponse(response);
        } catch (error) {
            throw this.toApiError(error, 'No se pudieron cargar las incidencias de moderación');
        }
    }

    async createModerationIncident(payload: ModerationIncidentCreateRequestDto): Promise<ModerationIncidentCreateResponseDto> {
        const normalizedPayload = this.normalizeModerationIncidentCreateRequest(payload);
        try {
            const response = await firstValueFrom(
                this.http.post<any>(`${this.usuariosBaseUrl}/admin/moderation/incidents`, normalizedPayload, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeModerationIncidentCreateResponse(response, normalizedPayload);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo registrar la sanción manual');
        }
    }

    async listModerationSanctions(): Promise<ModerationSanctionListItemDto[]> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/admin/moderation/sanctions`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeModerationSanctionsResponse(response);
        } catch (error) {
            throw this.toApiError(error, 'No se pudieron cargar las sanciones de moderación');
        }
    }

    async revokeModerationSanction(
        uid: string,
        payload: ModerationSanctionRevokeRequestDto = {}
    ): Promise<ModerationSanctionRevokeResponseDto> {
        const normalizedUid = `${uid ?? ''}`.trim();
        if (normalizedUid.length < 1)
            throw new Error('UID inválido');
        const normalizedPayload = this.normalizeModerationSanctionRevokeRequest(payload);
        try {
            const response = await firstValueFrom(
                this.http.delete<any>(`${this.usuariosBaseUrl}/admin/moderation/users/${encodeURIComponent(normalizedUid)}/sanctions`, {
                    body: normalizedPayload,
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeModerationSanctionRevokeResponse(response);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo retirar la sanción activa');
        }
    }

    async getUserModerationHistory(uid: string, limit: number = 10, offset: number = 0): Promise<ModerationAdminHistoryResponseDto> {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            throw new Error('UID inválido');

        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.usuariosBaseUrl}/admin/moderation/users/${encodeURIComponent(uidNormalizado)}/history`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.buildPaginationParams(limit, offset),
                })
            );
            return this.normalizeModerationAdminHistoryResponse(response, uidNormalizado, limit, offset);
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar el historial admin de moderación');
        }
    }

    async listCreationAuditEvents(filters: CreationAuditListFiltersDto = {}): Promise<CreationAuditListResponseDto> {
        try {
            const response = await firstValueFrom(
                this.http.get<CreationAuditListResponseDto>(`${this.usuariosBaseUrl}/admin/creation-audit`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.buildCreationAuditQueryParams(filters),
                })
            );
            return {
                items: Array.isArray(response?.items) ? response.items : [],
                total: this.toNonNegativeInt(response?.total, 0) ?? 0,
                limit: this.toNonNegativeInt(response?.limit, 25) ?? 25,
                offset: this.toNonNegativeInt(response?.offset, 0) ?? 0,
                hasMore: response?.hasMore === true,
            };
        } catch (error) {
            throw this.toApiError(error, 'No se pudo listar la auditoría de creaciones');
        }
    }

    async getCreationAuditEventDetail(eventId: string): Promise<CreationAuditEventDetailDto> {
        const normalizedEventId = `${eventId ?? ''}`.trim();
        if (normalizedEventId.length < 1)
            throw new Error('Evento de auditoría inválido');

        try {
            return await firstValueFrom(
                this.http.get<CreationAuditEventDetailDto>(`${this.usuariosBaseUrl}/admin/creation-audit/${encodeURIComponent(normalizedEventId)}`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar el detalle de auditoría');
        }
    }

    async upsertUser(payload: UsuarioUpsertRequestDto): Promise<UsuarioUpsertResponseDto> {
        const normalizedPayload: UsuarioUpsertRequestDto = {
            uid: `${payload?.uid ?? ''}`.trim() || undefined,
            displayName: `${payload?.displayName ?? ''}`.trim(),
            email: `${payload?.email ?? ''}`.trim(),
            authProvider: payload?.authProvider ?? 'otro',
            role: payload?.role,
            permissionsCreate: Array.isArray(payload?.permissionsCreate)
                ? payload.permissionsCreate.map((item) => ({
                    resource: `${item?.resource ?? ''}`.trim(),
                    allowed: item?.allowed === true,
                }))
                : undefined,
        };

        try {
            return await firstValueFrom(
                this.http.post<UsuarioUpsertResponseDto>(this.usuariosBaseUrl, normalizedPayload, {
                    headers: await this.buildAuthHeaders(),
                })
            );
        } catch (error) {
            throw this.toApiError(error, 'No se pudo persistir usuario en API');
        }
    }

    async downloadUsersBackupZip(): Promise<string> {
        try {
            const response = await firstValueFrom(
                this.http.get(`${this.usuariosBaseUrl}/backup`, {
                    observe: 'response',
                    responseType: 'blob',
                    headers: await this.buildAuthHeaders(),
                })
            );
            const filename = this.resolveDownloadFilename(response, 'rol-backup.zip');
            const blob = response.body ?? new Blob([], { type: 'application/zip' });
            saveAs(blob, filename);
            return filename;
        } catch (error) {
            throw await this.toApiErrorAsync(error, 'No se pudo descargar el backup SQL');
        }
    }

    private toApiError(error: any, fallbackMessage: string): Error {
        if (error instanceof HttpErrorResponse) {
            const message = this.extractErrorMessage(error.error)
                || `${fallbackMessage} (HTTP ${error.status || '0'})`;
            const mapped = new Error(message);
            (mapped as any).status = error.status || 0;
            (mapped as any).code = error.status === 403
                ? 'FORBIDDEN'
                : error.status === 401
                    ? 'UNAUTHORIZED'
                    : '';
            (mapped as any).cause = error;
            return mapped;
        }
        const mapped = new Error(fallbackMessage);
        (mapped as any).status = Number(error?.status ?? 0) || 0;
        (mapped as any).code = `${error?.code ?? ''}`.trim().toUpperCase();
        (mapped as any).cause = error;
        return mapped;
    }

    private async toApiErrorAsync(error: any, fallbackMessage: string): Promise<Error> {
        if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
            try {
                const blobText = (await error.error.text()).trim();
                if (blobText.length > 0) {
                    try {
                        const parsed = JSON.parse(blobText);
                        const message = this.extractErrorMessage(parsed)
                            || `${fallbackMessage} (HTTP ${error.status || '0'})`;
                        return new Error(message);
                    } catch {
                        return new Error(blobText);
                    }
                }
            } catch {
                // Si falla la lectura del blob, se usa el fallback estándar.
            }
        }

        return this.toApiError(error, fallbackMessage);
    }

    private extractErrorMessage(errorBody: any): string {
        if (!errorBody)
            return '';

        if (typeof errorBody === 'string') {
            const message = errorBody.trim();
            return message.length > 0 ? message : '';
        }

        if (typeof errorBody === 'object') {
            const knownMessage = `${errorBody?.message ?? errorBody?.error ?? ''}`.trim();
            if (knownMessage.length > 0)
                return knownMessage;

            const firstEntry = Object.entries(errorBody as Record<string, any>)[0];
            if (!firstEntry)
                return '';

            const [key, value] = firstEntry;
            const valueText = `${value ?? ''}`.trim();
            if (valueText.length > 0)
                return `${key}: ${valueText}`;
            return `${key}`.trim();
        }

        return '';
    }

    private resolveDownloadFilename(response: HttpResponse<Blob>, fallback: string): string {
        const contentDisposition = `${response.headers.get('Content-Disposition') ?? ''}`.trim();
        if (contentDisposition.length < 1)
            return fallback;

        const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (utf8Match?.[1]) {
            try {
                return decodeURIComponent(utf8Match[1]).trim() || fallback;
            } catch {
                return utf8Match[1].trim() || fallback;
            }
        }

        const asciiMatch = contentDisposition.match(/filename\s*=\s*"?([^\";]+)"?/i);
        return asciiMatch?.[1]?.trim() || fallback;
    }

    private buildCreationAuditQueryParams(filters: CreationAuditListFiltersDto): Record<string, string> {
        const params: Record<string, string> = {};

        const actorUid = `${filters?.actorUid ?? ''}`.trim();
        if (actorUid.length > 0)
            params['actorUid'] = actorUid;

        const actionCode = `${filters?.actionCode ?? ''}`.trim();
        if (actionCode.length > 0)
            params['actionCode'] = actionCode;

        const result = `${filters?.result ?? ''}`.trim();
        if (result.length > 0)
            params['result'] = result;

        const resourceType = `${filters?.resourceType ?? ''}`.trim();
        if (resourceType.length > 0)
            params['resourceType'] = resourceType;

        const from = `${filters?.from ?? ''}`.trim();
        if (from.length > 0)
            params['from'] = from;

        const to = `${filters?.to ?? ''}`.trim();
        if (to.length > 0)
            params['to'] = to;

        const limit = this.toNonNegativeInt(filters?.limit, null);
        if (limit !== null)
            params['limit'] = `${this.normalizeModerationPageSize(limit, 25)}`;

        const offset = this.toNonNegativeInt(filters?.offset, null);
        if (offset !== null)
            params['offset'] = `${offset}`;

        return params;
    }

    private buildAclQueryParams(historyLimit?: number | null): Record<string, string> {
        const params: Record<string, string> = {};
        const limit = this.toNonNegativeInt(historyLimit, null);
        if (limit !== null && limit > 0)
            params['historyLimit'] = `${Math.min(20, limit)}`;
        return params;
    }

    private buildAdminFeedbackQueryParams(filters: FeedbackAdminListFiltersDto): Record<string, string> {
        const params: Record<string, string> = {};
        const kind = this.normalizeOptionalFeedbackKind(filters?.kind);
        if (kind)
            params['kind'] = kind;

        const status = this.normalizeOptionalFeedbackStatus(filters?.status);
        if (status)
            params['status'] = status;

        const reporterUid = `${filters?.reporterUid ?? ''}`.trim();
        if (reporterUid.length > 0)
            params['reporterUid'] = reporterUid;

        const limit = this.toNonNegativeInt(filters?.limit, null);
        if (limit !== null)
            params['limit'] = `${limit}`;

        const offset = this.toNonNegativeInt(filters?.offset, null);
        if (offset !== null)
            params['offset'] = `${offset}`;

        return params;
    }

    private buildFeedbackBugFormData(payload: FeedbackCreateBugRequestDto): FormData {
        const normalized = this.normalizeFeedbackBugRequest(payload);
        const formData = new FormData();
        formData.append('description', normalized.description);
        if (normalized.title)
            formData.append('title', normalized.title);
        if (normalized.pageUrl)
            formData.append('pageUrl', normalized.pageUrl);
        if (normalized.stepsToReproduce)
            formData.append('stepsToReproduce', normalized.stepsToReproduce);
        if (normalized.expectedBehavior)
            formData.append('expectedBehavior', normalized.expectedBehavior);
        if (normalized.actualBehavior)
            formData.append('actualBehavior', normalized.actualBehavior);
        normalized.images.forEach((image) => formData.append('images[]', image, image.name));
        return formData;
    }

    private buildFeedbackFeatureFormData(payload: FeedbackCreateFeatureRequestDto): FormData {
        const normalized = this.normalizeFeedbackFeatureRequest(payload);
        const formData = new FormData();
        formData.append('description', normalized.description);
        if (normalized.title)
            formData.append('title', normalized.title);
        if (normalized.pageUrl)
            formData.append('pageUrl', normalized.pageUrl);
        if (normalized.useCase)
            formData.append('useCase', normalized.useCase);
        if (normalized.desiredOutcome)
            formData.append('desiredOutcome', normalized.desiredOutcome);
        normalized.images.forEach((image) => formData.append('images[]', image, image.name));
        return formData;
    }

    private normalizeFeedbackBugRequest(payload: FeedbackCreateBugRequestDto): {
        description: string;
        title: string | null;
        pageUrl: string | null;
        stepsToReproduce: string | null;
        expectedBehavior: string | null;
        actualBehavior: string | null;
        images: File[];
    } {
        const description = this.toNullableMultilineText(payload?.description);
        if (!description)
            throw new Error('Debes indicar la descripción del bug');

        return {
            description,
            title: this.toNullableText(payload?.title),
            pageUrl: this.toNullableText(payload?.pageUrl),
            stepsToReproduce: this.toNullableMultilineText(payload?.stepsToReproduce),
            expectedBehavior: this.toNullableMultilineText(payload?.expectedBehavior),
            actualBehavior: this.toNullableMultilineText(payload?.actualBehavior),
            images: this.normalizeFeedbackImages(payload?.images),
        };
    }

    private normalizeFeedbackFeatureRequest(payload: FeedbackCreateFeatureRequestDto): {
        description: string;
        title: string | null;
        pageUrl: string | null;
        useCase: string | null;
        desiredOutcome: string | null;
        images: File[];
    } {
        const description = this.toNullableMultilineText(payload?.description);
        if (!description)
            throw new Error('Debes indicar la descripción de la petición');

        return {
            description,
            title: this.toNullableText(payload?.title),
            pageUrl: this.toNullableText(payload?.pageUrl),
            useCase: this.toNullableMultilineText(payload?.useCase),
            desiredOutcome: this.toNullableMultilineText(payload?.desiredOutcome),
            images: this.normalizeFeedbackImages(payload?.images),
        };
    }

    private normalizeFeedbackImages(images: File[] | null | undefined): File[] {
        if (!Array.isArray(images))
            return [];
        return images.filter((image) => image instanceof File);
    }

    private normalizeFeedbackAdminPatchRequest(payload: FeedbackAdminPatchRequestDto): FeedbackAdminPatchRequestDto {
        const normalized: FeedbackAdminPatchRequestDto = {};
        const status = this.normalizeOptionalFeedbackStatus(payload?.status);
        if (status)
            normalized.status = status;

        const priority = this.normalizeOptionalFeedbackPriority(payload?.priority);
        if (priority || payload?.priority === null)
            normalized.priority = priority;

        if (payload?.internalComment !== undefined)
            normalized.internalComment = this.toNullableMultilineText(payload?.internalComment);
        if (payload?.publicMessage !== undefined)
            normalized.publicMessage = this.toNullableMultilineText(payload?.publicMessage);

        return normalized;
    }

    private normalizeFeedbackListResponse(
        raw: any,
        fallbackKind: FeedbackKind,
        requestedLimit: number,
        requestedOffset: number
    ): FeedbackListResponseDto {
        const rawItems = this.extractListItems(raw);
        const items = rawItems.map((item) => this.normalizeFeedbackSubmissionSummary(item, fallbackKind));
        const limit = this.normalizeModerationPageSize(raw?.limit, requestedLimit);
        const offset = this.toNonNegativeInt(raw?.offset, requestedOffset) ?? requestedOffset;
        const total = this.toNonNegativeInt(raw?.total, items.length) ?? items.length;

        return {
            items,
            total,
            limit,
            offset,
            hasMore: raw?.hasMore === true || offset + items.length < total,
        };
    }

    private normalizeAdminFeedbackListResponse(
        raw: any,
        fallbackKind: FeedbackKind,
        requestedLimit: number,
        requestedOffset: number
    ): FeedbackAdminListResponseDto {
        const rawItems = this.extractListItems(raw);
        const items = rawItems.map((item) => this.normalizeAdminFeedbackSubmissionSummary(item, fallbackKind));
        const limit = this.normalizeModerationPageSize(raw?.limit, requestedLimit);
        const offset = this.toNonNegativeInt(raw?.offset, requestedOffset) ?? requestedOffset;
        const total = this.toNonNegativeInt(raw?.total, items.length) ?? items.length;

        return {
            items,
            total,
            limit,
            offset,
            hasMore: raw?.hasMore === true || offset + items.length < total,
        };
    }

    private normalizeFeedbackSubmissionSummary(raw: any, fallbackKind: FeedbackKind): FeedbackSubmissionSummaryDto {
        return {
            id: this.normalizeFeedbackSubmissionId(raw?.id ?? raw?.submissionId),
            kind: this.normalizeFeedbackKind(raw?.kind, fallbackKind),
            status: this.normalizeFeedbackStatus(raw?.status),
            priority: this.normalizeFeedbackPriority(raw?.priority),
            title: this.toNullableText(raw?.title),
            description: this.toNullableMultilineText(raw?.description) ?? '',
            pageUrl: this.toNullableText(raw?.pageUrl),
            details: this.normalizeFeedbackDetails(raw?.details),
            createdAtUtc: this.toNullableText(raw?.createdAtUtc),
            updatedAtUtc: this.toNullableText(raw?.updatedAtUtc),
        };
    }

    private normalizeFeedbackSubmissionDetail(raw: any, fallbackKind: FeedbackKind): FeedbackSubmissionDetailDto {
        const summary = this.normalizeFeedbackSubmissionSummary(raw, fallbackKind);
        return {
            ...summary,
            attachments: Array.isArray(raw?.attachments)
                ? raw.attachments.map((item: any) => this.normalizeFeedbackAttachment(item))
                : [],
            updates: Array.isArray(raw?.updates)
                ? raw.updates.map((item: any) => this.normalizeFeedbackUpdate(item))
                : [],
        };
    }

    private normalizeAdminFeedbackSubmissionSummary(raw: any, fallbackKind: FeedbackKind): FeedbackAdminSubmissionSummaryDto {
        return {
            ...this.normalizeFeedbackSubmissionSummary(raw, fallbackKind),
            reporter: this.normalizeFeedbackActorSummary(raw?.reporter),
        };
    }

    private normalizeAdminFeedbackSubmissionDetail(raw: any, fallbackKind: FeedbackKind): FeedbackAdminSubmissionDetailDto {
        const summary = this.normalizeAdminFeedbackSubmissionSummary(raw, fallbackKind);
        return {
            ...summary,
            attachments: Array.isArray(raw?.attachments)
                ? raw.attachments.map((item: any) => this.normalizeFeedbackAttachment(item))
                : [],
            updates: Array.isArray(raw?.updates)
                ? raw.updates.map((item: any) => this.normalizeFeedbackAdminUpdate(item))
                : [],
        };
    }

    private normalizeFeedbackDetails(raw: any): FeedbackDetailsDto {
        return {
            stepsToReproduce: this.toNullableMultilineText(raw?.stepsToReproduce),
            expectedBehavior: this.toNullableMultilineText(raw?.expectedBehavior),
            actualBehavior: this.toNullableMultilineText(raw?.actualBehavior),
            useCase: this.toNullableMultilineText(raw?.useCase),
            desiredOutcome: this.toNullableMultilineText(raw?.desiredOutcome),
        };
    }

    private normalizeFeedbackAttachment(raw: any): FeedbackAttachmentDto {
        return {
            id: this.normalizeFeedbackAttachmentId(raw?.id ?? raw?.attachmentId),
            filename: this.toNullableText(raw?.filename),
            mimeType: this.toNullableText(raw?.mimeType) ?? 'application/octet-stream',
            sizeBytes: this.toNonNegativeInt(raw?.sizeBytes, 0) ?? 0,
            createdAtUtc: this.toNullableText(raw?.createdAtUtc),
            url: this.toNullableText(raw?.url) ?? '',
        };
    }

    private normalizeFeedbackUpdate(raw: any): FeedbackUpdateDto {
        return {
            status: this.normalizeFeedbackStatus(raw?.status),
            publicMessage: this.toNullableMultilineText(raw?.publicMessage),
            createdAtUtc: this.toNullableText(raw?.createdAtUtc),
        };
    }

    private normalizeFeedbackAdminUpdate(raw: any): FeedbackUpdateAdminDto {
        return {
            ...this.normalizeFeedbackUpdate(raw),
            internalComment: this.toNullableMultilineText(raw?.internalComment),
            actor: this.normalizeFeedbackActorSummary(raw?.actor),
        };
    }

    private normalizeFeedbackActorSummary(raw: any): FeedbackActorSummaryDto {
        return {
            userId: this.toNullableText(raw?.userId),
            uid: this.toNullableText(raw?.uid),
            displayName: this.toNullableText(raw?.displayName),
        };
    }

    private normalizeFeedbackSubscriptionIds(values: number[]): number[] {
        if (!Array.isArray(values))
            return [];
        const ids = new Set<number>();
        values.forEach((value) => {
            const id = this.toPositiveInt(value);
            if (id)
                ids.add(id);
        });
        return Array.from(ids).slice(0, 100);
    }

    private normalizeFeedbackSubscriptionState(raw: any): FeedbackSubscriptionStateDto | null {
        const submissionId = this.toPositiveInt(raw?.submissionId ?? raw?.id);
        if (!submissionId)
            return null;
        return {
            submissionId,
            subscribed: raw?.subscribed === true,
            canSubscribe: raw?.canSubscribe === true,
        };
    }

    private normalizeFeedbackSubscriptionResponse(raw: any, fallbackId: number): FeedbackSubscriptionResponseDto {
        return {
            submissionId: this.toPositiveInt(raw?.submissionId ?? raw?.id) ?? fallbackId,
            subscribed: raw?.subscribed === true,
        };
    }

    private normalizeFeedbackKind(value: any, fallback: FeedbackKind): FeedbackKind {
        return `${value ?? ''}`.trim().toLowerCase() === 'bug' ? 'bug' : fallback;
    }

    private normalizeOptionalFeedbackKind(value: any): FeedbackKind | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'bug' || normalized === 'feature')
            return normalized;
        return null;
    }

    private normalizeFeedbackStatus(value: any): FeedbackStatus {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'triaged' || normalized === 'planned' || normalized === 'in_progress'
            || normalized === 'resolved' || normalized === 'closed' || normalized === 'rejected')
            return normalized;
        return 'submitted';
    }

    private normalizeOptionalFeedbackStatus(value: any): FeedbackStatus | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'submitted' || normalized === 'triaged' || normalized === 'planned' || normalized === 'in_progress'
            || normalized === 'resolved' || normalized === 'closed' || normalized === 'rejected')
            return normalized;
        return null;
    }

    private normalizeFeedbackPriority(value: any): FeedbackPriority | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'low' || normalized === 'medium' || normalized === 'high' || normalized === 'critical')
            return normalized;
        return null;
    }

    private normalizeOptionalFeedbackPriority(value: any): FeedbackPriority | null {
        return this.normalizeFeedbackPriority(value);
    }

    private normalizeFeedbackSubmissionId(value: any): number {
        const normalized = this.toPositiveInt(value);
        if (!normalized)
            throw new Error('Envío de feedback inválido');
        return normalized;
    }

    private normalizeFeedbackAttachmentId(value: any): number {
        const normalized = this.toPositiveInt(value);
        if (!normalized)
            throw new Error('Adjunto de feedback inválido');
        return normalized;
    }

    private normalizeAdminPolicyDraft(raw: any, fallbackKind: UserCompliancePolicyKind): AdminPolicyDraftDto {
        const normalizedKind = this.normalizePolicyKind(raw?.kind ?? raw?.policyKind ?? fallbackKind);
        return {
            kind: normalizedKind,
            title: this.toNullableText(raw?.title ?? raw?.name),
            markdown: this.toNullableMultilineText(raw?.markdown ?? raw?.content ?? raw?.body),
            version: this.toNullableText(raw?.version ?? raw?.versionTag ?? raw?.versionCode),
            publishedAtUtc: this.toNullableText(raw?.publishedAtUtc ?? raw?.effectiveAtUtc ?? raw?.activeSinceUtc),
            updatedAtUtc: this.toNullableText(raw?.updatedAtUtc ?? raw?.modifiedAtUtc ?? raw?.draftUpdatedAtUtc),
        };
    }

    private normalizeAdminPolicyDraftUpdatePayload(payload: AdminPolicyDraftUpdateRequestDto): AdminPolicyDraftUpdateRequestDto {
        const title = `${payload?.title ?? ''}`.trim();
        const markdown = `${payload?.markdown ?? ''}`.trim();
        if (title.length < 1)
            throw new Error('El título de la política es obligatorio');
        if (markdown.length < 1)
            throw new Error('El contenido de la política es obligatorio');
        return { title, markdown };
    }

    private normalizeActivePolicy(raw: any, fallbackKind: UserCompliancePolicyKind): UserComplianceActivePolicy {
        const normalizedKind = this.normalizePolicyKind(raw?.kind ?? raw?.policyKind ?? fallbackKind);
        return {
            kind: normalizedKind,
            version: this.toNullableText(raw?.version ?? raw?.versionTag ?? raw?.versionCode),
            title: this.toNullableText(raw?.title ?? raw?.name),
            markdown: this.toNullableMultilineText(raw?.markdown ?? raw?.content ?? raw?.body) ?? '',
            publishedAtUtc: this.toNullableText(raw?.publishedAtUtc ?? raw?.effectiveAtUtc ?? raw?.activeSinceUtc),
        };
    }

    private normalizeModerationCasesResponse(raw: any): ModerationCaseListItemDto[] {
        return this.extractListItems(raw)
            .map((item) => this.normalizeModerationCaseItem(item))
            .filter((item) => item.caseId > 0 || !!item.code || !!item.name);
    }

    private normalizeModerationCaseItem(raw: any): ModerationCaseListItemDto {
        const isDeleted = raw?.deleted === true || raw?.isDeleted === true;
        return {
            caseId: this.toPositiveInt(raw?.caseId ?? raw?.id) ?? 0,
            code: this.toNullableText(raw?.caseCode ?? raw?.code),
            name: this.toNullableText(raw?.caseName ?? raw?.name ?? raw?.title),
            description: this.toNullableMultilineText(raw?.description),
            sourceMode: this.normalizeModerationCaseSourceMode(raw?.sourceMode ?? raw?.mode),
            enabled: raw?.enabled !== false,
            originType: this.normalizeModerationCaseOriginType(raw?.originType),
            isDeletable: raw?.isDeletable === true,
            isDeleted,
            deletedAtUtc: this.toNullableText(raw?.deletedAtUtc),
            createdAtUtc: this.toNullableText(raw?.createdAtUtc),
            updatedAtUtc: this.toNullableText(raw?.updatedAtUtc),
            deleted: isDeleted,
            stages: this.extractListItems(raw?.stages)
                .map((stage, index) => this.normalizeModerationCaseStage(stage, index)),
        };
    }

    private normalizeModerationCaseStage(raw: any, index: number): ModerationCaseStageDto {
        const durationMinutes = this.normalizeModerationCaseStageDurationMinutes(raw);
        return {
            stageId: this.toPositiveInt(raw?.stageId ?? raw?.id),
            stageIndex: this.toPositiveInt(raw?.stageIndex) ?? (index + 1),
            reportThreshold: this.toNonNegativeInt(raw?.reportThreshold, null),
            sanctionKind: this.toNullableText(raw?.sanctionKind ?? raw?.kind ?? raw?.type),
            sanctionCode: this.toNullableText(raw?.sanctionCode ?? raw?.code),
            sanctionName: this.toNullableText(raw?.sanctionName ?? raw?.name ?? raw?.title ?? raw?.label),
            durationMinutes,
            durationDays: this.toNonNegativeInt(raw?.durationDays, null) ?? this.minutesToWholeDays(durationMinutes),
            durationHours: this.toNonNegativeInt(raw?.durationHours, null) ?? this.minutesToWholeHours(durationMinutes),
            isPermanent: raw?.isPermanent === true || raw?.permanent === true,
        };
    }

    private normalizeModerationIncidentsResponse(raw: any): ModerationIncidentListItemDto[] {
        return this.extractListItems(raw)
            .map((item) => this.normalizeModerationIncidentItem(item))
            .filter((item) => item.incidentId > 0);
    }

    private normalizeModerationIncidentItem(raw: any): ModerationIncidentListItemDto {
        return {
            incidentId: this.toPositiveInt(raw?.incidentId ?? raw?.id) ?? 0,
            targetUid: this.toNullableText(raw?.targetUid ?? raw?.uid ?? raw?.userUid ?? raw?.target?.uid),
            targetDisplayName: this.toNullableText(raw?.targetDisplayName ?? raw?.displayName ?? raw?.target?.displayName),
            caseId: this.toPositiveInt(raw?.caseId),
            caseCode: this.toNullableText(raw?.caseCode ?? raw?.case?.code),
            caseName: this.toNullableText(raw?.caseName ?? raw?.case?.name ?? raw?.case?.title),
            mode: this.toNullableText(raw?.mode),
            result: this.normalizeModerationResult(raw?.result),
            confirmedAtUtc: this.toNullableText(raw?.confirmedAtUtc),
            createdAtUtc: this.toNullableText(raw?.createdAtUtc),
            userVisibleMessage: this.toNullableMultilineText(raw?.userVisibleMessage),
            internalDescription: this.toNullableMultilineText(raw?.internalDescription),
            sanction: this.normalizeModerationSanction(raw?.sanction),
        };
    }

    private normalizeModerationSanctionsResponse(raw: any): ModerationSanctionListItemDto[] {
        return this.extractListItems(raw)
            .map((item) => this.normalizeModerationSanctionItem(item))
            .filter((item) => item.sanctionId > 0);
    }

    private normalizeModerationSanctionRevokeResponse(raw: any): ModerationSanctionRevokeResponseDto {
        return {
            revoked: raw?.revoked !== false,
            sanction: this.normalizeModerationSanction(raw?.sanction),
            activeSanction: this.normalizeModerationSanction(raw?.activeSanction),
            banned: raw?.banned === true,
        };
    }

    private normalizeModerationIncidentCreateResponse(
        raw: any,
        request: ModerationIncidentCreateRequestDto
    ): ModerationIncidentCreateResponseDto {
        return {
            deduped: raw?.deduped === true,
            incident: this.normalizeModerationIncidentItem(raw?.incident ?? {
                targetUid: request.targetUid,
                caseCode: request.caseCode,
                mode: request.mode,
                userVisibleMessage: request.userVisibleMessage,
                internalDescription: request.internalDescription,
            }),
            stage: raw?.stage ? this.normalizeModerationCaseStage(raw.stage, 0) : null,
            sanction: this.normalizeModerationSanction(raw?.sanction),
            activeSanction: this.normalizeModerationSanction(raw?.activeSanction),
            progress: this.normalizeModerationCaseProgress(raw?.progress),
            banned: raw?.banned === true,
        };
    }

    private normalizeModerationSanctionItem(raw: any): ModerationSanctionListItemDto {
        const sanction = this.normalizeModerationSanction(raw) ?? {
            sanctionId: this.toPositiveInt(raw?.sanctionId ?? raw?.id),
            kind: this.toNullableText(raw?.kind ?? raw?.sanctionKind ?? raw?.type),
            code: this.toNullableText(raw?.code ?? raw?.sanctionCode),
            name: this.toNullableText(raw?.name ?? raw?.title ?? raw?.label),
            startsAtUtc: this.toNullableText(raw?.startsAtUtc ?? raw?.startAtUtc ?? raw?.appliedAtUtc),
            endsAtUtc: this.toNullableText(raw?.endsAtUtc ?? raw?.endAtUtc ?? raw?.expiresAtUtc),
            isPermanent: raw?.isPermanent === true || raw?.permanent === true || raw?.endsAtUtc === null,
        };

        return {
            sanctionId: sanction.sanctionId ?? 0,
            targetUid: this.toNullableText(raw?.targetUid ?? raw?.uid ?? raw?.userUid ?? raw?.target?.uid),
            targetDisplayName: this.toNullableText(raw?.targetDisplayName ?? raw?.displayName ?? raw?.target?.displayName),
            caseId: this.toPositiveInt(raw?.caseId),
            caseCode: this.toNullableText(raw?.caseCode ?? raw?.case?.code),
            caseName: this.toNullableText(raw?.caseName ?? raw?.case?.name ?? raw?.case?.title),
            kind: sanction.kind,
            code: sanction.code,
            name: sanction.name,
            startsAtUtc: sanction.startsAtUtc,
            endsAtUtc: sanction.endsAtUtc,
            isPermanent: sanction.isPermanent,
            active: raw?.active === true || raw?.isActive === true,
        };
    }

    private normalizeModerationAdminHistoryResponse(
        raw: any,
        fallbackUid: string,
        requestedLimit: number,
        requestedOffset: number
    ): ModerationAdminHistoryResponseDto {
        const items = this.extractListItems(raw?.items ?? raw)
            .map((item) => this.normalizeModerationAdminHistoryItem(item));
        const limit = this.normalizeModerationPageSize(raw?.limit, requestedLimit);
        const offset = this.toNonNegativeInt(raw?.offset, requestedOffset) ?? requestedOffset;
        const total = this.toNonNegativeInt(raw?.total, items.length) ?? items.length;

        return {
            userId: this.toNullableText(raw?.userId),
            uid: this.toNullableText(raw?.uid) ?? fallbackUid,
            displayName: this.toNullableText(raw?.displayName),
            email: this.toNullableText(raw?.email),
            authProvider: raw?.authProvider ? this.normalizeAuthProvider(raw?.authProvider) : null,
            banned: raw?.banned === true,
            moderationSummary: this.normalizeModerationSummary(raw?.moderationSummary),
            progressByCase: this.extractListItems(raw?.progressByCase ?? raw?.caseProgress)
                .map((item) => this.normalizeModerationProgressCase(item)),
            items,
            total,
            limit,
            offset,
            hasMore: raw?.hasMore === true || offset + items.length < total,
        };
    }

    private normalizeModerationProgressCase(raw: any): ModerationProgressCaseDto {
        return {
            caseId: this.toPositiveInt(raw?.caseId),
            caseCode: this.toNullableText(raw?.caseCode ?? raw?.case?.code),
            caseName: this.toNullableText(raw?.caseName ?? raw?.case?.name ?? raw?.case?.title),
            currentStageIndex: this.toNonNegativeInt(raw?.currentStageIndex ?? raw?.stageIndex, null),
            pendingReports: this.toNonNegativeInt(raw?.pendingReports ?? raw?.pendingCount, null),
            activeSanction: this.normalizeModerationSanction(raw?.activeSanction),
        };
    }

    private normalizeModerationCaseProgress(raw: any): ModerationCaseProgressDto | null {
        if (!raw || typeof raw !== 'object')
            return null;

        return {
            caseId: this.toPositiveInt(raw?.caseId),
            caseCode: this.toNullableText(raw?.caseCode ?? raw?.case?.code),
            caseName: this.toNullableText(raw?.name ?? raw?.caseName ?? raw?.case?.name ?? raw?.case?.title),
            currentStageIndex: this.toNonNegativeInt(raw?.currentStageIndex, null),
            pendingReportCount: this.toNonNegativeInt(raw?.pendingReportCount, null),
            completedStageCount: this.toNonNegativeInt(raw?.completedStageCount, null),
            lastIncidentAtUtc: this.toNullableText(raw?.lastIncidentAtUtc),
            lastActionAtUtc: this.toNullableText(raw?.lastActionAtUtc),
        };
    }

    private normalizeModerationAdminHistoryItem(raw: any): ModerationAdminHistoryItemDto {
        const base = this.normalizeModerationHistoryItem(raw);
        return {
            ...base,
            targetUid: this.toNullableText(raw?.targetUid ?? raw?.uid ?? raw?.userUid ?? raw?.target?.uid),
            targetDisplayName: this.toNullableText(raw?.targetDisplayName ?? raw?.displayName ?? raw?.target?.displayName),
            internalDescription: this.toNullableMultilineText(raw?.internalDescription),
            context: this.toNullableObject(raw?.context),
            dedupKey: this.toNullableText(raw?.dedupKey),
            progressBefore: this.toNullableObject(raw?.progressBefore),
            progressAfter: this.toNullableObject(raw?.progressAfter),
            clientDate: this.toNullableText(raw?.clientDate),
            localBlockCountToday: this.toNonNegativeInt(raw?.localBlockCountToday, null),
            triggeredStageIndex: this.toNonNegativeInt(raw?.triggeredStageIndex, null),
            triggeredSanctionId: this.toPositiveInt(raw?.triggeredSanctionId),
        };
    }

    private normalizeListadoItem(raw: any): UsuarioListadoItemDto {
        const moderationSummary = this.normalizeModerationSummary(raw?.moderationSummary);
        const moderationStatus = this.normalizeModerationStatus(
            raw?.moderationStatus,
            raw?.banned === true,
            moderationSummary
        );
        return {
            userId: `${raw?.userId ?? ''}`.trim(),
            uid: `${raw?.uid ?? ''}`.trim(),
            displayName: this.toNullableText(raw?.displayName),
            email: this.toNullableText(raw?.email),
            authProvider: this.normalizeAuthProvider(raw?.authProvider),
            role: this.normalizeUserRole(raw?.role),
            admin: raw?.admin === true || `${raw?.role ?? ''}`.trim().toLowerCase() === 'admin',
            banned: raw?.banned === true || moderationStatus === 'blocked' || moderationStatus === 'banned',
            moderationStatus,
            updatedAtUtc: this.toNullableText(raw?.updatedAtUtc),
            updatedByUserId: this.toNullableText(raw?.updatedByUserId),
            permissionsCreate: this.normalizePermissionsCreate(raw?.permissionsCreate),
            moderationSummary,
        };
    }

    private normalizeAclResponse(raw: any, fallbackUid: string): UsuarioAclResponseDto {
        const moderationSummary = this.normalizeModerationSummary(raw?.moderationSummary);
        const moderationStatus = this.normalizeModerationStatus(
            raw?.moderationStatus,
            raw?.banned === true,
            moderationSummary
        );
        return {
            userId: this.toNullableText(raw?.userId),
            uid: this.toNullableText(raw?.uid) ?? fallbackUid,
            displayName: this.toNullableText(raw?.displayName),
            email: this.toNullableText(raw?.email),
            authProvider: raw?.authProvider ? this.normalizeAuthProvider(raw?.authProvider) : null,
            role: this.normalizeUserRole(raw?.role),
            admin: raw?.admin === true || `${raw?.role ?? ''}`.trim().toLowerCase() === 'admin',
            banned: raw?.banned === true || moderationStatus === 'blocked' || moderationStatus === 'banned',
            moderationStatus,
            permissionsCreate: this.normalizePermissionsCreate(raw?.permissionsCreate),
            moderationSummary,
            recentModerationHistory: Array.isArray(raw?.recentModerationHistory)
                ? raw.recentModerationHistory.map((item: any) => this.normalizeModerationHistoryItem(item))
                : [],
        };
    }

    private normalizePermissionsCreate(raw: any): UsuarioListadoItemDto['permissionsCreate'] {
        if (!Array.isArray(raw))
            return [];

        return raw
            .map((item) => ({
                resource: `${item?.resource ?? ''}`.trim(),
                allowed: item?.allowed === true,
            }))
            .filter((item) => item.resource.length > 0);
    }

    private normalizeModerationSummary(raw: any): UserModerationSummary | null {
        if (!raw || typeof raw !== 'object')
            return null;

        return {
            incidentCount: this.toNonNegativeInt(raw?.incidentCount, 0) ?? 0,
            sanctionCount: this.toNonNegativeInt(raw?.sanctionCount, 0) ?? 0,
            lastIncidentAtUtc: this.toNullableText(raw?.lastIncidentAtUtc),
            lastSanctionAtUtc: this.toNullableText(raw?.lastSanctionAtUtc),
            activeSanction: this.normalizeModerationSanction(raw?.activeSanction),
        };
    }

    private normalizeModerationHistoryItem(raw: any): UserModerationHistoryItem {
        return {
            incidentId: this.toPositiveInt(raw?.incidentId) ?? 0,
            caseId: this.toPositiveInt(raw?.caseId),
            caseCode: this.toNullableText(raw?.caseCode),
            caseName: this.toNullableText(raw?.caseName),
            mode: this.toNullableText(raw?.mode),
            confirmedAtUtc: this.toNullableText(raw?.confirmedAtUtc),
            createdAtUtc: this.toNullableText(raw?.createdAtUtc),
            userVisibleMessage: this.toNullableMultilineText(raw?.userVisibleMessage),
            result: this.normalizeModerationResult(raw?.result),
            sanction: this.normalizeModerationSanction(raw?.sanction),
        };
    }

    private normalizeModerationSanction(raw: any): UserModerationSanction | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const sanctionId = this.toPositiveInt(raw?.sanctionId ?? raw?.id);
        const kind = this.toNullableText(raw?.kind ?? raw?.sanctionKind ?? raw?.type);
        const code = this.toNullableText(raw?.code ?? raw?.sanctionCode);
        const name = this.toNullableText(raw?.name ?? raw?.title ?? raw?.label);
        const startsAtUtc = this.toNullableText(raw?.startsAtUtc ?? raw?.startAtUtc ?? raw?.appliedAtUtc);
        const endsAtUtc = this.toNullableText(raw?.endsAtUtc ?? raw?.endAtUtc ?? raw?.expiresAtUtc);
        const hasExplicitPermanent = raw?.isPermanent === true || raw?.permanent === true;
        const hasExplicitNullEnd = (Object.prototype.hasOwnProperty.call(raw, 'endsAtUtc') && raw?.endsAtUtc === null)
            || (Object.prototype.hasOwnProperty.call(raw, 'endAtUtc') && raw?.endAtUtc === null)
            || (Object.prototype.hasOwnProperty.call(raw, 'expiresAtUtc') && raw?.expiresAtUtc === null);
        const isPermanent = hasExplicitPermanent || hasExplicitNullEnd;

        if (!sanctionId && !kind && !code && !name && !startsAtUtc && !endsAtUtc && !isPermanent)
            return null;

        return {
            sanctionId,
            kind,
            code,
            name,
            startsAtUtc,
            endsAtUtc,
            isPermanent,
        };
    }

    private normalizeModerationResult(value: any): UserModerationHistoryResult | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'reported' || normalized === 'sanctioned' || normalized === 'banned')
            return normalized;
        return null;
    }

    private normalizeModerationStatus(
        value: any,
        banned: boolean,
        moderationSummary: UserModerationSummary | null
    ): string | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'none' || normalized === 'blocked' || normalized === 'banned')
            return normalized;
        if (moderationSummary?.activeSanction?.isPermanent === true)
            return 'banned';
        if (moderationSummary?.activeSanction)
            return 'blocked';
        if (banned)
            return 'banned';
        return null;
    }

    private normalizeAuthProvider(value: any): UsuarioListadoItemDto['authProvider'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'correo' || normalized === 'google')
            return normalized;
        return 'otro';
    }

    private normalizeUserRole(value: any): UsuarioListadoItemDto['role'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'admin' || normalized === 'colaborador' || normalized === 'master')
            return normalized;
        return 'jugador';
    }

    private normalizePolicyKind(value: any): UserCompliancePolicyKind {
        return `${value ?? ''}`.trim().toLowerCase() === 'creation' ? 'creation' : 'usage';
    }

    private normalizeModerationIncidentCreateRequest(payload: ModerationIncidentCreateRequestDto): ModerationIncidentCreateRequestDto {
        const targetUid = `${payload?.targetUid ?? ''}`.trim();
        if (targetUid.length < 1)
            throw new Error('UID objetivo inválido');

        const caseCode = `${payload?.caseCode ?? ''}`.trim();
        if (caseCode.length < 1)
            throw new Error('Caso moderable inválido');

        const mode = `${payload?.mode ?? ''}`.trim().toLowerCase() === 'report' ? 'report' : 'force_sanction';
        const internalDescription = `${payload?.internalDescription ?? ''}`.trim();
        if (internalDescription.length < 1)
            throw new Error('Debes indicar el motivo interno');

        const userVisibleMessage = `${payload?.userVisibleMessage ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        if (userVisibleMessage.length < 1)
            throw new Error('Debes indicar la explicación visible para el usuario');

        const normalized: ModerationIncidentCreateRequestDto = {
            targetUid,
            caseCode,
            mode,
            sourceCode: 'manual_admin',
            internalDescription,
            userVisibleMessage,
        };

        if (payload?.context && typeof payload.context === 'object')
            normalized.context = payload.context;

        const override = payload?.sanctionOverride;
        if (override && typeof override === 'object') {
            if (override.isPermanent === true) {
                normalized.sanctionOverride = { isPermanent: true };
            } else {
                const endsAtUtc = `${override?.endsAtUtc ?? ''}`.trim();
                if (endsAtUtc.length > 0)
                    normalized.sanctionOverride = { endsAtUtc };
            }
        }

        return normalized;
    }

    private normalizeModerationSanctionRevokeRequest(payload: ModerationSanctionRevokeRequestDto): ModerationSanctionRevokeRequestDto {
        const normalized: ModerationSanctionRevokeRequestDto = {};
        const adminComment = this.toNullableMultilineText(payload?.adminComment);
        const userVisibleMessage = this.toNullableMultilineText(payload?.userVisibleMessage);
        if (adminComment)
            normalized.adminComment = adminComment;
        if (userVisibleMessage)
            normalized.userVisibleMessage = userVisibleMessage;
        return normalized;
    }

    private normalizeModerationCaseCreateRequest(payload: ModerationCaseCreateRequestDto): ModerationCaseCreateRequestDto {
        const code = `${payload?.code ?? ''}`.trim();
        if (code.length < 1)
            throw new Error('Debes indicar el código del supuesto moderable');

        const name = `${payload?.name ?? ''}`.trim();
        if (name.length < 1)
            throw new Error('Debes indicar el nombre del supuesto moderable');

        const description = `${payload?.description ?? ''}`.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
        if (description.length < 1)
            throw new Error('Debes indicar la descripción del supuesto moderable');

        return {
            code,
            name,
            description,
            sourceMode: this.normalizeModerationCaseSourceMode(payload?.sourceMode) ?? 'manual_only',
            enabled: payload?.enabled !== false,
            stages: this.normalizeModerationCaseStages(payload?.stages),
        };
    }

    private normalizeModerationCasePatchRequest(payload: ModerationCasePatchRequestDto): ModerationCasePatchRequestDto {
        if (!payload || typeof payload !== 'object')
            throw new Error('Payload de supuesto moderable inválido');

        const normalized: ModerationCasePatchRequestDto = {};

        if (payload.code !== undefined) {
            const code = `${payload.code ?? ''}`.trim();
            if (code.length < 1)
                throw new Error('El código del supuesto moderable es inválido');
            normalized.code = code;
        }

        if (payload.name !== undefined) {
            const name = `${payload.name ?? ''}`.trim();
            if (name.length < 1)
                throw new Error('El nombre del supuesto moderable es inválido');
            normalized.name = name;
        }

        if (payload.description !== undefined) {
            const description = `${payload.description ?? ''}`.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
            if (description.length < 1)
                throw new Error('La descripción del supuesto moderable es inválida');
            normalized.description = description;
        }

        if (payload.sourceMode !== undefined)
            normalized.sourceMode = this.normalizeModerationCaseSourceMode(payload.sourceMode) ?? 'manual_only';

        if (payload.enabled !== undefined)
            normalized.enabled = payload.enabled === true;

        if (Object.keys(normalized).length < 1)
            throw new Error('No hay cambios válidos para actualizar el supuesto moderable');

        return normalized;
    }

    private normalizeModerationCaseStagesReplaceRequest(payload: ModerationCaseStagesReplaceRequestDto): ModerationCaseStagesReplaceRequestDto {
        return {
            stages: this.normalizeModerationCaseStages(payload?.stages),
        };
    }

    private normalizeModerationCaseStages(stages: ModerationCaseStageUpsertDto[] | null | undefined): ModerationCaseStageUpsertDto[] {
        if (!Array.isArray(stages) || stages.length < 1)
            throw new Error('Debes indicar al menos una etapa de moderación');

        return stages.map((stage, index) => this.normalizeModerationCaseStageUpsert(stage, index));
    }

    private normalizeModerationCaseStageUpsert(stage: ModerationCaseStageUpsertDto, index: number): ModerationCaseStageUpsertDto {
        const reportThreshold = Math.trunc(Number(stage?.reportThreshold));
        if (!Number.isFinite(reportThreshold) || reportThreshold < 1)
            throw new Error(`La etapa ${index + 1} debe tener un umbral válido`);

        const isPermanent = stage?.isPermanent === true;
        let durationMinutes: number | null = null;
        if (!isPermanent) {
            durationMinutes = Math.trunc(Number(stage?.durationMinutes));
            if (!Number.isFinite(durationMinutes) || durationMinutes < 1)
                throw new Error(`La etapa ${index + 1} debe tener una duración válida en minutos`);
        }

        return {
            stageIndex: index + 1,
            reportThreshold,
            isPermanent,
            durationMinutes,
        };
    }

    private normalizeModerationCaseId(caseId: number): number {
        const normalizedCaseId = this.toPositiveInt(caseId);
        if (!normalizedCaseId)
            throw new Error('Supuesto moderable inválido');
        return normalizedCaseId;
    }

    private normalizeModerationSanctionId(sanctionId: number): number {
        const normalizedSanctionId = this.toPositiveInt(sanctionId);
        if (!normalizedSanctionId)
            throw new Error('Sanción inválida');
        return normalizedSanctionId;
    }

    private normalizeModerationCaseStageDurationMinutes(raw: any): number | null {
        if (raw?.durationMinutes === null)
            return null;
        const durationMinutes = this.toNonNegativeInt(raw?.durationMinutes, null);
        if (durationMinutes !== null)
            return durationMinutes;

        if (raw?.durationDays === null)
            return null;
        const durationDays = this.toNonNegativeInt(raw?.durationDays, null);
        if (durationDays !== null)
            return durationDays * 24 * 60;

        if (raw?.durationHours === null)
            return null;
        const durationHours = this.toNonNegativeInt(raw?.durationHours, null);
        if (durationHours !== null)
            return durationHours * 60;

        return null;
    }

    private minutesToWholeDays(durationMinutes: number | null): number | null {
        if (durationMinutes === null || durationMinutes < 1 || durationMinutes % (24 * 60) !== 0)
            return null;
        return durationMinutes / (24 * 60);
    }

    private minutesToWholeHours(durationMinutes: number | null): number | null {
        if (durationMinutes === null || durationMinutes < 1 || durationMinutes % 60 !== 0)
            return null;
        return durationMinutes / 60;
    }

    private normalizeModerationCaseSourceMode(value: any): ModerationCaseSourceMode | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'technical_signal_auto')
            return 'technical_signal_auto';
        if (normalized === 'manual_only' || normalized === 'manual_admin' || normalized === 'manual')
            return 'manual_only';
        return null;
    }

    private normalizeModerationCaseOriginType(value: any): 'system_seed' | 'admin_custom' | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'system_seed' || normalized === 'admin_custom')
            return normalized;
        return null;
    }

    private buildPaginationParams(limit: number, offset: number): Record<string, string> {
        return {
            limit: `${this.normalizeModerationPageSize(limit, 10)}`,
            offset: `${this.toNonNegativeInt(offset, 0) ?? 0}`,
        };
    }

    private normalizeModerationPageSize(value: any, fallback: number): number {
        const parsed = this.toNonNegativeInt(value, fallback);
        if (parsed === null || parsed < 1)
            return fallback;
        return Math.min(100, parsed);
    }

    private toNonNegativeInt(value: any, fallback: number | null): number | null {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed < 0)
            return fallback;
        return parsed;
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private toNullableText(value: any): string | null {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : null;
    }

    private toNullableMultilineText(value: any): string | null {
        const text = `${value ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        return text.length > 0 ? text : null;
    }

    private toNullableObject(value: any): Record<string, any> | null {
        return value && typeof value === 'object' ? value as Record<string, any> : null;
    }

    private extractListItems(raw: any): any[] {
        if (Array.isArray(raw))
            return raw;
        if (Array.isArray(raw?.items))
            return raw.items;
        return [];
    }

    private async buildAuthHeaders(): Promise<HttpHeaders> {
        const user = this.auth.currentUser;
        if (!user)
            throw new Error('Sesión no iniciada');

        const idToken = await user.getIdToken();
        if (`${idToken ?? ''}`.trim().length < 1)
            throw new Error('Token no disponible');

        return new HttpHeaders({
            Authorization: `Bearer ${idToken}`,
        });
    }
}
