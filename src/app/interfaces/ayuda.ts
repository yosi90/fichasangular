/** Las secciones de la Ayuda (lienzo «Rol: las vistas que faltan», vista 9), en su orden. */
export type SeccionAyuda = 'primeros-pasos' | 'novedades' | 'legal' | 'companion' | 'creditos';

/** Abrir la Ayuda en una sección; `id` cambia en cada petición para volver a ella aunque ya esté abierta. */
export interface AyudaSolicitud {
    readonly seccion: SeccionAyuda;
    readonly id: number;
}
