import { Alineamiento } from "./alineamiento";
import { AptitudSortilega } from "./aptitud-sortilega";
import { DoteContextual } from "./dote-contextual";
import { IdiomaDetalle } from "./idioma";
import { Maniobrabilidad } from "./maniobrabilidad";
import { RacialDetalle } from "./racial";
import { SubtipoRef } from "./subtipo";
import { Tamano } from "./tamaño";
import { TipoCriatura } from "./tipo_criatura";

export interface RazaPrerrequisitosFlags {
    actitud_prohibido?: boolean;
    actitud_requerido?: boolean;
    alineamiento_prohibido?: boolean;
    alineamiento_requerido?: boolean;
    tipo_criatura?: boolean;
}

export interface RazaPrerrequisitos {
    actitud_prohibido?: Record<string, any>[];
    actitud_requerido?: Record<string, any>[];
    alineamiento_prohibido?: Record<string, any>[];
    alineamiento_requerido?: Record<string, any>[];
    tipo_criatura?: Record<string, any>[];
}

export interface MutacionRaza {
    Es_mutada?: boolean;
    Tamano_dependiente?: boolean;
    Tiene_prerrequisitos?: boolean;
    Heredada?: boolean;
}

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
    Alineamiento: Alineamiento;
    Oficial: boolean;
    Ataques_naturales: string;
    Tamano: Tamano;
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
    Prerrequisitos: RazaPrerrequisitos;
    Prerrequisitos_flags?: RazaPrerrequisitosFlags;
    Mutacion?: MutacionRaza;
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
    Tipo_criatura: TipoCriatura;
    Subtipos: SubtipoRef[];
    Sortilegas: AptitudSortilega[];
    Raciales: RacialDetalle[];
    DotesContextuales: DoteContextual[];
    Idiomas?: IdiomaDetalle[];
}
