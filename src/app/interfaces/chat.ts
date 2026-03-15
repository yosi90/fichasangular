import { PagedListMeta } from './social';

export type ChatConversationType = 'direct' | 'campaign' | 'group';
export type ChatConversationFilter = 'all' | 'direct' | 'campaign' | 'group' | 'system';
export type ChatParticipantRole = 'member' | 'admin';
export type ChatParticipantStatus = 'active' | 'left' | 'removed';
export type ChatNotificationCode =
    | 'system.role_request_resolved'
    | 'system.account_updated'
    | 'system.account_banned'
    | 'system.conversation_closed'
    | 'system.campaign_invitation_received'
    | 'system.campaign_invitation_resolved'
    | 'chat.new_chat'
    | 'chat.new_message'
    | (string & {});
export type ChatAnnouncementCode = 'chat.new_chat' | 'chat.new_message' | (string & {});
export type ChatNotificationActionTarget = 'social.messages' | (string & {});

export interface ChatNotificationAction {
    target: ChatNotificationActionTarget;
    conversationId: number | null;
}

export interface ChatNotificationPayload {
    code: ChatNotificationCode;
    title: string | null;
    action: ChatNotificationAction | null;
    context: Record<string, any> | null;
}

export interface ChatAnnouncementPayload extends Omit<ChatNotificationPayload, 'code'> {
    code: ChatAnnouncementCode;
}

export interface ChatConversationSummary {
    conversationId: number;
    type: ChatConversationType;
    title: string;
    photoThumbUrl: string | null;
    campaignId: number | null;
    participantRole: ChatParticipantRole;
    participantStatus: ChatParticipantStatus;
    lastMessagePreview: string | null;
    lastMessageAtUtc: string | null;
    unreadCount: number;
    canSend: boolean;
    isSystemConversation: boolean;
    counterpartUid: string | null;
    lastMessageNotification: ChatNotificationPayload | null;
}

export interface ChatParticipant {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
    isSystemUser: boolean;
    participantRole: ChatParticipantRole;
    participantStatus: ChatParticipantStatus;
    joinedAtUtc: string | null;
    leftAtUtc: string | null;
}

export interface ChatConversationDetail extends ChatConversationSummary {
    participants: ChatParticipant[];
}

export interface ChatGroupCreateDraft {
    title: string;
    participantUids: string[];
}

export interface ChatMessageSender {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
    isSystemUser: boolean;
}

export interface ChatMessage {
    messageId: number;
    conversationId: number;
    sender: ChatMessageSender;
    body: string;
    sentAtUtc: string;
    notification: ChatNotificationPayload | null;
    announcement: ChatAnnouncementPayload | null;
}

export interface ChatMessageEnvelope {
    message: ChatMessage;
    conversation: ChatConversationSummary;
}

export interface ChatReadResponse {
    conversationId: number;
    lastReadMessageId: number;
}

export interface ChatMessageReadPayload {
    conversationId: number;
    lastReadMessageId: number;
    userId: string;
    uid: string;
}

export interface ChatConversationListResult {
    items: ChatConversationSummary[];
    meta: PagedListMeta;
    unreadUserCount: number;
    unreadSystemCount: number;
}

export type ChatWebSocketEvent =
    | { type: 'message.created'; payload: ChatMessage; }
    | { type: 'conversation.updated'; payload: ChatConversationSummary; }
    | { type: 'message.read'; payload: ChatMessageReadPayload; }
    | { type: 'pong'; payload: Record<string, never>; };
