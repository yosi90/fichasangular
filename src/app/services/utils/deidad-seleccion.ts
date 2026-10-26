import { normalizarTexto } from './normalizacion';

/**
 * La opción «sin deidad» de la creación. No es una fila del catálogo (la API no lista la deidad 0 de relleno): es la
 * etiqueta que la web enseña y guarda en `Personaje.Deidad` mientras no se elige ninguna.
 */
export const DEIDAD_SIN_SELECCION = 'No tener deidad';

/** Si el personaje no tiene deidad: sin texto o con la opción «sin deidad». */
export function esSinDeidad(deidad: string | null | undefined): boolean {
    const normalizada = normalizarTexto(deidad ?? '');
    return normalizada.length < 1 || normalizada === normalizarTexto(DEIDAD_SIN_SELECCION);
}
