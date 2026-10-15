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
import { PlatformSessionService } from './platform-session.service';
import { UserSettingsService } from './user-settings.service';
import { UserService } from './user.service';

// El chat flotante de Rol (docs/roadmaps/FINALIZADO_chat-flotante-de-rol): las ventanas, las burbujas y su sitio son de Rol,
// y dentro van los elementos del chat de la plataforma (`<yosi-chat-bandeja>` y `<yosi-chat-conversacion>`,
// ecosistema-kit/CHAT.md). Solo en escritorio; en el móvil se usa `<yosi-chat>`.

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
    private bootstrappedUid = '';
    private persistInFlight: Promise<void> | null = null;

    readonly listWindow$ = this.listWindowSubject.asObservable();
    readonly bubbles$ = this.bubblesSubject.asObservable();
    readonly bubbleFeatureEnabled$ = this.bubbleFeatureEnabledSubject.asObservable();

    constructor(
        private userSvc: UserService,
        private userSettingsSvc: UserSettingsService,
        private platformSessionSvc: PlatformSessionService,
    ) { }

    /** Las ventanas de Rol solo se usan en escritorio, como antes de la migración; si no, `<yosi-chat>`. */
    static esEscritorio(
        width: number = typeof window !== 'undefined' ? window.innerWidth : 0,
        height: number = typeof window !== 'undefined' ? window.innerHeight : 0,
    ): boolean {
        return width > 1250 && height > 700 && height < width;
    }

    /**
     * Abre el chat: la ventana «Chats» o, si se indica, una conversación. Es la entrada única para Social, las
     * campañas y el buscador de partidas. Devuelve `false` si no se pudo abrir.
     */
    async abrir(conversationId?: number | string | null): Promise<boolean> {
        const conConversacion = conversationId !== undefined && conversationId !== null && `${conversationId}`.trim() !== '';
        const id = Math.trunc(Number(conversationId));
        if (conConversacion && (!Number.isFinite(id) || id <= 0))
            return false;
        if (!ChatFloatingService.esEscritorio())
            return this.platformSessionSvc.abrirChat(conConversacion ? id : undefined);
        if (conConversacion)
            this.openConversation(id);
        else
            this.openOrFocusListWindow();
        return true;
    }

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

    get isAutoOpenListEnabled(): boolean {
        return this.autoOpenListSubject.value !== false;
    }

    applyProfileSettings(profile: Pick<UserSettingsV1['perfil'], 'autoAbrirVentanaChats' | 'permitirBurbujasChat'> | UserSettingsV1['perfil'] | null | undefined): void {
        this.autoOpenListSubject.next(profile?.autoAbrirVentanaChats !== false);
        // Sin burbujas, las conversaciones se minimizan a una barra (antes se iban a Social, que ya no tiene mensajes).
        this.bubbleFeatureEnabledSubject.next(profile?.permitirBurbujasChat !== false);
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
    }

    closeListWindow(): void {
        const current = this.listWindowSubject.value;
        if (!current)
            return;
        this.listWindowSubject.next({
            ...current,
            open: false,
            updatedAt: Date.now(),
        });
        this.autoOpenListSubject.next(false);
        void this.persistManualListWindowClose();
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
        this.schedulePersist();
    }

    private async bootstrapForCurrentUser(): Promise<void> {
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
        if (this.userSvc.CurrentUserUid.length < 1)
            return;

        try {
            const currentSettings = await this.userSettingsSvc.loadSettings();
            const floatingSettings = this.buildFloatingSettingsPayload();

            await this.userSettingsSvc.saveSettings({
                ...currentSettings,
                mensajeria_flotante: floatingSettings,
            });
            this.clearCachedFloatingSettingsDraft();
        } catch {
            // Se reintenta en el siguiente cambio; mientras, el borrador local conserva el sitio de las ventanas.
        }
    }

    private async persistManualListWindowClose(): Promise<void> {
        if (this.userSvc.CurrentUserUid.length < 1)
            return;

        this.cacheFloatingSettingsDraft();
        try {
            const currentSettings = await this.userSettingsSvc.loadSettings();
            const floatingSettings = this.buildFloatingSettingsPayload();

            await this.userSettingsSvc.saveSettings({
                ...currentSettings,
                perfil: {
                    ...currentSettings.perfil,
                    autoAbrirVentanaChats: false,
                },
                mensajeria_flotante: floatingSettings,
            });
            this.clearCachedFloatingSettingsDraft();
        } catch {
            // Se reintenta en el siguiente cambio; mientras, el borrador local conserva el sitio de las ventanas.
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
        const bubbles = this.bubblesSubject.value;
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

        const bubbles = (persistedFloating?.burbujas_abiertas ?? []).map((item) => ({
            conversationId: item.conversationId,
            mode: item.mode,
            restoredPlacement: item.restoredPlacement ? { ...item.restoredPlacement } : null,
            bubblePlacement: item.bubblePlacement ? { ...item.bubblePlacement } : null,
            zIndex: this.nextZIndex(),
            updatedAt: item.updatedAt,
        }));
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

}
