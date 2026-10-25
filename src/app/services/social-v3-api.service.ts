import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProfileApiError } from '../interfaces/user-account';
import {
    SocialCommunityRankings,
    SocialCommunityRole,
    SocialCommunitySort,
    SocialCommunityStats,
    SocialCommunityUserItem,
    SocialContactConversationResponse,
    SocialEnvelope,
    SocialLfgApplication,
    SocialLfgApplicationStatus,
    SocialLfgPost,
    SocialLfgPostUpsertInput,
    SocialLfgStatus,
    SocialRankingItem,
    SocialRankingMetric,
    SocialRelationshipProfile,
    SocialWebSocketEvent,
    SocialWebSocketTicketResponse,
} from '../interfaces/social-v3';
import { cabeceraApiConFirebase } from './platform-session.service';
import { errorDePerfil } from './utils/error-api';
import { toNullableText } from 'src/app/services/utils/normalizacion';

@Injectable({
    providedIn: 'root'
})
export class SocialV3ApiService {
    private readonly socialBaseUrl = `${environment.apiUrl}social`;

    constructor(
        private http: HttpClient,
        private auth: Auth,
    ) { }

    async listCommunityUsers(filters: {
        query?: string | null;
        role?: SocialCommunityRole | null;
        sort?: SocialCommunitySort | null;
        limit?: number;
        offset?: number;
    } = {}): Promise<SocialEnvelope<SocialCommunityUserItem>> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.socialBaseUrl}/community/users`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.compactParams({
                        query: toNullableText(filters.query),
                        role: toNullableText(filters.role),
                        sort: toNullableText(filters.sort) ?? 'recent',
                        limit: `${this.normalizeLimit(filters.limit, 25)}`,
                        offset: `${this.normalizeOffset(filters.offset)}`,
                    }),
                })
            );
            return this.normalizeEnvelope(response, (raw) => this.normalizeCommunityUserItem(raw));
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo cargar la comunidad.');
        }
    }

    async getCommunityStats(): Promise<SocialCommunityStats> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.socialBaseUrl}/community/stats`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return {
                visibleUsers: this.toNonNegativeInt(response?.visibleUsers),
                publicCharacters: this.toNonNegativeInt(response?.publicCharacters),
                activeCampaigns: this.toNonNegativeInt(response?.activeCampaigns),
                activeGroups: this.toNonNegativeInt(response?.activeGroups),
                friendLinks: this.toNonNegativeInt(response?.friendLinks),
            };
        } catch (error) {
            throw errorDePerfil(error, 'No se pudieron cargar las estadísticas de comunidad.');
        }
    }

    async getCommunityRankings(metric: SocialRankingMetric, limit: number = 10): Promise<SocialCommunityRankings> {
        const normalizedMetric = this.normalizeRankingMetric(metric);
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.socialBaseUrl}/community/rankings`, {
                    headers: await this.buildAuthHeaders(),
                    params: {
                        metric: normalizedMetric,
                        limit: `${this.normalizeLimit(limit, 10)}`,
                    },
                })
            );
            return {
                metric: this.normalizeRankingMetric(response?.metric ?? normalizedMetric),
                generatedAtUtc: toNullableText(response?.generatedAtUtc),
                items: Array.isArray(response?.items)
                    ? response.items.map((raw: any) => this.normalizeRankingItem(raw)).filter((item: SocialRankingItem) => item.uid.length > 0)
                    : [],
            };
        } catch (error) {
            throw errorDePerfil(error, 'No se pudieron cargar los rankings.');
        }
    }

    async getRelationshipProfile(uid: string): Promise<SocialRelationshipProfile> {
        const normalizedUid = `${uid ?? ''}`.trim();
        if (normalizedUid.length < 1)
            throw new ProfileApiError('UID inválido.', 'SOCIAL_RELATIONSHIP_UID_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.socialBaseUrl}/users/${encodeURIComponent(normalizedUid)}/relationship-profile`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeRelationshipProfile(response);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo cargar el perfil relacional.');
        }
    }

    async listLfgPosts(filters: {
        status?: SocialLfgStatus | null;
        limit?: number;
        offset?: number;
    } = {}): Promise<SocialEnvelope<SocialLfgPost>> {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.socialBaseUrl}/lfg/posts`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.compactParams({
                        status: toNullableText(filters.status),
                        limit: `${this.normalizeLimit(filters.limit, 25)}`,
                        offset: `${this.normalizeOffset(filters.offset)}`,
                    }),
                })
            );
            return this.normalizeEnvelope(response, (raw) => this.normalizeLfgPost(raw));
        } catch (error) {
            throw errorDePerfil(error, 'No se pudieron cargar las convocatorias.');
        }
    }

    async getLfgPost(postId: number): Promise<SocialLfgPost> {
        const normalizedPostId = this.toPositiveInt(postId);
        if (!normalizedPostId)
            throw new ProfileApiError('Convocatoria inválida.', 'SOCIAL_LFG_POST_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.socialBaseUrl}/lfg/posts/${normalizedPostId}`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeLfgPost(response);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo cargar la convocatoria.');
        }
    }

    async createLfgPost(input: SocialLfgPostUpsertInput): Promise<SocialLfgPost> {
        this.assertValidLfgPostInput(input, false);
        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.socialBaseUrl}/lfg/posts`,
                    this.normalizeLfgPostInput(input),
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeLfgPost(response);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo crear la convocatoria.');
        }
    }

    async updateLfgPost(postId: number, input: Partial<SocialLfgPostUpsertInput>): Promise<SocialLfgPost> {
        const normalizedPostId = this.toPositiveInt(postId);
        if (!normalizedPostId)
            throw new ProfileApiError('Convocatoria inválida.', 'SOCIAL_LFG_POST_INVALID', 400);
        this.assertValidLfgPostInput(input, true);

        try {
            const response = await firstValueFrom(
                this.http.patch<any>(
                    `${this.socialBaseUrl}/lfg/posts/${normalizedPostId}`,
                    this.normalizeLfgPostInput(input, true),
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeLfgPost(response);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo actualizar la convocatoria.');
        }
    }

    async listLfgApplications(postId: number, filters: {
        status?: SocialLfgApplicationStatus | null;
        limit?: number;
        offset?: number;
    } = {}): Promise<SocialEnvelope<SocialLfgApplication>> {
        const normalizedPostId = this.toPositiveInt(postId);
        if (!normalizedPostId)
            throw new ProfileApiError('Convocatoria inválida.', 'SOCIAL_LFG_POST_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.socialBaseUrl}/lfg/posts/${normalizedPostId}/applications`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.compactParams({
                        status: toNullableText(filters.status),
                        limit: `${this.normalizeLimit(filters.limit, 25)}`,
                        offset: `${this.normalizeOffset(filters.offset)}`,
                    }),
                })
            );
            return this.normalizeEnvelope(response, (raw) => this.normalizeLfgApplication(raw));
        } catch (error) {
            throw errorDePerfil(error, 'No se pudieron cargar las aplicaciones.');
        }
    }

    async createLfgApplication(postId: number, message: string): Promise<SocialLfgApplication> {
        const normalizedPostId = this.toPositiveInt(postId);
        const normalizedMessage = `${message ?? ''}`.trim();
        if (!normalizedPostId)
            throw new ProfileApiError('Convocatoria inválida.', 'SOCIAL_LFG_POST_INVALID', 400);
        if (normalizedMessage.length < 1)
            throw new ProfileApiError('El mensaje de aplicación no puede estar vacío.', 'SOCIAL_LFG_APPLICATION_MESSAGE_EMPTY', 400);

        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.socialBaseUrl}/lfg/posts/${normalizedPostId}/applications`,
                    { message: normalizedMessage },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeLfgApplication(response);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo enviar la aplicación.');
        }
    }

    async updateLfgApplication(postId: number, applicationId: number, status: SocialLfgApplicationStatus): Promise<SocialLfgApplication> {
        const normalizedPostId = this.toPositiveInt(postId);
        const normalizedApplicationId = this.toPositiveInt(applicationId);
        const normalizedStatus = this.normalizeApplicationStatus(status);
        if (!normalizedPostId || !normalizedApplicationId)
            throw new ProfileApiError('Aplicación inválida.', 'SOCIAL_LFG_APPLICATION_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.patch<any>(
                    `${this.socialBaseUrl}/lfg/posts/${normalizedPostId}/applications/${normalizedApplicationId}`,
                    { status: normalizedStatus },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeLfgApplication(response);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo actualizar la aplicación.');
        }
    }

    async openLfgContactConversation(postId: number): Promise<SocialContactConversationResponse> {
        const normalizedPostId = this.toPositiveInt(postId);
        if (!normalizedPostId)
            throw new ProfileApiError('Convocatoria inválida.', 'SOCIAL_LFG_POST_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.socialBaseUrl}/lfg/posts/${normalizedPostId}/contact-conversation`,
                    {},
                    { headers: await this.buildAuthHeaders() }
                )
            );
            const conversationId = `${response?.conversationId ?? ''}`.trim();
            if (conversationId.length < 1)
                throw new ProfileApiError('La API no devolvió una conversación válida.', 'SOCIAL_LFG_CONTACT_CONVERSATION_INVALID', 500);
            return {
                conversationId,
                created: response?.created === true,
                type: 'web',
                pendingMembers: response?.pendingMembers === true,
            };
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo abrir la conversación contextual.');
        }
    }

    async requestWebSocketTicket(): Promise<SocialWebSocketTicketResponse> {
        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.socialBaseUrl}/ws-ticket`,
                    {},
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return {
                ticket: `${response?.ticket ?? ''}`.trim(),
                expiresAtUtc: toNullableText(response?.expiresAtUtc),
                websocketUrl: toNullableText(response?.websocketUrl),
            };
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo abrir el ticket realtime social.');
        }
    }

    buildWebSocketUrl(websocketUrl: string | null | undefined, ticket: string): string {
        const normalizedTicket = `${ticket ?? ''}`.trim();
        if (normalizedTicket.length < 1)
            throw new ProfileApiError('Ticket realtime social no disponible.', 'SOCIAL_WS_TICKET_INVALID', 400);

        const preferredUrl = `${websocketUrl ?? ''}`.trim();
        const targetUrl = preferredUrl.length > 0 ? preferredUrl : this.resolveFallbackWebSocketBaseUrl();

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

    parseWebSocketEvent(raw: any): SocialWebSocketEvent | null {
        const type = `${raw?.type ?? ''}`.trim();
        if (type === 'lfg.post_created' || type === 'lfg.post_updated' || type === 'lfg.post_closed')
            return { type, payload: this.normalizeLfgPost(raw?.payload) } as SocialWebSocketEvent;
        if (type === 'pong')
            return { type, payload: {} };
        return null;
    }

    private normalizeEnvelope<T>(raw: any, mapItem: (value: any) => T): SocialEnvelope<T> {
        return {
            items: Array.isArray(raw?.items) ? raw.items.map((item: any) => mapItem(item)) : [],
            meta: {
                total: this.toNonNegativeInt(raw?.total),
                limit: this.toNonNegativeInt(raw?.limit),
                offset: this.toNonNegativeInt(raw?.offset),
                hasMore: raw?.hasMore === true,
            },
        };
    }

    private normalizeCommunityUserItem(raw: any): SocialCommunityUserItem {
        return {
            uid: `${raw?.uid ?? ''}`.trim(),
            displayName: toNullableText(raw?.displayName),
            photoThumbUrl: toNullableText(raw?.photoThumbUrl),
            role: this.normalizeCommunityRole(raw?.role),
            joinedAtUtc: toNullableText(raw?.joinedAtUtc),
            lastSeenAtUtc: toNullableText(raw?.lastSeenAtUtc),
            publicStats: {
                totalCharacters: this.toNonNegativeInt(raw?.publicStats?.totalCharacters),
                publicCharacters: this.toNonNegativeInt(raw?.publicStats?.publicCharacters),
                activeCampaigns: this.toNonNegativeInt(raw?.publicStats?.activeCampaigns),
                campaignsAsMaster: this.toNonNegativeInt(raw?.publicStats?.campaignsAsMaster),
                campaignsCreated: this.toNonNegativeInt(raw?.publicStats?.campaignsCreated),
            },
            relationship: {
                state: this.normalizeRelationshipState(raw?.relationship?.state),
                canOpenProfile: raw?.relationship?.canOpenProfile !== false,
            },
        };
    }

    private normalizeRankingItem(raw: any): SocialRankingItem {
        return {
            position: this.toNonNegativeInt(raw?.position),
            uid: `${raw?.uid ?? ''}`.trim(),
            displayName: toNullableText(raw?.displayName),
            photoThumbUrl: toNullableText(raw?.photoThumbUrl),
            value: this.toNonNegativeInt(raw?.value),
        };
    }

    private normalizeRelationshipProfile(raw: any): SocialRelationshipProfile {
        return {
            profile: {
                uid: `${raw?.profile?.uid ?? ''}`.trim(),
                displayName: toNullableText(raw?.profile?.displayName),
                photoThumbUrl: toNullableText(raw?.profile?.photoThumbUrl),
                bio: toNullableText(raw?.profile?.bio),
                pronouns: toNullableText(raw?.profile?.pronouns),
                joinedAtUtc: toNullableText(raw?.profile?.joinedAtUtc),
            },
            relationship: {
                state: this.normalizeRelationshipState(raw?.relationship?.state),
                mutualFriendsCount: this.toNonNegativeInt(raw?.relationship?.mutualFriendsCount),
                mutualCampaignsCount: this.toNonNegativeInt(raw?.relationship?.mutualCampaignsCount),
            },
            visibility: {
                showAuthenticatedBlock: raw?.visibility?.showAuthenticatedBlock === true,
                showFriendsBlock: raw?.visibility?.showFriendsBlock === true,
            },
            stats: {
                totalCharacters: this.toNonNegativeInt(raw?.stats?.totalCharacters),
                publicCharacters: this.toNonNegativeInt(raw?.stats?.publicCharacters),
                activeCampaigns: this.toNonNegativeInt(raw?.stats?.activeCampaigns),
                campaignsAsMaster: this.toNonNegativeInt(raw?.stats?.campaignsAsMaster),
                campaignsCreated: this.toNonNegativeInt(raw?.stats?.campaignsCreated),
            },
        };
    }

    private normalizeLfgPost(raw: any): SocialLfgPost {
        return {
            id: this.toPositiveInt(raw?.id) ?? 0,
            title: `${raw?.title ?? ''}`.trim(),
            summary: `${raw?.summary ?? ''}`.trim(),
            gameSystem: `${raw?.gameSystem ?? ''}`.trim(),
            campaignStyle: `${raw?.campaignStyle ?? ''}`.trim(),
            slotsTotal: this.toNonNegativeInt(raw?.slotsTotal),
            slotsOpen: this.toNonNegativeInt(raw?.slotsOpen),
            scheduleText: `${raw?.scheduleText ?? ''}`.trim(),
            language: `${raw?.language ?? ''}`.trim(),
            visibility: 'global',
            status: this.normalizeLfgStatus(raw?.status),
            author: {
                uid: `${raw?.author?.uid ?? ''}`.trim(),
                displayName: toNullableText(raw?.author?.displayName),
                photoThumbUrl: toNullableText(raw?.author?.photoThumbUrl),
            },
            createdAtUtc: toNullableText(raw?.createdAtUtc),
            updatedAtUtc: toNullableText(raw?.updatedAtUtc),
        };
    }

    private normalizeLfgApplication(raw: any): SocialLfgApplication {
        return {
            applicationId: this.toPositiveInt(raw?.applicationId) ?? 0,
            postId: this.toPositiveInt(raw?.postId) ?? 0,
            status: this.normalizeApplicationStatus(raw?.status),
            message: `${raw?.message ?? ''}`.trim(),
            applicant: {
                uid: `${raw?.applicant?.uid ?? ''}`.trim(),
                displayName: toNullableText(raw?.applicant?.displayName),
                photoThumbUrl: toNullableText(raw?.applicant?.photoThumbUrl),
            },
            createdAtUtc: toNullableText(raw?.createdAtUtc),
            resolvedAtUtc: toNullableText(raw?.resolvedAtUtc),
            permissions: {
                canWithdraw: raw?.permissions?.canWithdraw === true,
                canResolve: raw?.permissions?.canResolve === true,
            },
        };
    }

    private normalizeLfgPostInput(input: Partial<SocialLfgPostUpsertInput>, allowPartial: boolean = false): Partial<SocialLfgPostUpsertInput> {
        const normalized: Partial<SocialLfgPostUpsertInput> = {};
        const assignText = (key: keyof SocialLfgPostUpsertInput) => {
            if (!Object.prototype.hasOwnProperty.call(input, key))
                return;
            normalized[key] = `${input[key] ?? ''}`.trim() as any;
        };

        assignText('title');
        assignText('summary');
        assignText('gameSystem');
        assignText('campaignStyle');
        assignText('scheduleText');
        assignText('language');
        if (Object.prototype.hasOwnProperty.call(input, 'visibility'))
            normalized.visibility = 'global';
        if (Object.prototype.hasOwnProperty.call(input, 'status'))
            normalized.status = this.normalizeLfgStatus(input.status);
        if (Object.prototype.hasOwnProperty.call(input, 'slotsTotal'))
            normalized.slotsTotal = this.toPositiveInt(input.slotsTotal) ?? 1;

        if (allowPartial)
            return normalized;

        return {
            title: `${normalized.title ?? ''}`.trim(),
            summary: `${normalized.summary ?? ''}`.trim(),
            gameSystem: `${normalized.gameSystem ?? ''}`.trim(),
            campaignStyle: `${normalized.campaignStyle ?? ''}`.trim(),
            slotsTotal: this.toPositiveInt(normalized.slotsTotal) ?? 1,
            scheduleText: `${normalized.scheduleText ?? ''}`.trim(),
            language: `${normalized.language ?? ''}`.trim(),
            visibility: 'global',
            status: this.normalizeLfgStatus(normalized.status),
        };
    }

    private assertValidLfgPostInput(input: Partial<SocialLfgPostUpsertInput>, allowPartial: boolean): void {
        const shouldValidate = (key: keyof SocialLfgPostUpsertInput): boolean =>
            !allowPartial || Object.prototype.hasOwnProperty.call(input ?? {}, key);

        if (shouldValidate('title') && !this.hasMeaningfulLfgText(input?.title))
            throw new ProfileApiError('El título debe incluir texto real y no solo números.', 'SOCIAL_LFG_TITLE_INVALID', 400);
        if (shouldValidate('summary') && !this.hasMeaningfulLfgText(input?.summary))
            throw new ProfileApiError('El resumen debe incluir texto real y no solo números.', 'SOCIAL_LFG_SUMMARY_INVALID', 400);
        if (shouldValidate('gameSystem') && !this.hasMeaningfulLfgText(input?.gameSystem))
            throw new ProfileApiError('El sistema debe incluir texto real y no solo números.', 'SOCIAL_LFG_GAME_SYSTEM_INVALID', 400);
        if (shouldValidate('campaignStyle') && !this.hasMeaningfulLfgText(input?.campaignStyle))
            throw new ProfileApiError('El estilo de campaña debe incluir texto real y no solo números.', 'SOCIAL_LFG_CAMPAIGN_STYLE_INVALID', 400);
        if (shouldValidate('scheduleText') && !this.hasValidLfgSchedule(input?.scheduleText))
            throw new ProfileApiError('El horario debe incluir una hora válida, por ejemplo 18:00.', 'SOCIAL_LFG_SCHEDULE_INVALID', 400);
        if (shouldValidate('language') && !this.hasMeaningfulLfgText(input?.language))
            throw new ProfileApiError('El idioma debe incluir texto real y no solo números.', 'SOCIAL_LFG_LANGUAGE_INVALID', 400);
        if (shouldValidate('slotsTotal')) {
            const slotsTotal = Math.trunc(Number(input?.slotsTotal));
            if (!Number.isInteger(slotsTotal) || slotsTotal <= 0)
                throw new ProfileApiError('Las plazas totales deben ser un número mayor que 0.', 'SOCIAL_LFG_SLOTS_TOTAL_INVALID', 400);
        }
    }

    private async buildAuthHeaders(): Promise<HttpHeaders> {
        return new HttpHeaders(await cabeceraApiConFirebase(this.auth, ProfileApiError.sinSesion));
    }

    private resolveFallbackWebSocketBaseUrl(): string {
        if (!this.isLocalApiUrl(environment.apiUrl)) {
            throw new ProfileApiError(
                'El backend no devolvió websocketUrl para el gateway realtime social publicado.',
                'SOCIAL_WS_URL_MISSING',
                500
            );
        }

        const apiUrl = `${environment.apiUrl ?? ''}`.trim();
        const fallbackBase = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

        try {
            const parsed = new URL(apiUrl);
            parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
            if (parsed.hostname === 'localhost')
                parsed.hostname = '127.0.0.1';
            const basePath = parsed.pathname.endsWith('/') ? parsed.pathname.slice(0, -1) : parsed.pathname;
            parsed.pathname = `${basePath}/ws/social`;
            parsed.search = '';
            return parsed.toString();
        } catch {
            return `${fallbackBase
                .replace(/^http:/i, 'ws:')
                .replace(/^https:/i, 'wss:')
                .replace(/:\/\/localhost(?=[:/]|$)/i, '://127.0.0.1')}/ws/social`;
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

    private normalizeLimit(value: number | null | undefined, fallback: number = 25): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed < 1)
            return fallback;
        return Math.min(parsed, 100);
    }

    private normalizeOffset(value: number | null | undefined): number {
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

    private compactParams(params: Record<string, string | null | undefined>): Record<string, string> {
        return Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
            const normalized = `${value ?? ''}`.trim();
            if (normalized.length > 0)
                acc[key] = normalized;
            return acc;
        }, {});
    }

    private hasMeaningfulLfgText(value: any): boolean {
        const normalized = `${value ?? ''}`.trim();
        if (normalized.length < 1)
            return false;
        return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(normalized);
    }

    private hasValidLfgSchedule(value: any): boolean {
        const normalized = `${value ?? ''}`.trim();
        if (normalized.length < 1)
            return false;
        return /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/.test(normalized);
    }

    private normalizeCommunityRole(value: any): SocialCommunityRole {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'master' || normalized === 'colaborador' || normalized === 'admin')
            return normalized;
        return 'jugador';
    }

    private normalizeRelationshipState(value: any): SocialRelationshipProfile['relationship']['state'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'self' || normalized === 'friend')
            return normalized;
        return 'none';
    }

    private normalizeRankingMetric(value: any): SocialRankingMetric {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'campaigns_created'
            || normalized === 'campaigns_as_master'
            || normalized === 'active_campaigns'
            || normalized === 'seniority')
            return normalized;
        return 'public_characters';
    }

    private normalizeLfgStatus(value: any): SocialLfgStatus {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'paused' || normalized === 'closed')
            return normalized;
        return 'open';
    }

    private normalizeApplicationStatus(value: any): SocialLfgApplicationStatus {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'accepted' || normalized === 'rejected' || normalized === 'withdrawn')
            return normalized;
        return 'pending';
    }
}
