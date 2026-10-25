import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Database } from '@angular/fire/database';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    ConjuntoObjetosDetalle,
    EncantamientoDetalle,
    EntradaEquipo,
    EquipoCatalogos,
    FiltrosObjetos,
    MaterialDetalle,
    MunicionDetalle,
    ObjetoDetalle,
    PaginaObjetos,
    TipoCatalogoEquipo,
} from '../interfaces/equipo';
import { AvisosFalloApi, EscuchaRtdb, cacheRtdbOApi, catalogosDesdeApi, escucharRtdb, sinCache } from './catalogo-api';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { esFilaComodin } from './utils/comodin';
import {
    normalizeConjuntoObjetos,
    normalizeEncantamiento,
    normalizeEquipoCatalogos,
    normalizeMaterial,
    normalizeMunicion,
    normalizeObjeto,
} from './utils/equipo-mapper';
import { toArray, toNullableText } from './utils/normalizacion';
import { porNombre } from './utils/orden-texto';

/** Cada catálogo pequeño del equipo: su ruta de la API, su caché de la RTDB y cómo se llama en los avisos. */
interface CatalogoEquipo<T> {
    url: string;
    cache: string;
    normalizar: (raw: any) => T;
    noEncontrado: string;
    error: string;
}

const MATERIALES: CatalogoEquipo<MaterialDetalle> = {
    url: 'materiales', cache: 'Materiales', normalizar: normalizeMaterial,
    noEncontrado: 'Material no encontrado', error: 'Error al obtener el material',
};
const MUNICIONES: CatalogoEquipo<MunicionDetalle> = {
    url: 'municiones', cache: 'Municiones', normalizar: normalizeMunicion,
    noEncontrado: 'Munición no encontrada', error: 'Error al obtener la munición',
};
const ENCANTAMIENTOS: CatalogoEquipo<EncantamientoDetalle> = {
    url: 'encantamientos', cache: 'Encantamientos', normalizar: normalizeEncantamiento,
    noEncontrado: 'Aptitud especial no encontrada', error: 'Error al obtener la aptitud especial',
};
const CONJUNTOS: CatalogoEquipo<ConjuntoObjetosDetalle> = {
    url: 'conjuntos-objetos', cache: 'ConjuntosObjetos', normalizar: normalizeConjuntoObjetos,
    noEncontrado: 'Conjunto de objetos no encontrado', error: 'Error al obtener el conjunto de objetos',
};

/**
 * Los catálogos del equipo (familia 1 de objetos; `docs/publica/endpoints/catalogos.md`, «Equipo»): los pequeños, de la
 * caché de la RTDB o, si falta, de la API (las cachés nuevas copian la respuesta de la API tal cual); los objetos, de la
 * API paginada (catálogo grande, sin caché).
 */
@Injectable({
    providedIn: 'root'
})
export class EquipoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    /** Escucha una ruta de la caché; en desarrollo (`catalogosDesdeApi`), como si no existiera. */
    protected escuchar(ruta: string): EscuchaRtdb {
        if (catalogosDesdeApi())
            return (onNext) => sinCache(onNext);
        return escucharRtdb(this.db, this.firebaseContextSvc, ruta);
    }

    getCatalogos(): Observable<EquipoCatalogos> {
        return cacheRtdbOApi({
            escuchar: this.escuchar('EquipoCatalogos'),
            desdeCache: (snapshot) => normalizeEquipoCatalogos(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}equipo/catalogos`),
            desdeApi: (raw) => normalizeEquipoCatalogos(raw),
        });
    }

    getMateriales(): Observable<MaterialDetalle[]> { return this.lista(MATERIALES); }
    getMaterial(id: number): Observable<MaterialDetalle> { return this.detalle(MATERIALES, id); }
    getMuniciones(): Observable<MunicionDetalle[]> { return this.lista(MUNICIONES); }
    getMunicion(id: number): Observable<MunicionDetalle> { return this.detalle(MUNICIONES, id); }
    getEncantamientos(): Observable<EncantamientoDetalle[]> { return this.lista(ENCANTAMIENTOS); }
    getEncantamiento(id: number): Observable<EncantamientoDetalle> { return this.detalle(ENCANTAMIENTOS, id); }
    getConjuntos(): Observable<ConjuntoObjetosDetalle[]> { return this.lista(CONJUNTOS); }
    getConjunto(id: number): Observable<ConjuntoObjetosDetalle> { return this.detalle(CONJUNTOS, id); }

    /** Una página de `GET /objetos` con sus filtros; el total y si hay más salen de las cabeceras. */
    getObjetos(filtros: FiltrosObjetos = {}): Observable<PaginaObjetos> {
        let params = new HttpParams();
        const poner = (clave: string, valor: unknown) => {
            const texto = toNullableText(valor);
            if (texto !== null)
                params = params.set(clave, texto);
        };
        poner('tipo', filtros.tipo);
        poner('categoria', filtros.categoria);
        poner('ranura', filtros.ranura);
        poner('manual', filtros.manual);
        poner('q', filtros.q);
        poner('limit', filtros.limit);
        poner('offset', filtros.offset);
        return this.http.get<any[]>(`${environment.apiUrl}objetos`, { params, observe: 'response' }).pipe(
            map((respuesta: HttpResponse<any[]>) => {
                const items = toArray(respuesta.body)
                    .filter((raw) => !esFilaComodin(raw))
                    .map((raw) => normalizeObjeto(raw));
                const total = Number(respuesta.headers.get('X-Total-Count'));
                return {
                    items,
                    total: Number.isFinite(total) && total >= items.length ? total : items.length,
                    hayMas: respuesta.headers.get('X-Has-More') === 'true',
                };
            }),
        );
    }

    getObjeto(id: number): Observable<ObjetoDetalle> {
        return this.http.get(`${environment.apiUrl}objetos/${id}`).pipe(map((raw) => normalizeObjeto(raw)));
    }

    /** Una entrada de cualquiera de esos catálogos por su id, con su tipo (para abrir su detalle). */
    getEntrada(tipo: TipoCatalogoEquipo, id: number): Observable<EntradaEquipo> {
        switch (tipo) {
            case 'objeto': return this.getObjeto(id).pipe(map((item) => ({ tipo, item })));
            case 'material': return this.getMaterial(id).pipe(map((item) => ({ tipo, item })));
            case 'municion': return this.getMunicion(id).pipe(map((item) => ({ tipo, item })));
            case 'encantamiento': return this.getEncantamiento(id).pipe(map((item) => ({ tipo, item })));
            case 'conjunto': return this.getConjunto(id).pipe(map((item) => ({ tipo, item })));
        }
    }

    private lista<T extends { Id: number; Nombre: string }>(catalogo: CatalogoEquipo<T>): Observable<T[]> {
        const normalizarLista = (raw: any): T[] => toArray(raw)
            .filter((item) => !esFilaComodin(item))
            .map((item) => catalogo.normalizar(item))
            .filter((item) => item.Id > 0)
            .sort(porNombre);
        return cacheRtdbOApi({
            escuchar: this.escuchar(catalogo.cache),
            desdeCache: (snapshot) => normalizarLista(snapshot.val()),
            cacheIncompleta: (lista) => lista.length < 1,
            pedir: () => this.http.get(`${environment.apiUrl}${catalogo.url}`),
            desdeApi: (raw) => normalizarLista(raw),
            unaPeticionALaVez: true,
        });
    }

    private detalle<T>(catalogo: CatalogoEquipo<T>, id: number): Observable<T> {
        const avisos: AvisosFalloApi = {
            noEncontrado: { titulo: catalogo.noEncontrado, texto: `No existe con el id ${id}` },
            error: catalogo.error,
        };
        return cacheRtdbOApi({
            escuchar: this.escuchar(`${catalogo.cache}/${id}`),
            desdeCache: (snapshot) => catalogo.normalizar(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}${catalogo.url}/${id}`),
            desdeApi: (raw) => catalogo.normalizar(raw),
            avisos,
        });
    }
}
