import { toInt } from 'src/app/services/utils/normalizacion';

/**
 * Los DG totales y el nivel efectivo de personaje (NEP), una sola regla para la creación (la misma que la API,
 * `utils/nivel_efectivo.py`, y la ficha guardada, `nivelEfectivo`).
 *
 * - DG totales = niveles de clase + DG raciales de la raza + DG que añade cada plantilla. Los de una plantilla son los
 *   del animal base de un licántropo (`Licantronia_dg.Multiplicador`); una plantilla que actualiza los DG de la criatura
 *   (`Actualiza_dg`: liche, vampiro, fantasma) no añade ninguno.
 * - NEP = DG totales + ajuste de nivel de la raza, de cada plantilla y de cada subtipo (Guía del DM, cap. 6; Manual de
 *   monstruos: los PX de un personaje de raza monstruosa son los mínimos de su NEP).
 * - El primer DG del personaje: el primer DG racial si la raza tiene DG raciales; si no, su primer nivel de clase. Los DG
 *   de plantilla nunca son el primero (Manual de monstruos, «Licántropo»: el animal nunca es su primer DG).
 * - Una raza con 1 DG racial o menos lo cambia por su primer nivel de clase (Guía del DM, pág. 172; Manual de monstruos,
 *   «Monstruos y niveles de clase»): con algún nivel de clase, ese DG no cuenta en nada (PG, ataque base, salvaciones,
 *   habilidades, dotes, DG totales ni NEP). `dgsRacialesQueCuentan` es la regla; la API usa la misma
 *   (`dgs_raciales_que_cuentan`, `utils/nivel_efectivo.py`).
 */

/**
 * Los DG raciales que cuentan: con 1 DG racial o menos y algún nivel de clase, ninguno, porque el primer nivel de clase
 * ocupa su lugar (Guía del DM, pág. 172). Sin niveles de clase, los de la raza.
 */
export function dgsRacialesQueCuentan(dgsRaciales: number, nivelesClase: number): number {
    const dgs = Math.max(0, toInt(dgsRaciales));
    return dgs <= 1 && toInt(nivelesClase) > 0 ? 0 : dgs;
}

/**
 * Si la raza tiene un DG racial que su primer nivel de clase cambiaría (1 DG o menos, pero alguno): hasta saber si el
 * personaje termina sin clases, las habilidades y la dote de ese DG esperan.
 */
export function dgRacialSustituible(dgsRaciales: number): boolean {
    return toInt(dgsRaciales) > 0 && dgsRacialesQueCuentan(dgsRaciales, 1) === 0;
}

export interface PlantillaConDg {
    Actualiza_dg?: boolean | null;
    Licantronia_dg?: { Multiplicador?: number | null; } | null;
    Ajuste_nivel?: number | null;
}

export interface PartesNivelPersonaje {
    nivelesClase: number;
    dgsRaza: number;
    dgsPlantillas: number;
    ajusteRaza: number;
    ajustePlantillas: number;
    ajusteSubtipos: number;
}

/** Los DG que añade una plantilla (los del animal base de un licántropo), o 0 si actualiza los DG de la criatura. */
export function dgsDePlantilla(plantilla: PlantillaConDg | null | undefined): number {
    if (!plantilla || plantilla.Actualiza_dg)
        return 0;
    return Math.max(0, toInt(plantilla.Licantronia_dg?.Multiplicador));
}

export function dgsDePlantillas(plantillas: readonly (PlantillaConDg | null | undefined)[] | null | undefined): number {
    return (plantillas ?? []).reduce((acc, plantilla) => acc + dgsDePlantilla(plantilla), 0);
}

export function ajusteDePlantillas(plantillas: readonly (PlantillaConDg | null | undefined)[] | null | undefined): number {
    return (plantillas ?? []).reduce((acc, plantilla) => acc + toInt(plantilla?.Ajuste_nivel), 0);
}

/** Niveles de clase + DG raciales + DG de plantilla (los aumentos de característica y las dotes van por ellos). */
export function dgsTotales(partes: PartesNivelPersonaje): number {
    return Math.max(0, toInt(partes.nivelesClase) + Math.max(0, toInt(partes.dgsRaza)) + Math.max(0, toInt(partes.dgsPlantillas)));
}

/** DG totales + ajuste de nivel de la raza, de las plantillas y de los subtipos. */
export function nivelEfectivoPersonaje(partes: PartesNivelPersonaje): number {
    return Math.max(0, dgsTotales(partes) + toInt(partes.ajusteRaza) + toInt(partes.ajustePlantillas) + toInt(partes.ajusteSubtipos));
}

/** El primer DG del personaje es racial: la raza tiene DG raciales (los de plantilla no cuentan). */
export function primerDgEsRacial(partes: Pick<PartesNivelPersonaje, 'dgsRaza'>): boolean {
    return toInt(partes.dgsRaza) > 0;
}
