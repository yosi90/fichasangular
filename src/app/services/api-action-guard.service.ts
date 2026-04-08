import { Injectable } from '@angular/core';
import { UserAbuseLockReportInput } from '../interfaces/user-moderation';
import { UserProfileApiService } from './user-profile-api.service';
import { SessionNotificationCenterService } from './session-notification-center.service';
import { UserService } from './user.service';

export type ApiActionGuardStatus = 'allowed' | 'cooldown' | 'session_locked';

export interface ApiActionGuardDecision {
    status: ApiActionGuardStatus;
    blockedUntil: number | null;
    blocksToday: number;
    sessionLocked: boolean;
    newlyBlocked: boolean;
    newlySessionLocked: boolean;
}

interface ApiActionGuardState {
    version: 1;
    dayKey: string;
    blocksToday: number;
    sessionLocked: boolean;
    actions: Record<string, {
        attempts: number[];
        blockedUntil: number;
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class ApiActionGuardService {
    readonly maxBurstClicks = 5;
    readonly burstWindowMs = 10_000;
    readonly cooldownMs = 3 * 60_000;
    readonly maxBlocksPerDay = 3;
    private readonly abuseLockReason = 'frontend_api_button_spam';
    private readonly abuseLockSource = 'web';
    private readonly abuseReasonLabel = 'Demasiadas solicitudes en un corto espacio de tiempo.';
    private readonly abuseLockSyncInFlight = new Map<string, Promise<void>>();

    constructor(
        private userProfileApiSvc: UserProfileApiService,
        private sessionNotificationCenterSvc: SessionNotificationCenterService,
        private userSvc: UserService,
    ) { }

    shouldAllow(actorUid: string | null | undefined, actionKey: string): ApiActionGuardDecision {
        const uid = this.normalizeActorUid(actorUid);
        const key = this.normalizeActionKey(actionKey);
        if (uid.length < 1 || key.length < 1) {
            return {
                status: 'allowed',
                blockedUntil: null,
                blocksToday: 0,
                sessionLocked: false,
                newlyBlocked: false,
                newlySessionLocked: false,
            };
        }

        const now = Date.now();
        const state = this.readState(uid, now);
        const action = state.actions[key] ?? { attempts: [], blockedUntil: 0 };

        let decision: ApiActionGuardDecision;

        if (state.sessionLocked) {
            decision = {
                status: 'session_locked',
                blockedUntil: action.blockedUntil > now ? action.blockedUntil : null,
                blocksToday: state.blocksToday,
                sessionLocked: true,
                newlyBlocked: false,
                newlySessionLocked: false,
            };
            this.publishGuardNotification(uid, decision, state.dayKey);
            void this.syncAbuseLockIfNeeded(uid, decision);
            return decision;
        }

        if (action.blockedUntil > now) {
            state.actions[key] = {
                ...action,
                attempts: action.attempts.filter((attempt) => now - attempt <= this.burstWindowMs),
            };
            this.writeState(uid, state);
            decision = {
                status: 'cooldown',
                blockedUntil: action.blockedUntil,
                blocksToday: state.blocksToday,
                sessionLocked: false,
                newlyBlocked: false,
                newlySessionLocked: false,
            };
            this.publishGuardNotification(uid, decision, state.dayKey);
            return decision;
        }

        const attempts = action.attempts.filter((attempt) => now - attempt <= this.burstWindowMs);
        if (attempts.length >= this.maxBurstClicks) {
            const nextBlocksToday = state.blocksToday + 1;
            const sessionLocked = nextBlocksToday >= this.maxBlocksPerDay;
            state.blocksToday = nextBlocksToday;
            state.sessionLocked = sessionLocked;
            state.actions[key] = {
                attempts: [],
                blockedUntil: now + this.cooldownMs,
            };
            this.writeState(uid, state);

            decision = {
                status: sessionLocked ? 'session_locked' : 'cooldown',
                blockedUntil: now + this.cooldownMs,
                blocksToday: state.blocksToday,
                sessionLocked,
                newlyBlocked: true,
                newlySessionLocked: sessionLocked,
            };
            this.publishGuardNotification(uid, decision, state.dayKey);
            void this.syncAbuseLockIfNeeded(uid, decision);
            return decision;
        }

        state.actions[key] = {
            attempts: [...attempts, now],
            blockedUntil: 0,
        };
        this.writeState(uid, state);
        return {
            status: 'allowed',
            blockedUntil: null,
            blocksToday: state.blocksToday,
            sessionLocked: false,
            newlyBlocked: false,
            newlySessionLocked: false,
        };
    }

    getBlockedMessage(decision: ApiActionGuardDecision): string {
        if (decision.status === 'cooldown') {
            const countdown = this.formatDuration(decision.blockedUntil ? decision.blockedUntil - Date.now() : null);
            return countdown
                ? `Hemos detectado demasiadas solicitudes en muy poco tiempo. Hemos limitado temporalmente tus peticiones para proteger la estabilidad de la web. Razón: ${this.abuseReasonLabel} Podrás volver a intentarlo en ${countdown}.`
                : `Hemos detectado demasiadas solicitudes en muy poco tiempo. Hemos limitado temporalmente tus peticiones para proteger la estabilidad de la web. Razón: ${this.abuseReasonLabel}`;
        }
        if (decision.status === 'session_locked') {
            const countdown = this.formatDuration(this.resolveSessionLockReleaseAt(this.toDayKey(Date.now())) - Date.now());
            return countdown
                ? `Hemos observado un comportamiento inusual en esta sesión. Hemos limitado temporalmente tus peticiones para proteger la estabilidad de la web. Razón: ${this.abuseReasonLabel} La limitación de esta sesión termina en ${countdown}.`
                : `Hemos observado un comportamiento inusual en esta sesión. Hemos limitado temporalmente tus peticiones para proteger la estabilidad de la web. Razón: ${this.abuseReasonLabel}`;
        }
        return '';
    }

    getBlockedToastDedupeKey(actorUid: string | null | undefined, status: ApiActionGuardStatus): string | null {
        const uid = this.normalizeActorUid(actorUid);
        if (uid.length < 1)
            return null;
        return `${this.guardNotificationKey(uid)}.toast.${status}`;
    }

    private readState(uid: string, now: number): ApiActionGuardState {
        const fallback = this.createEmptyState(now);
        const raw = sessionStorage.getItem(this.storageKey(uid));
        if (!raw)
            return fallback;

        try {
            const parsed = JSON.parse(raw) as Partial<ApiActionGuardState> | null;
            if (!parsed || parsed.version !== 1)
                return fallback;
            if (`${parsed.dayKey ?? ''}` !== fallback.dayKey)
                return fallback;

            const actions = Object.fromEntries(
                Object.entries(parsed.actions ?? {}).map(([key, value]) => [
                    key,
                    {
                        attempts: Array.isArray(value?.attempts)
                            ? value!.attempts
                                .map((attempt) => Math.trunc(Number(attempt)))
                                .filter((attempt) => Number.isFinite(attempt) && attempt > 0)
                            : [],
                        blockedUntil: this.toNonNegativeInt(value?.blockedUntil),
                    },
                ])
            );

            return {
                version: 1,
                dayKey: fallback.dayKey,
                blocksToday: this.toNonNegativeInt(parsed.blocksToday),
                sessionLocked: parsed.sessionLocked === true,
                actions,
            };
        } catch {
            return fallback;
        }
    }

    private writeState(uid: string, state: ApiActionGuardState): void {
        sessionStorage.setItem(this.storageKey(uid), JSON.stringify(state));
    }

    private createEmptyState(now: number): ApiActionGuardState {
        return {
            version: 1,
            dayKey: this.toDayKey(now),
            blocksToday: 0,
            sessionLocked: false,
            actions: {},
        };
    }

    private storageKey(uid: string): string {
        return `fichas3.5.api-action-guard.${uid}`;
    }

    private abuseLockReportedKey(uid: string, clientDate: string, localBlockCountToday: number): string {
        return `fichas3.5.api-action-guard.abuse-lock.${uid}.${clientDate}.${localBlockCountToday}`;
    }

    private normalizeActorUid(value: string | null | undefined): string {
        return `${value ?? ''}`.trim();
    }

    private normalizeActionKey(value: string | null | undefined): string {
        return `${value ?? ''}`.trim().toLowerCase();
    }

    private toDayKey(now: number): string {
        return new Date(now).toISOString().slice(0, 10);
    }

    private toNonNegativeInt(value: unknown): number {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }

    private async syncAbuseLockIfNeeded(actorUid: string, decision: ApiActionGuardDecision): Promise<void> {
        const payload = this.buildAbuseLockPayload(actorUid, decision);
        if (!payload)
            return;

        const requestKey = this.abuseLockReportedKey(actorUid, payload.clientDate, payload.localBlockCountToday);
        if (sessionStorage.getItem(requestKey))
            return;

        const inFlight = this.abuseLockSyncInFlight.get(requestKey);
        if (inFlight) {
            await inFlight;
            return;
        }

        const task = this.userProfileApiSvc.reportAbuseLock(payload)
            .then((response) => {
                this.applyAbuseLockResponse(response);
                sessionStorage.setItem(requestKey, new Date().toISOString());
                this.publishAbuseLockSyncNotification(actorUid, decision, payload.clientDate, response);
            })
            .catch(() => {
                this.publishAbuseLockSyncFailure(actorUid, decision, payload.clientDate);
            })
            .finally(() => {
                this.abuseLockSyncInFlight.delete(requestKey);
            });

        this.abuseLockSyncInFlight.set(requestKey, task);
        await task;
    }

    private buildAbuseLockPayload(actorUid: string, decision: ApiActionGuardDecision): UserAbuseLockReportInput | null {
        const uid = this.normalizeActorUid(actorUid);
        if (uid.length < 1 || decision.sessionLocked !== true)
            return null;

        const localBlockCountToday = this.toNonNegativeInt(decision.blocksToday);
        if (localBlockCountToday < 1)
            return null;

        return {
            reason: this.abuseLockReason,
            clientDate: this.toDayKey(Date.now()),
            localBlockCountToday,
            source: this.abuseLockSource,
        };
    }

    private publishGuardNotification(uid: string, decision: ApiActionGuardDecision, dayKey: string): void {
        if (uid.length < 1 || (decision.status !== 'cooldown' && decision.status !== 'session_locked'))
            return;

        const countdownUntil = decision.status === 'session_locked'
            ? this.resolveSessionLockReleaseAt(dayKey)
            : decision.blockedUntil;
        this.sessionNotificationCenterSvc.add({
            dedupeKey: this.guardNotificationKey(uid),
            source: 'toast',
            level: 'warning',
            title: decision.status === 'session_locked'
                ? 'Tu sesión ha sido limitada temporalmente'
                : 'Protección temporal activada',
            message: decision.status === 'session_locked'
                ? `Hemos observado un comportamiento inusual en esta sesión. Hemos limitado temporalmente tus peticiones para proteger la estabilidad de la web. Razón: ${this.abuseReasonLabel}`
                : `Hemos detectado demasiadas solicitudes en muy poco tiempo. Hemos limitado temporalmente tus peticiones para proteger la estabilidad de la web. Razón: ${this.abuseReasonLabel}`,
            countdownUntil,
            countdownLabel: decision.status === 'session_locked'
                ? 'Fin de la limitación de la sesión'
                : 'Fin de la limitación temporal',
        });
    }

    private publishAbuseLockSyncNotification(
        uid: string,
        decision: ApiActionGuardDecision,
        clientDate: string,
        response: any
    ): void {
        if (uid.length < 1)
            return;

        const compliance = response?.compliance ?? null;
        const responseMessage = `${response?.message ?? ''}`.trim();
        const sanctionEndsAt = this.toTimestamp(compliance?.activeSanction?.endsAtUtc);
        const blockedUntil = this.toTimestamp(response?.blockedUntilUtc);
        const countdownUntil = sanctionEndsAt
            ?? blockedUntil
            ?? this.resolveSessionLockReleaseAt(clientDate);
        const restricted = compliance?.banned === true
            || !!compliance?.activeSanction
            || `${response?.status ?? ''}`.trim().toLowerCase() === 'blocked'
            || `${response?.status ?? ''}`.trim().toLowerCase() === 'banned'
            || `${response?.moderationStatus ?? ''}`.trim().toLowerCase() === 'blocked'
            || `${response?.moderationStatus ?? ''}`.trim().toLowerCase() === 'banned'
            || blockedUntil !== null
            || response?.isPermanent === true;
        const permanentRestriction = response?.isPermanent === true
            || compliance?.activeSanction?.isPermanent === true
            || (`${response?.status ?? ''}`.trim().toLowerCase() === 'banned' && blockedUntil === null);

        this.sessionNotificationCenterSvc.add({
            dedupeKey: this.guardNotificationKey(uid),
            source: 'toast',
            level: permanentRestriction ? 'error' : (restricted ? 'warning' : 'warning'),
            title: restricted
                ? (permanentRestriction ? 'Se ha aplicado una restricción de cuenta' : 'Se ha aplicado una restricción temporal')
                : 'Seguimos vigilando esta sesión',
            message: response?.status === 'ignored'
                ? `Hemos revisado la actividad reciente y no se ha aplicado una sanción adicional a tu cuenta. La limitación temporal de esta sesión sigue activa. Razón: ${this.abuseReasonLabel}`
                : restricted
                    ? (responseMessage || `Tras revisar el exceso de peticiones, se ha aplicado ${permanentRestriction ? 'una restricción de cuenta' : 'una restricción temporal'} a tu cuenta. Revisa tu estado de cumplimiento y moderación desde tu perfil. Razón: ${this.abuseReasonLabel}`)
                    : `La limitación temporal de esta sesión sigue activa mientras comprobamos la actividad reciente. Razón: ${this.abuseReasonLabel}`,
            countdownUntil: permanentRestriction ? null : countdownUntil,
            countdownLabel: restricted
                ? (permanentRestriction ? 'Restricción activa' : 'Fin estimado de la restricción')
                : (decision.status === 'session_locked' ? 'Fin de la limitación de la sesión' : 'Fin de la limitación temporal'),
        });
    }

    private applyAbuseLockResponse(response: any): void {
        const compliance = response?.compliance ?? null;
        if (!compliance)
            return;

        this.userSvc.setCurrentCompliance(compliance);
        void this.userSvc.refreshCurrentPrivateProfile().catch(() => undefined);
    }

    private publishAbuseLockSyncFailure(uid: string, decision: ApiActionGuardDecision, clientDate: string): void {
        if (uid.length < 1)
            return;

        this.sessionNotificationCenterSvc.add({
            dedupeKey: this.guardNotificationKey(uid),
            source: 'toast',
            level: 'error',
            title: 'No se pudo confirmar el reporte de seguridad',
            message: `La limitación temporal de esta sesión sigue activa, pero no se pudo confirmar el reporte de seguridad en este momento. Razón: ${this.abuseReasonLabel}`,
            countdownUntil: decision.status === 'session_locked'
                ? this.resolveSessionLockReleaseAt(clientDate)
                : decision.blockedUntil,
            countdownLabel: decision.status === 'session_locked'
                ? 'Fin de la limitación de la sesión'
                : 'Fin de la limitación temporal',
        });
    }

    private guardNotificationKey(uid: string): string {
        return `api-action-guard.${uid}`;
    }

    private resolveSessionLockReleaseAt(dayKey: string): number {
        const source = `${dayKey ?? ''}`.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(source))
            return Date.now();
        return Date.parse(`${source}T00:00:00.000Z`) + 24 * 60 * 60 * 1000;
    }

    private toTimestamp(value: string | null | undefined): number | null {
        const parsed = new Date(`${value ?? ''}`);
        return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }

    private formatDuration(valueMs: number | null): string {
        const totalSeconds = Math.ceil((valueMs ?? 0) / 1000);
        if (!Number.isFinite(totalSeconds) || totalSeconds <= 0)
            return '';
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0)
            return `${hours} h ${minutes.toString().padStart(2, '0')} min`;
        if (minutes > 0)
            return `${minutes} min ${seconds.toString().padStart(2, '0')} s`;
        return `${seconds} s`;
    }
}
