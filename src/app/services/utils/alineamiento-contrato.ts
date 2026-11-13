import { Alineamiento } from 'src/app/interfaces/alineamiento';
import { mayusculaInicial } from 'src/app/services/utils/formato-registros';
import { normalizarTexto, toBoolean, toInt, toIntOrNull } from 'src/app/services/utils/normalizacion';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

export interface AlineamientoVector {
    ley: number;
    moral: number;
}

export interface AlineamientoEjes {
    ley: number | null;
    moral: number | null;
}

const ALINEAMIENTO_POR_NOMBRE: Record<string, AlineamientoVector> = {
    "legal bueno": { ley: 1, moral: 1 },
    "legal neutral": { ley: 1, moral: 0 },
    "legal maligno": { ley: 1, moral: -1 },
    "neutral bueno": { ley: 0, moral: 1 },
    "neutral autentico": { ley: 0, moral: 0 },
    "neutral maligno": { ley: 0, moral: -1 },
    "caotico bueno": { ley: -1, moral: 1 },
    "caotico neutral": { ley: -1, moral: 0 },
    "caotico maligno": { ley: -1, moral: -1 },
};

const BASICO_ID_POR_NOMBRE: Record<string, number> = {
    "legal bueno": 1,
    "legal neutral": 2,
    "legal maligno": 3,
    "neutral bueno": 4,
    "neutral autentico": 5,
    "neutral verdadero": 5,
    "neutral maligno": 6,
    "caotico bueno": 7,
    "caotico neutral": 8,
    "caotico maligno": 9,
};

const NOMBRE_POR_VECTOR: Record<string, string> = {
    "1,1": "Legal bueno",
    "1,0": "Legal neutral",
    "1,-1": "Legal maligno",
    "0,1": "Neutral bueno",
    "0,0": "Neutral autentico",
    "0,-1": "Neutral maligno",
    "-1,1": "Caotico bueno",
    "-1,0": "Caotico neutral",
    "-1,-1": "Caotico maligno",
};

export function esAlineamientoSinPreferencia(valor: string): boolean {
    const n = normalizarTexto(valor);
    return n.length < 1 || n.includes("ninguna preferencia") || n.includes("no aplica");
}

export function getAlineamientoBasicoIdPorNombre(nombre: string): number {
    return BASICO_ID_POR_NOMBRE[normalizarTexto(nombre)] ?? 0;
}

export function getVectorDesdeNombreBasico(nombre: string): AlineamientoVector | null {
    const vector = ALINEAMIENTO_POR_NOMBRE[normalizarTexto(nombre)];
    return vector ? { ...vector } : null;
}

/**
 * Lo que pide una preferencia de ley o de moral, de sus datos (`preferencia_ley`, `preferencia_moral`; bugs.md de
 * sesiones, 2026-11-13): el valor del eje que nombra (`Valor`: 1 legal o bueno, 0 neutral, −1 caótico o maligno; `null`
 * si no pide nada), si lo prohíbe (`Prohibe`: «Nunca …», «Casi nunca …», «Tendencia a no ser …») y lo que pesa ella sola
 * (`Id_prioridad`: 3 «Siempre» y «Nunca», 2 «Casi», 1 «Tendencia»). Nadie lee su nombre para saberlo.
 */
export interface DatoPreferenciaAlineamiento {
    Valor?: number | null;
    Prohibe?: boolean;
    Id_prioridad?: number;
}

/** El dato de una preferencia tal como llega de la API o de la caché (sin `Valor`, no pide nada). */
export function datoDePreferencia(raw: any): Required<DatoPreferenciaAlineamiento> {
    const valor = toIntOrNull(raw?.Valor);
    return {
        Valor: valor === null ? null : Math.max(-1, Math.min(1, valor)),
        Prohibe: toBoolean(raw?.Prohibe),
        Id_prioridad: toInt(raw?.Id_prioridad),
    };
}

/** Lo que pide una preferencia de un eje: el valor del eje (1 legal o bueno, 0 neutral, −1 caótico o maligno) y si lo prohíbe. */
export interface ReglaPreferenciaAlineamiento {
    valor: number;
    prohibe: boolean;
    /** Lo que pesa ella sola (`Id_prioridad`). */
    prioridad: number;
    /** De prioridad «siempre» (3) o más: no se salta sin volver homebrew la ficha, traiga o no esa prioridad el alineamiento. */
    estricta: boolean;
}

/** La prioridad desde la que una regla de alineamiento no se puede saltar sin volver homebrew la ficha («siempre»). */
export const PRIORIDAD_ALINEAMIENTO_ESTRICTA = 3;

/** La regla de una preferencia de ley o de moral, de sus datos, o `null` si no pide nada. */
export function reglaDePreferenciaAlineamiento(preferencia: DatoPreferenciaAlineamiento | null | undefined): ReglaPreferenciaAlineamiento | null {
    const dato = datoDePreferencia(preferencia);
    if (dato.Valor === null)
        return null;
    return {
        valor: dato.Valor,
        prohibe: dato.Prohibe,
        prioridad: dato.Id_prioridad,
        estricta: dato.Id_prioridad >= PRIORIDAD_ALINEAMIENTO_ESTRICTA,
    };
}

/** El valor que exige una preferencia (`null` si no exige ninguno: sin preferencia o una que prohíbe). */
function valorExigido(preferencia: DatoPreferenciaAlineamiento | null | undefined): number | null {
    const regla = reglaDePreferenciaAlineamiento(preferencia);
    return regla && !regla.prohibe ? regla.valor : null;
}

/** El vector (ley, moral) de un alineamiento básico por su id (`alineamientos_basicos`: 1 legal bueno … 9 caótico maligno). */
export function getVectorDesdeIdBasico(idBasico: number): AlineamientoVector | null {
    const nombre = Object.keys(BASICO_ID_POR_NOMBRE).find((clave) => BASICO_ID_POR_NOMBRE[clave] === idBasico);
    return nombre ? getVectorDesdeNombreBasico(nombre) : null;
}

/** Los pasos entre dos alineamientos, sumando los dos ejes (legal bueno → neutral bueno, 1; → caótico maligno, 4). */
export function distanciaEntreAlineamientos(a: AlineamientoVector, b: AlineamientoVector): number {
    return Math.abs(a.ley - b.ley) + Math.abs(a.moral - b.moral);
}

/**
 * Si un alineamiento básico cumple una actitud (`actitudes`: 1 legal, 2 neutral en algún eje, 3 caótico, 4 bueno,
 * 5 maligno). Un solo sitio para las clases, las dotes, las plantillas y las razas.
 */
export function cumpleActitud(idActitud: number, idBasico: number): boolean {
    const vector = getVectorDesdeIdBasico(idBasico);
    if (!vector)
        return false;
    if (idActitud === 1)
        return vector.ley === 1;
    if (idActitud === 2)
        return vector.ley === 0 || vector.moral === 0;
    if (idActitud === 3)
        return vector.ley === -1;
    if (idActitud === 4)
        return vector.moral === 1;
    if (idActitud === 5)
        return vector.moral === -1;
    return false;
}

/**
 * El alineamiento básico (1-9) que pide un prerrequisito de alineamiento de una clase, una dote o una plantilla:
 * `Id_alineamiento_basico` o, sin él, su nombre (`Alineamiento_basico`). Nunca `Id_alineamiento`, que es la combinación
 * de la tabla `alineamientos` (el legal bueno «siempre» es la 3, que como básico sería el legal maligno).
 */
export function idBasicoDePrerrequisitoAlineamiento(entry: Record<string, any>): number {
    const id = Number(entry?.["Id_alineamiento_basico"] ?? entry?.["id_alineamiento_basico"]);
    if (Number.isFinite(id) && id > 0)
        return id;
    return getAlineamientoBasicoIdPorNombre(`${entry?.["Alineamiento_basico"] ?? entry?.["alineamiento_basico"] ?? ""}`);
}

export function nombreBasicoDesdeVector(ley: number, moral: number): string {
    return NOMBRE_POR_VECTOR[`${ley},${moral}`] ?? "Neutral autentico";
}

/** Un eje del alineamiento en minúscula («nunca legal»), o vacío si no tiene preferencia. */
function textoEjeAlineamiento(nombre: string | null | undefined): string {
    const limpio = `${nombre ?? ''}`.trim();
    return tieneTextoVisible(limpio) && !esAlineamientoSinPreferencia(limpio) ? limpio.toLowerCase() : '';
}

/**
 * Las preferencias de ley y de moral como las enseñan los detalles (lienzo aprobado): «Nunca legal», «Siempre caótico,
 * siempre bueno». Las que no tienen preferencia no salen; vacío si no queda ninguna.
 */
export function textoEjesAlineamiento(ley: string | null | undefined, moral: string | null | undefined): string {
    const ejes = [textoEjeAlineamiento(ley), textoEjeAlineamiento(moral)].filter((eje) => eje.length > 0);
    return mayusculaInicial(ejes.filter((eje, indice) => ejes.indexOf(eje) === indice).join(', '));
}

/**
 * El alineamiento de una criatura, una plantilla o una clase como lo enseñan los detalles: el básico («Neutral bueno»)
 * o, sin él, sus preferencias («Nunca legal»), y «Sin preferencia» si ninguna la tiene. Vacío si no hay alineamiento.
 */
export function textoAlineamiento(alineamiento: Alineamiento | null | undefined): string {
    const basico = `${alineamiento?.Basico?.Nombre ?? ''}`.trim();
    if (tieneTextoVisible(basico))
        return basico;
    const ley = alineamiento?.Ley?.Nombre;
    const moral = alineamiento?.Moral?.Nombre;
    const ejes = textoEjesAlineamiento(ley, moral);
    if (ejes.length > 0)
        return ejes;
    return tieneTextoVisible(ley) || tieneTextoVisible(moral) ? 'Sin preferencia' : '';
}

/**
 * El nombre de una combinación de alineamiento del catálogo (`GET /alineamientos/combinaciones`, que no trae `Nombre`):
 * el texto de los detalles (`textoAlineamiento`) y su prioridad detrás («Legal maligno · Siempre»). Vacío si no hay
 * alineamiento.
 */
export function nombreCombinacionAlineamiento(combinacion: {
    Basico?: { Nombre?: string | null; } | null;
    Ley?: { Nombre?: string | null; } | null;
    Moral?: { Nombre?: string | null; } | null;
    Prioridad?: { Nombre?: string | null; } | null;
} | null | undefined): string {
    const texto = textoAlineamiento({
        Basico: { Nombre: `${combinacion?.Basico?.Nombre ?? ''}` },
        Ley: { Nombre: `${combinacion?.Ley?.Nombre ?? ''}` },
        Moral: { Nombre: `${combinacion?.Moral?.Nombre ?? ''}` },
    } as Alineamiento);
    const prioridad = `${combinacion?.Prioridad?.Nombre ?? ''}`.trim();
    return texto && tieneTextoVisible(prioridad) ? `${texto} · ${prioridad}` : texto;
}

/**
 * Lo que exige un alineamiento en cada eje: el de su preferencia si pide un valor (`Valor` sin `Prohibe`) o el de su
 * básico; `null` en el eje que no exige ninguno (una preferencia que prohíbe no exige un valor).
 */
export function extraerEjesAlineamientoDesdeContrato(alineamiento: any): AlineamientoEjes {
    const vectorBasico = getVectorDesdeIdBasico(Number(alineamiento?.Basico?.Id_basico))
        ?? getVectorDesdeNombreBasico(`${alineamiento?.Basico?.Nombre ?? ""}`);
    const leyPreferida = valorExigido(alineamiento?.Ley);
    const moralPreferida = valorExigido(alineamiento?.Moral);

    return {
        ley: leyPreferida ?? vectorBasico?.ley ?? null,
        moral: moralPreferida ?? vectorBasico?.moral ?? null,
    };
}

