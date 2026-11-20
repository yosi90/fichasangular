import { EspecialSustituido, Raza } from "src/app/interfaces/raza";
import { toBoolean, toInt } from 'src/app/services/utils/normalizacion';

/**
 * Las razas mutadas en la web: saber si una raza lo es y qué aptitud de clase pone en lugar de otra. La combinación con la
 * raza base y la elegibilidad de las bases son de la API desde la fase 2 del roadmap de las razas mutadas
 * (`GET /razas/{id}/sobre/{idBase}` y `GET /razas/{id}/bases`, `RazaService`); la web no las calcula.
 */
export function esRazaMutada(raza: Raza | null | undefined): boolean {
    if (!raza)
        return false;
    return toBoolean(raza?.Mutada);
}

/**
 * La aptitud que la raza pone en lugar de la de `idEspecial` en todas sus clases (la primera de `sustituidos`, sus
 * `Especiales_sustituidos`: *Libris Mortis*, pág. 35, el clérigo convertido en muerto viviente reprende en lugar de
 * expulsar), o `null` si no la sustituye. Lo usan el motor de la creación y la ficha de la conversión.
 */
export function especialQueLaSustituye(sustituidos: ReadonlyArray<EspecialSustituido> | null | undefined,
    idEspecial: number): { Id: number; Nombre: string; } | null {
    const id = toInt(idEspecial);
    const sustitucion = id > 0 ? (sustituidos ?? []).find((s) => toInt(s?.Especial?.Id) === id) : null;
    return sustitucion && toInt(sustitucion.Especial_nuevo?.Id) > 0
        ? { Id: toInt(sustitucion.Especial_nuevo.Id), Nombre: `${sustitucion.Especial_nuevo.Nombre ?? ''}`.trim() }
        : null;
}
