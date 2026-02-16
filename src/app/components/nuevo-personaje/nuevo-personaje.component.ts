import { Component, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { Campana, Super } from 'src/app/interfaces/campaña';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { Personaje } from 'src/app/interfaces/personaje';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { Raza } from 'src/app/interfaces/raza';
import { RacialReferencia } from 'src/app/interfaces/racial';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { CampanaService } from 'src/app/services/campana.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { AsignacionCaracteristicas, NuevoPersonajeService, StepNuevoPersonaje } from 'src/app/services/nuevo-personaje.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { VentajaService } from 'src/app/services/ventaja.service';
import { PlantillaEvaluacionResultado, evaluarElegibilidadPlantilla } from 'src/app/services/utils/plantilla-elegibilidad';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-nuevo-personaje',
    templateUrl: './nuevo-personaje.component.html',
    styleUrls: ['./nuevo-personaje.component.sass']
})
export class NuevoPersonajeComponent {
    readonly placeholderContexto = 'De donde viene tu personaje, cual es su familia, linaje, maestros, etc. Esto te ayudara a saber como deberia reaccionar tu personaje ante diversos estimulos.';
    readonly placeholderPersonalidad = 'Altivo, compasivo, incapaz de estarse quieto, maduro o incomprendido. Dale adjetivos a tu personaje para reforzar su interpretacion.';
    readonly fallbackContexto = 'Eres totalmente antirol hijo mio.';
    readonly fallbackPersonalidad = 'Rellena un fisco puto vago.';
    readonly alineamientos: string[] = [
        'Legal bueno',
        'Legal neutral',
        'Legal maligno',
        'Neutral bueno',
        'Neutral autentico',
        'Neutral maligno',
        'Caotico bueno',
        'Caotico neutral',
        'Caotico maligno',
    ];
    readonly generos: string[] = [
        'Macho',
        'Hembra',
        'Hermafrodita',
        'Sin genero',
    ];
    readonly deidadesSugeridas: string[] = [
        'No tener deidad',
        'Pelor',
        'Heironeous',
        'St. Cuthbert',
        'Boccob',
        'Kord',
        'Olidammara',
        'Wee Jas',
        'Moradin',
        'Corellon Larethian',
        'Gruumsh',
        'Yondalla',
    ];
    readonly deidadesOficiales: string[] = [
        'No tener deidad',
        'Pelor',
        'Heironeous',
        'St. Cuthbert',
        'Boccob',
        'Kord',
        'Olidammara',
        'Wee Jas',
        'Moradin',
        'Corellon Larethian',
        'Gruumsh',
        'Yondalla',
    ];
    readonly alineamientoPorDeidad: Record<string, string> = {
        'pelor': 'Neutral bueno',
        'heironeous': 'Legal bueno',
        'st. cuthbert': 'Legal neutral',
        'boccob': 'Neutral autentico',
        'kord': 'Caotico bueno',
        'olidammara': 'Caotico neutral',
        'wee jas': 'Legal neutral',
        'moradin': 'Legal bueno',
        'corellon larethian': 'Caotico bueno',
        'gruumsh': 'Caotico maligno',
        'yondalla': 'Legal bueno',
        'no tener deidad': 'Neutral autentico',
    };
    readonly descripcionPorDeidad: Record<string, string> = {
        'pelor': 'Deidad de la luz y la curacion, asociada a ideales benevolos.',
        'heironeous': 'Deidad del valor y la justicia, defensora del honor.',
        'st. cuthbert': 'Deidad del castigo justo, la disciplina y el orden.',
        'boccob': 'Deidad del conocimiento arcano y la magia imparcial.',
        'kord': 'Deidad de la fuerza, la batalla y el coraje.',
        'olidammara': 'Deidad de los bardos, la libertad y los tramposos.',
        'wee jas': 'Deidad de la magia, la muerte y el orden arcano.',
        'moradin': 'Deidad enana de la forja, la tradicion y la comunidad.',
        'corellon larethian': 'Deidad elfica de la magia, el arte y la guerra.',
        'gruumsh': 'Deidad orca de la conquista y la destruccion.',
        'yondalla': 'Deidad halfling de la proteccion y la prosperidad.',
    };

    Personaje!: Personaje;
    Campanas: Campana[] = [];
    Tramas: Super[] = [];
    Subtramas: Super[] = [];
    plantillasCatalogo: Plantilla[] = [];
    plantillasElegibles: Plantilla[] = [];
    plantillasBloqueadasUnknown: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];
    plantillasBloqueadasFailed: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];
    readonly mostrarDiagnosticoPlantillas = !environment.production;
    filtroPlantillasTexto: string = '';
    filtroPlantillasManual: string = 'Cualquiera';
    incluirHomebrewPlantillas: boolean = false;
    cargandoPlantillas: boolean = true;
    incluirHomebrewVentajas: boolean = false;
    incluirHomebrewIdiomas: boolean = false;
    private homebrewForzadoPorJugador: boolean = false;
    private homebrewBloqueadoVentajas: boolean = false;
    private controlHomebrewVentajasInicializado: boolean = false;
    catalogoVentajas: VentajaDetalle[] = [];
    catalogoDesventajas: VentajaDetalle[] = [];
    catalogoIdiomas: IdiomaDetalle[] = [];
    cargandoVentajas: boolean = true;
    cargandoIdiomas: boolean = true;
    private ventajaPendienteIdiomaId: number | null = null;
    modalSelectorIdiomaAbierto = false;
    ventanaDetalleAbierta = false;
    private contextoSelectorIdioma: 'ventaja' | 'idiomasIniciales' | null = null;
    selectorIdiomaTitulo = 'Seleccionar idioma extra';
    selectorIdiomaCantidadObjetivo = 0;
    selectorIdiomaCantidadSeleccionada = 0;
    selectorIdiomaBloquearCierre = false;
    private idiomasTemporalesSeleccionados: IdiomaDetalle[] = [];
    selectedInternalTabIndex = 0;
    private campanasSub?: Subscription;
    private plantillasSub?: Subscription;
    private ventajasSub?: Subscription;
    private desventajasSub?: Subscription;
    private habilidadesSub?: Subscription;
    private habilidadesCustomSub?: Subscription;
    private idiomasSub?: Subscription;
    @ViewChild(MatTabGroup) TabGroup?: MatTabGroup;

    constructor(
        private nuevoPSvc: NuevoPersonajeService,
        private campanaSvc: CampanaService,
        private plantillaSvc: PlantillaService,
        private ventajaSvc: VentajaService,
        private habilidadSvc: HabilidadService,
        private idiomaSvc: IdiomaService
    ) {
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
    }

    ngOnInit(): void {
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.normalizarAlineamientoSeleccionado();
        this.sincronizarTabConPaso();
        this.recalcularOficialidad();
        this.cargarCampanas();
        this.cargarPlantillas();
        this.cargarVentajasDesventajas();
        this.cargarHabilidadesBase();
        this.cargarHabilidadesCustom();
        this.cargarIdiomas();
    }

    ngOnDestroy(): void {
        this.campanasSub?.unsubscribe();
        this.plantillasSub?.unsubscribe();
        this.ventajasSub?.unsubscribe();
        this.desventajasSub?.unsubscribe();
        this.habilidadesSub?.unsubscribe();
        this.habilidadesCustomSub?.unsubscribe();
        this.idiomasSub?.unsubscribe();
    }

    get flujo() {
        return this.nuevoPSvc.EstadoFlujo;
    }

    get caracteristicasGeneradas(): boolean {
        return this.flujo.caracteristicasGeneradas;
    }

    get modalCaracteristicasAbierto(): boolean {
        return this.flujo.modalCaracteristicasAbierto;
    }

    get tituloVentanaDetalle(): string {
        const nombre = `${this.Personaje?.Nombre ?? ''}`.trim();
        return `${nombre.length > 0 ? nombre : 'Sin nombre'} - En creación`;
    }

    get razaElegida(): boolean {
        return this.nuevoPSvc.RazaSeleccionada !== null;
    }

    get razaSeleccionada(): Raza | null {
        return this.nuevoPSvc.RazaSeleccionada;
    }

    get plantillasSeleccionadas(): Plantilla[] {
        return this.flujo.plantillas.seleccionadas;
    }

    get tipoCriaturaSimuladaTexto(): string {
        return this.flujo.plantillas.tipoCriaturaSimulada.Nombre;
    }

    get mostrarTipoCriaturaResultante(): boolean {
        const raza = this.razaSeleccionada;
        if (!raza)
            return false;

        const tipoBaseId = Number(raza.Tipo_criatura?.Id ?? 0);
        const tipoSimuladoId = Number(this.flujo.plantillas.tipoCriaturaSimulada.Id ?? 0);

        if (!Number.isFinite(tipoBaseId) || !Number.isFinite(tipoSimuladoId))
            return false;

        return tipoBaseId > 0 && tipoSimuladoId > 0 && tipoBaseId !== tipoSimuladoId;
    }

    get manualesPlantillas(): string[] {
        const manuales = this.plantillasCatalogo
            .map(p => p.Manual?.Nombre ?? '')
            .filter(nombre => nombre.trim().length > 0);
        return ['Cualquiera', ...Array.from(new Set(manuales)).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
    }

    get mostrarBloquePlantillas(): boolean {
        return this.caracteristicasGeneradas;
    }

    get flujoVentajas() {
        return this.flujo.ventajas;
    }

    get ventajasSeleccionadasCount(): number {
        return this.flujoVentajas.seleccionVentajas.length;
    }

    get puedeContinuarVentajas(): boolean {
        return this.nuevoPSvc.puedeContinuarDesdeVentajas() && this.idiomasPendientesSelector < 1;
    }

    get personajeNoOficial(): boolean {
        return this.Personaje.Oficial === false;
    }

    get homebrewForzado(): boolean {
        return this.personajeNoOficial;
    }

    get homebrewVentajasSeleccionado(): boolean {
        return this.homebrewBloqueadoVentajas || this.homebrewForzadoPorJugador;
    }

    get homebrewVentajasBloqueado(): boolean {
        return this.homebrewBloqueadoVentajas;
    }

    get incluirHomebrewPlantillasEfectivo(): boolean {
        return this.homebrewForzado || this.incluirHomebrewPlantillas;
    }

    get incluirHomebrewVentajasEfectivo(): boolean {
        return this.homebrewForzado || this.incluirHomebrewVentajas;
    }

    get textoChipHomebrewVentajas(): string {
        return this.homebrewBloqueadoVentajas
            ? 'El personaje es Homebrew'
            : this.homebrewForzadoPorJugador
                ? 'Cancelar homebrew y limpiar ventajas'
            : 'Convertir en personaje Homebrew para listar las ventajas';
    }

    get incluirHomebrewIdiomasEfectivo(): boolean {
        return this.homebrewForzado || this.incluirHomebrewIdiomas;
    }

    get ventajasVisibles(): VentajaDetalle[] {
        return this.catalogoVentajas.filter(v => this.incluirHomebrewVentajasEfectivo || v.Oficial !== false);
    }

    get desventajasVisibles(): VentajaDetalle[] {
        return this.catalogoDesventajas.filter(v => this.incluirHomebrewVentajasEfectivo || v.Oficial !== false);
    }

    get idiomasSeleccionadosParaVentajas(): string[] {
        return this.Personaje.Idiomas.map(i => i.Nombre);
    }

    get idiomasSeleccionadosParaSelector(): string[] {
        const nombres = this.Personaje.Idiomas.map(i => i.Nombre);
        if (this.contextoSelectorIdioma === 'idiomasIniciales') {
            this.idiomasTemporalesSeleccionados.forEach((i) => nombres.push(i.Nombre));
        }

        const vistos = new Set<string>();
        const resultado: string[] = [];
        nombres.forEach((nombre) => {
            const clave = this.normalizarTexto(nombre);
            if (clave.length < 1 || vistos.has(clave))
                return;
            vistos.add(clave);
            resultado.push(nombre);
        });
        return resultado;
    }

    get idiomasPendientesSelector(): number {
        const objetivo = Math.max(0, Math.trunc(Number(this.selectorIdiomaCantidadObjetivo) || 0));
        const seleccionada = Math.max(0, Math.trunc(Number(this.selectorIdiomaCantidadSeleccionada) || 0));
        return Math.max(0, objetivo - seleccionada);
    }

    get deidadesFiltradas(): string[] {
        const texto = this.Personaje.Deidad?.trim().toLowerCase() ?? '';
        if (texto.length < 1) {
            return this.deidadesSugeridas;
        }
        return this.deidadesSugeridas.filter(d => d.toLowerCase().includes(texto));
    }

    get puedeContinuarBasicos(): boolean {
        return this.esTextoNoVacio(this.Personaje.Nombre)
            && this.esTextoNoVacio(this.Personaje.Genero)
            && this.esTextoNoVacio(this.Personaje.Deidad)
            && this.esTextoNoVacio(this.Personaje.Campana)
            && this.esTextoNoVacio(this.Personaje.Trama)
            && this.esTextoNoVacio(this.Personaje.Subtrama)
            && this.esNumeroValidoPositivo(this.Personaje.Edad)
            && this.esNumeroValidoPositivo(this.Personaje.Peso)
            && this.esNumeroValidoPositivo(this.Personaje.Altura);
    }

    get campanaTieneTramas(): boolean {
        if (this.Personaje.Campana === 'Sin campaña') {
            return false;
        }
        return this.Tramas.length > 0;
    }

    get tramaTieneSubtramas(): boolean {
        if (!this.campanaTieneTramas || this.Personaje.Trama === 'Trama base') {
            return false;
        }
        return this.Subtramas.length > 0;
    }

    get preferenciaLeyRaza(): string {
        const valor = this.razaSeleccionada?.Alineamiento?.Ley?.Nombre?.trim();
        return valor && valor.length > 0 ? valor : 'No especificada';
    }

    get preferenciaMoralRaza(): string {
        const valor = this.razaSeleccionada?.Alineamiento?.Moral?.Nombre?.trim();
        return valor && valor.length > 0 ? valor : 'No especificada';
    }

    get alineamientoBaseRaza(): string {
        const valor = this.razaSeleccionada?.Alineamiento?.Basico?.Nombre?.trim();
        return valor && valor.length > 0 ? valor : 'No especificado';
    }

    get rangoEdadTexto(): string {
        const raza = this.razaSeleccionada;
        if (!raza) {
            return 'Sin datos de edad';
        }
        return `Adulto: ${raza.Edad_adulto} | Mediana: ${raza.Edad_mediana} | Viejo: ${raza.Edad_viejo} | Venerable: ${raza.Edad_venerable}`;
    }

    get etapaEdadActual(): string {
        const raza = this.razaSeleccionada;
        const edad = this.Personaje.Edad;
        if (!raza || edad <= 0) {
            return 'Sin definir';
        }
        if (edad < raza.Edad_adulto) {
            return 'Joven';
        }
        if (edad < raza.Edad_mediana) {
            return 'Adulto';
        }
        if (edad < raza.Edad_viejo) {
            return 'Mediana edad';
        }
        if (edad <= raza.Edad_venerable) {
            return 'Viejo';
        }
        return 'Fuera de rango tipico';
    }

    get edadMensajeContextual(): string {
        const raza = this.razaSeleccionada;
        const edad = this.Personaje.Edad;
        if (!raza || edad <= 0) {
            return 'Introduce una edad para ver su etapa vital aproximada.';
        }
        if (edad < raza.Edad_adulto) {
            return 'Tu personaje aun no alcanza la edad adulta tipica de su raza.';
        }
        if (edad < raza.Edad_mediana) {
            return 'Tu personaje esta en edad adulta temprana.';
        }
        if (edad < raza.Edad_viejo) {
            return 'Tu personaje esta en mediana edad.';
        }
        if (edad <= raza.Edad_venerable) {
            return 'Tu personaje esta en una etapa avanzada de su vida.';
        }
        return 'La edad supera el valor venerable tipico de la raza.';
    }

    get edadFueraRango(): boolean {
        const raza = this.razaSeleccionada;
        const edad = Number(this.Personaje.Edad);
        const min = Number(raza?.Edad_adulto);
        const max = Number(raza?.Edad_venerable);
        const epsilon = 0.0001;

        if (!raza || Number.isNaN(edad) || Number.isNaN(min) || Number.isNaN(max) || edad <= 0) {
            return false;
        }
        return edad < (min - epsilon) || edad > (max + epsilon);
    }

    get pesoFueraRango(): boolean {
        const raza = this.razaSeleccionada;
        const peso = Number(this.Personaje.Peso);
        const min = Number(raza?.Peso_rango_inf);
        const max = Number(raza?.Peso_rango_sup);
        const epsilon = 0.0001;

        if (!raza || Number.isNaN(peso) || Number.isNaN(min) || Number.isNaN(max) || peso <= 0) {
            return false;
        }
        return peso < (min - epsilon) || peso > (max + epsilon);
    }

    get alturaFueraRango(): boolean {
        const raza = this.razaSeleccionada;
        const altura = Number(this.Personaje.Altura);
        const min = Number(raza?.Altura_rango_inf);
        const max = Number(raza?.Altura_rango_sup);
        const epsilon = 0.0001;

        if (!raza || Number.isNaN(altura) || Number.isNaN(min) || Number.isNaN(max) || altura <= 0) {
            return false;
        }
        return altura < (min - epsilon) || altura > (max + epsilon);
    }

    get mostrarPanelDeidad(): boolean {
        return !this.esDeidadVaciaONeutra();
    }

    get deidadSeleccionadaTexto(): string {
        const deidad = this.Personaje.Deidad?.trim();
        return deidad && deidad.length > 0 ? deidad : 'Sin deidad';
    }

    get deidadAlineamientoInfo(): string {
        return this.getAlineamientoDeidad() ?? 'No disponible en el catalogo local';
    }

    get deidadOficialidadInfo(): string {
        return this.esDeidadOficial() ? 'Oficial' : 'No oficial';
    }

    get deidadDescripcionInfo(): string {
        const key = this.normalizarTexto(this.Personaje.Deidad ?? '');
        return this.descripcionPorDeidad[key] ?? 'No hay detalles adicionales de esta deidad en el catalogo local.';
    }

    private normalizarTexto(valor: string): string {
        return (valor ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private isVentanaDetalleHabilitada(): boolean {
        const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const height = typeof window !== 'undefined' ? window.innerHeight : 720;
        return !(width <= 1250 || height <= 700 || height >= width);
    }

    private esDeidadVaciaONeutra(): boolean {
        const deidad = this.normalizarTexto(this.Personaje.Deidad ?? '');
        return deidad.length < 1 || deidad === this.normalizarTexto('No tener deidad');
    }

    private esDeidadOficial(): boolean {
        if (this.esDeidadVaciaONeutra()) {
            return true;
        }
        const deidadActual = this.normalizarTexto(this.Personaje.Deidad ?? '');
        return this.deidadesOficiales.some(d => this.normalizarTexto(d) === deidadActual);
    }

    private getAlineamientoDeidad(): string | null {
        const deidad = this.normalizarTexto(this.Personaje.Deidad ?? '');
        if (deidad.length < 1) {
            return null;
        }
        return this.alineamientoPorDeidad[deidad] ?? null;
    }

    private getVectorAlineamiento(nombre: string): { ley: number; moral: number; } | null {
        const value = this.normalizarTexto(nombre);
        const tabla: Record<string, { ley: number; moral: number; }> = {
            'legal bueno': { ley: 1, moral: 1 },
            'legal neutral': { ley: 1, moral: 0 },
            'legal maligno': { ley: 1, moral: -1 },
            'neutral bueno': { ley: 0, moral: 1 },
            'neutral autentico': { ley: 0, moral: 0 },
            'neutral maligno': { ley: 0, moral: -1 },
            'caotico bueno': { ley: -1, moral: 1 },
            'caotico neutral': { ley: -1, moral: 0 },
            'caotico maligno': { ley: -1, moral: -1 },
        };
        return tabla[value] ?? null;
    }

    private distanciaAlineamiento(a: string, b: string): number | null {
        const a1 = this.getVectorAlineamiento(a);
        const b1 = this.getVectorAlineamiento(b);
        if (!a1 || !b1) {
            return null;
        }
        return Math.abs(a1.ley - b1.ley) + Math.abs(a1.moral - b1.moral);
    }

    getInconsistenciasManual(): string[] {
        const inconsistencias: string[] = [];
        const deidadIngresada = this.Personaje.Deidad?.trim() ?? '';

        if (this.edadFueraRango) {
            inconsistencias.push(`Edad fuera de rango: ${this.Personaje.Edad} (tipico ${this.razaSeleccionada?.Edad_adulto}-${this.razaSeleccionada?.Edad_venerable}).`);
        }
        if (this.pesoFueraRango) {
            inconsistencias.push(`Peso fuera de rango: ${this.Personaje.Peso} kg (tipico ${this.razaSeleccionada?.Peso_rango_inf}-${this.razaSeleccionada?.Peso_rango_sup} kg).`);
        }
        if (this.alturaFueraRango) {
            inconsistencias.push(`Altura fuera de rango: ${this.Personaje.Altura} m (tipico ${this.razaSeleccionada?.Altura_rango_inf}-${this.razaSeleccionada?.Altura_rango_sup} m).`);
        }

        if (!this.esDeidadOficial()) {
            inconsistencias.push(`Deidad no oficial: ${deidadIngresada}.`);
        }

        if (!this.esDeidadVaciaONeutra()) {
            const alineamientoDeidad = this.getAlineamientoDeidad();
            if (alineamientoDeidad) {
                const distancia = this.distanciaAlineamiento(this.Personaje.Alineamiento, alineamientoDeidad);
                if (distancia !== null && distancia > 1) {
                    inconsistencias.push(`Alineamiento incompatible con deidad: ${this.Personaje.Alineamiento} vs ${deidadIngresada} (${alineamientoDeidad}).`);
                }
            }
        }

        return inconsistencias;
    }

    recalcularOficialidad(): void {
        const razaEsOficial = this.razaSeleccionada?.Oficial === true;
        const deidadEsOficial = this.esDeidadOficial();
        const inconsistencias = this.getInconsistenciasManual();
        const tieneVentajasODesventajas = this.flujoVentajas.seleccionVentajas.length > 0
            || this.flujoVentajas.seleccionDesventajas.length > 0;
        this.Personaje.Oficial = !this.homebrewForzadoPorJugador
            && razaEsOficial
            && deidadEsOficial
            && inconsistencias.length === 0
            && !tieneVentajasODesventajas;
    }

    async continuarDesdeBasicos(): Promise<void> {
        if (!this.razaElegida || !this.puedeContinuarBasicos) {
            return;
        }

        this.normalizarAlineamientoSeleccionado();
        if (!this.esTextoNoVacio(this.Personaje.Contexto)) {
            this.Personaje.Contexto = this.fallbackContexto;
        }
        if (!this.esTextoNoVacio(this.Personaje.Personalidad)) {
            this.Personaje.Personalidad = this.fallbackPersonalidad;
        }

        this.recalcularOficialidad();
        const inconsistencias = this.getInconsistenciasManual();
        if (inconsistencias.length > 0) {
            const htmlListado = `<ul style="text-align:left; margin-top: 8px;">${inconsistencias.map(i => `<li>${i}</li>`).join('')}</ul>`;
            const result = await Swal.fire({
                title: 'Tus elecciones van en contra de los manuales',
                html: `Cancelar para cambiarlas o aceptar si tu master lo permite.${htmlListado}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Aceptar y continuar',
                cancelButtonText: 'Cancelar',
            });

            if (!result.isConfirmed) {
                return;
            }
        }

        if (this.isVentanaDetalleHabilitada()) {
            this.ventanaDetalleAbierta = true;
        }
        this.abrirModalCaracteristicas();
    }

    @HostListener('window:resize')
    onViewportResize(): void {
        if (!this.isVentanaDetalleHabilitada() && this.ventanaDetalleAbierta) {
            this.ventanaDetalleAbierta = false;
        }
    }

    async onSolicitarCerrarVentanaDetalle(): Promise<void> {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Cerrar nuevo personaje',
            text: 'Si cierras esta ventana, también se cerrará la pestaña de nuevo personaje y se perderán los datos.',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar todo',
            cancelButtonText: 'Cancelar',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });

        if (!result.isConfirmed) {
            return;
        }

        this.ventanaDetalleAbierta = false;
        this.cerrarNuevoPersonajeSolicitado.emit();
    }

    abrirModalCaracteristicas(): void {
        this.nuevoPSvc.abrirModalCaracteristicas();
    }

    cerrarModalCaracteristicas(): void {
        this.nuevoPSvc.cerrarModalCaracteristicas();
    }

    finalizarGeneracionCaracteristicas(asignaciones: AsignacionCaracteristicas): void {
        const aplicado = this.nuevoPSvc.aplicarCaracteristicasGeneradas(asignaciones);
        if (!aplicado) {
            Swal.fire({
                icon: 'warning',
                title: 'No se puede finalizar',
                text: 'Faltan características por asignar.',
                showConfirmButton: true,
            });
            return;
        }

        this.recalcularOficialidad();
        this.recalcularPlantillasVisibles();
        this.sincronizarTabConPaso();
    }

    irABasicos(): void {
        if (!this.razaElegida) {
            return;
        }
        this.nuevoPSvc.actualizarPasoActual('basicos');
        this.sincronizarTabConPaso();
    }

    irAPlantillas(): void {
        if (!this.caracteristicasGeneradas) {
            return;
        }
        this.recalcularPlantillasVisibles();
        this.nuevoPSvc.actualizarPasoActual('plantillas');
        this.sincronizarTabConPaso();
    }

    private sincronizarTabConPaso(): void {
        this.inicializarControlHomebrewVentajasSiAplica();
        this.selectedInternalTabIndex = this.mapearPasoAIndex(this.flujo.pasoActual);
    }

    onInternalTabIndexChange(index: number): void {
        if (index === this.selectedInternalTabIndex) {
            return;
        }
        Promise.resolve().then(() => {
            if (this.TabGroup) {
                this.TabGroup.selectedIndex = this.selectedInternalTabIndex;
            }
        });
    }

    private mapearPasoAIndex(paso: StepNuevoPersonaje): number {
        if (paso === 'basicos') {
            return 1;
        }
        if (paso === 'plantillas') {
            return 2;
        }
        if (paso === 'ventajas') {
            return 3;
        }
        return 0;
    }

    private esTextoNoVacio(value: string): boolean {
        return (value ?? '').trim().length > 0;
    }

    private esNumeroValidoPositivo(value: number): boolean {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0;
    }

    compararAlineamiento = (a: string | null, b: string | null): boolean => {
        return this.normalizarTexto(a ?? '') === this.normalizarTexto(b ?? '');
    };

    private normalizarAlineamientoSeleccionado(): void {
        const actual = this.Personaje.Alineamiento ?? '';
        const normalizado = this.normalizarTexto(actual);
        const encontrado = this.alineamientos.find(a => this.normalizarTexto(a) === normalizado);

        if (encontrado) {
            this.Personaje.Alineamiento = encontrado;
            return;
        }

        this.Personaje.Alineamiento = this.alineamientos[0] ?? 'Legal bueno';
    }

    private async cargarCampanas() {
        this.campanasSub = (await this.campanaSvc.getListCampanas()).subscribe(campanas => {
            this.Campanas = campanas;
            this.actualizarTramas();
        });
    }

    actualizarTramas(): void {
        if (this.Personaje.Campana === 'Sin campaña') {
            this.Tramas = [];
            this.Subtramas = [];
            this.Personaje.Trama = 'Trama base';
            this.Personaje.Subtrama = 'Subtrama base';
            return;
        }

        const campanaSeleccionada = this.Campanas.find(c => c.Nombre === this.Personaje.Campana);
        this.Tramas = campanaSeleccionada?.Tramas.map(t => ({
            Id: t.Id,
            Nombre: t.Nombre
        })) ?? [];

        if (this.Tramas.length < 1) {
            this.Subtramas = [];
            this.Personaje.Trama = 'Trama base';
            this.Personaje.Subtrama = 'Subtrama base';
            return;
        }

        if (!this.Tramas.find(t => t.Nombre === this.Personaje.Trama)) {
            this.Personaje.Trama = this.Tramas[0].Nombre;
        }

        this.actualizarSubtramas();
    }

    actualizarSubtramas(): void {
        if (this.Personaje.Campana === 'Sin campaña') {
            this.Subtramas = [];
            this.Personaje.Subtrama = 'Subtrama base';
            return;
        }

        const campanaSeleccionada = this.Campanas.find(c => c.Nombre === this.Personaje.Campana);
        const tramaSeleccionada = campanaSeleccionada?.Tramas.find(t => t.Nombre === this.Personaje.Trama);
        this.Subtramas = tramaSeleccionada?.Subtramas.map(s => ({
            Id: s.Id,
            Nombre: s.Nombre
        })) ?? [];

        if (this.Subtramas.length < 1) {
            this.Personaje.Subtrama = 'Subtrama base';
            return;
        }

        if (!this.Subtramas.find(s => s.Nombre === this.Personaje.Subtrama)) {
            this.Personaje.Subtrama = this.Subtramas[0].Nombre;
        }
    }

    @Output() razaDetalles: EventEmitter<Raza> = new EventEmitter<Raza>();
    verDetallesRaza(value: Raza) {
        this.razaDetalles.emit(value);
    }

    @Output() plantillaDetalles: EventEmitter<Plantilla> = new EventEmitter<Plantilla>();
    verDetallesPlantilla(value: Plantilla): void {
        this.plantillaDetalles.emit(value);
    }

    @Output() racialDetallesPorNombre: EventEmitter<RacialReferencia> = new EventEmitter<RacialReferencia>();
    verDetallesRacialDesdeReferencia(referencia: RacialReferencia): void {
        const id = Number(referencia?.id);
        const nombre = `${referencia?.nombre ?? ''}`.trim();
        if (!Number.isFinite(id) && nombre.length < 1)
            return;

        this.racialDetallesPorNombre.emit({
            id: Number.isFinite(id) && id > 0 ? id : null,
            nombre,
        });
    }

    @Output() cerrarNuevoPersonajeSolicitado: EventEmitter<void> = new EventEmitter<void>();

    seleccionarRaza(value: Raza) {
        this.nuevoPSvc.seleccionarRaza(value);
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.ventanaDetalleAbierta = false;
        this.normalizarAlineamientoSeleccionado();
        this.recalcularOficialidad();
        this.recalcularPlantillasVisibles();
        this.irABasicos();
    }

    alternarHomebrewPlantillas(): void {
        if (this.homebrewForzado) {
            return;
        }
        this.incluirHomebrewPlantillas = !this.incluirHomebrewPlantillas;
        this.recalcularPlantillasVisibles();
    }

    onFiltroPlantillasTextoChange(value: string): void {
        this.filtroPlantillasTexto = value ?? '';
        this.recalcularPlantillasVisibles();
    }

    onFiltroPlantillasManualChange(value: string): void {
        this.filtroPlantillasManual = value ?? 'Cualquiera';
        this.recalcularPlantillasVisibles();
    }

    seleccionarPlantilla(plantilla: Plantilla): void {
        const agregado = this.nuevoPSvc.agregarPlantillaSeleccion(plantilla);
        if (!agregado)
            return;
        this.recalcularPlantillasVisibles();
    }

    quitarPlantillaSeleccion(idPlantilla: number): void {
        this.nuevoPSvc.quitarPlantillaSeleccion(idPlantilla);
        this.recalcularPlantillasVisibles();
    }

    limpiarSeleccionPlantillas(): void {
        this.nuevoPSvc.limpiarPlantillasSeleccion();
        this.recalcularPlantillasVisibles();
    }

    continuarDesdePlantillas(): void {
        if (!this.caracteristicasGeneradas) {
            return;
        }

        this.nuevoPSvc.actualizarPasoActual('ventajas');
        this.inicializarControlHomebrewVentajasSiAplica();
        this.sincronizarTabConPaso();
    }

    continuarDesdeVentajas(): void {
        if (!this.puedeContinuarVentajas) {
            return;
        }
        this.nuevoPSvc.actualizarPasoActual('ventajas');
    }

    getTooltipBloqueoUnknown(item: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }): string {
        const razones = item.evaluacion.razones.join(' | ');
        const advertencias = item.evaluacion.advertencias.join(' | ');
        if (razones && advertencias)
            return `${razones} | ${advertencias}`;
        return razones || advertencias || 'No se pudo evaluar por completo esta plantilla';
    }

    alternarHomebrewVentajas(): void {
        this.inicializarControlHomebrewVentajasSiAplica();
        if (this.homebrewBloqueadoVentajas)
            return;

        if (!this.homebrewForzadoPorJugador) {
            this.homebrewForzadoPorJugador = true;
            this.incluirHomebrewVentajas = true;
            this.incluirHomebrewPlantillas = true;
            this.incluirHomebrewIdiomas = true;
            this.recalcularOficialidad();
            return;
        }

        this.homebrewForzadoPorJugador = false;
        this.incluirHomebrewVentajas = false;
        this.incluirHomebrewPlantillas = false;
        this.incluirHomebrewIdiomas = false;
        this.nuevoPSvc.limpiarVentajasDesventajas();
        this.cerrarSelectorIdiomaContexto();
        this.recalcularOficialidad();
    }

    abrirInfoVentajasHomebrew(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        Swal.fire({
            target: document.body,
            icon: 'info',
            title: 'Ventajas y desventajas (homebrew)',
            width: 560,
            html: `
                <p style="text-align:left; margin-bottom:10px;">
                    El sistema de ventajas y desventajas es un añadido homebrew para enriquecer la experiencia de juego
                    y, sobre todo, el roleo de los personajes.
                </p>
                <p style="text-align:left; margin-bottom:10px;">
                    La idea no es conseguir personajes más poderosos, sino darle sabor al roleo. Si solo te importan
                    los combates, te recomendamos no usar esta funcionalidad.
                </p>
                <p style="text-align:left; margin-bottom:4px;"><strong>Sistema de ventajas:</strong></p>
                <ul style="text-align:left; padding-left:18px; margin:0;">
                    <li>Cada personaje puede tener un máximo de tres ventajas.</li>
                    <li>Cada ventaja cuesta puntos de ventaja.</li>
                    <li>Obtienes esos puntos eligiendo desventajas para tu personaje.</li>
                </ul>
            `,
            confirmButtonText: 'Entendido',
        });
    }

    alternarHomebrewIdiomas(): void {
        if (this.homebrewForzado)
            return;
        this.incluirHomebrewIdiomas = !this.incluirHomebrewIdiomas;
    }

    isVentajaSeleccionada(idVentaja: number): boolean {
        return this.flujoVentajas.seleccionVentajas.some(v => v.id === idVentaja);
    }

    isDesventajaSeleccionada(idDesventaja: number): boolean {
        return this.flujoVentajas.seleccionDesventajas.some(v => v.id === idDesventaja);
    }

    tieneIdiomaPendiente(ventaja: VentajaDetalle): boolean {
        if (!ventaja.Idioma_extra)
            return false;
        const seleccion = this.flujoVentajas.seleccionVentajas.find(v => v.id === ventaja.Id);
        return !!seleccion && !seleccion.idioma;
    }

    toggleVentajaSeleccion(ventaja: VentajaDetalle): void {
        const resultado = this.nuevoPSvc.toggleVentaja(ventaja.Id);
        if (!resultado.toggled) {
            if (resultado.reason === 'max_reached') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Límite de ventajas alcanzado',
                    text: 'Solo puedes seleccionar hasta 3 ventajas.',
                    showConfirmButton: true,
                });
            }
            return;
        }

        if (resultado.selected && resultado.requiresIdiomaSelection) {
            this.abrirSelectorIdiomaParaVentaja(ventaja.Id);
        }

        this.recalcularOficialidad();
    }

    toggleDesventajaSeleccion(desventaja: VentajaDetalle): void {
        this.nuevoPSvc.toggleDesventaja(desventaja.Id);
        this.recalcularOficialidad();
    }

    onCerrarModalIdioma(): void {
        if (this.contextoSelectorIdioma === 'idiomasIniciales' && this.idiomasPendientesSelector > 0)
            return;

        const pendiente = this.ventajaPendienteIdiomaId;
        const eraContextoVentaja = this.contextoSelectorIdioma === 'ventaja';
        this.cerrarSelectorIdiomaContexto();

        if (!eraContextoVentaja || pendiente === null)
            return;

        const seleccion = this.flujoVentajas.seleccionVentajas.find(v => v.id === pendiente);
        if (seleccion && !seleccion.idioma) {
            this.nuevoPSvc.quitarSeleccionVentaja(pendiente);
            this.recalcularOficialidad();
        }
    }

    onConfirmarIdiomaVentaja(idioma: IdiomaDetalle): void {
        if (this.contextoSelectorIdioma === 'idiomasIniciales') {
            const agregado = this.agregarIdiomaInicialTemporal(idioma);
            if (!agregado) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No se pudo asignar el idioma',
                    text: 'Ese idioma ya está seleccionado o no es válido para esta selección.',
                    showConfirmButton: true,
                });
                return;
            }

            this.selectorIdiomaCantidadSeleccionada = this.idiomasTemporalesSeleccionados.length;
            if (this.idiomasPendientesSelector < 1) {
                this.cerrarSelectorIdiomaContexto();
            }
            return;
        }

        const pendiente = this.ventajaPendienteIdiomaId;
        if (pendiente === null)
            return;

        const asignado = this.nuevoPSvc.seleccionarIdiomaParaVentaja(pendiente, idioma);
        if (!asignado) {
            Swal.fire({
                icon: 'warning',
                title: 'No se pudo asignar el idioma',
                text: 'Ese idioma ya está seleccionado o no es válido para esta ventaja.',
                showConfirmButton: true,
            });
            return;
        }

        this.cerrarSelectorIdiomaContexto();
        this.recalcularOficialidad();
    }

    onCambioHomebrewModalIdiomas(value: boolean): void {
        if (this.homebrewForzado)
            return;
        this.incluirHomebrewIdiomas = value;
    }

    abrirSelectorIdiomasIniciales(cantidad: number): void {
        const objetivo = Math.max(0, Math.trunc(Number(cantidad) || 0));
        if (objetivo < 1) {
            this.cerrarSelectorIdiomaContexto();
            return;
        }

        this.contextoSelectorIdioma = 'idiomasIniciales';
        this.selectorIdiomaTitulo = 'Seleccionar idiomas iniciales';
        this.selectorIdiomaCantidadObjetivo = objetivo;
        this.selectorIdiomaCantidadSeleccionada = 0;
        this.selectorIdiomaBloquearCierre = true;
        this.idiomasTemporalesSeleccionados = [];
        this.modalSelectorIdiomaAbierto = true;
    }

    private abrirSelectorIdiomaParaVentaja(idVentaja: number): void {
        this.contextoSelectorIdioma = 'ventaja';
        this.ventajaPendienteIdiomaId = idVentaja;
        this.selectorIdiomaTitulo = 'Seleccionar idioma de ventaja';
        this.selectorIdiomaCantidadObjetivo = 1;
        this.selectorIdiomaCantidadSeleccionada = 0;
        this.selectorIdiomaBloquearCierre = false;
        this.modalSelectorIdiomaAbierto = true;
    }

    private cerrarSelectorIdiomaContexto(): void {
        this.modalSelectorIdiomaAbierto = false;
        this.ventajaPendienteIdiomaId = null;
        this.contextoSelectorIdioma = null;
        this.selectorIdiomaTitulo = 'Seleccionar idioma extra';
        this.selectorIdiomaCantidadObjetivo = 0;
        this.selectorIdiomaCantidadSeleccionada = 0;
        this.selectorIdiomaBloquearCierre = false;
    }

    private agregarIdiomaInicialTemporal(idioma: IdiomaDetalle): boolean {
        const nombre = `${idioma?.Nombre ?? ''}`.trim();
        if (nombre.length < 1 || !!idioma.Secreto)
            return false;

        const yaExiste = this.idiomasSeleccionadosParaSelector
            .some((n) => this.normalizarTexto(n) === this.normalizarTexto(nombre));
        if (yaExiste)
            return false;

        this.idiomasTemporalesSeleccionados.push({ ...idioma });
        this.Personaje.Idiomas = [
            ...this.Personaje.Idiomas,
            {
                Nombre: nombre,
                Descripcion: `${idioma.Descripcion ?? ''}`,
                Secreto: !!idioma.Secreto,
                Oficial: !!idioma.Oficial,
            },
        ];
        return true;
    }

    getMateriaVentaja(item: VentajaDetalle): string {
        const caracteristicas: string[] = [];
        if (item.Fuerza)
            caracteristicas.push('Fuerza');
        if (item.Destreza)
            caracteristicas.push('Destreza');
        if (item.Constitucion)
            caracteristicas.push('Constitucion');
        if (item.Inteligencia)
            caracteristicas.push('Inteligencia');
        if (item.Sabiduria)
            caracteristicas.push('Sabiduria');
        if (item.Carisma)
            caracteristicas.push('Carisma');
        if (caracteristicas.length > 0)
            return caracteristicas.join(', ');

        const salvaciones: string[] = [];
        if (item.Fortaleza)
            salvaciones.push('Fortaleza');
        if (item.Reflejos)
            salvaciones.push('Reflejos');
        if (item.Voluntad)
            salvaciones.push('Voluntad');
        if (salvaciones.length > 0)
            return salvaciones.join(', ');

        if (item.Iniciativa)
            return 'Iniciativa';
        if ((item.Habilidad?.Nombre ?? '').trim().length > 0)
            return item.Habilidad.Nombre;
        if ((item.Idioma?.Nombre ?? '').trim().length > 0)
            return item.Idioma.Nombre;
        if ((item.Rasgo?.Nombre ?? '').trim().length > 0)
            return item.Rasgo.Nombre;
        if (item.Duplica_oro || item.Aumenta_oro)
            return 'Oro inicial';
        return '-';
    }

    getMejoraTexto(item: VentajaDetalle): string {
        const valor = Number(item.Mejora ?? 0);
        if (!Number.isFinite(valor) || valor === 0)
            return '-';
        return valor > 0 ? `+${valor}` : `${valor}`;
    }

    getMateriaVisible(item: VentajaDetalle): string {
        const materia = `${this.getMateriaVentaja(item) ?? ''}`.trim();
        return this.normalizarTexto(materia) === 'elegir' ? '' : materia;
    }

    getMejoraVisible(item: VentajaDetalle): string {
        const mejora = `${this.getMejoraTexto(item) ?? ''}`.trim();
        return mejora === '-' ? '' : mejora;
    }

    getDisipableVisible(item: VentajaDetalle): string {
        return item.Disipable ? 'Si' : '';
    }

    private cargarPlantillas(): void {
        this.cargandoPlantillas = true;
        this.plantillasSub?.unsubscribe();
        this.plantillasSub = this.plantillaSvc.getPlantillas().subscribe({
            next: (plantillas) => {
                this.plantillasCatalogo = plantillas;
                this.nuevoPSvc.setPlantillasDisponibles(plantillas);
                this.recalcularPlantillasVisibles();
                this.cargandoPlantillas = false;
            },
            error: () => {
                this.plantillasCatalogo = [];
                this.plantillasElegibles = [];
                this.plantillasBloqueadasUnknown = [];
                this.plantillasBloqueadasFailed = [];
                this.cargandoPlantillas = false;
            },
        });
    }

    private cargarVentajasDesventajas(): void {
        this.cargandoVentajas = true;
        this.ventajasSub?.unsubscribe();
        this.desventajasSub?.unsubscribe();

        this.ventajasSub = this.ventajaSvc.getVentajas().subscribe({
            next: (ventajas) => {
                this.catalogoVentajas = ventajas;
                this.nuevoPSvc.setCatalogosVentajas(this.catalogoVentajas, this.catalogoDesventajas);
                this.cargandoVentajas = false;
            },
            error: () => {
                this.catalogoVentajas = [];
                this.nuevoPSvc.setCatalogosVentajas([], this.catalogoDesventajas);
                this.cargandoVentajas = false;
            },
        });

        this.desventajasSub = this.ventajaSvc.getDesventajas().subscribe({
            next: (desventajas) => {
                this.catalogoDesventajas = desventajas;
                this.nuevoPSvc.setCatalogosVentajas(this.catalogoVentajas, this.catalogoDesventajas);
                this.cargandoVentajas = false;
            },
            error: () => {
                this.catalogoDesventajas = [];
                this.nuevoPSvc.setCatalogosVentajas(this.catalogoVentajas, []);
                this.cargandoVentajas = false;
            },
        });
    }

    private inicializarControlHomebrewVentajasSiAplica(): void {
        if (this.controlHomebrewVentajasInicializado)
            return;
        if (this.flujo.pasoActual !== 'ventajas')
            return;

        this.controlHomebrewVentajasInicializado = true;
        this.homebrewBloqueadoVentajas = this.Personaje.Oficial === false;
        this.homebrewForzadoPorJugador = false;

        if (this.homebrewBloqueadoVentajas) {
            this.incluirHomebrewVentajas = true;
            this.incluirHomebrewPlantillas = true;
            this.incluirHomebrewIdiomas = true;
        }
    }

    private cargarHabilidadesBase(): void {
        this.habilidadesSub?.unsubscribe();
        this.habilidadesSub = this.habilidadSvc.getHabilidades().subscribe({
            next: (habilidades: HabilidadBasicaDetalle[]) => {
                this.nuevoPSvc.setCatalogoHabilidades(habilidades);
            },
            error: () => {
                this.nuevoPSvc.setCatalogoHabilidades([]);
            },
        });
    }

    private cargarHabilidadesCustom(): void {
        this.habilidadesCustomSub?.unsubscribe();
        this.habilidadesCustomSub = this.habilidadSvc.getHabilidadesCustom().subscribe({
            next: (habilidades: HabilidadBasicaDetalle[]) => {
                this.nuevoPSvc.setCatalogoHabilidadesCustom(habilidades);
            },
            error: () => {
                this.nuevoPSvc.setCatalogoHabilidadesCustom([]);
            },
        });
    }

    private cargarIdiomas(): void {
        this.cargandoIdiomas = true;
        this.idiomasSub?.unsubscribe();
        this.idiomasSub = this.idiomaSvc.getIdiomas().subscribe({
            next: (idiomas) => {
                this.catalogoIdiomas = idiomas;
                this.nuevoPSvc.setCatalogoIdiomas(idiomas);
                this.cargandoIdiomas = false;
            },
            error: () => {
                this.catalogoIdiomas = [];
                this.nuevoPSvc.setCatalogoIdiomas([]);
                this.cargandoIdiomas = false;
            },
        });
    }

    private recalcularPlantillasVisibles(): void {
        const raza = this.razaSeleccionada;
        if (!raza) {
            this.plantillasElegibles = [];
            this.plantillasBloqueadasUnknown = [];
            this.plantillasBloqueadasFailed = [];
            return;
        }

        const search = this.normalizarTexto(this.filtroPlantillasTexto);
        const porManual = this.filtroPlantillasManual;

        const ctx = {
            alineamiento: this.Personaje.Alineamiento,
            caracteristicas: {
                Fuerza: Number(this.Personaje.Fuerza),
                Destreza: Number(this.Personaje.Destreza),
                Constitucion: Number(this.Personaje.Constitucion),
                Inteligencia: Number(this.Personaje.Inteligencia),
                Sabiduria: Number(this.Personaje.Sabiduria),
                Carisma: Number(this.Personaje.Carisma),
            },
            tamanoRazaId: Number(raza.Tamano?.Id ?? 0),
            tipoCriaturaActualId: Number(this.flujo.plantillas.tipoCriaturaSimulada.Id ?? 0),
            razaHeredada: !!raza.Heredada,
            incluirHomebrew: this.incluirHomebrewPlantillasEfectivo,
            seleccionadas: this.plantillasSeleccionadas.map(p => ({
                Id: Number(p.Id),
                Nombre: p.Nombre,
                Nacimiento: !!p.Nacimiento,
            })),
        };

        const elegibles: Plantilla[] = [];
        const bloqueadasUnknown: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];
        const bloqueadasFailed: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];

        this.plantillasCatalogo.forEach((plantilla) => {
            const nombre = this.normalizarTexto(plantilla.Nombre);
            if (search.length > 0 && !nombre.includes(search))
                return;

            if (porManual !== 'Cualquiera' && (plantilla.Manual?.Nombre ?? '') !== porManual)
                return;

            const evaluacion = evaluarElegibilidadPlantilla(plantilla, ctx);
            if (evaluacion.estado === 'eligible') {
                elegibles.push(plantilla);
                return;
            }

            if (evaluacion.estado === 'blocked_unknown') {
                bloqueadasUnknown.push({ plantilla, evaluacion });
                return;
            }

            if (evaluacion.estado === 'blocked_failed') {
                bloqueadasFailed.push({ plantilla, evaluacion });
            }
        });

        this.plantillasElegibles = elegibles;
        this.plantillasBloqueadasUnknown = bloqueadasUnknown;
        this.plantillasBloqueadasFailed = bloqueadasFailed;
    }
}
