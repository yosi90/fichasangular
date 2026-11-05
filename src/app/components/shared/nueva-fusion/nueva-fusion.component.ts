import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Chakra, Fusion, FusionCuerpo } from 'src/app/interfaces/incarnum';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroCatalogosService } from 'src/app/services/conjuro-catalogos.service';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { ManualService } from 'src/app/services/manual.service';
import { UserService } from 'src/app/services/user.service';
import {
    EFECTOS_SALVACION_FUSION, FilaChakraFusion, ProblemaDeFusion, SALVACIONES_FUSION, ValoresFusion, cuerpoDeFusion,
    filasDeChakrasDeFusion, problemaDeFusion, valoresDeFusion, valoresVaciosDeFusion,
} from 'src/app/services/utils/incarnum-formulario';
import { FUSION } from 'src/app/services/utils/nombres-de-catalogo';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { OpcionCatalogo, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo, cargadorDeCatalogos } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario, entero } from '../insercion-marco/errores-de-formulario';
import { FilaNombrada, alternarControl, elegirEnControl } from '../insercion-marco/filas-repetibles';

/** Los campos con su etiqueta, para llevar el error de la API (`field` `fusion.<clave>`, `chakras[0]`, `clases[1]`…). */
const CAMPOS: CamposDeFormulario = Object.fromEntries(([
    ['nombre', 'Nombre'], ['nombre_original', 'Nombre original'], ['id_manual', 'Manual'], ['pagina', 'Página'],
    ['descripcion', 'Descripción'], ['efecto_basico', 'Efecto básico'], ['efecto_esencia', 'Efecto de la esencia'],
    ['origen_descripcion', 'Origen de la descripción'], ['salvacion', 'Salvación'], ['chakras', 'Chakras'],
    ['clases', 'Clases'], ['descriptores', 'Descriptores'],
] as const).map(([clave, etiqueta]) => [clave, { etiqueta, paso: 0 }]));

let contadorFilas = 0;

/**
 * «Insertar/Modificar fusión» (hito 8 del roadmap de inserciones; contrato en `docs/publica/INCARNUM.md`): la fusión
 * del alma con sus textos, su salvación, los chakras donde se moldea y se vincula, las clases en cuya lista está y sus
 * descriptores. Sin pasos: tarjetas, como la dote. Los datos de juego (`Datos_*`, en inglés, del importador) no se editan
 * aquí: la API los conserva y la tarjeta lo dice.
 */
@Component({
    selector: 'app-nueva-fusion',
    templateUrl: './nueva-fusion.component.html',
    styleUrls: ['./nueva-fusion.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevaFusionComponent) }],
})
export class NuevaFusionComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idFusion: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() fusionCreada = new EventEmitter<Fusion>();
    @Output() fusionActualizada = new EventEmitter<Fusion>();

    private readonly destroy$ = new Subject<void>();
    readonly salvaciones = SALVACIONES_FUSION;
    readonly efectosSalvacion = EFECTOS_SALVACION_FUSION;
    guardando = false;
    puedeCrear = false;

    manuales: OpcionCatalogo[] = [];
    /** Las clases que moldean (las que tienen `Moldeado`): las que tienen lista de fusiones. */
    clasesOpciones: OpcionCatalogo[] = [];
    descriptoresOpciones: OpcionCatalogo[] = [];
    chakrasOpciones: Chakra[] = [];

    clases: FilaNombrada[] = [];
    descriptores: FilaNombrada[] = [];
    chakras: FilaChakraFusion[] = [];
    problema: ProblemaDeFusion | null = null;

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(100)]],
        nombre_original: ['', [Validators.maxLength(100)]],
        traducido: [false],
        descripcion: ['', [Validators.maxLength(8000)]],
        efecto_basico: ['', [Validators.maxLength(8000)]],
        efecto_esencia: ['', [Validators.maxLength(8000)]],
        origen_descripcion: ['propia'],
        salvacion_tipo: [null as string | null],
        salvacion_efecto: [null as string | null],
        alineado_portador: [false],
        id_manual: [null as number | null, [Validators.required, Validators.min(1)]],
        pagina: [null as number | null, [Validators.required, Validators.min(0), entero]],
        oficial: [true],
    });

    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS,
        raiz: 'fusion',
        control: (campo) => (this.form.controls as Record<string, any>)[campo],
        firma: (campo) => campo === 'chakras' || campo === 'clases' || campo === 'descriptores'
            ? JSON.stringify(this.cuerpo()[campo])
            : JSON.stringify((this.form.controls as Record<string, any>)[campo]?.value ?? null),
        irAPaso: () => undefined,
    });

    readonly edicion = new EdicionDeCatalogo<Fusion>({
        nombre: FUSION,
        modo: () => this.modo,
        id: () => this.idFusion,
        obtener: (id) => this.incarnumSvc.getFusionFresca(id),
        hidratar: (fusion) => this.hidratar(fusion),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, 'No se ha podido cargar la fusión.'),
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private incarnumSvc: IncarnumService,
        private manualSvc: ManualService,
        private claseSvc: ClaseService,
        private conjuroCatalogosSvc: ConjuroCatalogosService,
    ) { }

    ngOnInit(): void {
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.alCambiar());
        this.cargarCatalogos();
        if (!this.edicion.editando && this.chakras.length < 1)
            this.chakras = [this.filaChakraVacia()];
        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idFusion'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    alternar(campo: 'oficial' | 'traducido' | 'alineado_portador'): void {
        alternarControl(this.form.controls[campo]);
    }

    elegirManual(id: number): void {
        elegirEnControl(this.form.controls.id_manual, id);
    }

    // --- Chakras -------------------------------------------------------------------------------------------------------

    anadirChakra(): void {
        this.chakras = [...this.chakras, this.filaChakraVacia()];
        this.alCambiar();
    }

    quitarChakra(uid: string): void {
        this.chakras = this.chakras.filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    alternarChakra(fila: FilaChakraFusion, campo: 'ocupa' | 'vinculo'): void {
        fila[campo] = !fila[campo];
        if (campo === 'vinculo' && !fila.vinculo)
            fila.efecto_vinculo = '';
        this.alCambiar();
    }

    /** Los chakras que se pueden elegir en una fila: los que no están ya en otra. */
    chakrasLibres(fila: FilaChakraFusion): Chakra[] {
        const usados = new Set(this.chakras.filter((otra) => otra.uid !== fila.uid).map((otra) => otra.id_chakra));
        return this.chakrasOpciones.filter((chakra) => !usados.has(chakra.Id) || chakra.Id === fila.id_chakra);
    }

    // --- Clases y descriptores -----------------------------------------------------------------------------------------

    idsDe(lista: 'clases' | 'descriptores'): number[] {
        return this[lista].map((fila) => fila.id);
    }

    anadir(lista: 'clases' | 'descriptores', id: number): void {
        const opciones = lista === 'clases' ? this.clasesOpciones : this.descriptoresOpciones;
        const opcion = opciones.find((item) => item.id === id);
        if (!opcion || this.idsDe(lista).includes(id))
            return;
        this[lista] = [...this[lista], { uid: this.uid(), id, nombre: opcion.nombre }];
        this.alCambiar();
    }

    quitar(lista: 'clases' | 'descriptores', uid: string): void {
        this[lista] = this[lista].filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    trackByUid(_indice: number, fila: { uid: string; }): string {
        return fila.uid;
    }

    alCambiar(): void {
        this.errores.seguirCambios();
        if (this.problema)
            this.problema = problemaDeFusion(this.chakras);
    }

    /** El aviso de una lista (chakras, clases, descriptores): la regla comprobada aquí o la de la API. */
    avisoDe(campo: 'chakras' | 'clases' | 'descriptores'): string | null {
        if (this.problema?.campo === campo && this.problema.uid === null)
            return this.problema.mensaje;
        return this.errores.mensajeDe(campo);
    }

    avisoDeFila(fila: FilaChakraFusion): string | null {
        return this.problema?.uid === fila.uid ? this.problema.mensaje : null;
    }

    async guardar(): Promise<void> {
        if (!this.puedeCrear) {
            await avisarSinPermisos(this.userSvc.getPermissionDeniedMessage());
            return;
        }
        this.form.markAllAsTouched();
        this.problema = problemaDeFusion(this.chakras);
        if (this.form.invalid || this.problema) {
            this.errores.irAlPrimerError();
            return;
        }
        this.errores.limpiar();
        this.guardando = true;
        try {
            const editando = this.edicion.editando;
            const guardada = await this.incarnumSvc.guardarFusion(this.cuerpo(), editando ? this.edicion.id : null);
            await avisarGuardado(FUSION, editando, guardada.message);
            if (editando) {
                this.hidratar(guardada.fusion);
                this.fusionActualizada.emit(guardada.fusion);
                this.cerrar.emit();
            } else {
                this.fusionCreada.emit(guardada.fusion);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, 'No se ha podido guardar la fusión.');
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST /incarnum/fusiones/add` y `PUT /incarnum/fusiones/<id>`. */
    cuerpo(): FusionCuerpo {
        return cuerpoDeFusion(this.form.getRawValue() as unknown as ValoresFusion, this.idsDe('clases'),
            this.idsDe('descriptores'), this.chakras);
    }

    private hidratar(fusion: Fusion): void {
        this.problema = null;
        this.errores.limpiar();
        this.form.reset(valoresDeFusion(fusion) as any, { emitEvent: false });
        this.clases = (fusion.Clases ?? []).map((clase) => ({ uid: this.uid(), id: clase.Id, nombre: clase.Nombre }));
        this.descriptores = (fusion.Descriptores ?? []).map((d) => ({ uid: this.uid(), id: d.Id, nombre: d.Nombre }));
        this.chakras = filasDeChakrasDeFusion(fusion, () => this.uid());
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.problema = null;
        this.clases = [];
        this.descriptores = [];
        this.chakras = [this.filaChakraVacia()];
        this.form.reset(valoresVaciosDeFusion() as any, { emitEvent: false });
        this.edicion.olvidar();
    }

    private filaChakraVacia(): FilaChakraFusion {
        return { uid: this.uid(), id_chakra: null, ocupa: true, vinculo: true, efecto_vinculo: '' };
    }

    private cargarCatalogos(): void {
        const cargar = cargadorDeCatalogos(this.destroy$);
        cargar(this.manualSvc.getManuales(), (manuales) => this.manuales = opcionesDeCatalogo(manuales as any[]));
        cargar(this.claseSvc.getClases(), (clases) => this.clasesOpciones = opcionesDeCatalogo(clases.filter((c) => !!c.Moldeado)));
        cargar(this.conjuroCatalogosSvc.getDescriptores(), (descriptores) => this.descriptoresOpciones = opcionesDeCatalogo(descriptores));
        cargar(this.incarnumSvc.getChakras(), (chakras) => this.chakrasOpciones = chakras);
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'fusiones del alma');
    }

    private uid(): string {
        contadorFilas += 1;
        return `fusion-fila-${contadorFilas}`;
    }
}
