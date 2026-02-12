import { DoteContextual } from "./dote-contextual";
import { Tamano } from "./tamaño";

export interface Plantilla {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: string;
    Tamano: Tamano;
    Dado_golpe: {
        Id_tipo_dado: number;
        Nombre: string;
    }
    Actualiza_dgs: boolean;
    Modifica_dgs: boolean;
    Ataque_base: number;
    Iniciativa: number;
    Presa: number;
    Velocidades: string;
    Ca: string;
    Ataques: string;
    Ataque_completo: string;
    Reduccion_dano: string;
    Resistencia_conjuros: string;
    Resistencia_energia: string;
    Fortaleza: number;
    Reflejos: number;
    Voluntad: number;
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
    DotesContextuales: DoteContextual[];
}
