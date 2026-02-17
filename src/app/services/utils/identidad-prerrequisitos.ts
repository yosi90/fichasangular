import { Raza } from 'src/app/interfaces/raza';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';

export interface ClaveEntidadPrerrequisito {
    id: number | null;
    nombre: string;
}

export interface IdentidadPrerrequisitos {
    razas: ClaveEntidadPrerrequisito[];
    tiposCriatura: ClaveEntidadPrerrequisito[];
    subtipos: ClaveEntidadPrerrequisito[];
}

function toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === 'object')
        return Object.values(value) as T[];
    return [];
}

export function normalizarTextoPrerrequisito(value: string): string {
    return `${value ?? ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function crearClave(id: any, nombre: any): ClaveEntidadPrerrequisito | null {
    const idNum = toNumber(id);
    const nombreLimpio = `${nombre ?? ''}`.trim();
    if (idNum <= 0 && normalizarTextoPrerrequisito(nombreLimpio).length < 1)
        return null;

    return {
        id: idNum > 0 ? idNum : null,
        nombre: nombreLimpio,
    };
}

function dedupeClaves(claves: (ClaveEntidadPrerrequisito | null | undefined)[]): ClaveEntidadPrerrequisito[] {
    const byId = new Set<number>();
    const byName = new Set<string>();
    const resultado: ClaveEntidadPrerrequisito[] = [];

    claves.forEach((clave) => {
        if (!clave)
            return;

        const id = toNumber(clave.id);
        const nombreNorm = normalizarTextoPrerrequisito(clave.nombre);

        if (id > 0) {
            if (byId.has(id))
                return;
            byId.add(id);
            resultado.push({
                id,
                nombre: `${clave.nombre ?? ''}`.trim(),
            });
            return;
        }

        if (nombreNorm.length < 1 || byName.has(nombreNorm))
            return;

        byName.add(nombreNorm);
        resultado.push({
            id: null,
            nombre: `${clave.nombre ?? ''}`.trim(),
        });
    });

    return resultado;
}

function extraerTipoCriatura(raza: Partial<Raza> | null | undefined): TipoCriatura | null {
    const tipo = (raza as any)?.Tipo_criatura;
    if (!tipo || typeof tipo !== 'object')
        return null;
    return tipo as TipoCriatura;
}

export function buildIdentidadPrerrequisitos(
    razaEfectiva: Partial<Raza> | null | undefined,
    razaBase: Partial<Raza> | null | undefined,
    subtiposActuales?: SubtipoRef[] | null,
): IdentidadPrerrequisitos {
    const tipoRazaEfectiva = extraerTipoCriatura(razaEfectiva);
    const tipoRazaBase = extraerTipoCriatura(razaBase);

    const subtiposRazaEfectiva = toArray<SubtipoRef>((razaEfectiva as any)?.Subtipos);
    const subtiposRazaBase = toArray<SubtipoRef>((razaBase as any)?.Subtipos);
    const subtiposDerivados = toArray<SubtipoRef>(subtiposActuales);

    return {
        razas: dedupeClaves([
            crearClave((razaEfectiva as any)?.Id, (razaEfectiva as any)?.Nombre),
            crearClave((razaBase as any)?.Id, (razaBase as any)?.Nombre),
        ]),
        tiposCriatura: dedupeClaves([
            crearClave(tipoRazaEfectiva?.Id, tipoRazaEfectiva?.Nombre),
            crearClave(tipoRazaBase?.Id, tipoRazaBase?.Nombre),
        ]),
        subtipos: dedupeClaves([
            ...subtiposRazaEfectiva.map((s) => crearClave((s as any)?.Id, (s as any)?.Nombre)),
            ...subtiposRazaBase.map((s) => crearClave((s as any)?.Id, (s as any)?.Nombre)),
            ...subtiposDerivados.map((s) => crearClave((s as any)?.Id, (s as any)?.Nombre)),
        ]),
    };
}

export function coincideClaveEntidad(
    clave: ClaveEntidadPrerrequisito,
    requeridoId: number | null | undefined,
    requeridoNombre?: string | null,
): boolean {
    const reqId = toNumber(requeridoId);
    if (reqId > 0 && toNumber(clave.id) === reqId)
        return true;

    const reqNombre = normalizarTextoPrerrequisito(`${requeridoNombre ?? ''}`);
    if (reqNombre.length < 1)
        return false;

    return normalizarTextoPrerrequisito(clave.nombre) === reqNombre;
}

export function existeCoincidenciaClaveEntidad(
    claves: ClaveEntidadPrerrequisito[],
    requeridoId: number | null | undefined,
    requeridoNombre?: string | null,
): boolean {
    return (claves ?? []).some((clave) => coincideClaveEntidad(clave, requeridoId, requeridoNombre));
}

export function extraerIdsPositivos(claves: ClaveEntidadPrerrequisito[]): number[] {
    return dedupeClaves(claves)
        .map((clave) => toNumber(clave.id))
        .filter((id) => id > 0);
}
