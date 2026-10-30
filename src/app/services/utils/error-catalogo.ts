import { HttpErrorResponse } from '@angular/common/http';
import { ErrorDeApi, leerErrorDeApi, textoParaMostrar } from './error-api';
import { normalizarTexto } from './normalizacion';

/** Lo que se intentaba hacer con el elemento del catálogo. */
export type AccionDeCatalogo = 'crear' | 'actualizar';

/** Cómo se nombra un elemento del catálogo en las frases de error: «la raza», «las razas», «el especial»… */
export interface ElementoDeCatalogo {
    singular: string;
    plural: string;
    femenino: boolean;
}

/**
 * El error de un alta o una edición de catálogo, con una sola frase por caso, igual en todos (propietario, 2026-10-24)
 * y el mensaje de la API (su `error`) detrás, si lo trae y no repite la frase; en un fallo del servidor, con el código de
 * la incidencia. Lo que no es una respuesta HTTP (la sesión, una respuesta sin id) se
 * devuelve tal cual.
 */
export function errorDeCatalogo(error: unknown, accion: AccionDeCatalogo, elemento: ElementoDeCatalogo): Error {
    const { singular, plural, femenino } = elemento;
    if (!(error instanceof HttpErrorResponse))
        return error instanceof Error ? error : new Error(`No se ha podido ${accion} ${femenino ? 'la' : 'el'} ${singular}.`);

    const frase = fraseDeCatalogo(error.status, accion, elemento);
    const leido = leerErrorDeApi(error, frase);
    const repetido = !leido.deLaApi || normalizarTexto(leido.mensaje) === normalizarTexto(frase);
    return new ErrorDeCatalogo(textoParaMostrar({ ...leido, mensaje: repetido ? frase : `${frase} ${leido.mensaje}` }), leido);
}

/**
 * El error de un alta o una edición de catálogo que respondió la API: su frase (`message`) y el `code`, el `field` y el
 * estado de la respuesta, para que el formulario marque el campo que falla (`docs/publica/ERRORES.md`).
 */
export class ErrorDeCatalogo extends Error {
    readonly codigo: string;
    readonly campo: string | null;
    readonly estado: number;

    constructor(mensaje: string, leido: Pick<ErrorDeApi, 'codigo' | 'campo' | 'estado'>) {
        super(mensaje);
        this.name = 'ErrorDeCatalogo';
        this.codigo = leido.codigo;
        this.campo = leido.campo;
        this.estado = leido.estado;
    }
}

function fraseDeCatalogo(status: number, accion: AccionDeCatalogo, { singular, plural, femenino }: ElementoDeCatalogo): string {
    const el = femenino ? 'la' : 'el';
    switch (status) {
        case 400:
            return `Los datos ${femenino ? 'de la' : 'del'} ${singular} no son válidos.`;
        case 401:
            return `Tu sesión no es válida para ${accion} ${plural}.`;
        case 403:
            return `No tienes permisos para ${accion} ${plural}.`;
        case 404:
            return `No se ha encontrado ${el} ${singular} o algo a lo que apunta.`;
        case 409:
            return `Ya existe ${femenino ? 'una' : 'un'} ${singular} con ese nombre.`;
        default:
            return `No se ha podido ${accion} ${el} ${singular}.`;
    }
}
