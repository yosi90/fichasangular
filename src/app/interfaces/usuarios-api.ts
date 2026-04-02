import { AuthProviderType } from './user-profile';
import {
    UserCompliancePolicyKind,
    UserModerationHistoryItem,
    UserModerationHistoryResult,
    UserModerationSanction,
    UserModerationSummary,
} from './user-moderation';
import { UserRole } from './user-acl';

export interface UsuarioPermissionCreateDto {
    resource: string;
    allowed: boolean;
}

export interface UsuarioAclResponseDto {
    userId?: string | null;
    uid: string;
    displayName?: string | null;
    email?: string | null;
    authProvider?: AuthProviderType | null;
    role: UserRole;
    admin: boolean;
    banned: boolean;
    permissionsCreate: UsuarioPermissionCreateDto[];
    moderationSummary?: UserModerationSummary | null;
    recentModerationHistory?: UserModerationHistoryItem[];
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
    moderationSummary?: UserModerationSummary | null;
}

export interface UsuarioUpsertRequestDto {
    uid?: string;
    displayName: string;
    email: string;
    authProvider: AuthProviderType;
    role?: UserRole;
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

export interface AdminPolicyDraftDto {
    kind: UserCompliancePolicyKind;
    title: string | null;
    markdown: string | null;
    version: string | null;
    publishedAtUtc: string | null;
    updatedAtUtc: string | null;
}

export type ModerationCaseSourceMode = 'manual_only' | 'technical_signal_auto';
export type ModerationCaseOriginType = 'system_seed' | 'admin_custom';

export interface ModerationCaseStageDto {
    stageId: number | null;
    stageIndex: number;
    reportThreshold: number | null;
    sanctionKind: string | null;
    sanctionCode: string | null;
    sanctionName: string | null;
    durationMinutes: number | null;
    durationDays: number | null;
    durationHours: number | null;
    isPermanent: boolean;
}

export interface ModerationCaseListItemDto {
    caseId: number;
    code: string | null;
    name: string | null;
    description?: string | null;
    sourceMode: ModerationCaseSourceMode | null;
    enabled: boolean;
    originType: ModerationCaseOriginType | null;
    isDeletable: boolean;
    isDeleted: boolean;
    deletedAtUtc: string | null;
    createdAtUtc: string | null;
    updatedAtUtc: string | null;
    deleted: boolean;
    stages: ModerationCaseStageDto[];
}

export interface ModerationCaseStageUpsertDto {
    stageIndex: number;
    reportThreshold: number;
    isPermanent: boolean;
    durationMinutes: number | null;
}

export interface ModerationCaseCreateRequestDto {
    code: string;
    name: string;
    description: string;
    sourceMode: ModerationCaseSourceMode;
    enabled?: boolean;
    stages: ModerationCaseStageUpsertDto[];
}

export interface ModerationCasePatchRequestDto {
    code?: string;
    name?: string;
    description?: string;
    sourceMode?: ModerationCaseSourceMode;
    enabled?: boolean;
}

export interface ModerationCaseStagesReplaceRequestDto {
    stages: ModerationCaseStageUpsertDto[];
}

export type AdminModerationCaseModalMode = 'create' | 'edit';

export type AdminModerationCaseModalSubmit =
    | {
        mode: 'create';
        createRequest: ModerationCaseCreateRequestDto;
    }
    | {
        mode: 'edit';
        caseId: number;
        patchRequest: ModerationCasePatchRequestDto;
        stagesRequest: ModerationCaseStagesReplaceRequestDto;
    };

export interface ModerationIncidentListItemDto {
    incidentId: number;
    targetUid: string | null;
    targetDisplayName: string | null;
    caseId: number | null;
    caseCode: string | null;
    caseName: string | null;
    mode: string | null;
    result: UserModerationHistoryResult | null;
    confirmedAtUtc: string | null;
    createdAtUtc: string | null;
    userVisibleMessage: string | null;
    internalDescription: string | null;
    sanction: UserModerationSanction | null;
}

export interface ModerationIncidentCreateRequestDto {
    targetUid: string;
    caseCode: string;
    mode: 'report' | 'force_sanction';
    sourceCode?: 'manual_admin';
    internalDescription: string;
    userVisibleMessage: string;
    context?: Record<string, any> | null;
    sanctionOverride?: {
        endsAtUtc?: string | null;
        isPermanent?: boolean;
    } | null;
}

export interface ModerationSanctionListItemDto {
    sanctionId: number;
    targetUid: string | null;
    targetDisplayName: string | null;
    caseId: number | null;
    caseCode: string | null;
    caseName: string | null;
    kind: string | null;
    code: string | null;
    name: string | null;
    startsAtUtc: string | null;
    endsAtUtc: string | null;
    isPermanent: boolean;
    active: boolean;
}

export interface ModerationSanctionRevokeRequestDto {
    adminComment?: string | null;
    userVisibleMessage?: string | null;
}

export interface ModerationSanctionRevokeResponseDto {
    revoked: boolean;
    sanction: UserModerationSanction | null;
    activeSanction: UserModerationSanction | null;
    banned: boolean;
}

export interface ModerationCaseProgressDto {
    caseId: number | null;
    caseCode: string | null;
    caseName: string | null;
    currentStageIndex: number | null;
    pendingReportCount: number | null;
    completedStageCount: number | null;
    lastIncidentAtUtc: string | null;
    lastActionAtUtc: string | null;
}

export interface ModerationIncidentCreateResponseDto {
    deduped: boolean;
    incident: ModerationIncidentListItemDto;
    stage: ModerationCaseStageDto | null;
    sanction: UserModerationSanction | null;
    activeSanction: UserModerationSanction | null;
    progress: ModerationCaseProgressDto | null;
    banned: boolean;
}

export interface ModerationProgressCaseDto {
    caseId: number | null;
    caseCode: string | null;
    caseName: string | null;
    currentStageIndex: number | null;
    pendingReports: number | null;
    activeSanction: UserModerationSanction | null;
}

export interface ModerationAdminHistoryItemDto extends UserModerationHistoryItem {
    targetUid: string | null;
    targetDisplayName: string | null;
    internalDescription: string | null;
    context: Record<string, any> | null;
    dedupKey: string | null;
    progressBefore: Record<string, any> | null;
    progressAfter: Record<string, any> | null;
    clientDate: string | null;
    localBlockCountToday: number | null;
    triggeredStageIndex: number | null;
    triggeredSanctionId: number | null;
}

export interface ModerationAdminHistoryResponseDto {
    userId: string | null;
    uid: string | null;
    displayName: string | null;
    email: string | null;
    authProvider: AuthProviderType | null;
    banned: boolean;
    moderationSummary: UserModerationSummary | null;
    progressByCase: ModerationProgressCaseDto[];
    items: ModerationAdminHistoryItemDto[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}
