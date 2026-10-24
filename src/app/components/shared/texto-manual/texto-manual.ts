/**
 * Los textos copiados de los manuales llegan con un Markdown pequeño (decisión del propietario del 2026-10-18):
 * párrafos separados por una línea en blanco, `*cursiva*`, `**negrita**`, títulos con `#`, listas con `- ` o `1. ` y
 * tablas con `| … |`. Es el formato común de la web y 3.5 Companion (`docs/publica/TEXTOS_CON_FORMATO.md`). Esto los
 * convierte en bloques para pintarlos sin `innerHTML`. Un texto sin formato es un único párrafo.
 */

export interface TrozoTexto {
    texto: string;
    cursiva: boolean;
    negrita: boolean;
}

export type BloqueTexto =
    | { tipo: 'parrafo'; trozos: TrozoTexto[] }
    | { tipo: 'titulo'; trozos: TrozoTexto[] }
    // Los numerados conservan su número en el texto del elemento.
    | { tipo: 'lista'; elementos: TrozoTexto[][] }
    | { tipo: 'tabla'; cabecera: TrozoTexto[][]; filas: TrozoTexto[][][] };

const FORMATO = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;

export function trozosDeTexto(linea: string): TrozoTexto[] {
    const trozos: TrozoTexto[] = [];
    let desde = 0;
    for (const m of linea.matchAll(FORMATO)) {
        const indice = m.index ?? 0;
        if (indice > desde)
            trozos.push({ texto: linea.slice(desde, indice), cursiva: false, negrita: false });
        const negrita = m[0].startsWith('**');
        trozos.push({ texto: m[0].slice(negrita ? 2 : 1, negrita ? -2 : -1), cursiva: !negrita, negrita });
        desde = indice + m[0].length;
    }
    if (desde < linea.length)
        trozos.push({ texto: linea.slice(desde), cursiva: false, negrita: false });
    return trozos;
}

function celdas(fila: string): TrozoTexto[][] {
    return fila.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => trozosDeTexto(c.trim()));
}

function esSeparadorDeTabla(fila: string): boolean {
    return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(fila.trim());
}

function esElementoDeLista(linea: string): boolean {
    return linea.startsWith('- ') || /^\d+\.\s/.test(linea);
}

export function analizarTextoManual(texto: string | null | undefined): BloqueTexto[] {
    const limpio = (texto ?? '').replace(/\r\n/g, '\n').trim();
    if (!limpio)
        return [];
    const bloques: BloqueTexto[] = [];
    for (const bloque of limpio.split(/\n\s*\n/)) {
        const lineas = bloque.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (!lineas.length)
            continue;
        if (lineas.every(l => l.startsWith('|'))) {
            const filas = lineas.filter(l => !esSeparadorDeTabla(l));
            const conCabecera = lineas.length > 1 && esSeparadorDeTabla(lineas[1]);
            bloques.push({
                tipo: 'tabla',
                cabecera: conCabecera ? celdas(filas[0]) : [],
                filas: (conCabecera ? filas.slice(1) : filas).map(celdas),
            });
        } else if (lineas.every(esElementoDeLista)) {
            bloques.push({ tipo: 'lista', elementos: lineas.map(l => trozosDeTexto(l.replace(/^- /, ''))) });
        } else if (lineas.length === 1 && /^#{1,6}\s/.test(lineas[0])) {
            bloques.push({ tipo: 'titulo', trozos: trozosDeTexto(lineas[0].replace(/^#{1,6}\s+/, '')) });
        } else {
            bloques.push({ tipo: 'parrafo', trozos: trozosDeTexto(lineas.join(' ')) });
        }
    }
    return bloques;
}
