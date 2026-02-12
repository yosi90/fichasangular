import { Alineamiento } from "./alineamiento";
import { Dote } from "./dote";

export interface ClaseManual {
    Id: number;
    Nombre: string;
    Pagina: number;
}

export interface ClaseTipoDado {
    Id: number;
    Nombre: string;
}

export interface ClasePuntosHabilidad {
    Id: number;
    Valor: number;
}

export interface ClaseConjuroRef {
    Id: number;
    Nombre: string;
    Nivel: number;
    Espontaneo: boolean;
}

export interface ClaseConjurosConfig {
    Dependientes_alineamiento: boolean;
    Divinos: boolean;
    Arcanos: boolean;
    Psionicos: boolean;
    Alma: boolean;
    Conocidos_total: boolean;
    Conocidos_nivel_a_nivel: boolean;
    Dominio: boolean;
    Escuela: boolean;
    Lanzamiento_espontaneo: boolean;
    Clase_origen: {
        Id: number;
        Nombre: string;
    };
    Listado: ClaseConjuroRef[];
}

export interface ClaseRoles {
    Dps: boolean;
    Tanque: boolean;
    Support: boolean;
    Utilidad: boolean;
}

export interface ClaseCompetencias {
    Armas: Record<string, any>[];
    Armaduras: Record<string, any>[];
    Grupos_arma: Record<string, any>[];
    Grupos_armadura: Record<string, any>[];
}

export interface ClaseHabilidades {
    Base: Record<string, any>[];
    Custom: Record<string, any>[];
}

export interface ClaseIdioma {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Secreto: boolean;
    Oficial: boolean;
}

export interface ClaseDoteNivel {
    Dote: Dote;
    Nivel: number;
    Id_extra: number;
    Extra: string;
    Opcional: number;
    Id_interno: number;
    Id_especial_requerido: number;
    Id_dote_requerida: number;
}

export interface ClaseEspecialNivel {
    Especial: Record<string, any>;
    Nivel: number;
    Id_extra: number;
    Extra: string;
    Opcional: number;
    Id_interno: number;
    Id_especial_requerido: number;
    Id_dote_requerida: number;
}

export interface ClaseNivelDetalle {
    Nivel: number;
    Ataque_base: string;
    Salvaciones: {
        Fortaleza: string;
        Reflejos: string;
        Voluntad: string;
    };
    Nivel_max_conjuro: number;
    Reserva_psionica: number;
    Aumentos_clase_lanzadora: {
        Id: number;
        Nombre: string;
    }[];
    Conjuros_diarios: Record<string, number>;
    Conjuros_conocidos_nivel_a_nivel: Record<string, number>;
    Conjuros_conocidos_total: number;
    Dotes: ClaseDoteNivel[];
    Especiales: ClaseEspecialNivel[];
}

export interface ClasePrerrequisitosFlags {
    actitud_requerido?: boolean;
    actitud_prohibido?: boolean;
    alineamiento_requerido?: boolean;
    alineamiento_prohibido?: boolean;
    ataque_base?: boolean;
    caracteristica?: boolean;
    habilidad_clase?: boolean;
    competencia_arma?: boolean;
    competencia_armadura?: boolean;
    competencia_grupo_arma?: boolean;
    competencia_grupo_armadura?: boolean;
    conjuro_conocido?: boolean;
    dg?: boolean;
    dominio?: boolean;
    dote_elegida?: boolean;
    nivel_escuela?: boolean;
    rangos_habilidad?: boolean;
    idioma?: boolean;
    inherente?: boolean;
    lanzador_arcano?: boolean;
    lanzador_divino?: boolean;
    lanzar_conjuros_arcanos_nivel?: boolean;
    lanzar_conjuros_divinos_nivel?: boolean;
    lanzar_poder_psionico_nivel?: boolean;
    no_raza?: boolean;
    conocer_poder_psionico?: boolean;
    raza?: boolean;
    reserva_psionica?: boolean;
    genero?: boolean;
    subtipo?: boolean;
    tamano_maximo?: boolean;
    tamano_minimo?: boolean;
}

export interface ClasePrerrequisitos {
    subtipo: Record<string, any>[];
    caracteristica: Record<string, any>[];
    dg: Record<string, any>[];
    dominio: Record<string, any>[];
    nivel_minimo_escuela: Record<string, any>[];
    ataque_base: Record<string, any>[];
    reserva_psionica_minima: Record<string, any>[];
    lanzar_conjuros_psionicos_nivel: Record<string, any>[];
    poder_psionico_conocido: Record<string, any>[];
    genero: Record<string, any>[];
    competencia_arma: Record<string, any>[];
    competencia_armadura: Record<string, any>[];
    competencia_grupo_arma: Record<string, any>[];
    competencia_grupo_armadura: Record<string, any>[];
    dote: Record<string, any>[];
    habilidad: Record<string, any>[];
    idioma: Record<string, any>[];
    alineamiento_requerido: Record<string, any>[];
    alineamiento_prohibido: Record<string, any>[];
    actitud_requerido: Record<string, any>[];
    actitud_prohibido: Record<string, any>[];
    lanzador_arcano: Record<string, any>[];
    lanzador_divino: Record<string, any>[];
    lanzar_conjuros_arcanos_nivel: Record<string, any>[];
    lanzar_conjuros_divinos_nivel: Record<string, any>[];
    conjuro_conocido: Record<string, any>[];
    inherente: Record<string, any>[];
    clase_especial: Record<string, any>[];
    tamano_maximo: Record<string, any>[];
    tamano_minimo: Record<string, any>[];
    raza: Record<string, any>[];
    no_raza: Record<string, any>[];
}

export interface Clase {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: ClaseManual;
    Tipo_dado: ClaseTipoDado;
    Puntos_habilidad: ClasePuntosHabilidad;
    Nivel_max_claseo: number;
    Mod_salv_conjuros: string;
    Conjuros: ClaseConjurosConfig;
    Roles: ClaseRoles;
    Aumenta_clase_lanzadora: boolean;
    Es_predilecta: boolean;
    Prestigio: boolean;
    Alineamiento: Alineamiento;
    Oficial: boolean;
    Competencias: ClaseCompetencias;
    Habilidades: ClaseHabilidades;
    Idiomas: ClaseIdioma[];
    Desglose_niveles: ClaseNivelDetalle[];
    Prerrequisitos_flags: ClasePrerrequisitosFlags;
    Prerrequisitos: ClasePrerrequisitos;
}
