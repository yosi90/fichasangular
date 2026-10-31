import { Movimientos } from "src/app/interfaces/movimientos";
import { toNumber } from 'src/app/services/utils/normalizacion';

/** Los campos de las velocidades en los cuerpos del alta de la plantilla y el monstruo (y en la fila de una raza), en orden. */
export const CAMPOS_VELOCIDAD = ['correr', 'nadar', 'volar', 'trepar', 'excavar'] as const;

/** Los `Movimientos` de un monstruo, una plantilla o un subtipo: cada uno a número (0 si no lo tiene). */
export function normalizeMovimientos(raw: any): Movimientos {
    return {
        Correr: toNumber(raw?.Correr),
        Nadar: toNumber(raw?.Nadar),
        Volar: toNumber(raw?.Volar),
        Trepar: toNumber(raw?.Trepar),
        Excavar: toNumber(raw?.Excavar),
    };
}
