import { Component, Input } from '@angular/core';
import { Rasgo } from 'src/app/interfaces/rasgo';

@Component({
    selector: 'app-detalles-rasgo',
    templateUrl: './detalles-rasgo.component.html',
    standalone: false
})
export class DetallesRasgoRacialComponent {
    @Input() rasgo!: Rasgo;
}
