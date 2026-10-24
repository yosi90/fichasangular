import { toNumber } from 'src/app/services/utils/normalizacion';

/** Riqueza del personaje por nivel efectivo (NEP), en piezas de oro, según la tabla de la Guía del DM. */
const ORO_POR_NEP: Record<number, number> = {
    1: 0,
    2: 900,
    3: 2700,
    4: 5400,
    5: 9000,
    6: 13000,
    7: 19000,
    8: 27000,
    9: 36000,
    10: 49000,
    11: 66000,
    12: 88000,
    13: 110000,
    14: 150000,
    15: 200000,
    16: 260000,
    17: 340000,
    18: 440000,
    19: 580000,
    20: 760000,
};

/** El oro inicial de un personaje de nivel efectivo `nep`; por encima de 20 se extrapola. */
export function calcularOroPorNep(nep: number): number {
    const valorNep = Math.max(0, Math.trunc(toNumber(nep)));
    if (valorNep <= 20)
        return ORO_POR_NEP[valorNep] || 0;
    return Math.round(760000 * (1.3 * (valorNep - 20)));
}
