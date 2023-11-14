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
    nepDisclaimer: string = `
    NEP (Nivel efectivo de personaje)
    Suma del nivel de sus clases + DGs extra + Ajustes de nivel

    Este es el valor usado para determinar cosas como el oro inicial o el nivel de encuentro
    `;
    caDisclaimer: string = "Error";
    iniciativa: string = "0";
    presa: string = "0";
    fortaleza: string = "0";
    reflejos: string = "0";
    voluntad: string = "0";
    cLigera: string = "0 Kilogramos";
    cMedia: string = "0 Kilogramos";
    cPesada: string = "0 Kilogramos";
    velDisclaimer: string = `
    Medido en pies
    5 pies equivalen a una casilla
    `;
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
        this.cLigera = `${parseFloat((this.pj.Capacidad_carga.Ligera * 0.453592).toFixed(2))} Kilogramos`;
        this.cMedia = `${parseFloat((this.pj.Capacidad_carga.Media * 0.453592).toFixed(2))} Kilogramos`;
        const carga_pesada = parseFloat((this.pj.Capacidad_carga.Pesada * 0.453592).toFixed(2));
        this.cPesada = `
        ${carga_pesada} Kilogramos
        Levantar sobre la cabeza: ${this.pj.Capacidad_carga.Pesada} (${carga_pesada}KG)
        Levantar del suelo: ${this.pj.Capacidad_carga.Pesada * 2} (${carga_pesada * 2}KG)
        Empujar/Arrastrar: ${this.pj.Capacidad_carga.Pesada * 5} (${carga_pesada * 5}KG)
        `;
        this.caDisclaimer = `
        Armadura natural: ${this.pj.Armadura_natural > 0 ? this.pj.Armadura_natural : '0'}
        Desvio: ${this.pj.Ca_desvio > 0 ? this.pj.Ca_desvio : '0'}
        Varios: ${this.pj.Ca_varios > 0 ? this.pj.Ca_varios : '0'}
        `;
    }

    generarFicha() {
        this.fpSvc.generarPDF(this.pj);
    }

    getTooltip_Dotes(dote: any): string {
        return `${dote.Descripcion}

        Beneficio: ${dote.Beneficio}

        Origen: ${dote.Origen}`;
    }
      
}
