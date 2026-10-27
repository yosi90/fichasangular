// Conversión tolerante de los valores que llegan crudos (respuestas de la API, cachés de la RTDB, formularios) y
// normalización de textos para compararlos o buscarlos. Son la única copia: los mappers, servicios y componentes las
// importan de aquí en vez de declarar las suyas.

/** El número que representa `value`, o `fallback` si no es un número finito (`null`, `''` se leen como 0). */
export function toNumber(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

/** El número que representa `value`, o `null` si no hay número (`null`, `undefined`, `''` o algo que no lo es): un dato que falta no es un 0. */
export function toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || `${value}`.trim().length < 1)
        return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

/** El entero (truncado) que representa `value`, o `fallback` si no es un número finito. */
export function toInt(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

/** `value` redondeado a centésimas (los precios en po y los pesos en lb); lo que no es un número finito, 0. */
export function redondearCentesimas(value: number): number {
    return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

/** El primer entero con signo que aparece en `value` («+6/+1» → 6, «-2 a Reflejos» → -2); `null` si no hay ninguno. */
export function primerEntero(value: unknown): number | null {
    const encontrado = `${value ?? ''}`.match(/[+-]?\d+/);
    return encontrado ? Number(encontrado[0]) : null;
}

/** `value` como texto; `null` y `undefined` dan `fallback`. No recorta espacios. */
export function toText(value: any, fallback: string = ''): string {
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

/** `value` como texto sin espacios a los lados, o `null` si queda vacío (un texto que falta no es «»). */
export function toNullableText(value: unknown): string | null {
    const text = `${value ?? ''}`.trim();
    return text.length > 0 ? text : null;
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

/**
 * Texto para comparar y buscar: sin tildes ni diacríticos, sin espacios a los lados y en minúsculas. Con
 * `juntarEspacios`, además, los espacios seguidos cuentan como uno (los buscadores lo usan así: propietario, 2026-10-24).
 */
export function normalizarTexto(value: unknown, juntarEspacios: boolean = false): string {
    const texto = `${value ?? ''}`
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase();
    return juntarEspacios ? texto.replace(/\s+/g, ' ') : texto;
}

/** Los textos sin vacíos ni repetidos, comparados con `normalizarTexto`; se queda la primera forma de cada uno. */
export function textosUnicos(valores: string[]): string[] {
    const vistos = new Set<string>();
    return valores.filter((valor) => {
        const clave = normalizarTexto(valor);
        if (clave.length < 1 || vistos.has(clave))
            return false;
        vistos.add(clave);
        return true;
    });
}
