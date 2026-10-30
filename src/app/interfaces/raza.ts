import { PrerrequisitoItem } from "./prerrequisito";
import { Alineamiento } from "./alineamiento";
import { Comodin } from "./comodin";
import { AptitudSortilega } from "./aptitud-sortilega";
import { DoteContextual } from "./dote-contextual";
import { IdiomaDetalle } from "./idioma";
import { Maniobrabilidad } from "./maniobrabilidad";
import { RacialDetalle } from "./racial";
import { SubtipoRef } from "./subtipo";
import { Tamano } from "./tamaño";
import { TipoCriatura } from "./tipo_criatura";

/** Las competencias de la raza, con la forma de las de la clase: cada elemento `{ Id, Nombre }`. */
export interface RazaCompetencias {
    Armas: { Id: number; Nombre: string; }[];
    Armaduras: { Id: number; Nombre: string; }[];
    Grupos_arma: { Id: number; Nombre: string; }[];
    Grupos_armadura: { Id: number; Nombre: string; }[];
}

export interface RazaPrerrequisitosFlags {
    actitud_prohibido?: boolean;
    actitud_requerido?: boolean;
    alineamiento_prohibido?: boolean;
    alineamiento_requerido?: boolean;
    tipo_criatura?: boolean;
}

export interface RazaPrerrequisitos {
    actitud_prohibido?: PrerrequisitoItem[];
    actitud_requerido?: PrerrequisitoItem[];
    alineamiento_prohibido?: PrerrequisitoItem[];
    alineamiento_requerido?: PrerrequisitoItem[];
    tipo_criatura?: PrerrequisitoItem[];
}

export interface MutacionRaza {
    Es_mutada?: boolean;
    Tamano_dependiente?: boolean;
    Tiene_prerrequisitos?: boolean;
    Heredada?: boolean;
}

export interface RazaPlantillaReferencia {
    Id: number;
    Nombre: string;
    Descripcion?: string;
}

export interface RazaPlantillasPorSubtipo {
    Subtipo: SubtipoRef;
    Plantillas: RazaPlantillaReferencia[];
}

export interface RazaHabilidadBase {
    Id_habilidad: number;
    Habilidad: string;
    Id_caracteristica: number;
    Caracteristica: string;
    Descripcion?: string;
    Entrenada?: boolean;
    Id_extra?: number;
    Extra?: string;
    /** «elegir»: un extra por escoger (un Saber, una Artesanía). */
    Extra_comodin?: Comodin | null;
    Cantidad: number;
    Varios: string;
    Soporta_extra?: boolean;
    Custom?: boolean;
    Clasea?: boolean;
    Clase?: boolean;
    classSkill?: boolean;
}

export interface RazaHabilidadCustom {
    Id_habilidad: number;
    Habilidad: string;
    Id_caracteristica: number;
    Caracteristica: string;
    Id_extra?: number;
    Extra?: string;
    Extra_comodin?: Comodin | null;
    Cantidad: number;
    Soporta_extra?: boolean;
    Custom?: boolean;
    Clasea?: boolean;
    Clase?: boolean;
    classSkill?: boolean;
}

export interface RazaHabilidades {
    Base: RazaHabilidadBase[];
    Custom: RazaHabilidadCustom[];
}

export interface Raza {
    Id: number;
    Nombre: string;
    /** Cómo es, cómo se comporta y cómo vive (el lore propio de las importadas de los manuales). Vacía si no tiene. */
    Descripcion?: string;
    /** El nombre en inglés de una raza de un libro en inglés que hemos traducido; `null` si no lo tiene. */
    Nombre_original?: string | null;
    /** El nombre es nuestra traducción de un libro en inglés. */
    Traducido?: boolean;
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
    /** Dotes adicionales de la raza en el primer nivel del personaje (el humano: 1). No son las de sus DG raciales. */
    Dotes_adicionales?: number;
    /** Puntos de habilidad extra de la raza en el primer nivel del personaje (el humano: 4). */
    Puntos_habilidad_extra_primer_nivel?: number;
    /** Puntos de habilidad extra de la raza en cada nivel siguiente (el humano: 1). */
    Puntos_habilidad_extra_por_nivel?: number;
    /** Carga como un cuadrúpedo (Manual del jugador, tabla 9-1; el centauro). */
    Cuadrupedo?: boolean;
    /**
     * Si los idiomas adicionales por Inteligencia pueden ser cualquiera no secreto (MJ cap. 2: humano y semielfo). Con
     * `false`, solo los de `Idiomas_adicionales` más los de la clase. Sin dato (borradores antiguos), cualquiera.
     */
    Idiomas_adicionales_cualquiera?: boolean;
    /** La lista de idiomas adicionales de la raza (el enano: gigante, gnomo, infracomún, orco, térraro y trasgo). */
    Idiomas_adicionales?: IdiomaDetalle[];
    /** Las armas, armaduras y grupos con los que la raza da competencia (como `Clase.Competencias`). */
    Competencias?: RazaCompetencias;
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
    Habilidades: RazaHabilidades;
    DotesContextuales: DoteContextual[];
    Idiomas?: IdiomaDetalle[];
    Plantillas_por_subtipo?: RazaPlantillasPorSubtipo[];
}
