import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { Raza } from 'src/app/interfaces/raza';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { RazaService } from 'src/app/services/raza.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto, toBoolean, toNumber } from 'src/app/services/utils/normalizacion';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import { textoDelFiltro, vaciarTextoDelFiltro } from 'src/app/components/shared/menu-filtros/menu-filtros.component';

@Component({
    selector: 'app-listado-razas',
    templateUrl: './listado-razas.component.html',
    styleUrls: ['./listado-razas.component.sass'],
    standalone: false
})
export class ListadoRazasComponent implements OnDestroy {
    razas: Raza[] = [];
    Manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    razasDS = new MatTableDataSource(this.razas);
    razaColumns = ['Nombre', 'Modificadores', 'Clase_predilecta', 'Manual', 'Ajuste_nivel', 'Dgs_adicionales'];
    @Input() homebrewSeleccionado?: boolean;
    @Input() homebrewBloqueado = false;
    /**
     * En la creación: pulsar una fila (o su nombre, que es un botón) abre la vista previa de la raza (`razaDetalles`) y no
     * la elige; se elige con «Elegir y continuar». Fuera de la creación, la fila la elige y el nombre abre su detalle.
     */
    @Input() vistaPrevia = false;
    /** La raza cuya vista previa está abierta: su fila se marca. */
    @Input() razaAbiertaId: number | null = null;
    private vistaInicializada = false;
    private catalogosSub?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private rSvc: RazaService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) razaSort!: MatSort;
    @ViewChild(MatPaginator) razaPaginator!: MatPaginator;
    @ViewChild('razaTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.vistaInicializada = true;
        this.catalogosSub?.unsubscribe();
        this.catalogosSub = this.rSvc.getRazas().subscribe((razas) => {
            this.razas = (razas ?? []).map((raza) => this.normalizarRaza(raza));
            this.Manuales = this.buildManualesDisponibles(this.razas);
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
        const texto = normalizarTexto(this.nombreText?.nativeElement?.value ?? '', true);
        const homebrew = this.isHomebrewActivo();
        const razasFiltradas = this.razas
            .filter(raza =>
                toNumber((raza as any).Id) > 0
                && (texto === '' || this.coincideConTexto(raza, texto))
                && (this.defaultManual == 'Cualquiera' || `${raza.Manual ?? ''}`.includes(this.defaultManual))
                && (homebrew || this.esOficialParaFiltro(raza))
            )
            .sort((a, b) => {
                const nombreA = normalizarTexto(a?.Nombre ?? '', true);
                const nombreB = normalizarTexto(b?.Nombre ?? '', true);
                const byNombre = compararTexto(nombreA, nombreB);
                if (byNombre !== 0) return byNombre;
                return toNumber((a as any).Id) - toNumber((b as any).Id);
            });
        this.razasDS = new MatTableDataSource(razasFiltradas);
        if (this.razaSort) {
            this.razasDS.sort = this.razaSort;
            ordenarEnEspanol(this.razasDS);
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

    /** Si el homebrew lo decide el propio listado (con su chip) y no quien lo usa (`homebrewSeleccionado`). */
    private get homebrewPropio(): boolean {
        return this.homebrewSeleccionado === undefined || this.homebrewSeleccionado === null;
    }

    private isHomebrewActivo(): boolean {
        return this.homebrewPropio ? this.homebrewInterno : this.homebrewSeleccionado === true;
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

    /** Si algún filtro no está como al abrir el listado (el homebrew que impone la creación no cuenta). */
    get hayFiltros(): boolean {
        return textoDelFiltro(this.nombreText) !== '' || this.defaultManual !== 'Cualquiera'
            || (this.homebrewPropio && this.homebrewInterno);
    }

    limpiarFiltros(): void {
        vaciarTextoDelFiltro(this.nombreText);
        this.defaultManual = 'Cualquiera';
        if (this.homebrewPropio)
            this.homebrewInterno = false;
        this.filtroRazas();
    }

    AlternarRazasHombrew() {
        if (!this.homebrewPropio) {
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
    pulsarFila(value: number) {
        if (this.vistaPrevia)
            this.verDetallesRaza(value);
        else
            this.seleccionarRaza(value);
    }

    seleccionarRaza(value: number) {
        const raza = this.razas.find(r => r.Id === value);
        if (raza)
            this.razaSeleccionada.emit(raza);
    }

    private coincideConTexto(raza: Raza, texto: string): boolean {
        const mods = this.normalizarModificadores(raza.Modificadores as any);
        return normalizarTexto(raza.Nombre, true).includes(texto)
            || `${mods.Fuerza}`.includes(texto)
            || `${mods.Destreza}`.includes(texto)
            || `${mods.Constitucion}`.includes(texto)
            || `${mods.Inteligencia}`.includes(texto)
            || `${mods.Sabiduria}`.includes(texto)
            || `${mods.Carisma}`.includes(texto)
            || normalizarTexto(raza.Clase_predilecta, true).includes(texto);
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
            Fuerza: toNumber(mods?.Fuerza),
            Destreza: toNumber(mods?.Destreza),
            Constitucion: toNumber(mods?.Constitucion),
            Inteligencia: toNumber(mods?.Inteligencia),
            Sabiduria: toNumber(mods?.Sabiduria),
            Carisma: toNumber(mods?.Carisma),
        };
    }

    getModificador(mods: any, key: 'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma'): number {
        return toNumber(mods?.[key]);
    }

    getDgsCantidad(dgs: any): number {
        return toNumber(dgs?.Cantidad);
    }

    getDgsDado(dgs: any): string {
        return `${dgs?.Dado ?? ''}`;
    }

    private esOficialParaFiltro(raza: Raza): boolean {
        return toBoolean((raza as any)?.Oficial, true);
    }

    abrirDetalleManual(raza: Raza, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual(raza?.Manual);
    }

    private buildManualesDisponibles(razas: Raza[]): string[] {
        return Array.from(new Set(
            (razas ?? [])
                .map((raza) => `${raza?.Manual ?? ''}`.trim())
                .filter((nombre) => nombre.length > 0)
        )).sort(compararTexto);
    }
}
