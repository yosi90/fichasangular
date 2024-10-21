import { Component, Input } from '@angular/core';
import { AptitudSortilega } from 'src/app/interfaces/Aptitud-sortilega';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Id_nombre } from 'src/app/interfaces/genericas';

@Component({
    selector: 'app-detalles-conjuro',
    templateUrl: './detalles-conjuro.component.html',
    styleUrls: ['./detalles-conjuro.component.sass']
})
export class DetallesConjuroComponent {
    @Input()
    set sortilega(value: {ap: AptitudSortilega, fuente: string}) {
        this.ap = value.ap;
        this.conjuro = value.ap.Conjuro;
        this.fuente =  value.fuente;
    }
    @Input() conjuro!: Conjuro;

    ap!: AptitudSortilega;
    fuente: string = '';

    getDescriptores(lista: Id_nombre[]): string {
        return lista.map(d => d.Nombre).join(', ')
    }
}
