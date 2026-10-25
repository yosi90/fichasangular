import { PrerrequisitoItem } from './prerrequisito';
import { ManualReferencia } from './manual';

export interface DoteTipo {
    Id: number;
    Nombre: string;
    Usado: number;
}

export interface DoteExtraItem {
    Id: number;
    Nombre: string;
    Es_escudo?: boolean;
}

export interface DoteExtrasSoportados {
    Extra_arma: number;
    Extra_armadura_armaduras?: number;
    Extra_armadura_escudos?: number;
    Extra_armadura: number;
    Extra_escuela: number;
    Extra_habilidad: number;
}

export interface DoteExtrasDisponibles {
    Armas: DoteExtraItem[];
    Armaduras: DoteExtraItem[];
    Escuelas: DoteExtraItem[];
    Habilidades: DoteExtraItem[];
}

/**
 * Por tipo de extra, si la dote lo admite y se elige de todo el catálogo (no lista sus extras de ese tipo, o lista el
 * comodín «Elegir» o «Cualquiera»). La API lo da en `Extras_de_todo_el_catalogo` desde el 2026-10-24.
 */
export interface DoteExtrasDeTodoElCatalogo {
    Armas: boolean;
    Armaduras: boolean;
    Escuelas: boolean;
    Habilidades: boolean;
}

export interface DoteModificadores {
    [key: string]: number;
}

export interface DotePrerrequisitos {
    [key: string]: PrerrequisitoItem[];
}

export interface Dote {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Beneficio: string;
    Normal: string;
    Especial: string;
    Manual: ManualReferencia;
    Tipos: DoteTipo[];
    Repetible: number;
    Repetible_distinto_extra: number;
    Repetible_comb: number;
    Comp_arma: number;
    Oficial: boolean;
    Extras_soportados: DoteExtrasSoportados;
    Extras_disponibles: DoteExtrasDisponibles;
    Extras_de_todo_el_catalogo: DoteExtrasDeTodoElCatalogo;
    Modificadores: DoteModificadores;
    Prerrequisitos: DotePrerrequisitos;
}
