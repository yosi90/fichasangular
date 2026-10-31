import { InjectionToken } from '@angular/core';

/**
 * Un formulario de inserción abierto en una pestaña de «Modificar» (clase, racial, idioma…). Las pestañas
 * (`TabControlComponent`) lo encuentran por su clave (`edicion:<tipo>:<id>`) y le preguntan antes de cerrarse si hay
 * cambios sin guardar. Cada formulario lo declara en sus `providers` con `EDITOR_DE_CATALOGO`, así las pestañas los
 * buscan a todos con una sola consulta, sin conocer cada componente.
 */
export interface EditorDeCatalogo {
    editorTabKey: string;
    confirmarSalidaSiHayCambios(): Promise<boolean>;
}

export const EDITOR_DE_CATALOGO = new InjectionToken<EditorDeCatalogo>('EditorDeCatalogo');
