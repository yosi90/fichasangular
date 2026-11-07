import { Raza, SujetoPrerrequisitoMutacion } from "./raza";
import { ArmaNaturalCreate } from "./arma-natural";

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
    /**
     * Los idiomas adicionales por Inteligencia pueden ser cualquiera no secreto (Manual del jugador, cap. 2: el humano). Con
     * `false`, solo los de `idiomas_adicionales` más los de su clase. Opcional: el alta deja `true` y la edición conserva
     * el que hay. Con `true`, `idiomas_adicionales` va vacía (`400 idiomas_adicionales_con_cualquiera`).
     */
    idiomas_adicionales_cualquiera?: boolean;
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
    id_alineamiento: number;
    oficial: boolean;
    /** Carga como un cuadrúpedo (el centauro). Opcional en la API (por defecto, no). */
    cuadrupedo?: boolean;
    /** El lanzamiento racial: lanza como esa clase de ese nivel (el rakshasa, hechicero 7); sin clase, `null` y 0. */
    id_clase_lanzamiento?: number | null;
    nivel_lanzamiento?: number;
}

/**
 * Un prerrequisito de una raza mutada en el alta y la edición (`prerrequisitos_mutacion[]`, fase 3 de las razas mutadas):
 * la clave de su tipo y lo que pide ese tipo (`GET /razas/mutaciones/modelo`): la referencia de su catálogo, la cantidad
 * o el texto que confirma el máster. `opcional` > 0 forma un grupo «uno de estos».
 */
export interface RazaCreatePrerrequisitoMutacion {
    tipo: string;
    id_referencia?: number;
    cantidad?: number;
    texto?: string;
    opcional?: number;
}

/** Un cambio de una raza mutada sobre su base (`cambios_mutacion[]`): solo donde se aparta de la regla de hoy. */
export interface RazaCreateCambioMutacion {
    campo: string;
    operacion: string;
    /** Los pasos de tamaño (de −8 a 8, no 0). */
    valor?: number;
    /** Los ids que se quitan de la lista de la base o los únicos que se conservan. */
    elementos?: number[];
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
    prerrequisitos_mutacion?: RazaCreatePrerrequisitoMutacion[];
    cambios_mutacion?: RazaCreateCambioMutacion[];
    subtipos?: number[];
    /** Los ids de sus clases asociadas (MM, pág. 294); si no viene, el alta no deja ninguna y la edición conserva las que hay. */
    clases_asociadas?: number[];
    idiomas?: number[];
    /** Los ids de sus idiomas adicionales si no son cualquiera (el enano); si no viene, la edición conserva los que hay. */
    idiomas_adicionales?: number[];
    habilidades?: RazaCreateHabilidades;
    dotes?: RazaCreateDote[];
    raciales?: RazaCreateRacial[];
    sortilegios?: RazaCreateSortilegio[];
    competencias?: RazaCreateCompetencias;
    /** Las armas naturales como dato; si no viene, el alta no deja ninguna y la edición conserva las que hay. */
    armas_naturales?: ArmaNaturalCreate[];
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

/** El estado de una raza base en `GET /razas/{id}/bases`: `con_aviso` si algo no se pudo comprobar (falta un dato). */
export type EstadoBaseRazaMutada = 'elegible' | 'con_aviso';

/** Una raza que puede ser la base de una raza mutada (`BasesDeRazaMutada.Bases[]`). */
export interface BaseRazaMutada {
    Id: number;
    Nombre: string;
    Oficial: boolean;
    Estado: EstadoBaseRazaMutada;
    Avisos: string[];
}

/**
 * Lo que la mutación pide del personaje: `Cumple` es `null` sin comprobar (lo comprueba el alta); `Confirma_master`, una
 * condición que confirma el máster (un rito), que nunca bloquea.
 */
export interface RequisitoDelPersonajeMutacion {
    Frase: string;
    Cumple: boolean | null;
    Confirma_master: boolean;
}

/**
 * `GET /razas/{id}/bases` (`BasesDeRazaMutada`, fase 2 de las razas mutadas): las razas que pueden ser la base de la raza
 * mutada y lo que pide del personaje. La elegibilidad la decide la API (`docs/publica/endpoints/catalogos.md`).
 */
export interface BasesRazaMutada {
    Raza: { Id: number; Nombre: string };
    Bases: BaseRazaMutada[];
    Requisitos_del_personaje: RequisitoDelPersonajeMutacion[];
}

/** Un tipo de prerrequisito de una raza mutada (`GET /razas/mutaciones/modelo`): a quién mira, qué dato y qué pide. */
export interface TipoPrerrequisitoMutacion {
    Clave: string;
    Nombre: string;
    Ejemplo: string;
    Sujeto: SujetoPrerrequisitoMutacion;
    Dato: string;
    Comparador: string;
    /** El catálogo de su referencia (`tipos_criatura`, `subtipos`, `razas`, `tamanos`, `clases` o uno de `Catalogos`). */
    Catalogo: string | null;
    Pide_referencia: boolean;
    Pide_cantidad: boolean;
    Pide_texto: boolean;
}

/** Un campo que combina una raza mutada: su regla de hoy y las operaciones que admite. */
export interface CampoMutacion {
    Campo: string;
    Nombre: string;
    Clase: string;
    Por_defecto: string;
    Operaciones: string[];
    /** El catálogo de los elementos de una lista (para quitar o conservar); `null` si no es una lista con elementos. */
    Catalogo_elementos: string | null;
}

export interface OperacionMutacion {
    Clave: string;
    Nombre: string;
    Descripcion: string;
}

/**
 * `GET /razas/mutaciones/modelo` (fase 3 de las razas mutadas): lo que necesita el formulario para dar de alta una raza
 * mutada. Los tipos y los campos son datos de la API: un tipo nuevo de la base sale aquí sin tocar la web.
 */
export interface ModeloMutacion {
    Tipos_de_prerrequisito: TipoPrerrequisitoMutacion[];
    Campos: CampoMutacion[];
    Operaciones: OperacionMutacion[];
    /** Los catálogos pequeños de las referencias: `momentos`, `actitudes`, `alineamientos_basicos`, `caracteristicas`. */
    Catalogos: Record<string, { Id: number; Nombre: string; }[]>;
}
