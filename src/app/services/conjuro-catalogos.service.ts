import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Database, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { CacheEntityKey } from '../config/cache-contract-manifest';
import { ConjuroCatalogItem } from '../interfaces/conjuro-catalogos';
import { CacheCatalogMissReportService } from './cache-catalog-miss-report.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

function normalizeCatalogItem(raw: any): ConjuroCatalogItem {
    return {
        Id: Number(raw?.Id ?? 0),
        Nombre: `${raw?.Nombre ?? ''}`.trim(),
    };
}

function sortCatalog(items: ConjuroCatalogItem[]): ConjuroCatalogItem[] {
    return items
        .filter((item) => item.Id > 0 && item.Nombre.length > 0)
        .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
}

function toArray(value: any): any[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === 'object')
        return Object.values(value);
    return [];
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

    public RenovarComponentes(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            path: 'ComponentesConjuros',
            endpoint: 'componentes-conjuros',
            successTitle: 'Catálogo de componentes de conjuros actualizado con éxito',
            errorTitle: 'Error al actualizar el catálogo de componentes de conjuros',
        });
    }

    public RenovarTiemposLanzamiento(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            path: 'TiemposLanzamiento',
            endpoint: 'tiempos-lanzamiento',
            successTitle: 'Catálogo de tiempos de lanzamiento actualizado con éxito',
            errorTitle: 'Error al actualizar el catálogo de tiempos de lanzamiento',
        });
    }

    public RenovarAlcances(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            path: 'AlcancesConjuros',
            endpoint: 'alcances-conjuros',
            successTitle: 'Catálogo de alcances de conjuros actualizado con éxito',
            errorTitle: 'Error al actualizar el catálogo de alcances de conjuros',
        });
    }

    public RenovarDescriptores(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            path: 'DescriptoresConjuros',
            endpoint: 'descriptores',
            successTitle: 'Catálogo de descriptores de conjuros actualizado con éxito',
            errorTitle: 'Error al actualizar el catálogo de descriptores de conjuros',
        });
    }

    protected watchCatalogPath(path: string, onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return this.firebaseContextSvc.run(() => onValue(ref(this.db, path), onNext, onError));
    }

    protected writeCatalogPath(path: string, items: ConjuroCatalogItem[]): Promise<void> {
        const payload = items.reduce((acc, item) => {
            acc[String(item.Id)] = item;
            return acc;
        }, {} as Record<string, ConjuroCatalogItem>);
        return this.firebaseContextSvc.run(() => set(ref(this.db, path), payload));
    }

    private getCatalogoCacheFirst(
        path: 'ComponentesConjuros' | 'TiemposLanzamiento' | 'AlcancesConjuros' | 'DescriptoresConjuros',
        endpoint: 'componentes-conjuros' | 'tiempos-lanzamiento' | 'alcances-conjuros' | 'descriptores',
        cacheKey: CacheEntityKey,
    ): Observable<ConjuroCatalogItem[]> {
        return new Observable((observer) => {
            let unsubscribe: Unsubscribe;
            let fallbackEnCurso = false;

            const onNext = (snapshot: any) => {
                const cached = this.normalizeSnapshot(snapshot);
                if (cached.length > 0) {
                    observer.next(cached);
                    return;
                }

                if (fallbackEnCurso)
                    return;
                fallbackEnCurso = true;
                void this.cacheMissReportSvc.reportEmptyCacheFallback(cacheKey);

                this.http.get<any[]>(`${environment.apiUrl}${endpoint}`).subscribe({
                    next: (raw) => observer.next(sortCatalog(toArray(raw).map(normalizeCatalogItem))),
                    error: (error) => observer.error(error),
                    complete: () => fallbackEnCurso = false,
                });
            };

            unsubscribe = this.watchCatalogPath(path, onNext, (error) => observer.error(error));
            return () => unsubscribe();
        });
    }

    private normalizeSnapshot(snapshot: any): ConjuroCatalogItem[] {
        if (!snapshot?.exists?.())
            return [];
        return sortCatalog(toArray(snapshot.val?.()).map(normalizeCatalogItem));
    }

    private async renovarCatalogoSimple(params: {
        path: 'ComponentesConjuros' | 'TiemposLanzamiento' | 'AlcancesConjuros' | 'DescriptoresConjuros';
        endpoint: 'componentes-conjuros' | 'tiempos-lanzamiento' | 'alcances-conjuros' | 'descriptores';
        successTitle: string;
        errorTitle: string;
    }): Promise<boolean> {
        try {
            const raw = await firstValueFrom(this.http.get<any[]>(`${environment.apiUrl}${params.endpoint}`));
            const items = sortCatalog(toArray(raw).map(normalizeCatalogItem));
            if (items.length < 1)
                throw new Error('La API respondió sin elementos válidos para cachear.');

            await this.writeCatalogPath(params.path, items);
            Swal.fire({
                icon: 'success',
                title: params.successTitle,
                showConfirmButton: true,
                timer: 2000,
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: params.errorTitle,
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true,
            });
            return false;
        }
    }
}
