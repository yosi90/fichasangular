import type { UserService } from '../user.service';
import { trasLasNormasDeCreacion } from './normas-creacion';

/** Lo que hace falta de `UserService` para el botón «Nuevo personaje». */
export type ConsultaNuevoPersonaje = Pick<UserService, 'IsLoggedIn' | 'can' | 'entrar' | 'normasDeCreacionPendientes' | 'asegurarNormasDeCreacion'>;

/** Con sesión y sin permiso de crear personajes, el botón sale desactivado (sin sesión, no: lleva a entrar). */
export function nuevoPersonajeDeshabilitado(usuario: Pick<UserService, 'IsLoggedIn' | 'can'>): boolean {
    return usuario.IsLoggedIn && !usuario.can('personajes', 'create');
}

/**
 * «Nuevo personaje», del menú lateral (los dos) o de la pestaña «Personajes»: sin sesión, el acceso de la plataforma;
 * sin permiso, nada; con él, después de las normas de Rol (`trasLasNormasDeCreacion`), [abrir].
 */
export function pedirNuevoPersonaje(usuario: ConsultaNuevoPersonaje, abrir: () => void): void {
    if (!usuario.IsLoggedIn) {
        void usuario.entrar().catch(() => undefined);
        return;
    }
    if (!usuario.can('personajes', 'create'))
        return;
    trasLasNormasDeCreacion(usuario, abrir);
}
