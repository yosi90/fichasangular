import { Clase } from 'src/app/interfaces/clase';
import { CompaneroMonstruoDetalle, MonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
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
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import { CupoMascota, resolverCupoMascota } from 'src/app/services/utils/mascota-cupos';

export type CompaneroPlantillaSelector = 'base' | 'elevado' | 'sabandija';

export interface EstadoCuposCompanero extends CupoMascota {
    especialId: number;
    nivelEfectivoCompanero: number;
}

export interface FiltroCompanerosElegiblesInput {
    companeros: CompaneroMonstruoDetalle[];
    estado: EstadoCuposCompanero;
    alineamientoPersonaje: string;
    plantillaSeleccionada: CompaneroPlantillaSelector | null;
    incluirHomebrew: boolean;
    tieneDoteElevado: boolean;
    tieneDoteSabandija: boolean;
    nivelSeleccionado?: number | null;
}

export interface CompaneroElegibilidadEvaluadaItem {
    companero: CompaneroMonstruoDetalle;
    elegible: boolean;
    razones: string[];
    nivelMinimoRequerido: number | null;
}

const ESPECIAL_COMPANERO_ID = 29;
const DOTE_PLANTILLA_BASE = 0;
const DOTE_PLANTILLA_ELEVADO = 53;
const DOTE_PLANTILLA_SABANDIJA = 56;

const PLANTILLA_SELECTOR_TO_ID: Record<CompaneroPlantillaSelector, number> = {
    base: 1,
    elevado: 2,
    sabandija: 3,
};

const PLANTILLA_SELECTOR_TO_DOTE: Record<CompaneroPlantillaSelector, number> = {
    base: DOTE_PLANTILLA_BASE,
    elevado: DOTE_PLANTILLA_ELEVADO,
    sabandija: DOTE_PLANTILLA_SABANDIJA,
};

function isEspecialCompanero(especialRaw: any): boolean {
    const id = resolveEspecialId(especialRaw);
    if (id === ESPECIAL_COMPANERO_ID)
        return true;
    const nombre = normalizarTexto(`${especialRaw?.Nombre ?? especialRaw?.nombre ?? ''}`);
    return nombre.includes('companero animal');
}

function getPlantillaNombreBySelector(selector: CompaneroPlantillaSelector): string {
    if (selector === 'elevado')
        return 'Elevado';
    if (selector === 'sabandija')
        return 'Sabandija';
    return 'Base';
}

function claseOtorgaFuenteCompanero(clase: Clase | null | undefined, nivelActual: number): boolean {
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
        const tieneEspecialCompanero = especiales.some((especialNivel) =>
            isEspecialCompanero(especialNivel?.Especial)
        );
        if (tieneEspecialCompanero)
            return true;
    }

    return false;
}

function resolveNivelEfectivoCompaneroByClase(idClase: number, nivelActual: number): number {
    const nivel = Math.max(0, toInt(nivelActual));
    if (idClase === 5)
        return nivel;
    if (idClase === 6)
        return Math.floor(nivel / 2);
    return nivel;
}

export function getPlantillaIdCompanero(selector: CompaneroPlantillaSelector): number {
    return PLANTILLA_SELECTOR_TO_ID[selector];
}

export function getDoteIdRequeridaCompanero(selector: CompaneroPlantillaSelector): number {
    return PLANTILLA_SELECTOR_TO_DOTE[selector];
}

export function resolverEstadoCuposCompaneroEspecial29(
    personaje: Personaje,
    catalogoClases: Clase[]
): EstadoCuposCompanero {
    const cupo = resolverCupoMascota(personaje, catalogoClases, claseOtorgaFuenteCompanero, personaje?.Companeros);
    const nivelEfectivoCompanero = cupo.fuentes.reduce((acc, fuente) =>
        acc + resolveNivelEfectivoCompaneroByClase(toNumber(fuente?.idClase), toNumber(fuente?.nivelActual))
    , 0);

    return {
        especialId: ESPECIAL_COMPANERO_ID,
        ...cupo,
        nivelEfectivoCompanero,
    };
}

export function filtrarCompanerosElegibles(input: FiltroCompanerosElegiblesInput): CompaneroMonstruoDetalle[] {
    return evaluarCompanerosElegibilidad(input)
        .filter((item) => item.elegible)
        .map((item) => item.companero);
}

export function evaluarCompanerosElegibilidad(input: FiltroCompanerosElegiblesInput): CompaneroElegibilidadEvaluadaItem[] {
    const companeros = Array.isArray(input?.companeros) ? input.companeros : [];
    const fuentesClaseIds = new Set(
        (input?.estado?.fuentesClaseIds ?? [])
            .map((id) => toNumber(id))
            .filter((id) => id > 0)
    );
    const nivelEfectivoCompanero = Math.max(0, toNumber(input?.estado?.nivelEfectivoCompanero));
    const plantillaSeleccionada = input?.plantillaSeleccionada ?? null;
    const includeHomebrew = !!input?.incluirHomebrew;
    const alineamientoPersonaje = normalizarTexto(input?.alineamientoPersonaje ?? '');
    const idAlineamientoBasico = getAlineamientoBasicoIdPorNombre(input?.alineamientoPersonaje ?? '');
    const nivelSeleccionado = Math.max(0, toInt(input?.nivelSeleccionado));
    const plantillaIdEsperada = plantillaSeleccionada ? getPlantillaIdCompanero(plantillaSeleccionada) : 0;
    const dedupe = new Map<string, CompaneroElegibilidadEvaluadaItem>();

    companeros.forEach((companero) => {
        const idCompanero = toNumber(companero?.Id_companero);
        const idPlantilla = toNumber(companero?.Plantilla?.Id);
        if (idCompanero <= 0 || idPlantilla <= 0)
            return;
        if (plantillaIdEsperada > 0 && idPlantilla !== plantillaIdEsperada)
            return;
        const razones: string[] = [];
        const selectorPlantillaItem: CompaneroPlantillaSelector = idPlantilla === 2 ? 'elevado' : idPlantilla === 3 ? 'sabandija' : 'base';
        const doteRequeridaItem = getDoteIdRequeridaCompanero(selectorPlantillaItem);
        const dotePlantillaDisponible = (doteRequeridaItem !== DOTE_PLANTILLA_ELEVADO || !!input?.tieneDoteElevado)
            && (doteRequeridaItem !== DOTE_PLANTILLA_SABANDIJA || !!input?.tieneDoteSabandija);
        if (!dotePlantillaDisponible) {
            if (doteRequeridaItem === DOTE_PLANTILLA_ELEVADO)
                razones.push('Requiere la dote Compañero elevado para esta plantilla.');
            else if (doteRequeridaItem === DOTE_PLANTILLA_SABANDIJA)
                razones.push('Requiere la dote Compañero sabandija para esta plantilla.');
        }
        if (!includeHomebrew && companero?.Oficial === false)
            razones.push('Es una opción homebrew y el filtro Homebrew está desactivado.');

        const nivelesClaseFuenteYDote = (companero?.Niveles_clase ?? []).filter((nivelClase) => {
            const idClase = toNumber(nivelClase?.Clase?.Id);
            const idDote = resolveDoteIdFromNivelClase(nivelClase);
            if (!fuentesClaseIds.has(idClase))
                return false;
            if (idDote !== doteRequeridaItem)
                return false;
            if (toNumber(nivelClase?.Nivel) < 0)
                return false;
            return true;
        });
        const nivelesClaseContextoDote = (companero?.Niveles_clase ?? []).filter((nivelClase) => {
            const idDote = resolveDoteIdFromNivelClase(nivelClase);
            return idDote === doteRequeridaItem && toNumber(nivelClase?.Nivel) >= 0;
        });
        const nivelesClase = nivelesClaseFuenteYDote.filter((nivelClase) => {
            const nivel = toNumber(nivelClase?.Nivel);
            if (nivel > nivelEfectivoCompanero)
                return false;
            if (nivelSeleccionado > 0 && nivel !== nivelSeleccionado)
                return false;
            return true;
        });
        const nivelMinimoRequerido = nivelesClaseFuenteYDote.length > 0
            ? Math.min(...nivelesClaseFuenteYDote.map((nivelClase) => Math.max(0, toInt(nivelClase?.Nivel))))
            : null;
        if (nivelesClaseFuenteYDote.length < 1) {
            razones.push('Esta criatura no tiene progresión válida para tus clases con compañero animal.');
        } else if (nivelesClase.length < 1) {
            if (nivelSeleccionado > 0)
                razones.push(`No cumple el filtro de nivel ${nivelSeleccionado}.`);
            if (nivelMinimoRequerido !== null && nivelMinimoRequerido > nivelEfectivoCompanero)
                razones.push(`Necesitas al menos nivel ${nivelMinimoRequerido} de druida equivalente para esta opción.`);
            else if (razones.length < 1) {
                razones.push('No tiene niveles de clase compatibles con tus fuentes actuales de compañero.');
            }
        }

        const requeridosExplicitos = normalizeAlineamientosRequeridos(companero?.Alineamientos_requeridos?.Companero ?? []);
        if (requeridosExplicitos.length > 0 || nivelesClaseContextoDote.length > 0) {
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
                cumpleAlineamiento = nivelesClaseContextoDote.some((nivelClase) =>
                    cumpleAlineamientoPorPreferencias(nivelClase, idAlineamientoBasico)
                );
                if (!cumpleAlineamiento) {
                    const detalle = getDetallePreferenciasAlineamiento(nivelesClaseContextoDote);
                    if (detalle.length > 0)
                        razones.push(`No cumple las preferencias de alineamiento para este compañero. Exigencias del monstruo: ${detalle}.`);
                    else
                        razones.push('No cumple las preferencias de alineamiento para este compañero.');
                }
            } else {
                razones.push('No se pudo interpretar el alineamiento actual del personaje.');
            }
        }

        const dedupeKey = `${idCompanero}:${idPlantilla}`;
        const evaluacion: CompaneroElegibilidadEvaluadaItem = {
            companero,
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
        .sort((a, b) => compararTexto(a?.companero?.Nombre, b?.companero?.Nombre));
}

export function resolverNivelesCompaneroDisponibles(input: Omit<FiltroCompanerosElegiblesInput, 'nivelSeleccionado'>): number[] {
    const companeros = filtrarCompanerosElegibles({
        ...input,
        nivelSeleccionado: null,
    });
    const fuentesClaseIds = new Set((input?.estado?.fuentesClaseIds ?? []).map((id) => toNumber(id)).filter((id) => id > 0));
    const nivelEfectivoCompanero = Math.max(0, toNumber(input?.estado?.nivelEfectivoCompanero));
    const doteRequerida = input?.plantillaSeleccionada
        ? getDoteIdRequeridaCompanero(input.plantillaSeleccionada)
        : null;
    const niveles = new Set<number>();

    companeros.forEach((companero) => {
        (companero?.Niveles_clase ?? []).forEach((nivelClase) => {
            const idClase = toNumber(nivelClase?.Clase?.Id);
            const nivel = toInt(nivelClase?.Nivel);
            const idDote = resolveDoteIdFromNivelClase(nivelClase);
            if (!fuentesClaseIds.has(idClase))
                return;
            if (doteRequerida !== null && idDote !== doteRequerida)
                return;
            if (nivel < 0 || nivel > nivelEfectivoCompanero)
                return;
            niveles.add(nivel);
        });
    });

    return Array.from(niveles).sort((a, b) => a - b);
}

export function construirCatalogoCompanerosDesdeMonstruos(monstruos: MonstruoDetalle[]): CompaneroMonstruoDetalle[] {
    const lista = Array.isArray(monstruos) ? monstruos : [];
    const resultado: CompaneroMonstruoDetalle[] = [];
    const dedupe = new Set<string>();
    const plantillas: CompaneroPlantillaSelector[] = ['base', 'elevado', 'sabandija'];

    lista.forEach((monstruo) => {
        if (!monstruo?.Companero)
            return;

        const baseId = toNumber(monstruo?.Id);
        if (baseId <= 0)
            return;

        const nivelesClase = Array.isArray(monstruo?.Niveles_clase) ? monstruo.Niveles_clase : [];
        plantillas.forEach((selectorPlantilla) => {
            const doteId = getDoteIdRequeridaCompanero(selectorPlantilla);
            const plantillaId = getPlantillaIdCompanero(selectorPlantilla);
            const nivelesFiltrados = nivelesClase.filter((nivelClase) =>
                resolveDoteIdFromNivelClase(nivelClase) === doteId
            );
            if (nivelesFiltrados.length < 1)
                return;

            const clave = `${baseId}:${plantillaId}`;
            if (dedupe.has(clave))
                return;
            dedupe.add(clave);

            const nombrePlantillaRaw = `${nivelesFiltrados[0]?.Plantilla?.Nombre ?? ''}`.trim();
            resultado.push({
                ...monstruo,
                Id_companero: baseId,
                Monstruo_origen: {
                    Id: baseId,
                    Nombre: `${monstruo?.Nombre ?? ''}`.trim(),
                },
                Vida: 0,
                Dg_adi: 0,
                Trucos_adi: 0,
                Plantilla: {
                    Id: plantillaId,
                    Nombre: nombrePlantillaRaw.length > 0 ? nombrePlantillaRaw : getPlantillaNombreBySelector(selectorPlantilla),
                },
                Niveles_clase: nivelesFiltrados,
                Especiales: [],
                Personajes: [],
            });
        });
    });

    return resultado.sort(porNombre);
}
