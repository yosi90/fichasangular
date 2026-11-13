import { CampaignCreationPolicy, CampaignPurchasePolicy } from 'src/app/interfaces/campaign-management';
import { toBoolean, toIntOrNull } from 'src/app/services/utils/normalizacion';
import { normalizarPrecioMaximoPorPieza } from 'src/app/services/utils/tienda-equipo';

/**
 * Qué homebrew deja la campaña: todo (`unrestricted`), hasta un número de fuentes (`limited`) o nada (`forbidden`).
 * Sin política (sin campaña, o un PNJ, que es del máster y queda fuera de la política de la campaña), todo.
 */
export type ModoHomebrewCampana = 'unrestricted' | 'limited' | 'forbidden';

/**
 * El modo de homebrew de una política de campaña (`politicaCreacion` o su parte de compra, `politicaCompra` de la ficha),
 * con la regla del contrato (`docs/publica/endpoints/campanas.md`, «Los tres modos de homebrew»): `permitirHomebrewGeneral`
 * en `false`, nada (el límite no cuenta); `true` con un límite, hasta ese número de fuentes (con 0, nada); `true` sin
 * límite, todo. Lo usan la creación (sus selectores y su tienda), la tienda de una sesión y el editor de campañas.
 */
export function modoHomebrewDeCampana(
    policy: Partial<Pick<CampaignCreationPolicy, 'permitirHomebrewGeneral' | 'maxFuentesHomebrewGeneralesPorPersonaje'>> | null | undefined,
): ModoHomebrewCampana {
    if (!policy)
        return 'unrestricted';
    if (policy.permitirHomebrewGeneral === false)
        return 'forbidden';
    const maximo = maximoFuentesHomebrew(policy.maxFuentesHomebrewGeneralesPorPersonaje);
    if (maximo === null)
        return 'unrestricted';
    return maximo <= 0 ? 'forbidden' : 'limited';
}

/**
 * Si la campaña deja elegir una plantilla sin cumplir sus prerrequisitos (la decisión `requisitos_plantilla`): solo si
 * admite homebrew sin límite de fuentes, porque el personaje pasa a serlo (sin campaña, siempre). La usan la creación y la
 * adquisición de una plantilla (sesiones, fase 7); la API aplica la misma regla en el alta y en
 * `POST /personajes/{id}/plantillas` (`campaign_policy_service.deja_saltar_requisitos_plantilla`, desde el 2026-11-13).
 */
export function campanaDejaSaltarRequisitosPlantilla(
    policy: Parameters<typeof modoHomebrewDeCampana>[0],
): boolean {
    return modoHomebrewDeCampana(policy) === 'unrestricted';
}

/**
 * El límite de fuentes homebrew de la política: entero, 0 o más; sin dato o algo que no es un número, `null`. Lo usan
 * `modoHomebrewDeCampana`, `leerPoliticaCompra` y las comprobaciones de la campaña en la creación.
 */
export function maximoFuentesHomebrew(value: unknown): number | null {
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
