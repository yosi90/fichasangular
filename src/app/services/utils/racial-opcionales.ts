import { RacialDetalle } from 'src/app/interfaces/racial';

export type SeleccionRacialesOpcionales = Record<number, string>;

export interface GrupoRacialesOpcionales {
    grupo: number;
    opciones: RacialDetalle[];
}

export interface AgrupacionRacialesOpcionales {
    obligatorias: RacialDetalle[];
    grupos: GrupoRacialesOpcionales[];
}

function toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizarTexto(value: string): string {
    return `${value ?? ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function dedupeRaciales(raciales: RacialDetalle[]): RacialDetalle[] {
    const seen = new Set<string>();
    return (raciales ?? []).filter((racial) => {
        const key = getClaveSeleccionRacial(racial);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}

export function getClaveSeleccionRacial(racial: RacialDetalle): string {
    const id = toNumber((racial as any)?.Id);
    if (id > 0)
        return `id:${id}`;
    return `n:${normalizarTexto(`${(racial as any)?.Nombre ?? ''}`)}`;
}

export function getGrupoOpcionalRacial(racial: RacialDetalle): number {
    const opcionalDirecto = toNumber((racial as any)?.Opcional);
    if (opcionalDirecto > 0)
        return Math.trunc(opcionalDirecto);

    const opcionalAlias = toNumber((racial as any)?.opcional);
    if (opcionalAlias > 0)
        return Math.trunc(opcionalAlias);

    const aliasLegacy = (racial as any)?.o;
    const opcionalLegacy = toNumber(aliasLegacy);
    if (Number.isFinite(opcionalLegacy) && opcionalLegacy > 0)
        return Math.trunc(opcionalLegacy);

    return 0;
}

export function agruparRacialesPorOpcional(raciales: RacialDetalle[]): AgrupacionRacialesOpcionales {
    const obligatorias: RacialDetalle[] = [];
    const gruposMap = new Map<number, RacialDetalle[]>();

    (raciales ?? []).forEach((racial) => {
        const grupo = getGrupoOpcionalRacial(racial);
        if (grupo <= 0) {
            obligatorias.push(racial);
            return;
        }

        if (!gruposMap.has(grupo))
            gruposMap.set(grupo, []);
        gruposMap.get(grupo)?.push(racial);
    });

    const grupos = Array.from(gruposMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([grupo, opciones]) => ({
            grupo,
            opciones: dedupeRaciales(opciones),
        }));

    return {
        obligatorias: dedupeRaciales(obligatorias),
        grupos,
    };
}

export function tieneRacialesOpcionales(raciales: RacialDetalle[]): boolean {
    return agruparRacialesPorOpcional(raciales).grupos.length > 0;
}

export function seleccionOpcionalesCompleta(
    raciales: RacialDetalle[],
    seleccion: SeleccionRacialesOpcionales | null | undefined,
): boolean {
    const agrupacion = agruparRacialesPorOpcional(raciales);
    if (agrupacion.grupos.length < 1)
        return true;
    if (!seleccion)
        return false;

    return agrupacion.grupos.every((grupo) => {
        const valor = `${seleccion[grupo.grupo] ?? ''}`.trim();
        if (valor.length < 1)
            return false;

        const valorNorm = normalizarTexto(valor);
        return grupo.opciones.some((opcion) => {
            const key = getClaveSeleccionRacial(opcion);
            if (key === valor)
                return true;
            return normalizarTexto(opcion.Nombre) === valorNorm;
        });
    });
}

export function resolverRacialesFinales(
    raciales: RacialDetalle[],
    seleccion: SeleccionRacialesOpcionales | null | undefined,
): RacialDetalle[] | null {
    const agrupacion = agruparRacialesPorOpcional(raciales);
    if (agrupacion.grupos.length < 1)
        return dedupeRaciales(raciales ?? []);

    if (!seleccionOpcionalesCompleta(raciales, seleccion))
        return null;

    const seleccionSegura = seleccion ?? {};
    const elegidas = agrupacion.grupos.map((grupo) => {
        const elegido = `${seleccionSegura[grupo.grupo] ?? ''}`.trim();
        const elegidoNorm = normalizarTexto(elegido);
        return grupo.opciones.find((opcion) => {
            const key = getClaveSeleccionRacial(opcion);
            if (key === elegido)
                return true;
            return normalizarTexto(opcion.Nombre) === elegidoNorm;
        }) ?? null;
    });

    if (elegidas.some((racial) => !racial))
        return null;

    return dedupeRaciales([
        ...agrupacion.obligatorias,
        ...(elegidas.filter((racial): racial is RacialDetalle => !!racial)),
    ]);
}
