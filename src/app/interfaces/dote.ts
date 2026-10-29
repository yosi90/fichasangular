import { PrerrequisitoItem } from './prerrequisito';
import { Comodin } from './comodin';
import { ManualReferencia } from './manual';
import { DoteIncarnum } from './incarnum';

export interface DoteTipo {
    Id: number;
    Nombre: string;
    Usado: number;
}

export interface DoteExtraItem {
    Id: number;
    Nombre: string;
    Es_escudo?: boolean;
    /** Los chakras y las fusiones (Magic of Incarnum) traen el nombre del libro. */
    Nombre_original?: string | null;
    Traducido?: boolean;
}

export interface DoteExtrasSoportados {
    Extra_arma: number;
    Extra_armadura_armaduras?: number;
    Extra_armadura_escudos?: number;
    Extra_armadura: number;
    Extra_escuela: number;
    Extra_habilidad: number;
    /** Se elige un chakra (Magic of Incarnum). */
    Extra_chakra?: number;
    /** Se elige una fusión (Magic of Incarnum). */
    Extra_fusion?: number;
}

export interface DoteExtrasDisponibles {
    Armas: DoteExtraItem[];
    Armaduras: DoteExtraItem[];
    Escuelas: DoteExtraItem[];
    Habilidades: DoteExtraItem[];
    Chakras?: DoteExtraItem[];
    Fusiones?: DoteExtraItem[];
}

/**
 * Por tipo de extra, si la dote lo admite y se elige de todo el catálogo (no lista sus extras de ese tipo, o lista el
 * comodín «Elegir» o «Cualquiera»). La API lo da en `Extras_de_todo_el_catalogo` desde el 2026-10-24.
 */
export interface DoteExtrasDeTodoElCatalogo {
    Armas: boolean;
    Armaduras: boolean;
    Escuelas: boolean;
    Habilidades: boolean;
    Chakras?: boolean;
    Fusiones?: boolean;
}

/** Una habilidad en la que da rangos la dote («Avistar +2»). `Custom`: de `habilidades_custom`. */
export interface DoteHabilidadOtorgada {
    Id_habilidad: number;
    Habilidad: string;
    Id_extra: number | null;
    Extra: string | null;
    Extra_comodin?: Comodin | null;
    Rangos: number;
    Custom: boolean;
}

/**
 * Las armas y grupos de armas con los que la dote da competencia (MJ cap. 5). El arma «Elegir» (`Arma_comodin`
 * «elegir») es la que se elige como extra de la dote (Competencia con arma marcial o exótica).
 */
export interface DoteCompetenciasOtorgadas {
    Armas: { Id: number; Nombre: string; Arma_comodin?: Comodin | null; }[];
    Grupos_arma: { Id: number; Nombre: string; }[];
}

export interface DoteModificadores {
    [key: string]: number;
}

export interface DotePrerrequisitos {
    [key: string]: PrerrequisitoItem[];
}

export interface Dote {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Beneficio: string;
    Normal: string;
    Especial: string;
    Manual: ManualReferencia;
    Tipos: DoteTipo[];
    Repetible: number;
    Repetible_distinto_extra: number;
    Repetible_comb: number;
    Comp_arma: number;
    Oficial: boolean;
    Extras_soportados: DoteExtrasSoportados;
    Extras_disponibles: DoteExtrasDisponibles;
    Extras_de_todo_el_catalogo: DoteExtrasDeTodoElCatalogo;
    Modificadores: DoteModificadores;
    /** La API siempre la da; los borradores de dotes que monta la propia web (creación, ficha) no la llevan. */
    Habilidades_otorgadas?: DoteHabilidadOtorgada[];
    /** La API siempre la da (desde la auditoría de las reglas del 2026-10-26); los borradores de la web, no. */
    Competencias_otorgadas?: DoteCompetenciasOtorgadas;
    /** Magic of Incarnum: la esencia, el receptáculo, la capacidad, el chakra que abre… (`null` si no tiene). */
    Incarnum?: DoteIncarnum | null;
    /** Las dotes a las que sustituye en los prerrequisitos (Dureza azur cuenta como Dureza). */
    Cuenta_como?: { Id: number; Nombre: string; }[];
    /** Bonificadores a una salvación que solo cuentan en un caso (no se suman al total; la API siempre los da). */
    Salvaciones_condicionales?: DoteSalvacionCondicional[];
    Prerrequisitos: DotePrerrequisitos;
}

/** Un bonificador a una salvación con su condición (Cuerpo fortalecido por el incarnum: +4 a Fortaleza contra el daño masivo). */
export interface DoteSalvacionCondicional {
    /** 1 Fortaleza, 2 Reflejos, 3 Voluntad. */
    Id_salvacion: number;
    Salvacion: string;
    Cantidad: number;
    Condicion: string;
}
