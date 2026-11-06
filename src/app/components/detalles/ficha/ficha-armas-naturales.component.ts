import { Component, Input } from '@angular/core';
import { ArmaNatural } from 'src/app/interfaces/arma-natural';

/**
 * Las armas naturales de una raza, una plantilla o un monstruo como dato, una por línea con la frase de la API («2 garras
 * 1d4», «Mordisco 1d6 (ataque secundario)», «Golpetazo (si no tiene ya)»). Va dentro de una `<app-ficha-seccion>` (la
 * que proyecta `<app-ficha-cuerpo>`); sin datos, la pantalla pinta en su lugar la sección con el texto de siempre.
 */
@Component({
    selector: 'app-ficha-armas-naturales',
    template: `
        <ul class="ficha-lista">
            <li class="ficha-lista__item" *ngFor="let arma of armas; trackBy: trackByArma">{{arma.Texto}}</li>
        </ul>`,
    standalone: false
})
export class FichaArmasNaturalesComponent {
    @Input() armas: readonly ArmaNatural[] = [];

    trackByArma(indice: number, arma: ArmaNatural): string {
        return `${arma.Id_arma_natural}-${indice}`;
    }
}
