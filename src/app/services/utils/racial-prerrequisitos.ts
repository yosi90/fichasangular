import { RacialDetalle } from 'src/app/interfaces/racial';
import {
    IdentidadPrerrequisitos,
    existeCoincidenciaClaveEntidad,
    normalizarTextoPrerrequisito,
} from './identidad-prerrequisitos';

export type EstadoEvaluacionRacial = 'eligible' | 'blocked' | 'eligible_with_warning';

export interface RacialEvaluacionResultado {
    estado: EstadoEvaluacionRacial;
    razones: string[];
    advertencias: string[];
}

export interface RacialEvaluacionCaracteristicas {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}

interface PrerrequisitoRacialEvaluado {
    grupoOpcional: number;
    opcionalUnknown: boolean;
    evaluable: boolean;
    cumple: boolean;
    razonFail: string;
    razonUnknown: string;
}

interface EstadoGrupoOpcional {
    cumple: boolean;
    falla: boolean;
    unknown: boolean;
}

function toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: any): boolean {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'si' || normalized === 'sí';
    }
    return false;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === 'object')
        return Object.values(value) as T[];
    return [];
}

function pick(raw: any, ...keys: string[]): any {
    if (!raw || typeof raw !== 'object')
        return undefined;
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(raw, key))
            return raw[key];
    }
    return undefined;
}

function parseOpcional(entry: Record<string, any>): { grupo: number; unknown: boolean } {
    if (!entry || typeof entry !== 'object')
        return { grupo: 0, unknown: true };

    const raw = pick(entry, 'opcional', 'Opcional', 'o', 'O');
    if (raw === undefined || raw === null || raw === '')
        return { grupo: 0, unknown: false };

    const parsed = Number(raw);
    if (!Number.isFinite(parsed))
        return { grupo: 0, unknown: true };

    return {
        grupo: Math.max(0, Math.trunc(parsed)),
        unknown: false,
    };
}

function uniqueTexts(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    values.forEach((value) => {
        const normalized = normalizarTextoPrerrequisito(value);
        if (normalized.length < 1 || seen.has(normalized))
            return;
        seen.add(normalized);
        result.push(value);
    });
    return result;
}

function parseId(entry: Record<string, any>, keys: string[]): number {
    for (const key of keys) {
        const parsed = toNumber((entry as any)?.[key]);
        if (parsed > 0)
            return parsed;
    }
    return 0;
}

function parseNombre(entry: Record<string, any>, keys: string[]): string {
    for (const key of keys) {
        const value = `${(entry as any)?.[key] ?? ''}`.trim();
        if (value.length > 0)
            return value;
    }
    return '';
}

function parseCaracteristicaId(entry: Record<string, any>): number {
    return parseId(entry, ['Id_caracteristica', 'id_caracteristica', 'Id', 'id', 'c']);
}

function parseCaracteristicaNombre(entry: Record<string, any>): string {
    return parseNombre(entry, ['Caracteristica', 'caracteristica', 'car', 'Nombre', 'nombre', 'n']);
}

function parseCaracteristicaMinima(entry: Record<string, any>): number {
    const raw = pick(entry, 'Cantidad', 'cantidad', 'Valor', 'valor', 'd', 'c');
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function caracteristicaNombreDesdeId(id: number): string {
    if (id === 1)
        return 'Fuerza';
    if (id === 2)
        return 'Destreza';
    if (id === 3)
        return 'Constitucion';
    if (id === 4)
        return 'Inteligencia';
    if (id === 5)
        return 'Sabiduria';
    if (id === 6)
        return 'Carisma';
    return '';
}

function normalizarCaracteristicaNombre(name: string): string {
    const normalized = normalizarTextoPrerrequisito(name);
    if (normalized.startsWith('fue') || normalized.includes('fuerza'))
        return 'Fuerza';
    if (normalized.startsWith('des') || normalized.includes('destreza'))
        return 'Destreza';
    if (normalized.startsWith('con') || normalized.includes('constitucion'))
        return 'Constitucion';
    if (normalized.startsWith('int') || normalized.includes('inteligencia'))
        return 'Inteligencia';
    if (normalized.startsWith('sab') || normalized.includes('sabiduria'))
        return 'Sabiduria';
    if (normalized.startsWith('car') || normalized.includes('carisma'))
        return 'Carisma';
    return '';
}

function resolverValorCaracteristica(
    contextoCaracteristicas: Partial<RacialEvaluacionCaracteristicas> | null | undefined,
    idCaracteristica: number,
    nombreCaracteristica: string,
): number {
    if (!contextoCaracteristicas)
        return Number.NaN;

    const porId = caracteristicaNombreDesdeId(idCaracteristica);
    const porNombre = normalizarCaracteristicaNombre(nombreCaracteristica);
    const key = (porId || porNombre) as keyof RacialEvaluacionCaracteristicas | '';
    if (!key)
        return Number.NaN;

    const value = Number((contextoCaracteristicas as any)?.[key]);
    return Number.isFinite(value) ? value : Number.NaN;
}

function evaluarPrerequisitoRaza(
    entry: Record<string, any>,
    identidad: IdentidadPrerrequisitos,
): PrerrequisitoRacialEvaluado {
    const opcional = parseOpcional(entry);
    const razaId = parseId(entry, ['Id_raza', 'id_raza', 'IdRaza', 'idRaza']);
    const razaNombre = parseNombre(entry, ['Raza', 'raza', 'Nombre_raza', 'nombre_raza', 'n', 'Nombre', 'nombre']);
    const tipoId = parseId(entry, ['Id_tipo_criatura', 'id_tipo_criatura', 'Id_tipo', 'id_tipo', 'IdTipo', 'idTipo']);
    const tipoNombre = parseNombre(entry, ['Tipo_criatura', 'tipo_criatura', 'Tipo', 'tipo', 'Tipo_comp', 'tipo_comp']);
    const subtipoId = parseId(entry, ['Id_subtipo', 'id_subtipo', 'IdSubtipo', 'idSubtipo']);
    const subtipoNombre = parseNombre(entry, ['Subtipo', 'subtipo', 'Nombre_subtipo', 'nombre_subtipo']);

    const checks: boolean[] = [];
    let tieneDatoEvaluable = false;

    if (razaId > 0 || razaNombre.length > 0) {
        tieneDatoEvaluable = true;
        checks.push(existeCoincidenciaClaveEntidad(identidad.razas, razaId, razaNombre));
    }

    if (tipoId > 0 || tipoNombre.length > 0) {
        tieneDatoEvaluable = true;
        checks.push(existeCoincidenciaClaveEntidad(identidad.tiposCriatura, tipoId, tipoNombre));
    }

    if (subtipoId > 0 || subtipoNombre.length > 0) {
        tieneDatoEvaluable = true;
        checks.push(existeCoincidenciaClaveEntidad(identidad.subtipos, subtipoId, subtipoNombre));
    }

    if (!tieneDatoEvaluable) {
        return {
            grupoOpcional: opcional.grupo,
            opcionalUnknown: opcional.unknown,
            evaluable: false,
            cumple: false,
            razonFail: 'Prerrequisito de raza no cumplido',
            razonUnknown: 'Prerrequisito de raza con formato no reconocido',
        };
    }

    const cumple = checks.every(Boolean);
    return {
        grupoOpcional: opcional.grupo,
        opcionalUnknown: opcional.unknown,
        evaluable: true,
        cumple,
        razonFail: 'Prerrequisito de raza/tipo/subtipo no cumplido',
        razonUnknown: 'Prerrequisito de raza no interpretable',
    };
}

function evaluarPrerequisitoCaracteristica(
    entry: Record<string, any>,
    contextoCaracteristicas: Partial<RacialEvaluacionCaracteristicas> | null | undefined,
): PrerrequisitoRacialEvaluado {
    const opcional = parseOpcional(entry);
    const idCaracteristica = parseCaracteristicaId(entry);
    const nombreCaracteristica = parseCaracteristicaNombre(entry);
    const valorMinimo = parseCaracteristicaMinima(entry);
    const valorActual = resolverValorCaracteristica(contextoCaracteristicas, idCaracteristica, nombreCaracteristica);
    const nombreVisible = caracteristicaNombreDesdeId(idCaracteristica) || nombreCaracteristica || `#${idCaracteristica}`;

    const evaluable = Number.isFinite(valorMinimo) && Number.isFinite(valorActual)
        && (idCaracteristica > 0 || normalizarCaracteristicaNombre(nombreCaracteristica).length > 0);
    const cumple = evaluable ? valorActual >= valorMinimo : false;

    return {
        grupoOpcional: opcional.grupo,
        opcionalUnknown: opcional.unknown,
        evaluable,
        cumple,
        razonFail: `Caracteristica minima no cumplida (${nombreVisible} >= ${valorMinimo})`,
        razonUnknown: 'Prerrequisito de caracteristica con formato no reconocido',
    };
}

function registrarResultado(
    evaluacion: PrerrequisitoRacialEvaluado,
    fail: string[],
    warnings: string[],
    gruposOpcionales: Map<number, EstadoGrupoOpcional>,
): void {
    if (evaluacion.opcionalUnknown)
        warnings.push('Campo opcional con formato no reconocido');

    if (evaluacion.grupoOpcional <= 0) {
        if (!evaluacion.evaluable) {
            warnings.push(evaluacion.razonUnknown);
            return;
        }

        if (!evaluacion.cumple)
            fail.push(evaluacion.razonFail);
        return;
    }

    const current = gruposOpcionales.get(evaluacion.grupoOpcional) ?? {
        cumple: false,
        falla: false,
        unknown: false,
    };
    if (!evaluacion.evaluable)
        current.unknown = true;
    else if (evaluacion.cumple)
        current.cumple = true;
    else
        current.falla = true;

    gruposOpcionales.set(evaluacion.grupoOpcional, current);
}

function resolverGruposOpcionales(
    gruposOpcionales: Map<number, EstadoGrupoOpcional>,
    fail: string[],
    warnings: string[],
): void {
    gruposOpcionales.forEach((estado, grupo) => {
        if (estado.cumple)
            return;

        if (estado.unknown) {
            warnings.push(`No se pudo validar por completo el grupo opcional ${grupo}`);
            return;
        }

        if (estado.falla)
            fail.push(`No se cumple el grupo opcional ${grupo}`);
    });
}

export function evaluarRacialParaSeleccion(
    racial: RacialDetalle | null | undefined,
    contextoIdentidad: IdentidadPrerrequisitos,
    contextoCaracteristicas?: Partial<RacialEvaluacionCaracteristicas> | null,
): RacialEvaluacionResultado {
    if (!racial) {
        return {
            estado: 'blocked',
            razones: ['Racial no disponible'],
            advertencias: [],
        };
    }

    const fail: string[] = [];
    const warnings: string[] = [];
    const gruposOpcionales = new Map<number, EstadoGrupoOpcional>();
    const flags = (racial?.Prerrequisitos_flags ?? {}) as Record<string, any>;
    const prerrequisitos = (racial?.Prerrequisitos ?? {}) as Record<string, any>;

    const entriesRaza = toArray<Record<string, any>>(prerrequisitos?.['raza']);
    const entriesCaracteristica = toArray<Record<string, any>>(prerrequisitos?.['caracteristica']);
    const evaluarRaza = toBoolean(flags?.['raza']) || entriesRaza.length > 0;
    const evaluarCaracteristica = toBoolean(flags?.['caracteristica_minima']) || entriesCaracteristica.length > 0;

    if (evaluarRaza) {
        entriesRaza.forEach((entry) => {
            registrarResultado(
                evaluarPrerequisitoRaza(entry, contextoIdentidad),
                fail,
                warnings,
                gruposOpcionales
            );
        });
    }

    if (evaluarCaracteristica) {
        entriesCaracteristica.forEach((entry) => {
            registrarResultado(
                evaluarPrerequisitoCaracteristica(entry, contextoCaracteristicas),
                fail,
                warnings,
                gruposOpcionales
            );
        });
    }

    resolverGruposOpcionales(gruposOpcionales, fail, warnings);

    const razones = uniqueTexts(fail);
    const advertencias = uniqueTexts(warnings);

    if (razones.length > 0) {
        return {
            estado: 'blocked',
            razones,
            advertencias,
        };
    }

    if (advertencias.length > 0) {
        return {
            estado: 'eligible_with_warning',
            razones: [],
            advertencias,
        };
    }

    return {
        estado: 'eligible',
        razones: [],
        advertencias: [],
    };
}
