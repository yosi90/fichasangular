import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Dote } from 'src/app/interfaces/dote';
import { DoteService } from 'src/app/services/dote.service';

@Component({
    selector: 'app-listado-dotes',
    templateUrl: './listado-dotes.component.html',
    styleUrls: ['./listado-dotes.component.sass']
})
export class ListadoDotesComponent {
    dotes: Dote[] = [];
    dotesDS = new MatTableDataSource(this.dotes);
    doteColumns = ['Nombre', 'Manual', 'Tipos', 'Prerrequisitos'];
    manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    mostrarHomebrew: boolean = false;
    soloSinPrerrequisitos: boolean = false;

    constructor(private cdr: ChangeDetectorRef, private dSvc: DoteService) { }

    @ViewChild(MatSort) doteSort!: MatSort;
    @ViewChild(MatPaginator) dotePaginator!: MatPaginator;
    @ViewChild('doteTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.dotesDS.paginator = this.dotePaginator;
        this.dotesDS.sort = this.doteSort;
        this.dSvc.getDotes().subscribe(dotes => {
            this.dotes = dotes;
            this.manuales = ['Cualquiera', ...Array.from(new Set(dotes.map(d => d.Manual?.Nombre).filter(Boolean)))];
            this.defaultManual = this.manuales[0];
            this.cdr.detectChanges();
            this.filtroDotes();
            this.cdr.detectChanges();
        });
    }

    filtroDotes() {
        const texto = this.nombreText?.nativeElement.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ?? '';

        const dotesFiltradas = this.dotes.filter(dote =>
            (texto === '' ||
                dote.Nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) ||
                dote.Descripcion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) ||
                dote.Beneficio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto))
            && (this.defaultManual === 'Cualquiera' || dote.Manual?.Nombre === this.defaultManual)
            && (!this.soloSinPrerrequisitos || !this.tienePrerrequisitos(dote))
            && (this.mostrarHomebrew || !this.mostrarHomebrew && dote.Oficial)
        );

        this.dotesDS = new MatTableDataSource(dotesFiltradas);
        setTimeout(() => {
            this.dotesDS.sort = this.doteSort;
        }, 200);
        this.dotesDS.paginator = this.dotePaginator;
        this.doteSort.active = 'Nombre';
        this.doteSort.direction = 'asc';
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
}
