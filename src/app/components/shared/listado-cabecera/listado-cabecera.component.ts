import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TipoRol } from 'src/app/services/utils/iconos-rol';

let siguienteId = 0;

/**
 * Un listado cuyo buscador rápido se puede poner desde fuera (`ListadoComponent`, con el texto de «Ver los N en el
 * listado» de la búsqueda global): `textoBusqueda` antes de que lleguen los datos y `buscar` cuando ya está pintado.
 */
export interface ListadoBuscable {
    textoBusqueda: string;
    buscar(texto: string): void;
}

export function esListadoBuscable(valor: unknown): valor is ListadoBuscable {
    return !!valor && typeof (valor as ListadoBuscable).buscar === 'function' && 'textoBusqueda' in (valor as object);
}

/**
 * La cabecera común de un listado (lienzo «Rol: las vistas que faltan», vistas 4 y 6): el icono del catálogo en su
 * recuadro (40/28), el título, el total en gris, el buscador rápido (280 px; es el mismo campo «Buscar» del listado,
 * no otro filtro) y, proyectado a la derecha, el botón de `<app-menu-filtros>`. En el móvil, el buscador baja a su
 * propia línea. Una pantalla que no es un listado (los dados, las novedades) la usa con `subtitulo` y sin buscador; sin
 * buscador, lo proyectado va a la derecha. Si la pantalla no es un elemento de rol, lleva un icono de Material
 * (`iconoMaterial`) en vez del de `ICONOS_ROL`.
 */
@Component({
    selector: 'app-listado-cabecera',
    template: `
        <header class="listado-cabecera" [class.listado-cabecera--sin-buscador]="!buscador">
            <app-icono-rol *ngIf="icono; else material" [tipo]="icono" [tamano]="28" [recuadro]="true"></app-icono-rol>
            <ng-template #material>
                <mat-icon class="listado-cabecera__icono-material" aria-hidden="true" *ngIf="iconoMaterial">{{iconoMaterial}}</mat-icon>
            </ng-template>
            <h2 class="listado-cabecera__titulo">{{titulo}}</h2>
            <span class="listado-cabecera__total" *ngIf="total !== null">
                {{total}}<span class="solo-lectores"> en total</span>
            </span>
            <span class="listado-cabecera__subtitulo" *ngIf="subtitulo">{{subtitulo}}</span>
            <div class="listado-cabecera__buscar" role="search" *ngIf="buscador">
                <mat-icon aria-hidden="true">search</mat-icon>
                <label class="solo-lectores" [attr.for]="idCampo">{{etiquetaBuscar}}</label>
                <input type="search" [id]="idCampo" [placeholder]="placeholder" [value]="texto" autocomplete="off"
                    (input)="alEscribir($any($event.target).value)">
            </div>
            <div class="listado-cabecera__acciones"><ng-content></ng-content></div>
        </header>`,
    styleUrls: ['./listado-cabecera.component.sass'],
    standalone: false
})
export class ListadoCabeceraComponent {
    /** El icono del catálogo; sin él, el de Material de `iconoMaterial` (Novedades). */
    @Input() icono: TipoRol | null = null;
    @Input() iconoMaterial = '';
    @Input() titulo = '';
    /** Cuántos hay con los filtros puestos; sin él, no se enseña. */
    @Input() total: number | null = null;
    /** Una línea gris tras el título, en las pantallas que no son listados («Tiradas sueltas para la mesa»). */
    @Input() subtitulo = '';
    /** Sin buscador rápido: las pestañas «Dados» y «Novedades», que usan la cabecera sin ser un listado. */
    @Input() buscador = true;
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
