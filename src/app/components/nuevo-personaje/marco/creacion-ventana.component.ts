import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

let siguienteId = 0;

/**
 * La forma común de las ventanas de elección de la creación (dotes, aumentos, dominios, idiomas, familiar…): cabecera
 * con título y subtítulo (y la ✕ solo si se puede cerrar), cuerpo y pie con la acción secundaria a la izquierda y la
 * principal a la derecha. Lo de dentro lo pone cada ventana; para la lista a la izquierda y el detalle de lo
 * seleccionado a la derecha tiene las clases `creacion-ventana__columnas`, `__lista` y `__detalle`, y para cada opción,
 * `creacion-opcion`. Sus estilos son globales (prefijo `creacion-`). Pulsar fuera solo avisa (`pulsarFondo`) y cada
 * ventana decide si se cierra, como antes del marco.
 */
@Component({
    selector: 'app-creacion-ventana',
    template: `
        <div class="creacion-ventana-fondo" (click)="alPulsarFondo($event)">
            <div class="creacion-ventana" role="dialog" aria-modal="true" [attr.aria-labelledby]="idTitulo"
                [ngClass]="'creacion-ventana--' + ancho" (click)="$event.stopPropagation()">
                <header class="creacion-ventana__cabecera">
                    <div class="creacion-ventana__textos">
                        <h2 class="creacion-ventana__titulo" [id]="idTitulo">{{titulo}}</h2>
                        <p class="creacion-ventana__subtitulo" *ngIf="subtitulo">{{subtitulo}}</p>
                    </div>
                    <div class="creacion-ventana__cabecera-acciones">
                        <ng-content select="[ventanaCabecera]"></ng-content>
                        <button type="button" mat-icon-button class="creacion-ventana__cerrar" *ngIf="cerrable" [disabled]="cierreBloqueado"
                            aria-label="Cerrar" matTooltip="Cerrar" (click)="cerrar.emit()">
                            <mat-icon>close</mat-icon>
                        </button>
                    </div>
                </header>
                <div class="creacion-ventana__cuerpo" [class.creacion-ventana__cuerpo--relleno]="relleno">
                    <ng-content></ng-content>
                </div>
                <footer class="creacion-ventana__pie">
                    <div class="creacion-ventana__pie-lado"><ng-content select="[ventanaSecundaria]"></ng-content></div>
                    <div class="creacion-ventana__pie-lado"><ng-content select="[ventanaPrincipal]"></ng-content></div>
                </footer>
            </div>
        </div>`,
    styleUrls: ['./creacion-piezas.sass', './creacion-ventana.sass'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class CreacionVentanaComponent {
    @Input() titulo = '';
    @Input() subtitulo: string | null | undefined = '';
    /** Si lleva la ✕. Las elecciones obligatorias no se pueden cerrar. */
    @Input() cerrable = true;
    /** La ✕ se ve, pero aún no se puede cerrar (por ejemplo, mientras se guarda). */
    @Input() cierreBloqueado = false;
    /** `estrecha` (una pregunta), `normal` (una lista) o `ancha` (lista y detalle). */
    @Input() ancho: 'estrecha' | 'normal' | 'ancha' = 'normal';
    /** El cuerpo con su margen interior; sin él, lo pone lo de dentro (las columnas de lista y detalle). */
    @Input() relleno = true;
    @Output() cerrar = new EventEmitter<void>();
    /** Al pulsar fuera de la ventana (las que ya se cerraban así lo siguen haciendo; las demás no lo escuchan). */
    @Output() pulsarFondo = new EventEmitter<void>();

    readonly idTitulo = `creacion-ventana-titulo-${++siguienteId}`;

    alPulsarFondo(evento: MouseEvent): void {
        if (evento.target === evento.currentTarget)
            this.pulsarFondo.emit();
    }
}
