import { ManualReferencia } from './manual';

/*
 * Los trucos y los fines de Trato con animales (`GET /trucos`, caché `Trucos`; contrato: `docs/publica/endpoints/catalogos.md`,
 * «Los trucos»).
 */

export interface TrucoRef {
    Id: number;
    Nombre: string;
}

/** Lo que pide un truco: los trucos (los `Opcional`, un grupo «uno de estos»), las aptitudes de la criatura y sus tipos. */
export interface TrucoRequisitos {
    Trucos: (TrucoRef & { Opcional: boolean; })[];
    Especiales: TrucoRef[];
    Tipos: TrucoRef[];
}

export interface Truco {
    Id: number;
    Nombre: string;
    Nombre_original: string;
    Traducido: boolean;
    Descripcion: string;
    Manual: ManualReferencia;
    /** La CD de Trato con animales para enseñarlo. */
    Cd: number;
    /** Cuántos trucos cuenta (1; Ataca (todas las criaturas), 2). Un fin cuenta lo que suman sus `Trucos`. */
    Coste: number;
    Es_fin: boolean;
    Semanas: number | null;
    Int_minima: number | null;
    /** El truco o el fin al que sustituye (Combate montado → Monta), o `null`. */
    Sustituye: TrucoRef | null;
    Semanas_mejora: number | null;
    Cd_mejora: number | null;
    /** Los trucos de un fin; vacío en un truco suelto. */
    Trucos: TrucoRef[];
    Requisitos: TrucoRequisitos;
    Oficial: boolean;
}
