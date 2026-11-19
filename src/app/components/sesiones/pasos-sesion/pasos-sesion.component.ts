import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { estadoDelPaso } from 'src/app/services/utils/subida-nivel-vista';

/**
 * La fila de pasos de una pantalla de sesión (los hechos en gris, el actual en rosa): la usan la subida de nivel y la
 * plantilla y la raza mutada adquiridas, cada una con sus pasos y sus etiquetas. Su host no ocupa sitio
 * (`display: contents`): la fila queda en el hueco de la pantalla como antes.
 */
@Component({
    selector: 'app-pasos-sesion',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pasos-sesion.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    host: { style: 'display: contents' },
})
export class PasosSesionComponent {
    @Input({ required: true }) pasos: readonly string[] = [];
    /** El paso de ahora. */
    @Input({ required: true }) actual = '';
    /** El texto de cada paso («2 · Puntos de golpe»). */
    @Input({ required: true }) etiqueta: (paso: any) => string = (paso) => `${paso}`;
    /** El nombre accesible de la fila («Pasos de la subida»). */
    @Input() nombre = 'Pasos';

    estado(paso: string): 'hecho' | 'actual' | 'pendiente' {
        return estadoDelPaso(this.pasos, paso, this.actual);
    }
}
