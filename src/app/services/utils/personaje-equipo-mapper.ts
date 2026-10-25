import {
    PersonajeDefensaTotalesDto,
    PersonajeDineroDto,
    PersonajeEquipoPiezaDto,
    PersonajeModificadorEquipoDto,
    PersonajeNombreIdDto,
    PersonajeTipoPiezaDto,
} from 'src/app/interfaces/personajes-api';
import { toArray, toBoolean, toNullableText, toNumber, toNumberOrNull, toText } from 'src/app/services/utils/normalizacion';
import { normalizarTotal, totalVacio } from 'src/app/services/utils/personaje-totales';

/*
 * El equipo de la ficha que da la API (`equipo`, `modificadoresEquipo`, `defensa`, `pesoEquipo` y `dinero` de
 * `PersonajeDetalle`; `docs/publica/endpoints/personajes.md`, «El equipo de la ficha»).
 */

const TIPOS_PIEZA: ReadonlySet<string> = new Set(['arma', 'armadura', 'objeto', 'municion']);

function ref(raw: any): PersonajeNombreIdDto | null {
    if (!raw || typeof raw !== 'object')
        return null;
    return { id: toNumber(raw.id), nombre: toText(raw.nombre) };
}

function elementoBase(raw: any): PersonajeEquipoPiezaDto['elementoBase'] {
    const base = ref(raw);
    if (!base)
        return null;
    return { ...base, tipo: `${raw?.tipo ?? ''}` === 'armadura' ? 'armadura' : 'arma' };
}

export function normalizarPiezasEquipo(raw: any): PersonajeEquipoPiezaDto[] {
    return toArray(raw).map((pieza: any) => {
        const tipo = `${pieza?.tipo ?? ''}`;
        return {
            id: toNumber(pieza?.id),
            orden: toNumber(pieza?.orden),
            tipo: (TIPOS_PIEZA.has(tipo) ? tipo : 'objeto') as PersonajeTipoPiezaDto,
            elemento: ref(pieza?.elemento),
            nombre: toText(pieza?.nombre),
            cantidad: Math.max(1, toNumber(pieza?.cantidad, 1)),
            equipado: toBoolean(pieza?.equipado),
            ranura: ref(pieza?.ranura),
            empunadura: ref(pieza?.empunadura),
            tamano: ref(pieza?.tamano),
            material: ref(pieza?.material),
            granCalidad: toBoolean(pieza?.granCalidad),
            bonificadorMejora: toNumber(pieza?.bonificadorMejora),
            bonificadorMejora2: toNumberOrNull(pieza?.bonificadorMejora2),
            indiceFuerza: toNumberOrNull(pieza?.indiceFuerza),
            encantamientos: toArray(pieza?.encantamientos).map((enc: any) => ({
                id: toNumber(enc?.id),
                nombre: toText(enc?.nombre),
                cabeza: toNumber(enc?.cabeza, 1),
            })),
            conjuro: ref(pieza?.conjuro),
            nivelConjuro: toNumberOrNull(pieza?.nivelConjuro),
            nivelLanzador: toNumberOrNull(pieza?.nivelLanzador),
            cargasRestantes: toNumberOrNull(pieza?.cargasRestantes),
            notas: toNullableText(pieza?.notas),
            peso: toNumberOrNull(pieza?.peso),
            elementoBase: elementoBase(pieza?.elementoBase),
            arma: pieza?.arma && typeof pieza.arma === 'object'
                ? { dano: toNullableText(pieza.arma.dano), critico: toNullableText(pieza.arma.critico) }
                : null,
            armadura: pieza?.armadura && typeof pieza.armadura === 'object'
                ? {
                    esEscudo: toBoolean(pieza.armadura.esEscudo),
                    ca: toNumber(pieza.armadura.ca),
                    bonDes: toNumberOrNull(pieza.armadura.bonDes),
                    penalizador: toNumber(pieza.armadura.penalizador),
                    falloArcano: toNumber(pieza.armadura.falloArcano),
                }
                : null,
        };
    });
}

export function normalizarModificadoresEquipo(raw: any): PersonajeModificadorEquipoDto[] {
    return toArray(raw).map((mod: any) => {
        const tipo = ref(mod?.tipoBonificador);
        return {
            origen: toText(mod?.origen),
            objetivo: ref(mod?.objetivo),
            tipoBonificador: tipo ? { ...tipo, apila: toBoolean(mod?.tipoBonificador?.apila) } : null,
            valor: toNumber(mod?.valor),
            caracteristica: ref(mod?.caracteristica),
            habilidad: ref(mod?.habilidad),
            tipoDano: ref(mod?.tipoDano),
            condicion: toNullableText(mod?.condicion),
            sumado: toBoolean(mod?.sumado),
        };
    });
}

/** La defensa de la ficha; `null` si la API no la trae (fichas anteriores a la familia 1). */
export function normalizarDefensa(raw: any): PersonajeDefensaTotalesDto | null {
    if (!raw || typeof raw !== 'object')
        return null;
    return {
        ca: normalizarTotal(raw.ca) ?? totalVacio(),
        toque: normalizarTotal(raw.toque) ?? totalVacio(),
        desprevenido: normalizarTotal(raw.desprevenido) ?? totalVacio(),
        destrezaMaxima: toNumberOrNull(raw.destrezaMaxima),
        penalizadorArmadura: toNumber(raw.penalizadorArmadura),
        falloConjuroArcano: toNumber(raw.falloConjuroArcano),
    };
}

export function normalizarDinero(raw: any): PersonajeDineroDto | null {
    if (!raw || typeof raw !== 'object')
        return null;
    return { po: toNumber(raw.po), dineroInicial: toNumber(raw.dineroInicial) };
}
