import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Database, Unsubscribe } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CacheEntityKey } from '../config/cache-contract-manifest';
import { ConjuroCatalogItem } from '../interfaces/conjuro-catalogos';
import { CacheCatalogMissReportService } from './cache-catalog-miss-report.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { toArray } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';
import { porNombre } from 'src/app/services/utils/orden-texto';

function normalizeCatalogItem(raw: any): ConjuroCatalogItem {
    return {
        Id: Number(raw?.Id ?? 0),
        Nombre: `${raw?.Nombre ?? ''}`.trim(),
    };
}

function sortCatalog(items: ConjuroCatalogItem[]): ConjuroCatalogItem[] {
    return items
        .filter((item) => item.Id > 0 && item.Nombre.length > 0)
        .sort(porNombre);
}

@Injectable({
    providedIn: 'root'
})
export class ConjuroCatalogosService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private cacheMissReportSvc: CacheCatalogMissReportService,
    ) { }

    getComponentes(): Observable<ConjuroCatalogItem[]> {
        return this.getCatalogoCacheFirst('ComponentesConjuros', 'componentes-conjuros', 'componentes_conjuros');
    }

    getTiemposLanzamiento(): Observable<ConjuroCatalogItem[]> {
        return this.getCatalogoCacheFirst('TiemposLanzamiento', 'tiempos-lanzamiento', 'tiempos_lanzamiento');
    }

    getAlcances(): Observable<ConjuroCatalogItem[]> {
        return this.getCatalogoCacheFirst('AlcancesConjuros', 'alcances-conjuros', 'alcances_conjuros');
    }

    getDescriptores(): Observable<ConjuroCatalogItem[]> {
        return this.getCatalogoCacheFirst('DescriptoresConjuros', 'descriptores', 'descriptores_conjuros');
    }

    protected watchCatalogPath(path: string, onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return escucharRtdb(this.db, this.firebaseContextSvc, path)(onNext, onError);
    }

    private getCatalogoCacheFirst(
        path: 'ComponentesConjuros' | 'TiemposLanzamiento' | 'AlcancesConjuros' | 'DescriptoresConjuros',
        endpoint: 'componentes-conjuros' | 'tiempos-lanzamiento' | 'alcances-conjuros' | 'descriptores',
        cacheKey: CacheEntityKey,
    ): Observable<ConjuroCatalogItem[]> {
        return cacheRtdbOApi({
            escuchar: (onNext, onError) => this.watchCatalogPath(path, onNext, onError),
            // El normalizador ya trata la caché vacía o inexistente: si queda vacía, se va a la API.
            sirveLaCache: () => true,
            desdeCache: (snapshot) => this.normalizeSnapshot(snapshot),
            cacheIncompleta: (cached) => cached.length < 1,
            pedir: () => this.http.get<any[]>(`${environment.apiUrl}${endpoint}`),
            desdeApi: (raw) => sortCatalog(toArray(raw).map(normalizeCatalogItem)),
            unaPeticionALaVez: true,
            alIrALaApi: () => void this.cacheMissReportSvc.reportEmptyCacheFallback(cacheKey),
        });
    }

    private normalizeSnapshot(snapshot: any): ConjuroCatalogItem[] {
        if (!snapshot?.exists?.())
            return [];
        return sortCatalog(toArray(snapshot.val?.()).map(normalizeCatalogItem));
    }

}
