import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { RacialService } from 'src/app/services/racial.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-raciales',
    templateUrl: './listado-raciales.component.html',
    styleUrls: ['./listado-raciales.component.sass'],
    standalone: false
})
export class ListadoRacialesComponent implements OnDestroy, ListadoBuscable {
    private readonly destroy$ = new Subject<void>();
    raciales: RacialDetalle[] = [];
    racialesDS = new MatTableDataSource(this.raciales);
    racialColumns = ['Nombre'];
    /** El buscador rápido de la cabecera (nombre y descripción); es el único filtro de las raciales. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(private cdr: ChangeDetectorRef, private rSvc: RacialService) { }

    @ViewChild(MatSort) racialSort!: MatSort;
    @ViewChild(MatPaginator) racialPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.racialesDS.paginator = this.racialPaginator;
        this.racialesDS.sort = this.racialSort;
        ordenarEnEspanol(this.racialesDS);
        this.cargar();
        this.rSvc.racialesMutados$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.leerRaciales());
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    /** Lee las raciales desde cero (al abrir y con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.leerRaciales();
    }

    buscar(texto: string): void {
        this.textoBusqueda = texto ?? '';
        this.filtroRaciales();
    }

    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '';
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.filtroRaciales();
    }

    filtroRaciales() {
        const texto = normalizarTexto(this.textoBusqueda);
        const racialesFiltradas = this.raciales.filter(racial =>
            texto === ''
            || normalizarTexto(racial.Nombre).includes(texto)
            || normalizarTexto(racial.Descripcion).includes(texto)
        );

        this.racialesDS = new MatTableDataSource(racialesFiltradas);
        setTimeout(() => {
            this.racialesDS.sort = this.racialSort;
            ordenarEnEspanol(this.racialesDS);
        }, 200);
        this.racialesDS.paginator = this.racialPaginator;
        if (this.racialSort) {
            this.racialSort.active = 'Nombre';
            this.racialSort.direction = 'asc';
        }
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

    /** Lee las raciales sin pasar por el esqueleto (también cuando el servicio avisa de un cambio). */
    private leerRaciales(): void {
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.rSvc.getRaciales().subscribe({
            next: (raciales) => {
                this.raciales = raciales ?? [];
                this.cargado = true;
                this.errorCarga = false;
                this.cdr.detectChanges();
                this.filtroRaciales();
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
