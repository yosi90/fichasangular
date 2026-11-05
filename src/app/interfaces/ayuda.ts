/**
 * Las secciones de la Ayuda (lienzo «Rol: las vistas que faltan», vista 9), en su orden. Las novedades tienen su propia
 * pestaña desde la ronda de noviembre (`app-novedades`).
 */
export type SeccionAyuda = 'primeros-pasos' | 'legal' | 'companion' | 'creditos';

/** Abrir la Ayuda en una sección; `id` cambia en cada petición para volver a ella aunque ya esté abierta. */
export interface AyudaSolicitud {
    readonly seccion: SeccionAyuda;
    readonly id: number;
}
