import {
    Component, EventEmitter, HostListener, Injector, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, forwardRef,
    inject,
} from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import {
    AlineamientoBasicoCatalogItem,
    AlineamientoCombinacionCatalogItem,
    PreferenciaLeyCatalogItem,
    PreferenciaMoralCatalogItem,
    PrioridadAlineamientoCatalogItem,
} from 'src/app/interfaces/alineamiento';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { ArmaDetalle } from 'src/app/interfaces/arma';
import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Dote } from 'src/app/interfaces/dote';
import { GrupoCompetencia } from 'src/app/interfaces/grupo-competencia';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { Manual } from 'src/app/interfaces/manual';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { Raza } from 'src/app/interfaces/raza';
import { DominioDetalle } from 'src/app/interfaces/dominio';
import { CategoriaEdadCatalogo, RazaCatalogItem, TipoDadoCatalogItem } from 'src/app/interfaces/raza-catalogos';
import { conOpcionSinValor } from 'src/app/services/utils/opcion-sin-valor';
import { RazaCreateListaLanzamiento, RazaCreateRequest } from 'src/app/interfaces/razas-api';
import { SubtipoResumen } from 'src/app/interfaces/subtipo';
import { Tamano } from 'src/app/interfaces/tamaño';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ArmaService } from 'src/app/services/arma.service';
import { CategoriaEdadService, porOrdenTipico } from 'src/app/services/categoria-edad.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DominioService } from 'src/app/services/dominio.service';
import { DoteService } from 'src/app/services/dote.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { RacialService } from 'src/app/services/racial.service';
import { NuevaRazaDraftContenido, NuevaRazaDraftService, NuevaRazaDraftV1 } from 'src/app/services/nueva-raza-draft.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { RazaService } from 'src/app/services/raza.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { recargandoPorCambioDeIdentidad } from 'src/app/services/platform-session.service';
import { UserService } from 'src/app/services/user.service';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { alternarControl, elegirEnControl, quitarFila, uidDeFila } from '../insercion-marco/filas-repetibles';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { CatalogosPendientes, EdicionDeCatalogo } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario, entero } from '../insercion-marco/errores-de-formulario';
import { ModoInsercion } from '../insercion-marco/insercion-marco.component';
import { OpcionCatalogo, nombreDeOpcion, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';
import { FilaDeLista, anadirALista, filasDeIds } from '../lista-de-catalogo/lista-de-catalogo.component';
import { RAZA } from 'src/app/services/utils/nombres-de-catalogo';
import { buildManiobrabilidadInfoSecciones } from 'src/app/services/utils/maniobrabilidad-info';
import { PrerrequisitoEditorHostComponent } from '../prerrequisito-editor/prerrequisito-editor-host.component';
import {
    PrerequisiteCatalogContext,
    PrerequisiteCatalogItem,
    PrerequisiteRowModel,
    PrerequisiteType,
    TipoEditorMutacion,
} from '../prerrequisito-editor/prerrequisito-editor.models';
import {
    arePrerequisitesIncomplete,
    claveEditorMutacion,
    esTipoDeMutacion,
    findCatalogName,
    getPrerequisiteDefinition,
    registrarTiposDeMutacion,
    tipoDeMutacion,
} from '../prerrequisito-editor/prerrequisito-editor.registry';
import { CampoMutacion, ModeloMutacion, RazaCreateCambioMutacion, RazaCreatePrerrequisitoMutacion } from 'src/app/interfaces/razas-api';
import { ArmaNaturalService } from 'src/app/services/arma-natural.service';
import { PrerrequisitosTiposService } from 'src/app/services/prerrequisitos-tipos.service';
import { idsUnicosOrdenados, normalizarTexto, toIntOrNull, toNumberOrNull } from 'src/app/services/utils/normalizacion';
import { idTamanoMediano } from 'src/app/services/utils/tamano-efectivo';
import { TEXTO_SIN_ESPECIFICAR, USOS_SORTILEGA_INICIALES, textoOSinEspecificar } from 'src/app/services/utils/texto-sin-especificar';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA } from 'src/app/services/utils/habilidad-extra-visible';
import { porNombre } from 'src/app/services/utils/orden-texto';
import { FilaArmaNatural, cuerpoDeArmasNaturales, filasDeArmasNaturales, problemaDeArmasNaturales } from 'src/app/services/utils/armas-naturales';
import {
    EdadesDeRaza,
    categoriaVacia,
    cuerpoDeEdades,
    edadesDesdeRaza,
    filaDeRazaDesdePrimeraEdad,
    problemaDeEdades,
} from 'src/app/services/utils/raza-edades-formulario';

interface CrearRazaEmitPayload {
    idRaza: number;
    nombre: string;
}

interface CrearRacialEmitPayload {
    idRacial: number;
    nombre: string;
    racial: RacialDetalle;
    tienePrerrequisitoRaza?: boolean;
    prerrequisitoRazaEnCreacion?: boolean;
}

interface CatalogItem {
    Id: number;
    Nombre: string;
}

interface HabilidadBaseRow {
    uid: string;
    id_habilidad: number;
    cantidad: number;
    id_extra: number;
    varios: string;
    /** Lo que suma además solo en un caso (`condicion`, «bajo tierra»): los dos o ninguno. */
    cantidad_condicional?: number;
    condicion?: string;
    busqueda?: string;
    extraBusqueda?: string;
}

interface HabilidadCustomRow {
    uid: string;
    id_habilidad: number;
    cantidad: number;
    busqueda?: string;
}

interface DoteRow {
    uid: string;
    id_dote: number;
    id_extra: number;
    busqueda?: string;
    extraBusqueda?: string;
}

interface RacialRow {
    uid: string;
    id_racial: number;
    opcional: number;
    busqueda?: string;
}

interface SortilegioRow {
    uid: string;
    id_conjuro: number;
    nivel_lanzador: number;
    usos_diarios: string;
    descripcion: string;
    busqueda?: string;
}

/** Una lista que la raza lanza además como arcana con su lanzamiento racial: de una clase o de un dominio. */
interface ListaLanzamientoFila {
    tipo: 'clase' | 'dominio';
    id: number;
}

/** Las listas de ids del formulario que se editan con `<app-lista-de-catalogo>` (`anadirA`, `quitarDe`). */
type ListaDeRaza = 'clases_asociadas' | 'idiomas_adicionales';

type RelacionSeleccionKey =
    | 'subtiposSeleccionados'
    | 'idiomasSeleccionados'
    | 'armasCompetenciaSeleccionadas'
    | 'armadurasCompetenciaSeleccionadas'
    | 'gruposArmaSeleccionados'
    | 'gruposArmaduraSeleccionados';

type AlineamientoModo = 'basico' | 'preferencia';
/** Un tipo de prerrequisito de mutación para el selector de tipos: los del modelo de la API, por su nombre. */
interface MutacionPrerequisiteOption {
    key: TipoEditorMutacion;
    readonly label: string;
}

/**
 * Una fila de «Cambios sobre la raza base» (`cambios_mutacion[]`, fase 3 de las razas mutadas): el campo del modelo, la
 * operación de las que admite, los pasos de tamaño y los elementos de la lista de la base que se quitan o se conservan.
 */
export interface CambioMutacionRow {
    uid: string;
    campo: string;
    operacion: string;
    valor: number | null;
    elementos: number[];
}

const NUEVA_RAZA_DRAFT_AUTOSAVE_MS = 1200;
const NUEVA_RAZA_DRAFT_DEBOUNCE_MS = 300;
const NUEVA_RAZA_MAX_STEP_INDEX = 5;
const HABILIDAD_EXTRA_ELEGIR: CatalogItem = { Id: 0, Nombre: 'Elegir' };

/**
 * Las opciones «sin X» del alta de razas (`conOpcionSinValor`): el alineamiento básico y las preferencias 0 «No aplica»,
 * la prioridad 0 «Sin prioridad» y la maniobrabilidad 0 «No vuela», con el id 0 que `POST /razas` sigue aceptando (comprueba
 * que la fila exista). Son el valor por defecto, como cuando la API las listaba.
 */
const SIN_ALINEAMIENTO_BASICO: AlineamientoBasicoCatalogItem = { Id: 0, Nombre: 'No aplica' };
const SIN_PREFERENCIA: PreferenciaLeyCatalogItem & PreferenciaMoralCatalogItem = { Id: 0, Nombre: 'No aplica', Descripcion: '' };
const SIN_PRIORIDAD: PrioridadAlineamientoCatalogItem = { Id: 0, Nombre: 'Sin prioridad', Descripcion: '' };
const SIN_VUELO: RazaCatalogItem = { Id: 0, Nombre: 'No vuela' };
/** La clase predilecta 0 de la base, «Cualquiera» (el humano y el semielfo), que el catálogo de clases no lista. */
const CUALQUIER_CLASE: CatalogItem = { Id: 0, Nombre: 'Cualquiera' };
/**
 * «Sin clase predilecta» en el formulario: el cuerpo manda `id_clase_predilecta: null` y la API lo guarda en su fila de
 * relleno «Ninguna» (las razas cuyo libro no les da una, como los dragones: todas sus clases cuentan para la penalización
 * de PX). El -1 solo vive en el formulario.
 */
const SIN_CLASE_PREDILECTA_FORMULARIO: CatalogItem = { Id: -1, Nombre: 'Ninguna (sin clase predilecta)' };

/** El peso más alto que admite la API (`numeric(7, 2)`; el centauro de *Races of the Wild* pesa 1.060,52 kg). */
const PESO_MAXIMO = 99999.99;

/** El VD de la raza más alto que admite la API (`razas.vd`, `decimal(5, 2)`). */
const VD_RAZA_MAXIMO = 999.99;

/**
 * El VD de la raza (`raza.vd`): vacío, sin dato; si no, mayor que 0 y hasta 999,99, como la API (`400 peticion_no_valida`
 * con `field` `raza.vd`). Solo vale con DG raciales: sin ellos el campo no se enseña ni se manda.
 */
function vdDeRazaValidator(control: AbstractControl): ValidationErrors | null {
    const vd = toNumberOrNull(control.value);
    if (vd === null)
        return `${control.value ?? ''}`.trim().length > 0 ? { vdDeRaza: true } : null;
    return vd > 0 && vd <= VD_RAZA_MAXIMO ? null : { vdDeRaza: true };
}

/**
 * Los catálogos de los que depende el cuerpo que se manda (el alineamiento que se resuelve, los extras de habilidad, el
 * tipo de dado…). Al modificar, la raza se rellena cuando ya están, para que guardar sin tocar nada mande lo que llegó.
 */
const CATALOGOS_PARA_MODIFICAR = [
    'alineamientos', 'alineamientosBasicos', 'prioridades', 'preferenciasLey', 'preferenciasMoral', 'habilidades',
    'tiposDado', 'tiposCriatura', 'maniobrabilidades', 'tamanos', 'clases', 'modeloMutacion',
] as const;
type CatalogoParaModificar = typeof CATALOGOS_PARA_MODIFICAR[number];

/**
 * Los campos del formulario por su clave en el cuerpo del alta (`raza.<campo>` y las listas), con su etiqueta y su paso:
 * un error de la API con `field` lleva a su campo y a su paso (`ErroresDeFormulario`).
 */
const CAMPOS_RAZA: CamposDeFormulario = {
    nombre: { etiqueta: 'Nombre', paso: 0 },
    id_manual: { etiqueta: 'Manual', paso: 0 },
    pagina: { etiqueta: 'Página', paso: 0 },
    id_clase_predilecta: { etiqueta: 'Clase predilecta', paso: 0 },
    oficial: { etiqueta: 'Oficial', paso: 0 },
    descripcion: { etiqueta: 'Descripción', paso: 0 },
    id_alineamiento: { etiqueta: 'Alineamiento', paso: 0 },
    ataques_naturales: { etiqueta: 'Ataques naturales', paso: 0 },
    armas_naturales: { etiqueta: 'Armas naturales', paso: 0 },
    id_tamano: { etiqueta: 'Tamaño', paso: 0 },
    id_tipo_criatura: { etiqueta: 'Tipo de criatura', paso: 0 },
    subtipos: { etiqueta: 'Subtipos', paso: 0 },
    espacio: { etiqueta: 'Espacio', paso: 0 },
    alcance: { etiqueta: 'Alcance', paso: 0 },
    cuadrupedo: { etiqueta: 'Cuadrúpedo', paso: 0 },
    correr: { etiqueta: 'Correr', paso: 0 },
    nadar: { etiqueta: 'Nadar', paso: 0 },
    volar: { etiqueta: 'Volar', paso: 0 },
    id_maniobrabilidad: { etiqueta: 'Maniobrabilidad', paso: 0 },
    trepar: { etiqueta: 'Trepar', paso: 0 },
    excavar: { etiqueta: 'Excavar', paso: 0 },
    mod_fue: { etiqueta: 'Fue', paso: 1 },
    mod_des: { etiqueta: 'Des', paso: 1 },
    mod_cons: { etiqueta: 'Con', paso: 1 },
    mod_int: { etiqueta: 'Int', paso: 1 },
    mod_sab: { etiqueta: 'Sab', paso: 1 },
    mod_car: { etiqueta: 'Car', paso: 1 },
    dgs_extra: { etiqueta: 'DG extra', paso: 1 },
    ataque_base: { etiqueta: 'Ataque base DG', paso: 1 },
    dotes_dg: { etiqueta: 'Dotes por DG', paso: 1 },
    puntos_hab: { etiqueta: 'Puntos de habilidad', paso: 1 },
    puntos_hab_mult: { etiqueta: 'Multiplicador de puntos de habilidad', paso: 1 },
    id_tipo_dado: { etiqueta: 'Tipo de dado', paso: 1 },
    id_tipo_criatura_dgs: { etiqueta: 'Tipo de criatura de DG', paso: 1 },
    altura_rango_inf: { etiqueta: 'Altura mín.', paso: 1 },
    altura_rango_sup: { etiqueta: 'Altura máx.', paso: 1 },
    peso_rango_inf: { etiqueta: 'Peso mín.', paso: 1 },
    peso_rango_sup: { etiqueta: 'Peso máx.', paso: 1 },
    edad_adulto: { etiqueta: 'Adulto', paso: 1 },
    edad_mediana: { etiqueta: 'Mediana edad', paso: 1 },
    edad_viejo: { etiqueta: 'Viejo', paso: 1 },
    edad_venerable: { etiqueta: 'Venerable', paso: 1 },
    edad_maxima_dados: { etiqueta: 'Dados de la edad máxima', paso: 1 },
    edad_maxima_caras: { etiqueta: 'Caras de la edad máxima', paso: 1 },
    edad_inicial_dados_1: { etiqueta: 'Dados de la edad inicial (grupo 1)', paso: 1 },
    edad_inicial_caras_1: { etiqueta: 'Caras de la edad inicial (grupo 1)', paso: 1 },
    edad_inicial_dados_2: { etiqueta: 'Dados de la edad inicial (grupo 2)', paso: 1 },
    edad_inicial_caras_2: { etiqueta: 'Caras de la edad inicial (grupo 2)', paso: 1 },
    edad_inicial_dados_3: { etiqueta: 'Dados de la edad inicial (grupo 3)', paso: 1 },
    edad_inicial_caras_3: { etiqueta: 'Caras de la edad inicial (grupo 3)', paso: 1 },
    vd: { etiqueta: 'VD de la raza', paso: 1 },
    vd_mod_clases_pj: { etiqueta: 'Ajuste del VD con clases de PJ', paso: 1 },
    vd_mod_clases_pnj: { etiqueta: 'Ajuste del VD con clases de PNJ', paso: 1 },
    clases_asociadas: { etiqueta: 'Clases asociadas', paso: 1 },
    armadura_natural: { etiqueta: 'Armadura natural', paso: 1 },
    varios_armadura: { etiqueta: 'Varios de armadura', paso: 1 },
    ajuste_nivel: { etiqueta: 'Ajuste de nivel', paso: 1 },
    fortaleza: { etiqueta: 'Fortaleza', paso: 1 },
    reflejos: { etiqueta: 'Reflejos', paso: 1 },
    voluntad: { etiqueta: 'Voluntad', paso: 1 },
    dotes_extra: { etiqueta: 'Dotes extra', paso: 1 },
    puntos_extra_1: { etiqueta: 'Puntos de habilidad extra al nivel 1', paso: 1 },
    puntos_extra: { etiqueta: 'Puntos de habilidad extra por nivel', paso: 1 },
    reduccion_dano: { etiqueta: 'Reducción de daño', paso: 1 },
    resistencia_conjuros: { etiqueta: 'Resistencia a conjuros', paso: 1 },
    resistencia_energia: { etiqueta: 'Resistencia a energía', paso: 1 },
    idiomas: { etiqueta: 'Idiomas', paso: 2 },
    idiomas_adicionales_cualquiera: { etiqueta: 'Cualquier idioma adicional', paso: 2 },
    idiomas_adicionales: { etiqueta: 'Idiomas adicionales', paso: 2 },
    competencias: { etiqueta: 'Competencias', paso: 2 },
    habilidades: { etiqueta: 'Habilidades', paso: 3 },
    dotes: { etiqueta: 'Dotes', paso: 3 },
    raciales: { etiqueta: 'Raciales', paso: 3 },
    sortilegios: { etiqueta: 'Sortilegios', paso: 3 },
    categorias_edad: { etiqueta: 'Categorías de edad', paso: 4 },
    pasos_edad: { etiqueta: 'Pasos de edad', paso: 4 },
    id_clase_lanzamiento: { etiqueta: 'Lanza como la clase', paso: 4 },
    nivel_lanzamiento: { etiqueta: 'Nivel de lanzamiento', paso: 4 },
    lanzamiento_listas: { etiqueta: 'Listas del lanzamiento', paso: 4 },
    mutada: { etiqueta: 'Raza mutada', paso: 5 },
    prerrequisitos_mutacion: { etiqueta: 'Prerrequisitos de mutación', paso: 5 },
    cambios_mutacion: { etiqueta: 'Cambios sobre la raza base', paso: 5 },
};


@Component({
    selector: 'app-nueva-raza',
    templateUrl: './nueva-raza.component.html',
    styleUrls: ['./nueva-raza.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevaRazaComponent) }],
})
export class NuevaRazaComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    private readonly destroy$ = new Subject<void>();
    private readonly catalogosParaModificar = new CatalogosPendientes<CatalogoParaModificar>(CATALOGOS_PARA_MODIFICAR);
    /** La raza que se modifica, tal como llegó (de ella salen los DG que no se ven sin DG raciales). */
    private razaCargada: Raza | null = null;
    private nextRowId: number = 1;
    private draftUidActivo: string = '';
    private draftAutosaveTimer: ReturnType<typeof setInterval> | null = null;
    private draftPersistTimer: ReturnType<typeof setTimeout> | null = null;
    private draftUltimaFirmaPersistida: string | null = null;
    private draftInicializacionHabilitada: boolean = false;
    private draftInicializado: boolean = false;
    private draftInicializando: boolean = false;
    private racialesPendientesRazaEnCreacionIds = new Set<number>();
    /** El catálogo de los elementos de una lista que lo carga solo si hace falta (las armas naturales). */
    private readonly injector = inject(Injector);
    private tiposArmasNaturales: PrerequisiteCatalogItem[] | null = null;

    /** «Insertar» o «Modificar» (la misma pantalla, con la raza cargada y «Guardar cambios»). */
    @Input() modo: ModoInsercion = 'crear';
    @Input() idRaza: number | null = null;
    /** La clave de su pestaña de «Modificar», con la que las pestañas le preguntan antes de cerrarse. */
    @Input() editorTabKey: string = '';
    @Output() razaCreada = new EventEmitter<CrearRazaEmitPayload>();
    @Output() razaActualizada = new EventEmitter<Raza>();
    @Output() cerrar = new EventEmitter<void>();
    @ViewChild('prerrequisitoMutacionHost') prerrequisitoMutacionHost?: PrerrequisitoEditorHostComponent;

    readonly edicion = new EdicionDeCatalogo<Raza>({
        nombre: RAZA,
        modo: () => this.modo,
        id: () => this.idRaza,
        obtener: (id) => this.razaSvc.getRazaFresca(id),
        antesDeHidratar: () => this.catalogosParaModificar.listos$,
        hidratar: (raza) => this.hidratarDesdeRaza(raza),
        foto: () => JSON.stringify(this.buildPayload()),
        destruir$: this.destroy$,
    });

    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS_RAZA,
        raiz: 'raza',
        control: (campo) => this.form.get(campo),
        firma: (campo) => JSON.stringify(this.form.get(campo)?.value ?? (this.buildPayload() as unknown as Record<string, unknown>)[campo] ?? null),
        irAPaso: (paso) => this.pasoActivoIndex = paso,
    });

    guardando: boolean = false;
    puedeCrear: boolean = false;
    razasExistentes: Raza[] = [];
    mensajePermisosInsuficientes: string = '';

    manuales: Manual[] = [];
    clases: Clase[] = [];
    tamanos: Tamano[] = [];
    tiposCriatura: TipoCriatura[] = [];
    alineamientos: AlineamientoCombinacionCatalogItem[] = [];
    alineamientosBasicos: AlineamientoBasicoCatalogItem[] = [];
    prioridadesAlineamiento: PrioridadAlineamientoCatalogItem[] = [];
    preferenciasLey: PreferenciaLeyCatalogItem[] = [];
    preferenciasMoral: PreferenciaMoralCatalogItem[] = [];
    subtipos: SubtipoResumen[] = [];
    idiomas: IdiomaDetalle[] = [];
    habilidades: HabilidadBasicaDetalle[] = [];
    habilidadesCustom: HabilidadBasicaDetalle[] = [];
    dotes: Dote[] = [];
    raciales: RacialDetalle[] = [];
    conjuros: Conjuro[] = [];
    dominios: DominioDetalle[] = [];
    opcionesManuales: OpcionCatalogo[] = [];
    opcionesClasesLanzamiento: OpcionCatalogo[] = [];
    opcionesClasesAsociadas: OpcionCatalogo[] = [];
    opcionesIdiomas: OpcionCatalogo[] = [];
    opcionesDominios: OpcionCatalogo[] = [];
    armas: ArmaDetalle[] = [];
    armaduras: ArmaduraDetalle[] = [];
    gruposArmas: GrupoCompetencia[] = [];
    gruposArmaduras: GrupoCompetencia[] = [];
    maniobrabilidades: RazaCatalogItem[] = [];
    tiposDado: TipoDadoCatalogItem[] = [];
    clasePredilectaBusqueda: string = '';
    tipoCriaturaDgsBusqueda: string = '';
    mostrarInfoAlineamiento: boolean = false;
    mostrarInfoTamano: boolean = false;
    mostrarInfoManiobrabilidad: boolean = false;
    modalNuevoRacialVisible: boolean = false;
    modalNuevoIdiomaVisible: boolean = false;
    customModalAbierto: boolean = false;
    customModalModo: 'crear' | 'editar' = 'crear';
    customModalRowUid: string = '';
    customModalHabilidad: HabilidadBasicaDetalle | null = null;

    subtiposSeleccionados: number[] = [];
    idiomasSeleccionados: number[] = [];
    armasCompetenciaSeleccionadas: number[] = [];
    armadurasCompetenciaSeleccionadas: number[] = [];
    gruposArmaSeleccionados: number[] = [];
    gruposArmaduraSeleccionados: number[] = [];

    relacionQueries: Record<RelacionSeleccionKey, string> = {
        subtiposSeleccionados: '',
        idiomasSeleccionados: '',
        armasCompetenciaSeleccionadas: '',
        armadurasCompetenciaSeleccionadas: '',
        gruposArmaSeleccionados: '',
        gruposArmaduraSeleccionados: '',
    };

    habilidadesBaseRows: HabilidadBaseRow[] = [];
    habilidadesCustomRows: HabilidadCustomRow[] = [];
    dotesRows: DoteRow[] = [];
    racialesRows: RacialRow[] = [];
    sortilegiosRows: SortilegioRow[] = [];
    /** Las edades de la raza (paso «Edades»): sus categorías, lo que gana en cada una y sus pasos. */
    edades: EdadesDeRaza = { categorias: [], pasos: [] };
    /** «La raza crece por edades»: con él apagado, el cuerpo va sin edades (las filas se guardan por si se vuelve a encender). */
    porEdades: boolean = false;
    categoriasEdadCatalogo: CategoriaEdadCatalogo[] = [];
    opcionesRaciales: OpcionCatalogo[] = [];
    opcionesConjuros: OpcionCatalogo[] = [];

    prerrequisitosMutacionRows: PrerequisiteRowModel[] = [];
    prerrequisitosMutacionSeleccionados: TipoEditorMutacion[] = [];
    /** Lo que admite una raza mutada (`GET /razas/mutaciones/modelo`): los tipos de prerrequisito y los campos. */
    modeloMutacion: ModeloMutacion | null = null;
    cambiosMutacionRows: CambioMutacionRow[] = [];
    selectorPrerrequisitosMutacionVisible: boolean = false;
    selectorPrerrequisitosMutacionFiltro: string = '';
    selectorPrerrequisitosMutacionTempKeys: TipoEditorMutacion[] = [];
    pasoActivoIndex: number = 0;
    /** Los pasos del marco común de las inserciones; se puede saltar a cualquiera (el paso se guarda en el borrador). */
    readonly pasos = ['Base y cuerpo', 'Valores', 'Relaciones', 'Rasgos', 'Edades', 'Mutación'];

    /** Los tipos de prerrequisito de mutación del modelo de la API (también los que solo existen como datos). */
    prerrequisitosMutacionOpciones: MutacionPrerequisiteOption[] = [];

    readonly prerrequisitosMutacionCatalogContext: PrerequisiteCatalogContext = {
        getCatalog: (type) => this.getCatalogoPrerrequisitoMutacion(type),
        getCatalogName: (type, id) => this.getNombreCatalogoPrerrequisitoMutacion(type, id),
        getDoteExtraOptions: () => [],
        dotePermiteExtra: () => false,
        getGlobalExtraOptions: () => [],
        habilidadPermiteExtra: () => false,
        especialPermiteExtra: () => false,
    };
    readonly ensureMutacionPrerequisiteCatalogs = async () => undefined;

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
        descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
        ataques_naturales: [TEXTO_SIN_ESPECIFICAR, [this.textoOpcionalValidator(1000)]],
        espacio: [5, [Validators.required, Validators.min(0), Validators.max(40)]],
        alcance: [5, [Validators.required, Validators.min(0), Validators.max(40)]],
        id_manual: [0, [Validators.min(1)]],
        pagina: [1, [Validators.required, Validators.min(0)]],
        // `null` hasta elegirla: la 0 es «Cualquiera», una clase predilecta de verdad.
        id_clase_predilecta: [null as number | null, [Validators.required, Validators.min(SIN_CLASE_PREDILECTA_FORMULARIO.Id)]],
        mod_fue: [0],
        mod_des: [0],
        mod_cons: [0],
        mod_int: [0],
        mod_sab: [0],
        mod_car: [0],
        varios_armadura: [0],
        armadura_natural: [0],
        correr: [30, [Validators.min(0), Validators.max(200)]],
        nadar: [0, [Validators.min(0), Validators.max(200)]],
        volar: [0, [Validators.min(0), Validators.max(200)]],
        id_maniobrabilidad: [0, [Validators.min(0)]],
        trepar: [0, [Validators.min(0), Validators.max(200)]],
        excavar: [0, [Validators.min(0), Validators.max(200)]],
        dotes_extra: [0, [Validators.min(0), Validators.max(10)]],
        puntos_extra_1: [0, [Validators.min(0), Validators.max(20)]],
        puntos_extra: [0, [Validators.min(0), Validators.max(20)]],
        id_tamano: [0, [Validators.min(1)]],
        // Sin máximo, como la API: el gigante de la montaña (Manual de monstruos 2) tiene +25.
        ajuste_nivel: [0, [Validators.min(0)]],
        reduccion_dano: [TEXTO_SIN_ESPECIFICAR, [this.textoOpcionalValidator(1000)]],
        resistencia_conjuros: [TEXTO_SIN_ESPECIFICAR, [this.textoOpcionalValidator(1000)]],
        resistencia_energia: [TEXTO_SIN_ESPECIFICAR, [this.textoOpcionalValidator(1000)]],
        // 0: el manual no lo da (las razas de los manuales de monstruos), como acepta la API.
        altura_rango_inf: [0, [Validators.min(0), Validators.max(10)]],
        altura_rango_sup: [0, [Validators.min(0), Validators.max(10)]],
        // Con decimales, hasta lo que cabe en la columna (`numeric(5, 2)`): el elfo pesa de 38,5 a 61,2 kg.
        peso_rango_inf: [0, [Validators.min(0), Validators.max(PESO_MAXIMO)]],
        peso_rango_sup: [0, [Validators.min(0), Validators.max(PESO_MAXIMO)]],
        edad_adulto: [0, [Validators.min(0)]],
        edad_mediana: [0, [Validators.min(0)]],
        edad_viejo: [0, [Validators.min(0)]],
        edad_venerable: [0, [Validators.min(0)]],
        // La edad máxima (Manual del jugador, tabla 6-5): los dados que se suman a la venerable (+2d20: 2 y 20; +4d%: 4 y
        // 100). 0 y 0: el manual no la da.
        edad_maxima_dados: [0, [Validators.min(0)]],
        edad_maxima_caras: [0, [Validators.min(0)]],
        // La edad inicial (tabla 6-4): los dados que se suman a la mayoría de edad en cada grupo de clases (el humano, grupo 1,
        // +1d4: 1 y 4). 0 y 0: el manual no la da.
        edad_inicial_dados_1: [0, [Validators.min(0)]],
        edad_inicial_caras_1: [0, [Validators.min(0)]],
        edad_inicial_dados_2: [0, [Validators.min(0)]],
        edad_inicial_caras_2: [0, [Validators.min(0)]],
        edad_inicial_dados_3: [0, [Validators.min(0)]],
        edad_inicial_caras_3: [0, [Validators.min(0)]],
        // El VD de sus PNJ (Guía del DM, págs. 37-38; MM, págs. 293-294). Vacío (`null`): sin dato o la regla general. El
        // validador del VD de la raza lo pone `sincronizarCamposDgsExtra`: sin DG raciales no se enseña ni se manda.
        vd: [null as number | null],
        // Enteros de −10 a +10 o vacío (la regla general), como la API (`raza.vd_mod_clases_*`; los manuales dan −1, 0 o +1).
        vd_mod_clases_pj: [null as number | null, [entero, Validators.min(-10), Validators.max(10)]],
        vd_mod_clases_pnj: [null as number | null, [entero, Validators.min(-10), Validators.max(10)]],
        clases_asociadas: [[] as FilaDeLista[]],
        // Las armas naturales como dato (`armas_naturales`; el texto de `ataques_naturales` es su descripción).
        armas_naturales: [[] as FilaArmaNatural[]],
        id_tipo_criatura: [0, [Validators.min(1)]],
        ataque_base: [0],
        fortaleza: [0],
        reflejos: [0],
        voluntad: [0],
        dgs_extra: [0, [Validators.min(0)]],
        id_tipo_dado: [0],
        id_tipo_criatura_dgs: [0],
        dotes_dg: [0, [Validators.min(0)]],
        puntos_hab: [0],
        puntos_hab_mult: [0],
        mutada: [false],
        id_alineamiento: [0, [this.alineamientoResueltoValidator()]],
        alineamiento_modo: ['basico' as AlineamientoModo],
        id_alineamiento_basico: [0],
        id_prioridad_alineamiento: [0, [Validators.min(0)]],
        id_preferencia_ley: [0],
        id_preferencia_moral: [0],
        oficial: [true],
        cuadrupedo: [false],
        // Los idiomas adicionales por Inteligencia (MJ cap. 2): cualquiera no secreto (el humano) o los de su lista (el
        // enano), más los que añade la clase. La lista solo cuenta sin «cualquiera»: con él no se manda.
        idiomas_adicionales_cualquiera: [true],
        idiomas_adicionales: [[] as FilaDeLista[]],
        id_clase_lanzamiento: [0],
        nivel_lanzamiento: [0, [Validators.min(0)]],
        lanzamiento_listas: [[] as ListaLanzamientoFila[]],
    }, { validators: [this.rangosValidator()] });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private draftSvc: NuevaRazaDraftService,
        private razaSvc: RazaService,
        private razaCatalogosSvc: RazaCatalogosService,
        private manualSvc: ManualService,
        private claseSvc: ClaseService,
        private tamanoSvc: TamanoService,
        private tipoCriaturaSvc: TipoCriaturaService,
        private alineamientoSvc: AlineamientoService,
        private subtipoSvc: SubtipoService,
        private idiomaSvc: IdiomaService,
        private habilidadSvc: HabilidadService,
        private doteSvc: DoteService,
        private racialSvc: RacialService,
        private conjuroSvc: ConjuroService,
        private dominioSvc: DominioService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private grupoArmaSvc: GrupoArmaService,
        private grupoArmaduraSvc: GrupoArmaduraService,
        private prerrequisitosTiposSvc: PrerrequisitosTiposService,
        private categoriaEdadSvc: CategoriaEdadService,
    ) { }

    ngOnInit(): void {
        void this.prerrequisitosTiposSvc.cargar();
        this.resetRows();
        this.recalcularPermisos();
        this.userSvc.acl$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.recalcularPermisos());
        this.userSvc.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.recalcularPermisos());
        this.form.controls.mutada.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((mutada) => {
                if (mutada !== true)
                    this.limpiarDatosMutacion();
            });
        this.form.controls.alineamiento_modo.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.sincronizarAlineamientoDesdeSeleccion());
        this.form.controls.id_alineamiento_basico.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.sincronizarAlineamientoDesdeSeleccion());
        this.form.controls.id_prioridad_alineamiento.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.sincronizarAlineamientoDesdeSeleccion());
        this.form.controls.id_preferencia_ley.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.sincronizarAlineamientoDesdeSeleccion());
        this.form.controls.id_preferencia_moral.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.sincronizarAlineamientoDesdeSeleccion());
        this.form.controls.volar.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.sincronizarManiobrabilidadConVuelo());
        this.form.controls.dgs_extra.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.sincronizarCamposDgsExtra());
        this.sincronizarCamposDgsExtra();

        this.form.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.errores.seguirCambios());

        this.cargarCatalogos();
        // Al modificar no hay borrador: el de «Nueva raza» es solo de las razas nuevas y no se mezcla con una cargada.
        this.draftInicializacionHabilitada = !this.edicion.editando;
        void this.intentarInicializarBorradorLocal();
        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idRaza'])
            this.edicion.cargarSiHaceFalta();
    }

    /** Las pestañas preguntan antes de cerrar «Modificar»: los raciales por completar y los cambios sin guardar. */
    async confirmarSalidaSiHayCambios(): Promise<boolean> {
        if (!(await this.confirmarSalidaConRacialesPendientes()))
            return false;
        return this.edicion.confirmarSalida();
    }

    ngOnDestroy(): void {
        this.persistirBorradorLocalAhora();
        this.desactivarPersistenciaBorradorLocal();
        this.destroy$.next();
        this.destroy$.complete();
    }

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event?: BeforeUnloadEvent): void {
        this.persistirBorradorLocalAhora();
        if (event && this.tieneRacialesPendientesRazaEnCreacion() && !recargandoPorCambioDeIdentidad()) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    async guardarRaza(): Promise<void> {
        if (!this.puedeCrear) {
            await avisarSinPermisos(this.mensajePermisosInsuficientes);
            return;
        }

        this.errores.limpiar();
        this.form.markAllAsTouched();
        const errorDominio = this.validarReglasDominio();
        if (this.form.invalid || errorDominio) {
            this.errores.global = errorDominio ?? 'Hay campos obligatorios o rangos pendientes de corregir.';
            this.errores.irAlPrimerError();
            return;
        }

        const editando = this.edicion.editando;
        if (editando && (this.edicion.cargando || this.edicion.id <= 0))
            return;
        const payload = this.buildPayload();
        console.log('[NuevaRaza] Payload crear raza', this.clonarProfundo(payload));
        this.guardando = true;
        try {
            if (editando) {
                const respuesta = await this.razaSvc.actualizarRaza(this.edicion.id, payload);
                const racialesSinCompletar = await this.completarRacialesPendientesRazaEnCreacion(respuesta.idRaza);
                await this.avisarRazaGuardada(true, respuesta.message, racialesSinCompletar);
                this.hidratarDesdeRaza(respuesta.raza);
                this.razaActualizada.emit(respuesta.raza);
                this.cerrar.emit();
            } else {
                const response = await this.razaSvc.crearRaza(payload);
                const racialesSinCompletar = await this.completarRacialesPendientesRazaEnCreacion(response.idRaza);
                await this.avisarRazaGuardada(false, response.message, racialesSinCompletar);
                this.razaCreada.emit({ idRaza: response.idRaza, nombre: payload.raza.nombre });
                this.descartarBorradorLocalActivo();
                this.resetFormularioManteniendoCatalogos();
                this.edicion.olvidar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, editando ? 'No se ha podido actualizar la raza.' : 'No se ha podido crear la raza.');
        } finally {
            this.guardando = false;
        }
    }

    /** «Raza creada» o «Raza actualizada» con el `message` de la API; si algún racial pendiente no se completó, lo dice. */
    private avisarRazaGuardada(editando: boolean, mensaje: string, racialesSinCompletar: string[]): Promise<unknown> {
        if (racialesSinCompletar.length < 1)
            return avisarGuardado(RAZA, editando, mensaje);
        return Swal.fire({
            icon: 'warning',
            title: `Raza ${editando ? 'actualizada' : 'creada'} con incidencias`,
            text: `La raza se guardó, pero ${racialesSinCompletar.length === 1 ? 'un racial pendiente no se pudo completar automáticamente' : 'algunos raciales pendientes no se pudieron completar automáticamente'}.`,
            showConfirmButton: true,
        });
    }

    buildPayload(): RazaCreateRequest {
        const raw = this.form.getRawValue();
        const esMutada = raw.mutada === true;
        const dgsOcultos = this.dgsOcultosAConservar();
        const idClaseLanzamiento = this.numero(raw.id_clase_lanzamiento);
        const lanza = idClaseLanzamiento > 0;
        // El VD de la raza y sus clases asociadas solo cuentan con DG raciales: sin ellos no se mandan (el alta los deja
        // sin dato y la edición conserva lo que hay, como antes de tener estos campos).
        const conDgs = this.tieneDgsExtra();

        const payload: RazaCreateRequest = {
            raza: {
                nombre: this.texto(raw.nombre),
                descripcion: this.texto(raw.descripcion),
                ataques_naturales: textoOSinEspecificar(raw.ataques_naturales),
                espacio: this.numero(raw.espacio),
                alcance: this.numero(raw.alcance),
                id_manual: this.numero(raw.id_manual),
                pagina: this.numero(raw.pagina),
                id_clase_predilecta: this.numero(raw.id_clase_predilecta) < 0 ? null : this.numero(raw.id_clase_predilecta),
                mod_fue: this.numero(raw.mod_fue),
                mod_des: this.numero(raw.mod_des),
                mod_cons: this.numero(raw.mod_cons),
                mod_int: this.numero(raw.mod_int),
                mod_sab: this.numero(raw.mod_sab),
                mod_car: this.numero(raw.mod_car),
                varios_armadura: this.numero(raw.varios_armadura),
                armadura_natural: this.numero(raw.armadura_natural),
                correr: this.numero(raw.correr),
                nadar: this.numero(raw.nadar),
                volar: this.numero(raw.volar),
                id_maniobrabilidad: this.numero(raw.id_maniobrabilidad),
                trepar: this.numero(raw.trepar),
                excavar: this.numero(raw.excavar),
                dotes_extra: this.numero(raw.dotes_extra),
                puntos_extra_1: this.numero(raw.puntos_extra_1),
                puntos_extra: this.numero(raw.puntos_extra),
                id_tamano: this.numero(raw.id_tamano),
                ajuste_nivel: this.numero(raw.ajuste_nivel),
                reduccion_dano: textoOSinEspecificar(raw.reduccion_dano),
                resistencia_conjuros: textoOSinEspecificar(raw.resistencia_conjuros),
                resistencia_energia: textoOSinEspecificar(raw.resistencia_energia),
                altura_rango_inf: this.numeroDecimal(raw.altura_rango_inf),
                altura_rango_sup: this.numeroDecimal(raw.altura_rango_sup),
                peso_rango_inf: this.numeroDecimal(raw.peso_rango_inf),
                peso_rango_sup: this.numeroDecimal(raw.peso_rango_sup),
                edad_adulto: this.numero(raw.edad_adulto),
                edad_mediana: this.numero(raw.edad_mediana),
                edad_viejo: this.numero(raw.edad_viejo),
                edad_venerable: this.numero(raw.edad_venerable),
                edad_maxima_dados: this.numero(raw.edad_maxima_dados),
                edad_maxima_caras: this.numero(raw.edad_maxima_caras),
                edad_inicial_dados_1: this.numero(raw.edad_inicial_dados_1),
                edad_inicial_caras_1: this.numero(raw.edad_inicial_caras_1),
                edad_inicial_dados_2: this.numero(raw.edad_inicial_dados_2),
                edad_inicial_caras_2: this.numero(raw.edad_inicial_caras_2),
                edad_inicial_dados_3: this.numero(raw.edad_inicial_dados_3),
                edad_inicial_caras_3: this.numero(raw.edad_inicial_caras_3),
                ...(this.pideVdDeRaza() ? { vd: this.vdDeRaza(raw.vd) } : {}),
                vd_mod_clases_pj: toIntOrNull(raw.vd_mod_clases_pj),
                vd_mod_clases_pnj: toIntOrNull(raw.vd_mod_clases_pnj),
                id_tipo_criatura: this.numero(raw.id_tipo_criatura),
                // El ataque base y las salvaciones son los de los DG raciales: sin DG, 0 (`400 dg_raciales_sin_dg`).
                ataque_base: this.tieneDgsExtra() ? this.numero(raw.ataque_base) : 0,
                fortaleza: this.tieneDgsExtra() ? this.numero(raw.fortaleza) : 0,
                reflejos: this.tieneDgsExtra() ? this.numero(raw.reflejos) : 0,
                voluntad: this.tieneDgsExtra() ? this.numero(raw.voluntad) : 0,
                dgs_extra: this.numero(raw.dgs_extra),
                id_tipo_dado: dgsOcultos && !this.tieneDgsExtra() ? dgsOcultos.Id_dado : this.getIdTipoDadoPayload(),
                id_tipo_criatura_dgs: dgsOcultos && !this.tieneDgsExtra() ? dgsOcultos.Id_tipo_criatura : this.getIdTipoCriaturaDgsPayload(),
                dotes_dg: this.tieneDgsExtra() ? this.numero(raw.dotes_dg) : (dgsOcultos?.Dotes_extra ?? 0),
                puntos_hab: this.tieneDgsExtra() ? this.numero(raw.puntos_hab) : (dgsOcultos?.Puntos_habilidad ?? 0),
                puntos_hab_mult: this.tieneDgsExtra() ? this.numero(raw.puntos_hab_mult) : (dgsOcultos?.Multiplicador_puntos_habilidad ?? 0),
                mutada: esMutada,
                id_alineamiento: this.numero(raw.id_alineamiento),
                oficial: raw.oficial === true,
                cuadrupedo: raw.cuadrupedo === true,
                idiomas_adicionales_cualquiera: this.idiomasAdicionalesCualquiera,
                id_clase_lanzamiento: lanza ? idClaseLanzamiento : null,
                // En una raza por edades el nivel va en cada categoría (`lanzamiento_por_edades`).
                nivel_lanzamiento: lanza && !this.porEdades ? this.numero(raw.nivel_lanzamiento) : 0,
            },
            subtipos: idsUnicosOrdenados(this.subtiposSeleccionados),
            ...(conDgs ? { clases_asociadas: idsUnicosOrdenados(this.clasesAsociadas.map((fila) => fila.id)) } : {}),
            armas_naturales: cuerpoDeArmasNaturales(this.armasNaturales, false),
            idiomas: idsUnicosOrdenados(this.idiomasSeleccionados),
            idiomas_adicionales: this.idiomasAdicionalesCualquiera ? [] : idsUnicosOrdenados(this.idiomasAdicionales.map((fila) => fila.id)),
            habilidades: {
                base: this.dedupeByKey(
                    this.habilidadesBaseRows
                        .filter((row) => this.numero(row.id_habilidad) > 0)
                        .map((row) => {
                            const idExtra = this.getIdExtraHabilidadBase(row);
                            // Sin extra (-1, lo que guarda la API si no se manda): una fila cargada así se queda así.
                            const enviarExtra = this.numero(row.id_extra) > ID_EXTRA_HABILIDAD_SIN_EXTRA
                                && this.habilidadBaseSoportaExtra(row)
                                && this.esExtraHabilidadBaseValido(row, idExtra);
                            return {
                                id_habilidad: this.numero(row.id_habilidad),
                                cantidad: this.numero(row.cantidad),
                                ...(enviarExtra ? { id_extra: idExtra } : {}),
                                varios: textoOSinEspecificar(row.varios),
                                ...this.parteCondicionalAEnviar(row),
                            };
                        }),
                    (item) => `${item.id_habilidad}:${item.id_extra}`
                ),
                custom: this.dedupeByKey(
                    this.habilidadesCustomRows
                        .filter((row) => this.numero(row.id_habilidad) > 0)
                        .map((row) => ({
                            id_habilidad: this.numero(row.id_habilidad),
                            cantidad: this.numero(row.cantidad),
                        })),
                    (item) => `${item.id_habilidad}`
                ),
            },
            dotes: this.dedupeByKey(
                this.dotesRows
                    .filter((row) => this.numero(row.id_dote) > 0)
                    .map((row) => {
                        const idExtra = this.numero(row.id_extra);
                        return {
                            id_dote: this.numero(row.id_dote),
                            ...(idExtra > 0 ? { id_extra: idExtra } : {}),
                        };
                    }),
                (item) => `${item.id_dote}:${item.id_extra}`
            ),
            raciales: this.dedupeByKey(
                this.racialesRows
                    .filter((row) => this.numero(row.id_racial) > 0)
                    .map((row) => ({
                        id_racial: this.numero(row.id_racial),
                        opcional: this.numero(row.opcional),
                    })),
                (item) => `${item.id_racial}:${item.opcional}`
            ),
            sortilegios: this.dedupeByKey(
                this.sortilegiosRows
                    .filter((row) => this.numero(row.id_conjuro) > 0)
                    .map((row) => ({
                        id_conjuro: this.numero(row.id_conjuro),
                        nivel_lanzador: this.numero(row.nivel_lanzador),
                        usos_diarios: textoOSinEspecificar(row.usos_diarios || '1/dia'),
                        descripcion: textoOSinEspecificar(row.descripcion),
                    })),
                (item) => `${item.id_conjuro}:${item.nivel_lanzador}:${item.usos_diarios}`
            ),
            competencias: {
                armas: idsUnicosOrdenados(this.armasCompetenciaSeleccionadas),
                armaduras: idsUnicosOrdenados(this.armadurasCompetenciaSeleccionadas),
                gruposArma: idsUnicosOrdenados(this.gruposArmaSeleccionados),
                gruposArmadura: idsUnicosOrdenados(this.gruposArmaduraSeleccionados),
            },
            lanzamiento_listas: lanza ? this.listasLanzamiento(raw.lanzamiento_listas) : [],
            // Las edades (la edición las reemplaza enteras; sin ellas, la raza deja de crecer por edades).
            ...cuerpoDeEdades(this.porEdades ? this.edades : { categorias: [], pasos: [] }),
        };

        // Lo que pide y lo que cambia una raza mutada (la edición los reemplaza: sin mutar, no se mandan y quedan vacíos).
        if (esMutada) {
            payload.prerrequisitos_mutacion = this.buildPrerrequisitosMutacion();
            payload.cambios_mutacion = this.buildCambiosMutacion();
        }

        return payload;
    }

    actualizarSeleccion(propiedad: RelacionSeleccionKey, values: number[]): void {
        this[propiedad] = idsUnicosOrdenados(values);
    }

    agregarSeleccion(propiedad: RelacionSeleccionKey, value: number): void {
        const id = this.numero(value);
        if (id <= 0)
            return;
        this[propiedad] = idsUnicosOrdenados([...(this[propiedad] ?? []), id]);
        this.relacionQueries[propiedad] = '';
    }

    quitarSeleccion(propiedad: RelacionSeleccionKey, value: number): void {
        const id = this.numero(value);
        this[propiedad] = idsUnicosOrdenados((this[propiedad] ?? []).filter((item) => item !== id));
    }

    actualizarRelacionQuery(propiedad: RelacionSeleccionKey, value: string): void {
        this.relacionQueries[propiedad] = value ?? '';
    }

    displayAutocompleteVacio(): string {
        return '';
    }

    displayClasePredilectaAutocomplete = (id: number | string | null | undefined): string => {
        if (id === null || id === undefined || `${id}`.trim() === '')
            return '';
        const clase = this.buscarCatalogo(this.clasesPredilectas, id);
        return clase ? this.getCatalogLabel(clase) : '';
    };

    /** Las clases que pueden ser la predilecta: las del catálogo, «Cualquiera» (la 0) y «Ninguna» (sin clase predilecta). */
    get clasesPredilectas(): CatalogItem[] {
        return conOpcionSinValor<CatalogItem>(conOpcionSinValor<CatalogItem>(this.clases, CUALQUIER_CLASE), SIN_CLASE_PREDILECTA_FORMULARIO);
    }

    onStepSelectionChange(event: { selectedIndex?: number } | null | undefined): void {
        this.pasoActivoIndex = this.normalizarPasoIndex(event?.selectedIndex);
    }

    abrirSelectorPrerrequisitosMutacion(): void {
        this.selectorPrerrequisitosMutacionTempKeys = [...this.prerrequisitosMutacionSeleccionados];
        this.selectorPrerrequisitosMutacionFiltro = '';
        this.selectorPrerrequisitosMutacionVisible = true;
    }

    cerrarSelectorPrerrequisitosMutacion(): void {
        this.selectorPrerrequisitosMutacionVisible = false;
        this.selectorPrerrequisitosMutacionFiltro = '';
        this.selectorPrerrequisitosMutacionTempKeys = [];
    }

    async confirmarSelectorPrerrequisitosMutacion(): Promise<void> {
        const tipos = [...this.selectorPrerrequisitosMutacionTempKeys];
        if (this.prerrequisitoMutacionHost)
            await this.prerrequisitoMutacionHost.prepareTypes(tipos);
        else {
            this.prerrequisitosMutacionSeleccionados = tipos;
            this.prerrequisitosMutacionRows = this.syncFilasPrerrequisitosMutacion(tipos);
        }
        this.cerrarSelectorPrerrequisitosMutacion();
    }

    get prerrequisitosMutacionFiltrados(): MutacionPrerequisiteOption[] {
        const filtro = normalizarTexto(this.selectorPrerrequisitosMutacionFiltro, true);
        return this.prerrequisitosMutacionOpciones.filter((item) => {
            if (!filtro)
                return true;
            return normalizarTexto(item.label, true).includes(filtro);
        });
    }

    get hayPrerrequisitosMutacionMarcados(): boolean {
        return this.prerrequisitosMutacionSeleccionados.length > 0;
    }

    isTipoPrerrequisitoMutacionTemporalSeleccionado(key: TipoEditorMutacion): boolean {
        return this.selectorPrerrequisitosMutacionTempKeys.includes(key);
    }

    toggleTipoPrerrequisitoMutacionTemporal(key: TipoEditorMutacion, checked: boolean): void {
        if (checked) {
            this.selectorPrerrequisitosMutacionTempKeys = [...new Set([...this.selectorPrerrequisitosMutacionTempKeys, key])];
            return;
        }
        this.selectorPrerrequisitosMutacionTempKeys = this.selectorPrerrequisitosMutacionTempKeys.filter((item) => item !== key);
    }

    limpiarPrerrequisitosMutacionTemporales(): void {
        this.selectorPrerrequisitosMutacionTempKeys = [];
    }

    onPrerrequisitosMutacionSeleccionadosChange(tipos: PrerequisiteType[]): void {
        this.prerrequisitosMutacionSeleccionados = tipos.filter((type): type is TipoEditorMutacion => esTipoDeMutacion(type));
    }

    onPrerrequisitosMutacionRowsChange(rows: PrerequisiteRowModel[]): void {
        this.prerrequisitosMutacionRows = rows.filter((row) => esTipoDeMutacion(row.tipo));
    }

    getEtiquetaPrerrequisitoMutacion(key: TipoEditorMutacion): string {
        return this.prerrequisitosMutacionOpciones.find((item) => item.key === key)?.label ?? key;
    }

    toggleBooleanControl(controlName: 'oficial' | 'mutada' | 'cuadrupedo'
        | 'idiomas_adicionales_cualquiera'): void {
        alternarControl(this.form.controls[controlName]);
    }

    setAlineamientoModo(modo: AlineamientoModo): void {
        this.form.controls.alineamiento_modo.setValue(modo);
    }

    abrirInfoAlineamiento(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.mostrarInfoAlineamiento = true;
    }

    cerrarInfoAlineamiento(): void {
        this.mostrarInfoAlineamiento = false;
    }

    abrirInfoTamano(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.mostrarInfoTamano = true;
    }

    cerrarInfoTamano(): void {
        this.mostrarInfoTamano = false;
    }

    abrirInfoManiobrabilidad(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.mostrarInfoManiobrabilidad = true;
    }

    cerrarInfoManiobrabilidad(): void {
        this.mostrarInfoManiobrabilidad = false;
    }

    getAlineamientoInfoSecciones(): { titulo?: string; lineas?: string[]; items?: string[] }[] {
        const prioridadesVisibles = this.getPrioridadesAlineamientoVisibles();
        const prioridades = prioridadesVisibles.length > 0
            ? prioridadesVisibles.map((prioridad) => `${prioridad.Nombre}: ${this.getDescripcionPrioridadAlineamiento(prioridad)}`)
            : ['Las prioridades se cargan desde el catálogo de alineamientos.'];

        return [
            {
                titulo: 'Función de raza',
                lineas: [
                    'Cada raza puede o no condicionar el alineamiento final de un personaje. Algunas lo hacen con un alineamiento fijo, mientras que otras lo hacen por preferencias o inclinaciones frecuentes.',
                    'En ambos casos el formulario traduce la selección al alineamiento canónico que espera el sistema.',
                ],
            },
            {
                titulo: 'Básico y preferencias',
                lineas: [
                    'Usa alineamiento básico cuando la raza tenga un alineamiento concreto o no aplique ninguno.',
                    'Usa preferencias cuando la raza solo incline el eje legal, moral o ambos sin fijar un resultado único.',
                ],
            },
            {
                titulo: 'Prioridades',
                lineas: [
                    'Sea cual sea el caso siempre hay una prioridad con la que ajustar la fuerza de ese alineamiento.',
                    'Todas las prioridades deberían respetarse, pero cuanto más estricta sea, más excepcional será el personaje que la ignore.',
                ],
                items: prioridades,
            },
        ];
    }

    getPrioridadesAlineamientoVisibles(): PrioridadAlineamientoCatalogItem[] {
        return this.prioridadesAlineamiento.filter((prioridad) => !this.esPrioridadAlineamientoInterna(prioridad));
    }

    getTamanoSeleccionado(): Tamano | undefined {
        const id = this.numero(this.form.controls.id_tamano.value);
        return this.tamanos.find((tamano) => this.numero(tamano.Id) === id);
    }

    getTamanoInfoSecciones(): { titulo?: string; lineas?: string[]; items?: string[] }[] {
        const tamano = this.getTamanoSeleccionado();
        if (!tamano) {
            return [{
                lineas: ['Selecciona un tamaño para ver sus modificadores.'],
            }];
        }

        return [
            {
                titulo: tamano.Nombre,
                lineas: [
                    'Estos son los modificadores que aporta el tamaño seleccionado según el catálogo.',
                ],
                items: [
                    `Modificador de tamaño: ${this.formatearNumeroConSigno(tamano.Modificador)}.`,
                    `Modificador de presa: ${this.formatearNumeroConSigno(tamano.Modificador_presa)}.`,
                ],
            },
        ];
    }

    getManiobrabilidadSeleccionada(): RazaCatalogItem | undefined {
        const id = this.numero(this.form.controls.id_maniobrabilidad.value);
        return this.maniobrabilidades.find((item) => this.numero(item.Id) === id);
    }

    getManiobrabilidadesVisibles(): RazaCatalogItem[] {
        return this.maniobrabilidades.filter((item) => !this.esManiobrabilidadNoVuela(item));
    }

    getManiobrabilidadInfoSecciones(): { titulo?: string; lineas?: string[]; items?: string[] }[] {
        return buildManiobrabilidadInfoSecciones(this.getManiobrabilidadSeleccionada() as any);
    }

    getClasesPredilectasFiltradas(): CatalogItem[] {
        return this.filtrarCatalogo(this.clasesPredilectas, this.clasePredilectaBusqueda, []);
    }

    getTiposCriaturaDgsFiltrados(): TipoCriatura[] {
        return this.filtrarCatalogo(this.tiposCriatura, this.tipoCriaturaDgsBusqueda, []);
    }

    actualizarClasePredilectaBusqueda(value: string): void {
        this.clasePredilectaBusqueda = value ?? '';
        this.form.controls.id_clase_predilecta.setValue(null);
        this.form.controls.id_clase_predilecta.markAsDirty();
        this.form.controls.id_clase_predilecta.updateValueAndValidity();
    }

    actualizarTipoCriaturaDgsBusqueda(value: string): void {
        this.tipoCriaturaDgsBusqueda = value ?? '';
        this.form.controls.id_tipo_criatura_dgs.setValue(0);
        this.form.controls.id_tipo_criatura_dgs.markAsDirty();
        this.form.controls.id_tipo_criatura_dgs.updateValueAndValidity();
    }

    seleccionarManual(id: number): void {
        elegirEnControl(this.form.controls.id_manual, this.numero(id));
    }

    seleccionarClasePredilecta(id: number): void {
        const clase = this.buscarCatalogo(this.clasesPredilectas, id);
        this.form.controls.id_clase_predilecta.setValue(this.numero(id));
        this.form.controls.id_clase_predilecta.markAsDirty();
        this.form.controls.id_clase_predilecta.updateValueAndValidity();
        this.clasePredilectaBusqueda = clase ? this.getCatalogLabel(clase) : '';
    }

    seleccionarTipoCriaturaDgs(id: number): void {
        const tipo = this.buscarCatalogo(this.tiposCriatura, id);
        this.form.controls.id_tipo_criatura_dgs.setValue(this.numero(id));
        this.form.controls.id_tipo_criatura_dgs.markAsDirty();
        this.form.controls.id_tipo_criatura_dgs.updateValueAndValidity();
        this.tipoCriaturaDgsBusqueda = tipo ? this.getCatalogLabel(tipo) : '';
    }

    tieneVelocidadVuelo(): boolean {
        return this.numero(this.form.controls.volar.value) > 0;
    }

    tieneDgsExtra(): boolean {
        return this.numero(this.form.controls.dgs_extra.value) > 0;
    }

    /**
     * Se pide el VD de la raza: con DG raciales y sin edades. En una raza por edades cuenta el VD de cada categoría
     * (el dragón), así que el de la raza no se enseña ni se manda (la edición conserva el que tuviera).
     */
    pideVdDeRaza(): boolean {
        return this.tieneDgsExtra() && !this.porEdades;
    }

    /** En una raza por edades el nivel de lanzamiento va en cada categoría y en la raza es 0 (la API lo exige). */
    get esRazaPorEdades(): boolean {
        return this.porEdades;
    }

    /** El interruptor «La raza crece por edades»: al encenderlo sin categorías, empieza con una vacía. */
    alternarPorEdades(activo: boolean): void {
        this.porEdades = activo === true;
        if (this.porEdades && this.edades.categorias.length < 1)
            this.edades = { ...this.edades, categorias: [categoriaVacia()] };
        if (this.porEdades)
            this.form.controls.nivel_lanzamiento.setValue(0);
        this.sincronizarCamposDgsExtra();
        this.form.markAsDirty();
    }

    /**
     * La fila de la raza lleva las cifras de su primera edad y su primer paso (tamaño, espacio, ajustes de las puntuaciones,
     * armadura natural, velocidades, DG y ajuste de nivel): de ella salen el tipo de los DG y lo que aún no lee las edades.
     */
    copiarPrimeraEdadALaRaza(): void {
        const fila = filaDeRazaDesdePrimeraEdad(this.edades);
        if (!fila)
            return;
        this.form.patchValue(fila);
        this.form.markAsDirty();
    }

    onCategoriaEdadCreada(categoria: CategoriaEdadCatalogo): void {
        this.categoriasEdadCatalogo = [...this.categoriasEdadCatalogo.filter((item) => item.Id !== categoria.Id), categoria]
            .sort(porOrdenTipico);
    }

    /** El error de las edades: el de la API (`field` `categorias_edad…` o `pasos_edad…`). */
    get errorDeEdades(): string | null {
        return this.errores.mensajeDe('categorias_edad') ?? this.errores.mensajeDe('pasos_edad');
    }

    private problemaDeEdades(): string | null {
        if (!this.porEdades)
            return null;
        const ordenTipico = (id: number) => this.categoriasEdadCatalogo.find((categoria) => categoria.Id === id)?.Orden_tipico;
        return problemaDeEdades(this.edades, {
            ordenTipico,
            lanzaComoClase: this.lanzaConjuros,
            dgsDeLaRaza: this.numero(this.form.controls.dgs_extra.value),
        });
    }

    get lanzaConjuros(): boolean {
        return this.numero(this.form.controls.id_clase_lanzamiento.value) > 0;
    }

    get listasLanzamientoElegidas(): ListaLanzamientoFila[] {
        return this.form.controls.lanzamiento_listas.value ?? [];
    }

    idsListasLanzamiento(tipo: ListaLanzamientoFila['tipo']): number[] {
        return this.listasLanzamientoElegidas.filter((lista) => lista.tipo === tipo).map((lista) => lista.id);
    }

    nombreListaLanzamiento(lista: ListaLanzamientoFila): string {
        const opciones = lista.tipo === 'clase' ? this.opcionesClasesLanzamiento : this.opcionesDominios;
        const nombre = nombreDeOpcion(opciones, lista.id);
        return lista.tipo === 'dominio' ? `Dominio de ${nombre}` : nombre;
    }

    seleccionarClaseLanzamiento(id: number): void {
        elegirEnControl(this.form.controls.id_clase_lanzamiento, this.numero(id));
    }

    quitarLanzamiento(): void {
        this.form.patchValue({ id_clase_lanzamiento: 0, nivel_lanzamiento: 0, lanzamiento_listas: [] });
        this.form.controls.id_clase_lanzamiento.markAsDirty();
    }

    agregarListaLanzamiento(tipo: ListaLanzamientoFila['tipo'], id: number): void {
        const idLista = this.numero(id);
        if (idLista <= 0 || this.listasLanzamientoElegidas.some((lista) => lista.tipo === tipo && lista.id === idLista))
            return;
        this.form.controls.lanzamiento_listas.setValue([...this.listasLanzamientoElegidas, { tipo, id: idLista }]);
        this.form.controls.lanzamiento_listas.markAsDirty();
    }

    quitarListaLanzamiento(lista: ListaLanzamientoFila): void {
        this.form.controls.lanzamiento_listas.setValue(
            this.listasLanzamientoElegidas.filter((item) => !(item.tipo === lista.tipo && item.id === lista.id))
        );
        this.form.controls.lanzamiento_listas.markAsDirty();
    }

    /** Las clases asociadas de la raza (MM, pág. 294: un nivel de una de ellas suma +1 al VD de un PNJ con DG raciales). */
    get armasNaturales(): FilaArmaNatural[] {
        return this.form.controls.armas_naturales.value ?? [];
    }

    cambiarArmasNaturales(filas: FilaArmaNatural[]): void {
        this.form.controls.armas_naturales.setValue(filas);
        this.form.controls.armas_naturales.markAsDirty();
    }

    get clasesAsociadas(): FilaDeLista[] {
        return this.form.controls.clases_asociadas.value ?? [];
    }

    /** Si los idiomas adicionales por Inteligencia pueden ser cualquiera no secreto (MJ cap. 2: el humano). */
    get idiomasAdicionalesCualquiera(): boolean {
        return this.form.controls.idiomas_adicionales_cualquiera.value !== false;
    }

    /** La lista de idiomas adicionales de la raza (el enano): solo cuenta sin «cualquiera». */
    get idiomasAdicionales(): FilaDeLista[] {
        return this.form.controls.idiomas_adicionales.value ?? [];
    }

    /** Las opciones de una lista de ids del formulario (`<app-lista-de-catalogo>`). */
    opcionesDe(lista: ListaDeRaza): OpcionCatalogo[] {
        return lista === 'clases_asociadas' ? this.opcionesClasesAsociadas : this.opcionesIdiomas;
    }

    anadirA(lista: ListaDeRaza, id: number): void {
        const control = this.form.controls[lista];
        control.setValue(anadirALista(control.value ?? [], this.opcionesDe(lista), this.numero(id),
            (opcion) => ({ id: opcion.id, nombre: opcion.nombre })));
        control.markAsDirty();
    }

    quitarDe(lista: ListaDeRaza, fila: FilaDeLista): void {
        const control = this.form.controls[lista];
        control.setValue((control.value ?? []).filter((item) => item.id !== fila.id));
        control.markAsDirty();
    }

    actualizarHabilidadBase(index: number, patch: Partial<HabilidadBaseRow>): void {
        const current = this.habilidadesBaseRows[index];
        const next = { ...current, ...patch };
        if (patch.id_habilidad !== undefined && this.numero(patch.id_habilidad) !== this.numero(current.id_habilidad)) {
            next.id_extra = 0;
            next.extraBusqueda = '';
        }
        this.habilidadesBaseRows[index] = next;
    }

    actualizarHabilidadCustom(index: number, patch: Partial<HabilidadCustomRow>): void {
        this.habilidadesCustomRows[index] = { ...this.habilidadesCustomRows[index], ...patch };
    }

    actualizarDote(index: number, patch: Partial<DoteRow>): void {
        const current = this.dotesRows[index];
        const next = { ...current, ...patch };
        if (patch.id_dote !== undefined && this.numero(patch.id_dote) !== this.numero(current.id_dote)) {
            next.id_extra = 0;
            next.extraBusqueda = '';
        }
        this.dotesRows[index] = next;
    }

    actualizarRacial(index: number, patch: Partial<RacialRow>): void {
        this.racialesRows[index] = { ...this.racialesRows[index], ...patch };
    }

    actualizarSortilegio(index: number, patch: Partial<SortilegioRow>): void {
        this.sortilegiosRows[index] = { ...this.sortilegiosRows[index], ...patch };
    }

    agregarHabilidadBase(): void {
        this.habilidadesBaseRows = [...this.habilidadesBaseRows, this.crearHabilidadBaseRow()];
    }

    agregarHabilidadCustom(): void {
        this.habilidadesCustomRows = [...this.habilidadesCustomRows, this.crearHabilidadCustomRow()];
    }

    abrirCrearCustom(): void {
        this.customModalModo = 'crear';
        this.customModalRowUid = '';
        this.customModalHabilidad = null;
        this.customModalAbierto = true;
    }

    abrirEditarCustom(row: HabilidadCustomRow): void {
        if (this.numero(row.id_habilidad) <= 0)
            return;
        const habilidad = this.habilidadesCustom.find((item) => this.numero(item.Id_habilidad) === this.numero(row.id_habilidad));
        if (!habilidad)
            return;
        this.customModalModo = 'editar';
        this.customModalRowUid = row.uid;
        this.customModalHabilidad = habilidad;
        this.customModalAbierto = true;
    }

    cerrarCustomModal(): void {
        this.customModalAbierto = false;
        this.customModalRowUid = '';
        this.customModalHabilidad = null;
    }

    onHabilidadCustomGuardada(habilidad: HabilidadBasicaDetalle): void {
        this.upsertHabilidadCustom(habilidad);
        const targetUid = this.customModalRowUid;
        if (targetUid) {
            this.habilidadesCustomRows = this.habilidadesCustomRows.map((row) => row.uid === targetUid
                ? { ...row, id_habilidad: habilidad.Id_habilidad, busqueda: habilidad.Nombre }
                : row);
        } else {
            const empty = this.habilidadesCustomRows.find((row) => this.numero(row.id_habilidad) <= 0);
            if (empty)
                this.habilidadesCustomRows = this.habilidadesCustomRows.map((row) => row.uid === empty.uid
                    ? { ...row, id_habilidad: habilidad.Id_habilidad, busqueda: habilidad.Nombre }
                    : row);
            else
                this.habilidadesCustomRows = [...this.habilidadesCustomRows, { ...this.crearHabilidadCustomRow(), id_habilidad: habilidad.Id_habilidad, busqueda: habilidad.Nombre }];
        }
        this.cerrarCustomModal();
    }

    agregarDote(): void {
        this.dotesRows = [...this.dotesRows, this.crearDoteRow()];
    }

    agregarRacial(): void {
        this.racialesRows = [...this.racialesRows, this.crearRacialRow()];
    }

    abrirModalNuevoRacial(): void {
        this.modalNuevoRacialVisible = true;
    }

    cerrarModalNuevoRacial(): void {
        this.modalNuevoRacialVisible = false;
    }

    abrirModalNuevoIdioma(): void {
        this.modalNuevoIdiomaVisible = true;
    }

    cerrarModalNuevoIdioma(): void {
        this.modalNuevoIdiomaVisible = false;
    }

    agregarSortilegio(): void {
        this.sortilegiosRows = [...this.sortilegiosRows, this.crearSortilegioRow()];
    }

    quitarHabilidadBase(index: number): void {
        this.habilidadesBaseRows = quitarFila(this.habilidadesBaseRows, index, () => this.crearHabilidadBaseRow());
    }

    quitarHabilidadCustom(index: number): void {
        this.habilidadesCustomRows = quitarFila(this.habilidadesCustomRows, index, () => this.crearHabilidadCustomRow());
    }

    quitarDote(index: number): void {
        this.dotesRows = quitarFila(this.dotesRows, index, () => this.crearDoteRow());
    }

    quitarRacial(index: number): void {
        this.racialesRows = quitarFila(this.racialesRows, index, () => this.crearRacialRow());
    }

    quitarSortilegio(index: number): void {
        this.sortilegiosRows = quitarFila(this.sortilegiosRows, index, () => this.crearSortilegioRow());
    }

    getOpcionesRelacion<T>(propiedad: RelacionSeleccionKey, items: T[]): T[] {
        return this.filtrarCatalogo(items, this.relacionQueries[propiedad], this[propiedad] ?? []);
    }

    getEtiquetaRelacion(items: any[], id: number): string {
        return this.etiquetaCatalogo(items, id);
    }

    getHabilidadesBaseFiltradas(row: HabilidadBaseRow): HabilidadBasicaDetalle[] {
        return this.filtrarCatalogo(this.habilidades, row.busqueda, []);
    }

    getHabilidadesCustomFiltradas(row: HabilidadCustomRow): HabilidadBasicaDetalle[] {
        return this.filtrarCatalogo(this.habilidadesCustom, row.busqueda, []);
    }

    getDotesFiltradas(row: DoteRow): Dote[] {
        return this.filtrarCatalogo(this.dotes, row.busqueda, []);
    }

    getRacialesFiltrados(row: RacialRow): RacialDetalle[] {
        return this.filtrarCatalogo(this.getRacialesCompatibles(), row.busqueda, []);
    }

    getRacialesCompatibles(): RacialDetalle[] {
        return this.raciales.filter((racial) => this.esRacialCompatibleConRazaActual(racial));
    }

    getSortilegiosFiltrados(row: SortilegioRow): Conjuro[] {
        return this.filtrarCatalogo(this.conjuros, row.busqueda, []);
    }

    seleccionarHabilidadBase(index: number, id: number): void {
        const habilidad = this.buscarCatalogo(this.habilidades, id);
        this.actualizarHabilidadBase(index, {
            id_habilidad: this.numero(id),
            id_extra: 0,
            busqueda: habilidad ? this.getCatalogLabel(habilidad) : '',
            extraBusqueda: '',
        });
    }

    seleccionarHabilidadCustom(index: number, id: number): void {
        const habilidad = this.buscarCatalogo(this.habilidadesCustom, id);
        this.actualizarHabilidadCustom(index, {
            id_habilidad: this.numero(id),
            busqueda: habilidad ? this.getCatalogLabel(habilidad) : '',
        });
    }

    seleccionarDote(index: number, id: number): void {
        const dote = this.buscarCatalogo(this.dotes, id);
        this.actualizarDote(index, {
            id_dote: this.numero(id),
            id_extra: 0,
            busqueda: dote ? this.getCatalogLabel(dote) : '',
            extraBusqueda: '',
        });
    }

    seleccionarExtraDote(index: number, id: number): void {
        const extra = this.buscarCatalogo(this.getOpcionesExtraDote(this.dotesRows[index]?.id_dote), id);
        this.actualizarDote(index, {
            id_extra: this.numero(id),
            extraBusqueda: extra ? this.getCatalogLabel(extra) : '',
        });
    }

    seleccionarRacial(index: number, id: number): void {
        const racial = this.buscarCatalogo(this.raciales, id);
        if (racial && !this.esRacialCompatibleConRazaActual(racial)) {
            this.actualizarRacial(index, {
                id_racial: 0,
                busqueda: '',
            });
            void Swal.fire({
                icon: 'warning',
                title: 'Racial no compatible',
                text: this.edicion.editando
                    ? 'Este racial pide otra raza y no puede añadirse a esta.'
                    : 'Este racial tiene prerrequisitos de raza y no puede añadirse a una raza nueva desde este formulario.',
                showConfirmButton: true,
            });
            return;
        }
        this.actualizarRacial(index, {
            id_racial: this.numero(id),
            busqueda: racial ? this.getCatalogLabel(racial) : '',
        });
    }

    onRacialCreadoDesdeModal(event: CrearRacialEmitPayload): void {
        const racial = event.racial ?? {
            Id: event.idRacial,
            Nombre: event.nombre,
            Descripcion: '',
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        };
        const nextRaciales = this.raciales.filter((item) => this.numero(item.Id) !== this.numero(racial.Id));
        this.raciales = this.ordenar([...nextRaciales, racial]);
        if (event.prerrequisitoRazaEnCreacion === true)
            this.registrarRacialPendienteRazaEnCreacion(racial.Id);

        if (event.tienePrerrequisitoRaza === true || !this.esRacialCompatibleConRazaActual(racial)) {
            this.cerrarModalNuevoRacial();
            void Swal.fire({
                icon: 'info',
                title: 'Racial creado sin añadir',
                text: 'El racial creado tiene prerrequisitos de raza, así que no es compatible con esta raza nueva y no se ha seleccionado automáticamente.',
                showConfirmButton: true,
            });
            return;
        }

        const emptyIndex = this.racialesRows.findIndex((row) => this.numero(row.id_racial) <= 0);
        const targetIndex = emptyIndex >= 0 ? emptyIndex : this.racialesRows.length;
        if (targetIndex === this.racialesRows.length)
            this.racialesRows = [...this.racialesRows, this.crearRacialRow()];

        this.actualizarRacial(targetIndex, {
            id_racial: this.numero(racial.Id),
            opcional: 0,
            busqueda: racial.Nombre,
        });
        this.cerrarModalNuevoRacial();
    }

    onIdiomaCreadoDesdeModal(idioma: IdiomaDetalle): void {
        if (!idioma || this.numero(idioma.Id) <= 0)
            return;
        const nextIdiomas = this.idiomas.filter((item) => this.numero(item.Id) !== this.numero(idioma.Id));
        this.idiomas = this.ordenar([...nextIdiomas, idioma]);
        this.opcionesIdiomas = opcionesDeCatalogo(this.idiomas);
        this.agregarSeleccion('idiomasSeleccionados', idioma.Id);
        this.cerrarModalNuevoIdioma();
    }

    tieneRacialesPendientesRazaEnCreacion(): boolean {
        return this.racialesPendientesRazaEnCreacionIds.size > 0;
    }

    async confirmarSalidaConRacialesPendientes(): Promise<boolean> {
        if (!this.tieneRacialesPendientesRazaEnCreacion())
            return true;

        const nombres = this.getNombresRacialesPendientesRazaEnCreacion();
        const detalle = nombres.length > 0
            ? nombres.slice(0, 3).join(', ')
            : 'algún racial recién creado';
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Racial pendiente de completar',
            text: `Si cierras ahora, ${detalle} ${nombres.length === 1 ? 'quedará' : 'quedarán'} sin enlazar a la raza real y tendrás que completar ese prerrequisito después.`,
            showCancelButton: true,
            confirmButtonText: 'Cerrar igualmente',
            cancelButtonText: 'Seguir editando',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });

        return result.isConfirmed === true;
    }

    seleccionarSortilegio(index: number, id: number): void {
        const conjuro = this.buscarCatalogo(this.conjuros, id);
        this.actualizarSortilegio(index, {
            id_conjuro: this.numero(id),
            busqueda: conjuro ? this.getCatalogLabel(conjuro) : '',
        });
    }

    habilidadBaseSoportaExtra(row: HabilidadBaseRow): boolean {
        const habilidad = this.buscarCatalogo(this.habilidades, row.id_habilidad);
        return habilidad?.Soporta_extra === true;
    }

    getExtrasHabilidadBase(row: HabilidadBaseRow): CatalogItem[] {
        const habilidad = this.buscarCatalogo(this.habilidades, row.id_habilidad);
        const extras = (habilidad?.Extras ?? []).map((extra) => ({ Id: this.numero(extra.Id_extra), Nombre: extra.Extra }));
        if (habilidad?.Soporta_extra === true && !extras.some((extra) => extra.Id === HABILIDAD_EXTRA_ELEGIR.Id))
            extras.push(HABILIDAD_EXTRA_ELEGIR);
        return this.ordenar(extras);
    }

    getExtrasHabilidadBaseFiltrados(row: HabilidadBaseRow): CatalogItem[] {
        return this.filtrarCatalogo(this.getExtrasHabilidadBase(row), row.extraBusqueda, []);
    }

    seleccionarExtraHabilidadBase(index: number, id: number): void {
        const extra = this.buscarCatalogo(this.getExtrasHabilidadBase(this.habilidadesBaseRows[index]), id);
        this.actualizarHabilidadBase(index, {
            id_extra: this.numero(id),
            extraBusqueda: extra ? this.getCatalogLabel(extra) : '',
        });
    }

    getExtrasDoteFiltrados(row: DoteRow): CatalogItem[] {
        return this.filtrarCatalogo(this.getOpcionesExtraDote(row.id_dote), row.extraBusqueda, []);
    }

    getOpcionesExtraDote(idDote: number): CatalogItem[] {
        const dote = this.dotes.find((item) => item.Id === this.numero(idDote));
        if (!dote)
            return [];
        const extras = dote.Extras_disponibles;
        return [
            ...(extras?.Armas ?? []),
            ...(extras?.Armaduras ?? []),
            ...(extras?.Escuelas ?? []),
            ...(extras?.Habilidades ?? []),
        ].map((item) => ({ Id: item.Id, Nombre: item.Nombre }))
            .filter((item) => item.Id > 0)
            .sort(porNombre);
    }

    doteRequiereExtra(idDote: number): boolean {
        const dote = this.dotes.find((item) => item.Id === this.numero(idDote));
        const extras = dote?.Extras_soportados;
        if (!extras)
            return false;
        return Object.values(extras).some((value) => Number(value) > 0);
    }

    trackByUid(_: number, item: { uid: string }): string {
        return item.uid;
    }

    trackById(_: number, item: { Id: number }): number {
        return item.Id;
    }

    private getDescripcionPrioridadAlineamiento(prioridad: PrioridadAlineamientoCatalogItem): string {
        const descripcion = this.texto(prioridad.Descripcion);
        if (descripcion)
            return descripcion;
        const nombre = normalizarTexto(prioridad.Nombre, true);
        if (nombre.includes('sin preferencia') || nombre.includes('sin prioridad') || nombre.includes('no aplica'))
            return 'No condiciona el alineamiento del personaje; sirve para razas sin tendencia propia.';
        if (nombre.includes('debe') || nombre.includes('tenerse en cuenta'))
            return 'Marca una tendencia racial importante que debería respetarse al crear el personaje.';
        if (nombre.includes('siempre') || nombre.includes('oblig') || nombre.includes('estrict'))
            return 'Representa una condición muy fuerte; ignorarla debería ser una rareza dentro de esa raza.';
        return 'Indica cuánta fuerza tiene esta regla frente a otras fuentes de alineamiento.';
    }

    private esPrioridadAlineamientoInterna(prioridad: PrioridadAlineamientoCatalogItem | null | undefined): boolean {
        return normalizarTexto(prioridad?.Nombre, true) === 'final';
    }

    private asegurarPrioridadAlineamientoVisible(): void {
        const visibles = this.getPrioridadesAlineamientoVisibles();
        const idActual = this.numero(this.form.controls.id_prioridad_alineamiento.value);
        if (idActual >= 0 && visibles.length > 0 && !visibles.some((prioridad) => this.numero(prioridad.Id) === idActual))
            this.form.controls.id_prioridad_alineamiento.setValue(0, { emitEvent: false });
        this.sincronizarSelectConFallback('id_prioridad_alineamiento', visibles, 'sin prioridad');
    }

    private formatearNumeroConSigno(value: any): string {
        const numero = this.numero(value);
        return numero > 0 ? `+${numero}` : `${numero}`;
    }

    private async intentarInicializarBorradorLocal(): Promise<void> {
        if (!this.draftInicializacionHabilitada || this.draftInicializado || this.draftInicializando || !this.puedeCrear || this.edicion.editando)
            return;

        const uid = this.obtenerUidSesionActiva();
        if (uid.length < 1)
            return;

        this.draftInicializando = true;
        try {
            if (!this.tieneCreacionEnCurso() && this.draftSvc.puedeOfrecerRestauracionBorrador(uid)) {
                const result = await Swal.fire({
                    icon: 'question',
                    title: 'Borrador encontrado',
                    text: 'Encontré una creación de raza guardada en este navegador. ¿Quieres continuarla o empezar de cero?',
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
                    const borrador = this.draftSvc.leerBorradorLocal(uid);
                    if (borrador)
                        this.restaurarDesdeBorradorLocal(borrador);
                } else {
                    this.draftSvc.descartarBorradorLocal(uid);
                    this.resetFormularioManteniendoCatalogos();
                }
            }

            this.draftInicializado = true;
            this.activarPersistenciaBorradorLocal(uid);
        } finally {
            this.draftInicializando = false;
        }
    }

    private activarPersistenciaBorradorLocal(uid: string): void {
        const uidNormalizado = `${uid ?? ''}`.trim();
        this.desactivarPersistenciaBorradorLocal();
        if (uidNormalizado.length < 1)
            return;

        this.draftUidActivo = uidNormalizado;
        this.draftUltimaFirmaPersistida = this.draftSvc.firmarContenido(this.construirBorradorLocal(uidNormalizado));
        this.draftAutosaveTimer = setInterval(() => {
            this.comprobarPersistenciaBorradorActiva();
        }, NUEVA_RAZA_DRAFT_AUTOSAVE_MS);
    }

    private desactivarPersistenciaBorradorLocal(): void {
        if (this.draftAutosaveTimer) {
            clearInterval(this.draftAutosaveTimer);
            this.draftAutosaveTimer = null;
        }
        if (this.draftPersistTimer) {
            clearTimeout(this.draftPersistTimer);
            this.draftPersistTimer = null;
        }
        this.draftUidActivo = '';
    }

    private persistirBorradorLocalAhora(): void {
        const uid = `${this.draftUidActivo ?? ''}`.trim();
        if (uid.length < 1)
            return;

        const contenido = this.construirBorradorLocal(uid);
        if (!contenido) {
            this.draftSvc.descartarBorradorLocal(uid);
            this.draftUltimaFirmaPersistida = null;
            return;
        }

        const borrador = this.draftSvc.guardarBorradorLocal(uid, contenido);
        this.draftUltimaFirmaPersistida = this.draftSvc.firmarBorrador(borrador);
    }

    private comprobarPersistenciaBorradorActiva(): void {
        const uid = `${this.draftUidActivo ?? ''}`.trim();
        if (uid.length < 1)
            return;

        const firmaActual = this.draftSvc.firmarContenido(this.construirBorradorLocal(uid));
        if (firmaActual === this.draftUltimaFirmaPersistida)
            return;

        this.programarPersistenciaBorradorLocal();
    }

    private programarPersistenciaBorradorLocal(): void {
        const uid = `${this.draftUidActivo ?? ''}`.trim();
        if (uid.length < 1)
            return;

        if (this.draftPersistTimer)
            clearTimeout(this.draftPersistTimer);

        this.draftPersistTimer = setTimeout(() => {
            this.draftPersistTimer = null;
            this.persistirBorradorLocalAhora();
        }, NUEVA_RAZA_DRAFT_DEBOUNCE_MS);
    }

    private descartarBorradorLocalActivo(): void {
        const uid = this.obtenerUidSesionActiva() || this.draftUidActivo;
        if (`${uid ?? ''}`.trim().length < 1)
            return;
        this.draftSvc.descartarBorradorLocal(uid);
        this.draftUltimaFirmaPersistida = null;
    }

    private construirBorradorLocal(uid: string): NuevaRazaDraftContenido | null {
        if (`${uid ?? ''}`.trim().length < 1 || !this.tieneCreacionEnCurso())
            return null;

        return {
            selectedIndex: this.normalizarPasoIndex(this.pasoActivoIndex),
            formValue: this.clonarProfundo(this.form.getRawValue()),
            selections: {
                subtiposSeleccionados: idsUnicosOrdenados(this.subtiposSeleccionados),
                idiomasSeleccionados: idsUnicosOrdenados(this.idiomasSeleccionados),
                armasCompetenciaSeleccionadas: idsUnicosOrdenados(this.armasCompetenciaSeleccionadas),
                armadurasCompetenciaSeleccionadas: idsUnicosOrdenados(this.armadurasCompetenciaSeleccionadas),
                gruposArmaSeleccionados: idsUnicosOrdenados(this.gruposArmaSeleccionados),
                gruposArmaduraSeleccionados: idsUnicosOrdenados(this.gruposArmaduraSeleccionados),
            },
            searches: {
                clasePredilectaBusqueda: this.clasePredilectaBusqueda,
                tipoCriaturaDgsBusqueda: this.tipoCriaturaDgsBusqueda,
            },
            relacionQueries: this.clonarProfundo(this.relacionQueries),
            rows: {
                habilidadesBaseRows: this.clonarProfundo(this.habilidadesBaseRows),
                habilidadesCustomRows: this.clonarProfundo(this.habilidadesCustomRows),
                dotesRows: this.clonarProfundo(this.dotesRows),
                racialesRows: this.clonarProfundo(this.racialesRows),
                racialesPendientesRazaEnCreacionIds: idsUnicosOrdenados(Array.from(this.racialesPendientesRazaEnCreacionIds)),
                sortilegiosRows: this.clonarProfundo(this.sortilegiosRows),
                prerrequisitosMutacionRows: this.clonarProfundo(this.prerrequisitosMutacionRows),
                prerrequisitosMutacionSeleccionados: [...this.prerrequisitosMutacionSeleccionados],
                cambiosMutacionRows: this.clonarProfundo(this.cambiosMutacionRows),
                porEdades: this.porEdades,
                categoriasEdadRows: this.clonarProfundo(this.edades.categorias),
                pasosEdadRows: this.clonarProfundo(this.edades.pasos),
            },
        };
    }

    private restaurarDesdeBorradorLocal(borrador: NuevaRazaDraftV1): void {
        this.form.reset({
            ...this.getFormularioDefaultValues(),
            ...(borrador.formValue ?? {}),
        }, { emitEvent: false });
        this.pasoActivoIndex = this.normalizarPasoIndex(borrador.selectedIndex);

        this.subtiposSeleccionados = idsUnicosOrdenados(borrador.selections?.subtiposSeleccionados);
        this.idiomasSeleccionados = idsUnicosOrdenados(borrador.selections?.idiomasSeleccionados);
        this.armasCompetenciaSeleccionadas = idsUnicosOrdenados(borrador.selections?.armasCompetenciaSeleccionadas);
        this.armadurasCompetenciaSeleccionadas = idsUnicosOrdenados(borrador.selections?.armadurasCompetenciaSeleccionadas);
        this.gruposArmaSeleccionados = idsUnicosOrdenados(borrador.selections?.gruposArmaSeleccionados);
        this.gruposArmaduraSeleccionados = idsUnicosOrdenados(borrador.selections?.gruposArmaduraSeleccionados);

        this.clasePredilectaBusqueda = this.texto(borrador.searches?.clasePredilectaBusqueda);
        this.tipoCriaturaDgsBusqueda = this.texto(borrador.searches?.tipoCriaturaDgsBusqueda);
        this.relacionQueries = {
            subtiposSeleccionados: '',
            idiomasSeleccionados: '',
            armasCompetenciaSeleccionadas: '',
            armadurasCompetenciaSeleccionadas: '',
            gruposArmaSeleccionados: '',
            gruposArmaduraSeleccionados: '',
            ...(borrador.relacionQueries ?? {}),
        };

        this.habilidadesBaseRows = this.restaurarRows(borrador.rows?.habilidadesBaseRows, () => this.crearHabilidadBaseRow()) as HabilidadBaseRow[];
        this.habilidadesCustomRows = this.restaurarRows(borrador.rows?.habilidadesCustomRows, () => this.crearHabilidadCustomRow()) as HabilidadCustomRow[];
        this.dotesRows = this.restaurarRows(borrador.rows?.dotesRows, () => this.crearDoteRow()) as DoteRow[];
        this.racialesRows = this.restaurarRows(borrador.rows?.racialesRows, () => this.crearRacialRow()) as RacialRow[];
        this.racialesPendientesRazaEnCreacionIds = new Set(idsUnicosOrdenados(borrador.rows?.racialesPendientesRazaEnCreacionIds));
        this.sortilegiosRows = this.restaurarRows(borrador.rows?.sortilegiosRows, () => this.crearSortilegioRow()) as SortilegioRow[];
        this.prerrequisitosMutacionSeleccionados = (borrador.rows?.prerrequisitosMutacionSeleccionados ?? [])
            .filter((type): type is TipoEditorMutacion => esTipoDeMutacion(type));
        this.prerrequisitosMutacionRows = this.restaurarRows(borrador.rows?.prerrequisitosMutacionRows, () => null)
            .filter((row) => esTipoDeMutacion(row?.tipo));
        this.cambiosMutacionRows = this.restaurarRows(borrador.rows?.cambiosMutacionRows, () => null)
            .filter((row) => typeof row?.campo === 'string') as CambioMutacionRow[];
        this.porEdades = borrador.rows?.porEdades === true;
        this.edades = {
            categorias: this.restaurarRows(borrador.rows?.categoriasEdadRows, () => null),
            pasos: this.restaurarRows(borrador.rows?.pasosEdadRows, () => null),
        };

        this.selectorPrerrequisitosMutacionVisible = false;
        this.selectorPrerrequisitosMutacionFiltro = '';
        this.selectorPrerrequisitosMutacionTempKeys = [];
        this.refrescarDerivadasBorradorRestaurado();
    }

    private restaurarRows<T>(rows: any[] | null | undefined, fallbackFactory: () => T | null): any[] {
        const restored = (Array.isArray(rows) ? rows : [])
            .filter((row) => row && typeof row === 'object')
            .map((row) => ({
                ...this.clonarProfundo(row),
                uid: `${row.uid ?? ''}`.trim() || this.nuevoUid(),
            }));
        if (restored.length > 0)
            return restored;
        const fallback = fallbackFactory();
        return fallback ? [fallback] : [];
    }

    private refrescarDerivadasBorradorRestaurado(): void {
        this.sincronizarCamposDgsExtra();
        this.sincronizarManiobrabilidadConVuelo();
        this.sincronizarAlineamientoDesdeSeleccion();
        this.sincronizarBusquedaSiCatalogoDisponible('id_clase_predilecta', this.clasesPredilectas, (value) => this.clasePredilectaBusqueda = value);
        this.sincronizarBusquedaSiCatalogoDisponible('id_tipo_criatura_dgs', this.tiposCriatura, (value) => this.tipoCriaturaDgsBusqueda = value);
        this.form.updateValueAndValidity({ emitEvent: false });
    }

    private sincronizarBusquedaSiCatalogoDisponible<T>(controlName: string, items: T[], setValue: (value: string) => void): void {
        if (items.length > 0)
            this.sincronizarBusquedaDesdeControl(controlName, items, setValue);
    }

    private tieneCreacionEnCurso(): boolean {
        if (this.normalizarPasoIndex(this.pasoActivoIndex) > 0)
            return true;
        if (this.form.dirty)
            return true;

        const raw = this.form.getRawValue();
        if (this.texto(raw.nombre).length > 0 || this.texto(raw.descripcion).length > 0)
            return true;
        if (this.esTextoTecnicoEditado(raw.ataques_naturales)
            || this.esTextoTecnicoEditado(raw.reduccion_dano)
            || this.esTextoTecnicoEditado(raw.resistencia_conjuros)
            || this.esTextoTecnicoEditado(raw.resistencia_energia))
            return true;
        if (raw.oficial !== true || raw.mutada === true)
            return true;
        if (this.haySeleccionesRelacionadas())
            return true;
        if (this.hayRowsConContenido())
            return true;
        if (this.porEdades)
            return true;
        return this.hayValoresNumericosNoDefault(raw);
    }

    private haySeleccionesRelacionadas(): boolean {
        return this.subtiposSeleccionados.length > 0
            || this.idiomasSeleccionados.length > 0
            || this.armasCompetenciaSeleccionadas.length > 0
            || this.armadurasCompetenciaSeleccionadas.length > 0
            || this.gruposArmaSeleccionados.length > 0
            || this.gruposArmaduraSeleccionados.length > 0
            || this.prerrequisitosMutacionSeleccionados.length > 0
            || this.prerrequisitosMutacionRows.length > 0
            || this.cambiosMutacionRows.length > 0;
    }

    private hayRowsConContenido(): boolean {
        return this.habilidadesBaseRows.some((row) => this.numero(row.id_habilidad) > 0 || this.numero(row.cantidad) !== 0 || this.esTextoTecnicoEditado(row.varios)
            || this.texto(row.condicion).length > 0)
            || this.habilidadesCustomRows.some((row) => this.numero(row.id_habilidad) > 0 || this.numero(row.cantidad) !== 0)
            || this.dotesRows.some((row) => this.numero(row.id_dote) > 0 || this.numero(row.id_extra) > 0)
            || this.racialesRows.some((row) => this.numero(row.id_racial) > 0 || this.numero(row.opcional) !== 0)
            || this.sortilegiosRows.some((row) => this.numero(row.id_conjuro) > 0 || this.numero(row.nivel_lanzador) !== 1 || this.texto(row.usos_diarios) !== USOS_SORTILEGA_INICIALES || this.esTextoTecnicoEditado(row.descripcion));
    }

    private hayValoresNumericosNoDefault(raw: Record<string, any>): boolean {
        const defaults: Record<string, number> = {
            espacio: 5,
            alcance: 5,
            pagina: 1,
            mod_fue: 0,
            mod_des: 0,
            mod_cons: 0,
            mod_int: 0,
            mod_sab: 0,
            mod_car: 0,
            varios_armadura: 0,
            armadura_natural: 0,
            correr: 30,
            nadar: 0,
            volar: 0,
            trepar: 0,
            excavar: 0,
            dotes_extra: 0,
            puntos_extra_1: 0,
            puntos_extra: 0,
            ajuste_nivel: 0,
            altura_rango_inf: 0,
            altura_rango_sup: 0,
            peso_rango_inf: 0,
            peso_rango_sup: 0,
            edad_adulto: 0,
            edad_mediana: 0,
            edad_viejo: 0,
            edad_venerable: 0,
            edad_maxima_dados: 0,
            edad_maxima_caras: 0,
            edad_inicial_dados_1: 0,
            edad_inicial_caras_1: 0,
            edad_inicial_dados_2: 0,
            edad_inicial_caras_2: 0,
            edad_inicial_dados_3: 0,
            edad_inicial_caras_3: 0,
            ataque_base: 0,
            fortaleza: 0,
            reflejos: 0,
            voluntad: 0,
            dgs_extra: 0,
            dotes_dg: 0,
            puntos_hab: 0,
            puntos_hab_mult: 0,
        };
        return Object.keys(defaults).some((key) => this.numero(raw[key]) !== defaults[key]);
    }

    private esTextoTecnicoEditado(value: any): boolean {
        const text = normalizarTexto(value, true);
        return text.length > 0 && text !== 'no especifica';
    }

    private obtenerUidSesionActiva(): string {
        try {
            return `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        } catch {
            return '';
        }
    }

    private cargarCatalogos(): void {
        this.razaSvc.getRazas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (razas) => this.razasExistentes = Array.isArray(razas) ? razas : [], error: () => this.razasExistentes = [] });

        this.manualSvc.getManuales()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (manuales) => {
                    this.manuales = this.ordenar(manuales);
                    this.opcionesManuales = opcionesDeCatalogo(this.manuales);
                },
                error: () => this.manuales = []
            });

        this.claseSvc.getClases()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (clases) => {
                this.clases = this.ordenar(clases);
                // Sin la 0 («Cualquiera»): lanzar como «cualquier clase» no es nada; sin clase, la raza no lanza.
                this.opcionesClasesLanzamiento = opcionesDeCatalogo(this.clases.filter((clase) => this.numero(clase.Id) > 0));
                // Las de PNJ (adepto, combatiente…) nunca son asociadas (MM, pág. 294; `Clase_pnj` de la clase).
                this.opcionesClasesAsociadas = opcionesDeCatalogo(this.clases.filter((clase) => this.numero(clase.Id) > 0 && clase.Clase_pnj !== true));
                this.sincronizarBusquedaDesdeControl('id_clase_predilecta', this.clasesPredilectas, (value) => this.clasePredilectaBusqueda = value);
                this.catalogosParaModificar.marcar('clases');
            }, error: () => {
                this.clases = [];
                this.catalogosParaModificar.marcar('clases');
            } });

        this.dominioSvc.getDominios()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (dominios) => {
                this.dominios = this.ordenar(dominios);
                this.opcionesDominios = opcionesDeCatalogo(this.dominios);
            }, error: () => this.dominios = [] });

        this.tamanoSvc.getTamanos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (tamanos) => {
                this.tamanos = this.ordenarPorId(tamanos);
                this.ponerTamanoMediano();
                this.catalogosParaModificar.marcar('tamanos');
            }, error: () => {
                this.tamanos = [];
                this.catalogosParaModificar.marcar('tamanos');
            } });

        this.tipoCriaturaSvc.getTiposCriatura()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (tipos) => {
                this.tiposCriatura = this.ordenar(tipos);
                this.sincronizarSelect('id_tipo_criatura', this.tiposCriatura, 'humanoide');
                this.sincronizarCamposDgsExtra();
                this.catalogosParaModificar.marcar('tiposCriatura');
            }, error: () => {
                this.tiposCriatura = [];
                this.catalogosParaModificar.marcar('tiposCriatura');
            } });

        this.alineamientoSvc.getAlineamientosCombinacionesCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (alineamientos) => {
                this.alineamientos = this.ordenarPorId(alineamientos);
                this.sincronizarAlineamientoDesdeSeleccion();
                this.catalogosParaModificar.marcar('alineamientos');
            }, error: () => {
                this.alineamientos = [];
                this.catalogosParaModificar.marcar('alineamientos');
            } });

        this.alineamientoSvc.getAlineamientosBasicosCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (alineamientos) => {
                this.alineamientosBasicos = this.ordenarPorId(conOpcionSinValor(alineamientos, SIN_ALINEAMIENTO_BASICO));
                this.sincronizarSelectConFallback('id_alineamiento_basico', this.alineamientosBasicos, 'no aplica');
                this.sincronizarAlineamientoDesdeSeleccion();
                this.catalogosParaModificar.marcar('alineamientosBasicos');
            }, error: () => {
                this.alineamientosBasicos = [];
                this.catalogosParaModificar.marcar('alineamientosBasicos');
            } });

        this.alineamientoSvc.getAlineamientosPrioridadesCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (prioridades) => {
                this.prioridadesAlineamiento = this.ordenarPorId(conOpcionSinValor(prioridades, SIN_PRIORIDAD));
                this.asegurarPrioridadAlineamientoVisible();
                this.sincronizarAlineamientoDesdeSeleccion();
                this.catalogosParaModificar.marcar('prioridades');
            }, error: () => {
                this.prioridadesAlineamiento = [];
                this.catalogosParaModificar.marcar('prioridades');
            } });

        this.alineamientoSvc.getAlineamientosPreferenciaLeyCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (preferencias) => {
                this.preferenciasLey = this.ordenarPorId(conOpcionSinValor(preferencias, { ...SIN_PREFERENCIA }));
                this.sincronizarSelectConFallback('id_preferencia_ley', this.preferenciasLey, 'ninguna preferencia');
                this.sincronizarAlineamientoDesdeSeleccion();
                this.catalogosParaModificar.marcar('preferenciasLey');
            }, error: () => {
                this.preferenciasLey = [];
                this.catalogosParaModificar.marcar('preferenciasLey');
            } });

        this.alineamientoSvc.getAlineamientosPreferenciaMoralCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (preferencias) => {
                this.preferenciasMoral = this.ordenarPorId(conOpcionSinValor(preferencias, { ...SIN_PREFERENCIA }));
                this.sincronizarSelectConFallback('id_preferencia_moral', this.preferenciasMoral, 'ninguna preferencia');
                this.sincronizarAlineamientoDesdeSeleccion();
                this.catalogosParaModificar.marcar('preferenciasMoral');
            }, error: () => {
                this.preferenciasMoral = [];
                this.catalogosParaModificar.marcar('preferenciasMoral');
            } });

        this.subtipoSvc.getSubtipos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (subtipos) => this.subtipos = this.ordenar(subtipos), error: () => this.subtipos = [] });

        this.idiomaSvc.getIdiomas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (idiomas) => {
                    this.idiomas = this.ordenar(idiomas);
                    this.opcionesIdiomas = opcionesDeCatalogo(this.idiomas);
                },
                error: () => {
                    this.idiomas = [];
                    this.opcionesIdiomas = [];
                },
            });

        this.habilidadSvc.getHabilidades()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (habilidades) => {
                this.habilidades = this.ordenar(habilidades.map((item) => ({ ...item, Id: item.Id_habilidad })));
                this.catalogosParaModificar.marcar('habilidades');
            }, error: () => {
                this.habilidades = [];
                this.catalogosParaModificar.marcar('habilidades');
            } });

        this.habilidadSvc.getHabilidadesCustom()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (habilidades) => this.habilidadesCustom = this.ordenar(habilidades.map((item) => ({ ...item, Id: item.Id_habilidad }))), error: () => this.habilidadesCustom = [] });
        this.habilidadSvc.habilidadesCustomMutadas$
            .pipe(takeUntil(this.destroy$))
            .subscribe((habilidad) => this.upsertHabilidadCustom(habilidad));

        this.doteSvc.getDotes()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (dotes) => this.dotes = this.ordenar(dotes), error: () => this.dotes = [] });

        this.racialSvc.getRaciales()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (raciales) => {
                this.raciales = this.ordenar(raciales);
                this.opcionesRaciales = opcionesDeCatalogo(this.raciales);
            }, error: () => this.raciales = [] });

        this.conjuroSvc.getConjuros()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (conjuros) => {
                this.conjuros = this.ordenar(conjuros);
                this.opcionesConjuros = opcionesDeCatalogo(this.conjuros);
            }, error: () => this.conjuros = [] });

        this.categoriaEdadSvc.getCategoriasEdad()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (categorias) => this.categoriasEdadCatalogo = categorias, error: () => this.categoriasEdadCatalogo = [] });

        this.armaSvc.getArmas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (armas) => this.armas = this.ordenar(armas), error: () => this.armas = [] });

        this.armaduraSvc.getArmaduras()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (armaduras) => this.armaduras = this.ordenar(armaduras), error: () => this.armaduras = [] });

        this.grupoArmaSvc.getGruposArmas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (grupos) => this.gruposArmas = this.ordenar(grupos), error: () => this.gruposArmas = [] });

        this.grupoArmaduraSvc.getGruposArmaduras()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (grupos) => this.gruposArmaduras = this.ordenar(grupos), error: () => this.gruposArmaduras = [] });

        this.razaCatalogosSvc.getManiobrabilidades()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (items) => {
                this.maniobrabilidades = this.ordenarPorId(conOpcionSinValor(items, SIN_VUELO));
                this.sincronizarSelect('id_maniobrabilidad', this.maniobrabilidades, 'no vuela');
                this.sincronizarManiobrabilidadConVuelo();
                this.catalogosParaModificar.marcar('maniobrabilidades');
            }, error: () => {
                this.maniobrabilidades = [];
                this.catalogosParaModificar.marcar('maniobrabilidades');
            } });

        this.razaCatalogosSvc.getTiposDado()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (items) => {
                this.tiposDado = this.ordenarPorId(items);
                this.sincronizarCamposDgsExtra();
                this.catalogosParaModificar.marcar('tiposDado');
            }, error: () => {
                this.tiposDado = [];
                this.catalogosParaModificar.marcar('tiposDado');
            } });

        // Lo que admite una raza mutada: sus tipos de prerrequisito (que se registran en el editor común) y sus campos.
        this.razaSvc.getModeloMutacion()
            .then((modelo) => {
                this.modeloMutacion = modelo;
                const tipos = registrarTiposDeMutacion(modelo.Tipos_de_prerrequisito);
                this.prerrequisitosMutacionOpciones = tipos.map((key) => ({ key, label: getPrerequisiteDefinition(key).label }));
            })
            .catch(() => this.modeloMutacion = null)
            .finally(() => this.catalogosParaModificar.marcar('modeloMutacion'));
    }

    private recalcularPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'razas');
        this.mensajePermisosInsuficientes = this.userSvc.getPermissionDeniedMessage();
        if (!this.draftInicializacionHabilitada)
            return;
        if (this.puedeCrear) {
            void this.intentarInicializarBorradorLocal();
            return;
        }
        this.persistirBorradorLocalAhora();
        this.desactivarPersistenciaBorradorLocal();
    }

    private validarReglasDominio(): string | null {
        const problemaArmas = problemaDeArmasNaturales(this.armasNaturales, false);
        if (problemaArmas) {
            this.pasoActivoIndex = CAMPOS_RAZA['armas_naturales'].paso;
            return problemaArmas;
        }
        if (this.edicion.nombreOcupado(this.razasExistentes, this.form.controls.nombre.value ?? ''))
            return 'Ya existe una raza con ese nombre.';
        if (this.form.controls.mutada.value === true) {
            const mutacion = this.problemaDeMutacion();
            if (mutacion) {
                this.pasoActivoIndex = CAMPOS_RAZA['mutada'].paso;
                return mutacion;
            }
        }
        if (this.habilidadesBaseRows.some((row) => this.numero(row.id_habilidad) > 0 && this.parteCondicionalIncompleta(row))) {
            this.pasoActivoIndex = CAMPOS_RAZA['habilidades'].paso;
            return 'Un bonificador que solo vale en un caso lleva lo que suma y cuándo («+2 bajo tierra»).';
        }
        const doteSinExtra = this.dotesRows.find((row) => this.numero(row.id_dote) > 0 && this.doteRequiereExtra(row.id_dote) && this.numero(row.id_extra) <= 0);
        if (doteSinExtra)
            return 'Hay una dote que requiere extra y todavía no lo tiene seleccionado.';
        if (this.form.errors?.['rangosInvalidos'])
            return 'Revisa rangos de altura, peso y edades.';
        const edades = this.problemaDeEdades();
        if (edades) {
            this.pasoActivoIndex = CAMPOS_RAZA['categorias_edad'].paso;
            return edades;
        }
        return null;
    }

    /** La condición sin su cantidad, o al revés (`400 condicion_incompleta` de la API). */
    private parteCondicionalIncompleta(row: HabilidadBaseRow): boolean {
        return (this.texto(row.condicion).length > 0) !== (this.numero(row.cantidad_condicional) !== 0);
    }

    /** `cantidad_condicional` y `condicion` si la fila los lleva; si no, nada (cuenta siempre). */
    private parteCondicionalAEnviar(row: HabilidadBaseRow): { cantidad_condicional?: number; condicion?: string; } {
        const condicion = this.texto(row.condicion);
        const cantidad = this.numero(row.cantidad_condicional);
        return condicion.length > 0 && cantidad !== 0 ? { cantidad_condicional: cantidad, condicion } : {};
    }

    private limpiarDatosMutacion(): void {
        this.cambiosMutacionRows = [];
        this.prerrequisitosMutacionRows = [];
        this.prerrequisitosMutacionSeleccionados = [];
        this.selectorPrerrequisitosMutacionTempKeys = [];
        this.selectorPrerrequisitosMutacionVisible = false;
    }

    private sincronizarCamposDgsExtra(): void {
        const tipoDadoControl = this.form.controls.id_tipo_dado;
        const tipoCriaturaControl = this.form.controls.id_tipo_criatura_dgs;
        const salvaciones = [this.form.controls.fortaleza, this.form.controls.reflejos, this.form.controls.voluntad];
        const vdControl = this.form.controls.vd;
        if (!this.tieneDgsExtra()) {
            tipoDadoControl.clearValidators();
            tipoCriaturaControl.clearValidators();
            // El VD de la raza no se enseña ni se manda sin DG raciales (se queda lo escrito por si vuelven).
            vdControl.clearValidators();
            vdControl.updateValueAndValidity({ emitEvent: false });
            // Sin DG raciales no hay salvaciones de DG: a 0 y sin editar.
            salvaciones.forEach((control) => control.disable({ emitEvent: false }));
            this.form.patchValue({
                fortaleza: 0,
                reflejos: 0,
                voluntad: 0,
                ataque_base: 0,
                dotes_dg: 0,
                puntos_hab: 0,
                puntos_hab_mult: 0,
                id_tipo_dado: 0,
                id_tipo_criatura_dgs: 0,
            }, { emitEvent: false });
            this.tipoCriaturaDgsBusqueda = '';
            tipoDadoControl.updateValueAndValidity({ emitEvent: false });
            tipoCriaturaControl.updateValueAndValidity({ emitEvent: false });
            return;
        }

        salvaciones.forEach((control) => control.enable({ emitEvent: false }));
        // En una raza por edades no se pide (`pideVdDeRaza`): cuenta el de cada categoría.
        vdControl.setValidators(this.porEdades ? [] : [vdDeRazaValidator]);
        vdControl.updateValueAndValidity({ emitEvent: false });
        tipoDadoControl.setValidators([Validators.min(1)]);
        tipoCriaturaControl.setValidators([Validators.min(1)]);
        if (this.numero(tipoDadoControl.value) <= 0)
            this.sincronizarSelectConFallback('id_tipo_dado', this.tiposDado);
        if (this.numero(tipoCriaturaControl.value) <= 0)
            this.sincronizarSelect('id_tipo_criatura_dgs', this.tiposCriatura, 'humanoide');
        this.sincronizarBusquedaDesdeControl('id_tipo_criatura_dgs', this.tiposCriatura, (value) => this.tipoCriaturaDgsBusqueda = value);
        tipoDadoControl.updateValueAndValidity({ emitEvent: false });
        tipoCriaturaControl.updateValueAndValidity({ emitEvent: false });
    }

    private getIdExtraHabilidadBase(row: HabilidadBaseRow): number {
        if (!this.habilidadBaseSoportaExtra(row))
            return 0;
        const extraId = this.numero(row.id_extra);
        return this.esExtraHabilidadBaseValido(row, extraId) ? extraId : 0;
    }

    private esExtraHabilidadBaseValido(row: HabilidadBaseRow, idExtra: number): boolean {
        return this.getExtrasHabilidadBase(row).some((extra) => this.numero(extra.Id) === this.numero(idExtra));
    }

    private getIdTipoDadoPayload(): number {
        const current = this.numero(this.form.controls.id_tipo_dado.value);
        if (current > 0)
            return current;
        return this.numero(this.tiposDado[0]?.Id);
    }

    private getIdTipoCriaturaDgsPayload(): number {
        const current = this.numero(this.form.controls.id_tipo_criatura_dgs.value);
        if (current > 0)
            return current;
        const humanoide = this.tiposCriatura.find((item) => normalizarTexto(item.Nombre, true).includes('humanoide'));
        return this.numero(humanoide?.Id ?? this.tiposCriatura[0]?.Id);
    }

    private buscarCatalogo<T>(items: T[] | null | undefined, id: unknown): T | undefined {
        const target = this.numero(id);
        return (items ?? []).find((item) => this.getCatalogId(item) === target);
    }

    private etiquetaCatalogo(items: any[] | null | undefined, id: number): string {
        const item = this.buscarCatalogo(items, id);
        return item ? this.getCatalogLabel(item) : `#${this.numero(id)}`;
    }

    private filtrarCatalogo<T>(items: T[] | null | undefined, query: string | null | undefined, selectedIds: number[] = []): T[] {
        const selected = new Set(idsUnicosOrdenados(selectedIds));
        const normalizedQuery = normalizarTexto(query ?? '', true);
        return [...(Array.isArray(items) ? items : [])]
            .filter((item) => {
                const id = this.getCatalogId(item);
                if (selected.has(id))
                    return false;
                if (!normalizedQuery)
                    return true;
                const searchable = normalizarTexto(`${this.getCatalogLabel(item)} ${this.getCatalogMeta(item)}`, true);
                return searchable.includes(normalizedQuery);
            })
            .slice(0, 40);
    }

    private getCatalogId(item: any): number {
        return this.numero(item?.Id ?? item?.Id_habilidad ?? item?.Id_extra ?? item?.id);
    }

    private getCatalogLabel(item: any): string {
        return `${item?.Nombre ?? item?.Extra ?? item?.nombre ?? item?.name ?? ''}`.trim();
    }

    private getCatalogMeta(item: any): string {
        const manual = typeof item?.Manual === 'string' ? item.Manual : item?.Manual?.Nombre;
        return [
            manual,
            item?.Origen,
            item?.Caracteristica,
            item?.Tipo_arma?.Nombre,
            item?.Tipo_dano?.Nombre,
        ].filter(Boolean).join(' ');
    }

    private rangosValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const getDecimal = (name: string) => this.numeroDecimal(control.get(name)?.value);
            const getInt = (name: string) => this.numero(control.get(name)?.value);
            const alturaInf = getDecimal('altura_rango_inf');
            const alturaSup = getDecimal('altura_rango_sup');
            const pesoInf = getDecimal('peso_rango_inf');
            const pesoSup = getDecimal('peso_rango_sup');
            const adulto = getInt('edad_adulto');
            const mediana = getInt('edad_mediana');
            const viejo = getInt('edad_viejo');
            const venerable = getInt('edad_venerable');
            // La edad máxima lleva sus dados y sus caras, o ninguno (`400 edad_maxima_incompleta`).
            const edadMaximaIncompleta = (getInt('edad_maxima_dados') > 0) !== (getInt('edad_maxima_caras') > 0);
            // Lo mismo, la edad inicial de cada grupo (`400 edad_inicial_incompleta`).
            const edadInicialIncompleta = [1, 2, 3].some((g) => (getInt(`edad_inicial_dados_${g}`) > 0) !== (getInt(`edad_inicial_caras_${g}`) > 0));
            // Las mismas reglas que la API: mínimo <= máximo y adulto <= mediana <= viejo <= venerable (0: sin dato).
            const invalid = alturaInf > alturaSup
                || pesoInf > pesoSup
                || !(adulto <= mediana && mediana <= viejo && viejo <= venerable)
                || edadMaximaIncompleta
                || edadInicialIncompleta;
            return invalid ? { rangosInvalidos: true } : null;
        };
    }

    /** Un texto técnico opcional (vacío es «No especifica»), con su máximo; la resistencia a conjuros puede ser «14». */
    private textoOpcionalValidator(max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = this.texto(control.value);
            if (!value)
                return null;
            if (value.length > max)
                return { maxlength: { requiredLength: max, actualLength: value.length } };
            return null;
        };
    }

    private alineamientoResueltoValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const id = this.numero(control.value);
            if (id < 0)
                return { alineamientoInvalido: true };
            if (this.alineamientos.length < 1)
                return null;
            return this.alineamientos.some((item) => this.numero(item.Id) === id)
                ? null
                : { alineamientoInvalido: true };
        };
    }

    /** `prerrequisitos_mutacion[]` del cuerpo: cada fila de un tipo marcado, con lo que pide su tipo. */
    private buildPrerrequisitosMutacion(): RazaCreatePrerrequisitoMutacion[] {
        return this.prerrequisitosMutacionRows
            .filter((row) => this.prerrequisitosMutacionSeleccionados.includes(row.tipo as TipoEditorMutacion))
            .filter((row) => tipoDeMutacion(row.tipo) !== null)
            .map((row) => getPrerequisiteDefinition(row.tipo).toPayload(row, this.prerrequisitosMutacionCatalogContext))
            .filter((item): item is Record<string, any> => !!item) as RazaCreatePrerrequisitoMutacion[];
    }

    /** `cambios_mutacion[]` del cuerpo: las filas con campo y operación, con su valor (pasos) o sus elementos. */
    private buildCambiosMutacion(): RazaCreateCambioMutacion[] {
        return this.cambiosMutacionRows
            .filter((row) => this.texto(row.campo).length > 0 && this.texto(row.operacion).length > 0)
            .map((row) => {
                const cambio: RazaCreateCambioMutacion = { campo: row.campo, operacion: row.operacion };
                if (this.operacionConValor(row.operacion))
                    cambio.valor = this.numero(row.valor);
                if (this.operacionConElementos(row.operacion))
                    cambio.elementos = idsUnicosOrdenados(row.elementos);
                return cambio;
            });
    }

    /** Lo que la API rechazaría de la mutación: filas sin completar o repetidas. */
    private problemaDeMutacion(): string | null {
        if (this.prerrequisitosMutacionRows.length > 0 && !this.modeloMutacion)
            return 'Todavía se está cargando lo que admite una raza mutada; vuelve a intentarlo en un momento.';
        if (arePrerequisitesIncomplete(this.prerrequisitosMutacionRows, this.prerrequisitosMutacionSeleccionados))
            return 'Hay prerrequisitos de mutación pendientes de completar.';
        const campos = this.cambiosMutacionRows.map((row) => row.campo).filter((campo) => this.texto(campo).length > 0);
        if (new Set(campos).size !== campos.length)
            return 'Cada campo lleva un solo cambio sobre la raza base.';
        for (const row of this.cambiosMutacionRows) {
            if (!this.texto(row.campo) || !this.texto(row.operacion))
                return 'Hay un cambio sobre la raza base sin campo o sin operación.';
            if (this.operacionConValor(row.operacion) && this.numero(row.valor) === 0)
                return 'Los pasos de tamaño necesitan cuántas categorías (de −8 a 8, no 0).';
            if (this.operacionConElementos(row.operacion) && idsUnicosOrdenados(row.elementos).length < 1)
                return 'Elige qué elementos de la raza base se quitan o se conservan.';
        }
        return null;
    }

    /** La referencia de un prerrequisito de mutación, del catálogo que dice su tipo: los grandes, los que ya carga el
     * formulario; los pequeños, los del modelo. */
    private getCatalogoPrerrequisitoMutacion(type: PrerequisiteType): PrerequisiteCatalogItem[] {
        const catalogo = tipoDeMutacion(type)?.Catalogo ?? null;
        return catalogo ? this.opcionesDeCatalogoMutacion(catalogo) : [];
    }

    private opcionesDeCatalogoMutacion(catalogo: string): PrerequisiteCatalogItem[] {
        const de = (items: { Id: unknown; Nombre: unknown; }[]) =>
            items.map((item) => ({ id: this.numero(item.Id), nombre: this.texto(item.Nombre) })).filter((item) => item.id > 0);
        switch (catalogo) {
            case 'tipos_criatura': return de(this.tiposCriatura);
            case 'subtipos': return de(this.subtipos);
            case 'razas': return de(this.razasExistentes);
            case 'tamanos': return de(this.tamanos);
            case 'clases': return de(this.clases);
            case 'raciales': return de(this.raciales);
            case 'conjuros': return de(this.conjuros);
            case 'dotes': return de(this.dotes);
            case 'idiomas': return de(this.idiomas);
            case 'habilidades': return de(this.habilidades.map((item) => ({ Id: item.Id_habilidad, Nombre: item.Nombre })));
            case 'armas_naturales': return this.opcionesDeArmasNaturales();
            default: return de(this.modeloMutacion?.Catalogos[catalogo] ?? []);
        }
    }

    /** Las armas naturales del catálogo (`GET /armas-naturales`), que se piden la primera vez que hacen falta. */
    private opcionesDeArmasNaturales(): PrerequisiteCatalogItem[] {
        if (this.tiposArmasNaturales === null) {
            this.tiposArmasNaturales = [];
            this.injector.get(ArmaNaturalService).getTipos()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (tipos) => this.tiposArmasNaturales = tipos
                        .map((tipo) => ({ id: this.numero(tipo.Id), nombre: this.texto(tipo.Nombre) })),
                    error: () => this.tiposArmasNaturales = [],
                });
        }
        return this.tiposArmasNaturales;
    }

    private getNombreCatalogoPrerrequisitoMutacion(type: PrerequisiteType, id: number): string {
        return findCatalogName(type, id, this.getCatalogoPrerrequisitoMutacion(type));
    }

    private syncFilasPrerrequisitosMutacion(tipos: TipoEditorMutacion[]): PrerequisiteRowModel[] {
        const selected = new Set(tipos);
        let next = this.prerrequisitosMutacionRows.filter((row) => selected.has(row.tipo as TipoEditorMutacion));
        tipos.forEach((tipo) => {
            if (!next.some((row) => row.tipo === tipo))
                next = [...next, getPrerequisiteDefinition(tipo).createDefaultRow()];
        });
        return next;
    }

    // --- Los cambios sobre la raza base --------------------------------------------------------------------------------

    get camposMutacion(): CampoMutacion[] {
        return this.modeloMutacion?.Campos ?? [];
    }

    campoMutacion(clave: string): CampoMutacion | null {
        return this.camposMutacion.find((campo) => campo.Campo === clave) ?? null;
    }

    /** Los campos que se pueden elegir en una fila: los que no lleva ya otra fila. */
    camposMutacionLibres(row: CambioMutacionRow): CampoMutacion[] {
        const usados = new Set(this.cambiosMutacionRows.filter((otra) => otra.uid !== row.uid).map((otra) => otra.campo));
        return this.camposMutacion.filter((campo) => !usados.has(campo.Campo));
    }

    nombreOperacionMutacion(clave: string): string {
        return this.modeloMutacion?.Operaciones.find((operacion) => operacion.Clave === clave)?.Nombre ?? clave;
    }

    descripcionOperacionMutacion(clave: string): string {
        return this.modeloMutacion?.Operaciones.find((operacion) => operacion.Clave === clave)?.Descripcion ?? '';
    }

    /** Las operaciones de una fila: las que admite su campo, sin la regla de hoy (sin fila es la que se aplica). */
    operacionesMutacion(row: CambioMutacionRow): string[] {
        const campo = this.campoMutacion(row.campo);
        return (campo?.Operaciones ?? []).filter((operacion) => operacion !== campo?.Por_defecto);
    }

    operacionConValor(operacion: string): boolean {
        return operacion === 'pasos';
    }

    operacionConElementos(operacion: string): boolean {
        return operacion === 'quitar' || operacion === 'conservar';
    }

    elementosDeCambio(row: CambioMutacionRow): PrerequisiteCatalogItem[] {
        const catalogo = this.campoMutacion(row.campo)?.Catalogo_elementos;
        return catalogo ? this.opcionesDeCatalogoMutacion(catalogo) : [];
    }

    agregarCambioMutacion(): void {
        this.cambiosMutacionRows = [...this.cambiosMutacionRows, this.crearCambioMutacionRow()];
    }

    quitarCambioMutacion(uid: string): void {
        this.cambiosMutacionRows = this.cambiosMutacionRows.filter((row) => row.uid !== uid);
    }

    actualizarCambioMutacion(uid: string, patch: Partial<CambioMutacionRow>): void {
        this.cambiosMutacionRows = this.cambiosMutacionRows.map((row) => {
            if (row.uid !== uid)
                return row;
            const next = { ...row, ...patch };
            // Otro campo: su operación y lo que va con ella vuelven a empezar.
            if (patch.campo !== undefined && patch.campo !== row.campo)
                Object.assign(next, { operacion: patch.operacion ?? '', valor: patch.valor ?? null, elementos: patch.elementos ?? [] });
            if (!this.operacionConValor(next.operacion))
                next.valor = null;
            else if (next.valor === null)
                next.valor = 1;
            if (!this.operacionConElementos(next.operacion))
                next.elementos = [];
            return next;
        });
    }

    trackByCambioMutacion(_: number, row: CambioMutacionRow): string {
        return row.uid;
    }

    private crearCambioMutacionRow(): CambioMutacionRow {
        return { uid: uidDeFila('cambio-mutacion'), campo: '', operacion: '', valor: null, elementos: [] };
    }

    private resetRows(): void {
        this.habilidadesBaseRows = [this.crearHabilidadBaseRow()];
        this.habilidadesCustomRows = [this.crearHabilidadCustomRow()];
        this.dotesRows = [this.crearDoteRow()];
        this.racialesRows = [this.crearRacialRow()];
        this.racialesPendientesRazaEnCreacionIds.clear();
        this.sortilegiosRows = [this.crearSortilegioRow()];
    }

    private getFormularioDefaultValues(): Record<string, any> {
        return {
            nombre: '',
            descripcion: '',
            ataques_naturales: TEXTO_SIN_ESPECIFICAR,
            espacio: 5,
            alcance: 5,
            id_manual: 0,
            pagina: 1,
            id_clase_predilecta: null,
            mod_fue: 0,
            mod_des: 0,
            mod_cons: 0,
            mod_int: 0,
            mod_sab: 0,
            mod_car: 0,
            varios_armadura: 0,
            armadura_natural: 0,
            correr: 30,
            nadar: 0,
            volar: 0,
            id_maniobrabilidad: 0,
            trepar: 0,
            excavar: 0,
            dotes_extra: 0,
            puntos_extra_1: 0,
            puntos_extra: 0,
            id_tamano: 0,
            ajuste_nivel: 0,
            reduccion_dano: TEXTO_SIN_ESPECIFICAR,
            resistencia_conjuros: TEXTO_SIN_ESPECIFICAR,
            resistencia_energia: TEXTO_SIN_ESPECIFICAR,
            altura_rango_inf: 0,
            altura_rango_sup: 0,
            peso_rango_inf: 0,
            peso_rango_sup: 0,
            edad_adulto: 0,
            edad_mediana: 0,
            edad_viejo: 0,
            edad_venerable: 0,
            edad_maxima_dados: 0,
            edad_maxima_caras: 0,
            edad_inicial_dados_1: 0,
            edad_inicial_caras_1: 0,
            edad_inicial_dados_2: 0,
            edad_inicial_caras_2: 0,
            edad_inicial_dados_3: 0,
            edad_inicial_caras_3: 0,
            vd: null,
            vd_mod_clases_pj: null,
            vd_mod_clases_pnj: null,
            clases_asociadas: [],
            armas_naturales: [],
            id_tipo_criatura: 0,
            ataque_base: 0,
            fortaleza: 0,
            reflejos: 0,
            voluntad: 0,
            dgs_extra: 0,
            id_tipo_dado: 0,
            id_tipo_criatura_dgs: 0,
            dotes_dg: 0,
            puntos_hab: 0,
            puntos_hab_mult: 0,
            mutada: false,
            id_alineamiento: 0,
            alineamiento_modo: 'basico',
            id_alineamiento_basico: 0,
            id_prioridad_alineamiento: 0,
            id_preferencia_ley: 0,
            id_preferencia_moral: 0,
            oficial: true,
            cuadrupedo: false,
            idiomas_adicionales_cualquiera: true,
            idiomas_adicionales: [],
            id_clase_lanzamiento: 0,
            nivel_lanzamiento: 0,
            lanzamiento_listas: [],
        };
    }

    private resetFormularioManteniendoCatalogos(): void {
        this.form.reset(this.getFormularioDefaultValues());
        this.pasoActivoIndex = 0;
        this.subtiposSeleccionados = [];
        this.clasePredilectaBusqueda = '';
        this.tipoCriaturaDgsBusqueda = '';
        this.idiomasSeleccionados = [];
        this.armasCompetenciaSeleccionadas = [];
        this.armadurasCompetenciaSeleccionadas = [];
        this.gruposArmaSeleccionados = [];
        this.gruposArmaduraSeleccionados = [];
        this.relacionQueries = {
            subtiposSeleccionados: '',
            idiomasSeleccionados: '',
            armasCompetenciaSeleccionadas: '',
            armadurasCompetenciaSeleccionadas: '',
            gruposArmaSeleccionados: '',
            gruposArmaduraSeleccionados: '',
        };
        this.limpiarDatosMutacion();
        this.resetRows();
        this.porEdades = false;
        this.edades = { categorias: [], pasos: [] };
        this.sincronizarSelect('id_clase_predilecta', this.clases);
        this.ponerTamanoMediano();
        this.sincronizarSelect('id_tipo_criatura', this.tiposCriatura, 'humanoide');
        this.sincronizarSelect('id_maniobrabilidad', this.maniobrabilidades, 'no vuela');
        this.sincronizarCamposDgsExtra();
        this.sincronizarSelectConFallback('id_alineamiento_basico', this.alineamientosBasicos, 'no aplica');
        this.asegurarPrioridadAlineamientoVisible();
        this.sincronizarSelectConFallback('id_preferencia_ley', this.preferenciasLey, 'ninguna preferencia');
        this.sincronizarSelectConFallback('id_preferencia_moral', this.preferenciasMoral, 'ninguna preferencia');
        this.sincronizarManiobrabilidadConVuelo();
        this.sincronizarAlineamientoDesdeSeleccion();
    }

    /**
     * Rellena el formulario con la raza que se modifica (su `GET`), de forma que guardar sin tocar nada mande lo mismo que
     * llegó, también sus edades (los pasos, con su id: la API los conserva y los personajes apuntan a ellos).
     */
    private hidratarDesdeRaza(raza: Raza): void {
        this.razaCargada = raza;
        const referencias = raza.Edicion;
        const dgs = referencias?.Dgs_raciales;
        const alineamiento = this.controlesDeAlineamiento(raza.Alineamiento?.Id);
        this.form.reset({
            ...this.getFormularioDefaultValues(),
            nombre: this.texto(raza.Nombre),
            descripcion: this.texto(raza.Descripcion),
            ataques_naturales: textoOSinEspecificar(raza.Ataques_naturales),
            espacio: this.numero(raza.Espacio),
            alcance: this.numero(raza.Alcance),
            id_manual: this.numero(referencias?.Manual?.Id),
            pagina: this.numero(referencias?.Manual?.Pagina),
            id_clase_predilecta: referencias
                ? (referencias.Clase_predilecta ? this.numero(referencias.Clase_predilecta.Id) : SIN_CLASE_PREDILECTA_FORMULARIO.Id)
                : null,
            mod_fue: this.numero(raza.Modificadores?.Fuerza),
            mod_des: this.numero(raza.Modificadores?.Destreza),
            mod_cons: this.numero(raza.Modificadores?.Constitucion),
            mod_int: this.numero(raza.Modificadores?.Inteligencia),
            mod_sab: this.numero(raza.Modificadores?.Sabiduria),
            mod_car: this.numero(raza.Modificadores?.Carisma),
            varios_armadura: this.numero(raza.Varios_armadura),
            armadura_natural: this.numero(raza.Armadura_natural),
            correr: this.numero(raza.Correr),
            nadar: this.numero(raza.Nadar),
            volar: this.numero(raza.Volar),
            id_maniobrabilidad: this.numero(raza.Maniobrabilidad?.Id),
            trepar: this.numero(raza.Trepar),
            excavar: this.numero(raza.Excavar),
            dotes_extra: this.numero(raza.Dotes_adicionales),
            puntos_extra_1: this.numero(raza.Puntos_habilidad_extra_primer_nivel),
            puntos_extra: this.numero(raza.Puntos_habilidad_extra_por_nivel),
            cuadrupedo: raza.Cuadrupedo === true,
            // Sin dato, cualquiera (como la creación); con «cualquiera» la API no da la lista.
            idiomas_adicionales_cualquiera: raza.Idiomas_adicionales_cualquiera !== false,
            idiomas_adicionales: filasDeIds(raza.Idiomas_adicionales),
            id_tamano: this.numero(raza.Tamano?.Id),
            ajuste_nivel: this.numero(raza.Ajuste_nivel),
            reduccion_dano: textoOSinEspecificar(raza.Reduccion_dano),
            resistencia_conjuros: textoOSinEspecificar(raza.Resistencia_magica),
            resistencia_energia: textoOSinEspecificar(raza.Resistencia_energia),
            altura_rango_inf: this.numeroDecimal(raza.Altura_rango_inf),
            altura_rango_sup: this.numeroDecimal(raza.Altura_rango_sup),
            peso_rango_inf: this.numeroDecimal(raza.Peso_rango_inf),
            peso_rango_sup: this.numeroDecimal(raza.Peso_rango_sup),
            edad_adulto: this.numero(raza.Edad_adulto),
            edad_mediana: this.numero(raza.Edad_mediana),
            edad_viejo: this.numero(raza.Edad_viejo),
            edad_venerable: this.numero(raza.Edad_venerable),
            edad_maxima_dados: this.numero(raza.Edad_maxima_dados),
            edad_maxima_caras: this.numero(raza.Edad_maxima_caras),
            edad_inicial_dados_1: this.numero(raza.Edad_inicial_dados_1),
            edad_inicial_caras_1: this.numero(raza.Edad_inicial_caras_1),
            edad_inicial_dados_2: this.numero(raza.Edad_inicial_dados_2),
            edad_inicial_caras_2: this.numero(raza.Edad_inicial_caras_2),
            edad_inicial_dados_3: this.numero(raza.Edad_inicial_dados_3),
            edad_inicial_caras_3: this.numero(raza.Edad_inicial_caras_3),
            vd: toNumberOrNull(raza.Vd),
            vd_mod_clases_pj: toIntOrNull(raza.Vd_mod_clases_pj),
            vd_mod_clases_pnj: toIntOrNull(raza.Vd_mod_clases_pnj),
            clases_asociadas: filasDeIds(raza.Clases_asociadas),
            armas_naturales: filasDeArmasNaturales(raza.Armas_naturales),
            id_tipo_criatura: this.numero(raza.Tipo_criatura?.Id),
            ataque_base: this.numero(dgs?.Ataque_base),
            fortaleza: this.numero(dgs?.Fortaleza),
            reflejos: this.numero(dgs?.Reflejos),
            voluntad: this.numero(dgs?.Voluntad),
            dgs_extra: this.numero(dgs?.Cantidad),
            id_tipo_dado: this.numero(dgs?.Id_dado),
            id_tipo_criatura_dgs: this.numero(dgs?.Id_tipo_criatura),
            dotes_dg: this.numero(dgs?.Dotes_extra),
            puntos_hab: this.numero(dgs?.Puntos_habilidad),
            puntos_hab_mult: this.numero(dgs?.Multiplicador_puntos_habilidad),
            mutada: raza.Mutada === true,
            ...alineamiento,
            oficial: raza.Oficial === true,
            id_clase_lanzamiento: this.numero(raza.Lanzamiento?.Clase?.Id),
            nivel_lanzamiento: this.numero(raza.Lanzamiento?.Nivel),
            lanzamiento_listas: (raza.Lanzamiento?.Listas ?? []).map((lista) => ({ tipo: lista.Tipo, id: this.numero(lista.Id) })),
        }, { emitEvent: false });
        this.pasoActivoIndex = 0;
        this.edades = edadesDesdeRaza(raza);
        this.porEdades = this.edades.categorias.length > 0 || this.edades.pasos.length > 0;

        this.subtiposSeleccionados = idsUnicosOrdenados((raza.Subtipos ?? []).map((subtipo) => subtipo.Id));
        this.idiomasSeleccionados = idsUnicosOrdenados((raza.Idiomas ?? []).map((idioma) => idioma.Id));
        this.armasCompetenciaSeleccionadas = idsUnicosOrdenados((raza.Competencias?.Armas ?? []).map((item) => item.Id));
        this.armadurasCompetenciaSeleccionadas = idsUnicosOrdenados((raza.Competencias?.Armaduras ?? []).map((item) => item.Id));
        this.gruposArmaSeleccionados = idsUnicosOrdenados((raza.Competencias?.Grupos_arma ?? []).map((item) => item.Id));
        this.gruposArmaduraSeleccionados = idsUnicosOrdenados((raza.Competencias?.Grupos_armadura ?? []).map((item) => item.Id));
        this.clasePredilectaBusqueda = referencias && !referencias.Clase_predilecta
            ? SIN_CLASE_PREDILECTA_FORMULARIO.Nombre
            : this.texto(referencias?.Clase_predilecta?.Nombre);
        this.tipoCriaturaDgsBusqueda = '';

        const conFilaVacia = <T>(filas: T[], vacia: () => T): T[] => filas.length > 0 ? filas : [vacia()];
        this.habilidadesBaseRows = conFilaVacia((raza.Habilidades?.Base ?? []).map((habilidad) => ({
            ...this.crearHabilidadBaseRow(),
            id_habilidad: this.numero(habilidad.Id_habilidad),
            cantidad: this.numero(habilidad.Cantidad),
            id_extra: this.numero(habilidad.Id_extra ?? ID_EXTRA_HABILIDAD_SIN_EXTRA),
            varios: textoOSinEspecificar(habilidad.Varios),
            cantidad_condicional: this.numero(habilidad.Cantidad_condicional),
            condicion: this.texto(habilidad.Condicion),
            busqueda: this.texto(habilidad.Habilidad),
            extraBusqueda: this.numero(habilidad.Id_extra ?? ID_EXTRA_HABILIDAD_SIN_EXTRA) > ID_EXTRA_HABILIDAD_SIN_EXTRA ? this.texto(habilidad.Extra) : '',
        })), () => this.crearHabilidadBaseRow());
        this.habilidadesCustomRows = conFilaVacia((raza.Habilidades?.Custom ?? []).map((habilidad) => ({
            ...this.crearHabilidadCustomRow(),
            id_habilidad: this.numero(habilidad.Id_habilidad),
            cantidad: this.numero(habilidad.Cantidad),
            busqueda: this.texto(habilidad.Habilidad),
        })), () => this.crearHabilidadCustomRow());
        this.dotesRows = conFilaVacia((raza.DotesContextuales ?? []).map((dote) => ({
            ...this.crearDoteRow(),
            id_dote: this.numero(dote.Dote?.Id),
            id_extra: this.numero(dote.Contexto?.Id_extra),
            busqueda: this.texto(dote.Dote?.Nombre),
            extraBusqueda: this.numero(dote.Contexto?.Id_extra) > 0 ? this.texto(dote.Contexto?.Extra) : '',
        })), () => this.crearDoteRow());
        this.racialesRows = conFilaVacia((raza.Raciales ?? []).map((racial) => ({
            ...this.crearRacialRow(),
            id_racial: this.numero(racial.Id),
            opcional: this.numero(racial.Opcional),
            busqueda: this.texto(racial.Nombre),
        })), () => this.crearRacialRow());
        this.racialesPendientesRazaEnCreacionIds.clear();
        this.sortilegiosRows = conFilaVacia((raza.Sortilegas ?? []).map((sortilega) => ({
            ...this.crearSortilegioRow(),
            id_conjuro: this.numero(sortilega.Conjuro?.Id),
            nivel_lanzador: this.numero(sortilega.Nivel_lanzador),
            usos_diarios: this.texto(sortilega.Usos_diarios),
            descripcion: textoOSinEspecificar(sortilega.Descripcion),
            busqueda: this.texto(sortilega.Conjuro?.Nombre),
        })), () => this.crearSortilegioRow());

        const filasMutacion = this.filasPrerrequisitosMutacionDesdeRaza(raza);
        this.prerrequisitosMutacionRows = filasMutacion;
        this.prerrequisitosMutacionSeleccionados = [...new Set(filasMutacion.map((fila) => fila.tipo as TipoEditorMutacion))];
        this.cambiosMutacionRows = (raza.Cambios_mutacion ?? []).map((cambio) => ({
            uid: uidDeFila('cambio-mutacion'),
            campo: cambio.Campo,
            operacion: cambio.Operacion,
            valor: cambio.Valor,
            elementos: idsUnicosOrdenados(cambio.Elementos.map((elemento) => elemento.Id)),
        }));

        this.sincronizarCamposDgsExtra();
        this.sincronizarAlineamientoDesdeSeleccion();
        this.sincronizarBusquedaSiCatalogoDisponible('id_clase_predilecta', this.clasesPredilectas, (value) => this.clasePredilectaBusqueda = value || this.clasePredilectaBusqueda);
        this.sincronizarBusquedaSiCatalogoDisponible('id_tipo_criatura_dgs', this.tiposCriatura, (value) => this.tipoCriaturaDgsBusqueda = value);
        this.form.markAsPristine();
        this.errores.limpiar();
        this.edicion.tomarPuntoDePartida();
    }

    /**
     * Los controles del alineamiento que vuelven a dar la combinación guardada: con alineamiento básico, el básico y su
     * prioridad; sin él, las preferencias legal y moral y su prioridad (cada combinación es única así).
     */
    private controlesDeAlineamiento(idAlineamiento: unknown): Record<string, unknown> {
        const combinacion = this.alineamientos.find((item) => this.numero(item.Id) === this.numero(idAlineamiento));
        if (!combinacion)
            return {};
        const prioridad = this.getIdPrioridadAlineamiento(combinacion);
        const basico = this.numero(combinacion.Basico?.Id);
        if (basico > 0)
            return { alineamiento_modo: 'basico', id_alineamiento_basico: basico, id_prioridad_alineamiento: prioridad };
        return {
            alineamiento_modo: 'preferencia',
            id_alineamiento_basico: 0,
            id_preferencia_ley: this.numero(combinacion.Ley?.Id),
            id_preferencia_moral: this.numero(combinacion.Moral?.Id),
            id_prioridad_alineamiento: prioridad,
        };
    }

    /**
     * Las filas del editor de prerrequisitos de mutación con los de la raza (`pr`, por la clave de su tipo): su referencia,
     * su cantidad, su texto y su grupo. Los tipos son los del modelo (`registrarTiposDeMutacion`), que se carga antes.
     */
    private filasPrerrequisitosMutacionDesdeRaza(raza: Raza): PrerequisiteRowModel[] {
        return Object.entries(raza.Prerrequisitos ?? {}).flatMap(([clave, items]) => {
            const tipo = claveEditorMutacion(clave);
            if (!tipoDeMutacion(tipo))
                return [];
            return items.map((item) => ({
                ...getPrerequisiteDefinition(tipo).createDefaultRow(),
                id: this.numero(item.Id_referencia),
                valor: item.Cantidad ?? 1,
                texto: item.Texto ?? '',
                opcional: this.numero(item.Opcional),
            }));
        });
    }

    /**
     * Sin DG raciales el formulario no enseña ni guarda sus campos (a cero en una raza nueva); al modificar una raza que ya
     * no los tenía, se conservan los que guardaba (el dado, el tipo, las dotes y los puntos; el ataque base y las
     * salvaciones, a 0).
     */
    private dgsOcultosAConservar() {
        const dgs = this.razaCargada?.Edicion?.Dgs_raciales;
        return this.edicion.editando && dgs && dgs.Cantidad <= 0 ? dgs : null;
    }

    private listasLanzamiento(listas: ListaLanzamientoFila[] | null | undefined): RazaCreateListaLanzamiento[] {
        return (listas ?? [])
            .filter((lista) => this.numero(lista?.id) > 0)
            .map((lista) => lista.tipo === 'dominio' ? { id_dominio: this.numero(lista.id) } : { id_clase: this.numero(lista.id) });
    }

    private async completarRacialesPendientesRazaEnCreacion(idRaza: number): Promise<string[]> {
        const pendientes = idsUnicosOrdenados(Array.from(this.racialesPendientesRazaEnCreacionIds));
        if (pendientes.length < 1 || this.numero(idRaza) <= 0)
            return [];

        const fallidos: string[] = [];
        for (const idRacial of pendientes) {
            try {
                const response = await this.racialSvc.anadirPrerrequisitosRacial(idRacial, {
                    raza: [{ id_raza: this.numero(idRaza) }],
                });
                this.reemplazarRacialEnCatalogo(response.racial);
                this.racialesPendientesRazaEnCreacionIds.delete(idRacial);
            } catch {
                fallidos.push(this.getNombreRacialPendienteRazaEnCreacion(idRacial));
            }
        }

        return fallidos;
    }

    private registrarRacialPendienteRazaEnCreacion(idRacial: number): void {
        const id = this.numero(idRacial);
        if (id > 0)
            this.racialesPendientesRazaEnCreacionIds.add(id);
    }

    private reemplazarRacialEnCatalogo(racial: RacialDetalle | null | undefined): void {
        if (!racial || this.numero(racial.Id) <= 0)
            return;
        const next = this.raciales.filter((item) => this.numero(item.Id) !== this.numero(racial.Id));
        this.raciales = this.ordenar([...next, racial]);
    }

    private getNombresRacialesPendientesRazaEnCreacion(): string[] {
        return idsUnicosOrdenados(Array.from(this.racialesPendientesRazaEnCreacionIds))
            .map((id) => this.getNombreRacialPendienteRazaEnCreacion(id));
    }

    private getNombreRacialPendienteRazaEnCreacion(idRacial: number): string {
        const racial = this.raciales.find((item) => this.numero(item.Id) === this.numero(idRacial));
        const nombre = this.texto(racial?.Nombre);
        return nombre.length > 0 ? nombre : `racial ${this.numero(idRacial)}`;
    }

    private crearHabilidadBaseRow(): HabilidadBaseRow {
        return {
            uid: this.nuevoUid(), id_habilidad: 0, cantidad: 0, id_extra: 0, varios: TEXTO_SIN_ESPECIFICAR,
            cantidad_condicional: 0, condicion: '', busqueda: '', extraBusqueda: '',
        };
    }

    private crearHabilidadCustomRow(): HabilidadCustomRow {
        return { uid: this.nuevoUid(), id_habilidad: 0, cantidad: 0, busqueda: '' };
    }

    private upsertHabilidadCustom(habilidad: HabilidadBasicaDetalle): void {
        if (!habilidad || this.numero(habilidad.Id_habilidad) <= 0)
            return;
        const others = this.habilidadesCustom.filter((item) => this.numero(item.Id_habilidad) !== this.numero(habilidad.Id_habilidad));
        this.habilidadesCustom = [...others, { ...habilidad, Id: habilidad.Id_habilidad } as HabilidadBasicaDetalle]
            .sort(porNombre);
        this.habilidadesCustomRows = this.habilidadesCustomRows.map((row) => this.numero(row.id_habilidad) === this.numero(habilidad.Id_habilidad)
            ? { ...row, busqueda: habilidad.Nombre }
            : row);
    }

    private crearDoteRow(): DoteRow {
        return { uid: this.nuevoUid(), id_dote: 0, id_extra: 0, busqueda: '', extraBusqueda: '' };
    }

    private crearRacialRow(): RacialRow {
        return { uid: this.nuevoUid(), id_racial: 0, opcional: 0, busqueda: '' };
    }

    private crearSortilegioRow(): SortilegioRow {
        return { uid: this.nuevoUid(), id_conjuro: 0, nivel_lanzador: 1, usos_diarios: USOS_SORTILEGA_INICIALES, descripcion: TEXTO_SIN_ESPECIFICAR, busqueda: '' };
    }

    private sincronizarSelectConFallback(controlName: string, items: CatalogItem[], nombrePreferente?: string): void {
        const control = this.form.get(controlName);
        if (!control || this.numero(control.value) > 0 || items.length === 0)
            return;
        const preferente = nombrePreferente
            ? items.find((item) => normalizarTexto(item.Nombre, true).includes(normalizarTexto(nombrePreferente, true)))
            : null;
        control.setValue((preferente ?? items[0]).Id);
    }

    /** Una raza nueva es Mediana mientras no se elija otro tamaño: el Mediano del catálogo (`idTamanoMediano`). */
    private ponerTamanoMediano(): void {
        const control = this.form.get('id_tamano');
        const idMediano = idTamanoMediano(this.tamanos);
        if (control && this.numero(control.value) <= 0 && idMediano !== null)
            control.setValue(idMediano);
    }

    private sincronizarSelect(controlName: string, items: CatalogItem[], nombrePreferente?: string): void {
        const control = this.form.get(controlName);
        if (!control || this.numero(control.value) > 0 || items.length === 0)
            return;
        if (!nombrePreferente)
            return;
        const preferente = nombrePreferente
            ? items.find((item) => normalizarTexto(item.Nombre, true).includes(normalizarTexto(nombrePreferente, true)))
            : null;
        if (preferente)
            control.setValue(preferente.Id);
    }

    private sincronizarBusquedaDesdeControl<T>(controlName: string, items: T[], setValue: (value: string) => void): void {
        const valor = this.form.get(controlName)?.value;
        // Sin elegir (`null`) no es la 0: la clase predilecta 0 es «Cualquiera».
        if (valor === null || valor === undefined) {
            setValue('');
            return;
        }
        const item = this.buscarCatalogo(items, this.numero(valor));
        setValue(item ? this.getCatalogLabel(item) : '');
    }

    private sincronizarManiobrabilidadConVuelo(): void {
        if (this.tieneVelocidadVuelo()) {
            const visibles = this.getManiobrabilidadesVisibles();
            const idActual = this.numero(this.form.controls.id_maniobrabilidad.value);
            if (idActual <= 0 || this.esManiobrabilidadNoVuela(this.getManiobrabilidadSeleccionada()))
                this.form.controls.id_maniobrabilidad.setValue(this.numero(visibles[0]?.Id), { emitEvent: false });
            this.form.controls.id_maniobrabilidad.updateValueAndValidity({ emitEvent: false });
            return;
        }
        this.form.controls.id_maniobrabilidad.setValue(this.getIdManiobrabilidadNoVuela(), { emitEvent: false });
        this.form.controls.id_maniobrabilidad.updateValueAndValidity({ emitEvent: false });
    }

    private getIdManiobrabilidadNoVuela(): number {
        const noVuela = this.maniobrabilidades.find((item) => this.esManiobrabilidadNoVuela(item));
        return this.numero(noVuela?.Id);
    }

    private esManiobrabilidadNoVuela(item: RazaCatalogItem | null | undefined): boolean {
        return normalizarTexto(item?.Nombre, true).includes('no vuela');
    }

    /** Sin prerrequisito de raza, o (al modificar) con esta misma raza entre las que pide. */
    private esRacialCompatibleConRazaActual(racial: RacialDetalle | null | undefined): boolean {
        if (!racial)
            return false;
        if (!this.racialTienePrerrequisitoRaza(racial))
            return true;
        const idRaza = this.edicion.editando ? this.edicion.id : 0;
        return idRaza > 0 && (racial.Prerrequisitos?.raza ?? []).some((item) => this.extraerIdRazaPrerrequisito(item) === idRaza);
    }

    private racialTienePrerrequisitoRaza(racial: RacialDetalle | null | undefined): boolean {
        if (!racial)
            return false;
        const flag = racial.Prerrequisitos_flags?.raza === true;
        const prerrequisitos = Array.isArray(racial.Prerrequisitos?.raza)
            ? racial.Prerrequisitos.raza
            : [];
        return flag || prerrequisitos.some((item) => this.extraerIdRazaPrerrequisito(item) > 0);
    }

    private extraerIdRazaPrerrequisito(item: any): number {
        if (!item || typeof item !== 'object')
            return 0;
        return this.numero(
            item.Id_raza
            ?? item.id_raza
            ?? item.IdRaza
            ?? item.idRaza
            ?? item.Id
            ?? item.id
            ?? item.Raza?.Id
            ?? item.raza?.Id
            ?? item.raza?.id
        );
    }

    private ordenar<T extends CatalogItem>(items: T[] | null | undefined): T[] {
        return [...(Array.isArray(items) ? items : [])]
            .sort(porNombre);
    }

    private ordenarPorId<T extends { Id: number }>(items: T[] | null | undefined): T[] {
        return [...(Array.isArray(items) ? items : [])]
            .sort((a, b) => this.numero(a.Id) - this.numero(b.Id));
    }

    nombreAlineamiento(item: AlineamientoCombinacionCatalogItem): string {
        return `${item.Ley?.Nombre ?? ''} ${item.Moral?.Nombre ?? ''}`.trim() || item.Basico?.Nombre || `Alineamiento ${item.Id}`;
    }

    getAlineamientoResueltoLabel(): string {
        const id = this.numero(this.form.controls.id_alineamiento.value);
        const combinacion = this.alineamientos.find((item) => this.numero(item.Id) === id);
        return combinacion ? this.nombreAlineamiento(combinacion) : 'Sin combinación válida';
    }

    private sincronizarAlineamientoDesdeSeleccion(): void {
        const modo = this.form.controls.alineamiento_modo.value;
        const idPrioridad = this.numero(this.form.controls.id_prioridad_alineamiento.value);
        const id = modo === 'preferencia'
            ? this.resolverIdAlineamientoDesdePreferencias(
                this.numero(this.form.controls.id_preferencia_ley.value),
                this.numero(this.form.controls.id_preferencia_moral.value),
                idPrioridad
            )
            : this.resolverIdAlineamientoDesdeBasico(this.numero(this.form.controls.id_alineamiento_basico.value), idPrioridad);
        this.form.controls.id_alineamiento.setValue(id, { emitEvent: false });
        this.form.controls.id_alineamiento.updateValueAndValidity({ emitEvent: false });
    }

    private resolverIdAlineamientoDesdeBasico(idBasico: number, idPrioridad?: number): number {
        const id = this.numero(idBasico);
        if (id < 0 || !this.alineamientosBasicos.some((item) => this.numero(item.Id) === id))
            return -1;
        const filtraPrioridad = idPrioridad !== undefined && idPrioridad !== null;
        const prioridad = filtraPrioridad ? this.numero(idPrioridad) : 0;
        if (filtraPrioridad && prioridad < 0)
            return -1;
        const candidatos = this.alineamientos
            .filter((item) => this.numero(item?.Basico?.Id) === id)
            .filter((item) => !filtraPrioridad || this.getIdPrioridadAlineamiento(item) === prioridad)
            .sort((a, b) => this.numero(a.Id) - this.numero(b.Id));
        const preferido = candidatos.find((item) => this.esSinPreferencia(item?.Ley?.Nombre) && this.esSinPreferencia(item?.Moral?.Nombre));
        const candidato = preferido ?? candidatos[0];
        return candidato ? this.numero(candidato.Id) : -1;
    }

    private resolverIdAlineamientoDesdePreferencias(idLey: number, idMoral: number, idPrioridad: number): number {
        const ley = this.numero(idLey);
        const moral = this.numero(idMoral);
        const prioridad = this.numero(idPrioridad);
        if (ley < 0 || moral < 0 || prioridad < 0)
            return -1;
        const candidatos = this.alineamientos
            .filter((item) => this.numero(item?.Ley?.Id) === ley && this.numero(item?.Moral?.Id) === moral)
            .filter((item) => this.getIdPrioridadAlineamiento(item) === prioridad)
            .sort((a, b) => this.numero(a.Id) - this.numero(b.Id));
        const preferido = candidatos.find((item) => this.esSinPreferencia(item?.Basico?.Nombre));
        const candidato = preferido ?? candidatos[0];
        return candidato ? this.numero(candidato.Id) : -1;
    }

    private getIdPrioridadAlineamiento(item: AlineamientoCombinacionCatalogItem): number {
        return this.numero(item?.Prioridad?.Id ?? (item?.Prioridad as any)?.Id_prioridad);
    }

    private esSinPreferencia(value: any): boolean {
        const texto = normalizarTexto(value, true);
        return texto.length < 1
            || texto.includes('no aplica')
            || texto.includes('ninguna preferencia')
            || texto === 'sin preferencia';
    }

    private dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
        const map = new Map<string, T>();
        items.forEach((item) => map.set(keyFn(item), item));
        return [...map.values()];
    }

    private texto(value: any): string {
        return `${value ?? ''}`.trim();
    }

    private numero(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
    }

    private numeroDecimal(value: any): number {
        const parsed = Number(value);
        if (!Number.isFinite(parsed))
            return 0;
        return Math.round(parsed * 100) / 100;
    }

    /** El VD de la raza con dos decimales (los de su columna), o `null` sin dato. */
    private vdDeRaza(value: unknown): number | null {
        return toNumberOrNull(value) === null ? null : this.numeroDecimal(value);
    }

    private normalizarPasoIndex(value: any): number {
        const index = this.numero(value);
        return Math.max(0, Math.min(NUEVA_RAZA_MAX_STEP_INDEX, index));
    }

    private clonarProfundo<T>(value: T): T {
        if (typeof structuredClone === 'function')
            return structuredClone(value);
        return JSON.parse(JSON.stringify(value));
    }

    private nuevoUid(): string {
        return `raza-row-${this.nextRowId++}`;
    }
}
