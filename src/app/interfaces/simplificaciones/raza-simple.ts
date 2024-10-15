import { Tamaño } from "../tamaño";

export interface RazaSimple {
    Id: number;
    Nombre: string;
    Ajuste_nivel: number;
    Tamano: Tamaño;
    Dgs_adicionales: {
        Cantidad: number;
        Dado: string;
        Tipo_criatura: string;
    }
    Manual: string;
    Clase_predilecta: string;
    Modificadores: {
        Fuerza: number;
        Destreza: number;
        Constitucion: number;
        Inteligencia: number;
        Sabiduria: number;
        Carisma: number;
    }
    Homebrew: boolean;
}