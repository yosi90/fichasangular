import { UserRole } from './user-acl';
import { UserComplianceSnapshot } from './user-moderation';
import { SocialHubOpenRequest, SocialHubSectionId } from './social';
import { UserSettingsV1 } from './user-settings';

export interface UserPermissionActionMap {
    create?: boolean;
}

export type UserPermissionMap = Record<string, UserPermissionActionMap>;

export interface UserPrivateProfile {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
    createdAt: string | null;
    lastSeenAt: string | null;
    role: UserRole;
    permissions: UserPermissionMap;
    compliance?: UserComplianceSnapshot | null;
}

export interface UserPublicProfileStats {
    totalPersonajes: number;
    publicos: number;
    campanasActivas: number;
    campanasMaster: number;
    campanasCreadas: number;
}

export interface UserPublicProfile {
    uid: string;
    displayName: string | null;
    bio: string | null;
    pronouns: string | null;
    photoThumbUrl: string | null;
    memberSince: string | null;
    stats: UserPublicProfileStats;
}

export interface UserPrivateProfileUpdate {
    displayName?: string;
    bio?: string | null;
    genderIdentity?: string | null;
    pronouns?: string | null;
}

export interface UserAvatarResponse {
    photoUrl: string | null;
    photoThumbUrl: string | null;
}

export interface ProfileApiErrorResponse {
    code: string;
    message: string;
}

/** El texto para la persona cuando falta la sesión (o su token). */
export const MENSAJE_SIN_SESION = 'Necesitas iniciar sesión para continuar.';

export class ProfileApiError extends Error {
    constructor(
        message: string,
        public readonly code: string = '',
        public readonly status: number = 0
    ) {
        super(message);
        this.name = 'ProfileApiError';
    }

    /** El error de las llamadas a la API sin sesión o sin token (para `cabeceraApiConFirebase`), con el código de la API. */
    static sinSesion(motivo: 'sin_sesion' | 'sin_token'): ProfileApiError {
        return new ProfileApiError(MENSAJE_SIN_SESION, motivo === 'sin_sesion' ? 'UNAUTHORIZED' : 'TOKEN_INVALID', 401);
    }
}

export interface UserPublicProfileTab {
    uid: string;
    initialDisplayName?: string | null;
}

export type UserPrivateProfileSectionId = 'resumen' | 'preferencias' | 'campanas';

export interface UserPrivateProfileOpenRequest {
    section: UserPrivateProfileSectionId;
    requestId: number;
    campaignId?: number | null;
}

export type { SocialHubSectionId, SocialHubOpenRequest };

export interface UserAccountState {
    profile: UserPrivateProfile | null;
    settings: UserSettingsV1 | null;
}
