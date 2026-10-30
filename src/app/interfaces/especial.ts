import { Comodin } from "./comodin";
import { EsenciaRasgo } from "./incarnum";
import { PrerrequisitoItem } from "./prerrequisito";

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
    /** Las categorías de tamaño que suma para siempre (+1, una más grande, como *agrandar persona*); 0 sin cambio. */
    Tamano_pasos: number;
}

/**
 * Con qué actitud se puede elegir la aptitud (la senda esandy pide bueno): `[{ Id_actitud, Actitud, Opcional, Frase }]`;
 * las alternativas llevan el mismo `Opcional` (> 0).
 */
export interface EspecialPrerrequisitos {
    actitud_requerido: PrerrequisitoItem[];
    actitud_prohibido: PrerrequisitoItem[];
}

/** Una actitud de los prerrequisitos de un especial al guardarlo. */
export interface EspecialPrerrequisitoActitudMutation {
    id_actitud: number;
    opcional: number;
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
    /** «cualquiera» (el extra 13) o «elegir» (el 110). */
    Extra_comodin?: Comodin | null;
    Orden: number;
}

export interface EspecialHabilidadRef {
    Id_habilidad: number;
    Habilidad: string;
    Id_extra: number;
    Extra: string;
    Extra_comodin?: Comodin | null;
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
        /** Opcional: sin él, el alta guarda 0 y la edición conserva el que tenía. */
        tamano_pasos?: number;
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
    /** Opcional: si viene, reemplaza los dos tipos (el que no viene, vacío); sin él, la edición conserva los que tenía. */
    prerrequisitos?: {
        actitud_requerido: EspecialPrerrequisitoActitudMutation[];
        actitud_prohibido: EspecialPrerrequisitoActitudMutation[];
    };
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
    Prerrequisitos: EspecialPrerrequisitos;
    /** Magic of Incarnum: la esencia que da a la reserva y si es receptáculo (`null` si nada). */
    Esencia?: EsenciaRasgo | null;
}
