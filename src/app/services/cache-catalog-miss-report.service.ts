import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, ref, set } from "@angular/fire/database";
import { CacheEntityKey } from "../config/cache-contract-manifest";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

export const CACHE_MISS_REASON_RTDB_EMPTY_FALLBACK_REST = "rtdb_empty_fallback_rest";
const REPORTABLE_CACHE_MISS_KEYS: CacheEntityKey[] = [
    "actitudes",
    "maniobrabilidades",
    "tipos_dado",
    "componentes_conjuros",
    "tiempos_lanzamiento",
    "alcances_conjuros",
    "descriptores_conjuros",
];

export interface CacheCatalogMissReport {
    cacheKey: CacheEntityKey;
    uid: string;
    reportedAt: number;
    reportedAtIso: string;
    reason: typeof CACHE_MISS_REASON_RTDB_EMPTY_FALLBACK_REST;
}

@Injectable({
    providedIn: "root"
})
export class CacheCatalogMissReportService {
    private readonly path = "CacheSyncReports/CatalogMisses";
    private readonly validKeys = new Set<CacheEntityKey>(REPORTABLE_CACHE_MISS_KEYS);
    private readonly reportedKeys = new Set<CacheEntityKey>();

    constructor(
        private auth: Auth,
        private db: Database,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    async reportEmptyCacheFallback(cacheKey: CacheEntityKey): Promise<void> {
        if (!this.validKeys.has(cacheKey) || this.reportedKeys.has(cacheKey))
            return;

        const uid = this.getCurrentUid();
        if (uid.length < 1)
            return;

        this.reportedKeys.add(cacheKey);
        const now = Date.now();
        const payload: CacheCatalogMissReport = {
            cacheKey,
            uid,
            reportedAt: now,
            reportedAtIso: new Date(now).toISOString(),
            reason: CACHE_MISS_REASON_RTDB_EMPTY_FALLBACK_REST,
        };

        await this.writeReport(`${this.path}/${cacheKey}/${uid}`, payload);
    }

    protected getCurrentUid(): string {
        return `${this.auth.currentUser?.uid ?? ""}`.trim();
    }

    protected writeReport(path: string, payload: CacheCatalogMissReport): Promise<void> {
        return this.firebaseContextSvc.run(() => set(ref(this.db, path), payload));
    }
}
