import { Component, Input } from '@angular/core';
import { AptitudSortilega } from 'src/app/interfaces/aptitud-sortilega';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Id_nombre } from 'src/app/interfaces/genericas';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-detalles-conjuro',
    templateUrl: './detalles-conjuro.component.html',
    styleUrls: ['./detalles-conjuro.component.sass']
})
export class DetallesConjuroComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    @Input()
    set sortilega(value: {ap: AptitudSortilega, fuente: string}) {
        this.ap = value.ap;
        this.conjuro = value.ap.Conjuro;
        this.fuente =  value.fuente;
    }
    @Input() conjuro!: Conjuro;

    ap!: AptitudSortilega;
    fuente: string = '';

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual(this.conjuro?.Manual);
    }

    getDescriptores(lista: Id_nombre[]): string {
        return lista.map(d => d.Nombre).join(', ')
    }
}
