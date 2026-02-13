import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AptitudSortilega } from 'src/app/interfaces/aptitud-sortilega';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContextual, DoteLegacy } from 'src/app/interfaces/dote-contextual';
import { Personaje } from 'src/app/interfaces/personaje';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { FichaPersonajeService } from 'src/app/services/ficha-personaje.service';

@Component({
    selector: 'app-detalles-personaje',
    templateUrl: './detalles-personaje.component.html',
    styleUrls: ['./detalles-personaje.component.sass']
})
export class DetallesPersonajeComponent implements OnInit {
    @Input() pj!: Personaje;
    nivelPersonaje = 0;
    nivelDisclaimer: string = `
    Nivel de personaje
    Suma de niveles de clase + ajustes de nivel (raza y plantillas)

    No incluye DGs raciales adicionales`;
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
        this.nivelPersonaje = this.getNivelPersonaje();
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
        this.fortaleza = this.sumarMods(this.pj.Salvaciones?.fortaleza?.modsClaseos);
        this.fortaleza_origenes = (this.pj.Salvaciones?.fortaleza?.modsClaseos ?? []).filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.fortaleza_varios = this.sumarMods(this.pj.Salvaciones?.fortaleza?.modsVarios);
        this.fortaleza_varios_origenes = (this.pj.Salvaciones?.fortaleza?.modsVarios ?? []).filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.reflejos = this.sumarMods(this.pj.Salvaciones?.reflejos?.modsClaseos);
        this.reflejos_origenes = (this.pj.Salvaciones?.reflejos?.modsClaseos ?? []).filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.reflejos_varios = this.sumarMods(this.pj.Salvaciones?.reflejos?.modsVarios);
        this.reflejos_varios_origenes = (this.pj.Salvaciones?.reflejos?.modsVarios ?? []).filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.voluntad = this.sumarMods(this.pj.Salvaciones?.voluntad?.modsClaseos);
        this.voluntad_origenes = (this.pj.Salvaciones?.voluntad?.modsClaseos ?? []).filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
        this.voluntad_varios = this.sumarMods(this.pj.Salvaciones?.voluntad?.modsVarios);
        this.voluntad_varios_origenes = (this.pj.Salvaciones?.voluntad?.modsVarios ?? []).filter(m => m.origen != "" && m.origen != "Placeholder").map(m => m.origen).join(', ') ?? "";
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

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private sumarMods(mods: { valor: number, origen: string }[] | undefined): number {
        return (mods ?? []).reduce((c, v) => c + this.toNumber(v?.valor), 0);
    }

    private getNivelPersonaje(): number {
        const nivelesClase = (this.pj?.desgloseClases ?? []).reduce((c, clase) => c + this.toNumber(clase?.Nivel), 0);
        const ajusteRaza = this.toNumber(this.pj?.Raza?.Ajuste_nivel);
        const ajustesPlantillas = (this.pj?.Plantillas ?? []).reduce((c, p) => c + this.toNumber(p?.Ajuste_nivel), 0);
        return nivelesClase + ajusteRaza + ajustesPlantillas;
    }

    tieneTextoVisible(texto: string | undefined | null): boolean {
        if (!texto)
            return false;
        const base = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        if (!base)
            return false;
        const limpiado = base.replace(/[.]/g, '');
        return limpiado !== 'no especifica' && limpiado !== 'no se especifica' && limpiado !== 'no aplica' && limpiado !== 'nada';
    }

    getClaseasVisibles() {
        return (this.pj?.Claseas ?? []).filter(c => this.tieneTextoVisible(c?.Nombre));
    }

    getNombreRacial(racial: any): string {
        if (typeof racial === 'string')
            return racial;
        return racial?.Nombre ?? '';
    }

    getRacialesVisibles() {
        return (this.pj?.Raciales ?? [])
            .map(racial => this.getNombreRacial(racial))
            .filter(nombre => this.tieneTextoVisible(nombre));
    }

    toDoteContextualFallback(dote: DoteLegacy): DoteContextual {
        const fallbackDote: Dote = {
            Id: 0,
            Nombre: dote.Nombre,
            Descripcion: dote.Descripcion,
            Beneficio: dote.Beneficio,
            Normal: "No especifica",
            Especial: "No especifica",
            Manual: {
                Id: 0,
                Nombre: "Desconocido",
                Pagina: dote.Pagina ?? 0,
            },
            Tipos: [],
            Repetible: 0,
            Repetible_distinto_extra: 0,
            Repetible_comb: 0,
            Comp_arma: 0,
            Oficial: true,
            Extras_soportados: {
                Extra_arma: 0,
                Extra_armadura: 0,
                Extra_escuela: 0,
                Extra_habilidad: 0,
            },
            Extras_disponibles: {
                Armas: [],
                Armaduras: [],
                Escuelas: [],
                Habilidades: [],
            },
            Modificadores: {},
            Prerrequisitos: {},
        };

        return {
            Dote: fallbackDote,
            Contexto: {
                Entidad: 'personaje',
                Id_personaje: this.pj.Id,
                Id_extra: -1,
                Extra: dote.Extra ?? 'No aplica',
                Origen: dote.Origen ?? 'Desconocido',
            }
        };
    }

    @Output() doteDetalles: EventEmitter<DoteContextual> = new EventEmitter<DoteContextual>();
    verDetallesDote(dote: DoteLegacy) {
        if (this.pj.DotesContextuales && this.pj.DotesContextuales.length > 0) {
            const contextual = this.pj.DotesContextuales.find(dc =>
                dc.Dote.Nombre === dote.Nombre &&
                (dc.Contexto.Extra ?? 'No aplica') === (dote.Extra ?? 'No aplica')
            );
            if (contextual) {
                this.doteDetalles.emit(contextual);
                return;
            }
        }
        this.doteDetalles.emit(this.toDoteContextualFallback(dote));
    }
    
    @Output() conjuroDetalles: EventEmitter<Conjuro> = new EventEmitter<Conjuro>();
    verDetallesConjuro(value: Conjuro) {
        this.conjuroDetalles.emit(value);
    }
    
    @Output() sortilegaDetalles: EventEmitter<AptitudSortilega> = new EventEmitter<AptitudSortilega>();
    verDetallesSortilega(value: AptitudSortilega) {
        if(this.pj.Sortilegas)
            this.sortilegaDetalles.emit(value);
    }

    @Output() tipoDetalles: EventEmitter<TipoCriatura> = new EventEmitter<TipoCriatura>();
    verDetallesTipoCriatura(value: TipoCriatura) {
        this.tipoDetalles.emit(value);
    }

    @Output() razaDetalles: EventEmitter<number> = new EventEmitter<number>();
    verDetallesRaza(idRaza: number) {
        if (Number.isFinite(idRaza) && idRaza > 0)
            this.razaDetalles.emit(idRaza);
    }

    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    verDetallesRasgo(value: Rasgo) {
        this.rasgoDetalles.emit(value);
    }

    @Output() claseDetalles: EventEmitter<string> = new EventEmitter<string>();
    verDetallesClase(nombreClase: string) {
        if (nombreClase && nombreClase.trim().length > 0)
            this.claseDetalles.emit(nombreClase.trim());
    }

    @Output() especialDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    verDetallesEspecialPorNombre(nombreEspecial: string) {
        if (!this.tieneTextoVisible(nombreEspecial))
            return;
        this.especialDetallesPorNombre.emit(nombreEspecial.trim());
    }

    @Output() racialDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    verDetallesRacialPorNombre(nombreRacial: string) {
        if (!this.tieneTextoVisible(nombreRacial))
            return;
        this.racialDetallesPorNombre.emit(nombreRacial.trim());
    }
}
