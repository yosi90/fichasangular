import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    CapacidadEsencia, Chakra, ChakraCuerpo, ChakraDetalle, Fusion, FusionCuerpo,
} from '../interfaces/incarnum';
import { EscuchaRtdb, cacheRtdbOApi, escucharCatalogo } from './catalogo-api';
import { EscrituraDeCatalogo, guardarEnCatalogo } from './escritura-de-catalogo';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { CHAKRA, FUSION } from './utils/nombres-de-catalogo';
import { EntradaGuardada } from './utils/respuesta-de-escritura';
import { normalizarCapacidadEsencia, normalizarChakra, normalizarChakraDetalle, normalizarFusion } from './utils/incarnum-mapper';
import { toArray } from './utils/normalizacion';
import { porNombre } from './utils/orden-texto';

const ESCRITURA_FUSION: EscrituraDeCatalogo<Fusion> = {
    url: 'incarnum/fusiones', clave: 'fusion', claveId: 'idFusion', normalizar: normalizarFusion, nombre: FUSION,
};
const ESCRITURA_CHAKRA: EscrituraDeCatalogo<ChakraDetalle> = {
    url: 'incarnum/chakras', clave: 'chakra', claveId: 'idChakra', normalizar: normalizarChakraDetalle, nombre: CHAKRA,
};

/** Los chakras van en su orden (corona, pies… tótem), no por nombre. */
function porOrden(a: Chakra, b: Chakra): number {
    return a.Orden - b.Orden || porNombre(a, b);
}

/**
 * Los catálogos de Magic of Incarnum (`docs/publica/INCARNUM.md`): las fusiones del alma y los chakras, de la caché de
 * la RTDB (`Fusiones/{id}`, `Chakras/{id}`, con la forma de la respuesta HTTP) y, si no está, de la API; la tabla de
 * capacidad de esencia, solo de la API (no tiene caché).
 */
@Injectable({ providedIn: 'root' })
export class IncarnumService {
    private capacidad$?: Observable<CapacidadEsencia[]>;

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private auth?: Auth,
    ) { }

    /** La fusión por HTTP, sin caché: la que abre «Modificar fusión». */
    getFusionFresca(id: number): Observable<Fusion> {
        return this.http.get(`${environment.apiUrl}incarnum/fusiones/${Math.trunc(Number(id))}`).pipe(map((raw) => normalizarFusion(raw)));
    }

    /** El chakra por HTTP, sin caché: el que abre «Modificar chakra». */
    getChakraFresco(id: number): Observable<ChakraDetalle> {
        return this.http.get(`${environment.apiUrl}incarnum/chakras/${Math.trunc(Number(id))}`).pipe(map((raw) => normalizarChakraDetalle(raw)));
    }

    /** `POST /incarnum/fusiones/add` o, con `id`, `PUT /incarnum/fusiones/<id>`: permiso de creación `clases`. */
    guardarFusion(cuerpo: FusionCuerpo, id: number | null = null): Promise<EntradaGuardada<Fusion>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_FUSION, id, cuerpo);
    }

    /** `POST /incarnum/chakras/add` o, con `id`, `PUT /incarnum/chakras/<id>`: permiso de creación `clases`. */
    guardarChakra(cuerpo: ChakraCuerpo, id: number | null = null): Promise<EntradaGuardada<ChakraDetalle>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_CHAKRA, id, cuerpo);
    }

    private escuchar(ruta: string): EscuchaRtdb {
        return escucharCatalogo(this.db, this.firebaseContextSvc, ruta);
    }

    getFusiones(): Observable<Fusion[]> {
        return cacheRtdbOApi({
            escuchar: this.escuchar('Fusiones'),
            desdeCache: (snapshot) => {
                const fusiones: Fusion[] = [];
                snapshot.forEach((hijo: any) => {
                    fusiones.push(normalizarFusion(hijo.val()));
                });
                return fusiones.filter((fusion) => fusion.Id > 0).sort(porNombre);
            },
            cacheIncompleta: (fusiones) => fusiones.length < 1,
            pedir: () => this.http.get(`${environment.apiUrl}incarnum/fusiones`),
            desdeApi: (raw) => toArray(raw).map(normalizarFusion).filter((fusion) => fusion.Id > 0).sort(porNombre),
            unaPeticionALaVez: true,
            avisos: {
                noEncontrado: { titulo: 'Fusiones no disponibles', texto: 'No se encontró /incarnum/fusiones en la API' },
                error: 'Error al obtener las fusiones del alma',
            },
        });
    }

    getFusion(id: number): Observable<Fusion> {
        return cacheRtdbOApi({
            escuchar: this.escuchar(`Fusiones/${id}`),
            desdeCache: (snapshot) => normalizarFusion(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}incarnum/fusiones/${id}`),
            desdeApi: (raw) => normalizarFusion(raw),
            avisos: {
                noEncontrado: { titulo: 'Fusión no encontrada', texto: 'No se ha encontrado la fusión.' },
                error: 'Error al obtener la fusión',
            },
        });
    }

    /**
     * Los chakras, en su orden (`GET /incarnum/chakras`). La caché guarda cada uno con su detalle, pero el listado solo da
     * lo de la ruta del listado: sus fusiones y sus clases, con `getChakra`.
     */
    getChakras(): Observable<Chakra[]> {
        return cacheRtdbOApi({
            escuchar: this.escuchar('Chakras'),
            desdeCache: (snapshot) => {
                const chakras: Chakra[] = [];
                snapshot.forEach((hijo: any) => {
                    chakras.push(normalizarChakra(hijo.val()));
                });
                return chakras.filter((chakra) => chakra.Id > 0).sort(porOrden);
            },
            cacheIncompleta: (chakras) => chakras.length < 1,
            pedir: () => this.http.get(`${environment.apiUrl}incarnum/chakras`),
            desdeApi: (raw) => toArray(raw).map(normalizarChakra).filter((chakra) => chakra.Id > 0).sort(porOrden),
            unaPeticionALaVez: true,
            avisos: {
                noEncontrado: { titulo: 'Chakras no disponibles', texto: 'No se encontró /incarnum/chakras en la API' },
                error: 'Error al obtener los chakras',
            },
        });
    }

    getChakra(id: number): Observable<ChakraDetalle> {
        return cacheRtdbOApi({
            escuchar: this.escuchar(`Chakras/${id}`),
            desdeCache: (snapshot) => normalizarChakraDetalle(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}incarnum/chakras/${id}`),
            desdeApi: (raw) => normalizarChakraDetalle(raw),
            avisos: {
                noEncontrado: { titulo: 'Chakra no encontrado', texto: 'No se ha encontrado el chakra.' },
                error: 'Error al obtener el chakra',
            },
        });
    }

    /** La capacidad de esencia por nivel de personaje (tabla 2-1 y la épica), una vez por sesión. */
    getCapacidadEsencia(): Observable<CapacidadEsencia[]> {
        this.capacidad$ ??= this.http.get(`${environment.apiUrl}incarnum/capacidad-esencia`).pipe(
            map((raw) => toArray(raw).map(normalizarCapacidadEsencia).sort((a, b) => a.Nivel_minimo - b.Nivel_minimo)),
            shareReplay({ bufferSize: 1, refCount: false }),
        );
        return this.capacidad$;
    }
}
