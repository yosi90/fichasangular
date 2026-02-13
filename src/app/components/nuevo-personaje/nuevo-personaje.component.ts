import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { Campana, Super } from 'src/app/interfaces/campaña';
import { Personaje } from 'src/app/interfaces/personaje';
import { Raza } from 'src/app/interfaces/raza';
import { CampanaService } from 'src/app/services/campana.service';
import { AsignacionCaracteristicas, NuevoPersonajeService, StepNuevoPersonaje } from 'src/app/services/nuevo-personaje.service';
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
    selectedInternalTabIndex = 0;
    private campanasSub?: Subscription;
    @ViewChild(MatTabGroup) TabGroup?: MatTabGroup;

    constructor(private nuevoPSvc: NuevoPersonajeService, private campanaSvc: CampanaService) {
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
    }

    ngOnInit(): void {
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.normalizarAlineamientoSeleccionado();
        this.sincronizarTabConPaso();
        this.recalcularOficialidad();
        this.cargarCampanas();
    }

    ngOnDestroy(): void {
        this.campanasSub?.unsubscribe();
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

    get razaElegida(): boolean {
        return this.nuevoPSvc.RazaSeleccionada !== null;
    }

    get razaSeleccionada(): Raza | null {
        return this.nuevoPSvc.RazaSeleccionada;
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
        this.Personaje.Oficial = razaEsOficial && deidadEsOficial && inconsistencias.length === 0;
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

        this.abrirModalCaracteristicas();
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
        this.nuevoPSvc.actualizarPasoActual('plantillas');
        this.sincronizarTabConPaso();
    }

    private sincronizarTabConPaso(): void {
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

    seleccionarRaza(value: Raza) {
        this.nuevoPSvc.seleccionarRaza(value);
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.normalizarAlineamientoSeleccionado();
        this.recalcularOficialidad();
        this.irABasicos();
    }
}
