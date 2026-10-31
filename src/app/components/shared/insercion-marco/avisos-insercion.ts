import Swal from 'sweetalert2';
import { mensajeDeError } from 'src/app/services/utils/error-api';

/**
 * Cómo se nombra un elemento del catálogo en los textos de su inserción: «el idioma», «la clase», «los especiales»…
 * Lo usan los avisos de abajo y el modo «Modificar» (`EdicionDeCatalogo`).
 */
export interface NombreDeCatalogo {
    /** En minúscula: «idioma», «clase», «racial». */
    singular: string;
    /** En minúscula: «idiomas», «clases», «raciales». */
    plural: string;
    femenino: boolean;
}

/** «Idioma», «Clase». */
export function nombreConMayuscula(nombre: NombreDeCatalogo): string {
    return nombre.singular.charAt(0).toUpperCase() + nombre.singular.slice(1);
}

/** «del idioma», «de la clase»: lo que completa «perderás los cambios …». */
export function delCatalogo(nombre: NombreDeCatalogo): string {
    return `${nombre.femenino ? 'de la' : 'del'} ${nombre.singular}`;
}

function articulo(nombre: NombreDeCatalogo): string {
    return nombre.femenino ? 'la' : 'el';
}

/** Intentar guardar sin permisos: el mismo aviso en todas las inserciones (el texto es el de `UserService`). */
export function avisarSinPermisos(mensaje: string): Promise<unknown> {
    return Swal.fire({
        icon: 'warning',
        title: 'Permisos insuficientes',
        text: mensaje,
        showConfirmButton: true,
    });
}

/** Tras guardar: «Idioma creado» o «Clase actualizada», con el `message` de la API. */
export function avisarGuardado(nombre: NombreDeCatalogo, editando: boolean, mensaje: string | null | undefined): Promise<unknown> {
    const a = nombre.femenino ? 'a' : 'o';
    return Swal.fire({
        icon: 'success',
        title: `${nombreConMayuscula(nombre)} ${editando ? 'actualizad' : 'cread'}${a}`,
        text: mensaje ?? undefined,
        timer: 1800,
        showConfirmButton: true,
        showCloseButton: true,
        confirmButtonText: 'Cerrar',
    });
}

/**
 * Si falla el alta o la edición: «No se pudo crear el idioma» con el texto del error. Los servicios de catálogo ya lo
 * dan hecho con `errorDeCatalogo` (la frase de siempre y el `error` de la API, leído con `leerErrorDeApi`).
 */
export function avisarErrorAlGuardar(nombre: NombreDeCatalogo, editando: boolean, error: unknown): Promise<unknown> {
    return Swal.fire({
        icon: 'error',
        title: `No se pudo ${editando ? 'actualizar' : 'crear'} ${articulo(nombre)} ${nombre.singular}`,
        text: mensajeDeError(error, 'Error no identificado'),
        showConfirmButton: true,
    });
}

/** Si no se puede traer la entrada que se va a modificar: «No se pudo cargar la clase». */
export function avisarErrorAlCargar(nombre: NombreDeCatalogo, error: unknown): Promise<unknown> {
    return Swal.fire({
        icon: 'error',
        title: `No se pudo cargar ${articulo(nombre)} ${nombre.singular}`,
        text: mensajeDeError(error, 'Error no identificado'),
        showConfirmButton: true,
    });
}
