import { Injectable } from '@angular/core';
import { UserAbuseLockReportInput } from '../interfaces/user-moderation';
import { UserProfileApiService } from './user-profile-api.service';
import { UserService } from './user.service';

export type ApiActionGuardStatus = 'allowed' | 'cooldown';

export interface ApiActionGuardDecision {
    status: ApiActionGuardStatus;
    blockedUntil: number | null;
    blocksToday: number;
    newlyBlocked: boolean;
}

interface ApiActionGuardState {
    version: 2;
    dayKey: string;
    blocksToday: number;
    actions: Record<string, {
        attempts: number[];
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class ApiActionGuardService {
    readonly maxBurstClicks = 5;
    readonly burstWindowMs = 10_000;
    private readonly abuseLockReason = 'frontend_api_button_spam';
    private readonly abuseLockSource = 'web';
    private readonly abuseLockSyncInFlight = new Map<string, Promise<void>>();

    constructor(
        private userProfileApiSvc: UserProfileApiService,
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
                newlyBlocked: false,
            };
        }

        const now = Date.now();
        const state = this.readState(uid, now);
        const action = state.actions[key] ?? { attempts: [] };
        const attempts = action.attempts.filter((attempt) => now - attempt <= this.burstWindowMs);
        if (attempts.length >= this.maxBurstClicks) {
            state.blocksToday += 1;
            state.actions[key] = {
                attempts: [],
            };
            this.writeState(uid, state);

            const decision: ApiActionGuardDecision = {
                status: 'allowed',
                blockedUntil: null,
                blocksToday: state.blocksToday,
                newlyBlocked: true,
            };
            void this.syncAbuseLockIfNeeded(uid, decision);
            return decision;
        }

        state.actions[key] = {
            attempts: [...attempts, now],
        };
        this.writeState(uid, state);
        return {
            status: 'allowed',
            blockedUntil: null,
            blocksToday: state.blocksToday,
            newlyBlocked: false,
        };
    }

    getBlockedMessage(decision: ApiActionGuardDecision): string {
        void decision;
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
            const parsed = JSON.parse(raw) as (Partial<ApiActionGuardState> & { version?: number; sessionLocked?: boolean; }) | null;
            const version = Math.trunc(Number(parsed?.version ?? 0));
            if (!parsed || (version !== 1 && version !== 2))
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
                    },
                ])
            );

            return {
                version: 2,
                dayKey: fallback.dayKey,
                blocksToday: this.toNonNegativeInt(parsed.blocksToday),
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
            version: 2,
            dayKey: this.toDayKey(now),
            blocksToday: 0,
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
        if (uid.length < 1 || decision.newlyBlocked !== true)
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

    private publishAbuseLockSyncNotification(
        uid: string,
        _decision: ApiActionGuardDecision,
        _clientDate: string,
        response: any
    ): void {
        void uid;
        const compliance = response?.compliance ?? null;
        const restricted = this.responseHasCanonicalRestriction(response);
        if (!restricted && !compliance)
            return;
    }

    private applyAbuseLockResponse(response: any): void {
        const compliance = response?.compliance ?? null;
        if (compliance && this.responseHasCanonicalRestriction(response))
            this.userSvc.setCurrentCompliance(compliance);
        void this.userSvc.refreshCurrentPrivateProfile().catch(() => undefined);
    }

    private publishAbuseLockSyncFailure(uid: string, decision: ApiActionGuardDecision, _clientDate: string): void {
        void uid;
        void decision;
    }

    private guardNotificationKey(uid: string): string {
        return `api-action-guard.${uid}`;
    }

    private responseHasCanonicalRestriction(response: any): boolean {
        const compliance = response?.compliance ?? null;
        const status = `${response?.status ?? ''}`.trim().toLowerCase();
        const moderationStatus = `${response?.moderationStatus ?? ''}`.trim().toLowerCase();
        return compliance?.banned === true
            || !!compliance?.activeSanction
            || status === 'blocked'
            || status === 'banned'
            || moderationStatus === 'blocked'
            || moderationStatus === 'banned'
            || !!`${response?.blockedUntilUtc ?? ''}`.trim()
            || response?.isPermanent === true;
    }

}
