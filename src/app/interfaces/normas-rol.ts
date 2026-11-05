// Las normas propias de Rol en la plataforma (`GET /v1/webs/rol/normas`, ecosistema-kit/MODERACION.md).

/** La clave de Rol en el registro de webs de la plataforma. */
export const CLAVE_WEB_ROL = 'rol';

/** Las normas vigentes de Rol, como las da `GET /v1/webs/rol/normas`. */
export interface NormasDeRol {
    id: number;
    version: number;
    titulo: string;
    /** En Markdown. */
    texto: string;
    importante: boolean;
    /** Fecha ISO de su publicación. */
    publicadas: string;
}
