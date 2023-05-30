import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Raza } from 'src/app/interfaces/raza';
import { RazasService } from 'src/app/services/razas.service';

@Component({
    selector: 'app-nuevo-personaje',
    templateUrl: './nuevo-personaje.component.html',
    styleUrls: ['./nuevo-personaje.component.sass']
})
export class NuevoPersonajeComponent {
    razas: Raza[] = [];
    razasDS = new MatTableDataSource(this.razas);
    columns = ['Nombre', 'Características', 'Clase predilecta', 'Manual', 'Ajuste de nivel', 'Dgs extra'];

    constructor(private rSvc: RazasService) { }
    
    @ViewChild(MatSort) razaSort!: MatSort;
    @ViewChild(MatPaginator) razaPaginator!: MatPaginator;
    @ViewChild('razaTextInc', { read: ElementRef }) inputText!: ElementRef;

    async ngOnInit(): Promise<void> {
        (await this.rSvc.getRazas()).subscribe(razas => {
            this.razas = razas;
            this.filtroRazas();
        });
    }

    filtroRazas() {
        if (this.inputText) {
            const texto = this.inputText.nativeElement.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const razasFiltradas = this.razas.filter(raza => (
                texto === undefined || texto === '' || raza.Nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) 
                || raza.Modificadores.Fuerza.toString().includes(texto) || raza.Modificadores.Destreza.toString().includes(texto) || raza.Modificadores.Constitucion.toString().includes(texto) 
                || raza.Modificadores.Inteligencia.toString().includes(texto) || raza.Modificadores.Sabiduria.toString().includes(texto) || raza.Modificadores.Carisma.toString().includes(texto)
            ));
            this.razasDS = new MatTableDataSource(razasFiltradas);
            this.razasDS.sort = this.razaSort;
            this.razasDS.paginator = this.razaPaginator;
        }
    }

    DetallesRaza(value: number) {
        console.log(`Detalles de ${value}`);
    }
}
