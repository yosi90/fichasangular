import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { Subscription } from 'rxjs';
import { nombreOriginalVisible } from 'src/app/components/detalles/ficha/ficha';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

@Component({
    selector: 'app-listado-plantillas',
    templateUrl: './listado-plantillas.component.html',
    styleUrls: ['./listado-plantillas.component.sass'],
    standalone: false
})
export class ListadoPlantillasComponent implements OnDestroy, ListadoBuscable {
    plantillas: Plantilla[] = [];
    plantillasDS = new MatTableDataSource<Plantilla>([]);
    plantillaColumns = ['Nombre', 'Manual', 'Ajuste_nivel', 'Nacimiento', 'Prerrequisitos', 'Oficial'];
    manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    incluirHomebrew: boolean = false;
    /** El buscador rápido de la cabecera (nombre y descripción). */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private plantillaSvc: PlantillaService
    ) { }

    @ViewChild(MatSort) plantillaSort!: MatSort;
    @ViewChild(MatPaginator) plantillaPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.plantillasDS.paginator = this.plantillaPaginator;
        this.plantillasDS.sort = this.plantillaSort;
        ordenarEnEspanol(this.plantillasDS);
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee las plantillas (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.plantillaSvc.getPlantillas().subscribe({
            next: (plantillas) => {
                this.plantillas = plantillas ?? [];
                this.manuales = ['Cualquiera', ...Array.from(new Set(this.plantillas.map(p => p.Manual?.Nombre).filter(Boolean)))];
                this.defaultManual = this.manuales[0] ?? 'Cualquiera';
                this.cargado = true;
                this.cdr.detectChanges();
                this.filtroPlantillas();
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
        this.filtroPlantillas();
    }

    filtroPlantillas() {
        const texto = normalizarTexto(this.textoBusqueda, true);

        const filtradas = this.plantillas.filter(plantilla =>
            (texto === ''
                || normalizarTexto(plantilla.Nombre, true).includes(texto)
                || normalizarTexto(plantilla.Descripcion, true).includes(texto))
            && (this.defaultManual === 'Cualquiera' || plantilla.Manual?.Nombre === this.defaultManual)
            && (this.incluirHomebrew || plantilla.Oficial)
        );

        this.plantillasDS = new MatTableDataSource<Plantilla>(filtradas);
        setTimeout(() => {
            this.plantillasDS.sort = this.plantillaSort;
            ordenarEnEspanol(this.plantillasDS);
        }, 100);
        this.plantillasDS.paginator = this.plantillaPaginator;
        if (this.plantillaSort) {
            this.plantillaSort.active = 'Nombre';
            this.plantillaSort.direction = 'asc';
        }
    }

    get anuncioHomebrew(): string {
        return this.incluirHomebrew ? 'Homebrew incluido' : 'Incluir homebrew';
    }

    alternarHomebrew() {
        this.incluirHomebrew = !this.incluirHomebrew;
        this.filtroPlantillas();
    }

    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera' || this.incluirHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        this.incluirHomebrew = false;
        this.filtroPlantillas();
    }

    nombreOriginal(plantilla: Plantilla): string {
        return nombreOriginalVisible(plantilla);
    }

    tienePrerrequisitos(plantilla: Plantilla): boolean {
        const prer = plantilla?.Prerrequisitos;
        if (!prer || typeof prer !== 'object')
            return false;

        return Object.values(prer).some(v => Array.isArray(v) && v.length > 0);
    }

    @Output() plantillaDetalles: EventEmitter<Plantilla> = new EventEmitter<Plantilla>();
    verDetallesPlantilla(id: number) {
        const plantilla = this.plantillas.find(p => p.Id === id);
        if (plantilla)
            this.plantillaDetalles.emit(plantilla);
    }

    @Output() plantillaSeleccionada: EventEmitter<Plantilla> = new EventEmitter<Plantilla>();
    seleccionarPlantilla(id: number) {
        const plantilla = this.plantillas.find(p => p.Id === id);
        if (plantilla)
            this.plantillaSeleccionada.emit(plantilla);
    }
}
