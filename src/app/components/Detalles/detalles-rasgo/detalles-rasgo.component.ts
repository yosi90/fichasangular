import { Component, Input } from '@angular/core';
import { Rasgo } from 'src/app/interfaces/rasgo';

@Component({
    selector: 'app-detalles-rasgo',
    templateUrl: './detalles-rasgo.component.html',
    styleUrls: ['./detalles-rasgo.component.sass']
})
export class DetallesRasgoRacialComponent {
    @Input() rasgo!: Rasgo;
}
