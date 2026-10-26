import { ReglaSinergia } from 'src/app/interfaces/habilidad';
import { PersonajeParteDto } from 'src/app/interfaces/personajes-api';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA } from 'src/app/services/utils/habilidad-extra-visible';
import { toInt, toNullableText } from 'src/app/services/utils/normalizacion';

/**
 * Sinergias entre habilidades (Manual del jugador, tabla 4-5), la misma regla que la ficha de la API
 * (`utils/sinergias.py`) con las reglas de `GET /habilidades` (`Sinergias` de cada habilidad de origen).
 *
 * Con `Rangos_minimos` rangos (5) en la habilidad de origen, la de destino gana `Bonificador` (+2); con `Condicion`, solo
 * en esas pruebas (se enseña y no se suma). Un extra distinto de -1 identifica la habilidad por su extra (Saber (arcano)
 * en cualquier hueco de Saber); con -1, por su id. Las sinergias se suman entre sí.
 */

/** Una habilidad del personaje: su id, el id de su extra (-1 si no tiene) y sus rangos. */
export interface HabilidadSinergiaRef {
    id: number;
    idExtra: number;
    rangos: number;
}

export function esLaHabilidadDeLaSinergia(id: number, idExtra: number, reglaId: number, reglaExtra: number): boolean {
    if (toInt(reglaExtra, ID_EXTRA_HABILIDAD_SIN_EXTRA) !== ID_EXTRA_HABILIDAD_SIN_EXTRA)
        return toInt(idExtra, ID_EXTRA_HABILIDAD_SIN_EXTRA) === toInt(reglaExtra);
    return toInt(id) === toInt(reglaId);
}

/** Las partes de sinergia de una habilidad: las condicionales llevan su `condicion` (no se suman). */
export function bonosSinergia(
    destino: { id: number; idExtra: number; },
    habilidades: readonly HabilidadSinergiaRef[],
    reglas: readonly ReglaSinergia[],
): PersonajeParteDto[] {
    return reglas
        .filter((regla) => esLaHabilidadDeLaSinergia(destino.id, destino.idExtra, regla.Id_habilidad_destino, regla.Id_extra_destino)
            && habilidades.some((habilidad) => toInt(habilidad.rangos) >= toInt(regla.Rangos_minimos)
                && esLaHabilidadDeLaSinergia(habilidad.id, habilidad.idExtra, regla.Id_habilidad_origen, regla.Id_extra_origen)))
        .map((regla) => {
            const condicion = toNullableText(regla.Condicion);
            return {
                tipo: 'sinergia',
                origen: `Sinergia (${regla.Habilidad_origen})`,
                valor: toInt(regla.Bonificador),
                ...(condicion !== null ? { condicion } : {}),
            } as PersonajeParteDto;
        });
}
