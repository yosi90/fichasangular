import { EquipoObjetivoModificador } from 'src/app/interfaces/equipo';
import { RacialBonificadorContra, RacialCuentaComo, RacialDetalle } from 'src/app/interfaces/racial';
import {
    RacialCreateBonificadorCondicional,
    RacialCreateBonificadorContra,
    RacialCreateCuentaComo,
    RacialCreateProgresion,
} from 'src/app/interfaces/raciales-api';
import { uidDeFila } from 'src/app/components/shared/insercion-marco/filas-repetibles';
import type { FilaDeLista } from 'src/app/components/shared/lista-de-catalogo/lista-de-catalogo.component';
import { mayusculaInicial } from './formato-registros';
import { toPositiveInt, toText } from './normalizacion';
import { momentoDeProgresion } from './racial-progresion';

/**
 * La progresión, los bonificadores condicionales y el «cuenta como» de un rasgo racial en «Insertar/Modificar racial»
 * (roadmap `FINALIZADO_razas-mutadas`; guía `docs/publica/RAZAS_MUTADAS.md`): sus filas, su lectura del
 * `GET /razas/raciales/<id>`, su cuerpo (`progresion[]`, `bonificadores_condicionales[]` y `cuenta_como[]` del alta y la
 * edición, `docs/publica/endpoints/catalogos.md`) y lo que se comprueba antes de mandar, lo mismo que la API
 * (`_normalize_racial_progresion`, `_normalize_racial_bonificadores` y `_normalize_racial_cuenta_como` de
 * `api/controllers/racial_controller.py`). La ida y vuelta con los datos reales está en `src/testing/ida-y-vuelta-raciales.ts`.
 */

/** Hasta dónde llega `desde` (DG o nivel) y lo largo que puede ser el `valor` de una fila de la progresión. */
export const MAXIMO_DESDE_PROGRESION = 100;
export const MAXIMO_VALOR_PROGRESION = 100;
/** El número más alto de un grupo opcional de rasgos (`elige_opcional`, como `Opcional` de los rasgos de una raza). */
export const MAXIMO_GRUPO_OPCIONAL = 99;
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
    /** El grupo opcional de su raza del que elige otro rasgo (el segundo sigilo de poder); `null`, ninguno. */
    elige_opcional: number | null;
}

export type CatalogoCuentaComo = RacialCuentaComo['Catalogo'];

/** Los catálogos del «cuenta como» que admite la API (`id_raza` o `id_tipo`), con el título de su lista. */
export const CATALOGOS_CUENTA_COMO: readonly { clave: CatalogoCuentaComo; titulo: string; vacio: string; }[] = [
    { clave: 'raza', titulo: 'Cuenta como raza', vacio: 'No cuenta como otra raza (la sangre élfica del semielfo cuenta como elfo).' },
    { clave: 'tipo_criatura', titulo: 'Cuenta como tipo de criatura', vacio: 'No cuenta como otro tipo (la sangre de gigante del semiogro, como gigante).' },
];

/** Una raza o un tipo como el que cuenta quien tiene el rasgo; las filas van en su orden, el de la API. */
export interface FilaCuentaComo extends FilaDeLista {
    uid: string;
    catalogo: CatalogoCuentaComo;
    id: number;
    nombre: string;
}

export type CatalogoContra = RacialBonificadorContra['Catalogo'];

export const CATALOGOS_CONTRA: readonly { clave: CatalogoContra; nombre: string; }[] = [
    { clave: 'tipo_criatura', nombre: 'Tipo de criatura' },
    { clave: 'subtipo', nombre: 'Subtipo' },
    { clave: 'raza', nombre: 'Raza' },
];

/** La clave de cada catálogo en el cuerpo, la de `contra[]` y la de `cuenta_como[]` (`CATALOGOS_CONTRA` de la API). */
const CLAVE_DE_CRIATURA: Record<CatalogoContra, 'id_tipo' | 'id_subtipo' | 'id_raza'> = {
    tipo_criatura: 'id_tipo',
    subtipo: 'id_subtipo',
    raza: 'id_raza',
};

/** Una criatura de una lista del racial: las de `contra` de un bonificador y las del «cuenta como». */
export interface CriaturaDelRacial<C extends CatalogoContra = CatalogoContra> {
    catalogo: C;
    id: number;
    nombre: string;
}

/** Una criatura tal como llega del `GET` (`Contra` de un bonificador, `Cuenta_como` de un racial). */
function criaturaDelGet<C extends CatalogoContra>(c: { Catalogo: C; Id: unknown; Nombre: unknown; }): CriaturaDelRacial<C> {
    return { catalogo: c.Catalogo, id: Math.trunc(Number(c.Id)), nombre: toText(c.Nombre).trim() };
}

/** Una criatura en el cuerpo: `{ id_tipo }`, `{ id_subtipo }` o `{ id_raza }`. */
function cuerpoDeCriatura(c: CriaturaDelRacial): RacialCreateBonificadorContra {
    return { [CLAVE_DE_CRIATURA[c.catalogo]]: c.id } as RacialCreateBonificadorContra;
}

export interface FilaBonificadorRacial {
    uid: string;
    id_objetivo: number | null;
    id_tipo_bonificador: number | null;
    cantidad: number | null;
    condicion: string;
    contra: CriaturaDelRacial[];
    /** De qué catálogo se añade la siguiente criatura. */
    catalogoContra: CatalogoContra;
    /** La de las pruebas de característica y habilidades (`Caracteristica_en_el_rasgo` del objetivo). */
    id_caracteristica: number | null;
    /** Si la cantidad sigue la cifra del rasgo (`Valor` de su progresión: el sigilo de poder, +2 desde nivel 2). */
    cantidad_del_valor: boolean;
    /** Si no pasa de los DG del personaje (krau, al nivel de lanzador). */
    tope_dg: boolean;
}

export function filaProgresionVacia(): FilaProgresionRacial {
    return {
        uid: uidDeFila('progresion'), medida: 'dg', desde: null, id_racial_gana: null, id_racial_sustituye: null,
        id_tipo_dote: null, velocidad: null, pies: null, id_maniobrabilidad: null, valor: '', elige_opcional: null,
    };
}

export function filaBonificadorVacia(): FilaBonificadorRacial {
    return {
        uid: uidDeFila('bonificador'), id_objetivo: null, id_tipo_bonificador: null, cantidad: null, condicion: '',
        contra: [], catalogoContra: 'tipo_criatura', id_caracteristica: null, cantidad_del_valor: false, tope_dg: false,
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
            elige_opcional: toPositiveInt(fila.Elige_opcional),
        };
    });
}

/** El «cuenta como» de un racial tal como llega del `GET`, en su orden. */
export function filasDeCuentaComo(racial: RacialDetalle | null | undefined): FilaCuentaComo[] {
    return (racial?.Cuenta_como ?? []).map((c) => {
        const { catalogo, id, nombre } = criaturaDelGet(c);
        return filaCuentaComo(catalogo, id, nombre);
    });
}

export function filaCuentaComo(catalogo: CatalogoCuentaComo, id: number, nombre: string): FilaCuentaComo {
    return { uid: uidDeFila('cuenta-como'), catalogo, id, nombre };
}

/** `cuenta_como[]` del cuerpo, en el orden de las filas. */
export function cuerpoDeCuentaComo(filas: readonly FilaCuentaComo[]): RacialCreateCuentaComo[] {
    return filas.map(cuerpoDeCriatura) as RacialCreateCuentaComo[];
}

/** Las filas de los bonificadores condicionales de un racial tal como llegan del `GET`. */
export function filasDeBonificadores(racial: RacialDetalle | null | undefined): FilaBonificadorRacial[] {
    return (racial?.Bonificadores_condicionales ?? []).map((b) => ({
        ...filaBonificadorVacia(),
        id_objetivo: toPositiveInt(b.Objetivo?.Id),
        id_tipo_bonificador: toPositiveInt(b.Tipo_bonificador?.Id),
        cantidad: Math.trunc(Number(b.Cantidad)),
        condicion: toText(b.Condicion).trim(),
        contra: (b.Contra ?? []).map(criaturaDelGet),
        id_caracteristica: toPositiveInt(b.Caracteristica?.Id),
        cantidad_del_valor: b.Cantidad_del_valor === true,
        tope_dg: b.Tope_dg === true,
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
        if (esEntero(fila.elige_opcional))
            salida.elige_opcional = Math.trunc(Number(fila.elige_opcional));
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
        contra: fila.contra.map(cuerpoDeCriatura),
        id_caracteristica: toPositiveInt(fila.id_caracteristica),
        cantidad_del_valor: fila.cantidad_del_valor === true,
        tope_dg: fila.tope_dg === true,
    }));
}

function vacio(valor: unknown): boolean {
    return valor === null || valor === undefined || `${valor}`.trim() === '';
}

function esEntero(valor: unknown): boolean {
    return !vacio(valor) && Number.isInteger(Number(valor));
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
    const eligeOpcional = !vacio(fila.elige_opcional);
    if (eligeOpcional && (!esEntero(fila.elige_opcional) || Number(fila.elige_opcional) < 1
        || Number(fila.elige_opcional) > MAXIMO_GRUPO_OPCIONAL))
        return `${n}: «Otro rasgo del grupo opcional» va de 1 a ${MAXIMO_GRUPO_OPCIONAL}.`;
    const daAlgo = toPositiveInt(fila.id_racial_gana) || toPositiveInt(fila.id_racial_sustituye) || toPositiveInt(fila.id_tipo_dote)
        || fila.velocidad || valor.length > 0 || eligeOpcional;
    if (!daAlgo)
        return `${n}: tiene que dar o cambiar algo (un rasgo, uno que sustituye, un tipo de dote, una velocidad, un valor o `
            + 'una elección más de un grupo opcional).';
    if (idRacial !== null && idRacial > 0 && (fila.id_racial_gana === idRacial || fila.id_racial_sustituye === idRacial))
        return `${n}: un rasgo no se gana ni se sustituye a sí mismo.`;
    return null;
}

/**
 * Lo que la API rechazaría de un bonificador condicional, o `null` si vale. `objetivos`, los del catálogo: los que en
 * un rasgo van en su propia lista (`Lista_del_rasgo`) no valen aquí; solo los de `De_siempre_en_el_rasgo` (la CA, las
 * pruebas de característica y el nivel de lanzador) pueden ir sin condición (cuentan siempre: la esquiva del svirfneblin),
 * y entonces sin criaturas; la característica la piden los de `Caracteristica_en_el_rasgo`, y solo ellos; y el tipo no
 * puede ser uno de los `Tipos_no_validos` del objetivo (la «Mejora» a la CA). Las frases, las de la API.
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
    if (objetivo?.Tipos_no_validos.some((t) => t.Id === fila.id_tipo_bonificador))
        return `${n}: con «${objetivo.Nombre}» no vale el tipo ${objetivo.Tipos_no_validos.map((t) => `«${t.Nombre}»`).join(', ')}.`;
    if (!esEntero(fila.cantidad) || Number(fila.cantidad) === 0 || Math.abs(Number(fila.cantidad)) > MAXIMO_CANTIDAD_BONIFICADOR)
        return `${n}: la cantidad no puede ser 0 y va de -${MAXIMO_CANTIDAD_BONIFICADOR} a ${MAXIMO_CANTIDAD_BONIFICADOR}.`;
    const condicion = toText(fila.condicion).trim();
    if (condicion.length < 1 && !objetivo?.De_siempre_en_el_rasgo) {
        const deSiempre = objetivos.filter((o) => o.De_siempre_en_el_rasgo).map((o) => `«${o.Nombre}»`).join(', ');
        return `${n}: la condición es obligatoria (el caso en que cuenta: «contra gigantes»). Sin condición (cuenta siempre) solo vale un bonificador a ${deSiempre}.`;
    }
    const caracteristica = toPositiveInt(fila.id_caracteristica);
    if (objetivo?.Caracteristica_en_el_rasgo && !caracteristica)
        return `${n}: elige de qué característica.`;
    if (!objetivo?.Caracteristica_en_el_rasgo && caracteristica)
        return `${n}: la característica solo vale con un objetivo que pide una característica (las pruebas de característica y habilidades).`;
    if (condicion.length < 1 && fila.contra.length > 0)
        return `${n}: la condición es obligatoria si cuenta contra unas criaturas («contra gigantes»).`;
    if (condicion.length > MAXIMO_CONDICION_BONIFICADOR)
        return `${n}: la condición no puede pasar de ${MAXIMO_CONDICION_BONIFICADOR} letras.`;
    const criatura = falloDeCriaturas(fila.contra);
    return criatura ? `${n}, contra: ${criatura}` : null;
}

/**
 * La primera criatura de una lista que la API rechazaría (un id que no vale o repetido en su catálogo), como
 * `_criaturas_del_cuerpo` de la API, que valida igual `contra[]` de un bonificador y `cuenta_como[]` de un racial; `null`
 * si valen todas.
 */
function falloDeCriaturas(criaturas: readonly CriaturaDelRacial[]): string | null {
    const vistas = new Set<string>();
    for (const c of criaturas) {
        const clave = `${c.catalogo}:${c.id}`;
        if (!Number.isInteger(c.id) || c.id < 0 || vistas.has(clave))
            return `«${c.nombre || c.id}» no es válido o está repetido.`;
        vistas.add(clave);
    }
    return null;
}

const DONDE_VA: Record<NonNullable<EquipoObjetivoModificador['Lista_del_rasgo']>, string> = {
    salvaciones: 'las salvaciones van en «Salvaciones», con su condición',
    caracteristicas: 'las características van en «Características»',
    habilidades: 'las habilidades van en «Habilidades base», con su condición',
};

/** Lo que la API rechazaría del «cuenta como» (una raza o un tipo repetido, un id que no vale), o `null` si vale. */
export function falloDeCuentaComo(filas: readonly FilaCuentaComo[]): string | null {
    const criatura = falloDeCriaturas(filas);
    return criatura ? `Cuenta como: ${criatura}` : null;
}

/** Las listas del racial que se comprueban antes de mandar, cada una en su paso. */
export interface ListasDelRacial {
    progresion: readonly FilaProgresionRacial[];
    bonificadores: readonly FilaBonificadorRacial[];
    cuentaComo: readonly FilaCuentaComo[];
}

/** El primer fallo de las listas, con la lista: lo que comprueba el formulario antes de mandar (en el orden de la API). */
export function falloDeListasDelRacial(listas: ListasDelRacial, idRacial: number | null,
    objetivos: readonly EquipoObjetivoModificador[]): { lista: keyof ListasDelRacial; mensaje: string; } | null {
    for (const [indice, fila] of listas.progresion.entries()) {
        const mensaje = falloDeProgresion(fila, indice, idRacial);
        if (mensaje)
            return { lista: 'progresion', mensaje };
    }
    for (const [indice, fila] of listas.bonificadores.entries()) {
        const mensaje = falloDeBonificador(fila, indice, objetivos);
        if (mensaje)
            return { lista: 'bonificadores', mensaje };
    }
    const mensaje = falloDeCuentaComo(listas.cuentaComo);
    return mensaje ? { lista: 'cuentaComo', mensaje } : null;
}

/** «1 · A los 6 DG», el resumen de una fila de la progresión en su cabecera. */
export function resumenDeProgresion(fila: FilaProgresionRacial, indice: number): string {
    const desde = esEntero(fila.desde) ? Number(fila.desde) : null;
    if (desde === null)
        return `${indice + 1} · Sin «desde» todavía`;
    return `${indice + 1} · ${mayusculaInicial(momentoDeProgresion(fila.medida, desde))}`;
}
