import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { EspecialService } from 'src/app/services/especial.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

@Component({
    selector: 'app-listado-especiales',
    templateUrl: './listado-especiales.component.html',
    styleUrls: ['./listado-especiales.component.sass'],
    standalone: false
})
export class ListadoEspecialesComponent {
    especiales: EspecialClaseDetalle[] = [];
    especialesDS = new MatTableDataSource(this.especiales);
    especialColumns = ['Nombre', 'Extra', 'Repetible', 'Activa_extra'];

    constructor(private cdr: ChangeDetectorRef, private eSvc: EspecialService) { }

    @ViewChild(MatSort) especialSort!: MatSort;
    @ViewChild(MatPaginator) especialPaginator!: MatPaginator;
    @ViewChild('especialTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.especialesDS.paginator = this.especialPaginator;
        this.especialesDS.sort = this.especialSort;
        ordenarEnEspanol(this.especialesDS);
        this.eSvc.getEspeciales().subscribe(especiales => {
            this.especiales = (especiales ?? []).filter((especial) => this.esEspecialValido(especial));
            this.cdr.detectChanges();
            this.filtroEspeciales();
            this.cdr.detectChanges();
        });
    }

    filtroEspeciales() {
        const texto = normalizarTexto(this.nombreText?.nativeElement.value);
        const especialesFiltrados = this.especiales.filter((especial) => {
            if (!this.esEspecialValido(especial))
                return false;

            return texto === ''
                || normalizarTexto(especial.Nombre).includes(texto)
                || normalizarTexto(especial.Descripcion).includes(texto);
        });

        this.especialesDS = new MatTableDataSource(especialesFiltrados);
        setTimeout(() => {
            this.especialesDS.sort = this.especialSort;
            ordenarEnEspanol(this.especialesDS);
        }, 200);
        this.especialesDS.paginator = this.especialPaginator;
        this.especialSort.active = 'Nombre';
        this.especialSort.direction = 'asc';
    }

    @Output() especialDetalles: EventEmitter<EspecialClaseDetalle> = new EventEmitter<EspecialClaseDetalle>();
    verDetallesEspecial(id: number) {
        const especial = this.especiales.find(e => e.Id === id);
        if (especial)
            this.especialDetalles.emit(especial);
    }

    @Output() especialSeleccionado: EventEmitter<EspecialClaseDetalle> = new EventEmitter<EspecialClaseDetalle>();
    seleccionarEspecial(id: number) {
        const especial = this.especiales.find(e => e.Id === id);
        if (especial)
            this.especialSeleccionado.emit(especial);
    }

    private esEspecialValido(especial: EspecialClaseDetalle | null | undefined): boolean {
        const id = Number(especial?.Id ?? 0);
        return Number.isFinite(id) && id > 0;
    }
}
