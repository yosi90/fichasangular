import { EquipoObjetivoModificador } from 'src/app/interfaces/equipo';
import { RacialBonificadorContra, RacialDetalle } from 'src/app/interfaces/racial';
import {
    RacialCreateBonificadorCondicional,
    RacialCreateBonificadorContra,
    RacialCreateProgresion,
} from 'src/app/interfaces/raciales-api';
import { uidDeFila } from 'src/app/components/shared/insercion-marco/filas-repetibles';
import { mayusculaInicial } from './formato-registros';
import { toPositiveInt, toText } from './normalizacion';
import { momentoDeProgresion } from './racial-progresion';

/**
 * La progresión y los bonificadores condicionales de un rasgo racial en «Insertar/Modificar racial» (roadmap
 * `ACTIVO_razas-mutadas`; guía `docs/publica/RAZAS_MUTADAS.md`): sus filas, su lectura del `GET /razas/raciales/<id>`,
 * su cuerpo (`progresion[]` y `bonificadores_condicionales[]` del alta y la edición, `docs/publica/endpoints/catalogos.md`)
 * y lo que se comprueba antes de mandar, lo mismo que la API (`_normalize_racial_progresion` y
 * `_normalize_racial_bonificadores` de `api/controllers/racial_controller.py`). La ida y vuelta con los datos reales está
 * en `src/testing/ida-y-vuelta-raciales.ts`.
 */

/** Hasta dónde llega `desde` (DG o nivel) y lo largo que puede ser el `valor` de una fila de la progresión. */
export const MAXIMO_DESDE_PROGRESION = 100;
export const MAXIMO_VALOR_PROGRESION = 100;
/** La cantidad de un bonificador condicional va de -100 a 100, sin el 0; su condición, hasta 200 letras. */
export const MAXIMO_CANTIDAD_BONIFICADOR = 100;
export const MAXIMO_CONDICION_BONIFICADOR = 200;

export type MedidaProgresion = RacialCreateProgresion['medida'];
export type TipoVelocidadProgresion = NonNullable<RacialCreateProgresion['velocidad']>['tipo'];

export const MEDIDAS_PROGRESION: readonly { clave: MedidaProgresion; nombre: string; }[] = [
    { clave: 'dg', nombre: 'Dados de golpe' },
    { clave: 'nivel', nombre: 'Nivel de personaje' },
];

/** Los movimientos del contrato, como los nombra la frase de la API («velocidad volando 30'»). */
export const VELOCIDADES_PROGRESION: readonly { clave: TipoVelocidadProgresion; nombre: string; }[] = [
    { clave: 'correr', nombre: 'Terrestre' },
    { clave: 'nadar', nombre: 'Nadando' },
    { clave: 'volar', nombre: 'Volando' },
    { clave: 'trepar', nombre: 'Trepando' },
    { clave: 'excavar', nombre: 'Excavando' },
];

export interface FilaProgresionRacial {
    uid: string;
    medida: MedidaProgresion;
    desde: number | null;
    id_racial_gana: number | null;
    id_racial_sustituye: number | null;
    id_tipo_dote: number | null;
    /** `null`: no da movimiento. */
    velocidad: TipoVelocidadProgresion | null;
    pies: number | null;
    id_maniobrabilidad: number | null;
    valor: string;
}

export type CatalogoContra = RacialBonificadorContra['Catalogo'];

export const CATALOGOS_CONTRA: readonly { clave: CatalogoContra; nombre: string; }[] = [
    { clave: 'tipo_criatura', nombre: 'Tipo de criatura' },
    { clave: 'subtipo', nombre: 'Subtipo' },
    { clave: 'raza', nombre: 'Raza' },
];

const CLAVE_CONTRA: Record<CatalogoContra, 'id_tipo' | 'id_subtipo' | 'id_raza'> = {
    tipo_criatura: 'id_tipo',
    subtipo: 'id_subtipo',
    raza: 'id_raza',
};

export interface CriaturaContra {
    catalogo: CatalogoContra;
    id: number;
    nombre: string;
}

export interface FilaBonificadorRacial {
    uid: string;
    id_objetivo: number | null;
    id_tipo_bonificador: number | null;
    cantidad: number | null;
    condicion: string;
    contra: CriaturaContra[];
    /** De qué catálogo se añade la siguiente criatura. */
    catalogoContra: CatalogoContra;
}

export function filaProgresionVacia(): FilaProgresionRacial {
    return {
        uid: uidDeFila('progresion'), medida: 'dg', desde: null, id_racial_gana: null, id_racial_sustituye: null,
        id_tipo_dote: null, velocidad: null, pies: null, id_maniobrabilidad: null, valor: '',
    };
}

export function filaBonificadorVacia(): FilaBonificadorRacial {
    return {
        uid: uidDeFila('bonificador'), id_objetivo: null, id_tipo_bonificador: null, cantidad: null, condicion: '',
        contra: [], catalogoContra: 'tipo_criatura',
    };
}

/** Las filas de la progresión de un racial tal como llega del `GET` (sin catálogos: los ids salen del propio rasgo). */
export function filasDeProgresion(racial: RacialDetalle | null | undefined): FilaProgresionRacial[] {
    return (racial?.Progresion ?? []).map((fila) => {
        const tipo = VELOCIDADES_PROGRESION.find((v) => v.clave === toText(fila.Velocidad?.Tipo).toLowerCase())?.clave ?? null;
        return {
            ...filaProgresionVacia(),
            medida: fila.Medida === 'nivel' ? 'nivel' : 'dg',
            desde: Math.trunc(Number(fila.Desde)),
            id_racial_gana: toPositiveInt(fila.Gana?.Id),
            id_racial_sustituye: toPositiveInt(fila.Sustituye?.Id),
            id_tipo_dote: toPositiveInt(fila.Tipo_dote?.Id),
            velocidad: tipo,
            pies: tipo ? Math.trunc(Number(fila.Velocidad?.Pies)) : null,
            id_maniobrabilidad: tipo ? toPositiveInt(fila.Velocidad?.Maniobrabilidad?.Id) : null,
            valor: toText(fila.Valor).trim(),
        };
    });
}

/** Las filas de los bonificadores condicionales de un racial tal como llegan del `GET`. */
export function filasDeBonificadores(racial: RacialDetalle | null | undefined): FilaBonificadorRacial[] {
    return (racial?.Bonificadores_condicionales ?? []).map((b) => ({
        ...filaBonificadorVacia(),
        id_objetivo: toPositiveInt(b.Objetivo?.Id),
        id_tipo_bonificador: toPositiveInt(b.Tipo_bonificador?.Id),
        cantidad: Math.trunc(Number(b.Cantidad)),
        condicion: toText(b.Condicion).trim(),
        contra: (b.Contra ?? []).map((c) => ({ catalogo: c.Catalogo, id: Math.trunc(Number(c.Id)), nombre: toText(c.Nombre).trim() })),
    }));
}

/** `progresion[]` del cuerpo: cada fila con lo que tiene (sin las claves vacías). */
export function cuerpoDeProgresion(filas: readonly FilaProgresionRacial[]): RacialCreateProgresion[] {
    return filas.map((fila) => {
        const salida: RacialCreateProgresion = { medida: fila.medida, desde: Math.trunc(Number(fila.desde)) };
        if (toPositiveInt(fila.id_racial_gana))
            salida.id_racial_gana = toPositiveInt(fila.id_racial_gana)!;
        if (toPositiveInt(fila.id_racial_sustituye))
            salida.id_racial_sustituye = toPositiveInt(fila.id_racial_sustituye)!;
        if (toPositiveInt(fila.id_tipo_dote))
            salida.id_tipo_dote = toPositiveInt(fila.id_tipo_dote)!;
        if (fila.velocidad) {
            salida.velocidad = { tipo: fila.velocidad, pies: Math.trunc(Number(fila.pies)) };
            if (fila.velocidad === 'volar' && toPositiveInt(fila.id_maniobrabilidad))
                salida.velocidad.id_maniobrabilidad = toPositiveInt(fila.id_maniobrabilidad)!;
        }
        const valor = toText(fila.valor).trim();
        if (valor.length > 0)
            salida.valor = valor;
        return salida;
    });
}

/** `bonificadores_condicionales[]` del cuerpo. */
export function cuerpoDeBonificadores(filas: readonly FilaBonificadorRacial[]): RacialCreateBonificadorCondicional[] {
    return filas.map((fila) => ({
        id_objetivo: Math.trunc(Number(fila.id_objetivo)),
        id_tipo_bonificador: Math.trunc(Number(fila.id_tipo_bonificador)),
        cantidad: Math.trunc(Number(fila.cantidad)),
        condicion: toText(fila.condicion).trim(),
        contra: fila.contra.map((c) => ({ [CLAVE_CONTRA[c.catalogo]]: c.id }) as RacialCreateBonificadorContra),
    }));
}

function esEntero(valor: unknown): boolean {
    return valor !== null && valor !== undefined && `${valor}`.trim() !== '' && Number.isInteger(Number(valor));
}

/**
 * Lo que la API rechazaría de una fila de la progresión (la frase para quien edita), o `null` si vale. `idRacial`, el
 * del rasgo que se modifica (no se gana ni se sustituye a sí mismo).
 */
export function falloDeProgresion(fila: FilaProgresionRacial, indice: number, idRacial: number | null): string | null {
    const n = `Fila ${indice + 1} de la progresión`;
    if (!esEntero(fila.desde) || Number(fila.desde) < 1 || Number(fila.desde) > MAXIMO_DESDE_PROGRESION)
        return `${n}: «Desde» va de 1 a ${MAXIMO_DESDE_PROGRESION}.`;
    const valor = toText(fila.valor).trim();
    if (valor.length > MAXIMO_VALOR_PROGRESION)
        return `${n}: el valor no puede pasar de ${MAXIMO_VALOR_PROGRESION} letras.`;
    if (fila.velocidad && (!esEntero(fila.pies) || Number(fila.pies) < 1))
        return `${n}: la velocidad necesita sus pies (al menos 1).`;
    const daAlgo = toPositiveInt(fila.id_racial_gana) || toPositiveInt(fila.id_racial_sustituye) || toPositiveInt(fila.id_tipo_dote)
        || fila.velocidad || valor.length > 0;
    if (!daAlgo)
        return `${n}: tiene que dar o cambiar algo (un rasgo, uno que sustituye, un tipo de dote, una velocidad o un valor).`;
    if (idRacial !== null && idRacial > 0 && (fila.id_racial_gana === idRacial || fila.id_racial_sustituye === idRacial))
        return `${n}: un rasgo no se gana ni se sustituye a sí mismo.`;
    return null;
}

/**
 * Lo que la API rechazaría de un bonificador condicional, o `null` si vale. `objetivos`, los del catálogo: los que en
 * un rasgo van en su propia lista (`Lista_del_rasgo`) no valen aquí, y solo los de `De_siempre_en_el_rasgo` (la CA)
 * pueden ir sin condición (cuentan siempre: la esquiva del svirfneblin), y entonces sin criaturas.
 */
export function falloDeBonificador(fila: FilaBonificadorRacial, indice: number,
    objetivos: readonly EquipoObjetivoModificador[]): string | null {
    const n = `Bonificador ${indice + 1}`;
    if (!toPositiveInt(fila.id_objetivo))
        return `${n}: elige a qué se aplica.`;
    const objetivo = objetivos.find((o) => o.Id === fila.id_objetivo);
    const lista = objetivo?.Lista_del_rasgo ?? null;
    if (lista)
        return `${n}: ${DONDE_VA[lista]}.`;
    if (!toPositiveInt(fila.id_tipo_bonificador))
        return `${n}: elige su tipo de bonificador.`;
    if (!esEntero(fila.cantidad) || Number(fila.cantidad) === 0 || Math.abs(Number(fila.cantidad)) > MAXIMO_CANTIDAD_BONIFICADOR)
        return `${n}: la cantidad no puede ser 0 y va de -${MAXIMO_CANTIDAD_BONIFICADOR} a ${MAXIMO_CANTIDAD_BONIFICADOR}.`;
    const condicion = toText(fila.condicion).trim();
    if (condicion.length < 1 && !objetivo?.De_siempre_en_el_rasgo)
        return `${n}: la condición es obligatoria (el caso en que cuenta: «contra gigantes»). Sin condición (cuenta siempre) solo vale un bonificador a la CA.`;
    if (condicion.length < 1 && fila.contra.length > 0)
        return `${n}: la condición es obligatoria si cuenta contra unas criaturas («contra gigantes»).`;
    if (condicion.length > MAXIMO_CONDICION_BONIFICADOR)
        return `${n}: la condición no puede pasar de ${MAXIMO_CONDICION_BONIFICADOR} letras.`;
    const vistas = new Set<string>();
    for (const c of fila.contra) {
        const clave = `${c.catalogo}:${c.id}`;
        if (c.id < 0 || vistas.has(clave))
            return `${n}: «${c.nombre}» está repetida.`;
        vistas.add(clave);
    }
    return null;
}

const DONDE_VA: Record<NonNullable<EquipoObjetivoModificador['Lista_del_rasgo']>, string> = {
    salvaciones: 'las salvaciones van en «Salvaciones», con su condición',
    caracteristicas: 'las características van en «Características»',
    habilidades: 'las habilidades van en «Habilidades base», con su condición',
};

/** El primer fallo de las dos listas, con su paso: lo que comprueba el formulario antes de mandar. */
export function falloDeProgresionYBonificadores(progresion: readonly FilaProgresionRacial[],
    bonificadores: readonly FilaBonificadorRacial[], idRacial: number | null,
    objetivos: readonly EquipoObjetivoModificador[]): { lista: 'progresion' | 'bonificadores'; mensaje: string; } | null {
    for (const [indice, fila] of progresion.entries()) {
        const mensaje = falloDeProgresion(fila, indice, idRacial);
        if (mensaje)
            return { lista: 'progresion', mensaje };
    }
    for (const [indice, fila] of bonificadores.entries()) {
        const mensaje = falloDeBonificador(fila, indice, objetivos);
        if (mensaje)
            return { lista: 'bonificadores', mensaje };
    }
    return null;
}

/** «1 · A los 6 DG», el resumen de una fila de la progresión en su cabecera. */
export function resumenDeProgresion(fila: FilaProgresionRacial, indice: number): string {
    const desde = esEntero(fila.desde) ? Number(fila.desde) : null;
    if (desde === null)
        return `${indice + 1} · Sin «desde» todavía`;
    return `${indice + 1} · ${mayusculaInicial(momentoDeProgresion(fila.medida, desde))}`;
}
