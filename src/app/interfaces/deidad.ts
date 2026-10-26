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

