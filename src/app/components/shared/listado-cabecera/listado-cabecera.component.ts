import { Component, EventEmitter, InjectionToken, Injector, Input, OnInit, Output, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { TemaWebService } from 'src/app/services/tema-web/tema-web.service';
import { UserService } from 'src/app/services/user.service';
import { INSERCIONES_CATALOGO, tieneInsercion } from 'src/app/services/utils/catalogos-editables';
import { TipoRol } from 'src/app/services/utils/iconos-rol';
import { trasLasNormasDeCreacion } from 'src/app/services/utils/normas-creacion';
import { puedeGestionarListado } from 'src/app/services/utils/permisos-catalogo';

let siguienteId = 0;

/** El listado de catálogo en el que va la cabecera (lo da `ListadoComponent`): su lista («dotes», «munición»…). */
export interface ContextoDeListado {
    readonly tipoLista: string;
}

export const CONTEXTO_DE_LISTADO = new InjectionToken<ContextoDeListado>('CONTEXTO_DE_LISTADO');

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
 *
 * Con el menú por catálogo (B), la cabecera de un listado de catálogo lleva también «Nueva …» (la inserción de esa
 * lista, `INSERCIONES_CATALOGO`), antes de los filtros: es donde B pone «Insertar» del menú de siempre. Sin permiso,
 * desactivado con el aviso de permisos; antes de abrir, las normas de Rol.
 */
@Component({
    selector: 'app-listado-cabecera',
    template: `
        <header class="listado-cabecera" [class.listado-cabecera--sin-buscador]="!buscador">
            <app-icono-rol *ngIf="icono; else material" [tipo]="icono" [tamano]="28" [recuadro]="true" data-icono="adorno"></app-icono-rol>
            <ng-template #material>
                <mat-icon class="listado-cabecera__icono-material" aria-hidden="true" data-icono="adorno" *ngIf="iconoMaterial">{{iconoMaterial}}</mat-icon>
            </ng-template>
            <h2 class="listado-cabecera__titulo">{{titulo}}</h2>
            <span class="listado-cabecera__total" *ngIf="total !== null">
                {{total}}<span class="solo-lectores"> en total</span>
            </span>
            <span class="listado-cabecera__subtitulo" *ngIf="subtitulo">{{subtitulo}}</span>
            <div class="listado-cabecera__buscar" role="search" *ngIf="buscador">
                <mat-icon aria-hidden="true" data-icono="accion">search</mat-icon>
                <label class="solo-lectores" [attr.for]="idCampo">{{etiquetaBuscar}}</label>
                <input type="search" [id]="idCampo" [placeholder]="placeholder" [value]="texto" autocomplete="off"
                    (input)="alEscribir($any($event.target).value)">
            </div>
            <div class="listado-cabecera__acciones">
                <span class="listado-cabecera__nueva" *ngIf="nueva$ | async" [matTooltip]="mensajePermisos" [matTooltipDisabled]="puedeInsertar">
                    <button type="button" class="listado-cabecera__nueva-boton" [disabled]="!puedeInsertar" (click)="abrirNueva()">{{etiquetaNueva}}</button>
                </span>
                <ng-content></ng-content>
            </div>
        </header>`,
    styleUrls: ['./listado-cabecera.component.sass'],
    standalone: false
})
export class ListadoCabeceraComponent implements OnInit {
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

    private readonly contexto = inject(CONTEXTO_DE_LISTADO, { optional: true });
    private readonly injector = inject(Injector);
    /** Si va «Nueva …»: en un listado de catálogo con inserción y con el menú por catálogo (B). */
    nueva$: Observable<boolean> = of(false);
    etiquetaNueva = '';

    ngOnInit(): void {
        const lista = this.contexto?.tipoLista ?? '';
        if (!tieneInsercion(lista))
            return;
        // Solo en un listado de catálogo se piden el tema y la cuenta: las demás cabeceras (Dados, Novedades) no los usan.
        this.etiquetaNueva = INSERCIONES_CATALOGO[lista];
        this.nueva$ = this.injector.get(TemaWebService).menuLateral$.pipe(map((menu) => menu === 'catalogo'));
    }

    private get usuario(): UserService {
        return this.injector.get(UserService);
    }

    get puedeInsertar(): boolean {
        return puedeGestionarListado(this.usuario, this.contexto?.tipoLista ?? '');
    }

    get mensajePermisos(): string {
        return this.puedeInsertar ? '' : this.usuario.getPermissionDeniedMessage();
    }

    abrirNueva(): void {
        const lista = this.contexto?.tipoLista ?? '';
        if (!this.puedeInsertar)
            return;
        trasLasNormasDeCreacion(this.usuario, () => this.injector.get(NavegacionRolService).abrir({ clase: 'insercion', lista }));
    }

    alEscribir(texto: string): void {
        this.texto = texto;
        this.textoChange.emit(texto);
    }
}
