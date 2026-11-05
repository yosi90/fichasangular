import { toBoolean, toInt } from 'src/app/services/utils/normalizacion';

/**
 * La identidad de una habilidad del personaje: su catálogo y su id. Las habilidades del catálogo (`habilidades`) y las
 * personalizadas (`habilidades_custom`) tienen ids de espacios distintos (en `rol_dev`, la personalizada 2 es
 * Autohipnosis y la habilidad 2, Artesanía 1), así que el id solo no la identifica. La creación busca, compara y guarda
 * en sus mapas las habilidades por esta clave; a la API llegan como siempre, en `habilidades.base` o `habilidades.custom`.
 */
export type ClaveHabilidad = string;

const PREFIJO_CATALOGO = 'habilidad';
const PREFIJO_PERSONALIZADA = 'personalizada';

/** La clave de la habilidad con ese id en su catálogo (`custom`: el de las personalizadas). */
export function claveDeHabilidad(id: unknown, custom: unknown): ClaveHabilidad {
    return `${toBoolean(custom) ? PREFIJO_PERSONALIZADA : PREFIJO_CATALOGO}:${toInt(id, 0)}`;
}

/** La clave de una habilidad del personaje (`Id` y `Custom`). */
export function claveHabilidad(habilidad: { Id?: unknown; Custom?: unknown; } | null | undefined): ClaveHabilidad {
    return claveDeHabilidad(habilidad?.Id, habilidad?.Custom);
}

/**
 * Las claves que corresponden a una referencia guardada en un borrador: una clave tal cual y, en los borradores de
 * antes de las claves, el id solo, que vale para las habilidades con ese id de los dos catálogos (como se leía entonces).
 */
export function clavesDeReferenciaGuardada(
    referencia: unknown,
    habilidades: readonly { Id?: unknown; Custom?: unknown; }[] | null | undefined
): ClaveHabilidad[] {
    const texto = `${referencia ?? ''}`.trim();
    if (texto.includes(':'))
        return [texto];
    const id = toInt(texto, 0);
    if (id <= 0)
        return [];
    return (habilidades ?? []).filter((habilidad) => toInt(habilidad?.Id, 0) === id).map(claveHabilidad);
}
