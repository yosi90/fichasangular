import { EntradaEquipo, TipoCatalogoEquipo } from 'src/app/interfaces/equipo';

/**
 * Los listados de los catálogos nuevos del equipo, por el nombre con el que se abren (`AbrirListado` del menú, «Lista de
 * …» en la pestaña), y el tipo de entrada de cada uno. Armas y armaduras siguen con sus listados propios.
 */
export const LISTAS_EQUIPO: Readonly<Record<string, TipoCatalogoEquipo>> = {
    'aptitudes de armas y armaduras': 'encantamiento',
    'conjuntos de objetos': 'conjunto',
    'materiales especiales': 'material',
    'munición': 'municion',
    'objetos': 'objeto',
};

export function tipoDeListaEquipo(lista: string): TipoCatalogoEquipo | null {
    return LISTAS_EQUIPO[lista] ?? null;
}

const ETIQUETA_TIPO: Readonly<Record<TipoCatalogoEquipo, string>> = {
    objeto: 'Objeto',
    material: 'Material',
    municion: 'Munición',
    encantamiento: 'Aptitud especial',
    conjunto: 'Conjunto',
};

/** La etiqueta de la pestaña de su detalle: «Capa de resistencia +1 (Objeto)». */
export function etiquetaEntradaEquipo(entrada: EntradaEquipo): string {
    return `${entrada.item.Nombre} (${ETIQUETA_TIPO[entrada.tipo]})`;
}

/** La clave estable de la pestaña del detalle de una entrada por su tipo y su id: «equipo:objeto:40». */
export function claveEquipo(tipo: TipoCatalogoEquipo, id: number): string {
    return `equipo:${tipo}:${Number(id ?? 0)}`;
}

export function claveEntradaEquipo(entrada: EntradaEquipo): string {
    return claveEquipo(entrada.tipo, entrada.item.Id);
}
