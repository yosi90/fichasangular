import { ManualReferencia } from 'src/app/interfaces/manual';
import { toNumber, toText } from 'src/app/services/utils/normalizacion';

// El manual de referencia de un elemento de catálogo ({ Id, Nombre, Pagina }), para los mappers de dotes, plantillas,
// monstruos y subtipos.

/** El de la API: siempre un objeto. */
export function normalizeManualApi(raw: any): ManualReferencia {
    return {
        Id: toNumber(raw?.Id, 0),
        Nombre: toText(raw?.Nombre, ''),
        Pagina: toNumber(raw?.Pagina, 0),
    };
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
