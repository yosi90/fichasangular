import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';

@Component({
    selector: 'app-detalles-tipo-criatura',
    templateUrl: './detalles-tipo-criatura.component.html',
    styleUrls: ['./detalles-tipo-criatura.component.sass']
})
export class DetallesTipoCriaturaComponent {
    @Input() tipo!: TipoCriatura;

    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    verDetallesRasgo(value: Rasgo) {
        this.rasgoDetalles.emit(value);
    }
}
