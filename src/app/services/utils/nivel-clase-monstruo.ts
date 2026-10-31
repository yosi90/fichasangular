import { MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { getAlineamientoBasicoIdPorNombre } from 'src/app/services/utils/alineamiento-contrato';
import { normalizarTexto, toInt, toNumber } from 'src/app/services/utils/normalizacion';

// Lo común de las reglas de compañeros animales (companero-reglas.ts) y familiares (familiar-reglas.ts): leer lo que
// pide cada nivel de clase del monstruo (especial, dote y alineamiento) y explicarlo.

export interface AlineamientoRequeridoNormalizado {
    id: number;
    nombre: string;
    nombreNormalizado: string;
}

const ALINEAMIENTO_BASICO_POR_ID: Record<number, string> = {
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

export function resolveDoteIdFromNivelClase(nivelClase: MonstruoNivelClase | null | undefined): number {
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
        const nombreCatalogo = ALINEAMIENTO_BASICO_POR_ID[toNumber(item?.id)];
        if (`${nombreCatalogo ?? ''}`.trim().length > 0)
            return `${nombreCatalogo}`.trim();
        return '';
    }).filter((item) => item.length > 0);

    if (labels.length < 1)
        return 'desconocido';
    return labels.join(', ');
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
    const nombreNormalizado = normalizarTexto(nombre);
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
        const nivel = Math.max(0, toInt(nivelClase?.Nivel));
        const prefijo = nombreClase.length > 0
            ? `${nombreClase} nivel ${nivel}`
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
