// Conversión tolerante de los valores que llegan crudos (respuestas de la API, cachés de la RTDB, formularios) y
// normalización de textos para compararlos o buscarlos. Son la única copia: los mappers, servicios y componentes las
// importan de aquí en vez de declarar las suyas.

import { Id_nombre } from 'src/app/interfaces/genericas';

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

/** `toNumberOrNull` truncado: el entero que representa `value`, o `null` si no hay número (un dato que falta no es un 0). */
export function toIntOrNull(value: unknown): number | null {
    const parsed = toNumberOrNull(value);
    return parsed === null ? null : Math.trunc(parsed);
}

/** El entero (truncado) que representa `value` si es mayor que 0 (los ids), o `null` si no lo es o no es un número. */
export function toPositiveInt(value: unknown): number | null {
    const parsed = Math.trunc(Number(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Los ids (enteros, truncados) sin repetidos y de menor a mayor, desde `minimo`: por defecto 1 (los ids); 0 donde el 0
 * es el comodín «Elegir» de un catálogo (los extras). Lo que no es un número se descarta.
 */
export function idsUnicosOrdenados(ids: readonly unknown[] | null | undefined, minimo: number = 1): number[] {
    return Array.from(new Set((ids ?? []).map((id) => toInt(id, minimo - 1)).filter((id) => id >= minimo))).sort((a, b) => a - b);
}

/**
 * El id de una referencia a otro catálogo que la API puede dar `null` por ser de relleno (el rasgo de una ventaja, el
 * arma o el panteón de una deidad…): `null` si no tiene (el mapper la deja con id 0 y sin nombre). Un id 0 con nombre es
 * una opción de verdad («Elegir» en las habilidades o en el arma de una deidad).
 */
export function idDeReferencia(ref: { Id?: unknown; Nombre?: unknown; } | null | undefined): number | null {
    const id = toInt(ref?.Id, 0);
    if (id > 0)
        return id;
    return id === 0 && `${ref?.Nombre ?? ''}`.trim().length > 0 ? 0 : null;
}

/**
 * El entero (truncado) que representa `value`, llevado a `[min, max]`; si no es un número finito, `siNoEsNumero` (sin
 * acotar). Los límites de la política de campaña y del generador de características.
 */
export function enteroEntre<F extends number | null>(value: unknown, min: number, max: number, siNoEsNumero: F): number | F {
    const parsed = Math.trunc(Number(value));
    if (!Number.isFinite(parsed))
        return siNoEsNumero;
    return Math.min(max, Math.max(min, parsed));
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

/** Una referencia `{ Id, Nombre }` del contrato (el nombre, sin espacios a los lados), o `null` si no trae ni id ni nombre. */
export function toRefIdNombre(value: any): Id_nombre | null {
    const id = toNumber(value?.Id);
    const nombre = toText(value?.Nombre).trim();
    return id > 0 || nombre.length > 0 ? { Id: id, Nombre: nombre } : null;
}

/**
 * Qué elementos de una lista `{ Id, Nombre }` se quedan (`idNombres`):
 * - `conId` (por defecto): los que tienen id (> 0). Las listas de referencias a otro catálogo, donde una fila sin id es
 *   de relleno (los rasgos quitados de una plantilla, los alineamientos devotos, las plantillas de familiar).
 * - `conIdONombre`: también los que solo traen nombre (las competencias y las clases de una raza, los descriptores de un
 *   conjuro, las listas que se enseñan tal cual las da la API), porque una fila con id 0 y nombre es una opción de
 *   verdad. Una sin id ni nombre no lo es en ninguna lista: nunca sale.
 */
export type FiltroIdNombres = 'conId' | 'conIdONombre';

export interface OpcionesIdNombres {
    filtro?: FiltroIdNombres;
    /**
     * `true`: solo vale una lista de verdad (un objeto da `[]`), como las lecturas que ya eran estrictas (la plantilla,
     * los descriptores del conjuro). Por defecto, también los valores de un objeto (las listas de la RTDB, `toArray`).
     */
    soloLista?: boolean;
}

/**
 * Una lista `{ Id, Nombre }` del contrato o de una caché como `Id_nombre[]`: la única lectura de estas listas en la web
 * (antes, una copia en cada mapper). El id es un entero (`toInt`: los ids de la base son enteros) y el nombre va sin
 * espacios a los lados (la página los colapsa igual: no cambia lo que se ve). Lo que no es un objeto no es un elemento y
 * no sale. `filtro` y `soloLista` conservan lo que hacía cada copia (`OpcionesIdNombres`), salvo las filas sin id ni
 * nombre, que algunas dejaban pasar y ninguna lista necesita.
 */
export function idNombres(raw: unknown, { filtro = 'conId', soloLista = false }: OpcionesIdNombres = {}): Id_nombre[] {
    const lista: unknown[] = soloLista ? (Array.isArray(raw) ? raw : []) : toArray(raw);
    return lista
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((item) => ({ Id: toInt(item['Id']), Nombre: toText(item['Nombre']).trim() }))
        .filter((item) => item.Id > 0 || (filtro === 'conIdONombre' && item.Nombre.length > 0));
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
