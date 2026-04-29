import { RacialDetalle } from "./racial";

export interface RacialCreateCore {
    nombre: string;
    descripcion?: string;
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
    condicion: string;
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
    condicion: string;
}

export interface RacialCreateSortilega {
    id_conjuro: number;
    nivel_lanzador: number;
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

export interface RacialCreateRequest {
    racial: RacialCreateCore;
    dotes?: RacialCreateDote[];
    habilidades?: RacialCreateHabilidades;
    caracteristicas?: RacialCreateCaracteristica[];
    salvaciones?: RacialCreateSalvacion[];
    sortilegas?: RacialCreateSortilega[];
    ataques?: RacialCreateAtaque[];
    prerrequisitos?: RacialCreatePrerequisitos;
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
