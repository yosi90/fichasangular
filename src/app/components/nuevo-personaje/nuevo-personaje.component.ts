import { Component, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { Campana, Super } from 'src/app/interfaces/campaña';
import { AlineamientoBasicoCatalogItem } from 'src/app/interfaces/alineamiento';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { DominioDetalle } from 'src/app/interfaces/dominio';
import { Clase, ClaseDoteNivel, ClaseEspecialNivel } from 'src/app/interfaces/clase';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { Personaje } from 'src/app/interfaces/personaje';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { Raza } from 'src/app/interfaces/raza';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { CampanaService } from 'src/app/services/campana.service';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ClaseService } from 'src/app/services/clase.service';
import { DeidadService } from 'src/app/services/deidad.service';
import { DominioService } from 'src/app/services/dominio.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import {
    AsignacionCaracteristicas,
    ClaseDominiosPendientes,
    ClaseGrupoOpcionalPendiente,
    NuevoPersonajeService,
    SeleccionDominiosClase,
    SeleccionOpcionalesClase,
    StepNuevoPersonaje,
} from 'src/app/services/nuevo-personaje.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RazaService } from 'src/app/services/raza.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { VentajaService } from 'src/app/services/ventaja.service';
import { PlantillaEvaluacionResultado, evaluarElegibilidadPlantilla, resolverAlineamientoPlantillas } from 'src/app/services/utils/plantilla-elegibilidad';
import { buildIdentidadPrerrequisitos, extraerIdsPositivos } from 'src/app/services/utils/identidad-prerrequisitos';
import { GrupoRacialesOpcionales, SeleccionRacialesOpcionales, agruparRacialesPorOpcional, getClaveSeleccionRacial } from 'src/app/services/utils/racial-opcionales';
import { RacialEvaluacionResultado, evaluarRacialParaSeleccion } from 'src/app/services/utils/racial-prerrequisitos';
import { ClaseEvaluacionResultado } from 'src/app/services/utils/clase-elegibilidad';
import { EvaluacionElegibilidadRazaBase, aplicarMutacion, esRazaMutada, evaluarElegibilidadRazaBase } from 'src/app/services/utils/raza-mutacion';
import {
    extraerEjesAlineamientoDesdeContrato,
    getVectorDesdeNombreBasico,
    nombreBasicoDesdeVector,
} from 'src/app/services/utils/alineamiento-contrato';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

interface VectorAlineamiento {
    ley: number;
    moral: number;
}

type OrigenConflictoAlineamiento = 'raza' | 'deidad';

interface ConflictoDuroAlineamiento {
    origen: OrigenConflictoAlineamiento;
    elegido: string;
    requerido: string;
    prioridad?: number;
}

interface EvaluacionConflictoRaza {
    severidad: 'soft' | 'hard';
    requerido: string;
    prioridad: number;
}

interface EvaluacionInconsistenciasBasicos {
    previewWarnings: string[];
    hardConflicts: ConflictoDuroAlineamiento[];
    otherOfficialBlockers: string[];
}

interface CandidataRazaBase {
    raza: Raza;
    evaluacion: EvaluacionElegibilidadRazaBase;
}

interface CandidataRazaBaseModal {
    raza: Raza;
    estado: EvaluacionElegibilidadRazaBase['estado'];
    advertencias: string[];
}

interface OpcionRacialOpcionalModal {
    clave: string;
    racial: RacialDetalle;
    estado: RacialEvaluacionResultado['estado'];
    razones: string[];
    advertencias: string[];
}

interface GrupoRacialOpcionalModal {
    grupo: number;
    opciones: OpcionRacialOpcionalModal[];
}

type FiltroTipoLanzadorClase = 'todas' | 'no lanzador' | 'arcano' | 'divino' | 'psionico' | 'alma';
type FiltroRolClase = 'todas' | 'dps' | 'tanque' | 'support' | 'utilidad';
type FiltroPrestigioClase = 'todas' | 'basica' | 'prestigio';

type ClaseRolChip = 'DPS' | 'Tanque' | 'Support' | 'Utilidad';
type ClaseBeneficioTipo = 'dote' | 'especial';
type EstadoCompatibilidadAlineamientoClase = 'compatible' | 'incompatible' | 'neutro';

interface ClaseBeneficioNivelItem {
    tipo: ClaseBeneficioTipo;
    nombre: string;
    extra: string;
    opcional: number;
    idDote: number;
    nombreEspecial: string;
    rawDote: Dote | null;
}

interface ClaseCompatibilidadAlineamientoItem {
    estado: EstadoCompatibilidadAlineamientoClase;
    etiqueta: string;
    tooltip: string;
    prioridad: number;
    requiereConfirmacion: boolean;
    marcaHomebrew: boolean;
}

interface ClaseListadoItem {
    clase: Clase;
    evaluacion: ClaseEvaluacionResultado;
    siguienteNivel: number;
    elegida: boolean;
    puedeAplicarse: boolean;
    bloqueoSoloAlineamiento: boolean;
    beneficios: ClaseBeneficioNivelItem[];
    roles: ClaseRolChip[];
    compatAlineamiento: ClaseCompatibilidadAlineamientoItem;
    esHomebrew: boolean;
}

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
    readonly deidadSinSeleccion = 'No tener deidad';

    Personaje!: Personaje;
    Campanas: Campana[] = [];
    Tramas: Super[] = [];
    Subtramas: Super[] = [];
    razasCatalogo: Raza[] = [];
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
    private hardAlignmentOverrideConfirmed: boolean = false;
    private controlHomebrewVentajasInicializado: boolean = false;
    catalogoVentajas: VentajaDetalle[] = [];
    catalogoDesventajas: VentajaDetalle[] = [];
    catalogoIdiomas: IdiomaDetalle[] = [];
    catalogoClases: Clase[] = [];
    catalogoDominios: DominioDetalle[] = [];
    catalogoDeidades: DeidadDetalle[] = [];
    clasesListadoFiltrado: ClaseListadoItem[] = [];
    claseSeleccionadaId: number | null = null;
    filtroClasesTexto: string = '';
    filtroClasesManual: string = 'Cualquiera';
    filtroClasesTipoLanzador: FiltroTipoLanzadorClase = 'todas';
    filtroClasesRol: FiltroRolClase = 'todas';
    filtroClasesPrestigio: FiltroPrestigioClase = 'todas';
    incluirHomebrewClases: boolean = false;
    private hardAlignmentClassOverrideConfirmed: boolean = false;
    private homebrewPorClaseAplicada: boolean = false;
    catalogoAlineamientosBasicos: AlineamientoBasicoCatalogItem[] = [];
    cargandoVentajas: boolean = true;
    cargandoIdiomas: boolean = true;
    cargandoClases: boolean = true;
    cargandoDeidades: boolean = true;
    private ventajaPendienteIdiomaId: number | null = null;
    modalSelectorIdiomaAbierto = false;
    modalSelectorDominiosAbierto = false;
    modalSelectorRazaBaseAbierto = false;
    modalSelectorRacialesOpcionalesAbierto = false;
    ventanaDetalleAbierta = false;
    incluirHomebrewRazaBase = false;
    private razaMutadaPendiente: Raza | null = null;
    private candidatasRazaBase: CandidataRazaBase[] = [];
    candidatasRazaBaseModal: CandidataRazaBaseModal[] = [];
    gruposRacialesOpcionalesModal: GrupoRacialOpcionalModal[] = [];
    razaContextoOpcionalesNombre = '';
    private seleccionRacialesOpcionalesPendiente: SeleccionRacialesOpcionales = {};
    private contextoRazaPendienteOpcionales: { raza: Raza; razaBase: Raza | null; } | null = null;
    private contextoSelectorIdioma: 'ventaja' | 'idiomasIniciales' | null = null;
    private resolverSelectorIdioma: ((completado: boolean) => void) | null = null;
    selectorDominiosTitulo = 'Seleccionar dominios';
    selectorDominiosCantidadObjetivo = 0;
    selectorDominiosCantidadSeleccionada = 0;
    selectorDominiosBloquearCierre = false;
    selectorDominiosOpciones: { id: number; nombre: string; oficial: boolean; }[] = [];
    private resolverSelectorDominios: ((seleccion: SeleccionDominiosClase | null) => void) | null = null;
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
    private razasSub?: Subscription;
    private clasesSub?: Subscription;
    private dominiosSub?: Subscription;
    private deidadesSub?: Subscription;
    private tiposCriaturaSub?: Subscription;
    private alineamientosBasicosSub?: Subscription;
    @ViewChild(MatTabGroup) TabGroup?: MatTabGroup;

    constructor(
        private nuevoPSvc: NuevoPersonajeService,
        private campanaSvc: CampanaService,
        private alineamientoSvc: AlineamientoService,
        private claseSvc: ClaseService,
        private razaSvc: RazaService,
        private plantillaSvc: PlantillaService,
        private ventajaSvc: VentajaService,
        private habilidadSvc: HabilidadService,
        private idiomaSvc: IdiomaService,
        private dominioSvc: DominioService,
        private deidadSvc: DeidadService,
        private tipoCriaturaSvc: TipoCriaturaService
    ) {
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
    }

    ngOnInit(): void {
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.normalizarAlineamientoSeleccionado();
        this.sincronizarTabConPaso();
        this.recalcularOficialidad();
        this.cargarCampanas();
        this.cargarRazasCatalogo();
        this.cargarPlantillas();
        this.cargarVentajasDesventajas();
        this.cargarHabilidadesBase();
        this.cargarHabilidadesCustom();
        this.cargarIdiomas();
        this.cargarDominios();
        this.cargarDeidades();
        this.cargarClases();
        this.cargarTiposCriatura();
        this.cargarAlineamientosBasicos();
    }

    ngOnDestroy(): void {
        this.campanasSub?.unsubscribe();
        this.plantillasSub?.unsubscribe();
        this.ventajasSub?.unsubscribe();
        this.desventajasSub?.unsubscribe();
        this.habilidadesSub?.unsubscribe();
        this.habilidadesCustomSub?.unsubscribe();
        this.idiomasSub?.unsubscribe();
        this.razasSub?.unsubscribe();
        this.clasesSub?.unsubscribe();
        this.dominiosSub?.unsubscribe();
        this.deidadesSub?.unsubscribe();
        this.tiposCriaturaSub?.unsubscribe();
        this.alineamientosBasicosSub?.unsubscribe();
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
        return `${this.Personaje?.Tipo_criatura?.Nombre ?? this.flujo.plantillas.tipoCriaturaSimulada.Nombre ?? '-'}`;
    }

    get mostrarTipoCriaturaResultante(): boolean {
        const raza = this.razaSeleccionada;
        if (!raza)
            return false;

        const tipoBaseId = Number(raza.Tipo_criatura?.Id ?? 0);
        const tipoSimuladoId = Number(this.Personaje?.Tipo_criatura?.Id ?? 0);

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

    get manualesClases(): string[] {
        const manuales = this.catalogoClases
            .map((clase) => `${clase?.Manual?.Nombre ?? ''}`.trim())
            .filter((nombre) => nombre.length > 0);
        return ['Cualquiera', ...Array.from(new Set(manuales)).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
    }

    get claseSeleccionadaActual(): ClaseListadoItem | null {
        if (this.claseSeleccionadaId === null)
            return null;
        return this.clasesListadoFiltrado.find((item) => Number(item.clase.Id) === Number(this.claseSeleccionadaId)) ?? null;
    }

    get puedeAplicarClaseSeleccionada(): boolean {
        const seleccionada = this.claseSeleccionadaActual;
        return !!seleccionada && seleccionada.puedeAplicarse;
    }

    get incluirHomebrewClasesEfectivo(): boolean {
        return this.homebrewForzado || this.incluirHomebrewClases;
    }

    get mostrarColumnaHomebrewClases(): boolean {
        return this.personajeNoOficial || this.incluirHomebrewClases;
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
        const texto = this.normalizarTexto(this.Personaje.Deidad ?? '');
        const candidatas = this.catalogoDeidades
            .filter((deidad) => `${deidad?.Nombre ?? ''}`.trim().length > 0)
            .filter((deidad) => this.personajeNoOficial || deidad?.Oficial !== false)
            .map((deidad) => ({
                nombre: `${deidad.Nombre}`.trim(),
                distancia: this.distanciaAlineamiento(
                    this.Personaje.Alineamiento,
                    `${deidad?.Alineamiento?.Nombre ?? ''}`
                ),
                oficial: deidad.Oficial !== false,
            }))
            .filter((item) => texto.length < 1 || this.normalizarTexto(item.nombre).includes(texto))
            .sort((a, b) => {
                const distA = Number.isFinite(a.distancia) ? Number(a.distancia) : 99;
                const distB = Number.isFinite(b.distancia) ? Number(b.distancia) : 99;
                if (distA !== distB)
                    return distA - distB;
                if (a.oficial !== b.oficial)
                    return a.oficial ? -1 : 1;
                return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
            })
            .map((item) => item.nombre);

        return [this.deidadSinSeleccion, ...candidatas];
    }

    get alineamientosDisponibles(): string[] {
        const nombresCatalogo = this.catalogoAlineamientosBasicos
            .map((item) => `${item?.Nombre ?? ''}`.trim())
            .filter((nombre) => nombre.length > 0);

        const fuente = nombresCatalogo.length > 0 ? nombresCatalogo : this.alineamientos;
        const vistos = new Set<string>();
        const resultado: string[] = [];
        fuente.forEach((nombre) => {
            const normalizado = this.normalizarTexto(nombre);
            if (normalizado.length < 1 || vistos.has(normalizado) || normalizado === 'no aplica')
                return;
            vistos.add(normalizado);
            resultado.push(nombre);
        });
        return resultado;
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

    get preferenciasRazaItems(): { etiqueta: string; valor: string; }[] {
        const items: { etiqueta: string; valor: string; }[] = [];
        const base = this.razaSeleccionada?.Alineamiento?.Basico?.Nombre?.trim() ?? '';
        const ley = this.razaSeleccionada?.Alineamiento?.Ley?.Nombre?.trim() ?? '';
        const moral = this.razaSeleccionada?.Alineamiento?.Moral?.Nombre?.trim() ?? '';

        if (this.esPreferenciaAlineamientoVisible(base))
            items.push({ etiqueta: 'Base', valor: base });
        if (this.esPreferenciaAlineamientoVisible(ley))
            items.push({ etiqueta: 'Ley / normas', valor: ley });
        if (this.esPreferenciaAlineamientoVisible(moral))
            items.push({ etiqueta: 'Moral / trato', valor: moral });

        return items;
    }

    get tienePreferenciasRazaVisibles(): boolean {
        return this.preferenciasRazaItems.length > 0;
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

    get deidadSeleccionadaDetalle(): DeidadDetalle | null {
        const nombreNorm = this.normalizarTexto(this.Personaje.Deidad ?? '');
        if (nombreNorm.length < 1 || nombreNorm === this.normalizarTexto(this.deidadSinSeleccion))
            return null;
        return this.catalogoDeidades.find((deidad) => this.normalizarTexto(deidad?.Nombre ?? '') === nombreNorm) ?? null;
    }

    get deidadSeleccionadaTexto(): string {
        const deidad = this.deidadSeleccionadaDetalle;
        if (deidad)
            return deidad.Nombre;
        const texto = this.Personaje.Deidad?.trim();
        return texto && texto.length > 0 ? texto : 'Sin deidad';
    }

    get deidadAlineamientoInfo(): string {
        return this.getAlineamientoDeidad() ?? 'No disponible en el catalogo local';
    }

    get deidadOficialidadInfo(): string {
        return this.esDeidadOficial() ? 'Oficial' : 'No oficial';
    }

    get deidadDescripcionInfo(): string {
        return `${this.deidadSeleccionadaDetalle?.Descripcion ?? ''}`.trim() || 'No hay detalles adicionales de esta deidad en el catalogo local.';
    }

    get deidadArmaInfo(): string {
        return `${this.deidadSeleccionadaDetalle?.Arma?.Nombre ?? ''}`.trim() || 'No especificada';
    }

    get deidadPabellonInfo(): string {
        return `${this.deidadSeleccionadaDetalle?.Pabellon?.Nombre ?? ''}`.trim() || 'No especificado';
    }

    get deidadManualInfo(): string {
        const detalle = this.deidadSeleccionadaDetalle;
        if (!detalle)
            return 'No disponible';
        const nombreManual = `${detalle?.Manual?.Nombre ?? ''}`.trim();
        const pagina = Number(detalle?.Manual?.Pagina ?? 0);
        if (nombreManual.length < 1)
            return 'No disponible';
        return pagina > 0 ? `${nombreManual} (p. ${pagina})` : nombreManual;
    }

    get deidadAmbitosInfo(): string[] {
        return (this.deidadSeleccionadaDetalle?.Ambitos ?? [])
            .map((ambito) => `${ambito?.Nombre ?? ''}`.trim())
            .filter((nombre) => nombre.length > 0);
    }

    get deidadDominiosInfo(): string[] {
        return (this.deidadSeleccionadaDetalle?.Dominios ?? [])
            .map((dominio) => `${dominio?.Nombre ?? ''}`.trim())
            .filter((nombre) => nombre.length > 0);
    }

    get evaluacionBasicosActual(): EvaluacionInconsistenciasBasicos {
        return this.evaluarInconsistenciasBasicos();
    }

    get tieneFeedbackRazaBasicos(): boolean {
        const evaluacion = this.evaluacionBasicosActual;
        return evaluacion.hardConflicts.some(c => c.origen === 'raza')
            || evaluacion.previewWarnings.length > 0;
    }

    get tieneConflictoDuroRazaBasicos(): boolean {
        const evaluacion = this.evaluacionBasicosActual;
        return evaluacion.hardConflicts.some(c => c.origen === 'raza');
    }

    get tieneFeedbackDeidadBasicos(): boolean {
        const evaluacion = this.evaluacionBasicosActual;
        return evaluacion.hardConflicts.some(c => c.origen === 'deidad');
    }

    get conflictosDurosRazaPreview(): string[] {
        const evaluacion = this.evaluacionBasicosActual;
        return evaluacion.hardConflicts
            .filter(conflicto => conflicto.origen === 'raza')
            .map(conflicto => `Has elegido ${conflicto.elegido}, mientras que tu raza exige ${conflicto.requerido} (prioridad ${conflicto.prioridad ?? 3}).`);
    }

    get advertenciasRazaPreview(): string[] {
        return this.evaluacionBasicosActual.previewWarnings;
    }

    get conflictosDurosDeidadPreview(): string[] {
        const evaluacion = this.evaluacionBasicosActual;
        return evaluacion.hardConflicts
            .filter(conflicto => conflicto.origen === 'deidad')
            .map(conflicto => `Has elegido ${conflicto.elegido}, mientras que tu deidad exige ${conflicto.requerido}.`);
    }

    private normalizarTexto(valor: string): string {
        return (valor ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private esPreferenciaAlineamientoVisible(valor: string): boolean {
        const normalizado = this.normalizarTexto(valor ?? '');
        return normalizado.length > 0
            && normalizado !== 'no aplica'
            && normalizado !== 'no especificado'
            && normalizado !== 'no especificada'
            && normalizado !== 'ninguna preferencia';
    }

    private isVentanaDetalleHabilitada(): boolean {
        const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const height = typeof window !== 'undefined' ? window.innerHeight : 720;
        return !(width <= 1250 || height <= 700 || height >= width);
    }

    private esDeidadVaciaONeutra(): boolean {
        const deidad = this.normalizarTexto(this.Personaje.Deidad ?? '');
        return deidad.length < 1 || deidad === this.normalizarTexto(this.deidadSinSeleccion);
    }

    private esDeidadOficial(): boolean {
        if (this.esDeidadVaciaONeutra())
            return true;
        if (this.catalogoDeidades.length < 1)
            return true;
        const detalle = this.deidadSeleccionadaDetalle;
        return !!detalle && detalle.Oficial !== false;
    }

    private getAlineamientoDeidad(): string | null {
        const alineamiento = `${this.deidadSeleccionadaDetalle?.Alineamiento?.Nombre ?? ''}`.trim();
        return alineamiento.length > 0 ? alineamiento : null;
    }

    private getVectorAlineamiento(nombre: string): VectorAlineamiento | null {
        return getVectorDesdeNombreBasico(nombre);
    }

    private getSeveridadPreferenciaTexto(valor: string): 'none' | 'soft' | 'hard' {
        const normalizado = this.normalizarTexto(valor ?? '');
        if (normalizado.includes('casi siempre'))
            return 'soft';
        if (normalizado.includes('siempre'))
            return 'hard';
        return 'none';
    }

    private getSeveridadGlobalRaza(): 'none' | 'soft' | 'hard' {
        const prioridadNombre = `${this.razaSeleccionada?.Alineamiento?.Prioridad?.Nombre ?? ''}`;
        const desdeNombre = this.getSeveridadPreferenciaTexto(prioridadNombre);
        if (desdeNombre !== 'none')
            return desdeNombre;

        const prioridadId = Number(this.razaSeleccionada?.Alineamiento?.Prioridad?.Id_prioridad ?? 0);
        if (prioridadId === 3)
            return 'hard';
        if (prioridadId === 2)
            return 'soft';
        return 'none';
    }

    private getSeveridadEjeRaza(alineamiento: any, eje: 'ley' | 'moral'): 'none' | 'soft' | 'hard' {
        const textoEje = eje === 'ley'
            ? `${alineamiento?.Ley?.Nombre ?? ''}`
            : `${alineamiento?.Moral?.Nombre ?? ''}`;
        const desdeEje = this.getSeveridadPreferenciaTexto(textoEje);
        if (desdeEje !== 'none')
            return desdeEje;

        const textoBasico = `${alineamiento?.Basico?.Nombre ?? ''}`;
        const desdeBasico = this.getSeveridadPreferenciaTexto(textoBasico);
        if (desdeBasico !== 'none')
            return desdeBasico;

        return 'none';
    }

    private getEtiquetaExigenciaContrato(alineamiento: any): string {
        const ejes = extraerEjesAlineamientoDesdeContrato(alineamiento);
        if (ejes.ley !== null && ejes.moral !== null) {
            return nombreBasicoDesdeVector(ejes.ley, ejes.moral);
        }
        if (ejes.ley !== null) {
            const leyNombre = `${alineamiento?.Ley?.Nombre ?? ''}`.trim();
            if (leyNombre.length > 0)
                return leyNombre;
            return ejes.ley > 0 ? 'Legal' : ejes.ley < 0 ? 'Caotico' : 'Neutral';
        }
        if (ejes.moral !== null) {
            const moralNombre = `${alineamiento?.Moral?.Nombre ?? ''}`.trim();
            if (moralNombre.length > 0)
                return moralNombre;
            return ejes.moral > 0 ? 'Bueno' : ejes.moral < 0 ? 'Maligno' : 'Neutral';
        }

        const basico = `${alineamiento?.Basico?.Nombre ?? ''}`.trim();
        if (basico.length > 0) {
            return basico;
        }
        return 'No aplica';
    }

    private distanciaAlineamientoPorEjes(a: string, ejes: { ley: number | null; moral: number | null; }): number | null {
        const elegido = this.getVectorAlineamiento(a);
        if (!elegido) {
            return null;
        }

        let distancia = 0;
        let ejesDefinidos = 0;
        if (ejes.ley !== null) {
            distancia += Math.abs(elegido.ley - ejes.ley);
            ejesDefinidos += 1;
        }
        if (ejes.moral !== null) {
            distancia += Math.abs(elegido.moral - ejes.moral);
            ejesDefinidos += 1;
        }

        if (ejesDefinidos < 1) {
            return null;
        }
        return distancia;
    }

    private distanciaAlineamiento(a: string, b: string): number | null {
        const a1 = this.getVectorAlineamiento(a);
        const b1 = this.getVectorAlineamiento(b);
        if (!a1 || !b1) {
            return null;
        }
        return Math.abs(a1.ley - b1.ley) + Math.abs(a1.moral - b1.moral);
    }

    private getEvaluacionConflictoRaza(): EvaluacionConflictoRaza | null {
        const alineamientoRaza = this.razaSeleccionada?.Alineamiento;
        const elegido = this.getVectorAlineamiento(this.Personaje.Alineamiento);
        if (!alineamientoRaza || !elegido) {
            return null;
        }

        const ejes = extraerEjesAlineamientoDesdeContrato(alineamientoRaza);
        let hayDiferencia = false;
        let hayConflictoDuro = false;
        let hayAdvertencia = false;

        if (ejes.ley !== null && elegido.ley !== ejes.ley) {
            hayDiferencia = true;
            const severidadLey = this.getSeveridadEjeRaza(alineamientoRaza, 'ley');
            hayConflictoDuro = hayConflictoDuro || severidadLey === 'hard';
            hayAdvertencia = hayAdvertencia || severidadLey === 'soft';
        }

        if (ejes.moral !== null && elegido.moral !== ejes.moral) {
            hayDiferencia = true;
            const severidadMoral = this.getSeveridadEjeRaza(alineamientoRaza, 'moral');
            hayConflictoDuro = hayConflictoDuro || severidadMoral === 'hard';
            hayAdvertencia = hayAdvertencia || severidadMoral === 'soft';
        }

        if (!hayDiferencia) {
            return null;
        }

        let severidad: 'none' | 'soft' | 'hard' = 'none';
        if (hayConflictoDuro) {
            severidad = 'hard';
        } else if (hayAdvertencia) {
            severidad = 'soft';
        } else {
            severidad = this.getSeveridadGlobalRaza();
        }

        if (severidad === 'none')
            return null;

        return {
            severidad,
            requerido: this.getEtiquetaExigenciaContrato(alineamientoRaza),
            prioridad: Number(this.razaSeleccionada?.Alineamiento?.Prioridad?.Id_prioridad ?? 0),
        };
    }

    private getConflictoDuroRaza(): ConflictoDuroAlineamiento | null {
        const evaluacion = this.getEvaluacionConflictoRaza();
        if (!evaluacion || evaluacion.severidad !== 'hard') {
            return null;
        }

        return {
            origen: 'raza',
            elegido: this.Personaje.Alineamiento,
            requerido: evaluacion.requerido,
            prioridad: evaluacion.prioridad > 0 ? evaluacion.prioridad : undefined,
        };
    }

    private getAdvertenciaRazaNoDura(): string | null {
        const evaluacion = this.getEvaluacionConflictoRaza();
        if (!evaluacion || evaluacion.severidad !== 'soft') {
            return null;
        }

        return `Has elegido ${this.Personaje.Alineamiento}, mientras que tu raza suele exigir ${evaluacion.requerido}. Con esta combinación estarías creando un caso extremadamente inusual (aprox. 1 entre un millón).`;
    }

    private getConflictoDuroDeidad(): ConflictoDuroAlineamiento | null {
        if (this.esDeidadVaciaONeutra()) {
            return null;
        }
        const alineamientoDeidad = this.getAlineamientoDeidad();
        if (!alineamientoDeidad) {
            return null;
        }
        const distancia = this.distanciaAlineamiento(this.Personaje.Alineamiento, alineamientoDeidad);
        if (distancia === null || distancia < 2) {
            return null;
        }
        return {
            origen: 'deidad',
            elegido: this.Personaje.Alineamiento,
            requerido: alineamientoDeidad,
        };
    }

    private evaluarInconsistenciasBasicos(): EvaluacionInconsistenciasBasicos {
        const previewWarnings: string[] = [];
        const hardConflicts: ConflictoDuroAlineamiento[] = [];
        const otherOfficialBlockers: string[] = [];
        const deidadIngresada = this.Personaje.Deidad?.trim() ?? '';

        if (this.edadFueraRango) {
            otherOfficialBlockers.push(`Edad fuera de rango: ${this.Personaje.Edad} (tipico ${this.razaSeleccionada?.Edad_adulto}-${this.razaSeleccionada?.Edad_venerable}).`);
        }
        if (this.pesoFueraRango) {
            otherOfficialBlockers.push(`Peso fuera de rango: ${this.Personaje.Peso} kg (tipico ${this.razaSeleccionada?.Peso_rango_inf}-${this.razaSeleccionada?.Peso_rango_sup} kg).`);
        }
        if (this.alturaFueraRango) {
            otherOfficialBlockers.push(`Altura fuera de rango: ${this.Personaje.Altura} m (tipico ${this.razaSeleccionada?.Altura_rango_inf}-${this.razaSeleccionada?.Altura_rango_sup} m).`);
        }

        if (!this.esDeidadOficial()) {
            otherOfficialBlockers.push(`Deidad no oficial: ${deidadIngresada}.`);
        }

        const conflictoRaza = this.getConflictoDuroRaza();
        if (conflictoRaza) {
            hardConflicts.push(conflictoRaza);
        }

        const advertenciaRaza = this.getAdvertenciaRazaNoDura();
        if (advertenciaRaza) {
            previewWarnings.push(advertenciaRaza);
        }

        const conflictoDeidad = this.getConflictoDuroDeidad();
        if (conflictoDeidad) {
            hardConflicts.push(conflictoDeidad);
        }

        return {
            previewWarnings,
            hardConflicts,
            otherOfficialBlockers,
        };
    }

    getInconsistenciasManual(): string[] {
        const evaluacion = this.evaluarInconsistenciasBasicos();
        const hard = evaluacion.hardConflicts.map((conflicto) => {
            if (conflicto.origen === 'raza') {
                return `Alineamiento incompatible con raza: ${conflicto.elegido} vs ${conflicto.requerido} (prioridad ${conflicto.prioridad ?? 3}).`;
            }
            return `Alineamiento incompatible con deidad: ${conflicto.elegido} vs ${conflicto.requerido}.`;
        });
        return [...evaluacion.previewWarnings, ...hard, ...evaluacion.otherOfficialBlockers];
    }

    recalcularOficialidad(): void {
        const razaEsOficial = this.razaSeleccionada?.Oficial === true;
        const evaluacion = this.evaluarInconsistenciasBasicos();
        const tieneConflictoDuroConfirmado = evaluacion.hardConflicts.length > 0 && this.hardAlignmentOverrideConfirmed;
        const tieneClaseHomebrew = (this.Personaje?.desgloseClases ?? []).some((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return false;
            const claseCatalogo = this.catalogoClases.find((clase) => this.normalizarTexto(clase?.Nombre ?? '') === this.normalizarTexto(nombre));
            return claseCatalogo?.Oficial === false;
        }) || this.homebrewPorClaseAplicada;
        const tieneVentajasODesventajas = this.flujoVentajas.seleccionVentajas.length > 0
            || this.flujoVentajas.seleccionDesventajas.length > 0;
        this.Personaje.Oficial = !this.homebrewForzadoPorJugador
            && razaEsOficial
            && evaluacion.otherOfficialBlockers.length === 0
            && !tieneConflictoDuroConfirmado
            && !this.hardAlignmentClassOverrideConfirmed
            && !tieneClaseHomebrew
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

        const evaluacion = this.evaluarInconsistenciasBasicos();
        const hayPreview = evaluacion.previewWarnings.length > 0;
        const hayConflictosDuros = evaluacion.hardConflicts.length > 0;
        const hayOtrosBloqueos = evaluacion.otherOfficialBlockers.length > 0;
        if (hayPreview || hayConflictosDuros || hayOtrosBloqueos) {
            const previewHtml = hayPreview
                ? `<p style="text-align:left; margin: 0 0 6px 0;"><strong>Advertencias</strong></p><ul style="text-align:left; margin-top: 4px;">${evaluacion.previewWarnings.map(i => `<li>${i}</li>`).join('')}</ul>`
                : '';
            const conflictosHtml = hayConflictosDuros
                ? `<p style="text-align:left; margin: 8px 0 6px 0;"><strong>Regla dura de alineamiento</strong></p><ul style="text-align:left; margin-top: 4px;">${evaluacion.hardConflicts.map((c) => c.origen === 'raza'
                    ? `<li>Has elegido <strong>${c.elegido}</strong>, mientras que tu raza exige <strong>${c.requerido}</strong>${c.prioridad ? ` (prioridad ${c.prioridad})` : ''}.</li>`
                    : `<li>Has elegido <strong>${c.elegido}</strong>, mientras que tu deidad exige <strong>${c.requerido}</strong>.</li>`
                ).join('')}</ul><p style="text-align:left; margin: 8px 0 0 0;"><strong>Con tus elecciones has ignorado una regla dura del manual. Si continúas, el personaje se convertirá en homebrew (no oficial) y deberías consultarlo con tu máster.</strong></p>`
                : '';
            const bloqueosHtml = hayOtrosBloqueos
                ? `<p style="text-align:left; margin: 8px 0 6px 0;"><strong>Impacto en oficialidad</strong></p><ul style="text-align:left; margin-top: 4px;">${evaluacion.otherOfficialBlockers.map(i => `<li>${i}</li>`).join('')}</ul>`
                : '';
            const result = await Swal.fire({
                title: 'Tus elecciones van en contra de los manuales',
                html: `Cancelar para cambiarlas o aceptar si tu master lo permite.${previewHtml}${conflictosHtml}${bloqueosHtml}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Aceptar y continuar',
                cancelButtonText: 'Cancelar',
            });

            if (!result.isConfirmed) {
                return;
            }

            if (hayConflictosDuros) {
                this.hardAlignmentOverrideConfirmed = true;
            }
        }

        this.recalcularOficialidad();

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
        this.recalcularClasesVisibles();
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
        if (paso === 'clases') {
            return 4;
        }
        if (paso === 'habilidades') {
            return 5;
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

    private resetHardAlignmentOverride(): void {
        this.hardAlignmentOverrideConfirmed = false;
    }

    onAlineamientoChange(): void {
        this.resetHardAlignmentOverride();
        this.recalcularOficialidad();
        this.recalcularClasesVisibles();
    }

    onDeidadChange(): void {
        const deidad = `${this.Personaje.Deidad ?? ''}`.trim();
        if (deidad.length < 1)
            this.Personaje.Deidad = this.deidadSinSeleccion;
        this.resetHardAlignmentOverride();
        this.recalcularOficialidad();
    }

    compararAlineamiento = (a: string | null, b: string | null): boolean => {
        return this.normalizarTexto(a ?? '') === this.normalizarTexto(b ?? '');
    };

    private normalizarAlineamientoSeleccionado(): void {
        const actual = this.Personaje.Alineamiento ?? '';
        const normalizado = this.normalizarTexto(actual);
        const encontrado = this.alineamientosDisponibles.find(a => this.normalizarTexto(a) === normalizado);

        if (encontrado) {
            this.Personaje.Alineamiento = encontrado;
            return;
        }

        this.Personaje.Alineamiento = this.alineamientosDisponibles[0] ?? 'Legal bueno';
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

    verDetallesRazaDesdeFicha(idRaza: number): void {
        const raza = this.razaSeleccionada;
        if (!raza)
            return;
        if (Number(raza.Id) !== Number(idRaza))
            return;
        this.razaDetalles.emit(raza);
    }

    @Output() plantillaDetalles: EventEmitter<Plantilla> = new EventEmitter<Plantilla>();
    verDetallesPlantilla(value: Plantilla): void {
        this.plantillaDetalles.emit(value);
    }

    @Output() claseDetalles: EventEmitter<Clase> = new EventEmitter<Clase>();
    verDetallesClase(value: Clase): void {
        const nombre = `${value?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;
        this.claseDetalles.emit(value);
    }

    @Output() doteDetalles: EventEmitter<Dote | DoteContextual> = new EventEmitter<Dote | DoteContextual>();
    @Output() especialDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();

    verDetallesPlantillaDesdeFicha(payload: { id?: number | null; nombre: string; }): void {
        const id = Number(payload?.id ?? 0);
        if (Number.isFinite(id) && id > 0) {
            const porId = this.plantillasCatalogo.find((p) => Number(p.Id) === id)
                ?? this.plantillasSeleccionadas.find((p) => Number(p.Id) === id);
            if (porId) {
                this.plantillaDetalles.emit(porId);
                return;
            }
        }

        const nombreBuscado = this.normalizarTexto(payload?.nombre ?? '');
        if (nombreBuscado.length < 1)
            return;
        const porNombre = this.plantillasCatalogo.find((p) => this.normalizarTexto(p.Nombre) === nombreBuscado)
            ?? this.plantillasSeleccionadas.find((p) => this.normalizarTexto(p.Nombre) === nombreBuscado);
        if (porNombre)
            this.plantillaDetalles.emit(porNombre);
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

    @Output() ventajaDetallesPorNombre: EventEmitter<{ nombre: string; origen?: string; }> = new EventEmitter<{ nombre: string; origen?: string; }>();
    verDetallesVentajaDesdeReferencia(referencia: { nombre: string; origen?: string; }): void {
        const nombre = `${referencia?.nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;

        const origen = `${referencia?.origen ?? ''}`.trim();
        this.ventajaDetallesPorNombre.emit({
            nombre,
            origen: origen.length > 0 ? origen : undefined,
        });
    }

    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    verDetallesRasgo(value: Rasgo): void {
        const nombre = `${value?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;
        this.rasgoDetalles.emit(value);
    }

    @Output() cerrarNuevoPersonajeSolicitado: EventEmitter<void> = new EventEmitter<void>();

    seleccionarRaza(value: Raza) {
        this.cerrarSelectorRacialesOpcionalesContexto();
        if (!esRazaMutada(value)) {
            this.cerrarSelectorRazaBaseContexto();
            this.prepararSeleccionRazaFinal(value, null);
            return;
        }

        this.abrirSelectorRazaBase(value);
    }

    onToggleHomebrewRazaBase(value: boolean): void {
        this.incluirHomebrewRazaBase = value;
    }

    onInformacionRazaMutada(): void {
        Swal.fire({
            icon: 'info',
            title: 'Raza mutada',
            html: `
                <p style="text-align:left; margin-bottom:8px;">
                    Has seleccionado una <strong>raza mutada</strong>.
                </p>
                <p style="text-align:left; margin-bottom:8px;">
                    Ahora debes elegir una <strong>raza base</strong>, que será el origen de la mutación.
                </p>
                <p style="text-align:left; margin:0;">
                    El personaje se crea aplicando <strong>raza base -> mutación</strong>.
                </p>
            `,
            confirmButtonText: 'Entendido',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
    }

    onCerrarModalRazaBase(): void {
        this.cerrarSelectorRazaBaseContexto();
    }

    async onConfirmarRazaBase(razaBase: Raza): Promise<void> {
        const item = this.candidatasRazaBase.find((c) => Number(c.raza.Id) === Number(razaBase.Id));
        if (!item || !this.razaMutadaPendiente)
            return;
        const razaMutadaConfirmada = this.razaMutadaPendiente;
        if (!this.incluirHomebrewRazaBase && !item.raza.Oficial)
            return;

        if (item.evaluacion.estado === 'blocked')
            return;

        if (item.evaluacion.estado === 'eligible_with_warning' && item.evaluacion.advertencias.length > 0) {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Validación parcial de prerrequisitos',
                html: `<p style="text-align:left; margin:0;">${item.evaluacion.advertencias.join('<br>')}</p>`,
                showCancelButton: true,
                confirmButtonText: 'Usar esta base',
                cancelButtonText: 'Cancelar',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            if (!result.isConfirmed)
                return;
        }

        this.cerrarSelectorRazaBaseContexto();
        this.prepararSeleccionRazaFinal(razaMutadaConfirmada, item.raza);
    }

    private abrirSelectorRazaBase(razaMutada: Raza): void {
        if (this.razasCatalogo.length < 1) {
            Swal.fire({
                icon: 'warning',
                title: 'No se pudo abrir el selector de base',
                text: 'Aún no está disponible el catálogo de razas. Inténtalo de nuevo en unos segundos.',
                showConfirmButton: true,
            });
            return;
        }

        this.razaMutadaPendiente = razaMutada;
        this.incluirHomebrewRazaBase = false;
        this.candidatasRazaBase = this.razasCatalogo
            .filter((candidata) => Number(candidata.Id) > 0 && Number(candidata.Id) !== Number(razaMutada.Id))
            .map((candidata) => ({
                raza: candidata,
                evaluacion: evaluarElegibilidadRazaBase(razaMutada, candidata),
            }))
            .filter((item) => item.evaluacion.estado !== 'blocked');
        this.reconstruirCandidatasRazaBaseModal();

        if (this.candidatasRazaBase.length < 1) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin razas base compatibles',
                text: 'No existe ninguna raza base que cumpla los prerrequisitos de esta raza mutada.',
                showConfirmButton: true,
            });
            this.cerrarSelectorRazaBaseContexto();
            return;
        }

        this.modalSelectorRazaBaseAbierto = true;
    }

    private cerrarSelectorRazaBaseContexto(): void {
        this.modalSelectorRazaBaseAbierto = false;
        this.razaMutadaPendiente = null;
        this.candidatasRazaBase = [];
        this.candidatasRazaBaseModal = [];
        this.incluirHomebrewRazaBase = false;
    }

    private prepararSeleccionRazaFinal(raza: Raza, razaBase: Raza | null): void {
        const razaEfectiva = esRazaMutada(raza) && razaBase
            ? aplicarMutacion(razaBase, raza)
            : JSON.parse(JSON.stringify(raza ?? {}));
        const agrupacion = agruparRacialesPorOpcional(razaEfectiva?.Raciales ?? []);

        if (agrupacion.grupos.length < 1) {
            this.aplicarSeleccionRazaFinal(raza, razaBase, null);
            return;
        }

        const gruposEvaluados = this.evaluarGruposRacialesOpcionales(
            razaEfectiva,
            razaBase,
            agrupacion.grupos
        );
        const gruposSinOpciones = gruposEvaluados.filter((grupo) => grupo.opciones.every((opcion) => opcion.estado === 'blocked'));
        if (gruposSinOpciones.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin opciones raciales válidas',
                html: gruposSinOpciones
                    .map((grupo) => {
                        const motivos = grupo.opciones
                            .flatMap((opcion) => opcion.razones)
                            .filter((motivo, idx, arr) => arr.indexOf(motivo) === idx);
                        const detalle = motivos.length > 0
                            ? `<br><small>${motivos.join('<br>')}</small>`
                            : '';
                        return `El grupo opcional ${grupo.grupo} no tiene opciones habilitadas.${detalle}`;
                    })
                    .join('<br><br>'),
                confirmButtonText: 'Entendido',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            return;
        }

        this.abrirSelectorRacialesOpcionales(raza, razaBase, gruposEvaluados);
    }

    onCerrarModalRacialesOpcionales(): void {
        this.cerrarSelectorRacialesOpcionalesContexto();
    }

    onInformacionRacialesOpcionales(): void {
        const nombreRaza = `${this.razaContextoOpcionalesNombre ?? ''}`.trim() || 'esta raza';
        Swal.fire({
            icon: 'info',
            title: 'Raciales opcionales',
            html: `
                <p style="text-align:left; margin-bottom:8px;">
                    Estas opciones aparecen porque tu personaje cuenta como <strong>${nombreRaza}</strong>.
                </p>
                <p style="text-align:left; margin:0;">
                    Debes elegir una opción válida por cada grupo para completar la raza.
                </p>
            `,
            confirmButtonText: 'Entendido',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
    }

    onVerDetalleRacialOpcional(referencia: RacialReferencia): void {
        this.verDetallesRacialDesdeReferencia(referencia);
    }

    onConfirmarRacialesOpcionales(seleccion: SeleccionRacialesOpcionales): void {
        if (!this.contextoRazaPendienteOpcionales)
            return;
        const seleccionValida = this.gruposRacialesOpcionalesModal.every((grupo) => {
            const clave = `${seleccion?.[grupo.grupo] ?? ''}`.trim();
            if (clave.length < 1)
                return false;
            return grupo.opciones.some((opcion) => opcion.clave === clave && opcion.estado !== 'blocked');
        });
        if (!seleccionValida) {
            Swal.fire({
                icon: 'warning',
                title: 'Selección incompleta',
                text: 'Debes elegir una opción válida en cada grupo opcional.',
                showConfirmButton: true,
            });
            return;
        }

        this.seleccionRacialesOpcionalesPendiente = { ...seleccion };
        this.aplicarSeleccionRazaFinal(
            this.contextoRazaPendienteOpcionales.raza,
            this.contextoRazaPendienteOpcionales.razaBase,
            this.seleccionRacialesOpcionalesPendiente
        );
    }

    private abrirSelectorRacialesOpcionales(
        raza: Raza,
        razaBase: Raza | null,
        grupos: GrupoRacialOpcionalModal[]
    ): void {
        this.contextoRazaPendienteOpcionales = { raza, razaBase };
        this.razaContextoOpcionalesNombre = `${raza?.Nombre ?? ''}`.trim();
        this.seleccionRacialesOpcionalesPendiente = {};
        this.gruposRacialesOpcionalesModal = grupos.map((grupo) => ({
            grupo: grupo.grupo,
            opciones: grupo.opciones.map((opcion) => ({
                clave: opcion.clave,
                racial: opcion.racial,
                estado: opcion.estado,
                razones: [...(opcion.razones ?? [])],
                advertencias: [...(opcion.advertencias ?? [])],
            })),
        }));
        this.modalSelectorRacialesOpcionalesAbierto = true;
    }

    private evaluarGruposRacialesOpcionales(
        razaEfectiva: Raza,
        razaBase: Raza | null,
        grupos: GrupoRacialesOpcionales[],
    ): GrupoRacialOpcionalModal[] {
        const identidad = buildIdentidadPrerrequisitos(
            razaEfectiva,
            razaBase,
            razaEfectiva?.Subtipos ?? []
        );
        const caracteristicas = {
            Fuerza: Number(this.Personaje?.Fuerza),
            Destreza: Number(this.Personaje?.Destreza),
            Constitucion: Number(this.Personaje?.Constitucion),
            Inteligencia: Number(this.Personaje?.Inteligencia),
            Sabiduria: Number(this.Personaje?.Sabiduria),
            Carisma: Number(this.Personaje?.Carisma),
        };

        return grupos.map((grupo) => ({
            grupo: grupo.grupo,
            opciones: grupo.opciones.map((racial) => {
                const evaluacion = evaluarRacialParaSeleccion(racial, identidad, caracteristicas);
                return {
                    clave: getClaveSeleccionRacial(racial),
                    racial,
                    estado: evaluacion.estado,
                    razones: [...(evaluacion.razones ?? [])],
                    advertencias: [...(evaluacion.advertencias ?? [])],
                };
            }),
        }));
    }

    private cerrarSelectorRacialesOpcionalesContexto(): void {
        this.modalSelectorRacialesOpcionalesAbierto = false;
        this.contextoRazaPendienteOpcionales = null;
        this.razaContextoOpcionalesNombre = '';
        this.gruposRacialesOpcionalesModal = [];
        this.seleccionRacialesOpcionalesPendiente = {};
    }

    private aplicarSeleccionRazaFinal(
        raza: Raza,
        razaBase: Raza | null,
        seleccionOpcionales: SeleccionRacialesOpcionales | null
    ): void {
        const aplicado = this.nuevoPSvc.seleccionarRaza(raza, razaBase, seleccionOpcionales);
        if (!aplicado)
            return;

        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.cerrarSelectorRacialesOpcionalesContexto();
        this.ventanaDetalleAbierta = false;
        this.resetHardAlignmentOverride();
        this.hardAlignmentClassOverrideConfirmed = false;
        this.homebrewPorClaseAplicada = false;
        this.normalizarAlineamientoSeleccionado();
        this.recalcularOficialidad();
        this.recalcularPlantillasVisibles();
        this.recalcularClasesVisibles();
        this.irABasicos();
    }

    private reconstruirCandidatasRazaBaseModal(): void {
        this.candidatasRazaBaseModal = this.candidatasRazaBase.map((item) => ({
            raza: item.raza,
            estado: item.evaluacion.estado,
            advertencias: item.evaluacion.advertencias ?? [],
        }));
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
        this.recalcularClasesVisibles();
    }

    quitarPlantillaSeleccion(idPlantilla: number): void {
        this.nuevoPSvc.quitarPlantillaSeleccion(idPlantilla);
        this.recalcularPlantillasVisibles();
        this.recalcularClasesVisibles();
    }

    limpiarSeleccionPlantillas(): void {
        this.nuevoPSvc.limpiarPlantillasSeleccion();
        this.recalcularPlantillasVisibles();
        this.recalcularClasesVisibles();
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
        this.nuevoPSvc.actualizarPasoActual('clases');
        this.recalcularClasesVisibles();
        this.sincronizarTabConPaso();
    }

    seleccionarClaseParaAplicar(clase: Clase): void {
        this.claseSeleccionadaId = Number(clase?.Id);
    }

    onFiltroClasesTextoChange(value: string): void {
        this.filtroClasesTexto = value ?? '';
        this.recalcularClasesVisibles();
    }

    onFiltroClasesManualChange(value: string): void {
        this.filtroClasesManual = value ?? 'Cualquiera';
        this.recalcularClasesVisibles();
    }

    onFiltroClasesTipoLanzadorChange(value: FiltroTipoLanzadorClase): void {
        this.filtroClasesTipoLanzador = value ?? 'todas';
        this.recalcularClasesVisibles();
    }

    onFiltroClasesRolChange(value: FiltroRolClase): void {
        this.filtroClasesRol = value ?? 'todas';
        this.recalcularClasesVisibles();
    }

    onFiltroClasesPrestigioChange(value: FiltroPrestigioClase): void {
        this.filtroClasesPrestigio = value ?? 'todas';
        this.recalcularClasesVisibles();
    }

    alternarHomebrewClases(): void {
        if (this.homebrewForzado)
            return;
        this.incluirHomebrewClases = !this.incluirHomebrewClases;
        this.recalcularClasesVisibles();
    }

    async continuarDesdeClases(): Promise<void> {
        const seleccion = this.claseSeleccionadaActual;
        if (!seleccion || !seleccion.puedeAplicarse)
            return;

        const requiereAvisoAlineamiento = seleccion.compatAlineamiento.requiereConfirmacion || seleccion.bloqueoSoloAlineamiento;
        if (requiereAvisoAlineamiento) {
            const detalleAlineamiento = seleccion.compatAlineamiento.tooltip;
            const avisoHomebrew = seleccion.compatAlineamiento.marcaHomebrew
                ? '<br><br><strong>Esta elección convertirá al personaje en Homebrew (no oficial).</strong>'
                : '';
            const confirmacion = await Swal.fire({
                icon: 'warning',
                title: 'Aviso de alineamiento de clase',
                html: `${detalleAlineamiento}${avisoHomebrew}`,
                showCancelButton: true,
                confirmButtonText: 'Aceptar y continuar',
                cancelButtonText: 'Cancelar',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            if (!confirmacion.isConfirmed)
                return;
        }

        let seleccionesOpcionales: SeleccionOpcionalesClase | null = null;
        let seleccionesDominios: SeleccionDominiosClase | null = null;
        const gruposOpcionales = this.nuevoPSvc.obtenerOpcionalesSiguienteNivelClase(seleccion.clase);
        if (gruposOpcionales.length > 0) {
            seleccionesOpcionales = await this.solicitarSeleccionesOpcionalesClase(gruposOpcionales);
            if (!seleccionesOpcionales)
                return;
        }

        const dominiosPendientes = this.nuevoPSvc.obtenerDominiosPendientesSiguienteNivelClase(seleccion.clase);
        if (dominiosPendientes && dominiosPendientes.cantidad > 0) {
            seleccionesDominios = await this.solicitarSeleccionesDominiosClase(dominiosPendientes, seleccion.clase?.Nombre);
            if (!seleccionesDominios)
                return;
        }

        const resultado = this.nuevoPSvc.aplicarSiguienteNivelClase(
            seleccion.clase,
            seleccionesOpcionales,
            seleccionesDominios,
            seleccion.bloqueoSoloAlineamiento
        );
        if (!resultado.aplicado) {
            const razones = resultado.evaluacion?.razones?.join(' | ') || resultado.razon || 'No se pudo aplicar el nivel de clase';
            Swal.fire({
                icon: 'warning',
                title: 'No se puede aplicar la clase',
                text: razones,
                showConfirmButton: true,
            });
            this.recalcularClasesVisibles();
            return;
        }

        if ((resultado.advertencias ?? []).length > 0) {
            await Swal.fire({
                icon: 'info',
                title: 'Nivel aplicado con avisos',
                html: `<div style="text-align:left;">${(resultado.advertencias ?? []).map((aviso) => `• ${aviso}`).join('<br>')}</div>`,
                confirmButtonText: 'Continuar',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
        }

        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        if (seleccion.clase.Oficial === false) {
            this.homebrewPorClaseAplicada = true;
            this.Personaje.Oficial = false;
        }
        if (seleccion.compatAlineamiento.marcaHomebrew) {
            this.hardAlignmentClassOverrideConfirmed = true;
            this.Personaje.Oficial = false;
        }
        this.recalcularOficialidad();

        const idiomasPendientes = this.nuevoPSvc.getIdiomasPendientesPostClase();
        if (idiomasPendientes.cantidad > 0) {
            const completo = await this.abrirSelectorIdiomasIniciales(idiomasPendientes.cantidad);
            if (!completo)
                return;
        }

        this.nuevoPSvc.actualizarPasoActual('habilidades');
        this.recalcularClasesVisibles();
        this.sincronizarTabConPaso();
    }

    private async solicitarSeleccionesDominiosClase(
        pendiente: ClaseDominiosPendientes,
        origenNombre: string = ''
    ): Promise<SeleccionDominiosClase | null> {
        const cantidad = Math.max(1, Math.trunc(Number(pendiente?.cantidad ?? 0)));
        const opciones = [...(pendiente?.opciones ?? [])];
        if (opciones.length < cantidad) {
            await Swal.fire({
                icon: 'warning',
                title: 'Dominios insuficientes',
                text: 'No hay suficientes dominios disponibles para completar esta selección.',
                showConfirmButton: true,
            });
            return null;
        }

        this.selectorDominiosTitulo = this.getTituloSelectorDominios(origenNombre, cantidad);
        this.selectorDominiosCantidadObjetivo = cantidad;
        this.selectorDominiosCantidadSeleccionada = 0;
        this.selectorDominiosBloquearCierre = false;
        this.selectorDominiosOpciones = opciones.map((opcion) => ({
            id: Number(opcion.id),
            nombre: `${opcion.nombre ?? ''}`.trim(),
            oficial: opcion.oficial !== false,
        }));
        this.modalSelectorDominiosAbierto = true;

        return new Promise<SeleccionDominiosClase | null>((resolve) => {
            this.resolverSelectorDominios = resolve;
        });
    }

    onConfirmarDominiosClase(seleccion: SeleccionDominiosClase): void {
        const ids = (seleccion ?? [])
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0);
        this.selectorDominiosCantidadSeleccionada = ids.length;
        this.cerrarSelectorDominiosContexto(ids);
    }

    onCerrarModalDominiosClase(): void {
        if (this.selectorDominiosBloquearCierre && this.selectorDominiosCantidadSeleccionada < this.selectorDominiosCantidadObjetivo)
            return;
        this.cerrarSelectorDominiosContexto(null);
    }

    private cerrarSelectorDominiosContexto(resultado: SeleccionDominiosClase | null): void {
        this.modalSelectorDominiosAbierto = false;
        this.selectorDominiosTitulo = 'Seleccionar dominios';
        this.selectorDominiosCantidadObjetivo = 0;
        this.selectorDominiosCantidadSeleccionada = 0;
        this.selectorDominiosBloquearCierre = false;
        this.selectorDominiosOpciones = [];

        const resolver = this.resolverSelectorDominios;
        this.resolverSelectorDominios = null;
        if (resolver)
            resolver(resultado);
    }

    private getTituloSelectorDominios(origenNombre: string, cantidad: number): string {
        const origen = `${origenNombre ?? ''}`.trim();
        const elemento = origen.length > 0 ? origen : 'Este elemento';
        if (cantidad === 1)
            return `${elemento} te otorga acceso a un dominio.`;
        return `${elemento} te otorga acceso a ${cantidad} dominios.`;
    }

    private async solicitarSeleccionesOpcionalesClase(grupos: ClaseGrupoOpcionalPendiente[]): Promise<SeleccionOpcionalesClase | null> {
        const selecciones: SeleccionOpcionalesClase = {};
        for (const grupo of grupos) {
            const inputOptions: Record<string, string> = {};
            grupo.opciones.forEach((opcion) => {
                inputOptions[opcion.clave] = this.getEtiquetaOpcionInternaClase(opcion);
            });

            const result = await Swal.fire({
                icon: 'question',
                title: `Grupo opcional ${grupo.grupo}`,
                text: 'Elige una opción para continuar con el nivel de clase.',
                input: 'select',
                inputOptions,
                inputPlaceholder: 'Selecciona una opción',
                showCancelButton: true,
                confirmButtonText: 'Aplicar',
                cancelButtonText: 'Cancelar',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
                inputValidator: (value) => value ? undefined : 'Debes elegir una opción',
            });

            if (!result.isConfirmed || !result.value)
                return null;
            selecciones[grupo.grupo] = `${result.value}`;
        }

        return selecciones;
    }

    private getEtiquetaOpcionInternaClase(opcion: {
        tipo: 'dote' | 'especial';
        nombre: string;
        extra: string;
    }): string {
        const tipo = opcion.tipo === 'dote' ? 'Dote' : 'Especial';
        const extra = `${opcion.extra ?? ''}`.trim();
        return extra.length > 0
            ? `${tipo}: ${opcion.nombre} (${extra})`
            : `${tipo}: ${opcion.nombre}`;
    }

    getClaseFilaCss(item: ClaseListadoItem): string {
        const clases = ['fila-clase'];
        if (Number(this.claseSeleccionadaId) === Number(item.clase.Id))
            clases.push('fila-clase--seleccionada');
        if (item.compatAlineamiento.estado === 'incompatible')
            clases.push('fila-clase--alineamiento-incompatible');
        else
            clases.push('fila-clase--alineamiento-compatible');
        return clases.join(' ');
    }

    abrirDetalleBeneficioClase(beneficio: ClaseBeneficioNivelItem, event?: Event): void {
        event?.stopPropagation();
        if (beneficio.tipo === 'dote') {
            if (beneficio.rawDote)
                this.doteDetalles.emit(beneficio.rawDote);
            return;
        }

        const nombreEspecial = `${beneficio.nombreEspecial ?? beneficio.nombre ?? ''}`.trim();
        if (nombreEspecial.length > 0)
            this.especialDetallesPorNombre.emit(nombreEspecial);
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
            this.recalcularClasesVisibles();
            return;
        }

        this.homebrewForzadoPorJugador = false;
        this.incluirHomebrewVentajas = false;
        this.incluirHomebrewPlantillas = false;
        this.incluirHomebrewIdiomas = false;
        this.nuevoPSvc.limpiarVentajasDesventajas();
        this.cerrarSelectorIdiomaContexto();
        this.recalcularOficialidad();
        this.recalcularClasesVisibles();
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
        this.recalcularClasesVisibles();
    }

    toggleDesventajaSeleccion(desventaja: VentajaDetalle): void {
        this.nuevoPSvc.toggleDesventaja(desventaja.Id);
        this.recalcularOficialidad();
        this.recalcularClasesVisibles();
    }

    onCerrarModalIdioma(): void {
        if (this.contextoSelectorIdioma === 'idiomasIniciales' && this.idiomasPendientesSelector > 0)
            return;

        const pendiente = this.ventajaPendienteIdiomaId;
        const eraContextoVentaja = this.contextoSelectorIdioma === 'ventaja';
        this.cerrarSelectorIdiomaContexto('cancelado');

        if (!eraContextoVentaja || pendiente === null)
            return;

        const seleccion = this.flujoVentajas.seleccionVentajas.find(v => v.id === pendiente);
        if (seleccion && !seleccion.idioma) {
            this.nuevoPSvc.quitarSeleccionVentaja(pendiente);
            this.recalcularOficialidad();
            this.recalcularClasesVisibles();
        }
    }

    onConfirmarIdiomaVentaja(idiomasSeleccionados: IdiomaDetalle[]): void {
        const idiomas = (idiomasSeleccionados ?? [])
            .filter((idioma) => !!idioma)
            .map((idioma) => ({ ...idioma }));

        if (idiomas.length < 1)
            return;

        if (this.contextoSelectorIdioma === 'idiomasIniciales') {
            const agregados = idiomas
                .map((idioma) => this.agregarIdiomaInicialTemporal(idioma))
                .filter((ok) => ok).length;

            if (agregados < 1) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No se pudo asignar el idioma',
                    text: 'Los idiomas seleccionados ya estaban asignados o no son válidos para esta selección.',
                    showConfirmButton: true,
                });
                return;
            }

            this.selectorIdiomaCantidadSeleccionada = this.idiomasTemporalesSeleccionados.length;
            if (this.idiomasPendientesSelector < 1) {
                this.cerrarSelectorIdiomaContexto('completado');
            }
            return;
        }

        const pendiente = this.ventajaPendienteIdiomaId;
        if (pendiente === null)
            return;

        const idioma = idiomas[0];
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

        this.cerrarSelectorIdiomaContexto('completado');
        this.recalcularOficialidad();
        this.recalcularClasesVisibles();
    }

    onCambioHomebrewModalIdiomas(value: boolean): void {
        if (this.homebrewForzado)
            return;
        this.incluirHomebrewIdiomas = value;
    }

    abrirSelectorIdiomasIniciales(cantidad: number): Promise<boolean> {
        const objetivo = Math.max(0, Math.trunc(Number(cantidad) || 0));
        if (objetivo < 1) {
            this.cerrarSelectorIdiomaContexto('completado');
            return Promise.resolve(true);
        }

        this.contextoSelectorIdioma = 'idiomasIniciales';
        this.selectorIdiomaTitulo = 'Seleccionar idiomas iniciales';
        this.selectorIdiomaCantidadObjetivo = objetivo;
        this.selectorIdiomaCantidadSeleccionada = 0;
        this.selectorIdiomaBloquearCierre = true;
        this.idiomasTemporalesSeleccionados = [];
        this.modalSelectorIdiomaAbierto = true;
        return new Promise<boolean>((resolve) => {
            this.resolverSelectorIdioma = resolve;
        });
    }

    private abrirSelectorIdiomaParaVentaja(idVentaja: number): void {
        this.contextoSelectorIdioma = 'ventaja';
        this.resolverSelectorIdioma = null;
        this.ventajaPendienteIdiomaId = idVentaja;
        this.selectorIdiomaTitulo = 'Seleccionar idioma de ventaja';
        this.selectorIdiomaCantidadObjetivo = 1;
        this.selectorIdiomaCantidadSeleccionada = 0;
        this.selectorIdiomaBloquearCierre = false;
        this.modalSelectorIdiomaAbierto = true;
    }

    private cerrarSelectorIdiomaContexto(resultado: 'completado' | 'cancelado' = 'cancelado'): void {
        this.modalSelectorIdiomaAbierto = false;
        this.ventajaPendienteIdiomaId = null;
        this.contextoSelectorIdioma = null;
        this.selectorIdiomaTitulo = 'Seleccionar idioma extra';
        this.selectorIdiomaCantidadObjetivo = 0;
        this.selectorIdiomaCantidadSeleccionada = 0;
        this.selectorIdiomaBloquearCierre = false;
        const resolver = this.resolverSelectorIdioma;
        this.resolverSelectorIdioma = null;
        if (resolver)
            resolver(resultado === 'completado');
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
                Origen: 'Idiomas iniciales',
            },
        ];
        this.recalcularClasesVisibles();
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

    private cargarRazasCatalogo(): void {
        this.razasSub?.unsubscribe();
        this.razasSub = this.razaSvc.getRazas().subscribe({
            next: (razas) => {
                this.razasCatalogo = razas ?? [];
            },
            error: () => {
                this.razasCatalogo = [];
            },
        });
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

    private cargarDominios(): void {
        this.dominiosSub?.unsubscribe();
        this.dominiosSub = this.dominioSvc.getDominios().subscribe({
            next: (dominios) => {
                this.catalogoDominios = dominios ?? [];
                this.nuevoPSvc.setCatalogoDominios(this.catalogoDominios);
            },
            error: () => {
                this.catalogoDominios = [];
                this.nuevoPSvc.setCatalogoDominios([]);
            },
        });
    }

    private cargarDeidades(): void {
        this.cargandoDeidades = true;
        this.deidadesSub?.unsubscribe();
        this.deidadesSub = this.deidadSvc.getDeidades().subscribe({
            next: (deidades) => {
                this.catalogoDeidades = deidades ?? [];
                this.nuevoPSvc.setCatalogoDeidades(this.catalogoDeidades);
                this.recalcularOficialidad();
                this.cargandoDeidades = false;
            },
            error: () => {
                this.catalogoDeidades = [];
                this.nuevoPSvc.setCatalogoDeidades([]);
                this.cargandoDeidades = false;
            },
        });
    }

    private cargarClases(): void {
        this.cargandoClases = true;
        this.clasesSub?.unsubscribe();
        this.clasesSub = this.claseSvc.getClases().subscribe({
            next: (clases) => {
                this.catalogoClases = clases ?? [];
                this.nuevoPSvc.setCatalogoClases(this.catalogoClases);
                this.recalcularClasesVisibles();
                this.cargandoClases = false;
            },
            error: () => {
                this.catalogoClases = [];
                this.nuevoPSvc.setCatalogoClases([]);
                this.clasesListadoFiltrado = [];
                this.cargandoClases = false;
            },
        });
    }

    private cargarAlineamientosBasicos(): void {
        this.alineamientosBasicosSub?.unsubscribe();
        this.alineamientosBasicosSub = this.alineamientoSvc.getAlineamientosBasicosCatalogo().subscribe({
            next: (alineamientos) => {
                this.catalogoAlineamientosBasicos = alineamientos ?? [];
                this.normalizarAlineamientoSeleccionado();
                this.recalcularOficialidad();
            },
            error: () => {
                this.catalogoAlineamientosBasicos = [];
                this.normalizarAlineamientoSeleccionado();
            },
        });
    }

    private cargarTiposCriatura(): void {
        this.tiposCriaturaSub?.unsubscribe();
        this.tiposCriaturaSub = this.tipoCriaturaSvc.getTiposCriatura().subscribe({
            next: (tipos: TipoCriatura[]) => {
                this.nuevoPSvc.setCatalogoTiposCriatura(tipos ?? []);
            },
            error: () => {
                this.nuevoPSvc.setCatalogoTiposCriatura([]);
            },
        });
    }

    private recalcularClasesVisibles(): void {
        const texto = this.normalizarTexto(this.filtroClasesTexto);
        const manual = this.filtroClasesManual;
        const evaluadas: ClaseListadoItem[] = [];

        this.catalogoClases.forEach((clase) => {
            const nombre = `${clase?.Nombre ?? ''}`.trim();
            const descripcion = `${clase?.Descripcion ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const claseId = Number(clase?.Id ?? 0);
            if (!Number.isFinite(claseId) || claseId <= 0)
                return;

            if (!this.incluirHomebrewClasesEfectivo && clase?.Oficial === false)
                return;
            if (manual !== 'Cualquiera' && `${clase?.Manual?.Nombre ?? ''}` !== manual)
                return;

            if (texto.length > 0) {
                const nombreNorm = this.normalizarTexto(nombre);
                const descNorm = this.normalizarTexto(descripcion);
                if (!nombreNorm.includes(texto) && !descNorm.includes(texto))
                    return;
            }

            if (!this.cumpleFiltroTipoLanzadorClase(clase))
                return;
            if (!this.cumpleFiltroRolClase(clase))
                return;
            if (!this.cumpleFiltroPrestigioClase(clase))
                return;

            const evaluacion = this.nuevoPSvc.evaluarClaseParaSeleccion(clase);
            const bloqueoSoloAlineamiento = this.nuevoPSvc.esBloqueoSoloPorAlineamiento(evaluacion);
            const puedeAplicarse = evaluacion.estado === 'eligible' || bloqueoSoloAlineamiento;
            if (!puedeAplicarse)
                return;

            const nivelActual = this.getNivelActualClasePorNombre(clase.Nombre);
            const siguienteNivel = nivelActual + 1;
            evaluadas.push({
                clase,
                evaluacion,
                siguienteNivel,
                elegida: nivelActual > 0,
                puedeAplicarse,
                bloqueoSoloAlineamiento,
                beneficios: this.getBeneficiosSiguienteNivelClase(clase, siguienteNivel),
                roles: this.getRolesClase(clase),
                compatAlineamiento: this.evaluarCompatibilidadAlineamientoClase(clase),
                esHomebrew: clase?.Oficial === false,
            });
        });

        evaluadas.sort((a, b) => {
            const bloqueA = this.getBloqueOrdenClase(a);
            const bloqueB = this.getBloqueOrdenClase(b);
            if (bloqueA !== bloqueB)
                return bloqueA - bloqueB;
            if (b.siguienteNivel !== a.siguienteNivel)
                return b.siguienteNivel - a.siguienteNivel;
            return a.clase.Nombre.localeCompare(b.clase.Nombre, 'es', { sensitivity: 'base' });
        });

        this.clasesListadoFiltrado = evaluadas;
        if (this.claseSeleccionadaId !== null) {
            const existeSeleccion = evaluadas.some((item) => Number(item.clase.Id) === Number(this.claseSeleccionadaId));
            if (!existeSeleccion)
                this.claseSeleccionadaId = null;
        }
    }

    private cumpleFiltroTipoLanzadorClase(clase: Clase): boolean {
        if (this.filtroClasesTipoLanzador === 'todas')
            return true;
        if (this.filtroClasesTipoLanzador === 'no lanzador') {
            return !clase?.Conjuros?.Arcanos
                && !clase?.Conjuros?.Divinos
                && !clase?.Conjuros?.Psionicos
                && !clase?.Conjuros?.Alma;
        }
        if (this.filtroClasesTipoLanzador === 'arcano')
            return !!clase?.Conjuros?.Arcanos;
        if (this.filtroClasesTipoLanzador === 'divino')
            return !!clase?.Conjuros?.Divinos;
        if (this.filtroClasesTipoLanzador === 'psionico')
            return !!clase?.Conjuros?.Psionicos;
        return !!clase?.Conjuros?.Alma;
    }

    private cumpleFiltroRolClase(clase: Clase): boolean {
        if (this.filtroClasesRol === 'todas')
            return true;
        if (this.filtroClasesRol === 'dps')
            return !!clase?.Roles?.Dps;
        if (this.filtroClasesRol === 'tanque')
            return !!clase?.Roles?.Tanque;
        if (this.filtroClasesRol === 'support')
            return !!clase?.Roles?.Support;
        return !!clase?.Roles?.Utilidad;
    }

    private cumpleFiltroPrestigioClase(clase: Clase): boolean {
        if (this.filtroClasesPrestigio === 'todas')
            return true;
        if (this.filtroClasesPrestigio === 'prestigio')
            return !!clase?.Prestigio;
        return !clase?.Prestigio;
    }

    private getNivelActualClasePorNombre(nombreClase: string): number {
        const nombreNorm = this.normalizarTexto(nombreClase);
        if (nombreNorm.length < 1)
            return 0;
        const encontrada = (this.Personaje?.desgloseClases ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        return Number(encontrada?.Nivel ?? 0) || 0;
    }

    private getBloqueOrdenClase(item: ClaseListadoItem): number {
        if (item.elegida)
            return 0;
        return 1;
    }

    private getRolesClase(clase: Clase): ClaseRolChip[] {
        const roles: ClaseRolChip[] = [];
        if (clase?.Roles?.Dps)
            roles.push('DPS');
        if (clase?.Roles?.Tanque)
            roles.push('Tanque');
        if (clase?.Roles?.Support)
            roles.push('Support');
        if (clase?.Roles?.Utilidad)
            roles.push('Utilidad');
        return roles;
    }

    private getDetalleNivelClase(clase: Clase, nivel: number): { Dotes: ClaseDoteNivel[]; Especiales: ClaseEspecialNivel[]; } | null {
        const detalle = (clase?.Desglose_niveles ?? []).find((item) => Number(item?.Nivel ?? 0) === Number(nivel));
        if (!detalle)
            return null;
        return {
            Dotes: detalle.Dotes ?? [],
            Especiales: detalle.Especiales ?? [],
        };
    }

    private getBeneficiosSiguienteNivelClase(clase: Clase, siguienteNivel: number): ClaseBeneficioNivelItem[] {
        const detalle = this.getDetalleNivelClase(clase, siguienteNivel);
        if (!detalle)
            return [];

        const beneficios: ClaseBeneficioNivelItem[] = [];
        (detalle.Dotes ?? []).forEach((doteNivel) => {
            const nombre = `${doteNivel?.Dote?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            beneficios.push({
                tipo: 'dote',
                nombre,
                extra: this.normalizarExtraBeneficio(`${doteNivel?.Extra ?? ''}`),
                opcional: Number(doteNivel?.Opcional ?? 0),
                idDote: Number(doteNivel?.Dote?.Id ?? 0),
                nombreEspecial: '',
                rawDote: doteNivel?.Dote ?? null,
            });
        });
        (detalle.Especiales ?? []).forEach((especialNivel) => {
            const nombreEspecial = this.resolverNombreEspecial(especialNivel?.Especial);
            if (nombreEspecial.length < 1)
                return;
            beneficios.push({
                tipo: 'especial',
                nombre: nombreEspecial,
                extra: this.normalizarExtraBeneficio(`${especialNivel?.Extra ?? ''}`, true),
                opcional: Number(especialNivel?.Opcional ?? 0),
                idDote: 0,
                nombreEspecial,
                rawDote: null,
            });
        });

        beneficios.sort((a, b) => {
            if (a.tipo !== b.tipo)
                return a.tipo === 'especial' ? -1 : 1;
            if (a.opcional !== b.opcional)
                return a.opcional - b.opcional;
            return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
        });
        return beneficios;
    }

    private resolverNombreEspecial(rawEspecial: any): string {
        const nombre = `${rawEspecial?.Nombre ?? rawEspecial?.nombre ?? rawEspecial?.Especial ?? rawEspecial?.especial ?? ''}`.trim();
        return nombre;
    }

    private normalizarExtraBeneficio(extraRaw: string, ocultarNoAplica: boolean = false): string {
        const extra = `${extraRaw ?? ''}`.trim();
        if (!ocultarNoAplica || extra.length < 1)
            return extra;

        const extraNorm = this.normalizarTexto(extra);
        if (extraNorm === 'no aplica'
            || extraNorm === 'n a'
            || extraNorm === 'na'
            || extraNorm === 'ninguno'
            || extraNorm === 'ninguna') {
            return '';
        }
        return extra;
    }

    private evaluarCompatibilidadAlineamientoClase(clase: Clase): ClaseCompatibilidadAlineamientoItem {
        const vectorPersonaje = getVectorDesdeNombreBasico(this.Personaje.Alineamiento ?? '');
        if (!vectorPersonaje) {
            return {
                estado: 'compatible',
                etiqueta: 'Compatible',
                tooltip: 'No se pudo interpretar el alineamiento actual del personaje.',
                prioridad: 0,
                requiereConfirmacion: false,
                marcaHomebrew: false,
            };
        }

        const reglas: Array<{ tipo: 'require' | 'forbid'; eje: 'ley' | 'moral' | 'basico'; valor: number | { ley: number; moral: number; }; texto: string; }> = [];
        const advertenciasParser: string[] = [];
        const alineamientoClase = clase?.Alineamiento;
        const basico = `${alineamientoClase?.Basico?.Nombre ?? ''}`.trim();
        const ley = `${alineamientoClase?.Ley?.Nombre ?? ''}`.trim();
        const moral = `${alineamientoClase?.Moral?.Nombre ?? ''}`.trim();

        const reglaBasico = this.parseReglaAlineamientoBasico(basico);
        if (reglaBasico)
            reglas.push(reglaBasico);
        else if (this.esTextoAlineamientoConContenido(basico)) {
            const reglaBasicoLey = this.parseReglaAlineamientoEje(basico, 'ley');
            const reglaBasicoMoral = this.parseReglaAlineamientoEje(basico, 'moral');
            if (reglaBasicoLey)
                reglas.push(reglaBasicoLey);
            if (reglaBasicoMoral)
                reglas.push(reglaBasicoMoral);
            if (!reglaBasicoLey && !reglaBasicoMoral)
                advertenciasParser.push(`No se interpretó la restricción básica: "${basico}"`);
        }

        const reglaLey = this.parseReglaAlineamientoEje(ley, 'ley');
        if (reglaLey)
            reglas.push(reglaLey);
        else if (this.esTextoAlineamientoConContenido(ley))
            advertenciasParser.push(`No se interpretó la restricción legal: "${ley}"`);

        const reglaMoral = this.parseReglaAlineamientoEje(moral, 'moral');
        if (reglaMoral)
            reglas.push(reglaMoral);
        else if (this.esTextoAlineamientoConContenido(moral))
            advertenciasParser.push(`No se interpretó la restricción moral: "${moral}"`);

        if (reglas.length < 1) {
            const tooltip = advertenciasParser.length > 0
                ? advertenciasParser.join(' | ')
                : 'La clase no impone una restricción interpretable de alineamiento.';
            return {
                estado: 'compatible',
                etiqueta: 'Compatible',
                tooltip,
                prioridad: Number(alineamientoClase?.Prioridad?.Id_prioridad ?? 0) || 0,
                requiereConfirmacion: false,
                marcaHomebrew: false,
            };
        }

        const incompatibilidades: string[] = [];
        reglas.forEach((regla) => {
            if (regla.eje === 'basico') {
                const valor = regla.valor as { ley: number; moral: number; };
                const coincide = vectorPersonaje.ley === valor.ley && vectorPersonaje.moral === valor.moral;
                if (regla.tipo === 'require' && !coincide)
                    incompatibilidades.push(`Requiere ${regla.texto}`);
                if (regla.tipo === 'forbid' && coincide)
                    incompatibilidades.push(`Prohíbe ${regla.texto}`);
                return;
            }

            const valor = Number(regla.valor);
            const valorActual = regla.eje === 'ley' ? vectorPersonaje.ley : vectorPersonaje.moral;
            const coincide = valorActual === valor;
            if (regla.tipo === 'require' && !coincide)
                incompatibilidades.push(`Requiere ${regla.texto}`);
            if (regla.tipo === 'forbid' && coincide)
                incompatibilidades.push(`Prohíbe ${regla.texto}`);
        });

        const prioridad = Number(alineamientoClase?.Prioridad?.Id_prioridad ?? 0) || 0;
        if (incompatibilidades.length > 0) {
            const mensajes = [
                ...incompatibilidades,
                ...advertenciasParser,
            ];
            return {
                estado: 'incompatible',
                etiqueta: 'No compatible',
                tooltip: mensajes.join(' | '),
                prioridad,
                requiereConfirmacion: true,
                marcaHomebrew: prioridad >= 3,
            };
        }

        const tooltip = advertenciasParser.length > 0
            ? `Compatible con reservas: ${advertenciasParser.join(' | ')}`
            : 'Compatible con el alineamiento del personaje.';
        return {
            estado: 'compatible',
            etiqueta: 'Compatible',
            tooltip,
            prioridad,
            requiereConfirmacion: false,
            marcaHomebrew: false,
        };
    }

    private esTextoAlineamientoConContenido(valor: string): boolean {
        const normalizado = this.normalizarTexto(valor ?? '');
        return normalizado.length > 0
            && normalizado !== 'no aplica'
            && normalizado !== 'no especifica'
            && normalizado !== 'no especificado'
            && normalizado !== 'ninguna preferencia'
            && normalizado !== 'cualquiera';
    }

    private parseReglaAlineamientoBasico(texto: string): { tipo: 'require' | 'forbid'; eje: 'basico'; valor: { ley: number; moral: number; }; texto: string; } | null {
        const normalizado = this.normalizarTexto(texto ?? '');
        if (!this.esTextoAlineamientoConContenido(texto))
            return null;

        const esProhibicion = normalizado.includes('nunca') || normalizado.includes('jamas') || normalizado.includes('prohib');
        const valor = this.extraerVectorAlineamientoDesdeTexto(normalizado);
        if (!valor)
            return null;
        return {
            tipo: esProhibicion ? 'forbid' : 'require',
            eje: 'basico',
            valor,
            texto: nombreBasicoDesdeVector(valor.ley, valor.moral),
        };
    }

    private parseReglaAlineamientoEje(
        texto: string,
        eje: 'ley' | 'moral'
    ): { tipo: 'require' | 'forbid'; eje: 'ley' | 'moral'; valor: number; texto: string; } | null {
        if (!this.esTextoAlineamientoConContenido(texto))
            return null;

        const normalizado = this.normalizarTexto(texto);
        const esProhibicion = normalizado.includes('nunca') || normalizado.includes('jamas') || normalizado.includes('prohib');
        const valor = eje === 'ley'
            ? this.extraerValorLeyDesdeTexto(normalizado)
            : this.extraerValorMoralDesdeTexto(normalizado);
        if (valor === null)
            return null;

        return {
            tipo: esProhibicion ? 'forbid' : 'require',
            eje,
            valor,
            texto: eje === 'ley'
                ? (valor > 0 ? 'Legal' : valor < 0 ? 'Caótico' : 'Neutral')
                : (valor > 0 ? 'Bueno' : valor < 0 ? 'Maligno' : 'Neutral'),
        };
    }

    private extraerVectorAlineamientoDesdeTexto(textoNormalizado: string): { ley: number; moral: number; } | null {
        const vectorDirecto = getVectorDesdeNombreBasico(textoNormalizado);
        if (vectorDirecto)
            return vectorDirecto;
        const ley = this.extraerValorLeyDesdeTexto(textoNormalizado);
        const moral = this.extraerValorMoralDesdeTexto(textoNormalizado);
        if (ley === null || moral === null)
            return null;
        return { ley, moral };
    }

    private extraerValorLeyDesdeTexto(textoNormalizado: string): number | null {
        if (textoNormalizado.includes('legal'))
            return 1;
        if (textoNormalizado.includes('caot'))
            return -1;
        if (textoNormalizado.includes('neutral'))
            return 0;
        return null;
    }

    private extraerValorMoralDesdeTexto(textoNormalizado: string): number | null {
        if (textoNormalizado.includes('buen'))
            return 1;
        if (textoNormalizado.includes('malign'))
            return -1;
        if (textoNormalizado.includes('neutral'))
            return 0;
        return null;
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
        const identidad = buildIdentidadPrerrequisitos(
            raza,
            this.nuevoPSvc.RazaBaseSeleccionadaCompleta,
            this.Personaje.Subtipos
        );

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
            tiposCriaturaMiembroIds: extraerIdsPositivos(identidad.tiposCriatura),
            tipoCriaturaActualId: Number(this.Personaje.Tipo_criatura?.Id ?? 0),
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
                const alineamientoResuelto = resolverAlineamientoPlantillas(
                    this.Personaje.Alineamiento,
                    [...this.plantillasSeleccionadas, plantilla]
                );
                if (alineamientoResuelto.conflicto) {
                    bloqueadasFailed.push({
                        plantilla,
                        evaluacion: {
                            estado: 'blocked_failed',
                            razones: alineamientoResuelto.razones,
                            advertencias: [],
                        },
                    });
                    return;
                }
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
