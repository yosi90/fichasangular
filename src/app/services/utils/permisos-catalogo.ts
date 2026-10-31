import { PermissionResource } from 'src/app/interfaces/user-acl';

/**
 * El permiso de creación del backend (`PermissionResource`) que piden el alta **y la edición** de cada catálogo, por el
 * nombre con el que se abre su listado (`LISTADOS_ROL`). Es la tabla de `docs/publica/CATALOGOS_ALTA_Y_EDICION_FRONT.md`:
 * en Rol no hay un permiso aparte para modificar, así que Insertar y Modificar miran el mismo.
 *
 * Los catálogos del equipo que aún no están en el menú (munición, materiales, aptitudes, objetos y conjuntos) no tienen
 * permiso todavía: se decide en su hito.
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
    'rasgos': 'rasgos',
    'ventajas': 'ventajas',
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
