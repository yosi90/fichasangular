import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-listado-armaduras',
    templateUrl: './listado-armaduras.component.html',
    styleUrls: ['./listado-armaduras.component.sass'],
    standalone: false
})
export class ListadoArmadurasComponent implements OnDestroy {
    armaduras: ArmaduraDetalle[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    defaultTipoArmadura = 'Cualquiera';
    soloEscudos = false;
    armadurasDS = new MatTableDataSource<ArmaduraDetalle>([]);
    armaduraColumns = ['Nombre', 'Manual', 'Tipo_armadura'];

    private mostrarHomebrew = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private armaduraSvc: ArmaduraService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) armaduraSort!: MatSort;
    @ViewChild(MatPaginator) armaduraPaginator!: MatPaginator;
    @ViewChild('armaduraTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.armadurasDS.paginator = this.armaduraPaginator;
        this.armadurasDS.sort = this.armaduraSort;
        this.armadurasDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);

        this.armaduraSvc.getArmaduras()
            .pipe(takeUntil(this.destroy$))
            .subscribe((armaduras) => {
                this.armaduras = [...(armaduras ?? [])]
                    .filter(armadura => Number(armadura?.Id) > 0)
                    .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                this.manuales = this.buildManualesDisponibles(this.armaduras);
                this.defaultManual = 'Cualquiera';
                this.defaultTipoArmadura = 'Cualquiera';
                this.filtroArmaduras();
                this.cdr.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get tiposArmadura(): string[] {
        return ['Cualquiera', ...Array.from(new Set(
            this.armaduras
                .map((armadura) => `${armadura?.Tipo_armadura?.Nombre ?? ''}`.trim())
                .filter((value) => value.length > 0)
        )).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
    }

    get anuncioHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando armaduras homebrew' : 'Clic para mostar armaduras homebrew';
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
        const texto = this.normalizar(this.nombreText?.nativeElement?.value ?? '');
        const tipoArmadura = this.normalizar(this.defaultTipoArmadura);
        const armadurasFiltradas = this.armaduras.filter((armadura) => {
            const visiblePorTexto = texto.length < 1
                || this.normalizar(armadura?.Nombre).includes(texto)
                || this.normalizar(armadura?.Descripcion).includes(texto);
            const visiblePorManual = this.defaultManual === 'Cualquiera'
                || this.normalizar(armadura?.Manual?.Nombre) === this.normalizar(this.defaultManual);
            const visiblePorTipo = this.defaultTipoArmadura === 'Cualquiera'
                || this.normalizar(armadura?.Tipo_armadura?.Nombre) === tipoArmadura;
            const visiblePorEscudo = !this.soloEscudos || this.toBoolean(armadura?.Es_escudo);
            const visiblePorHomebrew = this.mostrarHomebrew || this.toBoolean(armadura?.Oficial, true);
            return visiblePorTexto && visiblePorManual && visiblePorTipo && visiblePorEscudo && visiblePorHomebrew;
        });

        this.armadurasDS = new MatTableDataSource<ArmaduraDetalle>(armadurasFiltradas);
        setTimeout(() => {
            this.armadurasDS.sort = this.armaduraSort;
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

    abrirDetalleManual(armadura: ArmaduraDetalle, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: armadura?.Manual?.Id,
            nombre: armadura?.Manual?.Nombre,
        });
    }

    getManualVisible(armadura: ArmaduraDetalle): string {
        const nombre = `${armadura?.Manual?.Nombre ?? ''}`.trim();
        const pagina = Number(armadura?.Manual?.Pagina ?? 0);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
    }

    private sortingAccessor(item: ArmaduraDetalle, property: string): string | number {
        if (property === 'Manual')
            return `${item?.Manual?.Nombre ?? ''}`;
        if (property === 'Tipo_armadura')
            return `${item?.Tipo_armadura?.Nombre ?? ''}`;
        return (item as any)?.[property] ?? '';
    }

    private buildManualesDisponibles(armaduras: ArmaduraDetalle[]): string[] {
        return Array.from(new Set(
            (armaduras ?? [])
                .map((armadura) => `${armadura?.Manual?.Nombre ?? ''}`.trim())
                .filter((nombre) => nombre.length > 0)
        )).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
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
