import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { EspecialService } from 'src/app/services/especial.service';

@Component({
    selector: 'app-listado-especiales',
    templateUrl: './listado-especiales.component.html',
    styleUrls: ['./listado-especiales.component.sass']
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
        this.eSvc.getEspeciales().subscribe(especiales => {
            this.especiales = especiales;
            this.cdr.detectChanges();
            this.filtroEspeciales();
            this.cdr.detectChanges();
        });
    }

    filtroEspeciales() {
        const texto = this.normalizar(this.nombreText?.nativeElement.value);
        const especialesFiltrados = this.especiales.filter(especial =>
            texto === ''
            || this.normalizar(especial.Nombre).includes(texto)
            || this.normalizar(especial.Descripcion).includes(texto)
        );

        this.especialesDS = new MatTableDataSource(especialesFiltrados);
        setTimeout(() => {
            this.especialesDS.sort = this.especialSort;
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

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
