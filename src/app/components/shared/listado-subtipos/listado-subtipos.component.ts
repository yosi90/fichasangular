import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Manual } from 'src/app/interfaces/manual';
import { SubtipoResumen } from 'src/app/interfaces/subtipo';
import { ManualService } from 'src/app/services/manual.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { SubtipoService } from 'src/app/services/subtipo.service';

@Component({
    selector: 'app-listado-subtipos',
    templateUrl: './listado-subtipos.component.html',
    styleUrls: ['./listado-subtipos.component.sass']
})
export class ListadoSubtiposComponent {
    subtipos: SubtipoResumen[] = [];
    manuales: Manual[] = [];
    defaultManual = 'Cualquiera';
    subtiposDS = new MatTableDataSource(this.subtipos);
    subtipoColumns = ['Nombre', 'Manual', 'Heredada'];
    anuncioSubtiposHomebrew = 'Clic para mostar subtipos homebrew';

    constructor(
        private cdr: ChangeDetectorRef,
        private subtipoSvc: SubtipoService,
        private manualSvc: ManualService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) subtipoSort!: MatSort;
    @ViewChild(MatPaginator) subtipoPaginator!: MatPaginator;
    @ViewChild('subtipoTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.subtiposDS.paginator = this.subtipoPaginator;
        this.subtiposDS.sort = this.subtipoSort;
        this.subtipoSvc.getSubtipos().subscribe(subtipos => {
            this.subtipos = subtipos.filter(s => s.Nombre !== 'Cualquiera');
            this.manualSvc.getManuales().subscribe(manuales => {
                this.manuales = [...manuales].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                this.defaultManual = 'Cualquiera';
                this.cdr.detectChanges();
                this.filtroSubtipos();
                this.cdr.detectChanges();
            });
        });
    }

    filtroSubtipos() {
        const texto = this.normalizar(this.nombreText?.nativeElement.value ?? '');
        const homebrew = this.anuncioSubtiposHomebrew !== 'Clic para mostar subtipos homebrew';
        const subtiposFiltrados = this.subtipos.filter(subtipo =>
            (texto === '' || this.normalizar(subtipo.Nombre).includes(texto))
            && (this.defaultManual === 'Cualquiera' || `${subtipo.Manual?.Nombre ?? ''}` === this.defaultManual)
            && (homebrew || subtipo.Oficial)
        );

        this.subtiposDS = new MatTableDataSource(subtiposFiltrados);
        setTimeout(() => {
            this.subtiposDS.sort = this.subtipoSort;
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

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
