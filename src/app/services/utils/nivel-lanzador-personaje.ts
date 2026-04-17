import { Clase, ClaseNivelDetalle } from 'src/app/interfaces/clase';
import {
    Personaje,
    PersonajeNivelLanzadorResumen,
    PersonajeTipoLanzamiento
} from 'src/app/interfaces/personaje';
import {
    PersonajeProgresionLanzadorDto,
    PersonajeProgresionLanzadorSeleccionDto
} from 'src/app/interfaces/personajes-api';

function toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizarTexto(value: any): string {
    return `${value ?? ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function tieneLanzamientoPropio(clase: Clase | null | undefined): boolean {
    const conjuros = clase?.Conjuros;
    return !!conjuros?.Arcanos || !!conjuros?.Divinos || !!conjuros?.Psionicos || !!conjuros?.Alma;
}

function resolverTipoLanzamientoClase(clase: Clase): PersonajeTipoLanzamiento {
    const tipos: PersonajeTipoLanzamiento[] = [];
    if (clase?.Conjuros?.Arcanos)
        tipos.push('arcano');
    if (clase?.Conjuros?.Divinos)
        tipos.push('divino');
    if (clase?.Conjuros?.Psionicos)
        tipos.push('psionico');
    if (clase?.Conjuros?.Alma)
        tipos.push('alma');
    if (tipos.length > 1)
        return 'mixto';
    return tipos[0] ?? 'mixto';
}

function tieneAccesoRealConjurosDiarios(detalle: ClaseNivelDetalle | null | undefined): boolean {
    const mapa = detalle?.Conjuros_diarios;
    if (!mapa || typeof mapa !== 'object')
        return false;
    return Object.values(mapa).some((valor) => toNumber(valor) >= 0);
}

function tieneEscalonLanzador(clase: Clase, detalle: ClaseNivelDetalle): boolean {
    if (clase?.Conjuros?.Psionicos && toNumber(detalle?.Nivel_max_poder_accesible_nivel_lanzadorPsionico) >= 0)
        return true;
    if ((clase?.Conjuros?.Arcanos || clase?.Conjuros?.Divinos || clase?.Conjuros?.Alma) && tieneAccesoRealConjurosDiarios(detalle))
        return true;
    return false;
}

function obtenerNivelesDesgloseLanzador(clase: Clase): number[] {
    return (Array.isArray(clase?.Desglose_niveles) ? clase.Desglose_niveles : [])
        .filter((detalle) => tieneEscalonLanzador(clase, detalle))
        .map((detalle) => Math.trunc(toNumber(detalle?.Nivel)))
        .filter((nivel) => nivel > 0)
        .sort((a, b) => a - b);
}

function normalizarSeleccionesProgresion(
    progresion?: PersonajeProgresionLanzadorDto | null
): PersonajeProgresionLanzadorSeleccionDto[] {
    return Array.isArray(progresion?.selecciones)
        ? progresion.selecciones
            .map((seleccion) => ({
                idClaseAplicada: Math.trunc(toNumber(seleccion?.idClaseAplicada)),
                nivelClaseAplicado: Math.trunc(toNumber(seleccion?.nivelClaseAplicado)),
                indiceAumento: Math.trunc(toNumber(seleccion?.indiceAumento)),
                idClaseObjetivo: Math.trunc(toNumber(seleccion?.idClaseObjetivo)),
            }))
            .filter((seleccion) =>
                seleccion.idClaseAplicada > 0
                && seleccion.nivelClaseAplicado > 0
                && seleccion.indiceAumento > 0
                && seleccion.idClaseObjetivo > 0
            )
        : [];
}

export function normalizarProgresionLanzadorPersonaje(
    progresion?: PersonajeProgresionLanzadorDto | null
): PersonajeProgresionLanzadorDto {
    return {
        selecciones: normalizarSeleccionesProgresion(progresion),
    };
}

export function calcularNivelesLanzadorPersonaje(
    personaje: Personaje | null | undefined,
    clasesCatalogo: Clase[] | null | undefined
): PersonajeNivelLanzadorResumen[] {
    const clases = Array.isArray(clasesCatalogo) ? clasesCatalogo : [];
    const desglose = Array.isArray(personaje?.desgloseClases) ? personaje.desgloseClases : [];
    const progresion = normalizarSeleccionesProgresion(personaje?.ProgresionLanzador);
    const bonusPorIdClase = new Map<number, number>();

    progresion.forEach((seleccion) => {
        bonusPorIdClase.set(
            seleccion.idClaseObjetivo,
            (bonusPorIdClase.get(seleccion.idClaseObjetivo) ?? 0) + 1
        );
    });

    const usados = new Set<number>();
    return desglose
        .map((entrada) => {
            const nombreClase = `${entrada?.Nombre ?? ''}`.trim();
            const nivelClase = Math.max(0, Math.trunc(toNumber(entrada?.Nivel)));
            if (nombreClase.length < 1 || nivelClase < 1)
                return null;

            const clase = clases.find((item) =>
                normalizarTexto(item?.Nombre) === normalizarTexto(nombreClase)
            ) ?? null;
            if (!clase || !tieneLanzamientoPropio(clase))
                return null;

            const idClase = Math.trunc(toNumber(clase?.Id));
            if (idClase <= 0 || usados.has(idClase))
                return null;
            usados.add(idClase);

            const nivelesDesgloseLanzador = obtenerNivelesDesgloseLanzador(clase);
            const nivelLanzadorBase = nivelesDesgloseLanzador.filter((nivel) => nivel <= nivelClase).length;
            const bonusNivelLanzador = Math.max(0, bonusPorIdClase.get(idClase) ?? 0);
            const nivelLanzador = Math.max(0, nivelLanzadorBase + bonusNivelLanzador);
            if (nivelLanzador < 1)
                return null;

            const nivelDesgloseLanzador = nivelesDesgloseLanzador[nivelLanzador - 1]
                ?? nivelesDesgloseLanzador[nivelesDesgloseLanzador.length - 1]
                ?? nivelClase;

            return {
                idClase,
                nombreClase,
                tipoLanzamiento: resolverTipoLanzamientoClase(clase),
                nivelClase,
                nivelLanzadorBase,
                bonusNivelLanzador,
                nivelLanzador,
                nivelDesgloseLanzador,
            } satisfies PersonajeNivelLanzadorResumen;
        })
        .filter((item): item is PersonajeNivelLanzadorResumen => !!item);
}
