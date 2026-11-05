import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { Observable, firstValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    ConjuntoObjetosCuerpo,
    ConjuntoObjetosDetalle,
    EncantamientoCuerpo,
    EncantamientoDetalle,
    EntradaEquipo,
    EquipoCatalogos,
    EquipoGuardado,
    FiltrosObjetos,
    MaterialCuerpo,
    MaterialDetalle,
    MunicionCuerpo,
    MunicionDetalle,
    ObjetoCuerpo,
    ObjetoDetalle,
    PaginaObjetos,
    TipoCatalogoEquipo,
} from '../interfaces/equipo';
import { AvisosFalloApi, EscuchaRtdb, cabecerasDePagina, cacheRtdbOApi, escucharCatalogo } from './catalogo-api';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { cabeceraApiConFirebase } from './platform-session.service';
import { ElementoDeCatalogo, errorDeCatalogo } from './utils/error-catalogo';
import { esFilaComodin } from './utils/comodin';
import {
    normalizeConjuntoObjetos,
    normalizeEncantamiento,
    normalizeEquipoCatalogos,
    normalizeMaterial,
    normalizeMunicion,
    normalizeObjeto,
} from './utils/equipo-mapper';
import { APTITUD_EQUIPO, CONJUNTO_OBJETOS, MATERIAL, MUNICION, OBJETO } from './utils/nombres-de-catalogo';
import { toArray, toNullableText } from './utils/normalizacion';
import { porNombre } from './utils/orden-texto';
import { leerRespuestaDeEscritura } from './utils/respuesta-de-escritura';

/** Cada catálogo pequeño del equipo: su ruta de la API, su caché de la RTDB y cómo se llama en los avisos. */
interface CatalogoEquipo<T> {
    url: string;
    cache: string;
    normalizar: (raw: any) => T;
    noEncontrado: string;
    error: string;
}

/**
 * Cómo se escribe cada catálogo (segunda parte del hito 7: `POST <ruta>/add` y `PUT <ruta>/<id>`, el mismo cuerpo):
 * su ruta, la clave de la entrada y de su id en la respuesta, su normalizador y su nombre en los errores.
 */
interface EscrituraEquipo<T> {
    url: string;
    clave: string;
    claveId: string;
    normalizar: (raw: any) => T;
    nombre: ElementoDeCatalogo;
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

const ESCRITURA_MUNICION: EscrituraEquipo<MunicionDetalle> = {
    url: 'municiones', clave: 'municion', claveId: 'idMunicion', normalizar: normalizeMunicion, nombre: MUNICION,
};
const ESCRITURA_MATERIAL: EscrituraEquipo<MaterialDetalle> = {
    url: 'materiales', clave: 'material', claveId: 'idMaterial', normalizar: normalizeMaterial, nombre: MATERIAL,
};
const ESCRITURA_ENCANTAMIENTO: EscrituraEquipo<EncantamientoDetalle> = {
    url: 'encantamientos', clave: 'encantamiento', claveId: 'idEncantamiento', normalizar: normalizeEncantamiento, nombre: APTITUD_EQUIPO,
};
const ESCRITURA_OBJETO: EscrituraEquipo<ObjetoDetalle> = {
    url: 'objetos', clave: 'objeto', claveId: 'idObjeto', normalizar: normalizeObjeto, nombre: OBJETO,
};
const ESCRITURA_CONJUNTO: EscrituraEquipo<ConjuntoObjetosDetalle> = {
    url: 'conjuntos-objetos', clave: 'conjunto', claveId: 'idConjunto', normalizar: normalizeConjuntoObjetos, nombre: CONJUNTO_OBJETOS,
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
        @Optional() private auth?: Auth,
    ) { }

    /** Escucha una ruta de la caché; en desarrollo (`catalogosDesdeApi`), como si no existiera. */
    protected escuchar(ruta: string): EscuchaRtdb {
        return escucharCatalogo(this.db, this.firebaseContextSvc, ruta);
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
        poner('especificas', filtros.especificas === undefined || filtros.especificas === null ? null : `${filtros.especificas}`);
        poner('limit', filtros.limit);
        poner('offset', filtros.offset);
        return this.http.get<any[]>(`${environment.apiUrl}objetos`, { params, observe: 'response' }).pipe(
            map((respuesta: HttpResponse<any[]>) => {
                const items = toArray(respuesta.body)
                    .filter((raw) => !esFilaComodin(raw))
                    .map((raw) => normalizeObjeto(raw));
                return { items, ...cabecerasDePagina(respuesta, (Number(filtros.offset) || 0) + items.length) };
            }),
        );
    }

    getObjeto(id: number): Observable<ObjetoDetalle> {
        return this.http.get(`${environment.apiUrl}objetos/${id}`).pipe(map((raw) => normalizeObjeto(raw)));
    }

    // --- Alta y edición (segunda parte del hito 7; permiso de creación `objetos`) -------------------------------------

    /** La entrada por HTTP, sin caché: la que abre «Modificar» (guía de modificaciones de catálogo). */
    getMunicionFresca(id: number): Observable<MunicionDetalle> { return this.fresca(ESCRITURA_MUNICION, id); }
    getMaterialFresco(id: number): Observable<MaterialDetalle> { return this.fresca(ESCRITURA_MATERIAL, id); }
    getEncantamientoFresco(id: number): Observable<EncantamientoDetalle> { return this.fresca(ESCRITURA_ENCANTAMIENTO, id); }
    getConjuntoFresco(id: number): Observable<ConjuntoObjetosDetalle> { return this.fresca(ESCRITURA_CONJUNTO, id); }

    crearMunicion(cuerpo: MunicionCuerpo) { return this.escribir(ESCRITURA_MUNICION, null, cuerpo); }
    actualizarMunicion(id: number, cuerpo: MunicionCuerpo) { return this.escribir(ESCRITURA_MUNICION, id, cuerpo); }
    crearMaterial(cuerpo: MaterialCuerpo) { return this.escribir(ESCRITURA_MATERIAL, null, cuerpo); }
    actualizarMaterial(id: number, cuerpo: MaterialCuerpo) { return this.escribir(ESCRITURA_MATERIAL, id, cuerpo); }
    crearEncantamiento(cuerpo: EncantamientoCuerpo) { return this.escribir(ESCRITURA_ENCANTAMIENTO, null, cuerpo); }
    actualizarEncantamiento(id: number, cuerpo: EncantamientoCuerpo) { return this.escribir(ESCRITURA_ENCANTAMIENTO, id, cuerpo); }
    crearObjeto(cuerpo: ObjetoCuerpo) { return this.escribir(ESCRITURA_OBJETO, null, cuerpo); }
    actualizarObjeto(id: number, cuerpo: ObjetoCuerpo) { return this.escribir(ESCRITURA_OBJETO, id, cuerpo); }
    crearConjunto(cuerpo: ConjuntoObjetosCuerpo) { return this.escribir(ESCRITURA_CONJUNTO, null, cuerpo); }
    actualizarConjunto(id: number, cuerpo: ConjuntoObjetosCuerpo) { return this.escribir(ESCRITURA_CONJUNTO, id, cuerpo); }

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

    private fresca<T>(escritura: EscrituraEquipo<T>, id: number): Observable<T> {
        return this.http.get(`${environment.apiUrl}${escritura.url}/${Math.trunc(Number(id))}`).pipe(map((raw) => escritura.normalizar(raw)));
    }

    /** `POST <ruta>/add` (sin `id`) o `PUT <ruta>/<id>`: la entrada entera; el error, con su `code` y su `field`. */
    private async escribir<T>(escritura: EscrituraEquipo<T>, id: number | null, cuerpo: unknown): Promise<EquipoGuardado<T>> {
        const editando = id !== null;
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const base = `${environment.apiUrl}${escritura.url}`;
            const respuesta = await firstValueFrom(editando
                ? this.http.put<any>(`${base}/${Math.trunc(Number(id))}`, cuerpo, { headers })
                : this.http.post<any>(`${base}/add`, cuerpo, { headers }));
            const { message, id: idGuardado } = leerRespuestaDeEscritura(respuesta, escritura.claveId);
            return { message, id: idGuardado, entrada: escritura.normalizar((respuesta as any)?.[escritura.clave]) };
        } catch (error: unknown) {
            throw errorDeCatalogo(error, editando ? 'actualizar' : 'crear', escritura.nombre);
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
