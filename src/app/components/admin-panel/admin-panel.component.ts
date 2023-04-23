import { Component } from '@angular/core';
import { ListaPersonajesService } from 'src/app/services/lista-personajes.service';
import { CampañasService } from 'src/app/services/campañas.service';
import { PersonajeService } from 'src/app/services/personaje.service';

@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent {

    constructor(private pSvc: PersonajeService, private lpsrv: ListaPersonajesService, private csrv: CampañasService) { }

    sincronizarListaPJs() {
        const resultado = this.lpsrv.RenovarPersonajesSimples();
    }

    sincronizarCampanas() {
        const resultado = this.csrv.RenovarCampañasFirebase();
    }

    sincronizarDetallesPJs() {
        const resultado = this.pSvc.RenovarPersonajes();
    }
}