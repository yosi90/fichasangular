import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { ArmaDetalle } from 'src/app/interfaces/arma';
import { Manual } from 'src/app/interfaces/manual';
import { ArmaService } from 'src/app/services/arma.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ManualService } from 'src/app/services/manual.service';

@Component({
    selector: 'app-listado-armas',
    templateUrl: './listado-armas.component.html',
    styleUrls: ['./listado-armas.component.sass'],
    standalone: false
})
export class ListadoArmasComponent implements OnDestroy {
    armas: ArmaDetalle[] = [];
    manuales: Manual[] = [];
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
        private manualSvc: ManualService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) armaSort!: MatSort;
    @ViewChild(MatPaginator) armaPaginator!: MatPaginator;
    @ViewChild('armaTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.armasDS.paginator = this.armaPaginator;
        this.armasDS.sort = this.armaSort;
        this.armasDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);

        combineLatest([
            this.armaSvc.getArmas(),
            this.manualSvc.getManuales(),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([armas, manuales]) => {
                this.armas = [...(armas ?? [])]
                    .filter(arma => Number(arma?.Id) > 0)
                    .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                this.manuales = [...(manuales ?? [])].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
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
        )).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
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
        const texto = this.normalizar(this.nombreText?.nativeElement?.value ?? '');
        const tipoArma = this.normalizar(this.defaultTipoArma);
        const armasFiltradas = this.armas.filter((arma) => {
            const visiblePorTexto = texto.length < 1
                || this.normalizar(arma?.Nombre).includes(texto)
                || this.normalizar(arma?.Descripcion).includes(texto);
            const visiblePorManual = this.defaultManual === 'Cualquiera'
                || this.normalizar(arma?.Manual?.Nombre) === this.normalizar(this.defaultManual);
            const visiblePorTipo = this.defaultTipoArma === 'Cualquiera'
                || this.normalizar(arma?.Tipo_arma?.Nombre) === tipoArma;
            const visiblePorHomebrew = this.mostrarHomebrew || this.toBoolean(arma?.Oficial, true);
            return visiblePorTexto && visiblePorManual && visiblePorTipo && visiblePorHomebrew;
        });

        this.armasDS = new MatTableDataSource<ArmaDetalle>(armasFiltradas);
        setTimeout(() => {
            this.armasDS.sort = this.armaSort;
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

    private normalizar(value: string | null | undefined): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private toBoolean(value: any, fallback: boolean = false): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value !== 0;
        if (typeof value === 'string') {
            const normalizado = value.trim().toLowerCase();
            if (['true', '1', 'si', 'sí', 'yes'].includes(normalizado))
                return true;
            if (['false', '0', 'no'].includes(normalizado))
                return false;
        }
        return fallback;
    }
}
