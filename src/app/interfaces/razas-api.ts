import { Raza } from "./raza";

export interface RazaCreateCore {
    nombre: string;
    descripcion: string;
    ataques_naturales: string;
    espacio: number;
    alcance: number;
    id_manual: number;
    pagina: number;
    id_clase_predilecta: number;
    mod_fue: number;
    mod_des: number;
    mod_cons: number;
    mod_int: number;
    mod_sab: number;
    mod_car: number;
    varios_armadura: number;
    armadura_natural: number;
    correr: number;
    nadar: number;
    volar: number;
    id_maniobrabilidad: number;
    trepar: number;
    excavar: number;
    dotes_extra: number;
    puntos_extra_1: number;
    puntos_extra: number;
    id_tamano: number;
    ajuste_nivel: number;
    reduccion_dano: string;
    resistencia_conjuros: string;
    resistencia_energia: string;
    altura_rango_inf: number;
    altura_rango_sup: number;
    peso_rango_inf: number;
    peso_rango_sup: number;
    edad_adulto: number;
    edad_mediana: number;
    edad_viejo: number;
    edad_venerable: number;
    id_tipo_criatura: number;
    ataque_base: number;
    fortaleza: number;
    reflejos: number;
    voluntad: number;
    dgs_extra: number;
    id_tipo_dado: number;
    id_tipo_criatura_dgs: number;
    dotes_dg: number;
    puntos_hab: number;
    puntos_hab_mult: number;
    mutada: boolean;
    tamano_mutacion_dependiente: boolean;
    id_alineamiento: number;
    oficial: boolean;
    /** Carga como un cuadrúpedo (el centauro). Opcional en la API (por defecto, no). */
    cuadrupedo?: boolean;
    /** El lanzamiento racial: lanza como esa clase de ese nivel (el rakshasa, hechicero 7); sin clase, `null` y 0. */
    id_clase_lanzamiento?: number | null;
    nivel_lanzamiento?: number;
}

export interface RazaCreatePrerequisitoActitud {
    id_actitud: number;
    opcional?: number;
}

export interface RazaCreatePrerequisitoAlineamiento {
    id_alineamiento: number;
    opcional?: number;
}

export interface RazaCreatePrerequisitoTipoCriatura {
    id_tipo_criatura: number;
    opcional?: number;
}

export interface RazaCreatePrerequisitos {
    actitud_requerido?: RazaCreatePrerequisitoActitud[];
    actitud_prohibido?: RazaCreatePrerequisitoActitud[];
    alineamiento_requerido?: RazaCreatePrerequisitoAlineamiento[];
    alineamiento_prohibido?: RazaCreatePrerequisitoAlineamiento[];
    tipo_criatura?: RazaCreatePrerequisitoTipoCriatura[];
}

export interface RazaCreateHabilidadBase {
    id_habilidad: number;
    cantidad: number;
    id_extra?: number;
    varios?: string;
}

export interface RazaCreateHabilidadCustom {
    id_habilidad: number;
    cantidad: number;
}

export interface RazaCreateHabilidades {
    base?: RazaCreateHabilidadBase[];
    custom?: RazaCreateHabilidadCustom[];
}

export interface RazaCreateDote {
    id_dote: number;
    id_extra?: number;
}

export interface RazaCreateRacial {
    id_racial: number;
    opcional?: number;
}

export interface RazaCreateSortilegio {
    id_conjuro: number;
    nivel_lanzador: number;
    usos_diarios: string;
    descripcion: string;
}

export interface RazaCreateCompetencias {
    armas?: number[];
    armaduras?: number[];
    gruposArma?: number[];
    gruposArmadura?: number[];
}

export interface RazaCreateRequest {
    raza: RazaCreateCore;
    prerrequisitos?: RazaCreatePrerequisitos;
    subtipos?: number[];
    idiomas?: number[];
    habilidades?: RazaCreateHabilidades;
    dotes?: RazaCreateDote[];
    raciales?: RazaCreateRacial[];
    sortilegios?: RazaCreateSortilegio[];
    competencias?: RazaCreateCompetencias;
    /** Las listas que lanza además como arcanas con el lanzamiento racial: `{ id_clase }` o `{ id_dominio }`. */
    lanzamiento_listas?: RazaCreateListaLanzamiento[];
}

export type RazaCreateListaLanzamiento = { id_clase: number; } | { id_dominio: number; };

/** `POST /razas/add` y `PUT /razas/{id}`: `{ message, idRaza, raza }`, con la raza como la da su `GET`. */
export interface RazaCreateApiResponse {
    message: string;
    idRaza: number;
    raza?: unknown;
}

export interface RazaCreateResponse {
    message: string;
    idRaza: number;
}

/** La respuesta de `PUT /razas/{id}`, con la raza ya leída. */
export interface RazaActualizadaResponse extends RazaCreateResponse {
    raza: Raza;
}
