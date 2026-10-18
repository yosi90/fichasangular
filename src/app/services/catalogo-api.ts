import { HttpClient, HttpResponse } from '@angular/common/http';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { environment } from 'src/environments/environment';

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
