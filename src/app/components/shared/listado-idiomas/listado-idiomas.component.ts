import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { IdiomaService } from 'src/app/services/idioma.service';

@Component({
    selector: 'app-listado-idiomas',
    templateUrl: './listado-idiomas.component.html',
    styleUrls: ['./listado-idiomas.component.sass'],
    standalone: false,
})
export class ListadoIdiomasComponent implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
    idiomas: IdiomaDetalle[] = [];
    idiomasDS = new MatTableDataSource(this.idiomas);
    idiomaColumns = ['Nombre', 'Secreto', 'Oficial'];

    constructor(private cdr: ChangeDetectorRef, private idiomaSvc: IdiomaService) { }

    @ViewChild(MatSort) idiomaSort!: MatSort;
    @ViewChild(MatPaginator) idiomaPaginator!: MatPaginator;
    @ViewChild('idiomaTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit(): void {
        this.idiomasDS.paginator = this.idiomaPaginator;
        this.idiomasDS.sort = this.idiomaSort;
        this.cargarIdiomas();
        this.idiomaSvc.idiomasMutados$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.cargarIdiomas());
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    filtroIdiomas(): void {
        const texto = this.normalizar(this.nombreText?.nativeElement.value);
        const idiomasFiltrados = this.idiomas.filter(idioma =>
            texto === ''
            || this.normalizar(idioma.Nombre).includes(texto)
            || this.normalizar(idioma.Descripcion).includes(texto)
        );

        this.idiomasDS = new MatTableDataSource(idiomasFiltrados);
        setTimeout(() => {
            this.idiomasDS.sort = this.idiomaSort;
        }, 200);
        this.idiomasDS.paginator = this.idiomaPaginator;
        this.idiomaSort.active = 'Nombre';
        this.idiomaSort.direction = 'asc';
    }

    @Output() idiomaDetalles: EventEmitter<IdiomaDetalle> = new EventEmitter<IdiomaDetalle>();
    verDetallesIdioma(id: number): void {
        const idioma = this.idiomas.find(item => item.Id === id);
        if (idioma)
            this.idiomaDetalles.emit(idioma);
    }

    @Output() idiomaSeleccionado: EventEmitter<IdiomaDetalle> = new EventEmitter<IdiomaDetalle>();
    seleccionarIdioma(id: number): void {
        const idioma = this.idiomas.find(item => item.Id === id);
        if (idioma)
            this.idiomaSeleccionado.emit(idioma);
    }

    private cargarIdiomas(): void {
        this.idiomaSvc.getIdiomas()
            .pipe(takeUntil(this.destroy$))
            .subscribe((idiomas) => {
                this.idiomas = idiomas;
                this.cdr.detectChanges();
                this.filtroIdiomas();
                this.cdr.detectChanges();
            });
    }

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
