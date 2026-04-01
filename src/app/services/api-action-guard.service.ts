import { Injectable } from '@angular/core';
import { UserAbuseLockReportInput } from '../interfaces/user-moderation';
import { UserProfileApiService } from './user-profile-api.service';

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
    private readonly abuseLockSyncInFlight = new Map<string, Promise<void>>();

    constructor(
        private userProfileApiSvc: UserProfileApiService
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
            void this.syncAbuseLockIfNeeded(uid, decision);
            return decision;
        }

        if (action.blockedUntil > now) {
            state.actions[key] = {
                ...action,
                attempts: action.attempts.filter((attempt) => now - attempt <= this.burstWindowMs),
            };
            this.writeState(uid, state);
            return {
                status: 'cooldown',
                blockedUntil: action.blockedUntil,
                blocksToday: state.blocksToday,
                sessionLocked: false,
                newlyBlocked: false,
                newlySessionLocked: false,
            };
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
            .then(() => {
                sessionStorage.setItem(requestKey, new Date().toISOString());
            })
            .catch(() => undefined)
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
}
