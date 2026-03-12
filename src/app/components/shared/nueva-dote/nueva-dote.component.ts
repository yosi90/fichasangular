import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PrerrequisitoEditorHostComponent } from '../prerrequisito-editor/prerrequisito-editor-host.component';
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
    getPrerequisiteDefinition,
} from '../prerrequisito-editor/prerrequisito-editor.registry';
import { DoteCreateRequest, DoteCreateResponse } from 'src/app/interfaces/dotes-api';
import { Dote } from 'src/app/interfaces/dote';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { Manual } from 'src/app/interfaces/manual';
import { DoteService } from 'src/app/services/dote.service';
import { ExtraService } from 'src/app/services/extra.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { ManualService } from 'src/app/services/manual.service';
import { UserService } from 'src/app/services/user.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ClaseService } from 'src/app/services/clase.service';
import { RazaService } from 'src/app/services/raza.service';
import { DominioService } from 'src/app/services/dominio.service';
import { RegionService } from 'src/app/services/region.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { EspecialService } from 'src/app/services/especial.service';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { TamanoService } from 'src/app/services/tamano.service';

type RepeticionKey = 'repetible' | 'repetible_distinto_extra' | 'repetible_comb';
type ExtraFamilyKey = 'extra_arma' | 'extra_armadura' | 'extra_escuela' | 'extra_habilidad';

interface CrearDoteEmitPayload {
    idDote: number;
    nombre: string;
}

interface ModificadorCatalogoItem {
    key: string;
    label: string;
}

interface ModificadorEditorItem {
    key: string;
    value: number;
}

interface HabilidadOtorgadaEditorItem {
    id_habilidad: number;
    id_extra: number;
    rangos: number;
}

interface PrerrequisitoOption {
    key: PrerequisiteType;
    label: string;
}

type PrerrequisitoEditorItem = PrerequisiteRowModel;
type ExtraSelectorItem = PrerequisiteCatalogItem;
type ArmaduraSelectorItem = ExtraSelectorItem & { esEscudo: boolean; };

@Component({
    selector: 'app-nueva-dote',
    templateUrl: './nueva-dote.component.html',
    styleUrls: ['./nueva-dote.component.sass'],
    standalone: false
})
export class NuevaDoteComponent implements OnInit, OnDestroy {
    private static readonly bodyModalClass = 'nueva-dote-modal-open';
    private static readonly preferredManualName = 'Compendio de dotes';
    private readonly extraFamilyKeys: ExtraFamilyKey[] = ['extra_arma', 'extra_armadura', 'extra_escuela', 'extra_habilidad'];
    readonly modificadoresCatalogo: ModificadorCatalogoItem[] = [
        { key: 'puntos_golpe_nivel', label: 'Puntos de golpe adicionales por nivel' },
        { key: 'puntos_golpe_unica_vez', label: 'Puntos de golpe adicionales 1 vez' },
        { key: 'caracteristica_a_elegir', label: 'Característica a elegir' },
        { key: 'puntos_extra_habilidad', label: 'Puntos extra en una habilidad' },
        { key: 'fuerza', label: 'Fuerza' },
        { key: 'destreza', label: 'Destreza' },
        { key: 'constitucion', label: 'Constitución' },
        { key: 'inteligencia', label: 'Inteligencia' },
        { key: 'sabiduria', label: 'Sabiduría' },
        { key: 'carisma', label: 'Carisma' },
        { key: 'ca', label: 'CA' },
        { key: 'ca_toque', label: 'CA de toque' },
        { key: 'ca_desprevenido', label: 'CA desprevenido' },
        { key: 'armadura_natural', label: 'Armadura natural' },
        { key: 'ataque_base', label: 'Ataque base' },
        { key: 'presa', label: 'Presa' },
        { key: 'iniciativa', label: 'Iniciativa' },
        { key: 'fortaleza', label: 'Fortaleza' },
        { key: 'reflejos', label: 'Reflejos' },
        { key: 'voluntad', label: 'Voluntad' },
        { key: 'espacio', label: 'Espacio' },
        { key: 'alcance', label: 'Alcance' },
        { key: 'velocidad', label: 'Aumenta velocidad de movimiento' },
        { key: 'velocidad_nado', label: 'Aumenta velocidad de nado' },
        { key: 'velocidad_vuelo', label: 'Aumenta velocidad de vuelo' },
        { key: 'velocidad_trepar', label: 'Aumenta velocidad de trepado' },
        { key: 'velocidad_escalar', label: 'Aumenta velocidad de escalada' },
    ];
    readonly prerrequisitoOpciones: PrerrequisitoOption[] = PREREQUISITE_EDITOR_DEFINITIONS
        .filter((item) => item.type !== 'inherente')
        .map((item) => ({ key: item.type, label: item.label }));
    readonly caracteristicasCatalogo: ExtraSelectorItem[] = [
        { id: 1, nombre: 'Fuerza' },
        { id: 2, nombre: 'Destreza' },
        { id: 3, nombre: 'Constitución' },
        { id: 4, nombre: 'Inteligencia' },
        { id: 5, nombre: 'Sabiduría' },
        { id: 6, nombre: 'Carisma' },
    ];
    readonly actitudesCatalogo: ExtraSelectorItem[] = [
        { id: 1, nombre: 'Legal' },
        { id: 2, nombre: 'Neutral' },
        { id: 3, nombre: 'Caótica' },
        { id: 4, nombre: 'Buena' },
        { id: 5, nombre: 'Maligna' },
    ];
    @Output() doteCreada = new EventEmitter<CrearDoteEmitPayload>();
    @ViewChild(PrerrequisitoEditorHostComponent) prerrequisitoEditorHost?: PrerrequisitoEditorHostComponent;

    guardando: boolean = false;
    puedeCrear: boolean = false;
    confirmandoSelectorPrerrequisitos: boolean = false;
    dotesExistentes: Dote[] = [];
    dotesCatalogoPrerrequisito: ExtraSelectorItem[] = [];
    habilidadesCatalogoPrerrequisito: ExtraSelectorItem[] = [];
    tiposDoteCatalogoPrerrequisito: ExtraSelectorItem[] = [];
    manuales: Manual[] = [];
    tiposDote: Array<{ Id: number; Nombre: string; }> = [];
    modificadoresEditor: ModificadorEditorItem[] = [];
    habilidadesCatalogo: HabilidadBasicaDetalle[] = [];
    armasCatalogo: ExtraSelectorItem[] = [];
    armadurasCatalogo: ArmaduraSelectorItem[] = [];
    escuelasCatalogo: ExtraSelectorItem[] = [];
    idiomasCatalogo: ExtraSelectorItem[] = [];
    clasesCatalogo: ExtraSelectorItem[] = [];
    razasCatalogo: ExtraSelectorItem[] = [];
    dominiosCatalogo: ExtraSelectorItem[] = [];
    regionesCatalogo: ExtraSelectorItem[] = [];
    tiposCriaturaCatalogo: ExtraSelectorItem[] = [];
    gruposArmasCatalogo: ExtraSelectorItem[] = [];
    gruposArmadurasCatalogo: ExtraSelectorItem[] = [];
    conjurosCatalogo: ExtraSelectorItem[] = [];
    especialesCatalogo: ExtraSelectorItem[] = [];
    especialesDetalleCatalogo: EspecialClaseDetalle[] = [];
    extrasCatalogo: ExtraSelectorItem[] = [];
    alineamientosCatalogo: ExtraSelectorItem[] = [];
    tamanosCatalogo: ExtraSelectorItem[] = [];
    habilidadesOtorgadasEditor: HabilidadOtorgadaEditorItem[] = [];
    prerrequisitosEditor: PrerrequisitoEditorItem[] = [];
    prerrequisitosSeleccionados: PrerequisiteType[] = [];
    extrasSeleccionados: { armas: number[]; armaduras: number[]; escuelas: number[]; habilidades: number[]; } = {
        armas: [],
        armaduras: [],
        escuelas: [],
        habilidades: [],
    };
    selectorExtrasVisible: boolean = false;
    selectorExtrasFiltro: string = '';
    selectorExtrasTempIds: number[] = [];
    selectorPrerrequisitosVisible: boolean = false;
    selectorPrerrequisitosFiltro: string = '';
    selectorPrerrequisitosTempKeys: PrerequisiteType[] = [];
    opcionesExtraDotePorId = new Map<number, ExtraSelectorItem[]>();
    cargandoCatalogos = new Set<PrerequisiteCatalogKey>();
    catalogosCargados = new Set<PrerequisiteCatalogKey>();
    catalogosPendientes = new Map<PrerequisiteCatalogKey, Promise<void>>();
    readonly prerrequisitosCatalogContext: PrerequisiteCatalogContext = {
        getCatalog: (type) => this.getCatalogoPrerrequisito(type),
        getCatalogName: (type, id) => this.getNombreCatalogo(type, id),
        getDoteExtraOptions: (idDote) => this.getOpcionesExtraDote(idDote),
        dotePermiteExtra: (idDote) => this.doteCatalogoPermiteExtra(idDote),
        getGlobalExtraOptions: () => this.extrasCatalogo,
        habilidadPermiteExtra: (idHabilidad) => this.habilidadCatalogoPermiteExtra(idHabilidad),
        especialPermiteExtra: (idEspecial) => this.especialCatalogoPermiteExtra(idEspecial),
    };
    readonly ensurePrerequisiteCatalogs = (types: PrerequisiteType[]) => this.asegurarCatalogosPrerrequisitos(types);

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        beneficio: ['', [Validators.required, Validators.minLength(3)]],
        descripcion: ['', [Validators.required, Validators.minLength(10)]],
        normal: ['No especifica'],
        especial: ['No especifica'],
        id_manual: [0, [Validators.required, Validators.min(0)]],
        pagina: [1, [Validators.required, Validators.min(0)]],
        id_tipo: [1, [Validators.required, Validators.min(0)]],
        id_tipo2: [0, [Validators.required, Validators.min(0)]],
        oficial: [true],
        comp_arma: [false],
        repetible: [false],
        repetible_distinto_extra: [false],
        repetible_comb: [false],
        extra_arma: [false],
        extra_armadura_armaduras: [false],
        extra_armadura_escudos: [false],
        extra_escuela: [false],
        extra_habilidad: [false],
    }, {
        validators: [
            this.tiposDistintosValidator(),
            this.exclusiveTrueValidator<RepeticionKey>(['repetible', 'repetible_distinto_extra', 'repetible_comb'], 'repeticion_exclusiva'),
            this.extraFamilyExclusiveValidator(),
        ]
    });

    private readonly destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private doteSvc: DoteService,
        private extraSvc: ExtraService,
        private habilidadSvc: HabilidadService,
        private manualSvc: ManualService,
        private userSvc: UserService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private escuelaSvc: EscuelaConjurosService,
        private idiomaSvc: IdiomaService,
        private claseSvc: ClaseService,
        private razaSvc: RazaService,
        private dominioSvc: DominioService,
        private regionSvc: RegionService,
        private tipoCriaturaSvc: TipoCriaturaService,
        private grupoArmaSvc: GrupoArmaService,
        private grupoArmaduraSvc: GrupoArmaduraService,
        private conjuroSvc: ConjuroService,
        private especialSvc: EspecialService,
        private alineamientoSvc: AlineamientoService,
        private tamanoSvc: TamanoService,
    ) { }

    ngOnInit(): void {
        this.agregarModificador();
        this.agregarHabilidadOtorgada();

        this.recalcularPermisos();
        this.userSvc.acl$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.recalcularPermisos());
        this.userSvc.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.recalcularPermisos());

        this.doteSvc.getDotes()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (dotes) => {
                    this.dotesExistentes = Array.isArray(dotes) ? dotes : [];
                    this.actualizarCatalogoDotesPrerrequisito(this.dotesExistentes);
                    this.actualizarOpcionesExtraDote(this.dotesExistentes);
                    this.actualizarTiposDoteDesdeCatalogo(this.dotesExistentes);
                    this.catalogosCargados.add('dotes');
                    this.catalogosCargados.add('tipos_dote');
                    this.form.controls.nombre.updateValueAndValidity({ onlySelf: true, emitEvent: false });
                },
                error: () => {
                    this.dotesExistentes = [];
                    this.dotesCatalogoPrerrequisito = [];
                    this.opcionesExtraDotePorId = new Map<number, ExtraSelectorItem[]>();
                    this.tiposDote = [{ Id: 0, Nombre: 'Sin tipo secundario' }];
                    this.tiposDoteCatalogoPrerrequisito = [];
                }
            });

        this.manualSvc.getManuales()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (manuales) => {
                    this.manuales = Array.isArray(manuales) ? [...manuales] : [];
                    this.sincronizarManualSeleccionado();
                },
                error: () => {
                    this.manuales = [];
                }
            });

        this.habilidadSvc.getHabilidades()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (habilidades) => {
                    this.habilidadesCatalogo = Array.isArray(habilidades) ? [...habilidades] : [];
                    this.actualizarCatalogoHabilidadesPrerrequisito(this.habilidadesCatalogo);
                    this.catalogosCargados.add('habilidades');
                },
                error: () => {
                    this.habilidadesCatalogo = [];
                    this.habilidadesCatalogoPrerrequisito = [];
                }
            });
    }

    ngOnDestroy(): void {
        this.actualizarBloqueoScrollModal();
        this.destroy$.next();
        this.destroy$.complete();
    }

    get mensajeErrorFormulario(): string {
        if (this.form.hasError('tipos_iguales'))
            return 'id_tipo e id_tipo2 no pueden ser iguales.';
        if (this.form.hasError('repeticion_exclusiva'))
            return 'Solo una modalidad de repetición puede estar activa.';
        if (this.form.hasError('extra_tipo_exclusivo'))
            return 'Solo un tipo de extra puede estar activo.';
        return '';
    }

    get permiteSeleccionarCompetencia(): boolean {
        return this.extraTipoSeleccionado === 'extra_arma' || this.extraTipoSeleccionado === 'extra_armadura';
    }

    get subtipoArmaduraActivo(): boolean {
        return this.form.controls.extra_armadura_armaduras.value === true;
    }

    get subtipoEscudoActivo(): boolean {
        return this.form.controls.extra_armadura_escudos.value === true;
    }

    get repeticionSeleccionada(): RepeticionKey | '' {
        const activo = (['repetible', 'repetible_distinto_extra', 'repetible_comb'] as RepeticionKey[])
            .find((key) => this.form.controls[key].value === true);
        return activo ?? '';
    }

    get modificadoresPreview(): Array<{ key: string; label: string; value: number; }> {
        const agregado = new Map<string, number>();
        this.modificadoresEditor.forEach((item) => {
            const key = `${item.key ?? ''}`.trim();
            if (key.length < 1)
                return;
            const valor = this.toInt(item.value, 0);
            if (valor === 0)
                return;
            agregado.set(key, (agregado.get(key) ?? 0) + valor);
        });

        return Array.from(agregado.entries()).map(([key, value]) => ({
            key,
            label: this.getEtiquetaModificador(key),
            value,
        }));
    }

    onToggleRepeticion(key: RepeticionKey, checked: boolean): void {
        if (!checked)
            return;
        (['repetible', 'repetible_distinto_extra', 'repetible_comb'] as RepeticionKey[])
            .filter((item) => item !== key)
            .forEach((item) => this.form.controls[item].setValue(false));
    }

    onRepeticionSeleccionada(value: any): void {
        const repeticion = this.esRepeticionKey(value) ? value : '';
        (['repetible', 'repetible_distinto_extra', 'repetible_comb'] as RepeticionKey[])
            .forEach((item) => this.form.controls[item].setValue(item === repeticion));
    }

    limpiarRepeticion(): void {
        (['repetible', 'repetible_distinto_extra', 'repetible_comb'] as RepeticionKey[])
            .forEach((item) => this.form.controls[item].setValue(false));
    }

    get extraTipoSeleccionado(): ExtraFamilyKey | '' {
        if (this.form.controls.extra_arma.value === true)
            return 'extra_arma';
        if (this.subtipoArmaduraActivo || this.subtipoEscudoActivo)
            return 'extra_armadura';
        if (this.form.controls.extra_escuela.value === true)
            return 'extra_escuela';
        if (this.form.controls.extra_habilidad.value === true)
            return 'extra_habilidad';
        return '';
    }

    get requiereSelectorExtras(): boolean {
        return this.extraTipoSeleccionado.length > 0;
    }

    get cantidadExtrasSeleccionadosActual(): number {
        const key = this.getExtrasPayloadKeyFromExtraTipo(this.extraTipoSeleccionado);
        if (!key)
            return 0;
        return this.extrasSeleccionados[key].length;
    }

    get totalOpcionesTipoExtraActual(): number {
        return this.getItemsSelectorExtrasPorTipo(this.extraTipoSeleccionado).length;
    }

    get textoAccionPrincipal(): string {
        if (this.guardando)
            return 'Creando...';
        if (!this.requiereSelectorExtras)
            return this.prerrequisitosPendientes ? 'Configurar prerrequisitos' : 'Crear dote';
        if (this.cantidadExtrasSeleccionadosActual < 1)
            return 'Elegir extras';
        if (this.prerrequisitosPendientes)
            return 'Configurar prerrequisitos';
        return 'Crear dote';
    }

    get itemsSelectorExtrasActual(): ExtraSelectorItem[] {
        return this.getItemsSelectorExtrasPorTipo(this.extraTipoSeleccionado);
    }

    get itemsSelectorExtrasFiltrados(): ExtraSelectorItem[] {
        const filtro = this.normalizar(this.selectorExtrasFiltro);
        return this.itemsSelectorExtrasActual.filter((item) => {
            if (filtro.length < 1)
                return true;
            return this.normalizar(item.nombre).includes(filtro);
        });
    }

    get etiquetaTipoExtraActual(): string {
        const tipo = this.extraTipoSeleccionado;
        if (!tipo)
            return 'extras';
        return this.getEtiquetaTipoExtra(tipo);
    }

    get selectorTodosActivos(): boolean {
        const total = this.itemsSelectorExtrasActual.length;
        return total > 0 && this.selectorExtrasTempIds.length === total;
    }

    get puedeConfirmarSelectorExtras(): boolean {
        return this.selectorExtrasTempIds.length > 0;
    }

    get hayPrerrequisitosMarcados(): boolean {
        return this.prerrequisitosSeleccionados.length > 0;
    }

    get prerrequisitosPendientes(): boolean {
        return arePrerequisitesIncomplete(this.prerrequisitosEditor, this.prerrequisitosSeleccionados);
    }

    get prerrequisitosSelectorFiltrados(): PrerrequisitoOption[] {
        const filtro = this.normalizar(this.selectorPrerrequisitosFiltro);
        return this.prerrequisitoOpciones.filter((item) => {
            if (filtro.length < 1)
                return true;
            return this.normalizar(item.label).includes(filtro);
        });
    }

    onExtraTipoSeleccionado(value: any): void {
        const extraTipo = this.esExtraFamilyKey(value) ? value : '';
        this.form.controls.extra_arma.setValue(extraTipo === 'extra_arma');
        this.form.controls.extra_escuela.setValue(extraTipo === 'extra_escuela');
        this.form.controls.extra_habilidad.setValue(extraTipo === 'extra_habilidad');
        if (extraTipo === 'extra_armadura') {
            const mantenerArmaduras = this.subtipoArmaduraActivo || !this.subtipoEscudoActivo;
            this.form.controls.extra_armadura_armaduras.setValue(mantenerArmaduras);
            this.form.controls.extra_armadura_escudos.setValue(this.subtipoEscudoActivo);
        } else {
            this.form.controls.extra_armadura_armaduras.setValue(false);
            this.form.controls.extra_armadura_escudos.setValue(false);
        }
        if (!this.permiteSeleccionarCompetencia)
            this.form.controls.comp_arma.setValue(false);
    }

    limpiarTipoExtra(): void {
        this.form.controls.extra_arma.setValue(false);
        this.form.controls.extra_armadura_armaduras.setValue(false);
        this.form.controls.extra_armadura_escudos.setValue(false);
        this.form.controls.extra_escuela.setValue(false);
        this.form.controls.extra_habilidad.setValue(false);
        this.form.controls.comp_arma.setValue(false);
    }

    onSubtipoArmaduraChange(kind: 'armaduras' | 'escudos', checked: boolean): void {
        if (kind === 'armaduras')
            this.form.controls.extra_armadura_armaduras.setValue(checked);
        else
            this.form.controls.extra_armadura_escudos.setValue(checked);

        if (!this.subtipoArmaduraActivo && !this.subtipoEscudoActivo) {
            this.form.controls.comp_arma.setValue(false);
            this.extrasSeleccionados.armaduras = [];
            if (this.extraTipoSeleccionado === 'extra_armadura')
                return;
        }

        if (this.extraTipoSeleccionado !== 'extra_armadura')
            return;

        this.extrasSeleccionados.armaduras = this.filtrarIdsArmaduraPorSubtipo(this.extrasSeleccionados.armaduras);
        this.selectorExtrasTempIds = this.filtrarIdsArmaduraPorSubtipo(this.selectorExtrasTempIds);
    }

    async onAccionPrincipal(): Promise<void> {
        if (this.guardando || !this.puedeCrear)
            return;

        if (this.requiereSelectorExtras && this.cantidadExtrasSeleccionadosActual < 1) {
            await this.abrirSelectorExtras();
            return;
        }

        if (this.prerrequisitosPendientes) {
            this.abrirSelectorPrerrequisitos();
            return;
        }

        await this.crearDote();
    }

    async abrirSelectorExtras(): Promise<void> {
        const tipo = this.extraTipoSeleccionado;
        if (!tipo) {
            await Swal.fire({
                icon: 'info',
                title: 'Selecciona un tipo de extra',
                text: 'Debes marcar primero el tipo de extra en la sección "Tipo de extra".',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        try {
            await this.asegurarCatalogoExtraTipo(tipo);
        } catch {
            await this.mostrarErrorCargaCatalogo('No se pudieron cargar los extras disponibles para este tipo.');
            return;
        }

        const items = this.getItemsSelectorExtrasPorTipo(tipo);
        if (items.length < 1) {
            await Swal.fire({
                icon: 'warning',
                title: 'Sin elementos disponibles',
                text: `No hay elementos cargados para ${this.getEtiquetaTipoExtra(tipo)}.`,
                confirmButtonText: 'Entendido'
            });
            return;
        }

        this.selectorExtrasTempIds = [...this.getIdsSeleccionadosPorTipo(tipo)];
        this.selectorExtrasFiltro = '';
        this.selectorExtrasVisible = true;
        this.actualizarBloqueoScrollModal();
    }

    cerrarSelectorExtras(): void {
        this.selectorExtrasVisible = false;
        this.selectorExtrasFiltro = '';
        this.selectorExtrasTempIds = [];
        this.actualizarBloqueoScrollModal();
    }

    confirmarSelectorExtras(): void {
        const tipo = this.extraTipoSeleccionado;
        if (!tipo)
            return;
        if (!this.puedeConfirmarSelectorExtras)
            return;
        this.asignarIdsSeleccionadosPorTipo(tipo, this.selectorExtrasTempIds);
        this.cerrarSelectorExtras();
    }

    isExtraTemporalSeleccionado(id: number): boolean {
        return this.selectorExtrasTempIds.includes(this.toInt(id, 0));
    }

    toggleExtraTemporal(id: number, checked: boolean): void {
        const idNum = this.toInt(id, 0);
        if (idNum < 1)
            return;
        if (checked) {
            this.selectorExtrasTempIds = this.uniqueSorted([...this.selectorExtrasTempIds, idNum]);
            return;
        }
        this.selectorExtrasTempIds = this.selectorExtrasTempIds.filter((current) => current !== idNum);
    }

    toggleTodosExtrasTemporales(checked: boolean): void {
        if (!checked) {
            this.selectorExtrasTempIds = [];
            return;
        }
        this.selectorExtrasTempIds = this.uniqueSorted(this.itemsSelectorExtrasActual.map((item) => item.id));
    }

    seleccionarTodosExtrasTemporales(): void {
        this.selectorExtrasTempIds = this.uniqueSorted(this.itemsSelectorExtrasActual.map((item) => item.id));
    }

    agregarModificador(): void {
        this.modificadoresEditor = [
            ...this.modificadoresEditor,
            { key: '', value: 0 }
        ];
    }

    eliminarModificador(index: number): void {
        if (index < 0 || index >= this.modificadoresEditor.length)
            return;
        this.modificadoresEditor = this.modificadoresEditor.filter((_, i) => i !== index);
        if (this.modificadoresEditor.length < 1)
            this.agregarModificador();
    }

    onModificadorChange(index: number, patch: Partial<ModificadorEditorItem>): void {
        if (index < 0 || index >= this.modificadoresEditor.length)
            return;
        this.modificadoresEditor = this.modificadoresEditor.map((row, i) => i === index ? { ...row, ...patch } : row);
    }

    getEtiquetaModificador(key: string): string {
        const item = this.modificadoresCatalogo.find((mod) => mod.key === key);
        return item?.label ?? 'Modificador';
    }

    abrirInfoRepeticion(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        Swal.fire({
            target: document.body,
            icon: 'info',
            title: 'Repetición de dotes',
            width: 620,
            html: `
                <p style="text-align:left; margin-bottom:10px;">
                    Por defecto, una dote se obtiene una sola vez.
                    Esta sección solo se usa cuando la dote rompe esa regla general.
                </p>
                <p style="text-align:left; margin-bottom:8px;"><strong>Opciones:</strong></p>
                <ul style="text-align:left; padding-left:18px; margin:0;">
                    <li><strong>Repetible sin restricciones</strong>: se puede elegir varias veces sin condiciones extra.</li>
                    <li><strong>Repetible con extra distinto</strong>: se puede repetir si cambia el extra elegido.</li>
                    <li><strong>Repetible por combinación</strong>: pensado para creación de clases; permite que la misma dote aparezca en distintos niveles de progresión cuando forma parte de elecciones opcionales.</li>
                </ul>
            `,
            confirmButtonText: 'Entendido',
        });
    }

    agregarHabilidadOtorgada(): void {
        this.habilidadesOtorgadasEditor = [
            ...this.habilidadesOtorgadasEditor,
            { id_habilidad: 0, id_extra: 0, rangos: 0 }
        ];
    }

    eliminarHabilidadOtorgada(index: number): void {
        if (index < 0 || index >= this.habilidadesOtorgadasEditor.length)
            return;
        this.habilidadesOtorgadasEditor = this.habilidadesOtorgadasEditor.filter((_, i) => i !== index);
        if (this.habilidadesOtorgadasEditor.length < 1)
            this.agregarHabilidadOtorgada();
    }

    onHabilidadOtorgadaChange(index: number, patch: Partial<HabilidadOtorgadaEditorItem>): void {
        if (index < 0 || index >= this.habilidadesOtorgadasEditor.length)
            return;

        const current = this.habilidadesOtorgadasEditor[index];
        const next: HabilidadOtorgadaEditorItem = {
            ...current,
            ...patch,
        };

        if (!this.habilidadPermiteExtra(next.id_habilidad))
            next.id_extra = 0;

        this.habilidadesOtorgadasEditor = this.habilidadesOtorgadasEditor.map((row, i) => i === index ? next : row);
    }

    habilidadPermiteExtra(idHabilidad: number): boolean {
        const habilidad = this.habilidadesCatalogo.find((item) => item.Id_habilidad === this.toInt(idHabilidad, 0));
        return !!habilidad?.Soporta_extra;
    }

    getExtrasDeHabilidad(idHabilidad: number): Array<{ Id_extra: number; Extra: string; }> {
        const habilidad = this.habilidadesCatalogo.find((item) => item.Id_habilidad === this.toInt(idHabilidad, 0));
        if (!habilidad?.Extras)
            return [];
        return habilidad.Extras;
    }

    abrirSelectorPrerrequisitos(): void {
        this.selectorPrerrequisitosTempKeys = [...this.prerrequisitosSeleccionados];
        this.selectorPrerrequisitosFiltro = '';
        this.selectorPrerrequisitosVisible = true;
        this.actualizarBloqueoScrollModal();
    }

    cerrarSelectorPrerrequisitos(): void {
        this.selectorPrerrequisitosVisible = false;
        this.selectorPrerrequisitosFiltro = '';
        this.selectorPrerrequisitosTempKeys = [];
        this.actualizarBloqueoScrollModal();
    }

    async confirmarSelectorPrerrequisitos(): Promise<void> {
        if (this.confirmandoSelectorPrerrequisitos)
            return;

        this.confirmandoSelectorPrerrequisitos = true;
        try {
            const tipos = [...this.selectorPrerrequisitosTempKeys];
            if (this.prerrequisitoEditorHost)
                await this.prerrequisitoEditorHost.prepareTypes(tipos);
            else {
                await this.asegurarCatalogosPrerrequisitos(tipos);
                this.prerrequisitosSeleccionados = tipos;
                this.prerrequisitosEditor = this.syncFilasPrerrequisitosLocal(tipos);
            }
            this.cerrarSelectorPrerrequisitos();
        } catch {
            await this.mostrarErrorCargaCatalogo('No se pudieron cargar todos los catálogos necesarios para los prerrequisitos elegidos.');
        } finally {
            this.confirmandoSelectorPrerrequisitos = false;
        }
    }

    isTipoPrerrequisitoTemporalSeleccionado(key: PrerequisiteType): boolean {
        return this.selectorPrerrequisitosTempKeys.includes(key);
    }

    toggleTipoPrerrequisitoTemporal(key: PrerequisiteType, checked: boolean): void {
        if (checked) {
            this.selectorPrerrequisitosTempKeys = [...new Set([...this.selectorPrerrequisitosTempKeys, key])];
            void this.precargarCatalogosPrerrequisitos([key]);
            return;
        }
        this.selectorPrerrequisitosTempKeys = this.selectorPrerrequisitosTempKeys.filter((item) => item !== key);
    }

    seleccionarTodosPrerrequisitosTemporales(): void {
        this.selectorPrerrequisitosTempKeys = this.prerrequisitoOpciones.map((item) => item.key);
    }

    limpiarPrerrequisitosTemporales(): void {
        this.selectorPrerrequisitosTempKeys = [];
    }

    onPrerrequisitosSeleccionadosChange(tipos: PrerequisiteType[]): void {
        this.prerrequisitosSeleccionados = [...tipos];
    }

    onPrerrequisitosRowsChange(rows: PrerrequisitoEditorItem[]): void {
        this.prerrequisitosEditor = [...rows];
        void this.precargarCatalogosDependientesDePrerrequisitos(rows);
    }

    getEtiquetaPrerrequisito(key: PrerequisiteType): string {
        return getPrerequisiteDefinition(key).label;
    }

    getCatalogoPrerrequisito(tipo: PrerequisiteType): ExtraSelectorItem[] {
        if (tipo === 'actitud_prohibido' || tipo === 'actitud_requerido')
            return this.actitudesCatalogo;
        if (tipo === 'alineamiento_prohibido' || tipo === 'alineamiento_requerido')
            return this.alineamientosCatalogo;
        if (tipo === 'caracteristica')
            return this.caracteristicasCatalogo;
        if (tipo === 'clase_especial' || tipo === 'inherente')
            return this.especialesCatalogo;
        if (tipo === 'competencia_arma')
            return this.armasCatalogo;
        if (tipo === 'competencia_armadura')
            return this.armadurasCatalogo;
        if (tipo === 'competencia_grupo_arma')
            return this.gruposArmasCatalogo;
        if (tipo === 'competencia_grupo_armadura')
            return this.gruposArmadurasCatalogo;
        if (tipo === 'conjuros_escuela' || tipo === 'escuela_nivel')
            return this.escuelasCatalogo;
        if (tipo === 'dominio')
            return this.dominiosCatalogo;
        if (tipo === 'dote')
            return this.dotesCatalogoPrerrequisito;
        if (tipo === 'habilidad')
            return this.habilidadesCatalogoPrerrequisito;
        if (tipo === 'idioma')
            return this.idiomasCatalogo;
        if (tipo === 'lanz_espontaneo')
            return this.conjurosCatalogo;
        if (tipo === 'limite_tipo_dote' || tipo === 'tipo_dote')
            return this.tiposDoteCatalogoPrerrequisito;
        if (tipo === 'nivel_de_clase')
            return this.clasesCatalogo;
        if (tipo === 'raza')
            return this.razasCatalogo;
        if (tipo === 'region')
            return this.regionesCatalogo;
        if (tipo === 'tamano_maximo' || tipo === 'tamano_minimo')
            return this.tamanosCatalogo;
        if (tipo === 'tipo_criatura')
            return this.tiposCriaturaCatalogo;
        return [];
    }

    getOpcionesExtraDote(idDote: number): ExtraSelectorItem[] {
        const id = this.toInt(idDote, 0);
        if (id < 1)
            return [];

        const cache = this.opcionesExtraDotePorId.get(id);
        if (cache)
            return cache;

        const dote = this.dotesExistentes.find((item) => this.toInt(item?.Id, 0) === id);
        if (!dote)
            return [];

        const opciones = this.resolverOpcionesExtraDote(dote);
        this.opcionesExtraDotePorId.set(id, opciones);
        return opciones;
    }

    habilidadCatalogoPermiteExtra(idHabilidad: number): boolean {
        const habilidad = this.habilidadesCatalogo.find((item) => this.toInt(item?.Id_habilidad, 0) === this.toInt(idHabilidad, 0));
        return !!habilidad?.Soporta_extra;
    }

    especialCatalogoPermiteExtra(idEspecial: number): boolean {
        const especial = this.especialesDetalleCatalogo.find((item) => this.toInt(item?.Id, 0) === this.toInt(idEspecial, 0));
        return !!(especial?.Extra || especial?.Activa_extra);
    }

    doteCatalogoPermiteExtra(idDote: number): boolean {
        const dote = this.dotesExistentes.find((item) => this.toInt(item?.Id, 0) === this.toInt(idDote, 0));
        return !!dote && this.doteTieneAlgunExtra(dote);
    }

    private getClaveCatalogoExtraDote(idDote: number): PrerequisiteCatalogKey | null {
        const dote = this.dotesExistentes.find((item) => this.toInt(item?.Id, 0) === this.toInt(idDote, 0));
        if (!dote)
            return null;
        if (this.toInt(dote?.Extras_soportados?.Extra_arma, 0) > 0)
            return 'armas';
        if (this.doteSoportaArmaduras(dote) || this.doteSoportaEscudos(dote))
            return 'armaduras';
        if (this.toInt(dote?.Extras_soportados?.Extra_escuela, 0) > 0)
            return 'escuelas';
        if (this.toInt(dote?.Extras_soportados?.Extra_habilidad, 0) > 0)
            return 'habilidades';
        return null;
    }

    private async precargarCatalogosDependientesDePrerrequisitos(rows: PrerrequisitoEditorItem[]): Promise<void> {
        const claves = new Set<PrerequisiteCatalogKey>();

        rows.forEach((row) => {
            if (row.tipo !== 'dote')
                return;
            const clave = this.getClaveCatalogoExtraDote(row.id);
            if (clave)
                claves.add(clave);
        });

        if (claves.size < 1)
            return;

        try {
            await Promise.all(Array.from(claves).map((clave) => this.asegurarCatalogo(clave)));
        } catch {
            // Best-effort: si falla la precarga, el selector permanecera vacio hasta el siguiente intento.
        }
    }

    toggleOficial(): void {
        const actual = this.form.controls.oficial.value === true;
        this.form.controls.oficial.setValue(!actual);
    }

    get oficialActivo(): boolean {
        return this.form.controls.oficial.value === true;
    }

    get tiposPrimarios(): Array<{ Id: number; Nombre: string; }> {
        return this.tiposDote.filter((tipo) => tipo.Id > 0);
    }

    async crearDote(): Promise<void> {
        if (!this.puedeCrear) {
            Swal.fire({
                icon: 'warning',
                title: 'Permisos insuficientes',
                text: 'Tu usuario no tiene permiso dotes.create.',
                showConfirmButton: true
            });
            return;
        }

        this.form.markAllAsTouched();
        const errorDominio = this.validarReglasDominio();
        if (this.form.invalid || errorDominio.length > 0) {
            const text = errorDominio.length > 0 ? errorDominio : this.mensajeErrorFormulario || 'Revisa los campos obligatorios.';
            Swal.fire({
                icon: 'warning',
                title: 'Formulario inválido',
                text,
                showConfirmButton: true
            });
            return;
        }

        const payload = this.buildPayload();
        this.guardando = true;
        try {
            const response = await this.doteSvc.crearDote(payload);
            this.notificarExito(response, payload.dote.nombre);
            this.resetFormulario();
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'No se pudo crear la dote',
                text: `${error?.message ?? 'Error no identificado'}`,
                showConfirmButton: true
            });
        } finally {
            console.log('[NuevaDote] Payload enviado a /dotes/add:', payload);
            this.guardando = false;
        }
    }

    private buildPayload(): DoteCreateRequest {
        const raw = this.form.getRawValue();
        const extrasDisponibles = this.construirExtrasDisponiblesPayload();

        return {
            dote: {
                nombre: `${raw.nombre ?? ''}`.trim(),
                beneficio: `${raw.beneficio ?? ''}`.trim(),
                descripcion: `${raw.descripcion ?? ''}`.trim(),
                normal: `${raw.normal ?? ''}`.trim(),
                especial: `${raw.especial ?? ''}`.trim(),
                id_manual: this.toInt(raw.id_manual, 0),
                pagina: this.toInt(raw.pagina, 0),
                id_tipo: this.toInt(raw.id_tipo, 0),
                id_tipo2: this.toInt(raw.id_tipo2, 0),
                oficial: !!raw.oficial,
                repetible: !!raw.repetible,
                repetible_distinto_extra: !!raw.repetible_distinto_extra,
                repetible_comb: !!raw.repetible_comb,
                comp_arma: !!raw.comp_arma,
                extra_arma: !!raw.extra_arma,
                extra_armadura_armaduras: !!raw.extra_armadura_armaduras,
                extra_armadura_escudos: !!raw.extra_armadura_escudos,
                extra_escuela: !!raw.extra_escuela,
                extra_habilidad: !!raw.extra_habilidad,
            },
            modificadores: this.construirModificadoresPayload(),
            habilidades_otorgadas: this.construirHabilidadesOtorgadasPayload(),
            extras_disponibles: extrasDisponibles,
            prerrequisitos: this.construirPrerrequisitosPayload(),
        };
    }

    private notificarExito(response: DoteCreateResponse, nombre: string): void {
        Swal.fire({
            icon: 'success',
            title: 'Dote creada',
            text: `${response?.message ?? 'Creación completada'} (id: ${response.idDote})`,
            timer: 2200,
            showConfirmButton: true
        });
        this.doteCreada.emit({
            idDote: response.idDote,
            nombre,
        });
    }

    private resetFormulario(): void {
        this.form.reset({
            nombre: '',
            beneficio: '',
            descripcion: '',
            normal: 'No especifica',
            especial: 'No especifica',
            id_manual: 0,
            pagina: 1,
            id_tipo: 1,
            id_tipo2: 0,
            oficial: true,
            comp_arma: false,
            repetible: false,
            repetible_distinto_extra: false,
            repetible_comb: false,
            extra_arma: false,
            extra_armadura_armaduras: false,
            extra_armadura_escudos: false,
            extra_escuela: false,
            extra_habilidad: false,
        });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.modificadoresEditor = [];
        this.agregarModificador();
        this.habilidadesOtorgadasEditor = [];
        this.agregarHabilidadOtorgada();
        this.prerrequisitosEditor = [];
        this.prerrequisitosSeleccionados = [];
        this.extrasSeleccionados = {
            armas: [],
            armaduras: [],
            escuelas: [],
            habilidades: [],
        };
        this.selectorExtrasVisible = false;
        this.selectorExtrasFiltro = '';
        this.selectorExtrasTempIds = [];
        this.selectorPrerrequisitosVisible = false;
        this.selectorPrerrequisitosFiltro = '';
        this.selectorPrerrequisitosTempKeys = [];
        this.sincronizarManualSeleccionado();
        this.actualizarBloqueoScrollModal();
    }

    private recalcularPermisos(): void {
        this.puedeCrear = this.userSvc.can('dotes', 'create');
    }

    private actualizarTiposDoteDesdeCatalogo(dotes: Dote[]): void {
        const mapa = new Map<number, string>();
        dotes.forEach((dote) => {
            (dote?.Tipos ?? []).forEach((tipo) => {
                const id = this.toInt(tipo?.Id, -1);
                const nombre = `${tipo?.Nombre ?? ''}`.trim();
                if (id >= 0 && nombre.length > 0 && !mapa.has(id))
                    mapa.set(id, nombre);
            });
        });

        const tipos = Array.from(mapa.entries())
            .map(([Id, Nombre]) => ({ Id, Nombre }))
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));

        if (!tipos.some((tipo) => tipo.Id === 0))
            tipos.unshift({ Id: 0, Nombre: 'Sin tipo secundario' });

        this.tiposDote = tipos;
        this.tiposDoteCatalogoPrerrequisito = tipos
            .filter((item) => item.Id > 0)
            .map((item) => ({ id: item.Id, nombre: item.Nombre }));

        const idTipoActual = this.toInt(this.form.controls.id_tipo.value, -1);
        if (!this.tiposPrimarios.some((tipo) => tipo.Id === idTipoActual) && this.tiposPrimarios.length > 0)
            this.form.controls.id_tipo.setValue(this.tiposPrimarios[0].Id);

        const idTipo2Actual = this.toInt(this.form.controls.id_tipo2.value, -1);
        if (!this.tiposDote.some((tipo) => tipo.Id === idTipo2Actual))
            this.form.controls.id_tipo2.setValue(0);
    }

    private sincronizarManualSeleccionado(): void {
        if (this.manuales.length < 1)
            return;

        const idActual = this.toInt(this.form.controls.id_manual.value, -1);
        if (!this.manuales.some((manual) => this.toInt(manual?.Id, -1) === idActual))
            this.form.controls.id_manual.setValue(this.getManualPorDefectoId());
    }

    private getManualPorDefectoId(): number {
        const manualPreferido = this.manuales.find((manual) =>
            this.normalizar(`${manual?.Nombre ?? ''}`) === this.normalizar(NuevaDoteComponent.preferredManualName)
        );
        if (manualPreferido)
            return this.toInt(manualPreferido.Id, 0);
        return this.toInt(this.manuales[0]?.Id, 0);
    }

    private validarReglasDominio(): string {
        const nombre = `${this.form.controls.nombre.value ?? ''}`.trim();
        if (this.esNombreDuplicado(nombre))
            return 'Ya existe una dote con ese nombre (comparación normalizada).';

        const extras = this.construirExtrasDisponiblesPayload();
        const flagArmas = this.form.controls.extra_arma.value === true;
        const flagArmaduras = this.subtipoArmaduraActivo || this.subtipoEscudoActivo;
        const flagEscuelas = this.form.controls.extra_escuela.value === true;
        const flagHabilidades = this.form.controls.extra_habilidad.value === true;
        const compArma = this.form.controls.comp_arma.value === true;

        if (compArma && !this.permiteSeleccionarCompetencia)
            return 'Requiere competencia solo aplica cuando el tipo de extra es arma o armadura.';

        if (!flagArmas && extras.armas.length > 0)
            return 'extras_disponibles.armas tiene datos pero extra_arma está desactivado.';
        if (!flagArmaduras && extras.armaduras.length > 0)
            return 'extras_disponibles.armaduras tiene datos pero extra_armadura está desactivado.';
        if (flagArmaduras && extras.armaduras.some((id) => !this.armaduraSeleccionablePorSubtipo(id)))
            return 'Hay armaduras o escudos seleccionados que no coinciden con los subtipos activos.';
        if (!flagEscuelas && extras.escuelas.length > 0)
            return 'extras_disponibles.escuelas tiene datos pero extra_escuela está desactivado.';
        if (!flagHabilidades && extras.habilidades.length > 0)
            return 'extras_disponibles.habilidades tiene datos pero extra_habilidad está desactivado.';
        if (this.requiereSelectorExtras && this.cantidadExtrasSeleccionadosActual < 1)
            return 'La dote usa extras, pero no has seleccionado ningún elemento disponible.';
        if (this.hayPrerrequisitosMarcados && this.prerrequisitosPendientes)
            return 'Hay prerrequisitos marcados sin configurar. Revisa la sección de prerrequisitos.';

        return '';
    }

    private actualizarCatalogoDotesPrerrequisito(dotes: Dote[]): void {
        this.dotesCatalogoPrerrequisito = (Array.isArray(dotes) ? dotes : [])
            .map((dote) => ({ id: this.toInt(dote?.Id, 0), nombre: `${dote?.Nombre ?? ''}`.trim() }))
            .filter((item) => item.id > 0 && item.nombre.length > 0)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private actualizarCatalogoHabilidadesPrerrequisito(habilidades: HabilidadBasicaDetalle[]): void {
        this.habilidadesCatalogoPrerrequisito = (Array.isArray(habilidades) ? habilidades : [])
            .map((item) => ({ id: this.toInt(item?.Id_habilidad, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
            .filter((item) => item.id > 0 && item.nombre.length > 0)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private actualizarCatalogoEspecialesPrerrequisito(especiales: EspecialClaseDetalle[]): void {
        this.especialesDetalleCatalogo = Array.isArray(especiales) ? [...especiales] : [];
        this.especialesCatalogo = this.especialesDetalleCatalogo
            .map((item) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
            .filter((item) => item.id > 0 && item.nombre.length > 0)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private actualizarCatalogoExtrasPrerrequisito(extras: Array<{ Id: number; Nombre: string; }>): void {
        this.extrasCatalogo = (Array.isArray(extras) ? extras : [])
            .map((item) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
            .filter((item) => item.id > 0 && item.nombre.length > 0)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private actualizarOpcionesExtraDote(dotes: Dote[]): void {
        const mapa = new Map<number, ExtraSelectorItem[]>();

        (Array.isArray(dotes) ? dotes : []).forEach((dote) => {
            const idDote = this.toInt(dote?.Id, 0);
            if (idDote < 1)
                return;

            mapa.set(idDote, this.resolverOpcionesExtraDote(dote));
        });

        this.opcionesExtraDotePorId = mapa;
    }

    private async asegurarCatalogoExtraTipo(tipo: ExtraFamilyKey): Promise<void> {
        if (tipo === 'extra_arma')
            return this.asegurarCatalogo('armas');
        if (tipo === 'extra_armadura')
            return this.asegurarCatalogo('armaduras');
        if (tipo === 'extra_escuela')
            return this.asegurarCatalogo('escuelas');
    }

    private async asegurarCatalogosPrerrequisitos(tipos: PrerequisiteType[]): Promise<void> {
        const claves = getPrerequisiteCatalogsForTypes(tipos);
        await Promise.all(claves.map((clave) => this.asegurarCatalogo(clave)));
    }

    private async precargarCatalogosPrerrequisitos(tipos: PrerequisiteType[]): Promise<void> {
        try {
            await this.asegurarCatalogosPrerrequisitos(tipos);
        } catch {
            // Best-effort: si falla la precarga, se reintenta al confirmar.
        }
    }

    private async asegurarCatalogo(clave: PrerequisiteCatalogKey): Promise<void> {
        if (this.catalogosCargados.has(clave))
            return;

        const pendiente = this.catalogosPendientes.get(clave);
        if (pendiente)
            return pendiente;

        const carga = this.cargarCatalogo(clave)
            .then(() => {
                this.catalogosCargados.add(clave);
                this.catalogosPendientes.delete(clave);
                this.cargandoCatalogos.delete(clave);
            })
            .catch((error) => {
                this.catalogosPendientes.delete(clave);
                this.cargandoCatalogos.delete(clave);
                throw error;
            });

        this.cargandoCatalogos.add(clave);
        this.catalogosPendientes.set(clave, carga);
        return carga;
    }

    private async cargarCatalogo(clave: PrerequisiteCatalogKey): Promise<void> {
        if (clave === 'alineamientos') {
            const alineamientos = await firstValueFrom(this.alineamientoSvc.getAlineamientosBasicosCatalogo());
            this.alineamientosCatalogo = (Array.isArray(alineamientos) ? alineamientos : [])
                .map((item: any) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'armaduras') {
            const armaduras = await firstValueFrom(this.armaduraSvc.getArmaduras());
            this.armadurasCatalogo = (Array.isArray(armaduras) ? armaduras : [])
                .map((armadura) => ({
                    id: this.toInt(armadura?.Id, 0),
                    nombre: `${armadura?.Nombre ?? ''}`.trim(),
                    esEscudo: !!armadura?.Es_escudo,
                }))
                .filter((armadura) => armadura.id > 0 && armadura.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            this.actualizarOpcionesExtraDote(this.dotesExistentes);
            return;
        }

        if (clave === 'armas') {
            const armas = await firstValueFrom(this.armaSvc.getArmas());
            this.armasCatalogo = (Array.isArray(armas) ? armas : [])
                .map((arma) => ({ id: this.toInt(arma?.Id, 0), nombre: `${arma?.Nombre ?? ''}`.trim() }))
                .filter((arma) => arma.id > 0 && arma.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            this.actualizarOpcionesExtraDote(this.dotesExistentes);
            return;
        }

        if (clave === 'clases') {
            const clases = await firstValueFrom(this.claseSvc.getClases());
            this.clasesCatalogo = (Array.isArray(clases) ? clases : [])
                .map((item) => ({ id: this.toInt((item as any)?.Id, 0), nombre: `${(item as any)?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'conjuros') {
            const conjuros = await firstValueFrom(this.conjuroSvc.getConjuros());
            this.conjurosCatalogo = (Array.isArray(conjuros) ? conjuros : [])
                .map((item) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'dotes') {
            const dotes = await firstValueFrom(this.doteSvc.getDotes());
            this.dotesExistentes = Array.isArray(dotes) ? dotes : [];
            this.actualizarCatalogoDotesPrerrequisito(this.dotesExistentes);
            this.actualizarOpcionesExtraDote(this.dotesExistentes);
            this.actualizarTiposDoteDesdeCatalogo(this.dotesExistentes);
            return;
        }

        if (clave === 'dominios') {
            const dominios = await firstValueFrom(this.dominioSvc.getDominios());
            this.dominiosCatalogo = (Array.isArray(dominios) ? dominios : [])
                .map((item) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'escuelas') {
            const escuelas = await firstValueFrom(this.escuelaSvc.getEscuelas());
            this.escuelasCatalogo = (Array.isArray(escuelas) ? escuelas : [])
                .map((escuela) => ({ id: this.toInt(escuela?.Id, 0), nombre: `${escuela?.Nombre ?? ''}`.trim() }))
                .filter((escuela) => escuela.id > 0 && escuela.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            this.actualizarOpcionesExtraDote(this.dotesExistentes);
            return;
        }

        if (clave === 'especiales') {
            const especiales = await firstValueFrom(this.especialSvc.getEspeciales());
            this.actualizarCatalogoEspecialesPrerrequisito(Array.isArray(especiales) ? especiales : []);
            return;
        }

        if (clave === 'extras') {
            const extras = await firstValueFrom(this.extraSvc.getExtras());
            this.actualizarCatalogoExtrasPrerrequisito(Array.isArray(extras) ? extras : []);
            return;
        }

        if (clave === 'grupos_arma') {
            const grupos = await firstValueFrom(this.grupoArmaSvc.getGruposArmas());
            this.gruposArmasCatalogo = (Array.isArray(grupos) ? grupos : [])
                .map((item) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'grupos_armadura') {
            const grupos = await firstValueFrom(this.grupoArmaduraSvc.getGruposArmaduras());
            this.gruposArmadurasCatalogo = (Array.isArray(grupos) ? grupos : [])
                .map((item) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'habilidades') {
            const habilidades = await firstValueFrom(this.habilidadSvc.getHabilidades());
            this.habilidadesCatalogo = Array.isArray(habilidades) ? [...habilidades] : [];
            this.actualizarCatalogoHabilidadesPrerrequisito(this.habilidadesCatalogo);
            return;
        }

        if (clave === 'idiomas') {
            const idiomas = await firstValueFrom(this.idiomaSvc.getIdiomas());
            this.idiomasCatalogo = (Array.isArray(idiomas) ? idiomas : [])
                .map((item) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'razas') {
            const razas = await firstValueFrom(this.razaSvc.getRazas());
            const lista = (Array.isArray(razas) ? razas : [])
                .map((item) => ({ id: this.toInt((item as any)?.Id, 0), nombre: `${(item as any)?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            this.razasCatalogo = lista;
            return;
        }

        if (clave === 'tamanos') {
            const tamanos = await firstValueFrom(this.tamanoSvc.getTamanos());
            this.tamanosCatalogo = (Array.isArray(tamanos) ? tamanos : [])
                .map((tamano) => ({ id: this.toInt(tamano?.Id, 0), nombre: `${tamano?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'regiones') {
            const regiones = await firstValueFrom(this.regionSvc.getRegiones());
            this.regionesCatalogo = (Array.isArray(regiones) ? regiones : [])
                .map((item) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'tipos_criatura') {
            const tipos = await firstValueFrom(this.tipoCriaturaSvc.getTiposCriatura());
            this.tiposCriaturaCatalogo = (Array.isArray(tipos) ? tipos : [])
                .map((item) => ({ id: this.toInt(item?.Id, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            return;
        }

        if (clave === 'tipos_dote') {
            await this.asegurarCatalogo('dotes');
        }
    }

    private async mostrarErrorCargaCatalogo(texto: string): Promise<void> {
        await Swal.fire({
            icon: 'warning',
            title: 'Error al cargar datos',
            text: texto,
            confirmButtonText: 'Entendido',
        });
    }

    private construirModificadoresPayload(): Record<string, number> {
        const out: Record<string, number> = {};
        this.modificadoresEditor.forEach((item) => {
            if (`${item.key ?? ''}`.trim().length < 1)
                return;
            const valor = this.toInt(item.value, 0);
            if (valor !== 0)
                out[item.key] = (out[item.key] ?? 0) + valor;
        });
        return out;
    }

    private construirHabilidadesOtorgadasPayload(): Array<Record<string, any>> {
        return this.habilidadesOtorgadasEditor
            .map((item) => ({
                id_habilidad: this.toInt(item.id_habilidad, 0),
                id_extra: this.toInt(item.id_extra, 0),
                rangos: this.toInt(item.rangos, 0),
            }))
            .filter((item) => item.id_habilidad > 0)
            .map((item) => item.id_extra > 0 ? item : { ...item, id_extra: 0 });
    }

    private construirPrerrequisitosPayload(): Record<string, Array<Record<string, any>>> {
        return buildPrerequisitePayload(this.prerrequisitosEditor, this.prerrequisitosCatalogContext);
    }

    private getNombreCatalogo(tipo: PrerequisiteType, id: number): string {
        return findCatalogName(tipo, id, this.getCatalogoPrerrequisito(tipo));
    }

    private syncFilasPrerrequisitosLocal(tipos: PrerequisiteType[]): PrerrequisitoEditorItem[] {
        const prevRows = [...this.prerrequisitosEditor];
        const selected = new Set(tipos);
        let next = prevRows.filter((row) => selected.has(row.tipo));
        tipos.forEach((tipo) => {
            if (!next.some((row) => row.tipo === tipo))
                next = [...next, getPrerequisiteDefinition(tipo).createDefaultRow()];
        });
        return next;
    }

    private construirExtrasDisponiblesPayload(): { armas: number[]; armaduras: number[]; escuelas: number[]; habilidades: number[]; } {
        const extraTipo = this.extraTipoSeleccionado;
        const keyActiva = this.getExtrasPayloadKeyFromExtraTipo(extraTipo);
        const base = {
            armas: [] as number[],
            armaduras: [] as number[],
            escuelas: [] as number[],
            habilidades: [] as number[],
        };

        if (!keyActiva)
            return base;

        const seleccionados = this.uniqueSorted(this.extrasSeleccionados[keyActiva]);
        base[keyActiva] = keyActiva === 'armaduras'
            ? this.filtrarIdsArmaduraPorSubtipo(seleccionados)
            : seleccionados;

        return base;
    }

    private getEtiquetaTipoExtra(tipo: ExtraFamilyKey): string {
        if (tipo === 'extra_arma')
            return 'armas';
        if (tipo === 'extra_armadura')
            return 'armaduras';
        if (tipo === 'extra_escuela')
            return 'escuelas';
        return 'habilidades';
    }

    private getItemsSelectorExtrasPorTipo(tipo: ExtraFamilyKey | ''): ExtraSelectorItem[] {
        if (tipo === 'extra_arma')
            return this.armasCatalogo;
        if (tipo === 'extra_armadura')
            return this.armadurasCatalogo.filter((item) => this.armaduraCoincideConSubtiposActivos(item));
        if (tipo === 'extra_escuela')
            return this.escuelasCatalogo;
        if (tipo === 'extra_habilidad')
            return this.habilidadesCatalogo
                .map((item) => ({ id: this.toInt(item?.Id_habilidad, 0), nombre: `${item?.Nombre ?? ''}`.trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
        return [];
    }

    private getExtrasPayloadKeyFromExtraTipo(tipo: ExtraFamilyKey | ''): 'armas' | 'armaduras' | 'escuelas' | 'habilidades' | '' {
        if (tipo === 'extra_arma')
            return 'armas';
        if (tipo === 'extra_armadura')
            return 'armaduras';
        if (tipo === 'extra_escuela')
            return 'escuelas';
        if (tipo === 'extra_habilidad')
            return 'habilidades';
        return '';
    }

    private getIdsSeleccionadosPorTipo(tipo: ExtraFamilyKey | ''): number[] {
        const key = this.getExtrasPayloadKeyFromExtraTipo(tipo);
        if (!key)
            return [];
        return key === 'armaduras'
            ? this.filtrarIdsArmaduraPorSubtipo(this.extrasSeleccionados[key])
            : this.extrasSeleccionados[key];
    }

    private asignarIdsSeleccionadosPorTipo(tipo: ExtraFamilyKey | '', ids: number[]): void {
        const key = this.getExtrasPayloadKeyFromExtraTipo(tipo);
        if (!key)
            return;
        this.extrasSeleccionados[key] = key === 'armaduras'
            ? this.filtrarIdsArmaduraPorSubtipo(ids)
            : this.uniqueSorted(ids);
    }

    private uniqueItemsById(items: ExtraSelectorItem[]): ExtraSelectorItem[] {
        const map = new Map<number, string>();
        (items ?? []).forEach((item) => {
            const id = this.toInt(item?.id, 0);
            const nombre = `${item?.nombre ?? ''}`.trim();
            if (id > 0 && nombre.length > 0 && !map.has(id))
                map.set(id, nombre);
        });
        return Array.from(map.entries())
            .map(([id, nombre]) => ({ id, nombre }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private uniqueSorted(ids: number[]): number[] {
        return Array.from(new Set((ids ?? []).map((id) => this.toInt(id, 0)).filter((id) => id > 0))).sort((a, b) => a - b);
    }

    private armaduraCoincideConSubtiposActivos(item: ArmaduraSelectorItem | null | undefined): boolean {
        if (!item)
            return false;
        if (this.subtipoArmaduraActivo && this.subtipoEscudoActivo)
            return true;
        if (this.subtipoEscudoActivo)
            return item.esEscudo === true;
        if (this.subtipoArmaduraActivo)
            return item.esEscudo !== true;
        return false;
    }

    private armaduraSeleccionablePorSubtipo(id: number): boolean {
        const objetivo = this.toInt(id, 0);
        if (objetivo < 1)
            return false;
        const armadura = this.armadurasCatalogo.find((item) => item.id === objetivo);
        if (!armadura)
            return false;
        return this.armaduraCoincideConSubtiposActivos(armadura);
    }

    private filtrarIdsArmaduraPorSubtipo(ids: number[]): number[] {
        return this.uniqueSorted(ids).filter((id) => this.armaduraSeleccionablePorSubtipo(id));
    }

    private doteSoportaArmaduras(dote: Dote | null | undefined): boolean {
        return this.toInt(dote?.Extras_soportados?.Extra_armadura_armaduras, this.toInt(dote?.Extras_soportados?.Extra_armadura, 0)) > 0;
    }

    private doteSoportaEscudos(dote: Dote | null | undefined): boolean {
        return this.toInt(dote?.Extras_soportados?.Extra_armadura_escudos, this.toInt(dote?.Extras_soportados?.Extra_armadura, 0)) > 0;
    }

    private doteTieneAlgunExtra(dote: Dote | null | undefined): boolean {
        return this.toInt(dote?.Extras_soportados?.Extra_arma, 0) > 0
            || this.doteSoportaArmaduras(dote)
            || this.doteSoportaEscudos(dote)
            || this.toInt(dote?.Extras_soportados?.Extra_escuela, 0) > 0
            || this.toInt(dote?.Extras_soportados?.Extra_habilidad, 0) > 0;
    }

    private getOpcionesArmaduraParaDote(dote: Dote): ExtraSelectorItem[] {
        const directos = (dote?.Extras_disponibles?.Armaduras ?? [])
            .map((item) => ({
                id: this.toInt(item?.Id, 0),
                nombre: `${item?.Nombre ?? ''}`.trim(),
                esEscudo: !!item?.Es_escudo,
            }))
            .filter((item) => item.id > 0 && item.nombre.length > 0);

        const base = directos.length > 0
            ? directos
            : this.armadurasCatalogo;

        return base.filter((item) => this.filtraArmaduraPorSoporteDote(dote, item));
    }

    private resolverOpcionesExtraDote(dote: Dote): ExtraSelectorItem[] {
        const directosArmas = this.uniqueItemsById(
            (dote?.Extras_disponibles?.Armas ?? [])
                .map((item) => ({ id: this.toInt((item as any)?.Id, 0), nombre: `${(item as any)?.Nombre ?? ''}`.trim() }))
        );
        const directosEscuelas = this.uniqueItemsById(
            (dote?.Extras_disponibles?.Escuelas ?? [])
                .map((item) => ({ id: this.toInt((item as any)?.Id, 0), nombre: `${(item as any)?.Nombre ?? ''}`.trim() }))
        );
        const directosHabilidades = this.uniqueItemsById(
            (dote?.Extras_disponibles?.Habilidades ?? [])
                .map((item) => ({ id: this.toInt((item as any)?.Id, 0), nombre: `${(item as any)?.Nombre ?? ''}`.trim() }))
        );

        if (this.toInt(dote?.Extras_soportados?.Extra_arma, 0) > 0)
            return directosArmas.length > 0 && !this.contieneOpcionElegir(directosArmas) ? directosArmas : this.armasCatalogo;

        if (this.doteSoportaArmaduras(dote) || this.doteSoportaEscudos(dote)) {
            const directosArmadura = this.getOpcionesArmaduraParaDote(dote);
            if (directosArmadura.length > 0 && !this.contieneOpcionElegir(directosArmadura))
                return directosArmadura;
            return this.armadurasCatalogo.filter((item) => this.filtraArmaduraPorSoporteDote(dote, item));
        }

        if (this.toInt(dote?.Extras_soportados?.Extra_escuela, 0) > 0)
            return directosEscuelas.length > 0 && !this.contieneOpcionElegir(directosEscuelas) ? directosEscuelas : this.escuelasCatalogo;

        if (this.toInt(dote?.Extras_soportados?.Extra_habilidad, 0) > 0)
            return directosHabilidades.length > 0 && !this.contieneOpcionElegir(directosHabilidades) ? directosHabilidades : this.habilidadesCatalogoPrerrequisito;

        return [];
    }

    private contieneOpcionElegir(items: ExtraSelectorItem[]): boolean {
        return (items ?? []).some((item) => this.normalizar(item?.nombre ?? '') === this.normalizar('Elegir'));
    }

    private filtraArmaduraPorSoporteDote(dote: Dote, item: ArmaduraSelectorItem): boolean {
        if (this.doteSoportaArmaduras(dote) && this.doteSoportaEscudos(dote))
            return true;
        if (this.doteSoportaEscudos(dote))
            return item.esEscudo === true;
        if (this.doteSoportaArmaduras(dote))
            return item.esEscudo !== true;
        return false;
    }

    private esNombreDuplicado(nombre: string): boolean {
        const objetivo = this.normalizar(nombre);
        if (objetivo.length < 1)
            return false;
        return this.dotesExistentes.some((dote) => this.normalizar(dote?.Nombre ?? '') === objetivo);
    }

    private toInt(value: any, fallback: number): number {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private normalizar(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private esExtraFamilyKey(value: any): value is ExtraFamilyKey {
        return this.extraFamilyKeys.includes(value as ExtraFamilyKey);
    }

    private esRepeticionKey(value: any): value is RepeticionKey {
        return (['repetible', 'repetible_distinto_extra', 'repetible_comb'] as RepeticionKey[]).includes(value as RepeticionKey);
    }

    private extraFamilyExclusiveValidator(): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const activos = [
                group.get('extra_arma')?.value === true,
                group.get('extra_armadura_armaduras')?.value === true || group.get('extra_armadura_escudos')?.value === true,
                group.get('extra_escuela')?.value === true,
                group.get('extra_habilidad')?.value === true,
            ].filter(Boolean).length;
            return activos > 1 ? { extra_tipo_exclusivo: true } : null;
        };
    }

    private tiposDistintosValidator(): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const idTipo = this.toInt(group.get('id_tipo')?.value, -1);
            const idTipo2 = this.toInt(group.get('id_tipo2')?.value, -2);
            if (idTipo >= 0 && idTipo2 >= 0 && idTipo === idTipo2)
                return { tipos_iguales: true };
            return null;
        };
    }

    private exclusiveTrueValidator<T extends string>(keys: T[], errorKey: string): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const activos = keys.filter((key) => group.get(key)?.value === true).length;
            if (activos > 1)
                return { [errorKey]: true };
            return null;
        };
    }

    private actualizarBloqueoScrollModal(): void {
        if (typeof document === 'undefined' || !document.body?.classList)
            return;

        const hayModalAbierto = this.selectorExtrasVisible || this.selectorPrerrequisitosVisible;
        document.body.classList.toggle(NuevaDoteComponent.bodyModalClass, hayModalAbierto);
    }
}
