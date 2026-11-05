import { PermissionResource } from 'src/app/interfaces/user-acl';

/**
 * El permiso de creación del backend (`PermissionResource`) que piden el alta **y la edición** de cada catálogo, por el
 * nombre con el que se abre su listado (`LISTADOS_ROL`). Es la tabla de `docs/publica/CATALOGOS_ALTA_Y_EDICION_FRONT.md`:
 * en Rol no hay un permiso aparte para modificar, así que Insertar y Modificar miran el mismo.
 *
 * Armas y armaduras tienen su permiso; los demás catálogos del equipo (munición, materiales, aptitudes, objetos y
 * conjuntos) comparten uno, `objetos` (segunda parte del hito 7).
 */
export const RECURSO_DE_CATALOGO: Readonly<Record<string, PermissionResource>> = {
    'razas': 'razas',
    'raciales': 'razas',
    'idiomas': 'razas',
    'clases': 'clases',
    'especiales': 'clases',
    'fusiones del alma': 'clases',
    'chakras': 'clases',
    'dotes': 'dotes',
    'conjuros': 'conjuros',
    'monstruos': 'monstruos',
    'plantillas': 'plantillas',
    'armas': 'armas',
    'armaduras': 'armaduras',
    'munición': 'objetos',
    'materiales especiales': 'objetos',
    'aptitudes de armas y armaduras': 'objetos',
    'objetos': 'objetos',
    'conjuntos de objetos': 'objetos',
    'rasgos': 'rasgos',
    'ventajas': 'ventajas',
    // Las desventajas se listan con las ventajas, pero tienen su propio permiso (hito 8): el de su alta y su edición.
    'desventajas': 'desventajas',
    'tipos de criatura': 'tipos_criatura',
    'subtipos': 'subtipos',
    'deidades': 'deidades',
    'manuales': 'manuales',
};

/** Lo que hace falta de `UserService` para mirar un permiso. */
export interface ConsultaDePermisos {
    can(resource: string, action: string): boolean;
}

/** Si la cuenta puede crear y modificar en el catálogo de ese listado. Un catálogo sin permiso en la tabla, no. */
export function puedeGestionarCatalogo(usuario: ConsultaDePermisos, lista: string): boolean {
    const recurso = RECURSO_DE_CATALOGO[`${lista ?? ''}`.trim()];
    return recurso !== undefined && usuario.can(recurso, 'create');
}

/**
 * El botón «Modificar» de un detalle (`[modificable]` de `<app-ficha-cabecera>`): solo si alguien escucha su salida
 * `modificar` (las pestañas; la creación y la ficha no) y la cuenta puede gestionar el catálogo de ese listado.
 */
export function puedeModificarDesdeDetalle(modificar: { readonly observed: boolean; }, usuario: ConsultaDePermisos, lista: string): boolean {
    return modificar.observed && puedeGestionarCatalogo(usuario, lista);
}
