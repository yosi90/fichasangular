// Conversión tolerante de los valores que llegan crudos (respuestas de la API, cachés de la RTDB, formularios) y
// normalización de textos para compararlos o buscarlos. Son la única copia: los mappers, servicios y componentes las
// importan de aquí en vez de declarar las suyas.

/** El número que representa `value`, o `fallback` si no es un número finito (`null`, `''` se leen como 0). */
export function toNumber(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

/** `value` como texto; `null` y `undefined` dan `fallback`. No recorta espacios. */
export function toText(value: any, fallback: string = ''): string {
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

const VALORES_SI = new Set(['true', '1', 'sí', 'si', 'yes']);

/**
 * Sí o no, con una sola regla para toda la web (propietario, 2026-10-24): sí con `true`, `1` y los textos «true», «1»,
 * «sí», «si» y «yes», sin distinguir mayúsculas ni espacios alrededor; todo lo demás, no (también `2`, `-1` o «no»).
 * `siFalta` es lo que vale cuando el campo no viene (`null` o `undefined`), para los campos con un valor por defecto.
 */
export function toBoolean(value: unknown, siFalta: boolean = false): boolean {
    if (value === null || value === undefined)
        return siFalta;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value === 1;
    if (typeof value === 'string')
        return VALORES_SI.has(value.trim().toLowerCase());
    return false;
}

/** `value` como lista: una lista tal cual, los valores de un objeto (las listas de la RTDB) o una lista vacía. */
export function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === 'object')
        return Object.values(value) as T[];
    return [];
}

/** Texto para comparar y buscar: sin tildes ni diacríticos, sin espacios a los lados y en minúsculas. */
export function normalizarTexto(value: unknown): string {
    return `${value ?? ''}`
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase();
}
