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
import { nivelLanzadorConRasgos } from 'src/app/services/utils/habilidades-raciales';
import { normalizarTexto, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { nivelLanzadorDeClase } from 'src/app/services/utils/reglas-magia';

function tieneLanzamientoPropio(clase: Clase | null | undefined): boolean {
    const conjuros = clase?.Conjuros;
    return !!conjuros?.Arcanos || !!conjuros?.Divinos || !!conjuros?.Psionicos;
}

function resolverTipoLanzamientoClase(clase: Clase): PersonajeTipoLanzamiento {
    const tipos: PersonajeTipoLanzamiento[] = [];
    if (clase?.Conjuros?.Arcanos)
        tipos.push('arcano');
    if (clase?.Conjuros?.Divinos)
        tipos.push('divino');
    if (clase?.Conjuros?.Psionicos)
        tipos.push('psionico');
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

/**
 * Si la clase lanza de verdad conjuros: algún nivel de su tabla con conjuros diarios (un valor desde 0; -1 es «sin
 * acceso»). El brujo arcano tiene la marca de conjuros arcanos por el nivel de lanzador de sus invocaciones, pero «nunca
 * aprende a lanzarlos» (*El arcano completo*, pág. 18). Como la API (`subida_nivel._lanzan`).
 */
export function lanzaConjurosDiarios(clase: Pick<Clase, 'Desglose_niveles'> | null | undefined): boolean {
    return (Array.isArray(clase?.Desglose_niveles) ? clase!.Desglose_niveles : [])
        .some((detalle) => tieneAccesoRealConjurosDiarios(detalle));
}

function tieneEscalonLanzador(clase: Clase, detalle: ClaseNivelDetalle): boolean {
    if (clase?.Conjuros?.Psionicos && toNumber(detalle?.Nivel_max_poder_accesible_nivel_lanzadorPsionico) >= 0)
        return true;
    if ((clase?.Conjuros?.Arcanos || clase?.Conjuros?.Divinos) && tieneAccesoRealConjurosDiarios(detalle))
        return true;
    return false;
}

function obtenerNivelesDesgloseLanzador(clase: Clase): number[] {
    return (Array.isArray(clase?.Desglose_niveles) ? clase.Desglose_niveles : [])
        .filter((detalle) => tieneEscalonLanzador(clase, detalle))
        .map((detalle) => toInt(detalle?.Nivel))
        .filter((nivel) => nivel > 0)
        .sort((a, b) => a - b);
}

function normalizarSeleccionesProgresion(
    progresion?: PersonajeProgresionLanzadorDto | null
): PersonajeProgresionLanzadorSeleccionDto[] {
    return Array.isArray(progresion?.selecciones)
        ? progresion.selecciones
            .map((seleccion) => ({
                idClaseAplicada: toInt(seleccion?.idClaseAplicada),
                nivelClaseAplicado: toInt(seleccion?.nivelClaseAplicado),
                indiceAumento: toInt(seleccion?.indiceAumento),
                idClaseObjetivo: toInt(seleccion?.idClaseObjetivo),
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

/**
 * El nivel de lanzador de cada clase del personaje que lanza (su tabla, los aumentos de prestigio de `ProgresionLanzador`
 * y el divisor del paladín y el explorador). Con `dgsTotales` (los DG del personaje), también lo que le suman sus rasgos
 * (`personaje.Raciales`) a una clase que lanza conjuros, no al nivel de manifestador: krau, sin pasar de sus DG, con
 * `nivelLanzadorConRasgos`, la regla de la ficha de la API (`bonificadoresNivelLanzador`). Sin ellos, solo las clases.
 */
export function calcularNivelesLanzadorPersonaje(
    personaje: Personaje | null | undefined,
    clasesCatalogo: Clase[] | null | undefined,
    dgsTotales?: number | null
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
            const nivelClase = Math.max(0, toInt(entrada?.Nivel));
            if (nombreClase.length < 1 || nivelClase < 1)
                return null;

            const clase = clases.find((item) =>
                normalizarTexto(item?.Nombre) === normalizarTexto(nombreClase)
            ) ?? null;
            if (!clase || !tieneLanzamientoPropio(clase))
                return null;

            const idClase = toInt(clase?.Id);
            if (idClase <= 0 || usados.has(idClase))
                return null;
            usados.add(idClase);

            const nivelesDesgloseLanzador = obtenerNivelesDesgloseLanzador(clase);
            const nivelLanzadorBase = nivelesDesgloseLanzador.filter((nivel) => nivel <= nivelClase).length;
            const bonusNivelLanzador = Math.max(0, bonusPorIdClase.get(idClase) ?? 0);
            // La progresión elige la fila de la tabla; el nivel de lanzador puede ser la mitad (paladín, explorador).
            const progresion = Math.max(0, nivelLanzadorBase + bonusNivelLanzador);
            if (progresion < 1)
                return null;
            const tipoLanzamiento = resolverTipoLanzamientoClase(clase);
            const deLaClase = nivelLanzadorDeClase(clase, progresion, nivelClase, bonusNivelLanzador);
            const nivelLanzador = dgsTotales === null || dgsTotales === undefined || tipoLanzamiento === 'psionico'
                ? deLaClase
                : nivelLanzadorConRasgos(deLaClase, personaje?.Raciales, dgsTotales);

            const nivelDesgloseLanzador = nivelesDesgloseLanzador[progresion - 1]
                ?? nivelesDesgloseLanzador[nivelesDesgloseLanzador.length - 1]
                ?? nivelClase;

            return {
                idClase,
                nombreClase,
                tipoLanzamiento,
                nivelClase,
                nivelLanzadorBase,
                bonusNivelLanzador,
                nivelLanzador,
                nivelDesgloseLanzador,
            } satisfies PersonajeNivelLanzadorResumen;
        })
        .filter((item): item is PersonajeNivelLanzadorResumen => !!item);
}
