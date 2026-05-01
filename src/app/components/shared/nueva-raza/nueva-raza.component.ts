import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
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
import { ActitudCatalogItem, RazaCatalogItem, TipoDadoCatalogItem } from 'src/app/interfaces/raza-catalogos';
import { RazaCreateRequest } from 'src/app/interfaces/razas-api';
import { SubtipoResumen } from 'src/app/interfaces/subtipo';
import { Tamano } from 'src/app/interfaces/tamaño';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
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
import { UserService } from 'src/app/services/user.service';
import { buildManiobrabilidadInfoSecciones } from 'src/app/services/utils/maniobrabilidad-info';
import { PrerrequisitoEditorHostComponent } from '../prerrequisito-editor/prerrequisito-editor-host.component';
import {
    PrerequisiteCatalogContext,
    PrerequisiteCatalogItem,
    PrerequisiteRowModel,
    PrerequisiteType,
} from '../prerrequisito-editor/prerrequisito-editor.models';
import {
    PREREQUISITE_EDITOR_DEFINITIONS,
    arePrerequisitesIncomplete,
    findCatalogName,
    getPrerequisiteDefinition,
} from '../prerrequisito-editor/prerrequisito-editor.registry';

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

type RelacionSeleccionKey =
    | 'subtiposSeleccionados'
    | 'idiomasSeleccionados'
    | 'armasCompetenciaSeleccionadas'
    | 'armadurasCompetenciaSeleccionadas'
    | 'gruposArmaSeleccionados'
    | 'gruposArmaduraSeleccionados';

type AlineamientoModo = 'basico' | 'preferencia';
type MutacionPrerequisiteType = Extract<PrerequisiteType,
    'actitud_requerido'
    | 'actitud_prohibido'
    | 'alineamiento_requerido'
    | 'alineamiento_prohibido'
    | 'tipo_criatura'
>;

interface MutacionPrerequisiteOption {
    key: MutacionPrerequisiteType;
    label: string;
}

const NUEVA_RAZA_DRAFT_AUTOSAVE_MS = 1200;
const NUEVA_RAZA_DRAFT_DEBOUNCE_MS = 300;
const NUEVA_RAZA_MAX_STEP_INDEX = 4;
const HABILIDAD_EXTRA_ELEGIR: CatalogItem = { Id: 0, Nombre: 'Elegir' };

@Component({
    selector: 'app-nueva-raza',
    templateUrl: './nueva-raza.component.html',
    styleUrls: ['./nueva-raza.component.sass'],
    standalone: false
})
export class NuevaRazaComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private nextRowId: number = 1;
    private draftUidActivo: string = '';
    private draftAutosaveTimer: ReturnType<typeof setInterval> | null = null;
    private draftPersistTimer: ReturnType<typeof setTimeout> | null = null;
    private draftUltimaFirmaPersistida: string | null = null;
    private draftInicializacionHabilitada: boolean = false;
    private draftInicializado: boolean = false;
    private draftInicializando: boolean = false;
    private racialesPendientesRazaEnCreacionIds = new Set<number>();
    private readonly mutacionPrerequisiteTypes: MutacionPrerequisiteType[] = [
        'actitud_requerido',
        'actitud_prohibido',
        'alineamiento_requerido',
        'alineamiento_prohibido',
        'tipo_criatura',
    ];

    @Output() razaCreada = new EventEmitter<CrearRazaEmitPayload>();
    @ViewChild('prerrequisitoMutacionHost') prerrequisitoMutacionHost?: PrerrequisitoEditorHostComponent;

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
    armas: ArmaDetalle[] = [];
    armaduras: ArmaduraDetalle[] = [];
    gruposArmas: GrupoCompetencia[] = [];
    gruposArmaduras: GrupoCompetencia[] = [];
    maniobrabilidades: RazaCatalogItem[] = [];
    tiposDado: TipoDadoCatalogItem[] = [];
    actitudes: ActitudCatalogItem[] = [];
    manualBusqueda: string = '';
    clasePredilectaBusqueda: string = '';
    subtipoBusqueda: string = '';
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

    prerrequisitosMutacionRows: PrerequisiteRowModel[] = [];
    prerrequisitosMutacionSeleccionados: MutacionPrerequisiteType[] = [];
    selectorPrerrequisitosMutacionVisible: boolean = false;
    selectorPrerrequisitosMutacionFiltro: string = '';
    selectorPrerrequisitosMutacionTempKeys: MutacionPrerequisiteType[] = [];
    pasoActivoIndex: number = 0;

    readonly prerrequisitosMutacionOpciones: MutacionPrerequisiteOption[] = PREREQUISITE_EDITOR_DEFINITIONS
        .filter((item) => this.esTipoPrerrequisitoMutacion(item.type))
        .map((item) => ({ key: item.type as MutacionPrerequisiteType, label: item.label }));

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
        ataques_naturales: ['No especifica', [this.textoOpcionalValidator(5, 1000)]],
        espacio: [5, [Validators.required, Validators.min(0), Validators.max(40)]],
        alcance: [5, [Validators.required, Validators.min(0), Validators.max(40)]],
        id_manual: [0, [Validators.min(1)]],
        pagina: [1, [Validators.required, Validators.min(0)]],
        id_clase_predilecta: [0, [Validators.min(1)]],
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
        escalar: [0, [Validators.min(0), Validators.max(200)]],
        dotes_extra: [0, [Validators.min(0), Validators.max(10)]],
        puntos_extra_1: [0, [Validators.min(0), Validators.max(20)]],
        puntos_extra: [0, [Validators.min(0), Validators.max(20)]],
        id_tamano: [0, [Validators.min(1)]],
        ajuste_nivel: [0, [Validators.min(0), Validators.max(20)]],
        reduccion_dano: ['No especifica', [this.textoOpcionalValidator(5, 1000)]],
        resistencia_conjuros: ['No especifica', [this.textoOpcionalValidator(5, 1000)]],
        resistencia_energia: ['No especifica', [this.textoOpcionalValidator(5, 1000)]],
        altura_rango_inf: [0, [Validators.min(0.01), Validators.max(10)]],
        altura_rango_sup: [0, [Validators.min(0.01), Validators.max(10)]],
        peso_rango_inf: [0, [Validators.min(1), Validators.max(10000)]],
        peso_rango_sup: [0, [Validators.min(1), Validators.max(10000)]],
        edad_adulto: [0, [Validators.min(1)]],
        edad_mediana: [0, [Validators.min(1)]],
        edad_viejo: [0, [Validators.min(1)]],
        edad_venerable: [0, [Validators.min(1)]],
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
        tamano_mutacion_dependiente: [false],
        id_alineamiento: [0, [this.alineamientoResueltoValidator()]],
        alineamiento_modo: ['basico' as AlineamientoModo],
        id_alineamiento_basico: [0],
        id_prioridad_alineamiento: [0, [Validators.min(0)]],
        id_preferencia_ley: [0],
        id_preferencia_moral: [0],
        oficial: [true],
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
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private grupoArmaSvc: GrupoArmaService,
        private grupoArmaduraSvc: GrupoArmaduraService,
    ) { }

    ngOnInit(): void {
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

        this.cargarCatalogos();
        this.draftInicializacionHabilitada = true;
        void this.intentarInicializarBorradorLocal();
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
        if (event && this.tieneRacialesPendientesRazaEnCreacion()) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    async crearRaza(): Promise<void> {
        this.form.markAllAsTouched();
        const errorDominio = this.validarReglasDominio();

        if (!this.puedeCrear) {
            await Swal.fire({
                icon: 'warning',
                title: 'Permisos insuficientes',
                text: this.mensajePermisosInsuficientes,
                showConfirmButton: true,
            });
            return;
        }

        if (this.form.invalid || errorDominio) {
            await Swal.fire({
                icon: 'warning',
                title: 'Revisa la raza',
                text: errorDominio ?? 'Hay campos obligatorios o rangos pendientes de corregir.',
                showConfirmButton: true,
            });
            return;
        }

        const payload = this.buildPayload();
        console.log('[NuevaRaza] Payload crear raza', this.clonarProfundo(payload));
        this.guardando = true;
        try {
            const response = await this.razaSvc.crearRaza(payload);
            const racialesPendientesSinCompletar = await this.completarRacialesPendientesRazaEnCreacion(response.idRaza);
            await Swal.fire({
                icon: racialesPendientesSinCompletar.length > 0 ? 'warning' : 'success',
                title: racialesPendientesSinCompletar.length > 0 ? 'Raza creada con incidencias' : 'Raza creada',
                text: racialesPendientesSinCompletar.length > 0
                    ? `La raza se guardó, pero ${racialesPendientesSinCompletar.length === 1 ? 'un racial pendiente no se pudo completar automáticamente' : 'algunos raciales pendientes no se pudieron completar automáticamente'}.`
                    : 'La raza se guardó correctamente.',
                timer: racialesPendientesSinCompletar.length > 0 ? undefined : 1800,
                showConfirmButton: racialesPendientesSinCompletar.length > 0,
            });
            this.razaCreada.emit({ idRaza: response.idRaza, nombre: payload.raza.nombre });
            this.descartarBorradorLocalActivo();
            this.resetFormularioManteniendoCatalogos();
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: 'No se pudo crear la raza',
                text: error?.message ?? 'El backend rechazó la solicitud.',
                showConfirmButton: true,
            });
        } finally {
            this.guardando = false;
        }
    }

    buildPayload(): RazaCreateRequest {
        const raw = this.form.getRawValue();
        const esMutada = raw.mutada === true;
        const prerrequisitos = this.buildPrerrequisitos();

        const payload: RazaCreateRequest = {
            raza: {
                nombre: this.texto(raw.nombre),
                descripcion: this.texto(raw.descripcion),
                ataques_naturales: this.textoTecnico(raw.ataques_naturales),
                espacio: this.numero(raw.espacio),
                alcance: this.numero(raw.alcance),
                id_manual: this.numero(raw.id_manual),
                pagina: this.numero(raw.pagina),
                id_clase_predilecta: this.numero(raw.id_clase_predilecta),
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
                escalar: this.numero(raw.escalar),
                dotes_extra: this.numero(raw.dotes_extra),
                puntos_extra_1: this.numero(raw.puntos_extra_1),
                puntos_extra: this.numero(raw.puntos_extra),
                id_tamano: this.numero(raw.id_tamano),
                ajuste_nivel: this.numero(raw.ajuste_nivel),
                reduccion_dano: this.textoTecnico(raw.reduccion_dano),
                resistencia_conjuros: this.textoTecnico(raw.resistencia_conjuros),
                resistencia_energia: this.textoTecnico(raw.resistencia_energia),
                altura_rango_inf: this.numeroDecimal(raw.altura_rango_inf),
                altura_rango_sup: this.numeroDecimal(raw.altura_rango_sup),
                peso_rango_inf: this.numero(raw.peso_rango_inf),
                peso_rango_sup: this.numero(raw.peso_rango_sup),
                edad_adulto: this.numero(raw.edad_adulto),
                edad_mediana: this.numero(raw.edad_mediana),
                edad_viejo: this.numero(raw.edad_viejo),
                edad_venerable: this.numero(raw.edad_venerable),
                id_tipo_criatura: this.numero(raw.id_tipo_criatura),
                ataque_base: this.tieneDgsExtra() ? this.numero(raw.ataque_base) : 0,
                fortaleza: this.numero(raw.fortaleza),
                reflejos: this.numero(raw.reflejos),
                voluntad: this.numero(raw.voluntad),
                dgs_extra: this.numero(raw.dgs_extra),
                id_tipo_dado: this.getIdTipoDadoPayload(),
                id_tipo_criatura_dgs: this.getIdTipoCriaturaDgsPayload(),
                dotes_dg: this.tieneDgsExtra() ? this.numero(raw.dotes_dg) : 0,
                puntos_hab: this.tieneDgsExtra() ? this.numero(raw.puntos_hab) : 0,
                puntos_hab_mult: this.tieneDgsExtra() ? this.numero(raw.puntos_hab_mult) : 0,
                mutada: esMutada,
                tamano_mutacion_dependiente: esMutada && raw.tamano_mutacion_dependiente === true,
                id_alineamiento: this.numero(raw.id_alineamiento),
                oficial: raw.oficial === true,
            },
            subtipos: this.idsOrdenados(this.subtiposSeleccionados),
            idiomas: this.idsOrdenados(this.idiomasSeleccionados),
            habilidades: {
                base: this.dedupeByKey(
                    this.habilidadesBaseRows
                        .filter((row) => this.numero(row.id_habilidad) > 0)
                        .map((row) => {
                            const idExtra = this.getIdExtraHabilidadBase(row);
                            const enviarExtra = this.habilidadBaseSoportaExtra(row) && this.esExtraHabilidadBaseValido(row, idExtra);
                            return {
                                id_habilidad: this.numero(row.id_habilidad),
                                cantidad: this.numero(row.cantidad),
                                ...(enviarExtra ? { id_extra: idExtra } : {}),
                                varios: this.textoTecnico(row.varios),
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
                        usos_diarios: this.textoTecnico(row.usos_diarios || '1/dia'),
                        descripcion: this.textoTecnico(row.descripcion),
                    })),
                (item) => `${item.id_conjuro}:${item.nivel_lanzador}:${item.usos_diarios}`
            ),
            competencias: {
                armas: this.idsOrdenados(this.armasCompetenciaSeleccionadas),
                armaduras: this.idsOrdenados(this.armadurasCompetenciaSeleccionadas),
                gruposArma: this.idsOrdenados(this.gruposArmaSeleccionados),
                gruposArmadura: this.idsOrdenados(this.gruposArmaduraSeleccionados),
            },
        };

        if (esMutada && prerrequisitos)
            payload.prerrequisitos = prerrequisitos;

        return payload;
    }

    actualizarSeleccion(propiedad: RelacionSeleccionKey, values: number[]): void {
        this[propiedad] = propiedad === 'subtiposSeleccionados'
            ? this.idsOrdenados(values).slice(0, 1)
            : this.idsOrdenados(values);
    }

    agregarSeleccion(propiedad: RelacionSeleccionKey, value: number): void {
        const id = this.numero(value);
        if (id <= 0)
            return;
        this[propiedad] = propiedad === 'subtiposSeleccionados'
            ? [id]
            : this.idsOrdenados([...(this[propiedad] ?? []), id]);
        this.relacionQueries[propiedad] = '';
    }

    quitarSeleccion(propiedad: RelacionSeleccionKey, value: number): void {
        const id = this.numero(value);
        this[propiedad] = this.idsOrdenados((this[propiedad] ?? []).filter((item) => item !== id));
    }

    actualizarRelacionQuery(propiedad: RelacionSeleccionKey, value: string): void {
        this.relacionQueries[propiedad] = value ?? '';
    }

    displayAutocompleteVacio(): string {
        return '';
    }

    displayManualAutocomplete = (id: number | string | null | undefined): string => {
        const manual = this.buscarCatalogo(this.manuales, id);
        return manual ? this.getCatalogLabel(manual) : '';
    };

    displayClasePredilectaAutocomplete = (id: number | string | null | undefined): string => {
        const clase = this.buscarCatalogo(this.clases, id);
        return clase ? this.getCatalogLabel(clase) : '';
    };

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
        const filtro = this.normalizarTexto(this.selectorPrerrequisitosMutacionFiltro);
        return this.prerrequisitosMutacionOpciones.filter((item) => {
            if (!filtro)
                return true;
            return this.normalizarTexto(item.label).includes(filtro);
        });
    }

    get hayPrerrequisitosMutacionMarcados(): boolean {
        return this.prerrequisitosMutacionSeleccionados.length > 0;
    }

    isTipoPrerrequisitoMutacionTemporalSeleccionado(key: MutacionPrerequisiteType): boolean {
        return this.selectorPrerrequisitosMutacionTempKeys.includes(key);
    }

    toggleTipoPrerrequisitoMutacionTemporal(key: MutacionPrerequisiteType, checked: boolean): void {
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
        this.prerrequisitosMutacionSeleccionados = tipos.filter((type): type is MutacionPrerequisiteType => this.esTipoPrerrequisitoMutacion(type));
    }

    onPrerrequisitosMutacionRowsChange(rows: PrerequisiteRowModel[]): void {
        this.prerrequisitosMutacionRows = rows.filter((row) => this.esTipoPrerrequisitoMutacion(row.tipo));
    }

    getEtiquetaPrerrequisitoMutacion(key: MutacionPrerequisiteType): string {
        return this.prerrequisitosMutacionOpciones.find((item) => item.key === key)?.label ?? key;
    }

    setBooleanControl(controlName: 'oficial' | 'mutada' | 'tamano_mutacion_dependiente', value: boolean): void {
        this.form.controls[controlName].setValue(value);
        this.form.controls[controlName].markAsDirty();
    }

    toggleBooleanControl(controlName: 'oficial' | 'mutada' | 'tamano_mutacion_dependiente'): void {
        this.setBooleanControl(controlName, this.form.controls[controlName].value !== true);
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

    getManualesFiltrados(): Manual[] {
        return this.filtrarCatalogo(this.manuales, this.manualBusqueda, []);
    }

    getClasesPredilectasFiltradas(): Clase[] {
        return this.filtrarCatalogo(this.clases, this.clasePredilectaBusqueda, []);
    }

    getSubtiposFiltrados(): SubtipoResumen[] {
        return this.filtrarCatalogo(this.subtipos, this.subtipoBusqueda, this.subtiposSeleccionados);
    }

    getTiposCriaturaDgsFiltrados(): TipoCriatura[] {
        return this.filtrarCatalogo(this.tiposCriatura, this.tipoCriaturaDgsBusqueda, []);
    }

    actualizarManualBusqueda(value: string): void {
        this.manualBusqueda = value ?? '';
        this.form.controls.id_manual.setValue(0);
        this.form.controls.id_manual.markAsDirty();
        this.form.controls.id_manual.updateValueAndValidity();
    }

    actualizarClasePredilectaBusqueda(value: string): void {
        this.clasePredilectaBusqueda = value ?? '';
        this.form.controls.id_clase_predilecta.setValue(0);
        this.form.controls.id_clase_predilecta.markAsDirty();
        this.form.controls.id_clase_predilecta.updateValueAndValidity();
    }

    actualizarSubtipoBusqueda(value: string): void {
        this.subtipoBusqueda = value ?? '';
        this.subtiposSeleccionados = [];
    }

    actualizarTipoCriaturaDgsBusqueda(value: string): void {
        this.tipoCriaturaDgsBusqueda = value ?? '';
        this.form.controls.id_tipo_criatura_dgs.setValue(0);
        this.form.controls.id_tipo_criatura_dgs.markAsDirty();
        this.form.controls.id_tipo_criatura_dgs.updateValueAndValidity();
    }

    seleccionarManual(id: number): void {
        const manual = this.buscarCatalogo(this.manuales, id);
        this.form.controls.id_manual.setValue(this.numero(id));
        this.form.controls.id_manual.markAsDirty();
        this.form.controls.id_manual.updateValueAndValidity();
        this.manualBusqueda = manual ? this.getCatalogLabel(manual) : '';
    }

    seleccionarClasePredilecta(id: number): void {
        const clase = this.buscarCatalogo(this.clases, id);
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

    seleccionarSubtipo(id: number): void {
        const subtipo = this.buscarCatalogo(this.subtipos, id);
        const idSubtipo = this.numero(id);
        this.subtiposSeleccionados = idSubtipo > 0 ? [idSubtipo] : [];
        this.subtipoBusqueda = subtipo ? this.getCatalogLabel(subtipo) : '';
    }

    limpiarSubtipo(): void {
        this.subtiposSeleccionados = [];
        this.subtipoBusqueda = '';
    }

    getSubtipoSeleccionadoLabel(): string {
        const id = this.subtiposSeleccionados[0] ?? 0;
        return id > 0 ? this.getEtiquetaRelacion(this.subtipos, id) : '';
    }

    tieneVelocidadVuelo(): boolean {
        return this.numero(this.form.controls.volar.value) > 0;
    }

    tieneDgsExtra(): boolean {
        return this.numero(this.form.controls.dgs_extra.value) > 0;
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

    quitarRow<T extends { uid: string }>(coleccion: T[], index: number, fabrica: () => T): T[] {
        const next = coleccion.filter((_, currentIndex) => currentIndex !== index);
        return next.length > 0 ? next : [fabrica()];
    }

    quitarHabilidadBase(index: number): void {
        this.habilidadesBaseRows = this.quitarRow(this.habilidadesBaseRows, index, () => this.crearHabilidadBaseRow());
    }

    quitarHabilidadCustom(index: number): void {
        this.habilidadesCustomRows = this.quitarRow(this.habilidadesCustomRows, index, () => this.crearHabilidadCustomRow());
    }

    quitarDote(index: number): void {
        this.dotesRows = this.quitarRow(this.dotesRows, index, () => this.crearDoteRow());
    }

    quitarRacial(index: number): void {
        this.racialesRows = this.quitarRow(this.racialesRows, index, () => this.crearRacialRow());
    }

    quitarSortilegio(index: number): void {
        this.sortilegiosRows = this.quitarRow(this.sortilegiosRows, index, () => this.crearSortilegioRow());
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
                text: 'Este racial tiene prerrequisitos de raza y no puede añadirse a una raza nueva desde este formulario.',
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
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
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
        const nombre = this.normalizarTexto(prioridad.Nombre);
        if (nombre.includes('sin preferencia') || nombre.includes('sin prioridad') || nombre.includes('no aplica'))
            return 'No condiciona el alineamiento del personaje; sirve para razas sin tendencia propia.';
        if (nombre.includes('debe') || nombre.includes('tenerse en cuenta'))
            return 'Marca una tendencia racial importante que debería respetarse al crear el personaje.';
        if (nombre.includes('siempre') || nombre.includes('oblig') || nombre.includes('estrict'))
            return 'Representa una condición muy fuerte; ignorarla debería ser una rareza dentro de esa raza.';
        return 'Indica cuánta fuerza tiene esta regla frente a otras fuentes de alineamiento.';
    }

    private esPrioridadAlineamientoInterna(prioridad: PrioridadAlineamientoCatalogItem | null | undefined): boolean {
        return this.normalizarTexto(prioridad?.Nombre) === 'final';
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
        if (!this.draftInicializacionHabilitada || this.draftInicializado || this.draftInicializando || !this.puedeCrear)
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
                subtiposSeleccionados: this.idsOrdenados(this.subtiposSeleccionados).slice(0, 1),
                idiomasSeleccionados: this.idsOrdenados(this.idiomasSeleccionados),
                armasCompetenciaSeleccionadas: this.idsOrdenados(this.armasCompetenciaSeleccionadas),
                armadurasCompetenciaSeleccionadas: this.idsOrdenados(this.armadurasCompetenciaSeleccionadas),
                gruposArmaSeleccionados: this.idsOrdenados(this.gruposArmaSeleccionados),
                gruposArmaduraSeleccionados: this.idsOrdenados(this.gruposArmaduraSeleccionados),
            },
            searches: {
                manualBusqueda: this.manualBusqueda,
                clasePredilectaBusqueda: this.clasePredilectaBusqueda,
                subtipoBusqueda: this.subtipoBusqueda,
                tipoCriaturaDgsBusqueda: this.tipoCriaturaDgsBusqueda,
            },
            relacionQueries: this.clonarProfundo(this.relacionQueries),
            rows: {
                habilidadesBaseRows: this.clonarProfundo(this.habilidadesBaseRows),
                habilidadesCustomRows: this.clonarProfundo(this.habilidadesCustomRows),
                dotesRows: this.clonarProfundo(this.dotesRows),
                racialesRows: this.clonarProfundo(this.racialesRows),
                racialesPendientesRazaEnCreacionIds: this.idsOrdenados(Array.from(this.racialesPendientesRazaEnCreacionIds)),
                sortilegiosRows: this.clonarProfundo(this.sortilegiosRows),
                prerrequisitosMutacionRows: this.clonarProfundo(this.prerrequisitosMutacionRows),
                prerrequisitosMutacionSeleccionados: [...this.prerrequisitosMutacionSeleccionados],
            },
        };
    }

    private restaurarDesdeBorradorLocal(borrador: NuevaRazaDraftV1): void {
        this.form.reset({
            ...this.getFormularioDefaultValues(),
            ...(borrador.formValue ?? {}),
        }, { emitEvent: false });
        this.pasoActivoIndex = this.normalizarPasoIndex(borrador.selectedIndex);

        this.subtiposSeleccionados = this.idsOrdenados(borrador.selections?.subtiposSeleccionados).slice(0, 1);
        this.idiomasSeleccionados = this.idsOrdenados(borrador.selections?.idiomasSeleccionados);
        this.armasCompetenciaSeleccionadas = this.idsOrdenados(borrador.selections?.armasCompetenciaSeleccionadas);
        this.armadurasCompetenciaSeleccionadas = this.idsOrdenados(borrador.selections?.armadurasCompetenciaSeleccionadas);
        this.gruposArmaSeleccionados = this.idsOrdenados(borrador.selections?.gruposArmaSeleccionados);
        this.gruposArmaduraSeleccionados = this.idsOrdenados(borrador.selections?.gruposArmaduraSeleccionados);

        this.manualBusqueda = this.texto(borrador.searches?.manualBusqueda);
        this.clasePredilectaBusqueda = this.texto(borrador.searches?.clasePredilectaBusqueda);
        this.subtipoBusqueda = this.texto(borrador.searches?.subtipoBusqueda);
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
        this.racialesPendientesRazaEnCreacionIds = new Set(this.idsOrdenados(borrador.rows?.racialesPendientesRazaEnCreacionIds));
        this.sortilegiosRows = this.restaurarRows(borrador.rows?.sortilegiosRows, () => this.crearSortilegioRow()) as SortilegioRow[];
        this.prerrequisitosMutacionSeleccionados = (borrador.rows?.prerrequisitosMutacionSeleccionados ?? [])
            .filter((type): type is MutacionPrerequisiteType => this.esTipoPrerrequisitoMutacion(type as PrerequisiteType));
        this.prerrequisitosMutacionRows = this.restaurarRows(borrador.rows?.prerrequisitosMutacionRows, () => null)
            .filter((row) => this.esTipoPrerrequisitoMutacion(row?.tipo as PrerequisiteType));

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
        this.sincronizarBusquedaSiCatalogoDisponible('id_manual', this.manuales, (value) => this.manualBusqueda = value);
        this.sincronizarBusquedaSiCatalogoDisponible('id_clase_predilecta', this.clases, (value) => this.clasePredilectaBusqueda = value);
        this.sincronizarBusquedaSiCatalogoDisponible('id_tipo_criatura_dgs', this.tiposCriatura, (value) => this.tipoCriaturaDgsBusqueda = value);
        if (this.subtipos.length > 0)
            this.subtipoBusqueda = this.getSubtipoSeleccionadoLabel();
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
        if (raw.oficial !== true || raw.mutada === true || raw.tamano_mutacion_dependiente === true)
            return true;
        if (this.haySeleccionesRelacionadas())
            return true;
        if (this.hayRowsConContenido())
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
            || this.prerrequisitosMutacionRows.length > 0;
    }

    private hayRowsConContenido(): boolean {
        return this.habilidadesBaseRows.some((row) => this.numero(row.id_habilidad) > 0 || this.numero(row.cantidad) !== 0 || this.esTextoTecnicoEditado(row.varios))
            || this.habilidadesCustomRows.some((row) => this.numero(row.id_habilidad) > 0 || this.numero(row.cantidad) !== 0)
            || this.dotesRows.some((row) => this.numero(row.id_dote) > 0 || this.numero(row.id_extra) > 0)
            || this.racialesRows.some((row) => this.numero(row.id_racial) > 0 || this.numero(row.opcional) !== 0)
            || this.sortilegiosRows.some((row) => this.numero(row.id_conjuro) > 0 || this.numero(row.nivel_lanzador) !== 1 || this.texto(row.usos_diarios) !== '1/dia' || this.esTextoTecnicoEditado(row.descripcion));
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
            escalar: 0,
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
        const text = this.normalizarTexto(value);
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
                    this.sincronizarBusquedaDesdeControl('id_manual', this.manuales, (value) => this.manualBusqueda = value);
                },
                error: () => this.manuales = []
            });

        this.claseSvc.getClases()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (clases) => {
                this.clases = this.ordenar(clases);
                this.sincronizarBusquedaDesdeControl('id_clase_predilecta', this.clases, (value) => this.clasePredilectaBusqueda = value);
            }, error: () => this.clases = [] });

        this.tamanoSvc.getTamanos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (tamanos) => {
                this.tamanos = this.ordenarPorId(tamanos);
                this.sincronizarSelect('id_tamano', this.tamanos, 'mediano');
            }, error: () => this.tamanos = [] });

        this.tipoCriaturaSvc.getTiposCriatura()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (tipos) => {
                this.tiposCriatura = this.ordenar(tipos);
                this.sincronizarSelect('id_tipo_criatura', this.tiposCriatura, 'humanoide');
                this.sincronizarCamposDgsExtra();
            }, error: () => this.tiposCriatura = [] });

        this.alineamientoSvc.getAlineamientosCombinacionesCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (alineamientos) => {
                this.alineamientos = this.ordenarPorId(alineamientos);
                this.sincronizarAlineamientoDesdeSeleccion();
            }, error: () => this.alineamientos = [] });

        this.alineamientoSvc.getAlineamientosBasicosCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (alineamientos) => {
                this.alineamientosBasicos = this.ordenarPorId(alineamientos);
                this.sincronizarSelectConFallback('id_alineamiento_basico', this.alineamientosBasicos, 'no aplica');
                this.sincronizarAlineamientoDesdeSeleccion();
            }, error: () => this.alineamientosBasicos = [] });

        this.alineamientoSvc.getAlineamientosPrioridadesCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (prioridades) => {
                this.prioridadesAlineamiento = this.ordenarPorId(prioridades);
                this.asegurarPrioridadAlineamientoVisible();
                this.sincronizarAlineamientoDesdeSeleccion();
            }, error: () => this.prioridadesAlineamiento = [] });

        this.alineamientoSvc.getAlineamientosPreferenciaLeyCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (preferencias) => {
                this.preferenciasLey = this.ordenarPorId(preferencias);
                this.sincronizarSelectConFallback('id_preferencia_ley', this.preferenciasLey, 'ninguna preferencia');
                this.sincronizarAlineamientoDesdeSeleccion();
            }, error: () => this.preferenciasLey = [] });

        this.alineamientoSvc.getAlineamientosPreferenciaMoralCatalogo()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (preferencias) => {
                this.preferenciasMoral = this.ordenarPorId(preferencias);
                this.sincronizarSelectConFallback('id_preferencia_moral', this.preferenciasMoral, 'ninguna preferencia');
                this.sincronizarAlineamientoDesdeSeleccion();
            }, error: () => this.preferenciasMoral = [] });

        this.subtipoSvc.getSubtipos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (subtipos) => {
                this.subtipos = this.ordenar(subtipos);
                this.subtipoBusqueda = this.getSubtipoSeleccionadoLabel();
            }, error: () => this.subtipos = [] });

        this.idiomaSvc.getIdiomas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (idiomas) => this.idiomas = this.ordenar(idiomas), error: () => this.idiomas = [] });

        this.habilidadSvc.getHabilidades()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (habilidades) => this.habilidades = this.ordenar(habilidades.map((item) => ({ ...item, Id: item.Id_habilidad }))), error: () => this.habilidades = [] });

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
            .subscribe({ next: (raciales) => this.raciales = this.ordenar(raciales), error: () => this.raciales = [] });

        this.conjuroSvc.getConjuros()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (conjuros) => this.conjuros = this.ordenar(conjuros), error: () => this.conjuros = [] });

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
                this.maniobrabilidades = this.ordenarPorId(items);
                this.sincronizarSelect('id_maniobrabilidad', this.maniobrabilidades, 'no vuela');
                this.sincronizarManiobrabilidadConVuelo();
            }, error: () => this.maniobrabilidades = [] });

        this.razaCatalogosSvc.getTiposDado()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (items) => {
                this.tiposDado = this.ordenarPorId(items);
                this.sincronizarCamposDgsExtra();
            }, error: () => this.tiposDado = [] });

        this.razaCatalogosSvc.getActitudes()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (items) => this.actitudes = this.ordenar(items), error: () => this.actitudes = [] });
    }

    private recalcularPermisos(): void {
        this.puedeCrear = this.userSvc.can('razas', 'create');
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
        const nombre = this.normalizarTexto(this.form.controls.nombre.value ?? '');
        if (nombre && this.razasExistentes.some((raza) => this.normalizarTexto(raza.Nombre) === nombre))
            return 'Ya existe una raza con ese nombre.';
        if (this.form.controls.mutada.value === true && !this.tienePrerrequisitosMutacion())
            return 'Una raza mutada necesita al menos una familia de prerrequisitos.';
        if (this.form.controls.mutada.value === true
            && arePrerequisitesIncomplete(this.prerrequisitosMutacionRows, this.prerrequisitosMutacionSeleccionados))
            return 'Hay prerrequisitos de mutación pendientes de completar.';
        if (this.tieneAlineamientoMutacionSinResolver())
            return 'Hay un prerrequisito de alineamiento sin combinación válida.';
        const doteSinExtra = this.dotesRows.find((row) => this.numero(row.id_dote) > 0 && this.doteRequiereExtra(row.id_dote) && this.numero(row.id_extra) <= 0);
        if (doteSinExtra)
            return 'Hay una dote que requiere extra y todavía no lo tiene seleccionado.';
        if (this.form.errors?.['rangosInvalidos'])
            return 'Revisa rangos de altura, peso y edades.';
        return null;
    }

    private limpiarDatosMutacion(): void {
        this.form.controls.tamano_mutacion_dependiente.setValue(false, { emitEvent: false });
        this.prerrequisitosMutacionRows = [];
        this.prerrequisitosMutacionSeleccionados = [];
        this.selectorPrerrequisitosMutacionTempKeys = [];
        this.selectorPrerrequisitosMutacionVisible = false;
    }

    private sincronizarCamposDgsExtra(): void {
        const tipoDadoControl = this.form.controls.id_tipo_dado;
        const tipoCriaturaControl = this.form.controls.id_tipo_criatura_dgs;
        if (!this.tieneDgsExtra()) {
            tipoDadoControl.clearValidators();
            tipoCriaturaControl.clearValidators();
            this.form.patchValue({
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
        const humanoide = this.tiposCriatura.find((item) => this.normalizarTexto(item.Nombre).includes('humanoide'));
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
        const selected = new Set(this.idsOrdenados(selectedIds));
        const normalizedQuery = this.normalizarTexto(query ?? '');
        return [...(Array.isArray(items) ? items : [])]
            .filter((item) => {
                const id = this.getCatalogId(item);
                if (selected.has(id))
                    return false;
                if (!normalizedQuery)
                    return true;
                const searchable = this.normalizarTexto(`${this.getCatalogLabel(item)} ${this.getCatalogMeta(item)}`);
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
            const pesoInf = getInt('peso_rango_inf');
            const pesoSup = getInt('peso_rango_sup');
            const adulto = getInt('edad_adulto');
            const mediana = getInt('edad_mediana');
            const viejo = getInt('edad_viejo');
            const venerable = getInt('edad_venerable');
            const invalid = (alturaInf > 0 && alturaSup > 0 && alturaInf > alturaSup)
                || (pesoInf > 0 && pesoSup > 0 && pesoInf > pesoSup)
                || ([adulto, mediana, viejo, venerable].every((value) => value > 0)
                    && !(adulto < mediana && mediana < viejo && viejo < venerable));
            return invalid ? { rangosInvalidos: true } : null;
        };
    }

    private textoOpcionalValidator(min: number, max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = this.texto(control.value);
            if (!value)
                return null;
            if (value.length < min)
                return { minlength: { requiredLength: min, actualLength: value.length } };
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

    private buildPrerrequisitos(): RazaCreateRequest['prerrequisitos'] | undefined {
        const result: RazaCreateRequest['prerrequisitos'] = {};
        this.prerrequisitosMutacionRows.forEach((row) => {
            if (!this.prerrequisitosMutacionSeleccionados.includes(row.tipo as MutacionPrerequisiteType))
                return;
            const type = row.tipo as MutacionPrerequisiteType;
            const id = this.numero(row.id);
            if (id <= 0)
                return;

            const opcional = this.numero(row.opcional);
            const withOpcional = <T extends Record<string, number>>(item: T): T & { opcional?: number } =>
                opcional > 0 ? { ...item, opcional } : item;

            if (type === 'actitud_requerido') {
                result.actitud_requerido = [...(result.actitud_requerido ?? []), withOpcional({ id_actitud: id })];
                return;
            }
            if (type === 'actitud_prohibido') {
                result.actitud_prohibido = [...(result.actitud_prohibido ?? []), withOpcional({ id_actitud: id })];
                return;
            }
            if (type === 'alineamiento_requerido' || type === 'alineamiento_prohibido') {
                const id_alineamiento = this.resolverIdAlineamientoPrerrequisitoDesdeBasico(id);
                if (id_alineamiento <= 0)
                    return;
                const item = withOpcional({ id_alineamiento });
                if (type === 'alineamiento_requerido')
                    result.alineamiento_requerido = [...(result.alineamiento_requerido ?? []), item];
                else
                    result.alineamiento_prohibido = [...(result.alineamiento_prohibido ?? []), item];
                return;
            }
            if (type === 'tipo_criatura')
                result.tipo_criatura = [...(result.tipo_criatura ?? []), withOpcional({ id_tipo_criatura: id })];
        });
        return Object.keys(result).length > 0 ? result : undefined;
    }

    private tienePrerrequisitosMutacion(): boolean {
        return this.prerrequisitosMutacionSeleccionados.length > 0
            && this.prerrequisitosMutacionRows.some((row) => this.prerrequisitosMutacionSeleccionados.includes(row.tipo as MutacionPrerequisiteType));
    }

    private tieneAlineamientoMutacionSinResolver(): boolean {
        return this.prerrequisitosMutacionRows.some((row) => {
            if (row.tipo !== 'alineamiento_requerido' && row.tipo !== 'alineamiento_prohibido')
                return false;
            if (!this.prerrequisitosMutacionSeleccionados.includes(row.tipo))
                return false;
            const id = this.numero(row.id);
            return id > 0 && this.resolverIdAlineamientoPrerrequisitoDesdeBasico(id) <= 0;
        });
    }

    private getCatalogoPrerrequisitoMutacion(type: PrerequisiteType): PrerequisiteCatalogItem[] {
        if (type === 'actitud_requerido' || type === 'actitud_prohibido')
            return this.actitudes.map((item) => ({ id: this.numero(item.Id), nombre: `${item.Nombre ?? ''}`.trim() }));
        if (type === 'alineamiento_requerido' || type === 'alineamiento_prohibido')
            return this.getAlineamientosBasicosPrerrequisito().map((item) => ({ id: this.numero(item.Id), nombre: `${item.Nombre ?? ''}`.trim() }));
        if (type === 'tipo_criatura')
            return this.tiposCriatura.map((item) => ({ id: this.numero(item.Id), nombre: `${item.Nombre ?? ''}`.trim() }));
        return [];
    }

    private getNombreCatalogoPrerrequisitoMutacion(type: PrerequisiteType, id: number): string {
        return findCatalogName(type, id, this.getCatalogoPrerrequisitoMutacion(type));
    }

    private syncFilasPrerrequisitosMutacion(tipos: MutacionPrerequisiteType[]): PrerequisiteRowModel[] {
        const selected = new Set(tipos);
        let next = this.prerrequisitosMutacionRows.filter((row) => selected.has(row.tipo as MutacionPrerequisiteType));
        tipos.forEach((tipo) => {
            if (!next.some((row) => row.tipo === tipo))
                next = [...next, getPrerequisiteDefinition(tipo).createDefaultRow()];
        });
        return next;
    }

    private esTipoPrerrequisitoMutacion(type: PrerequisiteType): type is MutacionPrerequisiteType {
        return this.mutacionPrerequisiteTypes.includes(type as MutacionPrerequisiteType);
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
            ataques_naturales: 'No especifica',
            espacio: 5,
            alcance: 5,
            id_manual: 0,
            pagina: 1,
            id_clase_predilecta: 0,
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
            escalar: 0,
            dotes_extra: 0,
            puntos_extra_1: 0,
            puntos_extra: 0,
            id_tamano: 0,
            ajuste_nivel: 0,
            reduccion_dano: 'No especifica',
            resistencia_conjuros: 'No especifica',
            resistencia_energia: 'No especifica',
            altura_rango_inf: 0,
            altura_rango_sup: 0,
            peso_rango_inf: 0,
            peso_rango_sup: 0,
            edad_adulto: 0,
            edad_mediana: 0,
            edad_viejo: 0,
            edad_venerable: 0,
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
            tamano_mutacion_dependiente: false,
            id_alineamiento: 0,
            alineamiento_modo: 'basico',
            id_alineamiento_basico: 0,
            id_prioridad_alineamiento: 0,
            id_preferencia_ley: 0,
            id_preferencia_moral: 0,
            oficial: true,
        };
    }

    private resetFormularioManteniendoCatalogos(): void {
        this.form.reset(this.getFormularioDefaultValues());
        this.pasoActivoIndex = 0;
        this.subtiposSeleccionados = [];
        this.manualBusqueda = '';
        this.clasePredilectaBusqueda = '';
        this.subtipoBusqueda = '';
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
        this.sincronizarSelect('id_clase_predilecta', this.clases);
        this.sincronizarSelect('id_tamano', this.tamanos, 'mediano');
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

    private async completarRacialesPendientesRazaEnCreacion(idRaza: number): Promise<string[]> {
        const pendientes = this.idsOrdenados(Array.from(this.racialesPendientesRazaEnCreacionIds));
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
        return this.idsOrdenados(Array.from(this.racialesPendientesRazaEnCreacionIds))
            .map((id) => this.getNombreRacialPendienteRazaEnCreacion(id));
    }

    private getNombreRacialPendienteRazaEnCreacion(idRacial: number): string {
        const racial = this.raciales.find((item) => this.numero(item.Id) === this.numero(idRacial));
        const nombre = this.texto(racial?.Nombre);
        return nombre.length > 0 ? nombre : `racial ${this.numero(idRacial)}`;
    }

    private crearHabilidadBaseRow(): HabilidadBaseRow {
        return { uid: this.nuevoUid(), id_habilidad: 0, cantidad: 0, id_extra: 0, varios: 'No especifica', busqueda: '', extraBusqueda: '' };
    }

    private crearHabilidadCustomRow(): HabilidadCustomRow {
        return { uid: this.nuevoUid(), id_habilidad: 0, cantidad: 0, busqueda: '' };
    }

    private upsertHabilidadCustom(habilidad: HabilidadBasicaDetalle): void {
        if (!habilidad || this.numero(habilidad.Id_habilidad) <= 0)
            return;
        const others = this.habilidadesCustom.filter((item) => this.numero(item.Id_habilidad) !== this.numero(habilidad.Id_habilidad));
        this.habilidadesCustom = [...others, { ...habilidad, Id: habilidad.Id_habilidad } as HabilidadBasicaDetalle]
            .sort((a, b) => `${a.Nombre ?? ''}`.localeCompare(`${b.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
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
        return { uid: this.nuevoUid(), id_conjuro: 0, nivel_lanzador: 1, usos_diarios: '1/dia', descripcion: 'No especifica', busqueda: '' };
    }

    private sincronizarSelectConFallback(controlName: string, items: CatalogItem[], nombrePreferente?: string): void {
        const control = this.form.get(controlName);
        if (!control || this.numero(control.value) > 0 || items.length === 0)
            return;
        const preferente = nombrePreferente
            ? items.find((item) => this.normalizarTexto(item.Nombre).includes(this.normalizarTexto(nombrePreferente)))
            : null;
        control.setValue((preferente ?? items[0]).Id);
    }

    private sincronizarSelect(controlName: string, items: CatalogItem[], nombrePreferente?: string): void {
        const control = this.form.get(controlName);
        if (!control || this.numero(control.value) > 0 || items.length === 0)
            return;
        if (!nombrePreferente)
            return;
        const preferente = nombrePreferente
            ? items.find((item) => this.normalizarTexto(item.Nombre).includes(this.normalizarTexto(nombrePreferente)))
            : null;
        if (preferente)
            control.setValue(preferente.Id);
    }

    private sincronizarBusquedaDesdeControl<T>(controlName: string, items: T[], setValue: (value: string) => void): void {
        const id = this.numero(this.form.get(controlName)?.value);
        const item = this.buscarCatalogo(items, id);
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
        return this.normalizarTexto(item?.Nombre).includes('no vuela');
    }

    private esRacialCompatibleConRazaActual(racial: RacialDetalle | null | undefined): boolean {
        if (!racial)
            return false;
        return !this.racialTienePrerrequisitoRaza(racial);
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
            .sort((a, b) => `${a.Nombre ?? ''}`.localeCompare(`${b.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
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

    getAlineamientosBasicosPrerrequisito(): AlineamientoBasicoCatalogItem[] {
        return this.alineamientosBasicos
            .filter((item) => !this.esSinPreferencia(item?.Nombre));
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

    private resolverIdAlineamientoPrerrequisitoDesdeBasico(idBasico: number): number {
        if (!this.esAlineamientoBasicoPrerrequisitoValido(idBasico))
            return 0;
        return this.resolverIdAlineamientoDesdeBasico(idBasico);
    }

    private tieneAlineamientoBasicoSinResolver(values: number[] | null | undefined): boolean {
        return this.idsOrdenados(values)
            .some((idBasico) => this.resolverIdAlineamientoPrerrequisitoDesdeBasico(idBasico) <= 0);
    }

    private esAlineamientoBasicoPrerrequisitoValido(idBasico: number): boolean {
        const id = this.numero(idBasico);
        const basico = this.alineamientosBasicos.find((item) => this.numero(item.Id) === id);
        return !!basico && !this.esSinPreferencia(basico.Nombre);
    }

    private esSinPreferencia(value: any): boolean {
        const texto = this.normalizarTexto(value);
        return texto.length < 1
            || texto.includes('no aplica')
            || texto.includes('ninguna preferencia')
            || texto === 'sin preferencia';
    }

    private idsOrdenados(values: number[] | null | undefined): number[] {
        return [...new Set((values ?? []).map((value) => this.numero(value)).filter((value) => value > 0))]
            .sort((a, b) => a - b);
    }

    private dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
        const map = new Map<string, T>();
        items.forEach((item) => map.set(keyFn(item), item));
        return [...map.values()];
    }

    private texto(value: any): string {
        return `${value ?? ''}`.trim();
    }

    private textoTecnico(value: any): string {
        const text = this.texto(value);
        return text.length > 0 ? text : 'No especifica';
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

    private normalizarTexto(value: any): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
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
