import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { UserService } from 'src/app/services/user.service';
import { puedeModificarDesdeDetalle } from 'src/app/services/utils/permisos-catalogo';

@Component({
    selector: 'app-detalles-rasgo',
    templateUrl: './detalles-rasgo.component.html',
    standalone: false
})
export class DetallesRasgoRacialComponent {
    @Input() rasgo!: Rasgo;
    /** El lápiz «Modificar»: abre la pestaña de modificar el rasgo. Sin quien lo escuche, no sale. */
    @Output() modificar = new EventEmitter<Rasgo>();

    constructor(private userSvc: UserService) { }

    get puedeModificar(): boolean {
        return puedeModificarDesdeDetalle(this.modificar, this.userSvc, 'rasgos');
    }
}
