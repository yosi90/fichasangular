import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, combineLatest } from 'rxjs';
import { Manual } from 'src/app/interfaces/manual';
import { Raza } from 'src/app/interfaces/raza';
import { ManualService } from 'src/app/services/manual.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { RazaService } from 'src/app/services/raza.service';

@Component({
    selector: 'app-listado-razas',
    templateUrl: './listado-razas.component.html',
    styleUrls: ['./listado-razas.component.sass']
})
export class ListadoRazasComponent implements OnDestroy {
    razas: Raza[] = [];
    Manuales: Manual[] = [];
    defaultManual: string = 'Cualquiera';
    razasDS = new MatTableDataSource(this.razas);
    razaColumns = ['Nombre', 'Modificadores', 'Clase_predilecta', 'Manual', 'Ajuste_nivel', 'Dgs_adicionales'];
    @Input() homebrewSeleccionado?: boolean;
    @Input() homebrewBloqueado = false;
    private vistaInicializada = false;
    private catalogosSub?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private rSvc: RazaService,
        private mSvc: ManualService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) razaSort!: MatSort;
    @ViewChild(MatPaginator) razaPaginator!: MatPaginator;
    @ViewChild('razaTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.vistaInicializada = true;
        this.catalogosSub?.unsubscribe();
        this.catalogosSub = combineLatest([
            this.rSvc.getRazas(),
            this.mSvc.getManuales(),
        ]).subscribe(([razas, manuales]) => {
            this.razas = (razas ?? []).map((raza) => this.normalizarRaza(raza));
            this.Manuales = [...(manuales ?? [])].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
            this.defaultManual = 'Cualquiera';
            this.sincronizarColumnaHomebrew();
            this.filtroRazas();
            this.cdr.detectChanges();
        });
    }

    ngOnChanges() {
        this.sincronizarColumnaHomebrew();
        if (this.vistaInicializada)
            this.filtroRazas();
    }

    ngOnDestroy(): void {
        this.catalogosSub?.unsubscribe();
    }

    filtroRazas() {
        this.sincronizarColumnaHomebrew();
        const texto = this.normalizarTexto(this.nombreText?.nativeElement?.value ?? '');
        const homebrew = this.isHomebrewActivo();
        const razasFiltradas = this.razas
            .filter(raza =>
                this.toNumber((raza as any).Id) > 0
                && (texto === '' || this.coincideConTexto(raza, texto))
                && (this.defaultManual == 'Cualquiera' || `${raza.Manual ?? ''}`.includes(this.defaultManual))
                && (homebrew || this.esOficialParaFiltro(raza))
            )
            .sort((a, b) => {
                const nombreA = this.normalizarTexto(a?.Nombre ?? '');
                const nombreB = this.normalizarTexto(b?.Nombre ?? '');
                const byNombre = nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
                if (byNombre !== 0) return byNombre;
                return this.toNumber((a as any).Id) - this.toNumber((b as any).Id);
            });
        this.razasDS = new MatTableDataSource(razasFiltradas);
        if (this.razaSort) {
            this.razasDS.sort = this.razaSort;
        }
        if (this.razaPaginator) {
            this.razasDS.paginator = this.razaPaginator;
        }

        if (this.razaSort?.active !== undefined) {
            this.razaSort.active = 'Nombre';
            this.razaSort.direction = 'asc';
        }
    }

    private homebrewInterno = false;

    private isHomebrewActivo(): boolean {
        if (this.homebrewSeleccionado === undefined || this.homebrewSeleccionado === null)
            return this.homebrewInterno;
        return this.homebrewSeleccionado;
    }

    private sincronizarColumnaHomebrew(): void {
        const activa = this.isHomebrewActivo();
        const existe = this.razaColumns.includes('Homebrew');
        if (activa && !existe) {
            this.razaColumns.push('Homebrew');
        }
        if (!activa && existe) {
            this.razaColumns = this.razaColumns.filter(c => c !== 'Homebrew');
        }
    }

    get anuncioHomebrew(): string {
        return this.isHomebrewActivo() ? 'Mostrando razas homebrew' : 'Clic para mostar razas homebrew';
    }

    get homebrewActivo(): boolean {
        return this.isHomebrewActivo();
    }

    AlternarRazasHombrew() {
        if (this.homebrewSeleccionado !== undefined && this.homebrewSeleccionado !== null) {
            this.filtroRazas();
            return;
        }
        this.homebrewInterno = !this.homebrewInterno;
        this.filtroRazas();
    }

    @Output() razaDetalles: EventEmitter<Raza> = new EventEmitter<Raza>();
    verDetallesRaza(value: number) {
        const raza = this.razas.find(r => r.Id === value);
        if (raza)
            this.razaDetalles.emit(raza);
    }

    @Output() razaSeleccionada: EventEmitter<Raza> = new EventEmitter<Raza>();
    seleccionarRaza(value: number) {
        const raza = this.razas.find(r => r.Id === value);
        if (raza)
            this.razaSeleccionada.emit(raza);
    }

    private coincideConTexto(raza: Raza, texto: string): boolean {
        const mods = this.normalizarModificadores(raza.Modificadores as any);
        return this.normalizarTexto(raza.Nombre).includes(texto)
            || `${mods.Fuerza}`.includes(texto)
            || `${mods.Destreza}`.includes(texto)
            || `${mods.Constitucion}`.includes(texto)
            || `${mods.Inteligencia}`.includes(texto)
            || `${mods.Sabiduria}`.includes(texto)
            || `${mods.Carisma}`.includes(texto)
            || this.normalizarTexto(raza.Clase_predilecta).includes(texto);
    }

    private normalizarRaza(raza: Raza): Raza {
        return {
            ...raza,
            Nombre: `${raza?.Nombre ?? ''}`,
            Clase_predilecta: `${raza?.Clase_predilecta ?? ''}`,
            Manual: `${raza?.Manual ?? ''}`,
            Modificadores: this.normalizarModificadores((raza as any)?.Modificadores),
        };
    }

    private normalizarModificadores(mods: any) {
        return {
            Fuerza: this.toNumber(mods?.Fuerza),
            Destreza: this.toNumber(mods?.Destreza),
            Constitucion: this.toNumber(mods?.Constitucion),
            Inteligencia: this.toNumber(mods?.Inteligencia),
            Sabiduria: this.toNumber(mods?.Sabiduria),
            Carisma: this.toNumber(mods?.Carisma),
        };
    }

    getModificador(mods: any, key: 'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma'): number {
        return this.toNumber(mods?.[key]);
    }

    getDgsCantidad(dgs: any): number {
        return this.toNumber(dgs?.Cantidad);
    }

    getDgsDado(dgs: any): string {
        return `${dgs?.Dado ?? ''}`;
    }

    private normalizarTexto(texto: string): string {
        return `${texto ?? ''}`
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    private esOficialParaFiltro(raza: Raza): boolean {
        return this.toBoolean((raza as any)?.Oficial, true);
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

    abrirDetalleManual(raza: Raza, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual(raza?.Manual);
    }
}
