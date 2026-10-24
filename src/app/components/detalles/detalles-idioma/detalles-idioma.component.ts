import { Component, Input } from '@angular/core';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-idioma',
    templateUrl: './detalles-idioma.component.html',
    styleUrls: ['./detalles-idioma.component.sass'],
    standalone: false,
})
export class DetallesIdiomaComponent {
    @Input() idioma!: IdiomaDetalle;

    readonly tieneTextoVisible = tieneTextoVisible;
}
