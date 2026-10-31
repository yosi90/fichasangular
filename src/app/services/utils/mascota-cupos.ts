import { Clase } from 'src/app/interfaces/clase';
import { Personaje } from 'src/app/interfaces/personaje';
import { normalizarTexto, toInt, toNumber } from 'src/app/services/utils/normalizacion';

/** Una clase del personaje que le da la mascota (el familiar o el compañero animal), con su nivel. */
export interface MascotaFuenteClase {
    idClase: number;
    nombreClase: string;
    nivelActual: number;
}

/** Las clases que dan la mascota y su cupo. */
export interface CupoMascota {
    fuentes: MascotaFuenteClase[];
    fuentesClaseIds: number[];
    fuentesTotales: number;
    cuposConsumidos: number;
    cuposDisponibles: number;
}

/** Los ids de las clases que dan la mascota (`CupoMascota.fuentesClaseIds`), como conjunto y sin los que no son ids. */
export function idsClasesFuente(fuentesClaseIds: readonly unknown[] | null | undefined): Set<number> {
    return new Set((fuentesClaseIds ?? []).map((id) => toNumber(id)).filter((id) => id > 0));
}

/** Cada clase una vez, con su nivel más alto. */
function sinFuentesRepetidas(fuentes: MascotaFuenteClase[]): MascotaFuenteClase[] {
    const byClassId = new Map<number, MascotaFuenteClase>();
    fuentes.forEach((fuente) => {
        const idClase = toNumber(fuente?.idClase);
        if (idClase <= 0)
            return;
        if (!byClassId.has(idClase)) {
            byClassId.set(idClase, {
                idClase,
                nombreClase: `${fuente?.nombreClase ?? ''}`.trim(),
                nivelActual: Math.max(0, toNumber(fuente?.nivelActual)),
            });
            return;
        }
        const previa = byClassId.get(idClase)!;
        if (toNumber(fuente?.nivelActual) > toNumber(previa?.nivelActual))
            byClassId.set(idClase, { ...previa, nivelActual: Math.max(0, toNumber(fuente?.nivelActual)) });
    });
    return Array.from(byClassId.values());
}

/**
 * Las clases del personaje que le dan la mascota (`otorgaFuente`) y su cupo: una sola mascota de cada clase de mascota por
 * personaje (MJ, cap. 3), aunque la den varias clases; sus niveles se suman para ella. `mascotas`, las que ya tiene.
 */
export function resolverCupoMascota(
    personaje: Personaje,
    catalogoClases: Clase[],
    otorgaFuente: (clase: Clase | undefined, nivelActual: number) => boolean,
    mascotas: readonly unknown[] | null | undefined
): CupoMascota {
    const desglose = Array.isArray(personaje?.desgloseClases) ? personaje.desgloseClases : [];
    const clases = Array.isArray(catalogoClases) ? catalogoClases : [];

    const fuentesRaw: MascotaFuenteClase[] = desglose.map((entrada) => {
        const nombreClase = `${entrada?.Nombre ?? ''}`.trim();
        const nivelActual = Math.max(0, toInt(entrada?.Nivel));
        const clase = clases.find((item) =>
            normalizarTexto(item?.Nombre ?? '') === normalizarTexto(nombreClase)
        );
        if (!otorgaFuente(clase, nivelActual))
            return null;
        return {
            idClase: toNumber(clase?.Id),
            nombreClase: `${clase?.Nombre ?? nombreClase}`.trim(),
            nivelActual,
        };
    }).filter((item): item is MascotaFuenteClase => !!item);

    const fuentes = sinFuentesRepetidas(fuentesRaw);
    const fuentesClaseIds = fuentes
        .map((fuente) => toNumber(fuente?.idClase))
        .filter((id) => id > 0);
    const fuentesTotales = fuentesClaseIds.length;
    const cuposConsumidos = (mascotas ?? []).length;
    const cuposDisponibles = Math.max(0, (fuentesTotales > 0 ? 1 : 0) - cuposConsumidos);

    return { fuentes, fuentesClaseIds, fuentesTotales, cuposConsumidos, cuposDisponibles };
}
