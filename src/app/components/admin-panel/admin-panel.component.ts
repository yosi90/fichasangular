import { Component } from '@angular/core';
import { ListaPersonajesService } from 'src/app/services/lista-personajes.service';
import { CampañasService } from 'src/app/services/campañas.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { RazasService } from 'src/app/services/razas.service';
import { ManualesService } from 'src/app/services/manuales.service';

@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent {

    constructor(private pSvc: PersonajeService, private lpSvc: ListaPersonajesService, private cSvc: CampañasService, private rSvc: RazasService, private mSvc: ManualesService) { }

    sincronizarListaPJs() {
        const resultado = this.lpSvc.RenovarPersonajesSimples();
    }

    sincronizarCampanas() {
        const resultado = this.cSvc.RenovarCampañasFirebase();
    }

    sincronizarPJs() {
        const resultado = this.pSvc.RenovarPersonajes();
    }

    sincronizarRazas() {
        const resultado = this.rSvc.RenovarRazas();
    }

    sincronizarManuales() {
        const resultado = this.mSvc.RenovarManuales();
    }
}