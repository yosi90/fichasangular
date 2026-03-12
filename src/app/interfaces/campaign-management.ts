export type CampaignRoleCode = 'master' | 'jugador';
export type CampaignMembershipStatus = 'activo' | 'inactivo' | 'expulsado';
export type CampaignMemberRemovalStatus = 'inactivo' | 'expulsado';

export interface CampaignListItem {
    id: number;
    nombre: string;
    campaignRole: CampaignRoleCode | null;
    membershipStatus: CampaignMembershipStatus | null;
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
    includeInactiveMembers: boolean;
    tramas: CampaignTramaItem[];
    loadingMembers: boolean;
    loadingTramas: boolean;
}

export interface TransferCampaignMasterInput {
    targetUid: string;
    keepPreviousAsPlayer: boolean;
}
