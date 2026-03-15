export type CampaignRoleCode = 'master' | 'jugador';
export type CampaignMembershipStatus = 'activo' | 'inactivo' | 'expulsado';
export type CampaignMemberRemovalStatus = 'inactivo' | 'expulsado';
export type CampaignInvitationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';
export type CampaignInvitationDecision = 'accept' | 'reject';
export type CampaignRealtimeEventCode =
    | 'system.campaign_invitation_received'
    | 'system.campaign_invitation_resolved'
    | 'campaign.local_change';
export type CampaignRealtimeEventSource = 'remote' | 'local';

export interface CampaignRealtimeEvent {
    code: CampaignRealtimeEventCode;
    campaignId: number | null;
    conversationId: number | null;
    source: CampaignRealtimeEventSource;
}

export interface CampaignListItem {
    id: number;
    nombre: string;
    campaignRole: CampaignRoleCode | null;
    membershipStatus: CampaignMembershipStatus | null;
    isOwner?: boolean;
}

export interface CampaignMemberItem {
    userId: string | null;
    uid: string;
    displayName: string | null;
    email: string | null;
    campaignRole: CampaignRoleCode;
    membershipStatus: CampaignMembershipStatus;
    isActive: boolean;
    addedAtUtc: string | null;
    addedByUserId: string | null;
}

export interface CampaignUserSearchResult {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
}

export interface CampaignInvitationUser {
    userId: string | null;
    uid: string;
    displayName: string | null;
    email: string | null;
}

export interface CampaignInvitationItem {
    inviteId: number;
    status: CampaignInvitationStatus;
    createdAtUtc: string | null;
    resolvedAtUtc: string | null;
    campaignId: number;
    campaignName: string | null;
    invitedUser: CampaignInvitationUser;
    invitedBy: CampaignInvitationUser;
    resolvedByUserId: string | null;
}

export interface CampaignInvitationResponse {
    message: string;
    invitation: CampaignInvitationItem;
}

export interface CampaignSubtramaItem {
    id: number;
    nombre: string;
}

export interface CampaignTramaItem {
    id: number;
    nombre: string;
    subtramas: CampaignSubtramaItem[];
}

export interface CampaignDetailViewModel {
    campaign: CampaignListItem;
    ownerUid: string | null;
    ownerDisplayName: string | null;
    activeMasterUid: string | null;
    activeMasterDisplayName: string | null;
    canRecoverMaster: boolean;
    members: CampaignMemberItem[];
    pendingInvitations: CampaignInvitationItem[];
    includeInactiveMembers: boolean;
    tramas: CampaignTramaItem[];
    loadingInvitations: boolean;
    loadingMembers: boolean;
    loadingTramas: boolean;
}

export interface TransferCampaignMasterInput {
    targetUid: string;
    keepPreviousAsPlayer: boolean;
}
