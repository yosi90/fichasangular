import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable, Subject, map, takeUntil } from 'rxjs';
import { ArmaDetalle } from 'src/app/interfaces/arma';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { EquipoCatalogos, EquipoRef } from 'src/app/interfaces/equipo';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { ManualService } from 'src/app/services/manual.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { UserService } from 'src/app/services/user.service';
import {
    FilaPropiedadArma,
    ProblemaDeEquipo,
    TipoEquipoEditable,
    ValoresEquipo,
    cuerpoDeEquipo,
    problemaDeEquipo,
    propiedadesDeArma,
    valoresDeArma,
    valoresDeArmadura,
    valoresVacios,
} from 'src/app/services/utils/equipo-formulario';
import { ElementoDeCatalogo } from 'src/app/services/utils/error-catalogo';
import { ARMA, ARMADURA } from 'src/app/services/utils/nombres-de-catalogo';
import { conOpcionSinValor } from 'src/app/services/utils/opcion-sin-valor';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { OpcionCatalogo, nombreDeOpcion, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario, OpcionesErroresDeFormulario } from '../insercion-marco/errores-de-formulario';
import { alternarControl, elegirEnControl } from '../insercion-marco/filas-repetibles';

type EntradaEquipo = ArmaDetalle | ArmaduraDetalle;

/** Lo que cambia entre un tipo y otro: su nombre, su listado, su icono y su servicio. */
interface DefinicionTipo {
    etiqueta: string;
    listado: string;
    icono: 'arma' | 'armadura';
    raiz: string;
}

const TIPOS: Readonly<Record<TipoEquipoEditable, DefinicionTipo>> = {
    arma: { etiqueta: 'Arma', listado: 'armas', icono: 'arma', raiz: 'arma' },
    armadura: { etiqueta: 'Armadura', listado: 'armaduras', icono: 'armadura', raiz: 'armadura' },
};

/** Los campos con su etiqueta, para llevar el error de la API (`field` `arma.<clave>`) a su control. Sin pasos. */
const CAMPOS: CamposDeFormulario = Object.fromEntries(([
    ['nombre', 'Nombre'], ['id_manual', 'Manual'], ['pagina', 'Página'], ['descripcion', 'Descripción'],
    ['origen_descripcion', 'Origen de la descripción'], ['nombre_original', 'Nombre original'], ['precio', 'Precio'],
    ['peso', 'Peso'], ['id_material', 'Material'], ['id_tamano', 'Tamaño'], ['id_tipo_dano', 'Tipo de daño'],
    ['id_tipo_arma', 'Tipo de arma'], ['id_manejo', 'Manejo'], ['alcance', 'Alcance'], ['id_municion', 'Munición'],
    ['dano_pequeno', 'Daño (Pequeño)'], ['dano_mediano', 'Daño (Mediano)'], ['critico_rango', 'Rango de amenaza'],
    ['critico_multiplicador', 'Multiplicador'], ['critico_multiplicador_2', 'Multiplicador de la segunda cabeza'],
    ['incremento_distancia', 'Incremento de distancia'], ['indice_fuerza_coste', 'Índice de Fuerza'],
    ['propiedades', 'Propiedades'], ['ca', 'CA'], ['bon_des', 'Destreza máxima'], ['penalizador', 'Penalizador'],
    ['id_peso_armadura', 'Peso de armadura'], ['id_tipo_escudo', 'Tipo de escudo'], ['fallo_arcano', 'Fallo de conjuro arcano'],
    ['velocidad_30', 'Velocidad (30 pies)'], ['velocidad_20', 'Velocidad (20 pies)'], ['correr_multiplicador', 'Correr'],
    ['tiempo_poner', 'Ponérsela'], ['tiempo_poner_rapido', 'Ponérsela deprisa'], ['tiempo_quitar', 'Quitársela'],
] as const).map(([clave, etiqueta]) => [clave, { etiqueta, paso: 0 }]));

/** Los multiplicadores de crítico de la base (×2 … ×8). */
const MULTIPLICADORES = [2, 3, 4, 5, 6, 7, 8];

let contadorFilas = 0;

/**
 * «Insertar/Modificar arma» y «Insertar/Modificar armadura» (hito 7 del roadmap de inserciones): una sola pantalla,
 * porque las dos comparten la mitad de sus campos (nombre, manual, descripción propia o del SRD, precio, peso, material y
 * tamaño); cada tipo añade su tarjeta (el ataque y las propiedades del arma; la defensa de la armadura o el escudo). Sigue
 * la receta de la guía de inserciones: el marco común, `EdicionDeCatalogo`, `ErroresDeFormulario` y
 * `<app-catalogo-buscador>`; sin pasos (es una inserción mediana, como la dote).
 */
@Component({
    selector: 'app-nuevo-equipo',
    templateUrl: './nuevo-equipo.component.html',
    styleUrls: ['./nuevo-equipo.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevoEquipoComponent) }],
})
export class NuevoEquipoComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() tipo: TipoEquipoEditable = 'arma';
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idEntrada: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() equipoCreado = new EventEmitter<EntradaEquipo>();
    @Output() equipoActualizado = new EventEmitter<EntradaEquipo>();

    private readonly destroy$ = new Subject<void>();
    readonly multiplicadores = MULTIPLICADORES;
    guardando = false;
    puedeCrear = false;
    /** La entrada cargada al modificar: de ella salen las opciones que los catálogos no listan («Elegir» en el daño). */
    private cargada: EntradaEquipo | null = null;

    manuales: OpcionCatalogo[] = [];
    materiales: OpcionCatalogo[] = [];
    municiones: OpcionCatalogo[] = [];
    tamanos: EquipoRef[] = [];
    catalogos: EquipoCatalogos | null = null;
    propiedadesOpciones: OpcionCatalogo[] = [];
    propiedades: FilaPropiedadArma[] = [];
    problema: ProblemaDeEquipo | null = null;

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(50)]],
        descripcion: ['', [Validators.maxLength(8000)]],
        origen_descripcion: ['propia'],
        nombre_original: ['', [Validators.maxLength(150)]],
        traducido: [false],
        id_manual: [null as number | null, [Validators.required, Validators.min(1)]],
        pagina: [null as number | null, [Validators.required, Validators.min(0)]],
        oficial: [true],
        precio: [null as number | null, [Validators.required, Validators.min(0)]],
        peso: [null as number | null, [Validators.required, Validators.min(0)]],
        id_material: [null as number | null],
        id_tamano: [null as number | null, [Validators.required]],
        id_tipo_dano: [null as number | null],
        id_tipo_arma: [null as number | null],
        id_manejo: [null as number | null],
        a_distancia: [false],
        arrojadiza: [false],
        doble: [false],
        alcance: [null as number | null, [Validators.min(0)]],
        id_municion: [null as number | null],
        dano_pequeno: ['', [Validators.maxLength(20)]],
        dano_mediano: ['', [Validators.maxLength(20)]],
        critico_rango: [null as number | null, [Validators.min(2), Validators.max(20)]],
        critico_multiplicador: [null as number | null],
        critico_multiplicador_2: [null as number | null],
        incremento_distancia: [0 as number | null, [Validators.min(0)]],
        indice_fuerza_coste: [null as number | null, [Validators.min(0)]],
        es_escudo: [false],
        ca: [null as number | null, [Validators.min(0)]],
        bon_des: [null as number | null, [Validators.min(0)]],
        penalizador: [0 as number | null, [Validators.max(0)]],
        id_peso_armadura: [null as number | null],
        id_tipo_escudo: [null as number | null],
        fallo_arcano: [0 as number | null, [Validators.min(0), Validators.max(100)]],
        velocidad_30: [null as number | null, [Validators.min(0)]],
        velocidad_20: [null as number | null, [Validators.min(0)]],
        correr_multiplicador: [null as number | null, [Validators.min(1)]],
        tiempo_poner: ['', [Validators.maxLength(30)]],
        tiempo_poner_rapido: ['', [Validators.maxLength(30)]],
        tiempo_quitar: ['', [Validators.maxLength(30)]],
    });

    readonly errores = new ErroresDeFormulario(this.opcionesDeErrores());

    readonly edicion = new EdicionDeCatalogo<EntradaEquipo>({
        nombre: this.nombreDelTipo(),
        modo: () => this.modo,
        id: () => this.idEntrada,
        obtener: (id) => this.obtener(id),
        hidratar: (entrada) => this.hidratar(entrada),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, `No se ha podido cargar ${this.tipo === 'arma' ? 'el arma' : 'la armadura'}.`),
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private equipoSvc: EquipoService,
        private manualSvc: ManualService,
        private tamanoSvc: TamanoService,
    ) { }

    ngOnInit(): void {
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.cargarCatalogos();
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.alCambiar());
        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(changes: SimpleChanges): void {
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

    get esArma(): boolean {
        return this.tipo === 'arma';
    }

    get esEscudo(): boolean {
        return this.form.controls.es_escudo.value === true;
    }

    get esDoble(): boolean {
        return this.form.controls.doble.value === true;
    }

    get sinCritico(): boolean {
        return this.form.controls.critico_multiplicador.value === null;
    }

    get puedeGuardar(): boolean {
        return this.puedeCrear;
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    /** Las opciones de un catálogo pequeño, con la de la entrada cargada si el catálogo no la lista («Elegir» en el daño). */
    opcionesDe(clave: keyof EquipoCatalogos, actual: EquipoRef | null | undefined = null): EquipoRef[] {
        const lista = ((this.catalogos?.[clave] ?? []) as EquipoRef[]).filter((item) => item.Id >= 0 && `${item.Nombre}`.trim());
        return actual ? conOpcionSinValor(lista, actual) : lista;
    }

    get tiposDano(): EquipoRef[] {
        return this.opcionesDe('Tipos_dano', (this.cargada as ArmaDetalle | null)?.Tipo_dano);
    }

    get tiposArma(): EquipoRef[] {
        return this.opcionesDe('Tipos_arma', (this.cargada as ArmaDetalle | null)?.Tipo_arma);
    }

    get manejos(): EquipoRef[] {
        return this.opcionesDe('Manejos_armas', (this.cargada as ArmaDetalle | null)?.Manejo);
    }

    get pesosArmadura(): EquipoRef[] {
        return this.opcionesDe('Pesos_armadura', (this.cargada as ArmaduraDetalle | null)?.Peso_armadura);
    }

    get tiposEscudo(): EquipoRef[] {
        return this.opcionesDe('Tipos_escudo', (this.cargada as ArmaduraDetalle | null)?.Tipo_escudo);
    }

    get tamanosOpciones(): EquipoRef[] {
        const actual = this.cargada?.Tamano;
        return actual ? conOpcionSinValor(this.tamanos, actual) : this.tamanos;
    }

    get idsPropiedades(): number[] {
        return this.propiedades.map((fila) => Number(fila.id_propiedad ?? 0));
    }

    nombrePropiedad(fila: FilaPropiedadArma): string {
        return nombreDeOpcion(this.propiedadesOpciones, Number(fila.id_propiedad ?? 0));
    }

    descripcionPropiedad(fila: FilaPropiedadArma): string {
        return this.catalogos?.Propiedades_armas.find((p) => p.Id === Number(fila.id_propiedad))?.Descripcion ?? '';
    }

    elegir(campo: 'id_manual' | 'id_material' | 'id_municion', id: number): void {
        elegirEnControl(this.form.controls[campo], id);
    }

    quitarSeleccion(campo: 'id_material' | 'id_municion'): void {
        this.form.controls[campo].setValue(null);
        this.form.controls[campo].markAsDirty();
    }

    alternar(campo: 'oficial' | 'traducido' | 'a_distancia' | 'arrojadiza' | 'doble' | 'es_escudo'): void {
        alternarControl(this.form.controls[campo]);
        if (campo === 'es_escudo') {
            // Un escudo no lleva peso de armadura y una armadura no lleva tipo de escudo (la API rechaza lo contrario).
            this.form.controls.id_peso_armadura.setValue(null);
            this.form.controls.id_tipo_escudo.setValue(null);
            // Ni la velocidad ni el correr de la armadura: un escudo no los cambia.
            if (this.esEscudo)
                ['velocidad_30', 'velocidad_20', 'correr_multiplicador'].forEach((clave) => (this.form.controls as any)[clave].setValue(null));
        }
        if (campo === 'doble' && !this.esDoble)
            this.form.controls.critico_multiplicador_2.setValue(null);
    }

    anadirPropiedad(id: number): void {
        if (id > 0 && !this.idsPropiedades.includes(id)) {
            this.propiedades = [...this.propiedades, { uid: this.uid(), id_propiedad: id, valor: null }];
            this.alCambiar();
        }
    }

    quitarPropiedad(uid: string): void {
        this.propiedades = this.propiedades.filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    trackByUid(_indice: number, fila: FilaPropiedadArma): string {
        return fila.uid;
    }

    alCambiar(): void {
        this.errores.seguirCambios();
        if (this.problema)
            this.problema = problemaDeEquipo(this.tipo, this.valores(), this.propiedades);
    }

    /** El mensaje bajo un control: el de la API, el de una regla de la API comprobada aquí o el de su validación. */
    errorDe(campo: string, porDefecto: string): string {
        if (this.problema?.campo === campo)
            return this.problema.mensaje;
        return this.errores.textoDe(campo, porDefecto);
    }

    /** El aviso de un selector (el tipo de arma o de daño, el peso de armadura, el tipo de escudo): la regla o la API. */
    avisoDe(campo: string): string | null {
        if (this.problema?.campo === campo)
            return this.problema.mensaje;
        return this.errores.campo?.campo === campo ? this.errores.campo.mensaje : null;
    }

    async guardar(): Promise<void> {
        if (!this.puedeGuardar) {
            await avisarSinPermisos(this.userSvc.getPermissionDeniedMessage());
            return;
        }
        this.form.markAllAsTouched();
        this.problema = problemaDeEquipo(this.tipo, this.valores(), this.propiedades);
        if (this.form.invalid || this.problema) {
            this.errores.irAlPrimerError();
            return;
        }
        this.errores.limpiar();
        this.guardando = true;
        const nombre = this.esArma ? ARMA : ARMADURA;
        try {
            const editando = this.edicion.editando;
            const guardada = await this.mandar(editando);
            await avisarGuardado(nombre, editando, guardada.message);
            if (editando) {
                this.hidratar(guardada.entrada);
                this.equipoActualizado.emit(guardada.entrada);
                this.cerrar.emit();
            } else {
                this.equipoCreado.emit(guardada.entrada);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, `No se ha podido guardar ${this.esArma ? 'el arma' : 'la armadura'}.`);
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST …/add` y `PUT …/<id>` con lo que hay en el formulario. */
    cuerpo() {
        return cuerpoDeEquipo(this.tipo, this.valores(), this.propiedades);
    }

    /** Las opciones de `errores`: los campos, su control y lo que valen, con la raíz del cuerpo del tipo. */
    private opcionesDeErrores(): OpcionesErroresDeFormulario {
        const componente = this;
        return {
            campos: CAMPOS,
            // La raíz del cuerpo (`arma` o `armadura`: el `field` «arma.precio» es el control `precio`) depende del tipo.
            get raiz() { return componente.definicion.raiz; },
            control: (campo) => (componente.form.controls as Record<string, any>)[campo],
            firma: (campo) => campo === 'propiedades'
                ? JSON.stringify(componente.propiedades.map((fila) => [fila.id_propiedad, fila.valor]))
                : JSON.stringify((componente.form.controls as Record<string, any>)[campo]?.value ?? null),
            irAPaso: () => undefined,
        };
    }

    /**
     * El nombre del catálogo en los textos de «Modificar» («Crear arma», «Cargando armadura…», el aviso sin permisos),
     * que depende del tipo que recibe la pantalla (llega después de crear `edicion`).
     */
    private nombreDelTipo(): ElementoDeCatalogo {
        const componente = this;
        const actual = () => componente.tipo === 'arma' ? ARMA : ARMADURA;
        return {
            get singular() { return actual().singular; },
            get plural() { return actual().plural; },
            get femenino() { return actual().femenino; },
        };
    }

    private valores(): ValoresEquipo {
        return this.form.getRawValue() as unknown as ValoresEquipo;
    }

    private async mandar(editando: boolean): Promise<{ message: string; entrada: EntradaEquipo; }> {
        const id = this.edicion.id;
        if (this.esArma) {
            const cuerpo = this.cuerpo() as any;
            const r = editando ? await this.armaSvc.actualizarArma(id, cuerpo) : await this.armaSvc.crearArma(cuerpo);
            return { message: r.message, entrada: r.arma };
        }
        const cuerpo = this.cuerpo() as any;
        const r = editando ? await this.armaduraSvc.actualizarArmadura(id, cuerpo) : await this.armaduraSvc.crearArmadura(cuerpo);
        return { message: r.message, entrada: r.armadura };
    }

    private obtener(id: number): Observable<EntradaEquipo> {
        return this.esArma ? this.armaSvc.getArmaFresca(id) : this.armaduraSvc.getArmaduraFresca(id);
    }

    private hidratar(entrada: EntradaEquipo): void {
        this.cargada = entrada;
        this.problema = null;
        this.errores.limpiar();
        if (this.esArma) {
            this.form.reset(valoresDeArma(entrada as ArmaDetalle) as any, { emitEvent: false });
            this.propiedades = propiedadesDeArma(entrada as ArmaDetalle, () => this.uid());
        } else {
            this.form.reset(valoresDeArmadura(entrada as ArmaduraDetalle) as any, { emitEvent: false });
            this.propiedades = [];
        }
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.cargada = null;
        this.propiedades = [];
        this.problema = null;
        this.form.reset(valoresVacios(this.idTamanoMediano()) as any, { emitEvent: false });
        this.edicion.olvidar();
    }

    /** El tamaño de una pieza nueva: el Mediano (las cifras del catálogo son las de la pieza Mediana), por su nombre. */
    private idTamanoMediano(): number | null {
        return this.tamanos.find((t) => `${t.Nombre}`.trim().toLowerCase() === 'mediano')?.Id ?? null;
    }

    private cargarCatalogos(): void {
        const cargar = <T>(fuente: Observable<T> | undefined, alLlegar: (valor: T) => void) => {
            fuente?.pipe(takeUntil(this.destroy$)).subscribe({ next: alLlegar, error: () => undefined });
        };
        cargar(this.manualSvc.getManuales(), (manuales) => this.manuales = opcionesDeCatalogo(manuales as any[]));
        cargar(this.equipoSvc.getCatalogos(), (catalogos) => {
            this.catalogos = catalogos;
            this.propiedadesOpciones = opcionesDeCatalogo(catalogos?.Propiedades_armas ?? []);
        });
        cargar(this.equipoSvc.getMateriales(), (materiales) => this.materiales = opcionesDeCatalogo(materiales));
        cargar(this.equipoSvc.getMuniciones(), (municiones) => this.municiones = opcionesDeCatalogo(municiones));
        cargar(this.tamanoSvc.getTamanos().pipe(map((tamanos) => tamanos.map((t) => ({ Id: t.Id, Nombre: t.Nombre })))), (tamanos) => {
            this.tamanos = tamanos;
            // Una pieza nueva es Mediana mientras no se diga otra cosa.
            if (!this.edicion.editando && this.form.controls.id_tamano.value === null && !this.form.dirty)
                this.form.controls.id_tamano.setValue(this.idTamanoMediano(), { emitEvent: false });
        });
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, this.definicion.listado);
    }

    private uid(): string {
        contadorFilas += 1;
        return `equipo-fila-${contadorFilas}`;
    }
}
