import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

/** El manual de una fila: su nombre (con la página, «Libro, Página: 137») o el objeto `{ Id, Nombre, Pagina }`. */
export type ManualDeFila = string | { Id?: number | null; Nombre?: string | null; Pagina?: number | string | null } | null | undefined;

/**
 * El manual de una fila de listado de catálogo (lienzo «Rol: las vistas que faltan», vista 4): «Razas de Faerûn · p.
 * 131» (`manualListado`), enlace gris con raya rosa que abre el detalle del manual sin pasar el clic a la fila.
 */
@Component({
    selector: 'app-listado-manual',
    template: `<button type="button" class="listado-manual" (click)="abrir($event)">{{manual | manualListado}}</button>`,
    styleUrls: ['./listado-manual.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ListadoManualComponent {
    @Input() manual: ManualDeFila = null;

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    abrir(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        const manual = this.manual;
        this.manualDetalleNavSvc.abrirDetalleManual(typeof manual === 'string' ? manual : { id: manual?.Id, nombre: manual?.Nombre });
    }
}
