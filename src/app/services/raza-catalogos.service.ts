import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { CacheEntityKey } from "../config/cache-contract-manifest";
import { ActitudCatalogItem, RazaCatalogItem, TipoDadoCatalogItem } from "../interfaces/raza-catalogos";
import { CacheCatalogMissReportService } from "./cache-catalog-miss-report.service";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

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

function toArray(value: any): any[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value);
    return [];
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
        return this.firebaseContextSvc.run(() => onValue(ref(this.db, path), onNext, onError));
    }

    protected writeCatalogPath(path: string, items: RazaCatalogItem[]): Promise<void> {
        const payload = items.reduce((acc, item) => {
            acc[String(item.Id)] = item;
            return acc;
        }, {} as Record<string, RazaCatalogItem>);
        return this.firebaseContextSvc.run(() => set(ref(this.db, path), payload));
    }

    private getCatalogoCacheFirst(
        path: "Maniobrabilidades" | "TiposDado" | "Actitudes",
        endpoint: "maniobrabilidades" | "tipos-dado" | "actitudes",
        cacheKey: CacheEntityKey,
        isComplete: (items: RazaCatalogItem[]) => boolean = (items) => items.length > 0,
        preserveRaw = false,
    ): Observable<RazaCatalogItem[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;
            let fallbackEnCurso = false;

            const onNext = (snapshot: any) => {
                const cached = this.normalizeSnapshot(snapshot, preserveRaw);
                if (cached.length > 0 && isComplete(cached)) {
                    observador.next(cached);
                    return;
                }

                if (fallbackEnCurso)
                    return;
                fallbackEnCurso = true;
                void this.cacheMissReportSvc.reportEmptyCacheFallback(cacheKey);

                this.http.get(`${environment.apiUrl}${endpoint}`).subscribe({
                    next: (raw: any) => {
                        const items = sortCatalog(toArray(raw).map((item) => normalizeCatalogItem(item, preserveRaw)));
                        observador.next(items);
                    },
                    error: (error) => observador.error(error),
                    complete: () => fallbackEnCurso = false,
                });
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.watchCatalogPath(path, onNext, onError);
            return () => unsubscribe();
        });
    }

    private normalizeSnapshot(snapshot: any, preserveRaw = false): RazaCatalogItem[] {
        if (!snapshot?.exists?.())
            return [];
        const raw = snapshot.val?.();
        return sortCatalog(toArray(raw).map((item) => normalizeCatalogItem(item, preserveRaw)));
    }

    public RenovarManiobrabilidades(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            path: "Maniobrabilidades",
            endpoint: "maniobrabilidades",
            successTitle: "Catálogo de maniobrabilidades actualizado con éxito",
            errorTitle: "Error al actualizar el catálogo de maniobrabilidades",
        });
    }

    public RenovarTiposDado(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            path: "TiposDado",
            endpoint: "tipos-dado",
            successTitle: "Catálogo de tipos de dado actualizado con éxito",
            errorTitle: "Error al actualizar el catálogo de tipos de dado",
        });
    }

    private async renovarCatalogoSimple(params: {
        path: "Maniobrabilidades" | "TiposDado";
        endpoint: "maniobrabilidades" | "tipos-dado";
        successTitle: string;
        errorTitle: string;
    }): Promise<boolean> {
        try {
            const raw = await firstValueFrom(this.http.get(`${environment.apiUrl}${params.endpoint}`));
            const items = sortCatalog(toArray(raw).map((item) => normalizeCatalogItem(item, params.endpoint === "maniobrabilidades")));
            if (items.length < 1)
                throw new Error("La API respondió sin elementos válidos para cachear.");

            await this.writeCatalogPath(params.path, items);
            Swal.fire({
                icon: "success",
                title: params.successTitle,
                showConfirmButton: true,
                timer: 2000,
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: "warning",
                title: params.errorTitle,
                text: error?.message ?? "Error no identificado",
                showConfirmButton: true,
            });
            return false;
        }
    }
}
