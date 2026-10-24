import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubtipoResumen } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { compararTexto } from 'src/app/services/utils/orden-texto';

@Component({
    selector: 'app-listado-subtipos',
    templateUrl: './listado-subtipos.component.html',
    styleUrls: ['./listado-subtipos.component.sass'],
    standalone: false
})
export class ListadoSubtiposComponent {
    subtipos: SubtipoResumen[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    subtiposDS = new MatTableDataSource(this.subtipos);
    subtipoColumns = ['Nombre', 'Manual', 'Heredada'];
    anuncioSubtiposHomebrew = 'Clic para mostar subtipos homebrew';

    constructor(
        private cdr: ChangeDetectorRef,
        private subtipoSvc: SubtipoService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) subtipoSort!: MatSort;
    @ViewChild(MatPaginator) subtipoPaginator!: MatPaginator;
    @ViewChild('subtipoTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.subtiposDS.paginator = this.subtipoPaginator;
        this.subtiposDS.sort = this.subtipoSort;
        ordenarEnEspanol(this.subtiposDS);
        this.subtipoSvc.getSubtipos().subscribe(subtipos => {
            this.subtipos = subtipos;
            this.manuales = this.buildManualesDisponibles(this.subtipos);
            this.defaultManual = 'Cualquiera';
            this.cdr.detectChanges();
            this.filtroSubtipos();
            this.cdr.detectChanges();
        });
    }

    filtroSubtipos() {
        const texto = normalizarTexto(this.nombreText?.nativeElement.value ?? '');
        const homebrew = this.anuncioSubtiposHomebrew !== 'Clic para mostar subtipos homebrew';
        const subtiposFiltrados = this.subtipos.filter(subtipo =>
            (texto === '' || normalizarTexto(subtipo.Nombre).includes(texto))
            && (this.defaultManual === 'Cualquiera' || `${subtipo.Manual?.Nombre ?? ''}` === this.defaultManual)
            && (homebrew || subtipo.Oficial)
        );

        this.subtiposDS = new MatTableDataSource(subtiposFiltrados);
        setTimeout(() => {
            this.subtiposDS.sort = this.subtipoSort;
            ordenarEnEspanol(this.subtiposDS);
        }, 200);
        this.subtiposDS.paginator = this.subtipoPaginator;
        this.subtipoSort.active = 'Nombre';
        this.subtipoSort.direction = 'asc';
    }

    alternarSubtiposHomebrew(value: string) {
        if (value === 'Clic para mostar subtipos homebrew') {
            this.anuncioSubtiposHomebrew = 'Mostrando subtipos homebrew';
            this.subtipoColumns.push('Homebrew');
        } else {
            this.anuncioSubtiposHomebrew = 'Clic para mostar subtipos homebrew';
            this.subtipoColumns = this.subtipoColumns.filter(c => c !== 'Homebrew');
        }
        this.filtroSubtipos();
    }

    @Output() subtipoDetalles: EventEmitter<SubtipoResumen> = new EventEmitter<SubtipoResumen>();
    verDetallesSubtipo(idSubtipo: number) {
        const subtipo = this.subtipos.find(s => s.Id === idSubtipo);
        if (subtipo)
            this.subtipoDetalles.emit(subtipo);
    }

    @Output() subtipoSeleccionado: EventEmitter<SubtipoResumen> = new EventEmitter<SubtipoResumen>();
    seleccionarSubtipo(idSubtipo: number) {
        const subtipo = this.subtipos.find(s => s.Id === idSubtipo);
        if (subtipo)
            this.subtipoSeleccionado.emit(subtipo);
    }

    abrirDetalleManual(subtipo: SubtipoResumen, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: subtipo?.Manual?.Id,
            nombre: subtipo?.Manual?.Nombre,
        });
    }

    private buildManualesDisponibles(subtipos: SubtipoResumen[]): string[] {
        return Array.from(new Set(
            (subtipos ?? [])
                .map((subtipo) => `${subtipo?.Manual?.Nombre ?? ''}`.trim())
                .filter((nombre) => nombre.length > 0)
        )).sort(compararTexto);
    }

}
