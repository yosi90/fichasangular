import { Component, inject, OnInit } from '@angular/core';
import { ListaPersonajesService } from 'src/app/services/listas/lista-personajes.service';
import { CampañasService } from 'src/app/services/campañas.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { RazasService } from 'src/app/services/razas.service';
import { ManualesService } from 'src/app/services/manuales.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { VerifyConnectionService } from 'src/app/services/utils/verify-connection.service';
import { ConjurosService } from 'src/app/services/conjuros.service';
import { EscuelasConjurosService } from 'src/app/services/escuelas-conjuros.service';
import { DisciplinasConjurosService } from 'src/app/services/disciplinas-conjuros.service';

@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent implements OnInit {
    hasCon?: boolean;
    serverStatusIcon: string = 'question_mark';
    serverStatus: string = 'Verificar conexión';

    constructor(private conSvc: VerifyConnectionService, private pSvc: PersonajeService, private lpSvc: ListaPersonajesService, private cSvc: CampañasService, private rSvc: RazasService, private mSvc: ManualesService,
        private tcSvc: TipoCriaturaService, private raSvc: RasgoService, private coSvc: ConjurosService, private escSvc: EscuelasConjurosService, private disSvc: DisciplinasConjurosService
    ) { }

    ngOnInit(): void {
        this.verificar();
    }

    sincronizarListaPJs() { this.lpSvc.RenovarPersonajesSimples(); }

    sincronizarCampanas() { this.cSvc.RenovarCampañasFirebase(); }

    sincronizarPJs() { this.pSvc.RenovarPersonajes(); }

    sincronizarRazas() { this.rSvc.RenovarRazas(); }

    sincronizarManuales() { this.mSvc.RenovarManuales(); }

    sincronizarTiposCriatura() { this.tcSvc.RenovarTiposCriatura(); }

    sincronizarRasgos() { this.raSvc.RenovarRasgos(); }

    sincronizarConjuros() { this.coSvc.RenovarConjuros(); }

    sincronizarEscuelas() { this.escSvc.RenovarEscuelas(); }

    sincronizarDisciplinas() { this.disSvc.RenovarDisciplinas(); }

    verificar() {
        this.serverStatusIcon = 'question_mark';
        this.serverStatus = 'Verificando...';
        this.conSvc.verifyCon().subscribe(isConnected => {
            if (isConnected) {
                this.serverStatusIcon = 'thumb_up';
                this.serverStatus = 'Conexión establecida';
            } else {
                this.serverStatusIcon = 'thumb_down';
                this.serverStatus = 'Error en la conexión';
            }
        });
    }
}