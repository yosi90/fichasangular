import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { RacialService } from 'src/app/services/racial.service';

@Component({
    selector: 'app-listado-raciales',
    templateUrl: './listado-raciales.component.html',
    styleUrls: ['./listado-raciales.component.sass']
})
export class ListadoRacialesComponent {
    raciales: RacialDetalle[] = [];
    racialesDS = new MatTableDataSource(this.raciales);
    racialColumns = ['Nombre'];

    constructor(private cdr: ChangeDetectorRef, private rSvc: RacialService) { }

    @ViewChild(MatSort) racialSort!: MatSort;
    @ViewChild(MatPaginator) racialPaginator!: MatPaginator;
    @ViewChild('racialTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.racialesDS.paginator = this.racialPaginator;
        this.racialesDS.sort = this.racialSort;
        this.rSvc.getRaciales().subscribe(raciales => {
            this.raciales = raciales;
            this.cdr.detectChanges();
            this.filtroRaciales();
            this.cdr.detectChanges();
        });
    }

    filtroRaciales() {
        const texto = this.normalizar(this.nombreText?.nativeElement.value);
        const racialesFiltradas = this.raciales.filter(racial =>
            texto === ''
            || this.normalizar(racial.Nombre).includes(texto)
            || this.normalizar(racial.Descripcion).includes(texto)
        );

        this.racialesDS = new MatTableDataSource(racialesFiltradas);
        setTimeout(() => {
            this.racialesDS.sort = this.racialSort;
        }, 200);
        this.racialesDS.paginator = this.racialPaginator;
        this.racialSort.active = 'Nombre';
        this.racialSort.direction = 'asc';
    }

    @Output() racialDetalles: EventEmitter<RacialDetalle> = new EventEmitter<RacialDetalle>();
    verDetallesRacial(id: number) {
        const racial = this.raciales.find(r => r.Id === id);
        if (racial)
            this.racialDetalles.emit(racial);
    }

    @Output() racialSeleccionada: EventEmitter<RacialDetalle> = new EventEmitter<RacialDetalle>();
    seleccionarRacial(id: number) {
        const racial = this.raciales.find(r => r.Id === id);
        if (racial)
            this.racialSeleccionada.emit(racial);
    }

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
