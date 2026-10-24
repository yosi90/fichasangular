const COMPARADOR_TEXTO = new Intl.Collator('es', { sensitivity: 'base' });

/**
 * Compara dos textos como se ordenan en español, sin distinguir tildes ni mayúsculas: «Ágil» va con la A. Lo que no
 * viene (`null`, `undefined`) cuenta como texto vacío. Es la única copia: las listas que se ordenan por un texto la
 * usan en vez de escribir el `localeCompare` a mano.
 */
export function compararTexto(a: unknown, b: unknown): number {
    return COMPARADOR_TEXTO.compare(`${a ?? ''}`, `${b ?? ''}`);
}

/** Ordena por `Nombre` con `compararTexto`: el orden de los catálogos. */
export function porNombre(a: { Nombre?: string | null }, b: { Nombre?: string | null }): number {
    return compararTexto(a?.Nombre, b?.Nombre);
}
