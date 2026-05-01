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

export interface EspecialClaseMutationCore {
    nombre: string;
    descripcion: string;
    extra: boolean;
    repetible: boolean;
    rep_mismo_extra: boolean;
    rep_comb: boolean;
    act_extra: boolean;
    caracteristica: number;
    id_caracteristica_ca: number;
    bonificadores: {
        fuerza: number;
        destreza: number;
        constitucion: number;
        inteligencia: number;
        sabiduria: number;
        carisma: number;
        ca: number;
        arm_nat: number;
        rd: number;
    };
    flags_extra: {
        no_aplica: boolean;
        da_ca: boolean;
        da_armadura_natural: boolean;
        da_rd: boolean;
        da_velocidad: boolean;
    };
    id_subtipo: number;
    oficial: boolean;
}

export interface EspecialClaseMutationExtra {
    id_extra: number;
    orden: number;
}

export interface EspecialClaseMutationHabilidad {
    id_habilidad: number;
    id_extra: number;
    rangos: number;
}

export interface EspecialClaseMutationRequest {
    especial: EspecialClaseMutationCore;
    extras?: EspecialClaseMutationExtra[];
    habilidades?: EspecialClaseMutationHabilidad[];
}

export interface EspecialClaseMutationApiResponse {
    message?: string;
    idEspecial?: number;
    id_especial?: number;
    especial?: EspecialClaseDetalle;
}

export interface EspecialClaseMutationResponse {
    message: string;
    idEspecial: number;
    especial: EspecialClaseDetalle;
}

export interface EspecialClaseDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Oficial?: boolean;
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
