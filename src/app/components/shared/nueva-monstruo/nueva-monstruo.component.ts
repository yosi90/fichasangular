import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Dote } from 'src/app/interfaces/dote';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { MonstruoCreateRequest, MonstruoDetalle, MonstruoMutacionResponse } from 'src/app/interfaces/monstruo';
import { Tamano } from 'src/app/interfaces/tamaño';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DoteService } from 'src/app/services/dote.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { RacialService } from 'src/app/services/racial.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { UserService } from 'src/app/services/user.service';
import { nombreCombinacionAlineamiento } from 'src/app/services/utils/alineamiento-contrato';
import { opcionesDeExtrasDeDote } from 'src/app/services/utils/dote-mapper';
import { mensajeDeError } from 'src/app/services/utils/error-api';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA, opcionDeHabilidad, opcionesDeExtrasDeHabilidad } from 'src/app/services/utils/habilidad-extra-visible';
import {
    CAMPOS_MONSTRUO,
    CARACTERISTICAS_MONSTRUO,
    DIETAS_MONSTRUO_OPCIONES,
    FilaNivelClaseMonstruo,
    ListasMonstruo,
    MonstruoFormularioValor,
    PASOS_MONSTRUO,
    camposCambiadosMonstruo,
    construirMonstruoRequest,
    filaNivelClaseNueva,
    listasDesdeMonstruo,
    listasMonstruoVacias,
    textoLicantropos,
    valorDesdeMonstruo,
    valorMonstruoNuevo,
} from 'src/app/services/utils/monstruo-formulario';
import { CAMPOS_VELOCIDAD } from 'src/app/services/utils/movimientos-mapper';
import { MONSTRUO } from 'src/app/services/utils/nombres-de-catalogo';
import { toInt, toText } from 'src/app/services/utils/normalizacion';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { OpcionCatalogo, opcionesDeCatalogo, opcionesPorId } from '../catalogo-buscador/catalogo-buscador.component';
import { EdicionDeCatalogo, cargadorDeCatalogos } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { ErrorDeCampo, ErroresDeFormulario, entero } from '../insercion-marco/errores-de-formulario';
import { etiquetaDeCampo, notaDeCambios, pasosConCambios } from '../insercion-marco/cambios-de-formulario';
import { FilaNombrada, alternarControl, elegirEnControl } from '../insercion-marco/filas-repetibles';
import { ModoInsercion, detalleDeManual } from '../insercion-marco/insercion-marco.component';

/** Las listas de catálogo del paso «Aptitudes» (las tarjetas) y las del paso «Identidad» (subtipos e idiomas). */
export type ListaMonstruo = 'raciales' | 'ataquesEspeciales' | 'sortilegas' | 'dotes' | 'habilidades' | 'subtipos' | 'idiomas';

/** El espacio, en medios pies (2,5 de una criatura Menuda). */
function enMedios(control: AbstractControl): ValidationErrors | null {
    const valor = Number(control.value);
    if (control.value === null || control.value === '' || !Number.isFinite(valor))
        return { required: true };
    return valor >= 0 && Number.isInteger(valor * 2) ? null : { medios: true };
}

/** Lo que se elige en una lista: obligatorio (el tipo, el tamaño, el dado y el alineamiento). */
function elegido(control: AbstractControl): ValidationErrors | null {
    return toInt(control.value) > 0 ? null : { required: true };
}

/** «12», «1/2»: los DG de un monstruo, como los pide la API. */
const PATRON_DG = /^\d{1,4}(\/\d{1,3})?$/;

/**
 * Crear y modificar monstruos (hito 6 del roadmap de inserciones, 2026-10-31), en el marco común de las inserciones, con
 * seis pasos a los que se puede saltar (identidad, combate, características y salvaciones, aptitudes, familiar y
 * compañero, descripción). Crear manda `POST /monstruos/add`; modificar rellena desde `GET /monstruos/<id>`, marca lo
 * cambiado y manda `PUT /monstruos/<id>` con el monstruo entero. La validación es la del backend: un 400 con `field`
 * marca el campo y lleva a su paso; aquí solo se comprueba lo obvio. Los familiares y compañeros concretos que salen del
 * monstruo no se editan aquí: la API los conserva.
 */
@Component({
    selector: 'app-nueva-monstruo',
    templateUrl: './nueva-monstruo.component.html',
    styleUrls: ['./nueva-monstruo.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevaMonstruoComponent) }],
})
export class NuevaMonstruoComponent implements OnInit, OnChanges, OnDestroy, EditorDeCatalogo {
    @Input() modo: ModoInsercion = 'crear';
    @Input() idMonstruo: number | null = null;
    /** La pestaña que la abre: con ella el control de pestañas le pregunta antes de cerrar. */
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() monstruoCreado = new EventEmitter<MonstruoDetalle | null>();
    @Output() monstruoActualizado = new EventEmitter<MonstruoDetalle>();

    private readonly destroy$ = new Subject<void>();
    private uidContador = 0;

    readonly pasos = PASOS_MONSTRUO;
    pasoActual = 0;
    readonly caracteristicas = CARACTERISTICAS_MONSTRUO;
    readonly dietas = DIETAS_MONSTRUO_OPCIONES;
    readonly sinExtraHabilidad = ID_EXTRA_HABILIDAD_SIN_EXTRA;
    readonly velocidades = CAMPOS_VELOCIDAD;

    readonly form: FormGroup<Record<keyof MonstruoFormularioValor, FormControl>>;
    listas: ListasMonstruo = listasMonstruoVacias();

    // Catálogos
    manuales: OpcionCatalogo[] = [];
    tiposCriatura: OpcionCatalogo[] = [];
    tamanos: Tamano[] = [];
    tiposDado: OpcionCatalogo[] = [];
    maniobrabilidades: OpcionCatalogo[] = [];
    alineamientos: OpcionCatalogo[] = [];
    alineamientosBasicos: OpcionCatalogo[] = [];
    preferenciasLey: OpcionCatalogo[] = [];
    preferenciasMoral: OpcionCatalogo[] = [];
    plantillasFamiliar: OpcionCatalogo[] = [];
    clases: OpcionCatalogo[] = [];
    subtipos: OpcionCatalogo[] = [];
    idiomas: OpcionCatalogo[] = [];
    raciales: OpcionCatalogo[] = [];
    conjuros: OpcionCatalogo[] = [];
    dotes: Dote[] = [];
    dotesOpciones: OpcionCatalogo[] = [];
    habilidades: HabilidadBasicaDetalle[] = [];
    habilidadesOpciones: OpcionCatalogo[] = [];

    // Modificar
    monstruoCargado: MonstruoDetalle | null = null;
    private cuerpoInicial: MonstruoCreateRequest | null = null;
    cambios: string[] = [];
    pasosConCambios: number[] = [];

    // Estado
    guardando = false;
    puedeGuardar = false;
    readonly edicion = new EdicionDeCatalogo<MonstruoDetalle>({
        nombre: MONSTRUO,
        modo: () => this.modo,
        id: () => this.idMonstruo,
        obtener: (id) => this.monstruoSvc.getMonstruoFresco(id),
        hidratar: (monstruo) => this.hidratar(monstruo),
        foto: () => JSON.stringify(this.cuerpoActual()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.global = mensajeDeError(error, 'No se ha podido cargar el monstruo.'),
    });
    /** El error global (en el `bloque-error` del marco) y el del campo que la API dice que falla (de `CAMPOS_MONSTRUO`). */
    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS_MONSTRUO,
        raiz: 'monstruo',
        control: (campo) => this.form.controls[campo as keyof MonstruoFormularioValor],
        firma: (campo) => this.firmaCampo(campo),
        irAPaso: (paso) => this.pasoActual = paso,
    });
    /** Las tarjetas de aptitudes plegadas en el móvil (en el escritorio siempre están abiertas). */
    plegadas: Record<ListaMonstruo, boolean> = {
        raciales: true, ataquesEspeciales: true, sortilegas: true, dotes: true, habilidades: true, subtipos: true, idiomas: true,
    };

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private monstruoSvc: MonstruoService,
        private manualSvc: ManualService,
        private tamanoSvc: TamanoService,
        private razaCatalogosSvc: RazaCatalogosService,
        private tipoCriaturaSvc: TipoCriaturaService,
        private alineamientoSvc: AlineamientoService,
        private claseSvc: ClaseService,
        private racialSvc: RacialService,
        private conjuroSvc: ConjuroService,
        private doteSvc: DoteService,
        private habilidadSvc: HabilidadService,
        private subtipoSvc: SubtipoService,
        private idiomaSvc: IdiomaService,
    ) {
        const inicial = valorMonstruoNuevo();
        const controles = {} as Record<keyof MonstruoFormularioValor, FormControl>;
        (Object.keys(inicial) as (keyof MonstruoFormularioValor)[]).forEach((campo) => {
            const valor = inicial[campo];
            controles[campo] = new FormControl(valor, typeof valor === 'number' ? [entero] : []);
        });
        controles.nombre.setValidators([Validators.required, Validators.maxLength(50)]);
        controles.id_manual.setValidators([Validators.required, Validators.min(1)]);
        [controles.id_tipo, controles.id_tamano, controles.id_tipo_dado, controles.id_alineamiento].forEach((control) => control.setValidators([elegido]));
        controles.cantidad_dg.setValidators([Validators.required, Validators.pattern(PATRON_DG)]);
        controles.espacio.setValidators([enMedios]);
        CARACTERISTICAS_MONSTRUO.forEach((c) => controles[c.campo].setValidators([entero, Validators.min(0)]));
        (['pagina', 'suma_dg', ...CAMPOS_VELOCIDAD, 'alcance'] as const)
            .forEach((campo) => controles[campo].addValidators(Validators.min(0)));
        Object.values(controles).forEach((control) => control.updateValueAndValidity({ emitEvent: false }));
        this.form = this.fb.group(controles);
    }

    ngOnInit(): void {
        this.actualizarPermisos();
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.alCambiar());
        this.cargarCatalogos();
        this.edicion.cargarSiHaceFalta();
        this.alCambiar();
    }

    ngOnChanges(cambios: SimpleChanges): void {
        if ((cambios['modo'] && !cambios['modo'].firstChange) || (cambios['idMonstruo'] && !cambios['idMonstruo'].firstChange))
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get esEdicion(): boolean {
        return this.edicion.editando;
    }

    get errorGlobal(): string {
        return this.errores.global;
    }

    get errorCampo(): ErrorDeCampo | null {
        return this.errores.campo;
    }

    get avisoPermisos(): string {
        return this.edicion.avisoPermisos(this.puedeGuardar);
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(false);
    }

    get textoGuardando(): string {
        return this.edicion.textoAccion(true);
    }

    /** En modificar: «Modificar · Monstruo · <manual, p. N>»; en crear, el marco pone «Paso N de 6». */
    get lineaManual(): string {
        return this.esEdicion ? detalleDeManual(this.monstruoCargado?.Manual) : '';
    }

    get hayCambios(): boolean {
        return this.edicion.hayCambios;
    }

    /** La nota del pie: en modificar, «N cambios: Nombre, Tamaño…». */
    get notaPie(): string {
        return !this.esEdicion || this.edicion.cargando ? '' : notaDeCambios(this.cambios, CAMPOS_MONSTRUO);
    }

    get accionDesactivada(): boolean {
        return this.edicion.cargando || (this.esEdicion && !this.hayCambios);
    }

    /** Los familiares y compañeros concretos que salen del monstruo: no se editan aquí (la API los conserva). */
    get derivados(): string[] {
        const monstruo = this.monstruoCargado;
        if (!this.esEdicion || !monstruo)
            return [];
        return [
            ...(monstruo.Familiares ?? []).map((item) => `Familiar: ${toText(item?.Nombre)}`),
            ...(monstruo.Companeros ?? []).map((item) => `Compañero: ${toText(item?.Nombre)}`),
        ];
    }

    // Campos

    etiqueta(campo: string): string {
        return etiquetaDeCampo(CAMPOS_MONSTRUO, campo, this.cambiado(campo));
    }

    cambiado(campo: string): boolean {
        return this.esEdicion && this.cambios.includes(campo);
    }

    /** El mensaje de error de un campo: el de la API (si apunta a él) o el de la validación de la web. */
    errorDe(campo: string): string | null {
        const control = this.form.controls[campo as keyof MonstruoFormularioValor];
        if (!control)
            return this.errores.mensajeDe(campo);
        if (!control.touched || control.valid)
            return null;
        if (control.hasError('api'))
            return control.getError('api');
        if (control.hasError('required'))
            return campo === 'nombre' ? 'El nombre es obligatorio.' : campo === 'cantidad_dg' || campo === 'espacio' ? 'Obligatorio.' : 'Elige uno.';
        if (control.hasError('maxlength'))
            return 'Máximo 50 caracteres.';
        if (control.hasError('pattern'))
            return 'Un número («12») o una fracción («1/2»).';
        if (control.hasError('medios'))
            return 'En pies, en medios: 2,5, 5, 10…';
        if (control.hasError('min'))
            return campo === 'id_manual' ? 'Elige uno.' : 'No puede ser negativo.';
        if (control.hasError('entero'))
            return 'Tiene que ser un número entero.';
        return null;
    }

    control(campo: string): FormControl {
        return this.form.controls[campo as keyof MonstruoFormularioValor];
    }

    elegir(campo: keyof MonstruoFormularioValor, id: number): void {
        elegirEnControl(this.form.controls[campo], id);
    }

    alternar(campo: 'oficial' | 'familiar' | 'companero'): void {
        alternarControl(this.form.controls[campo]);
    }

    /** Al elegir el tamaño de un monstruo nuevo, su espacio y su alcance son los del tamaño (se pueden cambiar). */
    alElegirTamano(id: number): void {
        if (this.esEdicion)
            return;
        const tamano = this.tamanos.find((item) => item.Id === toInt(id));
        if (tamano?.Espacio !== null && tamano?.Espacio !== undefined)
            this.form.controls.espacio.setValue(tamano.Espacio);
        if (tamano?.Alcance !== null && tamano?.Alcance !== undefined)
            this.form.controls.alcance.setValue(tamano.Alcance);
    }

    // Listas de catálogo

    contar(lista: ListaMonstruo): number {
        return this.listas[lista].length;
    }

    idsDe(lista: ListaMonstruo): number[] {
        return this.listas[lista].map((fila) => fila.id);
    }

    plegada(lista: ListaMonstruo): boolean {
        return this.plegadas[lista];
    }

    alternarPlegada(lista: ListaMonstruo): void {
        this.plegadas = { ...this.plegadas, [lista]: !this.plegadas[lista] };
    }

    anadirALista(lista: ListaMonstruo, id: number): void {
        const opcion = this.opcionesDe(lista).find((item) => item.id === toInt(id));
        if (!opcion || this.idsDe(lista).includes(opcion.id))
            return;
        const base: FilaNombrada = { uid: this.uid(), id: opcion.id, nombre: opcion.nombre };
        if (lista === 'habilidades')
            this.listas.habilidades = [...this.listas.habilidades, { ...base, rangos: 0, id_extra: ID_EXTRA_HABILIDAD_SIN_EXTRA }];
        else if (lista === 'sortilegas')
            this.listas.sortilegas = [...this.listas.sortilegas, { ...base, nivel_lanzador: 1, usos_diarios: '' }];
        else if (lista === 'dotes')
            this.listas.dotes = [...this.listas.dotes, { ...base, id_extra: -1 }];
        else
            this.listas[lista] = [...this.listas[lista], base];
        this.alCambiar();
    }

    quitarDeLista(lista: ListaMonstruo, uid: string): void {
        (this.listas as unknown as Record<ListaMonstruo, { uid: string; }[]>)[lista] = this.listas[lista].filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    opcionesDe(lista: ListaMonstruo): OpcionCatalogo[] {
        switch (lista) {
            case 'raciales':
            case 'ataquesEspeciales':
                return this.raciales;
            case 'sortilegas':
                return this.conjuros;
            case 'dotes':
                return this.dotesOpciones;
            case 'habilidades':
                return this.habilidadesOpciones;
            case 'idiomas':
                return this.idiomas;
            default:
                return this.subtipos;
        }
    }

    extrasDote(idDote: number): OpcionCatalogo[] {
        return opcionesDeExtrasDeDote(this.dotes, idDote);
    }

    extrasHabilidad(idHabilidad: number): OpcionCatalogo[] {
        return opcionesDeExtrasDeHabilidad(this.habilidades, idHabilidad).filter((item) => item.id > 0);
    }

    trackByUid(_: number, fila: { uid: string; }): string {
        return fila.uid;
    }

    // Familiar y compañero

    alineamientoRequerido(relacion: 'familiar' | 'companero', id: number): boolean {
        return this.listas[`alineamientos_${relacion}`].includes(id);
    }

    alternarAlineamientoRequerido(relacion: 'familiar' | 'companero', id: number): void {
        const clave = `alineamientos_${relacion}` as const;
        const actuales = this.listas[clave];
        this.listas[clave] = actuales.includes(id) ? actuales.filter((item) => item !== id) : [...actuales, id];
        this.alCambiar();
    }

    nombreClase(id: number): string {
        return this.clases.find((item) => item.id === id)?.nombre ?? `Clase ${id}`;
    }

    anadirNivelClase(idClase: number): void {
        if (toInt(idClase) <= 0)
            return;
        this.listas.niveles_clase = [...this.listas.niveles_clase, filaNivelClaseNueva(this.uid(), idClase)];
        this.alCambiar();
    }

    quitarNivelClase(uid: string): void {
        this.listas.niveles_clase = this.listas.niveles_clase.filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    elegirDoteDeNivel(fila: FilaNivelClaseMonstruo, id: number): void {
        fila.id_dote = Math.max(0, toInt(id));
        this.alCambiar();
    }

    // Guardar

    async guardar(): Promise<void> {
        if (!this.puedeGuardar) {
            await avisarSinPermisos(this.userSvc.getPermissionDeniedMessage());
            return;
        }
        if (this.guardando || this.accionDesactivada)
            return;
        this.errores.limpiar();
        this.form.markAllAsTouched();
        if (this.form.invalid) {
            this.errores.irAlPrimerError();
            return;
        }

        const cuerpo = this.cuerpoActual();
        this.guardando = true;
        try {
            if (this.esEdicion) {
                const respuesta = await this.monstruoSvc.actualizarMonstruo(this.edicion.id, cuerpo);
                await avisarGuardado(MONSTRUO, true, mensajeConLicantropos(respuesta));
                if (respuesta.monstruo) {
                    this.hidratar(respuesta.monstruo);
                    this.monstruoActualizado.emit(respuesta.monstruo);
                }
                this.cerrar.emit();
            } else {
                const respuesta = await this.monstruoSvc.crearMonstruo(cuerpo);
                await avisarGuardado(MONSTRUO, false, mensajeConLicantropos(respuesta));
                this.monstruoCreado.emit(respuesta.monstruo);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, this.esEdicion ? 'No se ha podido actualizar el monstruo.' : 'No se ha podido crear el monstruo.');
        } finally {
            this.guardando = false;
        }
    }

    /** Vuelve al monstruo tal como llegó. */
    descartar(): void {
        if (this.monstruoCargado)
            this.hidratar(this.monstruoCargado);
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo del alta (y del `PUT`) con lo que hay ahora en el formulario. */
    cuerpoActual(): MonstruoCreateRequest {
        return construirMonstruoRequest(this.form.getRawValue() as MonstruoFormularioValor, this.listas);
    }

    /** Cualquier cambio en el formulario o en las listas: recalcula lo cambiado. */
    alCambiar(): void {
        this.errores.seguirCambios();
        this.cambios = this.esEdicion && this.cuerpoInicial ? camposCambiadosMonstruo(this.cuerpoInicial, this.cuerpoActual()) : [];
        this.pasosConCambios = pasosConCambios(this.cambios, CAMPOS_MONSTRUO);
    }

    /** Rellena el formulario con un monstruo y lo toma como punto de partida de los cambios. */
    hidratar(monstruo: MonstruoDetalle): void {
        this.monstruoCargado = monstruo;
        this.form.reset(valorDesdeMonstruo(monstruo), { emitEvent: false });
        this.listas = listasDesdeMonstruo(monstruo, () => this.uid());
        this.errores.limpiar();
        this.cuerpoInicial = this.cuerpoActual();
        this.edicion.tomarPuntoDePartida();
        this.alCambiar();
    }

    /** Lo que vale ahora un campo (un escalar del formulario o una lista), para saber si se ha corregido. */
    private firmaCampo(campo: string): string {
        const control = this.form.controls[campo as keyof MonstruoFormularioValor];
        if (control)
            return JSON.stringify(control.value ?? null);
        const cuerpo = this.cuerpoActual() as unknown as Record<string, unknown>;
        return JSON.stringify(cuerpo[campo] ?? null);
    }

    private reiniciar(): void {
        this.form.reset(valorMonstruoNuevo(), { emitEvent: false });
        this.listas = listasMonstruoVacias();
        this.monstruoCargado = null;
        this.cuerpoInicial = null;
        this.edicion.olvidar();
        this.pasoActual = 0;
        this.alCambiar();
    }

    private actualizarPermisos(): void {
        // La API pide el permiso de creación de `monstruos` también para modificar (`PUT /monstruos/<id>`).
        this.puedeGuardar = puedeGestionarCatalogo(this.userSvc, 'monstruos');
    }

    private cargarCatalogos(): void {
        const suscribir = cargadorDeCatalogos(this.destroy$);

        suscribir(this.manualSvc.getManuales(), (items) => this.manuales = opcionesDeCatalogo(items));
        suscribir(this.tipoCriaturaSvc.getTiposCriatura(), (items) => this.tiposCriatura = opcionesDeCatalogo(items));
        suscribir(this.tamanoSvc.getTamanos(), (items) => this.tamanos = [...(items ?? [])].filter((item) => item.Id > 0).sort((a, b) => a.Id - b.Id));
        suscribir(this.razaCatalogosSvc.getTiposDado(), (items) => this.tiposDado = opcionesPorId(opcionesDeCatalogo(items)).filter((item) => item.id > 0));
        suscribir(this.razaCatalogosSvc.getManiobrabilidades(), (items) => this.maniobrabilidades = opcionesPorId(opcionesDeCatalogo(items)).filter((item) => item.id > 0));
        suscribir(this.alineamientoSvc.getAlineamientosCombinacionesCatalogo(), (items) => this.alineamientos =
            opcionesDeCatalogo(items, (item) => ({ id: toInt(item?.Id), nombre: nombreCombinacionAlineamiento(item) })));
        suscribir(this.alineamientoSvc.getAlineamientosBasicosCatalogo(), (items) => this.alineamientosBasicos = opcionesPorId(opcionesDeCatalogo(items)).filter((item) => item.id > 0));
        suscribir(this.alineamientoSvc.getAlineamientosPreferenciaLeyCatalogo(), (items) => this.preferenciasLey = opcionesPorId(opcionesDeCatalogo(items)).filter((item) => item.id > 0));
        suscribir(this.alineamientoSvc.getAlineamientosPreferenciaMoralCatalogo(), (items) => this.preferenciasMoral = opcionesPorId(opcionesDeCatalogo(items)).filter((item) => item.id > 0));
        suscribir(this.monstruoSvc.getPlantillasFamiliar(), (items) => this.plantillasFamiliar = opcionesPorId(opcionesDeCatalogo(items)));
        suscribir(this.claseSvc.getClases(), (items) => this.clases = opcionesDeCatalogo(items).filter((item) => item.id > 0));
        suscribir(this.subtipoSvc.getSubtipos(), (items) => this.subtipos = opcionesDeCatalogo(items).filter((item) => item.id > 0));
        suscribir(this.idiomaSvc.getIdiomas(), (items) => this.idiomas = opcionesDeCatalogo(items).filter((item) => item.id > 0));
        suscribir(this.racialSvc.getRaciales(), (items) => this.raciales = opcionesDeCatalogo(items));
        suscribir(this.conjuroSvc.getConjuros(), (items) => this.conjuros = opcionesDeCatalogo(items));
        suscribir(this.doteSvc.getDotes(), (items) => {
            this.dotes = items ?? [];
            this.dotesOpciones = opcionesDeCatalogo(items);
        });
        suscribir(this.habilidadSvc.getHabilidades(), (items) => {
            this.habilidades = items ?? [];
            this.habilidadesOpciones = opcionesDeCatalogo(items, opcionDeHabilidad)
                .filter((item) => item.id > 0);
        });
    }

    private uid(): string {
        this.uidContador += 1;
        return `monstruo_${this.uidContador}`;
    }
}

/** El mensaje de la API y, detrás, lo que ha pasado con sus licántropos. */
function mensajeConLicantropos(respuesta: MonstruoMutacionResponse): string {
    return [respuesta.message, textoLicantropos(respuesta.licantropos)].filter((texto) => `${texto ?? ''}`.length > 0).join(' ');
}
