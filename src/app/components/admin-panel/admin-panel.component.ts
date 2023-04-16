import { Component } from '@angular/core';
import { ListaPersonajesService } from 'src/app/services/lista-personajes.service';
import { CampañasService } from 'src/app/services/campañas.service';

@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent {

    constructor(private lpsrv: ListaPersonajesService, private csrv: CampañasService) { }

    sincronizarListaPJs() {
        const resultado = this.lpsrv.RenovarLPsFirebase();
    }

    sincronizarCampanas() {
        const resultado = this.csrv.RenovarCampañasFirebase();
    }
}