import { Component } from '@angular/core';
import { ListaPersonajesService } from 'src/app/services/lista-personajes.service';

@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent {

    constructor(private lpsrv: ListaPersonajesService) { }

    sincronizarListaPJs(){
        const resultado = this.lpsrv.RenovarLPsFirebase();
        if(!resultado){
            alert('error al sincronizar datos');
        }
    }
}