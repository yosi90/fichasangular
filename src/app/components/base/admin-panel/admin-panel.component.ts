import { Component, OnInit } from '@angular/core';
import { ListaPersonajesService } from 'src/app/services/listas/lista-personajes.service';
import { CampanaService } from 'src/app/services/campana.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { RazaService } from 'src/app/services/raza.service';
import { ManualService } from 'src/app/services/manual.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { VerifyConnectionService } from 'src/app/services/utils/verify-connection.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { DoteService } from 'src/app/services/dote.service';
import { ClaseService } from 'src/app/services/clase.service';
import { EspecialService } from 'src/app/services/especial.service';
import { RacialService } from 'src/app/services/racial.service';

@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent implements OnInit {
    hasCon?: boolean;
    serverStatusIcon: string = 'question_mark';
    serverStatus: string = 'Verificar conexión';

    constructor(private conSvc: VerifyConnectionService, private pSvc: PersonajeService, private lpSvc: ListaPersonajesService, private cSvc: CampanaService, private rSvc: RazaService, private mSvc: ManualService,
        private tcSvc: TipoCriaturaService, private raSvc: RasgoService, private coSvc: ConjuroService, private escSvc: EscuelaConjurosService, private disSvc: DisciplinaConjurosService, private aSvc: AlineamientoService,
        private plSvc: PlantillaService, private doSvc: DoteService, private clSvc: ClaseService, private espSvc: EspecialService, private racialSvc: RacialService,
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

    sincronizarAlineamientos() { this.aSvc.RenovarAlineamientos(); }

    sincronizarPlantillas() { this.plSvc.RenovarPlantillas(); }

    sincronizarDotes() { this.doSvc.RenovarDotes(); }

    sincronizarClases() { this.clSvc.RenovarClases(); }

    sincronizarEspeciales() { this.espSvc.RenovarEspeciales(); }

    sincronizarRaciales() { this.racialSvc.RenovarRaciales(); }

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
