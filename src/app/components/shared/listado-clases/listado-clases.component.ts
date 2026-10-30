import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Clase } from 'src/app/interfaces/clase';
import { ClaseService } from 'src/app/services/clase.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { esFilaComodin } from 'src/app/services/utils/comodin';
import { Subscription } from 'rxjs';
import { TipoRol, tipoRolDeClase } from 'src/app/services/utils/iconos-rol';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-clases',
    templateUrl: './listado-clases.component.html',
    styleUrls: ['./listado-clases.component.sass'],
    standalone: false
})
export class ListadoClasesComponent implements OnDestroy, ListadoBuscable {
    clases: Clase[] = [];
    clasesDS = new MatTableDataSource(this.clases);
    claseColumns = ['Nombre', 'Manual', 'Tipo_dado', 'Puntos_habilidad', 'Nivel_max_claseo', 'Prestigio', 'Prerrequisitos'];
    manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    incluirHomebrew: boolean = false;
    soloPrestigio: boolean = false;
    ocultarConPrerrequisitos: boolean = false;
    /** El buscador rápido de la cabecera (nombre y descripción). */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private claseSvc: ClaseService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) claseSort!: MatSort;
    @ViewChild(MatPaginator) clasePaginator!: MatPaginator;

    ngAfterViewInit() {
        this.clasesDS.paginator = this.clasePaginator;
        this.clasesDS.sort = this.claseSort;
        ordenarEnEspanol(this.clasesDS);
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee las clases (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.claseSvc.getClases().subscribe({
            next: (clases) => {
                // La clase 0, «Cualquiera», es un comodín de los prerrequisitos y los editores: aquí no se lista.
                this.clases = (clases ?? []).filter((clase) => !esFilaComodin(clase));
                this.manuales = ['Cualquiera', ...Array.from(new Set(this.clases.map(c => c.Manual?.Nombre).filter(Boolean)))];
                this.defaultManual = this.manuales[0];
                this.cargado = true;
                this.cdr.detectChanges();
                this.filtroClases();
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
        this.filtroClases();
    }

    filtroClases() {
        const texto = normalizarTexto(this.textoBusqueda, true);

        const clasesFiltradas = this.clases.filter(clase =>
            (texto === ''
                || normalizarTexto(clase.Nombre, true).includes(texto)
                || normalizarTexto(clase.Descripcion, true).includes(texto))
            && (this.defaultManual === 'Cualquiera' || clase.Manual?.Nombre === this.defaultManual)
            && (!this.soloPrestigio || clase.Prestigio)
            && (!this.ocultarConPrerrequisitos || !this.tienePrerrequisitos(clase))
            && (this.incluirHomebrew || clase.Oficial)
        );

        this.clasesDS = new MatTableDataSource(clasesFiltradas);
        setTimeout(() => {
            this.clasesDS.sort = this.claseSort;
            ordenarEnEspanol(this.clasesDS);
        }, 200);
        this.clasesDS.paginator = this.clasePaginator;
        if (this.claseSort) {
            this.claseSort.active = 'Nombre';
            this.claseSort.direction = 'asc';
        }
    }

    get anuncioHomebrew(): string {
        return this.incluirHomebrew ? 'Homebrew incluido' : 'Incluir homebrew';
    }

    alternarHomebrew() {
        this.incluirHomebrew = !this.incluirHomebrew;
        this.filtroClases();
    }

    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera'
            || this.incluirHomebrew || this.soloPrestigio || this.ocultarConPrerrequisitos;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        this.incluirHomebrew = false;
        this.soloPrestigio = false;
        this.ocultarConPrerrequisitos = false;
        this.filtroClases();
    }

    get anuncioPrestigio(): string {
        return this.soloPrestigio ? 'Solo prestigio' : 'Filtrar prestigio';
    }

    alternarPrestigio() {
        this.soloPrestigio = !this.soloPrestigio;
        this.filtroClases();
    }

    get anuncioPrerrequisitos(): string {
        return this.ocultarConPrerrequisitos ? 'Solo sin prerrequisitos' : 'Ocultar prerrequisitos';
    }

    alternarFiltroPrerrequisitos() {
        this.ocultarConPrerrequisitos = !this.ocultarConPrerrequisitos;
        this.filtroClases();
    }

    /** Clase básica o de prestigio, según el dato (`Prestigio`). */
    tipoDe(clase: Clase): TipoRol {
        return tipoRolDeClase(clase);
    }

    tienePrerrequisitos(clase: Clase): boolean {
        if (clase?.Tiene_prerrequisitos)
            return true;

        if (clase?.Prerrequisitos_flags?.habilidad_clase)
            return true;

        const pr = clase?.Prerrequisitos;
        if (!pr || typeof pr !== 'object')
            return false;

        return Object.values(pr).some(valor => {
            if (Array.isArray(valor))
                return valor.length > 0;

            if (valor && typeof valor === 'object')
                return Object.keys(valor).length > 0;

            return !!valor;
        });
    }

    @Output() claseDetalles: EventEmitter<Clase> = new EventEmitter<Clase>();
    verDetallesClase(id: number) {
        const clase = this.clases.find(c => c.Id === id);
        if (clase)
            this.claseDetalles.emit(clase);
    }

    @Output() claseSeleccionada: EventEmitter<Clase> = new EventEmitter<Clase>();
    seleccionarClase(id: number) {
        const clase = this.clases.find(c => c.Id === id);
        if (clase)
            this.claseSeleccionada.emit(clase);
    }

    abrirDetalleManual(clase: Clase, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: clase?.Manual?.Id,
            nombre: clase?.Manual?.Nombre,
        });
    }
}
