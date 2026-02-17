import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-detalles-tipo-criatura',
    templateUrl: './detalles-tipo-criatura.component.html',
    styleUrls: ['./detalles-tipo-criatura.component.sass']
})
export class DetallesTipoCriaturaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    @Input() tipo!: TipoCriatura;

    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual(this.tipo?.Manual);
    }

    verDetallesRasgo(value: Rasgo) {
        this.rasgoDetalles.emit(value);
    }
}
