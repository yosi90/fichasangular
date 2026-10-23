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
