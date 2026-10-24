/**
 * La lista de un catálogo con la opción «sin X» de un editor delante, si el catálogo no trae ya una fila con el id 0.
 * Desde el 2026-10-24 la API ya no lista las filas de relleno (el 0 «No aplica», «Sin prioridad», «No vuela»…), pero al
 * guardar sigue aceptando su id 0: los editores ofrecen la suya para que el desplegable no se quede vacío.
 */
export function conOpcionSinValor<T extends { Id: number }>(items: T[] | null | undefined, opcion: T): T[] {
    const lista = Array.isArray(items) ? items : [];
    return lista.some((item) => Number(item?.Id) === 0) ? lista : [opcion, ...lista];
}
