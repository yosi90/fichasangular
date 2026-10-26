import { Component, Input, OnChanges } from '@angular/core';
import { textoVisible } from 'src/app/services/utils/texto-visible';
import { DatoFranja, datosVisibles, textoDato } from './ficha';

interface DatoFranjaPintado {
    etiqueta: string;
    /** El nombre entero, en el tooltip, cuando se enseña la etiqueta corta. */
    nombre: string | null;
    valor: string;
    detalle: string | null;
    ayuda: string | null;
    ayudaBoton: DatoFranja['ayudaBoton'];
}

/**
 * La franja grande de datos principales, bajo la cabecera: los números que se miran primero en una criatura (valor de
 * desafío, CA, iniciativa, velocidad…), en una fila de casillas grandes. Solo pinta los datos con algo que enseñar y, si
 * no queda ninguno, nada. Con `compacta`, más baja y con las etiquetas cortas que tengan (la ficha del personaje por
 * pestañas).
 */
@Component({
    selector: 'app-ficha-franja',
    template: `
        <section class="ficha-tarjeta ficha-franja" *ngIf="pintados.length > 0" [class.ficha-franja--compacta]="compacta"
            [attr.aria-label]="titulo">
            <dl class="ficha-franja__datos" [style.--ficha-franja-columnas]="pintados.length">
                <div class="ficha-franja__dato" *ngFor="let dato of pintados">
                    <dt class="ficha-franja__etiqueta" [matTooltip]="dato.nombre ?? ''" [matTooltipDisabled]="!dato.nombre" matTooltipClass="tt-accent"
                        [attr.aria-label]="dato.nombre">{{dato.etiqueta}}</dt>
                    <dd class="ficha-franja__valor">
                        <span [matTooltip]="dato.ayuda ?? ''" [matTooltipDisabled]="!dato.ayuda" matTooltipClass="tt-accent tt-multiline">{{dato.valor}}</span>
                        <span class="ficha-franja__detalle" *ngIf="dato.detalle"> {{dato.detalle}}</span>
                        <button type="button" class="ficha-ayuda" *ngIf="dato.ayudaBoton as boton"
                            [matTooltip]="boton.texto" matTooltipClass="tt-accent" [attr.aria-label]="boton.texto"
                            (click)="boton.alPulsar($event)">
                            <mat-icon class="ficha-icono" aria-hidden="true">help_outline</mat-icon>
                        </button>
                    </dd>
                </div>
            </dl>
        </section>`,
    standalone: false
})
export class FichaFranjaComponent implements OnChanges {
    @Input() datos: DatoFranja[] | null | undefined = [];
    @Input() compacta = false;
    /** Nombre accesible de la franja. */
    @Input() titulo = 'Datos principales';

    pintados: DatoFranjaPintado[] = [];

    ngOnChanges(): void {
        this.pintados = (datosVisibles(this.datos) as DatoFranja[]).map((dato) => ({
            etiqueta: this.compacta && dato.etiquetaCorta ? dato.etiquetaCorta : dato.etiqueta,
            nombre: this.compacta && dato.etiquetaCorta ? dato.etiqueta : null,
            valor: textoDato(dato.valor) ?? '',
            detalle: textoVisible(dato.detalle) || null,
            ayuda: textoVisible(dato.ayuda) || null,
            ayudaBoton: dato.ayudaBoton ?? null,
        }));
    }
}
