import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';

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
        ordenarEnEspanol(this.armadurasDS);
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
        const texto = normalizarTexto(this.nombreText?.nativeElement?.value ?? '');
        const tipoArmadura = normalizarTexto(this.defaultTipoArmadura);
        const armadurasFiltradas = this.armaduras.filter((armadura) => {
            const visiblePorTexto = texto.length < 1
                || normalizarTexto(armadura?.Nombre).includes(texto)
                || normalizarTexto(armadura?.Descripcion).includes(texto);
            const visiblePorManual = this.defaultManual === 'Cualquiera'
                || normalizarTexto(armadura?.Manual?.Nombre) === normalizarTexto(this.defaultManual);
            const visiblePorTipo = this.defaultTipoArmadura === 'Cualquiera'
                || normalizarTexto(armadura?.Tipo_armadura?.Nombre) === tipoArmadura;
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

}
