import { Raza } from 'src/app/interfaces/raza';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { normalizarTexto, toArray, toNumber } from 'src/app/services/utils/normalizacion';

export interface ClaveEntidadPrerrequisito {
    id: number | null;
    nombre: string;
}

export interface IdentidadPrerrequisitos {
    razas: ClaveEntidadPrerrequisito[];
    tiposCriatura: ClaveEntidadPrerrequisito[];
    subtipos: ClaveEntidadPrerrequisito[];
}

function crearClave(id: any, nombre: any): ClaveEntidadPrerrequisito | null {
    const idNum = toNumber(id);
    const nombreLimpio = `${nombre ?? ''}`.trim();
    if (idNum <= 0 && normalizarTexto(nombreLimpio).length < 1)
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
        const nombreNorm = normalizarTexto(clave.nombre);

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

/** Las claves (`Id` y `Nombre`) de una lista de entidades del personaje, sin vacías ni repetidas. */
export function clavesDeEntidades(entidades: Array<{ Id?: unknown; Nombre?: unknown; }> | null | undefined): ClaveEntidadPrerrequisito[] {
    return dedupeClaves(toArray<{ Id?: unknown; Nombre?: unknown; }>(entidades).map((entidad) => crearClave(entidad?.Id, entidad?.Nombre)));
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

    const reqNombre = normalizarTexto(`${requeridoNombre ?? ''}`);
    if (reqNombre.length < 1)
        return false;

    return normalizarTexto(clave.nombre) === reqNombre;
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
