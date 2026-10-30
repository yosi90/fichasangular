import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubtipoResumen } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { textosDistintos } from 'src/app/services/utils/orden-texto';
import { Subscription } from 'rxjs';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-subtipos',
    templateUrl: './listado-subtipos.component.html',
    styleUrls: ['./listado-subtipos.component.sass'],
    standalone: false
})
export class ListadoSubtiposComponent implements OnDestroy, ListadoBuscable {
    subtipos: SubtipoResumen[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    subtiposDS = new MatTableDataSource(this.subtipos);
    subtipoColumns = ['Nombre', 'Manual', 'Heredada'];
    mostrarHomebrew = false;
    /** El buscador rápido de la cabecera. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private subtipoSvc: SubtipoService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) subtipoSort!: MatSort;
    @ViewChild(MatPaginator) subtipoPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.subtiposDS.paginator = this.subtipoPaginator;
        this.subtiposDS.sort = this.subtipoSort;
        ordenarEnEspanol(this.subtiposDS);
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee los subtipos (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.subtipoSvc.getSubtipos().subscribe({
            next: (subtipos) => {
                this.subtipos = subtipos ?? [];
                this.manuales = textosDistintos(this.subtipos, (subtipo) => subtipo?.Manual?.Nombre);
                this.defaultManual = 'Cualquiera';
                this.cargado = true;
                this.cdr.detectChanges();
                this.filtroSubtipos();
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
        this.filtroSubtipos();
    }

    filtroSubtipos() {
        const texto = normalizarTexto(this.textoBusqueda);
        const homebrew = this.mostrarHomebrew;
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
        if (this.subtipoSort) {
            this.subtipoSort.active = 'Nombre';
            this.subtipoSort.direction = 'asc';
        }
    }

    get anuncioSubtiposHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando subtipos homebrew' : 'Clic para mostar subtipos homebrew';
    }

    alternarSubtiposHomebrew(): void {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.subtipoColumns = this.mostrarHomebrew
            ? [...this.subtipoColumns.filter((c) => c !== 'Homebrew'), 'Homebrew']
            : this.subtipoColumns.filter((c) => c !== 'Homebrew');
        this.filtroSubtipos();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera' || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        if (this.mostrarHomebrew)
            this.alternarSubtiposHomebrew();
        else
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

}
