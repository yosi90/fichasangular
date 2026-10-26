import { toInt } from 'src/app/services/utils/normalizacion';

/**
 * Reglas de los puntos de habilidad y los rangos (Manual del jugador, cap. 4).
 *
 * - Cada nivel de clase da (puntos de la clase + modificador de Inteligencia), con un mínimo de 1 aunque la
 *   Inteligencia reste. En el primer nivel del personaje se multiplica por 4; si la raza o una plantilla ya da DG
 *   raciales, el primer nivel ya fue el de esos DG (sus puntos llevan su propio multiplicador) y el primer nivel de
 *   clase no lleva ×4.
 * - Los DG raciales (Manual de monstruos, cap. 1): (puntos por DG + modificador de Inteligencia, mínimo 1) × (DG + 3). La
 *   raza guarda los dos factores: `Dgs_adicionales.Multiplicador_puntos_habilidad` (los puntos por DG del tipo, 2 en un
 *   humanoide monstruoso) y `Dgs_adicionales.Puntos_habilidad` (DG + 3).
 * - Los puntos extra de la raza (el humano: 4 en el primer nivel y 1 en cada nivel siguiente) se suman aparte.
 * - Un rango de habilidad clásea cuesta 1 punto y su tope es nivel + 3; uno transcláseo cuesta 2 puntos y su tope es la
 *   mitad, ⌊(nivel + 3) / 2⌋. Los rangos son siempre enteros (no hay medios rangos).
 */

export const MULTIPLICADOR_PRIMER_NIVEL = 4;
export const COSTE_RANGO_CLASEA = 1;
export const COSTE_RANGO_TRANSCLASEA = 2;

export interface PuntosHabilidadNivelClase {
    /** Puntos de habilidad por nivel de la clase («2 + mod. de Int» → 2). */
    puntosClase: number;
    modInteligencia: number;
    /** Es el primer nivel del personaje: sin niveles de clase anteriores ni DG de raza o de plantilla. */
    primerNivelPersonaje: boolean;
    /** Puntos extra de la raza en el primer nivel del personaje (`Puntos_habilidad_extra_primer_nivel`). */
    extraPrimerNivel?: number;
    /** Puntos extra de la raza en cada nivel siguiente (`Puntos_habilidad_extra_por_nivel`). */
    extraPorNivel?: number;
}

/** Los puntos de un nivel o un DG: los suyos más el modificador de Inteligencia, con un mínimo de 1. */
function puntosPorNivel(puntos: number, modInteligencia: number): number {
    return Math.max(1, toInt(puntos) + toInt(modInteligencia));
}

export function puntosHabilidadNivelClase(entrada: PuntosHabilidadNivelClase): number {
    const porNivel = puntosPorNivel(entrada.puntosClase, entrada.modInteligencia);
    const extra = Math.max(0, toInt(entrada.primerNivelPersonaje ? entrada.extraPrimerNivel : entrada.extraPorNivel));
    return (entrada.primerNivelPersonaje ? porNivel * MULTIPLICADOR_PRIMER_NIVEL : porNivel) + extra;
}

export interface PuntosHabilidadDgRaciales {
    /** Puntos por DG del tipo de criatura (`Dgs_adicionales.Multiplicador_puntos_habilidad`). */
    puntosPorDg: number;
    /** Por cuánto se multiplica: los DG + 3 (`Dgs_adicionales.Puntos_habilidad`). */
    multiplicador: number;
    modInteligencia: number;
}

export function puntosHabilidadDgRaciales(entrada: PuntosHabilidadDgRaciales): number {
    const multiplicador = Math.max(0, toInt(entrada.multiplicador));
    return multiplicador * puntosPorNivel(entrada.puntosPorDg, entrada.modInteligencia);
}

export function costeRangoHabilidad(clasea: boolean): number {
    return clasea ? COSTE_RANGO_CLASEA : COSTE_RANGO_TRANSCLASEA;
}

export function limiteRangosHabilidad(nivelPersonaje: number, clasea: boolean): number {
    const tope = Math.max(0, toInt(nivelPersonaje)) + 3;
    return clasea ? tope : Math.floor(tope / 2);
}
