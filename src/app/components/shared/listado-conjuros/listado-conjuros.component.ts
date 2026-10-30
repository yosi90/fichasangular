import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { conColumnaOpcional } from 'src/app/services/utils/columnas-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { textosDistintos } from 'src/app/services/utils/orden-texto';
import { TipoRol, tipoRolDeConjuro } from 'src/app/services/utils/iconos-rol';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-conjuros',
    templateUrl: './listado-conjuros.component.html',
    styleUrls: ['./listado-conjuros.component.sass'],
    standalone: false
})
export class ListadoConjurosComponent implements OnDestroy, ListadoBuscable {
    conjuros: Conjuro[] = [];
    Manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    conjurosDS = new MatTableDataSource(this.conjuros);
    conjuroColumns = ['Nombre', 'Manual', 'Arcano', 'Divino', 'Psionico'];
    /** Las columnas de casilla, con su nombre visible. */
    readonly disciplinas = [
        { columna: 'Arcano', etiqueta: 'Arcano' },
        { columna: 'Divino', etiqueta: 'Divino' },
        { columna: 'Psionico', etiqueta: 'Psiónico' },
    ];
    /** El buscador rápido de la cabecera. */
    textoBusqueda = '';
    mostrarHomebrew = false;
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private cSvc: ConjuroService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) conjuroSort!: MatSort;
    @ViewChild(MatPaginator) conjuroPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.conjurosDS.paginator = this.conjuroPaginator;
        this.conjurosDS.sort = this.conjuroSort;
        ordenarEnEspanol(this.conjurosDS);
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee los conjuros (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.cSvc.getConjuros().subscribe({
            next: (conjuros) => {
                this.conjuros = conjuros ?? [];
                this.Manuales = textosDistintos(this.conjuros, (conjuro) => conjuro?.Manual);
                this.defaultManual = 'Cualquiera';
                this.cargado = true;
                this.cdr.detectChanges();
                this.filtroConjuros();
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
        this.filtroConjuros();
    }

    filtroConjuros() {
        const texto = normalizarTexto(this.textoBusqueda, true);
        const conjurosFiltrados = this.conjuros.filter(conjuro =>
            (texto === '' || normalizarTexto(conjuro.Nombre, true).includes(texto))
            && (this.defaultManual == 'Cualquiera' || `${conjuro.Manual ?? ''}`.includes(this.defaultManual))
            && (this.mostrarHomebrew || conjuro.Oficial)
        );
        this.conjurosDS = new MatTableDataSource(conjurosFiltrados);
        setTimeout(() => {
            this.conjurosDS.sort = this.conjuroSort;
            ordenarEnEspanol(this.conjurosDS);
        }, 200);
        this.conjurosDS.paginator = this.conjuroPaginator;
        if (this.conjuroSort) {
            this.conjuroSort.active = 'Nombre';
            this.conjuroSort.direction = 'asc';
        }
    }

    get anuncioConjurosHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando conjuros homebrew' : 'Clic para mostar conjuros homebrew';
    }

    alternarConjurosHomebrew(): void {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.conjuroColumns = conColumnaOpcional(this.conjuroColumns, 'Homebrew', this.mostrarHomebrew);
        this.filtroConjuros();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera' || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        if (this.mostrarHomebrew)
            this.alternarConjurosHomebrew();
        else
            this.filtroConjuros();
    }

    /** Conjuro o poder psiónico, según el dato (`Psionico`). */
    tipoDe(conjuro: Conjuro): TipoRol {
        return tipoRolDeConjuro(conjuro);
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
