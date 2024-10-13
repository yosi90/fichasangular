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

    Este es el valor usado para determinar cosas como el oro inicial o el nivel de encuentro`;
    caDisclaimer: string = "Error";
    iniciativa: string = "0";
    presa: string = "0";
    fortaleza = 0;
    fortaleza_origenes: string = "";
    fortaleza_varios = 0;
    fortaleza_varios_origenes: string = "";
    reflejos = 0;
    reflejos_origenes: string = "";
    reflejos_varios = 0;
    reflejos_varios_origenes: string = "";
    voluntad = 0;
    voluntad_origenes: string = "";
    voluntad_varios = 0;
    voluntad_varios_origenes: string = "";
    cLigera: string = "0 Kilogramos";
    cMedia: string = "0 Kilogramos";
    cPesada: string = "0 Kilogramos";
    velDisclaimer: string = `
    Medido en pies
    5 pies equivalen a una casilla`;
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
        this.fortaleza = this.pj.Salvaciones.fortaleza.modsClaseos.map(m => m.valor).reduce((c, v) => c + v, 0) ?? 0;
        this.fortaleza_origenes = this.pj.Salvaciones.fortaleza.modsClaseos.filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.fortaleza_varios = this.pj.Salvaciones.fortaleza.modsVarios.map(m => m.valor).reduce((c, v) => c + v, 0) ?? 0;
        this.fortaleza_varios_origenes = this.pj.Salvaciones.fortaleza.modsVarios.filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.reflejos = this.pj.Salvaciones.reflejos.modsClaseos.map(m => m.valor).reduce((c, v) => c + v, 0) ?? 0;
        this.reflejos_origenes = this.pj.Salvaciones.reflejos.modsClaseos.filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.reflejos_varios = this.pj.Salvaciones.reflejos.modsVarios.map(m => m.valor).reduce((c, v) => c + v, 0) ?? 0;
        this.reflejos_varios_origenes = this.pj.Salvaciones.reflejos.modsVarios.filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.voluntad = this.pj.Salvaciones.voluntad.modsClaseos.map(m => m.valor).reduce((c, v) => c + v, 0) ?? 0;
        this.voluntad_origenes = this.pj.Salvaciones.voluntad.modsClaseos.filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.voluntad_varios = this.pj.Salvaciones.voluntad.modsVarios.map(m => m.valor).reduce((c, v) => c + v, 0) ?? 0;
        this.voluntad_varios_origenes = this.pj.Salvaciones.voluntad.modsVarios.filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.cLigera = `${parseFloat((this.pj.Capacidad_carga.Ligera * 0.453592).toFixed(2))} Kilogramos`;
        this.cMedia = `${parseFloat((this.pj.Capacidad_carga.Media * 0.453592).toFixed(2))} Kilogramos`;
        const carga_pesada = parseFloat((this.pj.Capacidad_carga.Pesada * 0.453592).toFixed(2));
        this.cPesada = `
        ${carga_pesada} Kilogramos
        Levantar sobre la cabeza: ${this.pj.Capacidad_carga.Pesada} (${carga_pesada}KG)
        Levantar del suelo: ${this.pj.Capacidad_carga.Pesada * 2} (${(carga_pesada * 2).toFixed(2)}KG)
        Empujar/Arrastrar: ${this.pj.Capacidad_carga.Pesada * 5} (${(carga_pesada * 5).toFixed(2)}KG)
        `;
        this.caDisclaimer = `
        Armadura natural: ${this.pj.Armadura_natural > 0 ? this.pj.Armadura_natural : '0'}
        Desvio: ${this.pj.Ca_desvio > 0 ? this.pj.Ca_desvio : '0'}
        Varios: ${this.pj.Ca_varios > 0 ? this.pj.Ca_varios : '0'}
        `;
    }

    generarFicha() {
        this.fpSvc.generarPDF(this.pj);
        if(this.pj.Conjuros.length > 0 || this.pj.Sortilegas.length > 0)
            this.fpSvc.generarPDF_Conjuros(this.pj);
    }

    getTooltip_simples(titular: string, texto: string): string {
        return `${titular} ${texto}`;
    }

    getTooltip_Dotes(dote: any): string {
        return `${dote.Descripcion}

        Beneficio: ${dote.Beneficio}

        Origen: ${dote.Origen}`;
    }

    getTooltip_Conjuros(conjuro: any): string {
        return `${conjuro.Manual} - ${conjuro.Pagina}
        
        ${conjuro.Descripcion}
        
        ${conjuro.Oficial == 1 ? 'Contenido Homebrew' : ''}`;
    }   

    getTooltip_Sortilegas(sortilega: any): string {
        return `Usos diarios: ${sortilega.Usos}
        Dgs necesarios para usarlo: ${sortilega.Dgs_necesarios}
        Nivel de lanzador de: ${sortilega.Nivel_lanzador}
        Origen: ${sortilega.Origen}
        
        ${sortilega.Manual} - ${sortilega.Pagina}
        
        ${sortilega.Descripcion}
        
        ${sortilega.Oficial == 1 ? 'Contenido Homebrew' : ''}`;
    }    
}
