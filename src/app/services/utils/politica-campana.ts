import { CampaignCreationPolicy, CampaignPurchasePolicy } from 'src/app/interfaces/campaign-management';
import { toBoolean, toIntOrNull } from 'src/app/services/utils/normalizacion';
import { normalizarPrecioMaximoPorPieza } from 'src/app/services/utils/tienda-equipo';

/**
 * Qué homebrew deja la campaña: todo (`unrestricted`), hasta un número de fuentes (`limited`) o nada (`forbidden`).
 * Sin política (sin campaña, o un PNJ en la creación), todo.
 */
export type ModoHomebrewCampana = 'unrestricted' | 'limited' | 'forbidden';

/**
 * El modo de homebrew de una política de campaña (`politicaCreacion` o su parte de compra, `politicaCompra` de la ficha).
 * Lo usan la creación (sus selectores y su tienda) y la tienda de una sesión: una sola regla.
 */
export function modoHomebrewDeCampana(
    policy: Partial<Pick<CampaignCreationPolicy, 'permitirHomebrewGeneral' | 'maxFuentesHomebrewGeneralesPorPersonaje'>> | null | undefined,
): ModoHomebrewCampana {
    if (!policy || policy.permitirHomebrewGeneral === true)
        return 'unrestricted';
    const maximo = maximoFuentesHomebrew(policy.maxFuentesHomebrewGeneralesPorPersonaje);
    if (maximo !== null)
        return maximo <= 0 ? 'forbidden' : 'limited';
    return policy.permitirHomebrewGeneral === false ? 'forbidden' : 'unrestricted';
}

/** El límite de fuentes homebrew de la política: entero, 0 o más; sin dato o algo que no es un número, `null`. */
function maximoFuentesHomebrew(value: unknown): number | null {
    const entero = toIntOrNull(value);
    return entero === null ? null : Math.max(0, entero);
}

/**
 * `politicaCompra` de `GET /personajes/{id}` (desde el 2026-11-12): lo que deja comprar u obtener la campaña del personaje,
 * o `null` sin campaña (o si la API no la da). Con los mismos nombres que `politicaCreacion`, así que la tienda la lee
 * con `politicaTienda` y `modoHomebrewDeCampana`, como la de la creación.
 */
export function leerPoliticaCompra(valor: any): CampaignPurchasePolicy | null {
    if (!valor || typeof valor !== 'object')
        return null;
    return {
        permitirHomebrewGeneral: toBoolean(valor.permitirHomebrewGeneral, true),
        maxFuentesHomebrewGeneralesPorPersonaje: maximoFuentesHomebrew(valor.maxFuentesHomebrewGeneralesPorPersonaje),
        permitirObjetosMagicos: toBoolean(valor.permitirObjetosMagicos, true),
        permitirObjetosAMedida: toBoolean(valor.permitirObjetosAMedida, true),
        precioMaximoPorObjeto: normalizarPrecioMaximoPorPieza(valor.precioMaximoPorObjeto),
        permitirCopiarConjuros: toBoolean(valor.permitirCopiarConjuros, true),
    };
}
