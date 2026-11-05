import { CARACTERISTICAS } from 'src/app/interfaces/caracteristica';
import { ReferenciaCorta, TipoVentaja, VentajaCampos, VentajaCuerpo, VentajaDetalle } from 'src/app/interfaces/ventaja';
import { NOMBRES_CARACTERISTICAS } from './caracteristicas';
import { toInt, toIntOrNull, toPositiveInt } from './normalizacion';

/**
 * El formulario de «Insertar/Modificar ventaja» (hito 8 del roadmap de inserciones): de la ventaja que da la API a los
 * valores del formulario y de ellos al cuerpo de `POST /<tipo>s/add` y `PUT /<tipo>s/<id>`. Guardar sin tocar nada manda
 * lo que llegó (comprobado con datos reales en `src/testing/ida-y-vuelta-rasgos-ventajas-incarnum.ts`).
 *
 * El coste se escribe en puntos (siempre positivo) y el signo lo pone el tipo: una ventaja cuesta puntos (coste negativo
 * en la API) y una desventaja los da (positivo).
 */

/** Las banderas de la tabla `ventajas`, con su etiqueta: si se pierde, a qué suma la mejora y lo que da al crear. */
export type BanderaVentaja = 'disipable' | 'caracteristica' | 'fuerza' | 'destreza' | 'constitucion' | 'inteligencia'
    | 'sabiduria' | 'carisma' | 'fortaleza' | 'reflejos' | 'voluntad' | 'iniciativa' | 'duplica_oro' | 'aumenta_oro'
    | 'idioma_extra';

export interface DefinicionBandera {
    clave: BanderaVentaja;
    etiqueta: string;
}

/**
 * A qué suma (o resta) la mejora: las características (con su nombre de `NOMBRES_CARACTERISTICAS`), una a elegir, las
 * salvaciones o la iniciativa.
 */
export const BANDERAS_AFECTA: readonly DefinicionBandera[] = [
    ...CARACTERISTICAS.map((clave) => ({ clave: clave.toLowerCase() as BanderaVentaja, etiqueta: NOMBRES_CARACTERISTICAS[clave] })),
    { clave: 'caracteristica', etiqueta: 'Una característica a elegir' },
    { clave: 'fortaleza', etiqueta: 'Fortaleza' },
    { clave: 'reflejos', etiqueta: 'Reflejos' },
    { clave: 'voluntad', etiqueta: 'Voluntad' },
    { clave: 'iniciativa', etiqueta: 'Iniciativa' },
];

/** Lo que da al crear el personaje (el oro, un idioma a elegir). */
export const BANDERAS_DA: readonly DefinicionBandera[] = [
    { clave: 'duplica_oro', etiqueta: 'Duplica el oro inicial' },
    { clave: 'aumenta_oro', etiqueta: 'Aumenta el oro inicial' },
    { clave: 'idioma_extra', etiqueta: 'Un idioma a elegir' },
];

const TODAS: readonly BanderaVentaja[] = ['disipable', ...BANDERAS_AFECTA.map((b) => b.clave), ...BANDERAS_DA.map((b) => b.clave)];

/** Los valores del formulario: los del cuerpo, con el coste en `puntos` (sin signo). */
export interface ValoresVentaja extends Record<BanderaVentaja, boolean> {
    nombre: string;
    descripcion: string;
    id_manual: number | null;
    pagina: number | null;
    puntos: number | null;
    mejora: number | null;
    id_rasgo: number | null;
    id_idioma: number | null;
    id_habilidad: number | null;
}

export function valoresVaciosDeVentaja(): ValoresVentaja {
    const banderas = Object.fromEntries(TODAS.map((clave) => [clave, false])) as Record<BanderaVentaja, boolean>;
    return {
        ...banderas, nombre: '', descripcion: '', id_manual: null, pagina: null, puntos: null, mejora: 0,
        id_rasgo: null, id_idioma: null, id_habilidad: null,
    };
}

/**
 * El id de una referencia de la ventaja (rasgo, idioma, habilidad): `null` si no tiene (la API la da `null` y el mapper la
 * deja con id 0 y sin nombre). Un id 0 con nombre es una opción de verdad («Elegir» en las habilidades).
 */
export function idDeReferencia(ref: ReferenciaCorta | null | undefined): number | null {
    const id = toInt(ref?.Id, 0);
    if (id > 0)
        return id;
    return id === 0 && `${ref?.Nombre ?? ''}`.trim().length > 0 ? 0 : null;
}

export function valoresDeVentaja(ventaja: VentajaDetalle): ValoresVentaja {
    const valores = valoresVaciosDeVentaja();
    const banderas: Record<BanderaVentaja, unknown> = {
        disipable: ventaja.Disipable, caracteristica: ventaja.Caracteristica, fuerza: ventaja.Fuerza,
        destreza: ventaja.Destreza, constitucion: ventaja.Constitucion, inteligencia: ventaja.Inteligencia,
        sabiduria: ventaja.Sabiduria, carisma: ventaja.Carisma, fortaleza: ventaja.Fortaleza, reflejos: ventaja.Reflejos,
        voluntad: ventaja.Voluntad, iniciativa: ventaja.Iniciativa, duplica_oro: ventaja.Duplica_oro,
        aumenta_oro: ventaja.Aumenta_oro, idioma_extra: ventaja.Idioma_extra,
    };
    TODAS.forEach((clave) => valores[clave] = banderas[clave] === true);
    return {
        ...valores,
        nombre: `${ventaja.Nombre ?? ''}`,
        descripcion: `${ventaja.Descripcion ?? ''}`,
        id_manual: toPositiveInt(ventaja.Manual?.Id),
        pagina: toInt(ventaja.Manual?.Pagina, 0),
        puntos: Math.abs(toInt(ventaja.Coste, 0)),
        mejora: toInt(ventaja.Mejora, 0),
        id_rasgo: idDeReferencia(ventaja.Rasgo),
        id_idioma: idDeReferencia(ventaja.Idioma),
        id_habilidad: idDeReferencia(ventaja.Habilidad),
    };
}

/** El cuerpo de `POST /<tipo>s/add` y `PUT /<tipo>s/<id>`: `{ ventaja: {…} }` o `{ desventaja: {…} }`. */
export function cuerpoDeVentaja(tipo: TipoVentaja, valores: ValoresVentaja): VentajaCuerpo {
    const puntos = Math.abs(toInt(valores.puntos));
    const campos = {
        nombre: `${valores.nombre ?? ''}`.trim(),
        descripcion: `${valores.descripcion ?? ''}`.trim(),
        id_manual: toInt(valores.id_manual),
        pagina: toInt(valores.pagina),
        coste: tipo === 'ventaja' ? -puntos : puntos,
        mejora: toInt(valores.mejora),
        ...Object.fromEntries(TODAS.map((clave) => [clave, valores[clave] === true])),
        id_rasgo: toIntOrNull(valores.id_rasgo),
        id_idioma: toIntOrNull(valores.id_idioma),
        id_habilidad: toIntOrNull(valores.id_habilidad),
    } as VentajaCampos;
    return tipo === 'ventaja' ? { ventaja: campos } : { desventaja: campos };
}
