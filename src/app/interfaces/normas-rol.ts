// Las normas propias de Rol en la plataforma (`GET /v1/webs/rol/normas`, ecosistema-kit/MODERACION.md).

/** La clave de Rol en el registro de webs de la plataforma. */
export const CLAVE_WEB_ROL = 'rol';

/** Las normas vigentes de Rol, como las da `GET /v1/webs/rol/normas`. */
export interface NormasDeRol {
    id: number;
    version: number;
    titulo: string;
    texto: string;
    importante: boolean;
    publicadas: string;
}

/** Lo que la ventana necesita: leer las normas y aceptarlas (sin acoplarla al servicio). */
export interface DatosVentanaNormas {
    leer(): Promise<NormasDeRol>;
    aceptar(idVersion: number): Promise<void>;
}

/** Un fallo al leer o aceptar las normas, ya en una frase para la persona. */
export class NormasCreacionError extends Error {
    constructor(message: string, readonly code: string) {
        super(message);
    }
}
