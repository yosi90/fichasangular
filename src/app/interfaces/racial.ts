import { PrerrequisitoItem } from "./prerrequisito";
import { Conjuro } from "./conjuro";
import { EsenciaRasgo } from "./incarnum";

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
    raza: PrerrequisitoItem[];
    caracteristica: PrerrequisitoItem[];
}

export interface RacialDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Oficial: boolean;
    Origen?: string;
    Opcional?: number;
    Dotes: RacialDoteRef[];
    Habilidades: RacialHabilidades;
    Caracteristicas: Record<string, any>[];
    Salvaciones: Record<string, any>[];
    Sortilegas: RacialSortilega[];
    Ataques: RacialAtaque[];
    /** Magic of Incarnum: la esencia que da a la reserva y si es receptáculo (`null` si nada). */
    Esencia?: EsenciaRasgo | null;
    /** La característica de la CD de la aptitud (10 + ½ DG raciales + su modificador); `null` si no tiene. */
    Caracteristica_cd?: { Id: number; Nombre: string; } | null;
    /** En una raza por edades: su cifra a esa edad («4d10»), si la edad la cambia. */
    Valor?: string | null;
    /** En una raza resuelta a una edad: la categoría en la que se ganó. */
    Categoria_edad?: { Id: number; Nombre: string; } | null;
    /** En la ficha: la CD ya calculada por la API, si tiene `Caracteristica_cd`. */
    Cd?: number | null;
    Prerrequisitos_flags: RacialPrerrequisitosFlags;
    Prerrequisitos: RacialPrerrequisitos;
}
