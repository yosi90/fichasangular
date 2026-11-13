import { Alineamiento } from 'src/app/interfaces/alineamiento';
import {
    AlineamientoVector,
    getVectorDesdeIdBasico,
    getVectorDesdeNombreBasico,
    nombreBasicoDesdeVector,
    PRIORIDAD_ALINEAMIENTO_ESTRICTA,
    reglaDePreferenciaAlineamiento,
} from './alineamiento-contrato';
import { toInt } from './normalizacion';

/*
 * El alineamiento de una raza, y solo él (bugs.md de sesiones, 2026-11-13: la regla vivía en el componente de la
 * creación; ahora la usan la creación, la corrección de la ficha y la adquisición de una plantilla). Sale de sus datos:
 * - su básico (`Basico.Id_basico`): cada eje en el que no coincide falla con la prioridad del alineamiento;
 * - sus preferencias de ley y de moral (su `Valor`, si lo prohíbe y su `Id_prioridad`): un eje que no cumple pesa lo que
 *   pesa su preferencia, «siempre» o «nunca» (3), «casi» (2); una «tendencia» (1) pesa lo del alineamiento entero;
 * - la prioridad del alineamiento (`Prioridad.Id_prioridad`): 3 o más, una regla dura; 2, un aviso.
 * Una regla dura vuelve homebrew la ficha si se salta (la decisión `alineamiento_raza`, confirmada en Básicos); un aviso
 * solo se enseña («un caso extremadamente inusual»).
 */

export type SeveridadAlineamientoRaza = 'soft' | 'hard';

export interface EvaluacionAlineamientoRaza {
    /** `hard`: no se salta sin volver homebrew la ficha; `soft`: se avisa. */
    severidad: SeveridadAlineamientoRaza;
    /** Lo que exige la raza, para la frase («Legal bueno», «Nunca legal»). */
    requerido: string;
    /** La prioridad del alineamiento de la raza (0 si no la trae). */
    prioridad: number;
}

const PRIORIDAD_AVISO = 2;

function severidadDePrioridad(prioridad: number): SeveridadAlineamientoRaza | null {
    if (prioridad >= PRIORIDAD_ALINEAMIENTO_ESTRICTA)
        return 'hard';
    return prioridad >= PRIORIDAD_AVISO ? 'soft' : null;
}

function vectorBasico(alineamiento: Partial<Alineamiento> | null | undefined): AlineamientoVector | null {
    return getVectorDesdeIdBasico(toInt(alineamiento?.Basico?.Id_basico))
        ?? getVectorDesdeNombreBasico(`${alineamiento?.Basico?.Nombre ?? ''}`);
}

/** Lo que exige un alineamiento, para la frase: el básico, el que dan sus dos ejes o el nombre de sus preferencias. */
export function textoExigenciaAlineamiento(alineamiento: Partial<Alineamiento> | null | undefined): string {
    const basico = vectorBasico(alineamiento);
    if (basico)
        return `${alineamiento?.Basico?.Nombre ?? ''}`.trim() || nombreBasicoDesdeVector(basico.ley, basico.moral);
    const ley = reglaDePreferenciaAlineamiento(alineamiento?.Ley);
    const moral = reglaDePreferenciaAlineamiento(alineamiento?.Moral);
    if (ley && moral && !ley.prohibe && !moral.prohibe)
        return nombreBasicoDesdeVector(ley.valor, moral.valor);
    const nombres = [ley ? `${alineamiento?.Ley?.Nombre ?? ''}`.trim() : '', moral ? `${alineamiento?.Moral?.Nombre ?? ''}`.trim() : '']
        .filter((nombre) => nombre.length > 0);
    return nombres.join(', ') || 'No aplica';
}

/**
 * Si un alineamiento (su nombre básico: «Legal bueno») choca con el de una raza: `null` si lo cumple o si lo que no cumple
 * no pesa (una «tendencia» con una prioridad baja); si no, si es una regla dura o un aviso.
 */
export function evaluarAlineamientoRaza(alineamientoRaza: Partial<Alineamiento> | null | undefined,
    alineamientoPersonaje: string): EvaluacionAlineamientoRaza | null {
    const personaje = getVectorDesdeNombreBasico(alineamientoPersonaje);
    if (!alineamientoRaza || !personaje)
        return null;
    const prioridad = toInt(alineamientoRaza.Prioridad?.Id_prioridad);
    // Lo que pesan los ejes que no cumple por su preferencia; sin ninguna que pese, manda la prioridad del alineamiento.
    const deLosEjes: SeveridadAlineamientoRaza[] = [];
    let falla = false;
    const basico = vectorBasico(alineamientoRaza);
    (['ley', 'moral'] as const).forEach((eje) => {
        const regla = reglaDePreferenciaAlineamiento(alineamientoRaza[eje === 'ley' ? 'Ley' : 'Moral']);
        const incumple = regla
            ? (regla.prohibe ? personaje[eje] === regla.valor : personaje[eje] !== regla.valor)
            : !!basico && basico[eje] !== personaje[eje];
        if (!incumple)
            return;
        falla = true;
        const deLaPreferencia = regla ? severidadDePrioridad(regla.prioridad) : null;
        if (deLaPreferencia)
            deLosEjes.push(deLaPreferencia);
    });
    if (!falla)
        return null;
    const severidad = deLosEjes.includes('hard') ? 'hard' : deLosEjes.includes('soft') ? 'soft' : severidadDePrioridad(prioridad);
    return severidad ? { severidad, requerido: textoExigenciaAlineamiento(alineamientoRaza), prioridad } : null;
}
