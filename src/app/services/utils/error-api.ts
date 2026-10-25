import { HttpErrorResponse } from '@angular/common/http';
import { ProfileApiError } from 'src/app/interfaces/user-account';

/**
 * Un error de la API de Rol, leído de su formato único (`docs/publica/ERRORES.md`):
 * `{ error, code, field, debug: { message, requestId } }`. El texto sale siempre de `error` y la lógica, de `code`;
 * `message` (copia de transición que se retirará) y las demás claves del cuerpo no se leen.
 */
export interface ErrorDeApi {
    /** La frase para la persona: el `error` de la API o, si la respuesta no lo trae, el texto de respaldo. */
    mensaje: string;
    /** El `code` de la API ('' si no lo trae): lo que decide la lógica, nunca el texto. */
    codigo: string;
    /** El campo afectado, si lo hay. */
    campo: string | null;
    /** El `debug.requestId`: con él se encuentra el fallo en el registro de la API. */
    requestId: string | null;
    /** El estado HTTP (0 si no hubo respuesta: red caída, petición cortada…). */
    estado: number;
    /** Si `mensaje` es de la API; si no, es el texto de respaldo (sin respuesta o con un cuerpo ajeno, como el HTML de un proxy). */
    deLaApi: boolean;
}

/** El texto de respaldo cuando la respuesta no trae el `error` de la API y quien llama no da otro. */
export const ERROR_GENERICO_API = 'No se ha podido completar la acción.';
/** El texto cuando no hubo respuesta (estado 0). */
export const ERROR_SIN_CONEXION = 'No hay conexión con Rol. Revisa tu red y vuelve a probar.';

/** Los códigos de la API que dicen que falta la sesión o que su token no vale. */
const CODIGOS_DE_SESION: ReadonlySet<string> = new Set(['UNAUTHORIZED', 'TOKEN_INVALID', 'TOKEN_EXPIRED', 'sin_sesion']);

/** Lee el error de una respuesta de la API de Rol. Sin `error` en el cuerpo, el mensaje es `porDefecto` (o el de sin conexión). */
export function leerErrorDeApi(error: HttpErrorResponse, porDefecto: string = ERROR_GENERICO_API): ErrorDeApi {
    const cuerpo = comoObjeto(error.error);
    const mensajeApi = textoNoVacio(cuerpo['error']);
    const estado = Number.isFinite(error.status) ? Math.trunc(error.status) : 0;
    return {
        mensaje: mensajeApi ?? (estado === 0 ? ERROR_SIN_CONEXION : (textoNoVacio(porDefecto) ?? ERROR_GENERICO_API)),
        codigo: textoNoVacio(cuerpo['code']) ?? '',
        campo: textoNoVacio(cuerpo['field']),
        requestId: textoNoVacio(comoObjeto(cuerpo['debug'])['requestId']),
        estado,
        deLaApi: mensajeApi !== null,
    };
}

/**
 * El texto que se enseña de un error de la API: su mensaje y, si es un fallo del servidor (5xx) con `requestId`,
 * «Código de la incidencia: …» detrás, para que quien lo reporte pueda darlo y se encuentre en el registro.
 */
export function textoParaMostrar(error: Pick<ErrorDeApi, 'mensaje' | 'estado' | 'requestId'>): string {
    if (error.estado < 500 || !error.requestId)
        return error.mensaje;
    const frase = /[.!?…]$/.test(error.mensaje) ? error.mensaje : `${error.mensaje}.`;
    return `${frase} Código de la incidencia: ${error.requestId}`;
}

/**
 * El texto para enseñar de cualquier error: el de la API (con `textoParaMostrar`) si es una respuesta HTTP, el
 * `message` si es un error propio (`Error`, `ProfileApiError`…) y el propio texto si es un texto; si no hay nada,
 * `porDefecto`.
 */
export function mensajeDeError(error: unknown, porDefecto: string): string {
    if (error instanceof HttpErrorResponse)
        return textoParaMostrar(leerErrorDeApi(error, porDefecto));
    if (typeof error === 'string')
        return textoNoVacio(error) ?? porDefecto;
    return textoNoVacio(comoObjeto(error)['message']) ?? porDefecto;
}

/** El código de un error: el `code` de la API en una respuesta HTTP, o el `code` de un error propio (`ProfileApiError`…). */
export function codigoDeError(error: unknown): string {
    if (error instanceof HttpErrorResponse)
        return leerErrorDeApi(error).codigo;
    return textoNoVacio(comoObjeto(error)['code']) ?? '';
}

/** Si el error dice que falta la sesión o que su token no vale (por su código). */
export function esErrorDeSesion(error: unknown): boolean {
    return CODIGOS_DE_SESION.has(codigoDeError(error));
}

/** Un error de la API (o cualquier otro) como `ProfileApiError`, con el texto para enseñar, el código y el estado. */
export function errorDePerfil(error: unknown, porDefecto: string): ProfileApiError {
    if (error instanceof ProfileApiError)
        return error;
    if (error instanceof HttpErrorResponse) {
        const leido = leerErrorDeApi(error, porDefecto);
        return new ProfileApiError(textoParaMostrar(leido), leido.codigo, leido.estado);
    }
    return new ProfileApiError(mensajeDeError(error, porDefecto), '', 0);
}

function comoObjeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}

function textoNoVacio(valor: unknown): string | null {
    if (typeof valor !== 'string')
        return null;
    const texto = valor.trim();
    return texto.length > 0 ? texto : null;
}
