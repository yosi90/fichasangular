export type SocialHubSectionId =
    | 'resumen'
    | 'comunidad'
    | 'actividad'
    | 'convocatorias'
    | 'amistades'
    | 'bloqueos'
    | 'campanas'
    | 'mensajes';

export interface SocialHubOpenRequest {
    section: SocialHubSectionId;
    conversationId?: number | null;
    campaignId?: number | null;
    requestId: number;
}

export interface PagedListMeta {
    totalCount: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface PagedListResult<T> {
    items: T[];
    meta: PagedListMeta;
}

export interface SocialCounters {
    unreadUserCount: number;
    unreadSystemCount: number;
}

export interface SocialUserBasic {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
    allowDirectMessagesFromNonFriends: boolean;
}

export interface FriendItem extends SocialUserBasic {
    friendsSince: string | null;
}

export interface BlockedUserItem extends SocialUserBasic {
    blockedAtUtc: string | null;
}

export type FriendRequestDirection = 'sent' | 'received';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';
export type FriendRequestDecision = 'accept' | 'reject' | 'cancel';

export interface FriendRequestItem {
    requestId: number;
    direction: FriendRequestDirection;
    status: FriendRequestStatus;
    createdAtUtc: string | null;
    target: SocialUserBasic;
}

export interface SocialMutationResponse<T> {
    message: string;
    item: T | null;
}

export type SocialRelationshipState = 'neutral' | 'sent_request' | 'received_request' | 'friend' | 'blocked';
