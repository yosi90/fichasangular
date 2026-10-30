import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-idiomas',
    templateUrl: './listado-idiomas.component.html',
    styleUrls: ['./listado-idiomas.component.sass'],
    standalone: false,
})
export class ListadoIdiomasComponent implements OnDestroy, ListadoBuscable {
    private readonly destroy$ = new Subject<void>();
    idiomas: IdiomaDetalle[] = [];
    idiomasDS = new MatTableDataSource(this.idiomas);
    idiomaColumns = ['Nombre', 'Secreto', 'Oficial'];
    /** El buscador rápido de la cabecera (nombre y descripción). */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(private cdr: ChangeDetectorRef, private idiomaSvc: IdiomaService) { }

    @ViewChild(MatSort) idiomaSort!: MatSort;
    @ViewChild(MatPaginator) idiomaPaginator!: MatPaginator;

    ngAfterViewInit(): void {
        this.idiomasDS.paginator = this.idiomaPaginator;
        this.idiomasDS.sort = this.idiomaSort;
        ordenarEnEspanol(this.idiomasDS);
        this.cargar();
        this.idiomaSvc.idiomasMutados$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.cargarIdiomas());
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    /** Lee los idiomas (otra vez, con «Reintentar»), con el esqueleto mientras tanto. */
    cargar(): void {
        this.cargado = false;
        this.cargarIdiomas();
    }

    buscar(texto: string): void {
        this.textoBusqueda = texto ?? '';
        this.filtroIdiomas();
    }

    /** El único filtro es el buscador de la cabecera. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '';
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.filtroIdiomas();
    }

    filtroIdiomas(): void {
        const texto = normalizarTexto(this.textoBusqueda);
        const idiomasFiltrados = this.idiomas.filter(idioma =>
            texto === ''
            || normalizarTexto(idioma.Nombre).includes(texto)
            || normalizarTexto(idioma.Descripcion).includes(texto)
        );

        this.idiomasDS = new MatTableDataSource(idiomasFiltrados);
        setTimeout(() => {
            this.idiomasDS.sort = this.idiomaSort;
            ordenarEnEspanol(this.idiomasDS);
        }, 200);
        this.idiomasDS.paginator = this.idiomaPaginator;
        if (this.idiomaSort) {
            this.idiomaSort.active = 'Nombre';
            this.idiomaSort.direction = 'asc';
        }
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

    /** Al cambiar un idioma (`idiomasMutados$`) se vuelve a leer sin enseñar el esqueleto. */
    private cargarIdiomas(): void {
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.idiomaSvc.getIdiomas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (idiomas) => {
                    this.idiomas = idiomas ?? [];
                    this.cargado = true;
                    this.cdr.detectChanges();
                    this.filtroIdiomas();
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.cargado = true;
                    this.errorCarga = true;
                    this.cdr.detectChanges();
                },
            });
    }

}
