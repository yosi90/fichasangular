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

/**
 * Las aptitudes de `lista` con las que la raza sustituyó (`sustituidos`, sus `Especiales_sustituidos`) otra vez de la tabla
 * de su clase, al devolverle la vida (*Libris Mortis*, pág. 35: el clérigo que reprendía vuelve a expulsar). La sustitución
 * no tiene vuelta en los datos (dos aptitudes pasan a la misma), así que se recalcula de las tablas: entra cada aptitud de
 * `deLasTablas` (las que dan las tablas de las clases que conserva, en sus niveles) que la raza sustituía y no está, y se va
 * la nueva que ninguna tabla da (la que solo traía la sustitución). `clave`, su id y su extra. Lo usan el motor de la
 * creación (`Claseas`) y la ficha de la vuelta a la vida (`colecciones.especiales`).
 */
export function especialesDevueltos<T>(lista: ReadonlyArray<T>, sustituidos: ReadonlyArray<EspecialSustituido> | null | undefined,
    deLasTablas: ReadonlyArray<T>, clave: (especial: T) => { id: number; extra: number; }): T[] {
    const origenes = new Set((sustituidos ?? []).map((s) => toInt(s?.Especial?.Id)).filter((id) => id > 0));
    const nuevas = new Set((sustituidos ?? []).map((s) => toInt(s?.Especial_nuevo?.Id)).filter((id) => id > 0));
    if (origenes.size < 1)
        return [...lista];
    const igual = (a: T, b: T) => clave(a).id === clave(b).id && clave(a).extra === clave(b).extra;
    const enLasTablas = new Set(deLasTablas.map((e) => clave(e).id));
    const resultado = lista.filter((e) => !nuevas.has(clave(e).id) || enLasTablas.has(clave(e).id));
    deLasTablas.filter((e) => origenes.has(clave(e).id)).forEach((e) => {
        if (!resultado.some((r) => igual(r, e)))
            resultado.push(e);
    });
    return resultado;
}
