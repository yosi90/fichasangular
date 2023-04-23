import { Component, Input, OnInit } from '@angular/core';
import { Personaje } from 'src/app/interfaces/personaje';
import { FichaPersonajeService } from 'src/app/services/ficha-personaje.service';

@Component({
    selector: 'app-detalles-personaje',
    templateUrl: './detalles-personaje.component.html',
    styleUrls: ['./detalles-personaje.component.sass']
})
export class DetallesPersonajeComponent implements OnInit {
    @Input() pj!: Personaje;
    Habilidades: { Nombre: string; Mod_car: number; Rangos: number; Rangos_varios: number; Extra: string; Varios: string; }[] = [];

    constructor(private fpSvc: FichaPersonajeService) { }

    ngOnInit(): void {
        this.Habilidades = this.pj.Habilidades.filter(h => h.Rangos + h.Rangos_varios > 0);
    }

    generarFicha(){
        this.fpSvc.generarPDF(this.pj);
    }
}
