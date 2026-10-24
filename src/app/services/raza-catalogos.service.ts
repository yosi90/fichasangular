import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { CacheEntityKey } from "../config/cache-contract-manifest";
import { ActitudCatalogItem, RazaCatalogItem, TipoDadoCatalogItem } from "../interfaces/raza-catalogos";
import { CacheCatalogMissReportService } from "./cache-catalog-miss-report.service";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

function normalizeCatalogItem(raw: any, preserveRaw = false): RazaCatalogItem {
    const rawId = raw?.Id ?? raw?.id ?? raw?.Id_maniobrabilidad ?? raw?.Id_tipo_dado ?? raw?.Id_actitud ?? raw?.id_actitud;
    return {
        ...(preserveRaw && raw && typeof raw === "object" ? raw : {}),
        Id: rawId === undefined || rawId === null ? Number.NaN : Number(rawId),
        Nombre: `${raw?.Nombre ?? raw?.nombre ?? raw?.n ?? ""}`.trim(),
    };
}

function sortCatalog<T extends RazaCatalogItem>(items: T[]): T[] {
    return items
        .filter((item) => Number.isFinite(item.Id) && item.Id >= 0 && item.Nombre.length > 0)
        .sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
}

@Injectable({
    providedIn: "root"
})
export class RazaCatalogosService {
    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private cacheMissReportSvc: CacheCatalogMissReportService,
    ) { }

    getManiobrabilidades(): Observable<RazaCatalogItem[]> {
        return this.getCatalogoCacheFirst(
            "Maniobrabilidades",
            "maniobrabilidades",
            "maniobrabilidades",
            (items) => items.some((item: any) => item?.Velocidad_avance !== undefined || item?.Giro !== undefined),
            true
        );
    }

    getTiposDado(): Observable<TipoDadoCatalogItem[]> {
        return this.getCatalogoCacheFirst("TiposDado", "tipos-dado", "tipos_dado");
    }

    getActitudes(): Observable<ActitudCatalogItem[]> {
        return this.getCatalogoCacheFirst("Actitudes", "actitudes", "actitudes");
    }

    protected watchCatalogPath(path: string, onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return escucharRtdb(this.db, this.firebaseContextSvc, path)(onNext, onError);
    }

    private getCatalogoCacheFirst(
        path: "Maniobrabilidades" | "TiposDado" | "Actitudes",
        endpoint: "maniobrabilidades" | "tipos-dado" | "actitudes",
        cacheKey: CacheEntityKey,
        isComplete: (items: RazaCatalogItem[]) => boolean = (items) => items.length > 0,
        preserveRaw = false,
    ): Observable<RazaCatalogItem[]> {
        return cacheRtdbOApi({
            escuchar: (onNext, onError) => this.watchCatalogPath(path, onNext, onError),
            // El normalizador ya trata la caché vacía o inexistente: si queda vacía, se va a la API.
            sirveLaCache: () => true,
            desdeCache: (snapshot) => this.normalizeSnapshot(snapshot, preserveRaw),
            cacheIncompleta: (cached) => !(cached.length > 0 && isComplete(cached)),
            pedir: () => this.http.get(`${environment.apiUrl}${endpoint}`),
            desdeApi: (raw) => sortCatalog(toArray(raw).map((item) => normalizeCatalogItem(item, preserveRaw))),
            unaPeticionALaVez: true,
            alIrALaApi: () => void this.cacheMissReportSvc.reportEmptyCacheFallback(cacheKey),
        });
    }

    private normalizeSnapshot(snapshot: any, preserveRaw = false): RazaCatalogItem[] {
        if (!snapshot?.exists?.())
            return [];
        const raw = snapshot.val?.();
        return sortCatalog(toArray(raw).map((item) => normalizeCatalogItem(item, preserveRaw)));
    }

}
