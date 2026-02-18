import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AptitudSortilega } from 'src/app/interfaces/aptitud-sortilega';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContextual, DoteLegacy } from 'src/app/interfaces/dote-contextual';
import { CaracteristicaPerdidaKey, Personaje } from 'src/app/interfaces/personaje';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { FichaPersonajeService } from 'src/app/services/ficha-personaje.service';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';

interface MadurezEdadResumen {
    id: number;
    nombre: string;
    modFisico: number;
    modMental: number;
}

interface VentajaVisible {
    nombre: string;
    origen?: string;
}

@Component({
    selector: 'app-detalles-personaje',
    templateUrl: './detalles-personaje.component.html',
    styleUrls: ['./detalles-personaje.component.sass']
})
export class DetallesPersonajeComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() pj!: Personaje;
    @Input() mostrarBotonGenerarPdf = true;
    @Input() modoOcultarFaltantes = true;
    modoCompactoLayout = false;
    private resizeObserver: ResizeObserver | null = null;
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

    constructor(private fpSvc: FichaPersonajeService, private hostElement: ElementRef<HTMLElement>) { }

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

    ngAfterViewInit(): void {
        Promise.resolve().then(() => this.actualizarModoCompacto());
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.actualizarModoCompacto());
            this.resizeObserver.observe(this.hostElement.nativeElement);
        }
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        this.actualizarModoCompacto();
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
        const base = this.normalizarTexto(texto);
        if (!base)
            return false;
        const limpiado = base.replace(/[.]/g, '');
        if (limpiado === 'no modifica' || limpiado === 'no vuela')
            return false;
        if (!this.modoOcultarFaltantes)
            return limpiado.length > 0;
        return limpiado !== 'no especifica'
            && limpiado !== 'no se especifica'
            && limpiado !== 'no aplica'
            && limpiado !== 'nada'
            && limpiado !== 'sin genero'
            && limpiado !== 'no tener deidad'
            && limpiado !== '-'
            && limpiado !== 'desconocido'
            && limpiado !== 'cualquiera'
            && limpiado !== 'ninguna'
            && limpiado !== 'placeholder';
    }

    tieneNumeroVisible(value: number | string | null | undefined): boolean {
        const parsed = Number(value);
        if (!Number.isFinite(parsed))
            return false;
        if (!this.modoOcultarFaltantes)
            return true;
        return parsed > 0;
    }

    tieneNumeroNoCero(value: number | string | null | undefined): boolean {
        const parsed = Number(value);
        if (!Number.isFinite(parsed))
            return false;
        if (!this.modoOcultarFaltantes)
            return true;
        return Math.abs(parsed) > 0.0001;
    }

    tieneArrayVisible<T>(arr: T[] | undefined | null): boolean {
        return Array.isArray(arr) && arr.length > 0;
    }

    tienePersonajeNombreVisible(): boolean {
        return this.tieneTextoVisible(this.pj?.Nombre);
    }

    tieneGeneroVisible(): boolean {
        return this.tieneTextoVisible(this.pj?.Genero);
    }

    tieneAlineamientoVisible(): boolean {
        return this.tieneTextoVisible(this.pj?.Alineamiento);
    }

    tieneDeidadVisible(): boolean {
        return this.tieneTextoVisible(this.pj?.Deidad);
    }

    tieneExpVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Experiencia);
    }

    tieneNivelVisible(): boolean {
        return this.tieneNumeroVisible(this.nivelPersonaje);
    }

    tieneNepVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.NEP);
    }

    tieneAtaqueBaseVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Ataque_base as any);
    }

    tienePgVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Vida);
    }

    tieneCaVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Ca);
    }

    tieneOroVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Oro_inicial);
    }

    tieneRazaVisible(): boolean {
        return this.tieneTextoVisible(this.pj?.Raza?.Nombre);
    }

    tieneRazaBaseVisible(): boolean {
        return this.tieneTextoVisible(this.pj?.RazaBase?.Nombre);
    }

    tieneTamanoVisible(): boolean {
        return this.tieneTextoVisible(this.pj?.Raza?.Tamano?.Nombre);
    }

    tieneTipoCriaturaVisible(): boolean {
        return this.tieneTextoVisible(this.pj?.Tipo_criatura?.Nombre);
    }

    tieneAjusteNivelRazaVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Raza?.Ajuste_nivel);
    }

    tieneDgsRazaVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Raza?.Dgs_adicionales?.Cantidad);
    }

    tieneIniciativaVisible(): boolean {
        return this.tieneNumeroNoCero(this.iniciativa);
    }

    tienePresaVisible(): boolean {
        return this.tieneNumeroNoCero(this.presa);
    }

    tieneVelocidadVisible(valor: number): boolean {
        return this.tieneNumeroVisible(valor);
    }

    tieneCapacidadCargaVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Capacidad_carga?.Ligera)
            || this.tieneNumeroVisible(this.pj?.Capacidad_carga?.Media)
            || this.tieneNumeroVisible(this.pj?.Capacidad_carga?.Pesada);
    }

    tieneEdadVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Edad);
    }

    tieneAlturaVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Altura);
    }

    tienePesoVisible(): boolean {
        return this.tieneNumeroVisible(this.pj?.Peso);
    }

    tieneBloqueBiometriaVisible(): boolean {
        return this.tieneEdadVisible() || this.tieneAlturaVisible() || this.tienePesoVisible();
    }

    tieneRangosEdadRazaVisibles(): boolean {
        const raza = this.pj?.Raza;
        return this.tieneNumeroVisible(raza?.Edad_adulto)
            || this.tieneNumeroVisible(raza?.Edad_mediana)
            || this.tieneNumeroVisible(raza?.Edad_viejo)
            || this.tieneNumeroVisible(raza?.Edad_venerable);
    }

    tieneMadurezEdadVisible(): boolean {
        return this.tieneEdadVisible() && this.tieneRangosEdadRazaVisibles();
    }

    get madurezEdad(): MadurezEdadResumen {
        const edadActual = Number(this.pj?.Edad ?? 0);
        const mediana = Number(this.pj?.Raza?.Edad_mediana ?? 0);
        const viejo = Number(this.pj?.Raza?.Edad_viejo ?? 0);
        const venerable = Number(this.pj?.Raza?.Edad_venerable ?? 0);

        const id = mediana <= 0 || edadActual < mediana
            ? 0
            : edadActual < viejo
                ? 1
                : edadActual < venerable
                    ? 2
                    : 3;

        return {
            id,
            nombre: id === 0 ? 'Adulto' : id === 1 ? 'Mediana edad' : id === 2 ? 'Viejo' : 'Venerable',
            modFisico: id === 0 ? 0 : id === 1 ? -1 : id === 2 ? -3 : -6,
            modMental: id,
        };
    }

    getTooltipMadurezEdad(): string {
        const raza = this.pj?.Raza;
        const madurez = this.madurezEdad;
        return `Adulto: ${raza?.Edad_adulto ?? 0} | Mediana: ${raza?.Edad_mediana ?? 0} | Viejo: ${raza?.Edad_viejo ?? 0} | Venerable: ${raza?.Edad_venerable ?? 0}
Fue/Des/Con: ${this.formatSigned(madurez.modFisico)} | Int/Sab/Car: ${this.formatSigned(madurez.modMental)}`;
    }

    formatSigned(value: number): string {
        return value > 0 ? `+${value}` : `${value}`;
    }

    getSubtiposVisibles(): SubtipoRef[] {
        return (this.pj?.Subtipos ?? []).filter((s) => this.tieneTextoVisible(s?.Nombre));
    }

    tieneSubtiposVisibles(): boolean {
        return this.getSubtiposVisibles().length > 0;
    }

    getPlantillasVisibles() {
        return (this.pj?.Plantillas ?? []).filter((p: any) => this.tieneTextoVisible(p?.Nombre));
    }

    tieneBloqueSalvacionesVisible(): boolean {
        return this.fortaleza > 0
            || this.reflejos > 0
            || this.voluntad > 0
            || this.fortaleza_varios > 0
            || this.reflejos_varios > 0
            || this.voluntad_varios > 0;
    }

    tieneCaracteristicasVisibles(): boolean {
        if (!this.modoOcultarFaltantes)
            return true;

        const base = [this.pj.Fuerza, this.pj.Destreza, this.pj.Constitucion, this.pj.Inteligencia, this.pj.Sabiduria, this.pj.Carisma];
        const mods = [this.pj.ModFuerza, this.pj.ModDestreza, this.pj.ModConstitucion, this.pj.ModInteligencia, this.pj.ModSabiduria, this.pj.ModCarisma];
        const esBaseDefault = base.every(v => Number(v) === 10);
        const esModDefault = mods.every(v => Number(v) === 0);
        return !(esBaseDefault && esModDefault);
    }

    tieneCaracteristicaPerdida(key: CaracteristicaPerdidaKey): boolean {
        const perdidas = this.pj?.Caracteristicas_perdidas ?? {};
        const perdidaPorMapa = this.toBoolean((perdidas as Record<string, any>)?.[key]);
        if (key === 'Constitucion')
            return perdidaPorMapa || this.toBoolean(this.pj?.Constitucion_perdida);
        return perdidaPorMapa;
    }

    tienePersonalidadVisible(): boolean {
        const value = this.normalizarTexto(this.pj?.Personalidad ?? '');
        if (!this.tieneTextoVisible(value))
            return false;
        return value !== this.normalizarTexto('Rellena un fisco puto vago.');
    }

    tieneContextoVisible(): boolean {
        const value = this.normalizarTexto(this.pj?.Contexto ?? '');
        if (!this.tieneTextoVisible(value))
            return false;
        return value !== this.normalizarTexto('Eres totalmente antirol hijo mio.');
    }

    getClaseasVisibles() {
        return (this.pj?.Claseas ?? []).filter(c => this.tieneTextoVisible(c?.Nombre));
    }

    getExtraVisibleHabilidad(habilidad: Record<string, any> | null | undefined): string {
        const item = habilidad ?? {};
        const hasIdExtra = Object.prototype.hasOwnProperty.call(item, 'Id_extra')
            || Object.prototype.hasOwnProperty.call(item, 'id_extra')
            || Object.prototype.hasOwnProperty.call(item, 'i_ex')
            || Object.prototype.hasOwnProperty.call(item, 'ie');

        return resolverExtraHabilidadVisible({
            extra: item['Extra'] ?? item['extra'] ?? '',
            idExtra: item['Id_extra'] ?? item['id_extra'] ?? item['i_ex'] ?? item['ie'],
            soportaExtra: item['Soporta_extra'] ?? item['soporta_extra'] ?? ((item['Extras'] ?? item['extras'] ?? []).length > 0),
            allowIdZeroAsChoose: hasIdExtra,
        });
    }

    private toArray(value: any): any[] {
        if (Array.isArray(value))
            return value;
        if (value && typeof value === 'object')
            return Object.values(value);
        return [];
    }

    private toPositiveNumberOrNull(...values: any[]): number | null {
        for (const value of values) {
            const parsed = Number(value);
            if (Number.isFinite(parsed) && parsed > 0)
                return parsed;
        }
        return null;
    }

    getRacialesVisibles(): RacialReferencia[] {
        const racialesDesdePersonaje = this.toArray((this.pj as any)?.Raciales);
        const racialesFuente = racialesDesdePersonaje.length > 0
            ? racialesDesdePersonaje
            : this.toArray((this.pj as any)?.Raza?.Raciales);

        return racialesFuente
            .map((racial: RacialDetalle | string | Record<string, any>) => {
                if (typeof racial === 'string') {
                    return {
                        id: null,
                        nombre: racial.trim(),
                    };
                }

                const raw = racial as Record<string, any>;
                const origen = `${raw?.['Origen'] ?? raw?.['origen'] ?? raw?.['o'] ?? ''}`.trim();

                return {
                    id: this.toPositiveNumberOrNull(raw?.['Id'], raw?.['id'], raw?.['i']),
                    nombre: `${raw?.['Nombre'] ?? raw?.['nombre'] ?? raw?.['n'] ?? ''}`.trim(),
                    origen: origen.length > 0 ? origen : undefined,
                };
            })
            .filter(racial => this.tieneTextoVisible(racial.nombre));
    }

    trackByRacial = (_index: number, racial: RacialReferencia): string => {
        const id = Number(racial?.id);
        const nombre = `${racial?.nombre ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
        return `${Number.isFinite(id) && id > 0 ? id : 0}|${nombre}`;
    }

    getDotesVisibles() {
        return (this.pj?.Dotes ?? []).filter(d => this.tieneTextoVisible(d?.Nombre));
    }

    getIdiomasVisibles() {
        return (this.pj?.Idiomas ?? []).filter(i => this.tieneTextoVisible(i?.Nombre));
    }

    getDominiosVisibles() {
        return (this.pj?.Dominios ?? []).filter(d => this.tieneTextoVisible(`${d}`));
    }

    getConjurosVisibles() {
        return (this.pj?.Conjuros ?? []).filter(c => this.tieneTextoVisible(c?.Nombre));
    }

    getSortilegasVisibles() {
        return (this.pj?.Sortilegas ?? []).filter(s => this.tieneTextoVisible(s?.Conjuro?.Nombre));
    }

    getRasgosTipoVisibles() {
        return (this.pj?.Tipo_criatura?.Rasgos ?? []).filter(r => this.tieneTextoVisible(r?.Nombre));
    }

    getVentajasVisibles(): VentajaVisible[] {
        return (this.pj?.Ventajas ?? [])
            .map((ventaja) => {
                if (typeof ventaja === 'string') {
                    return {
                        nombre: ventaja.trim(),
                    };
                }

                return {
                    nombre: `${ventaja?.Nombre ?? ''}`.trim(),
                    origen: `${ventaja?.Origen ?? ''}`.trim() || undefined,
                };
            })
            .filter((v) => this.tieneTextoVisible(v.nombre));
    }

    getOrigenRasgoTipo(rasgo: Rasgo): string | null {
        const origen = `${rasgo?.Origen ?? ''}`.trim();
        if (this.tieneTextoVisible(origen))
            return origen;

        const origenTipo = `${this.pj?.Tipo_criatura?.Nombre ?? ''}`.trim();
        if (this.tieneTextoVisible(origenTipo))
            return origenTipo;

        return null;
    }

    getOrigenRacial(racial: RacialReferencia): string | null {
        const origen = `${racial?.origen ?? ''}`.trim();
        return this.tieneTextoVisible(origen) ? origen : null;
    }

    getOrigenDote(dote: DoteLegacy): string | null {
        const origen = `${dote?.Origen ?? ''}`.trim();
        return this.tieneTextoVisible(origen) ? origen : null;
    }

    getOrigenIdioma(idioma: { Origen?: string; }): string | null {
        const origen = `${idioma?.Origen ?? ''}`.trim();
        return this.tieneTextoVisible(origen) ? origen : null;
    }

    getOrigenVentaja(ventaja: VentajaVisible): string | null {
        const origen = `${ventaja?.origen ?? ''}`.trim();
        return this.tieneTextoVisible(origen) ? origen : null;
    }

    @Output() ventajaDetallesPorNombre: EventEmitter<{ nombre: string; origen?: string; }> = new EventEmitter<{ nombre: string; origen?: string; }>();
    verDetallesVentajaPorNombre(ventaja: VentajaVisible): void {
        const nombre = `${ventaja?.nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;

        const origen = `${ventaja?.origen ?? ''}`.trim();
        this.ventajaDetallesPorNombre.emit({
            nombre,
            origen: this.tieneTextoVisible(origen) ? origen : undefined,
        });
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
        const id = Number(idRaza);
        if (Number.isFinite(id) && id > 0)
            this.razaDetalles.emit(id);
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

    @Output() racialDetallesPorNombre: EventEmitter<RacialReferencia> = new EventEmitter<RacialReferencia>();
    verDetallesRacialPorNombre(racial: RacialReferencia) {
        const nombreRacial = `${racial?.nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombreRacial))
            return;

        this.racialDetallesPorNombre.emit({
            id: Number.isFinite(Number(racial?.id)) && Number(racial.id) > 0 ? Number(racial.id) : null,
            nombre: nombreRacial,
        });
    }

    @Output() plantillaDetalles: EventEmitter<{ id?: number | null; nombre: string; }> = new EventEmitter<{ id?: number | null; nombre: string; }>();
    verDetallesPlantilla(plantilla: any) {
        const nombre = `${plantilla?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;
        const id = Number(plantilla?.Id);
        this.plantillaDetalles.emit({
            id: Number.isFinite(id) && id > 0 ? id : null,
            nombre,
        });
    }

    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();
    verDetallesSubtipo(subtipo: SubtipoRef) {
        const nombre = `${subtipo?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;
        const id = Number(subtipo?.Id);
        this.subtipoDetalles.emit({
            Id: Number.isFinite(id) && id > 0 ? id : null,
            Nombre: nombre,
        });
    }

    private normalizarTexto(texto: string): string {
        return `${texto ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private toBoolean(value: any): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value === 1;
        if (typeof value === 'string') {
            const normalizado = value.trim().toLowerCase();
            return normalizado === '1' || normalizado === 'true' || normalizado === 'si' || normalizado === 'sí';
        }
        return false;
    }

    private actualizarModoCompacto(): void {
        const contenedor = this.hostElement.nativeElement.querySelector('.detalle-view') as HTMLElement | null;
        const width = (contenedor ?? this.hostElement.nativeElement).getBoundingClientRect().width;
        this.modoCompactoLayout = width > 0 && width <= 900;
    }
}
