import { Comodin } from 'src/app/interfaces/comodin';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

/**
 * La marca de comodín de un campo que llega de la API o de la caché de la RTDB: `'elegir'`, `'cualquiera'` o `null`.
 * En la RTDB un `null` es una clave que no existe, así que «no está» también es `null`.
 */
export function leerComodin(valor: unknown): Comodin | null {
    return valor === 'elegir' || valor === 'cualquiera' ? valor : null;
}

/**
 * Si un nombre es el comodín `comodin`. Lo que llega de la API trae su marca (`Comodin`, aunque sea `null`) y manda ella;
 * el borrador de la creación no la tiene y escribe el texto él mismo («Cualquiera» en la escuela especialista).
 */
export function esNombreComodin(
    campo: { Nombre?: string | null; Comodin?: Comodin | null } | null | undefined,
    comodin: Comodin,
): boolean {
    if (campo?.Comodin !== undefined)
        return campo.Comodin === comodin;
    return normalizarTexto(campo?.Nombre) === comodin;
}

/** Si una fila de un listado de catálogo es un comodín entero (la clase 0 «Cualquiera», el extra «Elegir»…). */
export function esFilaComodin(fila: { Comodin?: Comodin | null } | null | undefined): boolean {
    return leerComodin(fila?.Comodin) !== null;
}
