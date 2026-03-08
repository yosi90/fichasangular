import { Component, Input } from '@angular/core';
import { AptitudSortilega } from 'src/app/interfaces/aptitud-sortilega';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Id_nombre } from 'src/app/interfaces/genericas';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-detalles-conjuro',
    templateUrl: './detalles-conjuro.component.html',
    styleUrls: ['./detalles-conjuro.component.sass'],
    standalone: false
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

    get tieneDescriptores(): boolean {
        return this.descriptoresVisibles.length > 0;
    }

    get descriptoresVisibles(): Id_nombre[] {
        return (Array.isArray(this.conjuro?.Descriptores) ? this.conjuro.Descriptores : [])
            .filter((item) => this.hasText(item?.Nombre));
    }

    get muestraAumentos(): boolean {
        return this.conjuro?.Psionico === true && this.hasText(this.conjuro?.Descripcion_aumentos);
    }

    get tituloComponentes(): string {
        return this.conjuro?.Psionico === true ? 'Despliegues' : 'Componentes';
    }

    get componentesVisibles(): Conjuro['Componentes'] {
        return (Array.isArray(this.conjuro?.Componentes) ? this.conjuro.Componentes : [])
            .filter((item) => this.hasText(item?.Componente));
    }

    get nivelesClaseVisibles(): Conjuro['Nivel_clase'] {
        return (Array.isArray(this.conjuro?.Nivel_clase) ? this.conjuro.Nivel_clase : [])
            .filter((item) => this.toInt(item?.Id_clase) > 0 && this.hasText(item?.Clase));
    }

    get nivelesDominioVisibles(): Conjuro['Nivel_dominio'] {
        if (this.conjuro?.Psionico === true)
            return [];
        return (Array.isArray(this.conjuro?.Nivel_dominio) ? this.conjuro.Nivel_dominio : [])
            .filter((item) => this.toInt(item?.Id_dominio) > 0 && this.hasText(item?.Dominio));
    }

    get nivelesDisciplinaVisibles(): Conjuro['Nivel_disciplinas'] {
        if (this.conjuro?.Psionico !== true)
            return [];
        return (Array.isArray(this.conjuro?.Nivel_disciplinas) ? this.conjuro.Nivel_disciplinas : [])
            .filter((item) => this.toInt(item?.Id_disciplina) > 0 && this.hasText(item?.Disciplina));
    }

    private hasText(value: any): boolean {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        return normalized.length > 0 && normalized !== 'no especifica';
    }

    private toInt(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
    }
}
