import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ArmaDetalle } from 'src/app/interfaces/arma';
import { ArmaService } from 'src/app/services/arma.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';
import { porNombre, textosDistintos } from 'src/app/services/utils/orden-texto';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-armas',
    templateUrl: './listado-armas.component.html',
    styleUrls: ['./listado-armas.component.sass'],
    standalone: false
})
export class ListadoArmasComponent implements OnDestroy, ListadoBuscable {
    armas: ArmaDetalle[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    defaultTipoArma = 'Cualquiera';
    armasDS = new MatTableDataSource<ArmaDetalle>([]);
    armaColumns = ['Nombre', 'Manual', 'Tipo_arma', 'Tipo_dano'];
    /** El buscador rápido de la cabecera (nombre y descripción). */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    private mostrarHomebrew = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private armaSvc: ArmaService
    ) { }

    @ViewChild(MatSort) armaSort!: MatSort;
    @ViewChild(MatPaginator) armaPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.armasDS.paginator = this.armaPaginator;
        this.armasDS.sort = this.armaSort;
        ordenarEnEspanol(this.armasDS);
        this.armasDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);
        this.cargar();
    }

    /** Lee las armas (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.armaSvc.getArmas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (armas) => {
                    this.armas = [...(armas ?? [])]
                        .filter(arma => Number(arma?.Id) > 0)
                        .sort(porNombre);
                    this.manuales = textosDistintos(this.armas, (arma) => arma?.Manual?.Nombre);
                    this.defaultManual = 'Cualquiera';
                    this.defaultTipoArma = 'Cualquiera';
                    this.cargado = true;
                    this.filtroArmas();
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
        this.filtroArmas();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera'
            || this.defaultTipoArma !== 'Cualquiera' || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        this.defaultTipoArma = 'Cualquiera';
        this.mostrarHomebrew = false;
        this.filtroArmas();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    get tiposArma(): string[] {
        return ['Cualquiera', ...textosDistintos(this.armas, (arma) => arma?.Tipo_arma?.Nombre)];
    }

    get anuncioHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando armas homebrew' : 'Clic para mostar armas homebrew';
    }

    get homebrewActivo(): boolean {
        return this.mostrarHomebrew;
    }

    AlternarArmasHombrew() {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.filtroArmas();
    }

    filtroArmas() {
        const texto = normalizarTexto(this.textoBusqueda);
        const tipoArma = normalizarTexto(this.defaultTipoArma);
        const armasFiltradas = this.armas.filter((arma) => {
            const visiblePorTexto = texto.length < 1
                || normalizarTexto(arma?.Nombre).includes(texto)
                || normalizarTexto(arma?.Descripcion).includes(texto);
            const visiblePorManual = this.defaultManual === 'Cualquiera'
                || normalizarTexto(arma?.Manual?.Nombre) === normalizarTexto(this.defaultManual);
            const visiblePorTipo = this.defaultTipoArma === 'Cualquiera'
                || normalizarTexto(arma?.Tipo_arma?.Nombre) === tipoArma;
            const visiblePorHomebrew = this.mostrarHomebrew || toBoolean(arma?.Oficial, true);
            return visiblePorTexto && visiblePorManual && visiblePorTipo && visiblePorHomebrew;
        });

        this.armasDS = new MatTableDataSource<ArmaDetalle>(armasFiltradas);
        setTimeout(() => {
            this.armasDS.sort = this.armaSort;
            ordenarEnEspanol(this.armasDS);
            if (this.armaSort?.active !== undefined) {
                this.armaSort.active = 'Nombre';
                this.armaSort.direction = 'asc';
            }
        }, 50);
        this.armasDS.paginator = this.armaPaginator;
        this.armasDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);
    }

    @Output() armaDetalles: EventEmitter<ArmaDetalle> = new EventEmitter<ArmaDetalle>();
    verDetallesArma(idArma: number) {
        const arma = this.armas.find(item => Number(item.Id) === Number(idArma));
        if (arma)
            this.armaDetalles.emit(arma);
    }

    @Output() armaSeleccionada: EventEmitter<ArmaDetalle> = new EventEmitter<ArmaDetalle>();
    seleccionarArma(idArma: number) {
        const arma = this.armas.find(item => Number(item.Id) === Number(idArma));
        if (arma)
            this.armaSeleccionada.emit(arma);
    }

    private sortingAccessor(item: ArmaDetalle, property: string): string | number {
        if (property === 'Manual')
            return `${item?.Manual?.Nombre ?? ''}`;
        if (property === 'Tipo_arma')
            return `${item?.Tipo_arma?.Nombre ?? ''}`;
        if (property === 'Tipo_dano')
            return `${item?.Tipo_dano?.Nombre ?? ''}`;
        return (item as any)?.[property] ?? '';
    }

}
