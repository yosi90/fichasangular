import { toInt } from 'src/app/services/utils/normalizacion';

/**
 * Los puntos de golpe de la creación (Manual del jugador, cap. 3, «Dado de golpe», y cap. 1, Constitución).
 *
 * - Cada DG da lo que sale en su dado (de 1 a sus caras) + el modificador de Constitución, con un mínimo de 1 por DG.
 * - Solo el primer DG del personaje da el máximo: el primer DG racial si la raza tiene 2 o más (Guía del DM, pág. 172:
 *   el ogro, 8 + 3d8 + Con × 4), y si no, el primer nivel de clase. Con DG raciales, ningún nivel de clase se maximiza.
 *   Los DG de una plantilla (los del animal de un licántropo) nunca son el primero.
 * - Una raza con 1 DG racial o menos cambia ese DG por el primer nivel de clase (Guía del DM, pág. 172: «las criaturas
 *   con 1 DG o menos tienen DG y rasgos de clase normales según su clase»): con algún nivel de clase, el DG racial no
 *   suma y el primer nivel de clase va al máximo.
 * - Los DG de plantilla suman a los PG como los demás.
 * - Las dotes: `bonoPorDg` (+N por DG: todos los DG, también los raciales y los de plantilla) y `bonoPlano` (Dureza).
 * - Las caras de cada dado salen de su nombre en los datos («d8» → 8) y la escalera de dados para los cambios de las
 *   plantillas (+1 paso…), del catálogo de tipos de dado ordenado por caras.
 */

/**
 * Las tiradas de PG al crear (`politicaCreacion.maxTiradasPuntosGolpe`): 1 es el Manual del jugador y 3, el máximo, que
 * es también lo que se deja sin campaña o con una campaña que no las limita (propietario, 2026-10-26).
 */
export const MIN_TIRADAS_PUNTOS_GOLPE = 1;
export const MAX_TIRADAS_PUNTOS_GOLPE = 3;

/** Las tiradas de PG de una política, entre el mínimo y el máximo; sin dato (`null` o no numérico), el máximo. */
export function tiradasPuntosGolpe(valor: unknown): number {
    const parsed = Math.trunc(Number(valor));
    if (valor === null || valor === undefined || !Number.isFinite(parsed))
        return MAX_TIRADAS_PUNTOS_GOLPE;
    return Math.min(MAX_TIRADAS_PUNTOS_GOLPE, Math.max(MIN_TIRADAS_PUNTOS_GOLPE, parsed));
}

export interface GrupoDadosGolpe {
    cantidad: number;
    caras: number;
}

export interface EntradaPuntosGolpe {
    dgsRaciales: GrupoDadosGolpe;
    /** Los niveles de cada clase, en el orden en que se cogieron (el primero es la primera clase del personaje). */
    nivelesClase: GrupoDadosGolpe[];
    dgsPlantillas: GrupoDadosGolpe[];
    modConstitucion: number;
    bonoPorDg: number;
    bonoPlano: number;
    /** Una tirada de 1 a `caras`. */
    tirar: (caras: number) => number;
}

export interface ResultadoPuntosGolpe {
    total: number;
    maximo: number;
    tiradas: number;
    /** Los DG raciales que han contado (`dgsRacialesQueCuentan`). */
    dgsRaciales: number;
}

/** Las caras de un dado por su nombre en los datos («d8», «D10») o 0 si no lo dice. */
export function carasDado(nombre: unknown): number {
    const encontrado = `${nombre ?? ''}`.match(/d\s*(\d+)/i);
    return encontrado ? Math.max(0, toInt(encontrado[1])) : 0;
}

/** Sube o baja `pasos` por la escalera de dados (las caras de los tipos de dado del catálogo, de menos a más). */
export function dadoTrasPasos(caras: number, pasos: number, escalera: readonly number[]): number {
    const ordenada = [...new Set(escalera.filter((c) => c > 0))].sort((a, b) => a - b);
    const indice = ordenada.indexOf(toInt(caras));
    if (indice < 0 || toInt(pasos) === 0)
        return caras;
    return ordenada[Math.max(0, Math.min(ordenada.length - 1, indice + toInt(pasos)))];
}

/**
 * Los DG raciales que cuentan: con 1 DG racial o menos y algún nivel de clase, ninguno, porque el primer nivel de clase
 * ocupa su lugar (Guía del DM, pág. 172). Sin niveles de clase, los de la raza.
 */
export function dgsRacialesQueCuentan(dgsRaciales: number, nivelesClase: number): number {
    const dgs = Math.max(0, toInt(dgsRaciales));
    return dgs <= 1 && toInt(nivelesClase) > 0 ? 0 : dgs;
}

export function calcularPuntosGolpe(entrada: EntradaPuntosGolpe): ResultadoPuntosGolpe {
    const con = toInt(entrada.modConstitucion);
    const bonoPorDg = toInt(entrada.bonoPorDg);
    const nivelesClase = entrada.nivelesClase.reduce((acc, grupo) => acc + Math.max(0, toInt(grupo.cantidad)), 0);
    const dgsRaciales = dgsRacialesQueCuentan(entrada.dgsRaciales.cantidad, nivelesClase);
    let total = 0;
    let maximo = 0;
    let tiradas = 0;
    let primerDgPendiente = true;

    const sumarDg = (caras: number, maximizar: boolean) => {
        const dado = Math.max(1, toInt(caras));
        const resultado = maximizar ? dado : entrada.tirar(dado);
        if (!maximizar)
            tiradas++;
        total += Math.max(1, resultado + con) + bonoPorDg;
        maximo += Math.max(1, dado + con) + bonoPorDg;
    };

    for (let i = 0; i < dgsRaciales; i++) {
        sumarDg(entrada.dgsRaciales.caras, primerDgPendiente);
        primerDgPendiente = false;
    }
    entrada.nivelesClase.forEach((grupo) => {
        for (let i = 0; i < toInt(grupo.cantidad); i++) {
            sumarDg(grupo.caras, primerDgPendiente);
            primerDgPendiente = false;
        }
    });
    entrada.dgsPlantillas.forEach((grupo) => {
        for (let i = 0; i < toInt(grupo.cantidad); i++)
            sumarDg(grupo.caras, false);
    });

    total += toInt(entrada.bonoPlano);
    maximo += toInt(entrada.bonoPlano);
    return { total: Math.max(1, total), maximo: Math.max(1, maximo), tiradas, dgsRaciales };
}
