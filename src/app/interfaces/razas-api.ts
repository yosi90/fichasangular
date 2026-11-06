import { Raza } from "./raza";

export interface RazaCreateCore {
    nombre: string;
    descripcion: string;
    ataques_naturales: string;
    espacio: number;
    alcance: number;
    id_manual: number;
    pagina: number;
    /** 0 es «Cualquiera» (la clase de más nivel); `null`, sin clase predilecta («Ninguna»: todas cuentan). */
    id_clase_predilecta: number | null;
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
    /** La edad máxima (tabla 6-5): los dados que se suman a la venerable; con `edad_maxima_caras`, los dos o ninguno. */
    edad_maxima_dados?: number;
    edad_maxima_caras?: number;
    /** La edad inicial (tabla 6-4): los dados de cada grupo de clases que se suman a la mayoría de edad; cada par, los dos o ninguno. */
    edad_inicial_dados_1?: number;
    edad_inicial_caras_1?: number;
    edad_inicial_dados_2?: number;
    edad_inicial_caras_2?: number;
    edad_inicial_dados_3?: number;
    edad_inicial_caras_3?: number;
    /**
     * El VD de un PNJ de la raza (Guía del DM, págs. 37-38; Manual de monstruos, págs. 293-294), todo opcional: si no viene,
     * el alta lo deja sin dato y la edición conserva lo que hay. `vd`, el de la raza con sus DG raciales y sin clases (mayor
     * que 0, hasta 999,99; `null`, sin dato); `vd_mod_clases_pj` y `vd_mod_clases_pnj`, lo que su entrada del MM suma a los
     * niveles con clases de PJ o de PNJ (enteros; `null`, la regla general: 0 y −1).
     */
    vd?: number | null;
    vd_mod_clases_pj?: number | null;
    vd_mod_clases_pnj?: number | null;
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
    /** Lo que suma además solo cuando se cumple `condicion` («+2 bajo tierra»): los dos o ninguno. */
    cantidad_condicional?: number;
    condicion?: string;
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
    /** Los ids de sus clases asociadas (MM, pág. 294); si no viene, el alta no deja ninguna y la edición conserva las que hay. */
    clases_asociadas?: number[];
    idiomas?: number[];
    habilidades?: RazaCreateHabilidades;
    dotes?: RazaCreateDote[];
    raciales?: RazaCreateRacial[];
    sortilegios?: RazaCreateSortilegio[];
    competencias?: RazaCreateCompetencias;
    /** Las listas que lanza además como arcanas con el lanzamiento racial: `{ id_clase }` o `{ id_dominio }`. */
    lanzamiento_listas?: RazaCreateListaLanzamiento[];
    /** Las categorías de edad de una raza por edades, en su orden (vacía en las demás). Desde el hito 3 (2026-10-31). */
    categorias_edad?: RazaCreateCategoriaEdad[];
    /** Los pasos de edad que elige el personaje; los que ya existen llevan su `id` (los personajes apuntan a él). */
    pasos_edad?: RazaCreatePasoEdad[];
}

/** Una categoría de edad de la raza con lo que gana en ella (`docs/publica/endpoints/catalogos.md`, `POST /razas/add`). */
export interface RazaCreateCategoriaEdad {
    id_categoria_edad: number;
    edad_desde: number;
    /** `null`: sin tope (solo la última). */
    edad_hasta: number | null;
    id_tamano: number;
    espacio: number;
    alcance: number;
    dgs: number;
    /** `null`: el manual no da ajuste a esta edad (solo PNJ). */
    ajuste_nivel: number | null;
    vd: number | null;
    /** Las puntuaciones del libro; 0 es «—». */
    fuerza: number;
    destreza: number;
    constitucion: number;
    inteligencia: number;
    sabiduria: number;
    carisma: number;
    armadura_natural: number;
    correr: number;
    nadar: number;
    volar: number;
    trepar: number;
    excavar: number;
    id_maniobrabilidad: number;
    ataques_naturales: string | null;
    reduccion_dano: string | null;
    resistencia_conjuros: string | null;
    resistencia_energia: string | null;
    nivel_lanzamiento: number;
    nivel_lanzador_sortilegas: number;
    raciales: { id_racial: number; valor: string | null; }[];
    sortilegas: { id_conjuro: number; usos_diarios: string; descripcion: string; }[];
}

/** Un paso de edad: con `id`, uno que ya existe y se conserva; sin él, uno nuevo. */
export interface RazaCreatePasoEdad {
    id?: number;
    edad: number;
    id_categoria_edad: number;
    dgs: number;
    ajuste_nivel: number | null;
    armadura_natural: number;
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
