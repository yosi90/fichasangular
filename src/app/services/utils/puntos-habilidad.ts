/**
 * Reglas de los puntos de habilidad y los rangos (Manual del jugador, cap. 4).
 *
 * - Cada nivel de clase da (puntos de la clase + modificador de Inteligencia), con un mínimo de 1 aunque la
 *   Inteligencia reste. En el primer nivel del personaje se multiplica por 4; si la raza o una plantilla ya da DG
 *   raciales, el primer nivel ya fue el de esos DG (sus puntos llevan su propio multiplicador) y el primer nivel de
 *   clase no lleva ×4.
 * - Los puntos extra de la raza (el humano: 4 en el primer nivel y 1 en cada nivel siguiente) se suman aparte.
 */

export const MULTIPLICADOR_PRIMER_NIVEL = 4;

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

function entero(valor: number | null | undefined): number {
    const numero = Math.trunc(Number(valor ?? 0));
    return Number.isFinite(numero) ? numero : 0;
}

export function puntosHabilidadNivelClase(entrada: PuntosHabilidadNivelClase): number {
    const porNivel = Math.max(1, entero(entrada.puntosClase) + entero(entrada.modInteligencia));
    const extra = Math.max(0, entero(entrada.primerNivelPersonaje ? entrada.extraPrimerNivel : entrada.extraPorNivel));
    return (entrada.primerNivelPersonaje ? porNivel * MULTIPLICADOR_PRIMER_NIVEL : porNivel) + extra;
}
