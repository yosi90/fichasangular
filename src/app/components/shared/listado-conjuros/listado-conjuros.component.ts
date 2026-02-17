import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Manual } from 'src/app/interfaces/manual';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { ManualService } from 'src/app/services/manual.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-listado-conjuros',
    templateUrl: './listado-conjuros.component.html',
    styleUrls: ['./listado-conjuros.component.sass']
})
export class ListadoConjurosComponent {
    conjuros: Conjuro[] = [];
    Manuales: Manual[] = [];
    defaultManual: string = 'Cualquiera';
    conjurosDS = new MatTableDataSource(this.conjuros);
    conjuroColumns = ['Nombre', 'Manual', 'Arcano', 'Divino', 'Psionico', 'Alma'];

    constructor(
        private cdr: ChangeDetectorRef,
        private cSvc: ConjuroService,
        private mSvc: ManualService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) conjuroSort!: MatSort;
    @ViewChild(MatPaginator) conjuroPaginator!: MatPaginator;
    @ViewChild('conjuroTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.conjurosDS.paginator = this.conjuroPaginator;
        this.conjurosDS.sort = this.conjuroSort;
        (this.cSvc.getConjuros()).subscribe(conjuros => {
            this.conjuros = conjuros;
            (this.mSvc.getManuales()).subscribe(manuales => {
                this.Manuales = [...manuales].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                this.defaultManual = 'Cualquiera';
                this.cdr.detectChanges();
                this.filtroConjuros();
                this.cdr.detectChanges();
            });
        });
    }

    filtroConjuros() {
        const texto = this.nombreText?.nativeElement.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ?? '';
        const homebrew = !(this.anuncioConjurosHomebrew === 'Clic para mostar conjuros homebrew');
        const conjurosFiltrados = this.conjuros.filter(conjuro =>
            (texto === undefined || texto === '' || conjuro.Nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto))
            && (this.defaultManual == 'Cualquiera' || conjuro.Manual.includes(this.defaultManual))
            && (homebrew || !homebrew && conjuro.Oficial)
        );
        this.conjurosDS = new MatTableDataSource(conjurosFiltrados);
        setTimeout(() => {
            this.conjurosDS.sort = this.conjuroSort;
        }, 200);
        this.conjurosDS.paginator = this.conjuroPaginator;
        this.conjuroSort.active = 'Nombre';
        this.conjuroSort.direction = 'asc';
    }

    anuncioConjurosHomebrew: string = 'Clic para mostar conjuros homebrew';
    AlternarConjurosHombrew(value: string) {
        if (value === 'Clic para mostar conjuros homebrew') {
            this.anuncioConjurosHomebrew = 'Mostrando conjuros homebrew';
            this.conjuroColumns.push('Homebrew');
        } else {
            this.anuncioConjurosHomebrew = 'Clic para mostar conjuros homebrew';
            this.conjuroColumns.pop();
        }
        this.filtroConjuros();
    }

    @Output() conjuroDetalles: EventEmitter<Conjuro> = new EventEmitter<Conjuro>();
    verDetallesConjuro(value: number) {
        this.conjuroDetalles.emit(this.conjuros.find(c => c.Id === value));
    }

    @Output() conjuroSeleccionado: EventEmitter<Conjuro> = new EventEmitter<Conjuro>();
    seleccionarConjuro(value: number) {
        this.conjuroSeleccionado.emit(this.conjuros.find(c => c.Id === value));
    }

    abrirDetalleManual(conjuro: Conjuro, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual(conjuro?.Manual);
    }
}
