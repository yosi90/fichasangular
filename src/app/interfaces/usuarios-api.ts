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
    displayName: string;
    email: string;
    authProvider: AuthProviderType;
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

export type CreationAuditResultCode = 'created' | 'reused' | 'rejected';

export interface CreationAuditActorDto {
    userId: string | null;
    uid: string | null;
    displayName: string | null;
    role: string | null;
}

export interface CreationAuditResourceDto {
    type: string | null;
    id: string | null;
    label: string | null;
}

export interface CreationAuditEventSummaryDto {
    eventId: string;
    occurredAtUtc: string | null;
    actionCode: string | null;
    result: CreationAuditResultCode | string | null;
    httpStatusCode: number | null;
    routeTemplate: string | null;
    actor: CreationAuditActorDto;
    resource: CreationAuditResourceDto;
}

export interface CreationAuditEventDetailDto extends CreationAuditEventSummaryDto {
    routeParams: Record<string, any>;
    query: Record<string, any>;
    requestBody: Record<string, any>;
    clientIp: string | null;
    userAgent: string | null;
    error: {
        code: string | null;
        message: string | null;
    } | null;
}

export interface CreationAuditListResponseDto {
    items: CreationAuditEventSummaryDto[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface CreationAuditListFiltersDto {
    actorUid?: string | null;
    actionCode?: string | null;
    result?: CreationAuditResultCode | null;
    resourceType?: string | null;
    from?: string | null;
    to?: string | null;
    limit?: number | null;
    offset?: number | null;
}
