import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Rasgo, RasgoCuerpo } from 'src/app/interfaces/rasgo';
import { RasgoService } from 'src/app/services/rasgo.service';
import { UserService } from 'src/app/services/user.service';
import { RASGO } from 'src/app/services/utils/nombres-de-catalogo';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario } from '../insercion-marco/errores-de-formulario';
import { alternarControl } from '../insercion-marco/filas-repetibles';

/** Los campos con su etiqueta, para llevar el error de la API (`field` `rasgo.<clave>`) a su control. Sin pasos. */
const CAMPOS: CamposDeFormulario = {
    nombre: { etiqueta: 'Nombre', paso: 0 },
    descripcion: { etiqueta: 'Descripción', paso: 0 },
    oficial: { etiqueta: 'Oficial', paso: 0 },
};

/**
 * «Insertar rasgo» y «Modificar rasgo» (hito 8 del roadmap de inserciones): los rasgos de los tipos y subtipos de
 * criatura y los que da una ventaja. Una inserción pequeña, como el idioma: los campos directamente en el marco, sin
 * pasos ni tarjetas, con la receta de la guía (`EdicionDeCatalogo`, `ErroresDeFormulario`).
 */
@Component({
    selector: 'app-nuevo-rasgo',
    templateUrl: './nuevo-rasgo.component.html',
    styleUrls: ['./nuevo-rasgo.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevoRasgoComponent) }],
})
export class NuevoRasgoComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idRasgo: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() rasgoCreado = new EventEmitter<Rasgo>();
    @Output() rasgoActualizado = new EventEmitter<Rasgo>();

    private readonly destroy$ = new Subject<void>();
    guardando = false;
    puedeCrear = false;

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(200)]],
        descripcion: ['', [Validators.maxLength(8000)]],
        oficial: [true],
    });

    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS,
        raiz: 'rasgo',
        control: (campo) => (this.form.controls as Record<string, any>)[campo],
        firma: (campo) => JSON.stringify((this.form.controls as Record<string, any>)[campo]?.value ?? null),
        irAPaso: () => undefined,
    });

    readonly edicion = new EdicionDeCatalogo<Rasgo>({
        nombre: RASGO,
        modo: () => this.modo,
        id: () => this.idRasgo,
        obtener: (id) => this.rasgoSvc.getRasgoFresco(id),
        hidratar: (rasgo) => this.hidratar(rasgo),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, 'No se ha podido cargar el rasgo.'),
    });

    constructor(private fb: FormBuilder, private userSvc: UserService, private rasgoSvc: RasgoService) { }

    ngOnInit(): void {
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.errores.seguirCambios());
        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idRasgo'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    alternarOficial(): void {
        alternarControl(this.form.controls.oficial);
    }

    async guardar(): Promise<void> {
        if (!this.puedeCrear) {
            await avisarSinPermisos(this.userSvc.getPermissionDeniedMessage());
            return;
        }
        this.form.markAllAsTouched();
        if (this.form.invalid) {
            this.errores.irAlPrimerError();
            return;
        }
        this.errores.limpiar();
        this.guardando = true;
        try {
            const editando = this.edicion.editando;
            const guardado = editando
                ? await this.rasgoSvc.actualizarRasgo(this.edicion.id, this.cuerpo())
                : await this.rasgoSvc.crearRasgo(this.cuerpo());
            await avisarGuardado(RASGO, editando, guardado.message);
            if (editando) {
                this.hidratar(guardado.rasgo);
                this.rasgoActualizado.emit(guardado.rasgo);
                this.cerrar.emit();
            } else {
                this.rasgoCreado.emit(guardado.rasgo);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, 'No se ha podido guardar el rasgo.');
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST /rasgos/add` y `PUT /rasgos/<id>`. */
    cuerpo(): RasgoCuerpo {
        const valores = this.form.getRawValue();
        return {
            rasgo: {
                nombre: `${valores.nombre ?? ''}`.trim(),
                descripcion: `${valores.descripcion ?? ''}`.trim(),
                oficial: valores.oficial === true,
            },
        };
    }

    private hidratar(rasgo: Rasgo): void {
        this.errores.limpiar();
        this.form.reset({ nombre: rasgo.Nombre ?? '', descripcion: rasgo.Descripcion ?? '', oficial: rasgo.Oficial === true },
            { emitEvent: false });
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.form.reset({ nombre: '', descripcion: '', oficial: true }, { emitEvent: false });
        this.edicion.olvidar();
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'rasgos');
    }
}
