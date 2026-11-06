import { ClaseProgressionCatalogItem } from 'src/app/interfaces/clase';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { primerEntero, toInt } from 'src/app/services/utils/normalizacion';

/**
 * Las progresiones de ataque base y de salvaciones (`GET /clases/catalogos/progresion`: las filas de `ataques_base` y
 * `salvaciones`, del nivel o DG 1 al 20) y lo que dan unos DG de un tipo de criatura. Es la misma regla que la API
 * (`utils/progresiones.py`): «+6/+1» cuenta +6 y, pasados los 20, la progresión sigue su ritmo, que en 3.5 se repite
 * cada 12.
 */

export const CICLO_PROGRESION = 12;

export interface CatalogoProgresiones {
    ataques_base: readonly ClaseProgressionCatalogItem[];
    salvaciones: readonly ClaseProgressionCatalogItem[];
}

/** Lo que dan unos DG por su tipo: el ataque base y las tres salvaciones base. */
export interface BasesDeDgs {
    ataqueBase: number;
    fortaleza: number;
    reflejos: number;
    voluntad: number;
}

/** El valor de una progresión (sus valores del 1 al 20) a esos niveles o DG; 0 sin niveles. */
export function valorDeProgresion(valores: readonly unknown[] | null | undefined, dgs: number): number {
    const numeros = (valores ?? []).map((valor) => primerEntero(`${valor ?? ''}`) ?? 0);
    const niveles = toInt(dgs);
    if (niveles <= 0 || numeros.length < 1)
        return 0;
    if (niveles <= numeros.length)
        return numeros[niveles - 1];
    if (numeros.length <= CICLO_PROGRESION)
        return numeros[numeros.length - 1];
    return valorDeProgresion(numeros, niveles - CICLO_PROGRESION)
        + numeros[numeros.length - 1] - numeros[numeros.length - 1 - CICLO_PROGRESION];
}

/**
 * El ataque base y las salvaciones base de `dgs` DG de un tipo de criatura, por sus progresiones (`Id_ataque`,
 * `Id_fortaleza`, `Id_reflejos`, `Id_voluntad`): un animal de 2 DG, +1 y Fort +3, Ref +3, Vol +0 (Manual de monstruos,
 * cap. 7, «Animal»). `null` si falta el tipo o alguna de sus progresiones en el catálogo.
 */
export function basesDeDgsDelTipo(
    tipo: Pick<TipoCriatura, 'Id_ataque' | 'Id_fortaleza' | 'Id_reflejos' | 'Id_voluntad'> | null | undefined,
    dgs: number,
    catalogo: CatalogoProgresiones | null | undefined,
): BasesDeDgs | null {
    if (!tipo || !catalogo)
        return null;
    const buscar = (filas: readonly ClaseProgressionCatalogItem[], id: number) =>
        toInt(id) > 0 ? (filas ?? []).find((fila) => toInt(fila?.Id) === toInt(id)) ?? null : null;
    const ataque = buscar(catalogo.ataques_base, tipo.Id_ataque);
    const fortaleza = buscar(catalogo.salvaciones, tipo.Id_fortaleza);
    const reflejos = buscar(catalogo.salvaciones, tipo.Id_reflejos);
    const voluntad = buscar(catalogo.salvaciones, tipo.Id_voluntad);
    if (!ataque || !fortaleza || !reflejos || !voluntad)
        return null;
    return {
        ataqueBase: valorDeProgresion(ataque.Valores, dgs),
        fortaleza: valorDeProgresion(fortaleza.Valores, dgs),
        reflejos: valorDeProgresion(reflejos.Valores, dgs),
        voluntad: valorDeProgresion(voluntad.Valores, dgs),
    };
}
