import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { nombreDoteConExtra, tieneNumeroVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { DatoFicha, datosVisibles } from './ficha';

/**
 * Lo que enseñan igual las fichas de criaturas y de lo que las cambia (monstruo, plantilla, subtipo, raza): las dotes,
 * las aptitudes sortílegas y el movimiento, ya listos para pintar con las piezas de la ficha.
 */

/** Una dote con su extra («Soltura con un arma (espada larga)») y el contexto con el que se abre su detalle. */
export interface DoteFicha {
    contexto: DoteContextual;
    nombre: string;
}

/** Las dotes con nombre visible, en su orden. */
export function dotesVisibles(dotes: DoteContextual[] | null | undefined): DoteFicha[] {
    return (dotes ?? [])
        .map((contexto) => ({ contexto, nombre: nombreDoteConExtra(contexto) }))
        .filter((dote) => tieneTextoVisible(dote.nombre));
}

/** Una aptitud sortílega: el conjuro (abre su detalle) y «NL 5 · 3/día». */
export interface SortilegaFicha {
    id: number;
    nombre: string;
    detalle: string;
}

/** Lo que leen de una aptitud sortílega de monstruo, plantilla o subtipo. */
interface SortilegaCriatura {
    Conjuro: { Id: number; Nombre: string; };
    Nivel_lanzador: number;
    Usos_diarios: string;
}

/** Las aptitudes sortílegas cuyo conjuro tiene nombre, con su nivel de lanzador y sus usos. */
export function sortilegasVisibles(sortilegas: SortilegaCriatura[] | null | undefined): SortilegaFicha[] {
    return (sortilegas ?? [])
        .filter((s) => tieneTextoVisible(s?.Conjuro?.Nombre))
        .map((s) => ({
            id: toNumber(s.Conjuro.Id),
            nombre: `${s.Conjuro.Nombre}`.trim(),
            detalle: [`NL ${toNumber(s.Nivel_lanzador)}`, tieneTextoVisible(s.Usos_diarios) ? `${s.Usos_diarios}`.trim() : '']
                .filter(Boolean).join(' · '),
        }));
}

/** Una distancia en pies como en el manual («30'»), o `null` si no hay un número mayor que 0. */
export function textoPies(valor: unknown): string | null {
    return tieneNumeroVisible(valor) ? `${Number(valor)}'` : null;
}

/** Los movimientos de una criatura, en pies. */
interface MovimientosCriatura {
    Correr: number;
    Nadar: number;
    Volar: number;
    Trepar: number;
    Escalar: number;
}

/**
 * Los datos de la sección «Movimiento»: cada movimiento que tiene (en pies) y la maniobrabilidad, que la API da a
 * `null` sin vuelo.
 */
export function datosMovimiento(movimientos: MovimientosCriatura | null | undefined, maniobrabilidad: string | null | undefined): DatoFicha[] {
    return datosVisibles([
        { etiqueta: 'Correr', valor: textoPies(movimientos?.Correr) },
        { etiqueta: 'Nadar', valor: textoPies(movimientos?.Nadar) },
        { etiqueta: 'Volar', valor: textoPies(movimientos?.Volar) },
        { etiqueta: 'Trepar', valor: textoPies(movimientos?.Trepar) },
        { etiqueta: 'Escalar', valor: textoPies(movimientos?.Escalar) },
        { etiqueta: 'Maniobrabilidad', valor: maniobrabilidad },
    ]);
}
