import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { avisarErrorAlGuardar, avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { IDIOMA } from 'src/app/services/utils/nombres-de-catalogo';
import { EdicionDeCatalogo } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { alternarControl } from '../insercion-marco/filas-repetibles';
import { IdiomaCreateRequest, IdiomaDetalle, IdiomaUpdateRequest } from 'src/app/interfaces/idioma';
import { IdiomaService } from 'src/app/services/idioma.service';
import { UserService } from 'src/app/services/user.service';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';

@Component({
    selector: 'app-nueva-idioma',
    templateUrl: './nueva-idioma.component.html',
    styleUrls: ['./nueva-idioma.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevaIdiomaComponent) }],
})
export class NuevaIdiomaComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() modal: boolean = false;
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idIdioma: number | null = null;
    @Input() editorTabKey: string = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() idiomaCreado = new EventEmitter<IdiomaDetalle>();
    @Output() idiomaActualizado = new EventEmitter<IdiomaDetalle>();

    private readonly destroy$ = new Subject<void>();
    readonly edicion = new EdicionDeCatalogo<IdiomaDetalle>({
        nombre: IDIOMA,
        modo: () => this.modo,
        id: () => this.idIdioma,
        obtener: (id) => this.idiomaSvc.getIdioma(id),
        hidratar: (idioma) => this.hidratarDesdeIdioma(idioma),
        foto: () => JSON.stringify(this.construirPayload()),
        destruir$: this.destroy$,
    });

    guardando: boolean = false;
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
        this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idIdioma'])
            this.edicion.cargarSiHaceFalta();
    }

    get nombreControl() {
        return this.form.controls.nombre;
    }

    get descripcionControl() {
        return this.form.controls.descripcion;
    }

    get esModoEdicion(): boolean {
        return this.edicion.editando;
    }

    get cargandoEdicion(): boolean {
        return this.edicion.cargando;
    }

    get puedeGuardar(): boolean {
        return this.puedeCrear;
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

    async guardarIdioma(): Promise<void> {
        if (!this.puedeGuardar) {
            await avisarSinPermisos(this.userSvc.getPermissionDeniedMessage());
            return;
        }

        this.form.markAllAsTouched();
        if (this.form.invalid)
            return;

        this.guardando = true;
        try {
            if (this.esModoEdicion) {
                const idIdioma = this.edicion.id;
                if (idIdioma <= 0)
                    throw new Error('No se encontró un id de idioma válido para editar.');
                const response = await this.idiomaSvc.actualizarIdioma(idIdioma, this.construirPayload());
                await avisarGuardado(IDIOMA, true, response.message);
                this.hidratarDesdeIdioma(response.idioma);
                this.idiomaActualizado.emit(response.idioma);
                this.cerrar.emit();
            } else {
                const response = await this.idiomaSvc.crearIdioma(this.construirPayload() as IdiomaCreateRequest);
                await avisarGuardado(IDIOMA, false, response.message);
                this.idiomaCreado.emit(response.idioma);
                this.resetFormulario();
            }
        } catch (error: any) {
            await avisarErrorAlGuardar(IDIOMA, this.esModoEdicion, error);
        } finally {
            this.guardando = false;
        }
    }

    cancelar(): void {
        this.cerrar.emit();
    }

    toggleOficial(): void {
        alternarControl(this.form.controls.oficial);
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
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

    private hidratarDesdeIdioma(idioma: IdiomaDetalle): void {
        this.form.reset({
            nombre: idioma.Nombre ?? '',
            descripcion: idioma.Descripcion ?? '',
            secreto: idioma.Secreto === true,
            oficial: idioma.Oficial === true,
        });
        this.edicion.tomarPuntoDePartida();
    }

    private resetFormulario(): void {
        this.form.reset({
            nombre: '',
            descripcion: '',
            secreto: false,
            oficial: true,
        });
        this.edicion.olvidar();
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'idiomas');
    }

    private texto(value: unknown): string {
        return `${value ?? ''}`.trim();
    }
}
