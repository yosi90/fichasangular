import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { Comodin } from 'src/app/interfaces/comodin';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { NOMBRES_CARACTERISTICAS } from 'src/app/services/utils/caracteristicas';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import { nombreDoteConExtra, textoVisible, tieneNumeroVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { DatoFicha, DatoFranja, datosVisibles } from './ficha';

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
    /** Los DG que hacen falta para tenerla (las de una plantilla). */
    Dg?: number | null;
}

/** Los DG desde los que se tiene una aptitud de una plantilla («desde 13 DG»), o vacío si no pide ninguno. */
export function textoDesdeDg(dg: unknown): string {
    return tieneNumeroVisible(dg) ? `desde ${Number(dg)} DG` : '';
}

/** Las aptitudes sortílegas cuyo conjuro tiene nombre, con su nivel de lanzador, sus usos y los DG que pide. */
export function sortilegasVisibles(sortilegas: SortilegaCriatura[] | null | undefined): SortilegaFicha[] {
    return (sortilegas ?? [])
        .filter((s) => tieneTextoVisible(s?.Conjuro?.Nombre))
        .map((s) => ({
            id: toNumber(s.Conjuro.Id),
            nombre: `${s.Conjuro.Nombre}`.trim(),
            detalle: [`NL ${toNumber(s.Nivel_lanzador)}`, textoVisible(s.Usos_diarios), textoDesdeDg(s.Dg)]
                .filter(Boolean).join(' · '),
        }));
}

/** Una habilidad que da una criatura o lo que la cambia: «Saber (arcano)», el bonificador y lo que añade («Varios»). */
export interface HabilidadFicha {
    nombre: string;
    /** «+8», o vacío si no da bonificador (una habilidad que pasa a ser de clase). */
    valor: string;
    nota: string;
}

/** Lo que leen de una habilidad de plantilla, subtipo o raza (la cantidad la da quien llama). */
interface HabilidadCriatura {
    Habilidad: string;
    Extra?: string | null;
    Extra_comodin?: Comodin | null;
    Varios?: string | null;
}

/**
 * Las habilidades con nombre, por orden alfabético: el nombre con su extra («Elegir» si está por escoger), la cantidad
 * (`Rangos` o `Cantidad`, según el tipo) con signo y «Varios» como nota. Se pintan con `<app-ficha-habilidades>`. El
 * extra sale de `Extra` y su `Extra_comodin`; si el tipo lo lee de otra forma (la raza, también por su id), lo da
 * `extraVisible`.
 */
export function habilidadesVisibles<T extends HabilidadCriatura>(
    habilidades: T[] | null | undefined,
    cantidad: (habilidad: T) => unknown,
    extraVisible: (habilidad: T) => string = (h) => resolverExtraHabilidadVisible({ extra: h.Extra, extraComodin: h.Extra_comodin }),
): HabilidadFicha[] {
    return (habilidades ?? [])
        .filter((h) => tieneTextoVisible(h?.Habilidad))
        .map((h) => {
            const extra = extraVisible(h);
            const nombre = `${h.Habilidad}`.trim();
            const valor = toNumber(cantidad(h));
            return {
                nombre: tieneTextoVisible(extra) ? `${nombre} (${extra})` : nombre,
                valor: valor !== 0 ? textoConSigno(valor) : '',
                nota: textoVisible(h.Varios),
            };
        })
        .sort((a, b) => compararTexto(a.nombre, b.nombre));
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
 * Los movimientos como en la franja de una criatura: «40'», «nadar 30'», «volar 80' (buena)». El primero es la velocidad
 * base y el resto, sus otros movimientos. La maniobrabilidad (su nombre, o nada si no se enseña) va con el vuelo.
 */
export function textosMovimiento(movimientos: MovimientosCriatura | null | undefined, maniobrabilidad: string | null | undefined): string[] {
    const vuelo = tieneTextoVisible(maniobrabilidad) ? ` (${`${maniobrabilidad}`.trim().toLowerCase()})` : '';
    return [
        { nombre: '', valor: toNumber(movimientos?.Correr) },
        { nombre: 'nadar ', valor: toNumber(movimientos?.Nadar) },
        { nombre: 'volar ', valor: toNumber(movimientos?.Volar), extra: vuelo },
        { nombre: 'trepar ', valor: toNumber(movimientos?.Trepar) },
        { nombre: 'escalar ', valor: toNumber(movimientos?.Escalar) },
    ]
        .filter((movimiento) => movimiento.valor > 0)
        .map((movimiento) => `${movimiento.nombre}${movimiento.valor}'${movimiento.extra ?? ''}`);
}

/**
 * La «Velocidad» de la franja de una criatura (`textosMovimiento`): la base de valor y el resto de movimientos de
 * detalle. Si vuela con una maniobrabilidad que enseñar (`vuelo`), esta va con el vuelo y el dato lleva el botón con sus
 * reglas.
 */
export function datoFranjaVelocidad(
    movimientos: MovimientosCriatura | null | undefined,
    vuelo: { maniobrabilidad: string | null | undefined; abrirReglas: (evento: Event) => void; } | null,
): DatoFranja {
    const textos = textosMovimiento(movimientos, vuelo?.maniobrabilidad);
    return {
        etiqueta: 'Velocidad',
        valor: textos[0] ?? null,
        detalle: textos.slice(1).join(', '),
        ayudaBoton: vuelo ? { texto: 'Reglas de maniobrabilidad', alPulsar: vuelo.abrirReglas } : null,
    };
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

/** Las seis características de lo que cambia a una criatura (plantilla, subtipo): un número por cada una. */
type CaracteristicasCriatura = Record<Caracteristica, number>;

function datosCaracteristicas(
    valores: CaracteristicasCriatura | null | undefined,
    valor: (numero: number) => string | number | null,
): DatoFicha[] {
    if (!valores)
        return [];
    return datosVisibles(CARACTERISTICAS.map((clave) => ({
        etiqueta: NOMBRES_CARACTERISTICAS[clave],
        valor: valor(toNumber(valores[clave])),
    })));
}

/** Los modificadores de característica distintos de 0, con signo («Fuerza +8»). */
export function datosModificadoresCaracteristicas(valores: CaracteristicasCriatura | null | undefined): DatoFicha[] {
    return datosCaracteristicas(valores, (numero) => numero !== 0 ? textoConSigno(numero) : null);
}

/** Las características mínimas que pide, las mayores que 0 («Inteligencia 3»). */
export function datosMinimosCaracteristicas(valores: CaracteristicasCriatura | null | undefined): DatoFicha[] {
    return datosCaracteristicas(valores, (numero) => numero > 0 ? numero : null);
}
