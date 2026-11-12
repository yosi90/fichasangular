/**
 * La lista de un catálogo con una opción que no lista delante, si no trae ya una fila con su id: la opción «sin X» de un
 * editor (el id 0) o, al modificar, la que tiene la entrada cargada (el «Elegir» del tipo de daño de la presa, en
 * `nuevo-equipo`). Desde el 2026-10-24 la API ya no lista las filas de relleno (el 0 «No aplica», «Sin prioridad», «No vuela»…), pero al
 * guardar sigue aceptando su id 0: los editores ofrecen la suya para que el desplegable no se quede vacío.
 */
export function conOpcionSinValor<T extends { Id: number }>(items: T[] | null | undefined, opcion: T): T[] {
    const lista = Array.isArray(items) ? items : [];
    return lista.some((item) => Number(item?.Id) === Number(opcion.Id)) ? lista : [opcion, ...lista];
}

/**
 * Las opciones de un desplegable con la que tiene la fila si el catálogo no la lista (llega con la entrada que se
 * modifica): con su id, `#id`, para no perderla al guardar. Sin id (`null`), la lista tal cual. Los modificadores de
 * `<app-equipo-magia>` y los bonificadores condicionales de `nueva-racial`.
 */
export function conOpcionDeLaFila(items: { Id: number; Nombre: string; }[] | null | undefined, id: number | null): { Id: number; Nombre: string; }[] {
    const lista = Array.isArray(items) ? items : [];
    return id === null ? lista : conOpcionSinValor(lista, { Id: id, Nombre: `#${id}` });
}
