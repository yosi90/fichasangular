import { Component, Input } from '@angular/core';
import { EtiquetaFicha } from 'src/app/components/detalles/ficha';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';

@Component({
    selector: 'app-detalles-idioma',
    templateUrl: './detalles-idioma.component.html',
    standalone: false,
})
export class DetallesIdiomaComponent {
    @Input() idioma!: IdiomaDetalle;

    /** La etiqueta de un idioma secreto. Constante: la cabecera no se vuelve a pintar en cada ciclo. */
    readonly etiquetasSecreto: EtiquetaFicha[] = [{ texto: 'Secreto' }];
}
