import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { DeidadService } from 'src/app/services/deidad.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';

@Component({
    selector: 'app-listado-deidades',
    templateUrl: './listado-deidades.component.html',
    styleUrls: ['./listado-deidades.component.sass'],
    standalone: false
})
export class ListadoDeidadesComponent implements OnDestroy {
    deidades: DeidadDetalle[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    defaultAlineamiento = 'Cualquiera';
    defaultPabellon = 'Cualquiera';
    deidadesDS = new MatTableDataSource<DeidadDetalle>([]);
    deidadColumns = ['Nombre', 'Manual', 'Alineamiento'];

    private mostrarHomebrew = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private deidadSvc: DeidadService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) deidadSort!: MatSort;
    @ViewChild(MatPaginator) deidadPaginator!: MatPaginator;
    @ViewChild('deidadTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.deidadesDS.paginator = this.deidadPaginator;
        this.deidadesDS.sort = this.deidadSort;
        ordenarEnEspanol(this.deidadesDS);
        this.deidadesDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);

        this.deidadSvc.getDeidades()
            .pipe(takeUntil(this.destroy$))
            .subscribe((deidades) => {
                this.deidades = [...(deidades ?? [])]
                    .filter((deidad) => Number(deidad?.Id) > 0)
                    .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                this.manuales = this.buildManualesDisponibles(this.deidades);
                this.defaultManual = 'Cualquiera';
                this.defaultAlineamiento = 'Cualquiera';
                this.defaultPabellon = 'Cualquiera';
                this.filtroDeidades();
                this.cdr.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get alineamientos(): string[] {
        return ['Cualquiera', ...Array.from(new Set(
            this.deidades
                .map((deidad) => `${deidad?.Alineamiento?.Nombre ?? ''}`.trim())
                .filter((value) => value.length > 0)
        )).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
    }

    get pabellones(): string[] {
        return ['Cualquiera', ...Array.from(new Set(
            this.deidades
                .map((deidad) => `${deidad?.Pabellon?.Nombre ?? ''}`.trim())
                .filter((value) => value.length > 0)
        )).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
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
        const texto = normalizarTexto(this.nombreText?.nativeElement?.value ?? '');
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

    abrirDetalleManual(deidad: DeidadDetalle, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: deidad?.Manual?.Id,
            nombre: deidad?.Manual?.Nombre,
        });
    }

    getManualVisible(deidad: DeidadDetalle): string {
        const nombre = `${deidad?.Manual?.Nombre ?? ''}`.trim();
        const pagina = Number(deidad?.Manual?.Pagina ?? 0);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
    }

    private sortingAccessor(item: DeidadDetalle, property: string): string | number {
        if (property === 'Manual')
            return `${item?.Manual?.Nombre ?? ''}`;
        if (property === 'Alineamiento')
            return `${item?.Alineamiento?.Nombre ?? ''}`;
        return (item as any)?.[property] ?? '';
    }

    private buildManualesDisponibles(deidades: DeidadDetalle[]): string[] {
        return Array.from(new Set(
            (deidades ?? [])
                .map((deidad) => `${deidad?.Manual?.Nombre ?? ''}`.trim())
                .filter((nombre) => nombre.length > 0)
        )).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    }

}
