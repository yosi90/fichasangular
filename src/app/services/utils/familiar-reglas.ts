import { Clase } from 'src/app/interfaces/clase';
import { FamiliarMonstruoDetalle, MonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';

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
    plantillaSeleccionada: FamiliarPlantillaId;
    incluirHomebrew: boolean;
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

function isEspecialConvocarFamiliar(especialRaw: any): boolean {
    const id = resolveEspecialId(especialRaw);
    if (id === ESPECIAL_CONVOCAR_FAMILIAR_ID)
        return true;
    const nombre = normalizeText(
        `${especialRaw?.Nombre ?? especialRaw?.nombre ?? ''}`
    );
    return nombre.includes('convocar a un familiar');
}

function claseOtorgaFuenteFamiliar(clase: Clase | null | undefined, nivelActual: number): boolean {
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
        const tieneEspecial47 = especiales.some((especialNivel) =>
            isEspecialConvocarFamiliar(especialNivel?.Especial)
        );
        if (tieneEspecial47)
            return true;
    }

    return false;
}

function resolveAlineamientoBasicoId(nombre: string): number {
    const normalized = normalizeText(nombre);
    return ALIGNMENT_NAME_TO_ID[normalized] ?? 0;
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
        const nivelActual = Math.max(0, Math.trunc(toNumber(entrada?.Nivel)));
        const clase = clases.find((item) =>
            normalizeText(item?.Nombre ?? '') === normalizeText(nombreClase)
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
    const familiares = Array.isArray(input?.familiares) ? input.familiares : [];
    const fuentesClaseIds = new Set(
        (input?.estado?.fuentesClaseIds ?? [])
            .map((id) => toNumber(id))
            .filter((id) => id > 0)
    );
    const nivelLanzadorFamiliar = Math.max(0, toNumber(input?.estado?.nivelLanzadorFamiliar));
    const plantillaSeleccionada = Math.max(1, Math.min(5, toNumber(input?.plantillaSeleccionada, 1))) as FamiliarPlantillaId;
    const includeHomebrew = !!input?.incluirHomebrew;
    const alineamientoPersonaje = normalizeText(input?.alineamientoPersonaje ?? '');
    const idAlineamientoBasico = resolveAlineamientoBasicoId(input?.alineamientoPersonaje ?? '');

    const dedupe = new Set<string>();
    const resultado: FamiliarMonstruoDetalle[] = [];

    familiares.forEach((familiar) => {
        const idFamiliar = toNumber(familiar?.Id_familiar);
        const idPlantilla = toNumber(familiar?.Plantilla?.Id);
        if (idFamiliar <= 0 || idPlantilla <= 0)
            return;
        if (idPlantilla !== plantillaSeleccionada)
            return;
        if (!includeHomebrew && familiar?.Oficial === false)
            return;

        const nivelesClase = (familiar?.Niveles_clase ?? []).filter((nivelClase) =>
            fuentesClaseIds.has(toNumber(nivelClase?.Clase?.Id))
            && toNumber(nivelClase?.Nivel) >= 0
            && toNumber(nivelClase?.Nivel) <= nivelLanzadorFamiliar
        );
        if (nivelesClase.length < 1)
            return;

        const requeridosExplicitos = (familiar?.Alineamientos_requeridos?.Familiar ?? [])
            .map((item) => normalizeText(item?.Nombre ?? ''))
            .filter((nombre) => nombre.length > 0);

        let cumpleAlineamiento = false;
        if (requeridosExplicitos.length > 0) {
            cumpleAlineamiento = alineamientoPersonaje.length > 0
                && requeridosExplicitos.some((nombre) => nombre === alineamientoPersonaje);
        } else if (idAlineamientoBasico > 0) {
            cumpleAlineamiento = nivelesClase.some((nivelClase) =>
                cumpleAlineamientoPorPreferencias(nivelClase, idAlineamientoBasico)
            );
        }

        if (!cumpleAlineamiento)
            return;

        const dedupeKey = `${idFamiliar}:${idPlantilla}`;
        if (dedupe.has(dedupeKey))
            return;
        dedupe.add(dedupeKey);
        resultado.push(familiar);
    });

    resultado.sort((a, b) =>
        `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' })
    );
    return resultado;
}
