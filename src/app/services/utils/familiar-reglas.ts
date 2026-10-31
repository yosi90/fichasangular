import { Clase } from 'src/app/interfaces/clase';
import { FamiliarMonstruoDetalle, MonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { normalizarTexto, toBoolean, toInt, toNumber, toPositiveInt } from 'src/app/services/utils/normalizacion';
import { razonesAlineamientoMascota, resolveDoteIdFromNivelClase } from 'src/app/services/utils/nivel-clase-monstruo';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import { CupoMascota, idsClasesFuente, resolverCupoMascota } from 'src/app/services/utils/mascota-cupos';

/**
 * Id de la pseudoplantilla de un familiar (`Niveles_clase[].Plantilla.Id` de los monstruos, `Pseudoplantillas_familiares`
 * en la base). Sale de los datos: cualquier pseudoplantilla que dé el contrato vale, no solo las cinco del Manual del jugador.
 */
export type FamiliarPlantillaId = number;

/** Una pseudoplantilla de familiar tal como la da el contrato (la `Plantilla` de cada fila de `Niveles_clase`). */
export type FamiliarPlantillaOpcion = MonstruoNivelClase['Plantilla'];

export interface EstadoCuposFamiliar extends CupoMascota {
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

function idPlantillaDeNivel(nivel: MonstruoNivelClase | null | undefined): number {
    return Math.max(0, toInt(nivel?.Plantilla?.Id));
}

function nombrePlantillaDeNivel(nivel: MonstruoNivelClase | null | undefined): string {
    return `${nivel?.Plantilla?.Nombre ?? ''}`.trim();
}

/**
 * Las pseudoplantillas que el catálogo da a las clases con familiar del personaje (todas, si no hay ninguna), una vez
 * cada una y por nombre: son las opciones del filtro de plantilla del selector.
 */
export function plantillasFamiliarDisponibles(
    familiares: FamiliarMonstruoDetalle[],
    fuentesClaseIds: number[] = []
): FamiliarPlantillaOpcion[] {
    const fuentes = idsClasesFuente(fuentesClaseIds);
    const plantillas = new Map<number, FamiliarPlantillaOpcion>();
    (Array.isArray(familiares) ? familiares : []).forEach((familiar) => {
        (familiar?.Niveles_clase ?? []).forEach((nivel) => {
            const id = idPlantillaDeNivel(nivel);
            if (id < 1 || (fuentes.size > 0 && !fuentes.has(toNumber(nivel?.Clase?.Id))))
                return;
            // El primer nombre que no esté vacío, como en el catálogo de familiares.
            if (!plantillas.get(id)?.Nombre)
                plantillas.set(id, { Id: id, Nombre: nombrePlantillaDeNivel(nivel) });
        });
    });
    return Array.from(plantillas.values()).sort(porNombre);
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
                .map((nivel) => idPlantillaDeNivel(nivel))
                .filter((id) => id >= 1)
        ));

        plantillas.forEach((idPlantilla) => {
            const nivelesPlantilla = nivelesClase.filter((nivel) =>
                idPlantillaDeNivel(nivel) === idPlantilla
            );
            if (nivelesPlantilla.length < 1)
                return;

            const clave = `${baseId}:${idPlantilla}`;
            if (dedupe.has(clave))
                return;
            dedupe.add(clave);

            const plantillaNombre = nivelesPlantilla
                .map((nivel) => nombrePlantillaDeNivel(nivel))
                .find((nombre) => nombre.length > 0) ?? '';

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

    return resultado.sort(porNombre);
}

/** El especial que da un familiar lo dice la API (`Otorga_familiar`: «Convocar a un familiar» del hechicero y del mago). */
function isEspecialConvocarFamiliar(especialRaw: any): boolean {
    return toBoolean(especialRaw?.Otorga_familiar);
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
        const daFamiliar = especiales.some((especialNivel) =>
            isEspecialConvocarFamiliar(especialNivel?.Especial)
        );
        if (daFamiliar)
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

/** La dote que pide una fila de `Niveles_clase` (la de *Familiar celestial*, por ejemplo); `null` si no pide ninguna. */
function doteDeNivelClase(nivelClase: MonstruoNivelClase | null | undefined): { id: number; nombre: string; } | null {
    const id = resolveDoteIdFromNivelClase(nivelClase);
    if (id <= 0)
        return null;
    return {
        id,
        nombre: resolveDoteNombreFromNivelClase(nivelClase) || `Dote ${id}`,
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

export function resolverEstadoCuposFamiliarEspecial47(
    personaje: Personaje,
    catalogoClases: Clase[]
): EstadoCuposFamiliar {
    const cupo = resolverCupoMascota(personaje, catalogoClases, claseOtorgaFuenteFamiliar, personaje?.Familiares);
    const nivelLanzadorFamiliar = cupo.fuentes.reduce((acc, fuente) => acc + Math.max(0, toNumber(fuente?.nivelActual)), 0);

    return {
        ...cupo,
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
    const fuentesClaseIds = idsClasesFuente(input?.estado?.fuentesClaseIds);
    const nivelLanzadorFamiliar = Math.max(0, toNumber(input?.estado?.nivelLanzadorFamiliar));
    const plantillaSeleccionada: FamiliarPlantillaId | null = toPositiveInt(input?.plantillaSeleccionada);
    const includeHomebrew = !!input?.incluirHomebrew;
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

        // Cada fila de `Niveles_clase` es una forma de tener esta criatura con esta plantilla: la de una clase, con su
        // nivel, su dote y su preferencia de alineamiento (en el convocador divino, la de su senda). Vale si una fila de
        // las clases con familiar del personaje lo cumple todo; la dote de otra clase no se pide.
        const nivelesClasePlantilla = (familiar?.Niveles_clase ?? []).filter((nivelClase) =>
            idPlantillaDeNivel(nivelClase) === idPlantilla
            && toNumber(nivelClase?.Nivel) >= 0
        );
        const nivelesClaseFuente = nivelesClasePlantilla.filter((nivelClase) =>
            fuentesClaseIds.has(toNumber(nivelClase?.Clase?.Id))
        );
        const nivelesConDote = nivelesClaseFuente.filter((nivelClase) => {
            const dote = doteDeNivelClase(nivelClase);
            return !dote || tieneDoteActual(dotesActuales, dote);
        });
        const nivelesConNivel = nivelesConDote.filter((nivelClase) => toNumber(nivelClase?.Nivel) <= nivelLanzadorFamiliar);
        const nivelesParaMinimo = nivelesConDote.length > 0 ? nivelesConDote : nivelesClaseFuente;
        const nivelMinimoRequerido = nivelesParaMinimo.length > 0
            ? Math.min(...nivelesParaMinimo.map((nivelClase) => Math.max(0, toInt(nivelClase?.Nivel))))
            : null;
        if (nivelesClaseFuente.length < 1) {
            razones.push('Esta criatura no tiene progresión válida para tus clases con familiar.');
        } else {
            if (nivelesConDote.length < 1) {
                const dotesFaltantes = new Set(nivelesClaseFuente
                    .map((nivelClase) => doteDeNivelClase(nivelClase)?.nombre ?? '')
                    .filter((nombre) => nombre.length > 0));
                dotesFaltantes.forEach((nombre) => razones.push(`Requiere la dote ${nombre} para esta plantilla.`));
            }
            if (nivelMinimoRequerido !== null && nivelMinimoRequerido > nivelLanzadorFamiliar)
                razones.push(`Necesitas al menos nivel ${nivelMinimoRequerido} de lanzador de familiar para esta opción.`);
        }
        const nivelesAlineamiento = [nivelesConNivel, nivelesConDote, nivelesClaseFuente, nivelesClasePlantilla]
            .find((niveles) => niveles.length > 0) ?? [];

        razones.push(...razonesAlineamientoMascota(
            familiar?.Alineamientos_requeridos?.Familiar ?? [],
            nivelesAlineamiento,
            input?.alineamientoPersonaje ?? '',
            'familiar'
        ));

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
        .sort((a, b) => compararTexto(a?.familiar?.Nombre, b?.familiar?.Nombre));
}
