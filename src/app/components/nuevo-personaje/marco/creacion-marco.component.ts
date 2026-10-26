import { Component, EventEmitter, Input, OnChanges, Output, ViewEncapsulation } from '@angular/core';
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
            <div class="creacion-cabecera__identidad">
                <span class="creacion-cabecera__paso">Nuevo personaje · Paso {{numeroActual}} de {{pasos.length}}</span>
                <h1 class="creacion-cabecera__nombre" [class.creacion-cabecera__nombre--vacio]="!nombreVisible">{{nombreVisible || 'Sin nombre todavía'}}</h1>
                <span class="creacion-cabecera__linea" *ngIf="linea">{{linea}}</span>
            </div>
            <div class="creacion-cabecera__acciones">
                <span class="creacion-etiqueta" *ngIf="oficial !== null" [class.creacion-etiqueta--aviso]="oficial === false">{{oficial ? 'Oficial' : 'Homebrew'}}</span>
                <button type="button" mat-stroked-button *ngIf="puedeVerFicha" (click)="verFicha.emit()">
                    <mat-icon aria-hidden="true">visibility</mat-icon>
                    Ver la ficha
                </button>
            </div>
        </section>
        <ol class="creacion-pasos" aria-label="Pasos de la creación">
            <ng-container *ngFor="let paso of pasos; let ultimo = last">
                <li class="creacion-paso" [ngClass]="'creacion-paso--' + paso.estado" [attr.aria-current]="paso.estado === 'actual' ? 'step' : null">
                    <span class="creacion-paso__circulo" aria-hidden="true">
                        <mat-icon *ngIf="paso.estado === 'hecho'; else numero">check</mat-icon>
                        <ng-template #numero>{{paso.numero}}</ng-template>
                    </span>
                    <span class="creacion-paso__nombre">{{paso.nombre}}</span>
                    <span class="creacion-oculto" *ngIf="paso.estado === 'hecho'">(hecho)</span>
                    <span class="creacion-oculto" *ngIf="paso.estado === 'falta'">(por hacer)</span>
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
    @Input() nombre: string | null | undefined = '';
    /** «Humano · Guerrero 5 · Neutral bueno». */
    @Input() linea = '';
    /** `true` «Oficial», `false` «Homebrew»; `null`, nada. */
    @Input() oficial: boolean | null = null;
    @Input() puedeVerFicha = true;
    @Output() verFicha = new EventEmitter<void>();

    pasos: PasoCreacionPintado[] = [];
    numeroActual = 1;
    nombreVisible = '';

    ngOnChanges(): void {
        const opciones: OpcionesPasosCreacion = { conVentajas: this.conVentajas, conConjuros: this.conConjuros };
        this.pasos = pintarPasosCreacion(opciones, this.paso);
        this.numeroActual = this.pasos.find((paso) => paso.estado === 'actual')?.numero ?? 1;
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
