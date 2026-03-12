import { UserRole } from './user-acl';

export type UserRoleRequestStatusCode = 'none' | 'pending' | 'approved' | 'rejected';
export type UserRoleRequestTarget = 'master' | 'colaborador';
export type UserRoleRequestDecision = 'approve' | 'reject';
export type UserRoleRequestListStatus = 'pending' | 'approved' | 'rejected';

export interface UserRoleRequestStatus {
    currentRole: UserRole;
    requestedRole: UserRoleRequestTarget | null;
    status: UserRoleRequestStatusCode;
    blockedUntilUtc: string | null;
    requestId: number | null;
    requestedAtUtc: string | null;
    resolvedAtUtc: string | null;
    eligible: boolean;
    reasonCode: string | null;
    currentRoleAtRequest: 'jugador' | 'master' | null;
    requestComment: string | null;
    adminComment: string | null;
}

export interface AdminRoleRequestItem {
    requestId: number;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedRole: UserRoleRequestTarget;
    currentRoleAtRequest: 'jugador' | 'master';
    requestedAtUtc: string | null;
    requestedByUserId: string | null;
    resolvedAtUtc: string | null;
    resolvedByUserId: string | null;
    blockedUntilUtc: string | null;
    requestComment: string | null;
    adminComment: string | null;
    uid: string;
    displayName: string | null;
    email: string | null;
    currentRole: UserRole;
}

export interface ResolveRoleRequestInput {
    decision: UserRoleRequestDecision;
    blockedUntilUtc?: string | null;
    adminComment?: string | null;
}

export interface UserRoleRequestListFilters {
    status?: UserRoleRequestListStatus;
    requestedRole?: UserRoleRequestTarget;
}
