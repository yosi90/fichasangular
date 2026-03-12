import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConjuroCatalogItem } from '../interfaces/conjuro-catalogos';

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

@Injectable({
    providedIn: 'root'
})
export class ConjuroCatalogosService {

    constructor(private http: HttpClient) { }

    getComponentes(): Observable<ConjuroCatalogItem[]> {
        return this.http.get<any[]>(`${environment.apiUrl}componentes-conjuros`).pipe(
            map((items) => sortCatalog((Array.isArray(items) ? items : []).map(normalizeCatalogItem)))
        );
    }

    getTiemposLanzamiento(): Observable<ConjuroCatalogItem[]> {
        return this.http.get<any[]>(`${environment.apiUrl}tiempos-lanzamiento`).pipe(
            map((items) => sortCatalog((Array.isArray(items) ? items : []).map(normalizeCatalogItem)))
        );
    }

    getAlcances(): Observable<ConjuroCatalogItem[]> {
        return this.http.get<any[]>(`${environment.apiUrl}alcances-conjuros`).pipe(
            map((items) => sortCatalog((Array.isArray(items) ? items : []).map(normalizeCatalogItem)))
        );
    }

    getDescriptores(): Observable<ConjuroCatalogItem[]> {
        return this.http.get<any[]>(`${environment.apiUrl}descriptores`).pipe(
            map((items) => sortCatalog((Array.isArray(items) ? items : []).map(normalizeCatalogItem)))
        );
    }
}
