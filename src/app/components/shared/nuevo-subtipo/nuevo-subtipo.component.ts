import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Dote } from 'src/app/interfaces/dote';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { SubtipoCuerpo, SubtipoDetalle } from 'src/app/interfaces/subtipo';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DoteService } from 'src/app/services/dote.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { UserService } from 'src/app/services/user.service';
import { nombreCombinacionAlineamiento } from 'src/app/services/utils/alineamiento-contrato';
import { opcionesDeExtrasDeDote } from 'src/app/services/utils/dote-mapper';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA, opcionDeHabilidad, opcionesDeExtrasDeHabilidad } from 'src/app/services/utils/habilidad-extra-visible';
import { CAMPOS_VELOCIDAD } from 'src/app/services/utils/movimientos-mapper';
import { SUBTIPO } from 'src/app/services/utils/nombres-de-catalogo';
import { toInt } from 'src/app/services/utils/normalizacion';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { CARACTERISTICAS_PLANTILLA } from 'src/app/services/utils/plantilla-formulario';
import {
    COMBATE_SUBTIPO, FilaDoteSubtipo, FilaHabilidadCustomSubtipo, FilaHabilidadSubtipo, FilaSortilegaSubtipo, ListasSubtipo, TEXTOS_SUBTIPO, ValoresSubtipo,
    cuerpoDeSubtipo, listasDeSubtipo, listasVaciasDeSubtipo, valoresDeSubtipo, valoresVaciosDeSubtipo,
} from 'src/app/services/utils/subtipo-formulario';
import { OpcionCatalogo, opcionesDeCatalogo, opcionesPorId } from '../catalogo-buscador/catalogo-buscador.component';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo, cargadorDeCatalogos } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario, entero } from '../insercion-marco/errores-de-formulario';
import { alternarControl, elegirEnControl, uidDeFila, vaciarControl } from '../insercion-marco/filas-repetibles';
import { FilaDeLista, anadirALista } from '../lista-de-catalogo/lista-de-catalogo.component';

type ListaDeIds = 'idiomas' | 'rasgos' | 'plantillas';
type ListaConFilas = 'dotes' | 'habilidades' | 'habilidades_custom' | 'sortilegas';

const PASOS = ['Identidad', 'Modificadores', 'Lo que da'];

/** Los campos con su etiqueta y su paso, para llevar el error de la API (`field` `subtipo.<clave>` o el de una lista). */
const CAMPOS: CamposDeFormulario = {
    nombre: { etiqueta: 'Nombre', paso: 0 },
    id_manual: { etiqueta: 'Manual', paso: 0 },
    pagina: { etiqueta: 'Página', paso: 0 },
    id_alineamiento: { etiqueta: 'Alineamiento', paso: 0 },
    descripcion: { etiqueta: 'Descripción', paso: 0 },
    ...Object.fromEntries(CARACTERISTICAS_PLANTILLA.flatMap((c) => [
        [c.modificador, { etiqueta: c.nombre, paso: 1 }], [c.minimo, { etiqueta: `${c.nombre} mínima`, paso: 1 }]])),
    ...Object.fromEntries(COMBATE_SUBTIPO.map((c) => [c.clave, { etiqueta: c.etiqueta, paso: 1 }])),
    ...Object.fromEntries(TEXTOS_SUBTIPO.map((c) => [c.clave, { etiqueta: c.etiqueta, paso: 1 }])),
    ...Object.fromEntries(CAMPOS_VELOCIDAD.map((c) => [c, { etiqueta: c, paso: 1 }])),
    id_maniobrabilidad: { etiqueta: 'Maniobrabilidad', paso: 1 },
    idiomas: { etiqueta: 'Idiomas', paso: 2 },
    rasgos: { etiqueta: 'Rasgos', paso: 2 },
    plantillas: { etiqueta: 'Plantillas', paso: 2 },
    dotes: { etiqueta: 'Dotes', paso: 2 },
    habilidades: { etiqueta: 'Habilidades', paso: 2 },
    habilidades_custom: { etiqueta: 'Habilidades personalizadas', paso: 2 },
    sortilegas: { etiqueta: 'Aptitudes sortílegas', paso: 2 },
};

/**
 * «Insertar/Modificar subtipo» (hito 9 del roadmap de inserciones), por pasos como la plantilla: **Identidad** (nombre,
 * manual, alineamiento, si se hereda y la descripción), **Modificadores** (características con su mínimo, combate, los
 * textos que modifica y el movimiento) y **Lo que da** (idiomas, rasgos, las plantillas que trae a las razas, dotes,
 * habilidades, habilidades personalizadas —con su «Nueva personalizada», como la raza y la racial— y aptitudes sortílegas).
 */
@Component({
    selector: 'app-nuevo-subtipo',
    templateUrl: './nuevo-subtipo.component.html',
    styleUrls: ['./nuevo-subtipo.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevoSubtipoComponent) }],
})
export class NuevoSubtipoComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idSubtipo: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() subtipoCreado = new EventEmitter<SubtipoDetalle>();
    @Output() subtipoActualizado = new EventEmitter<SubtipoDetalle>();

    private readonly destroy$ = new Subject<void>();
    readonly pasos = PASOS;
    readonly caracteristicas = CARACTERISTICAS_PLANTILLA;
    readonly combate = COMBATE_SUBTIPO;
    readonly textos = TEXTOS_SUBTIPO;
    readonly velocidades = CAMPOS_VELOCIDAD;
    readonly sinExtra = ID_EXTRA_HABILIDAD_SIN_EXTRA;
    pasoActual = 0;
    guardando = false;
    puedeCrear = false;

    manuales: OpcionCatalogo[] = [];
    alineamientos: OpcionCatalogo[] = [];
    maniobrabilidades: OpcionCatalogo[] = [];
    opciones: Record<ListaDeIds | ListaConFilas, OpcionCatalogo[]> = {
        idiomas: [], rasgos: [], plantillas: [], dotes: [], habilidades: [], habilidades_custom: [], sortilegas: [],
    };
    private dotes: Dote[] = [];
    private habilidades: HabilidadBasicaDetalle[] = [];
    listas: ListasSubtipo = listasVaciasDeSubtipo();
    /** «Nueva personalizada»: el modal de `<app-habilidad-custom-modal>`; la que crea se añade a la lista. */
    customModalAbierto = false;

    readonly form: FormGroup<Record<keyof ValoresSubtipo, FormControl>>;

    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS,
        raiz: 'subtipo',
        control: (campo) => (this.form.controls as Record<string, any>)[campo],
        firma: (campo) => JSON.stringify(campo in this.listas ? (this.listas as any)[campo]
            : (this.form.controls as Record<string, any>)[campo]?.value ?? null),
        irAPaso: (paso) => this.pasoActual = paso,
    });

    readonly edicion = new EdicionDeCatalogo<SubtipoDetalle>({
        nombre: SUBTIPO,
        modo: () => this.modo,
        id: () => this.idSubtipo,
        obtener: (id) => this.subtipoSvc.getSubtipoFresco(id),
        hidratar: (subtipo) => this.hidratar(subtipo),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, 'No se ha podido cargar el subtipo.'),
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private subtipoSvc: SubtipoService,
        private manualSvc: ManualService,
        private alineamientoSvc: AlineamientoService,
        private razaCatalogosSvc: RazaCatalogosService,
        private idiomaSvc: IdiomaService,
        private rasgoSvc: RasgoService,
        private plantillaSvc: PlantillaService,
        private doteSvc: DoteService,
        private habilidadSvc: HabilidadService,
        private conjuroSvc: ConjuroService,
    ) {
        const vacios = valoresVaciosDeSubtipo();
        const numeros = [...CARACTERISTICAS_PLANTILLA.flatMap((c) => [c.modificador, c.minimo]), ...COMBATE_SUBTIPO.map((c) => c.clave),
            ...CAMPOS_VELOCIDAD];
        const sinSigno = new Set<string>([...CARACTERISTICAS_PLANTILLA.map((c) => c.minimo), ...CAMPOS_VELOCIDAD]);
        this.form = this.fb.group({
            ...Object.fromEntries(numeros.map((clave) => [clave, new FormControl(vacios[clave],
                sinSigno.has(clave) ? [Validators.required, Validators.min(0), entero] : [Validators.required, entero])])),
            ...Object.fromEntries(TEXTOS_SUBTIPO.map(({ clave }) => [clave, new FormControl(vacios[clave], [Validators.maxLength(2000)])])),
            nombre: new FormControl(vacios.nombre, [Validators.required, Validators.maxLength(60)]),
            descripcion: new FormControl(vacios.descripcion, [Validators.maxLength(8000)]),
            id_manual: new FormControl(vacios.id_manual, [Validators.required, Validators.min(1)]),
            pagina: new FormControl(vacios.pagina, [Validators.required, Validators.min(0), entero]),
            heredada: new FormControl(vacios.heredada),
            al_cambiar_tipo: new FormControl(vacios.al_cambiar_tipo),
            conserva_constitucion: new FormControl(vacios.conserva_constitucion),
            id_maniobrabilidad: new FormControl(vacios.id_maniobrabilidad),
            id_alineamiento: new FormControl(vacios.id_alineamiento, [Validators.required]),
            oficial: new FormControl(vacios.oficial),
        } as Record<keyof ValoresSubtipo, FormControl>);
    }

    ngOnInit(): void {
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.errores.seguirCambios());
        this.cargarCatalogos();
        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modo'] || changes['idSubtipo'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    control(campo: string): FormControl {
        return (this.form.controls as Record<string, FormControl>)[campo];
    }

    alternar(campo: 'oficial' | 'heredada' | 'al_cambiar_tipo' | 'conserva_constitucion'): void {
        alternarControl(this.form.controls[campo]);
    }

    elegir(campo: 'id_manual' | 'id_alineamiento', id: number): void {
        elegirEnControl(this.form.controls[campo], id);
    }

    quitarManiobrabilidad(): void {
        vaciarControl(this.form.controls.id_maniobrabilidad);
    }

    // Las listas

    anadirId(lista: ListaDeIds, id: number): void {
        this.listas = { ...this.listas, [lista]: anadirALista(this.listas[lista], this.opciones[lista], id,
            (opcion) => ({ id: opcion.id, nombre: opcion.nombre })) };
        this.errores.seguirCambios();
    }

    quitarId(lista: ListaDeIds, fila: FilaDeLista): void {
        this.listas = { ...this.listas, [lista]: this.listas[lista].filter((elemento) => elemento.id !== fila.id) };
        this.errores.seguirCambios();
    }

    anadirFila(lista: ListaConFilas, id: number): void {
        const nueva = (opcion: OpcionCatalogo) => {
            const base = { uid: uidDeFila(`subtipo-${lista}`), id: opcion.id, nombre: opcion.nombre };
            if (lista === 'dotes')
                return { ...base, id_extra: -1 } as FilaDoteSubtipo;
            if (lista === 'habilidades')
                return { ...base, id_extra: ID_EXTRA_HABILIDAD_SIN_EXTRA, cantidad: 0, varios: '' } as FilaHabilidadSubtipo;
            if (lista === 'habilidades_custom')
                return { ...base, cantidad: 0 } as FilaHabilidadCustomSubtipo;
            return { ...base, nivel_lanzador: 1, usos_diarios: '' } as FilaSortilegaSubtipo;
        };
        // Una dote puede ir dos veces con extras distintos (la API rechaza la misma dote con el mismo extra).
        this.listas = { ...this.listas, [lista]: anadirALista(this.listas[lista] as readonly FilaDeLista[], this.opciones[lista], id, nueva, lista === 'dotes') };
        this.errores.seguirCambios();
    }

    quitarFila(lista: ListaConFilas, fila: FilaDeLista): void {
        this.listas = { ...this.listas, [lista]: (this.listas[lista] as readonly FilaDeLista[]).filter((item) => item.uid !== fila.uid) };
        this.errores.seguirCambios();
    }

    /** Tras cambiar un campo de una fila (el extra, la cantidad, los usos): la foto de «hay cambios» y el error. */
    alCambiarFila(): void {
        this.listas = { ...this.listas };
        this.errores.seguirCambios();
    }

    /** La personalizada que acaba de crear el modal: entra en las opciones (si la caché aún no la trae) y en la lista. */
    alCrearPersonalizada(habilidad: HabilidadBasicaDetalle): void {
        this.customModalAbierto = false;
        const opcion = opcionDeHabilidad(habilidad);
        if (opcion.id <= 0)
            return;
        if (!this.opciones.habilidades_custom.some((item) => item.id === opcion.id))
            this.opciones = { ...this.opciones, habilidades_custom: [...this.opciones.habilidades_custom, opcion] };
        this.anadirFila('habilidades_custom', opcion.id);
    }

    extrasDote(fila: FilaDeLista): OpcionCatalogo[] {
        return opcionesDeExtrasDeDote(this.dotes, fila.id);
    }

    extrasHabilidad(fila: FilaDeLista): OpcionCatalogo[] {
        return opcionesDeExtrasDeHabilidad(this.habilidades, fila.id).filter((extra) => extra.id > 0);
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
                ? await this.subtipoSvc.actualizarSubtipo(this.edicion.id, this.cuerpo())
                : await this.subtipoSvc.crearSubtipo(this.cuerpo());
            await avisarGuardado(SUBTIPO, editando, guardado.message);
            if (editando) {
                this.hidratar(guardado.entrada);
                this.subtipoActualizado.emit(guardado.entrada);
                this.cerrar.emit();
            } else {
                this.subtipoCreado.emit(guardado.entrada);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, 'No se ha podido guardar el subtipo.');
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST /subtipos/add` y `PUT /subtipos/<id>`. */
    cuerpo(): SubtipoCuerpo {
        return cuerpoDeSubtipo(this.form.getRawValue() as unknown as ValoresSubtipo, this.listas);
    }

    trackByUid(_: number, fila: { uid: string; }): string {
        return fila.uid;
    }

    private hidratar(subtipo: SubtipoDetalle): void {
        this.errores.limpiar();
        this.form.reset(valoresDeSubtipo(subtipo) as any, { emitEvent: false });
        this.listas = listasDeSubtipo(subtipo, () => uidDeFila('subtipo'));
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.form.reset(valoresVaciosDeSubtipo() as any, { emitEvent: false });
        this.listas = listasVaciasDeSubtipo();
        this.pasoActual = 0;
        this.edicion.olvidar();
    }

    private cargarCatalogos(): void {
        const cargar = cargadorDeCatalogos(this.destroy$);
        cargar(this.manualSvc.getManuales(), (manuales) => this.manuales = opcionesDeCatalogo(manuales as any[]));
        cargar(this.alineamientoSvc.getAlineamientosCombinacionesCatalogo(), (items) => this.alineamientos =
            opcionesDeCatalogo(items, (item) => ({ id: toInt(item?.Id), nombre: nombreCombinacionAlineamiento(item) })));
        cargar(this.razaCatalogosSvc.getManiobrabilidades(), (items) => this.maniobrabilidades =
            opcionesPorId(opcionesDeCatalogo((items as any[]).filter((item) => toInt(item?.Id) > 0))));
        const enOpciones = (lista: ListaDeIds | ListaConFilas, opciones: OpcionCatalogo[]) =>
            this.opciones = { ...this.opciones, [lista]: opciones.filter((opcion) => opcion.id > 0) };
        cargar(this.idiomaSvc.getIdiomas(), (items) => enOpciones('idiomas', opcionesDeCatalogo(items)));
        cargar(this.rasgoSvc.getRasgos(), (items) => enOpciones('rasgos', opcionesDeCatalogo(items)));
        cargar(this.plantillaSvc.getPlantillas(), (items) => enOpciones('plantillas', opcionesDeCatalogo(items)));
        cargar(this.conjuroSvc.getConjuros(), (items) => enOpciones('sortilegas', opcionesDeCatalogo(items)));
        cargar(this.doteSvc.getDotes(), (items) => {
            this.dotes = items ?? [];
            enOpciones('dotes', opcionesDeCatalogo(items));
        });
        cargar(this.habilidadSvc.getHabilidades(), (items) => {
            this.habilidades = items ?? [];
            enOpciones('habilidades', opcionesDeCatalogo(items, opcionDeHabilidad));
        });
        cargar(this.habilidadSvc.getHabilidadesCustom(), (items) => enOpciones('habilidades_custom', opcionesDeCatalogo(items, opcionDeHabilidad)));
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'subtipos');
    }
}
