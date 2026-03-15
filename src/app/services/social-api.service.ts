import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProfileApiError } from '../interfaces/user-account';
import {
    BlockedUserItem,
    FriendItem,
    FriendRequestDecision,
    FriendRequestItem,
    PagedListMeta,
    PagedListResult,
    SocialMutationResponse,
    SocialUserBasic,
} from '../interfaces/social';

@Injectable({
    providedIn: 'root'
})
export class SocialApiService {
    private readonly usuariosBaseUrl = `${environment.apiUrl}usuarios`;

    constructor(private http: HttpClient, private auth: Auth) { }

    async searchUsers(query: string, limit: number = 10): Promise<SocialUserBasic[]> {
        const q = `${query ?? ''}`.trim();
        if (q.length < 1)
            return [];

        try {
            const response = await firstValueFrom(
                this.http.get<SocialUserBasic[]>(`${this.usuariosBaseUrl}/search`, {
                    params: {
                        q,
                        limit: `${this.normalizeLimit(limit, 10, 50)}`,
                    },
                })
            );
            return Array.isArray(response)
                ? response.map((item) => this.normalizeSocialUserBasic(item)).filter((item) => item.uid.length > 0)
                : [];
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo buscar usuarios.');
        }
    }

    async listFriends(limit: number = 25, offset: number = 0): Promise<PagedListResult<FriendItem>> {
        return this.getPagedList<FriendItem>(
            `${this.usuariosBaseUrl}/me/friends`,
            {
                limit: `${this.normalizeLimit(limit)}`,
                offset: `${this.normalizeOffset(offset)}`,
            },
            (item) => this.normalizeFriendItem(item)
        );
    }

    async listReceivedFriendRequests(limit: number = 25, offset: number = 0): Promise<PagedListResult<FriendRequestItem>> {
        return this.getPagedList<FriendRequestItem>(
            `${this.usuariosBaseUrl}/me/friend-requests/received`,
            {
                limit: `${this.normalizeLimit(limit)}`,
                offset: `${this.normalizeOffset(offset)}`,
            },
            (item) => this.normalizeFriendRequestItem(item, 'received')
        );
    }

    async listSentFriendRequests(limit: number = 25, offset: number = 0): Promise<PagedListResult<FriendRequestItem>> {
        return this.getPagedList<FriendRequestItem>(
            `${this.usuariosBaseUrl}/me/friend-requests/sent`,
            {
                limit: `${this.normalizeLimit(limit)}`,
                offset: `${this.normalizeOffset(offset)}`,
            },
            (item) => this.normalizeFriendRequestItem(item, 'sent')
        );
    }

    async sendFriendRequest(targetUid: string): Promise<SocialMutationResponse<FriendRequestItem>> {
        const normalizedTargetUid = `${targetUid ?? ''}`.trim();
        if (normalizedTargetUid.length < 1)
            throw new ProfileApiError('Usuario destino inválido.', 'SOCIAL_TARGET_UID_INVALID', 400);

        this.logSocialMutation('sendFriendRequest', {
            url: `${this.usuariosBaseUrl}/me/friend-requests`,
            payload: { targetUid: normalizedTargetUid },
        });

        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.usuariosBaseUrl}/me/friend-requests`,
                    { targetUid: normalizedTargetUid },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return {
                message: this.toNullableText(response?.message) ?? 'Solicitud enviada.',
                item: response?.request ? this.normalizeFriendRequestItem(response.request) : null,
            };
        } catch (error) {
            this.logSocialMutationError('sendFriendRequest', error, {
                targetUid: normalizedTargetUid,
            });
            throw this.toProfileApiError(error, 'No se pudo enviar la solicitud de amistad.');
        }
    }

    async resolveFriendRequest(requestId: number, decision: FriendRequestDecision): Promise<SocialMutationResponse<FriendRequestItem>> {
        const id = this.toPositiveInt(requestId);
        if (!id)
            throw new ProfileApiError('Solicitud de amistad inválida.', 'SOCIAL_REQUEST_INVALID', 400);

        if (!['accept', 'reject', 'cancel'].includes(`${decision ?? ''}`))
            throw new ProfileApiError('Decisión inválida.', 'SOCIAL_REQUEST_DECISION_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.patch<any>(
                    `${this.usuariosBaseUrl}/me/friend-requests/${id}`,
                    { decision },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return {
                message: this.toNullableText(response?.message) ?? 'Solicitud actualizada.',
                item: response?.request ? this.normalizeFriendRequestItem(response.request) : null,
            };
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo actualizar la solicitud de amistad.');
        }
    }

    async deleteFriend(targetUid: string): Promise<void> {
        const normalizedTargetUid = `${targetUid ?? ''}`.trim();
        if (normalizedTargetUid.length < 1)
            throw new ProfileApiError('Usuario destino inválido.', 'SOCIAL_TARGET_UID_INVALID', 400);

        try {
            await firstValueFrom(
                this.http.delete<void>(
                    `${this.usuariosBaseUrl}/me/friends/${encodeURIComponent(normalizedTargetUid)}`,
                    { headers: await this.buildAuthHeaders() }
                )
            );
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo eliminar la amistad.');
        }
    }

    async listBlocks(): Promise<BlockedUserItem[]> {
        try {
            const response = await firstValueFrom(
                this.http.get<BlockedUserItem[]>(`${this.usuariosBaseUrl}/me/blocks`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return Array.isArray(response)
                ? response.map((item) => this.normalizeBlockedUserItem(item)).filter((item) => item.uid.length > 0)
                : [];
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudieron cargar los bloqueos.');
        }
    }

    async blockUser(targetUid: string): Promise<SocialMutationResponse<BlockedUserItem>> {
        const normalizedTargetUid = `${targetUid ?? ''}`.trim();
        if (normalizedTargetUid.length < 1)
            throw new ProfileApiError('Usuario destino inválido.', 'SOCIAL_TARGET_UID_INVALID', 400);

        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.usuariosBaseUrl}/me/blocks`,
                    { targetUid: normalizedTargetUid },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return {
                message: this.toNullableText(response?.message) ?? 'Usuario bloqueado.',
                item: response?.block ? this.normalizeBlockedUserItem(response.block) : null,
            };
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo bloquear al usuario.');
        }
    }

    async unblockUser(targetUid: string): Promise<void> {
        const normalizedTargetUid = `${targetUid ?? ''}`.trim();
        if (normalizedTargetUid.length < 1)
            throw new ProfileApiError('Usuario destino inválido.', 'SOCIAL_TARGET_UID_INVALID', 400);

        try {
            await firstValueFrom(
                this.http.delete<void>(
                    `${this.usuariosBaseUrl}/me/blocks/${encodeURIComponent(normalizedTargetUid)}`,
                    { headers: await this.buildAuthHeaders() }
                )
            );
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo desbloquear al usuario.');
        }
    }

    private async getPagedList<T>(
        url: string,
        params: Record<string, string>,
        normalizeItem: (raw: any) => T
    ): Promise<PagedListResult<T>> {
        try {
            const response = await firstValueFrom(
                this.http.get<any[]>(url, {
                    headers: await this.buildAuthHeaders(),
                    params,
                    observe: 'response',
                })
            );
            return this.normalizePagedResponse(response, normalizeItem);
        } catch (error) {
            throw this.toProfileApiError(error, 'No se pudo cargar el listado.');
        }
    }

    private normalizePagedResponse<T>(response: HttpResponse<any[]>, normalizeItem: (raw: any) => T): PagedListResult<T> {
        const body = Array.isArray(response.body) ? response.body : [];
        return {
            items: body.map((item) => normalizeItem(item)),
            meta: this.parsePagedMeta(response.headers),
        };
    }

    private parsePagedMeta(headers: HttpHeaders): PagedListMeta {
        const totalCount = this.toNonNegativeInt(headers.get('X-Total-Count'));
        const limit = this.toNonNegativeInt(headers.get('X-Limit'));
        const offset = this.toNonNegativeInt(headers.get('X-Offset'));
        const hasMoreRaw = `${headers.get('X-Has-More') ?? ''}`.trim().toLowerCase();

        return {
            totalCount,
            limit,
            offset,
            hasMore: hasMoreRaw === 'true' || hasMoreRaw === '1' || hasMoreRaw === 'yes',
        };
    }

    private normalizeFriendItem(raw: any): FriendItem {
        const base = this.normalizeSocialUserBasic(raw);
        return {
            ...base,
            friendsSince: this.toNullableText(raw?.friendsSince),
        };
    }

    private normalizeBlockedUserItem(raw: any): BlockedUserItem {
        const base = this.normalizeSocialUserBasic(raw);
        return {
            ...base,
            blockedAtUtc: this.toNullableText(raw?.blockedAtUtc),
        };
    }

    private normalizeFriendRequestItem(raw: any, fallbackDirection?: 'sent' | 'received'): FriendRequestItem {
        const direction = `${raw?.direction ?? fallbackDirection ?? ''}`.trim().toLowerCase();
        const status = `${raw?.status ?? ''}`.trim().toLowerCase();
        return {
            requestId: this.toPositiveInt(raw?.requestId) ?? 0,
            direction: direction === 'received' ? 'received' : 'sent',
            status: status === 'accepted' || status === 'rejected' || status === 'canceled' ? status : 'pending',
            createdAtUtc: this.toNullableText(raw?.createdAtUtc),
            target: this.normalizeSocialUserBasic(raw?.target),
        };
    }

    private normalizeSocialUserBasic(raw: any): SocialUserBasic {
        return {
            uid: `${raw?.uid ?? ''}`.trim(),
            displayName: this.toNullableText(raw?.displayName),
            photoThumbUrl: this.toNullableText(raw?.photoThumbUrl),
            allowDirectMessagesFromNonFriends: raw?.allowDirectMessagesFromNonFriends === true,
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

    private normalizeLimit(value: number, fallback: number = 25, max: number = 100): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed < 1)
            return fallback;
        return Math.min(max, parsed);
    }

    private normalizeOffset(value: number): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed < 0)
            return 0;
        return parsed;
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

    private logSocialMutation(action: string, details: Record<string, any>): void {
        console.debug(`[SocialApi] ${action}`, details);
    }

    private logSocialMutationError(action: string, error: any, details: Record<string, any>): void {
        if (error instanceof HttpErrorResponse) {
            console.error(`[SocialApi] ${action} failed`, {
                ...details,
                status: error.status,
                statusText: error.statusText,
                apiCode: `${error.error?.code ?? ''}`.trim() || null,
                apiMessage: `${error.error?.message ?? ''}`.trim() || null,
                errorBody: error.error ?? null,
            });
            return;
        }

        console.error(`[SocialApi] ${action} failed`, {
            ...details,
            error,
        });
    }
}
