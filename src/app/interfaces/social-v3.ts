export type SocialCommunityRole = 'jugador' | 'master' | 'colaborador' | 'admin';
export type SocialCommunitySort = 'recent' | 'active' | 'characters' | 'campaigns_mastered' | 'campaigns_joined';
export type SocialRankingMetric = 'public_characters' | 'campaigns_created' | 'campaigns_as_master' | 'active_campaigns' | 'seniority';
/** Con la plataforma: la propia cuenta, una amistad o nada (el detalle de la relación lo da la plataforma). */
export type SocialRelationshipStateDetailed = 'self' | 'friend' | 'none';
export type SocialLfgStatus = 'open' | 'paused' | 'closed';
export type SocialLfgApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface SocialEnvelopeMeta {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface SocialEnvelope<T> {
    items: T[];
    meta: SocialEnvelopeMeta;
}

export interface SocialPublicStatsV3 {
    totalCharacters: number;
    publicCharacters: number;
    activeCampaigns: number;
    campaignsAsMaster: number;
    campaignsCreated: number;
}

export interface SocialRelationshipSummary {
    state: SocialRelationshipStateDetailed;
    canOpenProfile: boolean;
}

export interface SocialCommunityUserItem {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
    role: SocialCommunityRole;
    joinedAtUtc: string | null;
    lastSeenAtUtc: string | null;
    publicStats: SocialPublicStatsV3;
    relationship: SocialRelationshipSummary;
}

export interface SocialCommunityStats {
    visibleUsers: number;
    publicCharacters: number;
    activeCampaigns: number;
    activeGroups: number;
    friendLinks: number;
}

export interface SocialRankingItem {
    position: number;
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
    value: number;
}

export interface SocialCommunityRankings {
    metric: SocialRankingMetric;
    generatedAtUtc: string | null;
    items: SocialRankingItem[];
}

export interface SocialVisibilityFlags {
    showAuthenticatedBlock: boolean;
    showFriendsBlock: boolean;
}

export interface SocialProfileBlock {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
    bio: string | null;
    pronouns: string | null;
    joinedAtUtc: string | null;
}

export interface SocialRelationshipDetail {
    state: SocialRelationshipStateDetailed;
    mutualFriendsCount: number;
    mutualCampaignsCount: number;
}

export interface SocialRelationshipProfile {
    profile: SocialProfileBlock;
    relationship: SocialRelationshipDetail;
    visibility: SocialVisibilityFlags;
    stats: SocialPublicStatsV3;
}

export interface SocialLfgAuthor {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
}

export interface SocialLfgPost {
    id: number;
    title: string;
    summary: string;
    gameSystem: string;
    campaignStyle: string;
    slotsTotal: number;
    slotsOpen: number;
    scheduleText: string;
    language: string;
    visibility: 'global';
    status: SocialLfgStatus;
    author: SocialLfgAuthor;
    createdAtUtc: string | null;
    updatedAtUtc: string | null;
}

export interface SocialLfgPostUpsertInput {
    title: string;
    summary: string;
    gameSystem: string;
    campaignStyle: string;
    slotsTotal: number;
    scheduleText: string;
    language: string;
    visibility: 'global';
    status: SocialLfgStatus;
}

export interface SocialLfgApplicationPermissions {
    canWithdraw: boolean;
    canResolve: boolean;
}

export interface SocialLfgApplicant {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
}

export interface SocialLfgApplication {
    applicationId: number;
    postId: number;
    status: SocialLfgApplicationStatus;
    message: string;
    applicant: SocialLfgApplicant;
    createdAtUtc: string | null;
    resolvedAtUtc: string | null;
    permissions: SocialLfgApplicationPermissions;
}

/** Conversación de la web en el chat de la plataforma, con quien publica la convocatoria y quien contacta. */
export interface SocialContactConversationResponse {
    conversationId: string;
    created: boolean;
    type: 'web';
    /** La otra persona aún no ha entrado en Rol: se unirá a la conversación cuando lo haga. */
    pendingMembers: boolean;
}

export interface SocialWebSocketTicketResponse {
    ticket: string;
    expiresAtUtc: string | null;
    websocketUrl: string | null;
}

export type SocialWebSocketEvent =
    | { type: 'lfg.post_created'; payload: SocialLfgPost }
    | { type: 'lfg.post_updated'; payload: SocialLfgPost }
    | { type: 'lfg.post_closed'; payload: SocialLfgPost }
    | { type: 'pong'; payload: Record<string, never>; };
