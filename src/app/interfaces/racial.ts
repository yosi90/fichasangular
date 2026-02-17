import { Conjuro } from "./conjuro";

export interface RacialReferencia {
    id?: number | null;
    nombre: string;
    origen?: string;
}

export interface RacialDoteRef {
    Id_dote: number;
    Dote: string;
    Id_extra: number;
    Extra: string;
}

export interface RacialHabilidades {
    Base: Record<string, any>[];
    Custom: Record<string, any>[];
}

export interface RacialSortilega {
    Conjuro: Conjuro;
    Nivel_lanzador: string;
    Usos_diarios: string;
}

export interface RacialAtaque {
    Descripcion: string;
}

export interface RacialPrerrequisitosFlags {
    raza: boolean;
    caracteristica_minima: boolean;
}

export interface RacialPrerrequisitos {
    raza: Record<string, any>[];
    caracteristica: Record<string, any>[];
}

export interface RacialDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Origen?: string;
    Opcional?: number;
    Dotes: RacialDoteRef[];
    Habilidades: RacialHabilidades;
    Caracteristicas: Record<string, any>[];
    Salvaciones: Record<string, any>[];
    Sortilegas: RacialSortilega[];
    Ataques: RacialAtaque[];
    Prerrequisitos_flags: RacialPrerrequisitosFlags;
    Prerrequisitos: RacialPrerrequisitos;
}
