import { PrerrequisitoAptitudEspecial, PrerrequisitoItem } from "./prerrequisito";
import { Alineamiento } from "./alineamiento";
import { Comodin } from "./comodin";
import { Dote } from "./dote";
import { ManualReferencia } from "./manual";
import { ClaseHabilidadPorAlineamiento, ClaseMoldeado } from "./incarnum";

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

/** Un conjuro de la lista de la clase que solo tiene quien tiene una de sus aptitudes (y ese extra; `null`, con cualquiera). */
export interface ClaseConjuroEspecialRef extends ClaseConjuroRef {
    Especial: { Id: number; Nombre: string; };
    Extra: { Id: number; Nombre: string; } | null;
}

/** Un nivel de conjuro cuyos espacios solo tiene quien tiene la aptitud o la dote (una de las dos; varias filas son alternativas). */
export interface ClaseNivelConjuroRequisito {
    Nivel: number;
    Especial: { Id: number; Nombre: string; } | null;
    Dote: { Id: number; Nombre: string; } | null;
}

/** La escuela de la que la clase es siempre especialista (`{ Id, Nombre, Nombre_esp }`). */
export interface ClaseEscuelaEspecialista {
    Id: number;
    Nombre: string;
    Nombre_esp: string;
}

/** El libro de conjuros de la clase (MJ cap. 3, Mago): con cuántos empieza y cuántos gana por nivel de lanzador. */
export interface ClaseLibroConjuros {
    Nivel_cero_completo: boolean;
    Iniciales: number;
    Iniciales_suman_caracteristica: boolean;
    Por_nivel: number;
}

/** Un aumento de lanzador de una clase de prestigio, con los tipos de magia de la clase que puede subir (GDM cap. 6). */
export interface ClaseAumentoLanzador {
    Id: number;
    Nombre: string;
    Arcanos?: boolean;
    Divinos?: boolean;
    Psionicos?: boolean;
}

export interface ClaseConjurosConfig {
    Dependientes_alineamiento: boolean;
    Divinos: boolean;
    Arcanos: boolean;
    Psionicos: boolean;
    Conocidos_total: boolean;
    Conocidos_nivel_a_nivel: boolean;
    Dominio: boolean;
    /** Cuántos dominios elige en su primer nivel (el clérigo, 2). */
    Dominio_cantidad?: number;
    puede_elegir_especialidad: boolean;
    Lanzamiento_espontaneo: boolean;
    /** `null` si la clase no tiene libro de conjuros. */
    Libro?: ClaseLibroConjuros | null;
    /** 1: su nivel de lanzador son sus niveles con conjuros; 2: la mitad de su nivel (paladín, explorador). */
    Nivel_lanzador_divisor?: number;
    Clase_origen: {
        Id: number;
        Nombre: string;
    };
    Listado: ClaseConjuroRef[];
    /** La escuela de la que la clase es siempre especialista (no la elige); `null` si no tiene. */
    Escuela_especialista?: ClaseEscuelaEspecialista | null;
    /** Los conjuros de su lista que solo da una de sus aptitudes: se suman a `Listado` si el personaje la tiene. */
    Listado_por_especial?: ClaseConjuroEspecialRef[];
    /** Los niveles de conjuro que piden una aptitud o una dote. */
    Niveles_con_requisito?: ClaseNivelConjuroRequisito[];
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
    /** Las que son de clase solo con ese alineamiento básico (el nacido del alma; Magic of Incarnum). */
    Por_alineamiento?: ClaseHabilidadPorAlineamiento[];
}

export interface ClaseHabilidadMutationRef {
    Id_habilidad?: number;
    id_habilidad?: number;
    Id_extra?: number;
    id_extra?: number;
    Extra?: string;
    Habilidad?: string;
    Varios?: string;
    varios?: string;
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
    /** `null` sin extra (la API ya no manda el extra de relleno «No aplica»). */
    Id_extra: number | null;
    Extra: string;
    Extra_comodin?: Comodin | null;
    Opcional: number;
    Id_interno: number;
    Id_especial_requerido: number;
    Id_dote_requerida: number;
}

export interface ClaseEspecialNivel {
    Especial: Record<string, any>;
    Nivel: number;
    /** `null` sin extra (la API ya no manda el extra de relleno «No aplica»). */
    Id_extra: number | null;
    Extra: string;
    Extra_comodin?: Comodin | null;
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
    Nivel_max_poder_accesible_nivel_lanzadorPsionico: number;
    Reserva_psionica: number;
    Aumentos_clase_lanzadora: ClaseAumentoLanzador[];
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
    aptitud_especial?: boolean;
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
    esencia_minima?: boolean;
    sin_esencia?: boolean;
    nivel_moldeador?: boolean;
    fusiones_minimas?: boolean;
    vinculo_chakra?: boolean;
    vinculos_minimos?: boolean;
    sin_lanzador_arcano?: boolean;
}

export interface ClasePrerrequisitos {
    subtipo: PrerrequisitoItem[];
    caracteristica: PrerrequisitoItem[];
    dg: PrerrequisitoItem[];
    dominio: PrerrequisitoItem[];
    nivel_escuela: PrerrequisitoItem[];
    ataque_base: PrerrequisitoItem[];
    reserva_psionica: PrerrequisitoItem[];
    lanzar_poder_psionico_nivel: PrerrequisitoItem[];
    conocer_poder_psionico: PrerrequisitoItem[];
    genero: PrerrequisitoItem[];
    competencia_arma: PrerrequisitoItem[];
    competencia_armadura: PrerrequisitoItem[];
    competencia_grupo_arma: PrerrequisitoItem[];
    competencia_grupo_armadura: PrerrequisitoItem[];
    dote_elegida: PrerrequisitoItem[];
    rangos_habilidad: PrerrequisitoItem[];
    idioma: PrerrequisitoItem[];
    alineamiento_requerido: PrerrequisitoItem[];
    alineamiento_prohibido: PrerrequisitoItem[];
    actitud_requerido: PrerrequisitoItem[];
    actitud_prohibido: PrerrequisitoItem[];
    lanzador_arcano: PrerrequisitoItem[];
    lanzador_divino: PrerrequisitoItem[];
    lanzar_conjuros_arcanos_nivel: PrerrequisitoItem[];
    lanzar_conjuros_divinos_nivel: PrerrequisitoItem[];
    conjuro_conocido: PrerrequisitoItem[];
    aptitud_especial: PrerrequisitoAptitudEspecial[];
    clase_especial: PrerrequisitoItem[];
    tamano_maximo: PrerrequisitoItem[];
    tamano_minimo: PrerrequisitoItem[];
    raza: PrerrequisitoItem[];
    no_raza: PrerrequisitoItem[];
    /** Magic of Incarnum (el mapper de la clase siempre los pone; los borradores de la web pueden no traerlos). */
    esencia_minima?: PrerrequisitoItem[];
    sin_esencia?: PrerrequisitoItem[];
    nivel_moldeador?: PrerrequisitoItem[];
    fusiones_minimas?: PrerrequisitoItem[];
    vinculo_chakra?: PrerrequisitoItem[];
    vinculos_minimos?: PrerrequisitoItem[];
    sin_lanzador_arcano?: PrerrequisitoItem[];
}

export interface Clase {
    Id: number;
    Nombre: string;
    /** «cualquiera» en la clase 0: un listado de consulta la esconde. */
    Comodin?: Comodin | null;
    Descripcion: string;
    Manual: ManualReferencia;
    Tipo_dado: ClaseTipoDado;
    Puntos_habilidad: ClasePuntosHabilidad;
    Ataque_base?: ClaseProgresionBaseMutationRef;
    Salvaciones?: {
        Fortaleza?: ClaseProgresionBaseMutationRef;
        Reflejos?: ClaseProgresionBaseMutationRef;
        Voluntad?: ClaseProgresionBaseMutationRef;
    };
    Nivel_max_claseo: number;
    Mod_salv_conjuros: string;
    Conjuros: ClaseConjurosConfig;
    Roles: ClaseRoles;
    Aumenta_clase_lanzadora: boolean;
    Es_predilecta: boolean;
    Prestigio: boolean;
    Tiene_prerrequisitos: boolean;
    /** MJ cap. 3, monje y paladín: tras ganar un nivel de otra clase no puede volver a subir esta. */
    Multiclase_restringida?: boolean;
    /** MJ cap. 3, clérigo: su alineamiento, a un paso del de su deidad, y neutral solo si ella lo es. */
    Alineamiento_deidad?: boolean;
    Alineamiento: Alineamiento;
    Oficial: boolean;
    Competencias: ClaseCompetencias;
    Habilidades: ClaseHabilidades;
    Idiomas: ClaseIdioma[];
    /** Los que la clase añade a la lista de idiomas adicionales de la raza (MJ cap. 2: clérigo, druida y mago). */
    Idiomas_adicionales?: Omit<ClaseIdioma, 'Descripcion'>[];
    Desglose_niveles: ClaseNivelDetalle[];
    /** Magic of Incarnum: lo que dice que la clase moldea fusiones; `null` si no (la API siempre lo da). */
    Moldeado?: ClaseMoldeado | null;
    Prerrequisitos_flags: ClasePrerrequisitosFlags;
    Prerrequisitos: ClasePrerrequisitos;
}

export interface ClaseProgresionBaseMutationRef {
    Id: number;
    Nombre?: string;
    Valores?: string[];
}

/** Un nivel en el cuerpo de escritura: el poder máximo va con la clave con la que lo lee la API (en minúscula). */
export interface ClaseNivelMutation extends Omit<ClaseNivelDetalle, 'Nivel_max_poder_accesible_nivel_lanzadorPsionico'> {
    nivel_max_poder_accesible_nivel_lanzadorPsionico: number;
}

export interface ClaseMutationRequest extends Omit<Clase, 'Id' | 'Desglose_niveles' | 'Conjuros'> {
    Id?: number;
    /** `Clase_origen` `null`: sin clase de origen. */
    Conjuros: Omit<ClaseConjurosConfig, 'Clase_origen'> & { Clase_origen: { Id: number; Nombre: string; } | null; };
    Desglose_niveles: ClaseNivelMutation[];
    Ataque_base: ClaseProgresionBaseMutationRef;
    Salvaciones: {
        Fortaleza: ClaseProgresionBaseMutationRef;
        Reflejos: ClaseProgresionBaseMutationRef;
        Voluntad: ClaseProgresionBaseMutationRef;
    };
}

export interface ClaseMutationApiResponse {
    message?: string;
    idClase?: number;
    id_clase?: number;
    clase?: Clase;
}

export interface ClaseMutationResponse {
    message: string;
    idClase: number;
    clase: Clase;
}

export interface ClasePrerequisitosUpdateRequest {
    Prerrequisitos: ClasePrerrequisitos | Record<string, Record<string, any>[]>;
}

export interface ClaseProgressionCatalogItem {
    Id: number;
    Nombre: string;
    Valores: string[];
}

export interface ClasePuntosHabilidadCatalogItem {
    Id: number;
    Valor: number;
}

export interface ClaseAumentoClaseLanzadoraCatalogItem {
    Id: number;
    Nombre: string;
}

export interface ClaseProgressionCatalogs {
    ataques_base: ClaseProgressionCatalogItem[];
    salvaciones: ClaseProgressionCatalogItem[];
    puntos_habilidad: ClasePuntosHabilidadCatalogItem[];
    aumentos_clase_lanzadora: ClaseAumentoClaseLanzadoraCatalogItem[];
}
