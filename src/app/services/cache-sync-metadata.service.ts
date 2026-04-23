import { Injectable } from "@angular/core";
import { Database, Unsubscribe, get, onValue, ref, set } from "@angular/fire/database";
import { Observable } from "rxjs";
import { CACHE_CONTRACT_MANIFEST, CacheEntityKey } from "../config/cache-contract-manifest";
import { CACHE_MISS_REASON_RTDB_EMPTY_FALLBACK_REST } from "./cache-catalog-miss-report.service";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

export interface CacheSyncMeta {
    lastSuccessAt: number;
    lastSuccessIso: string;
    schemaVersionApplied: number;
    staleReason?: string | null;
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
    private readonly reportsPath = "CacheSyncReports/CatalogMisses";
    private readonly keys = new Set<CacheEntityKey>(CACHE_CONTRACT_MANIFEST.map((entry) => entry.key));

    constructor(
        private db: Database,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    watchAll(): Observable<Record<CacheEntityKey, CacheSyncMeta | null>> {
        return new Observable((observer) => {
            let metaSnapshot: any = null;
            let reportSnapshot: any = null;

            const emit = () => {
                const record = this.createRecordFromMetaSnapshot(metaSnapshot);
                this.applyCatalogMissReports(record, reportSnapshot);
                observer.next(record);
            };

            const unsubscribeMeta = this.watchPath(this.path, (snapshot) => {
                metaSnapshot = snapshot;
                emit();
            }, (error) => observer.error(error));
            const unsubscribeReports = this.watchPath(this.reportsPath, (snapshot) => {
                reportSnapshot = snapshot;
                emit();
            }, () => {
                reportSnapshot = null;
                emit();
            });

            return () => {
                unsubscribeMeta();
                unsubscribeReports();
            };
        });
    }

    async markSuccess(key: CacheEntityKey, schemaVersion: number): Promise<void> {
        const now = Date.now();
        const payload: CacheSyncMeta = {
            lastSuccessAt: now,
            lastSuccessIso: new Date(now).toISOString(),
            schemaVersionApplied: schemaVersion,
            staleReason: null,
        };
        await this.setPath(`${this.path}/${key}`, payload);
        await this.clearReportsBestEffort(key);
    }

    async markStale(keys: CacheEntityKey | CacheEntityKey[], staleReason: string | null = null): Promise<void> {
        const requestedKeys = Array.isArray(keys) ? keys : [keys];
        const snapshot = await this.getSnapshotOnce();
        const now = Date.now();

        await Promise.all(requestedKeys
            .filter((key) => this.keys.has(key))
            .map((key) => {
                const previous = snapshot[key];
                const payload: CacheSyncMeta = {
                    lastSuccessAt: previous?.lastSuccessAt ?? now,
                    lastSuccessIso: previous?.lastSuccessIso ?? new Date(now).toISOString(),
                    schemaVersionApplied: 0,
                    staleReason,
                };
                return this.setPath(`${this.path}/${key}`, payload);
            }));
    }

    async getSnapshotOnce(): Promise<Record<CacheEntityKey, CacheSyncMeta | null>> {
        const snapshot = await this.getPath(this.path);
        const reportSnapshot = await this.getReportsSnapshotBestEffort();
        const record = this.createRecordFromMetaSnapshot(snapshot);
        this.applyCatalogMissReports(record, reportSnapshot);

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

    private createRecordFromMetaSnapshot(snapshot: any): Record<CacheEntityKey, CacheSyncMeta | null> {
        const record = this.createEmptyRecord();

        if (!snapshot?.exists?.())
            return record;

        snapshot.forEach((child: any) => {
            const key = child.key as CacheEntityKey;
            if (!this.keys.has(key))
                return;
            record[key] = this.normalizeMeta(child.val());
        });

        return record;
    }

    private applyCatalogMissReports(record: Record<CacheEntityKey, CacheSyncMeta | null>, snapshot: any): void {
        if (!snapshot?.exists?.())
            return;

        snapshot.forEach((cacheNode: any) => {
            const key = cacheNode.key as CacheEntityKey;
            if (!this.keys.has(key))
                return;

            const latest = this.getLatestReportTimestamp(cacheNode);
            if (!latest)
                return;

            const previous = record[key];
            const previousSuccessAt = Number(previous?.lastSuccessAt ?? 0);
            if (previous && previousSuccessAt >= latest.reportedAt && Number(previous.schemaVersionApplied) > 0)
                return;

            record[key] = {
                lastSuccessAt: previous?.lastSuccessAt ?? 0,
                lastSuccessIso: previous?.lastSuccessIso ?? latest.reportedAtIso,
                schemaVersionApplied: 0,
                staleReason: CACHE_MISS_REASON_RTDB_EMPTY_FALLBACK_REST,
            };
        });
    }

    private getLatestReportTimestamp(cacheNode: any): { reportedAt: number; reportedAtIso: string; } | null {
        let latest: { reportedAt: number; reportedAtIso: string; } | null = null;
        cacheNode.forEach((reportNode: any) => {
            const raw = reportNode.val?.();
            const reportedAt = Number(raw?.reportedAt);
            const reportedAtIso = typeof raw?.reportedAtIso === "string" ? raw.reportedAtIso : "";
            if (!Number.isFinite(reportedAt) || reportedAtIso.length < 1)
                return;
            if (!latest || reportedAt > latest.reportedAt)
                latest = { reportedAt, reportedAtIso };
        });
        return latest;
    }

    private normalizeMeta(raw: any): CacheSyncMeta | null {
        if (!raw || typeof raw !== "object")
            return null;

        const lastSuccessAt = Number(raw.lastSuccessAt);
        const schemaVersionApplied = Number(raw.schemaVersionApplied);
        const lastSuccessIso = typeof raw.lastSuccessIso === "string" ? raw.lastSuccessIso : "";
        const staleReason = typeof raw.staleReason === "string" ? raw.staleReason : null;

        if (!Number.isFinite(lastSuccessAt) || !Number.isFinite(schemaVersionApplied) || lastSuccessIso.length < 1)
            return null;

        return {
            lastSuccessAt,
            lastSuccessIso,
            schemaVersionApplied,
            staleReason,
        };
    }

    protected watchPath(path: string, onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return this.firebaseContextSvc.run(() => onValue(ref(this.db, path), onNext, onError));
    }

    protected getPath(path: string): Promise<any> {
        return this.firebaseContextSvc.run(() => get(ref(this.db, path)));
    }

    protected setPath(path: string, value: any): Promise<void> {
        return this.firebaseContextSvc.run(() => set(ref(this.db, path), value));
    }

    private async getReportsSnapshotBestEffort(): Promise<any | null> {
        try {
            return await this.getPath(this.reportsPath);
        } catch {
            return null;
        }
    }

    private async clearReportsBestEffort(key: CacheEntityKey): Promise<void> {
        try {
            await this.setPath(`${this.reportsPath}/${key}`, null);
        } catch {
            // La metadata de exito no debe fallar porque la rama auxiliar de reports no este disponible.
        }
    }
}
