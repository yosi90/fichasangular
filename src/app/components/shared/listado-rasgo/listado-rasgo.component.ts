import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { RasgoService } from 'src/app/services/rasgo.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { Subscription } from 'rxjs';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-rasgo',
    templateUrl: './listado-rasgo.component.html',
    styleUrls: ['./listado-rasgo.component.sass'],
    standalone: false
})
export class ListadoRasgoRacialComponent implements OnDestroy, ListadoBuscable {
    rasgos: Rasgo[] = [];
    rasgosDS = new MatTableDataSource(this.rasgos);
    rasgoColumns = ['Nombre'];
    mostrarHomebrew = false;
    /** El buscador rápido de la cabecera. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(private cdr: ChangeDetectorRef, private rSvc: RasgoService) { }

    @ViewChild(MatSort) tipoSort!: MatSort;
    @ViewChild(MatPaginator) tipoPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.rasgosDS.paginator = this.tipoPaginator;
        this.rasgosDS.sort = this.tipoSort;
        ordenarEnEspanol(this.rasgosDS);
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee los rasgos (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.rSvc.getRasgos().subscribe({
            next: (rasgos) => {
                this.rasgos = rasgos ?? [];
                this.cargado = true;
                this.cdr.detectChanges();
                this.filtroRasgos();
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
        this.filtroRasgos();
    }

    filtroRasgos() {
        const texto = normalizarTexto(this.textoBusqueda, true);
        const rasgosFiltrados = this.rasgos.filter(rasgo =>
            (texto === '' || normalizarTexto(rasgo.Nombre, true).includes(texto))
            && (this.mostrarHomebrew || rasgo.Oficial)
        );
        this.rasgosDS = new MatTableDataSource(rasgosFiltrados);
        setTimeout(() => {
            this.rasgosDS.sort = this.tipoSort;
            ordenarEnEspanol(this.rasgosDS);
        }, 200);
        this.rasgosDS.paginator = this.tipoPaginator;
        if (this.tipoSort) {
            this.tipoSort.active = 'Nombre';
            this.tipoSort.direction = 'asc';
        }
    }

    get anuncioRasgosHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando rasgos homebrew' : 'Clic para mostar rasgos homebrew';
    }

    alternarRasgosHomebrew(): void {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.rasgoColumns = this.mostrarHomebrew
            ? [...this.rasgoColumns.filter((c) => c !== 'Homebrew'), 'Homebrew']
            : this.rasgoColumns.filter((c) => c !== 'Homebrew');
        this.filtroRasgos();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        if (this.mostrarHomebrew)
            this.alternarRasgosHomebrew();
        else
            this.filtroRasgos();
    }

    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    verDetallesRasgo(value: number) {
        this.rasgoDetalles.emit(this.rasgos.find(c => c.Id === value));
    }

    @Output() rasgoSeleccionado: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    seleccionarRasgo(value: number) {
        this.rasgoSeleccionado.emit(this.rasgos.find(c => c.Id === value));
    }
}
