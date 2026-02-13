import { Component, Input } from '@angular/core';
import { RacialDetalle } from 'src/app/interfaces/racial';

@Component({
    selector: 'app-detalles-racial',
    templateUrl: './detalles-racial.component.html',
    styleUrls: ['./detalles-racial.component.sass']
})
export class DetallesRacialComponent {
    @Input() racial!: RacialDetalle;

    tieneTextoVisible(texto: string | undefined | null): boolean {
        if (!texto)
            return false;
        const base = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        if (!base)
            return false;
        const limpiado = base.replace(/[.]/g, '');
        return limpiado !== 'no especifica' && limpiado !== 'no se especifica' && limpiado !== 'no aplica';
    }
}
