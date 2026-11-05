import { toInt } from './normalizacion';

/** Lo común de la respuesta del alta y de la edición de un catálogo: su `message` y el id de la entrada guardada. */
export interface RespuestaDeEscritura {
    message: string;
    id: number;
}

/** La respuesta del alta y de la edición, con la entrada guardada ya normalizada (`guardarEnCatalogo`). */
export interface EntradaGuardada<T> extends RespuestaDeEscritura {
    entrada: T;
}

/**
 * Lee `{ message, id<Tipo>, <tipo> }`, la respuesta del alta y de la edición de los catálogos que van por el flujo común
 * de la API (`CATALOGOS_ALTA_Y_EDICION_FRONT.md`): el `message` (o `mensajePorDefecto`) y el id de `claveId`. Sin un id
 * válido, falla. La entrada (`<tipo>`) la lee cada servicio con su normalizador.
 */
export function leerRespuestaDeEscritura(response: unknown, claveId: string, mensajePorDefecto: string = ''): RespuestaDeEscritura {
    const cuerpo = (response ?? {}) as Record<string, unknown>;
    const id = toInt(cuerpo[claveId]);
    if (id <= 0)
        throw new Error(`La API no devolvió un ${claveId} válido.`);
    return { message: `${cuerpo['message'] ?? mensajePorDefecto}`, id };
}
