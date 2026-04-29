import { Component, Input } from '@angular/core';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';

@Component({
    selector: 'app-detalles-idioma',
    templateUrl: './detalles-idioma.component.html',
    styleUrls: ['./detalles-idioma.component.sass'],
    standalone: false,
})
export class DetallesIdiomaComponent {
    @Input() idioma!: IdiomaDetalle;

    tieneTextoVisible(texto: string | undefined | null): boolean {
        return `${texto ?? ''}`.trim().length > 0;
    }
}
