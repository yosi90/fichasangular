import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    ProfileApiError,
    UserPublicProfile,
} from '../interfaces/user-account';
import {
    UserRoleRequestStatus,
    UserRoleRequestTarget,
} from '../interfaces/user-role-request';
import {
    UserAbuseLockReportInput,
    UserAbuseLockReportResponse,
    UserCompliancePolicyState,
    UserComplianceSnapshot,
    UserModerationSanction,
} from '../interfaces/user-moderation';
import { cabeceraApiConFirebase } from './platform-session.service';
import { errorDePerfil } from './utils/error-api';
import { toNullableText, toPositiveInt } from 'src/app/services/utils/normalizacion';

@Injectable({
    providedIn: 'root'
})
export class UserProfileApiService {
    private readonly usuariosBaseUrl = `${environment.apiUrl}usuarios`;
    private readonly publicProfileCache = new Map<string, UserPublicProfile | null>();

    constructor(
        private http: HttpClient,
        private auth: Auth,
    ) { }

    async reportAbuseLock(input: UserAbuseLockReportInput): Promise<UserAbuseLockReportResponse> {
        const payload = this.normalizeAbuseLockPayload(input);
        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.usuariosBaseUrl}/me/security/abuse-lock`,
                    payload,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            return this.normalizeAbuseLockResponse(response);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo escalar el bloqueo técnico por abuso.');
        }
    }

    async getMyRoleRequestStatus(): Promise<UserRoleRequestStatus> {
        try {
            const response = await firstValueFrom(
                this.http.get<UserRoleRequestStatus>(`${this.usuariosBaseUrl}/me/role-request`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return this.normalizeRoleRequestStatus(response);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo cargar el estado de tu solicitud de rol.');
        }
    }

    async createRoleRequest(requestedRole: UserRoleRequestTarget, requestComment?: string | null): Promise<UserRoleRequestStatus> {
        const normalizedRole = `${requestedRole ?? ''}`.trim().toLowerCase();
        if (normalizedRole !== 'master' && normalizedRole !== 'colaborador')
            throw new ProfileApiError('Rol solicitado inválido.', 'ROLE_REQUEST_INVALID', 400);

        try {
            await firstValueFrom(
                this.http.post(
                    `${this.usuariosBaseUrl}/me/role-request`,
                    {
                        requestedRole: normalizedRole,
                        requestComment: `${requestComment ?? ''}`.trim() || null,
                    },
                    {
                        headers: await this.buildAuthHeaders(),
                    }
                )
            );
            return await this.getMyRoleRequestStatus();
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo crear la solicitud de rol.');
        }
    }

    /** Descarga de lo que Rol guarda de la persona (`GET /usuarios/me/datos`), como archivo JSON. */
    async downloadMyData(): Promise<void> {
        const headers = await this.buildAuthHeaders();
        const blob = await firstValueFrom(
            this.http.get(`${this.usuariosBaseUrl}/me/datos`, { headers, responseType: 'blob' })
        );
        const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `rol-mis-datos-${fecha}.json`;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    clearPublicProfileCache(uid?: string): void {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length > 0) {
            this.publicProfileCache.delete(uidNormalizado);
            return;
        }
        this.publicProfileCache.clear();
    }

    private async buildAuthHeaders(): Promise<HttpHeaders> {
        return new HttpHeaders(await cabeceraApiConFirebase(this.auth, ProfileApiError.sinSesion));
    }

    private normalizeCompliance(raw: any): UserComplianceSnapshot | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const activeSanction = this.normalizeModerationSanction(raw?.activeSanction)
            ?? this.buildEffectiveModerationSanction(raw);
        const moderationStatus = this.normalizeAbuseLockStatus(raw?.moderationStatus ?? raw?.effectiveStatus);
        return {
            banned: raw?.banned === true
                || moderationStatus === 'blocked'
                || moderationStatus === 'banned'
                || !!activeSanction,
            mustAcceptUsage: raw?.mustAcceptUsage === true,
            mustAcceptCreation: raw?.mustAcceptCreation === true,
            activeSanction,
            usage: this.normalizeCompliancePolicy(raw?.usage),
            creation: this.normalizeCompliancePolicy(raw?.creation),
        };
    }

    private normalizeCompliancePolicy(raw: any): UserCompliancePolicyState | null {
        if (!raw || typeof raw !== 'object')
            return null;

        return {
            version: toNullableText(raw?.version ?? raw?.versionTag ?? raw?.versionCode),
            accepted: raw?.accepted === true || raw?.isAccepted === true || raw?.acceptedVersionMatchesActive === true,
            acceptedAtUtc: toNullableText(raw?.acceptedAtUtc ?? raw?.acceptedAt),
            publishedAtUtc: toNullableText(raw?.publishedAtUtc ?? raw?.effectiveAtUtc ?? raw?.activeSinceUtc),
            title: toNullableText(raw?.title ?? raw?.name),
        };
    }

    private normalizeAbuseLockPayload(input: UserAbuseLockReportInput | null | undefined): UserAbuseLockReportInput {
        const clientDate = `${input?.clientDate ?? ''}`.trim();
        const localBlockCountToday = Math.max(1, this.toNonNegativeInt(input?.localBlockCountToday));
        return {
            reason: `${input?.reason ?? ''}`.trim() || 'frontend_api_button_spam',
            clientDate: /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : new Date().toISOString().slice(0, 10),
            localBlockCountToday,
            source: 'web',
        };
    }

    private normalizeAbuseLockResponse(raw: any): UserAbuseLockReportResponse {
        const status = this.normalizeAbuseLockStatus(raw?.status) ?? 'ignored';
        const moderationStatus = this.normalizeAbuseLockStatus(raw?.moderationStatus ?? raw?.effectiveStatus);
        const explicitSanction = this.normalizeModerationSanction(raw?.activeSanction ?? raw?.sanction);
        const blockedUntilUtc = toNullableText(raw?.blockedUntilUtc ?? explicitSanction?.endsAtUtc);
        const isPermanent = this.normalizeOptionalBoolean(raw?.isPermanent ?? explicitSanction?.isPermanent);
        const activeSanction = explicitSanction ?? this.buildFallbackAbuseLockSanction({
            status,
            moderationStatus,
            blockedUntilUtc,
            isPermanent,
        });
        return {
            status,
            moderationStatus,
            message: this.normalizeMultilineText(raw?.message ?? raw?.userVisibleMessage),
            activeSanction,
            blockedUntilUtc,
            isPermanent,
            restrictedActions: this.normalizeRestrictedActions(raw?.restrictedActions),
            compliance: this.normalizeAbuseLockCompliance(raw?.compliance ?? raw?.complianceSnapshot, {
                status,
                moderationStatus,
                activeSanction,
                blockedUntilUtc,
                isPermanent,
            }),
        };
    }

    private normalizeAbuseLockCompliance(
        rawCompliance: any,
        fallback: {
            status: string;
            moderationStatus: string | null;
            activeSanction: UserModerationSanction | null;
            blockedUntilUtc: string | null;
            isPermanent: boolean | null;
        }
    ): UserComplianceSnapshot | null {
        const normalized = this.normalizeCompliance(rawCompliance);
        const fallbackSanction = fallback.activeSanction ?? this.buildFallbackAbuseLockSanction(fallback);
        const fallbackBlocksAccess = this.abuseLockImpliesBlockingRestriction(fallback);

        if (!normalized)
            return fallbackBlocksAccess && fallbackSanction
                ? {
                    banned: true,
                    mustAcceptUsage: false,
                    mustAcceptCreation: false,
                    activeSanction: fallbackSanction,
                    usage: null,
                    creation: null,
                }
                : null;

        if (!fallbackBlocksAccess || !fallbackSanction)
            return normalized;

        return {
            ...normalized,
            banned: true,
            activeSanction: normalized.activeSanction ?? fallbackSanction,
        };
    }

    private buildFallbackAbuseLockSanction(fallback: {
        status: string;
        moderationStatus: string | null;
        blockedUntilUtc: string | null;
        isPermanent: boolean | null;
    }): UserModerationSanction | null {
        const status = this.normalizeAbuseLockStatus(fallback.status);
        const moderationStatus = this.normalizeAbuseLockStatus(fallback.moderationStatus);
        const endsAtUtc = toNullableText(fallback.blockedUntilUtc);
        const isPermanent = fallback.isPermanent === true
            || (endsAtUtc === null && (status === 'banned' || moderationStatus === 'banned'));
        if (!isPermanent && !endsAtUtc)
            return null;

        return {
            sanctionId: null,
            kind: 'restriction',
            code: isPermanent ? 'technical_account_restriction_permanent' : 'technical_account_restriction_temporary',
            name: isPermanent ? 'Restricción permanente de cuenta' : 'Restricción temporal de cuenta',
            startsAtUtc: null,
            endsAtUtc,
            isPermanent,
        };
    }

    private buildEffectiveModerationSanction(raw: any): UserModerationSanction | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const moderationStatus = this.normalizeAbuseLockStatus(raw?.moderationStatus ?? raw?.effectiveStatus);
        const blockedUntilUtc = toNullableText(raw?.blockedUntilUtc ?? raw?.expiresAtUtc ?? raw?.endAtUtc);
        const isPermanent = this.normalizeOptionalBoolean(raw?.isPermanent);
        if (moderationStatus !== 'blocked' && moderationStatus !== 'banned' && !blockedUntilUtc && isPermanent !== true)
            return null;

        return this.buildFallbackAbuseLockSanction({
            status: raw?.banned === true ? 'banned' : 'ignored',
            moderationStatus,
            blockedUntilUtc,
            isPermanent,
        });
    }

    private abuseLockImpliesBlockingRestriction(fallback: {
        status: string;
        moderationStatus: string | null;
        activeSanction: UserModerationSanction | null;
        blockedUntilUtc: string | null;
        isPermanent: boolean | null;
    }): boolean {
        const status = this.normalizeAbuseLockStatus(fallback.status);
        const moderationStatus = this.normalizeAbuseLockStatus(fallback.moderationStatus);
        return status === 'blocked'
            || status === 'banned'
            || moderationStatus === 'blocked'
            || moderationStatus === 'banned'
            || !!fallback.activeSanction
            || `${fallback.blockedUntilUtc ?? ''}`.trim().length > 0
            || fallback.isPermanent === true;
    }

    private normalizeRestrictedActions(raw: any): string[] {
        if (!Array.isArray(raw))
            return [];
        return raw
            .map((value) => `${value ?? ''}`.trim())
            .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);
    }

    private normalizeAbuseLockStatus(value: any): string | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        return normalized.length > 0 ? normalized : null;
    }

    private normalizeOptionalBoolean(value: any): boolean | null {
        if (value === true)
            return true;
        if (value === false)
            return false;
        return null;
    }

    private normalizeModerationSanction(raw: any): UserModerationSanction | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const sanctionId = toPositiveInt(raw?.sanctionId ?? raw?.id);
        const kind = toNullableText(raw?.kind ?? raw?.sanctionKind ?? raw?.type);
        const code = toNullableText(raw?.code ?? raw?.sanctionCode);
        const name = toNullableText(raw?.name ?? raw?.title ?? raw?.label);
        const startsAtUtc = toNullableText(raw?.startsAtUtc ?? raw?.startAtUtc ?? raw?.appliedAtUtc);
        const endsAtUtc = toNullableText(raw?.endsAtUtc ?? raw?.endAtUtc ?? raw?.expiresAtUtc);
        const hasExplicitPermanent = raw?.isPermanent === true || raw?.permanent === true;
        const hasExplicitNullEnd = (Object.prototype.hasOwnProperty.call(raw, 'endsAtUtc') && raw?.endsAtUtc === null)
            || (Object.prototype.hasOwnProperty.call(raw, 'endAtUtc') && raw?.endAtUtc === null)
            || (Object.prototype.hasOwnProperty.call(raw, 'expiresAtUtc') && raw?.expiresAtUtc === null);
        const isPermanent = hasExplicitPermanent || hasExplicitNullEnd;

        if (!sanctionId && !kind && !code && !name && !startsAtUtc && !endsAtUtc && !isPermanent)
            return null;

        return {
            sanctionId,
            kind,
            code,
            name,
            startsAtUtc,
            endsAtUtc,
            isPermanent,
        };
    }

    private normalizeRoleRequestStatus(raw: UserRoleRequestStatus | null | undefined): UserRoleRequestStatus {
        return {
            currentRole: (raw?.currentRole ?? 'jugador') as UserRoleRequestStatus['currentRole'],
            requestedRole: raw?.requestedRole ?? null,
            status: raw?.status ?? 'none',
            blockedUntilUtc: toNullableText(raw?.blockedUntilUtc),
            requestId: toPositiveInt(raw?.requestId),
            requestedAtUtc: toNullableText(raw?.requestedAtUtc),
            resolvedAtUtc: toNullableText(raw?.resolvedAtUtc),
            eligible: raw?.eligible === true,
            reasonCode: toNullableText(raw?.reasonCode),
            currentRoleAtRequest: raw?.currentRoleAtRequest ?? null,
            requestComment: this.normalizeMultilineText(raw?.requestComment),
            adminComment: toNullableText(raw?.adminComment),
        };
    }

    private toNonNegativeInt(value: any): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return 0;
        return Math.max(0, parsed);
    }

    private normalizeMultilineText(value: any): string | null {
        const text = `${value ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        return text.length > 0 ? text : null;
    }

}
