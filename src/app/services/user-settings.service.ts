import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Database, get, ref, set } from '@angular/fire/database';
import {
    NuevoPersonajeGeneradorConfig,
    NuevoPersonajePreviewMinimizada,
} from '../interfaces/user-settings';

const USER_SETTINGS_ROOT = 'UserSettings';
const GENERADOR_MIGRATION_FLAG_PATH = 'migrations/generador_config_local_v1_done';

@Injectable({
    providedIn: 'root'
})
export class UserSettingsService {
    private readonly authReadyPromise: Promise<void>;

    constructor(private db: Database, private auth: Auth) {
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
        const uid = await this.getCurrentUid();
        if (!uid)
            return null;

        const snapshot = await get(ref(this.db, `${USER_SETTINGS_ROOT}/${uid}/nuevo_personaje/generador_config`));
        return this.normalizeGeneradorConfig(snapshot.val());
    }

    async saveGeneradorConfig(data: Pick<NuevoPersonajeGeneradorConfig, 'minimoSeleccionado' | 'tablasPermitidas'>): Promise<void> {
        const uid = await this.getCurrentUid();
        if (!uid)
            return;

        const payload: NuevoPersonajeGeneradorConfig = {
            minimoSeleccionado: Math.trunc(Number(data.minimoSeleccionado)),
            tablasPermitidas: Math.trunc(Number(data.tablasPermitidas)),
            updatedAt: Date.now(),
        };
        await set(ref(this.db, `${USER_SETTINGS_ROOT}/${uid}/nuevo_personaje/generador_config`), payload);
    }

    async loadPreviewMinimizada(): Promise<NuevoPersonajePreviewMinimizada | null> {
        const uid = await this.getCurrentUid();
        if (!uid)
            return null;

        const snapshot = await get(ref(this.db, `${USER_SETTINGS_ROOT}/${uid}/nuevo_personaje/preview_minimizada`));
        return this.normalizePreviewMinimizada(snapshot.val());
    }

    async savePreviewMinimizada(data: Pick<NuevoPersonajePreviewMinimizada, 'side' | 'top'>): Promise<void> {
        const uid = await this.getCurrentUid();
        if (!uid)
            return;

        const payload: NuevoPersonajePreviewMinimizada = {
            version: 1,
            side: data.side === 'right' ? 'right' : 'left',
            top: Number(data.top),
            updatedAt: Date.now(),
        };
        await set(ref(this.db, `${USER_SETTINGS_ROOT}/${uid}/nuevo_personaje/preview_minimizada`), payload);
    }

    async migrateLegacyLocalConfigOnce(legacyStorageKey: string): Promise<void> {
        const uid = await this.getCurrentUid();
        if (!uid)
            return;

        const migrationRef = ref(this.db, `${USER_SETTINGS_ROOT}/${uid}/${GENERADOR_MIGRATION_FLAG_PATH}`);
        const migrationSnapshot = await get(migrationRef);
        const yaMigrado = this.toBoolean(migrationSnapshot.val());
        if (yaMigrado) {
            this.removeLegacyStorageItem(legacyStorageKey);
            return;
        }

        const legacyRaw = this.readLegacyStorageItem(legacyStorageKey);
        const legacyConfig = this.normalizeLegacyGeneradorConfig(legacyRaw);
        if (legacyConfig) {
            const currentRemote = await this.loadGeneradorConfig();
            if (!currentRemote)
                await this.saveGeneradorConfig(legacyConfig);
        }

        await set(migrationRef, true);
        this.removeLegacyStorageItem(legacyStorageKey);
    }

    private async getCurrentUid(): Promise<string | null> {
        await this.authReadyPromise;
        const uid = `${this.auth.currentUser?.uid ?? ''}`.trim();
        return uid.length > 0 ? uid : null;
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
}
