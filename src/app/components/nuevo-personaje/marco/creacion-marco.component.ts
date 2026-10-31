import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { nombreTipoPersonaje, TipoPersonaje } from 'src/app/services/utils/tipo-personaje';
import { OpcionesPasosCreacion, PasoCreacionId, PasoCreacionPintado, pintarPasosCreacion } from './creacion';

/**
 * La raíz de un paso de la creación: pone la ficha común (para la franja, las casillas y los pares) y carga los estilos
 * del marco, que son globales con el prefijo `creacion-` para que valgan en lo que proyecta cada paso.
 */
@Component({
    selector: 'app-creacion-marco',
    template: '<app-ficha-detalle class="creacion"><ng-content></ng-content></app-ficha-detalle>',
    styleUrls: ['./creacion-piezas.sass', './creacion.sass'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class CreacionMarcoComponent { }

/**
 * La cabecera de la creación y, debajo, la fila de pasos. La fila solo informa: los pasos hechos llevan ✓, el actual
 * su número en rosa (`aria-current="step"`) y los que faltan van atenuados. No se puede volver atrás ni saltar.
 */
@Component({
    selector: 'app-creacion-cabecera',
    template: `
        <section class="creacion-cabecera" aria-label="Personaje en creación">
            <div class="creacion-cabecera__identidad" *ngIf="!eligiendoTipo; else cabeceraEleccion">
                <span class="creacion-cabecera__paso">{{titulo}} · Paso {{numeroActual}} de {{pasos.length}}<span class="creacion-cabecera__paso-nombre"> · {{nombreActual}}</span></span>
                <h1 class="creacion-cabecera__nombre" [class.creacion-cabecera__nombre--vacio]="!nombreVisible">{{nombreVisible || 'Sin nombre todavía'}}</h1>
                <span class="creacion-cabecera__linea" *ngIf="linea">{{linea}}</span>
            </div>
            <!-- Lo primero de la creación: qué se crea (lienzo de los dragones jugables, tablero 0). -->
            <ng-template #cabeceraEleccion>
                <div class="creacion-cabecera__identidad">
                    <span class="creacion-cabecera__paso">{{titulo}}</span>
                    <h1 class="creacion-cabecera__nombre">¿Qué vas a crear?</h1>
                </div>
            </ng-template>
            <div class="creacion-cabecera__acciones">
                <button type="button" mat-stroked-button *ngIf="puedeCambiarTipo && tipo" (click)="cambiarTipo.emit()">
                    {{tipo === 'pnj' ? 'Cambiar a personaje jugador' : 'Cambiar a PNJ'}}
                </button>
                <span class="creacion-etiqueta creacion-etiqueta--tipo" *ngIf="tipo" [class.creacion-etiqueta--pnj]="tipo === 'pnj'">{{nombreTipo}}</span>
                <span class="creacion-etiqueta" *ngIf="oficial !== null" [class.creacion-etiqueta--aviso]="oficial === false">{{oficial ? 'Oficial' : 'Homebrew'}}</span>
                <button type="button" mat-stroked-button *ngIf="puedeVerFicha" (click)="verFicha.emit()">
                    <mat-icon aria-hidden="true">visibility</mat-icon>
                    Ver la ficha
                </button>
            </div>
            <!-- En el móvil (vista 10), la fila de pasos se resume en esta barra. -->
            <div class="creacion-progreso" *ngIf="!eligiendoTipo" role="progressbar" aria-valuemin="1" [attr.aria-valuemax]="pasos.length"
                [attr.aria-valuenow]="numeroActual" [attr.aria-valuetext]="'Paso ' + numeroActual + ' de ' + pasos.length + ': ' + nombreActual">
                <span class="creacion-progreso__tramo" *ngFor="let paso of pasos" [ngClass]="'creacion-progreso__tramo--' + paso.estado"></span>
            </div>
        </section>
        <ol class="creacion-pasos" aria-label="Pasos de la creación" *ngIf="!eligiendoTipo">
            <ng-container *ngFor="let paso of pasos; let ultimo = last">
                <li class="creacion-paso" [ngClass]="'creacion-paso--' + paso.estado" [attr.aria-current]="paso.estado === 'actual' ? 'step' : null">
                    <span class="creacion-paso__circulo" aria-hidden="true">
                        <mat-icon *ngIf="paso.estado === 'hecho'; else numero">check</mat-icon>
                        <ng-template #numero>{{paso.numero}}</ng-template>
                    </span>
                    <span class="creacion-paso__nombre">{{paso.nombre}}</span>
                    <span class="solo-lectores" *ngIf="paso.estado === 'hecho'">(hecho)</span>
                    <span class="solo-lectores" *ngIf="paso.estado === 'falta'">(por hacer)</span>
                </li>
                <li class="creacion-paso__linea" *ngIf="!ultimo" [class.creacion-paso__linea--hecha]="paso.estado === 'hecho'" aria-hidden="true"></li>
            </ng-container>
        </ol>`,
    standalone: false
})
export class CreacionCabeceraComponent implements OnChanges {
    @Input() paso: PasoCreacionId = 'raza';
    @Input() conVentajas = true;
    @Input() conConjuros = false;
    @Input() conFormacion = false;
    @Input() nombre: string | null | undefined = '';
    /** «Humano · Guerrero 5 · Neutral bueno». */
    @Input() linea = '';
    /** `true` «Oficial», `false` «Homebrew»; `null`, nada. */
    @Input() oficial: boolean | null = null;
    @Input() puedeVerFicha = true;
    @Output() verFicha = new EventEmitter<void>();
    /** «Nuevo personaje», «Nuevo personaje jugador» o «Nuevo PNJ» (`tituloNuevoPersonaje`). */
    @Input() titulo = 'Nuevo personaje';
    /** PJ o PNJ: su etiqueta, al lado de la de oficial; sin elegir, nada. */
    @Input() tipo: TipoPersonaje | null = null;
    /** Todavía se elige qué se crea: «¿Qué vas a crear?», sin la fila de pasos. */
    @Input() eligiendoTipo = false;
    /** Hasta elegir la raza se puede cambiar de PJ a PNJ y al revés. */
    @Input() puedeCambiarTipo = false;
    @Output() cambiarTipo = new EventEmitter<void>();

    /** «Personaje jugador» o «PNJ», la etiqueta del tipo. */
    get nombreTipo(): string {
        return nombreTipoPersonaje(this.tipo);
    }

    pasos: PasoCreacionPintado[] = [];
    numeroActual = 1;
    nombreActual = '';
    nombreVisible = '';

    ngOnChanges(): void {
        const opciones: OpcionesPasosCreacion = { conVentajas: this.conVentajas, conConjuros: this.conConjuros, conFormacion: this.conFormacion };
        this.pasos = pintarPasosCreacion(opciones, this.paso);
        const actual = this.pasos.find((paso) => paso.estado === 'actual');
        this.numeroActual = actual?.numero ?? 1;
        this.nombreActual = actual?.nombre ?? '';
        this.nombreVisible = `${this.nombre ?? ''}`.trim();
    }
}

/** El cuerpo de un paso: la tarea a la izquierda (3fr) y, a la derecha (2fr), lo que se mira o «Tu personaje». */
@Component({
    selector: 'app-creacion-cuerpo',
    template: `
        <div class="creacion-cuerpo" [class.creacion-cuerpo--sin-lateral]="!lateral">
            <section class="creacion-cuerpo__tarea" [attr.aria-label]="tituloTarea">
                <ng-content select="[creacionTarea]"></ng-content>
            </section>
            <aside class="creacion-cuerpo__lateral" [hidden]="!lateral" [attr.aria-label]="tituloLateral">
                <ng-content select="[creacionLateral]"></ng-content>
            </aside>
        </div>`,
    standalone: false
})
export class CreacionCuerpoComponent {
    @Input() lateral = true;
    @Input() tituloTarea = 'Tarea del paso';
    @Input() tituloLateral = 'Lo que miras';
}

/** El pie de un paso: una sola nota de ayuda a la izquierda y la acción para seguir abajo a la derecha. */
@Component({
    selector: 'app-creacion-pie',
    template: `
        <footer class="creacion-pie">
            <p class="creacion-pie__nota" *ngIf="nota" [class.creacion-pie__nota--aviso]="aviso">
                <mat-icon aria-hidden="true">{{aviso ? 'error_outline' : 'info_outline'}}</mat-icon>
                <span>{{nota}}</span>
            </p>
            <div class="creacion-pie__acciones"><ng-content></ng-content></div>
        </footer>`,
    standalone: false
})
export class CreacionPieComponent {
    @Input() nota: string | null | undefined = '';
    /** La nota explica por qué aún no se puede seguir. */
    @Input() aviso = false;
}

/**
 * La vista previa de lo que se pulsa en la lista de un paso (una raza, una clase, una plantilla): la columna derecha
 * solo existe mientras hay una abierta (`app-creacion-cuerpo [lateral]`). Al abrirse recibe el foco (para el teclado y
 * los lectores de pantalla) y se cierra con su ✕. Lo de dentro es el detalle de siempre, con la ficha común.
 */
@Component({
    selector: 'app-creacion-vista-previa',
    template: `
        <section class="creacion-vista-previa" id="creacion-vista-previa" #raiz tabindex="-1" [attr.aria-label]="titulo">
            <div class="creacion-vista-previa__cabecera">
                <h2 class="creacion-titulo">{{titulo}}</h2>
                <button type="button" mat-icon-button class="creacion-vista-previa__cerrar" (click)="cerrar.emit()"
                    aria-label="Cerrar la vista previa" matTooltip="Cerrar la vista previa">
                    <mat-icon>close</mat-icon>
                </button>
            </div>
            <ng-content></ng-content>
        </section>`,
    standalone: false
})
export class CreacionVistaPreviaComponent implements AfterViewInit, OnChanges {
    @Input() titulo = 'Lo que miras';
    /** Lo que se mira (su id): cada vez que cambia, el foco vuelve a la vista previa. */
    @Input() clave: unknown = null;
    @Output() cerrar = new EventEmitter<void>();
    @ViewChild('raiz', { static: true }) raiz!: ElementRef<HTMLElement>;

    ngAfterViewInit(): void {
        this.enfocar();
    }

    ngOnChanges(): void {
        if (this.raiz)
            this.enfocar();
    }

    private enfocar(): void {
        setTimeout(() => {
            this.raiz.nativeElement.scrollTop = 0;
            this.raiz.nativeElement.focus({ preventScroll: false });
        });
    }
}
