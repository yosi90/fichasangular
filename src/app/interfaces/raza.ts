import { Maniobrabilidad } from "./maniobrabilidad";
import { Tamaño } from "./tamaño";
import { Tipo_criatura } from "./tipo_criatura";

export interface Raza {
    Id: number;
    Nombre: string;
    Ajuste_nivel: number;
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
    Ataques_naturales: string;
    Tamano: Tamaño;
    Dgs_adicionales: {
        Cantidad: number;
        Dado: string;
        Tipo_criatura: string;
        Ataque_base: number;
        Dotes_extra: number;
        Puntos_habilidad: number;
        Multiplicador_puntos_habilidad: number;
        Fortaleza: number;
        Reflejos: number;
        Voluntad: number;
    }
    Reduccion_dano: string;
    Resistencia_magica: string;
    Resistencia_energia: string;
    Heredada: boolean;
    Mutada: boolean;
    Tamano_mutacion_dependiente: boolean;
    Prerrequisitos: [];
    Armadura_natural: number;
    Varios_armadura: number;
    Correr: number;
    Nadar: number;
    Volar: number;
    Maniobrabilidad: Maniobrabilidad;
    Trepar: number;
    Escalar: number;
    Altura_rango_inf: number; 
    Altura_rango_sup: number; 
    Peso_rango_inf: number; 
    Peso_rango_sup: number; 
    Edad_adulto: number; 
    Edad_mediana: number; 
    Edad_viejo: number; 
    Edad_venerable: number;
    Espacio: number;
    Alcance: number;
    Tipo_criatura: Tipo_criatura;
}
