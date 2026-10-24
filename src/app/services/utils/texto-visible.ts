import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

/**
 * Los textos de relleno que la API manda en vez de dejar el campo vacío (propietario, 2026-10-24: una sola lista para
 * todos los detalles, la unión de las que tenía cada uno). Se comparan sin tildes, mayúsculas ni puntos. Cuando la
 * API deje de mandarlos (roadmap de duplicados, «Entre partes»), esta lista sobra. «Cualquiera» y «Elegir» no son
 * relleno (propietario, 2026-10-24): «Cualquiera» se usa en los prerrequisitos y «Elegir» en la tabla de habilidades.
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
    'ninguna',
    'ninguno',
    'placeholder',
]);

/**
 * Si `texto` tiene algo que enseñar: no está vacío y no es un texto de relleno. En la ficha de un personaje,
 * «Cualquiera» tampoco es una elección real y se oculta (`cualquieraEsRelleno`); en los catálogos sí significa algo.
 */
export function tieneTextoVisible(texto: string | null | undefined, { cualquieraEsRelleno = false } = {}): boolean {
    const limpio = normalizarTexto(texto).replace(/[.]/g, '');
    return limpio.length > 0 && !TEXTOS_DE_RELLENO.has(limpio) && !(cualquieraEsRelleno && limpio === 'cualquiera');
}

/** El nombre de una dote con su extra entre paréntesis, si el extra tiene algo que enseñar. */
export function nombreDoteConExtra(doteCtx: DoteContextual): string {
    const extra = `${doteCtx?.Contexto?.Extra ?? ''}`.trim();
    const nombre = doteCtx?.Dote?.Nombre ?? '';
    return tieneTextoVisible(extra) ? `${nombre} (${extra})` : nombre;
}

/**
 * Los idiomas que enseña un detalle: los que tienen nombre visible, sin repetir (sin distinguir tildes ni mayúsculas),
 * recortados y por orden alfabético.
 */
export function idiomasVisibles(
    idiomas: { Nombre?: string | null; Descripcion?: string | null; }[] | null | undefined,
): { Nombre: string; Descripcion: string; }[] {
    const vistos = new Set<string>();
    return (idiomas ?? [])
        .filter(idioma => tieneTextoVisible(idioma?.Nombre))
        .filter((idioma) => {
            const key = normalizarTexto(idioma.Nombre);
            if (!key || vistos.has(key))
                return false;
            vistos.add(key);
            return true;
        })
        .map(idioma => ({
            Nombre: `${idioma.Nombre ?? ''}`.trim(),
            Descripcion: `${idioma.Descripcion ?? ''}`.trim(),
        }))
        .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
}
