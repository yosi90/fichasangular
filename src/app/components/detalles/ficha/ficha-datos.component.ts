import { Component, Input, OnChanges } from '@angular/core';
import { textoVisible } from 'src/app/services/utils/texto-visible';
import { DatoFicha, LARGO_DATO_ANCHO, datosVisibles, textoDato } from './ficha';

interface DatoPintado {
    etiqueta: string;
    valor: string;
    detalle: string | null;
    ancho: number;
    ayuda: string | null;
    alPulsar?: () => void;
}

/**
 * Los datos clave en una rejilla de pares etiqueta y valor: la sustitución de las pastillas. Solo pinta los datos con
 * algo que enseñar (lo que la API da `null` o de relleno no sale) y, si no queda ninguno, nada.
 * Por defecto es una tarjeta propia a todo lo ancho, bajo la cabecera; con `[tarjeta]="false"` va dentro de otra
 * (por ejemplo, un «En resumen» en la columna derecha, con `[columnas]="2"`).
 */
@Component({
    selector: 'app-ficha-datos',
    template: `
        <section class="ficha-datos-contenedor" *ngIf="pintados.length > 0" [class.ficha-tarjeta]="tarjeta" [class.ficha-datos-contenedor--tarjeta]="tarjeta"
            [attr.aria-label]="titulo || null">
            <dl class="ficha-datos" [style.--ficha-columnas]="columnas">
                <div class="ficha-dato" *ngFor="let dato of pintados" [style.grid-column]="dato.ancho > 1 ? 'span ' + dato.ancho : null">
                    <dt class="ficha-dato__etiqueta">{{dato.etiqueta}}</dt>
                    <dd class="ficha-dato__valor" [matTooltip]="dato.ayuda ?? ''" [matTooltipDisabled]="!dato.ayuda" matTooltipClass="tt-accent tt-multiline">
                        <button type="button" class="ficha-enlace" *ngIf="dato.alPulsar; else valorTexto" (click)="dato.alPulsar()">{{dato.valor}}</button>
                        <ng-template #valorTexto>{{dato.valor}}</ng-template>
                        <span class="ficha-dato__detalle" *ngIf="dato.detalle"> {{dato.detalle}}</span>
                    </dd>
                </div>
            </dl>
        </section>`,
    standalone: false
})
export class FichaDatosComponent implements OnChanges {
    @Input() datos: DatoFicha[] | null | undefined = [];
    /** Columnas de la rejilla en pantallas anchas (4 por defecto). En estrechas bajan a 2 y a 1. */
    @Input() columnas = 4;
    @Input() tarjeta = true;
    /** Nombre accesible de la rejilla («Datos del conjuro»). */
    @Input() titulo: string | null = null;

    pintados: DatoPintado[] = [];

    ngOnChanges(): void {
        const maximo = Math.max(1, this.columnas);
        this.pintados = datosVisibles(this.datos).map((dato) => {
            const valor = textoDato(dato.valor) ?? '';
            const ancho = dato.ancho ?? (valor.length > LARGO_DATO_ANCHO ? 2 : 1);
            return {
                etiqueta: dato.etiqueta,
                valor,
                detalle: textoVisible(dato.detalle) || null,
                ancho: Math.min(Math.max(1, ancho), maximo),
                ayuda: textoVisible(dato.ayuda) || null,
                alPulsar: dato.alPulsar,
            };
        });
    }
}
