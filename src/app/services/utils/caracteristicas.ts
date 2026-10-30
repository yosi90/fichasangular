import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { MonstruoCaracteristicas } from 'src/app/interfaces/monstruo';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

// El modificador de una característica lo calcula la API (`utils/caracteristicas.py` del backend) para las fichas y los
// monstruos, familiares y compañeros (`docs/publica/MODIFICADORES_MONSTRUOS_FRONT.md`). La web solo lo calcula para el
// borrador de la creación, que aún no existe en la API, y con la misma regla.

/** El modificador de una puntuación de característica: `(valor − 10) / 2`, hacia abajo. Solo para el borrador. */
export function modificadorCaracteristica(valor: number): number {
    return Math.floor((Number(valor) - 10) / 2);
}

/** La característica de un `Id_caracteristica` (del 1 al 6, en el orden de `CARACTERISTICAS`), o `null` si no es de ninguna. */
export function caracteristicaPorId(idCaracteristica: number): Caracteristica | null {
    return CARACTERISTICAS[Number(idCaracteristica) - 1] ?? null;
}

/**
 * La característica de un texto de los datos («Fuerza», «Fue», «Constitución»…), por su principio o su nombre; `null` si
 * no es ninguna.
 */
export function caracteristicaPorTexto(texto: string): Caracteristica | null {
    const normalizado = normalizarTexto(texto);
    if (normalizado.startsWith('fue') || normalizado.includes('fuerza'))
        return 'Fuerza';
    if (normalizado.startsWith('des') || normalizado.includes('destreza'))
        return 'Destreza';
    if (normalizado.startsWith('con') || normalizado.includes('constitucion'))
        return 'Constitucion';
    if (normalizado.startsWith('int') || normalizado.includes('inteligencia'))
        return 'Inteligencia';
    if (normalizado.startsWith('sab') || normalizado.includes('sabiduria'))
        return 'Sabiduria';
    if (normalizado.startsWith('car') || normalizado.includes('carisma'))
        return 'Carisma';
    return null;
}

/**
 * El valor de una característica por su id (`Id_caracteristica` de los prerrequisitos, del 1 al 6 en el orden de
 * `CARACTERISTICAS`); `NaN` si el id no es de ninguna. Para los evaluadores de prerrequisitos de clase, dote y plantilla.
 */
export function valorCaracteristicaPorId(caracteristicas: Readonly<Record<Caracteristica, number>>, idCaracteristica: number): number {
    const clave = caracteristicaPorId(idCaracteristica);
    return clave ? Number(caracteristicas?.[clave] ?? Number.NaN) : Number.NaN;
}

/** Sin valor, una característica se enseña con «—», como en el manual. */
export const SIN_CARACTERISTICA = '—';

/** El nombre de cada característica, con sus tildes. */
export const NOMBRES_CARACTERISTICAS: Readonly<Record<Caracteristica, string>> = {
    Fuerza: 'Fuerza',
    Destreza: 'Destreza',
    Constitucion: 'Constitución',
    Inteligencia: 'Inteligencia',
    Sabiduria: 'Sabiduría',
    Carisma: 'Carisma',
};

/**
 * Las seis como opciones de un catálogo: su `Id_caracteristica` (del 1 al 6, en el orden de `CARACTERISTICAS`) y su
 * nombre con tildes. Los selectores de característica de las inserciones (prerrequisitos, extras, habilidades).
 */
export const CATALOGO_CARACTERISTICAS: readonly { id: number; nombre: string; }[] = CARACTERISTICAS
    .map((clave, indice) => ({ id: indice + 1, nombre: NOMBRES_CARACTERISTICAS[clave] }));

/** La abreviatura de una característica en las casillas de la ficha («FUE», «CON»). */
export function abreviaturaCaracteristica(clave: Caracteristica): string {
    return NOMBRES_CARACTERISTICAS[clave].slice(0, 3).toUpperCase();
}

/** El valor de una característica de un monstruo («16»), o «—» si no tiene. */
export function textoValorCaracteristica(caracteristicas: MonstruoCaracteristicas | null | undefined, clave: Caracteristica): string {
    const valor = caracteristicas?.[clave];
    return valor === null || valor === undefined ? SIN_CARACTERISTICA : `${valor}`;
}

/** El modificador de una característica de un monstruo, el que da la API, con signo («+3», «+0», «-1»), o «—» sin él. */
export function textoModificadorCaracteristica(caracteristicas: MonstruoCaracteristicas | null | undefined, clave: Caracteristica): string {
    const modificador = caracteristicas?.[`${clave}_modificador`];
    if (modificador === null || modificador === undefined)
        return SIN_CARACTERISTICA;
    return modificador >= 0 ? `+${modificador}` : `${modificador}`;
}

/** Una característica de un monstruo con su modificador entre paréntesis («16 (+3)»), o «—» si no tiene valor. */
export function textoCaracteristicaMonstruo(caracteristicas: MonstruoCaracteristicas | null | undefined, clave: Caracteristica): string {
    const valor = textoValorCaracteristica(caracteristicas, clave);
    if (valor === SIN_CARACTERISTICA)
        return valor;
    const modificador = textoModificadorCaracteristica(caracteristicas, clave);
    return modificador === SIN_CARACTERISTICA ? valor : `${valor} (${modificador})`;
}

/** El modificador de una característica de un monstruo para sumarlo a un total: sin valor, cuenta +0. */
export function modificadorParaSumar(caracteristicas: MonstruoCaracteristicas | null | undefined, clave: Caracteristica): number {
    return caracteristicas?.[`${clave}_modificador`] ?? 0;
}
