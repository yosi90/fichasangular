import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Database } from '@angular/fire/database';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CapacidadEsencia, ChakraDetalle, Fusion } from '../interfaces/incarnum';
import { EscuchaRtdb, cacheRtdbOApi, catalogosDesdeApi, escucharRtdb, sinCache } from './catalogo-api';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { normalizarCapacidadEsencia, normalizarChakraDetalle, normalizarFusion } from './utils/incarnum-mapper';
import { toArray } from './utils/normalizacion';
import { porNombre } from './utils/orden-texto';

/** Los chakras van en su orden (corona, pies… tótem), no por nombre. */
function porOrden(a: ChakraDetalle, b: ChakraDetalle): number {
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
    ) { }

    /** En desarrollo (`catalogosDesdeApi`), la caché es la de producción: se lee la API. */
    private escuchar(ruta: string): EscuchaRtdb {
        if (catalogosDesdeApi())
            return (onNext) => sinCache(onNext);
        return escucharRtdb(this.db, this.firebaseContextSvc, ruta);
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

    /** Los chakras con su detalle (la caché guarda cada uno con sus fusiones y sus clases); por la API, sin ellos. */
    getChakras(): Observable<ChakraDetalle[]> {
        return cacheRtdbOApi({
            escuchar: this.escuchar('Chakras'),
            desdeCache: (snapshot) => {
                const chakras: ChakraDetalle[] = [];
                snapshot.forEach((hijo: any) => {
                    chakras.push(normalizarChakraDetalle(hijo.val()));
                });
                return chakras.filter((chakra) => chakra.Id > 0).sort(porOrden);
            },
            cacheIncompleta: (chakras) => chakras.length < 1,
            pedir: () => this.http.get(`${environment.apiUrl}incarnum/chakras`),
            desdeApi: (raw) => toArray(raw).map(normalizarChakraDetalle).filter((chakra) => chakra.Id > 0).sort(porOrden),
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
