import { Dote } from 'src/app/interfaces/dote';
import { primerEntero, toArray, toBoolean, toInt, toText } from './normalizacion';

/*
 * Los extras de las dotes de monstruo (contrato: `docs/publica/endpoints/catalogos.md`, «Los extras de las dotes de
 * monstruo»): lo que se elige al adquirir Ataque natural mejorado (una de sus armas naturales), Soltura con una aptitud (uno
 * de sus ataques especiales) y Apresurar o Potenciar aptitud sortílega (una de sus sortílegas, con el nivel de lanzador que
 * pide la dote) es algo que ya tiene la criatura que la adquiere, el personaje o su mascota.
 */

/** Un extra de la criatura: el id que va en `idExtra` (el tipo de arma natural, el racial o el conjuro) y su nombre. */
export interface ExtraDeCriatura {
    Id: number;
    Nombre: string;
}

/** Lo que tiene la criatura que adquiere la dote, para ofrecer sus extras. */
export interface CriaturaParaExtras {
    /** Sus tipos de armas naturales (`tiposDeArmasNaturales`), con el `Id_arma_natural`. */
    armasNaturales: readonly ExtraDeCriatura[];
    /** Sus ataques especiales, con el `Id` de su racial. */
    ataquesEspeciales: readonly ExtraDeCriatura[];
    /** Sus aptitudes sortílegas, con su conjuro y su nivel de lanzador (un número o un texto, el de un rasgo). */
    sortilegas: readonly { Conjuro?: { Id?: number; Nombre?: string; } | null; Nivel_lanzador?: number | string | null; }[];
}

type Familia = 'arma_natural' | 'ataque_especial' | 'sortilega';

/** La familia de extra de criatura de la dote, o `null` si no tiene ninguna (no se juntan con las demás). */
export function familiaDeExtraDeCriatura(dote: Dote | null | undefined): Familia | null {
    const soportados = dote?.Extras_soportados;
    if (toBoolean(soportados?.Extra_arma_natural))
        return 'arma_natural';
    if (toBoolean(soportados?.Extra_ataque_especial))
        return 'ataque_especial';
    if (toBoolean(soportados?.Extra_sortilega))
        return 'sortilega';
    return null;
}

/** El nivel de lanzador que pide la dote a su sortílega (su prerrequisito `sortilega`; con varios en grupo, el menor). */
export function nivelLanzadorQuePide(dote: Dote | null | undefined): number {
    const filas = toArray((dote?.Prerrequisitos as Record<string, unknown> | undefined)?.['sortilega'])
        .map((fila: any) => ({ nivel: toInt(fila?.Nivel_lanzador), opcional: toInt(fila?.Opcional) }))
        .filter((fila) => fila.nivel > 0);
    const obligatorios = filas.filter((fila) => fila.opcional === 0).map((fila) => fila.nivel);
    if (obligatorios.length > 0)
        return Math.max(...obligatorios);
    return filas.length > 0 ? Math.min(...filas.map((fila) => fila.nivel)) : 0;
}

function sinRepetidos(extras: ExtraDeCriatura[]): ExtraDeCriatura[] {
    const vistos = new Set<number>();
    return extras.filter((extra) => extra.Id > 0 && extra.Nombre.length > 0 && !vistos.has(extra.Id) && !!vistos.add(extra.Id));
}

/** Los extras de la dote que tiene la criatura (vacío si la dote no tiene extra de criatura). */
export function extrasDeCriaturaDeLaDote(dote: Dote | null | undefined, criatura: CriaturaParaExtras): ExtraDeCriatura[] {
    switch (familiaDeExtraDeCriatura(dote)) {
        case 'arma_natural':
            return sinRepetidos([...criatura.armasNaturales].map((a) => ({ Id: toInt(a.Id), Nombre: toText(a.Nombre) })));
        case 'ataque_especial':
            return sinRepetidos([...criatura.ataquesEspeciales].map((a) => ({ Id: toInt(a.Id), Nombre: toText(a.Nombre) })));
        case 'sortilega': {
            const pide = nivelLanzadorQuePide(dote);
            return sinRepetidos(criatura.sortilegas
                .filter((s) => (primerEntero(s?.Nivel_lanzador) ?? 0) >= pide)
                .map((s) => ({ Id: toInt(s?.Conjuro?.Id), Nombre: toText(s?.Conjuro?.Nombre) })));
        }
        default:
            return [];
    }
}

/** Por qué no se puede elegir una dote de extra de criatura sin ninguno que elegir. */
export function motivoSinExtrasDeCriatura(dote: Dote | null | undefined): string {
    switch (familiaDeExtraDeCriatura(dote)) {
        case 'arma_natural':
            return 'No tiene ninguna arma natural a la que aplicarla.';
        case 'ataque_especial':
            return 'No tiene ningún ataque especial al que aplicarla.';
        case 'sortilega': {
            const pide = nivelLanzadorQuePide(dote);
            return pide > 0
                ? `No tiene ninguna aptitud sortílega a nivel de lanzador ${pide} o más.`
                : 'No tiene ninguna aptitud sortílega a la que aplicarla.';
        }
        default:
            return 'No hay extras válidos disponibles para esta dote';
    }
}
