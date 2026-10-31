import { toNumberOrNull } from './normalizacion';

/*
 * PJ o PNJ (decisión del propietario del 2026-10-31: es explícito y se ve en todas partes, no depende de quién lo crea).
 * La creación lo recibe (`personaje.tipo`, por defecto `pj`) y la ficha, los listados y las copias de Firebase lo
 * devuelven con su nivel: el NEP de un PJ y el VD de un PNJ (`docs/publica/DRAGONES_FRONT.md`).
 */

export type TipoPersonaje = 'pj' | 'pnj';

/** El tipo tal como llega (`tipo` de la API y de Firestore, `Tipo` de `listado-personajes`), o `null` sin dato. */
export function leerTipoPersonaje(valor: unknown): TipoPersonaje | null {
    const texto = `${valor ?? ''}`.trim().toLowerCase();
    return texto === 'pj' || texto === 'pnj' ? texto : null;
}

/** Sin dato, un personaje es un PJ (el valor por defecto del contrato). */
export function esPnj(tipo: TipoPersonaje | null | undefined): boolean {
    return tipo === 'pnj';
}

/** «Personaje jugador» o «PNJ». */
export function nombreTipoPersonaje(tipo: TipoPersonaje | null | undefined): string {
    return esPnj(tipo) ? 'PNJ' : 'Personaje jugador';
}

/** El título de la creación: «Nuevo personaje» hasta elegir qué se crea; después, «Nuevo personaje jugador» o «Nuevo PNJ». */
export function tituloNuevoPersonaje(tipo: TipoPersonaje | null | undefined): string {
    if (!tipo)
        return 'Nuevo personaje';
    return esPnj(tipo) ? 'Nuevo PNJ' : 'Nuevo personaje jugador';
}

/** Las fracciones de VD del *Manual de monstruos* (1/2, 1/3…), que la API da como decimales. */
const FRACCIONES_VD: ReadonlyArray<[number, string]> = [[1 / 2, '1/2'], [1 / 3, '1/3'], [1 / 4, '1/4'], [1 / 6, '1/6'], [1 / 8, '1/8'], [1 / 10, '1/10']];

/** Un VD como se escribe: «18», «1/2», «7,5». */
export function textoVd(vd: number): string {
    if (vd > 0 && vd < 1) {
        const fraccion = FRACCIONES_VD.find(([valor]) => Math.abs(valor - vd) < 0.02);
        if (fraccion)
            return fraccion[1];
    }
    return Number.isInteger(vd) ? `${vd}` : `${Math.round(vd * 100) / 100}`.replace('.', ',');
}

/**
 * El nivel que se enseña de un personaje: el NEP de un PJ («NEP 5») y el VD de un PNJ («VD 18»). Sin el dato (un PJ en
 * una edad sin ajuste, un PNJ sin VD), `null`.
 */
export function textoNivelPersonaje(datos: { tipo?: TipoPersonaje | null; nep?: unknown; vd?: unknown; }): string | null {
    if (esPnj(datos.tipo)) {
        const vd = toNumberOrNull(datos.vd);
        return vd === null ? null : `VD ${textoVd(vd)}`;
    }
    const nep = toNumberOrNull(datos.nep);
    return nep === null || nep <= 0 ? null : `NEP ${nep}`;
}

/**
 * El tipo y el nivel de un personaje de los listados: `tipo`, `nep` y `vd` en la copia de Firestore y en
 * `GET /usuarios/me/personajes`; `Tipo`, `Nep` y `Vd` en `listado-personajes` (sin valor, no están); en la ficha
 * (`GET /personajes`), el NEP es `nivelEfectivo`. Sin tipo, PJ.
 */
export function leerTipoYNivelPersonaje(raw: any): { tipo: TipoPersonaje; nep: number | null; vd: number | null; } {
    return {
        tipo: leerTipoPersonaje(raw?.tipo ?? raw?.Tipo) ?? 'pj',
        nep: toNumberOrNull(raw?.nep ?? raw?.Nep ?? raw?.nivelEfectivo),
        vd: toNumberOrNull(raw?.vd ?? raw?.Vd),
    };
}
