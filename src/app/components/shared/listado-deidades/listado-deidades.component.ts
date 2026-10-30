import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { DeidadService } from 'src/app/services/deidad.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';
import { porNombre, textosDistintos } from 'src/app/services/utils/orden-texto';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-deidades',
    templateUrl: './listado-deidades.component.html',
    styleUrls: ['./listado-deidades.component.sass'],
    standalone: false
})
export class ListadoDeidadesComponent implements OnDestroy, ListadoBuscable {
    deidades: DeidadDetalle[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    defaultAlineamiento = 'Cualquiera';
    defaultPabellon = 'Cualquiera';
    deidadesDS = new MatTableDataSource<DeidadDetalle>([]);
    deidadColumns = ['Nombre', 'Manual', 'Alineamiento'];
    /** El buscador rápido de la cabecera (nombre y descripción). */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    private mostrarHomebrew = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private deidadSvc: DeidadService
    ) { }

    @ViewChild(MatSort) deidadSort!: MatSort;
    @ViewChild(MatPaginator) deidadPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.deidadesDS.paginator = this.deidadPaginator;
        this.deidadesDS.sort = this.deidadSort;
        ordenarEnEspanol(this.deidadesDS);
        this.deidadesDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);
        this.cargar();
    }

    /** Lee las deidades (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.deidadSvc.getDeidades()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (deidades) => {
                    this.deidades = [...(deidades ?? [])]
                        .filter((deidad) => Number(deidad?.Id) > 0)
                        .sort(porNombre);
                    this.manuales = textosDistintos(this.deidades, (deidad) => deidad?.Manual?.Nombre);
                    this.defaultManual = 'Cualquiera';
                    this.defaultAlineamiento = 'Cualquiera';
                    this.defaultPabellon = 'Cualquiera';
                    this.cargado = true;
                    this.filtroDeidades();
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
        this.filtroDeidades();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera'
            || this.defaultAlineamiento !== 'Cualquiera' || this.defaultPabellon !== 'Cualquiera' || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        this.defaultAlineamiento = 'Cualquiera';
        this.defaultPabellon = 'Cualquiera';
        this.mostrarHomebrew = false;
        this.filtroDeidades();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    get alineamientos(): string[] {
        return ['Cualquiera', ...textosDistintos(this.deidades, (deidad) => deidad?.Alineamiento?.Nombre)];
    }

    get pabellones(): string[] {
        return ['Cualquiera', ...textosDistintos(this.deidades, (deidad) => deidad?.Pabellon?.Nombre)];
    }

    get anuncioHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando deidades homebrew' : 'Clic para mostar deidades homebrew';
    }

    get homebrewActivo(): boolean {
        return this.mostrarHomebrew;
    }

    alternarHomebrew() {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.filtroDeidades();
    }

    filtroDeidades() {
        const texto = normalizarTexto(this.textoBusqueda);
        const alineamiento = normalizarTexto(this.defaultAlineamiento);
        const pabellon = normalizarTexto(this.defaultPabellon);

        const filtradas = this.deidades.filter((deidad) => {
            const visiblePorTexto = texto.length < 1
                || normalizarTexto(deidad?.Nombre).includes(texto)
                || normalizarTexto(deidad?.Descripcion).includes(texto);
            const visiblePorManual = this.defaultManual === 'Cualquiera'
                || normalizarTexto(deidad?.Manual?.Nombre) === normalizarTexto(this.defaultManual);
            const visiblePorAlineamiento = this.defaultAlineamiento === 'Cualquiera'
                || normalizarTexto(deidad?.Alineamiento?.Nombre) === alineamiento;
            const visiblePorPabellon = this.defaultPabellon === 'Cualquiera'
                || normalizarTexto(deidad?.Pabellon?.Nombre) === pabellon;
            const visiblePorHomebrew = this.mostrarHomebrew || toBoolean(deidad?.Oficial, true);
            return visiblePorTexto && visiblePorManual && visiblePorAlineamiento && visiblePorPabellon && visiblePorHomebrew;
        });

        this.deidadesDS = new MatTableDataSource<DeidadDetalle>(filtradas);
        setTimeout(() => {
            this.deidadesDS.sort = this.deidadSort;
            ordenarEnEspanol(this.deidadesDS);
            if (this.deidadSort?.active !== undefined) {
                this.deidadSort.active = 'Nombre';
                this.deidadSort.direction = 'asc';
            }
        }, 50);
        this.deidadesDS.paginator = this.deidadPaginator;
        this.deidadesDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);
    }

    @Output() deidadDetalles = new EventEmitter<DeidadDetalle>();
    verDetallesDeidad(idDeidad: number) {
        const deidad = this.deidades.find((item) => Number(item.Id) === Number(idDeidad));
        if (deidad)
            this.deidadDetalles.emit(deidad);
    }

    @Output() deidadSeleccionada = new EventEmitter<DeidadDetalle>();
    seleccionarDeidad(idDeidad: number) {
        const deidad = this.deidades.find((item) => Number(item.Id) === Number(idDeidad));
        if (deidad)
            this.deidadSeleccionada.emit(deidad);
    }

    private sortingAccessor(item: DeidadDetalle, property: string): string | number {
        if (property === 'Manual')
            return `${item?.Manual?.Nombre ?? ''}`;
        if (property === 'Alineamiento')
            return `${item?.Alineamiento?.Nombre ?? ''}`;
        return (item as any)?.[property] ?? '';
    }

}
