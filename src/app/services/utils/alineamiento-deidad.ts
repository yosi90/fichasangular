import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { getAlineamientoBasicoIdPorNombre, getVectorDesdeIdBasico, getVectorDesdeNombreBasico } from './alineamiento-contrato';

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
    const vectorDeidad = getVectorDesdeIdBasico(Number(deidad.Alineamiento?.Id_basico))
        ?? getVectorDesdeNombreBasico(`${deidad.Alineamiento?.Nombre ?? ''}`);
    if (!personaje || !vectorDeidad)
        return null;

    const permitidos = deidad.Alineamientos_devotos ?? [];
    if (permitidos.length > 0) {
        const idPersonaje = getAlineamientoBasicoIdPorNombre(alineamiento);
        return permitidos.some((item) => Number(item.Id) === idPersonaje)
            ? null
            : `Los devotos de ${deidad.Nombre} solo pueden ser ${permitidos.map((item) => item.Nombre.toLowerCase()).join(' o ')}`;
    }

    const distancia = Math.abs(personaje.ley - vectorDeidad.ley) + Math.abs(personaje.moral - vectorDeidad.moral);
    if (distancia > 1)
        return `Debe estar a un paso del alineamiento de ${deidad.Nombre} (${`${deidad.Alineamiento?.Nombre ?? ''}`.toLowerCase()})`;
    const esNeutral = (vector: { ley: number; moral: number; }) => vector.ley === 0 && vector.moral === 0;
    if (esNeutral(personaje) && !esNeutral(vectorDeidad))
        return `Solo puede ser neutral si ${deidad.Nombre} también lo es`;
    return null;
}
