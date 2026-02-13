import { Injectable } from "@angular/core";
import { Database, get, onValue, ref, set } from "@angular/fire/database";
import { Observable } from "rxjs";
import { CACHE_CONTRACT_MANIFEST, CacheEntityKey } from "../config/cache-contract-manifest";

export interface CacheSyncMeta {
    lastSuccessAt: number;
    lastSuccessIso: string;
    schemaVersionApplied: number;
}

export interface CacheSyncUiState {
    key: CacheEntityKey;
    label: string;
    schemaVersion: number;
    lastSuccessAt: number | null;
    lastSuccessIso: string | null;
    isPrimary: boolean;
}

@Injectable({
    providedIn: "root"
})
export class CacheSyncMetadataService {
    private readonly path = "CacheSyncMeta/AdminPanel";
    private readonly keys = new Set<CacheEntityKey>(CACHE_CONTRACT_MANIFEST.map((entry) => entry.key));

    constructor(private db: Database) { }

    watchAll(): Observable<Record<CacheEntityKey, CacheSyncMeta | null>> {
        return new Observable((observer) => {
            const dbRef = ref(this.db, this.path);

            const unsubscribe = onValue(
                dbRef,
                (snapshot) => {
                    const record = this.createEmptyRecord();
                    snapshot.forEach((child) => {
                        const key = child.key as CacheEntityKey;
                        if (!this.keys.has(key))
                            return;
                        record[key] = this.normalizeMeta(child.val());
                    });
                    observer.next(record);
                },
                (error) => observer.error(error)
            );

            return () => unsubscribe();
        });
    }

    async markSuccess(key: CacheEntityKey, schemaVersion: number): Promise<void> {
        const now = Date.now();
        const payload: CacheSyncMeta = {
            lastSuccessAt: now,
            lastSuccessIso: new Date(now).toISOString(),
            schemaVersionApplied: schemaVersion,
        };
        await set(ref(this.db, `${this.path}/${key}`), payload);
    }

    async getSnapshotOnce(): Promise<Record<CacheEntityKey, CacheSyncMeta | null>> {
        const snapshot = await get(ref(this.db, this.path));
        const record = this.createEmptyRecord();

        if (!snapshot.exists())
            return record;

        snapshot.forEach((child) => {
            const key = child.key as CacheEntityKey;
            if (!this.keys.has(key))
                return;
            record[key] = this.normalizeMeta(child.val());
        });

        return record;
    }

    buildUiState(metaByKey: Record<CacheEntityKey, CacheSyncMeta | null>): CacheSyncUiState[] {
        return CACHE_CONTRACT_MANIFEST.map((entry) => {
            const meta = metaByKey[entry.key];
            const schemaVersionApplied = Number(meta?.schemaVersionApplied ?? 0);
            const isPrimary = !meta || schemaVersionApplied !== entry.schemaVersion;
            return {
                key: entry.key,
                label: entry.label,
                schemaVersion: entry.schemaVersion,
                lastSuccessAt: Number.isFinite(meta?.lastSuccessAt) ? Number(meta?.lastSuccessAt) : null,
                lastSuccessIso: meta?.lastSuccessIso ?? null,
                isPrimary,
            };
        });
    }

    private createEmptyRecord(): Record<CacheEntityKey, CacheSyncMeta | null> {
        const record = {} as Record<CacheEntityKey, CacheSyncMeta | null>;
        CACHE_CONTRACT_MANIFEST.forEach((entry) => {
            record[entry.key] = null;
        });
        return record;
    }

    private normalizeMeta(raw: any): CacheSyncMeta | null {
        if (!raw || typeof raw !== "object")
            return null;

        const lastSuccessAt = Number(raw.lastSuccessAt);
        const schemaVersionApplied = Number(raw.schemaVersionApplied);
        const lastSuccessIso = typeof raw.lastSuccessIso === "string" ? raw.lastSuccessIso : "";

        if (!Number.isFinite(lastSuccessAt) || !Number.isFinite(schemaVersionApplied) || lastSuccessIso.length < 1)
            return null;

        return {
            lastSuccessAt,
            lastSuccessIso,
            schemaVersionApplied,
        };
    }
}
