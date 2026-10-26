import { DeidadDetalle } from 'src/app/interfaces/deidad';
import {
    AlineamientoVector,
    distanciaEntreAlineamientos,
    getAlineamientoBasicoIdPorNombre,
    getVectorDesdeIdBasico,
    getVectorDesdeNombreBasico,
} from './alineamiento-contrato';

/**
 * El alineamiento de una deidad como vector (ley, moral): por su básico (`Alineamiento.Id_basico`) o, sin él, por su
 * nombre; `null` sin deidad o sin alineamiento interpretable. Lo usan la regla del clérigo y los conjuros opuestos.
 */
export function vectorAlineamientoDeidad(deidad: Pick<DeidadDetalle, 'Alineamiento'> | null | undefined): AlineamientoVector | null {
    if (!deidad)
        return null;
    return getVectorDesdeIdBasico(Number(deidad.Alineamiento?.Id_basico))
        ?? getVectorDesdeNombreBasico(`${deidad.Alineamiento?.Nombre ?? ''}`);
}

/**
 * La regla del alineamiento de la deidad de las clases con `Alineamiento_deidad` (MJ cap. 3, clérigo): a un paso del
 * alineamiento de su deidad (en un eje, no en los dos) y neutral solo si la deidad también lo es; si la deidad tiene
 * `Alineamientos_devotos` (San Cuthbert: LB o LN), solo esos. Devuelve el motivo si no se cumple, o `null` si se cumple
 * o no se puede saber (sin deidad o sin alineamiento interpretable).
 */
export function incumpleAlineamientoDeidad(alineamiento: string, deidad: DeidadDetalle | null | undefined): string | null {
    if (!deidad)
        return null;
    const personaje = getVectorDesdeNombreBasico(alineamiento);
    const vectorDeidad = vectorAlineamientoDeidad(deidad);
    if (!personaje || !vectorDeidad)
        return null;

    const permitidos = deidad.Alineamientos_devotos ?? [];
    if (permitidos.length > 0) {
        const idPersonaje = getAlineamientoBasicoIdPorNombre(alineamiento);
        return permitidos.some((item) => Number(item.Id) === idPersonaje)
            ? null
            : `Los devotos de ${deidad.Nombre} solo pueden ser ${permitidos.map((item) => item.Nombre.toLowerCase()).join(' o ')}`;
    }

    if (distanciaEntreAlineamientos(personaje, vectorDeidad) > 1)
        return `Debe estar a un paso del alineamiento de ${deidad.Nombre} (${`${deidad.Alineamiento?.Nombre ?? ''}`.toLowerCase()})`;
    const esNeutral = (vector: AlineamientoVector) => vector.ley === 0 && vector.moral === 0;
    if (esNeutral(personaje) && !esNeutral(vectorDeidad))
        return `Solo puede ser neutral si ${deidad.Nombre} también lo es`;
    return null;
}
