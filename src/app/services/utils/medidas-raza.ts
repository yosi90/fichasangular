/*
 * La altura y el peso de un personaje frente a los de su raza (decisión del 2026-10-31: el rango va del mínimo al máximo
 * de la tabla aleatoria del libro unido a las cifras de su descripción, MJ pág. 109; fuera de él, la ficha es homebrew).
 * Lo usan la creación (Básicos) y la corrección de la ficha. Una raza sin el rango (0: el manual no lo da) no tiene nada
 * con lo que comparar.
 */

export interface MedidasRaza {
    Altura_rango_inf?: number | null;
    Altura_rango_sup?: number | null;
    Peso_rango_inf?: number | null;
    Peso_rango_sup?: number | null;
}

const EPSILON = 0.0001;

function fueraDelRango(valor: unknown, minimo: unknown, maximo: unknown): boolean {
    const v = Number(valor);
    const min = Number(minimo);
    const max = Number(maximo);
    if (Number.isNaN(v) || Number.isNaN(min) || Number.isNaN(max) || v <= 0 || max <= 0)
        return false;
    return v < (min - EPSILON) || v > (max + EPSILON);
}

/** Si la altura (en metros) se sale del rango de su raza. */
export function alturaFueraDeRango(altura: unknown, raza: MedidasRaza | null | undefined): boolean {
    return !!raza && fueraDelRango(altura, raza.Altura_rango_inf, raza.Altura_rango_sup);
}

/** Si el peso (en kilos) se sale del rango de su raza. */
export function pesoFueraDeRango(peso: unknown, raza: MedidasRaza | null | undefined): boolean {
    return !!raza && fueraDelRango(peso, raza.Peso_rango_inf, raza.Peso_rango_sup);
}
