import { PersonajeParteDto } from 'src/app/interfaces/personajes-api';
import { toNullableText, toNumber } from 'src/app/services/utils/normalizacion';

/**
 * Lo que un bonificador racial de habilidad suma además solo en un caso (`razas_habilidades.condicion`, desde el
 * 2026-11-06): el svirfneblin tiene +2 a Esconderse siempre (`Cantidad`) y +2 más «bajo tierra» (MM1, pág. 140). Puede ser
 * negativo: lo que pierde en ese caso (el níctero, −4 a Avistar «si su sentido ciego queda anulado»). Sin condición, 0 y
 * `null`: no hay parte condicional.
 */
export interface ParteCondicionalHabilidadRaza {
    Cantidad_condicional: number;
    Condicion: string | null;
}

/** La parte condicional de una habilidad de la raza tal como llega (API, caché `Razas` o borrador). */
export function parteCondicionalHabilidadRaza(raw: any): ParteCondicionalHabilidadRaza {
    const condicion = toNullableText(raw?.Condicion ?? raw?.condicion);
    const cantidad = toNumber(raw?.Cantidad_condicional ?? raw?.cantidad_condicional);
    return condicion === null || cantidad === 0
        ? { Cantidad_condicional: 0, Condicion: null }
        : { Cantidad_condicional: cantidad, Condicion: condicion };
}

/**
 * La parte situacional de una habilidad de la raza, con la forma de lo condicional de la ficha (`condicionales` de
 * `PersonajeDetalle`): `{ tipo: 'varios', origen: <raza>, valor, condicion }`, o `null` si cuenta siempre. Se enseña y no
 * se suma.
 */
export function bonoRacialCondicional(raw: any, origen: string): PersonajeParteDto | null {
    const parte = parteCondicionalHabilidadRaza(raw);
    if (parte.Condicion === null)
        return null;
    return parteCondicionalVarios(origen, parte.Cantidad_condicional, parte.Condicion);
}

/**
 * Lo que suma a una habilidad solo en un caso, con la forma de lo condicional de la ficha: `{ tipo: 'varios', origen,
 * valor, condicion }`. La parte situacional de una habilidad de la raza (`bonoRacialCondicional`) y la habilidad con
 * condición de uno de sus rasgos (`habilidadesDeRasgos`).
 */
export function parteCondicionalVarios(origen: string, valor: number, condicion: string): PersonajeParteDto {
    return { tipo: 'varios', origen: `${origen ?? ''}`.trim() || null, valor, condicion };
}
