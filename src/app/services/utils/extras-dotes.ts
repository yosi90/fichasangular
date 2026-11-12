import { ElementoConTipoArma } from './competencias-armas';
import { toBoolean, toInt } from './normalizacion';

/*
 * Los catálogos con los que el motor de la creación ofrece el extra de una dote (el arma, la armadura o el escudo, el
 * grupo, la escuela) y resuelve las competencias por grupo (`NuevoPersonajeService.setCatalogo…Dotes`). Una sola copia
 * para la creación y la subida de nivel, que cargan los mismos catálogos.
 */

interface ElementoDeCatalogo {
    Id?: number | null;
    Nombre?: string | null;
}

/** Un elemento del catálogo como extra de una dote: su id y su nombre (un grupo de armaduras, una escuela). */
export function extraDeDote(elemento: ElementoDeCatalogo | null | undefined): { Id: number; Nombre: string; } {
    return { Id: toInt(elemento?.Id), Nombre: `${elemento?.Nombre ?? ''}`.trim() };
}

/**
 * Un arma o un grupo de armas, con el tipo de arma que es o que cubre (sencilla, marcial, exótica): las competencias
 * por grupo («Todas las armas marciales») lo necesitan (`armasDeGrupos`).
 */
export function extraConTipoArma(
    elemento: (ElementoDeCatalogo & { Tipo_arma?: { Id?: number | null; } | null; }) | null | undefined,
): ElementoConTipoArma {
    return { ...extraDeDote(elemento), Id_tipo_arma: elemento?.Tipo_arma?.Id ?? null };
}

/** Una armadura o un escudo: las dotes de armadura y las de escudo ofrecen cada una lo suyo (`Es_escudo`). */
export function extraDeArmadura(
    armadura: (ElementoDeCatalogo & { Es_escudo?: boolean | null; }) | null | undefined,
): { Id: number; Nombre: string; Es_escudo: boolean; } {
    return { ...extraDeDote(armadura), Es_escudo: toBoolean(armadura?.Es_escudo) };
}
