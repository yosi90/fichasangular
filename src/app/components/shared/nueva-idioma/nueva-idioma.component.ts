import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { IdiomaCreateRequest, IdiomaDetalle, IdiomaUpdateRequest } from 'src/app/interfaces/idioma';
import { IdiomaService } from 'src/app/services/idioma.service';
import { UserService } from 'src/app/services/user.service';

@Component({
    selector: 'app-nueva-idioma',
    templateUrl: './nueva-idioma.component.html',
    styleUrls: ['./nueva-idioma.component.sass'],
    standalone: false,
})
export class NuevaIdiomaComponent implements OnInit, OnDestroy, OnChanges {
    @Input() modal: boolean = false;
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idIdioma: number | null = null;
    @Input() editorTabKey: string = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() idiomaCreado = new EventEmitter<IdiomaDetalle>();
    @Output() idiomaActualizado = new EventEmitter<IdiomaDetalle>();

    private readonly destroy$ = new Subject<void>();
    private initialEditSnapshot: string = '';
    private ultimoIdIdiomaCargado: number = 0;

    guardando: boolean = false;
    cargandoEdicion: boolean = false;
    puedeCrear: boolean = false;

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        descripcion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
        secreto: [false],
        oficial: [true],
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private idiomaSvc: IdiomaService,
    ) { }

    ngOnInit(): void {
        this.actualizarPermisos();
        this.userSvc.acl$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.actualizarPermisos());
        this.cargarEdicionSiAplica();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idIdioma'])
            this.cargarEdicionSiAplica();
    }

    get nombreControl() {
        return this.form.controls.nombre;
    }

    get descripcionControl() {
        return this.form.controls.descripcion;
    }

    get esModoEdicion(): boolean {
        return this.modo === 'editar';
    }

    get puedeGuardar(): boolean {
        return this.puedeCrear;
    }

    get guardadoBloqueado(): boolean {
        return this.guardando || this.cargandoEdicion || !this.puedeGuardar;
    }

    get tituloFormulario(): string {
        return this.esModoEdicion ? 'Modificar idioma' : 'Crear idioma';
    }

    get etiquetaAccionPrincipal(): string {
        if (this.guardando)
            return this.esModoEdicion ? 'Guardando cambios...' : 'Creando idioma...';
        return this.esModoEdicion ? 'Actualizar idioma' : 'Crear idioma';
    }

    get mensajePermisoInsuficiente(): string {
        return this.esModoEdicion
            ? 'No tienes permisos para modificar idiomas.'
            : 'No tienes permisos para crear idiomas.';
    }

    get isDirty(): boolean {
        if (!this.esModoEdicion || this.cargandoEdicion)
            return false;
        return this.buildEditSnapshot() !== this.initialEditSnapshot;
    }

    async guardarIdioma(): Promise<void> {
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

        this.guardando = true;
        try {
            if (this.esModoEdicion) {
                const idIdioma = this.entero(this.idIdioma);
                if (idIdioma <= 0)
                    throw new Error('No se encontró un id de idioma válido para editar.');
                const response = await this.idiomaSvc.actualizarIdioma(idIdioma, this.construirPayload());
                await Swal.fire({
                    icon: 'success',
                    title: 'Idioma actualizado',
                    text: response.message,
                    timer: 1800,
                    showConfirmButton: true,
                    showCloseButton: true,
                    confirmButtonText: 'Cerrar',
                });
                this.hidratarDesdeIdioma(response.idioma);
                this.idiomaActualizado.emit(response.idioma);
                this.cerrar.emit();
            } else {
                const response = await this.idiomaSvc.crearIdioma(this.construirPayload() as IdiomaCreateRequest);
                await Swal.fire({
                    icon: 'success',
                    title: 'Idioma creado',
                    text: response.message,
                    timer: 1800,
                    showConfirmButton: true,
                    showCloseButton: true,
                    confirmButtonText: 'Cerrar',
                });
                this.idiomaCreado.emit(response.idioma);
                this.resetFormulario();
            }
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: this.esModoEdicion ? 'No se pudo actualizar el idioma' : 'No se pudo crear el idioma',
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
            text: 'Si cierras esta pestaña perderás los cambios del idioma.',
            showCancelButton: true,
            confirmButtonText: 'Cerrar sin guardar',
            cancelButtonText: 'Seguir editando',
        });

        return result.isConfirmed === true;
    }

    private construirPayload(): IdiomaCreateRequest | IdiomaUpdateRequest {
        const raw = this.form.getRawValue();
        return {
            nombre: this.texto(raw.nombre),
            descripcion: this.texto(raw.descripcion),
            secreto: raw.secreto === true,
            oficial: raw.oficial === true,
        };
    }

    private cargarEdicionSiAplica(): void {
        if (!this.esModoEdicion)
            return;
        const idIdioma = this.entero(this.idIdioma);
        if (idIdioma <= 0 || this.cargandoEdicion || this.ultimoIdIdiomaCargado === idIdioma)
            return;

        this.cargandoEdicion = true;
        this.idiomaSvc.getIdioma(idIdioma)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (idioma) => {
                    this.hidratarDesdeIdioma(idioma);
                    this.ultimoIdIdiomaCargado = idIdioma;
                    this.cargandoEdicion = false;
                },
                error: async (error) => {
                    this.cargandoEdicion = false;
                    await Swal.fire({
                        icon: 'error',
                        title: 'No se pudo cargar el idioma',
                        text: error?.message ?? 'Error no identificado',
                        showConfirmButton: true,
                    });
                },
            });
    }

    private hidratarDesdeIdioma(idioma: IdiomaDetalle): void {
        this.form.reset({
            nombre: idioma.Nombre ?? '',
            descripcion: idioma.Descripcion ?? '',
            secreto: idioma.Secreto === true,
            oficial: idioma.Oficial === true,
        });
        this.initialEditSnapshot = this.buildEditSnapshot();
    }

    private buildEditSnapshot(): string {
        const payload = this.construirPayload();
        return JSON.stringify(payload);
    }

    private resetFormulario(): void {
        this.form.reset({
            nombre: '',
            descripcion: '',
            secreto: false,
            oficial: true,
        });
        this.initialEditSnapshot = '';
        this.ultimoIdIdiomaCargado = 0;
    }

    private actualizarPermisos(): void {
        this.puedeCrear = this.userSvc.can('razas', 'create');
    }

    private texto(value: unknown): string {
        return `${value ?? ''}`.trim();
    }

    private entero(value: unknown): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
    }
}
