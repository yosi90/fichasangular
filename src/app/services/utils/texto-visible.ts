import { normalizarTexto } from 'src/app/services/utils/normalizacion';

/**
 * Los textos de relleno que la API manda en vez de dejar el campo vacío (propietario, 2026-10-24: una sola lista para
 * todos los detalles, la unión de las que tenía cada uno). Se comparan sin tildes, mayúsculas ni puntos. Cuando la
 * API deje de mandarlos (roadmap de duplicados, «Entre partes»), esta lista sobra.
 */
const TEXTOS_DE_RELLENO = new Set([
    'no especifica',
    'no se especifica',
    'no aplica',
    'no modifica',
    'no vuela',
    '-',
    'nada',
    'sin genero',
    'no tener deidad',
    'desconocido',
    'cualquiera',
    'ninguna',
    'ninguno',
    'placeholder',
]);

/** Si `texto` tiene algo que enseñar: no está vacío y no es un texto de relleno. */
export function tieneTextoVisible(texto: string | null | undefined): boolean {
    const limpio = normalizarTexto(texto).replace(/[.]/g, '');
    return limpio.length > 0 && !TEXTOS_DE_RELLENO.has(limpio);
}
