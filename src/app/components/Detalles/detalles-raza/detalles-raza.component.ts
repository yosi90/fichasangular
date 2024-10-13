import { Component, Input } from '@angular/core';
import { Raza } from 'src/app/interfaces/raza';

@Component({
    selector: 'app-detalles-raza',
    templateUrl: './detalles-raza.component.html',
    styleUrls: ['./detalles-raza.component.sass']
})
export class DetallesRazaComponent {
    @Input() raza!: Raza;
}
