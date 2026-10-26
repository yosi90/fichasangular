import { Component, Input } from '@angular/core';
import { CasillaFicha } from './ficha';

/**
 * Las casillas de las características (y, si se dan, de las salvaciones): la abreviatura, el valor grande y, debajo, el
 * modificador o un detalle. Cada casilla es un grupo con su nombre accesible («Fuerza 16 (+3)»). Con `compacta`, más
 * pequeñas (la ficha del personaje por pestañas). Sin casillas no pinta nada.
 */
@Component({
    selector: 'app-ficha-casillas',
    template: `
        <section class="ficha-casillas" *ngIf="casillas.length > 0" [class.ficha-casillas--compacta]="compacta" [attr.aria-label]="titulo"
            [style.--ficha-casillas-columnas]="casillas.length">
            <div class="ficha-tarjeta ficha-casilla" *ngFor="let casilla of casillas" role="group" [attr.aria-label]="casilla.texto"
                [class.ficha-casilla--secundaria]="casilla.secundaria">
                <span class="ficha-casilla__nombre" [matTooltip]="casilla.nombre" matTooltipClass="tt-accent" aria-hidden="true">{{casilla.abreviatura}}</span>
                <span class="ficha-casilla__valor" aria-hidden="true" [matTooltip]="casilla.ayuda ?? ''" [matTooltipDisabled]="!casilla.ayuda"
                    matTooltipClass="tt-accent tt-multiline">{{casilla.valor}}</span>
                <span class="ficha-casilla__modificador" *ngIf="casilla.modificador" aria-hidden="true">{{casilla.modificador}}</span>
                <span class="ficha-casilla__detalle" *ngIf="casilla.detalle" [class.ficha-casilla__detalle--aviso]="casilla.aviso"
                    aria-hidden="true">{{casilla.detalle}}</span>
            </div>
        </section>`,
    standalone: false
})
export class FichaCasillasComponent {
    @Input() casillas: CasillaFicha[] = [];
    @Input() compacta = false;
    /** Nombre accesible del grupo de casillas. */
    @Input() titulo = 'Características';
}
