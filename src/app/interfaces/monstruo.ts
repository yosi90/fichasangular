import { Alineamiento } from "./alineamiento";
import { Conjuro } from "./conjuro";
import { DoteManual } from "./dote";
import { DoteContextual } from "./dote-contextual";
import { EspecialClaseDetalle } from "./especial";
import { IdiomaDetalle } from "./idioma";
import { Maniobrabilidad } from "./maniobrabilidad";
import { RacialDetalle } from "./racial";
import { Tamano } from "./tamaño";

export interface MonstruoTipoRef {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Oficial: boolean;
}

export interface MonstruoTipoDadoRef {
    Id: number;
    Nombre: string;
}

export interface MonstruoAlineamientoBasicoRef {
    Id: number;
    Nombre: string;
}

export interface MonstruoAlineamientosRequeridos {
    Familiar: MonstruoAlineamientoBasicoRef[];
    Companero: MonstruoAlineamientoBasicoRef[];
}

export interface MonstruoDadosGolpe {
    Cantidad: string;
    Tipo_dado: MonstruoTipoDadoRef;
    Suma: number;
}

export interface MonstruoMovimientos {
    Correr: number;
    Nadar: number;
    Volar: number;
    Trepar: number;
    Escalar: number;
}

export interface MonstruoDefensa {
    Ca: number;
    Toque: number;
    Desprevenido: number;
    Armadura_natural: number;
    Reduccion_dano: string;
    Resistencia_conjuros: string;
    Resistencia_elemental: string;
}

export interface MonstruoAtaque {
    Ataque_base: number;
    Presa: number;
    Ataques: string;
    Ataque_completo: string;
}

export interface MonstruoSalvaciones {
    Fortaleza: number;
    Reflejos: number;
    Voluntad: number;
}

export interface MonstruoCaracteristicas {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}

export interface MonstruoSortilega {
    Conjuro: Conjuro;
    Nivel_lanzador: number;
    Usos_diarios: string;
}

export interface MonstruoHabilidad {
    Id_habilidad: number;
    Habilidad: string;
    Id_caracteristica: number;
    Caracteristica: string;
    Descripcion: string;
    Soporta_extra: boolean;
    Entrenada: boolean;
    Id_extra: number;
    Extra: string;
    Rangos: number;
}

export interface MonstruoNivelClase {
    Clase: {
        Id: number;
        Nombre: string;
    };
    Nivel: number;
    Plantilla: {
        Id: number;
        Nombre: string;
    };
    Preferencia_legal: {
        Id: number;
        Nombre: string;
    };
    Preferencia_moral: {
        Id: number;
        Nombre: string;
    };
    Dote: {
        Id: number;
        Nombre: string;
    };
}

export interface PersonajeRefMonstruo {
    Id_personaje: number;
    Nombre: string;
}

export interface MonstruoPersonajeRelacionadoPorFamiliar extends PersonajeRefMonstruo {
    Id_familiar: number;
}

export interface MonstruoPersonajeRelacionadoPorCompanero extends PersonajeRefMonstruo {
    Id_companero: number;
}

export interface MonstruoPersonajesRelacionados {
    Por_familiar: MonstruoPersonajeRelacionadoPorFamiliar[];
    Por_companero: MonstruoPersonajeRelacionadoPorCompanero[];
}

export interface MonstruoOrigenRef {
    Id: number;
    Nombre: string;
}

export interface MonstruoSubtipoRef {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface EspecialContextualMonstruo {
    Especial: EspecialClaseDetalle;
    Contexto: Record<string, any>;
}

export interface MonstruoDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: DoteManual;
    Tipo: MonstruoTipoRef;
    Tamano: Tamano;
    Dados_golpe: MonstruoDadosGolpe;
    Movimientos: MonstruoMovimientos;
    Maniobrabilidad: Maniobrabilidad;
    Alineamiento: Alineamiento;
    Iniciativa: number;
    Defensa: MonstruoDefensa;
    Ataque: MonstruoAtaque;
    Espacio: number;
    Alcance: number;
    Salvaciones: MonstruoSalvaciones;
    Caracteristicas: MonstruoCaracteristicas;
    Cd_sortilegas: string;
    Valor_desafio: string;
    Tesoro: string;
    Familiar: boolean;
    Companero: boolean;
    Oficial: boolean;
    Idiomas: IdiomaDetalle[];
    Alineamientos_requeridos: MonstruoAlineamientosRequeridos;
    Sortilegas: MonstruoSortilega[];
    Habilidades: MonstruoHabilidad[];
    Dotes: DoteContextual[];
    Niveles_clase: MonstruoNivelClase[];
    Subtipos: MonstruoSubtipoRef[];
    Raciales: RacialDetalle[];
    Ataques_especiales: RacialDetalle[];
    Familiares: FamiliarMonstruoDetalle[];
    Companeros: CompaneroMonstruoDetalle[];
    Personajes_relacionados: MonstruoPersonajesRelacionados;
}

export interface FamiliarMonstruoDetalle extends MonstruoDetalle {
    Monstruo_origen: MonstruoOrigenRef;
    Id_familiar: number;
    Vida: number;
    Plantilla: {
        Id: number;
        Nombre: string;
    };
    Especiales: EspecialContextualMonstruo[];
    Personajes: PersonajeRefMonstruo[];
}

export interface CompaneroMonstruoDetalle extends MonstruoDetalle {
    Monstruo_origen: MonstruoOrigenRef;
    Id_companero: number;
    Vida: number;
    Dg_adi: number;
    Trucos_adi: number;
    Plantilla: {
        Id: number;
        Nombre: string;
    };
    Especiales: EspecialContextualMonstruo[];
    Personajes: PersonajeRefMonstruo[];
}
