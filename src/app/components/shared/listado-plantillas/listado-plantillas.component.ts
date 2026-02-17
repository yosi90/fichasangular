import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { PlantillaService } from 'src/app/services/plantilla.service';

@Component({
    selector: 'app-listado-plantillas',
    templateUrl: './listado-plantillas.component.html',
    styleUrls: ['./listado-plantillas.component.sass']
})
export class ListadoPlantillasComponent {
    plantillas: Plantilla[] = [];
    plantillasDS = new MatTableDataSource<Plantilla>([]);
    plantillaColumns = ['Nombre', 'Manual', 'Ajuste_nivel', 'Nacimiento', 'Prerrequisitos', 'Oficial'];
    manuales: string[] = [];
    defaultManual: string = 'Cualquiera';
    incluirHomebrew: boolean = false;

    constructor(
        private cdr: ChangeDetectorRef,
        private plantillaSvc: PlantillaService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) plantillaSort!: MatSort;
    @ViewChild(MatPaginator) plantillaPaginator!: MatPaginator;
    @ViewChild('plantillaTextInc', { read: ElementRef }) plantillaTextInc!: ElementRef;

    ngAfterViewInit() {
        this.plantillasDS.paginator = this.plantillaPaginator;
        this.plantillasDS.sort = this.plantillaSort;
        this.plantillaSvc.getPlantillas().subscribe(plantillas => {
            this.plantillas = plantillas;
            this.manuales = ['Cualquiera', ...Array.from(new Set(plantillas.map(p => p.Manual?.Nombre).filter(Boolean)))];
            this.defaultManual = this.manuales[0] ?? 'Cualquiera';
            this.cdr.detectChanges();
            this.filtroPlantillas();
            this.cdr.detectChanges();
        });
    }

    filtroPlantillas() {
        const texto = this.plantillaTextInc?.nativeElement?.value?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ?? '';

        const filtradas = this.plantillas.filter(plantilla =>
            (texto === ''
                || this.normalizar(plantilla.Nombre).includes(texto)
                || this.normalizar(plantilla.Descripcion).includes(texto))
            && (this.defaultManual === 'Cualquiera' || plantilla.Manual?.Nombre === this.defaultManual)
            && (this.incluirHomebrew || plantilla.Oficial)
        );

        this.plantillasDS = new MatTableDataSource<Plantilla>(filtradas);
        setTimeout(() => {
            this.plantillasDS.sort = this.plantillaSort;
        }, 100);
        this.plantillasDS.paginator = this.plantillaPaginator;
        this.plantillaSort.active = 'Nombre';
        this.plantillaSort.direction = 'asc';
    }

    get anuncioHomebrew(): string {
        return this.incluirHomebrew ? 'Homebrew incluido' : 'Incluir homebrew';
    }

    alternarHomebrew() {
        this.incluirHomebrew = !this.incluirHomebrew;
        this.filtroPlantillas();
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

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    abrirDetalleManual(plantilla: Plantilla, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: plantilla?.Manual?.Id,
            nombre: plantilla?.Manual?.Nombre,
        });
    }
}
