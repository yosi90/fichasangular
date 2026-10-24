import { Comodin } from 'src/app/interfaces/comodin';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';
export interface ResolverExtraHabilidadOptions {
    extra?: any;
    idExtra?: any;
    /**
     * La marca de la API (`Extra_comodin`): «elegir» es un extra por escoger y «cualquiera», que vale cualquiera. Sin
     * marca (`null`, o el borrador de la creación, que no la tiene), el extra se lee por su id y su texto.
     */
    extraComodin?: Comodin | null;
    soportaExtra?: any;
    allowIdZeroAsChoose?: boolean;
}

/** Si un texto de extra dice que está por elegir. Solo para los datos propios de la web (el borrador de la creación). */
export function esTextoExtraPorElegir(extra: unknown): boolean {
    const normalizado = normalizarTexto(extra);
    return normalizado === 'elegir' || normalizado === 'a elegir' || normalizado === 'elige';
}

export function resolverExtraHabilidadVisible(options: ResolverExtraHabilidadOptions): string {
    const extraRaw = `${options?.extra ?? ''}`.trim();

    // Sin id de extra (`null`, que la API manda cuando el extra era de relleno, o que no venga) no hay extra: no se lee
    // como el 0 de «Elegir». -1 (u otros negativos) también es "sin extra".
    const idExtraRaw = options?.idExtra;
    const idExtra = idExtraRaw === null || idExtraRaw === undefined || `${idExtraRaw}`.trim() === ''
        ? Number.NaN
        : Number(idExtraRaw);
    if (Number.isFinite(idExtra) && idExtra < 0)
        return '';

    if (options?.extraComodin === 'elegir')
        return 'Elegir';
    if (options?.extraComodin === 'cualquiera')
        return extraRaw;

    // Sin marca: el borrador de la creación dice «Elegir» con el texto.
    if (esTextoExtraPorElegir(extraRaw))
        return 'Elegir';

    if (extraRaw.length > 0 && extraRaw !== '-1')
        return extraRaw;

    const idExtraEsCero = Number.isFinite(idExtra) && idExtra === 0;
    const soportaExtra = toBoolean(options?.soportaExtra);
    const soportaDeclarado = options != null
        && Object.prototype.hasOwnProperty.call(options, 'soportaExtra')
        && options.soportaExtra !== undefined
        && options.soportaExtra !== null
        && `${options.soportaExtra}`.trim() !== '';
    const allowById = options?.allowIdZeroAsChoose === true;

    // Si el dato declara explícitamente que NO soporta extra, no forzamos "Elegir".
    if (idExtraEsCero && soportaDeclarado && !soportaExtra)
        return '';

    if (idExtraEsCero && (soportaExtra || allowById))
        return 'Elegir';

    return '';
}

/**
 * Si el extra de una habilidad de la ficha está por elegir (un Saber o una Artesanía sin escoger). La ficha de la API lo
 * marca en `extraComodin`; el borrador de la creación aún lo dice con el texto «Elegir».
 */
export function habilidadConExtraPorElegir(habilidad: { Extra?: string | null; Extra_comodin?: string | null; } | null | undefined): boolean {
    if (habilidad?.Extra_comodin !== undefined)
        return habilidad.Extra_comodin === 'elegir';
    return esTextoExtraPorElegir(habilidad?.Extra);
}
