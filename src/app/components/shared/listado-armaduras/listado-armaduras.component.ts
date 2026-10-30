import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';
import { categoriaArmadura, textoDestrezaMaxima } from 'src/app/services/utils/equipo-texto';
import { porNombre, textosDistintos } from 'src/app/services/utils/orden-texto';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-armaduras',
    templateUrl: './listado-armaduras.component.html',
    styleUrls: ['./listado-armaduras.component.sass'],
    standalone: false
})
export class ListadoArmadurasComponent implements OnDestroy, ListadoBuscable {
    armaduras: ArmaduraDetalle[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    defaultTipoArmadura = 'Cualquiera';
    soloEscudos = false;
    armadurasDS = new MatTableDataSource<ArmaduraDetalle>([]);
    armaduraColumns = ['Nombre', 'Manual', 'Categoria', 'Bon_des'];
    /** El buscador rápido de la cabecera (nombre y descripción). */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    private mostrarHomebrew = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private armaduraSvc: ArmaduraService
    ) { }

    @ViewChild(MatSort) armaduraSort!: MatSort;
    @ViewChild(MatPaginator) armaduraPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.armadurasDS.paginator = this.armaduraPaginator;
        this.armadurasDS.sort = this.armaduraSort;
        ordenarEnEspanol(this.armadurasDS);
        this.armadurasDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);
        this.cargar();
    }

    /** Lee las armaduras y los escudos (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.armaduraSvc.getArmaduras()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (armaduras) => {
                    this.armaduras = [...(armaduras ?? [])]
                        .filter(armadura => Number(armadura?.Id) > 0)
                        .sort(porNombre);
                    this.manuales = textosDistintos(this.armaduras, (armadura) => armadura?.Manual?.Nombre);
                    this.defaultManual = 'Cualquiera';
                    this.defaultTipoArmadura = 'Cualquiera';
                    this.cargado = true;
                    this.filtroArmaduras();
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
        this.filtroArmaduras();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera'
            || this.defaultTipoArmadura !== 'Cualquiera' || this.soloEscudos || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        this.defaultTipoArmadura = 'Cualquiera';
        this.soloEscudos = false;
        this.mostrarHomebrew = false;
        this.filtroArmaduras();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    get tiposArmadura(): string[] {
        return ['Cualquiera', ...textosDistintos(this.armaduras, categoriaArmadura)];
    }

    get anuncioHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando armaduras homebrew' : 'Clic para mostrar armaduras homebrew';
    }

    get homebrewActivo(): boolean {
        return this.mostrarHomebrew;
    }

    AlternarArmadurasHombrew() {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.filtroArmaduras();
    }

    alternarSoloEscudos() {
        this.soloEscudos = !this.soloEscudos;
        this.filtroArmaduras();
    }

    filtroArmaduras() {
        const texto = normalizarTexto(this.textoBusqueda);
        const tipoArmadura = normalizarTexto(this.defaultTipoArmadura);
        const armadurasFiltradas = this.armaduras.filter((armadura) => {
            const visiblePorTexto = texto.length < 1
                || normalizarTexto(armadura?.Nombre).includes(texto)
                || normalizarTexto(armadura?.Descripcion).includes(texto);
            const visiblePorManual = this.defaultManual === 'Cualquiera'
                || normalizarTexto(armadura?.Manual?.Nombre) === normalizarTexto(this.defaultManual);
            const visiblePorTipo = this.defaultTipoArmadura === 'Cualquiera'
                || normalizarTexto(categoriaArmadura(armadura)) === tipoArmadura;
            const visiblePorEscudo = !this.soloEscudos || toBoolean(armadura?.Es_escudo);
            const visiblePorHomebrew = this.mostrarHomebrew || toBoolean(armadura?.Oficial, true);
            return visiblePorTexto && visiblePorManual && visiblePorTipo && visiblePorEscudo && visiblePorHomebrew;
        });

        this.armadurasDS = new MatTableDataSource<ArmaduraDetalle>(armadurasFiltradas);
        setTimeout(() => {
            this.armadurasDS.sort = this.armaduraSort;
            ordenarEnEspanol(this.armadurasDS);
            if (this.armaduraSort?.active !== undefined) {
                this.armaduraSort.active = 'Nombre';
                this.armaduraSort.direction = 'asc';
            }
        }, 50);
        this.armadurasDS.paginator = this.armaduraPaginator;
        this.armadurasDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);
    }

    @Output() armaduraDetalles: EventEmitter<ArmaduraDetalle> = new EventEmitter<ArmaduraDetalle>();
    verDetallesArmadura(idArmadura: number) {
        const armadura = this.armaduras.find(item => Number(item.Id) === Number(idArmadura));
        if (armadura)
            this.armaduraDetalles.emit(armadura);
    }

    @Output() armaduraSeleccionada: EventEmitter<ArmaduraDetalle> = new EventEmitter<ArmaduraDetalle>();
    seleccionarArmadura(idArmadura: number) {
        const armadura = this.armaduras.find(item => Number(item.Id) === Number(idArmadura));
        if (armadura)
            this.armaduraSeleccionada.emit(armadura);
    }

    getCategoria(armadura: ArmaduraDetalle): string {
        return categoriaArmadura(armadura);
    }

    getDestrezaMaxima(armadura: ArmaduraDetalle): string {
        return textoDestrezaMaxima(armadura?.Bon_des);
    }

    private sortingAccessor(item: ArmaduraDetalle, property: string): string | number {
        if (property === 'Manual')
            return `${item?.Manual?.Nombre ?? ''}`;
        if (property === 'Categoria')
            return categoriaArmadura(item);
        if (property === 'Bon_des')
            return item?.Bon_des ?? Number.MAX_SAFE_INTEGER;
        return (item as any)?.[property] ?? '';
    }

}
