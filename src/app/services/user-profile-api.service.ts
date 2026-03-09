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
    UserPublicProfile,
} from '../interfaces/user-account';
import { UserSettingsV1, createDefaultUserSettings } from '../interfaces/user-settings';

@Injectable({
    providedIn: 'root'
})
export class UserProfileApiService {
    private readonly usuariosBaseUrl = `${environment.apiUrl}usuarios`;
    private readonly publicProfileCache = new Map<string, UserPublicProfile | null>();

    constructor(private http: HttpClient, private auth: Auth) { }

    async getMyProfile(): Promise<UserPrivateProfile> {
        try {
            return await firstValueFrom(
                this.http.get<UserPrivateProfile>(`${this.usuariosBaseUrl}/me`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo cargar tu perfil.');
        }
    }

    async updateDisplayName(displayName: string): Promise<UserPrivateProfile> {
        try {
            return await firstValueFrom(
                this.http.patch<UserPrivateProfile>(
                    `${this.usuariosBaseUrl}/me`,
                    { displayName },
                    { headers: await this.buildAuthHeaders() }
                )
            );
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo actualizar el nombre visible.');
        }
    }

    async getMySettings(): Promise<UserSettingsV1> {
        try {
            const response = await firstValueFrom(
                this.http.get<UserSettingsV1>(`${this.usuariosBaseUrl}/me/settings`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeSettings(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudieron cargar los ajustes de usuario.');
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
            this.publicProfileCache.set(uidNormalizado, response);
            return response;
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
            },
        };
    }
}
