/**
 * Las columnas de una tabla con una columna opcional (la de homebrew, la de archivados) puesta al final o quitada,
 * según `mostrar`. Si ya está como debe, devuelve la misma lista. Es la única copia: los listados que enseñan una
 * columna solo con un filtro puesto la usan en vez de añadirla y quitarla a mano.
 */
export function conColumnaOpcional(columnas: string[], columna: string, mostrar: boolean): string[] {
    if (columnas.includes(columna) === mostrar)
        return columnas;
    return mostrar ? [...columnas, columna] : columnas.filter((c) => c !== columna);
}
