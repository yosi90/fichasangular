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
            const response = await firstValueFrom(
                this.http.get<AdminRoleRequestItem[]>(`${this.usuariosBaseUrl}/role-requests`, {
                    headers: await this.buildAuthHeaders(),
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
            await firstValueFrom(
                this.http.patch<void>(
                    `${this.usuariosBaseUrl}/role-requests/${id}`,
                    payload,
                    { headers: await this.buildAuthHeaders() }
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
                notificaciones: {
                    mensajes: raw?.perfil?.notificaciones?.mensajes !== false,
                    amistad: raw?.perfil?.notificaciones?.amistad !== false,
                    campanas: raw?.perfil?.notificaciones?.campanas !== false,
                    cuentaSistema: raw?.perfil?.notificaciones?.cuentaSistema !== false,
                },
            },
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
