import { InjectionToken } from '@angular/core';

/**
 * Lo que el menú lateral pide al marco (`ContPrincipalComponent`): abrir la creación de un personaje (ya con la sesión,
 * el permiso y las normas comprobados) o el listado de un catálogo. El menú por catálogo de B (`MenuCatalogoComponent`)
 * se carga bajo demanda con `ngComponentOutlet`, que no enlaza salidas: el marco se las da con este valor. Está aparte
 * del componente para que el marco lo importe sin traer el menú al bundle inicial.
 */
export interface AccionesDelMenu {
    nuevoPersonaje(): void;
    abrirListado(lista: string): void;
}

export const ACCIONES_DEL_MENU = new InjectionToken<AccionesDelMenu>('ACCIONES_DEL_MENU');
