import { AuthProviderType } from './user-profile';
import { UserRole } from './user-acl';

export interface UsuarioPermissionCreateDto {
    resource: string;
    allowed: boolean;
}

export interface UsuarioAclResponseDto {
    uid: string;
    role: UserRole;
    admin: boolean;
    banned: boolean;
    permissionsCreate: UsuarioPermissionCreateDto[];
}

export interface UsuarioListadoItemDto {
    userId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    authProvider: AuthProviderType;
    role: UserRole;
    admin: boolean;
    banned: boolean;
    updatedAtUtc: string | null;
    updatedByUserId: string | null;
    permissionsCreate: UsuarioPermissionCreateDto[];
}

export interface UsuarioUpsertRequestDto {
    uid?: string;
    firebaseUid?: string;
    displayName: string;
    email: string;
    authProvider: AuthProviderType;
    actorUserId?: string;
    role?: UserRole;
    banned?: boolean;
    permissionsCreate?: UsuarioPermissionCreateDto[];
}

export interface UsuarioUpsertResponseDto {
    status: 'created' | 'updated';
    userId: string;
    uid: string;
    acl: UsuarioAclResponseDto;
}
