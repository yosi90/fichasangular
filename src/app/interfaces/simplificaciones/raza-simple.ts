import { Tamano } from "../tamaño";

export interface RazaSimple {
    Id: number;
    Nombre: string;
    Ajuste_nivel: number;
    Tamano: Tamano;
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
    Altura_rango_inf?: number;
    Altura_rango_sup?: number;
    Peso_rango_inf?: number;
    Peso_rango_sup?: number;
    Edad_adulto?: number;
    Edad_mediana?: number;
    Edad_viejo?: number;
    Edad_venerable?: number;
    Oficial: boolean;
}
