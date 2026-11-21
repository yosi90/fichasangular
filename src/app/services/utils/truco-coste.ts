import { toInt } from 'src/app/services/utils/normalizacion';

/*
 * Lo que cuenta un truco de Trato con animales (catálogo `Trucos`; contrato: `docs/publica/endpoints/catalogos.md`, «Los
 * trucos»). Aparte de `companero-trucos.ts` para que lo usen también las dotes del compañero (`companero-dotes.ts`, que
 * `companero-trucos.ts` importa) sin un ciclo de importaciones.
 */

/** Lo que cuenta un truco (su `Coste`; al menos 1: Ataca (todas las criaturas), 2; un fin, lo que suman sus trucos). */
export function costeDelTruco(truco: { Coste?: unknown; } | null | undefined): number {
    return Math.max(1, toInt(truco?.Coste, 1));
}

/** Lo que cuentan unos trucos (sus adicionales, los que lleva elegidos en el selector). */
export function costeDeLosTrucos(trucos: readonly { Coste?: unknown; }[]): number {
    return trucos.reduce((total, t) => total + costeDelTruco(t), 0);
}
