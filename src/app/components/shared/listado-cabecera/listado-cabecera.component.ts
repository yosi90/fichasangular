import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TipoRol } from 'src/app/services/utils/iconos-rol';

let siguienteId = 0;

/**
 * La cabecera común de un listado (lienzo «Rol: las vistas que faltan», vistas 4 y 6): el icono del catálogo en su
 * recuadro (40/28), el título, el total en gris, el buscador rápido (280 px; es el mismo campo «Buscar» del listado,
 * no otro filtro) y, proyectado a la derecha, el botón de `<app-menu-filtros>`. En el móvil, el buscador baja a su
 * propia línea.
 */
@Component({
    selector: 'app-listado-cabecera',
    template: `
        <header class="listado-cabecera">
            <app-icono-rol [tipo]="icono" [tamano]="28" [recuadro]="true"></app-icono-rol>
            <h2 class="listado-cabecera__titulo">{{titulo}}</h2>
            <span class="listado-cabecera__total" *ngIf="total !== null">
                {{total}}<span class="listado-cabecera__oculto"> en total</span>
            </span>
            <div class="listado-cabecera__buscar" role="search">
                <mat-icon aria-hidden="true">search</mat-icon>
                <label class="listado-cabecera__oculto" [attr.for]="idCampo">{{etiquetaBuscar}}</label>
                <input type="search" [id]="idCampo" [placeholder]="placeholder" [value]="texto" autocomplete="off"
                    (input)="alEscribir($any($event.target).value)">
            </div>
            <div class="listado-cabecera__acciones"><ng-content></ng-content></div>
        </header>`,
    styleUrls: ['./listado-cabecera.component.sass'],
    standalone: false
})
export class ListadoCabeceraComponent {
    @Input({ required: true }) icono!: TipoRol;
    @Input() titulo = '';
    /** Cuántos hay con los filtros puestos; sin él, no se enseña. */
    @Input() total: number | null = null;
    @Input() texto = '';
    @Input() placeholder = 'Buscar';
    /** El nombre accesible del buscador («Buscar personajes»). */
    @Input() etiquetaBuscar = 'Buscar';
    @Output() textoChange = new EventEmitter<string>();

    readonly idCampo = `listado-cabecera-buscar-${++siguienteId}`;

    alEscribir(texto: string): void {
        this.texto = texto;
        this.textoChange.emit(texto);
    }
}
