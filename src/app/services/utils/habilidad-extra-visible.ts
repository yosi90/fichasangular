function normalizarTexto(value: string): string {
    return `${value ?? ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function toBoolean(value: any): boolean {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value === 1;
    if (typeof value === 'string') {
        const normalized = normalizarTexto(value);
        return normalized === '1' || normalized === 'true' || normalized === 'si' || normalized === 'sí';
    }
    return false;
}

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
