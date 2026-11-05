import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { cabeceraApiConFirebase } from './platform-session.service';
import { ElementoDeCatalogo, errorDeCatalogo } from './utils/error-catalogo';
import { EntradaGuardada, leerRespuestaDeEscritura } from './utils/respuesta-de-escritura';

/**
 * Cómo se da de alta y se edita un catálogo por el flujo común de la API (`CATALOGOS_ALTA_Y_EDICION_FRONT.md`:
 * `POST <url>/add` y `PUT <url>/<id>`, con el mismo cuerpo): su ruta y el normalizador de su lectura, la clave de la
 * entrada y de su id en la respuesta (`{ message, idArma, arma }`) y su nombre en los errores.
 */
export interface EscrituraDeCatalogo<T> {
    url: string;
    clave: string;
    claveId: string;
    normalizar: (raw: any) => T;
    nombre: ElementoDeCatalogo;
}

/**
 * El alta (`id` `null`) o la edición de una entrada de catálogo, con la sesión de la API: la entrada guardada como la da
 * su `GET`; el error, con su `code` y su `field` (`errorDeCatalogo`). Lo usan el equipo, los rasgos, las ventajas y el
 * incarnum (hitos 7 y 8 del roadmap de inserciones).
 */
export async function guardarEnCatalogo<T>(
    http: HttpClient,
    auth: { currentUser: unknown } | null | undefined,
    escritura: EscrituraDeCatalogo<T>,
    id: number | null,
    cuerpo: unknown,
): Promise<EntradaGuardada<T>> {
    const editando = id !== null;
    try {
        const headers = await cabeceraApiConFirebase(auth);
        const base = `${environment.apiUrl}${escritura.url}`;
        const respuesta = await firstValueFrom(editando
            ? http.put<any>(`${base}/${Math.trunc(Number(id))}`, cuerpo, { headers })
            : http.post<any>(`${base}/add`, cuerpo, { headers }));
        const { message, id: idGuardado } = leerRespuestaDeEscritura(respuesta, escritura.claveId);
        return { message, id: idGuardado, entrada: escritura.normalizar(respuesta?.[escritura.clave]) };
    } catch (error: unknown) {
        throw errorDeCatalogo(error, editando ? 'actualizar' : 'crear', escritura.nombre);
    }
}
