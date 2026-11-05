import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MANUAL_SECCIONES_CONFIG, ManualIncludeFlag } from 'src/app/config/manual-secciones.config';
import { BanderasManual, Manual, ManualCuerpo } from 'src/app/interfaces/manual';
import { ManualService } from 'src/app/services/manual.service';
import { UserService } from 'src/app/services/user.service';
import { MANUAL } from 'src/app/services/utils/nombres-de-catalogo';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario } from '../insercion-marco/errores-de-formulario';
import { alternarControl } from '../insercion-marco/filas-repetibles';

/** Las banderas de contenido, en el orden de las secciones del detalle del manual (con su nombre). */
const BANDERAS = MANUAL_SECCIONES_CONFIG.map((seccion) => ({ clave: seccion.includeFlag, etiqueta: seccion.label }));

/** Los campos con su etiqueta, para llevar el error de la API a su control. Sin pasos. */
const CAMPOS: CamposDeFormulario = { nombre: { etiqueta: 'Nombre', paso: 0 }, oficial: { etiqueta: 'Oficial', paso: 0 } };

/**
 * «Insertar/Modificar manual» (hito 9 del roadmap de inserciones): una inserción pequeña, en el marco sin tarjetas, como el
 * idioma. Al crear, el nombre, si es oficial y qué trae (las banderas `Incluye_*`, las secciones de su detalle). Al
 * modificar solo cambian las banderas (`PATCH /manuales/<id>`): el nombre y si es oficial los copia todo lo que cita el
 * manual y no se editan (decisión del hito 9, en el roadmap).
 */
@Component({
    selector: 'app-nuevo-manual',
    templateUrl: './nuevo-manual.component.html',
    styleUrls: ['./nuevo-manual.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevoManualComponent) }],
})
export class NuevoManualComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idManual: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() manualCreado = new EventEmitter<Manual>();
    @Output() manualActualizado = new EventEmitter<Manual>();

    private readonly destroy$ = new Subject<void>();
    readonly banderas = BANDERAS;
    guardando = false;
    puedeCrear = false;

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(50)]],
        oficial: [true],
        ...Object.fromEntries(BANDERAS.map((bandera) => [bandera.clave, [false]])) as Record<ManualIncludeFlag, [boolean]>,
    });

    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS,
        raiz: null,
        control: (campo) => (this.form.controls as Record<string, any>)[campo],
        firma: (campo) => JSON.stringify((this.form.controls as Record<string, any>)[campo]?.value ?? null),
        irAPaso: () => undefined,
    });

    readonly edicion = new EdicionDeCatalogo<Manual>({
        nombre: MANUAL,
        modo: () => this.modo,
        id: () => this.idManual,
        obtener: (id) => this.manualSvc.getManualFresco(id),
        hidratar: (manual) => this.hidratar(manual),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, 'No se ha podido cargar el manual.'),
    });

    constructor(private fb: FormBuilder, private userSvc: UserService, private manualSvc: ManualService) { }

    ngOnInit(): void {
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.errores.seguirCambios());
        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idManual'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    marcada(control: ManualIncludeFlag | 'oficial'): boolean {
        return this.form.controls[control].value === true;
    }

    /** El chip Oficial, solo al crear: al modificar no se cambia. */
    alternar(control: ManualIncludeFlag | 'oficial'): void {
        if (control === 'oficial' && this.edicion.editando)
            return;
        alternarControl(this.form.controls[control]);
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
            if (this.edicion.editando) {
                const manual = await this.manualSvc.actualizarBanderasManual(this.edicion.id, this.banderasDelFormulario());
                await avisarGuardado(MANUAL, true, null);
                this.hidratar(manual);
                this.manualActualizado.emit(manual);
                this.cerrar.emit();
            } else {
                const guardado = await this.manualSvc.crearManual(this.cuerpo());
                await avisarGuardado(MANUAL, false, guardado.message);
                this.manualCreado.emit(guardado.entrada);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, 'No se ha podido guardar el manual.');
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST /manuales/add` (al modificar se mandan solo sus banderas, `banderasDelFormulario`). */
    cuerpo(): ManualCuerpo {
        const valores = this.form.getRawValue();
        return { nombre: `${valores.nombre ?? ''}`.trim(), oficial: valores.oficial === true, ...this.banderasDelFormulario() };
    }

    /** El cuerpo de `PATCH /manuales/<id>`: las ocho banderas de contenido. */
    banderasDelFormulario(): BanderasManual {
        return Object.fromEntries(BANDERAS.map((bandera) => [bandera.clave, this.marcada(bandera.clave)])) as unknown as BanderasManual;
    }

    private hidratar(manual: Manual): void {
        this.errores.limpiar();
        this.form.reset({
            nombre: manual.Nombre ?? '',
            oficial: manual.Oficial === true,
            ...Object.fromEntries(BANDERAS.map((bandera) => [bandera.clave, manual[bandera.clave] === true])),
        } as any, { emitEvent: false });
        // Al modificar, el nombre no se cambia (el chip Oficial tampoco: `alternar`).
        this.form.controls.nombre.disable({ emitEvent: false });
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.form.reset({ nombre: '', oficial: true, ...Object.fromEntries(BANDERAS.map((bandera) => [bandera.clave, false])) } as any,
            { emitEvent: false });
        this.form.controls.nombre.enable({ emitEvent: false });
        this.edicion.olvidar();
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'manuales');
    }
}
