import { Comodin } from "./comodin";
import { Rasgo } from "./rasgo";

export interface TipoCriatura {
    Id: number;
    Nombre: string;
    /** «cualquiera» en el tipo 0: un listado de consulta lo esconde. */
    Comodin?: Comodin | null;
    Descripcion: string;
    Manual: string;
    Id_tipo_dado: number;
    Tipo_dado: number;
    Id_ataque: number;
    Id_fortaleza: number;
    Id_reflejos: number;
    Id_voluntad: number;
    Id_puntos_habilidad: number;
    /** Puntos de habilidad por DG del tipo (2, 4, 6 u 8). */
    Puntos_habilidad?: number;
    Come: boolean;
    Respira: boolean;
    Duerme: boolean;
    Recibe_criticos: boolean;
    Puede_ser_flanqueado: boolean;
    Pierde_constitucion: boolean;
    Limite_inteligencia: number;
    Tesoro: string;
    Id_alineamiento: number;
    Rasgos: Rasgo[];
    Oficial: boolean;
}

/**
 * Un tipo de criatura leído de la API (`GET /tiposCriatura/<id>` y la respuesta del alta y la edición): el de la caché,
 * más el id del manual y la página (`im`, `pg`), que necesita «Modificar tipo de criatura».
 */
export interface TipoCriaturaEditable extends TipoCriatura {
    Id_manual: number;
    Pagina: number;
}

/** Cuerpo de `POST /tiposCriatura/add` y `PUT /tiposCriatura/<id>` (el mismo; hito 9 del roadmap de inserciones). */
export interface TipoCriaturaCuerpo {
    tipo: {
        nombre: string;
        descripcion: string;
        id_manual: number;
        pagina: number;
        id_tipo_dado: number;
        id_ataque: number;
        id_fortaleza: number;
        id_reflejos: number;
        id_voluntad: number;
        id_puntos_habilidad: number;
        come: boolean;
        respira: boolean;
        duerme: boolean;
        criticos: boolean;
        flanqueado: boolean;
        pierde_cons: boolean;
        limite_inteligencia: number;
        /** `null`: sin tesoro propio (la API guarda el texto de relleno). */
        tesoro: string | null;
        id_alineamiento: number;
        oficial: boolean;
    };
    rasgos: number[];
}
