import { analizarTextoManual } from 'src/app/components/shared/texto-manual/texto-manual';
import { Alineamiento } from 'src/app/interfaces/alineamiento';
import { textoAlineamiento } from 'src/app/services/utils/alineamiento-contrato';
import { textoVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';

/**
 * La ficha común de las pantallas de detalle (lienzo aprobado por el propietario el 2026-10-25). Tipos y reglas que
 * comparten sus componentes; cómo se usa, en `docs/guias-estilo/GUIA_ESTILO_WEB_GENERAL.md`, «Pantallas de detalle».
 */

/** Un par etiqueta y valor de la rejilla de datos clave. */
export interface DatoFicha {
    etiqueta: string;
    /**
     * Lo que se enseña. Un texto vacío o de relleno, `null` o `undefined` ocultan el dato; un número se enseña tal cual
     * (también el 0) y un booleano como «Sí» o «No».
     */
    valor: string | number | boolean | null | undefined;
    /** Texto pequeño tras el valor («+ mod. de Int», «(5 pg)»). Se oculta si es relleno. */
    detalle?: string | null;
    /** Columnas que ocupa. Sin él, un valor largo ocupa dos. */
    ancho?: number;
    /** Tooltip del valor. */
    ayuda?: string | null;
    /** Si se da, el valor es un enlace que abre otra entrada (su detalle). */
    alPulsar?: () => void;
    /**
     * Si se da, el valor son varias entradas, separadas por comas y cada una con su enlace si lo tiene («Guerrero 2,
     * Mago 3»). `valor` sigue decidiendo si el dato se ve.
     */
    enlaces?: EnlaceFicha[];
}

/** Una de las entradas de un dato con varias (`DatoFicha.enlaces`). */
export interface EnlaceFicha {
    texto: string;
    alPulsar?: () => void;
}

/**
 * Un dato de la franja grande (`<app-ficha-franja>`): como los de la rejilla y, si hace falta, un botón de ayuda tras el
 * valor (las reglas de la maniobrabilidad, junto a la velocidad).
 */
export interface DatoFranja extends DatoFicha {
    /** La etiqueta en la franja compacta («PG», «CA»), con la entera en el tooltip. */
    etiquetaCorta?: string;
    ayudaBoton?: { texto: string; alPulsar: (evento: Event) => void; } | null;
}

/** Una casilla de `<app-ficha-casillas>`: una característica («FUE 16 +3») o una salvación. */
export interface CasillaFicha {
    /** «FUE», «FORTALEZA». */
    abreviatura: string;
    /** El nombre entero, en el tooltip de la abreviatura. */
    nombre: string;
    valor: string;
    /** Debajo del valor, con signo («+3»). */
    modificador?: string | null;
    /** Texto pequeño debajo («clase +6 · varios +1», «Perdida»). */
    detalle?: string | null;
    /** Tooltip del valor (el desglose). */
    ayuda?: string | null;
    /** El nombre accesible de la casilla («Fuerza 16 (+3)»). */
    texto: string;
    /** Pinta el detalle en ámbar (una característica perdida). */
    aviso?: boolean;
    /** Fondo `$primary`, para separar otro grupo (las salvaciones tras las características). */
    secundaria?: boolean;
}

/** Una etiqueta de la cabecera, con borde fino. `aviso` la pinta en ámbar (homebrew, conflicto blando). */
export interface EtiquetaFicha {
    texto: string;
    ayuda?: string | null;
    aviso?: boolean;
}

/** A partir de este largo, un dato sin `ancho` ocupa dos columnas de la rejilla. */
export const LARGO_DATO_ANCHO = 48;

/** El valor de un dato tal como se enseña, o `null` si no hay nada que enseñar. */
export function textoDato(valor: DatoFicha['valor']): string | null {
    if (valor === null || valor === undefined)
        return null;
    if (typeof valor === 'boolean')
        return valor ? 'Sí' : 'No';
    if (typeof valor === 'number')
        return Number.isFinite(valor) ? `${valor}` : null;
    return tieneTextoVisible(valor) ? valor.trim() : null;
}

/** Los datos que tienen algo que enseñar, en su orden. */
export function datosVisibles(datos: DatoFicha[] | null | undefined): DatoFicha[] {
    return (datos ?? []).filter((dato) => textoDato(dato?.valor) !== null);
}

/** Las etiquetas con texto visible, aceptando textos sueltos. */
export function etiquetasVisibles(etiquetas: (string | EtiquetaFicha)[] | null | undefined): EtiquetaFicha[] {
    return (etiquetas ?? [])
        .map((etiqueta) => typeof etiqueta === 'string' ? { texto: etiqueta } : etiqueta)
        .filter((etiqueta) => tieneTextoVisible(etiqueta?.texto));
}

/** Une con « · » las partes visibles: el tipo de la cabecera («Dote · General · Guerrero»). */
export function unirTipo(partes: (string | null | undefined)[]): string {
    return partes.filter((parte) => tieneTextoVisible(parte)).map((parte) => `${parte}`.trim()).join(' · ');
}

/** Lo que trae el nombre del libro traducido: las fusiones y los chakras de Magic of Incarnum, el equipo… */
interface ConNombreOriginal {
    Nombre: string;
    Nombre_original?: string | null;
    Traducido?: boolean | null;
}

/** El nombre original del libro de lo que hemos traducido, si no es el mismo que el nuestro; vacío si no. */
export function nombreOriginalVisible(item: ConNombreOriginal | null | undefined): string {
    return item?.Traducido && item.Nombre_original && item.Nombre_original !== item.Nombre ? item.Nombre_original : '';
}

/** La etiqueta «Traducido» de la cabecera, con el nombre original en el tooltip; `null` si no lo hemos traducido. */
export function etiquetaTraducido(item: ConNombreOriginal | null | undefined): EtiquetaFicha | null {
    return item?.Traducido && item.Nombre_original ? { texto: 'Traducido', ayuda: `Nombre original: ${item.Nombre_original}` } : null;
}

/** Los nombres unidos con comas y la conjunción antes del último: «Corona o Pies», «brazos, manos y pies». */
export function unirLista(nombres: string[], conjuncion: 'o' | 'y'): string {
    if (nombres.length < 2)
        return nombres.join('');
    return `${nombres.slice(0, -1).join(', ')} ${conjuncion} ${nombres[nombres.length - 1]}`;
}

/**
 * Si un texto cabe como línea en cursiva bajo el nombre: es visible, es un solo párrafo (sin listas, tablas ni
 * títulos) y no pasa de `maximo` caracteres. Si no, va como sección del cuerpo.
 */
export function esTextoCorto(texto: string | null | undefined, maximo = 240): boolean {
    if (!tieneTextoVisible(texto))
        return false;
    const bloques = analizarTextoManual(texto);
    return bloques.length === 1 && bloques[0].tipo === 'parrafo' && `${texto}`.trim().length <= maximo;
}

/**
 * El dato «Alineamiento» (`textoAlineamiento`), con su prioridad y su descripción de la API en el tooltip («Prioridad:
 * Siempre. Se debe respetar a raja tabla.»). Lo usan los detalles que traen un `AlineamientoDetalle`.
 */
export function datoAlineamiento(alineamiento: Alineamiento | null | undefined): DatoFicha {
    const valor = textoAlineamiento(alineamiento);
    const prioridad = textoVisible(alineamiento?.Prioridad?.Nombre);
    const ayuda = [prioridad ? `Prioridad: ${prioridad}.` : '', textoVisible(alineamiento?.Descripcion)].filter(Boolean).join(' ');
    return { etiqueta: 'Alineamiento', valor, ayuda: valor ? ayuda : null };
}

/**
 * El manual que llega como texto con la página dentro («Manual del jugador 1, Página: 15», «El combatiente completo (p. 96)»),
 * separado en nombre y página para que la cabecera lo escriba igual que la referencia de la API («… · pág. 15»).
 */
export function separarManualTexto(texto: string | null | undefined): { nombre: string; pagina: number | null } {
    const limpio = textoVisible(texto);
    const conPagina = /^(.*?)[\s,]*(?:\(\s*)?(?:p[aá]gina|p[aá]g\.?|p\.)\s*:?\s*(\d+)\s*\)?\s*$/i.exec(limpio);
    if (conPagina && conPagina[1].trim())
        return { nombre: conPagina[1].trim(), pagina: Number(conPagina[2]) };
    return { nombre: limpio, pagina: null };
}

/** El nombre del manual, venga como texto con la página dentro (`separarManualTexto`) o como referencia de la API. */
export function nombreDeManual(manual: string | { Nombre?: string | null } | null | undefined): string {
    if (typeof manual === 'string')
        return separarManualTexto(manual).nombre;
    return textoVisible(manual?.Nombre);
}
