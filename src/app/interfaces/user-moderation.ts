export type UserModerationHistoryResult = 'reported' | 'sanctioned' | 'banned';
export type UserAccessScope = 'usage' | 'creation';
export type UserAccessRestrictionReason = 'banned' | 'mustAcceptUsage' | 'mustAcceptCreation';
export type UserCompliancePolicyKind = 'usage' | 'creation';

export interface UserModerationSanction {
    sanctionId: number | null;
    kind: string | null;
    code: string | null;
    name: string | null;
    startsAtUtc: string | null;
    endsAtUtc: string | null;
    isPermanent: boolean;
}

export interface UserModerationSummary {
    incidentCount: number;
    sanctionCount: number;
    lastIncidentAtUtc: string | null;
    lastSanctionAtUtc: string | null;
    activeSanction: UserModerationSanction | null;
}

export interface UserModerationHistoryItem {
    incidentId: number;
    caseId: number | null;
    caseCode: string | null;
    caseName: string | null;
    mode: string | null;
    confirmedAtUtc: string | null;
    createdAtUtc: string | null;
    userVisibleMessage: string | null;
    result: UserModerationHistoryResult | null;
    sanction: UserModerationSanction | null;
}

export interface UserModerationHistoryListResponse {
    items: UserModerationHistoryItem[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface UserCompliancePolicyState {
    version: string | null;
    accepted: boolean;
    acceptedAtUtc: string | null;
    publishedAtUtc: string | null;
    title: string | null;
}

export interface UserComplianceActivePolicy {
    kind: UserCompliancePolicyKind;
    version: string | null;
    title: string | null;
    markdown: string | null;
    publishedAtUtc: string | null;
}

export interface UserComplianceSnapshot {
    banned: boolean;
    mustAcceptUsage: boolean;
    mustAcceptCreation: boolean;
    activeSanction: UserModerationSanction | null;
    usage: UserCompliancePolicyState | null;
    creation: UserCompliancePolicyState | null;
}

export interface UserComplianceAcceptResponse {
    policy: UserComplianceActivePolicy | null;
    compliance: UserComplianceSnapshot | null;
}

export interface UserAbuseLockReportInput {
    reason: string;
    clientDate: string;
    localBlockCountToday: number;
    source: 'web';
}

export interface UserAbuseLockReportResponse {
    status: 'banned' | 'ignored' | string;
    compliance: UserComplianceSnapshot | null;
}
