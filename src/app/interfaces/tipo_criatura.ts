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