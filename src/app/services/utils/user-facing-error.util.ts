import { HttpErrorResponse } from '@angular/common/http';
import { MENSAJE_SIN_SESION } from 'src/app/interfaces/user-account';
import { esErrorDeSesion, leerErrorDeApi, mensajeDeError, textoParaMostrar } from 'src/app/services/utils/error-api';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

const TECHNICAL_MESSAGE_PATTERNS = [
    'http ',
    'backend',
    'firestore',
    'firebase',
    'realtime',
    'websocket',
    'gateway',
    'actor-scoped',
    'actor scoped',
    'read model',
    'payload',
    'dto',
    'constraint',
    'unique key',
    'uq_',
    'ix_',
    'sql',
    'forbidden',
    'unauthorized',
    'bad request',
    'internal server',
    'integridad',
    'uid',
    'token no disponible',
    'sesion no iniciada',
    'ticket realtime',
];
const GENERIC_TECHNICAL_MESSAGES = new Set([
    'forbidden',
    'unauthorized',
    'bad request',
    'internal server error',
]);

/**
 * El texto para la persona de cualquier error (una respuesta de la API, un error propio o un texto): si falta la
 * sesión (por el código), «Necesitas iniciar sesión…»; si el texto parece técnico, `fallback`. En un fallo del
 * servidor, con el código de la incidencia detrás.
 */
export function toUserFacingErrorMessage(error: unknown, fallback: string): string {
    const normalizedFallback = `${fallback ?? ''}`.trim() || 'No se pudo completar la acción.';

    if (esErrorDeSesion(error))
        return MENSAJE_SIN_SESION;

    if (error instanceof HttpErrorResponse) {
        const leido = leerErrorDeApi(error, normalizedFallback);
        return textoParaMostrar({ ...leido, mensaje: textoNoTecnico(leido.mensaje, normalizedFallback) });
    }

    return textoNoTecnico(mensajeDeError(error, ''), normalizedFallback);
}

function textoNoTecnico(message: string, fallback: string): string {
    const normalized = normalizarTexto(message);
    if (normalized.length < 1 || GENERIC_TECHNICAL_MESSAGES.has(normalized))
        return fallback;
    return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => normalized.includes(pattern)) ? fallback : message;
}
