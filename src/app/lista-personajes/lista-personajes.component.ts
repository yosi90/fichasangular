import { Component, OnInit } from '@angular/core';
import { Campana } from '../interfaces/Campana';
import { ListaPersonajesService } from '../services/lista-personajes.service';
import { PersonajeSimple } from '../interfaces/personaje-simple';

@Component({
    selector: 'app-lista-personajes',
    templateUrl: './lista-personajes.component.html',
    styleUrls: ['./lista-personajes.component.sass']
})
export class ListaPersonajesComponent implements OnInit {

    Personajes: PersonajeSimple[] = [];
    columns = [
        {
            columnDef: 'Nombre del personaje',
            header: 'Nombre',
            cell: (pj: PersonajeSimple) => `${pj.Nombre}`,
        },
        {
            columnDef: 'Estado de la ficha',
            header: '¿Archivado?',
            cell: (pj: PersonajeSimple): boolean => pj.Archivado,
        },
    ];
    dataSource = this.Personajes;
    displayedColumns = this.columns.map(c => c.columnDef);

    constructor(private listaPjs: ListaPersonajesService) { }

    async ngOnInit(): Promise<void> {
        (await this.listaPjs.getPersonajes()).subscribe(Personajes => {
            this.Personajes = Personajes;
            this.columns = [
                {
                    columnDef: 'Nombre del personaje',
                    header: 'Nombre',
                    cell: (pj: PersonajeSimple) => `${pj.Nombre}`,
                },
                {
                    columnDef: 'Clases y nivel',
                    header: 'Clases',
                    cell: (pj: PersonajeSimple) => `${pj.Clases}`,
                },
                {
                    columnDef: 'Raza del personaje',
                    header: 'Raza',
                    cell: (pj: PersonajeSimple) => `${pj.Raza}`,
                },
                {
                    columnDef: 'Campaña en la que aparece',
                    header: 'Campaña',
                    cell: (pj: PersonajeSimple) => `${pj.Campana}`,
                },
                {
                    columnDef: 'Trama de la campaña',
                    header: 'Trama',
                    cell: (pj: PersonajeSimple) => `${pj.Trama}`,
                },
                {
                    columnDef: 'Subtrama de la trama',
                    header: 'Subtrama',
                    cell: (pj: PersonajeSimple) => `${pj.Subtrama}`,
                },
                {
                    columnDef: 'Estado de la ficha',
                    header: '¿Archivado?',
                    cell: (pj: PersonajeSimple) => pj.Archivado,
                },
            ];
            this.dataSource = this.Personajes;
            this.displayedColumns = this.columns.map(c => c.columnDef);
        });
    }

    


    // campanias: Array<String> = ["Cualquiera", "Zoorvintal", "Los caballeros de cormyr", "El rey liche"];
    campanias: Campana[] = [
        { id: 0, nombre: "Cualquiera" },
        { id: 1, nombre: "Zoorvintal" },
        { id: 2, nombre: "Los caballeros de cormyr" },
        { id: 3, nombre: "El rey liche" }
    ];
    tramas: Array<String> = ["Cualquiera", "Prueba1", "Prueba2", "Prueba3", "Prueba4", "Prueba5"];

    personajeCampania = 2; //Representa la propiedad campaña de un objeto personaje.
    filterDefSelect = "0";

    anuncioArchivo: string = 'Clic para mostar pjs archivados';
    AlternarArchivados(value: string) {
        if (value === 'Clic para mostar pjs archivados')
            this.anuncioArchivo = 'Mostrando pjs archivados';
        else
            this.anuncioArchivo = 'Clic para mostar pjs archivados';
    }
}
