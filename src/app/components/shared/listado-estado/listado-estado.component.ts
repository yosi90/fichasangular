import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/** Lo que enseña un listado cuando no enseña filas. */
export type EstadoListado = 'cargando' | 'error' | 'vacio';

/**
 * Los estados de un listado (lienzo «Rol: las vistas que faltan», vistas 4 y 6), los mismos en el inicio y en los
 * listados de catálogo:
 * - `cargando`: seis filas de esqueleto (sin brillo con `prefers-reduced-motion`), con su `etiqueta` para el lector;
 * - `error`: el `mensaje` en un `.bloque-error` con «Reintentar» (`accion`);
 * - `vacio`: el `mensaje` y, si se da `textoAccion`, su botón: «Limpiar filtros» cuando nada cumple los filtros, o la
 *   acción de verdad («Nuevo personaje», con `principal`) cuando no hay nada. Con `tarjeta`, en su propia tarjeta.
 */
@Component({
    selector: 'app-listado-estado',
    template: `
        <div class="listado-estado__esqueleto" *ngIf="tipo === 'cargando'" role="status" [attr.aria-label]="etiqueta || 'Cargando'">
            <div class="listado-estado__fila" [class.listado-estado__fila--alta]="icono > 20" *ngFor="let fila of filas" aria-hidden="true">
                <span class="listado-estado__icono" [style.width.px]="icono" [style.height.px]="icono"></span>
                <span class="listado-estado__lineas"><span></span><span></span></span>
            </div>
        </div>
        <div class="bloque-error listado-estado__error" *ngIf="tipo === 'error'" role="alert">
            <span>{{mensaje}}</span>
            <button type="button" mat-stroked-button (click)="accion.emit()">{{textoAccion || 'Reintentar'}}</button>
        </div>
        <div class="listado-estado__vacio" [class.listado-estado__vacio--tarjeta]="tarjeta" *ngIf="tipo === 'vacio'">
            <p>{{mensaje}}</p>
            <ng-container *ngIf="textoAccion">
                <button type="button" mat-raised-button color="primary" *ngIf="principal; else secundaria" (click)="accion.emit()">{{textoAccion}}</button>
                <ng-template #secundaria>
                    <button type="button" mat-stroked-button (click)="accion.emit()">{{textoAccion}}</button>
                </ng-template>
            </ng-container>
        </div>`,
    styleUrls: ['./listado-estado.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ListadoEstadoComponent {
    @Input({ required: true }) tipo!: EstadoListado;
    @Input() mensaje = '';
    @Input() textoAccion = '';
    /** El nombre del esqueleto para el lector de pantalla («Cargando razas»). */
    @Input() etiqueta = '';
    /** El tamaño del icono de las filas de esqueleto: 20 en los catálogos (filas de 52 px), 40 en el inicio (60 px). */
    @Input() icono = 20;
    /** La acción del vacío como botón principal (la de verdad, no «Limpiar filtros»). */
    @Input() principal = false;
    @Input() tarjeta = false;
    @Output() accion = new EventEmitter<void>();

    readonly filas = [1, 2, 3, 4, 5, 6];
}
