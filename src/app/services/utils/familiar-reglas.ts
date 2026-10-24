import { Clase } from 'src/app/interfaces/clase';
import { FamiliarMonstruoDetalle, MonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { normalizarTexto, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { getAlineamientoBasicoIdPorNombre } from 'src/app/services/utils/alineamiento-contrato';
import {
    resolveEspecialId,
    resolveDoteIdFromNivelClase,
    normalizeAlineamientosRequeridos,
    getAlineamientosRequeridosLabel,
    cumpleAlineamientoPorPreferencias,
    getDetallePreferenciasAlineamiento,
} from 'src/app/services/utils/nivel-clase-monstruo';

export type FamiliarPlantillaId = 1 | 2 | 3 | 4 | 5;

export interface FamiliarFuenteClase {
    idClase: number;
    nombreClase: string;
    nivelActual: number;
}

export interface EstadoCuposFamiliar {
    especialId: number;
    fuentes: FamiliarFuenteClase[];
    fuentesClaseIds: number[];
    fuentesTotales: number;
    cuposConsumidos: number;
    cuposDisponibles: number;
    nivelLanzadorFamiliar: number;
}

export interface FiltroFamiliaresElegiblesInput {
    familiares: FamiliarMonstruoDetalle[];
    estado: EstadoCuposFamiliar;
    alineamientoPersonaje: string;
    plantillaSeleccionada: FamiliarPlantillaId | null;
    incluirHomebrew: boolean;
    dotesActuales?: Array<{ id: number | null; nombre: string; }>;
}

export interface FamiliarElegibilidadEvaluadaItem {
    familiar: FamiliarMonstruoDetalle;
    elegible: boolean;
    razones: string[];
    nivelMinimoRequerido: number | null;
}

function getNombrePlantilla(idPlantilla: number): string {
    if (idPlantilla === 2)
        return 'Draconica';
    if (idPlantilla === 3)
        return 'Celestial';
    if (idPlantilla === 4)
        return 'Remendado';
    if (idPlantilla === 5)
        return 'Mejorado';
    return 'Basica';
}

export function construirCatalogoFamiliaresDesdeMonstruos(monstruos: MonstruoDetalle[]): FamiliarMonstruoDetalle[] {
    const lista = Array.isArray(monstruos) ? monstruos : [];
    const resultado: FamiliarMonstruoDetalle[] = [];
    const dedupe = new Set<string>();

    lista.forEach((monstruo) => {
        if (!monstruo?.Familiar)
            return;

        const baseId = toNumber(monstruo?.Id);
        if (baseId <= 0)
            return;

        const nivelesClase = Array.isArray(monstruo?.Niveles_clase) ? monstruo.Niveles_clase : [];
        const plantillas = Array.from(new Set(
            nivelesClase
                .map((nivel) => toNumber(nivel?.Plantilla?.Id))
                .filter((id) => id >= 1 && id <= 5)
        ));

        plantillas.forEach((idPlantilla) => {
            const nivelesPlantilla = nivelesClase.filter((nivel) =>
                toNumber(nivel?.Plantilla?.Id) === idPlantilla
            );
            if (nivelesPlantilla.length < 1)
                return;

            const clave = `${baseId}:${idPlantilla}`;
            if (dedupe.has(clave))
                return;
            dedupe.add(clave);

            const plantillaNombre = `${nivelesPlantilla[0]?.Plantilla?.Nombre ?? ''}`.trim()
                || getNombrePlantilla(idPlantilla);

            resultado.push({
                ...monstruo,
                Id_familiar: baseId,
                Monstruo_origen: {
                    Id: baseId,
                    Nombre: `${monstruo?.Nombre ?? ''}`.trim(),
                },
                Vida: 0,
                Plantilla: {
                    Id: idPlantilla,
                    Nombre: plantillaNombre,
                },
                Niveles_clase: nivelesPlantilla,
                Especiales: [],
                Personajes: [],
            });
        });
    });

    return resultado.sort((a, b) =>
        `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' })
    );
}

const ESPECIAL_CONVOCAR_FAMILIAR_ID = 47;
function isEspecialConvocarFamiliar(especialRaw: any): boolean {
    const id = resolveEspecialId(especialRaw);
    if (id === ESPECIAL_CONVOCAR_FAMILIAR_ID)
        return true;
    const nombre = normalizarTexto(
        `${especialRaw?.Nombre ?? especialRaw?.nombre ?? ''}`
    );
    return nombre.includes('convocar a un familiar');
}

function claseOtorgaFuenteFamiliar(clase: Clase | null | undefined, nivelActual: number): boolean {
    if (!clase)
        return false;

    const nivelMaximo = Math.max(0, toInt(nivelActual));
    if (nivelMaximo < 1)
        return false;

    const niveles = Array.isArray(clase.Desglose_niveles) ? clase.Desglose_niveles : [];
    for (let nivel = 1; nivel <= nivelMaximo; nivel++) {
        const detalle = niveles.find((item) => toNumber(item?.Nivel) === nivel);
        if (!detalle)
            continue;
        const especiales = Array.isArray(detalle.Especiales) ? detalle.Especiales : [];
        const tieneEspecial47 = especiales.some((especialNivel) =>
            isEspecialConvocarFamiliar(especialNivel?.Especial)
        );
        if (tieneEspecial47)
            return true;
    }

    return false;
}

function resolveDoteNombreFromNivelClase(nivelClase: MonstruoNivelClase | null | undefined): string {
    return `${nivelClase?.Dote?.Nombre
        ?? (nivelClase?.Dote as any)?.nombre
        ?? (nivelClase as any)?.Dote_nombre
        ?? (nivelClase as any)?.dote_nombre
        ?? ''}`.trim();
}

function resolverDoteRequeridaPlantilla(nivelesClasePlantilla: MonstruoNivelClase[]): { id: number; nombre: string; } | null {
    const nivelConDote = nivelesClasePlantilla.find((nivelClase) => resolveDoteIdFromNivelClase(nivelClase) > 0);
    if (!nivelConDote)
        return null;
    const id = resolveDoteIdFromNivelClase(nivelConDote);
    return {
        id,
        nombre: resolveDoteNombreFromNivelClase(nivelConDote) || `Dote ${id}`,
    };
}

function tieneDoteActual(dotesActuales: Array<{ id: number | null; nombre: string; }>, doteRequerida: { id: number; nombre: string; }): boolean {
    const nombreRequerido = normalizarTexto(doteRequerida.nombre);
    return dotesActuales.some((dote) => {
        const id = toNumber(dote?.id);
        if (doteRequerida.id > 0 && id === doteRequerida.id)
            return true;
        return nombreRequerido.length > 0 && normalizarTexto(dote?.nombre ?? '') === nombreRequerido;
    });
}

function dedupeFuentes(fuentes: FamiliarFuenteClase[]): FamiliarFuenteClase[] {
    const byClassId = new Map<number, FamiliarFuenteClase>();
    fuentes.forEach((fuente) => {
        const idClase = toNumber(fuente?.idClase);
        if (idClase <= 0)
            return;
        if (!byClassId.has(idClase)) {
            byClassId.set(idClase, {
                idClase,
                nombreClase: `${fuente?.nombreClase ?? ''}`.trim(),
                nivelActual: Math.max(0, toNumber(fuente?.nivelActual)),
            });
            return;
        }
        const previa = byClassId.get(idClase)!;
        if (toNumber(fuente?.nivelActual) > toNumber(previa?.nivelActual))
            byClassId.set(idClase, { ...previa, nivelActual: Math.max(0, toNumber(fuente?.nivelActual)) });
    });
    return Array.from(byClassId.values());
}

export function resolverEstadoCuposFamiliarEspecial47(
    personaje: Personaje,
    catalogoClases: Clase[]
): EstadoCuposFamiliar {
    const desglose = Array.isArray(personaje?.desgloseClases) ? personaje.desgloseClases : [];
    const clases = Array.isArray(catalogoClases) ? catalogoClases : [];

    const fuentesRaw: FamiliarFuenteClase[] = desglose.map((entrada) => {
        const nombreClase = `${entrada?.Nombre ?? ''}`.trim();
        const nivelActual = Math.max(0, toInt(entrada?.Nivel));
        const clase = clases.find((item) =>
            normalizarTexto(item?.Nombre ?? '') === normalizarTexto(nombreClase)
        );
        if (!claseOtorgaFuenteFamiliar(clase, nivelActual))
            return null;
        return {
            idClase: toNumber(clase?.Id),
            nombreClase: `${clase?.Nombre ?? nombreClase}`.trim(),
            nivelActual,
        };
    }).filter((item): item is FamiliarFuenteClase => !!item);

    const fuentes = dedupeFuentes(fuentesRaw);
    const fuentesClaseIds = fuentes
        .map((fuente) => toNumber(fuente?.idClase))
        .filter((id) => id > 0);
    const fuentesTotales = fuentesClaseIds.length;
    const cuposConsumidos = (personaje?.Familiares ?? []).length;
    const cuposDisponibles = Math.max(0, fuentesTotales - cuposConsumidos);
    const nivelLanzadorFamiliar = fuentes.reduce((acc, fuente) => acc + Math.max(0, toNumber(fuente?.nivelActual)), 0);

    return {
        especialId: ESPECIAL_CONVOCAR_FAMILIAR_ID,
        fuentes,
        fuentesClaseIds,
        fuentesTotales,
        cuposConsumidos,
        cuposDisponibles,
        nivelLanzadorFamiliar,
    };
}

export function filtrarFamiliaresElegibles(input: FiltroFamiliaresElegiblesInput): FamiliarMonstruoDetalle[] {
    return evaluarFamiliaresElegibilidad(input)
        .filter((item) => item.elegible)
        .map((item) => item.familiar);
}

export function evaluarFamiliaresElegibilidad(input: FiltroFamiliaresElegiblesInput): FamiliarElegibilidadEvaluadaItem[] {
    const familiares = Array.isArray(input?.familiares) ? input.familiares : [];
    const fuentesClaseIds = new Set(
        (input?.estado?.fuentesClaseIds ?? [])
            .map((id) => toNumber(id))
            .filter((id) => id > 0)
    );
    const nivelLanzadorFamiliar = Math.max(0, toNumber(input?.estado?.nivelLanzadorFamiliar));
    const plantillaRaw = toNumber(input?.plantillaSeleccionada, 0);
    const plantillaSeleccionada = plantillaRaw >= 1 && plantillaRaw <= 5
        ? (Math.trunc(plantillaRaw) as FamiliarPlantillaId)
        : null;
    const includeHomebrew = !!input?.incluirHomebrew;
    const alineamientoPersonaje = normalizarTexto(input?.alineamientoPersonaje ?? '');
    const idAlineamientoBasico = getAlineamientoBasicoIdPorNombre(input?.alineamientoPersonaje ?? '');
    const dotesActuales = Array.isArray(input?.dotesActuales) ? input.dotesActuales : [];

    const dedupe = new Map<string, FamiliarElegibilidadEvaluadaItem>();

    familiares.forEach((familiar) => {
        const idFamiliar = toNumber(familiar?.Id_familiar);
        const idPlantilla = toNumber(familiar?.Plantilla?.Id);
        if (idFamiliar <= 0 || idPlantilla <= 0)
            return;
        if (plantillaSeleccionada !== null && idPlantilla !== plantillaSeleccionada)
            return;

        const razones: string[] = [];
        if (!includeHomebrew && familiar?.Oficial === false)
            razones.push('Es una opción homebrew y el filtro Homebrew está desactivado.');

        const nivelesClasePlantilla = (familiar?.Niveles_clase ?? []).filter((nivelClase) =>
            toNumber(nivelClase?.Plantilla?.Id) === idPlantilla
            && toNumber(nivelClase?.Nivel) >= 0
        );
        const doteRequerida = resolverDoteRequeridaPlantilla(nivelesClasePlantilla);
        if (doteRequerida && !tieneDoteActual(dotesActuales, doteRequerida))
            razones.push(`Requiere la dote ${doteRequerida.nombre} para esta plantilla.`);

        const nivelesClaseFuente = nivelesClasePlantilla.filter((nivelClase) =>
            fuentesClaseIds.has(toNumber(nivelClase?.Clase?.Id))
            && (!doteRequerida || resolveDoteIdFromNivelClase(nivelClase) === doteRequerida.id)
        );
        const nivelesClase = nivelesClaseFuente.filter((nivelClase) => toNumber(nivelClase?.Nivel) <= nivelLanzadorFamiliar);
        const nivelMinimoRequerido = nivelesClaseFuente.length > 0
            ? Math.min(...nivelesClaseFuente.map((nivelClase) => Math.max(0, toInt(nivelClase?.Nivel))))
            : null;
        if (nivelesClaseFuente.length < 1) {
            razones.push('Esta criatura no tiene progresión válida para tus clases con familiar.');
        } else if (nivelesClase.length < 1) {
            if (nivelMinimoRequerido !== null && nivelMinimoRequerido > nivelLanzadorFamiliar)
                razones.push(`Necesitas al menos nivel ${nivelMinimoRequerido} de lanzador de familiar para esta opción.`);
            else
                razones.push('No tiene niveles de clase compatibles con tus fuentes actuales de familiar.');
        }

        const requeridosExplicitos = normalizeAlineamientosRequeridos(familiar?.Alineamientos_requeridos?.Familiar ?? []);
        if (requeridosExplicitos.length > 0 || nivelesClasePlantilla.length > 0) {
            let cumpleAlineamiento = false;
            if (requeridosExplicitos.length > 0) {
                cumpleAlineamiento = requeridosExplicitos.some((item) => {
                    const idRequerido = toNumber(item?.id);
                    if (idRequerido > 0 && idAlineamientoBasico > 0 && idRequerido === idAlineamientoBasico)
                        return true;
                    if (alineamientoPersonaje.length > 0 && `${item?.nombreNormalizado ?? ''}`.length > 0)
                        return item.nombreNormalizado === alineamientoPersonaje;
                    return false;
                });
                if (!cumpleAlineamiento) {
                    const requeridosTexto = getAlineamientosRequeridosLabel(requeridosExplicitos);
                    razones.push(`Requiere alineamiento ${requeridosTexto}.`);
                }
            } else if (idAlineamientoBasico > 0) {
                cumpleAlineamiento = nivelesClasePlantilla.some((nivelClase) =>
                    cumpleAlineamientoPorPreferencias(nivelClase, idAlineamientoBasico)
                );
                if (!cumpleAlineamiento) {
                    const detalle = getDetallePreferenciasAlineamiento(nivelesClasePlantilla);
                    if (detalle.length > 0)
                        razones.push(`No cumple las preferencias de alineamiento para este familiar. Exigencias del monstruo: ${detalle}.`);
                    else
                        razones.push('No cumple las preferencias de alineamiento para este familiar.');
                }
            } else {
                razones.push('No se pudo interpretar el alineamiento actual del personaje.');
            }
        }

        const dedupeKey = `${idFamiliar}:${idPlantilla}`;
        const evaluacion: FamiliarElegibilidadEvaluadaItem = {
            familiar,
            elegible: razones.length < 1,
            razones: Array.from(new Set(razones)),
            nivelMinimoRequerido,
        };
        const previa = dedupe.get(dedupeKey);
        if (!previa || (!previa.elegible && evaluacion.elegible)) {
            dedupe.set(dedupeKey, evaluacion);
            return;
        }
        if (!previa.elegible && !evaluacion.elegible) {
            dedupe.set(dedupeKey, {
                ...previa,
                razones: Array.from(new Set([...(previa.razones ?? []), ...(evaluacion.razones ?? [])])),
                nivelMinimoRequerido: previa.nivelMinimoRequerido ?? evaluacion.nivelMinimoRequerido,
            });
        }
    });

    return Array.from(dedupe.values())
        .sort((a, b) => `${a?.familiar?.Nombre ?? ''}`.localeCompare(`${b?.familiar?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
}
