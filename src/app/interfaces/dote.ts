export interface DoteTipo {
    Id: number;
    Nombre: string;
    Usado: number;
}

export interface DoteManual {
    Id: number;
    Nombre: string;
    Pagina: number;
}

export interface DoteExtraItem {
    Id: number;
    Nombre: string;
}

export interface DoteExtrasSoportados {
    Extra_arma: number;
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

export interface DoteModificadores {
    [key: string]: number;
}

export interface DotePrerrequisitos {
    [key: string]: any[];
}

export interface Dote {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Beneficio: string;
    Normal: string;
    Especial: string;
    Manual: DoteManual;
    Tipos: DoteTipo[];
    Repetible: number;
    Repetible_distinto_extra: number;
    Repetible_comb: number;
    Comp_arma: number;
    Oficial: boolean;
    Extras_soportados: DoteExtrasSoportados;
    Extras_disponibles: DoteExtrasDisponibles;
    Modificadores: DoteModificadores;
    Prerrequisitos: DotePrerrequisitos;
}
