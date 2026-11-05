import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, map, takeUntil } from 'rxjs';
import { ConjuntoObjetosDetalle, EquipoCatalogos, EquipoRef, ObjetoDetalle } from 'src/app/interfaces/equipo';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { ManualService } from 'src/app/services/manual.service';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { UserService } from 'src/app/services/user.service';
import { ElementoDeCatalogo } from 'src/app/services/utils/error-catalogo';
import { TipoRol } from 'src/app/services/utils/iconos-rol';
import { CONJUNTO_OBJETOS, OBJETO } from 'src/app/services/utils/nombres-de-catalogo';
import {
    FilaActivacion,
    FilaBonificacion,
    FilasDeObjeto,
    ProblemaDeObjeto,
    TipoObjetoEditable,
    ValoresObjeto,
    cuerpoDeConjunto,
    cuerpoDeObjeto,
    filasDeConjunto,
    filasDeObjeto,
    filasDeObjetoVacias,
    problemaDeConjunto,
    problemaDeObjeto,
    valoresDeConjunto,
    valoresDeObjeto,
    valoresObjetoVacios,
} from 'src/app/services/utils/objeto-formulario';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { OpcionCatalogo, nombreDeOpcion, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario, OpcionesErroresDeFormulario } from '../insercion-marco/errores-de-formulario';
import { alternarControl, elegirEnControl } from '../insercion-marco/filas-repetibles';
import { cargarCatalogo } from '../insercion-marco/cargar-catalogo';

type EntradaObjeto = ObjetoDetalle | ConjuntoObjetosDetalle;

interface DefinicionTipo {
    etiqueta: string;
    listado: string;
    icono: TipoRol;
    raiz: string;
    elemento: ElementoDeCatalogo;
    pasos: readonly string[];
}

const TIPOS: Readonly<Record<TipoObjetoEditable, DefinicionTipo>> = {
    objeto: { etiqueta: 'Objeto', listado: 'objetos', icono: 'objeto', raiz: 'objeto', elemento: OBJETO, pasos: ['Objeto', 'Magia', 'Específica y genérico'] },
    conjunto: { etiqueta: 'Conjunto de objetos', listado: 'conjuntos de objetos', icono: 'conjunto', raiz: 'conjunto', elemento: CONJUNTO_OBJETOS, pasos: [] },
};

/** Los campos con su etiqueta y su paso (el del objeto), para llevar el error de la API (`objeto.precio`…) a su sitio. */
const CAMPOS: CamposDeFormulario = Object.fromEntries(([
    ['nombre', 'Nombre', 0], ['id_manual', 'Manual', 0], ['pagina', 'Página', 0], ['descripcion', 'Descripción', 0],
    ['origen_descripcion', 'Origen de la descripción', 0], ['nombre_original', 'Nombre original', 0],
    ['id_tipo_objeto', 'Tipo', 0], ['precio', 'Precio', 0], ['nivel_objeto', 'Nivel del objeto', 0], ['peso', 'Peso', 0],
    ['id_ranura', 'Ranura', 0], ['requisitos_uso', 'Requisitos de uso', 0], ['id_conjunto', 'Conjunto', 0],
    ['id_monstruo', 'Montura', 0], ['nivel_lanzador', 'Nivel de lanzador', 1], ['id_intensidad_aura', 'Aura', 1],
    ['cargas', 'Cargas', 1], ['usos_por_dia', 'Usos al día', 1], ['activaciones', 'Activaciones', 1], ['conjuros', 'Conjuros', 1],
    ['coste_creacion_po', 'Coste de creación', 1], ['coste_creacion_px', 'PX de creación', 1], ['dias_creacion', 'Días de creación', 1],
    ['requisitos_otros', 'Otros requisitos', 1], ['aura_escuelas', 'Escuelas del aura', 1], ['requisitos', 'Requisitos', 1],
    ['modificadores', 'Modificadores', 1], ['id_arma_base', 'Arma base', 2], ['id_armadura_base', 'Armadura base', 2],
    ['bonificador_mejora', 'Mejora', 2], ['bonificador_mejora_2', 'Mejora de la segunda cabeza', 2], ['id_material', 'Material', 2],
    ['encantamientos', 'Aptitudes especiales', 2], ['precio_por_nivel_conjuro', 'Precio por nivel', 2],
    ['nivel_conjuro_maximo', 'Nivel de conjuro máximo', 2], ['usos_componente_caro', 'Componente caro', 2],
    ['piezas', 'Piezas', 0], ['bonificaciones', 'Bonificaciones', 0],
] as const).map(([clave, etiqueta, paso]) => [clave, { etiqueta, paso }]));

let contadorFilas = 0;

/**
 * «Insertar/Modificar objeto» y «… conjunto de objetos» (segunda parte del hito 7 del roadmap de inserciones; guía de
 * inserciones, «El equipo»): una pantalla para los dos, que comparten el nombre, el manual y la descripción. El objeto
 * va por pasos (objeto, magia, y la base de las armas y armaduras específicas o la fórmula de los genéricos de un
 * conjuro); el conjunto, sin pasos (sus piezas, que se buscan en la API, y sus bonificaciones). Sigue la receta: el marco
 * común, `EdicionDeCatalogo`, `ErroresDeFormulario`, `<app-catalogo-buscador>` y `<app-equipo-magia>`.
 */
@Component({
    selector: 'app-nuevo-objeto',
    templateUrl: './nuevo-objeto.component.html',
    styleUrls: ['./nuevo-objeto.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevoObjetoComponent) }],
})
export class NuevoObjetoComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() tipo: TipoObjetoEditable = 'objeto';
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idEntrada: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() objetoCreado = new EventEmitter<EntradaObjeto>();
    @Output() objetoActualizado = new EventEmitter<EntradaObjeto>();

    private readonly destroy$ = new Subject<void>();
    private readonly busquedaPiezas$ = new Subject<string>();
    guardando = false;
    puedeCrear = false;
    pasoActual = 0;
    private cargada: EntradaObjeto | null = null;

    manuales: OpcionCatalogo[] = [];
    catalogos: EquipoCatalogos | null = null;
    conjuntos: EquipoRef[] = [];
    monstruos: OpcionCatalogo[] = [];
    armas: OpcionCatalogo[] = [];
    armaduras: OpcionCatalogo[] = [];
    materiales: OpcionCatalogo[] = [];
    aptitudes: OpcionCatalogo[] = [];
    conjurosOpciones: OpcionCatalogo[] = [];
    /** Lo que devuelve la búsqueda de objetos para añadir una pieza al conjunto. */
    piezasEncontradas: EquipoRef[] = [];
    textoPieza = '';
    filas: FilasDeObjeto = filasDeObjetoVacias();
    problema: ProblemaDeObjeto | null = null;

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(150)]],
        descripcion: ['', [Validators.maxLength(8000)]],
        origen_descripcion: ['propia'],
        nombre_original: ['', [Validators.maxLength(150)]],
        traducido: [false],
        id_manual: [null as number | null, [Validators.required, Validators.min(1)]],
        pagina: [null as number | null, [Validators.required, Validators.min(0)]],
        oficial: [true],
        id_tipo_objeto: [null as number | null],
        precio: [null as number | null, [Validators.min(0)]],
        nivel_objeto: [null as number | null, [Validators.min(0), Validators.max(255)]],
        peso: [null as number | null, [Validators.min(0)]],
        id_ranura: [null as number | null],
        nivel_lanzador: [null as number | null, [Validators.min(0), Validators.max(255)]],
        id_intensidad_aura: [null as number | null],
        cargas: [null as number | null, [Validators.min(0), Validators.max(32767)]],
        usos_por_dia: [null as number | null, [Validators.min(0), Validators.max(255)]],
        maldito: [false],
        inteligente: [false],
        es_reliquia: [false],
        requisitos_uso: ['', [Validators.maxLength(500)]],
        coste_creacion_po: [null as number | null, [Validators.min(0)]],
        coste_creacion_px: [null as number | null, [Validators.min(0)]],
        dias_creacion: [null as number | null, [Validators.min(0), Validators.max(32767)]],
        requisitos_otros: ['', [Validators.maxLength(500)]],
        id_conjunto: [null as number | null],
        id_monstruo: [null as number | null],
        es_generico_conjuro: [false],
        precio_por_nivel_conjuro: [null as number | null, [Validators.min(0)]],
        nivel_conjuro_maximo: [null as number | null, [Validators.min(0), Validators.max(9)]],
        usos_componente_caro: [null as number | null, [Validators.min(0)]],
        id_arma_base: [null as number | null],
        id_armadura_base: [null as number | null],
        bonificador_mejora: [null as number | null, [Validators.min(0), Validators.max(10)]],
        bonificador_mejora_2: [null as number | null, [Validators.min(0), Validators.max(10)]],
        id_material: [null as number | null],
    });

    readonly errores = new ErroresDeFormulario(this.opcionesDeErrores());

    readonly edicion = new EdicionDeCatalogo<EntradaObjeto>({
        nombre: this.nombreDelTipo(),
        modo: () => this.modo,
        id: () => this.idEntrada,
        obtener: (id) => this.tipo === 'objeto' ? this.equipoSvc.getObjeto(id) : this.equipoSvc.getConjuntoFresco(id),
        hidratar: (entrada) => this.hidratar(entrada),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, `No se ha podido cargar ${this.articulo()}.`),
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private equipoSvc: EquipoService,
        private manualSvc: ManualService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private monstruoSvc: MonstruoService,
        private conjuroSvc: ConjuroService,
    ) { }

    ngOnInit(): void {
        this.aplicarValidadoresDelTipo();
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.cargarCatalogos();
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.alCambiar());
        this.busquedaPiezas$.pipe(
            debounceTime(250),
            map((texto) => texto.trim()),
            distinctUntilChanged(),
            switchMap((texto) => texto.length < 2
                ? of([] as EquipoRef[])
                : this.equipoSvc.getObjetos({ q: texto, limit: 20 }).pipe(
                    map((pagina) => pagina.items.map((objeto) => ({ Id: objeto.Id, Nombre: objeto.Nombre }))),
                    catchError(() => of([] as EquipoRef[])))),
            takeUntil(this.destroy$),
        ).subscribe((encontradas) => this.piezasEncontradas = encontradas);
        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['tipo'] && !changes['tipo'].firstChange)
            this.aplicarValidadoresDelTipo();
        if (changes['modo'] || changes['idEntrada'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get definicion(): DefinicionTipo {
        return TIPOS[this.tipo];
    }

    get esObjeto(): boolean {
        return this.tipo === 'objeto';
    }

    get puedeGuardar(): boolean {
        return this.puedeCrear;
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    get esGenerico(): boolean {
        return this.form.controls.es_generico_conjuro.value === true;
    }

    get conArmaBase(): boolean {
        return this.form.controls.id_arma_base.value !== null;
    }

    get conBase(): boolean {
        return this.conArmaBase || this.form.controls.id_armadura_base.value !== null;
    }

    /** Los tipos de objeto por categoría (mundano, mágico, psiónico), con el de la entrada si el catálogo no lo lista. */
    get tiposObjeto(): EquipoRef[] {
        const actual = (this.cargada as ObjetoDetalle | null)?.Tipo;
        const lista = this.catalogos?.Tipos_objeto ?? [];
        return actual && !lista.some((item) => item.Id === actual.Id) ? [actual, ...lista] : lista;
    }

    opcionesDe(clave: keyof EquipoCatalogos): EquipoRef[] {
        return ((this.catalogos?.[clave] ?? []) as EquipoRef[]).filter((item) => item.Id > 0 && `${item.Nombre}`.trim());
    }

    /** Las opciones de un buscador con la de la entrada cargada si el catálogo aún no la tiene (`#id` si no). */
    nombreDe(opciones: readonly OpcionCatalogo[], id: number): string {
        return nombreDeOpcion(opciones, id);
    }

    get idsConjuros(): number[] {
        return this.filas.conjuros.map((conjuro) => conjuro.id);
    }

    get idsAptitudes(): number[] {
        return this.filas.aptitudes.map((aptitud) => aptitud.id);
    }

    get idsPiezas(): number[] {
        return this.filas.piezas.map((pieza) => pieza.id);
    }

    elegir(campo: 'id_manual' | 'id_monstruo' | 'id_arma_base' | 'id_armadura_base' | 'id_material', id: number): void {
        elegirEnControl(this.form.controls[campo], id);
        // Una sola base: un arma o una armadura (la API rechaza las dos); sin arma no hay mejora de la segunda cabeza.
        if (campo === 'id_arma_base')
            this.form.controls.id_armadura_base.setValue(null);
        if (campo === 'id_armadura_base') {
            this.form.controls.id_arma_base.setValue(null);
            this.form.controls.bonificador_mejora_2.setValue(null);
        }
    }

    quitarSeleccion(campo: 'id_monstruo' | 'id_arma_base' | 'id_armadura_base' | 'id_material'): void {
        this.form.controls[campo].setValue(null);
        this.form.controls[campo].markAsDirty();
        if (campo === 'id_arma_base')
            this.form.controls.bonificador_mejora_2.setValue(null);
    }

    alternar(campo: 'oficial' | 'traducido' | 'maldito' | 'inteligente' | 'es_reliquia' | 'es_generico_conjuro'): void {
        alternarControl(this.form.controls[campo]);
    }

    anadirActivacion(): void {
        this.filas.activaciones = [...this.filas.activaciones, { uid: this.uid(), id_tipo_activacion: null, id_tipo_accion: null }];
        this.alCambiar();
    }

    quitarActivacion(uid: string): void {
        this.filas.activaciones = this.filas.activaciones.filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    anadirConjuro(id: number): void {
        if (id > 0 && !this.idsConjuros.includes(id)) {
            this.filas.conjuros = [...this.filas.conjuros, {
                id, nombre: nombreDeOpcion(this.conjurosOpciones, id), nivel_lanzador: null, cargas_por_uso: null, usos_por_dia: null,
            }];
            this.alCambiar();
        }
    }

    quitarConjuro(id: number): void {
        this.filas.conjuros = this.filas.conjuros.filter((conjuro) => conjuro.id !== id);
        this.alCambiar();
    }

    anadirAptitud(id: number): void {
        if (id > 0 && !this.idsAptitudes.includes(id)) {
            this.filas.aptitudes = [...this.filas.aptitudes, { id, nombre: nombreDeOpcion(this.aptitudes, id), cabeza: 1 }];
            this.alCambiar();
        }
    }

    quitarAptitud(id: number): void {
        this.filas.aptitudes = this.filas.aptitudes.filter((aptitud) => aptitud.id !== id);
        this.alCambiar();
    }

    buscarPieza(texto: string): void {
        this.textoPieza = texto;
        this.busquedaPiezas$.next(texto ?? '');
    }

    anadirPieza(pieza: EquipoRef): void {
        if (pieza.Id > 0 && !this.idsPiezas.includes(pieza.Id)) {
            this.filas.piezas = [...this.filas.piezas, { id: pieza.Id, nombre: pieza.Nombre }];
            this.alCambiar();
        }
        this.textoPieza = '';
        this.piezasEncontradas = [];
    }

    quitarPieza(id: number): void {
        this.filas.piezas = this.filas.piezas.filter((pieza) => pieza.id !== id);
        this.alCambiar();
    }

    readonly mostrarPieza = (): string => this.textoPieza;

    anadirBonificacion(): void {
        this.filas.bonificaciones = [...this.filas.bonificaciones, { uid: this.uid(), piezas: null, descripcion: '' }];
        this.alCambiar();
    }

    quitarBonificacion(uid: string): void {
        this.filas.bonificaciones = this.filas.bonificaciones.filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    trackByUid(_indice: number, fila: FilaActivacion | FilaBonificacion): string {
        return fila.uid;
    }

    trackById(_indice: number, item: { id: number; }): number {
        return item.id;
    }

    alCambiar(): void {
        this.errores.seguirCambios();
        if (this.problema)
            this.problema = this.comprobar();
    }

    errorDe(campo: string, porDefecto: string): string {
        if (this.problema?.campo === campo)
            return this.problema.mensaje;
        return this.errores.textoDe(campo, porDefecto);
    }

    avisoDe(campo: string): string | null {
        if (this.problema?.campo === campo)
            return this.problema.mensaje;
        return this.errores.campo?.campo === campo ? this.errores.campo.mensaje : null;
    }

    get errorRequisitos(): string | null {
        return this.avisoDe('requisitos') ?? this.avisoDe('aura_escuelas');
    }

    /** Los pasos con algo que corregir (un punto en la fila de pasos no; el marco salta al del primer error). */
    async guardar(): Promise<void> {
        if (!this.puedeGuardar) {
            await avisarSinPermisos(this.userSvc.getPermissionDeniedMessage());
            return;
        }
        this.form.markAllAsTouched();
        this.problema = this.comprobar();
        if (this.form.invalid || this.problema) {
            if (this.problema && CAMPOS[this.problema.campo])
                this.pasoActual = CAMPOS[this.problema.campo].paso;
            else
                this.errores.irAlPrimerError();
            return;
        }
        this.errores.limpiar();
        this.guardando = true;
        try {
            const editando = this.edicion.editando;
            const id = this.edicion.id;
            const cuerpo = this.cuerpo() as any;
            const guardada = this.esObjeto
                ? await (editando ? this.equipoSvc.actualizarObjeto(id, cuerpo) : this.equipoSvc.crearObjeto(cuerpo))
                : await (editando ? this.equipoSvc.actualizarConjunto(id, cuerpo) : this.equipoSvc.crearConjunto(cuerpo));
            await avisarGuardado(this.definicion.elemento, editando, guardada.message);
            if (editando) {
                this.hidratar(guardada.entrada);
                this.objetoActualizado.emit(guardada.entrada);
                this.cerrar.emit();
            } else {
                this.objetoCreado.emit(guardada.entrada);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, `No se ha podido guardar ${this.articulo()}.`);
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    cuerpo() {
        const valores = this.form.getRawValue() as unknown as ValoresObjeto;
        return this.esObjeto ? cuerpoDeObjeto(valores, this.filas) : cuerpoDeConjunto(valores, this.filas);
    }

    private comprobar(): ProblemaDeObjeto | null {
        const valores = this.form.getRawValue() as unknown as ValoresObjeto;
        return this.esObjeto ? problemaDeObjeto(valores, this.filas) : problemaDeConjunto(this.filas);
    }

    private opcionesDeErrores(): OpcionesErroresDeFormulario {
        const componente = this;
        const listas: Readonly<Record<string, () => unknown>> = {
            activaciones: () => componente.filas.activaciones,
            conjuros: () => componente.filas.conjuros,
            encantamientos: () => componente.filas.aptitudes,
            aura_escuelas: () => componente.filas.relaciones.escuelas,
            requisitos: () => [componente.filas.relaciones.dotes, componente.filas.relaciones.conjuros],
            modificadores: () => componente.filas.relaciones.modificadores,
            piezas: () => componente.filas.piezas,
            bonificaciones: () => componente.filas.bonificaciones,
        };
        return {
            campos: CAMPOS,
            get raiz() { return componente.definicion.raiz; },
            control: (campo) => listas[campo] ? null : (componente.form.controls as Record<string, any>)[campo],
            firma: (campo) => JSON.stringify(listas[campo]
                ? listas[campo]()
                : (componente.form.controls as Record<string, any>)[campo]?.value ?? null),
            irAPaso: (paso) => componente.pasoActual = componente.esObjeto ? paso : 0,
        };
    }

    private nombreDelTipo(): ElementoDeCatalogo {
        const componente = this;
        const actual = () => TIPOS[componente.tipo].elemento;
        return {
            get singular() { return actual().singular; },
            get plural() { return actual().plural; },
            get femenino() { return actual().femenino; },
        };
    }

    private articulo(): string {
        const elemento = this.definicion.elemento;
        return `${elemento.femenino ? 'la' : 'el'} ${elemento.singular}`;
    }

    /** El tipo de objeto es obligatorio en el objeto (el conjunto no lo tiene). */
    private aplicarValidadoresDelTipo(): void {
        const validadores: ValidatorFn[] = this.esObjeto ? [Validators.required] : [];
        this.form.controls.id_tipo_objeto.setValidators(validadores);
        this.form.controls.id_tipo_objeto.updateValueAndValidity({ emitEvent: false });
    }

    private hidratar(entrada: EntradaObjeto): void {
        this.cargada = entrada;
        this.problema = null;
        this.errores.limpiar();
        const uid = () => this.uid();
        if (this.esObjeto) {
            this.form.reset(valoresDeObjeto(entrada as ObjetoDetalle) as any, { emitEvent: false });
            this.filas = filasDeObjeto(entrada as ObjetoDetalle, uid);
        } else {
            this.form.reset(valoresDeConjunto(entrada as ConjuntoObjetosDetalle) as any, { emitEvent: false });
            this.filas = filasDeConjunto(entrada as ConjuntoObjetosDetalle, uid);
        }
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.cargada = null;
        this.filas = filasDeObjetoVacias();
        this.problema = null;
        this.pasoActual = 0;
        this.form.reset(valoresObjetoVacios() as any, { emitEvent: false });
        this.edicion.olvidar();
    }

    private cargarCatalogos(): void {
        const cargar = <T>(fuente: Observable<T> | undefined, alLlegar: (valor: T) => void) => cargarCatalogo(fuente, this.destroy$, alLlegar);
        cargar(this.manualSvc.getManuales(), (manuales) => this.manuales = opcionesDeCatalogo(manuales as any[]));
        if (!this.esObjeto)
            return;
        cargar(this.equipoSvc.getCatalogos(), (catalogos) => this.catalogos = catalogos);
        cargar(this.equipoSvc.getConjuntos(), (conjuntos) => this.conjuntos = conjuntos.map((c) => ({ Id: c.Id, Nombre: c.Nombre })));
        cargar(this.equipoSvc.getMateriales(), (materiales) => this.materiales = opcionesDeCatalogo(materiales));
        cargar(this.equipoSvc.getEncantamientos(), (aptitudes) => this.aptitudes = opcionesDeCatalogo(aptitudes));
        cargar(this.monstruoSvc.getMonstruos(), (monstruos) => this.monstruos = opcionesDeCatalogo(monstruos as any[]));
        cargar(this.armaSvc.getArmas(), (armas) => this.armas = opcionesDeCatalogo(armas));
        cargar(this.armaduraSvc.getArmaduras(), (armaduras) => this.armaduras = opcionesDeCatalogo(armaduras));
        cargar(this.conjuroSvc.getConjuros(), (conjuros) => this.conjurosOpciones = opcionesDeCatalogo(conjuros as any[]));
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, this.definicion.listado);
    }

    private uid(): string {
        contadorFilas += 1;
        return `objeto-fila-${contadorFilas}`;
    }
}
