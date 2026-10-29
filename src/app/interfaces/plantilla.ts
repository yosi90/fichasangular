import { PrerrequisitoItem } from "./prerrequisito";
import { Alineamiento } from "./alineamiento";
import { Comodin } from "./comodin";
import { Conjuro } from "./conjuro";
import { DoteContextual } from "./dote-contextual";
import { Maniobrabilidad } from "./maniobrabilidad";
import { RacialDetalle } from "./racial";
import { SubtipoRef } from "./subtipo";
import { Tamano } from "./tamaño";
import { ManualReferencia } from "./manual";

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
    /** El tipo de esos DG (el animal) con sus puntos de habilidad por DG; `null` si la plantilla no lo dice. */
    Tipo_criatura?: { Id: number; Nombre: string; Puntos_habilidad: number; } | null;
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
    /** «elegir» si el extra está por escoger, «cualquiera» si vale cualquiera. */
    Extra_comodin?: Comodin | null;
    Rangos: number;
    Varios: string;
}

export interface PlantillaSortilega {
    Conjuro: Conjuro;
    Nivel_lanzador: number;
    Usos_diarios: string;
    Dg: number;
}

/** Una aptitud racial o un ataque especial que da la plantilla, con los DG desde los que lo da. */
export interface PlantillaRacialContextual {
    Racial: RacialDetalle;
    Dg: number;
}

export interface PlantillaPrerrequisitosFlags {
    actitud_requerido?: boolean;
    actitud_prohibido?: boolean;
    alineamiento_requerido?: boolean;
    caracteristica?: boolean;
    criaturas_compatibles?: boolean;
    /** Nivel de lanzador mínimo, arcano o divino (el liche: 11). Desde la auditoría de las reglas del 2026-10-26. */
    nivel_lanzador?: boolean;
    /** Una dote que debe tener la criatura base (el liche: Fabricar objeto maravilloso). */
    dote?: boolean;
    /** El tamaño mínimo y máximo de la criatura base (las plantillas de los manuales, desde el 2026-10-29). */
    tamano_minimo?: boolean;
    tamano_maximo?: boolean;
    /** Los DG totales mínimos de la criatura base. */
    dg?: boolean;
    /** Un subtipo que tiene que tener y uno que no puede tener. */
    subtipo?: boolean;
    subtipo_prohibido?: boolean;
}

export type PlantillaPrerrequisitoItem = PrerrequisitoItem;

export interface PlantillaPrerrequisitos {
    actitud_requerido: PlantillaPrerrequisitoItem[];
    actitud_prohibido: PlantillaPrerrequisitoItem[];
    alineamiento_requerido: PlantillaPrerrequisitoItem[];
    caracteristica: PlantillaPrerrequisitoItem[];
    criaturas_compatibles: PlantillaPrerrequisitoItem[];
    nivel_lanzador?: PlantillaPrerrequisitoItem[];
    dote?: PlantillaPrerrequisitoItem[];
    /** `{ Id_tamano, Tamano, Opcional, Frase }`: el tamaño de la criatura base, con los pasos de las plantillas ya elegidas. */
    tamano_minimo?: PlantillaPrerrequisitoItem[];
    tamano_maximo?: PlantillaPrerrequisitoItem[];
    /** `{ Cantidad, Opcional, Frase }`: los DG totales (raciales, de clase y de plantilla). */
    dg?: PlantillaPrerrequisitoItem[];
    /** `{ Id_subtipo, Subtipo, Opcional, Frase }`: los subtipos de la raza y de las plantillas ya elegidas. */
    subtipo?: PlantillaPrerrequisitoItem[];
    subtipo_prohibido?: PlantillaPrerrequisitoItem[];
}

export interface PlantillaCompatibilidadTipo {
    Id_tipo_comp: number;
    Id_tipo_nuevo: number;
    Tipo_comp?: string;
    Tipo_nuevo?: string;
    /** «cualquiera»: la criatura conserva su tipo. */
    Tipo_nuevo_comodin?: Comodin | null;
    Opcional: number;
}

export interface Plantilla {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: ManualReferencia;
    Tamano: Tamano;
    Tipo_dado: PlantillaTipoDado;
    /** «elegir»: la plantilla no cambia el dado de golpe (la regla que aplica la web). */
    Tipo_dado_comodin?: Comodin | null;
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
    /** Los DG del animal base de un licántropo; `null` en las demás plantillas, que no añaden DG de animal. */
    Licantronia_dg: PlantillaLicantroniaDg | null;
    Cd: number;
    Puntos_habilidad: PlantillaPuntosHabilidad;
    Nacimiento: boolean;
    Movimientos: PlantillaMovimientos;
    Maniobrabilidad: Maniobrabilidad;
    Alineamiento: Alineamiento;
    /** Lo que dice el manual de la criatura con la plantilla; `null` si no lo da (desde el 2026-10-29). */
    Entorno: string | null;
    Organizacion: string | null;
    /** Valor de desafío: el ajuste («igual que la criatura base +2») o la tabla por DG resumida. */
    Vd: string | null;
    Tesoro: string | null;
    Avance: string | null;
    /** El nombre en inglés de una plantilla de un libro en inglés, traducida por nosotros; `null` si no. */
    Nombre_original: string | null;
    Traducido: boolean;
    Oficial: boolean;
    Dotes: DoteContextual[];
    Subtipos: SubtipoRef[];
    Habilidades: PlantillaHabilidadRef[];
    Sortilegas: PlantillaSortilega[];
    Raciales: PlantillaRacialContextual[];
    Ataques_especiales: PlantillaRacialContextual[];
    Prerrequisitos_flags: PlantillaPrerrequisitosFlags;
    Prerrequisitos: PlantillaPrerrequisitos;
    Compatibilidad_tipos: PlantillaCompatibilidadTipo[];
}
