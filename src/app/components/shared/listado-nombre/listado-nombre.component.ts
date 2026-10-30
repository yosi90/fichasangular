import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TipoRol } from 'src/app/services/utils/iconos-rol';

/**
 * El nombre de una fila de listado de catálogo (lienzo «Rol: las vistas que faltan», vista 4), sin pastillas: el icono
 * del catálogo (20 px, sin recuadro), el nombre como botón (15 px, blanco) que abre el detalle sin pasar el clic a la
 * fila y, si es una traducción, el nombre original en gris debajo.
 */
@Component({
    selector: 'app-listado-nombre',
    template: `
        <app-icono-rol [tipo]="tipo" [tamano]="20"></app-icono-rol>
        <span class="listado-nombre__texto">
            <button type="button" class="listado-nombre__boton" [attr.aria-expanded]="expandido" [attr.aria-controls]="controla"
                (click)="$event.stopPropagation(); abrir.emit()">{{nombre}}</button>
            <span class="listado-nombre__original" *ngIf="original">{{original}}</span>
        </span>`,
    styleUrls: ['./listado-nombre.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ListadoNombreComponent {
    @Input({ required: true }) tipo!: TipoRol;
    @Input() nombre: string | null | undefined = '';
    /** El nombre original, solo si es una traducción (`nombreOriginalVisible`). */
    @Input() original: string | null | undefined = '';
    /** En la creación, el nombre abre la vista previa: `aria-expanded` y `aria-controls` de la vista previa. */
    @Input() expandido: boolean | null = null;
    @Input() controla: string | null = null;
    @Output() abrir = new EventEmitter<void>();
}
