import { RacialDetalle } from "./racial";

export interface RacialCreateCore {
    nombre: string;
    descripcion?: string;
    oficial: boolean;
    /** La característica de su CD (10 + ½ DG raciales + su modificador); sin ella, no se manda. */
    id_caracteristica_cd?: number;
    /** Si esa CD cuenta todos los DG y no solo los raciales; al modificar, sin él se conserva (el formulario lo manda siempre). */
    cd_dg_totales?: boolean;
}

export interface RacialCreateDote {
    id_dote: number;
    id_extra?: number;
}

export interface RacialCreateHabilidadBase {
    id_habilidad: number;
    rangos: number;
    id_extra?: number;
    se_considera_clasea: boolean;
    /** El caso en que cuenta; sin ella, cuenta siempre. */
    condicion?: string;
}

export interface RacialCreateHabilidadCustom {
    id_habilidad: number;
    rangos: number;
    id_extra?: number;
    se_considera_clasea: boolean;
}

export interface RacialCreateHabilidades {
    base?: RacialCreateHabilidadBase[];
    custom?: RacialCreateHabilidadCustom[];
}

export interface RacialCreateCaracteristica {
    id_caracteristica: number;
    cantidad: number;
}

export interface RacialCreateSalvacion {
    id_salvacion: number;
    cantidad: number;
    /** El caso en que cuenta; sin ella, cuenta siempre. */
    condicion?: string;
}

export interface RacialCreateSortilega {
    id_conjuro: number;
    nivel_lanzador: string;
    usos_diarios: string;
}

export interface RacialCreateAtaque {
    descripcion: string;
}

export interface RacialCreatePrerequisitoRaza {
    id_raza: number;
}

export interface RacialCreatePrerequisitoCaracteristica {
    id_caracteristica: number;
    cantidad: number;
    opcional?: number;
}

export interface RacialCreatePrerequisitos {
    raza?: RacialCreatePrerequisitoRaza[];
    caracteristica?: RacialCreatePrerequisitoCaracteristica[];
}

/** Una fila de `progresion[]`: lo que el rasgo da o cambia desde N DG o nivel N (`RacialProgresion` al leer). */
export interface RacialCreateProgresion {
    medida: 'dg' | 'nivel';
    desde: number;
    id_racial_gana?: number;
    id_racial_sustituye?: number;
    id_tipo_dote?: number;
    velocidad?: { tipo: 'correr' | 'nadar' | 'volar' | 'trepar' | 'excavar'; pies: number; id_maniobrabilidad?: number; };
    valor?: string;
    /** Una elección más del grupo opcional de su raza con ese número (1-99): el segundo sigilo de poder del iluminiano. */
    elige_opcional?: number;
}

/** Una raza o un tipo de criatura como el que cuenta quien tiene el rasgo (`Cuenta_como` al leer): una sola de las dos claves. */
export type RacialCreateCuentaComo = { id_raza: number; } | { id_tipo: number; };

/** Contra qué criatura cuenta un bonificador condicional: una sola de las tres claves. */
export type RacialCreateBonificadorContra = { id_tipo: number; } | { id_subtipo: number; } | { id_raza: number; };

/** Una fila de `bonificadores_condicionales[]` (`RacialBonificadorCondicional` al leer). */
export interface RacialCreateBonificadorCondicional {
    id_objetivo: number;
    id_tipo_bonificador: number;
    cantidad: number;
    condicion: string;
    contra: RacialCreateBonificadorContra[];
}

export interface RacialCreateRequest {
    racial: RacialCreateCore;
    dotes?: RacialCreateDote[];
    habilidades?: RacialCreateHabilidades;
    caracteristicas?: RacialCreateCaracteristica[];
    salvaciones?: RacialCreateSalvacion[];
    sortilegas?: RacialCreateSortilega[];
    ataques?: RacialCreateAtaque[];
    prerrequisitos?: RacialCreatePrerequisitos;
    /** Al modificar, sin ella se conserva la que había; el formulario la manda siempre (`[]`, ninguna). */
    progresion?: RacialCreateProgresion[];
    /** Al modificar, sin ellos se conservan; el formulario los manda siempre (`[]`, ninguno). */
    bonificadores_condicionales?: RacialCreateBonificadorCondicional[];
    /** Al modificar, sin él se conserva; el formulario lo manda siempre (`[]`, ninguno). */
    cuenta_como?: RacialCreateCuentaComo[];
}

export interface RacialCreateApiResponse {
    message: string;
    idRacial: number;
    racial?: RacialDetalle;
}

export interface RacialCreateResponse {
    message: string;
    idRacial: number;
    racial: RacialDetalle;
}

export interface RacialUpdateRequest extends RacialCreateRequest {}

export interface RacialUpdateApiResponse extends RacialCreateApiResponse {}

export interface RacialUpdateResponse extends RacialCreateResponse {}

export interface RacialPrerequisitosPatchRequest {
    prerrequisitos: RacialCreatePrerequisitos;
}

export interface RacialPrerequisitosPatchApiResponse extends RacialCreateApiResponse {}

export interface RacialPrerequisitosPatchResponse extends RacialCreateResponse {}
