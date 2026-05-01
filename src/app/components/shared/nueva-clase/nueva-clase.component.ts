import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, take, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import {
    Clase,
    ClaseMutationRequest,
    ClaseNivelDetalle,
    ClasePrerrequisitos,
    ClaseAumentoClaseLanzadoraCatalogItem,
    ClaseProgressionCatalogItem,
    ClasePuntosHabilidadCatalogItem,
} from 'src/app/interfaces/clase';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { ExtraDetalle } from 'src/app/interfaces/extra';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { Manual } from 'src/app/interfaces/manual';
import {
    PrerequisiteCatalogContext,
    PrerequisiteCatalogItem,
    PrerequisiteCatalogKey,
    PrerequisiteRowModel,
    PrerequisiteType,
} from '../prerrequisito-editor/prerrequisito-editor.models';
import {
    PREREQUISITE_EDITOR_DEFINITIONS,
    arePrerequisitesIncomplete,
    buildPrerequisitePayload,
    findCatalogName,
    getPrerequisiteCatalogsForTypes,
} from '../prerrequisito-editor/prerrequisito-editor.registry';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DominioService } from 'src/app/services/dominio.service';
import { DoteService } from 'src/app/services/dote.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { EspecialService } from 'src/app/services/especial.service';
import { ExtraService } from 'src/app/services/extra.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { RazaService } from 'src/app/services/raza.service';
import { RegionService } from 'src/app/services/region.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { UserService } from 'src/app/services/user.service';

interface NombreIdItem {
    Id: number;
    Nombre: string;
}

interface ClaseHabilidadRow {
    uid: string;
    tipo: 'base' | 'custom';
    id_habilidad: number;
    id_extra: number;
    varios: string;
    busqueda: string;
    extraBusqueda: string;
}

interface ClaseRelacionNivelRow {
    uid: string;
    tipo: 'dote' | 'especial';
    nivel: number;
    id: number;
    id_extra: number;
    opcional: number;
    id_interno: number;
    id_especial_requerido: number;
    id_dote_requerida: number;
    busqueda: string;
    extraBusqueda: string;
}

interface ClaseNivelEditor {
    nivel: number;
    reserva_psionica: number;
    nivel_max_poder: number;
    conjuros_diarios: Record<string, number>;
    conjuros_conocidos_nivel: Record<string, number>;
    conjuros_conocidos_total: number;
}

type PrerrequisitoEditorItem = PrerequisiteRowModel;

@Component({
    selector: 'app-nueva-clase',
    templateUrl: './nueva-clase.component.html',
    styleUrls: ['./nueva-clase.component.sass'],
    standalone: false,
})
export class NuevaClaseComponent implements OnInit, OnDestroy, OnChanges {
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idClase: number | null = null;
    @Input() editorTabKey: string = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() claseCreada = new EventEmitter<Clase>();
    @Output() claseActualizada = new EventEmitter<Clase>();

    private readonly destroy$ = new Subject<void>();
    private initialEditSnapshot = '';
    private ultimoIdClaseCargado = 0;
    private uidCounter = 0;

    guardando = false;
    cargandoEdicion = false;
    puedeCrear = false;
    puedeActualizar = false;
    manuales: Manual[] = [];
    clasesCatalogo: Clase[] = [];
    armas: NombreIdItem[] = [];
    armaduras: NombreIdItem[] = [];
    gruposArma: NombreIdItem[] = [];
    gruposArmadura: NombreIdItem[] = [];
    idiomas: NombreIdItem[] = [];
    dotes: any[] = [];
    especiales: EspecialClaseDetalle[] = [];
    extras: ExtraDetalle[] = [];
    habilidadesBase: HabilidadBasicaDetalle[] = [];
    habilidadesCustom: HabilidadBasicaDetalle[] = [];
    conjuros: any[] = [];
    habilidadesRows: ClaseHabilidadRow[] = [];
    relacionesRows: ClaseRelacionNivelRow[] = [];
    niveles: ClaseNivelEditor[] = [];
    manualBusqueda = '';
    claseOrigenBusqueda = '';
    customModalAbierto = false;
    customModalModo: 'crear' | 'editar' = 'crear';
    customModalRowUid = '';
    customModalHabilidad: HabilidadBasicaDetalle | null = null;
    especialModalAbierto = false;
    especialModalModo: 'crear' | 'editar' = 'crear';
    especialModalRowUid = '';
    especialModalId: number | null = null;
    especialModalKey = '';
    selectorPrerrequisitosVisible = false;
    selectorPrerrequisitosFiltro = '';
    selectorPrerrequisitosTempKeys: PrerequisiteType[] = [];
    prerrequisitosEditor: PrerrequisitoEditorItem[] = [];
    prerrequisitosSeleccionados: PrerequisiteType[] = [];
    seleccionados = {
        armas: new Set<number>(),
        armaduras: new Set<number>(),
        gruposArma: new Set<number>(),
        gruposArmadura: new Set<number>(),
        idiomas: new Set<number>(),
    };
    cargandoCatalogos = new Set<PrerequisiteCatalogKey>();
    catalogosCargados = new Set<PrerequisiteCatalogKey>();
    catalogosPendientes = new Map<PrerequisiteCatalogKey, Promise<void>>();

    readonly dados: NombreIdItem[] = [4, 6, 8, 10, 12].map((dado) => ({ Id: dado, Nombre: `d${dado}` }));
    readonly caracteristicas: NombreIdItem[] = [
        { Id: 0, Nombre: 'No aplica' },
        { Id: 1, Nombre: 'Fuerza' },
        { Id: 2, Nombre: 'Destreza' },
        { Id: 3, Nombre: 'Constitucion' },
        { Id: 4, Nombre: 'Inteligencia' },
        { Id: 5, Nombre: 'Sabiduria' },
        { Id: 6, Nombre: 'Carisma' },
    ];
    ataqueBaseCatalogo: ClaseProgressionCatalogItem[] = [
        { Id: 1, Nombre: 'Bueno', Valores: this.generarAtaqueBase('bueno') },
        { Id: 2, Nombre: 'Medio', Valores: this.generarAtaqueBase('medio') },
        { Id: 3, Nombre: 'Pobre', Valores: this.generarAtaqueBase('pobre') },
    ];
    salvacionCatalogo: ClaseProgressionCatalogItem[] = [
        { Id: 1, Nombre: 'Buena', Valores: this.generarSalvacion(true) },
        { Id: 2, Nombre: 'Mala', Valores: this.generarSalvacion(false) },
    ];
    puntosHabilidadCatalogo: ClasePuntosHabilidadCatalogItem[] = [
        { Id: 1, Valor: 2 },
        { Id: 2, Valor: 4 },
        { Id: 3, Valor: 6 },
        { Id: 4, Valor: 8 },
    ];
    aumentosClaseLanzadoraCatalogo: ClaseAumentoClaseLanzadoraCatalogItem[] = [];
    readonly nivelesConjuro = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    readonly prerrequisitoOpciones = PREREQUISITE_EDITOR_DEFINITIONS
        .filter((item) => item.type !== 'inherente')
        .map((item) => ({ key: item.type, label: item.label }));
    readonly generoCatalogo: PrerequisiteCatalogItem[] = [
        { id: 1, nombre: 'Masculino' },
        { id: 2, nombre: 'Femenino' },
        { id: 3, nombre: 'Otro' },
    ];
    readonly actitudesCatalogo: PrerequisiteCatalogItem[] = [
        { id: 1, nombre: 'Legal' },
        { id: 2, nombre: 'Neutral' },
        { id: 3, nombre: 'Caotica' },
        { id: 4, nombre: 'Buena' },
        { id: 5, nombre: 'Maligna' },
    ];

    private catalogosPrerrequisito: Record<string, PrerequisiteCatalogItem[]> = {
        alineamientos: [],
        armaduras: [],
        armas: [],
        clases: [],
        conjuros: [],
        dominios: [],
        dotes: [],
        escuelas: [],
        especiales: [],
        extras: [],
        grupos_arma: [],
        grupos_armadura: [],
        habilidades: [],
        idiomas: [],
        razas: [],
        regiones: [],
        subtipos: [],
        tamanos: [],
        tipos_criatura: [],
        tipos_dote: [],
    };
    private opcionesExtraDotePorId = new Map<number, PrerequisiteCatalogItem[]>();

    readonly prerrequisitosCatalogContext: PrerequisiteCatalogContext = {
        getCatalog: (type) => this.getCatalogoPrerrequisito(type),
        getCatalogName: (type, id) => this.getNombreCatalogo(type, id),
        getDoteExtraOptions: (idDote) => this.getOpcionesExtraDote(idDote),
        dotePermiteExtra: (idDote) => this.getOpcionesExtraDote(idDote).length > 0,
        getGlobalExtraOptions: () => this.catalogosPrerrequisito['extras'],
        habilidadPermiteExtra: (idHabilidad) => this.habilidadesBase.some((item) => item.Id_habilidad === this.entero(idHabilidad) && item.Soporta_extra),
        especialPermiteExtra: (idEspecial) => this.especiales.some((item) => item.Id === this.entero(idEspecial) && item.Extra),
    };
    readonly ensurePrerequisiteCatalogs = (types: PrerequisiteType[]) => this.asegurarCatalogosPrerrequisitos(types);

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
        descripcion: ['', [Validators.maxLength(8000)]],
        id_manual: [0, [Validators.required, Validators.min(1)]],
        pagina: [0, [Validators.min(0)]],
        oficial: [true],
        tipo_dado: [8, [Validators.required, Validators.min(4)]],
        puntos_habilidad_id: [2, [Validators.required, Validators.min(1)]],
        nivel_max_claseo: [20, [Validators.required, Validators.min(1), Validators.max(30)]],
        id_ataque_base: [2, [Validators.required, Validators.min(1)]],
        fortaleza_id: [2, [Validators.required, Validators.min(1)]],
        reflejos_id: [2, [Validators.required, Validators.min(1)]],
        voluntad_id: [2, [Validators.required, Validators.min(1)]],
        mod_salv_conjuros: ['No aplica'],
        prestigio: [false],
        es_predilecta: [false],
        aumenta_clase_lanzadora: [false],
        rol_dps: [false],
        rol_tanque: [false],
        rol_support: [false],
        rol_utilidad: [false],
        alineamiento_id: [0],
        alineamiento_nombre: ['No aplica'],
        conjuros_dependientes_alineamiento: [false],
        conjuros_divinos: [false],
        conjuros_arcanos: [false],
        conjuros_psionicos: [false],
        conjuros_alma: [false],
        conocidos_total: [false],
        conocidos_nivel: [false],
        dominio: [false],
        dominio_cantidad: [0],
        puede_elegir_especialidad: [false],
        lanzamiento_espontaneo: [false],
        clase_origen_id: [0],
        clase_origen_nombre: [''],
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private claseSvc: ClaseService,
        private manualSvc: ManualService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private grupoArmaSvc: GrupoArmaService,
        private grupoArmaduraSvc: GrupoArmaduraService,
        private idiomaSvc: IdiomaService,
        private habilidadSvc: HabilidadService,
        private doteSvc: DoteService,
        private especialSvc: EspecialService,
        private extraSvc: ExtraService,
        private conjuroSvc: ConjuroService,
        private alineamientoSvc: AlineamientoService,
        private razaSvc: RazaService,
        private dominioSvc: DominioService,
        private escuelaSvc: EscuelaConjurosService,
        private regionSvc: RegionService,
        private subtipoSvc: SubtipoService,
        private tamanoSvc: TamanoService,
        private tipoCriaturaSvc: TipoCriaturaService,
    ) { }

    ngOnInit(): void {
        this.reiniciarFilas();
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.form.controls.nivel_max_claseo.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.sincronizarNiveles());
        this.cargarCatalogosBase();
        this.cargarEdicionSiAplica();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idClase'])
            this.cargarEdicionSiAplica();
    }

    get esModoEdicion(): boolean {
        return this.modo === 'editar';
    }

    get puedeGuardar(): boolean {
        return this.esModoEdicion ? this.puedeActualizar : this.puedeCrear;
    }

    get guardadoBloqueado(): boolean {
        return this.guardando || this.cargandoEdicion || !this.puedeGuardar;
    }

    get tituloFormulario(): string {
        return this.esModoEdicion ? 'Modificar clase' : 'Crear clase';
    }

    get etiquetaAccionPrincipal(): string {
        if (this.guardando)
            return this.esModoEdicion ? 'Guardando cambios...' : 'Creando clase...';
        return this.esModoEdicion ? 'Actualizar clase' : 'Crear clase';
    }

    get mensajePermisoInsuficiente(): string {
        return this.esModoEdicion ? 'No tienes permisos para modificar clases.' : 'No tienes permisos para crear clases.';
    }

    get isDirty(): boolean {
        if (!this.esModoEdicion || this.cargandoEdicion)
            return false;
        return this.buildEditSnapshot() !== this.initialEditSnapshot;
    }

    get ataqueBaseSeleccionado(): ClaseProgressionCatalogItem {
        return this.ataqueBaseCatalogo.find((item) => item.Id === this.entero(this.form.controls.id_ataque_base.value, 2)) ?? this.ataqueBaseCatalogo[1];
    }

    get fortalezaSeleccionada(): ClaseProgressionCatalogItem {
        return this.salvacionCatalogo.find((item) => item.Id === this.entero(this.form.controls.fortaleza_id.value, 2)) ?? this.salvacionCatalogo[1];
    }

    get reflejosSeleccionados(): ClaseProgressionCatalogItem {
        return this.salvacionCatalogo.find((item) => item.Id === this.entero(this.form.controls.reflejos_id.value, 2)) ?? this.salvacionCatalogo[1];
    }

    get voluntadSeleccionada(): ClaseProgressionCatalogItem {
        return this.salvacionCatalogo.find((item) => item.Id === this.entero(this.form.controls.voluntad_id.value, 2)) ?? this.salvacionCatalogo[1];
    }

    async guardarClase(): Promise<void> {
        if (!this.puedeGuardar) {
            await Swal.fire({ icon: 'warning', title: 'Permisos insuficientes', text: this.userSvc.getPermissionDeniedMessage(), showConfirmButton: true });
            return;
        }
        this.form.markAllAsTouched();
        if (this.form.invalid)
            return;
        if (arePrerequisitesIncomplete(this.prerrequisitosEditor, this.prerrequisitosSeleccionados)) {
            await Swal.fire({ icon: 'warning', title: 'Prerrequisitos incompletos', text: 'Completa o desmarca los prerrequisitos antes de guardar.', showConfirmButton: true });
            return;
        }

        const payload = this.construirPayload();
        this.guardando = true;
        try {
            if (this.esModoEdicion) {
                const idClase = this.entero(this.idClase);
                if (idClase <= 0)
                    throw new Error('No se encontro un id de clase valido para editar.');
                const response = await this.claseSvc.actualizarClase(idClase, payload);
                await Swal.fire({ icon: 'success', title: 'Clase actualizada', text: response.message, timer: 1800, showConfirmButton: true, showCloseButton: true, confirmButtonText: 'Cerrar' });
                this.hidratarDesdeClase(response.clase);
                this.claseActualizada.emit(response.clase);
                this.cerrar.emit();
            } else {
                const response = await this.claseSvc.crearClase(payload);
                await Swal.fire({ icon: 'success', title: 'Clase creada', text: response.message, timer: 1800, showConfirmButton: true, showCloseButton: true, confirmButtonText: 'Cerrar' });
                this.claseCreada.emit(response.clase);
                this.resetFormulario();
            }
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: this.esModoEdicion ? 'No se pudo actualizar la clase' : 'No se pudo crear la clase',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true,
            });
        } finally {
            this.guardando = false;
        }
    }

    cancelar(): void {
        this.cerrar.emit();
    }

    toggleBoolean(controlName: keyof typeof this.form.controls): void {
        const control = this.form.controls[controlName] as any;
        control.setValue(control.value !== true);
        control.markAsDirty();
        control.markAsTouched();
    }

    seleccionarManual(id: number): void {
        const manual = this.manuales.find((item) => item.Id === this.entero(id));
        this.form.patchValue({ id_manual: manual?.Id ?? 0 });
        this.manualBusqueda = manual?.Nombre ?? '';
    }

    seleccionarClaseOrigen(id: number): void {
        const clase = this.clasesCatalogo.find((item) => item.Id === this.entero(id));
        this.form.patchValue({ clase_origen_id: clase?.Id ?? 0, clase_origen_nombre: clase?.Nombre ?? '' });
        this.claseOrigenBusqueda = clase?.Nombre ?? '';
    }

    isSeleccionado(tipo: keyof NuevaClaseComponent['seleccionados'], id: number): boolean {
        return this.seleccionados[tipo].has(this.entero(id));
    }

    toggleSeleccion(tipo: keyof NuevaClaseComponent['seleccionados'], id: number, checked: boolean): void {
        const target = this.seleccionados[tipo];
        const value = this.entero(id);
        if (value <= 0)
            return;
        if (checked)
            target.add(value);
        else
            target.delete(value);
    }

    setRelacionOpcional(row: ClaseRelacionNivelRow, checked: boolean): void {
        row.opcional = checked ? 1 : 0;
    }

    getManualesFiltrados(): Manual[] {
        return this.filtrarPorNombre(this.manuales, this.manualBusqueda);
    }

    getClasesFiltradas(): Clase[] {
        return this.filtrarPorNombre(this.clasesCatalogo, this.claseOrigenBusqueda);
    }

    getHabilidadesFiltradas(row: ClaseHabilidadRow): HabilidadBasicaDetalle[] {
        return this.filtrarHabilidades(this.getCatalogoHabilidades(row.tipo), row.busqueda);
    }

    getExtrasHabilidad(row: ClaseHabilidadRow): Array<{ Id_extra: number; Extra: string; }> {
        const habilidad = this.getCatalogoHabilidades(row.tipo).find((item) => item.Id_habilidad === this.entero(row.id_habilidad));
        return (habilidad?.Extras ?? []).map((item) => ({ Id_extra: item.Id_extra, Extra: item.Extra }));
    }

    getExtrasHabilidadFiltrados(row: ClaseHabilidadRow): Array<{ Id_extra: number; Extra: string; }> {
        return this.filtrarExtras(this.getExtrasHabilidad(row), row.extraBusqueda);
    }

    agregarHabilidad(tipo: 'base' | 'custom' = 'base'): void {
        this.habilidadesRows = [...this.habilidadesRows, this.crearHabilidadRow(tipo)];
    }

    quitarHabilidad(index: number): void {
        const next = this.habilidadesRows.filter((_, rowIndex) => rowIndex !== index);
        this.habilidadesRows = next.length > 0 ? next : [this.crearHabilidadRow('base')];
    }

    seleccionarHabilidad(index: number, id: number): void {
        const row = this.habilidadesRows[index];
        const habilidad = this.getCatalogoHabilidades(row.tipo).find((item) => item.Id_habilidad === this.entero(id));
        this.habilidadesRows = this.habilidadesRows.map((item, rowIndex) => rowIndex === index
            ? { ...item, id_habilidad: habilidad?.Id_habilidad ?? 0, busqueda: habilidad?.Nombre ?? '', id_extra: -1, extraBusqueda: '' }
            : item);
    }

    seleccionarExtraHabilidad(index: number, id: number): void {
        const row = this.habilidadesRows[index];
        const extra = this.getExtrasHabilidad(row).find((item) => item.Id_extra === this.entero(id));
        this.habilidadesRows = this.habilidadesRows.map((item, rowIndex) => rowIndex === index
            ? { ...item, id_extra: extra?.Id_extra ?? -1, extraBusqueda: extra?.Extra ?? '' }
            : item);
    }

    abrirCrearCustom(): void {
        this.customModalModo = 'crear';
        this.customModalRowUid = '';
        this.customModalHabilidad = null;
        this.customModalAbierto = true;
    }

    abrirEditarCustom(row: ClaseHabilidadRow): void {
        if (row.tipo !== 'custom' || this.entero(row.id_habilidad) <= 0)
            return;
        const habilidad = this.habilidadesCustom.find((item) => item.Id_habilidad === this.entero(row.id_habilidad));
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

    onCustomGuardada(habilidad: HabilidadBasicaDetalle): void {
        this.upsertHabilidadCustom(habilidad);
        const targetUid = this.customModalRowUid;
        if (targetUid.length > 0) {
            this.habilidadesRows = this.habilidadesRows.map((row) => row.uid === targetUid
                ? { ...row, tipo: 'custom', id_habilidad: habilidad.Id_habilidad, busqueda: habilidad.Nombre, id_extra: -1, extraBusqueda: '' }
                : row);
        } else {
            this.habilidadesRows = [...this.habilidadesRows, { ...this.crearHabilidadRow('custom'), id_habilidad: habilidad.Id_habilidad, busqueda: habilidad.Nombre }];
        }
        this.cerrarCustomModal();
    }

    agregarRelacion(tipo: 'dote' | 'especial'): void {
        this.relacionesRows = [...this.relacionesRows, this.crearRelacionRow(tipo)];
    }

    quitarRelacion(index: number): void {
        this.relacionesRows = this.relacionesRows.filter((_, rowIndex) => rowIndex !== index);
    }

    getRelacionesNivel(nivel: number, tipo: 'dote' | 'especial'): ClaseRelacionNivelRow[] {
        return this.relacionesRows.filter((row) => row.nivel === nivel && row.tipo === tipo);
    }

    getCatalogoRelacion(row: ClaseRelacionNivelRow): any[] {
        return row.tipo === 'dote' ? this.dotes : this.especiales;
    }

    getRelacionesFiltradas(row: ClaseRelacionNivelRow): any[] {
        return this.filtrarPorNombre(this.getCatalogoRelacion(row), row.busqueda);
    }

    seleccionarRelacion(row: ClaseRelacionNivelRow, id: number): void {
        const item = this.getCatalogoRelacion(row).find((actual) => this.getId(actual) === this.entero(id));
        this.relacionesRows = this.relacionesRows.map((actual) => actual.uid === row.uid
            ? { ...actual, id: item ? this.getId(item) : 0, busqueda: item?.Nombre ?? '' }
            : actual);
    }

    getExtrasRelacion(row: ClaseRelacionNivelRow): Array<{ Id_extra: number; Extra: string; }> {
        if (row.tipo !== 'especial')
            return this.extras.map((item) => ({ Id_extra: item.Id, Extra: item.Nombre }));
        const especial = this.especiales.find((item) => item.Id === this.entero(row.id));
        return (especial?.Extras ?? []).map((item) => ({ Id_extra: item.Id_extra, Extra: item.Extra }));
    }

    getExtrasRelacionFiltrados(row: ClaseRelacionNivelRow): Array<{ Id_extra: number; Extra: string; }> {
        return this.filtrarExtras(this.getExtrasRelacion(row), row.extraBusqueda);
    }

    seleccionarExtraRelacion(row: ClaseRelacionNivelRow, id: number): void {
        const extra = this.getExtrasRelacion(row).find((item) => item.Id_extra === this.entero(id));
        this.relacionesRows = this.relacionesRows.map((actual) => actual.uid === row.uid
            ? { ...actual, id_extra: extra?.Id_extra ?? -1, extraBusqueda: extra?.Extra ?? '' }
            : actual);
    }

    abrirCrearEspecial(row?: ClaseRelacionNivelRow): void {
        this.especialModalModo = 'crear';
        this.especialModalRowUid = row?.uid ?? '';
        this.especialModalId = null;
        this.especialModalKey = `quick:especial:nueva:${Date.now()}`;
        this.especialModalAbierto = true;
    }

    abrirEditarEspecial(row: ClaseRelacionNivelRow): void {
        if (row.tipo !== 'especial' || this.entero(row.id) <= 0)
            return;
        this.especialModalModo = 'editar';
        this.especialModalRowUid = row.uid;
        this.especialModalId = this.entero(row.id);
        this.especialModalKey = `quick:especial:${this.especialModalId}:${Date.now()}`;
        this.especialModalAbierto = true;
    }

    cerrarEspecialModal(): void {
        this.especialModalAbierto = false;
        this.especialModalRowUid = '';
        this.especialModalId = null;
    }

    onEspecialGuardado(especial: EspecialClaseDetalle): void {
        this.upsertEspecial(especial);
        if (this.especialModalRowUid.length > 0) {
            this.relacionesRows = this.relacionesRows.map((row) => row.uid === this.especialModalRowUid
                ? { ...row, tipo: 'especial', id: especial.Id, busqueda: especial.Nombre, id_extra: -1, extraBusqueda: '' }
                : row);
        }
        this.cerrarEspecialModal();
    }

    abrirSelectorPrerrequisitos(): void {
        this.selectorPrerrequisitosTempKeys = [...this.prerrequisitosSeleccionados];
        this.selectorPrerrequisitosFiltro = '';
        this.selectorPrerrequisitosVisible = true;
    }

    cerrarSelectorPrerrequisitos(): void {
        this.selectorPrerrequisitosVisible = false;
        this.selectorPrerrequisitosFiltro = '';
    }

    togglePrerrequisitoTemp(key: PrerequisiteType): void {
        const set = new Set(this.selectorPrerrequisitosTempKeys);
        if (set.has(key))
            set.delete(key);
        else
            set.add(key);
        this.selectorPrerrequisitosTempKeys = Array.from(set);
    }

    async confirmarSelectorPrerrequisitos(): Promise<void> {
        await this.asegurarCatalogosPrerrequisitos(this.selectorPrerrequisitosTempKeys);
        this.prerrequisitosSeleccionados = [...this.selectorPrerrequisitosTempKeys];
        this.prerrequisitosEditor = this.prerrequisitosEditor.filter((row) => this.prerrequisitosSeleccionados.includes(row.tipo));
        this.cerrarSelectorPrerrequisitos();
    }

    getPrerrequisitosFiltrados() {
        const filtro = this.normalizar(this.selectorPrerrequisitosFiltro);
        if (filtro.length < 1)
            return this.prerrequisitoOpciones;
        return this.prerrequisitoOpciones.filter((item) => this.normalizar(item.label).includes(filtro));
    }

    async confirmarSalidaSiHayCambios(): Promise<boolean> {
        if (!this.esModoEdicion || !this.isDirty)
            return true;
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Hay cambios sin guardar',
            text: 'Si cierras esta pestana perderas los cambios de la clase.',
            showCancelButton: true,
            confirmButtonText: 'Cerrar sin guardar',
            cancelButtonText: 'Seguir editando',
        });
        return result.isConfirmed === true;
    }

    private construirPayload(): ClaseMutationRequest {
        const raw = this.form.getRawValue();
        const nivelMax = this.entero(raw.nivel_max_claseo, 20);
        const prerrequisitos = this.construirPrerrequisitosPayload();
        const manual = this.manuales.find((item) => item.Id === this.entero(raw.id_manual));
        const claseOrigen = this.clasesCatalogo.find((item) => item.Id === this.entero(raw.clase_origen_id));
        const payload: ClaseMutationRequest = {
            Nombre: this.texto(raw.nombre),
            Descripcion: this.texto(raw.descripcion),
            Manual: { Id: this.entero(raw.id_manual), Nombre: manual?.Nombre ?? this.manualBusqueda, Pagina: this.entero(raw.pagina) },
            Tipo_dado: { Id: this.entero(raw.tipo_dado), Nombre: `d${this.entero(raw.tipo_dado)}` },
            Puntos_habilidad: {
                Id: this.entero(raw.puntos_habilidad_id),
                Valor: this.puntosHabilidadCatalogo.find((item) => item.Id === this.entero(raw.puntos_habilidad_id))?.Valor ?? 0,
            },
            Nivel_max_claseo: nivelMax,
            Mod_salv_conjuros: this.texto(raw.mod_salv_conjuros, 'No aplica'),
            Conjuros: {
                Dependientes_alineamiento: raw.conjuros_dependientes_alineamiento === true,
                Divinos: raw.conjuros_divinos === true,
                Arcanos: raw.conjuros_arcanos === true,
                Psionicos: raw.conjuros_psionicos === true,
                Alma: raw.conjuros_alma === true,
                Conocidos_total: raw.conocidos_total === true,
                Conocidos_nivel_a_nivel: raw.conocidos_nivel === true,
                Dominio: raw.dominio === true,
                Dominio_cantidad: this.entero(raw.dominio_cantidad),
                puede_elegir_especialidad: raw.puede_elegir_especialidad === true,
                Lanzamiento_espontaneo: raw.lanzamiento_espontaneo === true,
                Clase_origen: { Id: claseOrigen?.Id ?? 0, Nombre: claseOrigen?.Nombre ?? this.texto(raw.clase_origen_nombre) },
                Listado: [],
            },
            Roles: {
                Dps: raw.rol_dps === true,
                Tanque: raw.rol_tanque === true,
                Support: raw.rol_support === true,
                Utilidad: raw.rol_utilidad === true,
            },
            Aumenta_clase_lanzadora: raw.aumenta_clase_lanzadora === true,
            Es_predilecta: raw.es_predilecta === true,
            Prestigio: raw.prestigio === true,
            Tiene_prerrequisitos: Object.values(prerrequisitos).some((items) => Array.isArray(items) && items.length > 0),
            Alineamiento: this.construirAlineamiento(raw),
            Oficial: raw.oficial === true,
            Competencias: this.construirCompetencias(),
            Habilidades: this.construirHabilidadesPayload(),
            Idiomas: Array.from(this.seleccionados.idiomas).map((id) => {
                const idioma = this.idiomas.find((item) => item.Id === id);
                return { Id: id, Nombre: idioma?.Nombre ?? '', Descripcion: '', Secreto: false, Oficial: true };
            }),
            Desglose_niveles: this.construirDesglose(nivelMax),
            Prerrequisitos_flags: {},
            Prerrequisitos: prerrequisitos,
            Ataque_base: this.ataqueBaseSeleccionado,
            Salvaciones: {
                Fortaleza: this.fortalezaSeleccionada,
                Reflejos: this.reflejosSeleccionados,
                Voluntad: this.voluntadSeleccionada,
            },
        };
        return payload;
    }

    private construirAlineamiento(raw: any): any {
        return {
            Id: this.entero(raw.alineamiento_id),
            Basico: { Id_basico: 0, Nombre: '' },
            Ley: { Id_ley: 0, Nombre: '' },
            Moral: { Id_moral: 0, Nombre: '' },
            Prioridad: { Id_prioridad: 0, Nombre: '' },
            Descripcion: this.texto(raw.alineamiento_nombre, 'No aplica'),
        };
    }

    private construirCompetencias(): any {
        return {
            Armas: Array.from(this.seleccionados.armas).map((id) => this.refNombre(this.armas, id)),
            Armaduras: Array.from(this.seleccionados.armaduras).map((id) => this.refNombre(this.armaduras, id)),
            Grupos_arma: Array.from(this.seleccionados.gruposArma).map((id) => this.refNombre(this.gruposArma, id)),
            Grupos_armadura: Array.from(this.seleccionados.gruposArmadura).map((id) => this.refNombre(this.gruposArmadura, id)),
        };
    }

    private construirHabilidadesPayload(): any {
        const base: any[] = [];
        const custom: any[] = [];
        this.habilidadesRows
            .filter((row) => this.entero(row.id_habilidad) > 0)
            .forEach((row) => {
                const item = {
                    Id_habilidad: this.entero(row.id_habilidad),
                    Id_extra: this.entero(row.id_extra, -1),
                    Varios: this.texto(row.varios),
                    Habilidad: row.busqueda,
                    Extra: row.extraBusqueda || 'No aplica',
                };
                if (row.tipo === 'custom')
                    custom.push(item);
                else
                    base.push(item);
            });
        return { Base: base, Custom: custom };
    }

    private construirDesglose(nivelMax: number): ClaseNivelDetalle[] {
        this.sincronizarNiveles();
        const extrasEspecialesActivos = new Map<number, number>();
        return this.niveles.slice(0, nivelMax).map((nivel) => ({
            Nivel: nivel.nivel,
            Ataque_base: this.ataqueBaseSeleccionado.Valores[nivel.nivel - 1] ?? '+0',
            Salvaciones: {
                Fortaleza: this.fortalezaSeleccionada.Valores[nivel.nivel - 1] ?? '+0',
                Reflejos: this.reflejosSeleccionados.Valores[nivel.nivel - 1] ?? '+0',
                Voluntad: this.voluntadSeleccionada.Valores[nivel.nivel - 1] ?? '+0',
            },
            Nivel_max_poder_accesible_nivel_lanzadorPsionico: this.entero(nivel.nivel_max_poder, -1),
            Reserva_psionica: this.entero(nivel.reserva_psionica),
            Aumentos_clase_lanzadora: [],
            Conjuros_diarios: this.limpiarMapaNumerico(nivel.conjuros_diarios, -1),
            Conjuros_conocidos_nivel_a_nivel: this.limpiarMapaNumerico(nivel.conjuros_conocidos_nivel, 0),
            Conjuros_conocidos_total: this.entero(nivel.conjuros_conocidos_total),
            Dotes: this.relacionesRows.filter((row) => row.tipo === 'dote' && row.nivel === nivel.nivel && this.entero(row.id) > 0).map((row) => ({
                Dote: this.dotes.find((item) => this.getId(item) === this.entero(row.id)) ?? { Id: this.entero(row.id), Nombre: row.busqueda },
                Nivel: nivel.nivel,
                Id_extra: this.entero(row.id_extra, -1),
                Extra: row.extraBusqueda || 'No aplica',
                Opcional: this.entero(row.opcional),
                Id_interno: this.entero(row.id_interno),
                Id_especial_requerido: this.entero(row.id_especial_requerido),
                Id_dote_requerida: this.entero(row.id_dote_requerida),
            })),
            Especiales: this.relacionesRows.filter((row) => row.tipo === 'especial' && row.nivel === nivel.nivel && this.entero(row.id) > 0).map((row) => {
                const especial = this.especiales.find((item) => item.Id === this.entero(row.id));
                const idExtra = this.resolverExtraEspecial(row, especial, extrasEspecialesActivos);
                return {
                    Especial: especial ?? { Id: this.entero(row.id), Nombre: row.busqueda },
                    Nivel: nivel.nivel,
                    Id_extra: idExtra,
                    Extra: this.getNombreExtraEspecial(especial, idExtra, row.extraBusqueda),
                    Opcional: this.entero(row.opcional),
                    Id_interno: this.entero(row.id_interno),
                    Id_especial_requerido: this.entero(row.id_especial_requerido),
                    Id_dote_requerida: this.entero(row.id_dote_requerida),
                };
            }),
        }));
    }

    private resolverExtraEspecial(
        row: ClaseRelacionNivelRow,
        especial: EspecialClaseDetalle | undefined,
        activos: Map<number, number>,
    ): number {
        const idEspecial = this.entero(row.id);
        const idExtra = this.entero(row.id_extra, -1);
        if (idExtra > 0) {
            if (especial?.Activa_extra === true)
                activos.set(idEspecial, idExtra);
            return idExtra;
        }
        if (especial?.Activa_extra === true)
            return activos.get(idEspecial) ?? -1;
        return -1;
    }

    private getNombreExtraEspecial(especial: EspecialClaseDetalle | undefined, idExtra: number, fallback: string): string {
        if (idExtra <= 0)
            return 'No aplica';
        return especial?.Extras?.find((item) => item.Id_extra === idExtra)?.Extra ?? (fallback || 'No aplica');
    }

    private construirPrerrequisitosPayload(): ClasePrerrequisitos {
        const raw = buildPrerequisitePayload(this.prerrequisitosEditor, this.prerrequisitosCatalogContext);
        const aliases: Record<string, keyof ClasePrerrequisitos> = {
            habilidad: 'rangos_habilidad',
            dote: 'dote_elegida',
            escuela_nivel: 'nivel_escuela',
        };
        const keys: (keyof ClasePrerrequisitos)[] = [
            'subtipo', 'caracteristica', 'dg', 'dominio', 'nivel_escuela', 'ataque_base', 'reserva_psionica',
            'lanzar_poder_psionico_nivel', 'conocer_poder_psionico', 'genero', 'competencia_arma', 'competencia_armadura',
            'competencia_grupo_arma', 'competencia_grupo_armadura', 'dote_elegida', 'rangos_habilidad', 'idioma',
            'alineamiento_requerido', 'alineamiento_prohibido', 'actitud_requerido', 'actitud_prohibido', 'lanzador_arcano',
            'lanzador_divino', 'lanzar_conjuros_arcanos_nivel', 'lanzar_conjuros_divinos_nivel', 'conjuro_conocido',
            'inherente', 'clase_especial', 'tamano_maximo', 'tamano_minimo', 'raza', 'no_raza',
        ];
        const out = keys.reduce((acc, key) => ({ ...acc, [key]: [] }), {} as ClasePrerrequisitos);
        Object.keys(raw).forEach((key) => {
            const target = aliases[key] ?? key;
            if (Array.isArray((out as any)[target]))
                (out as any)[target] = [...(out as any)[target], ...(raw[key] ?? [])];
        });
        return out;
    }

    private cargarCatalogosBase(): void {
        this.claseSvc.getCatalogosProgresion().pipe(takeUntil(this.destroy$)).subscribe({
            next: (catalogos) => {
                if (catalogos.ataques_base.length > 0)
                    this.ataqueBaseCatalogo = catalogos.ataques_base;
                if (catalogos.salvaciones.length > 0)
                    this.salvacionCatalogo = catalogos.salvaciones;
                if (catalogos.puntos_habilidad.length > 0)
                    this.puntosHabilidadCatalogo = catalogos.puntos_habilidad;
                this.aumentosClaseLanzadoraCatalogo = catalogos.aumentos_clase_lanzadora;
            },
            error: () => {
                this.aumentosClaseLanzadoraCatalogo = [];
            },
        });
        this.manualSvc.getManuales().pipe(takeUntil(this.destroy$)).subscribe((items) => this.manuales = this.ordenar(items ?? []));
        this.claseSvc.getClases().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.clasesCatalogo = this.ordenar(items ?? []);
            this.catalogosPrerrequisito['clases'] = this.toCatalog(items, 'Id', 'Nombre');
        });
        this.armaSvc.getArmas().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.armas = this.toNombreId(items);
            this.catalogosPrerrequisito['armas'] = this.toCatalog(items, 'Id', 'Nombre');
        });
        this.armaduraSvc.getArmaduras().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.armaduras = this.toNombreId(items);
            this.catalogosPrerrequisito['armaduras'] = this.toCatalog(items, 'Id', 'Nombre');
        });
        this.grupoArmaSvc.getGruposArmas().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.gruposArma = this.toNombreId(items);
            this.catalogosPrerrequisito['grupos_arma'] = this.toCatalog(items, 'Id', 'Nombre');
        });
        this.grupoArmaduraSvc.getGruposArmaduras().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.gruposArmadura = this.toNombreId(items);
            this.catalogosPrerrequisito['grupos_armadura'] = this.toCatalog(items, 'Id', 'Nombre');
        });
        this.idiomaSvc.getIdiomas().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.idiomas = this.toNombreId(items);
            this.catalogosPrerrequisito['idiomas'] = this.toCatalog(items, 'Id', 'Nombre');
        });
        this.habilidadSvc.getHabilidades().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.habilidadesBase = this.ordenarHabilidades(items ?? []);
            this.catalogosPrerrequisito['habilidades'] = this.habilidadesBase.map((item) => ({ id: item.Id_habilidad, nombre: item.Nombre }));
        });
        this.habilidadSvc.getHabilidadesCustom().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.habilidadesCustom = this.ordenarHabilidades(items ?? []);
            this.reclasificarHabilidadesCustom();
        });
        this.habilidadSvc.habilidadesCustomMutadas$.pipe(takeUntil(this.destroy$)).subscribe((habilidad) => this.upsertHabilidadCustom(habilidad));
        this.doteSvc.getDotes().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.dotes = this.ordenar(items ?? []);
            this.catalogosPrerrequisito['dotes'] = this.toCatalog(items, 'Id', 'Nombre');
            this.actualizarOpcionesExtraDote(items ?? []);
        });
        this.especialSvc.getEspeciales().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.especiales = this.ordenar(items ?? []);
            this.catalogosPrerrequisito['especiales'] = this.toCatalog(items, 'Id', 'Nombre');
        });
        this.especialSvc.especialesMutados$.pipe(takeUntil(this.destroy$)).subscribe((especial) => this.upsertEspecial(especial));
        this.extraSvc.getExtras().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.extras = this.ordenar(items ?? []);
            this.catalogosPrerrequisito['extras'] = this.toCatalog(items, 'Id', 'Nombre');
        });
        this.conjuroSvc.getConjuros().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.conjuros = this.ordenar(items ?? []);
            this.catalogosPrerrequisito['conjuros'] = this.toCatalog(items, 'Id', 'Nombre');
        });
    }

    private cargarEdicionSiAplica(): void {
        if (!this.esModoEdicion)
            return;
        const idClase = this.entero(this.idClase);
        if (idClase <= 0 || this.cargandoEdicion || this.ultimoIdClaseCargado === idClase)
            return;
        this.cargandoEdicion = true;
        this.claseSvc.getClaseFresca(idClase).pipe(take(1), takeUntil(this.destroy$)).subscribe({
            next: (clase) => {
                this.hidratarDesdeClase(clase);
                this.ultimoIdClaseCargado = idClase;
                this.cargandoEdicion = false;
            },
            error: async (error) => {
                this.cargandoEdicion = false;
                await Swal.fire({ icon: 'error', title: 'No se pudo cargar la clase', text: error?.message ?? 'Error no identificado', showConfirmButton: true });
            },
        });
    }

    private hidratarDesdeClase(clase: Clase): void {
        this.manualBusqueda = clase.Manual?.Nombre ?? '';
        this.claseOrigenBusqueda = clase.Conjuros?.Clase_origen?.Nombre ?? '';
        this.form.reset({
            nombre: clase.Nombre ?? '',
            descripcion: clase.Descripcion ?? '',
            id_manual: this.entero(clase.Manual?.Id),
            pagina: this.entero(clase.Manual?.Pagina),
            oficial: clase.Oficial !== false,
            tipo_dado: this.entero(clase.Tipo_dado?.Id, this.extraerDado(clase.Tipo_dado?.Nombre, 8)),
            puntos_habilidad_id: this.entero(clase.Puntos_habilidad?.Id, this.inferirPuntosHabilidadId(clase.Puntos_habilidad?.Valor)),
            nivel_max_claseo: this.entero(clase.Nivel_max_claseo, 20),
            id_ataque_base: this.entero(clase.Ataque_base?.Id, this.inferirAtaqueBaseId(clase.Desglose_niveles)),
            fortaleza_id: this.entero(clase.Salvaciones?.Fortaleza?.Id, this.inferirSalvacionId(clase.Desglose_niveles, 'Fortaleza')),
            reflejos_id: this.entero(clase.Salvaciones?.Reflejos?.Id, this.inferirSalvacionId(clase.Desglose_niveles, 'Reflejos')),
            voluntad_id: this.entero(clase.Salvaciones?.Voluntad?.Id, this.inferirSalvacionId(clase.Desglose_niveles, 'Voluntad')),
            mod_salv_conjuros: clase.Mod_salv_conjuros ?? 'No aplica',
            prestigio: clase.Prestigio === true,
            es_predilecta: clase.Es_predilecta === true,
            aumenta_clase_lanzadora: clase.Aumenta_clase_lanzadora === true,
            rol_dps: clase.Roles?.Dps === true,
            rol_tanque: clase.Roles?.Tanque === true,
            rol_support: clase.Roles?.Support === true,
            rol_utilidad: clase.Roles?.Utilidad === true,
            alineamiento_id: this.entero(clase.Alineamiento?.Id),
            alineamiento_nombre: clase.Alineamiento?.Descripcion ?? 'No aplica',
            conjuros_dependientes_alineamiento: clase.Conjuros?.Dependientes_alineamiento === true,
            conjuros_divinos: clase.Conjuros?.Divinos === true,
            conjuros_arcanos: clase.Conjuros?.Arcanos === true,
            conjuros_psionicos: clase.Conjuros?.Psionicos === true,
            conjuros_alma: clase.Conjuros?.Alma === true,
            conocidos_total: clase.Conjuros?.Conocidos_total === true,
            conocidos_nivel: clase.Conjuros?.Conocidos_nivel_a_nivel === true,
            dominio: clase.Conjuros?.Dominio === true,
            dominio_cantidad: this.entero(clase.Conjuros?.Dominio_cantidad),
            puede_elegir_especialidad: clase.Conjuros?.puede_elegir_especialidad === true,
            lanzamiento_espontaneo: clase.Conjuros?.Lanzamiento_espontaneo === true,
            clase_origen_id: this.entero(clase.Conjuros?.Clase_origen?.Id),
            clase_origen_nombre: clase.Conjuros?.Clase_origen?.Nombre ?? '',
        });
        this.habilidadesRows = this.hidratarHabilidades(clase);
        this.niveles = this.hidratarNiveles(clase);
        this.relacionesRows = this.hidratarRelaciones(clase);
        this.prerrequisitosSeleccionados = this.hidratarPrerrequisitosSeleccionados(clase);
        this.prerrequisitosEditor = [];
        this.hidratarSelecciones(clase);
        this.initialEditSnapshot = this.buildEditSnapshot();
    }

    private hidratarHabilidades(clase: Clase): ClaseHabilidadRow[] {
        const rows = [
            ...(clase.Habilidades?.Base ?? []).map((item: any) => this.habilidadRowDesdePayload(item, 'base' as const)),
            ...(clase.Habilidades?.Custom ?? []).map((item: any) => this.habilidadRowDesdePayload(item, 'custom' as const)),
        ].filter((row) => row.id_habilidad > 0);
        return rows.length > 0 ? rows : [this.crearHabilidadRow('base')];
    }

    private habilidadRowDesdePayload(item: any, tipo: 'base' | 'custom'): ClaseHabilidadRow {
        return {
            uid: this.uid(),
            tipo,
            id_habilidad: this.entero(item?.Id_habilidad ?? item?.id_habilidad),
            id_extra: this.entero(item?.Id_extra ?? item?.id_extra, -1),
            varios: this.texto(item?.Varios ?? item?.varios),
            busqueda: this.texto(item?.Habilidad ?? item?.Nombre),
            extraBusqueda: this.texto(item?.Extra, 'No aplica'),
        };
    }

    private hidratarNiveles(clase: Clase): ClaseNivelEditor[] {
        const max = Math.max(1, this.entero(clase.Nivel_max_claseo, 20));
        const byNivel = new Map((clase.Desglose_niveles ?? []).map((item) => [this.entero(item.Nivel), item]));
        return Array.from({ length: max }, (_, index) => {
            const nivel = index + 1;
            const source = byNivel.get(nivel);
            return {
                nivel,
                reserva_psionica: this.entero(source?.Reserva_psionica),
                nivel_max_poder: this.entero(source?.Nivel_max_poder_accesible_nivel_lanzadorPsionico, -1),
                conjuros_diarios: { ...(source?.Conjuros_diarios ?? {}) },
                conjuros_conocidos_nivel: { ...(source?.Conjuros_conocidos_nivel_a_nivel ?? {}) },
                conjuros_conocidos_total: this.entero(source?.Conjuros_conocidos_total),
            };
        });
    }

    private hidratarRelaciones(clase: Clase): ClaseRelacionNivelRow[] {
        return (clase.Desglose_niveles ?? []).flatMap((nivel) => [
            ...(nivel.Dotes ?? []).map((item: any) => this.relacionDesdeNivel('dote', nivel.Nivel, item)),
            ...(nivel.Especiales ?? []).map((item: any) => this.relacionDesdeNivel('especial', nivel.Nivel, item)),
        ]);
    }

    private relacionDesdeNivel(tipo: 'dote' | 'especial', nivel: number, item: any): ClaseRelacionNivelRow {
        const source = tipo === 'dote' ? item?.Dote : item?.Especial;
        return {
            uid: this.uid(),
            tipo,
            nivel: this.entero(nivel, 1),
            id: this.entero(source?.Id),
            id_extra: this.entero(item?.Id_extra, -1),
            opcional: this.entero(item?.Opcional),
            id_interno: this.entero(item?.Id_interno),
            id_especial_requerido: this.entero(item?.Id_especial_requerido),
            id_dote_requerida: this.entero(item?.Id_dote_requerida),
            busqueda: this.texto(source?.Nombre),
            extraBusqueda: this.texto(item?.Extra, 'No aplica'),
        };
    }

    private hidratarPrerrequisitosSeleccionados(clase: Clase): PrerequisiteType[] {
        const reverseAliases: Record<string, PrerequisiteType> = {
            rangos_habilidad: 'habilidad',
            dote_elegida: 'dote',
            nivel_escuela: 'escuela_nivel',
        };
        return Object.keys(clase.Prerrequisitos ?? {})
            .filter((key) => Array.isArray((clase.Prerrequisitos as any)[key]) && (clase.Prerrequisitos as any)[key].length > 0)
            .map((key) => reverseAliases[key] ?? key as PrerequisiteType)
            .filter((key) => this.prerrequisitoOpciones.some((option) => option.key === key));
    }

    private sincronizarNiveles(): void {
        const max = Math.max(1, Math.min(30, this.entero(this.form.controls.nivel_max_claseo.value, 20)));
        const current = new Map(this.niveles.map((item) => [item.nivel, item]));
        this.niveles = Array.from({ length: max }, (_, index) => {
            const nivel = index + 1;
            return current.get(nivel) ?? {
                nivel,
                reserva_psionica: 0,
                nivel_max_poder: -1,
                conjuros_diarios: {},
                conjuros_conocidos_nivel: {},
                conjuros_conocidos_total: 0,
            };
        });
        this.relacionesRows = this.relacionesRows.filter((row) => row.nivel <= max);
    }

    private reiniciarFilas(): void {
        this.habilidadesRows = [this.crearHabilidadRow('base')];
        this.relacionesRows = [];
        this.sincronizarNiveles();
    }

    private hidratarSelecciones(clase: Clase): void {
        this.seleccionados.armas = new Set((clase.Competencias?.Armas ?? []).map((item: any) => this.getId(item)).filter((id) => id > 0));
        this.seleccionados.armaduras = new Set((clase.Competencias?.Armaduras ?? []).map((item: any) => this.getId(item)).filter((id) => id > 0));
        this.seleccionados.gruposArma = new Set((clase.Competencias?.Grupos_arma ?? []).map((item: any) => this.getId(item)).filter((id) => id > 0));
        this.seleccionados.gruposArmadura = new Set((clase.Competencias?.Grupos_armadura ?? []).map((item: any) => this.getId(item)).filter((id) => id > 0));
        this.seleccionados.idiomas = new Set((clase.Idiomas ?? []).map((item: any) => this.getId(item)).filter((id) => id > 0));
    }

    private resetFormulario(): void {
        this.form.reset({
            nombre: '',
            descripcion: '',
            id_manual: 0,
            pagina: 0,
            oficial: true,
            tipo_dado: 8,
            puntos_habilidad_id: 2,
            nivel_max_claseo: 20,
            id_ataque_base: 2,
            fortaleza_id: 2,
            reflejos_id: 2,
            voluntad_id: 2,
            mod_salv_conjuros: 'No aplica',
            prestigio: false,
            es_predilecta: false,
            aumenta_clase_lanzadora: false,
            rol_dps: false,
            rol_tanque: false,
            rol_support: false,
            rol_utilidad: false,
            alineamiento_id: 0,
            alineamiento_nombre: 'No aplica',
            conjuros_dependientes_alineamiento: false,
            conjuros_divinos: false,
            conjuros_arcanos: false,
            conjuros_psionicos: false,
            conjuros_alma: false,
            conocidos_total: false,
            conocidos_nivel: false,
            dominio: false,
            dominio_cantidad: 0,
            puede_elegir_especialidad: false,
            lanzamiento_espontaneo: false,
            clase_origen_id: 0,
            clase_origen_nombre: '',
        });
        this.manualBusqueda = '';
        this.claseOrigenBusqueda = '';
        this.prerrequisitosEditor = [];
        this.prerrequisitosSeleccionados = [];
        this.seleccionados.armas.clear();
        this.seleccionados.armaduras.clear();
        this.seleccionados.gruposArma.clear();
        this.seleccionados.gruposArmadura.clear();
        this.seleccionados.idiomas.clear();
        this.reiniciarFilas();
        this.initialEditSnapshot = '';
        this.ultimoIdClaseCargado = 0;
    }

    private crearHabilidadRow(tipo: 'base' | 'custom'): ClaseHabilidadRow {
        return { uid: this.uid(), tipo, id_habilidad: 0, id_extra: -1, varios: '', busqueda: '', extraBusqueda: '' };
    }

    private crearRelacionRow(tipo: 'dote' | 'especial'): ClaseRelacionNivelRow {
        return {
            uid: this.uid(),
            tipo,
            nivel: 1,
            id: 0,
            id_extra: -1,
            opcional: 0,
            id_interno: 0,
            id_especial_requerido: 0,
            id_dote_requerida: 0,
            busqueda: '',
            extraBusqueda: '',
        };
    }

    private buildEditSnapshot(): string {
        return JSON.stringify(this.construirPayload());
    }

    private actualizarPermisos(): void {
        this.puedeCrear = this.userSvc.can('clases', 'create');
        this.puedeActualizar = this.userSvc.can('clases', 'update');
    }

    private async asegurarCatalogosPrerrequisitos(types: PrerequisiteType[]): Promise<void> {
        const keys = getPrerequisiteCatalogsForTypes(types);
        await Promise.all(keys.map((key) => this.cargarCatalogoPrerrequisito(key)));
    }

    private cargarCatalogoPrerrequisito(key: PrerequisiteCatalogKey): Promise<void> {
        if (this.catalogosCargados.has(key))
            return Promise.resolve();
        const pendiente = this.catalogosPendientes.get(key);
        if (pendiente)
            return pendiente;
        this.cargandoCatalogos.add(key);
        const promise = new Promise<void>((resolve) => {
            const done = (items: PrerequisiteCatalogItem[]) => {
                this.catalogosPrerrequisito[key] = this.ordenarCatalog(items);
                this.catalogosCargados.add(key);
                this.cargandoCatalogos.delete(key);
                resolve();
            };
            if (key === 'alineamientos') {
                this.alineamientoSvc.getAlineamientosCombinacionesCatalogo().pipe(take(1)).subscribe({ next: (items: any[]) => done(this.toCatalog(items, 'Id', 'Nombre')), error: () => done([]) });
            } else if (key === 'dominios') {
                this.dominioSvc.getDominios().pipe(take(1)).subscribe({ next: (items) => done(this.toCatalog(items, 'Id', 'Nombre')), error: () => done([]) });
            } else if (key === 'escuelas') {
                this.escuelaSvc.getEscuelas().pipe(take(1)).subscribe({ next: (items) => done(this.toCatalog(items, 'Id', 'Nombre')), error: () => done([]) });
            } else if (key === 'razas') {
                this.razaSvc.getRazas().pipe(take(1)).subscribe({ next: (items) => done(this.toCatalog(items, 'Id', 'Nombre')), error: () => done([]) });
            } else if (key === 'regiones') {
                this.regionSvc.getRegiones().pipe(take(1)).subscribe({ next: (items) => done(this.toCatalog(items, 'Id', 'Nombre')), error: () => done([]) });
            } else if (key === 'subtipos') {
                this.subtipoSvc.getSubtipos().pipe(take(1)).subscribe({ next: (items) => done(this.toCatalog(items, 'Id', 'Nombre')), error: () => done([]) });
            } else if (key === 'tamanos') {
                this.tamanoSvc.getTamanos().pipe(take(1)).subscribe({ next: (items) => done(this.toCatalog(items, 'Id', 'Nombre')), error: () => done([]) });
            } else if (key === 'tipos_criatura') {
                this.tipoCriaturaSvc.getTiposCriatura().pipe(take(1)).subscribe({ next: (items) => done(this.toCatalog(items, 'Id', 'Nombre')), error: () => done([]) });
            } else {
                done(this.catalogosPrerrequisito[key] ?? []);
            }
        });
        this.catalogosPendientes.set(key, promise);
        return promise.finally(() => this.catalogosPendientes.delete(key));
    }

    private getCatalogoPrerrequisito(type: PrerequisiteType): PrerequisiteCatalogItem[] {
        if (type === 'actitud_prohibido' || type === 'actitud_requerido')
            return this.actitudesCatalogo;
        if (type === 'genero')
            return this.generoCatalogo;
        if (type === 'alineamiento_prohibido' || type === 'alineamiento_requerido')
            return this.catalogosPrerrequisito['alineamientos'];
        if (type === 'competencia_arma')
            return this.catalogosPrerrequisito['armas'];
        if (type === 'competencia_armadura')
            return this.catalogosPrerrequisito['armaduras'];
        if (type === 'competencia_grupo_arma')
            return this.catalogosPrerrequisito['grupos_arma'];
        if (type === 'competencia_grupo_armadura')
            return this.catalogosPrerrequisito['grupos_armadura'];
        if (type === 'conjuro_conocido' || type === 'conocer_poder_psionico')
            return this.catalogosPrerrequisito['conjuros'];
        if (type === 'dominio')
            return this.catalogosPrerrequisito['dominios'];
        if (type === 'dote')
            return this.catalogosPrerrequisito['dotes'];
        if (type === 'escuela_nivel')
            return this.catalogosPrerrequisito['escuelas'];
        if (type === 'habilidad')
            return this.catalogosPrerrequisito['habilidades'];
        if (type === 'idioma')
            return this.catalogosPrerrequisito['idiomas'];
        if (type === 'clase_especial')
            return this.catalogosPrerrequisito['especiales'];
        if (type === 'raza' || type === 'no_raza')
            return this.catalogosPrerrequisito['razas'];
        if (type === 'subtipo')
            return this.catalogosPrerrequisito['subtipos'];
        if (type === 'tamano_maximo' || type === 'tamano_minimo')
            return this.catalogosPrerrequisito['tamanos'];
        if (type === 'tipo_criatura')
            return this.catalogosPrerrequisito['tipos_criatura'];
        return [];
    }

    private getNombreCatalogo(tipo: PrerequisiteType, id: number): string {
        return findCatalogName(tipo, id, this.getCatalogoPrerrequisito(tipo));
    }

    private getOpcionesExtraDote(idDote: number): PrerequisiteCatalogItem[] {
        return this.opcionesExtraDotePorId.get(this.entero(idDote)) ?? [];
    }

    private actualizarOpcionesExtraDote(dotes: any[]): void {
        const next = new Map<number, PrerequisiteCatalogItem[]>();
        (dotes ?? []).forEach((dote) => {
            const extras: PrerequisiteCatalogItem[] = [];
            const disponibles = dote?.Extras_disponibles ?? {};
            ['Armas', 'Armaduras', 'Escuelas', 'Habilidades'].forEach((key) => {
                (disponibles[key] ?? []).forEach((item: any) => extras.push({ id: this.getId(item), nombre: this.texto(item?.Nombre) }));
            });
            if (extras.length > 0)
                next.set(this.getId(dote), this.ordenarCatalog(extras.filter((item) => item.id > 0)));
        });
        this.opcionesExtraDotePorId = next;
    }

    private upsertHabilidadCustom(habilidad: HabilidadBasicaDetalle): void {
        if (!habilidad || this.entero(habilidad.Id_habilidad) <= 0)
            return;
        const others = this.habilidadesCustom.filter((item) => item.Id_habilidad !== habilidad.Id_habilidad);
        this.habilidadesCustom = this.ordenarHabilidades([...others, habilidad]);
        this.habilidadesRows = this.habilidadesRows.map((row) => row.tipo === 'custom' && row.id_habilidad === habilidad.Id_habilidad
            ? { ...row, busqueda: habilidad.Nombre }
            : row);
    }

    private upsertEspecial(especial: EspecialClaseDetalle): void {
        if (!especial || this.entero(especial.Id) <= 0)
            return;
        const others = this.especiales.filter((item) => item.Id !== especial.Id);
        this.especiales = this.ordenar([...others, especial]);
        this.catalogosPrerrequisito['especiales'] = this.toCatalog(this.especiales, 'Id', 'Nombre');
        this.relacionesRows = this.relacionesRows.map((row) => row.tipo === 'especial' && row.id === especial.Id
            ? { ...row, busqueda: especial.Nombre }
            : row);
    }

    private reclasificarHabilidadesCustom(): void {
        const customIds = new Set(this.habilidadesCustom.map((item) => item.Id_habilidad));
        this.habilidadesRows = this.habilidadesRows.map((row) => customIds.has(row.id_habilidad)
            ? { ...row, tipo: 'custom' }
            : row);
    }

    private getCatalogoHabilidades(tipo: 'base' | 'custom'): HabilidadBasicaDetalle[] {
        return tipo === 'custom' ? this.habilidadesCustom : this.habilidadesBase;
    }

    private refNombre(catalogo: NombreIdItem[], id: number): NombreIdItem {
        const item = catalogo.find((actual) => actual.Id === id);
        return { Id: id, Nombre: item?.Nombre ?? '' };
    }

    private limpiarMapaNumerico(source: Record<string, any>, fallback: number): Record<string, number> {
        return Object.keys(source ?? {}).reduce((acc: Record<string, number>, key) => {
            const value = this.entero(source[key], fallback);
            if (value !== fallback)
                acc[key] = value;
            return acc;
        }, {});
    }

    private inferirAtaqueBaseId(niveles: ClaseNivelDetalle[]): number {
        return this.inferirProgresionId(niveles.map((nivel) => nivel.Ataque_base), this.ataqueBaseCatalogo, 2);
    }

    private inferirSalvacionId(niveles: ClaseNivelDetalle[], key: 'Fortaleza' | 'Reflejos' | 'Voluntad'): number {
        return this.inferirProgresionId(niveles.map((nivel) => nivel.Salvaciones?.[key]), this.salvacionCatalogo, 2);
    }

    private inferirProgresionId(valores: any[], catalogo: ClaseProgressionCatalogItem[], fallback: number): number {
        const compact = (valores ?? []).map((item) => this.texto(item)).filter((item) => item.length > 0);
        const encontrada = catalogo.find((item) => compact.every((valor, index) => item.Valores[index] === valor));
        return encontrada?.Id ?? fallback;
    }

    private inferirPuntosHabilidadId(valor: any): number {
        const puntos = this.entero(valor, 4);
        return this.puntosHabilidadCatalogo.find((item) => item.Valor === puntos)?.Id ?? 2;
    }

    private extraerDado(nombre: any, fallback: number): number {
        const match = `${nombre ?? ''}`.match(/\d+/);
        return match ? this.entero(match[0], fallback) : fallback;
    }

    private generarAtaqueBase(tipo: 'bueno' | 'medio' | 'pobre'): string[] {
        return Array.from({ length: 30 }, (_, index) => {
            const nivel = index + 1;
            const value = tipo === 'bueno' ? nivel : tipo === 'medio' ? Math.floor(nivel * 0.75) : Math.floor(nivel * 0.5);
            return this.formatBonus(value);
        });
    }

    private generarSalvacion(buena: boolean): string[] {
        return Array.from({ length: 30 }, (_, index) => {
            const nivel = index + 1;
            const value = buena ? 2 + Math.floor(nivel / 2) : Math.floor(nivel / 3);
            return this.formatBonus(value);
        });
    }

    private formatBonus(value: number): string {
        return value >= 0 ? `+${value}` : `${value}`;
    }

    private filtrarPorNombre<T extends { Nombre?: string; }>(items: T[], query: string): T[] {
        const filtro = this.normalizar(query);
        if (filtro.length < 1)
            return items.slice(0, 50);
        return items.filter((item) => this.normalizar(item.Nombre ?? '').includes(filtro)).slice(0, 50);
    }

    private filtrarHabilidades(items: HabilidadBasicaDetalle[], query: string): HabilidadBasicaDetalle[] {
        const filtro = this.normalizar(query);
        if (filtro.length < 1)
            return items.slice(0, 50);
        return items.filter((item) => this.normalizar(item.Nombre).includes(filtro)).slice(0, 50);
    }

    private filtrarExtras<T extends { Extra: string; }>(items: T[], query: string): T[] {
        const filtro = this.normalizar(query);
        if (filtro.length < 1)
            return items.slice(0, 50);
        return items.filter((item) => this.normalizar(item.Extra).includes(filtro)).slice(0, 50);
    }

    private toNombreId(items: any[]): NombreIdItem[] {
        return this.ordenar((items ?? []).map((item) => ({ Id: this.getId(item), Nombre: this.texto(item?.Nombre) })).filter((item) => item.Id > 0 && item.Nombre.length > 0));
    }

    private toCatalog(items: any[], idKey: string, nombreKey: string): PrerequisiteCatalogItem[] {
        return this.ordenarCatalog((items ?? []).map((item) => ({ id: this.entero(item?.[idKey] ?? item?.id), nombre: this.texto(item?.[nombreKey] ?? item?.nombre) })).filter((item) => item.id > 0 && item.nombre.length > 0));
    }

    private ordenar<T extends { Nombre?: string; }>(items: T[]): T[] {
        return [...(items ?? [])].sort((a, b) => `${a.Nombre ?? ''}`.localeCompare(`${b.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
    }

    private ordenarHabilidades(items: HabilidadBasicaDetalle[]): HabilidadBasicaDetalle[] {
        return [...(items ?? [])].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    private ordenarCatalog(items: PrerequisiteCatalogItem[]): PrerequisiteCatalogItem[] {
        const map = new Map<number, string>();
        (items ?? []).forEach((item) => {
            if (this.entero(item.id) > 0 && this.texto(item.nombre).length > 0 && !map.has(this.entero(item.id)))
                map.set(this.entero(item.id), this.texto(item.nombre));
        });
        return Array.from(map.entries())
            .map(([id, nombre]) => ({ id, nombre }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private getId(item: any): number {
        return this.entero(item?.Id ?? item?.id ?? item?.Id_dote ?? item?.Id_habilidad);
    }

    private uid(): string {
        this.uidCounter += 1;
        return `clase_${Date.now()}_${this.uidCounter}`;
    }

    private normalizar(value: unknown): string {
        return `${value ?? ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    }

    private texto(value: unknown, fallback: string = ''): string {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : fallback;
    }

    private entero(value: unknown, fallback: number = 0): number {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) ? parsed : fallback;
    }
}
