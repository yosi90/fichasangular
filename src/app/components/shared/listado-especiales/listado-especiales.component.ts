import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { EspecialService } from 'src/app/services/especial.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { Subscription } from 'rxjs';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-especiales',
    templateUrl: './listado-especiales.component.html',
    styleUrls: ['./listado-especiales.component.sass'],
    standalone: false
})
export class ListadoEspecialesComponent implements OnDestroy, ListadoBuscable {
    especiales: EspecialClaseDetalle[] = [];
    especialesDS = new MatTableDataSource(this.especiales);
    especialColumns = ['Nombre', 'Extra', 'Repetible', 'Activa_extra'];
    /** Las columnas de casilla, con su nombre visible. */
    readonly casillas = [
        { columna: 'Extra', etiqueta: 'Extra' },
        { columna: 'Repetible', etiqueta: 'Repetible' },
        { columna: 'Activa_extra', etiqueta: 'Activa extra' },
    ] as const;
    /** El buscador rápido de la cabecera (nombre y descripción); es el único filtro de los especiales. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(private cdr: ChangeDetectorRef, private eSvc: EspecialService) { }

    @ViewChild(MatSort) especialSort!: MatSort;
    @ViewChild(MatPaginator) especialPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.especialesDS.paginator = this.especialPaginator;
        this.especialesDS.sort = this.especialSort;
        ordenarEnEspanol(this.especialesDS);
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee los especiales (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.eSvc.getEspeciales().subscribe({
            next: (especiales) => {
                this.especiales = (especiales ?? []).filter((especial) => this.esEspecialValido(especial));
                this.cargado = true;
                this.cdr.detectChanges();
                this.filtroEspeciales();
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
        this.filtroEspeciales();
    }

    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '';
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.filtroEspeciales();
    }

    filtroEspeciales() {
        const texto = normalizarTexto(this.textoBusqueda);
        const especialesFiltrados = this.especiales.filter((especial) => {
            if (!this.esEspecialValido(especial))
                return false;

            return texto === ''
                || normalizarTexto(especial.Nombre).includes(texto)
                || normalizarTexto(especial.Descripcion).includes(texto);
        });

        this.especialesDS = new MatTableDataSource(especialesFiltrados);
        setTimeout(() => {
            this.especialesDS.sort = this.especialSort;
            ordenarEnEspanol(this.especialesDS);
        }, 200);
        this.especialesDS.paginator = this.especialPaginator;
        if (this.especialSort) {
            this.especialSort.active = 'Nombre';
            this.especialSort.direction = 'asc';
        }
    }

    @Output() especialDetalles: EventEmitter<EspecialClaseDetalle> = new EventEmitter<EspecialClaseDetalle>();
    verDetallesEspecial(id: number) {
        const especial = this.especiales.find(e => e.Id === id);
        if (especial)
            this.especialDetalles.emit(especial);
    }

    @Output() especialSeleccionado: EventEmitter<EspecialClaseDetalle> = new EventEmitter<EspecialClaseDetalle>();
    seleccionarEspecial(id: number) {
        const especial = this.especiales.find(e => e.Id === id);
        if (especial)
            this.especialSeleccionado.emit(especial);
    }

    private esEspecialValido(especial: EspecialClaseDetalle | null | undefined): boolean {
        const id = Number(especial?.Id ?? 0);
        return Number.isFinite(id) && id > 0;
    }
}
