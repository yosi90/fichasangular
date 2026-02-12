import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Manual } from 'src/app/interfaces/manual';
import { ManualService } from 'src/app/services/manual.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.sass']
})
export class NavbarComponent implements OnInit, OnDestroy {
    manuales: Manual[] = [];
    isLoading: boolean = true;
    errorState: string = '';
    private manualesSub?: Subscription;

    constructor(private mSvc: ManualService) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.errorState = '';
        this.manualesSub = this.mSvc.getManuales().subscribe({
            next: (manuales) => {
                this.manuales = manuales;
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

    getCategorias(manual: Manual): string[] {
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
}
