import { Component, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatTabGroup } from '@angular/material/tabs';
import { Observable, Subscription, combineLatest, firstValueFrom, take } from 'rxjs';
import { Caracteristica } from 'src/app/interfaces/caracteristica';
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
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { RegionService } from 'src/app/services/region.service';
import { FichasDescargaBackgroundService } from 'src/app/services/fichas-descarga-background.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { ListaPersonajesService } from 'src/app/services/listas/lista-personajes.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import {
    AsignacionAumentoCaracteristica,
    AsignacionCaracteristicas,
    AumentoCaracteristicaPendiente,
    CompaneroPlantillaSelector,
    EstadoCuposFamiliar,
    EstadoCuposCompanero,
    ClaseAumentoLanzadorPendiente,
    ClaseDominiosPendientes,
    ClaseEspecialExtraPendiente,
    ClaseGrupoOpcionalPendiente,
    ConjurosSesionStateEntrada,
    DotePendienteState,
    DoteSeleccionConfirmada,
    DoteSelectorCandidato,
    EspecialidadMagicaPendiente,
    EspecialidadMagicaSeleccion,
    NuevoPersonajeDraftResumen,
    NuevoPersonajeService,
    ResultadoCalculoVidaFinal,
    SeleccionAumentosClaseLanzadora,
    SeleccionDominiosClase,
    SeleccionExtrasEspecialesClase,
    SeleccionOpcionalesClase,
    StepNuevoPersonaje,
} from 'src/app/services/nuevo-personaje.service';
import { extrasElegiblesEspecial } from 'src/app/services/utils/aptitudes-clase';
import {
    construirCatalogoFamiliaresDesdeMonstruos,
    evaluarFamiliaresElegibilidad,
    FamiliarPlantillaId,
    FamiliarPlantillaOpcion,
    FamiliarElegibilidadEvaluadaItem,
    plantillasFamiliarDisponibles,
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
import { SelectorClaseOpcionalModalOpcion } from './selector-clase-opcional-modal/selector-clase-opcional-modal.component';
import { InformacionBasicosModalSection } from './informacion-basicos-modal/informacion-basicos-modal.component';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RazaService } from 'src/app/services/raza.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { VentajaService } from 'src/app/services/ventaja.service';
import { PlantillaEvaluacionResultado, esPlantillaLicantropa, evaluarElegibilidadPlantilla, resolverAlineamientoPlantillas } from 'src/app/services/utils/plantilla-elegibilidad';
import { DEIDAD_SIN_SELECCION, esSinDeidad } from 'src/app/services/utils/deidad-seleccion';
import { incumpleAlineamientoDeidad } from 'src/app/services/utils/alineamiento-deidad';
import { motivosHomebrewPersonaje } from 'src/app/services/utils/personaje-oficialidad';
import { buildIdentidadPrerrequisitos } from 'src/app/services/utils/identidad-prerrequisitos';
import { GrupoRacialesOpcionales, SeleccionRacialesOpcionales, agruparRacialesPorOpcional, getClaveSeleccionRacial } from 'src/app/services/utils/racial-opcionales';
import { RacialEvaluacionResultado, evaluarRacialParaSeleccion } from 'src/app/services/utils/racial-prerrequisitos';
import { ClaseEvaluacionResultado } from 'src/app/services/utils/clase-elegibilidad';
import { EvaluacionElegibilidadRazaBase, aplicarMutacion, esRazaMutada, evaluarElegibilidadRazaBase } from 'src/app/services/utils/raza-mutacion';
import {
    distanciaEntreAlineamientos,
    extraerEjesAlineamientoDesdeContrato,
    getVectorDesdeNombreBasico,
    nombreBasicoDesdeVector,
} from 'src/app/services/utils/alineamiento-contrato';
import { CatalogoNombreIdDto, PersonajeContextoCreacionCampanaDto, PersonajeContextoIdsDto } from 'src/app/interfaces/personajes-api';
import { CampaignCreationPolicy } from 'src/app/interfaces/campaign-management';
import Swal from 'sweetalert2';
import { DatosIdeaIa, datosIdeaDePersonaje, TipoIdeaIa } from 'src/app/services/ideas-ia.service';
import { UsoIdeaIa } from '../shared/ideas-ia/ideas-ia.component';
import { ClaseConMoldeado, DatoFranja, FilaMoldeado, IncarnumTuPersonaje, filasMoldeado, franjaIncarnum, incarnumTuPersonaje } from '../detalles/ficha';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { CapacidadEsencia, Chakra, FormacionIncarnumDto, Fusion, PersonajeIncarnum } from 'src/app/interfaces/incarnum';
import { AlineamientoParaFusiones, CODIGOS_FALLO_FORMACION, FalloFormacion } from 'src/app/services/utils/incarnum';
import { PasoCreacionId, lineaPersonajeCreacion, pasoCreacionDeLaPestana, textoContinuarCreacion } from './marco';
import {
    ContextoEdad, MOTIVO_PJ_SIN_CLASE, nombreEdadEnFrase, OpcionCategoriaEdad, OpcionPasoEdad, opcionesEdad, pasoEdadInicial,
    puedeQuedarseSinClases, rangoEdadPaso, razaConEdad, razaPorEdades, textoRangoEdad
} from 'src/app/services/utils/razas-por-edades';
import { esPnj, TipoPersonaje, tituloNuevoPersonaje } from 'src/app/services/utils/tipo-personaje';
import { codigoDeError, mensajeDeError } from 'src/app/services/utils/error-api';
import { PasoEdadRaza } from 'src/app/interfaces/raza';
import { normalizarTexto, primerEntero, toPositiveInt } from 'src/app/services/utils/normalizacion';
import { esTextoExtraPorElegir } from 'src/app/services/utils/habilidad-extra-visible';
import { getAlineamientoBasicoIdPorNombre } from 'src/app/services/utils/alineamiento-contrato';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import { esEspecializable, prohibidasAlEspecializarse } from 'src/app/services/utils/reglas-magia';
import { etiquetaManual } from 'src/app/services/utils/manual-mapper';
import { MAX_TIRADAS_PUNTOS_GOLPE, tiradasPuntosGolpe } from 'src/app/services/utils/puntos-golpe';
import { dgsDePlantilla } from 'src/app/services/utils/nivel-personaje';
import { EquipoService } from 'src/app/services/equipo.service';
import { PersonajeCompraRequestDto } from 'src/app/interfaces/personajes-api';
import { EquipoCatalogos, MunicionDetalle } from 'src/app/interfaces/equipo';
import {
    ArticuloTienda,
    POLITICA_TIENDA_LIBRE,
    PoliticaTienda,
    indiceConjuroLibroDelCampo,
    ReglaDineroInicial,
    articuloDeArma,
    articuloDeArmadura,
    articuloDeMunicion,
    indicePiezaDelCampo,
    politicaTienda,
    reglaDineroInicial,
} from 'src/app/services/utils/tienda-equipo';
import { LibroTienda, libroTienda } from 'src/app/services/utils/libro-conjuros';
import { edadesDeLaRaza, edadFueraDelManual, etapaEdad, EtapaEdad, razaTieneEdades, textoEnvejecimiento } from 'src/app/services/utils/edad-personaje';

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

interface BasicosDerivedState {
    preferenciasRazaItems: { etiqueta: string; valor: string; }[];
    deidadesFiltradas: DeidadBasicosOption[];
    alineamientosDisponibles: string[];
    evaluacionBasicos: EvaluacionInconsistenciasBasicos;
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

type FiltroTipoLanzadorClase = 'todas' | 'no lanzador' | 'arcano' | 'divino' | 'psionico';
type FiltroRolClase = 'todas' | 'dps' | 'tanque' | 'support' | 'utilidad';
type FiltroPrestigioClase = 'todas' | 'basica' | 'prestigio';

type ClaseRolChip = 'DPS' | 'Tanque' | 'Support' | 'Utilidad';
type ClaseBeneficioTipo = 'dote' | 'especial';
type EstadoCompatibilidadAlineamientoClase = 'compatible' | 'incompatible' | 'neutro';
type CaracteristicaAumentoKey = Caracteristica;

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
    campaignBlockedReason: string | null;
}

type CampaignHomebrewSourceCategory = 'raza' | 'raza_base' | 'deidad' | 'plantilla' | 'clase' | 'dote';
type CampaignHomebrewMode = 'unrestricted' | 'limited' | 'forbidden';

interface CampaignHomebrewSource {
    key: string;
    categoria: CampaignHomebrewSourceCategory;
    id: number;
    nombre: string;
}

interface CampaignCreationValidationResult {
    mode: CampaignHomebrewMode;
    nepLimit: number | null;
    currentNep: number;
    maxSources: number | null;
    sources: CampaignHomebrewSource[];
    sourceKeys: Set<string>;
    sourceCount: number;
    remainingSources: number | null;
    allowsVentajasDesventajas: boolean;
    blocksExistingNep: boolean;
    blocksExistingHomebrew: boolean;
    blocksExistingVentajas: boolean;
    blockers: string[];
}

interface DeidadBasicosOption {
    nombre: string;
    etiqueta: string;
    disabled: boolean;
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

/**
 * Los errores de `POST /personajes/add` del tipo (PJ o PNJ), de la edad y del PJ sin clases (`docs/publica/DRAGONES_FRONT.md`):
 * traen su frase, que se enseña tal cual.
 */
const CODIGOS_FALLO_TIPO_Y_EDAD: readonly string[] = [
    'tipo_personaje_no_valido', 'paso_edad_obligatorio', 'paso_edad_no_valido', 'paso_edad_no_jugable', 'pnj_solo_master', 'pj_sin_clase',
];

const DEFAULT_CAMPAIGN_CREATION_POLICY: CampaignCreationPolicy = {
    tiradaMinimaCaracteristica: null,
    nepMaximoPersonajeNuevo: null,
    maxTablasDadosCaracteristicas: null,
    permitirHomebrewGeneral: true,
    permitirVentajasDesventajas: true,
    permitirIgnorarRestriccionesAlineamiento: true,
    maxFuentesHomebrewGeneralesPorPersonaje: null,
    maxTiradasPuntosGolpe: null,
};

@Component({
    selector: 'app-nuevo-personaje',
    templateUrl: './nuevo-personaje.component.html',
    styleUrls: ['./nuevo-personaje.component.sass'],
    standalone: false
})
export class NuevoPersonajeComponent {
    private static readonly EMPTY_BASICS_EVALUATION: EvaluacionInconsistenciasBasicos = {
        previewWarnings: [],
        hardConflicts: [],
        otherOfficialBlockers: [],
    };
    readonly placeholderContexto = 'De donde viene tu personaje, cual es su familia, linaje, maestros, etc. Esto te ayudara a saber como deberia reaccionar tu personaje ante diversos estimulos.';
    readonly placeholderPersonalidad = 'Altivo, compasivo, incapaz de estarse quieto, maduro o incomprendido. Dale adjetivos a tu personaje para reforzar su interpretacion.';
    /** Ideas con IA de Básicos (`app-ideas-ia`): lo que hay del personaje en el momento de pedirlas. */
    readonly datosParaIdeasIa = (): DatosIdeaIa => datosIdeaDePersonaje(this.Personaje);
    /** La idea de personaje va al trasfondo, como punto de partida. */
    readonly textoActualIdeaIa = (tipo: TipoIdeaIa): string =>
        `${(tipo === 'personalidad' ? this.Personaje?.Personalidad : this.Personaje?.Contexto) ?? ''}`;
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
    readonly deidadSinSeleccion = DEIDAD_SIN_SELECCION;
    readonly tramaSinSeleccionCampana = 'Sin trama';
    readonly subtramaSinSeleccionCampana = 'Sin subtrama';

    Personaje!: Personaje;
    Campanas: Campana[] = [];
    campanasLoading = false;
    Tramas: Super[] = [];
    Subtramas: Super[] = [];
    razasCatalogo: Raza[] = [];
    plantillasCatalogo: Plantilla[] = [];
    plantillasElegibles: Plantilla[] = [];
    plantillasBloqueadasCampana: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];
    plantillasBloqueadasUnknown: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];
    plantillasBloqueadasFailed: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];
    filtroPlantillasTexto: string = '';
    filtroPlantillasManual: string = 'Cualquiera';
    incluirHomebrewPlantillas: boolean = false;
    cargandoPlantillas: boolean = true;
    incluirHomebrewIdiomas: boolean = false;
    private hardAlignmentOverrideConfirmed: boolean = false;
    catalogoVentajas: VentajaDetalle[] = [];
    catalogoDesventajas: VentajaDetalle[] = [];
    private catalogoIdiomasCompleto: IdiomaDetalle[] = [];
    /** Los idiomas adicionales permitidos mientras está abierto su selector (calculados al abrirlo). */
    private catalogoIdiomasAdicionales: IdiomaDetalle[] | null = null;

    /**
     * El catálogo de idiomas; al elegir los idiomas adicionales por Inteligencia, solo los que permiten la raza y las
     * clases del personaje (MJ cap. 2). Las ventajas que dan un idioma siguen eligiendo de todo el catálogo.
     */
    get catalogoIdiomas(): IdiomaDetalle[] {
        return this.catalogoIdiomasAdicionales ?? this.catalogoIdiomasCompleto;
    }

    set catalogoIdiomas(idiomas: IdiomaDetalle[]) {
        this.catalogoIdiomasCompleto = idiomas ?? [];
    }
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
    /** Las plantillas elegidas saltándose sus prerrequisitos: mientras alguna siga elegida, el personaje es homebrew. */
    private plantillasConRequisitosSaltados = new Set<number>();
    selectedCampaignPolicy: CampaignCreationPolicy | null = null;
    private selectedCampaignActiveMasterUid: string | null = null;
    private selectedCampaignPolicyLoading = false;
    private selectedCampaignPolicyRequestKey = '';
    private selectedCampaignPolicyResolved = false;
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
    modalSelectorClaseOpcionalAbierto = false;
    modalInformacionBasicosAbierto = false;
    informacionBasicosModalTitulo = '';
    informacionBasicosModalIcono = 'info';
    informacionBasicosModalSecciones: InformacionBasicosModalSection[] = [];
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
    /** La escuela de la que la clase es siempre especialista (del catálogo de escuelas): sin selector de especialidad. */
    selectorEspecialidadEscuelaFija: EscuelaConjuros | null = null;
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
    selectorClaseOpcionalTitulo = 'Grupo opcional';
    selectorClaseOpcionalDescripcion = 'Elige una opción para continuar con el nivel de clase.';
    selectorClaseOpcionalOpciones: SelectorClaseOpcionalModalOpcion[] = [];
    private resolverSelectorDominios: ((seleccion: SeleccionDominiosClase | null) => void) | null = null;
    private resolverSelectorClaseOpcional: ((seleccion: string | null) => void) | null = null;
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
    selectorFamiliarPlantillas: FamiliarPlantillaOpcion[] = [];
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
    private basicosDerivedState: BasicosDerivedState = {
        preferenciasRazaItems: [],
        deidadesFiltradas: [],
        alineamientosDisponibles: [...this.alineamientos],
        evaluacionBasicos: NuevoPersonajeComponent.EMPTY_BASICS_EVALUATION,
    };
    private basicosDerivedSignature = '';
    resultadoVidaActual: ResultadoCalculoVidaFinal | null = null;
    tiradasVidaTotales = MAX_TIRADAS_PUNTOS_GOLPE;
    tiradasVidaRestantes = 0;
    selectorVisibilidadValorInicial: boolean | null = null;
    /** La tienda del final de la creación: se abre con el personaje ya guardado (decisión del propietario, 2026-10-25). */
    modalTiendaAbierto = false;
    tiendaRegla: ReglaDineroInicial | null = null;
    tiendaArticulos: ArticuloTienda[] = [];
    tiendaGuardando = false;
    tiendaError = '';
    /** La pieza que señala el error de la API (`field: piezas[i]…`), o `null`. */
    tiendaPiezaConError: number | null = null;
    /** El conjuro copiado al libro que señala el error de la API (`field: conjurosLibro[i]`). */
    tiendaCopiaConError: number | null = null;
    /** Los libros de conjuros de sus clases para la pestaña «Conjuros para el libro» (vacío si ninguna tiene libro). */
    tiendaLibros: LibroTienda[] = [];
    /** En una campaña que no admite homebrew, la tienda solo ofrece lo oficial (la API lo comprueba igualmente). */
    tiendaSoloOficial = false;
    /** Lo que la campaña deja comprar en la tienda (objetos mágicos, a medida y precio por pieza); sin campaña, todo. */
    tiendaPolitica: PoliticaTienda = POLITICA_TIENDA_LIBRE;
    private tiendaPersonaje: Personaje | null = null;
    finalizacionEnCurso = false;
    finalizacionState: {
        idPersonaje: number | null;
        sqlOk: boolean;
    } = {
            idPersonaje: null,
            sqlOk: false,
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
    private chatOcultoPorModalCaracteristicas = false;
    private dominiosSub?: Subscription;
    private regionesSub?: Subscription;
    private enemigosPredilectosSub?: Subscription;
    private deidadesSub?: Subscription;
    private tiposCriaturaSub?: Subscription;
    private alineamientosBasicosSub?: Subscription;
    private catalogosCifrasSubs: Subscription[] = [];
    @ViewChild(MatTabGroup) TabGroup?: MatTabGroup;
    @Output() personajeFinalizado = new EventEmitter<number>();

    // El marco de la creación (lienzo del 2026-10-26): qué paso se ve, qué pasos salen y lo que se mira a la derecha.
    /** La raza que se mira en el paso de Raza, a la derecha, antes de elegirla. */
    razaMirada: Raza | null = null;
    /** En una raza por edades: el paso de edad que se mira y la raza resuelta a esa edad (`GET /razas/{id}/pasos-edad/{idPaso}`). */
    pasoEdadMiradoId: number | null = null;
    razaMiradaAEdad: Raza | null = null;
    cargandoRazaAEdad = false;
    errorRazaAEdad: string | null = null;
    private razaMiradaAEdadPasoId: number | null = null;
    private peticionRazaAEdad = 0;
    private opcionesEdadCache: { clave: string; valor: OpcionCategoriaEdad[]; } = { clave: '', valor: [] };

    get pasoCreacion(): PasoCreacionId {
        return pasoCreacionDeLaPestana(this.selectedInternalTabIndex, {
            enTienda: this.modalTiendaAbierto,
            enFormacion: this.formacionAbierta,
            eligiendoDotesSinConjuros: this.flujo.pasoActual === 'dotes' && !this.entradaConjurosActual,
        });
    }

    // Magic of Incarnum (roadmap `ACTIVO_incarnum`, fase 3): el bloque del incarnum que calcula la web como la API y la
    // formación de partida, un paso opcional al terminar los niveles (decisión 4 de la fase 0, opción B).
    formacionAbierta = false;
    formacionIncarnum: FormacionIncarnumDto | null = null;
    formacionErrorApi: FalloFormacion | null = null;
    formacionBloque: PersonajeIncarnum | null = null;
    formacionAlineamiento: AlineamientoParaFusiones = { actitudes: [], descriptoresSinAlineamiento: [] };
    incarnumChakras: Chakra[] = [];
    incarnumFusiones: Fusion[] = [];
    /** Tras un error de la API con la formación, continuar vuelve a guardar sin repetir los PG ni la visibilidad. */
    private formacionReintento = false;
    /** La sesión de conjuros del lanzamiento racial sin clases se abrió al terminar: al cerrarla, se sigue terminando. */
    private finalizarTrasLanzamientoRacial = false;
    private incarnumCapacidad: CapacidadEsencia[] = [];
    private incarnumCache: { firma: string; bloque: PersonajeIncarnum | null; tuPersonaje: IncarnumTuPersonaje | null; } =
        { firma: '', bloque: null, tuPersonaje: null };
    private progresionCache: { firma: string; valor: ProgresionMoldeado | null; } = { firma: '', valor: null };

    /** El paso «Formación» sale si el personaje puede moldear fusiones. */
    get pasoConFormacion(): boolean {
        return this.pasoCreacion === 'formacion' || !!this.incarnumBorrador?.puedeMoldear;
    }

    /**
     * El bloque `incarnum` del personaje que se está creando (con la formación, si ya la eligió): solo se recalcula si
     * cambia algo de lo que lo decide. Se deja también en el personaje para la vista previa de la ficha.
     */
    get incarnumBorrador(): PersonajeIncarnum | null {
        this.actualizarIncarnumCache();
        return this.incarnumCache.bloque;
    }

    /** El incarnum de «Tu personaje» en el paso de clases. */
    get incarnumTuPersonajeModelo(): IncarnumTuPersonaje | null {
        this.actualizarIncarnumCache();
        return this.incarnumCache.tuPersonaje;
    }

    private actualizarIncarnumCache(): void {
        const pj = this.Personaje;
        const firma = JSON.stringify([
            (pj?.desgloseClases ?? []).map((c) => [c?.Nombre, c?.Nivel]),
            (pj?.DotesContextuales ?? []).map((d) => [d?.Dote?.Id, d?.Contexto?.Id_extra]),
            (pj?.Raciales ?? []).map((r) => r?.Id),
            (pj?.Claseas ?? []).map((c) => (c as any)?.Id),
            (pj?.Plantillas ?? []).map((p) => p?.Id),
            pj?.Raza?.Id,
            [pj?.Fuerza, pj?.Destreza, pj?.Constitucion, pj?.Inteligencia, pj?.Sabiduria, pj?.Carisma],
            this.formacionIncarnum,
            this.incarnumCapacidad.length,
            this.catalogoClases.length,
            this.catalogoDotes.length,
        ]);
        if (firma === this.incarnumCache.firma)
            return;
        const bloque = this.nuevoPSvc.getIncarnumBorrador(this.formacionIncarnum);
        this.incarnumCache = { firma, bloque, tuPersonaje: incarnumTuPersonaje(bloque, this.clasesConMoldeado()) };
        if (this.Personaje)
            this.Personaje.Incarnum = bloque;
    }

    /** Una clase del catálogo por su nombre (el del desglose del personaje). */
    private claseDelCatalogo(nombre: string | null | undefined): Clase | undefined {
        return this.catalogoClases.find((clase) => normalizarTexto(clase?.Nombre ?? '') === normalizarTexto(nombre ?? ''));
    }

    /** Las clases del personaje con su `Moldeado` del catálogo (por nombre). */
    private clasesConMoldeado(): ClaseConMoldeado[] {
        return (this.Personaje?.desgloseClases ?? []).map((entrada) => ({
            nombre: `${entrada?.Nombre ?? ''}`.trim(),
            nivel: Number(entrada?.Nivel) || 0,
            moldeado: this.claseDelCatalogo(entrada?.Nombre)?.Moldeado ?? null,
        }));
    }

    /**
     * La progresión de moldeado del paso de clases (lienzo `Clases.dc.html`): la de la clase que se mira si moldea o, si
     * no, la de la primera moldeadora que ya tiene; hasta el nivel que va a tomar y uno más, con los especiales de cada nivel.
     */
    get progresionMoldeado(): ProgresionMoldeado | null {
        const seleccion = this.claseSeleccionadaActual;
        const propia = seleccion?.clase?.Moldeado
            ? { clase: seleccion.clase, siguiente: seleccion.siguienteNivel }
            : (() => {
                const entrada = this.clasesConMoldeado().find((c) => !!c.moldeado);
                const clase = entrada ? this.claseDelCatalogo(entrada.nombre) : undefined;
                return clase && entrada ? { clase, siguiente: entrada.nivel + 1 } : null;
            })();
        const firma = propia ? `${propia.clase.Id}:${propia.siguiente}` : '';
        if (firma !== this.progresionCache.firma) {
            this.progresionCache = {
                firma,
                valor: propia ? {
                    clase: propia.clase,
                    filas: filasMoldeado(propia.clase.Moldeado)
                        .filter((fila) => fila.nivel <= propia.siguiente + 1)
                        .map((fila) => ({
                            ...fila,
                            especial: (propia.clase.Desglose_niveles ?? []).find((n) => n.Nivel === fila.nivel)?.Especiales
                                ?.map((e) => `${e?.Especial?.['Nombre'] ?? ''}`.trim()).filter(Boolean).join(', ') ?? '',
                            estado: fila.nivel < propia.siguiente ? 'hecho' : fila.nivel === propia.siguiente ? 'actual' : 'futuro',
                        })),
                } : null,
            };
        }
        return this.progresionCache.valor;
    }

    /** La tabla de capacidad y los chakras del incarnum (pequeños): para el bloque del borrador y los extras de las dotes. */
    private cargarCatalogosIncarnum(): void {
        if (!this.incarnumSvc)
            return;
        combineLatest([this.incarnumSvc.getCapacidadEsencia(), this.incarnumSvc.getChakras()]).pipe(take(1)).subscribe({
            next: ([capacidad, chakras]) => {
                this.incarnumCapacidad = capacidad ?? [];
                this.incarnumChakras = chakras ?? [];
                this.nuevoPSvc.setCatalogosIncarnum(capacidad ?? [], this.incarnumFusiones, chakras ?? []);
            },
            error: () => undefined,
        });
    }

    /** Las actitudes del alineamiento básico del personaje (del catálogo) y los descriptores que sus dotes liberan. */
    private alineamientoParaFusiones(): AlineamientoParaFusiones {
        const nombre = normalizarTexto(this.Personaje?.Alineamiento ?? '');
        const basico = (this.catalogoAlineamientosBasicos ?? []).find((item) => normalizarTexto(item?.Nombre ?? '') === nombre);
        const descriptores = (this.Personaje?.DotesContextuales ?? [])
            .map((d) => (this.catalogoDotes ?? []).find((dote) => Number(dote?.Id) === Number(d?.Dote?.Id)) ?? d?.Dote)
            .flatMap((dote) => dote?.Incarnum?.Descriptores_sin_alineamiento ?? [])
            .map((descriptor) => descriptor.Id);
        return {
            actitudes: (basico?.Actitudes ?? []).map((actitud) => Number(actitud?.Id)).filter((id) => id > 0),
            descriptoresSinAlineamiento: Array.from(new Set(descriptores)),
        };
    }

    /** Abre el paso «Formación» con el bloque del personaje sin formación y el catálogo de fusiones. */
    private async abrirFormacionIncarnum(): Promise<void> {
        if (this.incarnumSvc && this.incarnumFusiones.length < 1) {
            try {
                this.incarnumFusiones = await firstValueFrom(this.incarnumSvc.getFusiones().pipe(take(1)));
                this.nuevoPSvc.setCatalogosIncarnum(this.incarnumCapacidad, this.incarnumFusiones, this.incarnumChakras);
            } catch {
                this.incarnumFusiones = [];
            }
        }
        this.formacionBloque = this.nuevoPSvc.getIncarnumBorrador(null);
        this.formacionAlineamiento = this.alineamientoParaFusiones();
        this.formacionAbierta = true;
    }

    onConfirmarFormacion(formacion: FormacionIncarnumDto): void {
        const vacia = formacion.fusiones.length < 1 && formacion.receptaculos.length < 1;
        this.formacionIncarnum = vacia ? null : formacion;
        this.continuarTrasFormacion();
    }

    onSaltarFormacion(): void {
        this.formacionIncarnum = null;
        this.continuarTrasFormacion();
    }

    /** Tras la formación: los PG y la visibilidad, o, si la API la rechazó, volver a guardar con lo ya elegido. */
    private continuarTrasFormacion(): void {
        this.formacionErrorApi = null;
        if (this.formacionReintento) {
            void this.finalizarPersonajeCompleto();
            return;
        }
        this.abrirSelectorPuntosGolpe();
    }

    @Output() fusionDetallesId: EventEmitter<number> = new EventEmitter<number>();
    verDetallesFusion(id: number): void {
        if (Number(id) > 0)
            this.fusionDetallesId.emit(Number(id));
    }

    @Output() chakraDetallesId: EventEmitter<number> = new EventEmitter<number>();
    verDetallesChakra(id: number): void {
        if (Number(id) > 0)
            this.chakraDetallesId.emit(Number(id));
    }

    /** El paso de Conjuros sale cuando tiene conjuros que elegir o ya tiene alguno (un guerrero no lo ve). */
    get pasoConConjuros(): boolean {
        return this.pasoCreacion === 'conjuros' || this.flujoConjuros.activa || (this.Personaje?.Conjuros ?? []).length > 0;
    }

    get lineaCabeceraCreacion(): string {
        return lineaPersonajeCreacion(this.Personaje);
    }

    get textoContinuarPaso(): string {
        return textoContinuarCreacion(this.pasoCreacion, {
            conVentajas: !this.campaignForbidsAdvantages,
            conConjuros: this.pasoConConjuros,
            conFormacion: this.pasoConFormacion,
        });
    }

    /** «Ver la ficha» abre la vista previa que ya existe; en pantallas pequeñas no cabe. */
    get puedeVerFichaEnCreacion(): boolean {
        return this.razaElegida && this.isVentanaDetalleHabilitada();
    }

    /** Las cifras del paso, para su franja (un paso sin cifras no la pinta). */
    get franjaPasoCreacion(): DatoFranja[] {
        switch (this.pasoCreacion) {
            case 'plantillas':
                return [
                    { etiqueta: 'Plantillas elegidas', valor: this.plantillasSeleccionadas.length },
                    { etiqueta: 'Tipo de criatura', valor: this.tipoCriaturaSimuladaTexto },
                ];
            case 'ventajas':
                return [
                    { etiqueta: 'Puntos disponibles', valor: this.flujoVentajas.puntosDisponibles },
                    { etiqueta: 'Gastados', valor: this.flujoVentajas.puntosGastados },
                    { etiqueta: 'Te quedan', valor: this.flujoVentajas.puntosRestantes },
                    { etiqueta: 'Ventajas', valor: this.ventajasSeleccionadasCount, detalle: 'de 3' },
                ];
            case 'clases':
                return [
                    { etiqueta: 'Niveles de clase', valor: this.totalNivelesClaseActual },
                    { etiqueta: 'La que eliges', valor: this.claseSeleccionadaActual?.clase?.Nombre ?? null,
                        detalle: this.claseSeleccionadaActual ? `nivel ${this.claseSeleccionadaActual.siguienteNivel}` : null },
                    { etiqueta: 'Puntos de golpe', valor: Number(this.Personaje?.Vida) > 0 ? Number(this.Personaje.Vida) : null },
                    ...franjaIncarnum(this.incarnumBorrador),
                ];
            case 'habilidades':
                return [
                    { etiqueta: 'Puntos por repartir', valor: this.flujoHabilidades.puntosRestantes, detalle: `de ${this.flujoHabilidades.puntosTotales}` },
                    { etiqueta: 'De dónde salen', valor: this.origenHabilidadesTexto },
                    { etiqueta: 'Nivel de referencia', valor: this.flujoHabilidades.nivelPersonajeReferencia },
                ];
            case 'conjuros': {
                const entrada = this.entradaConjurosActual;
                if (!entrada)
                    return [];
                return [
                    { etiqueta: 'Clase', valor: entrada.claseObjetivo?.nombre },
                    { etiqueta: 'Nivel de lanzador', valor: `${entrada.nivelLanzadorPrevio} → ${entrada.nivelLanzadorActual}` },
                    { etiqueta: 'Poder máximo', valor: entrada.tipoLanzamiento === 'psionico' && entrada.nivelMaxPoderAccesiblePsionico >= 0 ? entrada.nivelMaxPoderAccesiblePsionico : null },
                ];
            }
            default:
                return [];
        }
    }

    mirarRaza(raza: Raza): void {
        this.razaMirada = raza;
        this.razaMiradaAEdad = null;
        this.razaMiradaAEdadPasoId = null;
        this.errorRazaAEdad = null;
        this.pasoEdadMiradoId = null;
        this.peticionRazaAEdad++;
        this.cargandoRazaAEdad = false;
        if (razaPorEdades(raza)) {
            const paso = pasoEdadInicial(this.opcionesEdadMirada);
            if (paso)
                void this.mirarPasoEdad(paso);
        }
    }

    // PJ o PNJ (decisión del propietario del 2026-10-31, lienzo de los dragones jugables): lo primero de la creación, que
    // se puede cambiar hasta elegir la raza y se ve en la pestaña, la cabecera, la ficha y el listado.
    get tipoPersonajeCreacion(): TipoPersonaje | null {
        return this.nuevoPSvc.TipoPersonajeCreacion;
    }

    get esPnjCreacion(): boolean {
        return esPnj(this.tipoPersonajeCreacion);
    }

    /** Antes de elegir la raza y sin haber elegido qué se crea: la pantalla «¿Qué vas a crear?». */
    get eligiendoTipoPersonaje(): boolean {
        return this.pasoCreacion === 'raza' && !this.razaElegida && !this.tipoPersonajeCreacion;
    }

    get tituloCreacion(): string {
        return tituloNuevoPersonaje(this.tipoPersonajeCreacion);
    }

    get puedeCambiarTipoPersonaje(): boolean {
        return !this.razaElegida && !!this.tipoPersonajeCreacion;
    }

    elegirTipoPersonaje(tipo: TipoPersonaje): void {
        if (!this.nuevoPSvc.elegirTipoPersonaje(tipo))
            return;
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        // Con el otro tipo cambian las edades que se pueden elegir: si la que se mira ya no vale, la primera que sí.
        if (this.razaMirada && razaPorEdades(this.razaMirada)) {
            const paso = pasoEdadInicial(this.opcionesEdadMirada, this.pasoEdadMiradoId);
            if (paso && paso.Id !== this.pasoEdadMiradoId)
                void this.mirarPasoEdad(paso);
        }
    }

    cambiarTipoPersonaje(): void {
        this.elegirTipoPersonaje(this.esPnjCreacion ? 'pj' : 'pnj');
    }

    /** Si la raza que se mira crece por edades (trae pasos de edad): su vista previa lleva «Categoría de edad». */
    get razaMiradaPorEdades(): boolean {
        return razaPorEdades(this.razaMirada);
    }

    /**
     * Lo que decide las edades que puede elegir: el tipo y, para un PJ, el NEP máximo de su campaña si ya se conoce (un
     * PNJ no pasa por la política, y el máster de la campaña tampoco tiene ese límite).
     */
    private get contextoEdad(): ContextoEdad {
        const tipo = this.tipoPersonajeCreacion ?? 'pj';
        const politica = this.effectiveSelectedCampaignPolicy;
        const nepMaximo = !esPnj(tipo) && this.selectedCampaignPolicyResolved && !this.isSelectedCampaignActiveMaster
            ? this.normalizarCampaignMaxNep(politica?.nepMaximoPersonajeNuevo ?? null)
            : null;
        return { tipo, nepMaximo };
    }

    /** Las categorías de edad de la raza que se mira, con lo que puede elegir (se guardan mientras no cambie nada). */
    get opcionesEdadMirada(): OpcionCategoriaEdad[] {
        const raza = this.razaMirada;
        if (!raza || !razaPorEdades(raza))
            return [];
        const contexto = this.contextoEdad;
        const clave = `${raza.Id}|${contexto.tipo}|${contexto.nepMaximo ?? ''}|${raza.Pasos_edad?.length ?? 0}`;
        if (this.opcionesEdadCache.clave !== clave)
            this.opcionesEdadCache = { clave, valor: opcionesEdad(raza, contexto) };
        return this.opcionesEdadCache.valor;
    }

    private get opcionPasoEdadMirado(): OpcionPasoEdad | null {
        return this.opcionesEdadMirada.flatMap((categoria) => categoria.pasos).find((opcion) => opcion.paso.Id === this.pasoEdadMiradoId) ?? null;
    }

    /** Mira la raza a esa edad: pide sus cifras a la API y las pinta debajo (las de la petición más reciente). */
    async mirarPasoEdad(paso: PasoEdadRaza): Promise<void> {
        const raza = this.razaMirada;
        if (!raza)
            return;
        this.pasoEdadMiradoId = paso.Id;
        const peticion = ++this.peticionRazaAEdad;
        this.cargandoRazaAEdad = true;
        this.errorRazaAEdad = null;
        try {
            const resuelta = await this.razaSvc.getRazaEnPasoEdad(raza.Id, paso.Id);
            if (peticion !== this.peticionRazaAEdad)
                return;
            // Las edades de la raza se conservan aunque la respuesta a una edad no las traiga: Básicos limita los años con ellas.
            this.razaMiradaAEdad = {
                ...resuelta,
                Categorias_edad: (resuelta.Categorias_edad ?? []).length > 0 ? resuelta.Categorias_edad : raza.Categorias_edad,
                Pasos_edad: (resuelta.Pasos_edad ?? []).length > 0 ? resuelta.Pasos_edad : raza.Pasos_edad,
                Paso_edad: resuelta.Paso_edad ?? paso,
            };
            this.razaMiradaAEdadPasoId = paso.Id;
        } catch (error) {
            if (peticion !== this.peticionRazaAEdad)
                return;
            this.razaMiradaAEdad = null;
            this.razaMiradaAEdadPasoId = null;
            this.errorRazaAEdad = mensajeDeError(error, 'No se pudo leer la raza a esa edad.');
        } finally {
            if (peticion === this.peticionRazaAEdad)
                this.cargandoRazaAEdad = false;
        }
    }

    /** Lo que pinta la vista previa: la raza a la edad que se mira, si ya llegó; si no, la raza. */
    get razaVistaPrevia(): Raza | null {
        return this.razaMiradaAEdad ?? this.razaMirada;
    }

    /** La raza que elige el botón del pie: en una raza por edades, la resuelta a un paso que puede elegir. */
    get razaParaElegir(): Raza | null {
        if (!this.razaMirada)
            return null;
        if (!this.razaMiradaPorEdades)
            return this.razaMirada;
        const opcion = this.opcionPasoEdadMirado;
        if (!opcion || opcion.bloqueado || this.cargandoRazaAEdad || this.razaMiradaAEdadPasoId !== opcion.paso.Id)
            return null;
        return this.razaMiradaAEdad;
    }

    /**
     * El máster que se salta las reglas de su campaña (`overrideReglasCampana`) puede elegir para un PJ una edad sin ajuste,
     * y el personaje queda homebrew (contrato de los dragones jugables). La campaña se elige en Básicos: hace falta que
     * dirija alguna (o, si ya está elegida, que sea su máster).
     */
    get puedeElegirEdadSinAjusteIgualmente(): boolean {
        if (this.esPnjCreacion)
            return false;
        if (this.hasSelectedCampaignContext)
            return this.esMasterDeLaCampanaElegida;
        return this.Campanas.some((campana) => campana?.CampaignRole === 'master');
    }

    /** La raza resuelta a una edad sin ajuste que el máster puede elegir igualmente para un PJ; `null` si no es el caso. */
    get razaParaElegirIgualmente(): Raza | null {
        if (!this.razaMirada || !this.razaMiradaPorEdades || !this.puedeElegirEdadSinAjusteIgualmente)
            return null;
        const opcion = this.opcionPasoEdadMirado;
        if (!opcion || !opcion.bloqueado || !opcion.saltable || this.cargandoRazaAEdad || this.razaMiradaAEdadPasoId !== opcion.paso.Id)
            return null;
        return this.razaMiradaAEdad;
    }

    /** «Elegir Dragón rojo (adulto) igualmente». */
    get textoElegirRazaIgualmente(): string {
        return `Elegir ${razaConEdad(this.razaMirada?.Nombre, this.opcionPasoEdadMirado?.paso.Categoria.Nombre)} igualmente`;
    }

    /**
     * Elige para un PJ una edad sin ajuste, con el aviso de homebrew de siempre (como una plantilla sin sus requisitos). En
     * Básicos solo valdrán las campañas que dirige, y la creación manda `overrideReglasCampana`.
     */
    async elegirRazaMiradaIgualmente(): Promise<void> {
        const raza = this.razaParaElegirIgualmente;
        const opcion = this.opcionPasoEdadMirado;
        if (!raza || !opcion)
            return;
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: `Elegir ${razaConEdad(this.razaMirada?.Nombre, opcion.paso.Categoria.Nombre)} como personaje jugador`,
            html: `<ul style="text-align:left; margin-top: 4px;"><li>${opcion.motivo ?? ''}</li><li>${AVISO_EDAD_SIN_AJUSTE_MASTER}</li></ul>${AVISO_HOMEBREW_REGLA_SALTADA}`,
            showCancelButton: true,
            confirmButtonText: 'Aceptar y elegirla',
            cancelButtonText: 'Cancelar',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
        if (!confirmacion.isConfirmed || this.razaParaElegirIgualmente !== raza)
            return;
        this.seleccionarRaza(raza);
    }

    /** «Elegir Dragón rojo (joven) y continuar». */
    get textoElegirRaza(): string {
        if (!this.razaMirada)
            return 'Elegir y continuar';
        const categoria = this.razaMiradaPorEdades ? this.opcionPasoEdadMirado?.paso.Categoria.Nombre : null;
        return `Elegir ${razaConEdad(this.razaMirada.Nombre, categoria)} y continuar`;
    }

    /** La nota del pie del paso Raza y si es un aviso (por qué no se puede elegir). */
    get notaPieRaza(): { texto: string; aviso: boolean; } {
        if (!this.razaMirada)
            return { texto: 'Pulsa una raza para verla a la derecha antes de elegirla.', aviso: false };
        if (this.razaMiradaPorEdades) {
            if (this.errorRazaAEdad)
                return { texto: this.errorRazaAEdad, aviso: true };
            const opcion = this.opcionPasoEdadMirado;
            if (opcion?.bloqueado)
                return {
                    texto: opcion.saltable && this.puedeElegirEdadSinAjusteIgualmente
                        ? `${opcion.motivo} Como máster puedes elegirla igualmente: será homebrew y solo podrás guardarlo en una campaña que dirijas.`
                        : `${opcion.motivo ?? ''}`,
                    aviso: true,
                };
            if (!opcion)
                return { texto: 'Esta raza no tiene ninguna edad que puedas elegir como personaje jugador; créala como PNJ.', aviso: true };
            return this.esPnjCreacion
                ? { texto: 'Creando un PNJ: todas las edades, sin la política de la campaña.', aviso: false }
                : { texto: 'Las edades sin ajuste de nivel solo se eligen creando un PNJ.', aviso: false };
        }
        return { texto: 'Elígela con «Elegir y continuar». Un paso hecho no se puede deshacer.', aviso: false };
    }

    elegirRazaMirada(): void {
        const raza = this.razaParaElegir;
        if (raza)
            this.seleccionarRaza(raza);
    }

    verFichaEnCreacion(): void {
        if (!this.puedeVerFichaEnCreacion)
            return;
        this.nuevoPSvc.refrescarDerivadasPreviewNuevoPersonaje();
        this.ventanaDetalleAbierta = true;
    }

    constructor(
        private auth: Auth,
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
        private fichasDescargaBgSvc: FichasDescargaBackgroundService,
        private userSvc: UserService,
        private userProfileNavigationSvc: UserProfileNavigationService,
        private listaPersonajesSvc?: ListaPersonajesService,
        private equipoSvc?: EquipoService,
        private tamanoSvc?: TamanoService,
        private subtipoSvc?: SubtipoService,
        private razaCatalogosSvc?: RazaCatalogosService,
        private incarnumSvc?: IncarnumService,
    ) {
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
    }

    ngOnInit(): void {
        void this.inicializarComponente();
    }

    ngOnDestroy(): void {
        this.nuevoPSvc.persistirBorradorLocalAhora();
        this.nuevoPSvc.desactivarPersistenciaBorradorLocal();
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
        this.catalogosCifrasSubs.forEach((sub) => sub.unsubscribe());
        this.restaurarChatTrasModalCaracteristicas();
    }

    @HostListener('window:beforeunload')
    onBeforeUnload(): void {
        this.nuevoPSvc.persistirBorradorLocalAhora();
    }

    private async inicializarComponente(): Promise<void> {
        const uid = this.obtenerUidSesionActiva();
        let restauracion: 'none' | 'restored' | 'reset' | 'opened-existing' = 'none';
        if (uid.length > 0) {
            restauracion = await this.resolverRestauracionBorradorSiAplica(uid);
            if (restauracion === 'opened-existing')
                return;
        }

        this.nuevoPSvc.refrescarDerivadasPreviewNuevoPersonaje();
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        // Un borrador de antes de elegir PJ o PNJ que ya tiene la raza era un personaje jugador.
        if (this.razaElegida && !this.Personaje.tipo)
            this.Personaje.tipo = 'pj';
        this.sincronizarOwnerUidEnCreacion();
        this.normalizarDeidadSeleccionada();
        this.normalizarRegionSeleccionada();
        this.nuevoPSvc.sincronizarConfigGeneradorDesdeCuenta().catch(() => undefined);
        this.normalizarAlineamientoSeleccionado();
        this.sincronizarTabConPaso();
        this.recalcularOficialidad();
        this.rederivarVistaDetalleTrasRestauracion(restauracion);
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
        this.cargarCatalogosCifras();
        this.cargarAlineamientosBasicos();
        this.cargarCatalogosIncarnum();
        if (uid.length > 0)
            this.nuevoPSvc.activarPersistenciaBorradorLocal(uid);
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

    get plantillasOtorgadasRazaPendientes() {
        return this.flujo.plantillas.otorgadasRazaPendientes ?? [];
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
        return ['Cualquiera', ...Array.from(new Set(manuales)).sort(compararTexto)];
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
                .filter((plantilla) => dgsDePlantilla(plantilla) > 0);
            if (plantillasConDg.length === 1) {
                const nombrePlantilla = `${plantillasConDg[0]?.Nombre ?? ''}`.trim();
                return nombrePlantilla.length > 0 ? nombrePlantilla : 'Plantilla';
            }
            return 'Plantillas';
        }

        if (origen === 'clase_nivel')
            return 'Nivel';

        if (origen === 'companero_dg')
            return `Compañero: ${`${this.nuevoPSvc.PersonajeCreacion.Companeros?.[0]?.Nombre ?? ''}`.trim() || 'compañero animal'}`;

        return `${origen}`;
    }

    get habilidadesOrdenadas(): Personaje['Habilidades'] {
        const visibles = [...this.nuevoPSvc.getHabilidadesSesion()]
            .filter((habilidad) => !this.esNombreHabilidadOcultaEnTabla(`${habilidad?.Nombre ?? ''}`));
        return visibles.sort((a, b) => {
            const customA = !!a?.Custom;
            const customB = !!b?.Custom;
            if (customA !== customB)
                return customA ? 1 : -1;
            return compararTexto(a?.Nombre, b?.Nombre);
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
                return compararTexto(a?.Nombre, b?.Nombre);
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
        return ['Cualquiera', ...Array.from(new Set(manuales)).sort(compararTexto)];
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

    get campaignForbidsAdvantages(): boolean {
        return this.effectiveSelectedCampaignPolicy?.permitirVentajasDesventajas === false;
    }

    get ventajasTabDisabled(): boolean {
        return !this.caracteristicasGeneradas || this.campaignForbidsAdvantages;
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

    get totalNivelesClaseActual(): number {
        return (this.Personaje?.desgloseClases ?? [])
            .reduce((acc, entrada) => acc + Math.max(0, Number(entrada?.Nivel ?? 0)), 0);
    }

    /** Los DG raciales de su raza (a su edad, en una raza por edades). */
    private get dgsRacialesCreacion(): number {
        return Math.max(
            0,
            Number(this.Personaje?.Raza?.Dgs_adicionales?.Cantidad ?? this.razaSeleccionada?.Dgs_adicionales?.Cantidad ?? 0) || 0
        );
    }

    /**
     * Si puede terminar sin niveles de clase (decisión del propietario del 2026-10-31, `puedeQuedarseSinClases`): un PNJ
     * siempre; un PJ, solo de una raza por edades con DG raciales a su edad. Sin clases, todo sale de sus DG raciales.
     */
    get puedeTerminarSinClases(): boolean {
        return puedeQuedarseSinClases({
            tipo: this.tipoPersonajeCreacion,
            porEdades: razaPorEdades(this.razaSeleccionada) || !!this.Personaje?.CategoriaEdad,
            dgsRaciales: this.dgsRacialesCreacion,
        });
    }

    get mostrarBotonFinalizarCreacion(): boolean {
        return this.totalNivelesClaseActual > 0 || this.puedeTerminarSinClases;
    }

    /** «Terminar sin clases» mientras no tiene ningún nivel de clase; después, «Finalizar aquí». */
    get textoFinalizarCreacion(): string {
        return this.totalNivelesClaseActual < 1 ? 'Terminar sin clases' : 'Finalizar aquí';
    }

    /** En el paso de clases, sin niveles: el botón de terminar sale también desactivado si no puede (con su motivo). */
    get mostrarTerminarEnClases(): boolean {
        return this.mostrarBotonFinalizarCreacion || this.totalNivelesClaseActual < 1;
    }

    get incluirHomebrewPlantillasEfectivo(): boolean {
        return this.homebrewForzado || this.incluirHomebrewPlantillas;
    }

    get incluirHomebrewIdiomasEfectivo(): boolean {
        return this.homebrewForzado || this.incluirHomebrewIdiomas;
    }

    get ventajasVisibles(): VentajaDetalle[] {
        return this.catalogoVentajas;
    }

    get desventajasVisibles(): VentajaDetalle[] {
        return this.catalogoDesventajas;
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
            const clave = normalizarTexto(nombre);
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

    get deidadesFiltradas(): DeidadBasicosOption[] {
        this.ensureBasicosDerivedState();
        return this.basicosDerivedState.deidadesFiltradas;
    }

    get alineamientosDisponibles(): string[] {
        this.ensureBasicosDerivedState();
        return this.basicosDerivedState.alineamientosDisponibles;
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
            && this.esNumeroValidoPositivo(this.Personaje.Altura)
            && !this.selectedCampaignPolicyLoading
            && !this.tieneHistoriaCampanaIncompleta
            && !this.hasCampaignBlockersForBasicos()
            && !this.motivoPnjCampana
            && !this.motivoEdadSinAjusteCampana
            && !this.motivoEdadFueraDeCategoria;
    }

    /** Si es el máster de la campaña elegida (por su papel en la lista de campañas o, sin él, por el máster activo). */
    private get esMasterDeLaCampanaElegida(): boolean {
        const campana = this.Campanas.find((c) => c.Nombre === this.Personaje?.Campana);
        return campana?.CampaignRole
            ? campana.CampaignRole === 'master'
            : (!this.selectedCampaignPolicyResolved || this.isSelectedCampaignActiveMaster);
    }

    /** En una campaña, solo su máster crea PNJ (`pnj_solo_master`): el motivo si la campaña elegida no es suya. */
    get motivoPnjCampana(): string | null {
        if (!this.esPnjCreacion || !this.hasSelectedCampaignContext)
            return null;
        return this.esMasterDeLaCampanaElegida ? null : 'En una campaña, solo su máster puede crear PNJ. Elige otra campaña o «Sin campaña».';
    }

    /** Un PJ en una edad sin ajuste de nivel (elegida igualmente en el paso Raza): homebrew y solo para el máster. */
    get pjEnEdadSinAjuste(): boolean {
        return !this.esPnjCreacion && this.Personaje?.CategoriaEdad?.jugable === false;
    }

    /**
     * Un PJ en una edad sin ajuste solo lo guarda el máster de su campaña saltándose sus reglas (`overrideReglasCampana`;
     * sin campaña, la API responde `paso_edad_no_jugable`): el motivo si no hay campaña o no es suya.
     */
    get motivoEdadSinAjusteCampana(): string | null {
        if (!this.pjEnEdadSinAjuste)
            return null;
        if (this.hasSelectedCampaignContext && this.esMasterDeLaCampanaElegida)
            return null;
        return `${MOTIVO_EDAD_SIN_AJUSTE_CAMPANA} Elige una campaña que dirijas.`;
    }

    /** Si la campaña del selector no vale (no es su máster): para un PNJ y para un PJ en una edad sin ajuste. */
    campanaSoloDelMaster(campana: Campana): boolean {
        return (this.esPnjCreacion || this.pjEnEdadSinAjuste) && !!campana?.CampaignRole && campana.CampaignRole !== 'master';
    }

    /** Lo que se lee junto a una campaña que no vale: « · solo su máster crea PNJ». */
    get textoCampanaSoloDelMaster(): string {
        return this.esPnjCreacion ? ' · solo su máster crea PNJ' : ' · solo su máster se salta la edad';
    }

    /** En una raza por edades, los años que puede tener con el paso elegido. */
    get rangoEdadCategoria(): { desde: number; hasta: number | null; } | null {
        if (!this.Personaje?.IdPasoEdad)
            return null;
        return rangoEdadPaso(this.razaSeleccionada, this.Personaje.IdPasoEdad);
    }

    /** El motivo si la edad en años no cabe en la categoría elegida (lienzo: «solo acepta los años de la categoría»). */
    get motivoEdadFueraDeCategoria(): string | null {
        const rango = this.rangoEdadCategoria;
        if (!rango || !this.esNumeroValidoPositivo(this.Personaje.Edad))
            return null;
        const edad = Number(this.Personaje.Edad);
        if (edad >= rango.desde && (rango.hasta === null || edad <= rango.hasta))
            return null;
        const categoria = nombreEdadEnFrase(this.Personaje.CategoriaEdad?.categoria?.Nombre);
        return `La edad tiene que estar ${textoRangoEdad(rango)}${categoria ? ` (${categoria})` : ''}.`;
    }

    get motivosBloqueoBasicos(): string[] {
        const motivos: string[] = [];

        if (!this.esTextoNoVacio(this.Personaje.Nombre))
            motivos.push('Debes indicar el nombre del personaje.');
        if (!this.esTextoNoVacio(this.Personaje.Genero))
            motivos.push('Debes elegir el género.');
        if (!this.esTextoNoVacio(this.Personaje.Deidad))
            motivos.push('Debes elegir una deidad o marcar que no tendrá deidad.');
        if (!this.esTextoNoVacio(this.Personaje.Campana))
            motivos.push('Debes elegir una campaña.');
        if (!this.esTextoNoVacio(this.Personaje.Trama))
            motivos.push('Debes elegir una trama.');
        if (!this.esTextoNoVacio(this.Personaje.Subtrama))
            motivos.push('Debes elegir una subtrama.');
        if (this.tieneHistoriaCampanaIncompleta)
            motivos.push('Si eliges una trama concreta para la campaña, debes elegir también una subtrama. Si no, deja la historia sin especificar por ahora.');
        if (!this.esNumeroValidoPositivo(this.Personaje.Edad))
            motivos.push('La edad debe ser un número mayor que 0.');
        if (this.motivoEdadFueraDeCategoria)
            motivos.push(this.motivoEdadFueraDeCategoria);
        if (this.motivoPnjCampana)
            motivos.push(this.motivoPnjCampana);
        if (this.motivoEdadSinAjusteCampana)
            motivos.push(this.motivoEdadSinAjusteCampana);
        if (!this.esNumeroValidoPositivo(this.Personaje.Peso))
            motivos.push('El peso debe ser un número mayor que 0.');
        if (!this.esNumeroValidoPositivo(this.Personaje.Altura))
            motivos.push('La altura debe ser un número mayor que 0.');
        if (this.selectedCampaignPolicyLoading)
            motivos.push('Se está cargando la política de creación de la campaña seleccionada.');

        if (this.hasSelectedCampaignContext && this.selectedCampaignPolicyResolved) {
            this.getCampaignCreationValidation().blockers.forEach((blocker) => motivos.push(blocker));
        }

        return motivos;
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

    get canOpenCampaignManagement(): boolean {
        const role = `${this.userSvc.getCurrentRole() ?? ''}`.trim().toLowerCase();
        const canCreateByRole = role === 'master' || role === 'colaborador' || role === 'admin';
        return canCreateByRole && this.userSvc.can('campanas', 'create');
    }

    get tramaTieneSubtramas(): boolean {
        if (!this.campanaTieneTramas || this.esTramaCampanaSinEspecificar(this.Personaje?.Trama)) {
            return false;
        }
        return this.Subtramas.length > 0;
    }

    get mostrarOpcionSinSubtramaCampana(): boolean {
        return this.hasSelectedCampaignContext && this.esTramaCampanaSinEspecificar(this.Personaje?.Trama);
    }

    get tieneHistoriaCampanaIncompleta(): boolean {
        if (!this.hasSelectedCampaignContext)
            return false;

        if (this.esTramaCampanaSinEspecificar(this.Personaje?.Trama))
            return false;

        return this.esSubtramaCampanaSinEspecificar(this.Personaje?.Subtrama);
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
        this.ensureBasicosDerivedState();
        return this.basicosDerivedState.preferenciasRazaItems;
    }

    get tienePreferenciasRazaVisibles(): boolean {
        this.ensureBasicosDerivedState();
        return this.basicosDerivedState.preferenciasRazaItems.length > 0;
    }

    get edadRangosItems(): string[] {
        const raza = this.razaSeleccionada;
        if (!raza || !razaTieneEdades(raza))
            return [];
        return edadesDeLaRaza(raza).map(({ nombre, valor }) => `${nombre}: ${valor}`);
    }

    /** Bajo la edad: el envejecimiento que aplica la etapa elegida o, si no envejece, las edades de la raza. */
    get edadRangosHint(): string {
        const rango = this.rangoEdadCategoria;
        if (rango)
            return `${this.Personaje.CategoriaEdad?.categoria?.Nombre ?? 'Su edad'}: ${textoRangoEdad(rango)}`;
        const etapa = this.etapaEdad;
        const envejecimiento = textoEnvejecimiento(etapa);
        if (etapa && envejecimiento)
            return `${etapa.nombre}: ${envejecimiento}`;
        return this.edadRangosItems
            .map((item) => item.replace(':', ''))
            .join(', ');
    }

    /** La etapa de la vida del personaje por su edad y las edades de su raza (Manual del jugador, tabla 6-5). */
    private get etapaEdad(): EtapaEdad | null {
        return etapaEdad(this.Personaje?.Edad, this.razaSeleccionada);
    }

    get etapaEdadActual(): string {
        if (this.Personaje?.CategoriaEdad)
            return this.Personaje.CategoriaEdad.categoria.Nombre;
        if (this.razaSeleccionada && !razaTieneEdades(this.razaSeleccionada))
            return 'Sin edades en la raza';
        return this.etapaEdad?.nombre ?? 'Sin definir';
    }

    get edadMensajeContextual(): string {
        const rango = this.rangoEdadCategoria;
        if (rango)
            return `Su raza crece por categorías de edad: la suya es la que eligió con la raza (${textoRangoEdad(rango)}) y no envejece como en el Manual del jugador.`;
        const raza = this.razaSeleccionada;
        if (raza && !razaTieneEdades(raza))
            return 'Su raza no trae las edades de sus etapas: no se comprueba la edad ni se aplica el envejecimiento.';
        const etapa = this.etapaEdad;
        if (!etapa)
            return 'Introduce una edad para ver su etapa de la vida.';
        if (etapa.id === 'joven')
            return 'Tu personaje aún no tiene la mayoría de edad de su raza: el Manual del jugador no llega ahí y el personaje será homebrew.';
        if (etapa.id === 'adulto')
            return 'Tu personaje es adulto: la edad no cambia sus características.';
        const venerable = etapa.id === 'venerable'
            ? ' Vivirá hasta su edad máxima, que el DM tira en secreto.'
            : '';
        return `Por envejecer: ${textoEnvejecimiento(etapa)} (ninguna baja de 1).${venerable}`;
    }

    /** Solo por debajo de la mayoría de edad: pasada la venerable, el manual llega hasta la edad máxima (tabla 6-5). */
    get edadFueraRango(): boolean {
        return edadFueraDelManual(this.Personaje?.Edad, this.razaSeleccionada);
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
        return !esSinDeidad(this.Personaje.Deidad);
    }

    get puedeAbrirDetalleDeidadSeleccionada(): boolean {
        return this.deidadSeleccionadaDetalle !== null;
    }

    get deidadSeleccionadaDetalle(): DeidadDetalle | null {
        const nombreNorm = normalizarTexto(this.Personaje.Deidad ?? '');
        if (esSinDeidad(nombreNorm))
            return null;
        return this.catalogoDeidades.find((deidad) => normalizarTexto(deidad?.Nombre ?? '') === nombreNorm) ?? null;
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
        return etiquetaManual(this.deidadSeleccionadaDetalle?.Manual, 'No disponible');
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
        this.ensureBasicosDerivedState();
        return this.basicosDerivedState.evaluacionBasicos;
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

    private abrirModalInformacionBasicos(
        titulo: string,
        icono: string,
        secciones: InformacionBasicosModalSection[]
    ): void {
        this.informacionBasicosModalTitulo = titulo;
        this.informacionBasicosModalIcono = icono;
        this.informacionBasicosModalSecciones = secciones;
        this.modalInformacionBasicosAbierto = true;
    }

    private esPreferenciaAlineamientoVisible(valor: string): boolean {
        const normalizado = normalizarTexto(valor ?? '');
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

    private esDeidadOficial(): boolean {
        if (esSinDeidad(this.Personaje.Deidad))
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
        const normalizado = normalizarTexto(valor ?? '');
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
        return distanciaEntreAlineamientos(a1, b1);
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


    private evaluarInconsistenciasBasicos(): EvaluacionInconsistenciasBasicos {
        const previewWarnings: string[] = [];
        const hardConflicts: ConflictoDuroAlineamiento[] = [];
        const otherOfficialBlockers: string[] = [];
        const deidadIngresada = this.Personaje.Deidad?.trim() ?? '';

        if (this.edadFueraRango) {
            otherOfficialBlockers.push(`Edad por debajo de la mayoría de edad de la raza: ${this.Personaje.Edad} (adulto a los ${this.razaSeleccionada?.Edad_adulto}).`);
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

        // La deidad solo limita el alineamiento de las clases que tienen esa regla (`Alineamiento_deidad`, el clérigo):
        // se comprueba al elegir la clase (`evaluarCompatibilidadAlineamientoClase`), no aquí para todos.

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

    /**
     * Si el personaje es oficial (decisión del propietario del 2026-10-17): ningún elemento homebrew (raza, raza base,
     * clases, plantillas, dotes, raciales, idiomas, familiar, compañero, ventajas; `motivosHomebrewPersonaje`) y ninguna
     * restricción saltada (alineamiento, edad, peso, altura, deidad, un PJ en una edad sin ajuste). Se recalcula entero cada vez, así que todo lo que lo
     * vuelve homebrew tiene que estar aquí (antes, una dote o una plantilla homebrew no contaba y el recálculo lo volvía
     * oficial).
     */
    recalcularOficialidad(): void {
        const evaluacion = this.evaluarInconsistenciasBasicos();
        const tieneConflictoDuroConfirmado = evaluacion.hardConflicts.length > 0 && this.hardAlignmentOverrideConfirmed;
        const clases = this.clasesDelPersonajeEnElCatalogo();
        const motivosHomebrew = motivosHomebrewPersonaje(this.Personaje, {
            raza: this.razaSeleccionada,
            razaBase: this.nuevoPSvc.RazaBaseSeleccionadaCompleta,
            clases,
            plantillas: this.plantillasSeleccionadas,
            tieneVentajas: this.flujoVentajas.seleccionVentajas.length > 0 || this.flujoVentajas.seleccionDesventajas.length > 0,
        });
        this.Personaje.Oficial = motivosHomebrew.length === 0
            && evaluacion.otherOfficialBlockers.length === 0
            && !tieneConflictoDuroConfirmado
            && !this.hardAlignmentClassOverrideConfirmed
            && !this.homebrewPorClaseAplicada
            && !this.haySaltoRequisitosPlantilla
            && !this.pjEnEdadSinAjuste;
        this.refreshBasicosDerivedState(evaluacion);
    }

    private refreshBasicosDerivedState(evaluacion: EvaluacionInconsistenciasBasicos | null = null): void {
        this.basicosDerivedState = {
            preferenciasRazaItems: this.buildPreferenciasRazaItems(),
            deidadesFiltradas: this.buildDeidadesFiltradas(),
            alineamientosDisponibles: this.buildAlineamientosDisponibles(),
            evaluacionBasicos: evaluacion ?? this.evaluarInconsistenciasBasicos(),
        };
        this.basicosDerivedSignature = this.buildBasicosDerivedSignature();
    }

    private ensureBasicosDerivedState(): void {
        const signature = this.buildBasicosDerivedSignature();
        if (this.basicosDerivedSignature === signature)
            return;
        this.refreshBasicosDerivedState();
    }

    private buildBasicosDerivedSignature(): string {
        const razaId = Number(this.razaSeleccionada?.Id ?? 0);
        const alineamiento = `${this.Personaje?.Alineamiento ?? ''}`.trim();
        const deidad = `${this.Personaje?.Deidad ?? ''}`.trim();
        const campana = `${this.Personaje?.Campana ?? ''}`.trim();
        const politica = this.selectedCampaignPolicy
            ? JSON.stringify(this.selectedCampaignPolicy)
            : 'null';
        return [
            razaId,
            alineamiento,
            deidad,
            campana,
            this.catalogoDeidades.length,
            this.catalogoAlineamientosBasicos.length,
            politica,
        ].join('|');
    }

    private buildPreferenciasRazaItems(): { etiqueta: string; valor: string; }[] {
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

    private buildDeidadesFiltradas(): DeidadBasicosOption[] {
        const candidatas = this.catalogoDeidades
            .filter((deidad) => `${deidad?.Nombre ?? ''}`.trim().length > 0)
            .map((deidad) => ({
                nombre: `${deidad.Nombre}`.trim(),
                distancia: this.distanciaAlineamiento(
                    this.Personaje.Alineamiento,
                    `${deidad?.Alineamiento?.Nombre ?? ''}`
                ),
                oficial: deidad.Oficial !== false,
                disabledReason: this.getCampaignBlockedReasonForCandidate(
                    'deidad',
                    Number(deidad?.Id ?? 0),
                    `${deidad?.Nombre ?? ''}`.trim(),
                    deidad?.Oficial === false
                ),
            }))
            .sort((a, b) => {
                const distA = Number.isFinite(a.distancia) ? Number(a.distancia) : 99;
                const distB = Number.isFinite(b.distancia) ? Number(b.distancia) : 99;
                if (distA !== distB)
                    return distA - distB;
                if (a.oficial !== b.oficial)
                    return a.oficial ? -1 : 1;
                return compararTexto(a.nombre, b.nombre);
            })
            .map((item) => ({
                nombre: item.nombre,
                etiqueta: item.disabledReason ? `${item.nombre} (${item.disabledReason})` : item.nombre,
                disabled: !!item.disabledReason,
            }));
        const lista: DeidadBasicosOption[] = [{
            nombre: this.deidadSinSeleccion,
            etiqueta: this.deidadSinSeleccion,
            disabled: false,
        }, ...candidatas];
        const deidadActual = `${this.Personaje.Deidad ?? ''}`.trim();
        if (deidadActual.length > 0) {
            const existe = lista.some((item) => normalizarTexto(item.nombre) === normalizarTexto(deidadActual));
            if (!existe)
                lista.push({
                    nombre: deidadActual,
                    etiqueta: deidadActual,
                    disabled: false,
                });
        }
        return lista;
    }

    private buildAlineamientosDisponibles(): string[] {
        const nombresCatalogo = this.catalogoAlineamientosBasicos
            .map((item) => `${item?.Nombre ?? ''}`.trim())
            .filter((nombre) => nombre.length > 0);

        const fuente = nombresCatalogo.length > 0 ? nombresCatalogo : this.alineamientos;
        const vistos = new Set<string>();
        const resultado: string[] = [];
        fuente.forEach((nombre) => {
            const normalizado = normalizarTexto(nombre);
            if (normalizado.length < 1 || vistos.has(normalizado) || normalizado === 'no aplica')
                return;
            vistos.add(normalizado);
            resultado.push(nombre);
        });
        return resultado;
    }

    async continuarDesdeBasicos(desdeAtajoTeclado = false): Promise<void> {
        if (!this.razaElegida || !this.puedeContinuarBasicos) {
            return;
        }

        let mostroAlertaInconsistencias = false;
        this.normalizarAlineamientoSeleccionado();
        if (!this.esTextoNoVacio(this.Personaje.Contexto)) {
            this.Personaje.Contexto = this.fallbackContexto;
        }
        if (!this.esTextoNoVacio(this.Personaje.Personalidad)) {
            this.Personaje.Personalidad = this.fallbackPersonalidad;
        }

        if (!await this.ensureCampaignCreationRulesSatisfied('basicos'))
            return;

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

        const uid = this.obtenerUidSesionActiva();
        if (uid.length > 0)
            this.nuevoPSvc.descartarBorradorLocal(uid);
        this.ventanaDetalleAbierta = false;
        this.cerrarNuevoPersonajeSolicitado.emit();
    }

    abrirModalCaracteristicas(): void {
        // El chat flotante de la plataforma no debe tapar el generador de características.
        document.body.classList.add('rol-ocultar-chat');
        this.chatOcultoPorModalCaracteristicas = true;
        this.nuevoPSvc.abrirModalCaracteristicas();
    }

    cerrarModalCaracteristicas(): void {
        this.nuevoPSvc.cerrarModalCaracteristicas();
        this.restaurarChatTrasModalCaracteristicas();
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

        this.restaurarChatTrasModalCaracteristicas();

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
        this.asegurarPasoCompatibleConCampania();
        this.selectedInternalTabIndex = this.mapearPasoAIndex(this.flujo.pasoActual);
    }

    private rederivarVistaDetalleTrasRestauracion(restauracion: 'none' | 'restored' | 'reset' | 'opened-existing'): void {
        if (restauracion !== 'restored')
            return;
        if (!this.debeReabrirVistaDetalleTrasRestauracion())
            return;

        this.nuevoPSvc.refrescarDerivadasPreviewNuevoPersonaje();
        this.ventanaDetalleAbierta = true;
    }

    private debeReabrirVistaDetalleTrasRestauracion(): boolean {
        if (this.modalCaracteristicasAbierto)
            return false;
        if (!this.isVentanaDetalleHabilitada())
            return false;

        return this.flujo.pasoActual === 'plantillas'
            || this.flujo.pasoActual === 'ventajas'
            || this.flujo.pasoActual === 'clases'
            || this.flujo.pasoActual === 'habilidades'
            || this.flujo.pasoActual === 'conjuros'
            || this.flujo.pasoActual === 'dotes';
    }

    private restaurarChatTrasModalCaracteristicas(): void {
        if (!this.chatOcultoPorModalCaracteristicas)
            return;

        document.body.classList.remove('rol-ocultar-chat');
        this.chatOcultoPorModalCaracteristicas = false;
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

    usarIdeaIa(uso: UsoIdeaIa): void {
        if (uso.tipo === 'personalidad')
            this.Personaje.Personalidad = uso.texto;
        else
            this.Personaje.Contexto = uso.texto;
    }

    onEdadChange(value: number | string | null | undefined): void {
        this.Personaje.Edad = this.normalizarNumeroConMaxCifras(value, 4, 0);
        // El envejecimiento cambia las características ya generadas.
        if (this.nuevoPSvc.EstadoFlujo?.caracteristicasGeneradas)
            this.nuevoPSvc.recalcularEfectosVentajas();
        this.recalcularOficialidad();
    }

    onPesoChange(value: number | string | null | undefined): void {
        this.Personaje.Peso = this.normalizarNumeroConMaxCifras(value, 3, 2);
        this.recalcularOficialidad();
    }

    onAlturaChange(value: number | string | null | undefined): void {
        this.Personaje.Altura = this.normalizarNumeroConMaxCifras(value, 3, 2);
        this.recalcularOficialidad();
    }

    private normalizarNumeroConMaxCifras(
        value: number | string | null | undefined,
        maxDigits: number,
        maxDecimals: number
    ): number {
        const source = `${value ?? ''}`.replace(',', '.');
        let resultado = '';
        let digitsCount = 0;
        let decimalUsed = false;
        let decimalsCount = 0;

        for (const char of source) {
            if (char >= '0' && char <= '9') {
                if (digitsCount >= maxDigits)
                    continue;
                if (decimalUsed && decimalsCount >= maxDecimals)
                    continue;
                resultado += char;
                digitsCount += 1;
                if (decimalUsed)
                    decimalsCount += 1;
                continue;
            }

            if (char === '.' && !decimalUsed && maxDecimals > 0) {
                if (resultado.length < 1)
                    resultado = '0';
                resultado += '.';
                decimalUsed = true;
            }
        }

        if (resultado === '' || resultado === '.')
            return 0;

        if (resultado.endsWith('.'))
            resultado = resultado.slice(0, -1);

        const parsed = Number(resultado);
        return Number.isFinite(parsed) ? parsed : 0;
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
        const nombreNorm = normalizarTexto(nombreRegion ?? '');
        if (nombreNorm.length < 1)
            return null;
        const region = (this.catalogoRegiones ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
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
        return normalizarTexto(a ?? '') === normalizarTexto(b ?? '');
    };

    private normalizarAlineamientoSeleccionado(): void {
        const alineamientosDisponibles = this.buildAlineamientosDisponibles();
        this.basicosDerivedState.alineamientosDisponibles = alineamientosDisponibles;
        const actual = this.Personaje.Alineamiento ?? '';
        const normalizado = normalizarTexto(actual);
        const encontrado = alineamientosDisponibles.find(a => normalizarTexto(a) === normalizado);

        if (encontrado) {
            this.Personaje.Alineamiento = encontrado;
            return;
        }

        this.Personaje.Alineamiento = alineamientosDisponibles[0] ?? 'Legal bueno';
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
            || this.modalSelectorVisibilidadAbierto
            || this.modalSelectorClaseOpcionalAbierto
            || this.modalInformacionBasicosAbierto;
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
        const sinCampana = normalizarTexto('Sin campaña');
        return (campanas ?? []).filter((campana) => normalizarTexto(campana?.Nombre ?? '') !== sinCampana);
    }

    private sincronizarNombreCampanaSeleccionada(campanas: Campana[]): void {
        const currentName = `${this.Personaje?.Campana ?? ''}`.trim();
        if (currentName.length < 1 || normalizarTexto(currentName) === normalizarTexto('Sin campaña'))
            return;

        const currentStillExists = (campanas ?? []).some((campana) => normalizarTexto(campana?.Nombre ?? '') === normalizarTexto(currentName));
        if (currentStillExists)
            return;

        const previousCampaignId = toPositiveInt(
            this.Campanas.find((campana) => normalizarTexto(campana?.Nombre ?? '') === normalizarTexto(currentName))?.Id
        );
        if (!previousCampaignId)
            return;

        const renamedCampaign = (campanas ?? []).find((campana) => toPositiveInt(campana?.Id) === previousCampaignId);
        if (renamedCampaign?.Nombre)
            this.Personaje.Campana = renamedCampaign.Nombre;
    }

    actualizarTramas(): void {
        if (this.Personaje.Campana === 'Sin campaña') {
            this.selectedCampaignPolicy = null;
            this.selectedCampaignActiveMasterUid = null;
            this.selectedCampaignPolicyResolved = true;
            this.nuevoPSvc.aplicarRestriccionCampanaGenerador(null);
            this.Tramas = [];
            this.Subtramas = [];
            this.Personaje.Trama = 'Trama base';
            this.Personaje.Subtrama = 'Subtrama base';
            this.syncCampaignPolicyDependentState();
            return;
        }

        const campanaSeleccionada = this.Campanas.find(c => c.Nombre === this.Personaje.Campana);
        if (!campanaSeleccionada) {
            this.Personaje.Campana = 'Sin campaña';
            this.selectedCampaignPolicy = null;
            this.selectedCampaignActiveMasterUid = null;
            this.selectedCampaignPolicyResolved = true;
            this.nuevoPSvc.aplicarRestriccionCampanaGenerador(null);
            this.Tramas = [];
            this.Subtramas = [];
            this.Personaje.Trama = 'Trama base';
            this.Personaje.Subtrama = 'Subtrama base';
            this.syncCampaignPolicyDependentState();
            return;
        }

        this.Tramas = campanaSeleccionada?.Tramas.map(t => ({
            Id: t.Id,
            Nombre: t.Nombre
        })) ?? [];

        if (this.Tramas.length < 1) {
            this.Subtramas = [];
            this.Personaje.Trama = this.tramaSinSeleccionCampana;
            this.Personaje.Subtrama = this.subtramaSinSeleccionCampana;
            void this.syncSelectedCampaignPolicy();
            return;
        }

        if (!this.Tramas.find(t => t.Nombre === this.Personaje.Trama)) {
            this.Personaje.Trama = this.tramaSinSeleccionCampana;
            this.Personaje.Subtrama = this.subtramaSinSeleccionCampana;
        }

        void this.syncSelectedCampaignPolicy();
        this.actualizarSubtramas();
    }

    abrirGestionCampanas(): void {
        if (!this.canOpenCampaignManagement)
            return;

        this.userProfileNavigationSvc.openPrivateProfile({
            section: 'campanas',
            requestId: Date.now(),
        });
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
        if (this.esTramaCampanaSinEspecificar(this.Personaje.Trama)) {
            this.Subtramas = [];
            this.Personaje.Subtrama = this.subtramaSinSeleccionCampana;
            return;
        }

        this.Subtramas = tramaSeleccionada?.Subtramas.map(s => ({
            Id: s.Id,
            Nombre: s.Nombre
        })) ?? [];

        if (this.Subtramas.length < 1) {
            this.Personaje.Subtrama = '';
            return;
        }

        if (!this.Subtramas.find(s => s.Nombre === this.Personaje.Subtrama)) {
            this.Personaje.Subtrama = '';
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

        const nombreBuscado = normalizarTexto(value?.Nombre ?? '');
        if (nombreBuscado.length < 1)
            return;
        const conjuroPorNombre = (this.catalogoConjuros ?? []).find((conjuro) => normalizarTexto(conjuro?.Nombre ?? '') === nombreBuscado)
            ?? (this.Personaje?.Conjuros ?? []).find((conjuro) => normalizarTexto(conjuro?.Nombre ?? '') === nombreBuscado);
        if (conjuroPorNombre)
            this.conjuroDetalles.emit(conjuroPorNombre);
    }

    verDetallesClaseDesdeFicha(nombreClase: string): void {
        const nombreBuscado = normalizarTexto(nombreClase ?? '');
        if (nombreBuscado.length < 1)
            return;

        const clase = (this.catalogoClases ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreBuscado);
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

        const nombreBuscado = normalizarTexto(payload?.nombre ?? '');
        if (nombreBuscado.length < 1)
            return;
        const plantillaPorNombre = this.plantillasCatalogo.find((p) => normalizarTexto(p.Nombre) === nombreBuscado)
            ?? this.plantillasSeleccionadas.find((p) => normalizarTexto(p.Nombre) === nombreBuscado);
        if (plantillaPorNombre)
            this.plantillaDetalles.emit(plantillaPorNombre);
    }

    @Output() racialDetallesPorNombre: EventEmitter<RacialReferencia> = new EventEmitter<RacialReferencia>();
    /** Los enlaces del detalle de la raza que se mira en el primer paso: sus subtipos, sus dotes y sus plantillas. */
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();
    @Output() doteDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() plantillaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    /** Los enlaces de las vistas previas de clase y plantilla, por id o por nombre, como en Detalles. */
    @Output() conjuroDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() especialDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    @Output() armaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() armaduraDetallesId: EventEmitter<number> = new EventEmitter<number>();
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
    abrirDetallesDeidadSeleccionada(): void {
        const detalle = this.deidadSeleccionadaDetalle;
        if (!detalle)
            return;
        this.verDetallesDeidadDesdeReferencia(detalle.Nombre);
    }

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
        this.plantillasConRequisitosSaltados.clear();
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
        this.recalcularOficialidad();
    }

    /**
     * Si la campaña deja saltarse los prerrequisitos de una plantilla: solo si admite homebrew sin límite, porque el
     * personaje pasa a serlo (sin campaña, siempre).
     */
    get puedeSaltarRequisitosPlantilla(): boolean {
        return this.getCurrentCampaignHomebrewMode(this.effectiveSelectedCampaignPolicy) === 'unrestricted';
    }

    /**
     * Elige una plantilla que no cumple sus prerrequisitos (y solo eso: `saltable`), con el aviso de homebrew de siempre.
     * La API no los comprueba al guardar; el personaje queda como homebrew mientras la plantilla siga elegida
     * (`docs/publica/REGLAS_DE_CREACION.md`).
     */
    async elegirPlantillaSaltandoRequisitos(item: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }): Promise<void> {
        if (!item?.evaluacion?.saltable || !this.puedeSaltarRequisitosPlantilla)
            return;
        const motivos = item.evaluacion.razones.map((razon) => `<li>${razon}</li>`).join('');
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: `Elegir ${item.plantilla.Nombre} sin cumplir sus requisitos`,
            html: `<ul style="text-align:left; margin-top: 4px;">${motivos}</ul>${AVISO_HOMEBREW_REGLA_SALTADA}`,
            showCancelButton: true,
            confirmButtonText: 'Aceptar y elegirla',
            cancelButtonText: 'Cancelar',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
        if (!confirmacion.isConfirmed)
            return;
        this.plantillasConRequisitosSaltados.add(Number(item.plantilla.Id));
        this.plantillaMirada = null;
        this.seleccionarPlantilla(item.plantilla);
    }

    /** La plantilla cuya vista previa está abierta (pulsar su tarjeta); se elige con su botón del pie. */
    plantillaMirada: Plantilla | null = null;

    abrirPlantilla(plantilla: Plantilla): void {
        this.plantillaMirada = plantilla;
    }

    /** Si la plantilla que se mira está entre las que puede tomar. */
    get plantillaMiradaElegible(): boolean {
        const id = Number(this.plantillaMirada?.Id);
        return this.plantillasElegibles.some((plantilla) => Number(plantilla.Id) === id);
    }

    /** Por qué no puede tomar la plantilla que se mira (campaña, formato o requisitos), o `null`. */
    get bloqueoPlantillaMirada(): { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; } | null {
        const id = Number(this.plantillaMirada?.Id);
        if (!this.plantillaMirada)
            return null;
        return [...this.plantillasBloqueadasCampana, ...this.plantillasBloqueadasUnknown, ...this.plantillasBloqueadasFailed]
            .find((item) => Number(item.plantilla.Id) === id) ?? null;
    }

    elegirPlantillaMirada(): void {
        if (!this.plantillaMirada || !this.plantillaMiradaElegible)
            return;
        const plantilla = this.plantillaMirada;
        this.plantillaMirada = null;
        this.seleccionarPlantilla(plantilla);
    }

    /** La nota del pie del paso de plantillas. */
    get notaPasoPlantillas(): string {
        if (!this.plantillaMirada)
            return 'Pulsa una plantilla para verla a la derecha. Las heredadas o de la raza ya vienen puestas. Un paso hecho no se puede deshacer.';
        if (this.bloqueoPlantillaMirada)
            return this.bloqueoPlantillaMirada.evaluacion.razones.join(' · ');
        if (this.plantillaMiradaElegible)
            return 'Elígela con su botón; puedes tomar varias antes de continuar.';
        return 'Ya la tienes elegida.';
    }

    /** Si sigue elegida alguna plantilla con los prerrequisitos saltados. */
    private get haySaltoRequisitosPlantilla(): boolean {
        return this.plantillasSeleccionadas.some((plantilla) => this.plantillasConRequisitosSaltados.has(Number(plantilla?.Id)));
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

    esPlantillaOtorgadaPorRaza(plantilla: Plantilla): boolean {
        return this.nuevoPSvc.esPlantillaOtorgadaPorRaza(Number(plantilla?.Id));
    }

    getEtiquetaEstadoPlantillaSeleccionada(plantilla: Plantilla): string {
        if (this.esPlantillaOtorgadaPorRaza(plantilla))
            return 'Raza';
        return this.esPlantillaConfirmada(plantilla) ? 'Fijada' : 'Actual';
    }

    getClaseEstadoPlantillaSeleccionada(plantilla: Plantilla): string {
        if (this.esPlantillaOtorgadaPorRaza(plantilla))
            return 'fixed';
        return this.esPlantillaConfirmada(plantilla) ? 'fixed' : 'info';
    }

    puedeQuitarPlantillaSeleccion(plantilla: Plantilla): boolean {
        return !this.esPlantillaConfirmada(plantilla);
    }

    quitarPlantillaSeleccion(idPlantilla: number): void {
        this.nuevoPSvc.quitarPlantillaSeleccion(idPlantilla);
        this.recalcularPlantillasVisibles();
        this.recalcularClasesVisibles();
        this.recalcularOficialidad();
    }

    limpiarSeleccionPlantillas(): void {
        this.nuevoPSvc.limpiarPlantillasSeleccion();
        this.recalcularPlantillasVisibles();
        this.recalcularClasesVisibles();
        this.recalcularOficialidad();
    }

    async continuarDesdePlantillas(): Promise<void> {
        if (!this.caracteristicasGeneradas) {
            return;
        }
        if (!await this.ensureSelectedCampaignPolicyReady())
            return;
        const retornoFinNivelPendiente = this.nuevoPSvc.consumirRetornoFinNivelPendientePlantillas();
        const plantillasPendientesConfirmacion = this.nuevoPSvc.getPlantillasSeleccionadasPendientesConfirmacion();

        this.nuevoPSvc.registrarAumentosPendientesPorProgresion('Plantillas confirmadas');
        const aumentosCompletados = await this.abrirSelectorAumentosCaracteristica();
        if (!aumentosCompletados)
            return;

        this.nuevoPSvc.confirmarSeleccionActualPlantillas();
        if (this.nuevoPSvc.iniciarDistribucionHabilidadesPorPlantillasDG(plantillasPendientesConfirmacion)) {
            this.Personaje = this.nuevoPSvc.PersonajeCreacion;
            this.recalcularPlantillasVisibles();
            this.recalcularClasesVisibles();
            this.sincronizarTabConPaso();
            return;
        }

        const siguientePaso: StepNuevoPersonaje = retornoFinNivelPendiente || this.campaignForbidsAdvantages ? 'clases' : 'ventajas';
        this.nuevoPSvc.actualizarPasoActual(siguientePaso);
        this.recalcularPlantillasVisibles();
        this.recalcularClasesVisibles();
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

    /** Abre la vista previa de una clase (pulsar su fila); se elige con «Elegir y continuar». */
    abrirClase(clase: Clase): void {
        this.claseSeleccionadaId = Number(clase?.Id);
    }

    /** La nota del pie del paso de clases: qué hacer, o por qué no se puede elegir la que se mira. */
    get notaPasoClases(): string {
        const item = this.claseSeleccionadaActual;
        if (!item && this.totalNivelesClaseActual < 1) {
            if (!this.puedeTerminarSinClases)
                return `${MOTIVO_PJ_SIN_CLASE} Pulsa una clase para ver a la derecha su siguiente nivel antes de elegirla.`;
            const dgs = this.dgsRacialesCreacion;
            const deDonde = dgs > 0
                ? `sale solo de sus ${dgs} DG raciales`
                : 'su raza no tiene DG raciales: ataque base, salvaciones y PG quedan a 0';
            return `Sin clases, ${deDonde}. Termina con «Terminar sin clases» o pulsa una clase para verla a la derecha.`;
        }
        if (!item)
            return 'Pulsa una clase para ver a la derecha su siguiente nivel antes de elegirla.';
        if (!item.puedeAplicarse)
            return item.campaignBlockedReason
                ? `No puedes elegirla: ${item.campaignBlockedReason}.`
                : 'No puedes elegirla: no cumple sus requisitos.';
        return 'Elígela con «Elegir y continuar». Un paso hecho no se puede deshacer.';
    }

    /** La nota del pie de clases va en tono de aviso si no puede elegir la que mira o si un PJ no puede quedarse sin clases. */
    get avisoPasoClases(): boolean {
        const item = this.claseSeleccionadaActual;
        return item ? !this.puedeAplicarClaseSeleccionada : this.totalNivelesClaseActual < 1 && !this.puedeTerminarSinClases;
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
            const confirmacion = await Swal.fire({
                icon: 'warning',
                title: 'Aviso de alineamiento de clase',
                html: `${detalleAlineamiento}<br><br>${AVISO_HOMEBREW_REGLA_SALTADA}`,
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

        let seleccionesExtrasEspeciales: SeleccionExtrasEspecialesClase | null = null;
        const especialesExtraPendientes = this.nuevoPSvc.obtenerEspecialesExtraPendientesSiguienteNivelClase(
            seleccion.clase,
            seleccionesOpcionales
        );
        if (especialesExtraPendientes.length > 0) {
            seleccionesExtrasEspeciales = await this.solicitarExtrasEspecialesClase(especialesExtraPendientes);
            if (!seleccionesExtrasEspeciales)
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
            seleccionesAumentosClaseLanzadora,
            seleccionesExtrasEspeciales
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
                seleccionesAumentosClaseLanzadora,
                seleccionesExtrasEspeciales
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
            this.nuevoPSvc.marcarIdiomasInicialesConcedidos();
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

        this.nuevoPSvc.iniciarDistribucionHabilidadesPorClase(seleccion.clase);
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

        // La escuela fija de la clase (`Conjuros.Escuela_especialista`): sin escuelas que prohibir, no hay nada que elegir.
        const escuelaFija = this.nuevoPSvc.escuelaFijaEnCatalogo(pendiente, this.catalogoEscuelas);
        const soloEscuelaFija = !!escuelaFija && !pendiente.requierePsionico && prohibidasAlEspecializarse(escuelaFija) < 1;

        if (pendiente.requierePsionico) {
            // Basta con una disciplina que se pueda elegir: el psiónico no prohíbe ninguna (Manual de psiónica expandido).
            const hayDisciplinas = (this.catalogoDisciplinas ?? [])
                .some(esEspecializable);
            if (!hayDisciplinas) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'No se puede resolver especialización psiónica',
                    text: 'No hay disciplinas válidas para elegir.',
                    showConfirmButton: true,
                });
                return false;
            }
        }

        const seleccion = soloEscuelaFija
            ? { arcana: { especializar: true, escuelaEspecialistaId: toPositiveInt(escuelaFija?.Id) ?? null, escuelasProhibidasIds: [] } }
            : await this.solicitarEspecialidadMagicaClase(clase, pendiente, escuelaFija);
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
            .sort(porNombre);

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

    getCosteRangoHabilidad(idHabilidad: number): number {
        return this.nuevoPSvc.obtenerCosteRangoHabilidad(idHabilidad);
    }

    getTooltipLimiteRangoHabilidad(idHabilidad: number): string {
        return this.getCosteRangoHabilidad(idHabilidad) > 1
            ? 'Transclásea: cada rango cuesta 2 puntos y el límite es la mitad (nivel + 3) / 2'
            : 'Clásea: cada rango cuesta 1 punto y el límite es nivel + 3';
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
        const normalizada = normalizarTexto(caracteristica ?? '');
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
        if (!this.nuevoPSvc.esExtraElegibleHabilidad(idHabilidad))
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

        // Las que ya tiene otra habilidad del grupo no se ofrecen: el servicio no las aceptaría.
        const extraActualNorm = normalizarTexto(`${habilidad?.Extra ?? ''}`);
        return opciones.filter((opcion) => {
            const extraNorm = normalizarTexto(opcion.Extra);
            return extraNorm === extraActualNorm || !this.nuevoPSvc.existeExtraDuplicadoEnGrupoParaSesion(habilidad, extraNorm);
        });
    }

    esExtraPendienteHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        return !!habilidad && this.nuevoPSvc.esExtraHabilidadPendienteParaSesion(habilidad);
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
        if (!habilidad?.Soporta_extra || !this.nuevoPSvc.esExtraElegibleHabilidad(Number(habilidad?.Id)))
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

        const seleccionado = await this.abrirSelectorModalExtra(`${habilidad?.Nombre ?? ''}`.trim() || 'Habilidad', `${habilidad?.Extra ?? ''}`, opciones);
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
        if (!this.nuevoPSvc.esExtraElegibleHabilidad(Number(habilidad?.Id)))
            return false;
        if (Boolean(habilidad?.Extra_bloqueado))
            return false;
        return this.getOpcionesExtraHabilidad(habilidad).length > 0;
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

    /** El selector de extras de la creación: el de una habilidad («Saber: extra») y el de una aptitud de clase. */
    private abrirSelectorModalExtra(
        nombre: string,
        valorInicial: string,
        opciones: ExtraHabilidadSelectorOpcion[]
    ): Promise<string | null> {
        this.limpiarFocoActivoAntesDeModal();
        this.selectorExtraHabilidadTitulo = `${nombre}: extra`;
        this.selectorExtraHabilidadNombre = `${nombre ?? ''}`.trim();
        this.selectorExtraHabilidadOpciones = [...(opciones ?? [])];
        this.selectorExtraHabilidadValorInicial = `${valorInicial ?? ''}`.trim();
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

    /** Sirve para el botón de un rango y para el de subir al máximo: los dos necesitan poder pagar al menos un rango. */
    puedeSubirRangoHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        return !!habilidad && this.nuevoPSvc.puedeSubirRangoHabilidad(Number(habilidad?.Id));
    }

    puedeBajarRangoHabilidad(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!habilidad)
            return false;
        const idHabilidad = Number(habilidad?.Id ?? 0);
        const actuales = Math.max(0, Math.trunc(Number(habilidad?.Rangos ?? 0)));
        const iniciales = this.getRangosInicialesSesionHabilidad(idHabilidad);
        return actuales > iniciales;
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
        const rangosPagables = Math.floor(Math.max(0, Number(this.flujoHabilidades.puntosRestantes ?? 0)) / this.getCosteRangoHabilidad(idHabilidad));
        const delta = Math.min(margenLimite, rangosPagables);
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
        const normalizado = normalizarTexto(nombre ?? '');
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
            if (!this.nuevoPSvc.iniciarDistribucionHabilidadesCompanero(siguientePaso))
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
        // La sesión del lanzamiento racial sin clases se abrió al terminar: se sigue terminando.
        if (this.finalizarTrasLanzamientoRacial) {
            this.finalizarTrasLanzamientoRacial = false;
            void this.onFinalizarCreacionTemporal();
        }
    }

    private async continuarDesdeConjurosPostDotes(): Promise<void> {
        const completado = await this.resolverFlujoPostDotesFinNivel();
        if (!completado)
            return;

        this.nuevoPSvc.cerrarSesionConjuros();
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        const siguientePaso = this.resolverPasoPostDotesFinNivel();
        if (!this.nuevoPSvc.iniciarDistribucionHabilidadesCompanero(siguientePaso))
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

    private aplicarRestriccionesCampanaADotes(candidatos: DoteSelectorCandidato[]): DoteSelectorCandidato[] {
        return (candidatos ?? []).map((candidato) => {
            const dote = candidato?.dote;
            const campaignBlockedReason = this.getCampaignBlockedReasonForCandidate(
                'dote',
                Number(dote?.Id ?? 0),
                `${dote?.Nombre ?? ''}`.trim(),
                dote?.Oficial === false
            );
            if (!campaignBlockedReason)
                return candidato;

            const razones = Array.from(new Set([
                ...(candidato?.evaluacion?.razones ?? []),
                campaignBlockedReason,
            ].filter((reason) => `${reason ?? ''}`.trim().length > 0)));

            return {
                ...candidato,
                evaluacion: {
                    estado: 'blocked_failed',
                    razones,
                    advertencias: [...(candidato?.evaluacion?.advertencias ?? [])],
                },
            };
        });
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

            const candidatos = this.aplicarRestriccionesCampanaADotes(
                this.nuevoPSvc.obtenerCandidatosDotePendiente(pendiente.id)
            );
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
            plantilla,
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
        // Sin clases, lo del primer nivel que no llega con una clase: los idiomas adicionales por Inteligencia y los
        // conjuros del lanzamiento racial (los dragones, el rakshasa), en su sesión de conjuros antes de terminar.
        const idiomas = this.nuevoPSvc.getIdiomasPendientesSinClases();
        if (idiomas.cantidad > 0) {
            if (!await this.abrirSelectorIdiomasIniciales(idiomas.cantidad))
                return;
            this.nuevoPSvc.marcarIdiomasInicialesConcedidos();
            this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        }
        if (this.nuevoPSvc.hayLanzamientoRacialPendiente() && await this.abrirSesionLanzamientoRacial())
            return;
        // Magic of Incarnum: quien puede moldear pasa antes por la formación de partida (opcional).
        if (!this.formacionAbierta && this.incarnumBorrador?.puedeMoldear) {
            await this.abrirFormacionIncarnum();
            return;
        }
        this.abrirSelectorPuntosGolpe();
    }

    /**
     * Abre la sesión de conjuros del lanzamiento racial sin clases; al cerrarla se sigue terminando
     * (`finalizarTrasLanzamientoRacial`). `false` si no hay nada que elegir (los avisos, si los hay, se enseñan).
     */
    private async abrirSesionLanzamientoRacial(): Promise<boolean> {
        const avisos = this.nuevoPSvc.iniciarSesionLanzamientoRacial(this.flujo.pasoActual);
        if (!this.flujoConjuros.activa) {
            if (avisos.length > 0)
                await Swal.fire({
                    icon: 'info',
                    title: 'Lanzamiento racial',
                    html: `<div style="text-align:left;">${avisos.map((aviso) => `• ${aviso}`).join('<br>')}</div>`,
                    confirmButtonText: 'Continuar',
                    target: document.body,
                    heightAuto: false,
                    scrollbarPadding: false,
                });
            return false;
        }
        this.finalizarTrasLanzamientoRacial = true;
        this.filtroConjurosTexto = '';
        this.filtroConjurosNivel = null;
        this.nuevoPSvc.actualizarPasoActual('conjuros');
        this.Personaje = this.nuevoPSvc.PersonajeCreacion;
        this.sincronizarTabConPaso();
        return true;
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
                text: 'La creación ya comenzó y no se puede cerrar hasta completar la finalización y apertura de detalles.',
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
        // Las tiradas que deja la campaña (`tiradasPuntosGolpe`); sin campaña o sin límite, el máximo.
        // A un PNJ no le aplica la política de la campaña: sin límite de tiradas.
        this.tiradasVidaTotales = tiradasPuntosGolpe(this.esPnjCreacion ? null : this.selectedCampaignPolicy?.maxTiradasPuntosGolpe);
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
        const accessRestrictionMessage = this.userSvc.getAccessRestrictionMessage('creation');
        if (accessRestrictionMessage.length > 0) {
            await Swal.fire({
                icon: 'warning',
                title: 'No puedes finalizar el personaje',
                text: accessRestrictionMessage,
                showConfirmButton: true,
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            return;
        }

        if (!await this.ensureCampaignCreationRulesSatisfied('finalizacion'))
            return;

        let etapa: 'sql' | 'navegacion' = 'sql';
        this.finalizacionEnCurso = true;
        try {
            let idPersonaje = Math.trunc(Number(this.finalizacionState.idPersonaje ?? 0));
            this.persistirBorradorLocalCritico();
            const progresionLanzador = this.nuevoPSvc.getProgresionLanzadorPersistible();
            const nivelesLanzador = this.nuevoPSvc.getNivelesLanzadorPersistibles();
            this.Personaje.ProgresionLanzador = progresionLanzador ?? { selecciones: [] };
            this.Personaje.Niveles_lanzador = nivelesLanzador;

            if (!this.finalizacionState.sqlOk) {
                etapa = 'sql';
                // Con todo ya elegido (dotes, idiomas, familiar…), la oficialidad final antes de guardar.
                this.recalcularOficialidad();
                const contextoIds = this.resolverContextoIdsCreacion();
                const contextoCreacionCampana = this.buildCampaignCreationContextForApi();
                const payload = this.personajeSvc.construirPayloadCreacionDesdePersonaje(
                    this.Personaje,
                    contextoIds,
                    contextoCreacionCampana,
                    progresionLanzador,
                    this.nuevoPSvc.construirMascotasParaGuardar()
                );
                if (this.formacionIncarnum)
                    payload.incarnum = this.formacionIncarnum;
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
            this.persistirBorradorLocalCritico();

            const pjNormalizado = this.personajeSvc.normalizarPersonajeParaPersistenciaFinal(this.Personaje, idPersonaje);
            this.Personaje = pjNormalizado;
            this.listaPersonajesSvc?.upsertPersonajeCreadoEnCache(pjNormalizado);

            etapa = 'navegacion';
            this.modalSelectorVisibilidadAbierto = false;
            this.selectorVisibilidadValorInicial = null;
            this.formacionAbierta = false;
            this.formacionReintento = false;
            // El último paso: las compras, con el personaje ya guardado. Si la tienda no puede abrirse, se termina sin ella.
            if (await this.abrirTiendaEquipo(pjNormalizado))
                return;
            this.completarFinalizacion(pjNormalizado);
        } catch (error: any) {
            // La API no acepta la formación de partida: se vuelve a ella con su error, sin repetir los PG ni la visibilidad.
            if (etapa === 'sql' && CODIGOS_FALLO_FORMACION.includes(`${error?.code ?? ''}`)) {
                this.formacionErrorApi = { code: `${error.code}`, field: `${error?.field ?? ''}`, mensaje: `${error?.message ?? ''}`.trim() };
                this.formacionReintento = true;
                this.modalSelectorVisibilidadAbierto = false;
                await this.abrirFormacionIncarnum();
                return;
            }
            const complianceMessage = this.userSvc.getComplianceErrorMessage(error, 'creation');
            const texto = `${complianceMessage || error?.message || 'Error no identificado'}`.trim();
            // Los errores del tipo y de la edad (dragones jugables) traen su frase: el título no habla de SQL.
            const titulo = CODIGOS_FALLO_TIPO_Y_EDAD.includes(codigoDeError(error))
                ? 'No se pudo crear el personaje'
                : etapa === 'sql'
                    ? 'No se pudo guardar en SQL'
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

    /** Lo que queda tras guardar el personaje (y, si la hay, tras la tienda): abrir su ficha y descargar sus hojas. */
    private completarFinalizacion(pj: Personaje): void {
        const idPersonaje = Math.trunc(Number(pj?.Id ?? 0));
        this.nuevoPSvc.descartarBorradorLocal(this.obtenerUidSesionActiva());
        this.personajeFinalizado.emit(idPersonaje);
        this.fichasDescargaBgSvc.descargarFichas(pj, {
            incluirConjuros: true,
            incluirFamiliares: true,
            incluirCompaneros: true,
        });
        this.resetearEstadoFinalizacion();
    }

    /**
     * Abre la tienda con el dinero inicial que le toca por su NEP (el `nivelEfectivo` de la ficha recién guardada: con
     * NEP 1, el oro de su clase; con más, la riqueza de `GET /equipo/catalogos`) y lo que se puede comprar. Devuelve
     * `false` si no puede abrirse (sin la ficha o sin los catálogos).
     */
    private async abrirTiendaEquipo(pj: Personaje): Promise<boolean> {
        if (!this.equipoSvc)
            return false;
        let catalogos: EquipoCatalogos;
        try {
            catalogos = await firstValueFrom(this.equipoSvc.getCatalogos());
        } catch {
            return false;
        }
        const ficha = await this.fichaDeLaApi(pj.Id);
        if (!ficha)
            return false;
        let municiones: MunicionDetalle[] = [];
        try {
            municiones = await firstValueFrom(this.equipoSvc.getMuniciones());
        } catch {
            municiones = [];
        }
        const ventajas = this.flujoVentajas.seleccionVentajas
            .map((seleccion) => (this.catalogoVentajas ?? []).find((ventaja) => Number(ventaja?.Id) === Number(seleccion.id)))
            .filter((ventaja): ventaja is VentajaDetalle => !!ventaja);
        // Sin campaña, todo (también lo homebrew); en una campaña, su política: si no admite homebrew, solo lo oficial.
        // Con un límite de fuentes homebrew se ofrece todo y la API dice si la compra se pasa.
        this.tiendaSoloOficial = this.getCurrentCampaignHomebrewMode(this.effectiveSelectedCampaignPolicy) === 'forbidden';
        this.tiendaPolitica = politicaTienda(this.effectiveSelectedCampaignPolicy);
        this.tiendaArticulos = [
            ...(this.catalogoArmas ?? []).map((arma) => articuloDeArma(arma)),
            ...(this.catalogoArmaduras ?? []).map((armadura) => articuloDeArmadura(armadura)),
            ...municiones.map((municion) => articuloDeMunicion(municion)),
        ];
        this.tiendaRegla = reglaDineroInicial({
            nivelEfectivo: ficha.NEP,
            clases: ficha.desgloseClases ?? [],
            duplicaOro: ventajas.some((ventaja) => !!ventaja.Duplica_oro),
            aumentaOro: ventajas.some((ventaja) => !!ventaja.Aumenta_oro),
        }, catalogos);
        this.tiendaLibros = this.librosParaLaTienda();
        this.tiendaPersonaje = pj;
        this.tiendaError = '';
        this.tiendaPiezaConError = null;
        this.tiendaCopiaConError = null;
        this.tiendaGuardando = false;
        this.modalTiendaAbierto = true;
        return true;
    }

    /**
     * Los libros de sus clases con libro de conjuros (`Conjuros.Libro`, un dato de la clase): lo que puede copiar a cada uno
     * es lo que da la regla única, `conjurosAniadiblesAlLibro`, y las páginas usadas, las de los que ya tiene.
     */
    private librosParaLaTienda(): LibroTienda[] {
        return this.clasesDelPersonajeEnElCatalogo()
            .filter((clase) => !!clase.Conjuros?.Libro)
            .filter((clase, indice, todas) => todas.findIndex((otra) => otra.Id === clase.Id) === indice)
            .map((clase) => libroTienda(clase, this.nuevoPSvc.conjurosAniadiblesAlLibro(clase), this.nuevoPSvc.conjurosEnElLibro(clase)));
    }

    /** Las clases de su desglose, del catálogo (por nombre); las que no están en el catálogo no salen. */
    private clasesDelPersonajeEnElCatalogo(): Clase[] {
        return (this.Personaje?.desgloseClases ?? [])
            .map((entrada) => this.claseDelCatalogo(entrada?.Nombre))
            .filter((clase): clase is Clase => !!clase);
    }

    /** Guarda la compra (`PUT /personajes/{id}/equipo`); la API calcula los precios y comprueba el dinero. */
    async onConfirmarTienda(compra: PersonajeCompraRequestDto): Promise<void> {
        const pj = this.tiendaPersonaje;
        if (!pj || this.tiendaGuardando)
            return;
        this.tiendaGuardando = true;
        this.tiendaError = '';
        this.tiendaPiezaConError = null;
        this.tiendaCopiaConError = null;
        try {
            const respuesta = await this.personajeSvc.comprarEquipoPersonaje(pj.Id, compra);
            pj.Oficial = respuesta.oficial;
            this.listaPersonajesSvc?.upsertPersonajeCreadoEnCache(pj);
        } catch (error: any) {
            // El `error` de la API tal cual (también `homebrew_no_permitido` y `limite_fuentes_homebrew`) y, si su
            // `field` nombra una pieza, esa pieza señalada.
            this.tiendaError = `${error?.message ?? ''}`.trim() || 'No se ha podido guardar el equipo.';
            this.tiendaPiezaConError = indicePiezaDelCampo(error?.field);
            this.tiendaCopiaConError = indiceConjuroLibroDelCampo(error?.field);
            this.tiendaGuardando = false;
            return;
        }
        this.cerrarTienda();
        this.completarFinalizacion(await this.fichaDeLaApi(pj.Id) ?? pj);
    }

    onOmitirTienda(): void {
        const pj = this.tiendaPersonaje;
        if (!pj || this.tiendaGuardando)
            return;
        this.cerrarTienda();
        this.completarFinalizacion(pj);
    }

    private cerrarTienda(): void {
        this.modalTiendaAbierto = false;
        this.tiendaGuardando = false;
        this.tiendaError = '';
        this.tiendaPiezaConError = null;
        this.tiendaCopiaConError = null;
        this.tiendaLibros = [];
        this.tiendaPersonaje = null;
    }

    /** La ficha de la API (con su `nivelEfectivo` y, tras la compra, el equipo y la defensa); `null` si no llega. */
    private async fichaDeLaApi(idPersonaje: number): Promise<Personaje | null> {
        try {
            const detalle$ = await this.personajeSvc.getDetallesPersonaje(idPersonaje);
            return await firstValueFrom(detalle$.pipe(take(1)));
        } catch {
            return null;
        }
    }

    private persistirBorradorLocalCritico(): void {
        const uid = this.obtenerUidSesionActiva();
        if (uid.length < 1)
            return;
        this.nuevoPSvc.persistirBorradorLocalAhora(uid);
    }

    private resolverContextoIdsCreacion(): PersonajeContextoIdsDto {
        const campanaNorm = normalizarTexto(this.Personaje.Campana ?? '');
        const tramaNorm = normalizarTexto(this.Personaje.Trama ?? '');
        const subtramaNorm = normalizarTexto(this.Personaje.Subtrama ?? '');
        const campana = (this.Campanas ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === campanaNorm);

        const trama = (campana?.Tramas ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === tramaNorm);
        const subtrama = (trama?.Subtramas ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === subtramaNorm);

        const esSinCampana = campanaNorm.length < 1 || campanaNorm === normalizarTexto('Sin campaña');
        const esSinHistoriaCampana = this.esTramaCampanaSinEspecificar(this.Personaje?.Trama);
        const esSubtramaBase = this.esSubtramaCampanaSinEspecificar(this.Personaje?.Subtrama);
        const idCampana = esSinCampana ? null : (toPositiveInt(campana?.Id) ?? null);
        const idTrama = esSinCampana || esSinHistoriaCampana ? null : (toPositiveInt(trama?.Id) ?? null);
        const idSubtrama = esSinCampana || esSinHistoriaCampana || esSubtramaBase ? null : (toPositiveInt(subtrama?.Id) ?? null);
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
            idManiobrabilidad: toPositiveInt((this.Personaje as any)?.Raza?.Maniobrabilidad?.Id) ?? 0,
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

    private buildCampaignCreationContextForApi(): PersonajeContextoCreacionCampanaDto | null {
        if (!this.hasSelectedCampaignContext)
            return null;

        const generatorState = this.nuevoPSvc.EstadoFlujo?.generador ?? null;
        const tiradaMinimaDeclarada = this.toNonNegativeIntegerOrNull(generatorState?.minimoSeleccionado);
        const tablasDadosUsadas = this.toNonNegativeIntegerOrNull(generatorState?.tablasPermitidas);

        return {
            tiradaMinimaDeclarada,
            tablasDadosUsadas,
            overrideReglasCampana: this.isSelectedCampaignActiveMaster,
        };
    }

    private esTramaCampanaSinEspecificar(value: any): boolean {
        const normalizado = normalizarTexto(value ?? '');
        return normalizado.length < 1
            || normalizado === normalizarTexto(this.tramaSinSeleccionCampana)
            || normalizado === normalizarTexto('Trama base');
    }

    private esSubtramaCampanaSinEspecificar(value: any): boolean {
        const normalizado = normalizarTexto(value ?? '');
        return normalizado.length < 1
            || normalizado === normalizarTexto(this.subtramaSinSeleccionCampana)
            || normalizado === normalizarTexto('Subtrama base');
    }

    private mapearCatalogoNombreId<T>(
        items: T[] | null | undefined,
        getId: (item: T) => any,
        getNombre: (item: T) => any
    ): CatalogoNombreIdDto[] {
        const salida: CatalogoNombreIdDto[] = [];
        (items ?? []).forEach((item) => {
            const id = toPositiveInt(getId(item));
            const nombre = `${getNombre(item) ?? ''}`.trim();
            if (!id || nombre.length < 1)
                return;
            salida.push({ id, nombre });
        });
        return salida;
    }

    private resolverIdAlineamientoCreacion(): number | null {
        const nombreNorm = normalizarTexto(this.Personaje?.Alineamiento ?? '');
        const desdeCatalogo = (this.catalogoAlineamientosBasicos ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const idCatalogo = toPositiveInt(desdeCatalogo?.Id);
        if (idCatalogo)
            return idCatalogo;

        return toPositiveInt(getAlineamientoBasicoIdPorNombre(nombreNorm));
    }

    private resolverIdDeidadCreacion(): number {
        const deidadNorm = normalizarTexto(this.Personaje?.Deidad ?? '');
        if (esSinDeidad(deidadNorm))
            return 0;
        const encontrada = (this.catalogoDeidades ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === deidadNorm);
        return toPositiveInt(encontrada?.Id) ?? 0;
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
        const genero = normalizarTexto(this.Personaje?.Genero ?? '');
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

    private resolverIdEscuelaEspecialistaCreacion(): number {
        const nombreNorm = normalizarTexto((this.Personaje?.Escuela_especialista as any)?.Nombre ?? '');
        if (nombreNorm.length < 1 || nombreNorm === 'no especifica')
            return 0;
        const escuela = (this.catalogoEscuelas ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        return toPositiveInt((escuela as any)?.Id) ?? 0;
    }

    private resolverIdDisciplinaEspecialistaCreacion(): number {
        const nombreNorm = normalizarTexto((this.Personaje?.Disciplina_especialista as any)?.Nombre ?? '');
        if (nombreNorm.length < 1 || nombreNorm === 'no especifica')
            return 0;
        const disciplina = (this.catalogoDisciplinas ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        return toPositiveInt((disciplina as any)?.Id) ?? 0;
    }

    private resolverIdDisciplinaProhibidaCreacion(): number {
        const nombreNorm = normalizarTexto(this.Personaje?.Disciplina_prohibida ?? '');
        if (nombreNorm.length < 1 || nombreNorm === 'ninguna' || nombreNorm === 'no especifica')
            return 0;
        const disciplina = (this.catalogoDisciplinas ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        return toPositiveInt((disciplina as any)?.Id) ?? 0;
    }

    private toNonNegativeIntegerOrNull(value: any): number | null {
        if (value === null || value === undefined || `${value}`.trim() === '')
            return null;
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed < 0)
            return null;
        return parsed;
    }

    private resetearEstadoFinalizacion(): void {
        this.finalizacionState = {
            idPersonaje: null,
            sqlOk: false,
        };
    }

    onCambioPlantillaSelectorFamiliar(plantilla: FamiliarPlantillaId | null): void {
        if (plantilla === null || plantilla === undefined) {
            this.selectorFamiliarPlantillaSeleccionada = null;
            this.recalcularFamiliaresElegiblesSelector();
            return;
        }
        const parsed = toPositiveInt(plantilla);
        if (parsed === null)
            return;
        this.selectorFamiliarPlantillaSeleccionada = parsed;
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
        const normalizada = normalizarTexto(`${value ?? ''}`);
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
            return `${this.auth.currentUser?.uid ?? ''}`.trim();
        } catch {
            return '';
        }
    }

    private obtenerNombreSesionActiva(): string {
        try {
            const user = this.auth.currentUser;
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

    private async resolverRestauracionBorradorSiAplica(uid: string): Promise<'none' | 'restored' | 'reset' | 'opened-existing'> {
        if (!this.nuevoPSvc.puedeOfrecerRestauracionBorrador(uid))
            return 'none';

        const resumen = this.nuevoPSvc.getResumenBorradorLocal(uid);
        if (resumen && await this.tryOpenPersistedCharacterFromDraft(uid, resumen))
            return 'opened-existing';

        const result = await Swal.fire({
            icon: 'question',
            title: 'Borrador encontrado',
            text: 'Encontré una creación de personaje guardada en este navegador. ¿Quieres continuarla o empezar de cero?',
            showDenyButton: true,
            confirmButtonText: 'Continuar borrador',
            denyButtonText: 'Empezar de cero',
            allowOutsideClick: false,
            allowEscapeKey: false,
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });

        if (result.isConfirmed) {
            this.nuevoPSvc.restaurarBorradorLocal(uid);
            return 'restored';
        }

        this.nuevoPSvc.descartarBorradorLocal(uid);
        this.nuevoPSvc.reiniciar();
        return 'reset';
    }

    private async tryOpenPersistedCharacterFromDraft(uid: string, resumen: NuevoPersonajeDraftResumen): Promise<boolean> {
        const idPersonaje = Math.max(0, Math.trunc(Number(resumen?.personajeId ?? 0)));
        if (idPersonaje <= 0)
            return false;
        if (!await this.draftPersistedCharacterExists(idPersonaje))
            return false;

        const nombre = `${resumen?.nombre ?? ''}`.trim();
        const result = await Swal.fire({
            icon: 'question',
            title: 'Personaje ya creado',
            text: nombre.length > 0
                ? `La última creación de ${nombre} ya llegó a guardarse como personaje. ¿Quieres abrirlo o empezar de cero?`
                : 'La última creación ya llegó a guardarse como personaje. ¿Quieres abrirlo o empezar de cero?',
            showDenyButton: true,
            confirmButtonText: 'Abrir personaje',
            denyButtonText: 'Empezar de cero',
            allowOutsideClick: false,
            allowEscapeKey: false,
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });

        this.nuevoPSvc.descartarBorradorLocal(uid);
        this.nuevoPSvc.reiniciar();
        this.resetearEstadoFinalizacion();
        if (result.isConfirmed) {
            this.personajeFinalizado.emit(idPersonaje);
            return true;
        }
        return false;
    }

    private async draftPersistedCharacterExists(idPersonaje: number): Promise<boolean> {
        const id = Math.max(0, Math.trunc(Number(idPersonaje)));
        if (id <= 0)
            return false;
        try {
            const detalle$ = await this.personajeSvc.getDetallesPersonaje(id);
            await firstValueFrom(detalle$.pipe(take(1)));
            return true;
        } catch {
            return false;
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
            this.selectorFamiliarPlantillas = [];
            this.selectorFamiliarElegibles = [];
            this.selectorFamiliarBloqueados = [];
            this.selectorFamiliarNivelesRequeridos = {};
            return;
        }
        this.selectorFamiliarPlantillas = plantillasFamiliarDisponibles(
            this.selectorFamiliarCatalogoCompleto,
            this.selectorFamiliarEstadoCupos.fuentesClaseIds
        );
        const incluirHomebrewEfectivo = this.selectorFamiliarIncluirHomebrew || !this.Personaje.Oficial;
        const evaluaciones = evaluarFamiliaresElegibilidad({
            familiares: this.selectorFamiliarCatalogoCompleto,
            estado: this.selectorFamiliarEstadoCupos,
            alineamientoPersonaje: `${this.Personaje?.Alineamiento ?? ''}`.trim(),
            plantillaSeleccionada: this.selectorFamiliarPlantillaSeleccionada,
            incluirHomebrew: incluirHomebrewEfectivo,
            dotesActuales: this.getDotesActualesParaSelectores(),
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

    private getDotesActualesParaSelectores(): Array<{ id: number | null; nombre: string; }> {
        const resultado: Array<{ id: number | null; nombre: string; }> = [];
        const claves = new Set<string>();
        const registrar = (idRaw: any, nombreRaw: any) => {
            const id = Math.trunc(Number(idRaw ?? 0));
            const nombre = `${nombreRaw ?? ''}`.trim();
            if ((!Number.isFinite(id) || id <= 0) && nombre.length < 1)
                return;
            const clave = id > 0
                ? `id:${id}`
                : `nombre:${normalizarTexto(nombre)}`;
            if (claves.has(clave))
                return;
            claves.add(clave);
            resultado.push({
                id: id > 0 ? id : null,
                nombre,
            });
        };

        (this.nuevoPSvc.PersonajeCreacion.DotesContextuales ?? []).forEach((item) =>
            registrar(item?.Dote?.Id, item?.Dote?.Nombre)
        );
        (this.nuevoPSvc.PersonajeCreacion.Dotes ?? []).forEach((item: any) =>
            registrar(item?.Id ?? item?.id, item?.Nombre ?? item?.nombre)
        );
        return resultado;
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
        this.selectorFamiliarPlantillas = [];
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
        pendiente: EspecialidadMagicaPendiente,
        escuelaFija: EscuelaConjuros | null
    ): Promise<SelectorEspecialidadMagicaConfirmacion | null> {
        this.selectorEspecialidadClaseNombre = `${clase?.Nombre ?? ''}`.trim();
        this.selectorEspecialidadRequiereArcano = !!pendiente?.requiereArcano;
        this.selectorEspecialidadRequierePsionico = !!pendiente?.requierePsionico;
        this.selectorEspecialidadEscuelaFija = escuelaFija;
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
        this.selectorEspecialidadEscuelaFija = null;

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
            const seleccion = await this.abrirSelectorClaseOpcional(grupo);
            if (!seleccion)
                return null;
            selecciones[grupo.grupo] = `${seleccion}`;
        }

        return selecciones;
    }

    /**
     * El extra de cada aptitud del nivel que lo pide («Elegir»: el elemento de la senda del asenda), con el selector de
     * extras. Las opciones son los extras del especial sin los que el personaje ya tiene en esa aptitud. `null` si se
     * cancela o si una aptitud no tiene ningún extra que elegir.
     */
    private async solicitarExtrasEspecialesClase(pendientes: ClaseEspecialExtraPendiente[]): Promise<SeleccionExtrasEspecialesClase | null> {
        const selecciones: SeleccionExtrasEspecialesClase = {};
        for (const pendiente of pendientes) {
            const elegidosEnEsteNivel = Object.entries(selecciones)
                .filter(([clave]) => pendientes.find((item) => item.clave === clave)?.idEspecial === pendiente.idEspecial)
                .map(([, elegido]) => elegido.idExtra);
            const especial = await this.cargarEspecialDelNivel(pendiente.idEspecial);
            const extras = extrasElegiblesEspecial(especial, [...this.nuevoPSvc.idsExtraDeAptitud(pendiente.idEspecial), ...elegidosEnEsteNivel]);
            if (extras.length < 1) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'No se puede aplicar la clase',
                    text: `No hay ningún extra que elegir para ${pendiente.nombre}.`,
                    showConfirmButton: true,
                });
                return null;
            }

            const valor = await this.abrirSelectorModalExtra(pendiente.nombre, '', extras.map((extra) => ({ valor: extra.nombre, descripcion: '' })));
            const elegido = extras.find((extra) => normalizarTexto(extra.nombre) === normalizarTexto(valor ?? ''));
            if (!elegido)
                return null;
            selecciones[pendiente.clave] = { idExtra: elegido.id, extra: elegido.nombre };
        }
        return selecciones;
    }

    private async cargarEspecialDelNivel(idEspecial: number): Promise<EspecialClaseDetalle | null> {
        try {
            return await firstValueFrom(this.especialSvc.getEspecial(idEspecial).pipe(take(1)));
        } catch {
            return null;
        }
    }

    private abrirSelectorClaseOpcional(grupo: ClaseGrupoOpcionalPendiente): Promise<string | null> {
        this.selectorClaseOpcionalTitulo = `Grupo opcional ${grupo?.grupo ?? '?'}`;
        this.selectorClaseOpcionalDescripcion = 'Elige una opción para continuar con el nivel de clase.';
        this.selectorClaseOpcionalOpciones = (grupo?.opciones ?? []).map((opcion) => ({
            clave: `${opcion?.clave ?? ''}`.trim(),
            tipo: opcion?.tipo === 'especial' ? 'especial' : 'dote',
            nombre: `${opcion?.nombre ?? ''}`.trim(),
            extra: `${opcion?.extra ?? ''}`.trim(),
            ...(opcion?.bloqueada ? { bloqueada: true, motivo: `${opcion?.motivo ?? ''}`.trim() } : {}),
        }));
        this.modalSelectorClaseOpcionalAbierto = true;

        return new Promise<string | null>((resolve) => {
            this.resolverSelectorClaseOpcional = resolve;
        });
    }

    onConfirmarSelectorClaseOpcional(clave: string): void {
        const seleccion = `${clave ?? ''}`.trim();
        this.cerrarSelectorClaseOpcionalContexto(seleccion.length > 0 ? seleccion : null);
    }

    onCerrarModalSelectorClaseOpcional(): void {
        this.cerrarSelectorClaseOpcionalContexto(null);
    }

    private cerrarSelectorClaseOpcionalContexto(resultado: string | null): void {
        this.modalSelectorClaseOpcionalAbierto = false;
        this.selectorClaseOpcionalTitulo = 'Grupo opcional';
        this.selectorClaseOpcionalDescripcion = 'Elige una opción para continuar con el nivel de clase.';
        this.selectorClaseOpcionalOpciones = [];

        const resolver = this.resolverSelectorClaseOpcional;
        this.resolverSelectorClaseOpcional = null;
        if (resolver)
            resolver(resultado);
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

    getClaseFilaCss(item: ClaseListadoItem): string {
        const clases = ['fila-clase', 'creacion-fila-abrible'];
        if (Number(this.claseSeleccionadaId) === Number(item.clase.Id))
            clases.push('creacion-fila-abierta');
        if (item.campaignBlockedReason)
            clases.push('fila-clase--campana-bloqueada');
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
                    Consultar el listado no cambia nada por sí mismo. El personaje solo pasará a no oficial cuando
                    confirmes una o más ventajas o desventajas.
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

    abrirInfoAlineamientoRacial(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();

        const feedback = [
            ...this.advertenciasRazaPreview,
            ...this.conflictosDurosRazaPreview,
            ...(this.tieneConflictoDuroRazaBasicos
                ? ['Si continúas con esta combinación, el personaje se marcará como homebrew (no oficial).']
                : []),
        ];

        this.abrirModalInformacionBasicos(
            'Alineamiento racial',
            'balance',
            [
                {
                    titulo: 'Preferencias de la raza',
                    items: this.tienePreferenciasRazaVisibles
                        ? this.preferenciasRazaItems.map((pref) => `${pref.etiqueta}: ${pref.valor}`)
                        : [],
                    lineas: this.tienePreferenciasRazaVisibles
                        ? []
                        : ['Sin preferencias de alineamiento aplicables.'],
                },
                {
                    titulo: feedback.length > 0 ? 'Estado actual' : '',
                    items: feedback,
                    lineas: feedback.length > 0
                        ? []
                        : ['El alineamiento actual no entra en conflicto con las preferencias raciales visibles.'],
                },
            ]
        );
    }

    abrirInfoEdadRacial(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();

        this.abrirModalInformacionBasicos(
            'Rangos de edad',
            'schedule',
            [
                {
                    titulo: 'Edades de la raza',
                    items: this.edadRangosItems,
                },
                {
                    titulo: 'Etapa actual',
                    lineas: [this.etapaEdadActual, this.edadMensajeContextual],
                },
            ]
        );
    }

    onCerrarModalInformacionBasicos(): void {
        this.modalInformacionBasicosAbierto = false;
        this.informacionBasicosModalTitulo = '';
        this.informacionBasicosModalIcono = 'info';
        this.informacionBasicosModalSecciones = [];
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
        this.catalogoIdiomasAdicionales = this.nuevoPSvc.filtrarIdiomasAdicionalesPermitidos(this.catalogoIdiomasCompleto);
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
        this.catalogoIdiomasAdicionales = null;
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
            .some((n) => normalizarTexto(n) === normalizarTexto(nombre));
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
        return esTextoExtraPorElegir(materia) ? '' : materia;
    }

    getMejoraVisible(item: VentajaDetalle): string {
        const mejora = `${this.getMejoraTexto(item) ?? ''}`.trim();
        return mejora === '-' ? '' : mejora;
    }

    getDisipableVisible(item: VentajaDetalle): string {
        return item.Disipable ? 'Sí' : '';
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
                this.plantillasBloqueadasCampana = [];
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

    private get effectiveSelectedCampaignPolicy(): CampaignCreationPolicy | null {
        // A un PNJ no le aplica la política de creación de la campaña (contrato de los dragones jugables).
        if (!this.hasSelectedCampaignContext || this.esPnjCreacion)
            return null;
        return {
            ...DEFAULT_CAMPAIGN_CREATION_POLICY,
            ...(this.selectedCampaignPolicy ?? {}),
        };
    }

    private get isSelectedCampaignActiveMaster(): boolean {
        const actorUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        const activeMasterUid = `${this.selectedCampaignActiveMasterUid ?? ''}`.trim();
        return actorUid.length > 0 && activeMasterUid.length > 0 && actorUid === activeMasterUid;
    }

    private get hasSelectedCampaignContext(): boolean {
        return normalizarTexto(this.Personaje?.Campana ?? '') !== normalizarTexto('Sin campaña');
    }

    private get canIgnoreAlignmentRestrictionsForCurrentContext(): boolean {
        if (!this.hasSelectedCampaignContext)
            return true;
        return this.effectiveSelectedCampaignPolicy?.permitirIgnorarRestriccionesAlineamiento === true;
    }

    private getCurrentCampaignHomebrewMode(policy: CampaignCreationPolicy | null): CampaignHomebrewMode {
        if (!policy)
            return 'unrestricted';
        if (policy.permitirHomebrewGeneral === true)
            return 'unrestricted';

        const maxSources = this.normalizarCampaignMaxSources(policy.maxFuentesHomebrewGeneralesPorPersonaje);
        if (maxSources !== null) {
            if (maxSources <= 0)
                return 'forbidden';
            return 'limited';
        }

        return policy.permitirHomebrewGeneral === false ? 'forbidden' : 'unrestricted';
    }

    private hasCampaignBlockersForBasicos(): boolean {
        if (!this.hasSelectedCampaignContext || !this.selectedCampaignPolicyResolved)
            return false;
        return this.getCampaignCreationValidation().blockers.length > 0;
    }

    private normalizarCampaignMaxSources(value: number | null | undefined): number | null {
        if (value === null || value === undefined)
            return null;
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return null;
        return Math.max(0, parsed);
    }

    private normalizarCampaignMaxNep(value: number | null | undefined): number | null {
        if (value === null || value === undefined || `${value}`.trim() === '')
            return null;
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return null;
        return Math.max(0, parsed);
    }

    private buildCampaignHomebrewSource(
        categoria: CampaignHomebrewSourceCategory,
        rawId: number,
        rawNombre: string
    ): CampaignHomebrewSource | null {
        const id = Number(rawId);
        const nombre = `${rawNombre ?? ''}`.trim();
        if (!Number.isFinite(id) || id <= 0 || nombre.length < 1)
            return null;
        return {
            key: `${categoria}:${id}`,
            categoria,
            id,
            nombre,
        };
    }

    private collectCampaignHomebrewSources(): CampaignHomebrewSource[] {
        const sources = new Map<string, CampaignHomebrewSource>();
        const addSource = (source: CampaignHomebrewSource | null): void => {
            if (!source || sources.has(source.key))
                return;
            sources.set(source.key, source);
        };

        if (this.razaSeleccionada?.Oficial === false) {
            addSource(this.buildCampaignHomebrewSource('raza', Number(this.razaSeleccionada?.Id ?? 0), `${this.razaSeleccionada?.Nombre ?? ''}`));
        }

        if (this.nuevoPSvc.RazaBaseSeleccionadaCompleta?.Oficial === false) {
            addSource(this.buildCampaignHomebrewSource(
                'raza_base',
                Number(this.nuevoPSvc.RazaBaseSeleccionadaCompleta?.Id ?? 0),
                `${this.nuevoPSvc.RazaBaseSeleccionadaCompleta?.Nombre ?? ''}`
            ));
        }

        if (this.deidadSeleccionadaDetalle?.Oficial === false) {
            addSource(this.buildCampaignHomebrewSource('deidad', Number(this.deidadSeleccionadaDetalle?.Id ?? 0), `${this.deidadSeleccionadaDetalle?.Nombre ?? ''}`));
        }

        (this.plantillasSeleccionadas ?? [])
            .filter((plantilla) => plantilla?.Oficial === false)
            .forEach((plantilla) => {
                addSource(this.buildCampaignHomebrewSource('plantilla', Number(plantilla?.Id ?? 0), `${plantilla?.Nombre ?? ''}`));
            });

        const clasesByNombre = new Map<string, Clase>();
        (this.catalogoClases ?? []).forEach((clase) => {
            const key = normalizarTexto(clase?.Nombre ?? '');
            if (key.length > 0 && !clasesByNombre.has(key))
                clasesByNombre.set(key, clase);
        });
        (this.Personaje?.desgloseClases ?? []).forEach((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            const key = normalizarTexto(nombre);
            const clase = key.length > 0 ? (clasesByNombre.get(key) ?? null) : null;
            if (clase?.Oficial === false) {
                addSource(this.buildCampaignHomebrewSource('clase', Number(clase?.Id ?? 0), nombre));
            }
        });

        (this.Personaje?.DotesContextuales ?? [])
            .filter((entrada) => entrada?.Contexto?.Entidad === 'personaje')
            .filter((entrada) => entrada?.Dote?.Oficial === false)
            .forEach((entrada) => {
                addSource(this.buildCampaignHomebrewSource('dote', Number(entrada?.Dote?.Id ?? 0), `${entrada?.Dote?.Nombre ?? ''}`));
            });

        return Array.from(sources.values());
    }

    private getCampaignSourceCategoryLabel(categoria: CampaignHomebrewSourceCategory): string {
        if (categoria === 'raza')
            return 'Raza';
        if (categoria === 'raza_base')
            return 'Raza base';
        if (categoria === 'deidad')
            return 'Deidad';
        if (categoria === 'plantilla')
            return 'Plantilla';
        if (categoria === 'clase')
            return 'Clase';
        return 'Dote';
    }

    private getCampaignCreationValidation(): CampaignCreationValidationResult {
        const policy = this.effectiveSelectedCampaignPolicy;
        const nepLimit = this.normalizarCampaignMaxNep(policy?.nepMaximoPersonajeNuevo ?? null);
        const currentNep = Math.max(0, Math.trunc(Number(this.Personaje?.NEP ?? 0)));
        const mode = this.getCurrentCampaignHomebrewMode(policy);
        const maxSources = mode === 'unrestricted'
            ? null
            : this.normalizarCampaignMaxSources(policy?.maxFuentesHomebrewGeneralesPorPersonaje ?? null);
        const sources = this.collectCampaignHomebrewSources();
        const sourceKeys = new Set(sources.map((source) => source.key));
        const sourceCount = sources.length;
        const remainingSources = mode === 'limited' && maxSources !== null
            ? Math.max(0, maxSources - sourceCount)
            : null;
        const allowsVentajasDesventajas = policy?.permitirVentajasDesventajas !== false;
        const ventajasCount = this.flujoVentajas.seleccionVentajas.length + this.flujoVentajas.seleccionDesventajas.length;
        const blocksExistingNep = !this.isSelectedCampaignActiveMaster && nepLimit !== null && currentNep > nepLimit;
        const blocksExistingHomebrew = mode === 'forbidden'
            ? sourceCount > 0
            : mode === 'limited' && maxSources !== null && sourceCount > maxSources;
        const blocksExistingVentajas = !allowsVentajasDesventajas && ventajasCount > 0;
        const blockers: string[] = [];
        const fuentesTexto = sources
            .map((source) => `${this.getCampaignSourceCategoryLabel(source.categoria)}: ${source.nombre}`)
            .join(', ');

        if (blocksExistingNep) {
            blockers.push(`La campaña limita el NEP de personajes nuevos a ${nepLimit} y este personaje tiene NEP ${currentNep}.`);
        }

        if (blocksExistingHomebrew) {
            if (mode === 'forbidden') {
                blockers.push(`La campaña no permite homebrew general y el personaje ya usa ${fuentesTexto}.`);
            } else if (maxSources !== null) {
                blockers.push(`La campaña solo permite ${maxSources} fuente(s) homebrew y el personaje ya usa ${sourceCount}: ${fuentesTexto}.`);
            }
        }

        if (blocksExistingVentajas) {
            blockers.push(`La campaña no permite ventajas y desventajas y el personaje ya tiene ${ventajasCount} selección(es) en ese sistema.`);
        }

        return {
            mode,
            nepLimit,
            currentNep,
            maxSources,
            sources,
            sourceKeys,
            sourceCount,
            remainingSources,
            allowsVentajasDesventajas,
            blocksExistingNep,
            blocksExistingHomebrew,
            blocksExistingVentajas,
            blockers,
        };
    }

    private getCampaignBlockedReasonForCandidate(
        categoria: CampaignHomebrewSourceCategory,
        rawId: number,
        rawNombre: string,
        isHomebrew: boolean
    ): string | null {
        if (!isHomebrew)
            return null;

        const source = this.buildCampaignHomebrewSource(categoria, rawId, rawNombre);
        if (!source)
            return null;

        const validation = this.getCampaignCreationValidation();
        if (validation.sourceKeys.has(source.key))
            return null;
        if (validation.mode === 'unrestricted')
            return null;
        if (validation.mode === 'forbidden')
            return 'bloqueada por campaña: no permite homebrew';
        if (validation.maxSources !== null && validation.sourceCount >= validation.maxSources)
            return `bloqueada por campaña: límite de ${validation.maxSources} fuente(s) homebrew alcanzado`;
        return null;
    }

    private async ensureCampaignCreationRulesSatisfied(context: 'basicos' | 'finalizacion'): Promise<boolean> {
        if (!await this.ensureSelectedCampaignPolicyReady())
            return false;

        const validation = this.getCampaignCreationValidation();
        if (validation.blockers.length < 1)
            return true;

        const title = context === 'finalizacion'
            ? 'La campaña bloquea la finalización'
            : 'La campaña bloquea continuar';
        const detailHtml = validation.blockers.map((blocker) => `<li>${blocker}</li>`).join('');
        const sourcesHtml = validation.sources.length > 0
            ? `<p style="text-align:left; margin: 8px 0 6px 0;"><strong>Fuentes homebrew detectadas</strong></p><ul style="text-align:left; margin-top: 4px;">${validation.sources.map((source) => `<li>${this.getCampaignSourceCategoryLabel(source.categoria)}: ${source.nombre}</li>`).join('')}</ul>`
            : '';

        await Swal.fire({
            icon: 'warning',
            title,
            html: `<p style="text-align:left; margin: 0 0 6px 0;"><strong>Debes corregir estas incompatibilidades antes de seguir.</strong></p><ul style="text-align:left; margin-top: 4px;">${detailHtml}</ul>${sourcesHtml}`,
            confirmButtonText: 'Entendido',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
        return false;
    }

    private syncCampaignPolicyDependentState(): void {
        this.asegurarPasoCompatibleConCampania();
        this.recalcularPlantillasVisibles();
        this.recalcularClasesVisibles();
        this.recalcularOficialidad();
        this.sincronizarTabConPaso();
    }

    private asegurarPasoCompatibleConCampania(): void {
        if (this.flujo.pasoActual === 'ventajas' && this.campaignForbidsAdvantages) {
            this.nuevoPSvc.actualizarPasoActual('clases');
        }
    }

    private async ensureSelectedCampaignPolicyReady(): Promise<boolean> {
        if (!this.hasSelectedCampaignContext)
            return true;

        if (!this.selectedCampaignPolicyResolved && !this.selectedCampaignPolicyLoading)
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
            this.selectedCampaignActiveMasterUid = null;
            this.selectedCampaignPolicyResolved = true;
            this.nuevoPSvc.aplicarRestriccionCampanaGenerador(null);
            this.selectedCampaignPolicyLoading = false;
            this.selectedCampaignPolicyRequestKey = '';
            this.syncCampaignPolicyDependentState();
            return;
        }

        const requestKey = `${campaignId}:${this.Personaje.Campana ?? ''}`;
        this.selectedCampaignPolicyRequestKey = requestKey;
        this.selectedCampaignPolicyLoading = true;
        this.selectedCampaignPolicyResolved = false;
        try {
            const detail = await this.campanaSvc.getCampaignDetail(campaignId);
            if (this.selectedCampaignPolicyRequestKey !== requestKey)
                return;
            this.selectedCampaignPolicy = detail?.politicaCreacion ?? null;
            this.selectedCampaignActiveMasterUid = `${detail?.activeMasterUid ?? ''}`.trim() || null;
            this.selectedCampaignPolicyResolved = true;
            this.nuevoPSvc.aplicarRestriccionCampanaGenerador(
                this.esPnjCreacion ? null : (detail?.politicaCreacion ?? null),
                { permitirOverride: this.isSelectedCampaignActiveMaster }
            );
        } catch {
            if (this.selectedCampaignPolicyRequestKey !== requestKey)
                return;
            this.selectedCampaignPolicy = null;
            this.selectedCampaignActiveMasterUid = null;
            this.selectedCampaignPolicyResolved = true;
            this.nuevoPSvc.aplicarRestriccionCampanaGenerador(
                {
                    tiradaMinimaCaracteristica: 3,
                    maxTablasDadosCaracteristicas: 1,
                }
            );
        } finally {
            if (this.selectedCampaignPolicyRequestKey === requestKey) {
                this.selectedCampaignPolicyLoading = false;
                this.syncCampaignPolicyDependentState();
            }
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
                        Id_tipo_arma: arma?.Tipo_arma?.Id ?? null,
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
                        Id_tipo_arma: grupo?.Tipo_arma?.Id ?? null,
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
                this.refreshBasicosDerivedState();
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
                this.refreshBasicosDerivedState();
            },
        });
    }

    /**
     * Los catálogos de las cifras de la creación: la tabla de carga y los tamaños con sus multiplicadores (la carga), los
     * subtipos con su ajuste de nivel (el NEP) y los tipos de dado (la escalera de dados de las plantillas).
     */
    private cargarCatalogosCifras(): void {
        this.catalogosCifrasSubs.forEach((sub) => sub.unsubscribe());
        this.catalogosCifrasSubs = [];
        const escuchar = <T>(origen: Observable<T[]> | undefined, aplicar: (items: T[]) => void) => {
            if (origen)
                this.catalogosCifrasSubs.push(origen.subscribe({ next: (items) => aplicar(items ?? []), error: () => aplicar([]) }));
        };
        escuchar(this.tamanoSvc?.getCapacidadesCarga(), (filas) => this.nuevoPSvc.setTablaCarga(filas));
        escuchar(this.tamanoSvc?.getTamanos(), (tamanos) => this.nuevoPSvc.setCatalogoTamanos(tamanos));
        escuchar(this.subtipoSvc?.getSubtipos(), (subtipos) => this.nuevoPSvc.setCatalogoSubtipos(subtipos));
        escuchar(this.razaCatalogosSvc?.getTiposDado(), (tipos) => this.nuevoPSvc.setCatalogoTiposDado(tipos));
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
        const texto = normalizarTexto(this.filtroClasesTexto);
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
                const nombreNorm = normalizarTexto(nombre);
                const descNorm = normalizarTexto(descripcion);
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
            const campaignBlockedReason = this.getCampaignBlockedReasonForCandidate(
                'clase',
                claseId,
                nombre,
                clase?.Oficial === false
            );
            const elegiblePorReglasBase = evaluacion.estado === 'eligible' || bloqueoSoloAlineamiento;
            if (!elegiblePorReglasBase && !campaignBlockedReason)
                return;
            const puedeAplicarse = elegiblePorReglasBase && !campaignBlockedReason;

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
                campaignBlockedReason,
            });
        });

        evaluadas.sort((a, b) => {
            const bloqueA = this.getBloqueOrdenClase(a);
            const bloqueB = this.getBloqueOrdenClase(b);
            if (bloqueA !== bloqueB)
                return bloqueA - bloqueB;
            if (b.siguienteNivel !== a.siguienteNivel)
                return b.siguienteNivel - a.siguienteNivel;
            return compararTexto(a.clase.Nombre, b.clase.Nombre);
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
                && !clase?.Conjuros?.Psionicos;
        }
        if (this.filtroClasesTipoLanzador === 'arcano')
            return !!clase?.Conjuros?.Arcanos;
        if (this.filtroClasesTipoLanzador === 'divino')
            return !!clase?.Conjuros?.Divinos;
        return !!clase?.Conjuros?.Psionicos;
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
        const nombreNorm = normalizarTexto(nombreClase);
        if (nombreNorm.length < 1)
            return 0;
        const encontrada = (this.Personaje?.desgloseClases ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
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

    getClaseNivelChipCss(item: ClaseListadoItem): string {
        return Number(item?.siguienteNivel ?? 0) > 1 ? 'good' : '';
    }

    getClaseSalvacionChipCss(value: number): string {
        return Number(value ?? 0) > 0 ? 'good' : '';
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
        const fortaleza = (primerEntero(detalleSiguiente.Salvaciones?.Fortaleza) ?? 0)
            - (primerEntero(detalleAnterior?.Salvaciones?.Fortaleza) ?? 0);
        const reflejos = (primerEntero(detalleSiguiente.Salvaciones?.Reflejos) ?? 0)
            - (primerEntero(detalleAnterior?.Salvaciones?.Reflejos) ?? 0);
        const voluntad = (primerEntero(detalleSiguiente.Salvaciones?.Voluntad) ?? 0)
            - (primerEntero(detalleAnterior?.Salvaciones?.Voluntad) ?? 0);

        return {
            fortaleza,
            reflejos,
            voluntad,
        };
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
            return compararTexto(a.nombre, b.nombre);
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

    /** El extra de una dote o un especial de un nivel de clase. Sin extra, la API da `null` (antes, «No aplica»). */
    private normalizarExtraBeneficio(extraRaw: string): string {
        return `${extraRaw ?? ''}`.trim();
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
        const normalizado = normalizarTexto(limpio).replace(/\s+/g, ' ');
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

        // MJ cap. 3: el clérigo (las clases con `Alineamiento_deidad`), a un paso de su deidad y neutral solo si ella lo es.
        const motivoDeidad = clase?.Alineamiento_deidad === true
            ? incumpleAlineamientoDeidad(this.Personaje.Alineamiento ?? '', this.deidadSeleccionadaDetalle)
            : null;
        if (reglas.length < 1 && !motivoDeidad) {
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
        if (motivoDeidad)
            incompatibilidades.push(motivoDeidad);
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

        // La regla de la deidad no se puede saltar sin volver homebrew el personaje (prioridad «siempre»), ni una
        // preferencia «Siempre …» o «Nunca …» aunque la clase no traiga la prioridad.
        const preferenciaDura = [basico, ley, moral].some((texto) => {
            const normalizado = normalizarTexto(texto);
            return (normalizado.includes('siempre') || normalizado.includes('nunca')) && !normalizado.includes('casi');
        });
        const prioridad = motivoDeidad || preferenciaDura ? 3 : (Number(alineamientoClase?.Prioridad?.Id_prioridad ?? 0) || 0);
        if (incompatibilidades.length > 0) {
            const mensajes = [
                ...incompatibilidades,
                ...advertenciasParser,
            ];
            // Solo una restricción «siempre» obliga a confirmar y vuelve homebrew el personaje; una preferencia («casi
            // siempre», prioridad menor) se avisa en el tooltip sin más (auditoría de la matriz, 2026-10-26).
            return {
                estado: 'incompatible',
                etiqueta: 'Incompatible',
                tooltip: mensajes.join(' | '),
                prioridad,
                requiereConfirmacion: prioridad >= 3,
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

    /** Si una parte del alineamiento de una clase restringe algo. Sin dato, la API da `null` (antes, «No aplica»). */
    private esTextoAlineamientoConContenido(valor: string): boolean {
        const normalizado = normalizarTexto(valor ?? '');
        return normalizado.length > 0
            && normalizado !== 'ninguna preferencia'
            && normalizado !== 'cualquiera';
    }

    private parseReglaAlineamientoBasico(texto: string): { tipo: 'require' | 'forbid'; eje: 'basico'; valor: { ley: number; moral: number; }; texto: string; } | null {
        const normalizado = normalizarTexto(texto ?? '');
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

        const normalizado = normalizarTexto(texto);
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
            this.plantillasBloqueadasCampana = [];
            this.plantillasBloqueadasUnknown = [];
            this.plantillasBloqueadasFailed = [];
            return;
        }

        const search = normalizarTexto(this.filtroPlantillasTexto);
        const porManual = this.filtroPlantillasManual;
        const ctx = this.getContextoEvaluacionPlantillas(raza, this.incluirHomebrewPlantillasEfectivo);

        const elegibles: Plantilla[] = [];
        const bloqueadasCampana: { plantilla: Plantilla; evaluacion: PlantillaEvaluacionResultado; }[] = [];
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

            const nombre = normalizarTexto(plantilla.Nombre);
            if (search.length > 0 && !nombre.includes(search))
                return;

            if (porManual !== 'Cualquiera' && (plantilla.Manual?.Nombre ?? '') !== porManual)
                return;

            const evaluacion = evaluarElegibilidadPlantilla(plantilla, ctx);
            if (evaluacion.estado === 'eligible') {
                const campaignBlockedReason = this.getCampaignBlockedReasonForCandidate(
                    'plantilla',
                    idPlantilla,
                    `${plantilla?.Nombre ?? ''}`.trim(),
                    plantilla?.Oficial === false
                );
                if (campaignBlockedReason) {
                    bloqueadasCampana.push({
                        plantilla,
                        evaluacion: {
                            estado: 'blocked_failed',
                            razones: [campaignBlockedReason],
                            advertencias: [],
                        },
                    });
                    return;
                }
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
        this.plantillasBloqueadasCampana = bloqueadasCampana;
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
            incluirHomebrew,
            seleccionadas: this.plantillasSeleccionadas.map((plantilla) => ({
                Id: Number(plantilla.Id),
                Nombre: plantilla.Nombre,
                Nacimiento: !!plantilla.Nacimiento,
                Licantropia: esPlantillaLicantropa(plantilla),
            })),
            ...this.nuevoPSvc.getContextoRequisitosPlantillas(),
        };
    }
}

/** El aviso de siempre cuando una elección se salta una regla del sistema y vuelve homebrew el personaje. */
/** Un PJ en una edad sin ajuste: solo lo guarda el máster de su campaña saltándose sus reglas (`overrideReglasCampana`). */
const MOTIVO_EDAD_SIN_AJUSTE_CAMPANA = 'Un personaje jugador en una edad sin ajuste de nivel solo lo guarda el máster de su campaña, saltándose sus reglas.';
const AVISO_EDAD_SIN_AJUSTE_MASTER = `${MOTIVO_EDAD_SIN_AJUSTE_CAMPANA} En Básicos solo podrás elegir una campaña que dirijas.`;
const AVISO_HOMEBREW_REGLA_SALTADA = '<strong>Esta elección está saltándose una regla importante del sistema. El personaje quedará marcado como Homebrew y será una rareza excepcional en el mundo.</strong>';

/** La progresión de moldeado del paso de clases: las filas de su tabla con los especiales y el nivel que toma. */
interface ProgresionMoldeado {
    clase: Clase;
    filas: (FilaMoldeado & { especial: string; estado: 'hecho' | 'actual' | 'futuro'; })[];
}
