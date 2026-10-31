import { CamposDeFormulario } from './errores-de-formulario';

// Lo cambiado al modificar una entrada de catálogo campo a campo (la plantilla y el monstruo): qué campos cambian entre
// el cuerpo del alta tal como llegó la entrada y el de ahora, en qué pasos están, la nota del pie («N cambios: …») y la
// etiqueta «· cambiado» de cada campo. Guía de modificaciones de catálogo.

/** Una lista del cuerpo sin depender del orden de las filas. */
export function firmaLista(lista: readonly unknown[]): string {
    return JSON.stringify(lista.map((item) => JSON.stringify(item)).sort());
}

/**
 * Lo que cambia entre dos cuerpos del alta: los escalares del objeto `raiz` (`plantilla`, `monstruo`), cada uno por su
 * clave, y las `listas` del cuerpo, sin depender del orden de sus filas. Quien llama añade lo suyo y lo ordena con
 * `enOrdenDeCampos`.
 */
export function cambiosEntreCuerpos<C extends object>(antes: C, ahora: C, raiz: keyof C, listas: readonly (keyof C)[]): Set<string> {
    const cambiados = new Set<string>();
    const escalaresAntes = antes[raiz] as Record<string, unknown>;
    const escalaresAhora = ahora[raiz] as Record<string, unknown>;
    Object.keys(escalaresAhora).forEach((campo) => {
        if (JSON.stringify(escalaresAntes[campo] ?? null) !== JSON.stringify(escalaresAhora[campo] ?? null))
            cambiados.add(campo);
    });
    listas.forEach((lista) => {
        if (firmaLista((antes[lista] ?? []) as unknown[]) !== firmaLista((ahora[lista] ?? []) as unknown[]))
            cambiados.add(`${String(lista)}`);
    });
    return cambiados;
}

/** Las claves de `campos` que han cambiado, en el orden de los campos: así se marcan los campos y los pasos. */
export function enOrdenDeCampos(cambiados: ReadonlySet<string>, campos: CamposDeFormulario): string[] {
    return Object.keys(campos).filter((campo) => cambiados.has(campo));
}

/** Los pasos con algún campo cambiado (`[pasosConCambios]` del marco), sin repetir. */
export function pasosConCambios(cambios: readonly string[], campos: CamposDeFormulario): number[] {
    return Array.from(new Set(cambios.map((campo) => campos[campo].paso)));
}

/** La nota del pie al modificar: «Sin cambios todavía.» o «N cambios: Nombre, Tamaño…». */
export function notaDeCambios(cambios: readonly string[], campos: CamposDeFormulario): string {
    if (cambios.length < 1)
        return 'Sin cambios todavía.';
    const etiquetas = cambios.map((campo) => campos[campo].etiqueta);
    return `${cambios.length === 1 ? '1 cambio' : `${cambios.length} cambios`}: ${etiquetas.join(', ')}`;
}

/** La etiqueta de un campo y, si ha cambiado, «Nombre · cambiado». */
export function etiquetaDeCampo(campos: CamposDeFormulario, campo: string, cambiado: boolean): string {
    const base = campos[campo]?.etiqueta ?? campo;
    return cambiado ? `${base} · cambiado` : base;
}
