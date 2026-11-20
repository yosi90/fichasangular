import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * «El nivel que pierde» con el orden de sus niveles por conocer (las fichas de antes del historial): la clase que pierde el
 * nivel y, sin su registro, el incremento y la dote de su DG, en tres desplegables. Lo comparten perder un nivel, la
 * conversión en muerto viviente y devolver la vida a un muerto viviente (el nivel de más). Las opciones las da quien lo usa
 * (`clasesQuePuedenPerder`, `caracteristicasDelIncrementoPerdido` y `dotesQuePuedePerder`, en `perder-nivel.ts`) y recibe
 * lo elegido en sus salidas.
 */
@Component({
    selector: 'app-nivel-que-pierde',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './nivel-que-pierde.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
})
export class NivelQuePierdeComponent {
    @Input() clases: ReadonlyArray<{ id: number; nombre: string; nivel: number; }> = [];
    @Input() caracteristicas: ReadonlyArray<{ id: number; nombre: string; valor: number; }> = [];
    @Input() dotes: ReadonlyArray<{ clave: string; nombre: string; }> = [];
    @Input() idClase: number | null = null;
    @Input() incremento: number | null = null;
    @Input() dote = '';
    /** Sin su registro, si el DG que pierde daba incremento o dote (cada 4 y 1.º y cada 3). */
    @Input() pideIncremento = false;
    @Input() pideDote = false;

    @Output() readonly claseElegida = new EventEmitter<string>();
    @Output() readonly incrementoElegido = new EventEmitter<string>();
    @Output() readonly doteElegida = new EventEmitter<string>();
}
