import { Component, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { getAuth } from '@angular/fire/auth';
import { MatTabGroup } from '@angular/material/tabs';
import { Subscription, firstValueFrom, take } from 'rxjs';
import { Campana, Super } from 'src/app/interfaces/campaña';
import { AlineamientoBasicoCatalogItem } from 'src/app/interfaces/alineamiento';
import { ArmaDetalle } from 'src/app/interfaces/arma';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { DominioDetalle } from 'src/app/interfaces/dominio';
import { GrupoCompetencia } from 'src/app/interfaces/grupo-competencia';
import { Clase, ClaseDoteNivel, ClaseEspecialNivel } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { DisciplinaConjuros } from 'src/app/interfaces/disciplina-conjuros';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { EnemigoPredilectoDetalle } from 'src/app/interfaces/enemigo-predilecto-detalle';
import { EscuelaConjuros } from 'src/app/interfaces/escuela-conjuros';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { RegionDetalle } from 'src/app/interfaces/region';
import { Raza } from 'src/app/interfaces/raza';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { CampanaService } from 'src/app/services/campana.service';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { DeidadService } from 'src/app/services/deidad.service';
import { DominioService } from 'src/app/services/dominio.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { DoteService } from 'src/app/services/dote.service';
import { EnemigoPredilectoService } from 'src/app/services/enemigo-predilecto.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { EspecialService } from 'src/app/services/especial.service';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { RegionService } from 'src/app/services/region.service';
import { FichasDescargaBackgroundService } from 'src/app/services/fichas-descarga-background.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import {
    AsignacionAumentoCaracteristica,
    AsignacionCaracteristicas,
    AumentoCaracteristicaPendiente,
    CompaneroPlantillaSelector,
    EstadoCuposFamiliar,
    EstadoCuposCompanero,
    CaracteristicaKeyAumento,
    ClaseAumentoLanzadorPendiente,
    ClaseDominiosPendientes,
    ClaseGrupoOpcionalPendiente,
    ConjurosSesionStateEntrada,
    DotePendienteState,
    DoteSeleccionConfirmada,
    DoteSelectorCandidato,
    EspecialidadMagicaPendiente,
    EspecialidadMagicaSeleccion,
    NuevoPersonajeService,
    ResultadoCalculoVidaFinal,
    SeleccionAumentosClaseLanzadora,
    SeleccionDominiosClase,
    SeleccionOpcionalesClase,
    StepNuevoPersonaje,
} from 'src/app/services/nuevo-personaje.service';
import {
    construirCatalogoFamiliaresDesdeMonstruos,
    evaluarFamiliaresElegibilidad,
    FamiliarPlantillaId,
    FamiliarElegibilidadEvaluadaItem,
} from 'src/app/services/utils/familiar-reglas';
import {
    construirCatalogoCompanerosDesdeMonstruos,
    CompaneroElegibilidadEvaluadaItem,
    evaluarCompanerosElegibilidad,
    resolverNivelesCompaneroDisponibles
} from 'src/app/services/utils/companero-reglas';
import { SelectorFamiliarConfirmacion } from './selector-familiar-modal/selector-familiar-modal.component';
import { SelectorCompaneroConfirmacion } from './selector-companero-modal/selector-companero-modal.component';
import { SelectorEspecialidadMagicaConfirmacion } from './selector-especialidad-magica-modal/selector-especialidad-magica-modal.component';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RazaService } from 'src/app/services/raza.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { VentajaService } from 'src/app/services/ventaja.service';
import { PlantillaEvaluacionResultado, evaluarElegibilidadPlantilla, resolverAlineamientoPlantillas } from 'src/app/services/utils/plantilla-elegibilidad';
import { buildIdentidadPrerrequisitos } from 'src/app/services/utils/identidad-prerrequisitos';
import { GrupoRacialesOpcionales, SeleccionRacialesOpcionales, agruparRacialesPorOpcional, getClaveSeleccionRacial } from 'src/app/services/utils/racial-opcionales';
import { RacialEvaluacionResultado, evaluarRacialParaSeleccion } from 'src/app/services/utils/racial-prerrequisitos';
import { ClaseEvaluacionResultado } from 'src/app/services/utils/clase-elegibilidad';
import { EvaluacionElegibilidadRazaBase, aplicarMutacion, esRazaMutada, evaluarElegibilidadRazaBase } from 'src/app/services/utils/raza-mutacion';
import {
    extraerEjesAlineamientoDesdeContrato,
    getVectorDesdeNombreBasico,
    nombreBasicoDesdeVector,
} from 'src/app/services/utils/alineamiento-contrato';
import { CatalogoNombreIdDto, PersonajeContextoIdsDto } from 'src/app/interfaces/personajes-api';
import { CampaignCreationPolicy } from 'src/app/interfaces/campaign-management';
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
type CaracteristicaAumentoKey = CaracteristicaKeyAumento;

interface ClaseBeneficioNivelItem {
    tipo: ClaseBeneficioTipo;
    nombre: string;
    extra: string;
    opcional: number;
    idExtra: number;
    idDote: number;
    nombreEspecial: string;
    rawDote: Dote | null;
}

interface ClaseBeneficioRenderSimpleItem {
    tipoRender: 'simple';
    beneficio: ClaseBeneficioNivelItem;
}

interface ClaseBeneficioRenderGrupoItem {
    tipoRender: 'grupo_opcional';
    grupo: number;
    opciones: ClaseBeneficioNivelItem[];
}

type ClaseBeneficioRenderItem = ClaseBeneficioRenderSimpleItem | ClaseBeneficioRenderGrupoItem;

interface ClaseSalvacionesDeltaItem {
    fortaleza: number;
    reflejos: number;
    voluntad: number;
}

interface ExtraHabilidadSelectorOpcion {
    valor: string;
    descripcion: string;
}

const EXTRA_PENDIENTE_PLACEHOLDERS = new Set([
    '-',
    'no aplica',
    'no especifica',
    'no se especifica',
    'ninguna',
    'nada',
    'desconocido',
    'placeholder',
    'elegir',
    'a elegir',
    'elige',
]);

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
    salvacionesDelta: ClaseSalvacionesDeltaItem;
    elegida: boolean;
    puedeAplicarse: boolean;
    bloqueoSoloAlineamiento: boolean;
    beneficios: ClaseBeneficioNivelItem[];
    beneficiosRender: ClaseBeneficioRenderItem[];
    roles: ClaseRolChip[];
    compatAlineamiento: ClaseCompatibilidadAlineamientoItem;
    esHomebrew: boolean;
}

interface SelectorFamiliarBloqueadoItem {
    familiar: FamiliarMonstruoDetalle;
    razones: string[];
    nivelMinimoRequerido: number | null;
}

interface SelectorCompaneroBloqueadoItem {
    companero: CompaneroMonstruoDetalle;
    razones: string[];
    nivelMinimoRequerido: number | null;
}

@Component({
    selector: 'app-nuevo-personaje',
    templateUrl: './nuevo-personaje.component.html',
    styleUrls: ['./nuevo-personaje.component.sass'],
    standalone: false
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
    campanasLoading = false;
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
    catalogoArmas: ArmaDetalle[] = [];
    catalogoArmaduras: ArmaduraDetalle[] = [];
    catalogoGruposArmas: GrupoCompetencia[] = [];
    catalogoGruposArmaduras: GrupoCompetencia[] = [];
    catalogoClases: Clase[] = [];
    catalogoDotes: Dote[] = [];
    catalogoConjuros: Conjuro[] = [];
    catalogoEscuelas: EscuelaConjuros[] = [];
    catalogoDisciplinas: DisciplinaConjuros[] = [];
    catalogoDominios: DominioDetalle[] = [];
    catalogoRegiones: RegionDetalle[] = [];
    catalogoEnemigosPredilectos: EnemigoPredilectoDetalle[] = [];
    catalogoDeidades: DeidadDetalle[] = [];
    clasesListadoFiltrado: ClaseListadoItem[] = [];
    claseSeleccionadaId: number | null = null;
    filtroClasesTexto: string = '';
    filtroClasesManual: string = 'Cualquiera';
    filtroClasesTipoLanzador: FiltroTipoLanzadorClase = 'todas';
    filtroClasesRol: FiltroRolClase = 'todas';
    filtroClasesPrestigio: FiltroPrestigioClase = 'todas';
    filtroConjurosTexto: string = '';
    filtroConjurosNivel: number | null = null;
    incluirHomebrewClases: boolean = false;
    private hardAlignmentClassOverrideConfirmed: boolean = false;
    private homebrewPorClaseAplicada: boolean = false;
    selectedCampaignPolicy: CampaignCreationPolicy | null = null;
    private selectedCampaignPolicyLoading = false;
    private selectedCampaignPolicyRequestKey = '';
    catalogoAlineamientosBasicos: AlineamientoBasicoCatalogItem[] = [];
    cargandoVentajas: boolean = true;
    cargandoIdiomas: boolean = true;
    cargandoClases: boolean = true;
    cargandoDeidades: boolean = true;
    private ventajaPendienteIdiomaId: number | null = null;
    modalSelectorIdiomaAbierto = false;
    modalSelectorDominiosAbierto = false;
    modalSelectorAumentosAbierto = false;
    modalSelectorEspecialidadMagicaAbierto = false;
    modalSelectorDotesAbierto = false;
    modalSelectorExtraHabilidadAbierto = false;
    modalSelectorEnemigoPredilectoAbierto = false;
    modalSelectorFamiliarAbierto = false;
    modalSelectorCompaneroAbierto = false;
    modalSelectorRazaBaseAbierto = false;
    modalSelectorRacialesOpcionalesAbierto = false;
    modalSelectorPuntosGolpeAbierto = false;
    modalSelectorVisibilidadAbierto = false;
    selectorDotePendienteActual: DotePendienteState | null = null;
    selectorDoteCandidatos: DoteSelectorCandidato[] = [];
    selectorDotePendientesRestantes = 0;
    selectorExtraHabilidadTitulo = 'Seleccionar extra';
    selectorExtraHabilidadNombre = '';
    selectorExtraHabilidadOpciones: ExtraHabilidadSelectorOpcion[] = [];
    selectorExtraHabilidadValorInicial = '';
    selectorEspecialidadClaseNombre = '';
    selectorEspecialidadRequiereArcano = false;
    selectorEspecialidadRequierePsionico = false;
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
    selectorAumentosTitulo = 'Seleccionar aumentos de caracteristica';
    selectorAumentosPendientes: AumentoCaracteristicaPendiente[] = [];
    selectorAumentosCaracteristicasActuales: Record<CaracteristicaAumentoKey, number> = {
        Fuerza: 0,
        Destreza: 0,
        Constitucion: 0,
        Inteligencia: 0,
        Sabiduria: 0,
        Carisma: 0,
    };
    selectorAumentosCaracteristicasPerdidas: Partial<Record<CaracteristicaAumentoKey, boolean>> = {};
    selectorAumentosTopes: Partial<Record<CaracteristicaAumentoKey, number>> = {};
    private resolverSelectorAumentos: ((completado: boolean) => void) | null = null;
    private resolverSelectorEspecialidadMagica: ((seleccion: SelectorEspecialidadMagicaConfirmacion | null) => void) | null = null;
    private resolverSelectorDotes: ((seleccion: DoteSeleccionConfirmada | 'omitir' | null) => void) | null = null;
    private resolverSelectorEnemigoPredilecto: ((seleccionId: number | null) => void) | null = null;
    private resolverSelectorExtraHabilidad: ((valor: string | null) => void) | null = null;
    selectorIdiomaTitulo = 'Seleccionar idioma extra';
    selectorIdiomaCantidadObjetivo = 0;
    selectorIdiomaCantidadSeleccionada = 0;
    selectorIdiomaBloquearCierre = false;
    selectorEnemigoPredilectoTitulo = 'Seleccionar enemigo predilecto';
    selectorEnemigoPredilectoIndice = 1;
    selectorEnemigoPredilectoTotal = 1;
    selectorFamiliarTitulo = 'Seleccionar familiar';
    selectorFamiliarPlantillaSeleccionada: FamiliarPlantillaId | null = null;
    selectorFamiliarIncluirHomebrew = false;
    selectorFamiliarCuposDisponibles = 0;
    selectorFamiliarNombre = '';
    selectorFamiliarEstadoCupos: EstadoCuposFamiliar | null = null;
    selectorFamiliarCatalogoCompleto: FamiliarMonstruoDetalle[] = [];
    selectorFamiliarElegibles: FamiliarMonstruoDetalle[] = [];
    selectorFamiliarBloqueados: SelectorFamiliarBloqueadoItem[] = [];
    selectorFamiliarNivelesRequeridos: Record<string, number> = {};
    private resolverSelectorFamiliar: ((seleccion: SelectorFamiliarConfirmacion | 'omitir' | null) => void) | null = null;
    private nombresEspecialesFamiliar: Record<number, string> | null = null;
    selectorCompaneroTitulo = 'Seleccionar compañero animal';
    selectorCompaneroPlantillaSeleccionada: CompaneroPlantillaSelector | null = null;
    selectorCompaneroIncluirHomebrew = false;
    selectorCompaneroCuposDisponibles = 0;
    selectorCompaneroNombre = '';
    selectorCompaneroEstadoCupos: EstadoCuposCompanero | null = null;
    selectorCompaneroCatalogoCompleto: CompaneroMonstruoDetalle[] = [];
    selectorCompaneroElegibles: CompaneroMonstruoDetalle[] = [];
    selectorCompaneroBloqueados: SelectorCompaneroBloqueadoItem[] = [];
    selectorCompaneroNivelesRequeridos: Record<string, number> = {};
    selectorCompaneroNivelesDisponibles: number[] = [];
    selectorCompaneroNivelSeleccionado: number | null = null;
    private resolverSelectorCompanero: ((seleccion: SelectorCompaneroConfirmacion | 'omitir' | null) => void) | null = null;
    private nombresEspecialesCompanero: Record<number, string> | null = null;
    private idiomasTemporalesSeleccionados: IdiomaDetalle[] = [];
    resultadoVidaActual: ResultadoCalculoVidaFinal | null = null;
    tiradasVidaTotales = 3;
    tiradasVidaRestantes = 0;
    selectorVisibilidadValorInicial: boolean | null = null;
    finalizacionEnCurso = false;
    finalizacionState: {
        idPersonaje: number | null;
        sqlOk: boolean;
        firebaseOk: boolean;
    } = {
            idPersonaje: null,
            sqlOk: false,
            firebaseOk: false,
        };
    selectedInternalTabIndex = 0;
    private campanasSub?: Subscription;
    private plantillasSub?: Subscription;
    private ventajasSub?: Subscription;
    private desventajasSub?: Subscription;
    private habilidadesSub?: Subscription;
    private habilidadesCustomSub?: Subscription;
    private idiomasSub?: Subscription;
    private armasSub?: Subscription;
    private armadurasSub?: Subscription;
    private gruposArmasSub?: Subscription;
    private gruposArmadurasSub?: Subscription;
    private razasSub?: Subscription;
    private clasesSub?: Subscription;
    private dotesSub?: Subscription;
    private conjurosCatalogoCargado = false;
    private escuelasCatalogoCargado = false;
    private disciplinasCatalogoCargado = false;
    private dominiosSub?: Subscription;
    private regionesSub?: Subscription;
    private enemigosPredilectosSub?: Subscription;
    private deidadesSub?: Subscription;
    private tiposCriaturaSub?: Subscription;
    private alineamientosBasicosSub?: Subscription;
    @ViewChild(MatTabGroup) TabGroup?: MatTabGroup;
    @Output() personajeFinalizado = new EventEmitter<number>();

    constructor(
        private nuevoPSvc: NuevoPersonajeService,
        private campanaSvc: CampanaService,
        private alineamientoSvc: AlineamientoService,
        private claseSvc: ClaseService,
        private conjuroSvc: ConjuroService,
        private escSvc: EscuelaConjurosService,
        private disSvc: DisciplinaConjurosService,
        private razaSvc: RazaService,
        private plantillaSvc: PlantillaService,
        private ventajaSvc: VentajaService,
        private habilidadSvc: HabilidadService,
        private idiomaSvc: IdiomaService,
        private doteSvc: DoteService,
        private enemigoPredilectoSvc: EnemigoPredilectoService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private grupoArmaSvc: GrupoArmaService,
        private grupoArmaduraSvc: GrupoArmaduraService,
        private dominioSvc: DominioService,
        private regionSvc: RegionService,
        private deidadSvc: DeidadService,
        private tipoCriaturaSvc: TipoCriaturaService,
        private monstruoSvc: MonstruoService,
        private especialSvc: EspecialService,
        private personajeSvc: PersonajeService,
        private fichasDescargaBgSvc: FichasDescargaBackgroundService
    ) {
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
    }

    ngOnInit(): void {
        this.nuevoPSvc.refrescarDerivadasPreviewNuevoPersonaje();
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.sincronizarOwnerUidEnCreacion();
        this.normalizarDeidadSeleccionada();
        this.normalizarRegionSeleccionada();
        this.nuevoPSvc.sincronizarConfigGeneradorDesdeCuenta().catch(() => undefined);
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
        this.cargarArmas();
        this.cargarArmaduras();
        this.cargarGruposArmas();
        this.cargarGruposArmaduras();
        this.cargarDominios();
        this.cargarRegiones();
        this.cargarEnemigosPredilectos();
        this.cargarDeidades();
        this.cargarClases();
        this.cargarDotes();
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
        this.armasSub?.unsubscribe();
        this.armadurasSub?.unsubscribe();
        this.gruposArmasSub?.unsubscribe();
        this.gruposArmadurasSub?.unsubscribe();
        this.razasSub?.unsubscribe();
        this.clasesSub?.unsubscribe();
        this.dotesSub?.unsubscribe();
        this.dominiosSub?.unsubscribe();
        this.regionesSub?.unsubscribe();
        this.enemigosPredilectosSub?.unsubscribe();
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

    get puedeLimpiarSeleccionPlantillas(): boolean {
        return this.plantillasSeleccionadas
            .some((plantilla) => !this.esPlantillaConfirmada(plantilla));
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

    get flujoHabilidades() {
        return this.flujo.habilidades;
    }

    get origenHabilidadesTexto(): string {
        const origen = this.flujoHabilidades?.origen;
        if (!origen)
            return '-';

        if (origen === 'raza_dg') {
            const nombreRaza = `${this.razaSeleccionada?.Nombre ?? ''}`.trim();
            return nombreRaza.length > 0 ? nombreRaza : 'Raza';
        }

        if (origen === 'plantilla_dg') {
            const plantillasConDg = this.plantillasSeleccionadas
                .filter((plantilla) => this.aportaDgPlantilla(plantilla));
            if (plantillasConDg.length === 1) {
                const nombrePlantilla = `${plantillasConDg[0]?.Nombre ?? ''}`.trim();
                return nombrePlantilla.length > 0 ? nombrePlantilla : 'Plantilla';
            }
            return 'Plantillas';
        }

        if (origen === 'clase_nivel')
            return 'Nivel';

        return `${origen}`;
    }

    get habilidadesOrdenadas(): Personaje['Habilidades'] {
        const visibles = [...(this.Personaje?.Habilidades ?? [])]
            .filter((habilidad) => !this.esNombreHabilidadOcultaEnTabla(`${habilidad?.Nombre ?? ''}`));
        return visibles.sort((a, b) => {
            const customA = !!a?.Custom;
            const customB = !!b?.Custom;
            if (customA !== customB)
                return customA ? 1 : -1;
            return `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' });
        });
    }

    get puedeContinuarHabilidades(): boolean {
        return this.nuevoPSvc.puedeCerrarDistribucionHabilidades();
    }

    get flujoConjuros() {
        return this.nuevoPSvc.getConjurosSesionActual();
    }

    get entradaConjurosActual(): ConjurosSesionStateEntrada | null {
        const sesion = this.flujoConjuros;
        if (!sesion.activa || sesion.entradas.length < 1)
            return null;
        const indice = Number(sesion.indiceEntradaActual ?? 0);
        return sesion.entradas[indice] ?? sesion.entradas[0] ?? null;
    }

    get conjurosDisponiblesActuales(): Conjuro[] {
        return this.nuevoPSvc.filtrarConjurosDisponibles(this.filtroConjurosTexto, this.filtroConjurosNivel);
    }

    get conjurosSeleccionadosActuales(): Conjuro[] {
        const entrada = this.entradaConjurosActual;
        if (!entrada)
            return [];
        const ids = new Set<number>([
            ...(entrada.autoadicionadosIds ?? []),
            ...(entrada.seleccionadosIds ?? []),
        ].map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0));
        return Array.from(ids)
            .map((id) => this.catalogoConjuros.find((conjuro) => Number(conjuro?.Id) === id)
                ?? (this.Personaje?.Conjuros ?? []).find((conjuro) => Number(conjuro?.Id) === id)
                ?? {
                    Id: id,
                    Nombre: `Conjuro ${id}`,
                } as Conjuro)
            .sort((a, b) => {
                const nivelA = Number(entrada.nivelesPorConjuro?.[Number(a?.Id)] ?? 0);
                const nivelB = Number(entrada.nivelesPorConjuro?.[Number(b?.Id)] ?? 0);
                if (nivelA !== nivelB)
                    return nivelA - nivelB;
                return `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' });
            });
    }

    get nivelesConjurosDisponibles(): number[] {
        const entrada = this.entradaConjurosActual;
        if (!entrada)
            return [];
        return Object.values(entrada.nivelesPorConjuro ?? {})
            .map((nivel) => Number(nivel))
            .filter((nivel) => Number.isFinite(nivel) && nivel >= 0)
            .filter((nivel, index, lista) => lista.indexOf(nivel) === index)
            .sort((a, b) => a - b);
    }

    get mensajeProgresoConjuros(): string {
        const entrada = this.entradaConjurosActual;
        if (!entrada)
            return '';

        if (entrada.almaPendiente)
            return 'La selección de conjuros de alma se añadirá en una fase posterior.';
        if (entrada.autoadicion)
            return `Se añadirán automáticamente ${entrada.autoadicionadosIds.length} conjuros.`;
        if (entrada.sinElegibles)
            return 'No hay conjuros elegibles para este avance.';
        if (!entrada.seleccionManual)
            return 'Este avance no otorga nuevos conjuros conocidos.';

        if (Number(entrada.cupoInicial?.total ?? 0) > 0) {
            const pendiente = Number(entrada.cupoPendiente?.total ?? 0);
            return `Te quedan ${pendiente} conjuros por elegir.`;
        }

        const pendientesPorNivel = Object.keys(entrada.cupoPendiente?.porNivel ?? {})
            .map((nivel) => Number(nivel))
            .filter((nivel) => Number.isFinite(nivel) && nivel >= 0)
            .sort((a, b) => a - b)
            .map((nivel) => `${entrada.cupoPendiente.porNivel[nivel]} de nivel ${nivel}`)
            .join(', ');
        return pendientesPorNivel.length > 0
            ? `Te quedan ${pendientesPorNivel}.`
            : 'Selección de conjuros completada.';
    }

    get puedeContinuarConjuros(): boolean {
        return this.nuevoPSvc.puedeCerrarSesionConjuros();
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

    get mostrarInfoRecomendacionesClase(): boolean {
        const autoReparto = this.Personaje?.Auto_reparto;
        if (!autoReparto || autoReparto.version !== 'quiz_v1')
            return false;
        if (autoReparto.aplicadoAutomaticamente !== true)
            return false;
        if (!autoReparto.recomendacion)
            return false;
        return this.totalNivelesClaseActual <= 0;
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

    get totalNivelesClaseActual(): number {
        return (this.Personaje?.desgloseClases ?? [])
            .reduce((acc, entrada) => acc + Math.max(0, Number(entrada?.Nivel ?? 0)), 0);
    }

    get mostrarBotonFinalizarCreacion(): boolean {
        const dgsRaciales = Math.max(
            0,
            Number(this.Personaje?.Raza?.Dgs_adicionales?.Cantidad ?? this.razaSeleccionada?.Dgs_adicionales?.Cantidad ?? 0)
        );
        return this.totalNivelesClaseActual > 0 || dgsRaciales >= 4;
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
        const lista = [this.deidadSinSeleccion, ...candidatas];
        const deidadActual = `${this.Personaje.Deidad ?? ''}`.trim();
        if (deidadActual.length > 0) {
            const existe = lista.some((item) => this.normalizarTexto(item) === this.normalizarTexto(deidadActual));
            if (!existe)
                lista.push(deidadActual);
        }
        return lista;
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

    get idRegionSeleccionadaBasicos(): number {
        const raw = (this.Personaje as any)?.Id_region
            ?? (this.Personaje as any)?.id_region
            ?? (this.Personaje as any)?.Region?.Id
            ?? (this.Personaje as any)?.Region?.id
            ?? (this.Personaje as any)?.region?.Id
            ?? (this.Personaje as any)?.region?.id;
        const parsed = Math.trunc(Number(raw));
        if (!Number.isFinite(parsed) || parsed < 0)
            return 0;
        return parsed;
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

    async continuarDesdeBasicos(desdeAtajoTeclado = false): Promise<void> {
        if (!this.razaElegida || !this.puedeContinuarBasicos) {
            return;
        }

        if (!await this.ensureSelectedCampaignPolicyReady())
            return;

        let mostroAlertaInconsistencias = false;
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
        const permiteIgnorarAlineamiento = this.canIgnoreAlignmentRestrictionsForCurrentContext;
        if (hayPreview || hayConflictosDuros || hayOtrosBloqueos) {
            mostroAlertaInconsistencias = true;
            const previewHtml = hayPreview
                ? `<p style="text-align:left; margin: 0 0 6px 0;"><strong>Advertencias</strong></p><ul style="text-align:left; margin-top: 4px;">${evaluacion.previewWarnings.map(i => `<li>${i}</li>`).join('')}</ul>`
                : '';
            const conflictosHtml = hayConflictosDuros
                ? `<p style="text-align:left; margin: 8px 0 6px 0;"><strong>Regla dura de alineamiento</strong></p><ul style="text-align:left; margin-top: 4px;">${evaluacion.hardConflicts.map((c) => c.origen === 'raza'
                    ? `<li>Has elegido <strong>${c.elegido}</strong>, mientras que tu raza exige <strong>${c.requerido}</strong>${c.prioridad ? ` (prioridad ${c.prioridad})` : ''}.</li>`
                    : `<li>Has elegido <strong>${c.elegido}</strong>, mientras que tu deidad exige <strong>${c.requerido}</strong>.</li>`
                ).join('')}</ul><p style="text-align:left; margin: 8px 0 0 0;"><strong>${permiteIgnorarAlineamiento
                    ? 'Con tus elecciones estás saltándote una regla importante del sistema. Si continúas, el personaje quedará marcado como homebrew, seguirá mostrando este aviso en creación y será una rareza excepcional en el mundo.'
                    : 'Esta campaña no permite saltarse restricciones de alineamiento. Debes cambiar tus elecciones antes de continuar.'
                }</strong></p>`
                : '';
            const bloqueosHtml = hayOtrosBloqueos
                ? `<p style="text-align:left; margin: 8px 0 6px 0;"><strong>Impacto en oficialidad</strong></p><ul style="text-align:left; margin-top: 4px;">${evaluacion.otherOfficialBlockers.map(i => `<li>${i}</li>`).join('')}</ul>`
                : '';
            if (hayConflictosDuros && !permiteIgnorarAlineamiento) {
                await Swal.fire({
                    title: 'La campaña no permite este alineamiento',
                    html: `${previewHtml}${conflictosHtml}${bloqueosHtml}`,
                    icon: 'warning',
                    confirmButtonText: 'Entendido',
                    returnFocus: false,
                });
                return;
            }
            const result = await Swal.fire({
                title: 'Tus elecciones van en contra de los manuales',
                html: `Cancelar para cambiarlas o aceptar si quieres continuar con una excepción marcada como homebrew.${previewHtml}${conflictosHtml}${bloqueosHtml}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Aceptar y continuar',
                cancelButtonText: 'Cancelar',
                returnFocus: false,
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
            this.nuevoPSvc.refrescarDerivadasPreviewNuevoPersonaje();
            this.ventanaDetalleAbierta = true;
        }
        if (mostroAlertaInconsistencias)
            await this.esperarSiguienteTickUi();
        if (desdeAtajoTeclado)
            await this.esperarSiguienteTickUi();

        this.limpiarFocoActivoAntesDeModal();
        this.abrirModalCaracteristicas();
    }

    @HostListener('window:resize')
    onViewportResize(): void {
        if (!this.isVentanaDetalleHabilitada() && this.ventanaDetalleAbierta) {
            this.ventanaDetalleAbierta = false;
        }
    }

    @HostListener('document:keydown.enter', ['$event'])
    onEnterPresionado(event: KeyboardEvent): void {
        if (event.repeat || this.hayModalBloqueandoAtajos())
            return;

        const target = event.target as HTMLElement | null;
        if (this.esElementoInteractivoParaEnter(target))
            return;

        let accionAplicada = false;
        if (this.flujo.pasoActual === 'basicos' && this.puedeContinuarBasicos) {
            void this.continuarDesdeBasicos(true);
            accionAplicada = true;
        } else if (this.flujo.pasoActual === 'plantillas') {
            void this.continuarDesdePlantillas();
            accionAplicada = true;
        } else if (this.flujo.pasoActual === 'ventajas' && this.puedeContinuarVentajas) {
            this.continuarDesdeVentajas();
            accionAplicada = true;
        } else if (this.flujo.pasoActual === 'clases' && this.puedeAplicarClaseSeleccionada) {
            void this.continuarDesdeClases();
            accionAplicada = true;
        } else if (this.flujo.pasoActual === 'habilidades' && this.puedeContinuarHabilidades) {
            void this.continuarDesdeHabilidades();
            accionAplicada = true;
        } else if (this.flujo.pasoActual === 'conjuros' && this.puedeContinuarConjuros) {
            this.continuarDesdeConjuros();
            accionAplicada = true;
        }

        if (accionAplicada)
            event.preventDefault();
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

    async finalizarGeneracionCaracteristicas(asignaciones: AsignacionCaracteristicas): Promise<void> {
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

        this.nuevoPSvc.registrarAumentosPendientesPorProgresion('Progresion inicial por DGs raciales');
        const aumentosCompletados = await this.abrirSelectorAumentosCaracteristica();
        if (!aumentosCompletados)
            return;

        this.recalcularOficialidad();
        this.recalcularPlantillasVisibles();
        this.recalcularClasesVisibles();
        if (this.nuevoPSvc.iniciarDistribucionHabilidadesPorRazaDG()) {
            this.Personaje = this.nuevoPSvc.PersonajeCreacion;
            this.sincronizarTabConPaso();
            return;
        }

        this.nuevoPSvc.registrarDotesPendientesPorRazaExtras(`${this.razaSeleccionada?.Nombre ?? 'Raza'}`);
        const dotesCompletadas = await this.resolverDotesPendientes();
        if (!dotesCompletadas)
            return;

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
        if (paso === 'conjuros') {
            return 6;
        }
        if (paso === 'dotes') {
            return 6;
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

    private esperarSiguienteTickUi(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, 0));
    }

    private limpiarFocoActivoAntesDeModal(): void {
        if (typeof document === 'undefined') {
            return;
        }

        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body || typeof active.blur !== 'function') {
            return;
        }
        active.blur();
    }

    private normalizarDeidadSeleccionada(): void {
        const deidad = `${this.Personaje?.Deidad ?? ''}`.trim();
        this.Personaje.Deidad = deidad.length > 0 ? deidad : this.deidadSinSeleccion;
    }

    private normalizarRegionSeleccionada(): void {
        const rawId = (this.Personaje as any)?.Id_region
            ?? (this.Personaje as any)?.id_region
            ?? (this.Personaje as any)?.Region?.Id
            ?? (this.Personaje as any)?.Region?.id
            ?? (this.Personaje as any)?.region?.Id
            ?? (this.Personaje as any)?.region?.id;
        const rawIdText = `${rawId ?? ''}`.trim();
        const idParsed = Math.trunc(Number(rawIdText));
        const idRawValido = rawIdText.length > 0 && Number.isFinite(idParsed) && idParsed >= 0;

        const nombreRaw = `${(this.Personaje as any)?.Region?.Nombre
            ?? (this.Personaje as any)?.Region?.nombre
            ?? (this.Personaje as any)?.region?.Nombre
            ?? (this.Personaje as any)?.region?.nombre
            ?? ''}`.trim();

        let idRegion: number;
        if (idRawValido) {
            idRegion = idParsed;
        } else {
            const idPorNombre = this.resolverIdRegionCatalogoPorNombre(nombreRaw);
            idRegion = idPorNombre ?? 0;
        }

        const nombreCatalogo = this.resolverNombreRegionCatalogoPorId(idRegion);
        const nombreRegion = idRegion === 0
            ? 'Sin región'
            : (nombreRaw.length > 0 ? nombreRaw : nombreCatalogo);

        (this.Personaje as any).Id_region = idRegion;
        (this.Personaje as any).Region = {
            Id: idRegion,
            Nombre: nombreRegion,
        };
    }

    private resolverIdRegionCatalogoPorNombre(nombreRegion: string): number | null {
        const nombreNorm = this.normalizarTexto(nombreRegion ?? '');
        if (nombreNorm.length < 1)
            return null;
        const region = (this.catalogoRegiones ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const id = Math.trunc(Number(region?.Id ?? 0));
        if (!Number.isFinite(id) || id <= 0)
            return null;
        return id;
    }

    private resolverNombreRegionCatalogoPorId(idRegion: number): string {
        const id = Math.trunc(Number(idRegion));
        if (!Number.isFinite(id) || id <= 0)
            return '';
        const region = (this.catalogoRegiones ?? [])
            .find((item) => Math.trunc(Number(item?.Id ?? 0)) === id);
        return `${region?.Nombre ?? ''}`.trim();
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
        this.normalizarDeidadSeleccionada();
        this.resetHardAlignmentOverride();
        this.recalcularOficialidad();
    }

    onRegionOrigenChange(value: any): void {
        const parsed = Math.trunc(Number(value));
        const idRegion = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
        const nombreCatalogo = this.resolverNombreRegionCatalogoPorId(idRegion);
        const nombreRegion = idRegion === 0
            ? 'Sin región'
            : (nombreCatalogo.length > 0 ? nombreCatalogo : `${(this.Personaje as any)?.Region?.Nombre ?? ''}`.trim());

        (this.Personaje as any).Id_region = idRegion;
        (this.Personaje as any).Region = {
            Id: idRegion,
            Nombre: nombreRegion,
        };
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

    private hayModalBloqueandoAtajos(): boolean {
        return this.modalCaracteristicasAbierto
            || this.modalSelectorIdiomaAbierto
            || this.modalSelectorDominiosAbierto
            || this.modalSelectorAumentosAbierto
            || this.modalSelectorEspecialidadMagicaAbierto
            || this.modalSelectorDotesAbierto
            || this.modalSelectorEnemigoPredilectoAbierto
            || this.modalSelectorFamiliarAbierto
            || this.modalSelectorExtraHabilidadAbierto
            || this.modalSelectorRazaBaseAbierto
            || this.modalSelectorRacialesOpcionalesAbierto
            || this.modalSelectorPuntosGolpeAbierto
            || this.modalSelectorVisibilidadAbierto;
    }

    private esElementoInteractivoParaEnter(target: HTMLElement | null): boolean {
        if (!target)
            return false;

        if (target.isContentEditable)
            return true;

        // Permitimos Enter en casi toda la UI para avanzar por pestañas,
        // pero evitamos interferir en controles donde Enter tiene semántica propia.
        const selectorBloqueado = 'textarea, button, a, [role="button"], [role="option"], [role="listbox"], [role="menuitem"], .cdk-overlay-pane';
        return !!target.closest(selectorBloqueado);
    }

    private aportaDgPlantilla(plantilla: Plantilla | null | undefined): boolean {
        const multiplicador = Number(plantilla?.Licantronia_dg?.Multiplicador ?? 0);
        return Number.isFinite(multiplicador) && Math.trunc(multiplicador) > 0;
    }

    private async cargarCampanas() {
        this.campanasSub?.unsubscribe();
        this.campanasLoading = true;
        this.campanasSub = (await this.campanaSvc.getListCampanas()).subscribe({
            next: (campanas) => {
                const nextCampanas = this.filtrarCampanasDuplicadasEnSelector(campanas);
                this.sincronizarNombreCampanaSeleccionada(nextCampanas);
                this.Campanas = nextCampanas;
                this.campanasLoading = false;
                this.actualizarTramas();
            },
            error: () => {
                this.campanasLoading = false;
            },
        });
    }

    private filtrarCampanasDuplicadasEnSelector(campanas: Campana[]): Campana[] {
        const sinCampana = this.normalizarTexto('Sin campaña');
        return (campanas ?? []).filter((campana) => this.normalizarTexto(campana?.Nombre ?? '') !== sinCampana);
    }

    private sincronizarNombreCampanaSeleccionada(campanas: Campana[]): void {
        const currentName = `${this.Personaje?.Campana ?? ''}`.trim();
        if (currentName.length < 1 || this.normalizarTexto(currentName) === this.normalizarTexto('Sin campaña'))
            return;

        const currentStillExists = (campanas ?? []).some((campana) => this.normalizarTexto(campana?.Nombre ?? '') === this.normalizarTexto(currentName));
        if (currentStillExists)
            return;

        const previousCampaignId = this.toPositiveInt(
            this.Campanas.find((campana) => this.normalizarTexto(campana?.Nombre ?? '') === this.normalizarTexto(currentName))?.Id
        );
        if (!previousCampaignId)
            return;

        const renamedCampaign = (campanas ?? []).find((campana) => this.toPositiveInt(campana?.Id) === previousCampaignId);
        if (renamedCampaign?.Nombre)
            this.Personaje.Campana = renamedCampaign.Nombre;
    }

    actualizarTramas(): void {
        if (this.Personaje.Campana === 'Sin campaña') {
            this.selectedCampaignPolicy = null;
            this.Tramas = [];
            this.Subtramas = [];
            this.Personaje.Trama = 'Trama base';
            this.Personaje.Subtrama = 'Subtrama base';
            return;
        }

        const campanaSeleccionada = this.Campanas.find(c => c.Nombre === this.Personaje.Campana);
        if (!campanaSeleccionada) {
            this.Personaje.Campana = 'Sin campaña';
            this.selectedCampaignPolicy = null;
            this.Tramas = [];
            this.Subtramas = [];
            this.Personaje.Trama = 'Trama base';
            this.Personaje.Subtrama = 'Subtrama base';
            return;
        }

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

        void this.syncSelectedCampaignPolicy();
        this.actualizarSubtramas();
    }

    actualizarSubtramas(): void {
        if (this.Personaje.Campana === 'Sin campaña') {
            this.Subtramas = [];
            this.Personaje.Subtrama = 'Subtrama base';
            return;
        }

        const campanaSeleccionada = this.Campanas.find(c => c.Nombre === this.Personaje.Campana);
        if (!campanaSeleccionada) {
            this.Personaje.Campana = 'Sin campaña';
            this.Subtramas = [];
            this.Personaje.Trama = 'Trama base';
            this.Personaje.Subtrama = 'Subtrama base';
            return;
        }

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

    @Output() conjuroDetalles: EventEmitter<Conjuro> = new EventEmitter<Conjuro>();
    verDetallesConjuro(value: Conjuro): void {
        const id = Number(value?.Id ?? 0);
        const porId = (this.catalogoConjuros ?? []).find((conjuro) => Number(conjuro?.Id) === id)
            ?? (this.Personaje?.Conjuros ?? []).find((conjuro) => Number(conjuro?.Id) === id);
        if (porId) {
            this.conjuroDetalles.emit(porId);
            return;
        }

        const nombreBuscado = this.normalizarTexto(value?.Nombre ?? '');
        if (nombreBuscado.length < 1)
            return;
        const porNombre = (this.catalogoConjuros ?? []).find((conjuro) => this.normalizarTexto(conjuro?.Nombre ?? '') === nombreBuscado)
            ?? (this.Personaje?.Conjuros ?? []).find((conjuro) => this.normalizarTexto(conjuro?.Nombre ?? '') === nombreBuscado);
        if (porNombre)
            this.conjuroDetalles.emit(porNombre);
    }

    verDetallesClaseDesdeFicha(nombreClase: string): void {
        const nombreBuscado = this.normalizarTexto(nombreClase ?? '');
        if (nombreBuscado.length < 1)
            return;

        const clase = (this.catalogoClases ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreBuscado);
        if (!clase)
            return;

        this.claseDetalles.emit(clase);
    }

    @Output() doteDetalles: EventEmitter<Dote | DoteContextual> = new EventEmitter<Dote | DoteContextual>();
    @Output() especialDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();

    verDetallesDote(value: Dote): void {
        const nombre = `${value?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;
        this.doteDetalles.emit(value);
    }

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

    @Output() deidadDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    verDetallesDeidadDesdeReferencia(nombreDeidad: string): void {
        const nombre = `${nombreDeidad ?? ''}`.trim();
        if (nombre.length < 1)
            return;
        this.deidadDetallesPorNombre.emit(nombre);
    }

    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    verDetallesRasgo(value: Rasgo): void {
        const nombre = `${value?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;
        this.rasgoDetalles.emit(value);
    }

    @Output() monstruoDetalles: EventEmitter<MonstruoDetalle> = new EventEmitter<MonstruoDetalle>();
    verDetallesMonstruoDesdeFicha(monstruo: MonstruoDetalle): void {
        const id = Number(monstruo?.Id ?? 0);
        if (!Number.isFinite(id) || id <= 0)
            return;
        this.monstruoDetalles.emit(monstruo);
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
            void this.aplicarSeleccionRazaFinal(raza, razaBase, null);
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
        void this.aplicarSeleccionRazaFinal(
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
        this.normalizarDeidadSeleccionada();
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

    getEtiquetaDgsAdicionalesPlantilla(plantilla: Plantilla): string {
        const mult = Number(plantilla?.Licantronia_dg?.Multiplicador ?? 0);
        const dado = `${plantilla?.Licantronia_dg?.Dado ?? ''}`.trim().toUpperCase();
        if (!Number.isFinite(mult) || mult <= 0 || dado.length < 1)
            return '';

        const suma = Number(plantilla?.Licantronia_dg?.Suma ?? 0);
        const sumaTxt = Number.isFinite(suma) && suma >= 0 ? `+${suma}` : `${suma}`;
        return `${mult}${dado}${sumaTxt} PGs`;
    }

    esPlantillaConfirmada(plantilla: Plantilla): boolean {
        return this.nuevoPSvc.esPlantillaConfirmada(Number(plantilla?.Id));
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

    async continuarDesdePlantillas(): Promise<void> {
        if (!this.caracteristicasGeneradas) {
            return;
        }
        const retornoFinNivelPendiente = this.nuevoPSvc.consumirRetornoFinNivelPendientePlantillas();

        this.nuevoPSvc.registrarAumentosPendientesPorProgresion('Plantillas confirmadas');
        const aumentosCompletados = await this.abrirSelectorAumentosCaracteristica();
        if (!aumentosCompletados)
            return;

        this.nuevoPSvc.confirmarSeleccionActualPlantillas();
        if (this.nuevoPSvc.iniciarDistribucionHabilidadesPorPlantillasDG()) {
            this.Personaje = this.nuevoPSvc.PersonajeCreacion;
            this.recalcularPlantillasVisibles();
            this.recalcularClasesVisibles();
            this.sincronizarTabConPaso();
            return;
        }

        const siguientePaso: StepNuevoPersonaje = retornoFinNivelPendiente ? 'clases' : 'ventajas';
        this.nuevoPSvc.actualizarPasoActual(siguientePaso);
        this.recalcularPlantillasVisibles();
        this.recalcularClasesVisibles();
        if (siguientePaso === 'ventajas')
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

        if (!await this.ensureSelectedCampaignPolicyReady())
            return;

        const primerNivelClase = Number(seleccion.siguienteNivel ?? 0) === 1;
        const requiereAvisoAlineamiento = primerNivelClase
            && (seleccion.compatAlineamiento.requiereConfirmacion || seleccion.bloqueoSoloAlineamiento);
        if (requiereAvisoAlineamiento) {
            const detalleAlineamiento = seleccion.compatAlineamiento.tooltip;
            if (!this.canIgnoreAlignmentRestrictionsForCurrentContext) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'La campaña no permite esta clase',
                    html: `${detalleAlineamiento}<br><br><strong>Esta campaña no permite saltarse restricciones de alineamiento. Debes elegir una clase compatible.</strong>`,
                    showConfirmButton: true,
                    confirmButtonText: 'Entendido',
                    target: document.body,
                    heightAuto: false,
                    scrollbarPadding: false,
                });
                return;
            }
            const avisoHomebrew = '<br><br><strong>Esta elección está saltándose una regla importante del sistema. El personaje quedará marcado como Homebrew y será una rareza excepcional en el mundo.</strong>';
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

        await this.asegurarCatalogoConjuros();

        let seleccionesAumentosClaseLanzadora: SeleccionAumentosClaseLanzadora | null = null;
        let resultado = this.nuevoPSvc.aplicarSiguienteNivelClase(
            seleccion.clase,
            seleccionesOpcionales,
            seleccionesDominios,
            seleccion.bloqueoSoloAlineamiento,
            seleccionesAumentosClaseLanzadora
        );
        if (!resultado.aplicado && (resultado.aumentosClaseLanzadoraPendientes ?? []).length > 0) {
            seleccionesAumentosClaseLanzadora = await this.solicitarSeleccionesAumentosClaseLanzadora(
                resultado.aumentosClaseLanzadoraPendientes ?? [],
                seleccion.clase
            );
            if (!seleccionesAumentosClaseLanzadora)
                return;
            resultado = this.nuevoPSvc.aplicarSiguienteNivelClase(
                seleccion.clase,
                seleccionesOpcionales,
                seleccionesDominios,
                seleccion.bloqueoSoloAlineamiento,
                seleccionesAumentosClaseLanzadora
            );
        }
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

        const especialidadAplicada = await this.resolverEspecialidadMagicaTrasAplicarClase(
            seleccion.clase,
            Number(resultado.nivelAplicado ?? 0)
        );
        if (!especialidadAplicada) {
            this.recalcularClasesVisibles();
            return;
        }

        const enemigosPredilectosPendientes = this.nuevoPSvc.contarSeleccionesEnemigoPredilectoPorEspeciales(
            resultado.especialesAplicados ?? []
        );
        if (enemigosPredilectosPendientes > 0) {
            const completado = await this.resolverEnemigosPredilectosPendientes(enemigosPredilectosPendientes);
            if (!completado) {
                this.recalcularClasesVisibles();
                return;
            }
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
        if (requiereAvisoAlineamiento && this.canIgnoreAlignmentRestrictionsForCurrentContext) {
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

        const contextoAumentos = `${seleccion.clase?.Nombre ?? 'Clase'} nivel ${Number(resultado.nivelAplicado ?? 0)}`;
        this.nuevoPSvc.registrarAumentosPendientesPorEspeciales(resultado.especialesAplicados ?? [], contextoAumentos);
        this.nuevoPSvc.registrarAumentosPendientesPorProgresion(contextoAumentos);
        const aumentosCompletados = await this.abrirSelectorAumentosCaracteristica();
        if (!aumentosCompletados)
            return;

        this.nuevoPSvc.registrarDotesPendientesPorRazaExtras(`${this.razaSeleccionada?.Nombre ?? 'Raza'}`);
        this.nuevoPSvc.registrarDotesPendientesPorEspeciales(resultado.especialesAplicados ?? [], contextoAumentos);
        this.nuevoPSvc.registrarDotesPendientesPorProgresion(contextoAumentos);

        this.nuevoPSvc.iniciarDistribucionHabilidadesPorClase(
            seleccion.clase,
            Number(resultado.nivelAplicado ?? 0)
        );
        this.filtroConjurosTexto = '';
        this.filtroConjurosNivel = null;
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.recalcularClasesVisibles();
        this.sincronizarTabConPaso();
    }

    private async resolverEspecialidadMagicaTrasAplicarClase(clase: Clase, nivelAplicado: number): Promise<boolean> {
        const pendiente = this.nuevoPSvc.getEspecialidadMagicaPendiente(clase, nivelAplicado);
        if (!pendiente)
            return true;

        await this.asegurarCatalogoEscuelas();
        await this.asegurarCatalogoDisciplinas();

        if (pendiente.requierePsionico) {
            const disciplinasValidas = (this.catalogoDisciplinas ?? [])
                .map((disciplina) => Number(disciplina?.Id ?? 0))
                .filter((id) => Number.isFinite(id) && id > 0);
            const distintas = Array.from(new Set(disciplinasValidas));
            if (distintas.length < 2) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'No se puede resolver especialización psiónica',
                    text: 'No hay suficientes disciplinas válidas para seleccionar especialista y disciplina prohibida.',
                    showConfirmButton: true,
                });
                return false;
            }
        }

        const seleccion = await this.solicitarEspecialidadMagicaClase(clase, pendiente);
        if (!seleccion)
            return false;

        const payload: EspecialidadMagicaSeleccion = {
            arcana: pendiente.requiereArcano
                ? {
                    especializar: !!seleccion?.arcana?.especializar,
                    escuelaEspecialistaId: seleccion?.arcana?.escuelaEspecialistaId ?? null,
                    escuelasProhibidasIds: [...(seleccion?.arcana?.escuelasProhibidasIds ?? [])],
                }
                : undefined,
            psionica: pendiente.requierePsionico
                ? {
                    disciplinaEspecialistaId: seleccion?.psionica?.disciplinaEspecialistaId ?? null,
                    disciplinaProhibidaId: seleccion?.psionica?.disciplinaProhibidaId ?? null,
                }
                : undefined,
        };

        const resultado = this.nuevoPSvc.aplicarEspecialidadMagicaClase(
            clase,
            nivelAplicado,
            payload,
            this.catalogoEscuelas,
            this.catalogoDisciplinas
        );
        if (!resultado.aplicado) {
            await Swal.fire({
                icon: 'warning',
                title: 'Especialización inválida',
                text: `${resultado.razon ?? 'No se pudo aplicar la especialización seleccionada.'}`,
                showConfirmButton: true,
            });
            return false;
        }

        this.nuevoPSvc.refrescarSesionConjurosPorEspecialidad();
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        return true;
    }

    private async resolverEnemigosPredilectosPendientes(cantidadPendiente: number): Promise<boolean> {
        const total = Math.max(0, Math.trunc(Number(cantidadPendiente ?? 0)));
        if (total < 1)
            return true;

        for (let indice = 1; indice <= total; indice++) {
            const seleccionId = await this.abrirSelectorEnemigoPredilecto(indice, total);
            if (!Number.isFinite(Number(seleccionId)) || Number(seleccionId) <= 0)
                return false;

            const enemigo = this.catalogoEnemigosPredilectos.find((item) => Number(item?.Id) === Number(seleccionId));
            if (!enemigo) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Selección inválida',
                    text: 'El enemigo predilecto seleccionado no existe en el catálogo.',
                    showConfirmButton: true,
                });
                return false;
            }

            const aplicado = this.nuevoPSvc.aplicarSeleccionEnemigoPredilecto(enemigo);
            if (!aplicado) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'No se pudo aplicar enemigo predilecto',
                    text: 'Revisa el catálogo de enemigos predilectos y vuelve a intentarlo.',
                    showConfirmButton: true,
                });
                return false;
            }

            this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        }

        return true;
    }

    private async abrirSelectorEnemigoPredilecto(indice: number, total: number): Promise<number | null> {
        const opciones = [...(this.catalogoEnemigosPredilectos ?? [])]
            .map((item) => ({
                Id: Number(item?.Id ?? 0),
                Nombre: `${item?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.Id > 0 && item.Nombre.length > 0)
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));

        if (opciones.length < 1) {
            await Swal.fire({
                icon: 'error',
                title: 'Catálogo de enemigos predilectos no disponible',
                text: 'No hay enemigos predilectos cargados en caché. Sin catálogo no se puede continuar.',
                showConfirmButton: true,
            });
            return null;
        }

        this.selectorEnemigoPredilectoIndice = Math.max(1, Math.trunc(Number(indice ?? 1)));
        this.selectorEnemigoPredilectoTotal = Math.max(1, Math.trunc(Number(total ?? 1)));
        this.selectorEnemigoPredilectoTitulo = this.getTituloSelectorEnemigoPredilecto(
            this.selectorEnemigoPredilectoIndice,
            this.selectorEnemigoPredilectoTotal
        );
        this.modalSelectorEnemigoPredilectoAbierto = true;

        return new Promise<number | null>((resolve) => {
            this.resolverSelectorEnemigoPredilecto = resolve;
        });
    }

    onConfirmarEnemigoPredilecto(idEnemigo: number): void {
        const id = Math.trunc(Number(idEnemigo ?? 0));
        if (!Number.isFinite(id) || id <= 0)
            return;

        this.cerrarSelectorEnemigoPredilectoContexto(id);
    }

    private cerrarSelectorEnemigoPredilectoContexto(seleccionId: number | null): void {
        this.modalSelectorEnemigoPredilectoAbierto = false;
        this.selectorEnemigoPredilectoTitulo = 'Seleccionar enemigo predilecto';
        this.selectorEnemigoPredilectoIndice = 1;
        this.selectorEnemigoPredilectoTotal = 1;

        const resolver = this.resolverSelectorEnemigoPredilecto;
        this.resolverSelectorEnemigoPredilecto = null;
        if (resolver)
            resolver(seleccionId);
    }

    private getTituloSelectorEnemigoPredilecto(indice: number, total: number): string {
        const indiceLimpio = Math.max(1, Math.trunc(Number(indice ?? 1)));
        const totalLimpio = Math.max(1, Math.trunc(Number(total ?? 1)));
        const ordinal = this.getOrdinalEnemigoPredilecto(indiceLimpio);
        if (totalLimpio <= 1)
            return 'Seleccionar enemigo predilecto';
        return `Seleccionar ${ordinal} enemigo predilecto (${indiceLimpio}/${totalLimpio})`;
    }

    private getOrdinalEnemigoPredilecto(indice: number): string {
        if (indice === 1)
            return 'primer';
        if (indice === 2)
            return 'segundo';
        if (indice === 3)
            return 'tercer';
        if (indice === 4)
            return 'cuarto';
        if (indice === 5)
            return 'quinto';
        return `${indice}º`;
    }

    esHabilidadClaseaEfectiva(idHabilidad: number): boolean {
        return this.nuevoPSvc.esHabilidadClaseaEfectiva(idHabilidad);
    }

    getLimiteRangoHabilidad(idHabilidad: number): number {
        return this.nuevoPSvc.obtenerLimiteRangoHabilidad(idHabilidad);
    }

    esHabilidadEntrenada(habilidad: Personaje['Habilidades'][number]): boolean {
        return !!habilidad?.Entrenada;
    }

    tieneRangosHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        const rangos = Number(habilidad?.Rangos ?? 0);
        return Number.isFinite(rangos) && rangos > 0;
    }

    esRangoNuevoHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        const idHabilidad = Number(habilidad?.Id ?? 0);
        const rangosActuales = Math.max(0, Math.trunc(Number(habilidad?.Rangos ?? 0)));
        if (idHabilidad <= 0 || rangosActuales <= 0)
            return false;
        const rangosIniciales = this.getRangosInicialesSesionHabilidad(idHabilidad);
        return rangosActuales > rangosIniciales;
    }

    getTooltipRangoHabilidad(habilidad: Personaje['Habilidades'][number]): string {
        const idHabilidad = Number(habilidad?.Id ?? 0);
        const actuales = Math.max(0, Math.trunc(Number(habilidad?.Rangos ?? 0)));
        const iniciales = this.getRangosInicialesSesionHabilidad(idHabilidad);
        if (this.esRangoNuevoHabilidad(habilidad))
            return `Rangos nuevos en esta distribución: ${actuales - iniciales}.`;
        return 'Rangos previos (sin nuevos en esta distribución).';
    }

    getNombreHabilidadConMarcaEntrenada(habilidad: Personaje['Habilidades'][number]): string {
        const nombre = `${habilidad?.Nombre ?? ''}`;
        return this.esHabilidadEntrenada(habilidad) ? `${nombre}*` : nombre;
    }

    getCaracteristicaAbreviada(caracteristica: string): string {
        const normalizada = this.normalizarTexto(caracteristica ?? '');
        if (normalizada.startsWith('fue') || normalizada.includes('fuerza'))
            return 'Fue';
        if (normalizada.startsWith('des') || normalizada.includes('destreza'))
            return 'Des';
        if (normalizada.startsWith('con') || normalizada.includes('constitucion'))
            return 'Con';
        if (normalizada.startsWith('int') || normalizada.includes('inteligencia'))
            return 'Int';
        if (normalizada.startsWith('sab') || normalizada.includes('sabiduria'))
            return 'Sab';
        if (normalizada.startsWith('car') || normalizada.includes('carisma'))
            return 'Car';
        return `${caracteristica ?? ''}`.trim();
    }

    getOpcionesExtraHabilidad(habilidad: Personaje['Habilidades'][number]): Array<{ Id_extra: number; Extra: string; Descripcion: string; }> {
        const idHabilidad = Number(habilidad?.Id ?? 0);
        if (!this.esHabilidadClaseaEfectiva(idHabilidad))
            return [];
        if (Boolean(habilidad?.Extra_bloqueado))
            return [];

        const opciones = (habilidad?.Extras ?? [])
            .map((extra) => ({
                Id_extra: Number(extra?.Id_extra ?? 0),
                Extra: `${extra?.Extra ?? ''}`.trim(),
                Descripcion: `${extra?.Descripcion ?? ''}`.trim(),
            }))
            .filter((extra) => extra.Extra.length > 0);
        if (opciones.length < 1)
            return [];

        const claveGrupo = this.getClaveGrupoExtraHabilidad(habilidad);
        const extraActualNorm = this.normalizarTexto(`${habilidad?.Extra ?? ''}`);
        const usados = new Set(
            (this.Personaje?.Habilidades ?? [])
                .filter((otra) => Number(otra?.Id) !== idHabilidad)
                .filter((otra) => !!otra?.Soporta_extra)
                .filter((otra) => this.esHabilidadClaseaEfectiva(Number(otra?.Id)))
                .filter((otra) => this.getClaveGrupoExtraHabilidad(otra) === claveGrupo)
                .map((otra) => this.normalizarTexto(`${otra?.Extra ?? ''}`))
                .filter((extraNorm) => !this.esExtraPendienteValor(extraNorm))
        );

        return opciones.filter((opcion) => {
            const extraNorm = this.normalizarTexto(opcion.Extra);
            return !usados.has(extraNorm) || extraNorm === extraActualNorm;
        });
    }

    esExtraObligatorioHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!habilidad)
            return false;
        return this.esHabilidadClaseaEfectiva(Number(habilidad?.Id)) && !!habilidad?.Soporta_extra;
    }

    esExtraPendienteHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!this.esExtraObligatorioHabilidad(habilidad))
            return false;

        const extraNormalizado = this.normalizarTexto(`${habilidad?.Extra ?? ''}`);
        if (extraNormalizado.length < 1)
            return true;
        return EXTRA_PENDIENTE_PLACEHOLDERS.has(extraNormalizado);
    }

    getTextoExtraHabilidad(habilidad: Personaje['Habilidades'][number]): string {
        const extra = `${habilidad?.Extra ?? ''}`.trim();
        if (extra.length > 0)
            return extra;
        if (this.esExtraPendienteHabilidad(habilidad))
            return 'Elegir';
        return '-';
    }

    onExtraHabilidadChange(idHabilidad: number, value: string): void {
        const aplicado = this.nuevoPSvc.setExtraHabilidad(idHabilidad, `${value ?? ''}`);
        if (!aplicado)
            return;
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
    }

    async abrirSelectorExtraHabilidad(habilidad: Personaje['Habilidades'][number]): Promise<void> {
        if (!habilidad?.Soporta_extra || !this.esHabilidadClaseaEfectiva(Number(habilidad?.Id)))
            return;
        if (Boolean(habilidad?.Extra_bloqueado))
            return;

        const opciones = this.getOpcionesExtraHabilidad(habilidad)
            .map((extra) => ({
                valor: extra.Extra,
                descripcion: extra.Descripcion,
            }))
            .filter((opcion) => opcion.valor.length > 0);
        if (opciones.length < 1)
            return;

        const seleccionado = await this.abrirSelectorModalExtraHabilidad(habilidad, opciones);
        if (!seleccionado)
            return;

        this.onExtraHabilidadChange(Number(habilidad?.Id), seleccionado);
    }

    trackByHabilidadId(index: number, habilidad: Personaje['Habilidades'][number]): number {
        return Number(habilidad?.Id ?? index);
    }

    esExtraEditableHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!habilidad?.Soporta_extra)
            return false;
        if (!this.esHabilidadClaseaEfectiva(Number(habilidad?.Id)))
            return false;
        if (Boolean(habilidad?.Extra_bloqueado))
            return false;
        return this.getOpcionesExtraHabilidad(habilidad).length > 0;
    }

    private esExtraPendienteValor(extraNormalizado: string): boolean {
        return extraNormalizado.length < 1 || EXTRA_PENDIENTE_PLACEHOLDERS.has(extraNormalizado);
    }

    private getClaveGrupoExtraHabilidad(habilidad: Personaje['Habilidades'][number]): string {
        const nombre = this.normalizarTexto(`${habilidad?.Nombre ?? ''}`);
        if (nombre.startsWith('artesania'))
            return 'familia:artesania';
        if (nombre.startsWith('saber'))
            return 'familia:saberes';
        const base = nombre.replace(/\s+\d+$/, '').trim();
        if (base.length > 0)
            return `nombre:${base}`;
        const id = Number(habilidad?.Id ?? 0);
        return Number.isFinite(id) && id > 0 ? `id:${id}` : '';
    }

    onConfirmarSelectorExtraHabilidad(valor: string): void {
        const seleccionado = `${valor ?? ''}`.trim();
        if (seleccionado.length < 1)
            return;
        this.cerrarSelectorExtraHabilidadContexto(seleccionado);
    }

    onCerrarSelectorExtraHabilidad(): void {
        this.cerrarSelectorExtraHabilidadContexto(null);
    }

    private abrirSelectorModalExtraHabilidad(
        habilidad: Personaje['Habilidades'][number],
        opciones: ExtraHabilidadSelectorOpcion[]
    ): Promise<string | null> {
        this.limpiarFocoActivoAntesDeModal();
        this.selectorExtraHabilidadTitulo = `${habilidad?.Nombre ?? 'Habilidad'}: extra`;
        this.selectorExtraHabilidadNombre = `${habilidad?.Nombre ?? ''}`.trim();
        this.selectorExtraHabilidadOpciones = [...(opciones ?? [])];
        this.selectorExtraHabilidadValorInicial = `${habilidad?.Extra ?? ''}`.trim();
        this.modalSelectorExtraHabilidadAbierto = true;

        return new Promise<string | null>((resolve) => {
            this.resolverSelectorExtraHabilidad = resolve;
        });
    }

    private cerrarSelectorExtraHabilidadContexto(resultado: string | null): void {
        this.modalSelectorExtraHabilidadAbierto = false;
        this.selectorExtraHabilidadTitulo = 'Seleccionar extra';
        this.selectorExtraHabilidadNombre = '';
        this.selectorExtraHabilidadOpciones = [];
        this.selectorExtraHabilidadValorInicial = '';

        const resolver = this.resolverSelectorExtraHabilidad;
        this.resolverSelectorExtraHabilidad = null;
        resolver?.(resultado);
    }

    private esHabilidadEntrenadaNoClasea(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!this.esHabilidadEntrenada(habilidad))
            return false;
        return !this.esHabilidadClaseaEfectiva(Number(habilidad?.Id));
    }

    puedeSubirRangoHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!habilidad)
            return false;
        if (this.esHabilidadEntrenadaNoClasea(habilidad))
            return false;
        const actual = Number(habilidad?.Rangos ?? 0);
        const limite = this.getLimiteRangoHabilidad(Number(habilidad?.Id));
        return this.flujoHabilidades.puntosRestantes > 0 && actual < limite;
    }

    puedeBajarRangoHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!habilidad)
            return false;
        return Number(habilidad?.Rangos ?? 0) > 0;
    }

    puedeMaxearRangoHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!habilidad)
            return false;
        if (this.esHabilidadEntrenadaNoClasea(habilidad))
            return false;
        const actual = Number(habilidad?.Rangos ?? 0);
        const limite = this.getLimiteRangoHabilidad(Number(habilidad?.Id));
        return this.flujoHabilidades.puntosRestantes > 0 && actual < limite;
    }

    ajustarRangoHabilidad(idHabilidad: number, delta: number): void {
        const aplicado = this.nuevoPSvc.ajustarRangoHabilidad(idHabilidad, delta);
        if (!aplicado)
            return;
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
    }

    maxearRangoHabilidad(habilidad: Personaje['Habilidades'][number]): void {
        if (!habilidad)
            return;

        const idHabilidad = Number(habilidad?.Id ?? 0);
        const actual = Number(habilidad?.Rangos ?? 0);
        const limite = this.getLimiteRangoHabilidad(idHabilidad);
        const margenLimite = Math.max(0, limite - actual);
        const delta = Math.min(margenLimite, Math.max(0, Number(this.flujoHabilidades.puntosRestantes ?? 0)));
        if (idHabilidad <= 0 || delta < 1)
            return;

        const aplicado = this.nuevoPSvc.ajustarRangoHabilidad(idHabilidad, delta);
        if (!aplicado)
            return;
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
    }

    getTextoVariosHabilidad(habilidad: Personaje['Habilidades'][number]): string {
        const texto = `${habilidad?.Varios ?? ''}`.trim();
        if (texto.length > 0)
            return texto;
        const bonos = habilidad?.Bonos_varios ?? [];
        if (bonos.length < 1)
            return '-';
        return bonos
            .map((bono) => `${bono?.origen ?? ''} ${Number(bono?.valor ?? 0) >= 0 ? '+' : ''}${Number(bono?.valor ?? 0)}`.trim())
            .filter((item) => item.length > 0)
            .join(', ');
    }

    private esNombreHabilidadOcultaEnTabla(nombre: string): boolean {
        const normalizado = this.normalizarTexto(nombre ?? '');
        return normalizado === 'crear 1' || normalizado === 'crear 2';
    }

    private getRangosInicialesSesionHabilidad(idHabilidad: number): number {
        const id = Math.max(0, Math.trunc(Number(idHabilidad ?? 0)));
        if (id <= 0)
            return 0;
        const mapa = this.flujoHabilidades?.rangosIniciales ?? {};
        const valor = Number((mapa as Record<number, number>)?.[id] ?? 0);
        if (!Number.isFinite(valor))
            return 0;
        return Math.max(0, Math.trunc(valor));
    }

    async continuarDesdeHabilidades(): Promise<void> {
        if (!this.nuevoPSvc.puedeCerrarDistribucionHabilidades())
            return;
        const origenHabilidades = this.flujoHabilidades?.origen;
        const returnStepHabilidades = this.flujoHabilidades?.returnStep;

        if (this.flujoHabilidades?.returnStep === 'dotes') {
            const completado = await this.resolverFlujoPostDotesFinNivel();
            if (!completado)
                return;

            const returnStep = this.nuevoPSvc.cerrarDistribucionHabilidades();
            if (!returnStep)
                return;
            this.Personaje = this.nuevoPSvc.PersonajeCreacion;
            const siguientePaso = this.resolverPasoPostDotesFinNivel();
            this.nuevoPSvc.actualizarPasoActual(siguientePaso);
            this.sincronizarTabConPaso();
            return;
        }

        if (
            (origenHabilidades === 'raza_dg' || origenHabilidades === 'clase_nivel')
            && returnStepHabilidades !== 'conjuros'
        ) {
            if (origenHabilidades === 'raza_dg')
                this.nuevoPSvc.registrarDotesPendientesPorRazaExtras(`${this.razaSeleccionada?.Nombre ?? 'Raza'}`);
            const dotesCompletadas = await this.resolverDotesPendientes();
            if (!dotesCompletadas)
                return;
        }

        const returnStep = this.nuevoPSvc.cerrarDistribucionHabilidades();
        if (!returnStep)
            return;

        this.nuevoPSvc.actualizarPasoActual(returnStep);
        this.sincronizarTabConPaso();
    }

    onFiltroConjurosTextoChange(value: string): void {
        this.filtroConjurosTexto = `${value ?? ''}`;
    }

    onFiltroConjurosNivelChange(value: number | null): void {
        if (value === null || value === undefined || `${value}` === '')
            this.filtroConjurosNivel = null;
        else
            this.filtroConjurosNivel = Number(value);
    }

    getNivelConjuroEntrada(conjuro: Conjuro): number {
        const entrada = this.entradaConjurosActual;
        if (!entrada)
            return 0;
        return Number(entrada.nivelesPorConjuro?.[Number(conjuro?.Id)] ?? 0);
    }

    esConjuroAutoadicionado(conjuro: Conjuro): boolean {
        const entrada = this.entradaConjurosActual;
        if (!entrada)
            return false;
        return (entrada.autoadicionadosIds ?? []).some((id) => Number(id) === Number(conjuro?.Id));
    }

    agregarConjuroSesion(conjuro: Conjuro): void {
        this.nuevoPSvc.seleccionarConjuroSesion(Number(conjuro?.Id));
    }

    quitarConjuroSesion(conjuro: Conjuro): void {
        this.nuevoPSvc.quitarConjuroSesion(Number(conjuro?.Id));
    }

    continuarDesdeConjuros(): void {
        if (!this.nuevoPSvc.puedeCerrarSesionConjuros())
            return;
        if (this.flujoConjuros?.returnStep === 'dotes') {
            void this.continuarDesdeConjurosPostDotes();
            return;
        }
        const nextStep = this.nuevoPSvc.cerrarSesionConjuros();
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.nuevoPSvc.actualizarPasoActual(nextStep);
        this.sincronizarTabConPaso();
    }

    private async continuarDesdeConjurosPostDotes(): Promise<void> {
        const completado = await this.resolverFlujoPostDotesFinNivel();
        if (!completado)
            return;

        this.nuevoPSvc.cerrarSesionConjuros();
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        const siguientePaso = this.resolverPasoPostDotesFinNivel();
        this.nuevoPSvc.actualizarPasoActual(siguientePaso);
        this.sincronizarTabConPaso();
    }

    private async resolverFlujoPostDotesFinNivel(): Promise<boolean> {
        const dotesCompletadas = await this.resolverDotesPendientes();
        if (!dotesCompletadas)
            return false;

        const companeroResuelto = await this.resolverCompaneroPendienteFinNivel();
        if (!companeroResuelto)
            return false;

        const familiarResuelto = await this.resolverFamiliarPendienteFinNivel();
        if (!familiarResuelto)
            return false;

        return true;
    }

    private resolverPasoPostDotesFinNivel(): StepNuevoPersonaje {
        const hayPlantillasElegibles = this.hayPlantillasElegiblesPostDotes();
        this.nuevoPSvc.setRetornoFinNivelPendientePlantillas(hayPlantillasElegibles);
        return hayPlantillasElegibles ? 'plantillas' : 'clases';
    }

    private async resolverFamiliarPendienteFinNivel(): Promise<boolean> {
        const estado = this.nuevoPSvc.getEstadoCuposFamiliarEspecial47();
        if (estado.cuposDisponibles < 1)
            return true;

        const seleccion = await this.abrirSelectorFamiliar(estado);
        if (seleccion === null)
            return false;
        if (seleccion === 'omitir')
            return true;

        const nombresEspeciales = await this.cargarNombresEspecialesFamiliar();
        const resultado = this.nuevoPSvc.registrarFamiliarSeleccionado(
            seleccion.familiar,
            seleccion.plantilla,
            nombresEspeciales,
            seleccion.nombre
        );
        if (!resultado.registrado) {
            await Swal.fire({
                icon: 'warning',
                title: 'No se pudo registrar el familiar',
                text: resultado.razon || 'No se pudo aplicar la selección de familiar con el estado actual.',
                confirmButtonText: 'Entendido',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            return false;
        }

        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        return true;
    }

    private async resolverCompaneroPendienteFinNivel(): Promise<boolean> {
        const estado = this.nuevoPSvc.getEstadoCuposCompaneroEspecial29();
        if (estado.cuposDisponibles < 1)
            return true;

        const seleccion = await this.abrirSelectorCompanero(estado);
        if (seleccion === null)
            return false;
        if (seleccion === 'omitir')
            return true;

        const nombresEspeciales = await this.cargarNombresEspecialesCompanero();
        const resultado = this.nuevoPSvc.registrarCompaneroSeleccionado(
            seleccion.companero,
            seleccion.plantilla,
            nombresEspeciales,
            seleccion.nombre
        );
        if (!resultado.registrado) {
            await Swal.fire({
                icon: 'warning',
                title: 'No se pudo registrar el compañero animal',
                text: resultado.razon || 'No se pudo aplicar la selección de compañero animal con el estado actual.',
                confirmButtonText: 'Entendido',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            return false;
        }

        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        return true;
    }

    private async abrirSelectorCompanero(
        estado: EstadoCuposCompanero
    ): Promise<SelectorCompaneroConfirmacion | 'omitir' | null> {
        const catalogoCargado = await this.cargarCatalogoCompanerosSelector();
        if (!catalogoCargado)
            return null;

        this.selectorCompaneroEstadoCupos = estado;
        this.selectorCompaneroTitulo = 'Seleccionar compañero animal';
        this.selectorCompaneroPlantillaSeleccionada = null;
        this.selectorCompaneroIncluirHomebrew = !this.Personaje.Oficial;
        this.selectorCompaneroNombre = this.getNombreDefectoCompanero();
        this.selectorCompaneroCuposDisponibles = Math.max(0, Number(estado?.cuposDisponibles ?? 0));
        this.selectorCompaneroNivelSeleccionado = null;
        this.recalcularCompanerosElegiblesSelector();
        this.modalSelectorCompaneroAbierto = true;

        return new Promise<SelectorCompaneroConfirmacion | 'omitir' | null>((resolve) => {
            this.resolverSelectorCompanero = resolve;
        });
    }

    onConfirmarSelectorCompanero(seleccion: SelectorCompaneroConfirmacion): void {
        const idCompanero = Number(seleccion?.companero?.Id_companero ?? 0);
        const idPlantilla = this.getIdPlantillaCompaneroSeleccionada(seleccion?.plantilla);
        const companero = this.selectorCompaneroElegibles.find((item) =>
            Number(item?.Id_companero) === idCompanero
            && Number(item?.Plantilla?.Id) === idPlantilla
        );
        if (!companero)
            return;
        this.cerrarSelectorCompaneroContexto({
            companero,
            plantilla: seleccion?.plantilla ?? 'base',
            nombre: `${seleccion?.nombre ?? ''}`,
            nivel: seleccion?.nivel ?? null,
        });
    }

    onOmitirSelectorCompanero(): void {
        this.cerrarSelectorCompaneroContexto('omitir');
    }

    onDetalleSelectorCompanero(companero: CompaneroMonstruoDetalle): void {
        this.verDetallesMonstruoDesdeFicha(companero);
    }

    private esCandidatoDoteElegible(candidato: DoteSelectorCandidato): boolean {
        if (!candidato || candidato.restringidaPorTipo || !candidato.repeticionValida)
            return false;
        return candidato.evaluacion?.estado === 'eligible';
    }

    private getCantidadDotesPendientes(): number {
        return this.nuevoPSvc.getDotesPendientes()
            .filter((pendiente) => pendiente.estado === 'pendiente')
            .length;
    }

    private async resolverDotesPendientes(): Promise<boolean> {
        await this.asegurarCatalogoEscuelas();

        while (true) {
            const pendiente = this.nuevoPSvc.getSiguienteDotePendiente();
            if (!pendiente)
                return true;

            const candidatos = this.nuevoPSvc.obtenerCandidatosDotePendiente(pendiente.id);
            const elegibles = candidatos.filter((candidato) => this.esCandidatoDoteElegible(candidato));
            if (elegibles.length < 1) {
                await Swal.fire({
                    icon: 'info',
                    title: 'Sin dotes elegibles',
                    text: `No hay dotes elegibles para la pendiente (${pendiente.origen || pendiente.fuente}). Se omitirá automáticamente.`,
                    confirmButtonText: 'Continuar',
                    target: document.body,
                    heightAuto: false,
                    scrollbarPadding: false,
                });
                this.nuevoPSvc.omitirDotePendiente(pendiente.id);
                continue;
            }

            const seleccion = await this.abrirSelectorDotePendiente(pendiente, candidatos);
            if (seleccion === null)
                return false;
            if (seleccion === 'omitir') {
                this.nuevoPSvc.omitirDotePendiente(pendiente.id);
                continue;
            }

            const aplicado = this.nuevoPSvc.aplicarDotePendiente(pendiente.id, seleccion);
            if (!aplicado) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'No se pudo aplicar la dote',
                    text: 'La selección ya no es válida con el estado actual del personaje. Elige otra opción.',
                    confirmButtonText: 'Entendido',
                    target: document.body,
                    heightAuto: false,
                    scrollbarPadding: false,
                });
                continue;
            }

            this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        }
    }

    private async abrirSelectorDotePendiente(
        pendiente: DotePendienteState,
        candidatos: DoteSelectorCandidato[]
    ): Promise<DoteSeleccionConfirmada | 'omitir' | null> {
        this.selectorDotePendienteActual = pendiente;
        this.selectorDoteCandidatos = [...(candidatos ?? [])];
        this.selectorDotePendientesRestantes = this.getCantidadDotesPendientes();
        this.modalSelectorDotesAbierto = true;

        return new Promise<DoteSeleccionConfirmada | 'omitir' | null>((resolve) => {
            this.resolverSelectorDotes = resolve;
        });
    }

    onConfirmarDotePendiente(seleccion: DoteSeleccionConfirmada): void {
        const resolver = this.resolverSelectorDotes;
        this.cerrarSelectorDotesContexto();
        resolver?.(seleccion);
    }

    onOmitirDotePendiente(): void {
        const resolver = this.resolverSelectorDotes;
        this.cerrarSelectorDotesContexto();
        resolver?.('omitir');
    }

    private cerrarSelectorDotesContexto(): void {
        this.modalSelectorDotesAbierto = false;
        this.selectorDotePendienteActual = null;
        this.selectorDoteCandidatos = [];
        this.selectorDotePendientesRestantes = 0;
        this.resolverSelectorDotes = null;
    }

    private async abrirSelectorFamiliar(
        estado: EstadoCuposFamiliar
    ): Promise<SelectorFamiliarConfirmacion | 'omitir' | null> {
        const catalogoCargado = await this.cargarCatalogoFamiliaresSelector();
        if (!catalogoCargado)
            return null;

        this.selectorFamiliarEstadoCupos = estado;
        this.selectorFamiliarTitulo = 'Seleccionar familiar';
        this.selectorFamiliarPlantillaSeleccionada = null;
        this.selectorFamiliarIncluirHomebrew = !this.Personaje.Oficial;
        this.selectorFamiliarNombre = this.getNombreDefectoFamiliar();
        this.selectorFamiliarCuposDisponibles = Math.max(0, Number(estado?.cuposDisponibles ?? 0));
        this.recalcularFamiliaresElegiblesSelector();
        this.modalSelectorFamiliarAbierto = true;

        return new Promise<SelectorFamiliarConfirmacion | 'omitir' | null>((resolve) => {
            this.resolverSelectorFamiliar = resolve;
        });
    }

    onConfirmarSelectorFamiliar(seleccion: SelectorFamiliarConfirmacion): void {
        const idFamiliar = Number(seleccion?.familiar?.Id_familiar ?? 0);
        const plantilla = Number(seleccion?.plantilla ?? 0);
        const familiar = this.selectorFamiliarElegibles.find((item) =>
            Number(item?.Id_familiar) === idFamiliar
            && Number(item?.Plantilla?.Id) === plantilla
        );
        if (!familiar)
            return;
        this.cerrarSelectorFamiliarContexto({
            familiar,
            plantilla: plantilla as FamiliarPlantillaId,
            nombre: `${seleccion?.nombre ?? ''}`,
        });
    }

    onOmitirSelectorFamiliar(): void {
        this.cerrarSelectorFamiliarContexto('omitir');
    }

    onDetalleSelectorFamiliar(familiar: FamiliarMonstruoDetalle): void {
        this.verDetallesMonstruoDesdeFicha(familiar);
    }

    onCambioPlantillaSelectorCompanero(plantilla: CompaneroPlantillaSelector | null): void {
        this.selectorCompaneroPlantillaSeleccionada = plantilla ? this.normalizarPlantillaCompanero(plantilla) : null;
        this.recalcularCompanerosElegiblesSelector();
    }

    onCambioHomebrewSelectorCompanero(value: boolean): void {
        this.selectorCompaneroIncluirHomebrew = !!value;
        this.recalcularCompanerosElegiblesSelector();
    }

    onCambioNombreSelectorCompanero(value: string): void {
        this.selectorCompaneroNombre = `${value ?? ''}`;
    }

    onCambioNivelSelectorCompanero(value: number | null): void {
        const parsed = Number(value);
        if (value === null || value === undefined || !Number.isFinite(parsed) || parsed < 0) {
            this.selectorCompaneroNivelSeleccionado = null;
        } else {
            this.selectorCompaneroNivelSeleccionado = Math.trunc(parsed);
        }
        this.recalcularCompanerosElegiblesSelector();
    }

    async onFinalizarCreacionTemporal(): Promise<void> {
        if (!this.mostrarBotonFinalizarCreacion)
            return;
        this.abrirSelectorPuntosGolpe();
    }

    onRecalcularPuntosGolpe(): void {
        if (!this.modalSelectorPuntosGolpeAbierto || this.tiradasVidaRestantes < 1)
            return;
        this.resultadoVidaActual = this.nuevoPSvc.calcularVidaFinalAleatoria();
        this.tiradasVidaRestantes = Math.max(0, this.tiradasVidaRestantes - 1);
    }

    onSiguientePuntosGolpe(): void {
        if (!this.modalSelectorPuntosGolpeAbierto || !this.resultadoVidaActual)
            return;
        this.Personaje.Vida = this.resultadoVidaActual.total;
        this.modalSelectorPuntosGolpeAbierto = false;
        this.abrirSelectorVisibilidad();
    }

    onCerrarSelectorPuntosGolpe(): void {
        this.modalSelectorPuntosGolpeAbierto = false;
        this.resultadoVidaActual = null;
        this.tiradasVidaRestantes = 0;
        this.resetearEstadoFinalizacion();
    }

    async onConfirmarSelectorVisibilidad(visibleOtros: boolean): Promise<void> {
        if (this.finalizacionEnCurso)
            return;
        this.Personaje.visible_otros_usuarios = !!visibleOtros;
        this.sincronizarOwnerUidEnCreacion();
        await this.finalizarPersonajeCompleto();
    }

    onCerrarSelectorVisibilidad(): void {
        if (this.finalizacionEnCurso)
            return;
        if (this.finalizacionState.sqlOk) {
            void Swal.fire({
                icon: 'warning',
                title: 'Finalizacion pendiente',
                text: 'La creación ya comenzó y no se puede cerrar hasta completar Firebase y apertura de detalles.',
                showConfirmButton: true,
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            return;
        }
        this.modalSelectorVisibilidadAbierto = false;
        this.selectorVisibilidadValorInicial = null;
    }

    private abrirSelectorPuntosGolpe(): void {
        this.resetearEstadoFinalizacion();
        this.tiradasVidaTotales = 3;
        this.tiradasVidaRestantes = Math.max(0, this.tiradasVidaTotales - 1);
        this.resultadoVidaActual = this.nuevoPSvc.calcularVidaFinalAleatoria();
        this.modalSelectorVisibilidadAbierto = false;
        this.modalSelectorPuntosGolpeAbierto = true;
    }

    private abrirSelectorVisibilidad(): void {
        this.selectorVisibilidadValorInicial = this.Personaje.visible_otros_usuarios ?? false;
        this.modalSelectorVisibilidadAbierto = true;
    }

    private async finalizarPersonajeCompleto(): Promise<void> {
        let etapa: 'sql' | 'firebase' | 'navegacion' = 'sql';
        this.finalizacionEnCurso = true;
        try {
            let idPersonaje = Math.trunc(Number(this.finalizacionState.idPersonaje ?? 0));

            if (!this.finalizacionState.sqlOk) {
                etapa = 'sql';
                const contextoIds = this.resolverContextoIdsCreacion();
                const payload = this.personajeSvc.construirPayloadCreacionDesdePersonaje(
                    this.Personaje,
                    contextoIds
                );
                const response = await this.personajeSvc.crearPersonajeApiDesdeCreacion(payload);
                idPersonaje = Math.trunc(Number(response?.idPersonaje ?? 0));
                if (!Number.isFinite(idPersonaje) || idPersonaje <= 0)
                    throw new Error('La API no devolvio un id de personaje valido.');
                this.finalizacionState.idPersonaje = idPersonaje;
                this.finalizacionState.sqlOk = true;
            }

            if (!Number.isFinite(idPersonaje) || idPersonaje <= 0)
                throw new Error('No hay id de personaje para continuar la finalizacion.');

            this.Personaje.Id = idPersonaje;

            if (!this.finalizacionState.firebaseOk) {
                etapa = 'firebase';
                await this.personajeSvc.guardarPersonajeEnFirebase(idPersonaje, this.Personaje);
                this.finalizacionState.firebaseOk = true;
            }

            const pjNormalizado = this.personajeSvc.normalizarPersonajeParaPersistenciaFinal(this.Personaje, idPersonaje);
            this.Personaje = pjNormalizado;

            etapa = 'navegacion';
            this.modalSelectorVisibilidadAbierto = false;
            this.selectorVisibilidadValorInicial = null;
            this.personajeFinalizado.emit(idPersonaje);
            this.fichasDescargaBgSvc.descargarFichas(pjNormalizado, {
                incluirConjuros: true,
                incluirFamiliares: true,
                incluirCompaneros: true,
            });
            this.resetearEstadoFinalizacion();
        } catch (error: any) {
            const texto = `${error?.message ?? 'Error no identificado'}`.trim();
            const titulo = etapa === 'sql'
                ? 'No se pudo guardar en SQL'
                : etapa === 'firebase'
                    ? 'No se pudo guardar en Firebase'
                    : 'No se pudo finalizar el personaje';
            await Swal.fire({
                icon: 'warning',
                title: titulo,
                text: texto.length > 0 ? texto : 'Reintenta la finalización.',
                showConfirmButton: true,
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
        } finally {
            this.finalizacionEnCurso = false;
        }
    }

    private resolverContextoIdsCreacion(): PersonajeContextoIdsDto {
        const campanaNorm = this.normalizarTexto(this.Personaje.Campana ?? '');
        const tramaNorm = this.normalizarTexto(this.Personaje.Trama ?? '');
        const subtramaNorm = this.normalizarTexto(this.Personaje.Subtrama ?? '');
        const campana = (this.Campanas ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === campanaNorm);

        const trama = (campana?.Tramas ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === tramaNorm);
        const subtrama = (trama?.Subtramas ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === subtramaNorm);

        const esSinCampana = campanaNorm.length < 1 || campanaNorm === this.normalizarTexto('Sin campaña');
        const idCampana = esSinCampana ? null : (this.toPositiveInt(campana?.Id) ?? null);
        const idTrama = esSinCampana ? null : (this.toPositiveInt(trama?.Id) ?? null);
        const idSubtrama = esSinCampana ? null : (this.toPositiveInt(subtrama?.Id) ?? null);
        const ventajasCatalogo = [
            ...(this.catalogoVentajas ?? []),
            ...(this.catalogoDesventajas ?? []),
        ];
        return {
            idCampana,
            idTrama,
            idSubtrama,
            idRegion: this.resolverIdRegionCreacion(),
            idAlineamiento: this.resolverIdAlineamientoCreacion(),
            idDeidad: this.resolverIdDeidadCreacion(),
            idGenero: this.resolverIdGeneroCreacion(),
            idCarga: this.resolverIdCargaCreacion(),
            idManiobrabilidad: this.toPositiveInt((this.Personaje as any)?.Raza?.Maniobrabilidad?.Id) ?? 0,
            idEspArcana: this.resolverIdEscuelaEspecialistaCreacion(),
            idEspPsionica: this.resolverIdDisciplinaEspecialistaCreacion(),
            idDisProhibida: this.resolverIdDisciplinaProhibidaCreacion(),
            catalogos: {
                clases: this.mapearCatalogoNombreId(this.catalogoClases, (item) => item?.Id, (item) => item?.Nombre),
                dominios: this.mapearCatalogoNombreId(this.catalogoDominios, (item) => item?.Id, (item) => item?.Nombre),
                idiomas: this.mapearCatalogoNombreId(this.catalogoIdiomas, (item) => item?.Id, (item) => item?.Nombre),
                ventajas: this.mapearCatalogoNombreId(ventajasCatalogo, (item) => item?.Id, (item) => item?.Nombre),
                escuelas: this.mapearCatalogoNombreId(this.catalogoEscuelas, (item) => item?.Id, (item) => item?.Nombre),
                disciplinas: this.mapearCatalogoNombreId(this.catalogoDisciplinas, (item) => item?.Id, (item) => item?.Nombre),
                regiones: this.mapearCatalogoNombreId(this.catalogoRegiones, (item) => item?.Id, (item) => item?.Nombre),
            },
        };
    }

    private mapearCatalogoNombreId<T>(
        items: T[] | null | undefined,
        getId: (item: T) => any,
        getNombre: (item: T) => any
    ): CatalogoNombreIdDto[] {
        const salida: CatalogoNombreIdDto[] = [];
        (items ?? []).forEach((item) => {
            const id = this.toPositiveInt(getId(item));
            const nombre = `${getNombre(item) ?? ''}`.trim();
            if (!id || nombre.length < 1)
                return;
            salida.push({ id, nombre });
        });
        return salida;
    }

    private resolverIdAlineamientoCreacion(): number | null {
        const nombreNorm = this.normalizarTexto(this.Personaje?.Alineamiento ?? '');
        const desdeCatalogo = (this.catalogoAlineamientosBasicos ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const idCatalogo = this.toPositiveInt(desdeCatalogo?.Id);
        if (idCatalogo)
            return idCatalogo;

        const fallback: Record<string, number> = {
            'legal bueno': 1,
            'legal neutral': 2,
            'legal maligno': 3,
            'neutral bueno': 4,
            'neutral autentico': 5,
            'neutral maligno': 6,
            'caotico bueno': 7,
            'caotico neutral': 8,
            'caotico maligno': 9,
        };
        const idFallback = fallback[nombreNorm];
        return this.toPositiveInt(idFallback);
    }

    private resolverIdDeidadCreacion(): number {
        const deidadNorm = this.normalizarTexto(this.Personaje?.Deidad ?? '');
        if (deidadNorm.length < 1 || deidadNorm === this.normalizarTexto(this.deidadSinSeleccion))
            return 0;
        const encontrada = (this.catalogoDeidades ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === deidadNorm);
        return this.toPositiveInt(encontrada?.Id) ?? 0;
    }

    private resolverIdRegionCreacion(): number {
        const rawId = (this.Personaje as any)?.Id_region
            ?? (this.Personaje as any)?.id_region
            ?? (this.Personaje as any)?.Region?.Id
            ?? (this.Personaje as any)?.Region?.id
            ?? (this.Personaje as any)?.region?.Id
            ?? (this.Personaje as any)?.region?.id;
        const rawText = `${rawId ?? ''}`.trim();
        if (rawText.length > 0) {
            const idParsed = Math.trunc(Number(rawText));
            if (Number.isFinite(idParsed) && idParsed >= 0)
                return idParsed;
        }

        const nombreRegion = `${(this.Personaje as any)?.Region?.Nombre
            ?? (this.Personaje as any)?.Region?.nombre
            ?? (this.Personaje as any)?.region?.Nombre
            ?? (this.Personaje as any)?.region?.nombre
            ?? ''}`.trim();
        const idPorNombre = this.resolverIdRegionCatalogoPorNombre(nombreRegion);
        return idPorNombre ?? 0;
    }

    private resolverIdGeneroCreacion(): number | null {
        const genero = this.normalizarTexto(this.Personaje?.Genero ?? '');
        if (genero === 'macho')
            return 1;
        if (genero === 'hembra')
            return 2;
        if (genero === 'hermafrodita')
            return 3;
        if (genero === 'sin genero')
            return 4;
        return null;
    }

    private resolverIdCargaCreacion(): number {
        const fuerza = Math.trunc(Number(this.Personaje?.Fuerza ?? 0));
        if (!Number.isFinite(fuerza))
            return 1;
        if (fuerza >= 10)
            return Math.min(fuerza - 9, 20);
        return 1;
    }

    private resolverIdEscuelaEspecialistaCreacion(): number {
        const nombreNorm = this.normalizarTexto((this.Personaje?.Escuela_especialista as any)?.Nombre ?? '');
        if (nombreNorm.length < 1 || nombreNorm === 'no especifica')
            return 0;
        const escuela = (this.catalogoEscuelas ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        return this.toPositiveInt((escuela as any)?.Id) ?? 0;
    }

    private resolverIdDisciplinaEspecialistaCreacion(): number {
        const nombreNorm = this.normalizarTexto((this.Personaje?.Disciplina_especialista as any)?.Nombre ?? '');
        if (nombreNorm.length < 1 || nombreNorm === 'no especifica')
            return 0;
        const disciplina = (this.catalogoDisciplinas ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        return this.toPositiveInt((disciplina as any)?.Id) ?? 0;
    }

    private resolverIdDisciplinaProhibidaCreacion(): number {
        const nombreNorm = this.normalizarTexto(this.Personaje?.Disciplina_prohibida ?? '');
        if (nombreNorm.length < 1 || nombreNorm === 'ninguna' || nombreNorm === 'no especifica')
            return 0;
        const disciplina = (this.catalogoDisciplinas ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        return this.toPositiveInt((disciplina as any)?.Id) ?? 0;
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed <= 0)
            return null;
        return parsed;
    }

    private resetearEstadoFinalizacion(): void {
        this.finalizacionState = {
            idPersonaje: null,
            sqlOk: false,
            firebaseOk: false,
        };
    }

    onCambioPlantillaSelectorFamiliar(plantilla: FamiliarPlantillaId | null): void {
        if (plantilla === null || plantilla === undefined) {
            this.selectorFamiliarPlantillaSeleccionada = null;
            this.recalcularFamiliaresElegiblesSelector();
            return;
        }
        const parsed = Number(plantilla);
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5)
            return;
        this.selectorFamiliarPlantillaSeleccionada = parsed as FamiliarPlantillaId;
        this.recalcularFamiliaresElegiblesSelector();
    }

    onCambioHomebrewSelectorFamiliar(value: boolean): void {
        this.selectorFamiliarIncluirHomebrew = !!value;
        this.recalcularFamiliaresElegiblesSelector();
    }

    onCambioNombreSelectorFamiliar(value: string): void {
        this.selectorFamiliarNombre = `${value ?? ''}`;
    }

    private normalizarPlantillaCompanero(value: CompaneroPlantillaSelector | string): CompaneroPlantillaSelector {
        const normalizada = this.normalizarTexto(`${value ?? ''}`);
        if (normalizada.includes('elevado'))
            return 'elevado';
        if (normalizada.includes('sabandija'))
            return 'sabandija';
        return 'base';
    }

    private sincronizarOwnerUidEnCreacion(): void {
        const uid = this.obtenerUidSesionActiva();
        const nombreSesion = this.obtenerNombreSesionActiva();
        if (uid.length > 0) {
            this.Personaje.ownerUid = uid;
            if (nombreSesion.length > 0)
                this.Personaje.Jugador = nombreSesion;
            return;
        }

        if (`${this.Personaje.ownerUid ?? ''}`.trim().length < 1)
            this.Personaje.ownerUid = null;
    }

    private obtenerUidSesionActiva(): string {
        try {
            return `${getAuth()?.currentUser?.uid ?? ''}`.trim();
        } catch {
            return '';
        }
    }

    private obtenerNombreSesionActiva(): string {
        try {
            const user = getAuth()?.currentUser;
            const displayName = `${user?.displayName ?? ''}`.trim();
            if (displayName.length > 0)
                return displayName;
            const email = `${user?.email ?? ''}`.trim();
            if (email.length > 0) {
                const arroba = email.indexOf('@');
                if (arroba > 0)
                    return email.substring(0, arroba).trim();
                return email;
            }
            return '';
        } catch {
            return '';
        }
    }

    private getIdPlantillaCompaneroSeleccionada(plantilla: CompaneroPlantillaSelector | null): number {
        if (!plantilla)
            return 1;
        if (plantilla === 'elevado')
            return 2;
        if (plantilla === 'sabandija')
            return 3;
        return 1;
    }

    private async cargarCatalogoFamiliaresSelector(): Promise<boolean> {
        try {
            const monstruos = await firstValueFrom(this.monstruoSvc.getMonstruos().pipe(take(1)));
            this.selectorFamiliarCatalogoCompleto = construirCatalogoFamiliaresDesdeMonstruos(
                Array.isArray(monstruos) ? monstruos : []
            );
            return true;
        } catch {
            await Swal.fire({
                icon: 'warning',
                title: 'No se pudo cargar el catálogo de monstruos familiares',
                text: 'Revisa la conexión o vuelve a intentarlo en unos segundos.',
                confirmButtonText: 'Entendido',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            return false;
        }
    }

    private recalcularFamiliaresElegiblesSelector(): void {
        if (!this.selectorFamiliarEstadoCupos) {
            this.selectorFamiliarElegibles = [];
            this.selectorFamiliarBloqueados = [];
            this.selectorFamiliarNivelesRequeridos = {};
            return;
        }
        const incluirHomebrewEfectivo = this.selectorFamiliarIncluirHomebrew || !this.Personaje.Oficial;
        const evaluaciones = evaluarFamiliaresElegibilidad({
            familiares: this.selectorFamiliarCatalogoCompleto,
            estado: this.selectorFamiliarEstadoCupos,
            alineamientoPersonaje: `${this.Personaje?.Alineamiento ?? ''}`.trim(),
            plantillaSeleccionada: this.selectorFamiliarPlantillaSeleccionada,
            incluirHomebrew: incluirHomebrewEfectivo,
        });
        const nivelesRequeridos: Record<string, number> = {};
        evaluaciones.forEach((item) => {
            const nivel = Number(item?.nivelMinimoRequerido ?? 0);
            if (!Number.isFinite(nivel) || nivel <= 0)
                return;
            const clave = this.getClaveFamiliarSelector(item.familiar);
            nivelesRequeridos[clave] = Math.trunc(nivel);
        });
        this.selectorFamiliarNivelesRequeridos = nivelesRequeridos;
        this.selectorFamiliarElegibles = evaluaciones
            .filter((item) => item.elegible)
            .map((item: FamiliarElegibilidadEvaluadaItem) => item.familiar);
        this.selectorFamiliarBloqueados = evaluaciones
            .filter((item) => !item.elegible)
            .map((item: FamiliarElegibilidadEvaluadaItem) => ({
                familiar: item.familiar,
                razones: [...(item.razones ?? [])],
                nivelMinimoRequerido: item.nivelMinimoRequerido ?? null,
            }));
    }

    private async cargarNombresEspecialesFamiliar(): Promise<Record<number, string>> {
        if (this.nombresEspecialesFamiliar)
            return { ...this.nombresEspecialesFamiliar };

        const objetivos = [81, 82, 83, 87];
        const nombres: Record<number, string> = {};
        objetivos.forEach((id) => {
            nombres[id] = `Especial ${id} (Familiar)`;
        });

        try {
            const especiales = await firstValueFrom(this.especialSvc.getEspeciales().pipe(take(1)));
            (especiales ?? []).forEach((especial) => {
                const id = Number(especial?.Id ?? 0);
                if (!objetivos.includes(id))
                    return;
                const nombre = `${especial?.Nombre ?? ''}`.trim();
                if (nombre.length > 0)
                    nombres[id] = nombre;
            });
        } catch {
            // fallback ya aplicado
        }

        this.nombresEspecialesFamiliar = { ...nombres };
        return { ...nombres };
    }

    private async cargarCatalogoCompanerosSelector(): Promise<boolean> {
        try {
            const monstruos = await firstValueFrom(this.monstruoSvc.getMonstruos().pipe(take(1)));
            this.selectorCompaneroCatalogoCompleto = construirCatalogoCompanerosDesdeMonstruos(
                Array.isArray(monstruos) ? monstruos : []
            );
            return true;
        } catch {
            await Swal.fire({
                icon: 'warning',
                title: 'No se pudo cargar el catálogo de monstruos compañeros',
                text: 'Revisa la conexión o vuelve a intentarlo en unos segundos.',
                confirmButtonText: 'Entendido',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            return false;
        }
    }

    private recalcularCompanerosElegiblesSelector(): void {
        if (!this.selectorCompaneroEstadoCupos) {
            this.selectorCompaneroElegibles = [];
            this.selectorCompaneroBloqueados = [];
            this.selectorCompaneroNivelesRequeridos = {};
            this.selectorCompaneroNivelesDisponibles = [];
            return;
        }

        const incluirHomebrewEfectivo = this.selectorCompaneroIncluirHomebrew || !this.Personaje.Oficial;
        const tieneDoteElevado = this.nuevoPSvc.PersonajeCreacion.DotesContextuales
            .some((item) => Number(item?.Dote?.Id) === 53)
            || this.nuevoPSvc.PersonajeCreacion.Dotes.some((item) => Number((item as any)?.Id) === 53);
        const tieneDoteSabandija = this.nuevoPSvc.PersonajeCreacion.DotesContextuales
            .some((item) => Number(item?.Dote?.Id) === 56)
            || this.nuevoPSvc.PersonajeCreacion.Dotes.some((item) => Number((item as any)?.Id) === 56);

        this.selectorCompaneroNivelesDisponibles = resolverNivelesCompaneroDisponibles({
            companeros: this.selectorCompaneroCatalogoCompleto,
            estado: this.selectorCompaneroEstadoCupos,
            alineamientoPersonaje: `${this.Personaje?.Alineamiento ?? ''}`.trim(),
            plantillaSeleccionada: this.selectorCompaneroPlantillaSeleccionada,
            incluirHomebrew: incluirHomebrewEfectivo,
            tieneDoteElevado,
            tieneDoteSabandija,
        });
        if (this.selectorCompaneroNivelSeleccionado !== null
            && !this.selectorCompaneroNivelesDisponibles.includes(this.selectorCompaneroNivelSeleccionado)) {
            this.selectorCompaneroNivelSeleccionado = null;
        }

        const evaluaciones = evaluarCompanerosElegibilidad({
            companeros: this.selectorCompaneroCatalogoCompleto,
            estado: this.selectorCompaneroEstadoCupos,
            alineamientoPersonaje: `${this.Personaje?.Alineamiento ?? ''}`.trim(),
            plantillaSeleccionada: this.selectorCompaneroPlantillaSeleccionada,
            incluirHomebrew: incluirHomebrewEfectivo,
            tieneDoteElevado,
            tieneDoteSabandija,
            nivelSeleccionado: this.selectorCompaneroNivelSeleccionado,
        });
        const nivelesRequeridos: Record<string, number> = {};
        evaluaciones.forEach((item) => {
            const nivel = Number(item?.nivelMinimoRequerido ?? 0);
            if (!Number.isFinite(nivel) || nivel <= 0)
                return;
            const clave = this.getClaveCompaneroSelector(item.companero);
            nivelesRequeridos[clave] = Math.trunc(nivel);
        });
        this.selectorCompaneroNivelesRequeridos = nivelesRequeridos;
        this.selectorCompaneroElegibles = evaluaciones
            .filter((item) => item.elegible)
            .map((item: CompaneroElegibilidadEvaluadaItem) => item.companero);
        this.selectorCompaneroBloqueados = evaluaciones
            .filter((item) => !item.elegible)
            .map((item: CompaneroElegibilidadEvaluadaItem) => ({
                companero: item.companero,
                razones: [...(item.razones ?? [])],
                nivelMinimoRequerido: item.nivelMinimoRequerido ?? null,
            }));
    }

    private async cargarNombresEspecialesCompanero(): Promise<Record<number, string>> {
        if (this.nombresEspecialesCompanero)
            return { ...this.nombresEspecialesCompanero };

        const objetivos = [157, 158, 159, 57];
        const nombres: Record<number, string> = {};
        objetivos.forEach((id) => {
            nombres[id] = `Especial ${id} (Compañero)`;
        });

        try {
            const especiales = await firstValueFrom(this.especialSvc.getEspeciales().pipe(take(1)));
            (especiales ?? []).forEach((especial) => {
                const id = Number(especial?.Id ?? 0);
                if (!objetivos.includes(id))
                    return;
                const nombre = `${especial?.Nombre ?? ''}`.trim();
                if (nombre.length > 0)
                    nombres[id] = nombre;
            });
        } catch {
            // fallback ya aplicado
        }

        this.nombresEspecialesCompanero = { ...nombres };
        return { ...nombres };
    }

    private getClaveFamiliarSelector(familiar: FamiliarMonstruoDetalle | null | undefined): string {
        return `${Number(familiar?.Id_familiar ?? 0)}:${Number(familiar?.Plantilla?.Id ?? 0)}`;
    }

    private getClaveCompaneroSelector(companero: CompaneroMonstruoDetalle | null | undefined): string {
        return `${Number(companero?.Id_companero ?? 0)}:${Number(companero?.Plantilla?.Id ?? 0)}`;
    }

    private cerrarSelectorFamiliarContexto(
        resultado: SelectorFamiliarConfirmacion | 'omitir' | null
    ): void {
        this.modalSelectorFamiliarAbierto = false;
        this.selectorFamiliarTitulo = 'Seleccionar familiar';
        this.selectorFamiliarPlantillaSeleccionada = null;
        this.selectorFamiliarIncluirHomebrew = false;
        this.selectorFamiliarNombre = '';
        this.selectorFamiliarCuposDisponibles = 0;
        this.selectorFamiliarEstadoCupos = null;
        this.selectorFamiliarCatalogoCompleto = [];
        this.selectorFamiliarElegibles = [];
        this.selectorFamiliarBloqueados = [];
        this.selectorFamiliarNivelesRequeridos = {};

        const resolver = this.resolverSelectorFamiliar;
        this.resolverSelectorFamiliar = null;
        resolver?.(resultado);
    }

    private cerrarSelectorCompaneroContexto(
        resultado: SelectorCompaneroConfirmacion | 'omitir' | null
    ): void {
        this.modalSelectorCompaneroAbierto = false;
        this.selectorCompaneroTitulo = 'Seleccionar compañero animal';
        this.selectorCompaneroPlantillaSeleccionada = null;
        this.selectorCompaneroIncluirHomebrew = false;
        this.selectorCompaneroNombre = '';
        this.selectorCompaneroCuposDisponibles = 0;
        this.selectorCompaneroEstadoCupos = null;
        this.selectorCompaneroCatalogoCompleto = [];
        this.selectorCompaneroElegibles = [];
        this.selectorCompaneroBloqueados = [];
        this.selectorCompaneroNivelesRequeridos = {};
        this.selectorCompaneroNivelesDisponibles = [];
        this.selectorCompaneroNivelSeleccionado = null;

        const resolver = this.resolverSelectorCompanero;
        this.resolverSelectorCompanero = null;
        resolver?.(resultado);
    }

    private getNombreDefectoFamiliar(): string {
        const nombrePj = `${this.Personaje?.Nombre ?? ''}`.trim();
        if (nombrePj.length < 1)
            return 'Familiar';
        return `Familiar de ${nombrePj}`;
    }

    private getNombreDefectoCompanero(): string {
        const nombrePj = `${this.Personaje?.Nombre ?? ''}`.trim();
        if (nombrePj.length < 1)
            return 'Compañero';
        return `Compañero de ${nombrePj}`;
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

    onConfirmarAumentosCaracteristica(asignaciones: AsignacionAumentoCaracteristica[]): void {
        const aplicado = this.nuevoPSvc.aplicarAumentosCaracteristica(asignaciones);
        if (!aplicado) {
            Swal.fire({
                icon: 'warning',
                title: 'No se pudieron aplicar los aumentos',
                text: 'Revisa que todas las asignaciones sean validas y vuelve a intentarlo.',
                showConfirmButton: true,
            });
            return;
        }

        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.cerrarSelectorAumentosContexto('completado');
        this.recalcularClasesVisibles();
    }

    onCerrarModalAumentosCaracteristica(): void {
        return;
    }

    onConfirmarEspecialidadMagica(seleccion: SelectorEspecialidadMagicaConfirmacion): void {
        this.cerrarSelectorEspecialidadMagicaContexto(seleccion ?? null);
    }

    private solicitarEspecialidadMagicaClase(
        clase: Clase,
        pendiente: EspecialidadMagicaPendiente
    ): Promise<SelectorEspecialidadMagicaConfirmacion | null> {
        this.selectorEspecialidadClaseNombre = `${clase?.Nombre ?? ''}`.trim();
        this.selectorEspecialidadRequiereArcano = !!pendiente?.requiereArcano;
        this.selectorEspecialidadRequierePsionico = !!pendiente?.requierePsionico;
        this.modalSelectorEspecialidadMagicaAbierto = true;

        return new Promise<SelectorEspecialidadMagicaConfirmacion | null>((resolve) => {
            this.resolverSelectorEspecialidadMagica = resolve;
        });
    }

    private cerrarSelectorEspecialidadMagicaContexto(
        resultado: SelectorEspecialidadMagicaConfirmacion | null
    ): void {
        this.modalSelectorEspecialidadMagicaAbierto = false;
        this.selectorEspecialidadClaseNombre = '';
        this.selectorEspecialidadRequiereArcano = false;
        this.selectorEspecialidadRequierePsionico = false;

        const resolver = this.resolverSelectorEspecialidadMagica;
        this.resolverSelectorEspecialidadMagica = null;
        if (resolver)
            resolver(resultado);
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

    private async solicitarSeleccionesAumentosClaseLanzadora(
        pendientes: ClaseAumentoLanzadorPendiente[],
        clase: Clase
    ): Promise<SeleccionAumentosClaseLanzadora | null> {
        const selecciones: SeleccionAumentosClaseLanzadora = [];
        for (const pendiente of (pendientes ?? [])) {
            const opciones = pendiente.opciones ?? [];
            if (opciones.length < 1)
                continue;

            const inputOptions: Record<string, string> = {};
            opciones.forEach((opcion) => {
                inputOptions[`${opcion.idClase}`] = `${opcion.nombreClase} (${opcion.tipoLanzamiento})`;
            });

            const result = await Swal.fire({
                icon: 'question',
                title: `${clase?.Nombre ?? 'Clase'}: aumento de lanzador`,
                text: pendiente.descripcion || 'Selecciona la clase objetivo para aplicar el aumento de nivel de lanzador.',
                input: 'select',
                inputOptions,
                inputPlaceholder: 'Selecciona una clase',
                showCancelButton: true,
                confirmButtonText: 'Aplicar',
                cancelButtonText: 'Cancelar',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
                inputValidator: (value) => value ? undefined : 'Debes elegir una clase objetivo',
            });

            if (!result.isConfirmed || !result.value)
                return null;

            const indice = Math.max(0, Number(pendiente.indice ?? 1) - 1);
            selecciones[indice] = Number(result.value);
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

    abrirInfoRecomendacionesClase(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        if (!this.mostrarInfoRecomendacionesClase)
            return;

        const recomendacion = this.Personaje?.Auto_reparto?.recomendacion;
        if (!recomendacion || recomendacion.clases.length < 2)
            return;

        Swal.fire({
            target: document.body,
            icon: 'info',
            title: 'Recomendaciones',
            width: 560,
            html: `
                <p style="text-align:left; margin-bottom:10px;">
                    Pues yo de ti, elegiría esto…
                </p>
                <p style="text-align:left; margin-bottom:8px;">
                    <strong>${recomendacion.clases[0]}</strong> o <strong>${recomendacion.clases[1]}</strong>
                </p>
                <p style="text-align:left; margin:0;">
                    ${recomendacion.explicacion}
                </p>
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

        this.limpiarFocoActivoAntesDeModal();
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

    private abrirSelectorAumentosCaracteristica(): Promise<boolean> {
        const pendientes = this.nuevoPSvc.getAumentosCaracteristicaPendientes();
        if (pendientes.length < 1) {
            this.cerrarSelectorAumentosContexto('completado');
            return Promise.resolve(true);
        }

        this.selectorAumentosPendientes = pendientes;
        this.selectorAumentosCaracteristicasActuales = this.construirSnapshotCaracteristicasAumentos();
        this.selectorAumentosCaracteristicasPerdidas = {
            ...(this.Personaje?.Caracteristicas_perdidas ?? {}),
            Constitucion: !!(this.Personaje?.Caracteristicas_perdidas?.Constitucion || this.Personaje?.Constitucion_perdida),
        };
        this.selectorAumentosTopes = this.nuevoPSvc.getTopesCaracteristicas();
        this.modalSelectorAumentosAbierto = true;

        return new Promise<boolean>((resolve) => {
            this.resolverSelectorAumentos = resolve;
        });
    }

    private abrirSelectorIdiomaParaVentaja(idVentaja: number): void {
        this.limpiarFocoActivoAntesDeModal();
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

    private cerrarSelectorAumentosContexto(resultado: 'completado' | 'cancelado' = 'cancelado'): void {
        this.modalSelectorAumentosAbierto = false;
        this.selectorAumentosPendientes = [];
        this.selectorAumentosTitulo = 'Seleccionar aumentos de caracteristica';
        this.selectorAumentosCaracteristicasActuales = {
            Fuerza: 0,
            Destreza: 0,
            Constitucion: 0,
            Inteligencia: 0,
            Sabiduria: 0,
            Carisma: 0,
        };
        this.selectorAumentosCaracteristicasPerdidas = {};
        this.selectorAumentosTopes = {};
        const resolver = this.resolverSelectorAumentos;
        this.resolverSelectorAumentos = null;
        if (resolver)
            resolver(resultado === 'completado');
    }

    private construirSnapshotCaracteristicasAumentos(): Record<CaracteristicaAumentoKey, number> {
        return {
            Fuerza: Number(this.Personaje?.Fuerza ?? 0),
            Destreza: Number(this.Personaje?.Destreza ?? 0),
            Constitucion: Number(this.Personaje?.Constitucion ?? 0),
            Inteligencia: Number(this.Personaje?.Inteligencia ?? 0),
            Sabiduria: Number(this.Personaje?.Sabiduria ?? 0),
            Carisma: Number(this.Personaje?.Carisma ?? 0),
        };
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

    private get hasSelectedCampaignContext(): boolean {
        return this.normalizarTexto(this.Personaje?.Campana ?? '') !== this.normalizarTexto('Sin campaña');
    }

    private get canIgnoreAlignmentRestrictionsForCurrentContext(): boolean {
        if (!this.hasSelectedCampaignContext)
            return true;
        return this.selectedCampaignPolicy?.permitirIgnorarRestriccionesAlineamiento === true;
    }

    private async ensureSelectedCampaignPolicyReady(): Promise<boolean> {
        if (!this.hasSelectedCampaignContext)
            return true;

        if (!this.selectedCampaignPolicy && !this.selectedCampaignPolicyLoading)
            await this.syncSelectedCampaignPolicy();

        if (this.selectedCampaignPolicyLoading) {
            await Swal.fire({
                icon: 'info',
                title: 'Cargando campaña',
                text: 'Espera un momento a que se cargue la política de creación de la campaña.',
                confirmButtonText: 'Entendido',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            return false;
        }

        return true;
    }

    private async syncSelectedCampaignPolicy(): Promise<void> {
        const campanaSeleccionada = this.Campanas.find(c => c.Nombre === this.Personaje.Campana);
        const campaignId = Number(campanaSeleccionada?.Id ?? 0);
        if (!this.hasSelectedCampaignContext || !Number.isFinite(campaignId) || campaignId <= 0) {
            this.selectedCampaignPolicy = null;
            this.selectedCampaignPolicyLoading = false;
            this.selectedCampaignPolicyRequestKey = '';
            return;
        }

        const requestKey = `${campaignId}:${this.Personaje.Campana ?? ''}`;
        this.selectedCampaignPolicyRequestKey = requestKey;
        this.selectedCampaignPolicyLoading = true;
        try {
            const detail = await this.campanaSvc.getCampaignDetail(campaignId);
            if (this.selectedCampaignPolicyRequestKey !== requestKey)
                return;
            this.selectedCampaignPolicy = detail?.politicaCreacion ?? null;
        } catch {
            if (this.selectedCampaignPolicyRequestKey !== requestKey)
                return;
            this.selectedCampaignPolicy = null;
        } finally {
            if (this.selectedCampaignPolicyRequestKey === requestKey)
                this.selectedCampaignPolicyLoading = false;
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

    private cargarArmas(): void {
        this.armasSub?.unsubscribe();
        this.armasSub = this.armaSvc.getArmas().subscribe({
            next: (armas) => {
                this.catalogoArmas = armas ?? [];
                this.nuevoPSvc.setCatalogoArmasDotes(
                    this.catalogoArmas.map((arma) => ({
                        Id: Number(arma?.Id ?? 0),
                        Nombre: `${arma?.Nombre ?? ''}`.trim(),
                    }))
                );
                this.recalcularClasesVisibles();
            },
            error: () => {
                this.catalogoArmas = [];
                this.nuevoPSvc.setCatalogoArmasDotes([]);
                this.recalcularClasesVisibles();
            },
        });
    }

    private cargarArmaduras(): void {
        this.armadurasSub?.unsubscribe();
        this.armadurasSub = this.armaduraSvc.getArmaduras().subscribe({
            next: (armaduras) => {
                this.catalogoArmaduras = armaduras ?? [];
                this.nuevoPSvc.setCatalogoArmadurasDotes(
                    this.catalogoArmaduras.map((armadura) => ({
                        Id: Number(armadura?.Id ?? 0),
                        Nombre: `${armadura?.Nombre ?? ''}`.trim(),
                    }))
                );
                this.recalcularClasesVisibles();
            },
            error: () => {
                this.catalogoArmaduras = [];
                this.nuevoPSvc.setCatalogoArmadurasDotes([]);
                this.recalcularClasesVisibles();
            },
        });
    }

    private cargarGruposArmas(): void {
        this.gruposArmasSub?.unsubscribe();
        this.gruposArmasSub = this.grupoArmaSvc.getGruposArmas().subscribe({
            next: (grupos) => {
                this.catalogoGruposArmas = grupos ?? [];
                this.nuevoPSvc.setCatalogoGruposArmasDotes(
                    this.catalogoGruposArmas.map((grupo) => ({
                        Id: Number(grupo?.Id ?? 0),
                        Nombre: `${grupo?.Nombre ?? ''}`.trim(),
                    }))
                );
                this.recalcularClasesVisibles();
            },
            error: () => {
                this.catalogoGruposArmas = [];
                this.nuevoPSvc.setCatalogoGruposArmasDotes([]);
                this.recalcularClasesVisibles();
            },
        });
    }

    private cargarGruposArmaduras(): void {
        this.gruposArmadurasSub?.unsubscribe();
        this.gruposArmadurasSub = this.grupoArmaduraSvc.getGruposArmaduras().subscribe({
            next: (grupos) => {
                this.catalogoGruposArmaduras = grupos ?? [];
                this.nuevoPSvc.setCatalogoGruposArmadurasDotes(
                    this.catalogoGruposArmaduras.map((grupo) => ({
                        Id: Number(grupo?.Id ?? 0),
                        Nombre: `${grupo?.Nombre ?? ''}`.trim(),
                    }))
                );
                this.recalcularClasesVisibles();
            },
            error: () => {
                this.catalogoGruposArmaduras = [];
                this.nuevoPSvc.setCatalogoGruposArmadurasDotes([]);
                this.recalcularClasesVisibles();
            },
        });
    }

    private async asegurarCatalogoConjuros(): Promise<void> {
        if (this.conjurosCatalogoCargado)
            return;

        try {
            const conjuros = await firstValueFrom(this.conjuroSvc.getConjuros().pipe(take(1)));
            this.catalogoConjuros = conjuros ?? [];
            this.nuevoPSvc.setCatalogoConjuros(this.catalogoConjuros);
        } catch {
            this.catalogoConjuros = [];
            this.nuevoPSvc.setCatalogoConjuros([]);
        } finally {
            this.conjurosCatalogoCargado = true;
        }
    }

    private async asegurarCatalogoEscuelas(): Promise<void> {
        if (this.escuelasCatalogoCargado)
            return;

        try {
            const escuelas = await firstValueFrom(this.escSvc.getEscuelas().pipe(take(1)));
            this.catalogoEscuelas = escuelas ?? [];
            this.nuevoPSvc.setCatalogoEscuelasDotes(
                this.catalogoEscuelas.map((escuela) => ({
                    Id: Number(escuela?.Id ?? 0),
                    Nombre: `${escuela?.Nombre ?? ''}`.trim(),
                }))
            );
        } catch {
            this.catalogoEscuelas = [];
            this.nuevoPSvc.setCatalogoEscuelasDotes([]);
        } finally {
            this.escuelasCatalogoCargado = true;
        }
    }

    private cargarDotes(): void {
        this.dotesSub?.unsubscribe();
        this.dotesSub = this.doteSvc.getDotes().subscribe({
            next: (dotes) => {
                this.catalogoDotes = dotes ?? [];
                this.nuevoPSvc.setCatalogoDotes(this.catalogoDotes);
            },
            error: () => {
                this.catalogoDotes = [];
                this.nuevoPSvc.setCatalogoDotes([]);
            },
        });
    }

    private async asegurarCatalogoDisciplinas(): Promise<void> {
        if (this.disciplinasCatalogoCargado)
            return;

        try {
            const disciplinas = await firstValueFrom(this.disSvc.getDisciplinas().pipe(take(1)));
            this.catalogoDisciplinas = disciplinas ?? [];
        } catch {
            this.catalogoDisciplinas = [];
        } finally {
            this.disciplinasCatalogoCargado = true;
        }
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

    private cargarRegiones(): void {
        this.regionesSub?.unsubscribe();
        this.regionesSub = this.regionSvc.getRegiones().subscribe({
            next: (regiones) => {
                this.catalogoRegiones = regiones ?? [];
                this.nuevoPSvc.setCatalogoRegiones(this.catalogoRegiones);
                this.normalizarRegionSeleccionada();
            },
            error: () => {
                this.catalogoRegiones = [];
                this.nuevoPSvc.setCatalogoRegiones([]);
                this.normalizarRegionSeleccionada();
            },
        });
    }

    private cargarEnemigosPredilectos(): void {
        this.enemigosPredilectosSub?.unsubscribe();
        this.enemigosPredilectosSub = this.enemigoPredilectoSvc.getEnemigosPredilectos().subscribe({
            next: (enemigos) => {
                this.catalogoEnemigosPredilectos = enemigos ?? [];
            },
            error: () => {
                this.catalogoEnemigosPredilectos = [];
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
            const beneficios = this.getBeneficiosSiguienteNivelClase(clase, siguienteNivel);
            evaluadas.push({
                clase,
                evaluacion,
                siguienteNivel,
                salvacionesDelta: this.getSalvacionesDeltaSiguienteNivelClase(clase, nivelActual, siguienteNivel),
                elegida: nivelActual > 0,
                puedeAplicarse,
                bloqueoSoloAlineamiento,
                beneficios,
                beneficiosRender: this.construirRenderBeneficiosClase(beneficios),
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

    getTextoSalvacionesDeltaClase(item: ClaseListadoItem): string {
        return `Fort ${this.formatSignedDeltaClase(item.salvacionesDelta.fortaleza)} | `
            + `Ref ${this.formatSignedDeltaClase(item.salvacionesDelta.reflejos)} | `
            + `Vol ${this.formatSignedDeltaClase(item.salvacionesDelta.voluntad)}`;
    }

    formatSignedDeltaClase(value: number): string {
        return value >= 0 ? `+${value}` : `${value}`;
    }

    private getSalvacionesDeltaSiguienteNivelClase(clase: Clase, nivelActual: number, siguienteNivel: number): ClaseSalvacionesDeltaItem {
        const detalleSiguiente = this.getDetalleNivelClase(clase, siguienteNivel);
        if (!detalleSiguiente) {
            return {
                fortaleza: 0,
                reflejos: 0,
                voluntad: 0,
            };
        }

        const detalleAnterior = nivelActual > 0
            ? this.getDetalleNivelClase(clase, nivelActual)
            : null;
        const fortaleza = this.parseValorSalvacionClase(detalleSiguiente.Salvaciones?.Fortaleza)
            - this.parseValorSalvacionClase(detalleAnterior?.Salvaciones?.Fortaleza);
        const reflejos = this.parseValorSalvacionClase(detalleSiguiente.Salvaciones?.Reflejos)
            - this.parseValorSalvacionClase(detalleAnterior?.Salvaciones?.Reflejos);
        const voluntad = this.parseValorSalvacionClase(detalleSiguiente.Salvaciones?.Voluntad)
            - this.parseValorSalvacionClase(detalleAnterior?.Salvaciones?.Voluntad);

        return {
            fortaleza,
            reflejos,
            voluntad,
        };
    }

    private parseValorSalvacionClase(texto: string | null | undefined): number {
        const raw = `${texto ?? ''}`;
        const match = raw.match(/[+-]?\d+/);
        if (!match || !match[0])
            return 0;
        const parsed = Number(match[0]);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private getDetalleNivelClase(
        clase: Clase,
        nivel: number
    ): { Dotes: ClaseDoteNivel[]; Especiales: ClaseEspecialNivel[]; Salvaciones: { Fortaleza: string; Reflejos: string; Voluntad: string; }; } | null {
        const detalle = (clase?.Desglose_niveles ?? []).find((item) => Number(item?.Nivel ?? 0) === Number(nivel));
        if (!detalle)
            return null;
        return {
            Dotes: detalle.Dotes ?? [],
            Especiales: detalle.Especiales ?? [],
            Salvaciones: {
                Fortaleza: `${detalle?.Salvaciones?.Fortaleza ?? ''}`,
                Reflejos: `${detalle?.Salvaciones?.Reflejos ?? ''}`,
                Voluntad: `${detalle?.Salvaciones?.Voluntad ?? ''}`,
            },
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
            const extraRaw = `${doteNivel?.Extra ?? ''}`;
            if (this.esExtraCeroBeneficio(extraRaw))
                return;
            const idExtra = Number(doteNivel?.Id_extra ?? 0);
            beneficios.push({
                tipo: 'dote',
                nombre,
                extra: this.resolverExtraBeneficioClase(extraRaw, idExtra, doteNivel?.Dote ?? null, null),
                opcional: Number(doteNivel?.Opcional ?? 0),
                idExtra,
                idDote: Number(doteNivel?.Dote?.Id ?? 0),
                nombreEspecial: '',
                rawDote: doteNivel?.Dote ?? null,
            });
        });
        (detalle.Especiales ?? []).forEach((especialNivel) => {
            const nombreEspecial = this.resolverNombreEspecial(especialNivel?.Especial);
            if (nombreEspecial.length < 1)
                return;
            const extraRaw = `${especialNivel?.Extra ?? ''}`;
            if (this.esExtraCeroBeneficio(extraRaw))
                return;
            const idExtra = Number(especialNivel?.Id_extra ?? 0);
            beneficios.push({
                tipo: 'especial',
                nombre: nombreEspecial,
                extra: this.resolverExtraBeneficioClase(extraRaw, idExtra, null, especialNivel?.Especial ?? null),
                opcional: Number(especialNivel?.Opcional ?? 0),
                idExtra,
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

    private construirRenderBeneficiosClase(beneficios: ClaseBeneficioNivelItem[]): ClaseBeneficioRenderItem[] {
        if (beneficios.length < 1)
            return [];

        const opcionesPorGrupo = new Map<number, ClaseBeneficioNivelItem[]>();
        beneficios.forEach((beneficio) => {
            const grupo = Number(beneficio?.opcional ?? 0);
            if (!Number.isFinite(grupo) || grupo <= 0)
                return;
            const opciones = opcionesPorGrupo.get(grupo) ?? [];
            opciones.push(beneficio);
            opcionesPorGrupo.set(grupo, opciones);
        });

        const render: ClaseBeneficioRenderItem[] = [];
        const gruposEmitidos = new Set<number>();
        beneficios.forEach((beneficio) => {
            const grupo = Number(beneficio?.opcional ?? 0);
            if (!Number.isFinite(grupo) || grupo <= 0) {
                render.push({
                    tipoRender: 'simple',
                    beneficio,
                });
                return;
            }

            if (gruposEmitidos.has(grupo))
                return;
            gruposEmitidos.add(grupo);

            const opciones = opcionesPorGrupo.get(grupo) ?? [];
            if (opciones.length > 1) {
                render.push({
                    tipoRender: 'grupo_opcional',
                    grupo,
                    opciones,
                });
                return;
            }

            const unica = opciones[0] ?? beneficio;
            render.push({
                tipoRender: 'simple',
                beneficio: unica,
            });
        });

        return render;
    }

    private resolverNombreEspecial(rawEspecial: any): string {
        const nombre = `${rawEspecial?.Nombre ?? rawEspecial?.nombre ?? rawEspecial?.Especial ?? rawEspecial?.especial ?? ''}`.trim();
        return nombre;
    }

    private esExtraCeroBeneficio(extraRaw: string): boolean {
        const compactado = `${extraRaw ?? ''}`.replace(/\s+/g, '').trim();
        return compactado === '+0' || compactado === '0';
    }

    private normalizarExtraBeneficio(extraRaw: string): string {
        const extra = `${extraRaw ?? ''}`.trim();
        if (extra.length < 1)
            return extra;

        const extraNorm = this.normalizarTexto(extra).replace(/\s+/g, ' ');
        if (extraNorm === 'no aplica'
            || extraNorm === 'n a'
            || extraNorm === 'na'
            || extraNorm === 'ninguno'
            || extraNorm === 'ninguna') {
            return '';
        }
        return extra;
    }

    private resolverExtraBeneficioClase(extraRaw: string, idExtra: number, rawDote: Dote | null, rawEspecial: any): string {
        const extraNormalizado = this.normalizarExtraBeneficio(extraRaw);
        if (this.esExtraBeneficioConValor(extraNormalizado))
            return extraNormalizado;

        const id = Number.isFinite(Number(idExtra)) ? Number(idExtra) : 0;
        if (id <= 0)
            return extraNormalizado;

        const extraDesdeDote = this.resolverExtraDesdeDote(rawDote, id);
        if (this.esExtraBeneficioConValor(extraDesdeDote))
            return extraDesdeDote;

        const extraDesdeEspecial = this.resolverExtraDesdeEspecial(rawEspecial, id);
        if (this.esExtraBeneficioConValor(extraDesdeEspecial))
            return extraDesdeEspecial;

        const extraDesdeCatalogoFuente = this.resolverExtraDesdeCatalogoPorFuente(rawDote, id);
        if (this.esExtraBeneficioConValor(extraDesdeCatalogoFuente))
            return extraDesdeCatalogoFuente;

        const extraUnico = this.resolverExtraUnicoEnCatalogos(id);
        if (this.esExtraBeneficioConValor(extraUnico))
            return extraUnico;

        return extraNormalizado;
    }

    private resolverExtraDesdeDote(rawDote: Dote | null, idExtra: number): string {
        if (!rawDote)
            return '';

        const disponibles = rawDote.Extras_disponibles;
        const fuentes = [
            ...(disponibles?.Armas ?? []),
            ...(disponibles?.Armaduras ?? []),
            ...(disponibles?.Escuelas ?? []),
            ...(disponibles?.Habilidades ?? []),
        ];
        const encontrado = fuentes.find((item) => Number(item?.Id ?? 0) === idExtra);
        return `${encontrado?.Nombre ?? ''}`.trim();
    }

    private resolverExtraDesdeEspecial(rawEspecial: any, idExtra: number): string {
        if (!rawEspecial || typeof rawEspecial !== 'object')
            return '';

        const extrasRaw = Array.isArray(rawEspecial?.Extras)
            ? rawEspecial.Extras
            : (rawEspecial?.Extras && typeof rawEspecial.Extras === 'object')
                ? Object.values(rawEspecial.Extras)
                : [];

        const encontrado = extrasRaw.find((item: any) => {
            const id = Number(item?.Id_extra ?? item?.Id ?? item?.id_extra ?? item?.id ?? 0);
            return id === idExtra;
        });
        return `${encontrado?.Extra ?? encontrado?.Nombre ?? ''}`.trim();
    }

    private resolverExtraDesdeCatalogoPorFuente(rawDote: Dote | null, idExtra: number): string {
        if (!rawDote)
            return '';

        const candidatos: string[] = [];
        const pushUnico = (valor: string) => {
            const limpio = `${valor ?? ''}`.trim();
            if (limpio.length < 1)
                return;
            if (!candidatos.includes(limpio))
                candidatos.push(limpio);
        };

        const extraEnArmas = (rawDote.Extras_disponibles?.Armas ?? []).some((item) => Number(item?.Id ?? 0) === idExtra);
        const extraEnArmaduras = (rawDote.Extras_disponibles?.Armaduras ?? []).some((item) => Number(item?.Id ?? 0) === idExtra);
        const extraEnEscuelas = (rawDote.Extras_disponibles?.Escuelas ?? []).some((item) => Number(item?.Id ?? 0) === idExtra);
        const extraEnHabilidades = (rawDote.Extras_disponibles?.Habilidades ?? []).some((item) => Number(item?.Id ?? 0) === idExtra);

        if (extraEnArmas || Number(rawDote.Extras_soportados?.Extra_arma ?? 0) > 0) {
            pushUnico(this.resolverNombreCatalogoPorId(this.catalogoArmas, idExtra));
            pushUnico(this.resolverNombreCatalogoPorId(this.catalogoGruposArmas, idExtra));
        }
        const soportaArmaduras = Number(rawDote.Extras_soportados?.Extra_armadura_armaduras ?? rawDote.Extras_soportados?.Extra_armadura ?? 0) > 0;
        const soportaEscudos = Number(rawDote.Extras_soportados?.Extra_armadura_escudos ?? rawDote.Extras_soportados?.Extra_armadura ?? 0) > 0;
        if (extraEnArmaduras || soportaArmaduras || soportaEscudos) {
            pushUnico(this.resolverNombreCatalogoPorId(this.catalogoArmaduras, idExtra));
            pushUnico(this.resolverNombreCatalogoPorId(this.catalogoGruposArmaduras, idExtra));
        }

        if (extraEnEscuelas || extraEnHabilidades)
            return '';

        return candidatos.length === 1 ? candidatos[0] : '';
    }

    private resolverExtraUnicoEnCatalogos(idExtra: number): string {
        const coincidencias: string[] = [];
        const pushCoincidencia = (valor: string) => {
            const limpio = `${valor ?? ''}`.trim();
            if (limpio.length < 1)
                return;
            coincidencias.push(limpio);
        };

        pushCoincidencia(this.resolverNombreCatalogoPorId(this.catalogoArmas, idExtra));
        pushCoincidencia(this.resolverNombreCatalogoPorId(this.catalogoArmaduras, idExtra));
        pushCoincidencia(this.resolverNombreCatalogoPorId(this.catalogoGruposArmas, idExtra));
        pushCoincidencia(this.resolverNombreCatalogoPorId(this.catalogoGruposArmaduras, idExtra));

        return coincidencias.length === 1 ? coincidencias[0] : '';
    }

    private resolverNombreCatalogoPorId(catalogo: Array<{ Id: number; Nombre: string; }>, idExtra: number): string {
        const encontrado = catalogo.find((item) => Number(item?.Id ?? 0) === idExtra);
        return `${encontrado?.Nombre ?? ''}`.trim();
    }

    private esExtraBeneficioConValor(extra: string): boolean {
        const limpio = `${extra ?? ''}`.trim();
        if (limpio.length < 1)
            return false;
        const normalizado = this.normalizarTexto(limpio).replace(/\s+/g, ' ');
        return normalizado !== 'desconocido'
            && normalizado !== 'sin especificar'
            && normalizado !== 'sin especificacion'
            && normalizado !== 'unknown';
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
                etiqueta: 'Incompatible',
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
        const ctx = this.getContextoEvaluacionPlantillas(raza, this.incluirHomebrewPlantillasEfectivo);

        const elegibles: Plantilla[] = [];
        const bloqueadasUnknown: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];
        const bloqueadasFailed: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];
        const idsNoDisponibles = new Set<number>(this.plantillasSeleccionadas
            .map((plantilla) => Number(plantilla?.Id))
            .filter((id) => Number.isFinite(id) && id > 0));

        this.plantillasCatalogo.forEach((plantilla) => {
            const idPlantilla = Number(plantilla?.Id);
            if ((Number.isFinite(idPlantilla) && idsNoDisponibles.has(idPlantilla))
                || this.nuevoPSvc.esPlantillaConfirmada(idPlantilla))
                return;

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

    private hayPlantillasElegiblesPostDotes(): boolean {
        const raza = this.razaSeleccionada;
        if (!raza)
            return false;

        const ctx = this.getContextoEvaluacionPlantillas(raza, this.incluirHomebrewPlantillasEfectivo);
        const idsNoDisponibles = new Set<number>(this.plantillasSeleccionadas
            .map((plantilla) => Number(plantilla?.Id))
            .filter((id) => Number.isFinite(id) && id > 0));

        return this.plantillasCatalogo.some((plantilla) => {
            const idPlantilla = Number(plantilla?.Id);
            if ((Number.isFinite(idPlantilla) && idsNoDisponibles.has(idPlantilla))
                || this.nuevoPSvc.esPlantillaConfirmada(idPlantilla))
                return false;

            const evaluacion = evaluarElegibilidadPlantilla(plantilla, ctx);
            if (evaluacion.estado !== 'eligible')
                return false;

            const alineamientoResuelto = resolverAlineamientoPlantillas(
                this.Personaje.Alineamiento,
                [...this.plantillasSeleccionadas, plantilla]
            );
            return !alineamientoResuelto.conflicto;
        });
    }

    private getContextoEvaluacionPlantillas(raza: Raza, incluirHomebrew: boolean) {
        const tipoCriaturaActualId = Number(this.Personaje.Tipo_criatura?.Id ?? 0);
        const tiposCriaturaIdentidadIds = buildIdentidadPrerrequisitos(
            raza,
            this.nuevoPSvc.RazaBaseSeleccionadaCompleta,
            this.Personaje.Subtipos
        ).tiposCriatura
            .map((tipo) => Number(tipo.id))
            .filter((id) => Number.isFinite(id) && id > 0);
        const identidadCriaturaActualIds = tipoCriaturaActualId > 0
            ? [tipoCriaturaActualId]
            : Array.from(new Set(tiposCriaturaIdentidadIds));

        return {
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
            tiposCriaturaMiembroIds: identidadCriaturaActualIds,
            tipoCriaturaActualId,
            razaHeredada: !!raza.Heredada,
            incluirHomebrew,
            seleccionadas: this.plantillasSeleccionadas.map((plantilla) => ({
                Id: Number(plantilla.Id),
                Nombre: plantilla.Nombre,
                Nacimiento: !!plantilla.Nacimiento,
            })),
        };
    }
}
