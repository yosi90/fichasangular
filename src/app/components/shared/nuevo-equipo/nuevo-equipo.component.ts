import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { Observable, Subject, map, takeUntil } from 'rxjs';
import { ArmaDetalle } from 'src/app/interfaces/arma';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { EncantamientoDetalle, EquipoCatalogos, EquipoRef, MaterialDetalle, MunicionDetalle } from 'src/app/interfaces/equipo';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { ManualService } from 'src/app/services/manual.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { UserService } from 'src/app/services/user.service';
import {
    FilaCosteMaterial,
    FilaDanoAptitud,
    FilaPropiedadArma,
    FilasDeEquipo,
    ProblemaDeEquipo,
    TipoEquipoEditable,
    ValoresEquipo,
    costesDeMaterial,
    cuerpoDeEquipo,
    filasDeEncantamiento,
    filasVacias,
    problemaDeEquipo,
    propiedadesDeArma,
    valoresDeArma,
    valoresDeArmadura,
    valoresDeEncantamiento,
    valoresDeMaterial,
    valoresDeMunicion,
    valoresVacios,
} from 'src/app/services/utils/equipo-formulario';
import { ElementoDeCatalogo } from 'src/app/services/utils/error-catalogo';
import { TipoRol } from 'src/app/services/utils/iconos-rol';
import { APTITUD_EQUIPO, ARMA, ARMADURA, MATERIAL, MUNICION, nombreQueCambia } from 'src/app/services/utils/nombres-de-catalogo';
import { conOpcionSinValor } from 'src/app/services/utils/opcion-sin-valor';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { OpcionCatalogo, nombreDeOpcion, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';
import { avisarGuardado, avisarSinPermisos, elCatalogo } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo, cargadorDeCatalogos } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario, OpcionesErroresDeFormulario } from '../insercion-marco/errores-de-formulario';
import { alternarControl, elegirEnControl, vaciarControl } from '../insercion-marco/filas-repetibles';

type EntradaEquipo = ArmaDetalle | ArmaduraDetalle | MunicionDetalle | MaterialDetalle | EncantamientoDetalle;

/** Lo que cambia entre un tipo y otro: su nombre, su listado (y su permiso), su icono, la raíz de su cuerpo y su nombre. */
interface DefinicionTipo {
    etiqueta: string;
    listado: string;
    icono: TipoRol;
    raiz: string;
    elemento: ElementoDeCatalogo;
    /** El tope del nombre en la base. */
    maximoNombre: number;
    /** Si el manual y la página son obligatorios (la munición y los materiales de los scripts pueden no tenerlos). */
    conManual: boolean;
}

const TIPOS: Readonly<Record<TipoEquipoEditable, DefinicionTipo>> = {
    arma: { etiqueta: 'Arma', listado: 'armas', icono: 'arma', raiz: 'arma', elemento: ARMA, maximoNombre: 50, conManual: true },
    armadura: { etiqueta: 'Armadura', listado: 'armaduras', icono: 'armadura', raiz: 'armadura', elemento: ARMADURA, maximoNombre: 50, conManual: true },
    municion: { etiqueta: 'Munición', listado: 'munición', icono: 'municion', raiz: 'municion', elemento: MUNICION, maximoNombre: 50, conManual: false },
    material: { etiqueta: 'Material especial', listado: 'materiales especiales', icono: 'material', raiz: 'material', elemento: MATERIAL, maximoNombre: 30, conManual: false },
    encantamiento: {
        etiqueta: 'Aptitud especial', listado: 'aptitudes de armas y armaduras', icono: 'aptitud-equipo', raiz: 'encantamiento',
        elemento: APTITUD_EQUIPO, maximoNombre: 50, conManual: true,
    },
};

/** Los campos con su etiqueta, para llevar el error de la API (`field` `arma.<clave>`, `costes[0]…`) a su control. Sin pasos. */
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
    ['cantidad_por_precio', 'Piezas del lote'], ['dureza', 'Dureza'], ['pg_por_pulgada', 'PG por pulgada'],
    ['peso_multiplicador', 'Multiplicador del peso'], ['bon_des_mas', 'Destreza máxima'], ['penalizador_menos', 'Penalizador'],
    ['fallo_arcano_menos', 'Fallo arcano'], ['dano_mod', 'Daño'], ['costes', 'Costes'], ['modificador', 'Bonificador equivalente'],
    ['coste', 'Precio fijo'], ['nivel_lanzador', 'Nivel de lanzador'], ['id_intensidad_aura', 'Aura'],
    ['id_encantamiento_base', 'Aptitud base'], ['tipos_dano', 'Tipos de daño'], ['danos', 'Daños'],
    ['aura_escuelas', 'Escuelas del aura'], ['requisitos', 'Requisitos'], ['modificadores', 'Modificadores'],
] as const).map(([clave, etiqueta]) => [clave, { etiqueta, paso: 0 }]));

/** Los multiplicadores de crítico de la base (×2 … ×8). */
const MULTIPLICADORES = [2, 3, 4, 5, 6, 7, 8];

let contadorFilas = 0;

/**
 * «Insertar/Modificar» arma, armadura, munición, material especial y aptitud especial de armas y armaduras (hito 7 del
 * roadmap de inserciones; la munición, los materiales y las aptitudes, desde la segunda parte, 2026-11-05): una sola
 * pantalla, porque comparten el nombre, el manual, la descripción propia o del SRD y el nombre original; cada tipo añade
 * su tarjeta (el ataque y las propiedades del arma; la defensa de la armadura o el escudo; el lote de la munición; los
 * efectos y los costes del material; a qué se aplica, su precio, sus daños, el aura, los requisitos y los modificadores
 * de la aptitud). Sigue la receta de la guía de inserciones: el marco común, `EdicionDeCatalogo`, `ErroresDeFormulario` y
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
    encantamientos: OpcionCatalogo[] = [];
    tamanos: EquipoRef[] = [];
    catalogos: EquipoCatalogos | null = null;
    propiedadesOpciones: OpcionCatalogo[] = [];
    /** Las filas repetibles de cada tipo (propiedades, costes, daños, tipos de daño, aura, requisitos y modificadores). */
    filas: FilasDeEquipo = filasVacias();
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
        cantidad_por_precio: [null as number | null, [Validators.min(1)]],
        dureza: [null as number | null, [Validators.min(0), Validators.max(255)]],
        pg_por_pulgada: [null as number | null, [Validators.min(0), Validators.max(255)]],
        cuenta_como_gran_calidad: [false],
        supera_rd: [false],
        peso_multiplicador: [null as number | null, [Validators.min(0), Validators.max(99.99)]],
        bon_des_mas: [null as number | null, [Validators.min(0), Validators.max(255)]],
        penalizador_menos: [null as number | null, [Validators.min(0), Validators.max(255)]],
        fallo_arcano_menos: [null as number | null, [Validators.min(0), Validators.max(255)]],
        categoria_mas_ligera: [false],
        dano_mod: [null as number | null],
        modificador: [0 as number | null, [Validators.min(0), Validators.max(10)]],
        coste: [0 as number | null, [Validators.min(0)]],
        aplica_arma_cc: [false],
        aplica_arma_distancia: [false],
        aplica_municion: [false],
        aplica_armadura: [false],
        aplica_escudo: [false],
        nivel_lanzador: [null as number | null, [Validators.min(0), Validators.max(255)]],
        id_intensidad_aura: [null as number | null],
        id_encantamiento_base: [null as number | null],
        es_plantilla: [false],
    });

    readonly errores = new ErroresDeFormulario(this.opcionesDeErrores());

    readonly edicion = new EdicionDeCatalogo<EntradaEquipo>({
        nombre: nombreQueCambia(() => this.definicion.elemento),
        modo: () => this.modo,
        id: () => this.idEntrada,
        obtener: (id) => this.obtener(id),
        hidratar: (entrada) => this.hidratar(entrada),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, `No se ha podido cargar ${elCatalogo(this.definicion.elemento)}.`),
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
        this.aplicarValidadoresDelTipo();
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.cargarCatalogos();
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.alCambiar());
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

    get esArma(): boolean {
        return this.tipo === 'arma';
    }

    get esArmadura(): boolean {
        return this.tipo === 'armadura';
    }

    /** Armas, armaduras y munición tienen precio y peso; armas y armaduras, además, tamaño y material. */
    get conPrecio(): boolean {
        return this.tipo === 'arma' || this.tipo === 'armadura' || this.tipo === 'municion';
    }

    get esPieza(): boolean {
        return this.tipo === 'arma' || this.tipo === 'armadura';
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

    get propiedades(): FilaPropiedadArma[] {
        return this.filas.propiedades;
    }

    /** Las armas que disparan la munición cargada (son del arma: se cambian al editar el arma). */
    get armasDeLaMunicion(): EquipoRef[] {
        return this.tipo === 'municion' ? ((this.cargada as MunicionDetalle | null)?.Armas ?? []) : [];
    }

    get textoArmasDeLaMunicion(): string {
        return this.armasDeLaMunicion.map((arma) => arma.Nombre).join(', ');
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

    get intensidadesAura(): EquipoRef[] {
        return this.opcionesDe('Intensidades_aura', (this.cargada as EncantamientoDetalle | null)?.Aura?.Intensidad);
    }

    get aplicacionesMaterial(): EquipoRef[] {
        return this.opcionesDe('Aplicaciones_material');
    }

    /** Los tipos de daño de verdad (sin el 0, «Elegir»): los que pide una aptitud y los de sus daños. */
    get tiposDanoAptitud(): EquipoRef[] {
        return (this.catalogos?.Tipos_dano ?? []).filter((item) => item.Id > 0);
    }

    /** Las aptitudes que pueden ser la base de esta (todas menos ella misma). */
    get encantamientosBase(): OpcionCatalogo[] {
        return this.encantamientos.filter((opcion) => opcion.id !== this.edicion.id);
    }

    get tamanosOpciones(): EquipoRef[] {
        const actual = (this.cargada as ArmaDetalle | ArmaduraDetalle | null)?.Tamano;
        return actual ? conOpcionSinValor(this.tamanos, actual) : this.tamanos;
    }

    get idsPropiedades(): number[] {
        return this.filas.propiedades.map((fila) => Number(fila.id_propiedad ?? 0));
    }

    nombrePropiedad(fila: FilaPropiedadArma): string {
        return nombreDeOpcion(this.propiedadesOpciones, Number(fila.id_propiedad ?? 0));
    }

    descripcionPropiedad(fila: FilaPropiedadArma): string {
        return this.catalogos?.Propiedades_armas.find((p) => p.Id === Number(fila.id_propiedad))?.Descripcion ?? '';
    }

    elegir(campo: 'id_manual' | 'id_material' | 'id_municion' | 'id_encantamiento_base', id: number): void {
        elegirEnControl(this.form.controls[campo], id);
    }

    quitarSeleccion(campo: 'id_manual' | 'id_material' | 'id_municion' | 'id_encantamiento_base'): void {
        vaciarControl(this.form.controls[campo]);
    }

    alternar(campo: 'oficial' | 'traducido' | 'a_distancia' | 'arrojadiza' | 'doble' | 'es_escudo' | 'cuenta_como_gran_calidad'
        | 'supera_rd' | 'categoria_mas_ligera' | 'aplica_arma_cc' | 'aplica_arma_distancia' | 'aplica_municion' | 'aplica_armadura'
        | 'aplica_escudo' | 'es_plantilla'): void {
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
            this.filas.propiedades = [...this.filas.propiedades, { uid: this.uid(), id_propiedad: id, valor: null }];
            this.alCambiar();
        }
    }

    quitarPropiedad(uid: string): void {
        this.filas.propiedades = this.filas.propiedades.filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    anadirCoste(): void {
        this.filas.costes = [...this.filas.costes, {
            uid: this.uid(), id_aplicacion: null, coste: null, coste_por_libra: null, multiplicador_precio: null, coste_encantar: null,
        }];
        this.alCambiar();
    }

    quitarCoste(uid: string): void {
        this.filas.costes = this.filas.costes.filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    anadirDano(): void {
        this.filas.danos = [...this.filas.danos, { uid: this.uid(), dados: '', id_tipo_dano: null, condicion: '' }];
        this.alCambiar();
    }

    quitarDano(uid: string): void {
        this.filas.danos = this.filas.danos.filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    tieneTipoDano(id: number): boolean {
        return this.filas.tiposDano.includes(id);
    }

    alternarTipoDano(id: number): void {
        this.filas.tiposDano = this.tieneTipoDano(id) ? this.filas.tiposDano.filter((item) => item !== id) : [...this.filas.tiposDano, id];
        this.alCambiar();
    }

    trackByUid(_indice: number, fila: FilaPropiedadArma | FilaCosteMaterial | FilaDanoAptitud): string {
        return fila.uid;
    }

    alCambiar(): void {
        this.errores.seguirCambios();
        if (this.problema)
            this.problema = problemaDeEquipo(this.tipo, this.valores(), this.filas);
    }

    /** El mensaje bajo un control: el de la API, el de una regla de la API comprobada aquí o el de su validación. */
    errorDe(campo: string, porDefecto: string): string {
        if (this.problema?.campo === campo)
            return this.problema.mensaje;
        return this.errores.textoDe(campo, porDefecto);
    }

    /** El aviso de un selector o de una lista (el tipo de arma, los costes…): la regla comprobada aquí o la API. */
    avisoDe(campo: string): string | null {
        if (this.problema?.campo === campo)
            return this.problema.mensaje;
        return this.errores.mensajeDe(campo);
    }

    /** El aviso de la tarjeta de aura y requisitos de la aptitud (lo dice la API). */
    get errorRequisitos(): string | null {
        return this.avisoDe('requisitos') ?? this.avisoDe('aura_escuelas');
    }

    async guardar(): Promise<void> {
        if (!this.puedeGuardar) {
            await avisarSinPermisos(this.userSvc.getPermissionDeniedMessage());
            return;
        }
        this.form.markAllAsTouched();
        this.problema = problemaDeEquipo(this.tipo, this.valores(), this.filas);
        if (this.form.invalid || this.problema) {
            this.errores.irAlPrimerError();
            return;
        }
        this.errores.limpiar();
        this.guardando = true;
        try {
            const editando = this.edicion.editando;
            const guardada = await this.mandar(editando);
            await avisarGuardado(this.definicion.elemento, editando, guardada.message);
            if (editando) {
                this.hidratar(guardada.entrada);
                this.equipoActualizado.emit(guardada.entrada);
                this.cerrar.emit();
            } else {
                this.equipoCreado.emit(guardada.entrada);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, `No se ha podido guardar ${elCatalogo(this.definicion.elemento)}.`);
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST …/add` y `PUT …/<id>` con lo que hay en el formulario. */
    cuerpo() {
        return cuerpoDeEquipo(this.tipo, this.valores(), this.filas);
    }

    /** Las opciones de `errores`: los campos, su control y lo que valen, con la raíz del cuerpo del tipo. */
    private opcionesDeErrores(): OpcionesErroresDeFormulario {
        const componente = this;
        const listas: Readonly<Record<string, () => unknown>> = {
            propiedades: () => componente.filas.propiedades.map((fila) => [fila.id_propiedad, fila.valor]),
            costes: () => componente.filas.costes,
            danos: () => componente.filas.danos,
            tipos_dano: () => componente.filas.tiposDano,
            aura_escuelas: () => componente.filas.relaciones.escuelas,
            requisitos: () => [componente.filas.relaciones.dotes, componente.filas.relaciones.conjuros],
            modificadores: () => componente.filas.relaciones.modificadores,
        };
        return {
            campos: CAMPOS,
            // La raíz del cuerpo (`arma`, `material`…: el `field` «arma.precio» es el control `precio`) depende del tipo.
            get raiz() { return componente.definicion.raiz; },
            control: (campo) => listas[campo] ? null : (componente.form.controls as Record<string, any>)[campo],
            firma: (campo) => JSON.stringify(listas[campo]
                ? listas[campo]()
                : (componente.form.controls as Record<string, any>)[campo]?.value ?? null),
            irAPaso: () => undefined,
        };
    }

    /**
     * Los validadores que cambian con el tipo: el tope del nombre; el manual y la página, obligatorios salvo en la munición
     * y los materiales; el precio y el peso, solo en armas y armaduras; el tamaño, en armas y armaduras.
     */
    private aplicarValidadoresDelTipo(): void {
        const definicion = this.definicion;
        const poner = (campo: keyof typeof this.form.controls, validadores: ValidatorFn[]) => {
            this.form.controls[campo].setValidators(validadores);
            this.form.controls[campo].updateValueAndValidity({ emitEvent: false });
        };
        poner('nombre', [Validators.required, Validators.maxLength(definicion.maximoNombre)]);
        poner('id_manual', definicion.conManual ? [Validators.required, Validators.min(1)] : [Validators.min(1)]);
        poner('pagina', definicion.conManual ? [Validators.required, Validators.min(0)] : [Validators.min(0)]);
        poner('precio', this.esPieza ? [Validators.required, Validators.min(0)] : [Validators.min(0)]);
        poner('peso', this.esPieza ? [Validators.required, Validators.min(0)] : [Validators.min(0)]);
        poner('id_tamano', this.esPieza ? [Validators.required] : []);
    }

    private valores(): ValoresEquipo {
        return this.form.getRawValue() as unknown as ValoresEquipo;
    }

    private async mandar(editando: boolean): Promise<{ message: string; entrada: EntradaEquipo; }> {
        const id = this.edicion.id;
        const cuerpo = this.cuerpo() as any;
        switch (this.tipo) {
            case 'arma': {
                const r = editando ? await this.armaSvc.actualizarArma(id, cuerpo) : await this.armaSvc.crearArma(cuerpo);
                return { message: r.message, entrada: r.arma };
            }
            case 'armadura': {
                const r = editando ? await this.armaduraSvc.actualizarArmadura(id, cuerpo) : await this.armaduraSvc.crearArmadura(cuerpo);
                return { message: r.message, entrada: r.armadura };
            }
            case 'municion':
                return editando ? this.equipoSvc.actualizarMunicion(id, cuerpo) : this.equipoSvc.crearMunicion(cuerpo);
            case 'material':
                return editando ? this.equipoSvc.actualizarMaterial(id, cuerpo) : this.equipoSvc.crearMaterial(cuerpo);
            case 'encantamiento':
                return editando ? this.equipoSvc.actualizarEncantamiento(id, cuerpo) : this.equipoSvc.crearEncantamiento(cuerpo);
        }
    }

    private obtener(id: number): Observable<EntradaEquipo> {
        switch (this.tipo) {
            case 'arma': return this.armaSvc.getArmaFresca(id);
            case 'armadura': return this.armaduraSvc.getArmaduraFresca(id);
            case 'municion': return this.equipoSvc.getMunicionFresca(id);
            case 'material': return this.equipoSvc.getMaterialFresco(id);
            case 'encantamiento': return this.equipoSvc.getEncantamientoFresco(id);
        }
    }

    private hidratar(entrada: EntradaEquipo): void {
        this.cargada = entrada;
        this.problema = null;
        this.errores.limpiar();
        const uid = () => this.uid();
        let valores: ValoresEquipo = valoresVacios();
        let filas = filasVacias();
        switch (this.tipo) {
            case 'arma':
                valores = valoresDeArma(entrada as ArmaDetalle);
                filas.propiedades = propiedadesDeArma(entrada as ArmaDetalle, uid);
                break;
            case 'armadura':
                valores = valoresDeArmadura(entrada as ArmaduraDetalle);
                break;
            case 'municion':
                valores = valoresDeMunicion(entrada as MunicionDetalle);
                break;
            case 'material':
                valores = valoresDeMaterial(entrada as MaterialDetalle);
                filas.costes = costesDeMaterial(entrada as MaterialDetalle, uid);
                break;
            case 'encantamiento':
                valores = valoresDeEncantamiento(entrada as EncantamientoDetalle);
                filas = filasDeEncantamiento(entrada as EncantamientoDetalle, uid);
                break;
        }
        this.form.reset(valores as any, { emitEvent: false });
        this.filas = filas;
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.cargada = null;
        this.filas = filasVacias();
        this.problema = null;
        this.form.reset(valoresVacios(this.esPieza ? this.idTamanoMediano() : null) as any, { emitEvent: false });
        this.edicion.olvidar();
    }

    /** El tamaño de una pieza nueva: el Mediano (las cifras del catálogo son las de la pieza Mediana), por su nombre. */
    private idTamanoMediano(): number | null {
        return this.tamanos.find((t) => `${t.Nombre}`.trim().toLowerCase() === 'mediano')?.Id ?? null;
    }

    private cargarCatalogos(): void {
        const cargar = cargadorDeCatalogos(this.destroy$);
        cargar(this.manualSvc.getManuales(), (manuales) => this.manuales = opcionesDeCatalogo(manuales as any[]));
        cargar(this.equipoSvc.getCatalogos(), (catalogos) => {
            this.catalogos = catalogos;
            this.propiedadesOpciones = opcionesDeCatalogo(catalogos?.Propiedades_armas ?? []);
        });
        if (this.esPieza) {
            cargar(this.equipoSvc.getMateriales(), (materiales) => this.materiales = opcionesDeCatalogo(materiales));
            cargar(this.tamanoSvc.getTamanos().pipe(map((tamanos) => tamanos.map((t) => ({ Id: t.Id, Nombre: t.Nombre })))), (tamanos) => {
                this.tamanos = tamanos;
                // Una pieza nueva es Mediana mientras no se diga otra cosa.
                if (!this.edicion.editando && this.form.controls.id_tamano.value === null && !this.form.dirty)
                    this.form.controls.id_tamano.setValue(this.idTamanoMediano(), { emitEvent: false });
            });
        }
        if (this.esArma)
            cargar(this.equipoSvc.getMuniciones(), (municiones) => this.municiones = opcionesDeCatalogo(municiones));
        if (this.tipo === 'encantamiento')
            cargar(this.equipoSvc.getEncantamientos(), (encantamientos) => this.encantamientos = opcionesDeCatalogo(encantamientos));
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, this.definicion.listado);
    }

    private uid(): string {
        contadorFilas += 1;
        return `equipo-fila-${contadorFilas}`;
    }
}
