import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { Manual } from 'src/app/interfaces/manual';
import { MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ManualService } from 'src/app/services/manual.service';
import { MonstruoService } from 'src/app/services/monstruo.service';

@Component({
    selector: 'app-listado-monstruos',
    templateUrl: './listado-monstruos.component.html',
    styleUrls: ['./listado-monstruos.component.sass'],
    standalone: false
})
export class ListadoMonstruosComponent implements OnDestroy {
    monstruos: MonstruoDetalle[] = [];
    Manuales: Manual[] = [];
    defaultManual: string = 'Cualquiera';
    monstruosDS = new MatTableDataSource<MonstruoDetalle>([]);
    monstruoColumns = ['Nombre', 'Manual', 'Valor_desafio', 'Familiar', 'Companero'];

    private mostrarHomebrew = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private monstruoSvc: MonstruoService,
        private manualSvc: ManualService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) monstruoSort!: MatSort;
    @ViewChild(MatPaginator) monstruoPaginator!: MatPaginator;
    @ViewChild('monstruoTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.monstruosDS.paginator = this.monstruoPaginator;
        this.monstruosDS.sort = this.monstruoSort;
        this.monstruosDS.sortingDataAccessor = (item, property) => this.sortingAccessor(item, property);

        combineLatest([
            this.monstruoSvc.getMonstruos(),
            this.manualSvc.getManuales(),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([monstruos, manuales]) => {
                this.monstruos = [...(monstruos ?? [])]
                    .filter(monstruo => this.toNumber(monstruo?.Id) > 0)
                    .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                this.Manuales = [...(manuales ?? [])].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
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
        const texto = this.normalizar(this.nombreText?.nativeElement?.value ?? '');
        const monstruosFiltrados = this.monstruos.filter(monstruo => {
            const manualNombre = this.normalizar(this.getManualNombre(monstruo));
            const visiblePorTexto = texto.length < 1 || this.normalizar(monstruo?.Nombre).includes(texto);
            const visiblePorManual = this.defaultManual === 'Cualquiera' || manualNombre === this.normalizar(this.defaultManual);
            const visiblePorHomebrew = this.mostrarHomebrew || this.toBoolean(monstruo?.Oficial, true);
            return visiblePorTexto && visiblePorManual && visiblePorHomebrew;
        });

        this.monstruosDS = new MatTableDataSource<MonstruoDetalle>(monstruosFiltrados);
        setTimeout(() => {
            this.monstruosDS.sort = this.monstruoSort;
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
        const pagina = this.toNumber(monstruo?.Manual?.Pagina);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
    }

    isFlagActiva(value: any): boolean {
        return this.toBoolean(value);
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
            return this.toBoolean(item?.Familiar) ? 1 : 0;
        if (property === 'Companero')
            return this.toBoolean(item?.Companero) ? 1 : 0;
        return `${(item as any)?.[property] ?? ''}`;
    }

    private getManualNombre(monstruo: MonstruoDetalle): string {
        return `${monstruo?.Manual?.Nombre ?? ''}`.trim();
    }

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
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

    private normalizar(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
