import { Conjuro } from "./conjuro";

export interface AptitudSortilega {
    Conjuro: Conjuro,
    /** Un número o, la de un rasgo, un texto («igual a sus niveles de clase»). */
    Nivel_lanzador: number | string;
    Usos_diarios:  string;
    Descripcion: string;
    Dgs_necesarios: number;
    Origen: string;
}