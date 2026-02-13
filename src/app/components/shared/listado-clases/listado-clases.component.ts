import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Clase } from 'src/app/interfaces/clase';
import { ClaseService } from 'src/app/services/clase.service';

@Component({
    selector: 'app-listado-clases',
    templateUrl: './listado-clases.component.html',
    styleUrls: ['./listado-clases.component.sass']
})
export class ListadoClasesComponent {
    clases: Clase[] = [];
    clasesDS = new MatTableDataSource(this.clases);
    claseColumns = ['Nombre', 'Manual', 'Tipo_dado', 'Puntos_habilidad', 'Nivel_max_claseo', 'Prestigio', 'Prerrequisitos'];
    manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    incluirHomebrew: boolean = false;
    soloPrestigio: boolean = false;
    ocultarConPrerrequisitos: boolean = false;

    constructor(private cdr: ChangeDetectorRef, private claseSvc: ClaseService) { }

    @ViewChild(MatSort) claseSort!: MatSort;
    @ViewChild(MatPaginator) clasePaginator!: MatPaginator;
    @ViewChild('claseTextInc', { read: ElementRef }) claseTextInc!: ElementRef;

    ngAfterViewInit() {
        this.clasesDS.paginator = this.clasePaginator;
        this.clasesDS.sort = this.claseSort;
        this.claseSvc.getClases().subscribe(clases => {
            this.clases = clases;
            this.manuales = ['Cualquiera', ...Array.from(new Set(clases.map(c => c.Manual?.Nombre).filter(Boolean)))];
            this.defaultManual = this.manuales[0];
            this.cdr.detectChanges();
            this.filtroClases();
            this.cdr.detectChanges();
        });
    }

    filtroClases() {
        const texto = this.claseTextInc?.nativeElement?.value?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ?? '';

        const clasesFiltradas = this.clases.filter(clase =>
            (texto === ''
                || clase.Nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto)
                || clase.Descripcion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto))
            && (this.defaultManual === 'Cualquiera' || clase.Manual?.Nombre === this.defaultManual)
            && (!this.soloPrestigio || clase.Prestigio)
            && (!this.ocultarConPrerrequisitos || !this.tienePrerrequisitos(clase))
            && (this.incluirHomebrew || clase.Oficial)
        );

        this.clasesDS = new MatTableDataSource(clasesFiltradas);
        setTimeout(() => {
            this.clasesDS.sort = this.claseSort;
        }, 200);
        this.clasesDS.paginator = this.clasePaginator;
        this.claseSort.active = 'Nombre';
        this.claseSort.direction = 'asc';
    }

    get anuncioHomebrew(): string {
        return this.incluirHomebrew ? 'Homebrew incluido' : 'Incluir homebrew';
    }

    alternarHomebrew() {
        this.incluirHomebrew = !this.incluirHomebrew;
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

    tienePrerrequisitos(clase: Clase): boolean {
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
}
