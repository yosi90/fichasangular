import { Clase } from 'src/app/interfaces/clase';
import { CompaneroMonstruoDetalle, MonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';

export type CompaneroPlantillaSelector = 'base' | 'elevado' | 'sabandija';

export interface CompaneroFuenteClase {
    idClase: number;
    nombreClase: string;
    nivelActual: number;
}

export interface EstadoCuposCompanero {
    especialId: number;
    fuentes: CompaneroFuenteClase[];
    fuentesClaseIds: number[];
    fuentesTotales: number;
    cuposConsumidos: number;
    cuposDisponibles: number;
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

interface AlineamientoRequeridoNormalizado {
    id: number;
    nombre: string;
    nombreNormalizado: string;
}

const ESPECIAL_COMPANERO_ID = 29;
const DOTE_PLANTILLA_BASE = 0;
const DOTE_PLANTILLA_ELEVADO = 53;
const DOTE_PLANTILLA_SABANDIJA = 56;

const ALIGNMENT_NAME_TO_ID: Record<string, number> = {
    'legal bueno': 1,
    'legal neutral': 2,
    'legal maligno': 3,
    'neutral bueno': 4,
    'neutral autentico': 5,
    'neutral auténtico': 5,
    'neutral verdadero': 5,
    'neutral maligno': 6,
    'caotico bueno': 7,
    'caótico bueno': 7,
    'caotico neutral': 8,
    'caótico neutral': 8,
    'caotico maligno': 9,
    'caótico maligno': 9,
};

const ALIGNMENT_ID_TO_NAME: Record<number, string> = {
    1: 'Legal bueno',
    2: 'Legal neutral',
    3: 'Legal maligno',
    4: 'Neutral bueno',
    5: 'Neutral auténtico',
    6: 'Neutral maligno',
    7: 'Caótico bueno',
    8: 'Caótico neutral',
    9: 'Caótico maligno',
};

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

function toNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value: string): string {
    return `${value ?? ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function resolveEspecialId(especialRaw: any): number {
    return toNumber(
        especialRaw?.Id
        ?? especialRaw?.id
        ?? especialRaw?.Id_especial
        ?? especialRaw?.id_especial
    );
}

function isEspecialCompanero(especialRaw: any): boolean {
    const id = resolveEspecialId(especialRaw);
    if (id === ESPECIAL_COMPANERO_ID)
        return true;
    const nombre = normalizeText(`${especialRaw?.Nombre ?? especialRaw?.nombre ?? ''}`);
    return nombre.includes('companero animal');
}

function resolveAlineamientoBasicoId(nombre: string): number {
    const normalized = normalizeText(nombre);
    return ALIGNMENT_NAME_TO_ID[normalized] ?? 0;
}

function resolveDoteIdFromNivelClase(nivelClase: MonstruoNivelClase | null | undefined): number {
    return toNumber(
        nivelClase?.Dote?.Id
        ?? (nivelClase?.Dote as any)?.id
        ?? (nivelClase as any)?.Id_dote
        ?? (nivelClase as any)?.id_dote
    );
}

function resolveAlineamientoBasicoIdFromRaw(item: any): number {
    return toNumber(
        item?.Id
        ?? item?.id
        ?? item?.Id_basico
        ?? item?.id_basico
        ?? item?.Id_alineamiento
        ?? item?.id_alineamiento
    );
}

function isAlineamientoNombreVisible(nombre: string): boolean {
    if (!nombre)
        return false;
    return nombre !== 'no aplica'
        && nombre !== 'no especifica'
        && nombre !== 'no se especifica'
        && nombre !== '-'
        && nombre !== 'cualquiera'
        && nombre !== 'ninguno';
}

function normalizeAlineamientosRequeridos(raw: any[]): AlineamientoRequeridoNormalizado[] {
    const items = Array.isArray(raw) ? raw : [];
    const dedupe = new Map<string, AlineamientoRequeridoNormalizado>();

    items.forEach((item) => {
        const id = resolveAlineamientoBasicoIdFromRaw(item);
        const nombreRaw = `${item?.Nombre ?? item?.nombre ?? ''}`.trim();
        const nombreNormalizado = normalizeText(nombreRaw);
        const nombreVisible = isAlineamientoNombreVisible(nombreNormalizado) ? nombreRaw : '';
        if (id <= 0 && nombreVisible.length < 1)
            return;
        const clave = `${id}:${normalizeText(nombreVisible)}`;
        if (dedupe.has(clave))
            return;
        dedupe.set(clave, {
            id: Math.max(0, id),
            nombre: nombreVisible,
            nombreNormalizado: normalizeText(nombreVisible),
        });
    });

    return Array.from(dedupe.values());
}

function getAlineamientosRequeridosLabel(items: AlineamientoRequeridoNormalizado[]): string {
    const labels = items.map((item) => {
        if (`${item?.nombre ?? ''}`.trim().length > 0)
            return `${item.nombre}`.trim();
        const nombreCatalogo = ALIGNMENT_ID_TO_NAME[toNumber(item?.id)];
        if (`${nombreCatalogo ?? ''}`.trim().length > 0)
            return `${nombreCatalogo}`.trim();
        return '';
    }).filter((item) => item.length > 0);

    if (labels.length < 1)
        return 'desconocido';
    return labels.join(', ');
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

    const nivelMaximo = Math.max(0, Math.trunc(toNumber(nivelActual)));
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

function dedupeFuentes(fuentes: CompaneroFuenteClase[]): CompaneroFuenteClase[] {
    const byClassId = new Map<number, CompaneroFuenteClase>();
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

function resolveNivelEfectivoCompaneroByClase(idClase: number, nivelActual: number): number {
    const nivel = Math.max(0, Math.trunc(toNumber(nivelActual)));
    if (idClase === 5)
        return nivel;
    if (idClase === 6)
        return Math.floor(nivel / 2);
    return nivel;
}

function cumplePreferenciaLegal(idPreferencia: number, idAlineamientoBasico: number): boolean {
    if (idPreferencia < 4 || idPreferencia > 9)
        return true;
    if (idPreferencia === 4)
        return idAlineamientoBasico < 4;
    if (idPreferencia === 5)
        return idAlineamientoBasico > 3 && idAlineamientoBasico < 7;
    if (idPreferencia === 6)
        return idAlineamientoBasico > 6;
    if (idPreferencia === 7)
        return idAlineamientoBasico > 3;
    if (idPreferencia === 8)
        return idAlineamientoBasico < 4 || idAlineamientoBasico > 6;
    if (idPreferencia === 9)
        return idAlineamientoBasico < 7;
    return true;
}

function cumplePreferenciaMoral(idPreferencia: number, idAlineamientoBasico: number): boolean {
    if (idPreferencia < 4 || idPreferencia > 9)
        return true;
    if (idPreferencia === 4)
        return idAlineamientoBasico === 1 || idAlineamientoBasico === 4 || idAlineamientoBasico === 7;
    if (idPreferencia === 5)
        return idAlineamientoBasico === 2 || idAlineamientoBasico === 5 || idAlineamientoBasico === 8;
    if (idPreferencia === 6)
        return idAlineamientoBasico === 3 || idAlineamientoBasico === 6 || idAlineamientoBasico === 9;
    if (idPreferencia === 7)
        return idAlineamientoBasico !== 1 && idAlineamientoBasico !== 4 && idAlineamientoBasico !== 7;
    if (idPreferencia === 8)
        return idAlineamientoBasico !== 2 && idAlineamientoBasico !== 5 && idAlineamientoBasico !== 8;
    if (idPreferencia === 9)
        return idAlineamientoBasico !== 3 && idAlineamientoBasico !== 6 && idAlineamientoBasico !== 9;
    return true;
}

function cumpleAlineamientoPorPreferencias(
    nivelClase: MonstruoNivelClase,
    idAlineamientoBasico: number
): boolean {
    const idLegal = toNumber(nivelClase?.Preferencia_legal?.Id);
    const idMoral = toNumber(nivelClase?.Preferencia_moral?.Id);
    return cumplePreferenciaLegal(idLegal, idAlineamientoBasico)
        && cumplePreferenciaMoral(idMoral, idAlineamientoBasico);
}

function getPreferenciaEjeLabel(
    idPreferencia: number,
    nombrePreferencia: string,
    eje: 'legal' | 'moral'
): string | null {
    const nombre = `${nombrePreferencia ?? ''}`.trim();
    const nombreNormalizado = normalizeText(nombre);
    const nombreVisible = nombre.length > 0
        && nombreNormalizado !== 'ninguna preferencia'
        && nombreNormalizado !== 'no aplica'
        && nombreNormalizado !== 'no especifica'
        && nombreNormalizado !== '-'
        && nombreNormalizado !== 'cualquiera';
    if (nombreVisible)
        return nombre;

    if (idPreferencia < 4 || idPreferencia > 9)
        return null;

    if (eje === 'legal') {
        if (idPreferencia === 4)
            return 'Legal';
        if (idPreferencia === 5)
            return 'Neutral';
        if (idPreferencia === 6)
            return 'Caótico';
        if (idPreferencia === 7)
            return 'No legal';
        if (idPreferencia === 8)
            return 'No neutral';
        if (idPreferencia === 9)
            return 'No caótico';
    } else {
        if (idPreferencia === 4)
            return 'Bueno';
        if (idPreferencia === 5)
            return 'Neutral';
        if (idPreferencia === 6)
            return 'Maligno';
        if (idPreferencia === 7)
            return 'No bueno';
        if (idPreferencia === 8)
            return 'No neutral';
        if (idPreferencia === 9)
            return 'No maligno';
    }

    return null;
}

function getDetallePreferenciasAlineamiento(nivelesClase: MonstruoNivelClase[]): string {
    const lista = Array.isArray(nivelesClase) ? nivelesClase : [];
    const detalles = new Set<string>();

    lista.forEach((nivelClase) => {
        const legal = getPreferenciaEjeLabel(
            toNumber(nivelClase?.Preferencia_legal?.Id),
            `${nivelClase?.Preferencia_legal?.Nombre ?? ''}`,
            'legal'
        );
        const moral = getPreferenciaEjeLabel(
            toNumber(nivelClase?.Preferencia_moral?.Id),
            `${nivelClase?.Preferencia_moral?.Nombre ?? ''}`,
            'moral'
        );
        const partes: string[] = [];
        if (legal)
            partes.push(`legal: ${legal}`);
        if (moral)
            partes.push(`moral: ${moral}`);
        if (partes.length < 1)
            return;

        const nombreClase = `${nivelClase?.Clase?.Nombre ?? ''}`.trim();
        const nivel = Math.max(0, Math.trunc(toNumber(nivelClase?.Nivel)));
        const prefijo = nombreClase.length > 0
            ? `${nombreClase} nivel ${nivel}`
            : `Nivel ${nivel}`;
        detalles.add(`${prefijo} (${partes.join(', ')})`);
    });

    return Array.from(detalles.values()).join('; ');
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
    const desglose = Array.isArray(personaje?.desgloseClases) ? personaje.desgloseClases : [];
    const clases = Array.isArray(catalogoClases) ? catalogoClases : [];

    const fuentesRaw: CompaneroFuenteClase[] = desglose.map((entrada) => {
        const nombreClase = `${entrada?.Nombre ?? ''}`.trim();
        const nivelActual = Math.max(0, Math.trunc(toNumber(entrada?.Nivel)));
        const clase = clases.find((item) =>
            normalizeText(item?.Nombre ?? '') === normalizeText(nombreClase)
        );
        if (!claseOtorgaFuenteCompanero(clase, nivelActual))
            return null;
        return {
            idClase: toNumber(clase?.Id),
            nombreClase: `${clase?.Nombre ?? nombreClase}`.trim(),
            nivelActual,
        };
    }).filter((item): item is CompaneroFuenteClase => !!item);

    const fuentes = dedupeFuentes(fuentesRaw);
    const fuentesClaseIds = fuentes
        .map((fuente) => toNumber(fuente?.idClase))
        .filter((id) => id > 0);
    const fuentesTotales = fuentesClaseIds.length;
    const cuposConsumidos = (personaje?.Companeros ?? []).length;
    const cuposDisponibles = Math.max(0, fuentesTotales - cuposConsumidos);
    const nivelEfectivoCompanero = fuentes.reduce((acc, fuente) =>
        acc + resolveNivelEfectivoCompaneroByClase(toNumber(fuente?.idClase), toNumber(fuente?.nivelActual))
    , 0);

    return {
        especialId: ESPECIAL_COMPANERO_ID,
        fuentes,
        fuentesClaseIds,
        fuentesTotales,
        cuposConsumidos,
        cuposDisponibles,
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
    const alineamientoPersonaje = normalizeText(input?.alineamientoPersonaje ?? '');
    const idAlineamientoBasico = resolveAlineamientoBasicoId(input?.alineamientoPersonaje ?? '');
    const nivelSeleccionado = Math.max(0, Math.trunc(toNumber(input?.nivelSeleccionado)));
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
            ? Math.min(...nivelesClaseFuenteYDote.map((nivelClase) => Math.max(0, Math.trunc(toNumber(nivelClase?.Nivel)))))
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
        .sort((a, b) => `${a?.companero?.Nombre ?? ''}`.localeCompare(`${b?.companero?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
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
            const nivel = Math.trunc(toNumber(nivelClase?.Nivel));
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

    return resultado.sort((a, b) =>
        `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' })
    );
}
