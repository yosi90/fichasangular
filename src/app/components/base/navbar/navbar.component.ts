import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Subscription } from 'rxjs';
import { getManualCategorias, ManualCategoriaConIcono } from 'src/app/config/manual-secciones.config';
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
    fallbackNotice: string = '';
    private manualesSub?: Subscription;
    private fallbackSub?: Subscription;

    constructor(
        private manualesAsociadosSvc: ManualesAsociadosService,
        private manualVistaNavSvc: ManualVistaNavigationService,
    ) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.errorState = '';
        this.fallbackSub = this.manualesAsociadosSvc.fallbackNotice$
            .subscribe((notice) => this.fallbackNotice = notice ?? '');
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
        this.fallbackSub?.unsubscribe();
    }

    getCategorias(manual: ManualAsociadoDetalle): ManualCategoriaConIcono[] {
        return getManualCategorias(manual);
    }

    abrirManual(manual: ManualAsociadoDetalle, event: MouseEvent, trigger?: MatMenuTrigger): void {
        event.stopPropagation();
        if (!manual || Number(manual.Id) <= 0)
            return;
        this.manualVistaNavSvc.emitirApertura(manual);
        trigger?.closeMenu();
    }
}
