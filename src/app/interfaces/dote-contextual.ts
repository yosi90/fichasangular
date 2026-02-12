import { Dote } from "./dote";

export interface DoteLegacy {
    Nombre: string;
    Descripcion: string;
    Beneficio: string;
    Pagina: number;
    Extra: string;
    Origen: string;
}

interface DoteContextoBase {
    Entidad: "personaje" | "raza" | "plantilla";
    Extra: string;
    Id_extra: number;
}

export interface DoteContextoPersonaje extends DoteContextoBase {
    Entidad: "personaje";
    Id_personaje: number;
    Origen?: string;
}

export interface DoteContextoRaza extends DoteContextoBase {
    Entidad: "raza";
    Id_raza: number;
}

export interface DoteContextoPlantilla extends DoteContextoBase {
    Entidad: "plantilla";
    Id_plantilla: number;
    Dg?: number;
}

export type DoteContexto = DoteContextoPersonaje | DoteContextoRaza | DoteContextoPlantilla;

export interface DoteContextual {
    Dote: Dote;
    Contexto: DoteContexto;
}
