import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeTamanoDto } from 'src/app/interfaces/personajes-api';
import { Tamano } from 'src/app/interfaces/tamaño';
import { toInt, toNumber, toNumberOrNull, toText } from 'src/app/services/utils/normalizacion';

/*
 * El tamaño del personaje con las aptitudes que lo cambian (Manual del jugador, cap. 8, tablas 8-1 y 8-4, y *agrandar
 * persona*), con la misma regla que la ficha de la API (`utils/tamano.py`; `PersonajeTamano` en
 * `docs/publica/endpoints/personajes.md`):
 * - las aptitudes no se apilan: cuentan el mayor aumento y la mayor reducción;
 * - no se pasa de Minúsculo ni de Colosal (los extremos del catálogo); la fila 0 («Depende») no cambia;
 * - el espacio y el alcance son los de la raza más lo que cambia la tabla 8-4 de un tamaño al otro (`Espacio`, `Alcance` y
 *   `Alcance_largo` de `GET /tamanos`); una raza larga (su alcance es el largo de su tamaño, distinto del alto) sigue la
 *   columna larga. Sin cambio, los de la raza.
 * Ningún tamaño va escrito aquí: todo sale del catálogo.
 */

/** Una aptitud que cambia el tamaño: su nombre y las categorías que suma (+1, una más grande). */
export interface OrigenTamano {
    origen: string;
    pasos: number;
}

/** El tamaño efectivo: la fila del catálogo que toca (para la carga) y el bloque de la ficha. */
export interface TamanoEfectivo {
    tamano: Tamano;
    ficha: PersonajeTamanoDto;
}

/** Lo que cuenta del tamaño del personaje en la CA, la presa y Esconderse, y su nombre. */
export interface TamanoQueCuenta {
    nombre: string | null;
    modificador: number;
    modificadorPresa: number;
    modificadorEsconderse: number;
}

/**
 * El tamaño que cuenta del personaje (la ficha, su PDF, sus totales y la creación): el efectivo (`Tamano_efectivo`, el de
 * su raza movido por sus aptitudes) o, sin él, el de su raza. `null` sin ninguno de los dos.
 */
export function tamanoQueCuenta(pj: Pick<Personaje, 'Tamano_efectivo' | 'Raza'> | null | undefined): TamanoQueCuenta | null {
    const efectivo = pj?.Tamano_efectivo;
    const raza = pj?.Raza?.Tamano;
    if (efectivo)
        return {
            nombre: toText(efectivo.nombre).trim() || toText(raza?.Nombre).trim() || null,
            modificador: toInt(efectivo.modificador),
            modificadorPresa: toInt(efectivo.modificadorPresa),
            modificadorEsconderse: toInt(efectivo.modificadorEsconderse),
        };
    if (!raza)
        return null;
    return {
        nombre: toText(raza.Nombre).trim() || null,
        modificador: toInt(raza.Modificador),
        modificadorPresa: toInt(raza.Modificador_presa),
        modificadorEsconderse: toInt(raza.Modificador_esconderse),
    };
}

/** Las categorías que cambia el tamaño: el mayor aumento más la mayor reducción (no se apilan). */
export function pasosDeAptitudes(pasos: number[]): number {
    const valores = pasos.map((paso) => toInt(paso));
    return Math.max(0, ...valores.filter((paso) => paso > 0)) + Math.min(0, ...valores.filter((paso) => paso < 0));
}

/**
 * El tamaño con el que cuenta el personaje: `base` es el tamaño de su raza; `catalogo`, los tamaños de `GET /tamanos`;
 * `origenes`, sus aptitudes que lo cambian; `espacio` y `alcance`, los de su raza (sin ellos, los de su tamaño). `null`
 * sin tamaño de raza.
 */
export function tamanoEfectivo(
    base: Tamano | null | undefined,
    catalogo: Tamano[],
    origenes: OrigenTamano[],
    espacio?: number | null,
    alcance?: number | null
): TamanoEfectivo | null {
    const idBase = toInt(base?.Id);
    if (!base || (idBase <= 0 && toText(base?.Nombre).trim().length < 1))
        return null;
    const conPasos = origenesConPasos(origenes);
    const pasos = pasosDeAptitudes(conPasos.map((origen) => origen.pasos));
    const filaBase = (catalogo ?? []).find((tamano) => toInt(tamano?.Id) === idBase) ?? null;
    const movido = pasos !== 0 && filaBase ? tamanoTrasPasos(catalogo, idBase, pasos) : null;
    const destino = movido && movido.pasos !== 0 ? movido : null;
    const cambia = destino !== null;
    const fila: Tamano = destino ? destino.tamano : { ...(filaBase ?? {}), ...base } as Tamano;
    const medidas = espacioYAlcance(filaBase, fila, espacio, alcance, cambia);
    return {
        tamano: fila,
        ficha: {
            id: toInt(fila.Id),
            nombre: toText(fila.Nombre).trim() || null,
            modificador: toInt(fila.Modificador),
            modificadorPresa: toInt(fila.Modificador_presa),
            modificadorEsconderse: toInt(fila.Modificador_esconderse),
            espacio: medidas.espacio,
            alcance: medidas.alcance,
            base: { Id: idBase, Nombre: toText(base.Nombre).trim() || null },
            pasos: destino?.pasos ?? 0,
            origenes: conPasos,
        },
    };
}

/**
 * El tamaño `pasos` categorías por encima (o por debajo, si es negativo) del de `idBase`, por el orden de los ids de
 * `GET /tamanos` (Minúsculo 1 … Colosal 9), sin pasar de los extremos, y las categorías que se ha movido de verdad. La
 * fila 0 («Depende») no está en la escala. `null` si `idBase` no está en ella. Lo usan las aptitudes y los pasos de
 * tamaño de las plantillas.
 */
export function tamanoTrasPasos(catalogo: Tamano[], idBase: number, pasos: number): { tamano: Tamano; pasos: number; } | null {
    const escala = (catalogo ?? []).filter((tamano) => toInt(tamano?.Id) > 0).sort((a, b) => toInt(a.Id) - toInt(b.Id));
    const indiceBase = escala.findIndex((tamano) => toInt(tamano.Id) === toInt(idBase));
    if (indiceBase < 0)
        return null;
    const indiceFinal = Math.min(Math.max(indiceBase + toInt(pasos), 0), escala.length - 1);
    return { tamano: escala[indiceFinal], pasos: indiceFinal - indiceBase };
}

/** Las aptitudes que cambian el tamaño, limpias: su nombre sin espacios y sin las que no lo cambian. */
function origenesConPasos(origenes: any[] | null | undefined): OrigenTamano[] {
    return (Array.isArray(origenes) ? origenes : [])
        .map((origen) => ({ origen: toText(origen?.origen).trim(), pasos: toInt(origen?.pasos) }))
        .filter((origen) => origen.pasos !== 0);
}

function espacioYAlcance(
    filaBase: Tamano | null,
    fila: Tamano,
    espacio: number | null | undefined,
    alcance: number | null | undefined,
    cambia: boolean
): { espacio: number | null; alcance: number | null; } {
    const espacioRaza = toNumberOrNull(espacio) ?? toNumberOrNull(filaBase?.Espacio ?? fila.Espacio);
    const alcanceRaza = toNumberOrNull(alcance) ?? toNumberOrNull(filaBase?.Alcance ?? fila.Alcance);
    if (espacioRaza === null || alcanceRaza === null)
        return { espacio: espacioRaza, alcance: alcanceRaza };
    if (!cambia)
        return { espacio: espacioRaza, alcance: Math.trunc(alcanceRaza) };
    const largo = toInt(filaBase?.Alcance_largo) !== toInt(filaBase?.Alcance)
        && Math.trunc(alcanceRaza) === toInt(filaBase?.Alcance_largo);
    const alcanceFila = (tamano: Tamano | null) => toInt(largo ? tamano?.Alcance_largo : tamano?.Alcance);
    return {
        espacio: Math.max(0, espacioRaza + toNumber(fila.Espacio) - toNumber(filaBase?.Espacio)),
        alcance: Math.max(0, Math.trunc(alcanceRaza) + alcanceFila(fila) - alcanceFila(filaBase)),
    };
}

/** El bloque `tamano` de la ficha de la API (`PersonajeTamano`); `null` si no viene (sin raza). */
export function normalizarTamanoFicha(raw: any): PersonajeTamanoDto | null {
    if (!raw || typeof raw !== 'object')
        return null;
    return {
        id: toInt(raw?.id),
        nombre: toText(raw?.nombre).trim() || null,
        modificador: toInt(raw?.modificador),
        modificadorPresa: toInt(raw?.modificadorPresa),
        modificadorEsconderse: toInt(raw?.modificadorEsconderse),
        espacio: toNumberOrNull(raw?.espacio),
        alcance: toNumberOrNull(raw?.alcance),
        base: { Id: toInt(raw?.base?.Id), Nombre: toText(raw?.base?.Nombre).trim() || null },
        pasos: toInt(raw?.pasos),
        origenes: origenesConPasos(raw?.origenes),
    };
}
