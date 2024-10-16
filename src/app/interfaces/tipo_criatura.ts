import { Rasgos } from "./rasgos";

export interface Tipo_criatura {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: string;
    Id_tipo_dado: number;
    Tipo_dado: number;
    Id_ataque: number;
    Id_fortaleza: number;
    Id_reflejos: number;
    Id_voluntad: number;
    Id_puntos_habilidad: number;
    Come: number;
    Respira: number;
    Duerme: number;
    Recibe_críticos: number;
    Puede_ser_flanqueado: number;
    Pierde_constitucion: number;
    Limite_inteligencia: number;
    Tesoro: string;
    Id_alineamiento: number;
    Rasgos: Rasgos[];
}