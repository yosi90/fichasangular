import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Manual } from 'src/app/interfaces/manual';
import { Raza } from 'src/app/interfaces/raza';
import { ManualService } from 'src/app/services/manual.service';
import { RazaService } from 'src/app/services/raza.service';

@Component({
    selector: 'app-listado-razas',
    templateUrl: './listado-razas.component.html',
    styleUrls: ['./listado-razas.component.sass']
})
export class ListadoRazasComponent {
    razas: Raza[] = [];
    Manuales: Manual[] = [];
    defaultManual: string = 'Cualquiera';
    razasDS = new MatTableDataSource(this.razas);
    razaColumns = ['Nombre', 'Modificadores', 'Clase_predilecta', 'Manual', 'Ajuste_nivel', 'Dgs_adicionales'];

    constructor(private cdr: ChangeDetectorRef, private rSvc: RazaService, private mSvc: ManualService) { }

    @ViewChild(MatSort) razaSort!: MatSort;
    @ViewChild(MatPaginator) razaPaginator!: MatPaginator;
    @ViewChild('razaTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        (this.rSvc.getRazas()).subscribe(razas => {
            this.razas = razas;
            (this.mSvc.getManuales()).subscribe(manuales => {
                this.Manuales = [...manuales].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                this.defaultManual = 'Cualquiera';
                this.cdr.detectChanges();
                this.filtroRazas();
                this.cdr.detectChanges();
            });
        });

    }

    filtroRazas() {
        const texto = this.nombreText?.nativeElement.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ?? '';
        const homebrew = !(this.anuncioRazasHomebrew === 'Clic para mostar razas homebrew');
        const razasFiltradas = this.razas.filter(raza =>
            (texto === undefined || texto === '' || raza.Nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto)
                || raza.Modificadores.Fuerza.toString().includes(texto) || raza.Modificadores.Destreza.toString().includes(texto) || raza.Modificadores.Constitucion.toString().includes(texto)
                || raza.Modificadores.Inteligencia.toString().includes(texto) || raza.Modificadores.Sabiduria.toString().includes(texto) || raza.Modificadores.Carisma.toString().includes(texto)
                || raza.Clase_predilecta.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto))
            && (this.defaultManual == 'Cualquiera' || raza.Manual.includes(this.defaultManual))
            && (homebrew || !homebrew && raza.Oficial)
        );
        this.razasDS = new MatTableDataSource(razasFiltradas);
        setTimeout(() => {
            this.razasDS.sort = this.razaSort;
        }, 200);
        this.razasDS.paginator = this.razaPaginator;
        this.razaSort.active = 'Nombre';
        this.razaSort.direction = 'asc';
    }

    anuncioRazasHomebrew: string = 'Clic para mostar razas homebrew';
    AlternarRazasHombrew(value: string) {
        if (value === 'Clic para mostar razas homebrew') {
            this.anuncioRazasHomebrew = 'Mostrando razas homebrew';
            this.razaColumns.push('Homebrew');
        } else {
            this.anuncioRazasHomebrew = 'Clic para mostar razas homebrew';
            this.razaColumns.pop();
        }
        this.filtroRazas();
    }

    @Output() razaDetalles: EventEmitter<Raza> = new EventEmitter<Raza>();
    verDetallesRaza(value: number) {
        this.razaDetalles.emit(this.razas.find(r => r.Id === value));
    }

    @Output() razaSeleccionada: EventEmitter<Raza> = new EventEmitter<Raza>();
    seleccionarRaza(value: number) {
        this.razaSeleccionada.emit(this.razas.find(r => r.Id === value));
    }
}
