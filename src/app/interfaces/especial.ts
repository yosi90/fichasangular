export interface EspecialRefSimple {
    Id: number;
    Nombre: string;
}

export interface EspecialBonificadores {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
    CA: number;
    Armadura_natural: number;
    RD: number;
}

export interface EspecialFlagsExtra {
    No_aplica: boolean;
    Da_CA: boolean;
    Da_armadura_natural: boolean;
    Da_RD: boolean;
    Da_velocidad: boolean;
}

export interface EspecialExtraRef {
    Id_extra: number;
    Extra: string;
    Orden: number;
}

export interface EspecialHabilidadRef {
    Id_habilidad: number;
    Habilidad: string;
    Id_extra: number;
    Extra: string;
    Rangos: number;
}

export interface EspecialClaseDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Extra: boolean;
    Repetible: boolean;
    Repite_mismo_extra: boolean;
    Repite_combinacion: boolean;
    Activa_extra: boolean;
    Caracteristica: EspecialRefSimple;
    Bonificadores: EspecialBonificadores;
    Flags_extra: EspecialFlagsExtra;
    Subtipo: EspecialRefSimple;
    Extras: EspecialExtraRef[];
    Habilidades: EspecialHabilidadRef[];
}
