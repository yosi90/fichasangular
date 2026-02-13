import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Subscription } from 'rxjs';
import { ManualAsociadoDetalle } from 'src/app/interfaces/manual-asociado';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { ManualVistaNavigationService } from 'src/app/services/manual-vista-navigation.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.sass']
})
export class NavbarComponent implements OnInit, OnDestroy {
    manuales: ManualAsociadoDetalle[] = [];
    isLoading: boolean = true;
    errorState: string = '';
    private manualesSub?: Subscription;

    constructor(
        private manualesAsociadosSvc: ManualesAsociadosService,
        private manualVistaNavSvc: ManualVistaNavigationService,
    ) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.errorState = '';
        this.manualesSub = this.manualesAsociadosSvc.getManualesAsociados().subscribe({
            next: (manuales) => {
                this.manuales = manuales.filter(m => Number(m?.Id) > 0);
                this.isLoading = false;
            },
            error: (error) => {
                this.errorState = error?.message ?? 'No se pudieron cargar los manuales';
                this.isLoading = false;
            }
        });
    }

    ngOnDestroy(): void {
        this.manualesSub?.unsubscribe();
    }

    getCategorias(manual: ManualAsociadoDetalle): string[] {
        const categorias: string[] = [];
        if (manual.Incluye_dotes) categorias.push('Dotes');
        if (manual.Incluye_conjuros) categorias.push('Conjuros');
        if (manual.Incluye_plantillas) categorias.push('Plantillas');
        if (manual.Incluye_monstruos) categorias.push('Monstruos');
        if (manual.Incluye_razas) categorias.push('Razas');
        if (manual.Incluye_clases) categorias.push('Clases');
        if (manual.Incluye_tipos) categorias.push('Tipos');
        if (manual.Incluye_subtipos) categorias.push('Subtipos');
        return categorias;
    }

    abrirManual(manual: ManualAsociadoDetalle, event: MouseEvent, trigger?: MatMenuTrigger): void {
        event.stopPropagation();
        if (!manual || Number(manual.Id) <= 0)
            return;
        this.manualVistaNavSvc.emitirApertura(manual);
        trigger?.closeMenu();
    }
}
