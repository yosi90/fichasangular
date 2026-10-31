import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import {
    EspecialClaseDetalle,
    EspecialClaseMutationHabilidad,
    EspecialClaseMutationRequest,
} from 'src/app/interfaces/especial';
import { ExtraDetalle } from 'src/app/interfaces/extra';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { SubtipoResumen } from 'src/app/interfaces/subtipo';
import { EspecialService } from 'src/app/services/especial.service';
import { ExtraService } from 'src/app/services/extra.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { UserService } from 'src/app/services/user.service';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { porNombre } from 'src/app/services/utils/orden-texto';
import { mensajeDeError } from 'src/app/services/utils/error-api';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { PrerequisiteCatalogContext, PrerequisiteCatalogItem, PrerequisiteRowModel, PrerequisiteType } from '../prerrequisito-editor/prerrequisito-editor.models';
import { getPrerequisiteTypeOptions } from '../prerrequisito-editor/prerrequisito-editor.registry';
import { filaNuevaDePrerrequisito, filasDesdePrerrequisitos, prerrequisitosDesdeFilas, tiposConFilas } from 'src/app/services/utils/plantilla-formulario';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { NombreDeCatalogo, avisarErrorAlGuardar, avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { alternarControl, quitarFila } from '../insercion-marco/filas-repetibles';

/** Los prerrequisitos que admite un especial: con qué actitud se puede elegir (la senda de una clase, por su alineamiento). */
const TIPOS_PRERREQUISITO_ESPECIAL: readonly PrerequisiteType[] = ['actitud_requerido', 'actitud_prohibido'];

const ESPECIAL: NombreDeCatalogo = { singular: 'especial', plural: 'especiales', femenino: false };

interface NombreIdItem {
    Id: number;
    Nombre: string;
}

interface EspecialExtraRow {
    uid: string;
    id_extra: number;
    orden: number;
    busqueda: string;
}

interface EspecialHabilidadRow {
    uid: string;
    tipo: 'base' | 'custom';
    id_habilidad: number;
    id_extra: number;
    rangos: number;
    busqueda: string;
    extraBusqueda: string;
}

@Component({
    selector: 'app-nueva-especial',
    templateUrl: './nueva-especial.component.html',
    styleUrls: ['./nueva-especial.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevaEspecialComponent) }],
})
export class NuevaEspecialComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    /** Abierta dentro de otra inserción (la ventana de la clase): cabecera compacta con su ✕. */
    @Input() modal: boolean = false;
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idEspecial: number | null = null;
    @Input() editorTabKey: string = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() especialCreado = new EventEmitter<EspecialClaseDetalle>();
    @Output() especialActualizado = new EventEmitter<EspecialClaseDetalle>();

    private readonly destroy$ = new Subject<void>();
    private uidCounter = 0;
    readonly edicion = new EdicionDeCatalogo<EspecialClaseDetalle>({
        nombre: ESPECIAL,
        modo: () => this.modo,
        id: () => this.idEspecial,
        obtener: (id) => this.especialSvc.getEspecialFresco(id),
        hidratar: (especial) => this.hidratarDesdeEspecial(especial),
        foto: () => this.buildEditSnapshot(),
        destruir$: this.destroy$,
    });

    guardando = false;
    /** Los pasos del marco común de las inserciones; se puede saltar a cualquiera. */
    readonly pasos = ['Base', 'Bonos', 'Relaciones'];
    pasoActual = 0;
    puedeCrear = false;
    puedeActualizar = false;
    extras: ExtraDetalle[] = [];
    habilidadesBase: HabilidadBasicaDetalle[] = [];
    habilidadesCustom: HabilidadBasicaDetalle[] = [];
    subtipos: SubtipoResumen[] = [];
    extraRows: EspecialExtraRow[] = [];
    habilidadRows: EspecialHabilidadRow[] = [];
    customModalAbierto = false;
    customModalModo: 'crear' | 'editar' = 'crear';
    customModalRowUid = '';
    customModalHabilidad: HabilidadBasicaDetalle | null = null;
    customModalGuardando = false;
    /** Los prerrequisitos de actitud, con el editor compartido. */
    readonly tiposPrerrequisito = getPrerequisiteTypeOptions((tipo) => TIPOS_PRERREQUISITO_ESPECIAL.includes(tipo));
    prerrequisitosTipos: PrerequisiteType[] = [];
    prerrequisitosFilas: PrerequisiteRowModel[] = [];
    actitudes: PrerequisiteCatalogItem[] = [];
    readonly catalogContext: PrerequisiteCatalogContext = {
        getCatalog: (tipo) => TIPOS_PRERREQUISITO_ESPECIAL.includes(tipo) ? this.actitudes : [],
        getCatalogName: (tipo, id) => (TIPOS_PRERREQUISITO_ESPECIAL.includes(tipo) ? this.actitudes : []).find((item) => item.id === this.entero(id))?.nombre ?? '',
        getDoteExtraOptions: () => [],
        dotePermiteExtra: () => false,
        getGlobalExtraOptions: () => [],
        habilidadPermiteExtra: () => false,
        especialPermiteExtra: () => false,
    };

    readonly caracteristicas: NombreIdItem[] = [
        { Id: 0, Nombre: 'No aplica' },
        { Id: 1, Nombre: 'Fuerza' },
        { Id: 2, Nombre: 'Destreza' },
        { Id: 3, Nombre: 'Constitución' },
        { Id: 4, Nombre: 'Inteligencia' },
        { Id: 5, Nombre: 'Sabiduría' },
        { Id: 6, Nombre: 'Carisma' },
    ];

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
        descripcion: ['', [Validators.maxLength(5000)]],
        oficial: [true],
        extra: [false],
        repetible: [false],
        rep_mismo_extra: [false],
        rep_comb: [false],
        act_extra: [false],
        caracteristica: [0],
        id_caracteristica_ca: [0],
        id_subtipo: [0],
        subtipoBusqueda: [''],
        fuerza: [0],
        destreza: [0],
        constitucion: [0],
        inteligencia: [0],
        sabiduria: [0],
        carisma: [0],
        ca: [0],
        arm_nat: [0],
        rd: [0],
        tamano_pasos: [0],
        no_aplica: [true],
        da_ca: [false],
        da_armadura_natural: [false],
        da_rd: [false],
        da_velocidad: [false],
    });

    readonly customForm = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
        id_caracteristica: [4, [Validators.required, Validators.min(1)]],
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private especialSvc: EspecialService,
        private habilidadSvc: HabilidadService,
        private extraSvc: ExtraService,
        private subtipoSvc: SubtipoService,
        private razaCatalogosSvc: RazaCatalogosService,
    ) { }

    ngOnInit(): void {
        this.resetFilas();
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.cargarCatalogos();
        this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idEspecial'])
            this.edicion.cargarSiHaceFalta();
    }

    get esModoEdicion(): boolean {
        return this.edicion.editando;
    }

    get cargandoEdicion(): boolean {
        return this.edicion.cargando;
    }

    get puedeGuardar(): boolean {
        return this.esModoEdicion ? this.puedeActualizar : this.puedeCrear;
    }

    get guardadoBloqueado(): boolean {
        return this.guardando || this.cargandoEdicion || !this.puedeGuardar;
    }

    get etiquetaAccionPrincipal(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    get mensajePermisoInsuficiente(): string {
        return this.edicion.avisoPermisos;
    }

    get isDirty(): boolean {
        return this.edicion.hayCambios;
    }

    async guardarEspecial(): Promise<void> {
        if (!this.puedeGuardar) {
            await avisarSinPermisos(this.userSvc.getPermissionDeniedMessage());
            return;
        }

        this.form.markAllAsTouched();
        if (this.form.invalid)
            return;

        const payload = this.construirPayload();
        this.guardando = true;
        try {
            if (this.esModoEdicion) {
                const idEspecial = this.edicion.id;
                if (idEspecial <= 0)
                    throw new Error('No se encontró un id de especial válido para editar.');
                const response = await this.especialSvc.actualizarEspecial(idEspecial, payload);
                await avisarGuardado(ESPECIAL, true, response.message);
                this.hidratarDesdeEspecial(response.especial);
                this.especialActualizado.emit(response.especial);
                this.cerrar.emit();
            } else {
                const response = await this.especialSvc.crearEspecial(payload);
                await avisarGuardado(ESPECIAL, false, response.message);
                this.especialCreado.emit(response.especial);
                this.resetFormulario();
            }
        } catch (error: any) {
            await avisarErrorAlGuardar(ESPECIAL, this.esModoEdicion, error);
        } finally {
            this.guardando = false;
        }
    }

    cancelar(): void {
        this.cerrar.emit();
    }

    toggleBoolean(controlName: keyof typeof this.form.controls): void {
        alternarControl(this.form.controls[controlName]);
    }

    agregarExtra(): void {
        this.extraRows = [...this.extraRows, this.crearExtraRow()];
    }

    quitarExtra(index: number): void {
        this.extraRows = quitarFila(this.extraRows, index, () => this.crearExtraRow());
    }

    seleccionarExtra(index: number, id: number): void {
        const extra = this.extras.find((item) => item.Id === this.entero(id));
        this.extraRows = this.extraRows.map((row, rowIndex) => rowIndex === index
            ? { ...row, id_extra: extra?.Id ?? 0, busqueda: extra?.Nombre ?? '' }
            : row);
    }

    agregarHabilidad(tipo: 'base' | 'custom'): void {
        this.habilidadRows = [...this.habilidadRows, this.crearHabilidadRow(tipo)];
    }

    quitarHabilidad(index: number): void {
        this.habilidadRows = quitarFila(this.habilidadRows, index, () => this.crearHabilidadRow('base'));
    }

    seleccionarHabilidad(index: number, id: number): void {
        const row = this.habilidadRows[index];
        const habilidad = this.getCatalogoHabilidades(row.tipo).find((item) => item.Id_habilidad === this.entero(id));
        this.habilidadRows = this.habilidadRows.map((item, rowIndex) => rowIndex === index
            ? { ...item, id_habilidad: habilidad?.Id_habilidad ?? 0, busqueda: habilidad?.Nombre ?? '', id_extra: -1, extraBusqueda: '' }
            : item);
    }

    seleccionarExtraHabilidad(index: number, id: number): void {
        const row = this.habilidadRows[index];
        const extra = this.getExtrasHabilidad(row).find((item) => item.Id_extra === this.entero(id));
        this.habilidadRows = this.habilidadRows.map((item, rowIndex) => rowIndex === index
            ? { ...item, id_extra: extra?.Id_extra ?? -1, extraBusqueda: extra?.Extra ?? '' }
            : item);
    }

    seleccionarSubtipo(id: number): void {
        const subtipo = this.subtipos.find((item) => item.Id === this.entero(id));
        this.form.patchValue({
            id_subtipo: subtipo?.Id ?? 0,
            subtipoBusqueda: subtipo?.Nombre ?? '',
        });
        this.form.controls.id_subtipo.markAsDirty();
    }

    getExtrasFiltrados(row: EspecialExtraRow): ExtraDetalle[] {
        return this.filtrarPorNombre(this.extras, row.busqueda);
    }

    getHabilidadesFiltradas(row: EspecialHabilidadRow): HabilidadBasicaDetalle[] {
        return this.filtrarHabilidades(this.getCatalogoHabilidades(row.tipo), row.busqueda);
    }

    getExtrasHabilidad(row: EspecialHabilidadRow): Array<{ Id_extra: number; Extra: string; }> {
        const habilidad = this.getCatalogoHabilidades(row.tipo).find((item) => item.Id_habilidad === this.entero(row.id_habilidad));
        return (habilidad?.Extras ?? []).map((item) => ({ Id_extra: item.Id_extra, Extra: item.Extra }));
    }

    getExtrasHabilidadFiltrados(row: EspecialHabilidadRow): Array<{ Id_extra: number; Extra: string; }> {
        return this.filtrarExtras(this.getExtrasHabilidad(row), row.extraBusqueda);
    }

    getSubtiposFiltrados(): SubtipoResumen[] {
        return this.filtrarPorNombre(this.subtipos, this.form.controls.subtipoBusqueda.value ?? '');
    }

    abrirCrearCustom(): void {
        this.customModalModo = 'crear';
        this.customModalRowUid = '';
        this.customModalHabilidad = null;
        this.customForm.reset({ nombre: '', id_caracteristica: 4 });
        this.customModalAbierto = true;
    }

    abrirEditarCustom(row: EspecialHabilidadRow): void {
        if (row.tipo !== 'custom' || this.entero(row.id_habilidad) <= 0)
            return;
        const habilidad = this.habilidadesCustom.find((item) => item.Id_habilidad === this.entero(row.id_habilidad));
        if (!habilidad)
            return;
        this.customModalModo = 'editar';
        this.customModalRowUid = row.uid;
        this.customModalHabilidad = habilidad;
        this.customForm.reset({
            nombre: habilidad.Nombre,
            id_caracteristica: habilidad.Id_caracteristica > 0 ? habilidad.Id_caracteristica : 4,
        });
        this.customModalAbierto = true;
    }

    cerrarCustomModal(): void {
        if (this.customModalGuardando)
            return;
        this.customModalAbierto = false;
        this.customModalRowUid = '';
        this.customModalHabilidad = null;
    }

    onCustomGuardada(habilidad: HabilidadBasicaDetalle): void {
        this.upsertHabilidadCustom(habilidad);
        this.seleccionarCustomEnFila(habilidad);
        this.customModalAbierto = false;
        this.customModalRowUid = '';
        this.customModalHabilidad = null;
    }

    async guardarCustomModal(): Promise<void> {
        this.customForm.markAllAsTouched();
        if (this.customForm.invalid)
            return;

        this.customModalGuardando = true;
        try {
            const raw = this.customForm.getRawValue();
            const payload = {
                nombre: this.texto(raw.nombre),
                id_caracteristica: this.entero(raw.id_caracteristica),
            };
            const response = this.customModalModo === 'editar' && this.customModalHabilidad
                ? await this.habilidadSvc.actualizarHabilidadCustom(this.customModalHabilidad.Id_habilidad, payload)
                : await this.habilidadSvc.crearHabilidadCustom(payload);
            this.onCustomGuardada(response.habilidad);
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: this.customModalModo === 'editar' ? 'No se pudo actualizar la habilidad' : 'No se pudo crear la habilidad',
                text: mensajeDeError(error, 'Error no identificado'),
                showConfirmButton: true,
            });
        } finally {
            this.customModalGuardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    private construirPayload(): EspecialClaseMutationRequest {
        const raw = this.form.getRawValue();
        const payload: EspecialClaseMutationRequest = {
            especial: {
                nombre: this.texto(raw.nombre),
                descripcion: this.texto(raw.descripcion),
                extra: raw.extra === true,
                repetible: raw.repetible === true,
                rep_mismo_extra: raw.rep_mismo_extra === true,
                rep_comb: raw.rep_comb === true,
                act_extra: raw.act_extra === true,
                caracteristica: this.entero(raw.caracteristica),
                id_caracteristica_ca: this.entero(raw.id_caracteristica_ca),
                bonificadores: {
                    fuerza: this.entero(raw.fuerza),
                    destreza: this.entero(raw.destreza),
                    constitucion: this.entero(raw.constitucion),
                    inteligencia: this.entero(raw.inteligencia),
                    sabiduria: this.entero(raw.sabiduria),
                    carisma: this.entero(raw.carisma),
                    ca: this.entero(raw.ca),
                    arm_nat: this.entero(raw.arm_nat),
                    rd: this.entero(raw.rd),
                    tamano_pasos: this.entero(raw.tamano_pasos),
                },
                flags_extra: {
                    no_aplica: raw.no_aplica === true,
                    da_ca: raw.da_ca === true,
                    da_armadura_natural: raw.da_armadura_natural === true,
                    da_rd: raw.da_rd === true,
                    da_velocidad: raw.da_velocidad === true,
                },
                id_subtipo: this.entero(raw.id_subtipo),
                oficial: raw.oficial === true,
            },
            extras: this.extraRows
                .filter((row) => this.entero(row.id_extra) > 0)
                .map((row) => ({ id_extra: this.entero(row.id_extra), orden: Math.max(1, this.entero(row.orden, 1)) })),
            habilidades: this.construirHabilidadesPayload(),
            prerrequisitos: prerrequisitosDesdeFilas(this.prerrequisitosFilas, TIPOS_PRERREQUISITO_ESPECIAL) as unknown as EspecialClaseMutationRequest['prerrequisitos'],
        };
        return payload;
    }

    anadirPrerrequisito(tipo: PrerequisiteType): void {
        const { fila, tipos } = filaNuevaDePrerrequisito(tipo, TIPOS_PRERREQUISITO_ESPECIAL, this.prerrequisitosTipos, () => this.uid());
        this.prerrequisitosTipos = tipos;
        this.prerrequisitosFilas = [...this.prerrequisitosFilas, fila];
    }

    alCambiarTiposPrerrequisito(tipos: PrerequisiteType[]): void {
        this.prerrequisitosTipos = tipos;
    }

    alCambiarPrerrequisitos(filas: PrerequisiteRowModel[]): void {
        this.prerrequisitosFilas = filas;
    }

    private hidratarPrerrequisitos(especial: EspecialClaseDetalle | null): void {
        const { filas } = filasDesdePrerrequisitos(especial?.Prerrequisitos, TIPOS_PRERREQUISITO_ESPECIAL, () => this.uid());
        this.prerrequisitosFilas = filas;
        this.prerrequisitosTipos = tiposConFilas(TIPOS_PRERREQUISITO_ESPECIAL, filas);
    }

    private construirHabilidadesPayload(): EspecialClaseMutationHabilidad[] {
        return this.habilidadRows
            .filter((row) => this.entero(row.id_habilidad) > 0)
            .map((row) => ({
                id_habilidad: this.entero(row.id_habilidad),
                id_extra: this.entero(row.id_extra) > 0 ? this.entero(row.id_extra) : -1,
                rangos: Math.max(0, this.entero(row.rangos)),
            }));
    }

    private cargarCatalogos(): void {
        this.extraSvc.getExtras().pipe(takeUntil(this.destroy$)).subscribe((extras) => this.extras = this.ordenar(extras));
        this.habilidadSvc.getHabilidades().pipe(takeUntil(this.destroy$)).subscribe((items) => this.habilidadesBase = this.ordenarHabilidades(items));
        this.habilidadSvc.getHabilidadesCustom().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.habilidadesCustom = this.ordenarHabilidades(items);
            this.reclasificarHabilidadesCustom();
        });
        this.subtipoSvc.getSubtipos().pipe(takeUntil(this.destroy$)).subscribe((items) => this.subtipos = this.ordenar(items));
        this.razaCatalogosSvc.getActitudes().pipe(takeUntil(this.destroy$)).subscribe((items) => {
            this.actitudes = (items ?? [])
                .map((item) => ({ id: this.entero(item?.Id), nombre: this.texto(item?.Nombre) }))
                .filter((item) => item.id > 0 && item.nombre.length > 0);
        });
        this.habilidadSvc.habilidadesCustomMutadas$.pipe(takeUntil(this.destroy$)).subscribe((habilidad) => this.upsertHabilidadCustom(habilidad));
    }

    private hidratarDesdeEspecial(especial: EspecialClaseDetalle): void {
        this.form.reset({
            nombre: especial.Nombre ?? '',
            descripcion: especial.Descripcion ?? '',
            oficial: especial.Oficial !== false,
            extra: especial.Extra === true,
            repetible: especial.Repetible === true,
            rep_mismo_extra: especial.Repite_mismo_extra === true,
            rep_comb: especial.Repite_combinacion === true,
            act_extra: especial.Activa_extra === true,
            caracteristica: this.entero(especial.Caracteristica?.Id),
            id_caracteristica_ca: 0,
            id_subtipo: this.entero(especial.Subtipo?.Id),
            subtipoBusqueda: especial.Subtipo?.Nombre ?? '',
            fuerza: this.entero(especial.Bonificadores?.Fuerza),
            destreza: this.entero(especial.Bonificadores?.Destreza),
            constitucion: this.entero(especial.Bonificadores?.Constitucion),
            inteligencia: this.entero(especial.Bonificadores?.Inteligencia),
            sabiduria: this.entero(especial.Bonificadores?.Sabiduria),
            carisma: this.entero(especial.Bonificadores?.Carisma),
            ca: this.entero(especial.Bonificadores?.CA),
            arm_nat: this.entero(especial.Bonificadores?.Armadura_natural),
            rd: this.entero(especial.Bonificadores?.RD),
            tamano_pasos: this.entero(especial.Bonificadores?.Tamano_pasos),
            no_aplica: especial.Flags_extra?.No_aplica === true,
            da_ca: especial.Flags_extra?.Da_CA === true,
            da_armadura_natural: especial.Flags_extra?.Da_armadura_natural === true,
            da_rd: especial.Flags_extra?.Da_RD === true,
            da_velocidad: especial.Flags_extra?.Da_velocidad === true,
        });
        this.extraRows = this.hidratarExtras(especial);
        this.habilidadRows = this.hidratarHabilidades(especial);
        this.hidratarPrerrequisitos(especial);
        this.edicion.tomarPuntoDePartida();
    }

    private hidratarExtras(especial: EspecialClaseDetalle): EspecialExtraRow[] {
        const rows = (especial.Extras ?? [])
            .filter((item) => this.entero(item.Id_extra) > 0)
            .map((item) => ({
                uid: this.uid(),
                id_extra: this.entero(item.Id_extra),
                orden: Math.max(1, this.entero(item.Orden, 1)),
                busqueda: item.Extra ?? '',
            }));
        return rows.length > 0 ? rows : [this.crearExtraRow()];
    }

    private hidratarHabilidades(especial: EspecialClaseDetalle): EspecialHabilidadRow[] {
        const rows = (especial.Habilidades ?? [])
            .filter((item) => this.entero(item.Id_habilidad) > 0)
            .map((item) => {
                const esCustom = this.habilidadesCustom.some((h) => h.Id_habilidad === this.entero(item.Id_habilidad));
                return {
                    uid: this.uid(),
                    tipo: esCustom ? 'custom' as const : 'base' as const,
                    id_habilidad: this.entero(item.Id_habilidad),
                    id_extra: this.entero(item.Id_extra, -1),
                    rangos: Math.max(0, this.entero(item.Rangos)),
                    busqueda: item.Habilidad ?? '',
                    extraBusqueda: item.Extra ?? '',
                };
            });
        return rows.length > 0 ? rows : [this.crearHabilidadRow('base')];
    }

    private buildEditSnapshot(): string {
        const payload = this.construirPayload();
        return JSON.stringify({
            ...payload,
            extras: [...(payload.extras ?? [])].sort((a, b) => a.id_extra - b.id_extra || a.orden - b.orden),
            habilidades: [...(payload.habilidades ?? [])].sort((a, b) => a.id_habilidad - b.id_habilidad || a.id_extra - b.id_extra || a.rangos - b.rangos),
        });
    }

    private resetFormulario(): void {
        this.form.reset({
            nombre: '',
            descripcion: '',
            oficial: true,
            extra: false,
            repetible: false,
            rep_mismo_extra: false,
            rep_comb: false,
            act_extra: false,
            caracteristica: 0,
            id_caracteristica_ca: 0,
            id_subtipo: 0,
            subtipoBusqueda: '',
            fuerza: 0,
            destreza: 0,
            constitucion: 0,
            inteligencia: 0,
            sabiduria: 0,
            carisma: 0,
            ca: 0,
            arm_nat: 0,
            rd: 0,
            tamano_pasos: 0,
            no_aplica: true,
            da_ca: false,
            da_armadura_natural: false,
            da_rd: false,
            da_velocidad: false,
        });
        this.resetFilas();
        this.edicion.olvidar();
    }

    private resetFilas(): void {
        this.extraRows = [this.crearExtraRow()];
        this.habilidadRows = [this.crearHabilidadRow('base')];
        this.hidratarPrerrequisitos(null);
    }

    private seleccionarCustomEnFila(habilidad: HabilidadBasicaDetalle): void {
        const targetUid = this.customModalRowUid;
        if (targetUid.length > 0) {
            this.habilidadRows = this.habilidadRows.map((row) => row.uid === targetUid
                ? { ...row, tipo: 'custom', id_habilidad: habilidad.Id_habilidad, busqueda: habilidad.Nombre, id_extra: -1, extraBusqueda: '' }
                : row);
            return;
        }
        const emptyCustom = this.habilidadRows.find((row) => row.tipo === 'custom' && this.entero(row.id_habilidad) <= 0);
        if (emptyCustom) {
            this.habilidadRows = this.habilidadRows.map((row) => row.uid === emptyCustom.uid
                ? { ...row, id_habilidad: habilidad.Id_habilidad, busqueda: habilidad.Nombre, id_extra: -1, extraBusqueda: '' }
                : row);
            return;
        }
        this.habilidadRows = [
            ...this.habilidadRows,
            { ...this.crearHabilidadRow('custom'), id_habilidad: habilidad.Id_habilidad, busqueda: habilidad.Nombre },
        ];
    }

    private upsertHabilidadCustom(habilidad: HabilidadBasicaDetalle): void {
        if (!habilidad || this.entero(habilidad.Id_habilidad) <= 0)
            return;
        const others = this.habilidadesCustom.filter((item) => item.Id_habilidad !== habilidad.Id_habilidad);
        this.habilidadesCustom = this.ordenarHabilidades([...others, habilidad]);
        this.habilidadRows = this.habilidadRows.map((row) => row.tipo === 'custom' && row.id_habilidad === habilidad.Id_habilidad
            ? { ...row, busqueda: habilidad.Nombre }
            : row);
    }

    private reclasificarHabilidadesCustom(): void {
        if (this.habilidadesCustom.length < 1)
            return;
        const customIds = new Set(this.habilidadesCustom.map((item) => this.entero(item.Id_habilidad)));
        this.habilidadRows = this.habilidadRows.map((row) => {
            if (!customIds.has(this.entero(row.id_habilidad)))
                return row;
            const habilidad = this.habilidadesCustom.find((item) => item.Id_habilidad === this.entero(row.id_habilidad));
            return {
                ...row,
                tipo: 'custom',
                busqueda: habilidad?.Nombre ?? row.busqueda,
            };
        });
    }

    private actualizarPermisos(): void {
        // Modificar pide en la API el mismo permiso que crear (`docs/publica/CATALOGOS_ALTA_Y_EDICION_FRONT.md`).
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'especiales');
        this.puedeActualizar = this.puedeCrear;
    }

    private crearExtraRow(): EspecialExtraRow {
        return { uid: this.uid(), id_extra: 0, orden: 1, busqueda: '' };
    }

    private crearHabilidadRow(tipo: 'base' | 'custom'): EspecialHabilidadRow {
        return { uid: this.uid(), tipo, id_habilidad: 0, id_extra: -1, rangos: 0, busqueda: '', extraBusqueda: '' };
    }

    private getCatalogoHabilidades(tipo: 'base' | 'custom'): HabilidadBasicaDetalle[] {
        return tipo === 'custom' ? this.habilidadesCustom : this.habilidadesBase;
    }

    private ordenar<T extends { Nombre: string; }>(items: T[]): T[] {
        return [...(items ?? [])].sort(porNombre);
    }

    private ordenarHabilidades(items: HabilidadBasicaDetalle[]): HabilidadBasicaDetalle[] {
        return [...(items ?? [])].sort(porNombre);
    }

    private filtrarPorNombre<T extends { Nombre: string; }>(items: T[], query: string): T[] {
        const filtro = normalizarTexto(query);
        if (filtro.length < 1)
            return items.slice(0, 40);
        return items.filter((item) => normalizarTexto(item.Nombre).includes(filtro)).slice(0, 40);
    }

    private filtrarHabilidades(items: HabilidadBasicaDetalle[], query: string): HabilidadBasicaDetalle[] {
        const filtro = normalizarTexto(query);
        if (filtro.length < 1)
            return items.slice(0, 40);
        return items.filter((item) => normalizarTexto(item.Nombre).includes(filtro)).slice(0, 40);
    }

    private filtrarExtras<T extends { Extra: string; }>(items: T[], query: string): T[] {
        const filtro = normalizarTexto(query);
        if (filtro.length < 1)
            return items.slice(0, 40);
        return items.filter((item) => normalizarTexto(item.Extra).includes(filtro)).slice(0, 40);
    }

    private uid(): string {
        this.uidCounter += 1;
        return `especial_${Date.now()}_${this.uidCounter}`;
    }

    private texto(value: unknown): string {
        return `${value ?? ''}`.trim();
    }

    private entero(value: unknown, fallback: number = 0): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
    }
}
