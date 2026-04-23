import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';

@Component({
    selector: 'app-listado-tipos-criatura',
    templateUrl: './listado-tipos-criatura.component.html',
    styleUrls: ['./listado-tipos-criatura.component.sass'],
    standalone: false
})
export class ListadoTiposCriaturaComponent {
    tipos: TipoCriatura[] = [];
    Manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    tiposDS = new MatTableDataSource(this.tipos);
    tipoColumns = ['Nombre', 'Manual'];

    constructor(
        private cdr: ChangeDetectorRef,
        private tSvc: TipoCriaturaService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) tipoSort!: MatSort;
    @ViewChild(MatPaginator) tipoPaginator!: MatPaginator;
    @ViewChild('tipoTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.tiposDS.paginator = this.tipoPaginator;
        this.tiposDS.sort = this.tipoSort;
        (this.tSvc.getTiposCriatura()).subscribe(tipos => {
            this.tipos = tipos.filter(t => t.Nombre !== 'Cualquiera');
            this.Manuales = this.buildManualesDisponibles(this.tipos);
            this.defaultManual = 'Cualquiera';
            this.cdr.detectChanges();
            this.filtroTipos();
            this.cdr.detectChanges();
        });
    }

    filtroTipos() {
        const texto = this.nombreText?.nativeElement.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ?? '';
        const homebrew = !(this.anuncioTiposHomebrew === 'Clic para mostar tipos homebrew');
        const tiposFiltrados = this.tipos.filter(tipo =>
            (texto === undefined || texto === '' || tipo.Nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto))
            && (this.defaultManual == 'Cualquiera' || tipo.Manual.includes(this.defaultManual))
            && (homebrew || !homebrew && tipo.Oficial)
        );
        this.tiposDS = new MatTableDataSource(tiposFiltrados);
        setTimeout(() => {
            this.tiposDS.sort = this.tipoSort;
        }, 200);
        this.tiposDS.paginator = this.tipoPaginator;
        this.tipoSort.active = 'Nombre';
        this.tipoSort.direction = 'asc';
    }

    anuncioTiposHomebrew: string = 'Clic para mostar tipos homebrew';
    AlternarTiposHombrew(value: string) {
        if (value === 'Clic para mostar tipos homebrew') {
            this.anuncioTiposHomebrew = 'Mostrando tipos homebrew';
            this.tipoColumns.push('Homebrew');
        } else {
            this.anuncioTiposHomebrew = 'Clic para mostar tipos homebrew';
            this.tipoColumns.pop();
        }
        this.filtroTipos();
    }

    @Output() tipoCriaturaDetalles: EventEmitter<TipoCriatura> = new EventEmitter<TipoCriatura>();
    verDetallesTipo(value: number) {
        this.tipoCriaturaDetalles.emit(this.tipos.find(c => c.Id === value));
    }

    @Output() tipoCriaturaSeleccionado: EventEmitter<TipoCriatura> = new EventEmitter<TipoCriatura>();
    seleccionarTipo(value: number) {
        this.tipoCriaturaSeleccionado.emit(this.tipos.find(c => c.Id === value));
    }

    abrirDetalleManual(tipo: TipoCriatura, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual(tipo?.Manual);
    }

    private buildManualesDisponibles(tipos: TipoCriatura[]): string[] {
        return Array.from(new Set(
            (tipos ?? [])
                .map((tipo) => `${tipo?.Manual ?? ''}`.trim())
                .filter((nombre) => nombre.length > 0)
        )).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    }
}
