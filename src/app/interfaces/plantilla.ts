import { Alineamiento } from "./alineamiento";
import { Conjuro } from "./conjuro";
import { DoteContextual } from "./dote-contextual";
import { Maniobrabilidad } from "./maniobrabilidad";
import { Tamano } from "./tamaño";

export interface PlantillaManual {
    Id: number;
    Nombre: string;
    Pagina: number;
}

export interface PlantillaTipoDado {
    Id_tipo_dado: number;
    Nombre: string;
}

export interface PlantillaModificacionRef {
    Id_paso_modificacion: number;
    Nombre: string;
}

export interface PlantillaCaracteristicas {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}

export interface PlantillaLicantroniaDg {
    Id_dado: number;
    Dado: string;
    Multiplicador: number;
    Suma: number;
}

export interface PlantillaPuntosHabilidad {
    Suma: number;
    Suma_fija: number;
}

export interface PlantillaMovimientos {
    Correr: number;
    Nadar: number;
    Volar: number;
    Trepar: number;
    Escalar: number;
}

export interface PlantillaHabilidadRef {
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
    Varios: string;
}

export interface PlantillaSortilega {
    Conjuro: Conjuro;
    Nivel_lanzador: number;
    Usos_diarios: string;
    Dg: number;
}

export interface PlantillaPrerrequisitosFlags {
    actitud_requerido?: boolean;
    actitud_prohibido?: boolean;
    alineamiento_requerido?: boolean;
    caracteristica?: boolean;
    criaturas_compatibles?: boolean;
}

export type PlantillaPrerrequisitoItem = Record<string, any>;

export interface PlantillaPrerrequisitos {
    actitud_requerido: PlantillaPrerrequisitoItem[];
    actitud_prohibido: PlantillaPrerrequisitoItem[];
    alineamiento_requerido: PlantillaPrerrequisitoItem[];
    caracteristica: PlantillaPrerrequisitoItem[];
    criaturas_compatibles: PlantillaPrerrequisitoItem[];
}

export interface PlantillaCompatibilidadTipo {
    Id_tipo_comp: number;
    Id_tipo_nuevo: number;
    Tipo_comp?: string;
    Tipo_nuevo?: string;
    Opcional: number;
}

export interface Plantilla {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: PlantillaManual;
    Tamano: Tamano;
    Tipo_dado: PlantillaTipoDado;
    Actualiza_dg: boolean;
    Modificacion_dg: PlantillaModificacionRef;
    Modificacion_tamano: PlantillaModificacionRef;
    Iniciativa: number;
    Velocidades: string;
    Ca: string;
    Ataque_base: number;
    Presa: number;
    Ataques: string;
    Ataque_completo: string;
    Reduccion_dano: string;
    Resistencia_conjuros: string;
    Resistencia_elemental: string;
    Fortaleza: number;
    Reflejos: number;
    Voluntad: number;
    Modificadores_caracteristicas: PlantillaCaracteristicas;
    Minimos_caracteristicas: PlantillaCaracteristicas;
    Ajuste_nivel: number;
    Licantronia_dg: PlantillaLicantroniaDg;
    Cd: number;
    Puntos_habilidad: PlantillaPuntosHabilidad;
    Nacimiento: boolean;
    Movimientos: PlantillaMovimientos;
    Maniobrabilidad: Maniobrabilidad;
    Alineamiento: Alineamiento;
    Oficial: boolean;
    Dotes: DoteContextual[];
    Habilidades: PlantillaHabilidadRef[];
    Sortilegas: PlantillaSortilega[];
    Prerrequisitos_flags: PlantillaPrerrequisitosFlags;
    Prerrequisitos: PlantillaPrerrequisitos;
    Compatibilidad_tipos: PlantillaCompatibilidadTipo[];
}
