import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto, toBoolean, toNumber } from 'src/app/services/utils/normalizacion';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';

@Component({
    selector: 'app-listado-monstruos',
    templateUrl: './listado-monstruos.component.html',
    styleUrls: ['./listado-monstruos.component.sass'],
    standalone: false
})
export class ListadoMonstruosComponent implements OnDestroy {
    monstruos: MonstruoDetalle[] = [];
    Manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    monstruosDS = new MatTableDataSource<MonstruoDetalle>([]);
    monstruoColumns = ['Nombre', 'Manual', 'Valor_desafio', 'Familiar', 'Companero'];
    private readonly columnLabels: Record<string, string> = {
        Nombre: 'Nombre',
        Manual: 'Manual',
        Valor_desafio: 'Valor desafio',
        Familiar: 'Familiar',
        Companero: 'Compañero',
        Homebrew: 'Homebrew',
    };

    private mostrarHomebrew = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private monstruoSvc: MonstruoService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) monstruoSort!: MatSort;
    @ViewChild(MatPaginator) monstruoPaginator!: MatPaginator;
    @ViewChild('monstruoTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.monstruosDS.paginator = this.monstruoPaginator;
        this.monstruosDS.sort = this.monstruoSort;
        ordenarEnEspanol(this.monstruosDS);
        this.monstruosDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);

        this.monstruoSvc.getMonstruos()
            .pipe(takeUntil(this.destroy$))
            .subscribe((monstruos) => {
                this.monstruos = [...(monstruos ?? [])]
                    .filter(monstruo => toNumber(monstruo?.Id) > 0)
                    .sort(porNombre);
                this.Manuales = this.buildManualesDisponibles(this.monstruos);
                this.defaultManual = 'Cualquiera';
                this.sincronizarColumnaHomebrew();
                this.filtroMonstruos();
                this.cdr.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    filtroMonstruos() {
        const texto = normalizarTexto(this.nombreText?.nativeElement?.value ?? '');
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

    getManualVisible(monstruo: MonstruoDetalle): string {
        const nombre = this.getManualNombre(monstruo);
        const pagina = toNumber(monstruo?.Manual?.Pagina);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
    }

    getColumnLabel(column: string): string {
        return this.columnLabels[column] ?? column.replace('_', ' ');
    }

    isFlagActiva(value: any): boolean {
        return toBoolean(value);
    }

    private sincronizarColumnaHomebrew(): void {
        const existe = this.monstruoColumns.includes('Homebrew');
        if (this.mostrarHomebrew && !existe)
            this.monstruoColumns.push('Homebrew');
        if (!this.mostrarHomebrew && existe)
            this.monstruoColumns = this.monstruoColumns.filter(c => c !== 'Homebrew');
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

    private buildManualesDisponibles(monstruos: MonstruoDetalle[]): string[] {
        return Array.from(new Set(
            (monstruos ?? [])
                .map((monstruo) => this.getManualNombre(monstruo))
                .filter((nombre) => nombre.length > 0)
        )).sort(compararTexto);
    }

}
