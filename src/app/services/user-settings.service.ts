import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import {
    NuevoPersonajeGeneradorConfig,
    NuevoPersonajePreviewMinimizada,
    NuevoPersonajePreviewRestaurada,
    UserSettingsV1,
    createDefaultUserSettings,
} from '../interfaces/user-settings';
import { UserProfileApiService } from './user-profile-api.service';

const GENERADOR_MIGRATION_FLAG_PATH = 'migrations/generador_config_local_v1_done';

@Injectable({
    providedIn: 'root'
})
export class UserSettingsService {
    private readonly authReadyPromise: Promise<void>;
    private settingsCache: UserSettingsV1 | null = null;
    private migrationFlags = new Set<string>();

    constructor(private auth: Auth, private userProfileApiSvc: UserProfileApiService) {
        this.authReadyPromise = new Promise((resolve) => {
            let unsubscribe: () => void = () => undefined;
            unsubscribe = onAuthStateChanged(
                this.auth,
                () => {
                    unsubscribe();
                    resolve();
                },
                () => resolve()
            );
        });
    }

    async loadGeneradorConfig(): Promise<NuevoPersonajeGeneradorConfig | null> {
        if (!await this.hasCurrentUid())
            return null;

        const settings = await this.loadSettings();
        return this.normalizeGeneradorConfig(settings?.nuevo_personaje?.generador_config);
    }

    async saveGeneradorConfig(data: Pick<NuevoPersonajeGeneradorConfig, 'minimoSeleccionado' | 'tablasPermitidas'>): Promise<void> {
        if (!await this.hasCurrentUid())
            return;

        const payload: NuevoPersonajeGeneradorConfig = {
            minimoSeleccionado: Math.trunc(Number(data.minimoSeleccionado)),
            tablasPermitidas: Math.trunc(Number(data.tablasPermitidas)),
            updatedAt: Date.now(),
        };
        const settings = await this.loadSettings();
        await this.saveSettings({
            ...settings,
            nuevo_personaje: {
                ...settings.nuevo_personaje,
                generador_config: payload,
            },
        });
    }

    async loadPreviewMinimizada(): Promise<NuevoPersonajePreviewMinimizada | null> {
        if (!await this.hasCurrentUid())
            return null;

        const settings = await this.loadSettings();
        return this.normalizePreviewMinimizada(settings?.nuevo_personaje?.preview_minimizada);
    }

    async savePreviewMinimizada(data: Pick<NuevoPersonajePreviewMinimizada, 'side' | 'top'>): Promise<void> {
        if (!await this.hasCurrentUid())
            return;

        const payload: NuevoPersonajePreviewMinimizada = {
            version: 1,
            side: data.side === 'right' ? 'right' : 'left',
            top: Number(data.top),
            updatedAt: Date.now(),
        };
        const settings = await this.loadSettings();
        await this.saveSettings({
            ...settings,
            nuevo_personaje: {
                ...settings.nuevo_personaje,
                preview_minimizada: payload,
            },
        });
    }

    async loadPreviewRestaurada(): Promise<NuevoPersonajePreviewRestaurada | null> {
        if (!await this.hasCurrentUid())
            return null;

        const settings = await this.loadSettings();
        return this.normalizePreviewRestaurada(settings?.nuevo_personaje?.preview_restaurada);
    }

    async savePreviewRestaurada(data: Pick<NuevoPersonajePreviewRestaurada, 'left' | 'top' | 'width' | 'height'>): Promise<void> {
        if (!await this.hasCurrentUid())
            return;

        const payload: NuevoPersonajePreviewRestaurada = {
            version: 1,
            left: Number(data.left),
            top: Number(data.top),
            width: Number(data.width),
            height: Number(data.height),
            updatedAt: Date.now(),
        };
        const settings = await this.loadSettings();
        await this.saveSettings({
            ...settings,
            nuevo_personaje: {
                ...settings.nuevo_personaje,
                preview_restaurada: payload,
            },
        });
    }

    async migrateLegacyLocalConfigOnce(legacyStorageKey: string): Promise<void> {
        const uid = await this.getCurrentUid();
        if (!uid)
            return;

        const migrationKey = `${uid}:${GENERADOR_MIGRATION_FLAG_PATH}`;
        const yaMigrado = this.migrationFlags.has(migrationKey);
        if (yaMigrado) {
            this.removeLegacyStorageItem(legacyStorageKey);
            return;
        }

        const legacyRaw = this.readLegacyStorageItem(legacyStorageKey);
        const legacyConfig = this.normalizeLegacyGeneradorConfig(legacyRaw);
        if (legacyConfig) {
            const currentSettings = await this.loadSettings();
            if (!currentSettings.nuevo_personaje.generador_config)
                await this.saveGeneradorConfig(legacyConfig);
        }

        this.migrationFlags.add(migrationKey);
        this.removeLegacyStorageItem(legacyStorageKey);
    }

    async loadSettings(forceRefresh: boolean = false): Promise<UserSettingsV1> {
        if (!await this.hasCurrentUid())
            return createDefaultUserSettings();

        if (!forceRefresh && this.settingsCache)
            return this.cloneSettings(this.settingsCache);

        const settings = await this.userProfileApiSvc.getMySettings();
        this.settingsCache = this.cloneSettings(settings);
        return this.cloneSettings(settings);
    }

    async saveSettings(settings: UserSettingsV1): Promise<UserSettingsV1> {
        if (!await this.hasCurrentUid())
            return createDefaultUserSettings();

        const normalizado = this.normalizeSettingsDocument(settings);
        const response = await this.userProfileApiSvc.replaceMySettings(normalizado);
        this.settingsCache = this.cloneSettings(response);
        return this.cloneSettings(response);
    }

    async loadProfileSettings(): Promise<UserSettingsV1['perfil']> {
        const settings = await this.loadSettings();
        return {
            visibilidadPorDefectoPersonajes: settings.perfil.visibilidadPorDefectoPersonajes === true,
            mostrarPerfilPublico: settings.perfil.mostrarPerfilPublico !== false,
            allowDirectMessagesFromNonFriends: settings.perfil.allowDirectMessagesFromNonFriends === true,
        };
    }

    async saveProfileSettings(data: Partial<UserSettingsV1['perfil']>): Promise<UserSettingsV1['perfil']> {
        const settings = await this.loadSettings();
        const next = await this.saveSettings({
            ...settings,
            perfil: {
                visibilidadPorDefectoPersonajes: data.visibilidadPorDefectoPersonajes ?? settings.perfil.visibilidadPorDefectoPersonajes,
                mostrarPerfilPublico: data.mostrarPerfilPublico ?? settings.perfil.mostrarPerfilPublico,
                allowDirectMessagesFromNonFriends: data.allowDirectMessagesFromNonFriends ?? settings.perfil.allowDirectMessagesFromNonFriends,
            },
        });
        return next.perfil;
    }

    async clearPreviewPlacements(): Promise<void> {
        const settings = await this.loadSettings();
        await this.saveSettings({
            ...settings,
            nuevo_personaje: {
                ...settings.nuevo_personaje,
                preview_minimizada: null,
                preview_restaurada: null,
            },
        });
    }

    private async getCurrentUid(): Promise<string | null> {
        await this.authReadyPromise;
        const uid = `${this.auth.currentUser?.uid ?? ''}`.trim();
        return uid.length > 0 ? uid : null;
    }

    private async hasCurrentUid(): Promise<boolean> {
        return (await this.getCurrentUid()) !== null;
    }

    private normalizeGeneradorConfig(raw: any): NuevoPersonajeGeneradorConfig | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const minimoSeleccionado = Number(raw?.minimoSeleccionado);
        const tablasPermitidas = Number(raw?.tablasPermitidas);
        const updatedAt = Number(raw?.updatedAt);
        if (!Number.isFinite(minimoSeleccionado) || !Number.isFinite(tablasPermitidas) || !Number.isFinite(updatedAt))
            return null;

        return {
            minimoSeleccionado: Math.trunc(minimoSeleccionado),
            tablasPermitidas: Math.trunc(tablasPermitidas),
            updatedAt: Math.trunc(updatedAt),
        };
    }

    private normalizePreviewMinimizada(raw: any): NuevoPersonajePreviewMinimizada | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const version = Number(raw?.version);
        const side = `${raw?.side ?? ''}`.trim().toLowerCase();
        const top = Number(raw?.top);
        const updatedAt = Number(raw?.updatedAt);

        if (version !== 1)
            return null;
        if (side !== 'left' && side !== 'right')
            return null;
        if (!Number.isFinite(top) || !Number.isFinite(updatedAt))
            return null;

        return {
            version: 1,
            side,
            top,
            updatedAt: Math.trunc(updatedAt),
        };
    }

    private normalizePreviewRestaurada(raw: any): NuevoPersonajePreviewRestaurada | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const version = Number(raw?.version);
        const left = Number(raw?.left);
        const top = Number(raw?.top);
        const width = Number(raw?.width);
        const height = Number(raw?.height);
        const updatedAt = Number(raw?.updatedAt);

        if (version !== 1)
            return null;
        if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(updatedAt))
            return null;
        if (width <= 0 || height <= 0)
            return null;

        return {
            version: 1,
            left,
            top,
            width,
            height,
            updatedAt: Math.trunc(updatedAt),
        };
    }

    private normalizeLegacyGeneradorConfig(raw: string | null): Pick<NuevoPersonajeGeneradorConfig, 'minimoSeleccionado' | 'tablasPermitidas'> | null {
        if (!raw)
            return null;

        try {
            const parsed = JSON.parse(raw);
            const minimoSeleccionado = Number(parsed?.minimoSeleccionado);
            const tablasPermitidas = Number(parsed?.tablasPermitidas);
            if (!Number.isFinite(minimoSeleccionado) || !Number.isFinite(tablasPermitidas))
                return null;

            return {
                minimoSeleccionado: Math.trunc(minimoSeleccionado),
                tablasPermitidas: Math.trunc(tablasPermitidas),
            };
        } catch {
            return null;
        }
    }

    private readLegacyStorageItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    private removeLegacyStorageItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignorado: localStorage puede no estar disponible.
        }
    }

    private toBoolean(value: any): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value !== 0;
        if (typeof value === 'string') {
            const normalizado = value.trim().toLowerCase();
            if (normalizado === 'true' || normalizado === '1' || normalizado === 'si' || normalizado === 'sí')
                return true;
        }
        return false;
    }

    private normalizeSettingsDocument(raw: UserSettingsV1 | null | undefined): UserSettingsV1 {
        const base = createDefaultUserSettings();
        if (!raw || typeof raw !== 'object')
            return base;

        return {
            version: 1,
            nuevo_personaje: {
                generador_config: this.normalizeGeneradorConfig(raw?.nuevo_personaje?.generador_config),
                preview_minimizada: this.normalizePreviewMinimizada(raw?.nuevo_personaje?.preview_minimizada),
                preview_restaurada: this.normalizePreviewRestaurada(raw?.nuevo_personaje?.preview_restaurada),
            },
            perfil: {
                visibilidadPorDefectoPersonajes: raw?.perfil?.visibilidadPorDefectoPersonajes === true,
                mostrarPerfilPublico: raw?.perfil?.mostrarPerfilPublico !== false,
                allowDirectMessagesFromNonFriends: raw?.perfil?.allowDirectMessagesFromNonFriends === true,
            },
        };
    }

    private cloneSettings(settings: UserSettingsV1): UserSettingsV1 {
        return JSON.parse(JSON.stringify(settings)) as UserSettingsV1;
    }
}
