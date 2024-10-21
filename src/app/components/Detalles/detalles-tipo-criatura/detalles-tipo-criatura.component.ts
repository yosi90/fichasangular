import { Component, Input } from '@angular/core';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';

@Component({
    selector: 'app-detalles-tipo-criatura',
    templateUrl: './detalles-tipo-criatura.component.html',
    styleUrls: ['./detalles-tipo-criatura.component.sass']
})
export class DetallesTipoCriaturaComponent {
    @Input() tipo!: TipoCriatura;
}
