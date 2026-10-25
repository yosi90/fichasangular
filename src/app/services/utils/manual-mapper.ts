import { ManualReferencia } from 'src/app/interfaces/manual';
import { toNumber, toText } from 'src/app/services/utils/normalizacion';

// El manual de referencia de un elemento de catálogo ({ Id, Nombre, Pagina }), para los mappers de dotes, plantillas,
// monstruos y subtipos, y cómo se enseña en los listados y detalles.

/** El de la API: siempre un objeto. */
export function normalizeManualApi(raw: any): ManualReferencia {
    return {
        Id: toNumber(raw?.Id, 0),
        Nombre: toText(raw?.Nombre, ''),
        Pagina: toNumber(raw?.Pagina, 0),
    };
}

/** El manual y la página («Manual del jugador 1 (p. 118)»), o `sinManual` si no lo dice. */
export function etiquetaManual(manual: ManualReferencia | null | undefined, sinManual: string = 'Sin manual'): string {
    const nombre = `${manual?.Nombre ?? ''}`.trim();
    const pagina = Number(manual?.Pagina ?? 0);
    if (nombre.length < 1)
        return sinManual;
    return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
}

/** El tolerante: acepta también el nombre suelto, como lo guardaban las cachés antiguas. */
export function normalizeManualLegacy(raw: any): ManualReferencia {
    if (typeof raw === 'string') {
        return {
            Id: 0,
            Nombre: raw,
            Pagina: 0,
        };
    }
    return normalizeManualApi(raw);
}
