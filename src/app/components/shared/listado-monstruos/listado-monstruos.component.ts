import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { conColumnaOpcional } from 'src/app/services/utils/columnas-tabla';
import { normalizarTexto, toBoolean, toNumber } from 'src/app/services/utils/normalizacion';
import { porNombre, textosDistintos } from 'src/app/services/utils/orden-texto';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-monstruos',
    templateUrl: './listado-monstruos.component.html',
    styleUrls: ['./listado-monstruos.component.sass'],
    standalone: false
})
export class ListadoMonstruosComponent implements OnDestroy, ListadoBuscable {
    monstruos: MonstruoDetalle[] = [];
    Manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    monstruosDS = new MatTableDataSource<MonstruoDetalle>([]);
    monstruoColumns = ['Nombre', 'Manual', 'Valor_desafio', 'Familiar', 'Companero'];
    /** El buscador rápido de la cabecera. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    private mostrarHomebrew = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private monstruoSvc: MonstruoService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) monstruoSort!: MatSort;
    @ViewChild(MatPaginator) monstruoPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.monstruosDS.paginator = this.monstruoPaginator;
        this.monstruosDS.sort = this.monstruoSort;
        ordenarEnEspanol(this.monstruosDS);
        this.monstruosDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);
        this.cargar();
    }

    /** Lee los monstruos (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.monstruoSvc.getMonstruos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (monstruos) => {
                    this.monstruos = [...(monstruos ?? [])]
                        .filter(monstruo => toNumber(monstruo?.Id) > 0)
                        .sort(porNombre);
                    this.Manuales = textosDistintos(this.monstruos, (monstruo) => this.getManualNombre(monstruo));
                    this.defaultManual = 'Cualquiera';
                    this.cargado = true;
                    this.sincronizarColumnaHomebrew();
                    this.filtroMonstruos();
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
        this.filtroMonstruos();
    }

    get homebrewActivo(): boolean {
        return this.mostrarHomebrew;
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera' || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        this.mostrarHomebrew = false;
        this.sincronizarColumnaHomebrew();
        this.filtroMonstruos();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    filtroMonstruos() {
        const texto = normalizarTexto(this.textoBusqueda);
        const monstruosFiltrados = this.monstruos.filter(monstruo => {
            const manualNombre = normalizarTexto(this.getManualNombre(monstruo));
            const visiblePorTexto = texto.length < 1 || normalizarTexto(monstruo?.Nombre).includes(texto);
            const visiblePorManual = this.defaultManual === 'Cualquiera' || manualNombre === normalizarTexto(this.defaultManual);
            const visiblePorHomebrew = this.mostrarHomebrew || toBoolean(monstruo?.Oficial, true);
            return visiblePorTexto && visiblePorManual && visiblePorHomebrew;
        });

        this.monstruosDS = new MatTableDataSource<MonstruoDetalle>(monstruosFiltrados);
        setTimeout(() => {
            this.monstruosDS.sort = this.monstruoSort;
            ordenarEnEspanol(this.monstruosDS);
            if (this.monstruoSort?.active !== undefined) {
                this.monstruoSort.active = 'Nombre';
                this.monstruoSort.direction = 'asc';
            }
        }, 50);
        this.monstruosDS.paginator = this.monstruoPaginator;
        this.monstruosDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);
    }

    get anuncioHomebrew(): string {
        return this.mostrarHomebrew
            ? 'Mostrando monstruos homebrew'
            : 'Clic para mostar monstruos homebrew';
    }

    AlternarMonstruosHombrew() {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.sincronizarColumnaHomebrew();
        this.filtroMonstruos();
    }

    @Output() monstruoDetalles: EventEmitter<MonstruoDetalle> = new EventEmitter<MonstruoDetalle>();
    verDetallesMonstruo(idMonstruo: number) {
        const monstruo = this.monstruos.find(m => Number(m.Id) === Number(idMonstruo));
        if (monstruo)
            this.monstruoDetalles.emit(monstruo);
    }

    @Output() monstruoSeleccionado: EventEmitter<MonstruoDetalle> = new EventEmitter<MonstruoDetalle>();
    seleccionarMonstruo(idMonstruo: number) {
        const monstruo = this.monstruos.find(m => Number(m.Id) === Number(idMonstruo));
        if (monstruo)
            this.monstruoSeleccionado.emit(monstruo);
    }

    abrirDetalleManual(monstruo: MonstruoDetalle, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: monstruo?.Manual?.Id,
            nombre: monstruo?.Manual?.Nombre,
        });
    }

    isFlagActiva(value: any): boolean {
        return toBoolean(value);
    }

    private sincronizarColumnaHomebrew(): void {
        this.monstruoColumns = conColumnaOpcional(this.monstruoColumns, 'Homebrew', this.mostrarHomebrew);
    }

    private sortingAccessor(item: MonstruoDetalle, property: string): string | number {
        if (property === 'Manual')
            return this.getManualNombre(item);
        if (property === 'Valor_desafio')
            return `${item?.Valor_desafio ?? ''}`;
        if (property === 'Familiar')
            return toBoolean(item?.Familiar) ? 1 : 0;
        if (property === 'Companero')
            return toBoolean(item?.Companero) ? 1 : 0;
        return `${(item as any)?.[property] ?? ''}`;
    }

    private getManualNombre(monstruo: MonstruoDetalle): string {
        return `${monstruo?.Manual?.Nombre ?? ''}`.trim();
    }

}
