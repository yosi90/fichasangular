import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

// Formateo de los registros de prerrequisitos y relaciones que enseñan los detalles (clase y plantilla): convierte
// valores crudos (objetos, listas, booleanos) en texto legible.

/** Si la clave es un identificador técnico (`Id`, `Id_dote`, `id extra`…), que no se enseña. */
export function esCampoId(clave: string): boolean {
    const normalizada = clave.replace(/[_\s]/g, '').toLowerCase();
    return normalizada === 'id' || normalizada.startsWith('id');
}

/** Una clave como etiqueta: guiones bajos por espacios y la primera letra en mayúscula. */
export function formatearClave(texto: string): string {
    if (!texto)
        return '';
    const normalizado = texto.replace(/_/g, ' ').trim();
    return normalizado.charAt(0).toUpperCase() + normalizado.slice(1);
}

/** Cualquier valor como texto: listas separadas por comas y objetos como «Clave: valor | …», sin los ids. */
export function formatearValor(valor: unknown): string {
    if (valor === null || valor === undefined)
        return '';
    if (typeof valor === 'boolean')
        return valor ? 'Si' : 'No';
    if (typeof valor === 'number' || typeof valor === 'string')
        return `${valor}`;
    if (Array.isArray(valor))
        return valor.map(v => formatearValor(v)).filter(v => v.trim().length > 0).join(', ');
    if (typeof valor === 'object') {
        return Object.entries(valor as Record<string, unknown>)
            .filter(([key]) => !esCampoId(key))
            .map(([key, v]) => `${formatearClave(key)}: ${formatearValor(v)}`)
            .filter(v => v.trim().length > 0)
            .join(' | ');
    }
    return '';
}

/** El valor principal de un registro (su extra, nombre, habilidad o valor), o todo él formateado si no lo tiene. */
export function extraerValorSimple(valor: unknown): string {
    if (valor === null || valor === undefined)
        return '';
    if (typeof valor === 'string' || typeof valor === 'number')
        return `${valor}`.trim();
    if (typeof valor === 'boolean')
        return valor ? 'Si' : 'No';
    if (Array.isArray(valor))
        return valor.map(v => extraerValorSimple(v)).filter(v => tieneTextoVisible(v)).join(', ');
    if (typeof valor === 'object') {
        const obj = valor as Record<string, unknown>;
        const prioridad = ['Extra', 'extra', 'Nombre', 'nombre', 'Habilidad', 'habilidad', 'Valor', 'valor'];
        for (const key of prioridad) {
            const picked = extraerValorSimple(obj[key]);
            if (tieneTextoVisible(picked))
                return picked;
        }
        return formatearValor(valor);
    }
    return '';
}

/** El extra que se enseña de un registro con habilidad (con su id de extra y si lo admite). */
export function extraVisibleDesdeRegistro(item: Record<string, any>, extraRaw: unknown): string {
    const hasIdExtra = Object.prototype.hasOwnProperty.call(item ?? {}, 'Id_extra')
        || Object.prototype.hasOwnProperty.call(item ?? {}, 'id_extra')
        || Object.prototype.hasOwnProperty.call(item ?? {}, 'i_ex')
        || Object.prototype.hasOwnProperty.call(item ?? {}, 'ie');

    return resolverExtraHabilidadVisible({
        extra: extraerValorSimple(extraRaw),
        idExtra: item?.['Id_extra'] ?? item?.['id_extra'] ?? item?.['i_ex'] ?? item?.['ie'],
        soportaExtra: item?.['Soporta_extra'] ?? item?.['soporta_extra'],
        allowIdZeroAsChoose: hasIdExtra,
    });
}
