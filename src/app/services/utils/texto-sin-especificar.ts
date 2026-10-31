import { toText } from './normalizacion';

/**
 * El texto con el que las inserciones guardan un texto que la API da vacío al modificar: los textos de relleno de la base
 * («no especifica», «ninguno»…) salen `null` (`docs/publica/SIN_RELLENO_FRONT.md`), y devolverlos como «No especifica»
 * los deja igual (sigue saliendo `null`). También es el valor inicial de los textos que lo admiten (Normal y Especial de la
 * dote).
 */
export const TEXTO_SIN_ESPECIFICAR = 'No especifica';

/** El texto recortado o, si llega vacío, el relleno: «No especifica» (la plantilla usa «No modifica», `TEXTO_SIN_CAMBIO`). */
export function textoOSinEspecificar(valor: unknown, relleno: string = TEXTO_SIN_ESPECIFICAR): string {
    const texto = toText(valor).trim();
    return texto.length > 0 ? texto : relleno;
}
