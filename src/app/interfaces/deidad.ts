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
    Oficial: boolean;
}

