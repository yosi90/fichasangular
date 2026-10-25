import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

// Formateo de los registros genéricos que enseña el detalle de clase (competencias, especiales): convierte valores
// crudos (objetos, listas, booleanos) en texto legible. Los prerrequisitos no pasan por aquí: los enseña su `Frase`.

/** Si la clave es un identificador técnico (`Id`, `Id_dote`, `id extra`…), que no se enseña. */
export function esCampoId(clave: string): boolean {
    const normalizada = clave.replace(/[_\s]/g, '').toLowerCase();
    return normalizada === 'id' || normalizada.startsWith('id');
}

/** Si la clave es una marca de comodín (`Comodin`, `Extra_comodin`, `Arma_comodin`…): se lee, pero no se enseña. */
function esCampoComodin(clave: string): boolean {
    return clave.replace(/[_\s]/g, '').toLowerCase().endsWith('comodin');
}

/**
 * El texto recortado y con la primera letra en mayúscula. Para los nombres que llegan en minúscula desde los datos
 * («explorador» como clase predilecta): los detalles los enseñan como nombre propio.
 */
export function mayusculaInicial(texto: string | null | undefined): string {
    const limpio = `${texto ?? ''}`.trim();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

/** Una clave como etiqueta: guiones bajos por espacios y la primera letra en mayúscula. */
export function formatearClave(texto: string): string {
    if (!texto)
        return '';
    return mayusculaInicial(texto.replace(/_/g, ' '));
}

/** Cualquier valor como texto: listas separadas por comas y objetos como «Clave: valor | …», sin los ids. */
export function formatearValor(valor: unknown): string {
    if (valor === null || valor === undefined)
        return '';
    if (typeof valor === 'boolean')
        return valor ? 'Sí' : 'No';
    if (typeof valor === 'number' || typeof valor === 'string')
        return `${valor}`;
    if (Array.isArray(valor))
        return valor.map(v => formatearValor(v)).filter(v => v.trim().length > 0).join(', ');
    if (typeof valor === 'object') {
        return Object.entries(valor as Record<string, unknown>)
            .filter(([key]) => !esCampoId(key) && !esCampoComodin(key))
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
        return valor ? 'Sí' : 'No';
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
