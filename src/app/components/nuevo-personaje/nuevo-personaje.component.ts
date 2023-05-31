import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Raza } from 'src/app/interfaces/raza';
import { RazasService } from 'src/app/services/razas.service';
import { ManualesService } from 'src/app/services/manuales.service';

@Component({
    selector: 'app-nuevo-personaje',
    templateUrl: './nuevo-personaje.component.html',
    styleUrls: ['./nuevo-personaje.component.sass']
})
export class NuevoPersonajeComponent {
    razas: Raza[] = [];
    Manuales: string[] = [];
    defaultManual!: string;
    razasDS = new MatTableDataSource(this.razas);
    razaColumns = ['Nombre', 'Modificadores', 'Clase_predilecta', 'Manual', 'Ajuste_nivel', 'Dgs_extra'];

    constructor(private rSvc: RazasService, private mSvc: ManualesService) { }

    @ViewChild(MatSort) razaSort!: MatSort;
    @ViewChild(MatPaginator) razaPaginator!: MatPaginator;
    @ViewChild('razaTextInc', { read: ElementRef }) nombreText!: ElementRef;

    async ngOnInit(): Promise<void> {
        (await this.rSvc.getRazas()).subscribe(razas => {
            this.razas = razas;
        });
        (await this.mSvc.getManuales()).subscribe(manuales => {
            manuales.unshift('Cualquiera');
            this.Manuales = manuales;
            this.defaultManual = this.Manuales[0];
            this.filtroRazas();
        });
    }

    filtroRazas() {
        if (this.nombreText) {
            const texto = this.nombreText.nativeElement.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const homebrew = !(this.anuncioRazasHomebrew === 'Clic para mostar razas homebrew');
            const razasFiltradas = this.razas.filter(raza => 
                (texto === undefined || texto === '' || raza.Nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto)
                || raza.Modificadores.Fuerza.toString().includes(texto) || raza.Modificadores.Destreza.toString().includes(texto) || raza.Modificadores.Constitucion.toString().includes(texto)
                || raza.Modificadores.Inteligencia.toString().includes(texto) || raza.Modificadores.Sabiduria.toString().includes(texto) || raza.Modificadores.Carisma.toString().includes(texto)
                || raza.Clase_predilecta.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto))
                && (this.defaultManual == 'Cualquiera' || raza.Manual.includes(this.defaultManual))
                && (homebrew || !homebrew && !raza.Homebrew)
            );
            this.razasDS = new MatTableDataSource(razasFiltradas);
            setTimeout(() => {
                this.razasDS.sort = this.razaSort;
            }, 20);
            this.razasDS.paginator = this.razaPaginator;
        }
    }

    anuncioRazasHomebrew: string = 'Clic para mostar razas homebrew';
    AlternarRazasHombrew(value: string) {
        if (value === 'Clic para mostar razas homebrew'){
            this.anuncioRazasHomebrew = 'Mostrando razas homebrew';
            this.razaColumns.push('Homebrew');
        } else {
            this.anuncioRazasHomebrew = 'Clic para mostar razas homebrew';
            this.razaColumns.pop();
        }
        this.filtroRazas();
    }

    DetallesRaza(value: number) {
        console.log(`Detalles de ${value}`);
    }
}
