import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import { esFilaComodin } from 'src/app/services/utils/comodin';
import { Subscription } from 'rxjs';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-tipos-criatura',
    templateUrl: './listado-tipos-criatura.component.html',
    styleUrls: ['./listado-tipos-criatura.component.sass'],
    standalone: false
})
export class ListadoTiposCriaturaComponent implements OnDestroy, ListadoBuscable {
    tipos: TipoCriatura[] = [];
    Manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    tiposDS = new MatTableDataSource(this.tipos);
    tipoColumns = ['Nombre', 'Manual'];
    mostrarHomebrew = false;
    /** El buscador rápido de la cabecera. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private tSvc: TipoCriaturaService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) tipoSort!: MatSort;
    @ViewChild(MatPaginator) tipoPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.tiposDS.paginator = this.tipoPaginator;
        this.tiposDS.sort = this.tipoSort;
        ordenarEnEspanol(this.tiposDS);
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee los tipos de criatura (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.tSvc.getTiposCriatura().subscribe({
            next: (tipos) => {
                // El tipo 0, «Cualquiera», es un comodín de los prerrequisitos y los editores: aquí no se lista.
                this.tipos = (tipos ?? []).filter(t => !esFilaComodin(t));
                this.Manuales = this.buildManualesDisponibles(this.tipos);
                this.defaultManual = 'Cualquiera';
                this.cargado = true;
                this.cdr.detectChanges();
                this.filtroTipos();
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargado = true;
                this.errorCarga = true;
                this.cdr.detectChanges();
            },
        });
    }

    buscar(texto: string): void {
        this.textoBusqueda = texto ?? '';
        this.filtroTipos();
    }

    filtroTipos() {
        const texto = normalizarTexto(this.textoBusqueda, true);
        const tiposFiltrados = this.tipos.filter(tipo =>
            (texto === '' || normalizarTexto(tipo.Nombre, true).includes(texto))
            && (this.defaultManual == 'Cualquiera' || `${tipo.Manual ?? ''}`.includes(this.defaultManual))
            && (this.mostrarHomebrew || tipo.Oficial)
        );
        this.tiposDS = new MatTableDataSource(tiposFiltrados);
        setTimeout(() => {
            this.tiposDS.sort = this.tipoSort;
            ordenarEnEspanol(this.tiposDS);
        }, 200);
        this.tiposDS.paginator = this.tipoPaginator;
        if (this.tipoSort) {
            this.tipoSort.active = 'Nombre';
            this.tipoSort.direction = 'asc';
        }
    }

    get anuncioTiposHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando tipos homebrew' : 'Clic para mostar tipos homebrew';
    }

    alternarTiposHomebrew(): void {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.tipoColumns = this.mostrarHomebrew
            ? [...this.tipoColumns.filter((c) => c !== 'Homebrew'), 'Homebrew']
            : this.tipoColumns.filter((c) => c !== 'Homebrew');
        this.filtroTipos();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera' || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        if (this.mostrarHomebrew)
            this.alternarTiposHomebrew();
        else
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
        )).sort(compararTexto);
    }
}
