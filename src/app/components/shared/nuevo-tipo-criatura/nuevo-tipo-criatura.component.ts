import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TipoCriaturaCuerpo, TipoCriaturaEditable } from 'src/app/interfaces/tipo_criatura';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ManualService } from 'src/app/services/manual.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { UserService } from 'src/app/services/user.service';
import { nombreCombinacionAlineamiento } from 'src/app/services/utils/alineamiento-contrato';
import { TIPO_CRIATURA } from 'src/app/services/utils/nombres-de-catalogo';
import { toInt } from 'src/app/services/utils/normalizacion';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import {
    BANDERAS_TIPO_CRIATURA, BanderaTipoCriatura, ValoresTipoCriatura, cuerpoDeTipoCriatura, valoresDeTipoCriatura,
    valoresVaciosDeTipoCriatura,
} from 'src/app/services/utils/tipo-criatura-formulario';
import { OpcionCatalogo, opcionesDeCatalogo, opcionesPorId } from '../catalogo-buscador/catalogo-buscador.component';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo, cargadorDeCatalogos } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, camposSinPasos, entero, ErroresDeFormulario } from '../insercion-marco/errores-de-formulario';
import { alternarControl, elegirEnControl } from '../insercion-marco/filas-repetibles';
import { FilaDeLista, anadirALista, filasDeIds } from '../lista-de-catalogo/lista-de-catalogo.component';

/** Los campos con su etiqueta, para llevar el error de la API (`field` `tipo.<clave>` o `rasgos[i]`). Sin pasos. */
const CAMPOS: CamposDeFormulario = camposSinPasos([
    ['nombre', 'Nombre'], ['id_manual', 'Manual'], ['pagina', 'Página'], ['id_alineamiento', 'Alineamiento'],
    ['tesoro', 'Tesoro'], ['id_tipo_dado', 'Dado de golpe'], ['id_puntos_habilidad', 'Puntos de habilidad'],
    ['id_ataque', 'Ataque base'], ['id_fortaleza', 'Fortaleza'], ['id_reflejos', 'Reflejos'], ['id_voluntad', 'Voluntad'],
    ['limite_inteligencia', 'Límite de Inteligencia'], ['descripcion', 'Descripción'], ['rasgos', 'Rasgos'],
]);

/**
 * «Insertar/Modificar tipo de criatura» (hito 9 del roadmap de inserciones): los datos del tipo, su progresión (dado de
 * golpe, puntos de habilidad, ataque base y salvaciones), lo que sabe su naturaleza (si come, respira, duerme…), sus
 * rasgos y su descripción. Sin pasos: tarjetas, como la ventaja y el equipo.
 */
@Component({
    selector: 'app-nuevo-tipo-criatura',
    templateUrl: './nuevo-tipo-criatura.component.html',
    styleUrls: ['./nuevo-tipo-criatura.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevoTipoCriaturaComponent) }],
})
export class NuevoTipoCriaturaComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idTipo: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() tipoCreado = new EventEmitter<TipoCriaturaEditable>();
    @Output() tipoActualizado = new EventEmitter<TipoCriaturaEditable>();

    private readonly destroy$ = new Subject<void>();
    readonly banderas = BANDERAS_TIPO_CRIATURA;
    guardando = false;
    puedeCrear = false;

    manuales: OpcionCatalogo[] = [];
    alineamientos: OpcionCatalogo[] = [];
    tiposDado: OpcionCatalogo[] = [];
    ataques: OpcionCatalogo[] = [];
    salvaciones: OpcionCatalogo[] = [];
    puntosHabilidad: OpcionCatalogo[] = [];
    rasgosOpciones: OpcionCatalogo[] = [];
    rasgos: FilaDeLista[] = [];

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(150)]],
        descripcion: ['', [Validators.maxLength(8000)]],
        id_manual: [null as number | null, [Validators.required, Validators.min(1)]],
        pagina: [null as number | null, [Validators.required, Validators.min(0), Validators.max(999), entero]],
        id_alineamiento: [null as number | null, [Validators.required]],
        tesoro: ['', [Validators.maxLength(800)]],
        id_tipo_dado: [null as number | null, [Validators.required]],
        id_puntos_habilidad: [null as number | null, [Validators.required]],
        id_ataque: [null as number | null, [Validators.required]],
        id_fortaleza: [null as number | null, [Validators.required]],
        id_reflejos: [null as number | null, [Validators.required]],
        id_voluntad: [null as number | null, [Validators.required]],
        limite_inteligencia: [-1 as number | null, [Validators.required, Validators.min(-1), Validators.max(99), entero]],
        come: [true], respira: [true], duerme: [true], criticos: [true], flanqueado: [true], pierde_cons: [false],
        oficial: [true],
    });

    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS,
        raiz: 'tipo',
        control: (campo) => (this.form.controls as Record<string, any>)[campo],
        firma: (campo) => JSON.stringify(campo === 'rasgos' ? this.rasgos.map((fila) => fila.id)
            : (this.form.controls as Record<string, any>)[campo]?.value ?? null),
        irAPaso: () => undefined,
    });

    readonly edicion = new EdicionDeCatalogo<TipoCriaturaEditable>({
        nombre: TIPO_CRIATURA,
        modo: () => this.modo,
        id: () => this.idTipo,
        obtener: (id) => this.tipoSvc.getTipoCriaturaFresco(id),
        hidratar: (tipo) => this.hidratar(tipo),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, 'No se ha podido cargar el tipo de criatura.'),
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private tipoSvc: TipoCriaturaService,
        private manualSvc: ManualService,
        private alineamientoSvc: AlineamientoService,
        private razaCatalogosSvc: RazaCatalogosService,
        private claseSvc: ClaseService,
        private rasgoSvc: RasgoService,
    ) { }

    ngOnInit(): void {
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.errores.seguirCambios());
        this.cargarCatalogos();
        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idTipo'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    alternar(control: BanderaTipoCriatura | 'oficial'): void {
        alternarControl(this.form.controls[control]);
    }

    marcada(control: BanderaTipoCriatura | 'oficial'): boolean {
        return this.form.controls[control].value === true;
    }

    elegir(campo: 'id_manual' | 'id_alineamiento', id: number): void {
        elegirEnControl(this.form.controls[campo], id);
    }

    anadirRasgo(id: number): void {
        this.rasgos = anadirALista(this.rasgos, this.rasgosOpciones, id, (opcion) => ({ id: opcion.id, nombre: opcion.nombre }));
        this.errores.seguirCambios();
    }

    quitarRasgo(fila: FilaDeLista): void {
        this.rasgos = this.rasgos.filter((rasgo) => rasgo.id !== fila.id);
        this.errores.seguirCambios();
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
                ? await this.tipoSvc.actualizarTipoCriatura(this.edicion.id, this.cuerpo())
                : await this.tipoSvc.crearTipoCriatura(this.cuerpo());
            await avisarGuardado(TIPO_CRIATURA, editando, guardado.message);
            if (editando) {
                this.hidratar(guardado.entrada);
                this.tipoActualizado.emit(guardado.entrada);
                this.cerrar.emit();
            } else {
                this.tipoCreado.emit(guardado.entrada);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, 'No se ha podido guardar el tipo de criatura.');
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST /tiposCriatura/add` y `PUT /tiposCriatura/<id>`. */
    cuerpo(): TipoCriaturaCuerpo {
        return cuerpoDeTipoCriatura(this.form.getRawValue() as unknown as ValoresTipoCriatura, this.rasgos.map((fila) => fila.id));
    }

    private hidratar(tipo: TipoCriaturaEditable): void {
        this.errores.limpiar();
        this.form.reset(valoresDeTipoCriatura(tipo) as any, { emitEvent: false });
        this.rasgos = filasDeIds(tipo.Rasgos);
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.form.reset(valoresVaciosDeTipoCriatura() as any, { emitEvent: false });
        this.rasgos = [];
        this.edicion.olvidar();
    }

    private cargarCatalogos(): void {
        const cargar = cargadorDeCatalogos(this.destroy$);
        cargar(this.manualSvc.getManuales(), (manuales) => this.manuales = opcionesDeCatalogo(manuales as any[]));
        cargar(this.alineamientoSvc.getAlineamientosCombinacionesCatalogo(), (items) => this.alineamientos =
            opcionesDeCatalogo(items, (item) => ({ id: toInt(item?.Id), nombre: nombreCombinacionAlineamiento(item) })));
        cargar(this.razaCatalogosSvc.getTiposDado(), (tipos) => this.tiposDado = opcionesDeCatalogo(
            (tipos as any[]).filter((tipo) => toInt(tipo?.Id) > 0)));
        cargar(this.claseSvc.getCatalogosProgresion(), (catalogos) => {
            this.ataques = opcionesDeCatalogo(catalogos.ataques_base);
            this.salvaciones = opcionesDeCatalogo(catalogos.salvaciones);
            // Los puntos por DG se enseñan por su valor (2, 4, 6 u 8), de menor a mayor.
            this.puntosHabilidad = opcionesPorId(catalogos.puntos_habilidad
                .map((punto) => ({ id: toInt(punto.Id), nombre: `${punto.Valor} + Int por DG` })));
        });
        cargar(this.rasgoSvc.getRasgos(), (rasgos) => this.rasgosOpciones = opcionesDeCatalogo(rasgos.filter((rasgo) => rasgo.Id > 0)));
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'tipos de criatura');
    }
}
