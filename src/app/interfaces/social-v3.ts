export type SocialCommunityRole = 'jugador' | 'master' | 'colaborador' | 'admin';
export type SocialCommunitySort = 'recent' | 'active' | 'characters' | 'campaigns_mastered' | 'campaigns_joined';
export type SocialRankingMetric = 'public_characters' | 'campaigns_created' | 'campaigns_as_master' | 'active_campaigns' | 'seniority';
export type SocialRelationshipStateDetailed =
    | 'self'
    | 'friend'
    | 'incoming_request'
    | 'outgoing_request'
    | 'blocked_by_actor'
    | 'blocked_actor'
    | 'none';
export type SocialFeedScope = 'global' | 'friends' | 'self';
export type SocialFeedKind =
    | 'friendship.created'
    | 'campaign.created'
    | 'campaign.joined'
    | 'group.created'
    | 'character.published';
export type SocialFeedVisibility = 'global' | 'friends' | 'self';
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
    showRecentActivity: boolean;
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
    blockedByActor: boolean;
    blockedActor: boolean;
    mutualFriendsCount: number;
    mutualCampaignsCount: number;
}

export interface SocialRecentActivityItem {
    kind: string;
    createdAtUtc: string | null;
    summary: string;
}

export interface SocialRelationshipProfile {
    profile: SocialProfileBlock;
    relationship: SocialRelationshipDetail;
    visibility: SocialVisibilityFlags;
    stats: SocialPublicStatsV3;
    recentActivity: SocialRecentActivityItem[];
}

export interface SocialFeedActor {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
}

export interface SocialFeedSubject {
    type: string;
    id: string | null;
    title: string | null;
}

export interface SocialFeedCta {
    type: string;
    uid: string | null;
}

export interface SocialFeedItem {
    id: string;
    kind: string;
    createdAtUtc: string | null;
    visibility: SocialFeedVisibility;
    actor: SocialFeedActor;
    subject: SocialFeedSubject;
    summary: string;
    cta: SocialFeedCta;
    metadata: Record<string, any>;
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

export interface SocialContactConversationResponse {
    conversationId: number;
    created: boolean;
    type: 'direct';
}

export interface SocialWebSocketTicketResponse {
    ticket: string;
    expiresAtUtc: string | null;
    websocketUrl: string | null;
}

export type SocialWebSocketEvent =
    | { type: 'feed.item_created'; payload: SocialFeedItem }
    | { type: 'lfg.post_created'; payload: SocialLfgPost }
    | { type: 'lfg.post_updated'; payload: SocialLfgPost }
    | { type: 'lfg.post_closed'; payload: SocialLfgPost }
    | { type: 'pong'; payload: Record<string, never>; };
