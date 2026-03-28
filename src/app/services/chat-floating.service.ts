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
    private readonly listWindowSubject = new BehaviorSubject<FloatingChatListRuntimeState | null>(null);
    private readonly bubblesSubject = new BehaviorSubject<FloatingChatBubbleRuntimeState[]>([]);
    private readonly bubbleFeatureEnabledSubject = new BehaviorSubject<boolean>(true);
    private readonly autoOpenListSubject = new BehaviorSubject<boolean>(true);
    private readonly subscriptions = new Subscription();
    private persistTimer: number | null = null;
    private initialized = false;
    private zIndexCursor = 1500;
    private automaticPersistenceBlocked = false;

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
                    void this.bootstrapForCurrentUser();
                    return;
                }
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
        this.schedulePersist();
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
        this.bubblesSubject.next(next);
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
        this.bubblesSubject.next(next);
        this.schedulePersist();
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

    private async bootstrapForCurrentUser(): Promise<void> {
        this.automaticPersistenceBlocked = false;
        try {
            const settings = await this.userSettingsSvc.loadSettings(true);
            this.applyProfileSettings(settings.perfil);
            const persistedFloating = settings.mensajeria_flotante;

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
            this.bubblesSubject.next(bubbles);
        } catch {
            this.resetState();
        }
    }

    private resetState(): void {
        this.clearPersistTimer();
        this.automaticPersistenceBlocked = false;
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
        if (this.userSvc.CurrentUserUid.length < 1 || this.automaticPersistenceBlocked)
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
            const listWindow = this.buildPersistedListWindowState();
            const bubbles = this.isBubbleFeatureEnabled ? this.bubblesSubject.value : [];
            const floatingSettings: ChatFloatingSettings = {
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

            await this.userSettingsSvc.saveSettings({
                ...currentSettings,
                mensajeria_flotante: floatingSettings,
            });
        } catch (error) {
            if (this.isUnsupportedSettingsShapeError(error)) {
                this.automaticPersistenceBlocked = true;
                this.clearPersistTimer();
            }
        }
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

    private isUnsupportedSettingsShapeError(error: unknown): boolean {
        if (!(error instanceof ProfileApiError) || error.status !== 400)
            return false;

        const message = `${error.message ?? ''}`.trim().toLowerCase();
        return (message.includes('perfil') && message.includes('claves no soportadas'))
            || (message.includes('perfil') && message.includes('faltan obligatorias'))
            || message.includes('mensajeria_flotante');
    }
}
