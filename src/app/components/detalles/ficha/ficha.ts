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
