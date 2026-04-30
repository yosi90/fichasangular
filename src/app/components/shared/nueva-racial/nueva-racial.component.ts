import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, firstValueFrom, take, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Dote } from 'src/app/interfaces/dote';
import { HabilidadBasicaDetalle, HabilidadExtraRef } from 'src/app/interfaces/habilidad';
import { RacialDetalle } from 'src/app/interfaces/racial';
import {
    RacialCreateAtaque,
    RacialCreateCaracteristica,
    RacialCreateDote,
    RacialCreateHabilidadBase,
    RacialCreateHabilidadCustom,
    RacialCreatePrerequisitos,
    RacialCreateRequest,
    RacialCreateSalvacion,
    RacialCreateSortilega,
    RacialUpdateRequest,
} from 'src/app/interfaces/raciales-api';
import { Raza } from 'src/app/interfaces/raza';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DoteService } from 'src/app/services/dote.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { RacialService } from 'src/app/services/racial.service';
import { RazaService } from 'src/app/services/raza.service';
import { UserService } from 'src/app/services/user.service';
import { PrerrequisitoEditorHostComponent } from '../prerrequisito-editor/prerrequisito-editor-host.component';
import {
    PrerequisiteCatalogContext,
    PrerequisiteCatalogItem,
    PrerequisiteRowModel,
    PrerequisiteType,
} from '../prerrequisito-editor/prerrequisito-editor.models';
import {
    arePrerequisitesIncomplete,
    findCatalogName,
    syncPrerequisiteRows,
} from '../prerrequisito-editor/prerrequisito-editor.registry';

type RacialPrerequisiteType = Extract<PrerequisiteType, 'raza' | 'caracteristica'>;
const RAZA_EN_CREACION_PREREQ_ID = 2147483647;
const RAZA_EN_CREACION_PREREQ_LABEL = 'La raza que estoy creando';

interface RacialCreadoEmitPayload {
    idRacial: number;
    nombre: string;
    racial: RacialDetalle;
    tienePrerrequisitoRaza?: boolean;
    prerrequisitoRazaEnCreacion?: boolean;
}

interface NombreIdItem {
    Id: number;
    Nombre: string;
}

interface DoteRow {
    uid: string;
    id_dote: number;
    id_extra: number;
    busqueda: string;
    extraBusqueda: string;
}

interface HabilidadBaseRow {
    uid: string;
    id_habilidad: number;
    rangos: number;
    id_extra: number;
    se_considera_clasea: boolean;
    condicion: string;
    busqueda: string;
    extraBusqueda: string;
}

interface HabilidadCustomRow {
    uid: string;
    id_habilidad: number;
    rangos: number;
    id_extra: number;
    se_considera_clasea: boolean;
    busqueda: string;
    extraBusqueda: string;
}

interface CaracteristicaRow {
    uid: string;
    id_caracteristica: number;
    cantidad: number;
}

interface SalvacionRow {
    uid: string;
    id_salvacion: number;
    cantidad: number;
    condicion: string;
}

interface SortilegaRow {
    uid: string;
    id_conjuro: number;
    nivel_lanzador: number;
    usos_diarios: string;
    busqueda: string;
}

interface AtaqueRow {
    uid: string;
    descripcion: string;
}

@Component({
    selector: 'app-nueva-racial',
    templateUrl: './nueva-racial.component.html',
    styleUrls: ['./nueva-racial.component.sass'],
    standalone: false,
})
export class NuevaRacialComponent implements OnInit, OnDestroy, OnChanges {
    @Input() modal: boolean = false;
    @Input() permitirRazaEnCreacionPrerrequisito: boolean = false;
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idRacial: number | null = null;
    @Input() editorTabKey: string = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() racialCreado = new EventEmitter<RacialCreadoEmitPayload>();
    @Output() racialActualizado = new EventEmitter<RacialDetalle>();
    @ViewChild(PrerrequisitoEditorHostComponent) prerrequisitoEditorHost?: PrerrequisitoEditorHostComponent;

    private readonly destroy$ = new Subject<void>();
    private uidCounter: number = 0;
    private initialEditSnapshot: string = '';
    private ultimoIdRacialCargado: number = 0;

    guardando: boolean = false;
    cargandoEdicion: boolean = false;
    puedeCrear: boolean = false;
    puedeActualizar: boolean = false;
    dotes: Dote[] = [];
    habilidadesBase: HabilidadBasicaDetalle[] = [];
    habilidadesCustom: HabilidadBasicaDetalle[] = [];
    conjuros: Conjuro[] = [];
    razasCatalogo: PrerequisiteCatalogItem[] = [];
    doteRows: DoteRow[] = [];
    habilidadesBaseRows: HabilidadBaseRow[] = [];
    habilidadesCustomRows: HabilidadCustomRow[] = [];
    caracteristicasRows: CaracteristicaRow[] = [];
    salvacionesRows: SalvacionRow[] = [];
    sortilegasRows: SortilegaRow[] = [];
    ataquesRows: AtaqueRow[] = [];
    prerrequisitosSeleccionados: RacialPrerequisiteType[] = [];
    prerrequisitosRows: PrerequisiteRowModel[] = [];

    readonly caracteristicasCatalogo: PrerequisiteCatalogItem[] = [
        { id: 1, nombre: 'Fuerza' },
        { id: 2, nombre: 'Destreza' },
        { id: 3, nombre: 'Constitución' },
        { id: 4, nombre: 'Inteligencia' },
        { id: 5, nombre: 'Sabiduría' },
        { id: 6, nombre: 'Carisma' },
    ];
    readonly salvacionesCatalogo: NombreIdItem[] = [
        { Id: 1, Nombre: 'Completa (+2 a +12)' },
        { Id: 2, Nombre: 'Corta (+0 a +6)' },
    ];
    readonly tiposPrerrequisito: Array<{ key: RacialPrerequisiteType; label: string; }> = [
        { key: 'raza', label: 'Raza requerida' },
        { key: 'caracteristica', label: 'Mínimo de característica' },
    ];
    readonly prerrequisitosCatalogContext: PrerequisiteCatalogContext = {
        getCatalog: (type) => this.getCatalogoPrerrequisito(type),
        getCatalogName: (type, id) => this.getNombreCatalogoPrerrequisito(type, id),
        getDoteExtraOptions: () => [],
        dotePermiteExtra: () => false,
        getGlobalExtraOptions: () => [],
        habilidadPermiteExtra: () => false,
        especialPermiteExtra: () => false,
    };
    readonly ensurePrerequisiteCatalogs = async (_types: PrerequisiteType[]) => undefined;

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
        descripcion: ['', [Validators.maxLength(5000)]],
        oficial: [true],
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private racialSvc: RacialService,
        private doteSvc: DoteService,
        private habilidadSvc: HabilidadService,
        private conjuroSvc: ConjuroService,
        private razaSvc: RazaService,
    ) { }

    ngOnInit(): void {
        this.resetFilas();
        this.actualizarPermisos();
        this.userSvc.acl$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.actualizarPermisos());
        this.cargarCatalogos();
        this.cargarEdicionSiAplica();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idRacial'])
            this.cargarEdicionSiAplica();
    }

    get nombreControl() {
        return this.form.controls.nombre;
    }

    get descripcionControl() {
        return this.form.controls.descripcion;
    }

    get creacionBloqueada(): boolean {
        return this.guardando || this.cargandoEdicion || !this.puedeGuardar;
    }

    get esModoEdicion(): boolean {
        return this.modo === 'editar';
    }

    get puedeGuardar(): boolean {
        return this.esModoEdicion ? this.puedeActualizar : this.puedeCrear;
    }

    get mensajePermisoInsuficiente(): string {
        return this.esModoEdicion
            ? 'No tienes permisos para modificar raciales.'
            : 'No tienes permisos para crear raciales.';
    }

    get tituloFormulario(): string {
        return this.esModoEdicion ? 'Modificar racial' : 'Crear racial';
    }

    get etiquetaAccionPrincipal(): string {
        if (this.guardando)
            return this.esModoEdicion ? 'Guardando cambios...' : 'Creando racial...';
        return this.esModoEdicion ? 'Actualizar racial' : 'Crear racial';
    }

    get isDirty(): boolean {
        if (!this.esModoEdicion || this.cargandoEdicion)
            return false;
        return this.buildEditSnapshot() !== this.initialEditSnapshot;
    }

    async guardarRacial(): Promise<void> {
        if (!this.puedeGuardar) {
            await Swal.fire({
                icon: 'warning',
                title: 'Permisos insuficientes',
                text: this.userSvc.getPermissionDeniedMessage(),
                showConfirmButton: true,
            });
            return;
        }

        this.form.markAllAsTouched();
        if (this.form.invalid)
            return;

        if (arePrerequisitesIncomplete(this.prerrequisitosRows, this.prerrequisitosSeleccionados)) {
            await Swal.fire({
                icon: 'warning',
                title: 'Prerrequisitos incompletos',
                text: 'Configura todos los prerrequisitos marcados antes de crear el racial.',
                showConfirmButton: true,
            });
            return;
        }

        const payload = this.construirPayload();
        this.guardando = true;
        try {
            if (this.esModoEdicion) {
                const idRacial = this.entero(this.idRacial);
                if (idRacial <= 0)
                    throw new Error('No se encontró un id de racial válido para editar.');

                const response = await this.racialSvc.actualizarRacial(idRacial, payload as RacialUpdateRequest);
                const racialActualizado = await firstValueFrom(this.racialSvc.getRacial(response.idRacial).pipe(take(1)));
                await Swal.fire({
                    icon: 'success',
                    title: 'Racial actualizado',
                    text: response.message,
                    timer: 1800,
                    showConfirmButton: true,
                    showCloseButton: true,
                    confirmButtonText: 'Cerrar',
                });
                this.hidratarDesdeRacial(racialActualizado);
                this.racialActualizado.emit(racialActualizado);
                this.cerrar.emit();
            } else {
                const tienePrerrequisitoRaza = (payload.prerrequisitos?.raza?.length ?? 0) > 0;
                const prerrequisitoRazaEnCreacion = this.tienePrerrequisitoRazaEnCreacion();
                const response = await this.racialSvc.crearRacial(payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Racial creado',
                    text: response.message,
                    timer: 1800,
                    showConfirmButton: true,
                    showCloseButton: true,
                    confirmButtonText: 'Cerrar',
                });
                this.racialCreado.emit({
                    idRacial: response.idRacial,
                    nombre: response.racial.Nombre,
                    racial: response.racial,
                    tienePrerrequisitoRaza,
                    prerrequisitoRazaEnCreacion,
                });
                this.resetFormulario();
            }
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: this.esModoEdicion ? 'No se pudo actualizar el racial' : 'No se pudo crear el racial',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true,
            });
        } finally {
            this.guardando = false;
        }
    }

    async crearRacial(): Promise<void> {
        await this.guardarRacial();
    }

    cancelar(): void {
        this.cerrar.emit();
    }

    toggleOficial(): void {
        this.form.controls.oficial.setValue(this.form.controls.oficial.value !== true);
        this.form.controls.oficial.markAsDirty();
        this.form.controls.oficial.markAsTouched();
    }

    async confirmarSalidaSiHayCambios(): Promise<boolean> {
        if (!this.esModoEdicion || !this.isDirty)
            return true;

        const result = await Swal.fire({
            icon: 'warning',
            title: 'Hay cambios sin guardar',
            text: 'Si cierras esta pestaña perderás los cambios del racial.',
            showCancelButton: true,
            confirmButtonText: 'Cerrar sin guardar',
            cancelButtonText: 'Seguir editando',
        });

        return result.isConfirmed === true;
    }

    agregarDote(): void {
        this.doteRows = [...this.doteRows, this.crearDoteRow()];
    }

    quitarDote(index: number): void {
        this.doteRows = this.quitarFila(this.doteRows, index, this.crearDoteRow());
    }

    seleccionarDote(index: number, id: number): void {
        const dote = this.buscarPorId(this.dotes, id);
        this.doteRows = this.doteRows.map((row, rowIndex) => {
            if (rowIndex !== index)
                return row;
            return {
                ...row,
                id_dote: dote?.Id ?? 0,
                busqueda: dote?.Nombre ?? '',
                id_extra: 0,
                extraBusqueda: '',
            };
        });
    }

    seleccionarExtraDote(index: number, id: number): void {
        const row = this.doteRows[index];
        const extra = this.getDoteExtras(row).find((item) => item.Id_extra === Number(id));
        this.doteRows = this.doteRows.map((item, rowIndex) => rowIndex === index
            ? { ...item, id_extra: extra?.Id_extra ?? 0, extraBusqueda: extra?.Extra ?? '' }
            : item);
    }

    agregarHabilidadBase(): void {
        this.habilidadesBaseRows = [...this.habilidadesBaseRows, this.crearHabilidadBaseRow()];
    }

    quitarHabilidadBase(index: number): void {
        this.habilidadesBaseRows = this.quitarFila(this.habilidadesBaseRows, index, this.crearHabilidadBaseRow());
    }

    seleccionarHabilidadBase(index: number, id: number): void {
        const habilidad = this.buscarHabilidad(this.habilidadesBase, id);
        this.habilidadesBaseRows = this.habilidadesBaseRows.map((row, rowIndex) => rowIndex === index
            ? { ...row, id_habilidad: habilidad?.Id_habilidad ?? 0, busqueda: habilidad?.Nombre ?? '', id_extra: 0, extraBusqueda: '' }
            : row);
    }

    seleccionarExtraHabilidadBase(index: number, id: number): void {
        const row = this.habilidadesBaseRows[index];
        const extra = this.getHabilidadBaseExtras(row).find((item) => item.Id_extra === Number(id));
        this.habilidadesBaseRows = this.habilidadesBaseRows.map((item, rowIndex) => rowIndex === index
            ? { ...item, id_extra: extra?.Id_extra ?? 0, extraBusqueda: extra?.Extra ?? '' }
            : item);
    }

    agregarHabilidadCustom(): void {
        this.habilidadesCustomRows = [...this.habilidadesCustomRows, this.crearHabilidadCustomRow()];
    }

    quitarHabilidadCustom(index: number): void {
        this.habilidadesCustomRows = this.quitarFila(this.habilidadesCustomRows, index, this.crearHabilidadCustomRow());
    }

    seleccionarHabilidadCustom(index: number, id: number): void {
        const habilidad = this.buscarHabilidad(this.habilidadesCustom, id);
        this.habilidadesCustomRows = this.habilidadesCustomRows.map((row, rowIndex) => rowIndex === index
            ? { ...row, id_habilidad: habilidad?.Id_habilidad ?? 0, busqueda: habilidad?.Nombre ?? '', id_extra: 0, extraBusqueda: '' }
            : row);
    }

    seleccionarExtraHabilidadCustom(index: number, id: number): void {
        const row = this.habilidadesCustomRows[index];
        const extra = this.getHabilidadCustomExtras(row).find((item) => item.Id_extra === Number(id));
        this.habilidadesCustomRows = this.habilidadesCustomRows.map((item, rowIndex) => rowIndex === index
            ? { ...item, id_extra: extra?.Id_extra ?? 0, extraBusqueda: extra?.Extra ?? '' }
            : item);
    }

    agregarCaracteristica(): void {
        this.caracteristicasRows = [...this.caracteristicasRows, this.crearCaracteristicaRow()];
    }

    quitarCaracteristica(index: number): void {
        this.caracteristicasRows = this.quitarFila(this.caracteristicasRows, index, this.crearCaracteristicaRow());
    }

    agregarSalvacion(): void {
        this.salvacionesRows = [...this.salvacionesRows, this.crearSalvacionRow()];
    }

    quitarSalvacion(index: number): void {
        this.salvacionesRows = this.quitarFila(this.salvacionesRows, index, this.crearSalvacionRow());
    }

    agregarSortilega(): void {
        this.sortilegasRows = [...this.sortilegasRows, this.crearSortilegaRow()];
    }

    quitarSortilega(index: number): void {
        this.sortilegasRows = this.quitarFila(this.sortilegasRows, index, this.crearSortilegaRow());
    }

    seleccionarConjuro(index: number, id: number): void {
        const conjuro = this.buscarPorId(this.conjuros, id);
        this.sortilegasRows = this.sortilegasRows.map((row, rowIndex) => rowIndex === index
            ? { ...row, id_conjuro: conjuro?.Id ?? 0, busqueda: conjuro?.Nombre ?? '' }
            : row);
    }

    agregarAtaque(): void {
        this.ataquesRows = [...this.ataquesRows, this.crearAtaqueRow()];
    }

    quitarAtaque(index: number): void {
        this.ataquesRows = this.quitarFila(this.ataquesRows, index, this.crearAtaqueRow());
    }

    async togglePrerrequisito(type: RacialPrerequisiteType, checked: boolean): Promise<void> {
        const set = new Set<RacialPrerequisiteType>(this.prerrequisitosSeleccionados);
        if (checked)
            set.add(type);
        else
            set.delete(type);

        const nextTypes = Array.from(set);
        if (this.prerrequisitoEditorHost) {
            await this.prerrequisitoEditorHost.prepareTypes(nextTypes);
            return;
        }
        this.prerrequisitosSeleccionados = nextTypes;
        this.prerrequisitosRows = syncPrerequisiteRows(this.prerrequisitosRows, nextTypes);
    }

    onPrerrequisitosSeleccionadosChange(types: PrerequisiteType[]): void {
        this.prerrequisitosSeleccionados = types.filter((type): type is RacialPrerequisiteType =>
            type === 'raza' || type === 'caracteristica'
        );
        this.prerrequisitosRows = this.prerrequisitosRows.filter((row) =>
            this.prerrequisitosSeleccionados.includes(row.tipo as RacialPrerequisiteType)
        );
    }

    onPrerrequisitosRowsChange(rows: PrerequisiteRowModel[]): void {
        this.prerrequisitosRows = rows.filter((row) =>
            row.tipo === 'raza' || row.tipo === 'caracteristica'
        );
    }

    isPrerrequisitoActivo(type: RacialPrerequisiteType): boolean {
        return this.prerrequisitosSeleccionados.includes(type);
    }

    getDotesFiltradas(row: DoteRow): Dote[] {
        return this.filtrarPorNombre(this.dotes, row.busqueda);
    }

    getDoteExtras(row: DoteRow): HabilidadExtraRef[] {
        const dote = this.buscarPorId(this.dotes, row.id_dote);
        if (!dote)
            return [];
        return [
            ...(dote.Extras_disponibles?.Armas ?? []).map((item) => ({ Id_extra: item.Id, Extra: item.Nombre, Descripcion: '' })),
            ...(dote.Extras_disponibles?.Armaduras ?? []).map((item) => ({ Id_extra: item.Id, Extra: item.Nombre, Descripcion: '' })),
            ...(dote.Extras_disponibles?.Escuelas ?? []).map((item) => ({ Id_extra: item.Id, Extra: item.Nombre, Descripcion: '' })),
            ...(dote.Extras_disponibles?.Habilidades ?? []).map((item) => ({ Id_extra: item.Id, Extra: item.Nombre, Descripcion: '' })),
        ];
    }

    getDoteExtrasFiltrados(row: DoteRow): HabilidadExtraRef[] {
        return this.filtrarExtras(this.getDoteExtras(row), row.extraBusqueda);
    }

    getHabilidadesBaseFiltradas(row: HabilidadBaseRow): HabilidadBasicaDetalle[] {
        return this.filtrarHabilidades(this.habilidadesBase, row.busqueda);
    }

    getHabilidadesCustomFiltradas(row: HabilidadCustomRow): HabilidadBasicaDetalle[] {
        return this.filtrarHabilidades(this.habilidadesCustom, row.busqueda);
    }

    getHabilidadBaseExtras(row: HabilidadBaseRow): HabilidadExtraRef[] {
        return this.buscarHabilidad(this.habilidadesBase, row.id_habilidad)?.Extras ?? [];
    }

    getHabilidadCustomExtras(row: HabilidadCustomRow): HabilidadExtraRef[] {
        return this.buscarHabilidad(this.habilidadesCustom, row.id_habilidad)?.Extras ?? [];
    }

    getHabilidadBaseExtrasFiltradas(row: HabilidadBaseRow): HabilidadExtraRef[] {
        return this.filtrarExtras(this.getHabilidadBaseExtras(row), row.extraBusqueda);
    }

    getHabilidadCustomExtrasFiltradas(row: HabilidadCustomRow): HabilidadExtraRef[] {
        return this.filtrarExtras(this.getHabilidadCustomExtras(row), row.extraBusqueda);
    }

    getConjurosFiltrados(row: SortilegaRow): Conjuro[] {
        return this.filtrarPorNombre(this.conjuros, row.busqueda);
    }

    trackByUid(_: number, row: { uid: string; }): string {
        return row.uid;
    }

    trackById(_: number, item: { Id?: number; id?: number; Id_habilidad?: number; Id_extra?: number; }): number {
        return Number(item.Id ?? item.id ?? item.Id_habilidad ?? item.Id_extra ?? 0);
    }

    private cargarEdicionSiAplica(): void {
        if (!this.esModoEdicion) {
            this.ultimoIdRacialCargado = 0;
            this.initialEditSnapshot = '';
            return;
        }

        const idRacial = this.entero(this.idRacial);
        if (idRacial <= 0 || idRacial === this.ultimoIdRacialCargado)
            return;

        this.cargandoEdicion = true;
        this.racialSvc.getRacial(idRacial)
            .pipe(take(1))
            .subscribe({
                next: (racial) => {
                    this.hidratarDesdeRacial(racial);
                    this.ultimoIdRacialCargado = idRacial;
                    this.cargandoEdicion = false;
                },
                error: async (error) => {
                    this.cargandoEdicion = false;
                    await Swal.fire({
                        icon: 'error',
                        title: 'No se pudo cargar el racial',
                        text: error?.message ?? 'Error no identificado',
                        showConfirmButton: true,
                    });
                },
            });
    }

    private cargarCatalogos(): void {
        this.doteSvc.getDotes()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (items) => this.dotes = this.ordenar(items), error: () => this.dotes = [] });
        this.habilidadSvc.getHabilidades()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (items) => this.habilidadesBase = this.ordenarHabilidades(items), error: () => this.habilidadesBase = [] });
        this.habilidadSvc.getHabilidadesCustom()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (items) => this.habilidadesCustom = this.ordenarHabilidades(items), error: () => this.habilidadesCustom = [] });
        this.conjuroSvc.getConjuros()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (items) => this.conjuros = this.ordenar(items), error: () => this.conjuros = [] });
        this.razaSvc.getRazas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (items) => this.razasCatalogo = this.ordenar(items).map((raza) => ({ id: raza.Id, nombre: raza.Nombre })),
                error: () => this.razasCatalogo = [],
            });
    }

    private hidratarDesdeRacial(racial: RacialDetalle): void {
        this.form.reset({
            nombre: this.texto(racial?.Nombre),
            descripcion: this.texto(racial?.Descripcion),
            oficial: racial?.Oficial !== false,
        });

        this.doteRows = this.hidratarDotes(racial);
        this.habilidadesBaseRows = this.hidratarHabilidadesBase(racial);
        this.habilidadesCustomRows = this.hidratarHabilidadesCustom(racial);
        this.caracteristicasRows = this.hidratarCaracteristicas(racial);
        this.salvacionesRows = this.hidratarSalvaciones(racial);
        this.sortilegasRows = this.hidratarSortilegas(racial);
        this.ataquesRows = this.hidratarAtaques(racial);
        this.hidratarPrerrequisitos(racial);
        this.initialEditSnapshot = this.buildEditSnapshot();
    }

    private construirPayload(): RacialCreateRequest {
        const nombre = this.texto(this.form.value.nombre);
        const descripcion = this.texto(this.form.value.descripcion);
        const payload: RacialCreateRequest = {
            racial: descripcion.length > 0
                ? { nombre, descripcion, oficial: this.form.value.oficial === true }
                : { nombre, oficial: this.form.value.oficial === true },
        };

        const dotes = this.construirDotesPayload();
        const habilidadesBase = this.construirHabilidadesBasePayload();
        const habilidadesCustom = this.construirHabilidadesCustomPayload();
        const caracteristicas = this.construirCaracteristicasPayload();
        const salvaciones = this.construirSalvacionesPayload();
        const sortilegas = this.construirSortilegasPayload();
        const ataques = this.construirAtaquesPayload();
        const prerrequisitos = this.construirPrerrequisitosPayload();

        if (dotes.length > 0)
            payload.dotes = dotes;
        if (habilidadesBase.length > 0 || habilidadesCustom.length > 0)
            payload.habilidades = {
                ...(habilidadesBase.length > 0 ? { base: habilidadesBase } : {}),
                ...(habilidadesCustom.length > 0 ? { custom: habilidadesCustom } : {}),
            };
        if (caracteristicas.length > 0)
            payload.caracteristicas = caracteristicas;
        if (salvaciones.length > 0)
            payload.salvaciones = salvaciones;
        if (sortilegas.length > 0)
            payload.sortilegas = sortilegas;
        if (ataques.length > 0)
            payload.ataques = ataques;
        if ((prerrequisitos.raza?.length ?? 0) > 0 || (prerrequisitos.caracteristica?.length ?? 0) > 0)
            payload.prerrequisitos = prerrequisitos;

        return payload;
    }

    private buildEditSnapshot(): string {
        return JSON.stringify(this.normalizarPayloadParaComparacion(this.construirPayload()));
    }

    private normalizarPayloadParaComparacion(payload: RacialCreateRequest): RacialCreateRequest {
        const normalizado: RacialCreateRequest = {
            racial: {
                nombre: this.texto(payload?.racial?.nombre),
                oficial: payload?.racial?.oficial === true,
                ...(this.texto(payload?.racial?.descripcion).length > 0
                    ? { descripcion: this.texto(payload?.racial?.descripcion) }
                    : {}),
            },
        };

        if ((payload.dotes?.length ?? 0) > 0) {
            normalizado.dotes = [...(payload.dotes ?? [])]
                .sort((a, b) => this.entero(a.id_dote) - this.entero(b.id_dote) || this.entero(a.id_extra) - this.entero(b.id_extra));
        }

        if ((payload.habilidades?.base?.length ?? 0) > 0 || (payload.habilidades?.custom?.length ?? 0) > 0) {
            normalizado.habilidades = {
                ...(payload.habilidades?.base?.length
                    ? {
                        base: [...payload.habilidades.base]
                            .sort((a, b) => this.entero(a.id_habilidad) - this.entero(b.id_habilidad) || this.entero(a.id_extra) - this.entero(b.id_extra)),
                    }
                    : {}),
                ...(payload.habilidades?.custom?.length
                    ? {
                        custom: [...payload.habilidades.custom]
                            .sort((a, b) => this.entero(a.id_habilidad) - this.entero(b.id_habilidad) || this.entero(a.id_extra) - this.entero(b.id_extra)),
                    }
                    : {}),
            };
        }

        if ((payload.caracteristicas?.length ?? 0) > 0) {
            normalizado.caracteristicas = [...(payload.caracteristicas ?? [])]
                .sort((a, b) => this.entero(a.id_caracteristica) - this.entero(b.id_caracteristica) || this.entero(a.cantidad) - this.entero(b.cantidad));
        }

        if ((payload.salvaciones?.length ?? 0) > 0) {
            normalizado.salvaciones = [...(payload.salvaciones ?? [])]
                .sort((a, b) => this.entero(a.id_salvacion) - this.entero(b.id_salvacion) || this.entero(a.cantidad) - this.entero(b.cantidad));
        }

        if ((payload.sortilegas?.length ?? 0) > 0) {
            normalizado.sortilegas = [...(payload.sortilegas ?? [])]
                .sort((a, b) => this.entero(a.id_conjuro) - this.entero(b.id_conjuro));
        }

        if ((payload.ataques?.length ?? 0) > 0) {
            normalizado.ataques = [...(payload.ataques ?? [])]
                .sort((a, b) => this.texto(a.descripcion).localeCompare(this.texto(b.descripcion), 'es', { sensitivity: 'base' }));
        }

        if ((payload.prerrequisitos?.raza?.length ?? 0) > 0 || (payload.prerrequisitos?.caracteristica?.length ?? 0) > 0) {
            normalizado.prerrequisitos = {
                ...(payload.prerrequisitos?.raza?.length
                    ? {
                        raza: [...payload.prerrequisitos.raza]
                            .sort((a, b) => this.entero(a.id_raza) - this.entero(b.id_raza)),
                    }
                    : {}),
                ...(payload.prerrequisitos?.caracteristica?.length
                    ? {
                        caracteristica: [...payload.prerrequisitos.caracteristica]
                            .sort((a, b) =>
                                this.entero(a.id_caracteristica) - this.entero(b.id_caracteristica)
                                || this.entero(a.cantidad) - this.entero(b.cantidad)
                                || this.entero(a.opcional) - this.entero(b.opcional)),
                    }
                    : {}),
            };
        }

        return normalizado;
    }

    private construirDotesPayload(): RacialCreateDote[] {
        return this.doteRows
            .filter((row) => this.entero(row.id_dote) > 0)
            .map((row) => ({
                id_dote: this.entero(row.id_dote),
                id_extra: this.entero(row.id_extra) > 0 ? this.entero(row.id_extra) : -1,
            }));
    }

    private construirHabilidadesBasePayload(): RacialCreateHabilidadBase[] {
        return this.habilidadesBaseRows
            .filter((row) => this.entero(row.id_habilidad) > 0)
            .map((row) => ({
                id_habilidad: this.entero(row.id_habilidad),
                rangos: this.entero(row.rangos),
                id_extra: this.entero(row.id_extra) > 0 ? this.entero(row.id_extra) : -1,
                se_considera_clasea: row.se_considera_clasea === true,
                condicion: this.texto(row.condicion, 'No especifica'),
            }));
    }

    private construirHabilidadesCustomPayload(): RacialCreateHabilidadCustom[] {
        return this.habilidadesCustomRows
            .filter((row) => this.entero(row.id_habilidad) > 0)
            .map((row) => ({
                id_habilidad: this.entero(row.id_habilidad),
                rangos: this.entero(row.rangos),
                id_extra: this.entero(row.id_extra) > 0 ? this.entero(row.id_extra) : -1,
                se_considera_clasea: row.se_considera_clasea === true,
            }));
    }

    private construirCaracteristicasPayload(): RacialCreateCaracteristica[] {
        return this.caracteristicasRows
            .filter((row) => this.entero(row.id_caracteristica) > 0 && this.entero(row.cantidad) !== 0)
            .map((row) => ({
                id_caracteristica: this.entero(row.id_caracteristica),
                cantidad: this.entero(row.cantidad),
            }));
    }

    private construirSalvacionesPayload(): RacialCreateSalvacion[] {
        return this.salvacionesRows
            .filter((row) => this.entero(row.id_salvacion) > 0 && this.entero(row.cantidad) !== 0)
            .map((row) => ({
                id_salvacion: this.entero(row.id_salvacion),
                cantidad: this.entero(row.cantidad),
                condicion: this.texto(row.condicion, 'No especifica'),
            }));
    }

    private construirSortilegasPayload(): RacialCreateSortilega[] {
        return this.sortilegasRows
            .filter((row) => this.entero(row.id_conjuro) > 0)
            .map((row) => ({
                id_conjuro: this.entero(row.id_conjuro),
                nivel_lanzador: Math.max(1, this.entero(row.nivel_lanzador, 1)),
                usos_diarios: this.texto(row.usos_diarios, '1/día'),
            }));
    }

    private construirAtaquesPayload(): RacialCreateAtaque[] {
        return this.ataquesRows
            .map((row) => this.texto(row.descripcion))
            .filter((descripcion) => descripcion.length > 0)
            .map((descripcion) => ({ descripcion }));
    }

    private construirPrerrequisitosPayload(): RacialCreatePrerequisitos {
        const prerrequisitos: RacialCreatePrerequisitos = {};
        const tiposActivos = new Set(this.prerrequisitosSeleccionados);
        this.prerrequisitosRows
            .filter((row) => tiposActivos.has(row.tipo as RacialPrerequisiteType))
            .forEach((row) => {
                if (row.tipo === 'raza') {
                    const idRaza = this.entero(row.id);
                    if (idRaza === RAZA_EN_CREACION_PREREQ_ID)
                        return;
                    if (idRaza > 0)
                        prerrequisitos.raza = [...(prerrequisitos.raza ?? []), { id_raza: idRaza }];
                    return;
                }

                if (row.tipo === 'caracteristica') {
                    const idCaracteristica = this.entero(row.id);
                    const cantidad = this.entero(row.valor);
                    if (idCaracteristica > 0 && cantidad > 0) {
                        const opcional = this.entero(row.opcional);
                        prerrequisitos.caracteristica = [
                            ...(prerrequisitos.caracteristica ?? []),
                            {
                                id_caracteristica: idCaracteristica,
                                cantidad,
                                ...(opcional > 0 ? { opcional } : {}),
                            },
                        ];
                    }
                }
            });
        return prerrequisitos;
    }

    private resetFormulario(): void {
        this.form.reset({ nombre: '', descripcion: '', oficial: true });
        this.resetFilas();
        this.initialEditSnapshot = '';
        this.ultimoIdRacialCargado = 0;
    }

    private resetFilas(): void {
        this.doteRows = [this.crearDoteRow()];
        this.habilidadesBaseRows = [this.crearHabilidadBaseRow()];
        this.habilidadesCustomRows = [this.crearHabilidadCustomRow()];
        this.caracteristicasRows = [this.crearCaracteristicaRow()];
        this.salvacionesRows = [this.crearSalvacionRow()];
        this.sortilegasRows = [this.crearSortilegaRow()];
        this.ataquesRows = [this.crearAtaqueRow()];
        this.prerrequisitosSeleccionados = [];
        this.prerrequisitosRows = [];
    }

    private actualizarPermisos(): void {
        this.puedeCrear = this.userSvc.can('razas', 'create');
        this.puedeActualizar = this.userSvc.can('raciales', 'update');
    }

    private getCatalogoPrerrequisito(type: PrerequisiteType): PrerequisiteCatalogItem[] {
        if (type === 'raza')
            return this.getRazasCatalogoPrerrequisito();
        if (type === 'caracteristica')
            return this.caracteristicasCatalogo;
        return [];
    }

    private getNombreCatalogoPrerrequisito(type: PrerequisiteType, id: number): string {
        if (type === 'raza' && this.entero(id) === RAZA_EN_CREACION_PREREQ_ID)
            return RAZA_EN_CREACION_PREREQ_LABEL;
        return findCatalogName(type, id, this.getCatalogoPrerrequisito(type));
    }

    private getRazasCatalogoPrerrequisito(): PrerequisiteCatalogItem[] {
        if (!this.permitirRazaEnCreacionPrerrequisito)
            return this.razasCatalogo;
        return [
            { id: RAZA_EN_CREACION_PREREQ_ID, nombre: RAZA_EN_CREACION_PREREQ_LABEL },
            ...this.razasCatalogo,
        ];
    }

    private tienePrerrequisitoRazaEnCreacion(): boolean {
        if (!this.permitirRazaEnCreacionPrerrequisito || !this.prerrequisitosSeleccionados.includes('raza'))
            return false;
        return this.prerrequisitosRows.some((row) =>
            row.tipo === 'raza' && this.entero(row.id) === RAZA_EN_CREACION_PREREQ_ID
        );
    }

    private hidratarDotes(racial: RacialDetalle): DoteRow[] {
        const rows = (racial?.Dotes ?? []).map((item) => ({
            uid: this.uid(),
            id_dote: this.entero(this.pick(item, 'Id_dote', 'id_dote', 'id', 'Id')),
            id_extra: this.entero(this.pick(item, 'Id_extra', 'id_extra', 'i_ex', 'ie')),
            busqueda: this.texto(this.pick(item, 'Dote', 'dote', 'Nombre', 'nombre')),
            extraBusqueda: this.texto(this.pick(item, 'Extra', 'extra', 'x')),
        }));
        return rows.length > 0 ? rows : [this.crearDoteRow()];
    }

    private hidratarHabilidadesBase(racial: RacialDetalle): HabilidadBaseRow[] {
        const rows = (racial?.Habilidades?.Base ?? []).map((item) => ({
            uid: this.uid(),
            id_habilidad: this.entero(this.pick(item, 'Id_habilidad', 'id_habilidad', 'id_h', 'ih', 'Id', 'id')),
            rangos: this.entero(this.pick(item, 'Rangos', 'rangos', 'Cantidad', 'cantidad', 'r')),
            id_extra: this.entero(this.pick(item, 'Id_extra', 'id_extra', 'i_ex', 'ie')),
            se_considera_clasea: this.toBoolean(this.pick(item, 'Se_considera_clasea', 'se_considera_clasea', 'Clasea', 'clasea', 'sc')),
            condicion: this.texto(this.pick(item, 'Condicion', 'condicion', 'c'), 'No especifica'),
            busqueda: this.texto(this.pick(item, 'Habilidad', 'habilidad', 'Nombre', 'nombre', 'n')),
            extraBusqueda: this.texto(this.pick(item, 'Extra', 'extra', 'x')),
        }));
        return rows.length > 0 ? rows : [this.crearHabilidadBaseRow()];
    }

    private hidratarHabilidadesCustom(racial: RacialDetalle): HabilidadCustomRow[] {
        const rows = (racial?.Habilidades?.Custom ?? []).map((item) => ({
            uid: this.uid(),
            id_habilidad: this.entero(this.pick(item, 'Id_habilidad', 'id_habilidad', 'id_h', 'ih', 'Id', 'id')),
            rangos: this.entero(this.pick(item, 'Rangos', 'rangos', 'Cantidad', 'cantidad', 'r')),
            id_extra: this.entero(this.pick(item, 'Id_extra', 'id_extra', 'i_ex', 'ie')),
            se_considera_clasea: this.toBoolean(this.pick(item, 'Se_considera_clasea', 'se_considera_clasea', 'Clasea', 'clasea', 'sc')),
            busqueda: this.texto(this.pick(item, 'Habilidad', 'habilidad', 'Nombre', 'nombre', 'n')),
            extraBusqueda: this.texto(this.pick(item, 'Extra', 'extra', 'x')),
        }));
        return rows.length > 0 ? rows : [this.crearHabilidadCustomRow()];
    }

    private hidratarCaracteristicas(racial: RacialDetalle): CaracteristicaRow[] {
        const rows = (racial?.Caracteristicas ?? []).map((item) => ({
            uid: this.uid(),
            id_caracteristica: this.entero(this.pick(item, 'Id_caracteristica', 'id_caracteristica', 'Id', 'id')),
            cantidad: this.entero(this.pick(item, 'Cantidad', 'cantidad', 'c')),
        }));
        return rows.length > 0 ? rows : [this.crearCaracteristicaRow()];
    }

    private hidratarSalvaciones(racial: RacialDetalle): SalvacionRow[] {
        const rows = (racial?.Salvaciones ?? []).map((item) => ({
            uid: this.uid(),
            id_salvacion: this.entero(this.pick(item, 'Id_salvacion', 'id_salvacion', 'Id', 'id')),
            cantidad: this.entero(this.pick(item, 'Cantidad', 'cantidad', 'c')),
            condicion: this.texto(this.pick(item, 'Condicion', 'condicion', 'd'), 'No especifica'),
        }));
        return rows.length > 0 ? rows : [this.crearSalvacionRow()];
    }

    private hidratarSortilegas(racial: RacialDetalle): SortilegaRow[] {
        const rows = (racial?.Sortilegas ?? []).map((item) => ({
            uid: this.uid(),
            id_conjuro: this.entero(item?.Conjuro?.Id ?? this.pick(item, 'Id_conjuro', 'id_conjuro', 'Id', 'id')),
            nivel_lanzador: Math.max(1, this.entero(this.pick(item, 'Nivel_lanzador', 'nivel_lanzador', 'nl'), 1)),
            usos_diarios: this.texto(this.pick(item, 'Usos_diarios', 'usos_diarios', 'ud'), '1/día'),
            busqueda: this.texto(item?.Conjuro?.Nombre ?? this.pick(item, 'Conjuro', 'conjuro', 'Nombre', 'nombre')),
        }));
        return rows.length > 0 ? rows : [this.crearSortilegaRow()];
    }

    private hidratarAtaques(racial: RacialDetalle): AtaqueRow[] {
        const rows = (racial?.Ataques ?? []).map((item) => ({
            uid: this.uid(),
            descripcion: this.texto(this.pick(item, 'Descripcion', 'descripcion', 'd')),
        }));
        return rows.length > 0 ? rows : [this.crearAtaqueRow()];
    }

    private hidratarPrerrequisitos(racial: RacialDetalle): void {
        const rows: PrerequisiteRowModel[] = [];
        const seleccionados = new Set<RacialPrerequisiteType>();

        (racial?.Prerrequisitos?.raza ?? []).forEach((item) => {
            const idRaza = this.entero(this.pick(item, 'Id_raza', 'id_raza', 'Id', 'id'));
            if (idRaza <= 0)
                return;
            seleccionados.add('raza');
            rows.push({
                uid: this.uid(),
                tipo: 'raza',
                id: idRaza,
                valor: 1,
                opcional: this.entero(this.pick(item, 'Opcional', 'opcional', 'o')),
                id_extra: null,
                repetido: 1,
                requiere_extra: false,
                salvacion_tipo: 'fortaleza',
            });
        });

        (racial?.Prerrequisitos?.caracteristica ?? []).forEach((item) => {
            const idCaracteristica = this.entero(this.pick(item, 'Id_caracteristica', 'id_caracteristica', 'Id', 'id'));
            const cantidad = this.entero(this.pick(item, 'Cantidad', 'cantidad', 'c'));
            if (idCaracteristica <= 0 || cantidad <= 0)
                return;
            seleccionados.add('caracteristica');
            rows.push({
                uid: this.uid(),
                tipo: 'caracteristica',
                id: idCaracteristica,
                valor: cantidad,
                opcional: this.entero(this.pick(item, 'Opcional', 'opcional', 'o')),
                id_extra: null,
                repetido: 1,
                requiere_extra: false,
                salvacion_tipo: 'fortaleza',
            });
        });

        this.prerrequisitosSeleccionados = Array.from(seleccionados);
        this.prerrequisitosRows = rows;
    }

    private crearDoteRow(): DoteRow {
        return { uid: this.uid(), id_dote: 0, id_extra: 0, busqueda: '', extraBusqueda: '' };
    }

    private crearHabilidadBaseRow(): HabilidadBaseRow {
        return { uid: this.uid(), id_habilidad: 0, rangos: 0, id_extra: 0, se_considera_clasea: false, condicion: 'No especifica', busqueda: '', extraBusqueda: '' };
    }

    private crearHabilidadCustomRow(): HabilidadCustomRow {
        return { uid: this.uid(), id_habilidad: 0, rangos: 0, id_extra: 0, se_considera_clasea: false, busqueda: '', extraBusqueda: '' };
    }

    private crearCaracteristicaRow(): CaracteristicaRow {
        return { uid: this.uid(), id_caracteristica: 0, cantidad: 0 };
    }

    private crearSalvacionRow(): SalvacionRow {
        return { uid: this.uid(), id_salvacion: 0, cantidad: 0, condicion: 'No especifica' };
    }

    private crearSortilegaRow(): SortilegaRow {
        return { uid: this.uid(), id_conjuro: 0, nivel_lanzador: 1, usos_diarios: '1/día', busqueda: '' };
    }

    private crearAtaqueRow(): AtaqueRow {
        return { uid: this.uid(), descripcion: '' };
    }

    private quitarFila<T>(rows: T[], index: number, fallback: T): T[] {
        const next = rows.filter((_, rowIndex) => rowIndex !== index);
        return next.length > 0 ? next : [fallback];
    }

    private uid(): string {
        this.uidCounter += 1;
        return `racial_${Date.now()}_${this.uidCounter}`;
    }

    private buscarPorId<T extends { Id: number; }>(items: T[], id: number): T | undefined {
        const numericId = this.entero(id);
        return items.find((item) => item.Id === numericId);
    }

    private buscarHabilidad(items: HabilidadBasicaDetalle[], id: number): HabilidadBasicaDetalle | undefined {
        const numericId = this.entero(id);
        return items.find((item) => item.Id_habilidad === numericId);
    }

    private filtrarPorNombre<T extends { Nombre: string; }>(items: T[], query: string): T[] {
        const filtro = this.normalizar(query);
        if (filtro.length < 1)
            return items.slice(0, 40);
        return items
            .filter((item) => this.normalizar(item.Nombre).includes(filtro))
            .slice(0, 40);
    }

    private filtrarHabilidades(items: HabilidadBasicaDetalle[], query: string): HabilidadBasicaDetalle[] {
        const filtro = this.normalizar(query);
        if (filtro.length < 1)
            return items.slice(0, 40);
        return items
            .filter((item) => this.normalizar(item.Nombre).includes(filtro))
            .slice(0, 40);
    }

    private filtrarExtras(items: HabilidadExtraRef[], query: string): HabilidadExtraRef[] {
        const filtro = this.normalizar(query);
        if (filtro.length < 1)
            return items.slice(0, 40);
        return items
            .filter((item) => this.normalizar(item.Extra).includes(filtro))
            .slice(0, 40);
    }

    private ordenar<T extends { Nombre: string; }>(items: T[]): T[] {
        return [...items].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    private ordenarHabilidades(items: HabilidadBasicaDetalle[]): HabilidadBasicaDetalle[] {
        return [...items].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    private normalizar(value: unknown): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private pick(source: any, ...keys: string[]): any {
        if (!source || typeof source !== 'object')
            return undefined;
        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(source, key))
                return source[key];
        }
        return undefined;
    }

    private texto(value: unknown, fallback: string = ''): string {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : fallback;
    }

    private entero(value: unknown, fallback: number = 0): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
    }

    private toBoolean(value: unknown): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value !== 0;
        if (typeof value === 'string') {
            const normalizado = value.trim().toLowerCase();
            return ['1', 'true', 'si', 'sí', 'yes'].includes(normalizado);
        }
        return false;
    }
}
