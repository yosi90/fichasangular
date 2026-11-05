import { ReferenciaCorta, TipoVentaja, VentajaCampos, VentajaCuerpo, VentajaDetalle } from 'src/app/interfaces/ventaja';
import { toInt } from './normalizacion';

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

/** A qué suma (o resta) la mejora: las características, las salvaciones, la iniciativa o una característica a elegir. */
export const BANDERAS_AFECTA: readonly DefinicionBandera[] = [
    { clave: 'fuerza', etiqueta: 'Fuerza' },
    { clave: 'destreza', etiqueta: 'Destreza' },
    { clave: 'constitucion', etiqueta: 'Constitución' },
    { clave: 'inteligencia', etiqueta: 'Inteligencia' },
    { clave: 'sabiduria', etiqueta: 'Sabiduría' },
    { clave: 'carisma', etiqueta: 'Carisma' },
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

/** El tipo de una entrada por su coste, como sus lecturas (`tipoRolDeVentaja`). */
export function tipoDeVentaja(ventaja: Pick<VentajaDetalle, 'Coste'> | null | undefined): TipoVentaja {
    return Number(ventaja?.Coste) > 0 ? 'desventaja' : 'ventaja';
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
        id_manual: toInt(ventaja.Manual?.Id, 0) > 0 ? toInt(ventaja.Manual?.Id) : null,
        pagina: toInt(ventaja.Manual?.Pagina, 0),
        puntos: Math.abs(toInt(ventaja.Coste, 0)),
        mejora: toInt(ventaja.Mejora, 0),
        id_rasgo: idDeReferencia(ventaja.Rasgo),
        id_idioma: idDeReferencia(ventaja.Idioma),
        id_habilidad: idDeReferencia(ventaja.Habilidad),
    };
}

function numeroONulo(valor: unknown): number | null {
    if (valor === null || valor === undefined || `${valor}`.trim() === '')
        return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.trunc(numero) : null;
}

/** El cuerpo de `POST /<tipo>s/add` y `PUT /<tipo>s/<id>`: `{ ventaja: {…} }` o `{ desventaja: {…} }`. */
export function cuerpoDeVentaja(tipo: TipoVentaja, valores: ValoresVentaja): VentajaCuerpo {
    const puntos = Math.abs(numeroONulo(valores.puntos) ?? 0);
    const campos = {
        nombre: `${valores.nombre ?? ''}`.trim(),
        descripcion: `${valores.descripcion ?? ''}`.trim(),
        id_manual: numeroONulo(valores.id_manual) ?? 0,
        pagina: numeroONulo(valores.pagina) ?? 0,
        coste: tipo === 'ventaja' ? -puntos : puntos,
        mejora: numeroONulo(valores.mejora) ?? 0,
        ...Object.fromEntries(TODAS.map((clave) => [clave, valores[clave] === true])),
        id_rasgo: numeroONulo(valores.id_rasgo),
        id_idioma: numeroONulo(valores.id_idioma),
        id_habilidad: numeroONulo(valores.id_habilidad),
    } as VentajaCampos;
    return tipo === 'ventaja' ? { ventaja: campos } : { desventaja: campos };
}
