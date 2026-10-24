import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Database, onValue, ref } from '@angular/fire/database';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

/**
 * En desarrollo (rol.dev) la caché de catálogos de la Realtime Database es la de producción: desarrollo comparte el
 * Firebase de producción y no la escribe (`RTDB_PROYECCIONES_PUBLICAS=0`). Con `catalogosDesdeApi: true` en el entorno,
 * los catálogos se leen de la API de desarrollo (`rol_dev`). Sin el ajuste (producción), todo sigue igual.
 */
export function catalogosDesdeApi(): boolean {
    return (environment as { catalogosDesdeApi?: boolean }).catalogosDesdeApi === true;
}

const POR_PAGINA = 100;

/** Todas las páginas de un listado paginado de la API (`limit`, `offset` y la cabecera `X-Has-More`). */
export function leerListadoCompleto<T = any>(http: HttpClient, url: string): Observable<T[]> {
    const pagina = (offset: number) =>
        http.get<T[]>(`${url}${url.includes('?') ? '&' : '?'}limit=${POR_PAGINA}&offset=${offset}`, { observe: 'response' })
            .pipe(map((r: HttpResponse<T[]>) => ({ r, offset })));
    return pagina(0).pipe(
        expand(({ r, offset }) => r.headers.get('X-Has-More') === 'true' ? pagina(offset + POR_PAGINA) : EMPTY),
        reduce((todos: T[], { r }) => todos.concat(Array.isArray(r.body) ? r.body : []), [] as T[]),
    );
}

/** Para los servicios que escuchan una ruta de la caché: responde como si no existiera, para que vayan a la API. */
export function sinCache(onNext: (snapshot: any) => void): () => void {
    onNext({ exists: () => false, val: () => null, forEach: () => false });
    return () => undefined;
}

/** Escucha una ruta de la caché de la RTDB; devuelve la función que deja de escucharla. */
export type EscuchaRtdb = (onNext: (snapshot: any) => void, onError: (error: any) => void) => () => void;

/** Escucha `ruta` de la RTDB en vivo, dentro del contexto de inyección de Firebase. */
export function escucharRtdb(db: Database, contexto: FirebaseInjectionContextService, ruta: string): EscuchaRtdb {
    return (onNext, onError) => contexto.run(() => onValue(ref(db, ruta), onNext, onError));
}

/** Los avisos que se enseñan si falla la API: uno para el 404 y otro, con el mensaje del error, para lo demás. */
export interface AvisosFalloApi {
    noEncontrado: { titulo: string; texto: string };
    error: string;
}

export function avisarFalloApi(error: HttpErrorResponse, avisos: AvisosFalloApi): void {
    if (error.status === 404) {
        Swal.fire({
            icon: 'warning',
            title: avisos.noEncontrado.titulo,
            text: avisos.noEncontrado.texto,
            showConfirmButton: true,
        });
    } else {
        Swal.fire({
            icon: 'warning',
            title: avisos.error,
            text: error.message,
            showConfirmButton: true,
        });
    }
}

export interface LecturaCacheOApi<T> {
    escuchar: EscuchaRtdb;
    /** El mapper de la caché (permisivo mientras haya productores antiguos); recibe el snapshot. */
    desdeCache: (snapshot: any) => T;
    /** Si el snapshot sirve; si no, se va a la API. Por defecto, que exista. */
    sirveLaCache?: (snapshot: any) => boolean;
    /** Si lo leído de la caché no basta (por ejemplo, una lista vacía) y hay que ir a la API. */
    cacheIncompleta?: (valor: T) => boolean;
    pedir: () => Observable<any>;
    /** El mapper de la respuesta de la API (estricto, con el contrato). */
    desdeApi: (respuesta: any) => T;
    /** Sin avisos, el error de la API solo llega a quien se suscribe. */
    avisos?: AvisosFalloApi;
    /** Mientras haya una petición a la API sin terminar, los cambios de la caché que no sirvan no piden otra. */
    unaPeticionALaVez?: boolean;
    /** Se llama justo antes de pedir a la API (por ejemplo, para avisar de que falta la caché). */
    alIrALaApi?: () => void;
}

/**
 * Lee de la caché de la RTDB y, si no está, de la API. Cada vez que cambia la ruta, emite lo de la caché si sirve o,
 * si no, pide la API y emite su respuesta. Si la API falla, enseña los avisos y termina con el error.
 */
export function cacheRtdbOApi<T>(lectura: LecturaCacheOApi<T>): Observable<T> {
    const sirve = lectura.sirveLaCache ?? ((snapshot: any) => snapshot.exists());
    return new Observable<T>((observador) => {
        let peticionEnCurso = false;
        const dejarDeEscuchar = lectura.escuchar((snapshot) => {
            if (sirve(snapshot)) {
                const valor = lectura.desdeCache(snapshot);
                if (!lectura.cacheIncompleta?.(valor)) {
                    observador.next(valor);
                    return;
                }
            }
            if (lectura.unaPeticionALaVez) {
                if (peticionEnCurso)
                    return;
                peticionEnCurso = true;
            }
            lectura.alIrALaApi?.();
            lectura.pedir().subscribe({
                next: (respuesta: any) => observador.next(lectura.desdeApi(respuesta)),
                error: (error: HttpErrorResponse) => {
                    if (lectura.avisos)
                        avisarFalloApi(error, lectura.avisos);
                    observador.error(error);
                },
                complete: () => peticionEnCurso = false,
            });
        }, (error) => observador.error(error));
        return () => dejarDeEscuchar();
    });
}

const porNombre = (a: { Nombre: string }, b: { Nombre: string }): number =>
    a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' });

/**
 * Una lista de la caché de la RTDB, sin respaldo de la API: cada vez que cambia la ruta, emite los hijos que pasan
 * `incluir`, con su mapper, ordenados (por nombre, si no se dice otra cosa).
 */
export function listaRtdb<T extends { Nombre: string }>(
    escuchar: EscuchaRtdb,
    desdeCache: (valor: any) => T,
    incluir: (item: T) => boolean = () => true,
    ordenar: (a: T, b: T) => number = porNombre,
): Observable<T[]> {
    return new Observable<T[]>((observador) => {
        const dejarDeEscuchar = escuchar((snapshot) => {
            const lista: T[] = [];
            snapshot.forEach((hijo: any) => {
                const item = desdeCache(hijo.val());
                if (incluir(item))
                    lista.push(item);
            });
            lista.sort(ordenar);
            observador.next(lista);
        }, (error) => observador.error(error));
        return () => dejarDeEscuchar();
    });
}
