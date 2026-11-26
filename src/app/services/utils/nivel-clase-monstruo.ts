import { MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { getAlineamientoBasicoIdPorNombre, getVectorDesdeIdBasico, incumplePreferenciaAlineamiento, nombreDeAlineamientoBasico, reglaDePreferenciaAlineamiento, ReglaPreferenciaAlineamiento } from 'src/app/services/utils/alineamiento-contrato';
import { normalizarTexto, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { textoConSigno } from './equipo-texto';
import { origenDeNivelDeClase } from './niveles-creacion';

// Lo común de las reglas de compañeros animales (companero-reglas.ts) y familiares (familiar-reglas.ts): leer lo que
// pide cada fila de `Niveles_clase` del monstruo (su plantilla, su dote y su alineamiento) y explicarlo.

export interface AlineamientoRequeridoNormalizado {
    id: number;
    nombre: string;
    nombreNormalizado: string;
}

export function resolveDoteIdFromNivelClase(nivelClase: MonstruoNivelClase | null | undefined): number {
    return toNumber(
        nivelClase?.Dote?.Id
        ?? (nivelClase?.Dote as any)?.id
        ?? (nivelClase as any)?.Id_dote
        ?? (nivelClase as any)?.id_dote
    );
}

function resolveDoteNombreFromNivelClase(nivelClase: MonstruoNivelClase | null | undefined): string {
    return `${nivelClase?.Dote?.Nombre
        ?? (nivelClase?.Dote as any)?.nombre
        ?? (nivelClase as any)?.Dote_nombre
        ?? (nivelClase as any)?.dote_nombre
        ?? ''}`.trim();
}

/** La dote que pide una fila de `Niveles_clase` (Dragón familiar, Compañero elevado…); `null` si no pide ninguna. */
export function doteDeNivelClase(nivelClase: MonstruoNivelClase | null | undefined): { id: number; nombre: string; } | null {
    const id = resolveDoteIdFromNivelClase(nivelClase);
    if (id <= 0)
        return null;
    return { id, nombre: resolveDoteNombreFromNivelClase(nivelClase) || `Dote ${id}` };
}

/** La plantilla de una fila de `Niveles_clase` (la pseudoplantilla del familiar o la del compañero); sin ella, 0. */
export function idPlantillaDeNivel(nivelClase: MonstruoNivelClase | null | undefined): number {
    return Math.max(0, toInt(nivelClase?.Plantilla?.Id));
}

/**
 * El ajuste de una fila de `Niveles_clase` (o de su lista) dicho con signo: «−3»; el de una fila con `Especial` puede sumar
 * («+3», el tejón del explorador gnomo). Vacío si no ajusta.
 */
export function textoDelAjuste(ajuste: unknown): string {
    const valor = toInt(ajuste);
    return valor !== 0 ? textoConSigno(valor, '−') : '';
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

/** Un alineamiento requerido con nombre propio. «Cualquiera» no lo es; los de relleno ya llegan a `null`. */
function isAlineamientoNombreVisible(nombre: string): boolean {
    return nombre.length > 0 && nombre !== 'cualquiera';
}

function normalizeAlineamientosRequeridos(raw: any[]): AlineamientoRequeridoNormalizado[] {
    const items = Array.isArray(raw) ? raw : [];
    const dedupe = new Map<string, AlineamientoRequeridoNormalizado>();

    items.forEach((item) => {
        const id = resolveAlineamientoBasicoIdFromRaw(item);
        const nombreRaw = `${item?.Nombre ?? item?.nombre ?? ''}`.trim();
        const nombreNormalizado = normalizarTexto(nombreRaw);
        const nombreVisible = isAlineamientoNombreVisible(nombreNormalizado) ? nombreRaw : '';
        if (id <= 0 && nombreVisible.length < 1)
            return;
        const clave = `${id}:${normalizarTexto(nombreVisible)}`;
        if (dedupe.has(clave))
            return;
        dedupe.set(clave, {
            id: Math.max(0, id),
            nombre: nombreVisible,
            nombreNormalizado: normalizarTexto(nombreVisible),
        });
    });

    return Array.from(dedupe.values());
}

function getAlineamientosRequeridosLabel(items: AlineamientoRequeridoNormalizado[]): string {
    const labels = items.map((item) => {
        if (`${item?.nombre ?? ''}`.trim().length > 0)
            return `${item.nombre}`.trim();
        const nombreCatalogo = nombreDeAlineamientoBasico(toNumber(item?.id));
        if (`${nombreCatalogo ?? ''}`.trim().length > 0)
            return `${nombreCatalogo}`.trim();
        return '';
    }).filter((item) => item.length > 0);

    if (labels.length < 1)
        return 'desconocido';
    return labels.join(', ');
}

/**
 * Si el alineamiento cumple las preferencias de la fila, con su dato (`Valor`, `Prohibe`, `Id_prioridad`), como la API
 * (`utils/mascota_alineamiento.incumple`; contrato: `catalogos.md`, `Preferencia_legal`): solo cuentan las estrictas
 * («siempre» y «nunca», las de prioridad 3), por su valor. Sin el dato (una caché de antes) no exige nada.
 */
function cumpleAlineamientoPorPreferencias(
    nivelClase: MonstruoNivelClase,
    idAlineamientoBasico: number
): boolean {
    const vector = getVectorDesdeIdBasico(idAlineamientoBasico);
    if (!vector)
        return true;
    return !incumplePreferenciaAlineamiento(reglaQueExige(nivelClase?.Preferencia_legal), vector.ley)
        && !incumplePreferenciaAlineamiento(reglaQueExige(nivelClase?.Preferencia_moral), vector.moral);
}

/**
 * La regla de la preferencia de un eje si exige algo (con su dato, solo las estrictas), o `null`: la que juzga el
 * alineamiento y la que se nombra en el motivo.
 */
function reglaQueExige(preferencia: MonstruoNivelClase['Preferencia_legal'] | null | undefined): ReglaPreferenciaAlineamiento | null {
    const regla = reglaDePreferenciaAlineamiento(preferencia);
    return regla?.estricta ? regla : null;
}

function getDetallePreferenciasAlineamiento(nivelesClase: MonstruoNivelClase[]): string {
    const lista = Array.isArray(nivelesClase) ? nivelesClase : [];
    const detalles = new Set<string>();

    lista.forEach((nivelClase) => {
        const nombreDe = (p: MonstruoNivelClase['Preferencia_legal'] | null | undefined) =>
            reglaQueExige(p) ? `${p?.Nombre ?? ''}`.trim() || null : null;
        const legal = nombreDe(nivelClase?.Preferencia_legal);
        const moral = nombreDe(nivelClase?.Preferencia_moral);
        const partes: string[] = [];
        if (legal)
            partes.push(`legal: ${legal}`);
        if (moral)
            partes.push(`moral: ${moral}`);
        if (partes.length < 1)
            return;

        const nombreClase = `${nivelClase?.Clase?.Nombre ?? ''}`.trim();
        const nivel = Math.max(0, toInt(nivelClase?.Nivel));
        const prefijo = nombreClase.length > 0
            ? origenDeNivelDeClase(nombreClase, nivel)
            : `Nivel ${nivel}`;
        detalles.add(`${prefijo} (${partes.join(', ')})`);
    });

    return Array.from(detalles.values()).join('; ');
}

/**
 * Por qué el alineamiento del personaje no le deja tener esta mascota; vacío si lo cumple o si no hay nada que comprobar.
 * Cuentan los alineamientos que pide el monstruo (`Alineamientos_requeridos`) o, si no pide ninguno, las preferencias de
 * las filas de `Niveles_clase` que le valen al personaje. `mascota` es el sustantivo de los mensajes («familiar»,
 * «compañero»). Un solo sitio para los familiares (familiar-reglas.ts) y los compañeros animales (companero-reglas.ts).
 */
export function razonesAlineamientoMascota(
    requeridosRaw: any[],
    nivelesClase: MonstruoNivelClase[],
    alineamientoPersonaje: string,
    mascota: string
): string[] {
    const requeridos = normalizeAlineamientosRequeridos(requeridosRaw);
    const niveles = Array.isArray(nivelesClase) ? nivelesClase : [];
    if (requeridos.length < 1 && niveles.length < 1)
        return [];

    const alineamientoNormalizado = normalizarTexto(alineamientoPersonaje ?? '');
    const idAlineamientoBasico = getAlineamientoBasicoIdPorNombre(alineamientoPersonaje ?? '');
    if (requeridos.length > 0) {
        const cumple = requeridos.some((item) => {
            const idRequerido = toNumber(item?.id);
            if (idRequerido > 0 && idAlineamientoBasico > 0 && idRequerido === idAlineamientoBasico)
                return true;
            if (alineamientoNormalizado.length > 0 && `${item?.nombreNormalizado ?? ''}`.length > 0)
                return item.nombreNormalizado === alineamientoNormalizado;
            return false;
        });
        return cumple ? [] : [`Requiere alineamiento ${getAlineamientosRequeridosLabel(requeridos)}.`];
    }

    if (!(idAlineamientoBasico > 0))
        return ['No se pudo interpretar el alineamiento actual del personaje.'];
    if (niveles.some((nivelClase) => cumpleAlineamientoPorPreferencias(nivelClase, idAlineamientoBasico)))
        return [];
    const detalle = getDetallePreferenciasAlineamiento(niveles);
    return [detalle.length > 0
        ? `No cumple las preferencias de alineamiento para este ${mascota}. Exigencias del monstruo: ${detalle}.`
        : `No cumple las preferencias de alineamiento para este ${mascota}.`];
}
