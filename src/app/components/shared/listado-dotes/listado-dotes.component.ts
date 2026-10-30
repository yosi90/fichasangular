import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Dote } from 'src/app/interfaces/dote';
import { DoteService } from 'src/app/services/dote.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { Subscription } from 'rxjs';
import { nombreOriginalVisible } from 'src/app/components/detalles/ficha/ficha';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-dotes',
    templateUrl: './listado-dotes.component.html',
    styleUrls: ['./listado-dotes.component.sass'],
    standalone: false
})
export class ListadoDotesComponent implements OnDestroy, ListadoBuscable {
    dotes: Dote[] = [];
    dotesDS = new MatTableDataSource(this.dotes);
    doteColumns = ['Nombre', 'Manual', 'Tipos', 'Prerrequisitos'];
    manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    mostrarHomebrew: boolean = false;
    soloSinPrerrequisitos: boolean = false;
    /** El buscador rápido de la cabecera (nombre, descripción y beneficio). */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private dSvc: DoteService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) doteSort!: MatSort;
    @ViewChild(MatPaginator) dotePaginator!: MatPaginator;

    ngAfterViewInit() {
        this.dotesDS.paginator = this.dotePaginator;
        this.dotesDS.sort = this.doteSort;
        ordenarEnEspanol(this.dotesDS);
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee las dotes (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.dSvc.getDotes().subscribe({
            next: (dotes) => {
                this.dotes = dotes ?? [];
                this.manuales = ['Cualquiera', ...Array.from(new Set(this.dotes.map(d => d.Manual?.Nombre).filter(Boolean)))];
                this.defaultManual = this.manuales[0];
                this.cargado = true;
                this.cdr.detectChanges();
                this.filtroDotes();
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
        this.filtroDotes();
    }

    filtroDotes() {
        const texto = normalizarTexto(this.textoBusqueda, true);

        const dotesFiltradas = this.dotes.filter(dote =>
            (texto === '' ||
                normalizarTexto(dote.Nombre, true).includes(texto) ||
                normalizarTexto(dote.Descripcion, true).includes(texto) ||
                normalizarTexto(dote.Beneficio, true).includes(texto))
            && (this.defaultManual === 'Cualquiera' || dote.Manual?.Nombre === this.defaultManual)
            && (!this.soloSinPrerrequisitos || !this.tienePrerrequisitos(dote))
            && (this.mostrarHomebrew || !this.mostrarHomebrew && dote.Oficial)
        );

        this.dotesDS = new MatTableDataSource(dotesFiltradas);
        setTimeout(() => {
            this.dotesDS.sort = this.doteSort;
            ordenarEnEspanol(this.dotesDS);
        }, 200);
        this.dotesDS.paginator = this.dotePaginator;
        if (this.doteSort) {
            this.doteSort.active = 'Nombre';
            this.doteSort.direction = 'asc';
        }
    }

    get anuncioDotesHomebrew(): string {
        return this.mostrarHomebrew ? 'Homebrew incluido' : 'Incluir homebrew';
    }

    alternarDotesHomebrew() {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        if (this.mostrarHomebrew && !this.doteColumns.includes('Homebrew'))
            this.doteColumns.push('Homebrew');
        else if (!this.mostrarHomebrew && this.doteColumns.includes('Homebrew'))
            this.doteColumns = this.doteColumns.filter(c => c !== 'Homebrew');
        this.filtroDotes();
    }

    get anuncioSinPrerrequisitos(): string {
        return this.soloSinPrerrequisitos ? 'Solo sin prerrequisitos' : 'Filtrar sin prerrequisitos';
    }

    alternarSinPrerrequisitos() {
        this.soloSinPrerrequisitos = !this.soloSinPrerrequisitos;
        this.filtroDotes();
    }

    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera'
            || this.mostrarHomebrew || this.soloSinPrerrequisitos;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        if (this.mostrarHomebrew)
            this.alternarDotesHomebrew();
        this.soloSinPrerrequisitos = false;
        this.filtroDotes();
    }

    nombreOriginal(dote: Dote): string {
        return nombreOriginalVisible(dote);
    }

    getTipos(dote: Dote): string {
        return dote.Tipos?.map(t => t.Nombre).join(', ') ?? '';
    }

    tienePrerrequisitos(dote: Dote): boolean {
        if (!dote?.Prerrequisitos)
            return false;

        const valores = Object.values(dote.Prerrequisitos);
        if (valores.length === 0)
            return false;

        return valores.some(v => Array.isArray(v) ? v.length > 0 : !!v);
    }

    @Output() doteDetalles: EventEmitter<Dote> = new EventEmitter<Dote>();
    verDetallesDote(id: number) {
        const dote = this.dotes.find(d => d.Id === id);
        if (dote)
            this.doteDetalles.emit(dote);
    }

    @Output() doteSeleccionada: EventEmitter<Dote> = new EventEmitter<Dote>();
    seleccionarDote(id: number) {
        const dote = this.dotes.find(d => d.Id === id);
        if (dote)
            this.doteSeleccionada.emit(dote);
    }

    abrirDetalleManual(dote: Dote, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: dote?.Manual?.Id,
            nombre: dote?.Manual?.Nombre,
        });
    }
}
