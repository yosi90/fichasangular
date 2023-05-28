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
    iniciativa: string = "0";
    presa: string = "0";
    fortaleza: string = "0";
    reflejos: string = "0";
    voluntad: string = "0";
    Habilidades: { Nombre: string; Mod_car: number; Rangos: number; Rangos_varios: number; Extra: string; Varios: string; }[] = [];

    constructor(private fpSvc: FichaPersonajeService) { }

    ngOnInit(): void {
        if(this.pj.Habilidades)
            this.Habilidades = this.pj.Habilidades.filter(h => h.Rangos + h.Rangos_varios > 0 || h.Varios != "");
        this.iniciativa = `${this.pj.ModDestreza}`;
        if(this.pj.Iniciativa_varios){
            const ini_v = this.pj.Iniciativa_varios.reduce((c, v) => c + v.Valor, 0);
            this.iniciativa = ini_v > 0 ? ` +${ini_v}` : ` ${ini_v}`;
        }
        this.presa = `${this.pj.Presa}`;
        if(this.pj.Presa_varios){
            const pr_v = this.pj.Presa_varios.reduce((c, v) => c + v.Valor, 0);
            this.presa = pr_v > 0 ? ` +${pr_v}` : ` ${pr_v}`;
        }
        if (this.pj.Salvaciones.fortaleza.modsClaseos)
            this.fortaleza = (this.pj.Salvaciones.fortaleza.modsClaseos.valor.reduce((c, v) => c + v, 0) + this.pj.ModConstitucion).toString();
        if (this.pj.Salvaciones.fortaleza.modsVarios)
            this.fortaleza += ` + ${this.pj.Salvaciones.fortaleza.modsVarios.valor.reduce((c, v) => c + v, 0)}`;
        if (this.pj.Salvaciones.reflejos.modsClaseos)
            this.reflejos = (this.pj.Salvaciones.reflejos.modsClaseos.valor.reduce((c, v) => c + v, 0) + this.pj.ModDestreza).toString();
        if (this.pj.Salvaciones.reflejos.modsVarios)
            this.reflejos += ` + ${this.pj.Salvaciones.reflejos.modsVarios.valor.reduce((c, v) => c + v, 0)}`;
        if (this.pj.Salvaciones.voluntad.modsClaseos)
            this.voluntad = (this.pj.Salvaciones.voluntad.modsClaseos.valor.reduce((c, v) => c + v, 0) + this.pj.ModSabiduria).toString();
        if (this.pj.Salvaciones.voluntad.modsVarios)
            this.voluntad += ` + ${this.pj.Salvaciones.voluntad.modsVarios.valor.reduce((c, v) => c + v, 0)}`;
    }

    generarFicha() {
        this.fpSvc.generarPDF(this.pj);
    }
}
