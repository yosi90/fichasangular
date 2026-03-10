import { UserRole } from './user-acl';
import { AuthProviderType } from './user-profile';
import { UserSettingsV1 } from './user-settings';

export interface UserPermissionActionMap {
    create?: boolean;
}

export type UserPermissionMap = Record<string, UserPermissionActionMap>;

export interface UserPrivateProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    emailVerified: boolean;
    authProvider: AuthProviderType;
    photoUrl: string | null;
    photoThumbUrl: string | null;
    createdAt: string | null;
    lastSeenAt: string | null;
    role: UserRole;
    permissions: UserPermissionMap;
}

export interface UserPublicProfileStats {
    totalPersonajes: number;
    publicos: number;
}

export interface UserPublicProfile {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
    memberSince: string | null;
    stats: UserPublicProfileStats;
}

export interface UserAvatarResponse {
    photoUrl: string | null;
    photoThumbUrl: string | null;
}

export interface ProfileApiErrorResponse {
    code: string;
    message: string;
}

export class ProfileApiError extends Error {
    constructor(
        message: string,
        public readonly code: string = '',
        public readonly status: number = 0
    ) {
        super(message);
        this.name = 'ProfileApiError';
    }
}

export interface UserPublicProfileTab {
    uid: string;
    initialDisplayName?: string | null;
}

export type UserPrivateProfileSectionId = 'resumen' | 'identidad' | 'preferencias' | 'seguridad';

export interface UserPrivateProfileOpenRequest {
    section: UserPrivateProfileSectionId;
    requestId: number;
}

export interface UserAccountState {
    profile: UserPrivateProfile | null;
    settings: UserSettingsV1 | null;
}
