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
