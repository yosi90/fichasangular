import { Component } from '@angular/core';
import { ListaPersonajesService } from 'src/app/services/lista-personajes.service';
import { CampañasService } from 'src/app/services/campañas.service';
import { DetallesPersonajeService } from 'src/app/services/detalles-personaje.service';

@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent {

    constructor(private dps: DetallesPersonajeService, private lpsrv: ListaPersonajesService, private csrv: CampañasService) { }

    sincronizarListaPJs() {
        const resultado = this.lpsrv.RenovarLPsFirebase();
    }

    sincronizarCampanas() {
        const resultado = this.csrv.RenovarCampañasFirebase();
    }

    sincronizarDetallesPJs() {
        const resultado = this.dps.RenovarDetallesPJsFirebase();
    }
}