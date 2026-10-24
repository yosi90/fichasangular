import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';
export interface ResolverExtraHabilidadOptions {
    extra?: any;
    idExtra?: any;
    soportaExtra?: any;
    allowIdZeroAsChoose?: boolean;
}

export function resolverExtraHabilidadVisible(options: ResolverExtraHabilidadOptions): string {
    const extraRaw = `${options?.extra ?? ''}`.trim();
    const extraNormalizado = normalizarTexto(extraRaw);
    const idExtra = Number(options?.idExtra);
    const idExtraEsNumero = Number.isFinite(idExtra);

    // -1 (u otros negativos) significa "sin extra": nunca se muestra.
    if (idExtraEsNumero && idExtra < 0)
        return '';

    if (extraNormalizado === 'elegir' || extraNormalizado === 'a elegir' || extraNormalizado === 'elige')
        return 'Elegir';

    const placeholders = new Set([
        '',
        '-',
        '-1',
        'no especifica',
        'no se especifica',
        'no aplica',
        'ninguna',
        'nada',
        'desconocido',
        'placeholder',
    ]);

    if (!placeholders.has(extraNormalizado))
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
    return normalizarTexto(habilidad?.Extra) === 'elegir';
}
