import { DatoPreferenciaAlineamiento } from 'src/app/services/utils/alineamiento-contrato';
import { Alineamiento } from "./alineamiento";
import { ArmaNatural } from "./arma-natural";
import { Caracteristica } from "./caracteristica";
import { Conjuro } from "./conjuro";
import { ManualReferencia } from "./manual";
import { DoteContextual } from "./dote-contextual";
import { EspecialClaseDetalle } from "./especial";
import { Id_nombre } from "./genericas";
import { IdiomaDetalle } from "./idioma";
import { Maniobrabilidad } from "./maniobrabilidad";
import { Movimientos } from "./movimientos";
import { RacialDetalle } from "./racial";
import { Tamano } from "./tamaño";
import type { TipoDeMascota } from "./sesiones";

export interface MonstruoTipoRef {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Oficial: boolean;
}

export interface MonstruoTipoDadoRef {
    Id: number;
    Nombre: string;
}

export interface MonstruoAlineamientoBasicoRef {
    Id: number;
    Nombre: string;
}

export interface MonstruoAlineamientosRequeridos {
    Familiar: MonstruoAlineamientoBasicoRef[];
    Companero: MonstruoAlineamientoBasicoRef[];
}

export interface MonstruoDadosGolpe {
    Cantidad: string;
    Tipo_dado: MonstruoTipoDadoRef;
    Suma: number;
}

export interface MonstruoDefensa {
    Ca: number;
    Toque: number;
    Desprevenido: number;
    Armadura_natural: number;
    Reduccion_dano: string;
    Resistencia_conjuros: string;
    Resistencia_elemental: string;
}

export interface MonstruoAtaque {
    Ataque_base: number;
    /** `null`: sin presa («Presa —» del bloque: incorpóreos, plagas y criaturas sin Fuerza; API 1.1.0). */
    Presa: number | null;
    Ataques: string;
    Ataque_completo: string;
}

export interface MonstruoSalvaciones {
    Fortaleza: number;
    Reflejos: number;
    Voluntad: number;
}

/**
 * Cada característica y su modificador, hecho por la API (`<Característica>_modificador`). Una característica sin valor
 * (el «—» del manual: la Constitución de un constructo, la Inteligencia de una sabandija) llega con los dos a `null`.
 * Contrato: `docs/publica/MODIFICADORES_MONSTRUOS_FRONT.md`.
 */
export type MonstruoCaracteristicas = Record<Caracteristica | `${Caracteristica}_modificador`, number | null>;

export interface MonstruoSortilega {
    Conjuro: Conjuro;
    Nivel_lanzador: number;
    Usos_diarios: string;
}

export interface MonstruoHabilidad {
    Id_habilidad: number;
    Habilidad: string;
    Id_caracteristica: number;
    Caracteristica: string;
    Descripcion: string;
    Soporta_extra: boolean;
    Entrenada: boolean;
    Id_extra: number;
    Extra: string;
    Rangos: number;
}

export interface MonstruoNivelClase {
    Clase: {
        Id: number;
        Nombre: string;
    };
    /** El nivel efectivo mínimo de la mascota en la lista de esa clase (el del compañero, nivel efectivo de druida). */
    Nivel: number;
    /**
     * Lo que la lista suma al nivel efectivo para la tabla del compañero (`GET /companeros/progresion`): 0 o menos (las
     * alternativas de 4.º, −3; el animal celestial de Compañero elevado, −1), salvo en una fila con `Especial`, que puede
     * sumar (los excavadores del explorador gnomo, +3). En el familiar, 0.
     */
    Ajuste: number;
    /**
     * El ataque base que tiene que tener el personaje para elegir la mascota de esta fila, además del `Nivel` (la lista del
     * familiar mejorado de *El combatiente completo*, pág. 99: +3, +5 y +7); `null`, sin mínimo. Desde el 2026-11-21
     * (cachés `Monstruos` 17, `Familiares` y `Compañeros animales` 14).
     */
    Ataque_base_minimo: number | null;
    Plantilla: {
        Id: number;
        Nombre: string;
    };
    /** Con `Valor`, `Prohibe` e `Id_prioridad` si la API los da (las preferencias como dato). */
    Preferencia_legal: {
        Id: number;
        Nombre: string;
    } & DatoPreferenciaAlineamiento;
    Preferencia_moral: {
        Id: number;
        Nombre: string;
    } & DatoPreferenciaAlineamiento;
    /** La Inteligencia que da la fila a la criatura (F21: Compañero sabandija, 1); `null` o sin ella, la de su monstruo. */
    Inteligencia?: number | null;
    /** Que sus DG adicionales no le dan habilidades ni dotes (F21). */
    Sin_habilidades_dotes?: boolean;
    Dote: {
        Id: number;
        Nombre: string;
    };
    /**
     * De qué mascota es la fila (`companero` o `familiar`: la que da su clase; el animal celestial de Compañero elevado, de
     * compañero); `null` si su clase no da ninguna. Desde el 2026-11-21 (cachés `Monstruos` 16, `Familiares` y `Compañeros
     * animales` 13).
     */
    /** De qué mascota es la fila: la que da su clase (contrato, `MonstruoNivelClase.Mascota`). */
    Mascota: TipoDeMascota | null;
    /**
     * La aptitud que abre la fila (desde el 2026-11-26, cachés `Monstruos` 21, `Familiares` y `Compañeros animales` 18; R8,
     * tanda 1b): solo vale si el personaje la tiene, de la tabla de su clase o de un nivel de sustitución suyo (el sabueso
     * élfico del explorador elfo). Su `Ajuste` puede ser positivo (los excavadores del explorador gnomo, +3). `null`,
     * ninguna. El alta y la edición del monstruo no la escriben ni la borran (`niveles_clase`).
     */
    Especial: { Id: number; Nombre: string; } | null;
}

export interface PersonajeRefMonstruo {
    Id_personaje: number;
    Nombre: string;
}

export interface MonstruoPersonajeRelacionadoPorFamiliar extends PersonajeRefMonstruo {
    Id_familiar: number;
}

export interface MonstruoPersonajeRelacionadoPorCompanero extends PersonajeRefMonstruo {
    Id_companero: number;
}

export interface MonstruoPersonajesRelacionados {
    Por_familiar: MonstruoPersonajeRelacionadoPorFamiliar[];
    Por_companero: MonstruoPersonajeRelacionadoPorCompanero[];
}

export interface MonstruoOrigenRef {
    Id: number;
    Nombre: string;
}

export interface MonstruoSubtipoRef {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface EspecialContextualMonstruo {
    Especial: EspecialClaseDetalle;
    Contexto: Record<string, any>;
}

/** De dónde le viene un truco a una mascota (contrato: `personajes.md`, «Los trucos del compañero»). */
export type OrigenTruco = 'adicional' | 'monstruo' | 'ensenado';

/**
 * Un truco que sabe una criatura: los que trae entrenados su monstruo (`Trucos` de su detalle, con `Origen` `monstruo`) o,
 * en el compañero de una ficha, también los adicionales de su tabla (con su `Orden`) y los enseñados.
 */
export interface TrucoDeMascota {
    Id: number;
    Nombre: string;
    Origen: OrigenTruco;
    /** El orden en que eligió los adicionales (1, 2…); `null` en los demás. */
    Orden: number | null;
    Coste: number;
    Es_fin: boolean;
}

export interface MonstruoDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: ManualReferencia;
    Tipo: MonstruoTipoRef;
    Tamano: Tamano;
    Dados_golpe: MonstruoDadosGolpe;
    Movimientos: Movimientos;
    Maniobrabilidad: Maniobrabilidad;
    Alineamiento: Alineamiento;
    Iniciativa: number;
    Defensa: MonstruoDefensa;
    Ataque: MonstruoAtaque;
    Espacio: number;
    Alcance: number;
    Salvaciones: MonstruoSalvaciones;
    Caracteristicas: MonstruoCaracteristicas;
    Cd_sortilegas: string;
    Valor_desafio: string;
    Tesoro: string;
    Familiar: boolean;
    Companero: boolean;
    Oficial: boolean;
    /**
     * Si un animal puede ser la base de un licántropo (Manual de monstruos 1, pág. 177: «cualquier depredador, carroñero
     * u omnívoro»; 2026-11-06). `null` sin decir; los familiares y compañeros no la traen.
     */
    Dieta?: MonstruoDieta | null;
    Idiomas: IdiomaDetalle[];
    Alineamientos_requeridos: MonstruoAlineamientosRequeridos;
    Sortilegas: MonstruoSortilega[];
    Habilidades: MonstruoHabilidad[];
    Dotes: DoteContextual[];
    Niveles_clase: MonstruoNivelClase[];
    Subtipos: MonstruoSubtipoRef[];
    Raciales: RacialDetalle[];
    Ataques_especiales: RacialDetalle[];
    /** Las armas naturales como dato (`Ataque.Ataque_completo` es su descripción); los familiares y compañeros, las de su monstruo. */
    Armas_naturales?: ArmaNatural[];
    /** Los trucos que sabe (los de su monstruo, entrenados; en el compañero de una ficha, también los suyos). */
    Trucos?: TrucoDeMascota[];
    Familiares: FamiliarMonstruoDetalle[];
    Companeros: CompaneroMonstruoDetalle[];
    Personajes_relacionados: MonstruoPersonajesRelacionados;
}

/**
 * Una entrada del índice ligero de los monstruos (`MonstruosIndice/<id>` de la RTDB; contrato, `catalogos.md`, «El índice
 * ligero de los monstruos»): solo lo que pintan el listado, sus filtros y la búsqueda global, con los mismos valores que en
 * `Monstruos/<id>`. No es un `MonstruoDetalle`: el detalle se lee por su id (`MonstruoService.getMonstruo`).
 */
export interface MonstruoIndice {
    Id: number;
    Nombre: string;
    Manual: ManualReferencia;
    Tipo: Id_nombre;
    Tamano: Id_nombre;
    Valor_desafio: string;
    Familiar: boolean;
    Companero: boolean;
    Oficial: boolean;
}

export interface FamiliarMonstruoDetalle extends MonstruoDetalle {
    Monstruo_origen: MonstruoOrigenRef;
    Id_familiar: number;
    Vida: number;
    Plantilla: {
        Id: number;
        Nombre: string;
    };
    Especiales: EspecialContextualMonstruo[];
    Personajes: PersonajeRefMonstruo[];
    /**
     * El de una ficha, inactivo hasta que vuelva a cumplir lo que pide su fila de la lista (`Inactiva` de la ficha: contrato,
     * `personajes.md`, «La mascota inactiva…»). Sin él, activo.
     */
    Inactiva?: boolean;
}

/** Una fila de la tabla del compañero animal (`Bonos` de `GET /companeros/progresion`): lo que tiene desde ese nivel. */
export interface CompaneroBonosNivel {
    Nivel: number;
    Dg_adicionales: number;
    /** Se suma a la armadura natural de su monstruo. */
    Armadura_natural: number;
    /** Se suma a la Fuerza y a la Destreza de su monstruo. */
    Fuerza_destreza: number;
    Trucos_adicionales: number;
}

/** A quién va lo que da un nivel de la mascota (el compañero o el familiar). */
export type DestinatarioAptitudMascota = 'amo' | 'mascota' | 'ambos';

/**
 * Lo que gana la mascota o su amo desde un nivel (`Aptitudes` de `GET /companeros/progresion` y de cada tabla de
 * `GET /familiares/progresion`, tabla `mascota_aptitudes`): una aptitud (`Especial`) o una dote (`Dote`) y a quién va.
 */
export interface MascotaAptitudNivel {
    Id: number;
    Nivel: number;
    Especial: { Id: number; Nombre: string; } | null;
    Dote: { Id: number; Nombre: string; } | null;
    Destinatario: DestinatarioAptitudMascota;
}

/** Lo que da un nivel del compañero: si es una dote, la aptitud que gana el compañero que no cumple sus prerrequisitos. */
export interface CompaneroAptitudNivel extends MascotaAptitudNivel {
    Alternativa: { Id: number; Nombre: string; } | null;
}

/** `GET /companeros/progresion` (caché `CompanerosProgresion`): la tabla del compañero animal y lo que da cada nivel. */
export interface CompaneroProgresion {
    Bonos: CompaneroBonosNivel[];
    Aptitudes: CompaneroAptitudNivel[];
    /**
     * El tipo con el que cuenta el compañero para los prerrequisitos de tipo de sus dotes (MJ pág. 36: bestia mágica), o
     * `null` sin el dato: entonces, el de su monstruo (contrato: catalogos.md, `GET /companeros/progresion`).
     */
    Tipo_prerrequisitos?: { Id: number; Nombre: string; } | null;
}

/**
 * Una fila de una tabla del familiar (`Bonos` de cada tabla de `GET /familiares/progresion`): lo que tiene desde ese nivel
 * del amo.
 */
export interface FamiliarBonosNivel {
    Nivel: number;
    /** Se suma a la armadura natural de su monstruo. */
    Armadura_natural: number;
    /** La Inteligencia del familiar (si la de su monstruo es mayor, la suya); `null`, la de su monstruo. */
    Inteligencia: number | null;
    /** La resistencia a conjuros es el nivel del amo más esto; `null`, aún no tiene. */
    Rc_sobre_nivel: number | null;
}

/** Lo que da un nivel del familiar: con lo que dice la hoja (`Nota`: Alerta, solo con él al alcance de la mano). */
export interface FamiliarAptitudNivel extends MascotaAptitudNivel {
    Nota: string | null;
}

/** Una tabla del familiar (`Tablas` de `GET /familiares/progresion`): la del Manual del jugador o la dracónica. */
export interface FamiliarTabla {
    Id: number;
    Nombre: string;
    Por_defecto: boolean;
    Bonos: FamiliarBonosNivel[];
    Aptitudes: FamiliarAptitudNivel[];
}

/** Una pseudoplantilla de familiar (`Plantillas` de `GET /familiares/progresion`): la tabla que sigue y lo que cambia. */
export interface FamiliarPlantillaProgresion {
    Id: number;
    Nombre: string;
    /** La que sigue (la suya o la de por defecto). */
    Tabla: { Id: number; Nombre: string; } | null;
    /** Sus PG y su ataque base, los mayores entre los del amo (la mitad de sus PG) y los suyos (el dracónico, el celestial). */
    Pg_ataque_mayores: boolean;
    /**
     * Solo sus PG son los mayores entre la mitad de los del amo y los suyos; su ataque base, el de su amo (desde el
     * 2026-11-26, caché `familiares_progresion` 3: el familiar elemental del hechicero raptorán). Con `Pg_ataque_mayores`
     * también, manda `Pg_ataque_mayores`.
     */
    Pg_mayores: boolean;
    /** Los `Id` de las `Aptitudes` de su tabla que no gana (el mejorado, comunicarse con animales de su mismo tipo). */
    Sin_aptitudes: number[];
}

/** `GET /familiares/progresion` (caché `FamiliaresProgresion`): las tablas del familiar y lo que sigue cada pseudoplantilla. */
export interface FamiliarProgresion {
    Tablas: FamiliarTabla[];
    Plantillas: FamiliarPlantillaProgresion[];
    /** El tipo con el que cuenta el familiar para los prerrequisitos de tipo (MJ pág. 44: bestia mágica), o `null`. */
    Tipo_prerrequisitos?: { Id: number; Nombre: string; } | null;
}

export interface CompaneroMonstruoDetalle extends MonstruoDetalle {
    Monstruo_origen: MonstruoOrigenRef;
    Id_companero: number;
    Vida: number;
    Dg_adi: number;
    Trucos_adi: number;
    Plantilla: {
        Id: number;
        Nombre: string;
    };
    Especiales: EspecialContextualMonstruo[];
    Personajes: PersonajeRefMonstruo[];
    /** El de una ficha, inactivo hasta que vuelva a cumplir lo que pide su fila de la lista (como el familiar). Sin él, activo. */
    Inactiva?: boolean;
    /**
     * Lo que le falta por elegir con sus valores guardados (`Pendiente` de la ficha; contrato: personajes.md, «Lo
     * pendiente»): los puntos de habilidad, las dotes, las mejoras y lo que cuestan los trucos adicionales. Sin él (una ficha
     * de antes), no se sabe.
     */
    Pendiente?: { Puntos: number; Dotes: number; Mejoras: number; Trucos: number; };
    /**
     * Las habilidades de su monstruo, sin las suyas: las pone la carga de las sesiones (`MotorDesdeFichaService`) para que sus
     * rangos sigan el criterio «todo o nada» al bajar sus DG adicionales (`rangosDelCompaneroQueCaben`). Sin ellas, sus
     * rangos se quedan como están.
     */
    Habilidades_monstruo?: MonstruoHabilidad[];
    /** Los puntos de habilidad por DG del tipo de su monstruo, que la carga de las sesiones pone con `Habilidades_monstruo`. */
    Puntos_habilidad_tipo?: number;
    /**
     * El tipo con el que cuenta para los prerrequisitos de tipo de sus dotes y sus trucos (el `Tipo_prerrequisitos` de su
     * progresión: bestia mágica), que pone el motor; vale también el de su monstruo (`tiposQueCuentaElCompanero`).
     */
    Tipo_prerrequisitos?: { Id: number; Nombre: string; } | null;
    /** El límite de Inteligencia del tipo de su monstruo (`Limite_inteligencia`: 2 en un animal; 0, sin límite). */
    Limite_inteligencia_tipo?: number;
    /**
     * F21 (contrato: personajes.md, «F21: la Inteligencia de su fila»), que pone el motor con su fila: que su Inteligencia es
     * la que le da su fila (Compañero sabandija, 1), la de su monstruo («—», `null`) para volver a ella al quedar inactivo,
     * y que sus DG adicionales no le dan habilidades ni dotes.
     */
    Inteligencia_de_su_fila?: boolean;
    Inteligencia_del_monstruo?: number | null;
    Sin_habilidades_dotes?: boolean;
    /**
     * Las dotes de su monstruo (las que no se cambian; con `Adicional`, las «(B)»): las pone la creación al elegirlo y la
     * carga de las sesiones. Con ellas se cuentan las que le tocan elegir (`huecosDeDotesDelCompanero`).
     */
    Dotes_monstruo?: DoteContextual[];
    /** Sus mejoras de característica (contrato: «Las dotes y las mejoras que elige el compañero»). */
    Mejoras?: CompaneroMejora[];
}

/** Una mejora de característica del compañero: +1 a `Caracteristica` al llegar a `Dg` DG totales (MM, pág. 290). */
export interface CompaneroMejora {
    Dg: number;
    Id_caracteristica: number;
    Caracteristica: string;
}

/**
 * Los escalares del alta y de la edición de un monstruo (`monstruo` de `MonstruoCreateRequest`, contrato en
 * `docs/publica/endpoints/catalogos.md`). Los textos pueden ir vacíos; las características, `null` sin valor (el «—»).
 */
export interface MonstruoEscalaresRequest {
    nombre: string;
    descripcion: string;
    id_manual: number;
    pagina: number;
    id_tipo: number;
    id_tamano: number;
    cantidad_dg: string;
    id_tipo_dado: number;
    suma_dg: number;
    iniciativa: number;
    correr: number;
    nadar: number;
    volar: number;
    trepar: number;
    excavar: number;
    /** `null`: no vuela. */
    id_maniobrabilidad: number | null;
    ca: number;
    toque: number;
    desprevenido: number;
    armadura_natural: number;
    ataque_base: number;
    /** `null`: sin presa («—»). */
    presa: number | null;
    ataques: string;
    ataque_completo: string;
    reduccion_dano: string;
    resistencia_conjuros: string;
    resistencia_elemental: string;
    cd_sortilegas: string;
    /** En pies, en medios (2,5 de una criatura Menuda). */
    espacio: number;
    alcance: number;
    fortaleza: number;
    reflejos: number;
    voluntad: number;
    fuerza: number | null;
    destreza: number | null;
    constitucion: number | null;
    inteligencia: number | null;
    sabiduria: number | null;
    carisma: number | null;
    valor_desafio: string;
    tesoro: string;
    familiar: boolean;
    companero: boolean;
    id_alineamiento: number;
    oficial: boolean;
    /** `null`, sin decir. Dice si un animal puede ser la base de un licántropo (desde el 2026-11-06). */
    dieta: MonstruoDieta | null;
}

/** Una clase (y su nivel) con la que el monstruo es familiar o compañero; sin plantilla, dote o preferencia, `null`. */
export interface MonstruoNivelClaseRequest {
    id_clase: number;
    nivel: number;
    id_plantilla: number | null;
    id_preferencia_legal: number | null;
    id_preferencia_moral: number | null;
    id_dote: number | null;
    /** Lo que la fila suma al nivel efectivo para la tabla del compañero: 0 o menos (en el familiar, 0). */
    ajuste: number;
    /** El ataque base que pide la fila (1 o más); `null`, sin mínimo. */
    ataque_base_minimo: number | null;
}

/** El cuerpo de `POST /monstruos/add` y de `PUT /monstruos/<id>` (la edición reemplaza el monstruo entero). */
export interface MonstruoCreateRequest {
    monstruo: MonstruoEscalaresRequest;
    subtipos: number[];
    idiomas: number[];
    /** `adicional`: la «(B)» de su bloque (no llena un hueco de dote de sus DG; el animal de un licántropo, MM1, pág. 178). */
    dotes: { id_dote: number; id_extra: number | null; adicional: boolean; }[];
    habilidades: { id_habilidad: number; id_extra: number | null; rangos: number; }[];
    sortilegas: { id_conjuro: number; nivel_lanzador: number; usos_diarios: string; }[];
    raciales: number[];
    ataquesEspeciales: number[];
    niveles_clase: MonstruoNivelClaseRequest[];
    alineamientos_requeridos: { familiar: number[]; companero: number[]; };
}

/** La respuesta del alta y de la edición: `{ message, idMonstruo, monstruo, licantropos }`. */
export interface MonstruoMutacionResponse {
    message: string;
    idMonstruo: number;
    monstruo: MonstruoDetalle | null;
    /** Lo que hizo la API con sus licántropos (desde el 2026-11-06); `null` si no lo dice. */
    licantropos: LicantroposDelMonstruo | null;
}

/** `licantropos` del alta y la edición de un monstruo (`docs/publica/endpoints/catalogos.md`, «Licántropos automáticos»). */
export interface LicantroposDelMonstruo {
    Generadas: { Id: number; Nombre: string; Nacimiento: boolean; Accion: 'creada' | 'regenerada' | 'enlazada'; }[];
    Retiradas: { Id: number; Nombre: string; }[];
    Desenlazadas: { Id: number; Nombre: string; }[];
    Avisos: { code: string; message: string; }[];
}

/** La dieta de un monstruo (`monstruos.dieta`). */
export type MonstruoDieta = 'carnivoro' | 'omnivoro' | 'herbivoro';
export const DIETAS_MONSTRUO: readonly MonstruoDieta[] = ['carnivoro', 'omnivoro', 'herbivoro'];
