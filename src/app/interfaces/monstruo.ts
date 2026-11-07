import { Alineamiento } from "./alineamiento";
import { ArmaNatural } from "./arma-natural";
import { Caracteristica } from "./caracteristica";
import { Conjuro } from "./conjuro";
import { ManualReferencia } from "./manual";
import { DoteContextual } from "./dote-contextual";
import { EspecialClaseDetalle } from "./especial";
import { IdiomaDetalle } from "./idioma";
import { Maniobrabilidad } from "./maniobrabilidad";
import { Movimientos } from "./movimientos";
import { RacialDetalle } from "./racial";
import { Tamano } from "./tamaño";

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
    Presa: number;
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
    Nivel: number;
    Plantilla: {
        Id: number;
        Nombre: string;
    };
    Preferencia_legal: {
        Id: number;
        Nombre: string;
    };
    Preferencia_moral: {
        Id: number;
        Nombre: string;
    };
    Dote: {
        Id: number;
        Nombre: string;
    };
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
    Familiares: FamiliarMonstruoDetalle[];
    Companeros: CompaneroMonstruoDetalle[];
    Personajes_relacionados: MonstruoPersonajesRelacionados;
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
    presa: number;
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
}

/** El cuerpo de `POST /monstruos/add` y de `PUT /monstruos/<id>` (la edición reemplaza el monstruo entero). */
export interface MonstruoCreateRequest {
    monstruo: MonstruoEscalaresRequest;
    subtipos: number[];
    idiomas: number[];
    dotes: { id_dote: number; id_extra: number | null; }[];
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
