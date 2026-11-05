import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { ManualAsociadoDetalle } from 'src/app/interfaces/manual-asociado';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { conColumnaOpcional } from 'src/app/services/utils/columnas-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

/**
 * El listado de los manuales (hito 9 del roadmap de inserciones): el de «Modificar → Manual» (la fila abre la edición) y
 * el de «Detalles → Manuales» (el nombre abre el detalle, con lo que cita cada manual). Como el de los rasgos: buscador,
 * y los homebrew, ocultos hasta que se piden.
 */
@Component({
    selector: 'app-listado-manuales',
    templateUrl: './listado-manuales.component.html',
    styleUrls: ['./listado-manuales.component.sass'],
    standalone: false
})
export class ListadoManualesComponent implements OnDestroy, ListadoBuscable {
    manuales: ManualAsociadoDetalle[] = [];
    manualesDS = new MatTableDataSource<ManualAsociadoDetalle>([]);
    columnas = ['Nombre'];
    mostrarHomebrew = false;
    /** El buscador rápido de la cabecera. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(private cdr: ChangeDetectorRef, private manualesSvc: ManualesAsociadosService) { }

    @ViewChild(MatSort) orden!: MatSort;
    @ViewChild(MatPaginator) paginador!: MatPaginator;

    ngAfterViewInit(): void {
        this.manualesDS.paginator = this.paginador;
        this.manualesDS.sort = this.orden;
        ordenarEnEspanol(this.manualesDS);
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee los manuales (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.manualesSvc.getManualesAsociados().subscribe({
            next: (manuales) => {
                this.manuales = (manuales ?? []).filter((manual) => Number(manual?.Id) > 0);
                this.cargado = true;
                this.filtrar();
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
        this.filtrar();
    }

    filtrar(): void {
        const texto = normalizarTexto(this.textoBusqueda, true);
        this.manualesDS.data = this.manuales.filter((manual) =>
            (texto === '' || normalizarTexto(manual.Nombre, true).includes(texto)) && (this.mostrarHomebrew || manual.Oficial));
        if (this.orden) {
            this.orden.active = 'Nombre';
            this.orden.direction = 'asc';
        }
    }

    get anuncioHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando manuales homebrew' : 'Clic para mostrar manuales homebrew';
    }

    alternarHomebrew(): void {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.columnas = conColumnaOpcional(this.columnas, 'Homebrew', this.mostrarHomebrew);
        this.filtrar();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        if (this.mostrarHomebrew)
            this.alternarHomebrew();
        else
            this.filtrar();
    }

    @Output() manualDetalles = new EventEmitter<ManualAsociadoDetalle>();
    verDetalles(manual: ManualAsociadoDetalle): void {
        this.manualDetalles.emit(manual);
    }

    @Output() manualSeleccionado = new EventEmitter<ManualAsociadoDetalle>();
    seleccionar(manual: ManualAsociadoDetalle): void {
        this.manualSeleccionado.emit(manual);
    }
}
