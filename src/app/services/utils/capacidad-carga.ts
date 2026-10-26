import { toInt, toNumber } from 'src/app/services/utils/normalizacion';

/**
 * La capacidad de carga (Manual del jugador, cap. 9, tabla 9-1), la misma regla que la ficha de la API
 * (`utils/carga.py`): la fila de su Fuerza de la tabla (`GET /capacidades-carga`, Fuerza 1 a 29) por el multiplicador de
 * su tamaño (`GET /tamanos`: `Multiplicador_carga`, o `Multiplicador_carga_cuadrupedo` si la raza es `Cuadrupedo`), hacia
 * abajo. Con Fuerza 30 o más, la fila de la Fuerza 10 puntos menor ×4 por cada 10 puntos.
 */

export const FACTOR_CADA_10_FUERZA = 4;

export interface FilaCapacidadCarga {
    Fuerza: number;
    Ligera: number;
    Media: number;
    Pesada: number;
}

export interface CapacidadCarga {
    Ligera: number;
    Media: number;
    Pesada: number;
}

export function capacidadCarga(fuerza: number, tabla: readonly FilaCapacidadCarga[], multiplicador: number | null | undefined): CapacidadCarga {
    let valor = toInt(fuerza);
    const porFuerza = new Map(tabla.map((fila) => [toInt(fila.Fuerza), fila]));
    const maxima = Math.max(0, ...porFuerza.keys());
    if (valor <= 0 || maxima <= 0)
        return { Ligera: 0, Media: 0, Pesada: 0 };
    let factor = 1;
    while (valor > maxima) {
        valor -= 10;
        factor *= FACTOR_CADA_10_FUERZA;
    }
    const fila = porFuerza.get(valor);
    const por = factor * (multiplicador === null || multiplicador === undefined ? 1 : toNumber(multiplicador));
    return {
        Ligera: Math.floor(toNumber(fila?.Ligera) * por),
        Media: Math.floor(toNumber(fila?.Media) * por),
        Pesada: Math.floor(toNumber(fila?.Pesada) * por),
    };
}
