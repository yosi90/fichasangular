import { toInt } from 'src/app/services/utils/normalizacion';

/**
 * Los puntos de golpe de la creación (Manual del jugador, cap. 3, «Dado de golpe», y cap. 1, Constitución).
 *
 * - Cada DG da lo que sale en su dado (de 1 a sus caras) + el modificador de Constitución, con un mínimo de 1 por DG.
 * - Solo el primer DG del personaje da el máximo, y solo si es un nivel de clase: si el personaje tiene DG raciales, su
 *   primer DG fue racial y ningún nivel de clase se maximiza (los DG raciales no se maximizan). Los DG de una plantilla
 *   (los del animal de un licántropo) nunca son el primero.
 * - Los DG de plantilla suman a los PG como los demás.
 * - Las dotes: `bonoPorDg` (+N por DG: todos los DG, también los raciales y los de plantilla) y `bonoPlano` (Dureza).
 * - Las caras de cada dado salen de su nombre en los datos («d8» → 8) y la escalera de dados para los cambios de las
 *   plantillas (+1 paso…), del catálogo de tipos de dado ordenado por caras.
 */

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

export function calcularPuntosGolpe(entrada: EntradaPuntosGolpe): ResultadoPuntosGolpe {
    const con = toInt(entrada.modConstitucion);
    const bonoPorDg = toInt(entrada.bonoPorDg);
    let total = 0;
    let maximo = 0;
    let tiradas = 0;
    let primerDgPendiente = toInt(entrada.dgsRaciales.cantidad) < 1;

    const sumarDg = (caras: number, maximizar: boolean) => {
        const dado = Math.max(1, toInt(caras));
        const resultado = maximizar ? dado : entrada.tirar(dado);
        if (!maximizar)
            tiradas++;
        total += Math.max(1, resultado + con) + bonoPorDg;
        maximo += Math.max(1, dado + con) + bonoPorDg;
    };

    for (let i = 0; i < toInt(entrada.dgsRaciales.cantidad); i++)
        sumarDg(entrada.dgsRaciales.caras, false);
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
    return { total: Math.max(1, total), maximo: Math.max(1, maximo), tiradas };
}
