// Fechas de la API (ISO) en texto para la persona, en español. Una sola copia para el perfil, el perfil público y la
// gestión de campañas.

const formatoFecha = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

const formatoFechaHora = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

function leerFecha(value: string | null | undefined): Date | null {
    const text = `${value ?? ''}`.trim();
    if (text.length < 1)
        return null;
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** «30 de octubre de 2026», o el texto de reserva si no hay fecha válida. */
export function textoFecha(value: string | null | undefined, fallback: string): string {
    const fecha = leerFecha(value);
    return fecha ? formatoFecha.format(fecha) : fallback;
}

/**
 * «30 de octubre de 2026 a las 18:05» (el enlace lo pone el navegador; la coma, si la pone, se quita), o el texto de
 * reserva si no hay fecha válida.
 */
export function textoFechaHora(value: string | null | undefined, fallback: string): string {
    const fecha = leerFecha(value);
    return fecha ? formatoFechaHora.format(fecha).replace(',', '') : fallback;
}
