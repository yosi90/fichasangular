import { PrerrequisitoItem } from "./prerrequisito";
import { Conjuro } from "./conjuro";
import { EsenciaRasgo } from "./incarnum";

export interface RacialReferencia {
    id?: number | null;
    nombre: string;
    origen?: string;
}

export interface RacialDoteRef {
    Id_dote: number;
    Dote: string;
    Id_extra: number;
    Extra: string;
}

export interface RacialHabilidades {
    Base: Record<string, any>[];
    Custom: Record<string, any>[];
}

export interface RacialSortilega {
    Conjuro: Conjuro;
    Nivel_lanzador: string;
    Usos_diarios: string;
}

export interface RacialAtaque {
    Descripcion: string;
}

export interface RacialPrerrequisitosFlags {
    raza: boolean;
    caracteristica_minima: boolean;
}

export interface RacialPrerrequisitos {
    raza: PrerrequisitoItem[];
    caracteristica: PrerrequisitoItem[];
}

/** Una velocidad que da la progresión de un rasgo: tiene al menos esos pies (la mayor, si ya tenía). */
export interface RacialProgresionVelocidad {
    Tipo: 'Correr' | 'Nadar' | 'Volar' | 'Trepar' | 'Excavar';
    Pies: number;
    Maniobrabilidad: { Id: number; Nombre: string; } | null;
}

/**
 * Lo que un rasgo racial da o cambia al llegar a N DG (Medida dg) o a nivel N de personaje (
ivel), desde ahí y
 * para siempre (RacialProgresion del contrato, docs/publica/endpoints/catalogos.md). La aplica
 * services/utils/racial-progresion.ts, con la misma regla que la ficha de la API.
 */
export interface RacialProgresion {
    Medida: 'dg' | 'nivel';
    Desde: number;
    /** El rasgo que gana, completo (sin progresión propia). */
    Gana: RacialDetalle | null;
    /** El rasgo que deja de tener. */
    Sustituye: { Id: number; Nombre: string; } | null;
    /** Una dote adicional de ese tipo, a elegir. */
    Tipo_dote: { Id: number; Nombre: string; } | null;
    Velocidad: RacialProgresionVelocidad | null;
    /** La cifra del propio rasgo desde ahí (el daño del aliento). */
    Valor: string | null;
    /** La frase para el jugador: «A los 6 DG: gana Visión en la oscuridad 60' en lugar de Visión en la oscuridad 30'.» */
    Frase: string;
}

/** Contra qué criaturas cuenta un bonificador condicional: un tipo de criatura, un subtipo o una raza. */
export interface RacialBonificadorContra {
    Catalogo: 'tipo_criatura' | 'subtipo' | 'raza';
    Id: number;
    Nombre: string;
}

/**
 * Lo que un rasgo racial suma solo en un caso (`Bonificadores_condicionales` del contrato,
 * `docs/publica/endpoints/catalogos.md`): el +1 al ataque del enano contra orcos y trasgoides, la esquiva +4 a la CA
 * contra gigantes. La creación y la ficha lo enseñan aparte y no lo suman. Uno sin condición (`Condicion` `null`, solo a
 * la CA: la esquiva +4 del svirfneblin contra todas las criaturas) cuenta siempre y se suma a la CA con su tipo.
 */
export interface RacialBonificadorCondicional {
    Objetivo: { Id: number; Nombre: string; };
    /** `Apila`: si se apila con los del mismo tipo (esquiva, sin tipo), para sumar los de siempre. */
    Tipo_bonificador: { Id: number; Nombre: string; Apila: boolean; };
    /** Distinta de 0; negativa, un penalizador. */
    Cantidad: number;
    /** El caso en que cuenta, en texto: «Contra orcos y trasgoides»; `null`, cuenta siempre. */
    Condicion: string | null;
    /** Si es contra unas criaturas, cuáles (el texto puede acotarlo más). */
    Contra: RacialBonificadorContra[];
    /** «Ataque +1 (racial) contra orcos y trasgoides». */
    Frase: string;
}

export interface RacialDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Oficial: boolean;
    Origen?: string;
    Opcional?: number;
    Dotes: RacialDoteRef[];
    Habilidades: RacialHabilidades;
    Caracteristicas: Record<string, any>[];
    Salvaciones: Record<string, any>[];
    Sortilegas: RacialSortilega[];
    Ataques: RacialAtaque[];
    /** Magic of Incarnum: la esencia que da a la reserva y si es receptáculo (`null` si nada). */
    Esencia?: EsenciaRasgo | null;
    /** La característica de la CD de la aptitud (10 + ½ DG raciales + su modificador); `null` si no tiene. */
    Caracteristica_cd?: { Id: number; Nombre: string; } | null;
    /** En una raza por edades: su cifra a esa edad («4d10»), si la edad la cambia. */
    Valor?: string | null;
    /** En una raza resuelta a una edad: la categoría en la que se ganó. */
    Categoria_edad?: { Id: number; Nombre: string; } | null;
    /** En la ficha: la CD ya calculada por la API, si tiene `Caracteristica_cd`. */
    Cd?: number | null;
    Prerrequisitos_flags: RacialPrerrequisitosFlags;
    Prerrequisitos: RacialPrerrequisitos;
    /** Lo que da o cambia al llegar a N DG o a nivel N; `[]` si nada (o en datos de antes). */
    Progresion?: RacialProgresion[];
    /** Lo que suma solo en un caso, aparte; `[]` si nada (o en datos de antes). */
    Bonificadores_condicionales?: RacialBonificadorCondicional[];
}
