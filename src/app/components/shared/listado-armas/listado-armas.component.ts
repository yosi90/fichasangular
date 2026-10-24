import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { ArmaDetalle } from 'src/app/interfaces/arma';
import { ArmaService } from 'src/app/services/arma.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';

@Component({
    selector: 'app-listado-armas',
    templateUrl: './listado-armas.component.html',
    styleUrls: ['./listado-armas.component.sass'],
    standalone: false
})
export class ListadoArmasComponent implements OnDestroy {
    armas: ArmaDetalle[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    defaultTipoArma = 'Cualquiera';
    armasDS = new MatTableDataSource<ArmaDetalle>([]);
    armaColumns = ['Nombre', 'Manual', 'Tipo_arma', 'Tipo_dano'];
    private readonly columnLabels: Record<string, string> = {
        Nombre: 'Nombre',
        Manual: 'Manual',
        Tipo_arma: 'Tipo arma',
        Tipo_dano: 'Tipo daño',
    };

    private mostrarHomebrew = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private armaSvc: ArmaService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) armaSort!: MatSort;
    @ViewChild(MatPaginator) armaPaginator!: MatPaginator;
    @ViewChild('armaTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.armasDS.paginator = this.armaPaginator;
        this.armasDS.sort = this.armaSort;
        ordenarEnEspanol(this.armasDS);
        this.armasDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);

        this.armaSvc.getArmas()
            .pipe(takeUntil(this.destroy$))
            .subscribe((armas) => {
                this.armas = [...(armas ?? [])]
                    .filter(arma => Number(arma?.Id) > 0)
                    .sort(porNombre);
                this.manuales = this.buildManualesDisponibles(this.armas);
                this.defaultManual = 'Cualquiera';
                this.defaultTipoArma = 'Cualquiera';
                this.filtroArmas();
                this.cdr.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get tiposArma(): string[] {
        return ['Cualquiera', ...Array.from(new Set(
            this.armas
                .map((arma) => `${arma?.Tipo_arma?.Nombre ?? ''}`.trim())
                .filter((value) => value.length > 0)
        )).sort(compararTexto)];
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
        const texto = normalizarTexto(this.nombreText?.nativeElement?.value ?? '');
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

    abrirDetalleManual(arma: ArmaDetalle, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: arma?.Manual?.Id,
            nombre: arma?.Manual?.Nombre,
        });
    }

    getManualVisible(arma: ArmaDetalle): string {
        const nombre = `${arma?.Manual?.Nombre ?? ''}`.trim();
        const pagina = Number(arma?.Manual?.Pagina ?? 0);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
    }

    getColumnLabel(column: string): string {
        return this.columnLabels[column] ?? column.replace('_', ' ');
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

    private buildManualesDisponibles(armas: ArmaDetalle[]): string[] {
        return Array.from(new Set(
            (armas ?? [])
                .map((arma) => `${arma?.Manual?.Nombre ?? ''}`.trim())
                .filter((nombre) => nombre.length > 0)
        )).sort(compararTexto);
    }

}
