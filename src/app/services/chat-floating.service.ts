import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
    ChatFloatingSettings,
    ChatFloatingBubbleState,
    ChatFloatingWindowState,
    FloatingWindowPlacementMinimized,
    FloatingWindowPlacementRestored,
    UserSettingsV1,
} from '../interfaces/user-settings';
import { ProfileApiError } from '../interfaces/user-account';
import { ChatRealtimeService } from './chat-realtime.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { UserSettingsService } from './user-settings.service';
import { UserService } from './user.service';

const FLOATING_SETTINGS_DRAFT_STORAGE_PREFIX = 'f35:chat-floating:draft:';

export interface FloatingChatListRuntimeState {
    open: boolean;
    mode: ChatFloatingWindowState['mode'];
    restoredPlacement: FloatingWindowPlacementRestored | null;
    minimizedPlacement: FloatingWindowPlacementMinimized | null;
    zIndex: number;
    updatedAt: number;
}

export interface FloatingChatBubbleRuntimeState {
    conversationId: number;
    mode: ChatFloatingBubbleState['mode'];
    restoredPlacement: FloatingWindowPlacementRestored | null;
    bubblePlacement: FloatingWindowPlacementMinimized | null;
    zIndex: number;
    updatedAt: number;
}

export interface FloatingChatOverlaySnapshot {
    listWindow: FloatingChatListRuntimeState | null;
    bubbles: FloatingChatBubbleRuntimeState[];
}

@Injectable({
    providedIn: 'root'
})
export class ChatFloatingService implements OnDestroy {
    private readonly bubbleVisualSize = 56;
    private readonly bubbleViewportPadding = 12;
    private readonly bubbleCollisionGap = 8;
    private readonly bubbleMaxCoveredRatio = 0.5;
    private readonly listWindowSubject = new BehaviorSubject<FloatingChatListRuntimeState | null>(null);
    private readonly bubblesSubject = new BehaviorSubject<FloatingChatBubbleRuntimeState[]>([]);
    private readonly bubbleFeatureEnabledSubject = new BehaviorSubject<boolean>(true);
    private readonly autoOpenListSubject = new BehaviorSubject<boolean>(true);
    private readonly subscriptions = new Subscription();
    private persistTimer: number | null = null;
    private initialized = false;
    private zIndexCursor = 1500;
    private automaticPersistenceBlocked = false;
    private bootstrappedUid = '';
    private persistInFlight: Promise<void> | null = null;

    readonly listWindow$ = this.listWindowSubject.asObservable();
    readonly bubbles$ = this.bubblesSubject.asObservable();
    readonly bubbleFeatureEnabled$ = this.bubbleFeatureEnabledSubject.asObservable();
    readonly autoOpenList$ = this.autoOpenListSubject.asObservable();

    constructor(
        private userSvc: UserService,
        private userSettingsSvc: UserSettingsService,
        private userProfileNavSvc: UserProfileNavigationService,
        private chatRealtimeSvc: ChatRealtimeService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.subscriptions.add(
            this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
                if (loggedIn === true) {
                    const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
                    if (currentUid.length < 1 || this.bootstrappedUid === currentUid)
                        return;
                    this.bootstrappedUid = currentUid;
                    void this.bootstrapForCurrentUser();
                    return;
                }
                this.bootstrappedUid = '';
                this.resetState();
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.clearPersistTimer();
    }

    get isBubbleFeatureEnabled(): boolean {
        return this.bubbleFeatureEnabledSubject.value !== false;
    }

    get isAutoOpenListEnabled(): boolean {
        return this.autoOpenListSubject.value !== false;
    }

    get isListWindowOpen(): boolean {
        return this.listWindowSubject.value?.open === true;
    }

    get hasOpenBubbles(): boolean {
        return this.bubblesSubject.value.length > 0;
    }

    applyProfileSettings(profile: Pick<UserSettingsV1['perfil'], 'autoAbrirVentanaChats' | 'permitirBurbujasChat'> | UserSettingsV1['perfil'] | null | undefined): void {
        this.autoOpenListSubject.next(profile?.autoAbrirVentanaChats !== false);
        const bubblesEnabled = profile?.permitirBurbujasChat !== false;
        this.bubbleFeatureEnabledSubject.next(bubblesEnabled);
        if (!bubblesEnabled) {
            this.bubblesSubject.next([]);
            this.chatRealtimeSvc.setActiveConversationId(null);
            this.schedulePersist();
        }
    }

    openOrFocusListWindow(): void {
        const current = this.listWindowSubject.value;
        const next: FloatingChatListRuntimeState = current
            ? {
                ...current,
                open: true,
                zIndex: this.nextZIndex(),
            }
            : {
                open: true,
                mode: 'window',
                restoredPlacement: null,
                minimizedPlacement: null,
                zIndex: this.nextZIndex(),
                updatedAt: Date.now(),
            };
        this.listWindowSubject.next(next);
        this.chatRealtimeSvc.setActiveConversationId(null);
    }

    closeListWindow(): void {
        const current = this.listWindowSubject.value;
        if (!current)
            return;
        this.listWindowSubject.next({
            ...current,
            open: false,
        });
        this.chatRealtimeSvc.setActiveConversationId(null);
    }

    focusListWindow(): void {
        const current = this.listWindowSubject.value;
        if (!current)
            return;
        this.listWindowSubject.next({
            ...current,
            open: true,
            zIndex: this.nextZIndex(),
        });
        this.chatRealtimeSvc.setActiveConversationId(null);
    }

    updateListWindowState(
        mode: ChatFloatingWindowState['mode'],
        restoredPlacement: FloatingWindowPlacementRestored | null,
        minimizedPlacement: FloatingWindowPlacementMinimized | null
    ): void {
        const current = this.listWindowSubject.value ?? {
            open: this.isAutoOpenListEnabled,
            mode: 'window' as const,
            restoredPlacement: null,
            minimizedPlacement: null,
            zIndex: this.nextZIndex(),
            updatedAt: Date.now(),
        };

        this.listWindowSubject.next({
            ...current,
            mode,
            restoredPlacement: restoredPlacement ? { ...restoredPlacement } : current.restoredPlacement,
            minimizedPlacement: minimizedPlacement ? { ...minimizedPlacement } : current.minimizedPlacement,
            updatedAt: Date.now(),
        });
        void this.persistStateSoon();
    }

    openConversation(conversationId: number): void {
        const normalizedConversationId = Math.trunc(Number(conversationId));
        if (!Number.isFinite(normalizedConversationId) || normalizedConversationId <= 0)
            return;

        if (!this.isBubbleFeatureEnabled) {
            this.userProfileNavSvc.openSocial({
                section: 'mensajes',
                conversationId: normalizedConversationId,
                requestId: Date.now(),
            });
            return;
        }

        const current = this.bubblesSubject.value;
        const existing = current.find((item) => item.conversationId === normalizedConversationId) ?? null;
        if (existing) {
            this.focusConversation(normalizedConversationId);
            return;
        }

        const next = [
            ...current,
            {
                conversationId: normalizedConversationId,
                mode: 'window' as const,
                restoredPlacement: null,
                bubblePlacement: null,
                zIndex: this.nextZIndex(),
                updatedAt: Date.now(),
            },
        ];
        this.bubblesSubject.next(this.normalizeBubbleCollisions(next));
        this.chatRealtimeSvc.setActiveConversationId(normalizedConversationId);
        this.schedulePersist();
    }

    focusConversation(conversationId: number): void {
        const normalizedConversationId = Math.trunc(Number(conversationId));
        if (!Number.isFinite(normalizedConversationId) || normalizedConversationId <= 0)
            return;

        const next = this.bubblesSubject.value.map((item) => item.conversationId === normalizedConversationId
            ? { ...item, zIndex: this.nextZIndex() }
            : item);
        this.bubblesSubject.next(next);
        this.chatRealtimeSvc.setActiveConversationId(normalizedConversationId);
    }

    updateConversationState(
        conversationId: number,
        mode: ChatFloatingBubbleState['mode'],
        restoredPlacement: FloatingWindowPlacementRestored | null,
        bubblePlacement: FloatingWindowPlacementMinimized | null
    ): void {
        const normalizedConversationId = Math.trunc(Number(conversationId));
        if (!Number.isFinite(normalizedConversationId) || normalizedConversationId <= 0)
            return;

        const next = this.bubblesSubject.value.map((item) => {
            if (item.conversationId !== normalizedConversationId)
                return item;
            return {
                ...item,
                mode,
                restoredPlacement: restoredPlacement ? { ...restoredPlacement } : item.restoredPlacement,
                bubblePlacement: bubblePlacement ? { ...bubblePlacement } : item.bubblePlacement,
                updatedAt: Date.now(),
            };
        });
        this.bubblesSubject.next(this.normalizeBubbleCollisions(
            next,
            mode === 'bubble' ? normalizedConversationId : null
        ));
        void this.persistStateSoon();
    }

    closeConversation(conversationId: number): void {
        const normalizedConversationId = Math.trunc(Number(conversationId));
        if (!Number.isFinite(normalizedConversationId) || normalizedConversationId <= 0)
            return;

        const next = this.bubblesSubject.value.filter((item) => item.conversationId !== normalizedConversationId);
        this.bubblesSubject.next(next);
        if (this.chatRealtimeSvc.isConversationFocused(normalizedConversationId))
            this.chatRealtimeSvc.setActiveConversationId(null);
        this.schedulePersist();
    }

    hideAllFloatingWindowsForOverlay(): FloatingChatOverlaySnapshot | null {
        const listWindow = this.listWindowSubject.value;
        const bubbles = this.bubblesSubject.value;
        const hasVisibleList = listWindow?.open === true;
        const hasVisibleBubbles = bubbles.length > 0;

        if (!hasVisibleList && !hasVisibleBubbles)
            return null;

        const snapshot: FloatingChatOverlaySnapshot = {
            listWindow: hasVisibleList && listWindow ? {
                ...listWindow,
                restoredPlacement: listWindow.restoredPlacement ? { ...listWindow.restoredPlacement } : null,
                minimizedPlacement: listWindow.minimizedPlacement ? { ...listWindow.minimizedPlacement } : null,
            } : null,
            bubbles: bubbles.map((item) => ({
                ...item,
                restoredPlacement: item.restoredPlacement ? { ...item.restoredPlacement } : null,
                bubblePlacement: item.bubblePlacement ? { ...item.bubblePlacement } : null,
            })),
        };

        if (hasVisibleList && listWindow)
            this.listWindowSubject.next({ ...listWindow, open: false });
        if (hasVisibleBubbles)
            this.bubblesSubject.next([]);
        this.chatRealtimeSvc.setActiveConversationId(null);

        return snapshot;
    }

    restoreFloatingWindowsAfterOverlay(snapshot: FloatingChatOverlaySnapshot | null): void {
        if (!snapshot)
            return;

        if (snapshot.listWindow) {
            this.listWindowSubject.next({
                ...snapshot.listWindow,
                open: true,
                zIndex: this.nextZIndex(),
                restoredPlacement: snapshot.listWindow.restoredPlacement ? { ...snapshot.listWindow.restoredPlacement } : null,
                minimizedPlacement: snapshot.listWindow.minimizedPlacement ? { ...snapshot.listWindow.minimizedPlacement } : null,
            });
        }

        if (snapshot.bubbles.length > 0) {
            const restoredBubbles = snapshot.bubbles.map((item) => ({
                ...item,
                zIndex: this.nextZIndex(),
                restoredPlacement: item.restoredPlacement ? { ...item.restoredPlacement } : null,
                bubblePlacement: item.bubblePlacement ? { ...item.bubblePlacement } : null,
            }));
            this.bubblesSubject.next(this.normalizeBubbleCollisions(restoredBubbles));
        }
    }

    private async bootstrapForCurrentUser(): Promise<void> {
        this.automaticPersistenceBlocked = false;
        const currentUid = `${this.bootstrappedUid ?? ''}`.trim();
        try {
            const settings = await this.userSettingsSvc.loadSettings(true);
            this.applyProfileSettings(settings.perfil);
            const cachedFloating = this.readCachedFloatingSettingsDraft(currentUid);
            const persistedFloating = this.pickMostRecentFloatingSettings(settings.mensajeria_flotante, cachedFloating);
            this.applyPersistedFloatingSettings(persistedFloating);
        } catch {
            const cachedFloating = this.readCachedFloatingSettingsDraft(currentUid);
            if (cachedFloating) {
                this.applyPersistedFloatingSettings(cachedFloating);
                return;
            }
            this.resetState();
        }
    }

    private resetState(): void {
        this.clearPersistTimer();
        this.automaticPersistenceBlocked = false;
        this.bootstrappedUid = '';
        this.listWindowSubject.next(null);
        this.bubblesSubject.next([]);
        this.autoOpenListSubject.next(true);
        this.bubbleFeatureEnabledSubject.next(true);
    }

    private nextZIndex(): number {
        this.zIndexCursor += 1;
        return this.zIndexCursor;
    }

    private schedulePersist(): void {
        if (this.userSvc.CurrentUserUid.length < 1)
            return;
        this.cacheFloatingSettingsDraft();
        if (this.automaticPersistenceBlocked)
            return;
        this.clearPersistTimer();
        this.persistTimer = window.setTimeout(() => {
            this.persistTimer = null;
            void this.persistState();
        }, 180);
    }

    private clearPersistTimer(): void {
        if (this.persistTimer !== null)
            window.clearTimeout(this.persistTimer);
        this.persistTimer = null;
    }

    private async persistState(): Promise<void> {
        if (this.userSvc.CurrentUserUid.length < 1 || this.automaticPersistenceBlocked)
            return;

        try {
            const currentSettings = await this.userSettingsSvc.loadSettings();
            const floatingSettings = this.buildFloatingSettingsPayload();

            await this.userSettingsSvc.saveSettings({
                ...currentSettings,
                mensajeria_flotante: floatingSettings,
            });
            this.clearCachedFloatingSettingsDraft();
        } catch (error) {
            if (this.isUnsupportedSettingsShapeError(error)) {
                this.automaticPersistenceBlocked = true;
                this.clearPersistTimer();
            }
        }
    }

    private async persistStateSoon(): Promise<void> {
        this.clearPersistTimer();
        this.cacheFloatingSettingsDraft();
        if (this.persistInFlight) {
            await this.persistInFlight.catch(() => undefined);
        }
        this.persistInFlight = this.persistState()
            .catch(() => undefined)
            .finally(() => {
                this.persistInFlight = null;
            });
        await this.persistInFlight;
    }

    private buildPersistedListWindowState(): FloatingChatListRuntimeState {
        const current = this.listWindowSubject.value;
        if (current)
            return current;

        return {
            open: this.isAutoOpenListEnabled,
            mode: 'window',
            restoredPlacement: null,
            minimizedPlacement: null,
            zIndex: this.nextZIndex(),
            updatedAt: Date.now(),
        };
    }

    private buildFloatingSettingsPayload(): ChatFloatingSettings {
        const listWindow = this.buildPersistedListWindowState();
        const bubbles = this.isBubbleFeatureEnabled ? this.bubblesSubject.value : [];
        return {
            version: 1,
            ventana_chat: {
                version: 1,
                mode: listWindow.mode,
                restoredPlacement: listWindow.restoredPlacement ? { ...listWindow.restoredPlacement } : null,
                minimizedPlacement: listWindow.minimizedPlacement ? { ...listWindow.minimizedPlacement } : null,
                updatedAt: listWindow.updatedAt,
            },
            burbujas_abiertas: bubbles.map((item) => ({
                version: 1,
                conversationId: item.conversationId,
                mode: item.mode,
                restoredPlacement: item.restoredPlacement ? { ...item.restoredPlacement } : null,
                bubblePlacement: item.bubblePlacement ? { ...item.bubblePlacement } : null,
                updatedAt: item.updatedAt,
            })),
        };
    }

    private applyPersistedFloatingSettings(persistedFloating: ChatFloatingSettings | null | undefined): void {
        const listPersisted = persistedFloating?.ventana_chat ?? null;
        this.listWindowSubject.next(listPersisted
            ? {
                open: this.isAutoOpenListEnabled,
                mode: listPersisted.mode,
                restoredPlacement: listPersisted.restoredPlacement ? { ...listPersisted.restoredPlacement } : null,
                minimizedPlacement: listPersisted.minimizedPlacement ? { ...listPersisted.minimizedPlacement } : null,
                zIndex: this.nextZIndex(),
                updatedAt: listPersisted.updatedAt,
            }
            : (this.isAutoOpenListEnabled
                ? {
                    open: true,
                    mode: 'window',
                    restoredPlacement: null,
                    minimizedPlacement: null,
                    zIndex: this.nextZIndex(),
                    updatedAt: Date.now(),
                }
                : null));

        const bubbles = this.isBubbleFeatureEnabled
            ? (persistedFloating?.burbujas_abiertas ?? []).map((item) => ({
                conversationId: item.conversationId,
                mode: item.mode,
                restoredPlacement: item.restoredPlacement ? { ...item.restoredPlacement } : null,
                bubblePlacement: item.bubblePlacement ? { ...item.bubblePlacement } : null,
                zIndex: this.nextZIndex(),
                updatedAt: item.updatedAt,
            }))
            : [];
        this.bubblesSubject.next(this.normalizeBubbleCollisions(bubbles));
    }

    private cacheFloatingSettingsDraft(): void {
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        if (currentUid.length < 1)
            return;

        try {
            localStorage.setItem(
                this.buildFloatingDraftStorageKey(currentUid),
                JSON.stringify(this.buildFloatingSettingsPayload())
            );
        } catch {
            // noop
        }
    }

    private readCachedFloatingSettingsDraft(uid: string): ChatFloatingSettings | null {
        const normalizedUid = `${uid ?? ''}`.trim();
        if (normalizedUid.length < 1)
            return null;

        try {
            const raw = localStorage.getItem(this.buildFloatingDraftStorageKey(normalizedUid));
            if (!raw)
                return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object'
                ? parsed as ChatFloatingSettings
                : null;
        } catch {
            return null;
        }
    }

    private clearCachedFloatingSettingsDraft(): void {
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        if (currentUid.length < 1)
            return;

        try {
            localStorage.removeItem(this.buildFloatingDraftStorageKey(currentUid));
        } catch {
            // noop
        }
    }

    private buildFloatingDraftStorageKey(uid: string): string {
        return `${FLOATING_SETTINGS_DRAFT_STORAGE_PREFIX}${uid}`;
    }

    private pickMostRecentFloatingSettings(
        persisted: ChatFloatingSettings | null | undefined,
        cached: ChatFloatingSettings | null | undefined
    ): ChatFloatingSettings | null {
        if (!persisted && !cached)
            return null;
        if (!persisted)
            return cached ?? null;
        if (!cached)
            return persisted ?? null;
        return this.getFloatingSettingsUpdatedAt(cached) >= this.getFloatingSettingsUpdatedAt(persisted)
            ? cached
            : persisted;
    }

    private getFloatingSettingsUpdatedAt(settings: ChatFloatingSettings | null | undefined): number {
        if (!settings)
            return 0;

        const candidates = [
            Number(settings.ventana_chat?.updatedAt ?? 0),
            ...(settings.burbujas_abiertas ?? []).map((item) => Number(item.updatedAt ?? 0)),
        ];
        return candidates.reduce((max, current) => Number.isFinite(current) && current > max ? current : max, 0);
    }

    private normalizeBubbleCollisions(
        bubbles: FloatingChatBubbleRuntimeState[],
        lockedConversationId: number | null = null
    ): FloatingChatBubbleRuntimeState[] {
        const normalized = bubbles.map((item) => ({
            ...item,
            restoredPlacement: item.restoredPlacement ? { ...item.restoredPlacement } : null,
            bubblePlacement: item.bubblePlacement ? { ...item.bubblePlacement } : null,
        }));

        (['left', 'right'] as const).forEach((side) => {
            const sideItems = normalized.filter((item) => item.mode === 'bubble' && item.bubblePlacement?.side === side);
            if (sideItems.length < 2) {
                sideItems.forEach((item) => {
                    if (item.bubblePlacement)
                        item.bubblePlacement.top = this.clampBubbleTop(item.bubblePlacement.top);
                });
                return;
            }

            const lockedItems = lockedConversationId === null
                ? []
                : sideItems.filter((item) => item.conversationId === lockedConversationId);
            const movableItems = sideItems
                .filter((item) => item.conversationId !== lockedConversationId)
                .sort((a, b) => (a.bubblePlacement?.top ?? 0) - (b.bubblePlacement?.top ?? 0));

            const placed: Array<{ conversationId: number; top: number; }> = [];
            lockedItems.forEach((item) => {
                if (!item.bubblePlacement)
                    return;
                item.bubblePlacement.top = this.clampBubbleTop(item.bubblePlacement.top);
                placed.push({
                    conversationId: item.conversationId,
                    top: item.bubblePlacement.top,
                });
            });

            movableItems.forEach((item) => {
                if (!item.bubblePlacement)
                    return;
                const desiredTop = this.clampBubbleTop(item.bubblePlacement.top);
                const nextTop = this.resolveBubbleTopWithoutOcclusion(desiredTop, placed);
                item.bubblePlacement.top = nextTop;
                placed.push({
                    conversationId: item.conversationId,
                    top: nextTop,
                });
            });
        });

        return normalized;
    }

    private resolveBubbleTopWithoutOcclusion(
        desiredTop: number,
        placed: Array<{ conversationId: number; top: number; }>
    ): number {
        const desired = this.clampBubbleTop(desiredTop);
        const overlapThreshold = this.bubbleVisualSize * this.bubbleMaxCoveredRatio;
        const separation = this.bubbleVisualSize + this.bubbleCollisionGap;

        const blockers = placed.filter((item) => Math.abs(item.top - desired) < overlapThreshold);
        if (blockers.length < 1)
            return desired;

        const queue: number[] = [];
        const visited = new Set<number>();
        blockers.forEach((item) => {
            queue.push(this.clampBubbleTop(item.top - separation));
            queue.push(this.clampBubbleTop(item.top + separation));
        });

        while (queue.length > 0) {
            queue.sort((a, b) => {
                const distance = Math.abs(a - desired) - Math.abs(b - desired);
                return distance !== 0 ? distance : a - b;
            });
            const candidate = queue.shift()!;
            const key = Math.round(candidate);
            if (visited.has(key))
                continue;
            visited.add(key);

            const hasOcclusion = placed.some((item) => Math.abs(item.top - candidate) < separation);
            if (!hasOcclusion)
                return candidate;

            placed
                .filter((item) => Math.abs(item.top - candidate) < separation)
                .forEach((item) => {
                    queue.push(this.clampBubbleTop(item.top - separation));
                    queue.push(this.clampBubbleTop(item.top + separation));
                });
        }

        return desired;
    }

    private clampBubbleTop(top: number): number {
        const viewportHeight = typeof window !== 'undefined' ? Math.max(480, window.innerHeight) : 720;
        const minTop = this.bubbleViewportPadding;
        const maxTop = Math.max(minTop, viewportHeight - this.bubbleVisualSize - this.bubbleViewportPadding);
        if (top < minTop)
            return minTop;
        if (top > maxTop)
            return maxTop;
        return top;
    }

    private isUnsupportedSettingsShapeError(error: unknown): boolean {
        if (!(error instanceof ProfileApiError) || error.status !== 400)
            return false;

        const message = `${error.message ?? ''}`.trim().toLowerCase();
        return (message.includes('perfil') && message.includes('claves no soportadas'))
            || (message.includes('perfil') && message.includes('faltan obligatorias'))
            || message.includes('mensajeria_flotante');
    }
}
