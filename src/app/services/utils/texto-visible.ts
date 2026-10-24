import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { porNombre } from 'src/app/services/utils/orden-texto';

/**
 * Los textos que los detalles no enseñan (propietario, 2026-10-24: una sola lista para todos los detalles). Se comparan
 * sin tildes, mayúsculas ni puntos. Desde el 2026-10-24 la API ya no manda los textos de relleno de la base (da `null`),
 * así que aquí solo quedan los que pone la propia web: el borrador de la creación, que la vista previa enseña con los
 * mismos detalles («No aplica» en el extra de una dote, «Ninguna» en la disciplina, «No tener deidad» y «-» en los
 * nombres que aún no hay), los formularios de alta, que proponen «No especifica» y enseñan su vista previa con los
 * detalles, «Desconocido» (un origen sin dato) y «Sin genero» (un género de verdad, pero que no se enseña). «Ninguno» o
 * «Nada» en un texto de la API son un dato y se ven.
 * «Cualquiera» y «Elegir» no son relleno: «Cualquiera» se usa en los prerrequisitos y «Elegir» en las habilidades.
 */
const TEXTOS_DE_RELLENO = new Set([
    'no especifica',
    'no aplica',
    '-',
    'sin genero',
    'no tener deidad',
    'desconocido',
    'ninguna',
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
        .sort(porNombre);
}
