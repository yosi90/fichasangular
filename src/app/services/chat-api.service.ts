import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProfileApiError } from '../interfaces/user-account';
import {
    ChatAnnouncementPayload,
    ChatConversationDetail,
    ChatGroupCreateDraft,
    ChatConversationListResult,
    ChatNotificationAction,
    ChatNotificationPayload,
    ChatConversationSummary,
    ChatMessage,
    ChatMessageEnvelope,
    ChatMessageReadPayload,
    ChatReadResponse,
    ChatWebSocketTicketResponse,
    ChatWebSocketEvent,
} from '../interfaces/chat';
import { PagedListMeta } from '../interfaces/social';

@Injectable({
    providedIn: 'root'
})
export class ChatApiService {
    private readonly chatBaseUrl = `${environment.apiUrl}chat`;

    constructor(private http: HttpClient, private auth: Auth) { }

    async listConversations(limit: number = 25, offset: number = 0): Promise<ChatConversationListResult> {
        try {
            const response = await firstValueFrom(
                this.http.get<ChatConversationSummary[]>(`${this.chatBaseUrl}/conversations`, {
                    headers: await this.buildAuthHeaders(),
                    params: {
                        limit: `${this.normalizeLimit(limit)}`,
                        offset: `${this.normalizeOffset(offset)}`,
                    },
                    observe: 'response',
                })
            );
            return this.normalizeConversationListResponse(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudieron cargar las conversaciones.');
        }
    }

    async createOrOpenDirect(targetUid: string): Promise<ChatConversationDetail> {
        const normalizedTargetUid = `${targetUid ?? ''}`.trim();
        if (normalizedTargetUid.length < 1)
            throw new ProfileApiError('Usuario destino inválido.', 'CHAT_TARGET_UID_INVALID', 400);

        this.logChatMutation('createOrOpenDirect', {
            url: `${this.chatBaseUrl}/conversations/direct`,
            payload: { targetUid: normalizedTargetUid },
        });

        try {
            const response = await firstValueFrom(
                this.http.post<ChatConversationDetail>(
                    `${this.chatBaseUrl}/conversations/direct`,
                    { targetUid: normalizedTargetUid },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeConversationDetail(response);
        } catch (error) {
            this.logChatMutationError('createOrOpenDirect', error, {
                targetUid: normalizedTargetUid,
            });
            throw this.toProfileApiError(error, 'No se pudo abrir la conversación directa.');
        }
    }

    async ensureCampaignConversation(campaignId: number): Promise<ChatConversationDetail> {
        const normalizedCampaignId = this.toPositiveInt(campaignId);
        if (!normalizedCampaignId)
            throw new ProfileApiError('Campaña inválida.', 'CHAT_CAMPAIGN_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.get<ChatConversationDetail>(
                    `${this.chatBaseUrl}/campaigns/${normalizedCampaignId}`,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeConversationDetail(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo abrir el chat principal de la campaña.');
        }
    }

    async createGroup(title: string, participantUids: string[]): Promise<ChatConversationDetail> {
        const payload = this.normalizeGroupDraft(title, participantUids);

        try {
            const response = await firstValueFrom(
                this.http.post<ChatConversationDetail>(
                    `${this.chatBaseUrl}/conversations/groups`,
                    payload,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeConversationDetail(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo crear el grupo.');
        }
    }

    async renameGroup(conversationId: number, title: string): Promise<ChatConversationDetail> {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        const normalizedTitle = `${title ?? ''}`.trim();
        if (!normalizedConversationId)
            throw new ProfileApiError('Conversación inválida.', 'CHAT_CONVERSATION_INVALID', 400);
        if (normalizedTitle.length < 1)
            throw new ProfileApiError('El grupo debe tener un nombre.', 'CHAT_GROUP_TITLE_EMPTY', 400);

        try {
            const response = await firstValueFrom(
                this.http.patch<ChatConversationDetail>(
                    `${this.chatBaseUrl}/conversations/groups/${normalizedConversationId}`,
                    { title: normalizedTitle },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeConversationDetail(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo renombrar el grupo.');
        }
    }

    async addGroupParticipant(conversationId: number, targetUid: string): Promise<ChatConversationDetail> {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        const normalizedTargetUid = `${targetUid ?? ''}`.trim();
        if (!normalizedConversationId)
            throw new ProfileApiError('Conversación inválida.', 'CHAT_CONVERSATION_INVALID', 400);
        if (normalizedTargetUid.length < 1)
            throw new ProfileApiError('Usuario destino inválido.', 'CHAT_TARGET_UID_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.post<ChatConversationDetail>(
                    `${this.chatBaseUrl}/conversations/groups/${normalizedConversationId}/participants`,
                    { targetUid: normalizedTargetUid },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeConversationDetail(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo añadir al participante.');
        }
    }

    async removeGroupParticipant(conversationId: number, targetUid: string): Promise<ChatConversationDetail> {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        const normalizedTargetUid = `${targetUid ?? ''}`.trim();
        if (!normalizedConversationId)
            throw new ProfileApiError('Conversación inválida.', 'CHAT_CONVERSATION_INVALID', 400);
        if (normalizedTargetUid.length < 1)
            throw new ProfileApiError('Usuario destino inválido.', 'CHAT_TARGET_UID_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.delete<ChatConversationDetail>(
                    `${this.chatBaseUrl}/conversations/groups/${normalizedConversationId}/participants/${encodeURIComponent(normalizedTargetUid)}`,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeConversationDetail(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo retirar al participante.');
        }
    }

    async getConversationDetail(conversationId: number): Promise<ChatConversationDetail> {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        if (!normalizedConversationId)
            throw new ProfileApiError('Conversación inválida.', 'CHAT_CONVERSATION_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.get<ChatConversationDetail>(
                    `${this.chatBaseUrl}/conversations/${normalizedConversationId}`,
                    {
                        headers: await this.buildAuthHeaders(),
                    }
                )
            );
            return this.normalizeConversationDetail(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo cargar el detalle de la conversación.');
        }
    }

    async listMessages(conversationId: number, beforeMessageId?: number | null, limit: number = 25): Promise<ChatMessage[]> {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        if (!normalizedConversationId)
            throw new ProfileApiError('Conversación inválida.', 'CHAT_CONVERSATION_INVALID', 400);

        const params: Record<string, string> = {
            limit: `${this.normalizeLimit(limit)}`,
        };
        const before = this.toPositiveInt(beforeMessageId);
        if (before)
            params['beforeMessageId'] = `${before}`;

        try {
            const response = await firstValueFrom(
                this.http.get<ChatMessage[]>(
                    `${this.chatBaseUrl}/conversations/${normalizedConversationId}/messages`,
                    {
                        headers: await this.buildAuthHeaders(),
                        params,
                    }
                )
            );
            return Array.isArray(response)
                ? response.map((item) => this.normalizeMessage(item)).filter((item) => item.messageId > 0)
                : [];
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo cargar el historial de la conversación.');
        }
    }

    async sendMessage(conversationId: number, body: string): Promise<ChatMessageEnvelope> {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        const normalizedBody = `${body ?? ''}`.trim();
        if (!normalizedConversationId)
            throw new ProfileApiError('Conversación inválida.', 'CHAT_CONVERSATION_INVALID', 400);
        if (normalizedBody.length < 1)
            throw new ProfileApiError('El mensaje no puede estar vacío.', 'CHAT_MESSAGE_EMPTY', 400);

        try {
            const response = await firstValueFrom(
                this.http.post<ChatMessageEnvelope>(
                    `${this.chatBaseUrl}/conversations/${normalizedConversationId}/messages`,
                    { body: normalizedBody },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return {
                message: this.normalizeMessage(response?.message),
                conversation: this.normalizeConversationSummary(response?.conversation),
            };
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo enviar el mensaje.');
        }
    }

    async markAsRead(conversationId: number, lastReadMessageId: number): Promise<ChatReadResponse> {
        const normalizedConversationId = this.toPositiveInt(conversationId);
        const normalizedMessageId = this.toPositiveInt(lastReadMessageId);
        if (!normalizedConversationId || !normalizedMessageId)
            throw new ProfileApiError('Referencia de lectura inválida.', 'CHAT_READ_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.post<ChatReadResponse>(
                    `${this.chatBaseUrl}/conversations/${normalizedConversationId}/read`,
                    { lastReadMessageId: normalizedMessageId },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return {
                conversationId: this.toPositiveInt(response?.conversationId) ?? normalizedConversationId,
                lastReadMessageId: this.toPositiveInt(response?.lastReadMessageId) ?? normalizedMessageId,
            };
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo marcar la conversación como leída.');
        }
    }

    parseWebSocketEvent(raw: any): ChatWebSocketEvent | null {
        const type = `${raw?.type ?? ''}`.trim();
        if (type === 'message.created')
            return { type, payload: this.normalizeMessage(raw?.payload) };
        if (type === 'conversation.updated')
            return { type, payload: this.normalizeConversationSummary(raw?.payload) };
        if (type === 'message.read')
            return { type, payload: this.normalizeMessageReadPayload(raw?.payload) };
        if (type === 'pong')
            return { type, payload: {} };
        return null;
    }

    async requestWebSocketTicket(): Promise<ChatWebSocketTicketResponse> {
        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.chatBaseUrl}/ws-ticket`,
                    {},
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeWebSocketTicketResponse(response);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo abrir el ticket realtime.');
        }
    }

    buildWebSocketUrl(websocketUrl: string | null | undefined, ticket: string): string {
        const normalizedTicket = `${ticket ?? ''}`.trim();
        if (normalizedTicket.length < 1)
            throw new ProfileApiError('Ticket realtime no disponible.', 'CHAT_WS_TICKET_INVALID', 400);

        const preferredUrl = `${websocketUrl ?? ''}`.trim();
        const targetUrl = preferredUrl.length > 0
            ? preferredUrl
            : this.resolveFallbackWebSocketBaseUrl();

        try {
            const parsed = new URL(targetUrl);
            if (parsed.protocol === 'http:')
                parsed.protocol = 'ws:';
            else if (parsed.protocol === 'https:')
                parsed.protocol = 'wss:';
            if (parsed.hostname === 'localhost')
                parsed.hostname = '127.0.0.1';
            parsed.search = `ticket=${encodeURIComponent(normalizedTicket)}`;
            return parsed.toString();
        } catch {
            const normalizedBase = targetUrl
                .replace(/^http:/i, 'ws:')
                .replace(/^https:/i, 'wss:')
                .replace(/:\/\/localhost(?=[:/]|$)/i, '://127.0.0.1');
            const separator = normalizedBase.includes('?') ? '&' : '?';
            return `${normalizedBase}${separator}ticket=${encodeURIComponent(normalizedTicket)}`;
        }
    }

    private resolveFallbackWebSocketBaseUrl(): string {
        if (!this.isLocalApiUrl(environment.apiUrl)) {
            throw new ProfileApiError(
                'El backend no devolvió websocketUrl para el gateway realtime publicado.',
                'CHAT_WS_URL_MISSING',
                500
            );
        }

        return this.buildFallbackWebSocketBaseUrl();
    }

    private buildFallbackWebSocketBaseUrl(): string {
        const apiUrl = `${environment.apiUrl ?? ''}`.trim();
        const fallbackBase = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

        try {
            const parsed = new URL(apiUrl);
            parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
            if (parsed.hostname === 'localhost')
                parsed.hostname = '127.0.0.1';
            const basePath = parsed.pathname.endsWith('/') ? parsed.pathname.slice(0, -1) : parsed.pathname;
            parsed.pathname = `${basePath}/ws/chat`;
            parsed.search = '';
            return parsed.toString();
        } catch {
            const wsBase = fallbackBase
                .replace(/^http:/i, 'ws:')
                .replace(/^https:/i, 'wss:')
                .replace(/:\/\/localhost(?=[:/]|$)/i, '://127.0.0.1');
            return `${wsBase}/ws/chat`;
        }
    }

    private isLocalApiUrl(value: string | null | undefined): boolean {
        const apiUrl = `${value ?? ''}`.trim();
        if (apiUrl.length < 1)
            return false;

        try {
            const parsed = new URL(apiUrl);
            const hostname = `${parsed.hostname ?? ''}`.trim().toLowerCase();
            return hostname === 'localhost' || hostname === '127.0.0.1';
        } catch {
            return /^https?:\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/i.test(apiUrl);
        }
    }

    private normalizeConversationListResponse(response: HttpResponse<ChatConversationSummary[]>): ChatConversationListResult {
        const body = Array.isArray(response.body) ? response.body : [];
        return {
            items: body.map((item) => this.normalizeConversationSummary(item)).filter((item) => item.conversationId > 0),
            meta: this.parsePagedMeta(response.headers),
            unreadUserCount: this.toNonNegativeInt(response.headers.get('X-Unread-User-Count')),
            unreadSystemCount: this.toNonNegativeInt(response.headers.get('X-Unread-System-Count')),
        };
    }

    private parsePagedMeta(headers: HttpHeaders): PagedListMeta {
        const hasMoreRaw = `${headers.get('X-Has-More') ?? ''}`.trim().toLowerCase();
        return {
            totalCount: this.toNonNegativeInt(headers.get('X-Total-Count')),
            limit: this.toNonNegativeInt(headers.get('X-Limit')),
            offset: this.toNonNegativeInt(headers.get('X-Offset')),
            hasMore: hasMoreRaw === 'true' || hasMoreRaw === '1' || hasMoreRaw === 'yes',
        };
    }

    private normalizeConversationDetail(raw: any): ChatConversationDetail {
        return {
            ...this.normalizeConversationSummary(raw),
            participants: Array.isArray(raw?.participants)
                ? raw.participants.map((item: any) => this.normalizeParticipant(item)).filter((item: any) => item.uid.length > 0)
                : [],
        };
    }

    private normalizeParticipant(raw: any): ChatConversationDetail['participants'][number] {
        return {
            uid: `${raw?.uid ?? ''}`.trim(),
            displayName: this.toNullableText(raw?.displayName),
            photoThumbUrl: this.toNullableText(raw?.photoThumbUrl),
            isSystemUser: raw?.isSystemUser === true,
            participantRole: `${raw?.participantRole ?? ''}`.trim().toLowerCase() === 'admin' ? 'admin' : 'member',
            participantStatus: this.normalizeParticipantStatus(raw?.participantStatus),
            joinedAtUtc: this.toNullableText(raw?.joinedAtUtc),
            leftAtUtc: this.toNullableText(raw?.leftAtUtc),
        };
    }

    private normalizeConversationSummary(raw: any): ChatConversationSummary {
        return {
            conversationId: this.toPositiveInt(raw?.conversationId) ?? 0,
            type: this.normalizeConversationType(raw?.type),
            title: `${raw?.title ?? ''}`.trim(),
            photoThumbUrl: this.toNullableText(raw?.photoThumbUrl),
            campaignId: this.toPositiveInt(raw?.campaignId),
            participantRole: `${raw?.participantRole ?? ''}`.trim().toLowerCase() === 'admin' ? 'admin' : 'member',
            participantStatus: this.normalizeParticipantStatus(raw?.participantStatus),
            lastMessagePreview: this.toNullableText(raw?.lastMessagePreview),
            lastMessageAtUtc: this.toNullableText(raw?.lastMessageAtUtc),
            unreadCount: this.toNonNegativeInt(raw?.unreadCount),
            canSend: raw?.canSend === true,
            isSystemConversation: raw?.isSystemConversation === true,
            counterpartUid: this.toNullableText(raw?.counterpartUid),
            lastMessageNotification: this.normalizeNotification(raw?.lastMessageNotification),
        };
    }

    private normalizeMessage(raw: any): ChatMessage {
        return {
            messageId: this.toPositiveInt(raw?.messageId) ?? 0,
            conversationId: this.toPositiveInt(raw?.conversationId) ?? 0,
            sender: {
                uid: `${raw?.sender?.uid ?? ''}`.trim(),
                displayName: this.toNullableText(raw?.sender?.displayName),
                photoThumbUrl: this.toNullableText(raw?.sender?.photoThumbUrl),
                isSystemUser: raw?.sender?.isSystemUser === true,
            },
            body: `${raw?.body ?? ''}`.trim(),
            sentAtUtc: `${raw?.sentAtUtc ?? ''}`.trim(),
            notification: this.normalizeNotification(raw?.notification),
            announcement: this.normalizeAnnouncement(raw?.announcement),
        };
    }

    private normalizeNotification(raw: any): ChatNotificationPayload | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const code = `${raw?.code ?? ''}`.trim();
        if (code.length < 1)
            return null;

        return {
            code,
            title: this.toNullableText(raw?.title),
            action: this.normalizeNotificationAction(raw?.action),
            context: raw?.context && typeof raw.context === 'object' && !Array.isArray(raw.context)
                ? { ...raw.context }
                : null,
        };
    }

    private normalizeAnnouncement(raw: any): ChatAnnouncementPayload | null {
        const normalized = this.normalizeNotification(raw);
        if (!normalized)
            return null;

        return {
            ...normalized,
            code: normalized.code as ChatAnnouncementPayload['code'],
        };
    }

    private normalizeNotificationAction(raw: any): ChatNotificationAction | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const target = `${raw?.target ?? ''}`.trim();
        if (target.length < 1)
            return null;

        return {
            target: target as ChatNotificationAction['target'],
            conversationId: this.toPositiveInt(raw?.conversationId),
        };
    }

    private normalizeMessageReadPayload(raw: any): ChatMessageReadPayload {
        return {
            conversationId: this.toPositiveInt(raw?.conversationId) ?? 0,
            lastReadMessageId: this.toPositiveInt(raw?.lastReadMessageId) ?? 0,
            userId: `${raw?.userId ?? ''}`.trim(),
            uid: `${raw?.uid ?? ''}`.trim(),
        };
    }

    private normalizeConversationType(value: any): ChatConversationSummary['type'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'campaign' || normalized === 'group')
            return normalized;
        return 'direct';
    }

    private normalizeParticipantStatus(value: any): ChatConversationSummary['participantStatus'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'left' || normalized === 'removed')
            return normalized;
        return 'active';
    }

    private normalizeWebSocketTicketResponse(raw: any): ChatWebSocketTicketResponse {
        return {
            ticket: `${raw?.ticket ?? ''}`.trim(),
            expiresAtUtc: this.toNullableText(raw?.expiresAtUtc),
            websocketUrl: this.toNullableText(raw?.websocketUrl),
        };
    }

    private async buildAuthHeaders(): Promise<HttpHeaders> {
        const user = this.auth.currentUser;
        if (!user)
            throw new ProfileApiError('Sesión no iniciada.', 'UNAUTHORIZED', 401);

        const idToken = await user.getIdToken();
        if (`${idToken ?? ''}`.trim().length < 1)
            throw new ProfileApiError('Token no disponible.', 'TOKEN_INVALID', 401);

        return new HttpHeaders({
            Authorization: `Bearer ${idToken}`,
        });
    }

    private toProfileApiError(error: any, fallbackMessage: string): ProfileApiError {
        if (error instanceof ProfileApiError)
            return error;

        if (error instanceof HttpErrorResponse) {
            const code = `${error.error?.code ?? ''}`.trim();
            const message = `${error.error?.message ?? fallbackMessage}`.trim() || fallbackMessage;
            return new ProfileApiError(message, code, error.status || 0);
        }

        return new ProfileApiError(`${error?.message ?? fallbackMessage}`.trim() || fallbackMessage, '', 0);
    }

    private normalizeLimit(value: number, fallback: number = 25): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed < 1)
            return fallback;
        return Math.min(100, parsed);
    }

    private normalizeOffset(value: number): number {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private toNonNegativeInt(value: any): number {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }

    private toNullableText(value: any): string | null {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : null;
    }

    private normalizeGroupDraft(title: string, participantUids: string[]): ChatGroupCreateDraft {
        const normalizedTitle = `${title ?? ''}`.trim();
        if (normalizedTitle.length < 1)
            throw new ProfileApiError('El grupo debe tener un nombre.', 'CHAT_GROUP_TITLE_EMPTY', 400);

        const normalizedParticipantUids = Array.isArray(participantUids)
            ? [...new Set(participantUids.map((item) => `${item ?? ''}`.trim()).filter((item) => item.length > 0))]
            : [];
        if (normalizedParticipantUids.length < 1)
            throw new ProfileApiError('Debes seleccionar al menos un participante.', 'CHAT_GROUP_PARTICIPANTS_EMPTY', 400);

        return {
            title: normalizedTitle,
            participantUids: normalizedParticipantUids,
        };
    }

    private logChatMutation(action: string, details: Record<string, any>): void {
        console.debug(`[ChatApi] ${action}`, details);
    }

    private logChatMutationError(action: string, error: any, details: Record<string, any>): void {
        if (error instanceof HttpErrorResponse) {
            console.error(`[ChatApi] ${action} failed`, {
                ...details,
                status: error.status,
                statusText: error.statusText,
                apiCode: `${error.error?.code ?? ''}`.trim() || null,
                apiMessage: `${error.error?.message ?? ''}`.trim() || null,
                errorBody: error.error ?? null,
            });
            return;
        }

        console.error(`[ChatApi] ${action} failed`, {
            ...details,
            error,
        });
    }
}
