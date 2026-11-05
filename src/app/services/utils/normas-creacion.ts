import type { UserService } from '../user.service';

/** Lo que hace falta de `UserService` para pedir las normas de Rol antes de crear. */
export type ConsultaNormasCreacion = Pick<UserService, 'normasDeCreacionPendientes' | 'asegurarNormasDeCreacion'>;

/**
 * Para los botones de crear, insertar o modificar (decisión 5 de la ronda de mejoras de noviembre): sin normas de Rol
 * pendientes, la acción va al momento; si faltan, se abre su ventana (`asegurarNormasDeCreacion`) y la acción solo sigue
 * si se aceptan. Con «Ahora no», no pasa nada.
 */
export function trasLasNormasDeCreacion(usuario: ConsultaNormasCreacion, accion: () => void): void {
    if (!usuario.normasDeCreacionPendientes) {
        accion();
        return;
    }
    void usuario.asegurarNormasDeCreacion().then((aceptadas) => {
        if (aceptadas)
            accion();
    });
}

/**
 * La misma regla para quien ya espera la respuesta (guardar la creación, crear o cambiar una campaña): `true` si puede
 * seguir, porque no le faltan las normas de Rol o porque las acaba de aceptar en su ventana.
 */
export async function normasDeCreacionAceptadas(usuario: ConsultaNormasCreacion): Promise<boolean> {
    return !usuario.normasDeCreacionPendientes || await usuario.asegurarNormasDeCreacion();
}
