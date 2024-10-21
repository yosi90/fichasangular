import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { Personaje } from 'src/app/interfaces/personaje';
import { Raza } from 'src/app/interfaces/raza';

@Component({
    selector: 'app-nuevo-personaje',
    templateUrl: './nuevo-personaje.component.html',
    styleUrls: ['./nuevo-personaje.component.sass']
})
export class NuevoPersonajeComponent {
    Personaje!: Personaje;

    @ViewChild(MatTabGroup) TabGroup!: MatTabGroup;

    constructor() { }

    async ngOnInit(): Promise<void> {

    }

    @Output() razaDetalles: EventEmitter<Raza> = new EventEmitter<Raza>();
    verDetallesRaza(value: Raza) {
        this.razaDetalles.emit(value);
    }

    seleccionarRaza(value: Raza) {
        this.Personaje.Raza = value;
        this.TabGroup.selectedIndex = 1;
    }
}
