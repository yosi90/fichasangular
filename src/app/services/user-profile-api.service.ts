import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    ProfileApiError,
    ProfileApiErrorResponse,
    UserAvatarResponse,
    UserPrivateProfile,
    UserPrivateProfileUpdate,
    UserPublicProfile,
} from '../interfaces/user-account';
import {
    AdminRoleRequestItem,
    ResolveRoleRequestInput,
    UserRoleRequestListFilters,
    UserRoleRequestStatus,
    UserRoleRequestTarget,
} from '../interfaces/user-role-request';
import { UserSettingsV1, createDefaultUserSettings } from '../interfaces/user-settings';
import {
    UserAbuseLockReportInput,
    UserAbuseLockReportResponse,
    UserComplianceAcceptResponse,
    UserComplianceActivePolicy,
    UserCompliancePolicyKind,
    UserCompliancePolicyState,
    UserComplianceSnapshot,
    UserModerationHistoryItem,
    UserModerationHistoryListResponse,
    UserModerationHistoryResult,
    UserModerationSanction,
} from '../interfaces/user-moderation';
import { PrivateUserFirestoreService } from './private-user-firestore.service';

@Injectable({
    providedIn: 'root'
})
export class UserProfileApiService {
    private readonly usuariosBaseUrl = `${environment.apiUrl}usuarios`;
    private readonly publicProfileCache = new Map<string, UserPublicProfile | null>();

    constructor(
        private http: HttpClient,
        private auth: Auth,
        private privateUserFirestoreSvc?: PrivateUserFirestoreService
    ) { }

    async getMyProfile(): Promise<UserPrivateProfile> {
        const response = await this.requirePrivateReadModel('perfil privado').getMyProfile();
        return this.normalizePrivateProfile(response ?? this.buildFallbackPrivateProfile());
    }

    async getMyCompliance(): Promise<UserComplianceSnapshot | null> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(
                    `${this.usuariosBaseUrl}/me/compliance`,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeCompliance(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo cargar tu estado de cumplimiento.');
        }
    }

    async updateMyProfile(input: UserPrivateProfileUpdate): Promise<UserPrivateProfile> {
        const payload = this.buildProfilePatchPayload(input);
        if (Object.keys(payload).length < 1)
            throw new ProfileApiError('No hay cambios de perfil para guardar.', 'PROFILE_PATCH_EMPTY', 400);

        try {
            const response = await firstValueFrom(
                this.http.patch<UserPrivateProfile>(
                    `${this.usuariosBaseUrl}/me`,
                    payload,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizePrivateProfile(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo actualizar tu perfil.');
        }
    }

    async updateDisplayName(displayName: string): Promise<UserPrivateProfile> {
        return await this.updateMyProfile({ displayName });
    }

    async getMySettings(): Promise<UserSettingsV1> {
        const response = await this.requirePrivateReadModel('ajustes privados').getMySettings();
        return this.normalizeSettings(response ?? createDefaultUserSettings());
    }

    async listMyModerationHistory(limit: number = 10, offset: number = 0): Promise<UserModerationHistoryListResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.get<UserModerationHistoryListResponse>(`${this.usuariosBaseUrl}/me/moderation/history`, {
                    headers,
                    params: this.buildPaginationParams(limit, offset),
                })
            );
            return this.normalizeModerationHistoryResponse(response, limit, offset);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo cargar tu historial de moderación.');
        }
    }

    async getActivePolicy(policyKind: UserCompliancePolicyKind): Promise<UserComplianceActivePolicy> {
        const normalizedKind = this.normalizePolicyKind(policyKind);
        try {
            const response = await firstValueFrom(
                this.http.get<any>(
                    `${this.usuariosBaseUrl}/me/policies/${normalizedKind}/active`,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeActivePolicy(response, normalizedKind);
        } catch (error) {
            throw this.toProfileApiError(error, `No se pudo cargar la política activa de ${normalizedKind}.`);
        }
    }

    async acceptActivePolicy(policyKind: UserCompliancePolicyKind): Promise<UserComplianceAcceptResponse> {
        const normalizedKind = this.normalizePolicyKind(policyKind);
        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.usuariosBaseUrl}/me/policies/${normalizedKind}/accept`,
                    {},
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizePolicyAcceptResponse(response, normalizedKind);
        } catch (error) {
            throw this.toProfileApiError(error, `No se pudo aceptar la política activa de ${normalizedKind}.`);
        }
    }

    async reportAbuseLock(input: UserAbuseLockReportInput): Promise<UserAbuseLockReportResponse> {
        const payload = this.normalizeAbuseLockPayload(input);
        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.usuariosBaseUrl}/me/security/abuse-lock`,
                    payload,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeAbuseLockResponse(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo escalar el bloqueo técnico por abuso.');
        }
    }

    async replaceMySettings(settings: UserSettingsV1): Promise<UserSettingsV1> {
        try {
            const response = await firstValueFrom(
                this.http.put<UserSettingsV1>(
                    `${this.usuariosBaseUrl}/me/settings`,
                    settings,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeSettings(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudieron guardar los ajustes de usuario.');
        }
    }

    async uploadAvatar(file: File): Promise<UserAvatarResponse> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            return await firstValueFrom(
                this.http.post<UserAvatarResponse>(
                    `${this.usuariosBaseUrl}/me/avatar`,
                    formData,
                    { headers: await this.buildAuthHeaders() }
                )
            );
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo subir el avatar.');
        }
    }

    async deleteAvatar(): Promise<void> {
        try {
            await firstValueFrom(
                this.http.delete<void>(`${this.usuariosBaseUrl}/me/avatar`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo eliminar el avatar.');
        }
    }

    async getMyRoleRequestStatus(): Promise<UserRoleRequestStatus> {
        try {
            const response = await firstValueFrom(
                this.http.get<UserRoleRequestStatus>(`${this.usuariosBaseUrl}/me/role-request`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeRoleRequestStatus(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo cargar el estado de tu solicitud de rol.');
        }
    }

    async createRoleRequest(requestedRole: UserRoleRequestTarget, requestComment?: string | null): Promise<UserRoleRequestStatus> {
        const normalizedRole = `${requestedRole ?? ''}`.trim().toLowerCase();
        if (normalizedRole !== 'master' && normalizedRole !== 'colaborador')
            throw new ProfileApiError('Rol solicitado inválido.', 'ROLE_REQUEST_INVALID', 400);

        try {
            await firstValueFrom(
                this.http.post(
                    `${this.usuariosBaseUrl}/me/role-request`,
                    {
                        requestedRole: normalizedRole,
                        requestComment: `${requestComment ?? ''}`.trim() || null,
                    },
                    {
                        headers: await this.buildAuthHeaders(),
                    }
                )
            );
            return await this.getMyRoleRequestStatus();
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo crear la solicitud de rol.');
        }
    }

    async listRoleRequests(filters: UserRoleRequestListFilters = {}): Promise<AdminRoleRequestItem[]> {
        const params: Record<string, string> = {};
        const status = `${filters?.status ?? ''}`.trim().toLowerCase();
        const requestedRole = `${filters?.requestedRole ?? ''}`.trim().toLowerCase();

        if (status === 'pending' || status === 'approved' || status === 'rejected')
            params['status'] = status;
        if (requestedRole === 'master' || requestedRole === 'colaborador')
            params['requestedRole'] = requestedRole;

        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.get<AdminRoleRequestItem[]>(`${this.usuariosBaseUrl}/role-requests`, {
                    headers,
                    params,
                })
            );
            return Array.isArray(response)
                ? response.map((item) => this.normalizeAdminRoleRequestItem(item))
                : [];
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudieron cargar las solicitudes de rol.');
        }
    }

    async resolveRoleRequest(requestId: number, input: ResolveRoleRequestInput): Promise<void> {
        const id = Math.trunc(Number(requestId));
        if (!Number.isFinite(id) || id <= 0)
            throw new ProfileApiError('Solicitud inválida.', 'ROLE_REQUEST_INVALID', 400);

        const payload = {
            decision: input.decision,
            blockedUntilUtc: input.blockedUntilUtc ?? null,
            adminComment: `${input.adminComment ?? ''}`.trim() || null,
            notifyUser: input.notifyUser ?? true,
        };

        try {
            const headers = await this.buildAuthHeaders();
            await firstValueFrom(
                this.http.patch<void>(
                    `${this.usuariosBaseUrl}/role-requests/${id}`,
                    payload,
                    { headers }
                )
            );
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo resolver la solicitud.');
        }
    }

    async getPublicProfile(uid: string, forceRefresh: boolean = false): Promise<UserPublicProfile> {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            throw new ProfileApiError('UID inválido.', 'PUBLIC_PROFILE_UID_INVALID', 400);

        if (!forceRefresh && this.publicProfileCache.has(uidNormalizado)) {
            const cached = this.publicProfileCache.get(uidNormalizado);
            if (cached)
                return cached;
            throw new ProfileApiError('Perfil público no disponible.', 'PUBLIC_PROFILE_NOT_FOUND', 404);
        }

        try {
            const response = await firstValueFrom(
                this.http.get<UserPublicProfile>(`${this.usuariosBaseUrl}/${encodeURIComponent(uidNormalizado)}/public`)
            );
            const normalized = this.normalizePublicProfile(response);
            this.publicProfileCache.set(uidNormalizado, normalized);
            return normalized;
        } catch (error) {
            const apiError = this.toProfileApiError(error, 'No se pudo cargar el perfil público.');
            if (apiError.status === 404)
                this.publicProfileCache.set(uidNormalizado, null);
            throw apiError;
        }
    }

    async hasPublicProfile(uid: string): Promise<boolean> {
        try {
            await this.getPublicProfile(uid);
            return true;
        } catch (error) {
            if (error instanceof ProfileApiError && error.status === 404)
                return false;
            throw error;
        }
    }

    clearPublicProfileCache(uid?: string): void {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length > 0) {
            this.publicProfileCache.delete(uidNormalizado);
            return;
        }
        this.publicProfileCache.clear();
    }

    private requirePrivateReadModel(scope: string): PrivateUserFirestoreService {
        if (this.privateUserFirestoreSvc)
            return this.privateUserFirestoreSvc;

        throw new ProfileApiError(
            `El ${scope} debe leerse desde Firestore y el read model privado no está disponible.`,
            'PRIVATE_READ_MODEL_UNAVAILABLE',
            500
        );
    }

    private async buildAuthHeaders(): Promise<HttpHeaders> {
        const user = this.auth.currentUser;
        if (!user)
            throw new ProfileApiError('Sesión no iniciada.', 'UNAUTHORIZED', 401);

        const idToken = await user.getIdToken();
        if (`${idToken ?? ''}`.trim().length < 1)
            throw new ProfileApiError('Token no disponible.', 'TOKEN_INVALID', 401);

        return new HttpHeaders({
            Authorization: `Bearer ${idToken}`,
        });
    }

    private toProfileApiError(error: any, fallbackMessage: string): ProfileApiError {
        if (error instanceof ProfileApiError)
            return error;

        if (error instanceof HttpErrorResponse) {
            const parsed = this.extractErrorBody(error.error);
            const message = parsed.message || `${fallbackMessage} (HTTP ${error.status || '0'})`;
            return new ProfileApiError(message, parsed.code, error.status || 0);
        }

        const message = `${error?.message ?? fallbackMessage}`.trim() || fallbackMessage;
        return new ProfileApiError(message, '', 0);
    }

    private extractErrorBody(body: any): ProfileApiErrorResponse {
        if (!body)
            return { code: '', message: '' };

        if (typeof body === 'string')
            return { code: '', message: body.trim() };

        if (typeof body === 'object') {
            const code = `${body?.code ?? ''}`.trim();
            const message = `${body?.message ?? body?.error ?? ''}`.trim();
            if (code.length > 0 || message.length > 0)
                return { code, message };

            const firstEntry = Object.entries(body as Record<string, any>)[0];
            if (!firstEntry)
                return { code: '', message: '' };

            const [key, value] = firstEntry;
            return {
                code: '',
                message: `${key}${value ? `: ${value}` : ''}`.trim(),
            };
        }

        return { code: '', message: '' };
    }

    private buildProfilePatchPayload(input: UserPrivateProfileUpdate | null | undefined): UserPrivateProfileUpdate {
        const payload: UserPrivateProfileUpdate = {};
        if (!input || typeof input !== 'object')
            return payload;

        if (Object.prototype.hasOwnProperty.call(input, 'displayName'))
            payload.displayName = `${input.displayName ?? ''}`.trim();
        if (Object.prototype.hasOwnProperty.call(input, 'bio'))
            payload.bio = this.normalizeMultilineText(input.bio);
        if (Object.prototype.hasOwnProperty.call(input, 'genderIdentity'))
            payload.genderIdentity = this.toNullableText(input.genderIdentity);
        if (Object.prototype.hasOwnProperty.call(input, 'pronouns'))
            payload.pronouns = this.toNullableText(input.pronouns);

        return payload;
    }

    private normalizePrivateProfile(raw: UserPrivateProfile | null | undefined): UserPrivateProfile {
        return {
            uid: `${raw?.uid ?? ''}`.trim(),
            displayName: this.toNullableText(raw?.displayName),
            bio: this.normalizeMultilineText(raw?.bio),
            genderIdentity: this.toNullableText(raw?.genderIdentity),
            pronouns: this.toNullableText(raw?.pronouns),
            email: this.toNullableText(raw?.email),
            emailVerified: raw?.emailVerified === true,
            authProvider: this.normalizeAuthProvider(raw?.authProvider),
            photoUrl: this.toNullableText(raw?.photoUrl),
            photoThumbUrl: this.toNullableText(raw?.photoThumbUrl),
            createdAt: this.toNullableText(raw?.createdAt),
            lastSeenAt: this.toNullableText(raw?.lastSeenAt),
            role: this.normalizeUserRole(raw?.role),
            permissions: this.normalizePermissionsMap(raw?.permissions),
            compliance: this.normalizeCompliance(raw?.compliance),
        };
    }

    private buildFallbackPrivateProfile(): UserPrivateProfile {
        const currentUser = this.auth.currentUser;
        const email = this.toNullableText(currentUser?.email);
        const displayName = this.toNullableText(currentUser?.displayName)
            ?? this.fallbackDisplayName(email)
            ?? 'Usuario';

        return {
            uid: `${currentUser?.uid ?? ''}`.trim(),
            displayName,
            bio: null,
            genderIdentity: null,
            pronouns: null,
            email,
            emailVerified: currentUser?.emailVerified === true,
            authProvider: this.normalizeAuthProvider(null),
            photoUrl: null,
            photoThumbUrl: null,
            createdAt: null,
            lastSeenAt: null,
            role: 'jugador',
            permissions: {},
            compliance: null,
        };
    }

    private normalizePublicProfile(raw: UserPublicProfile | null | undefined): UserPublicProfile {
        return {
            uid: `${raw?.uid ?? ''}`.trim(),
            displayName: this.toNullableText(raw?.displayName),
            bio: this.normalizeMultilineText(raw?.bio),
            pronouns: this.toNullableText(raw?.pronouns),
            photoThumbUrl: this.toNullableText(raw?.photoThumbUrl),
            memberSince: this.toNullableText(raw?.memberSince),
            stats: this.normalizePublicProfileStats(raw?.stats),
        };
    }

    private normalizePublicProfileStats(raw: UserPublicProfile['stats'] | null | undefined): UserPublicProfile['stats'] {
        return {
            totalPersonajes: this.toNonNegativeInt(raw?.totalPersonajes),
            publicos: this.toNonNegativeInt(raw?.publicos),
            campanasActivas: this.toNonNegativeInt(raw?.campanasActivas),
            campanasMaster: this.toNonNegativeInt(raw?.campanasMaster),
            campanasCreadas: this.toNonNegativeInt(raw?.campanasCreadas),
        };
    }

    private normalizePermissionsMap(raw: UserPrivateProfile['permissions'] | null | undefined): UserPrivateProfile['permissions'] {
        if (!raw || typeof raw !== 'object')
            return {};

        return Object.entries(raw).reduce<UserPrivateProfile['permissions']>((acc, [resource, value]) => {
            const key = `${resource ?? ''}`.trim();
            if (key.length < 1)
                return acc;

            acc[key] = {
                create: value?.create === true,
            };
            return acc;
        }, {});
    }

    private normalizeCompliance(raw: any): UserComplianceSnapshot | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const activeSanction = this.normalizeModerationSanction(raw?.activeSanction)
            ?? this.buildEffectiveModerationSanction(raw);
        const moderationStatus = this.normalizeAbuseLockStatus(raw?.moderationStatus ?? raw?.effectiveStatus);
        return {
            banned: raw?.banned === true
                || moderationStatus === 'blocked'
                || moderationStatus === 'banned'
                || !!activeSanction,
            mustAcceptUsage: raw?.mustAcceptUsage === true,
            mustAcceptCreation: raw?.mustAcceptCreation === true,
            activeSanction,
            usage: this.normalizeCompliancePolicy(raw?.usage),
            creation: this.normalizeCompliancePolicy(raw?.creation),
        };
    }

    private normalizeCompliancePolicy(raw: any): UserCompliancePolicyState | null {
        if (!raw || typeof raw !== 'object')
            return null;

        return {
            version: this.toNullableText(raw?.version ?? raw?.versionTag ?? raw?.versionCode),
            accepted: raw?.accepted === true || raw?.isAccepted === true || raw?.acceptedVersionMatchesActive === true,
            acceptedAtUtc: this.toNullableText(raw?.acceptedAtUtc ?? raw?.acceptedAt),
            publishedAtUtc: this.toNullableText(raw?.publishedAtUtc ?? raw?.effectiveAtUtc ?? raw?.activeSinceUtc),
            title: this.toNullableText(raw?.title ?? raw?.name),
        };
    }

    private normalizeActivePolicy(raw: any, fallbackKind: UserCompliancePolicyKind): UserComplianceActivePolicy {
        const normalizedKind = this.normalizePolicyKind(raw?.kind ?? raw?.policyKind ?? fallbackKind);
        return {
            kind: normalizedKind,
            version: this.toNullableText(raw?.version ?? raw?.versionTag ?? raw?.versionCode),
            title: this.toNullableText(raw?.title ?? raw?.name),
            markdown: this.normalizeMultilineText(raw?.markdown ?? raw?.content ?? raw?.body),
            publishedAtUtc: this.toNullableText(raw?.publishedAtUtc ?? raw?.effectiveAtUtc ?? raw?.activeSinceUtc),
        };
    }

    private normalizePolicyAcceptResponse(raw: any, fallbackKind: UserCompliancePolicyKind): UserComplianceAcceptResponse {
        const policySource = raw?.policy ?? raw?.activePolicy ?? raw;
        const complianceSource = raw?.compliance ?? raw?.complianceSnapshot ?? null;
        return {
            policy: policySource && typeof policySource === 'object'
                ? this.normalizeActivePolicy(policySource, fallbackKind)
                : null,
            compliance: this.normalizeCompliance(complianceSource),
        };
    }

    private normalizeAbuseLockPayload(input: UserAbuseLockReportInput | null | undefined): UserAbuseLockReportInput {
        const clientDate = `${input?.clientDate ?? ''}`.trim();
        const localBlockCountToday = Math.max(1, this.toNonNegativeInt(input?.localBlockCountToday));
        return {
            reason: `${input?.reason ?? ''}`.trim() || 'frontend_api_button_spam',
            clientDate: /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : new Date().toISOString().slice(0, 10),
            localBlockCountToday,
            source: 'web',
        };
    }

    private normalizeAbuseLockResponse(raw: any): UserAbuseLockReportResponse {
        const status = this.normalizeAbuseLockStatus(raw?.status) ?? 'ignored';
        const moderationStatus = this.normalizeAbuseLockStatus(raw?.moderationStatus ?? raw?.effectiveStatus);
        const explicitSanction = this.normalizeModerationSanction(raw?.activeSanction ?? raw?.sanction);
        const blockedUntilUtc = this.toNullableText(raw?.blockedUntilUtc ?? explicitSanction?.endsAtUtc);
        const isPermanent = this.normalizeOptionalBoolean(raw?.isPermanent ?? explicitSanction?.isPermanent);
        const activeSanction = explicitSanction ?? this.buildFallbackAbuseLockSanction({
            status,
            moderationStatus,
            blockedUntilUtc,
            isPermanent,
        });
        return {
            status,
            moderationStatus,
            message: this.normalizeMultilineText(raw?.message ?? raw?.userVisibleMessage),
            activeSanction,
            blockedUntilUtc,
            isPermanent,
            restrictedActions: this.normalizeRestrictedActions(raw?.restrictedActions),
            compliance: this.normalizeAbuseLockCompliance(raw?.compliance ?? raw?.complianceSnapshot, {
                status,
                moderationStatus,
                activeSanction,
                blockedUntilUtc,
                isPermanent,
            }),
        };
    }

    private normalizeAbuseLockCompliance(
        rawCompliance: any,
        fallback: {
            status: string;
            moderationStatus: string | null;
            activeSanction: UserModerationSanction | null;
            blockedUntilUtc: string | null;
            isPermanent: boolean | null;
        }
    ): UserComplianceSnapshot | null {
        const normalized = this.normalizeCompliance(rawCompliance);
        const fallbackSanction = fallback.activeSanction ?? this.buildFallbackAbuseLockSanction(fallback);
        const fallbackBlocksAccess = this.abuseLockImpliesBlockingRestriction(fallback);

        if (!normalized)
            return fallbackBlocksAccess && fallbackSanction
                ? {
                    banned: true,
                    mustAcceptUsage: false,
                    mustAcceptCreation: false,
                    activeSanction: fallbackSanction,
                    usage: null,
                    creation: null,
                }
                : null;

        if (!fallbackBlocksAccess || !fallbackSanction)
            return normalized;

        return {
            ...normalized,
            banned: true,
            activeSanction: normalized.activeSanction ?? fallbackSanction,
        };
    }

    private buildFallbackAbuseLockSanction(fallback: {
        status: string;
        moderationStatus: string | null;
        blockedUntilUtc: string | null;
        isPermanent: boolean | null;
    }): UserModerationSanction | null {
        const status = this.normalizeAbuseLockStatus(fallback.status);
        const moderationStatus = this.normalizeAbuseLockStatus(fallback.moderationStatus);
        const endsAtUtc = this.toNullableText(fallback.blockedUntilUtc);
        const isPermanent = fallback.isPermanent === true
            || (endsAtUtc === null && (status === 'banned' || moderationStatus === 'banned'));
        if (!isPermanent && !endsAtUtc)
            return null;

        return {
            sanctionId: null,
            kind: 'restriction',
            code: isPermanent ? 'technical_account_restriction_permanent' : 'technical_account_restriction_temporary',
            name: isPermanent ? 'Restricción permanente de cuenta' : 'Restricción temporal de cuenta',
            startsAtUtc: null,
            endsAtUtc,
            isPermanent,
        };
    }

    private buildEffectiveModerationSanction(raw: any): UserModerationSanction | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const moderationStatus = this.normalizeAbuseLockStatus(raw?.moderationStatus ?? raw?.effectiveStatus);
        const blockedUntilUtc = this.toNullableText(raw?.blockedUntilUtc ?? raw?.expiresAtUtc ?? raw?.endAtUtc);
        const isPermanent = this.normalizeOptionalBoolean(raw?.isPermanent);
        if (moderationStatus !== 'blocked' && moderationStatus !== 'banned' && !blockedUntilUtc && isPermanent !== true)
            return null;

        return this.buildFallbackAbuseLockSanction({
            status: raw?.banned === true ? 'banned' : 'ignored',
            moderationStatus,
            blockedUntilUtc,
            isPermanent,
        });
    }

    private abuseLockImpliesBlockingRestriction(fallback: {
        status: string;
        moderationStatus: string | null;
        activeSanction: UserModerationSanction | null;
        blockedUntilUtc: string | null;
        isPermanent: boolean | null;
    }): boolean {
        const status = this.normalizeAbuseLockStatus(fallback.status);
        const moderationStatus = this.normalizeAbuseLockStatus(fallback.moderationStatus);
        return status === 'blocked'
            || status === 'banned'
            || moderationStatus === 'blocked'
            || moderationStatus === 'banned'
            || !!fallback.activeSanction
            || `${fallback.blockedUntilUtc ?? ''}`.trim().length > 0
            || fallback.isPermanent === true;
    }

    private normalizeRestrictedActions(raw: any): string[] {
        if (!Array.isArray(raw))
            return [];
        return raw
            .map((value) => `${value ?? ''}`.trim())
            .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);
    }

    private normalizeAbuseLockStatus(value: any): string | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        return normalized.length > 0 ? normalized : null;
    }

    private normalizeOptionalBoolean(value: any): boolean | null {
        if (value === true)
            return true;
        if (value === false)
            return false;
        return null;
    }

    private normalizeModerationHistoryResponse(
        raw: any,
        requestedLimit: number,
        requestedOffset: number
    ): UserModerationHistoryListResponse {
        const rawItems = Array.isArray(raw)
            ? raw
            : (Array.isArray(raw?.items) ? raw.items : []);
        const items = rawItems.map((item: any) => this.normalizeModerationHistoryItem(item));
        const limit = this.normalizeModerationPageSize(
            Array.isArray(raw) ? items.length || requestedLimit : raw?.limit,
            requestedLimit
        );
        const offset = this.toNonNegativeInt(Array.isArray(raw) ? requestedOffset : raw?.offset)
            ?? this.toNonNegativeInt(requestedOffset)
            ?? 0;
        const total = this.toNonNegativeInt(Array.isArray(raw) ? items.length : raw?.total) ?? items.length;
        const hasMore = Array.isArray(raw)
            ? false
            : (raw?.hasMore === true || offset + items.length < total);

        return {
            items,
            total,
            limit,
            offset,
            hasMore,
        };
    }

    private normalizeModerationHistoryItem(raw: any): UserModerationHistoryItem {
        return {
            incidentId: this.toPositiveIntOrNull(raw?.incidentId) ?? 0,
            caseId: this.toPositiveIntOrNull(raw?.caseId),
            caseCode: this.toNullableText(raw?.caseCode),
            caseName: this.toNullableText(raw?.caseName),
            mode: this.toNullableText(raw?.mode),
            confirmedAtUtc: this.toNullableText(raw?.confirmedAtUtc),
            createdAtUtc: this.toNullableText(raw?.createdAtUtc),
            userVisibleMessage: this.normalizeMultilineText(raw?.userVisibleMessage),
            result: this.normalizeModerationResult(raw?.result),
            sanction: this.normalizeModerationSanction(raw?.sanction),
        };
    }

    private normalizeModerationSanction(raw: any): UserModerationSanction | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const sanctionId = this.toPositiveIntOrNull(raw?.sanctionId ?? raw?.id);
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

    private normalizeAuthProvider(value: any): UserPrivateProfile['authProvider'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'correo' || normalized === 'google')
            return normalized;

        const providerIds = (this.auth.currentUser?.providerData ?? [])
            .map((provider) => `${provider?.providerId ?? ''}`.trim().toLowerCase())
            .filter((providerId) => providerId.length > 0);
        if (providerIds.includes('google.com'))
            return 'google';
        if (providerIds.includes('password') || providerIds.includes('email'))
            return 'correo';
        return 'otro';
    }

    private normalizeUserRole(value: any): UserPrivateProfile['role'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'master' || normalized === 'colaborador' || normalized === 'admin')
            return normalized;
        return 'jugador';
    }

    private normalizePolicyKind(value: any): UserCompliancePolicyKind {
        return `${value ?? ''}`.trim().toLowerCase() === 'creation' ? 'creation' : 'usage';
    }

    private buildPaginationParams(limit: number, offset: number): Record<string, string> {
        const params: Record<string, string> = {};
        params['limit'] = `${this.normalizeModerationPageSize(limit, 10)}`;
        params['offset'] = `${this.toNonNegativeInt(offset) ?? 0}`;
        return params;
    }

    private normalizeModerationPageSize(value: any, fallback: number): number {
        const parsed = this.toNonNegativeInt(value);
        if (parsed === null || parsed < 1)
            return fallback;
        return Math.min(100, parsed);
    }

    private normalizeSettings(raw: UserSettingsV1 | null | undefined): UserSettingsV1 {
        const base = createDefaultUserSettings();
        if (!raw || typeof raw !== 'object')
            return base;

        return {
            version: 1,
            nuevo_personaje: {
                generador_config: raw?.nuevo_personaje?.generador_config ?? null,
                preview_minimizada: raw?.nuevo_personaje?.preview_minimizada ?? null,
                preview_restaurada: raw?.nuevo_personaje?.preview_restaurada ?? null,
            },
            perfil: {
                visibilidadPorDefectoPersonajes: raw?.perfil?.visibilidadPorDefectoPersonajes === true,
                mostrarPerfilPublico: raw?.perfil?.mostrarPerfilPublico !== false,
                allowDirectMessagesFromNonFriends: raw?.perfil?.allowDirectMessagesFromNonFriends === true,
                autoAbrirVentanaChats: raw?.perfil?.autoAbrirVentanaChats !== false,
                permitirBurbujasChat: raw?.perfil?.permitirBurbujasChat !== false,
                notificaciones: {
                    mensajes: raw?.perfil?.notificaciones?.mensajes !== false,
                    amistad: raw?.perfil?.notificaciones?.amistad !== false,
                    campanas: raw?.perfil?.notificaciones?.campanas !== false,
                    cuentaSistema: raw?.perfil?.notificaciones?.cuentaSistema !== false,
                },
            },
            mensajeria_flotante: raw?.mensajeria_flotante ?? null,
        };
    }

    private normalizeRoleRequestStatus(raw: UserRoleRequestStatus | null | undefined): UserRoleRequestStatus {
        return {
            currentRole: (raw?.currentRole ?? 'jugador') as UserRoleRequestStatus['currentRole'],
            requestedRole: raw?.requestedRole ?? null,
            status: raw?.status ?? 'none',
            blockedUntilUtc: this.toNullableText(raw?.blockedUntilUtc),
            requestId: this.toPositiveIntOrNull(raw?.requestId),
            requestedAtUtc: this.toNullableText(raw?.requestedAtUtc),
            resolvedAtUtc: this.toNullableText(raw?.resolvedAtUtc),
            eligible: raw?.eligible === true,
            reasonCode: this.toNullableText(raw?.reasonCode),
            currentRoleAtRequest: raw?.currentRoleAtRequest ?? null,
            requestComment: this.normalizeMultilineText(raw?.requestComment),
            adminComment: this.toNullableText(raw?.adminComment),
        };
    }

    private normalizeAdminRoleRequestItem(raw: AdminRoleRequestItem | null | undefined): AdminRoleRequestItem {
        return {
            requestId: this.toPositiveIntOrNull(raw?.requestId) ?? 0,
            userId: `${raw?.userId ?? ''}`.trim(),
            status: raw?.status ?? 'pending',
            requestedRole: raw?.requestedRole ?? 'master',
            currentRoleAtRequest: raw?.currentRoleAtRequest ?? 'jugador',
            requestedAtUtc: this.toNullableText(raw?.requestedAtUtc),
            requestedByUserId: this.toNullableText(raw?.requestedByUserId),
            resolvedAtUtc: this.toNullableText(raw?.resolvedAtUtc),
            resolvedByUserId: this.toNullableText(raw?.resolvedByUserId),
            blockedUntilUtc: this.toNullableText(raw?.blockedUntilUtc),
            requestComment: this.normalizeMultilineText(raw?.requestComment),
            adminComment: this.toNullableText(raw?.adminComment),
            uid: `${raw?.uid ?? ''}`.trim(),
            displayName: this.toNullableText(raw?.displayName),
            email: this.toNullableText(raw?.email),
            currentRole: (raw?.currentRole ?? 'jugador') as AdminRoleRequestItem['currentRole'],
        };
    }

    private toPositiveIntOrNull(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private toNonNegativeInt(value: any): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return 0;
        return Math.max(0, parsed);
    }

    private normalizeMultilineText(value: any): string | null {
        const text = `${value ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        return text.length > 0 ? text : null;
    }

    private toNullableText(value: any): string | null {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : null;
    }

    private fallbackDisplayName(email: string | null): string | null {
        const normalized = `${email ?? ''}`.trim();
        if (normalized.length < 1)
            return null;

        const atPos = normalized.indexOf('@');
        if (atPos > 0)
            return normalized.substring(0, atPos);
        return normalized;
    }
}
