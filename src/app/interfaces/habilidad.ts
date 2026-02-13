export interface HabilidadExtraRef {
    Id_extra: number;
    Extra: string;
    Descripcion: string;
}

export interface HabilidadBasicaDetalle {
    Id_habilidad: number;
    Nombre: string;
    Id_caracteristica: number;
    Caracteristica: string;
    Descripcion: string;
    Soporta_extra: boolean;
    Entrenada: boolean;
    Extras: HabilidadExtraRef[];
}

export interface HabilidadBonoVario {
    valor: number;
    origen: string;
}
