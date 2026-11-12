/**
 * Las secciones de la Ayuda (lienzo «Rol: las vistas que faltan», vista 9), en su orden. Las novedades tienen su propia
 * pestaña desde la ronda de noviembre (`app-novedades`).
 */
export type SeccionAyuda = 'primeros-pasos' | 'legal' | 'companion' | 'creditos';

export const SECCIONES_AYUDA: readonly { id: SeccionAyuda; titulo: string }[] = [
    { id: 'primeros-pasos', titulo: 'Primeros pasos' },
    { id: 'legal', titulo: 'Legal y privacidad' },
    { id: 'companion', titulo: '3.5 Companion' },
    { id: 'creditos', titulo: 'Créditos' },
];

/** Si `valor` es una sección de la Ayuda (por ejemplo, la de un enlace `?vista=ayuda&seccion=…`). */
export function esSeccionAyuda(valor: unknown): valor is SeccionAyuda {
    return SECCIONES_AYUDA.some((s) => s.id === valor);
}

/**
 * Abrir la Ayuda en una sección; `id` cambia en cada petición para volver a ella aunque ya esté abierta. `apartado`, si
 * lo hay, es el ancla de un apartado de la sección (`legal-companion`), al que se baja al abrirla.
 */
export interface AyudaSolicitud {
    readonly seccion: SeccionAyuda;
    readonly id: number;
    readonly apartado?: string | null;
}
