import { Caracteristica } from 'src/app/interfaces/caracteristica';
import { MonstruoCaracteristicas } from 'src/app/interfaces/monstruo';

// El modificador de una característica lo calcula la API (`utils/caracteristicas.py` del backend) para las fichas y los
// monstruos, familiares y compañeros (`docs/publica/MODIFICADORES_MONSTRUOS_FRONT.md`). La web solo lo calcula para el
// borrador de la creación, que aún no existe en la API, y con la misma regla.

/** El modificador de una puntuación de característica: `(valor − 10) / 2`, hacia abajo. Solo para el borrador. */
export function modificadorCaracteristica(valor: number): number {
    return Math.floor((Number(valor) - 10) / 2);
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
