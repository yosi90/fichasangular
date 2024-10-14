import { Component, OnInit } from '@angular/core';
import { ListaPersonajesService } from 'src/app/services/listas/lista-personajes.service';
import { CampañasService } from 'src/app/services/campañas.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { RazasService } from 'src/app/services/razas.service';
import { ManualesService } from 'src/app/services/manuales.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent implements OnInit {
    hasCon?: boolean;
    serverStatusIcon: string = 'question_mark';
    serverStatus: string = 'Verificar conexión';

    constructor(private pSvc: PersonajeService, private lpSvc: ListaPersonajesService, private cSvc: CampañasService, private rSvc: RazasService, private mSvc: ManualesService, private http: HttpClient) { }

    ngOnInit(): void {
        this.verifyCon();
    }

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

    reverificar() {
        this.serverStatusIcon = 'question_mark';
        this.serverStatus = 'Verificando...';
        this.verifyCon();
    }

    verifyCon(): void {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.http.get(`${environment.apiUrl}conexion`, { headers }).subscribe(
            (response: any) => {
                this.hasCon = true;
                this.serverStatusIcon = 'thumb_up';
                this.serverStatus = 'Conexión establecida';
            },
            (error) => {
                this.hasCon = false;
                this.serverStatusIcon = 'thumb_down';
                this.serverStatus = `Error en la conexión: ${error.status} - ${error.statusText}`;
            }
        );
    }
}