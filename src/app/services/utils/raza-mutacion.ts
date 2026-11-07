import { Raza } from "src/app/interfaces/raza";
import { toBoolean } from 'src/app/services/utils/normalizacion';

/**
 * Las razas mutadas en la web: solo saber si una raza lo es. La combinación con la raza base y la elegibilidad de las
 * bases son de la API desde la fase 2 del roadmap de las razas mutadas (`GET /razas/{id}/sobre/{idBase}` y
 * `GET /razas/{id}/bases`, `RazaService`); la web no las calcula.
 */
export function esRazaMutada(raza: Raza | null | undefined): boolean {
    if (!raza)
        return false;
    return toBoolean(raza?.Mutada) || toBoolean(raza?.Mutacion?.Es_mutada);
}
