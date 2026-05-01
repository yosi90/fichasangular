import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, firstValueFrom, take, takeUntil } from 'rxjs';
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
})
export class NuevaEspecialComponent implements OnInit, OnDestroy, OnChanges {
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idEspecial: number | null = null;
    @Input() editorTabKey: string = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() especialCreado = new EventEmitter<EspecialClaseDetalle>();
    @Output() especialActualizado = new EventEmitter<EspecialClaseDetalle>();

    private readonly destroy$ = new Subject<void>();
    private uidCounter = 0;
    private initialEditSnapshot = '';
    private ultimoIdEspecialCargado = 0;

    guardando = false;
    cargandoEdicion = false;
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
    ) { }

    ngOnInit(): void {
        this.resetFilas();
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.cargarCatalogos();
        this.cargarEdicionSiAplica();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idEspecial'])
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
        return this.esModoEdicion ? 'Modificar especial' : 'Crear especial';
    }

    get etiquetaAccionPrincipal(): string {
        if (this.guardando)
            return this.esModoEdicion ? 'Guardando cambios...' : 'Creando especial...';
        return this.esModoEdicion ? 'Actualizar especial' : 'Crear especial';
    }

    get mensajePermisoInsuficiente(): string {
        return this.esModoEdicion
            ? 'No tienes permisos para modificar especiales.'
            : 'No tienes permisos para crear especiales.';
    }

    get isDirty(): boolean {
        if (!this.esModoEdicion || this.cargandoEdicion)
            return false;
        return this.buildEditSnapshot() !== this.initialEditSnapshot;
    }

    async guardarEspecial(): Promise<void> {
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

        const payload = this.construirPayload();
        this.guardando = true;
        try {
            if (this.esModoEdicion) {
                const idEspecial = this.entero(this.idEspecial);
                if (idEspecial <= 0)
                    throw new Error('No se encontró un id de especial válido para editar.');
                const response = await this.especialSvc.actualizarEspecial(idEspecial, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Especial actualizado',
                    text: response.message,
                    timer: 1800,
                    showConfirmButton: true,
                    showCloseButton: true,
                    confirmButtonText: 'Cerrar',
                });
                this.hidratarDesdeEspecial(response.especial);
                this.especialActualizado.emit(response.especial);
                this.cerrar.emit();
            } else {
                const response = await this.especialSvc.crearEspecial(payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Especial creado',
                    text: response.message,
                    timer: 1800,
                    showConfirmButton: true,
                    showCloseButton: true,
                    confirmButtonText: 'Cerrar',
                });
                this.especialCreado.emit(response.especial);
                this.resetFormulario();
            }
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: this.esModoEdicion ? 'No se pudo actualizar el especial' : 'No se pudo crear el especial',
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

    agregarExtra(): void {
        this.extraRows = [...this.extraRows, this.crearExtraRow()];
    }

    quitarExtra(index: number): void {
        this.extraRows = this.quitarFila(this.extraRows, index, this.crearExtraRow());
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
        this.habilidadRows = this.quitarFila(this.habilidadRows, index, this.crearHabilidadRow('base'));
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
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true,
            });
        } finally {
            this.customModalGuardando = false;
        }
    }

    async confirmarSalidaSiHayCambios(): Promise<boolean> {
        if (!this.esModoEdicion || !this.isDirty)
            return true;

        const result = await Swal.fire({
            icon: 'warning',
            title: 'Hay cambios sin guardar',
            text: 'Si cierras esta pestaña perderás los cambios del especial.',
            showCancelButton: true,
            confirmButtonText: 'Cerrar sin guardar',
            cancelButtonText: 'Seguir editando',
        });

        return result.isConfirmed === true;
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
        };
        return payload;
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
        this.habilidadSvc.habilidadesCustomMutadas$.pipe(takeUntil(this.destroy$)).subscribe((habilidad) => this.upsertHabilidadCustom(habilidad));
    }

    private cargarEdicionSiAplica(): void {
        if (!this.esModoEdicion)
            return;
        const idEspecial = this.entero(this.idEspecial);
        if (idEspecial <= 0 || this.cargandoEdicion || this.ultimoIdEspecialCargado === idEspecial)
            return;

        this.cargandoEdicion = true;
        this.especialSvc.getEspecialFresco(idEspecial)
            .pipe(take(1), takeUntil(this.destroy$))
            .subscribe({
                next: (especial) => {
                    this.hidratarDesdeEspecial(especial);
                    this.ultimoIdEspecialCargado = idEspecial;
                    this.cargandoEdicion = false;
                },
                error: async (error) => {
                    this.cargandoEdicion = false;
                    await Swal.fire({
                        icon: 'error',
                        title: 'No se pudo cargar el especial',
                        text: error?.message ?? 'Error no identificado',
                        showConfirmButton: true,
                    });
                },
            });
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
            no_aplica: especial.Flags_extra?.No_aplica === true,
            da_ca: especial.Flags_extra?.Da_CA === true,
            da_armadura_natural: especial.Flags_extra?.Da_armadura_natural === true,
            da_rd: especial.Flags_extra?.Da_RD === true,
            da_velocidad: especial.Flags_extra?.Da_velocidad === true,
        });
        this.extraRows = this.hidratarExtras(especial);
        this.habilidadRows = this.hidratarHabilidades(especial);
        this.initialEditSnapshot = this.buildEditSnapshot();
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
            no_aplica: true,
            da_ca: false,
            da_armadura_natural: false,
            da_rd: false,
            da_velocidad: false,
        });
        this.resetFilas();
        this.initialEditSnapshot = '';
        this.ultimoIdEspecialCargado = 0;
    }

    private resetFilas(): void {
        this.extraRows = [this.crearExtraRow()];
        this.habilidadRows = [this.crearHabilidadRow('base')];
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
        this.puedeCrear = this.userSvc.can('clases', 'create');
        this.puedeActualizar = this.userSvc.can('especiales', 'update') || this.userSvc.can('clases', 'update');
    }

    private crearExtraRow(): EspecialExtraRow {
        return { uid: this.uid(), id_extra: 0, orden: 1, busqueda: '' };
    }

    private crearHabilidadRow(tipo: 'base' | 'custom'): EspecialHabilidadRow {
        return { uid: this.uid(), tipo, id_habilidad: 0, id_extra: -1, rangos: 0, busqueda: '', extraBusqueda: '' };
    }

    private quitarFila<T>(rows: T[], index: number, fallback: T): T[] {
        const next = rows.filter((_, rowIndex) => rowIndex !== index);
        return next.length > 0 ? next : [fallback];
    }

    private getCatalogoHabilidades(tipo: 'base' | 'custom'): HabilidadBasicaDetalle[] {
        return tipo === 'custom' ? this.habilidadesCustom : this.habilidadesBase;
    }

    private ordenar<T extends { Nombre: string; }>(items: T[]): T[] {
        return [...(items ?? [])].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    private ordenarHabilidades(items: HabilidadBasicaDetalle[]): HabilidadBasicaDetalle[] {
        return [...(items ?? [])].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    private filtrarPorNombre<T extends { Nombre: string; }>(items: T[], query: string): T[] {
        const filtro = this.normalizar(query);
        if (filtro.length < 1)
            return items.slice(0, 40);
        return items.filter((item) => this.normalizar(item.Nombre).includes(filtro)).slice(0, 40);
    }

    private filtrarHabilidades(items: HabilidadBasicaDetalle[], query: string): HabilidadBasicaDetalle[] {
        const filtro = this.normalizar(query);
        if (filtro.length < 1)
            return items.slice(0, 40);
        return items.filter((item) => this.normalizar(item.Nombre).includes(filtro)).slice(0, 40);
    }

    private filtrarExtras<T extends { Extra: string; }>(items: T[], query: string): T[] {
        const filtro = this.normalizar(query);
        if (filtro.length < 1)
            return items.slice(0, 40);
        return items.filter((item) => this.normalizar(item.Extra).includes(filtro)).slice(0, 40);
    }

    private uid(): string {
        this.uidCounter += 1;
        return `especial_${Date.now()}_${this.uidCounter}`;
    }

    private normalizar(value: unknown): string {
        return `${value ?? ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    }

    private texto(value: unknown): string {
        return `${value ?? ''}`.trim();
    }

    private entero(value: unknown, fallback: number = 0): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
    }
}
