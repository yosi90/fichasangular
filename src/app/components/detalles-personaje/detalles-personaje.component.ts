import { Component, Input } from '@angular/core';
import { DetallesPersonaje } from 'src/app/interfaces/detalles-personaje';

@Component({
    selector: 'app-detalles-personaje',
    templateUrl: './detalles-personaje.component.html',
    styleUrls: ['./detalles-personaje.component.sass']
})
export class DetallesPersonajeComponent {
    @Input() dp!: DetallesPersonaje;
}
