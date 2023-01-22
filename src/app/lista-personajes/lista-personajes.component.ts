import { Component } from '@angular/core';

interface Cam {
    id: number;
    nombre: string;
}

@Component({
    selector: 'app-lista-personajes',
    templateUrl: './lista-personajes.component.html',
    styleUrls: ['./lista-personajes.component.sass']
})
export class ListaPersonajesComponent {
    // campanias: Array<String> = ["Cualquiera", "Zoorvintal", "Los caballeros de cormyr", "El rey liche"];
    campanias: Cam[] = [
        {id:0, nombre:"Cualquiera"},
        {id:1, nombre:"Zoorvintal"},
        {id:2, nombre:"Los caballeros de cormyr"},
        {id:3, nombre:"El rey liche"}
    ];
    tramas: Array<String> = ["Cualquiera", "Prueba1", "Prueba2", "Prueba3", "Prueba4", "Prueba5"];

    personajeCampania = 2; //Representa la propiedad campaña de un objeto personaje.
    filtrosPerDefaultSelected = "0";
}
