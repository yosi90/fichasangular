import { AmbitoDetalle } from "./ambito";
import { DominioDetalle } from "./dominio";
import { PabellonDetalle } from "./pabellon";
import { ManualReferencia } from "./manual";

export interface DeidadAlineamientoRef {
    Id: number;
    Id_basico: number;
    Nombre: string;
}

export interface DeidadArmaRef {
    Id: number;
    Nombre: string;
}

export interface DeidadGeneroRef {
    Id: number;
    Nombre: string;
}

export interface DeidadDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: ManualReferencia;
    Alineamiento: DeidadAlineamientoRef;
    Arma: DeidadArmaRef;
    Pabellon: PabellonDetalle;
    Genero: DeidadGeneroRef;
    Ambitos: AmbitoDetalle[];
    Dominios: DominioDetalle[];
    /**
     * Si los tiene, los únicos alineamientos básicos de sus devotos de una clase con `Alineamiento_deidad` (MJ cap. 3:
     * los clérigos de San Cuthbert, LB o LN). Vacío: la regla general (a un paso, neutral solo si la deidad lo es).
     */
    Alineamientos_devotos?: { Id: number; Nombre: string; }[];
    Oficial: boolean;
}


/** Cuerpo de `POST /deidades/add` y `PUT /deidades/<id>` (el mismo; hito 9 del roadmap de inserciones). */
export interface DeidadCuerpo {
    deidad: {
        nombre: string;
        descripcion: string;
        id_manual: number;
        pagina: number;
        /** `null`: «No aplica». */
        id_alineamiento: number | null;
        /** 0 es «Elegir» (la elige quien la venera); `null`, sin arma. */
        id_arma: number | null;
        /** `null`: sin panteón. */
        id_pabellon: number | null;
        id_genero: number;
        oficial: boolean;
    };
    ambitos: number[];
    dominios: number[];
    alineamientos_devotos: number[];
}
