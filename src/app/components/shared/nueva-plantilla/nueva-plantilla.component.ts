import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { Dote } from 'src/app/interfaces/dote';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { Plantilla, PlantillaCreateRequest } from 'src/app/interfaces/plantilla';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DoteService } from 'src/app/services/dote.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { ManualService } from 'src/app/services/manual.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { PrerrequisitosTiposService } from 'src/app/services/prerrequisitos-tipos.service';
import { RacialService } from 'src/app/services/racial.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { UserService } from 'src/app/services/user.service';
import { nombreCombinacionAlineamiento } from 'src/app/services/utils/alineamiento-contrato';
import { CATALOGO_CARACTERISTICAS } from 'src/app/services/utils/caracteristicas';
import { extrasDisponiblesDeDote } from 'src/app/services/utils/dote-mapper';
import { mensajeDeError } from 'src/app/services/utils/error-api';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA } from 'src/app/services/utils/habilidad-extra-visible';
import { toInt, toText } from 'src/app/services/utils/normalizacion';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import {
    CAMPOS_PLANTILLA,
    CARACTERISTICAS_PLANTILLA,
    FilaDotePlantilla,
    FilaHabilidadPlantilla,
    FilaRasgoPlantilla,
    FilaSortilegaPlantilla,
    ListasPlantilla,
    PASOS_PLANTILLA,
    PlantillaFormularioValor,
    TEXTO_SIN_CAMBIO,
    TIPOS_PRERREQUISITO_PLANTILLA,
    camposCambiados,
    construirPlantillaRequest,
    filaNuevaDePrerrequisito,
    filasDesdePrerrequisitosPlantilla,
    firmaFilaPrerrequisito,
    listasDesdePlantilla,
    listasPlantillaVacias,
    tiposConFilas,
    valorDesdePlantilla,
    valorPlantillaNueva,
} from 'src/app/services/utils/plantilla-formulario';
import { GrupoPrerrequisitos, agruparPrerrequisitos, nombreTipoPrerrequisito } from 'src/app/services/utils/prerrequisito-frase';
import { ModoInsercion, confirmarCierreConCambios } from '../insercion-marco/insercion-marco.component';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { PLANTILLA } from 'src/app/services/utils/nombres-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { ErrorDeCampo, ErroresDeFormulario } from '../insercion-marco/errores-de-formulario';
import { alternarControl } from '../insercion-marco/filas-repetibles';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import {
    PrerequisiteCatalogContext,
    PrerequisiteCatalogItem,
    PrerequisiteRowModel,
    PrerequisiteType,
} from '../prerrequisito-editor/prerrequisito-editor.models';
import {
    arePrerequisitesIncomplete,
    getPrerequisiteDefinition,
    getPrerequisiteTypeOptions,
} from '../prerrequisito-editor/prerrequisito-editor.registry';
import { OpcionCatalogo, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';

/** Las listas de rasgos del paso 3 (las tarjetas). */
export type ListaRasgos = 'raciales' | 'ataquesEspeciales' | 'sortilegas' | 'dotes' | 'habilidades' | 'subtipos';

/** Un entero (o vacío): lo único que la web comprueba de los números; lo demás lo valida la API. */
function entero(control: AbstractControl): ValidationErrors | null {
    const valor = control.value;
    if (valor === null || valor === undefined || valor === '')
        return null;
    return Number.isInteger(Number(valor)) ? null : { entero: true };
}

/** Lo que se elige en una lista: «Elige uno» (obligatorio, como el manual y el tamaño). */
function elegido(control: AbstractControl): ValidationErrors | null {
    const valor = control.value;
    return valor === null || valor === undefined || valor === '' ? { required: true } : null;
}

/**
 * Crear y modificar plantillas (lienzo «Plantillas: crear y modificar», aprobado por el propietario el 2026-10-30), en
 * el marco común de las inserciones: cinco pasos a los que se puede saltar (identidad y cuerpo, valores, rasgos, a qué
 * criaturas se aplica y la ficha del manual). Crear manda `POST /plantillas/add`; modificar rellena desde
 * `GET /plantillas/<id>`, marca lo cambiado y manda `PUT /plantillas/<id>` con la plantilla entera. La validación es la
 * del backend: un 400 con `field` marca el campo y lleva a su paso; aquí solo se comprueba lo obvio (nombre, manual,
 * tamaño y números enteros). Las opciones salen de los catálogos que ya carga la web.
 */
@Component({
    selector: 'app-nueva-plantilla',
    templateUrl: './nueva-plantilla.component.html',
    styleUrls: ['./nueva-plantilla.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevaPlantillaComponent) }],
})
export class NuevaPlantillaComponent implements OnInit, OnChanges, OnDestroy, EditorDeCatalogo {
    @Input() modo: ModoInsercion = 'crear';
    @Input() idPlantilla: number | null = null;
    /** La pestaña que la abre: con ella el control de pestañas le pregunta antes de cerrar. */
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() plantillaCreada = new EventEmitter<Plantilla | null>();
    @Output() plantillaActualizada = new EventEmitter<Plantilla>();

    private readonly destroy$ = new Subject<void>();
    private uidContador = 0;

    readonly pasos = PASOS_PLANTILLA;
    pasoActual = 0;
    readonly caracteristicas = CARACTERISTICAS_PLANTILLA;
    readonly sinExtraHabilidad = ID_EXTRA_HABILIDAD_SIN_EXTRA;
    readonly tiposPrerrequisito = getPrerequisiteTypeOptions((tipo) => TIPOS_PRERREQUISITO_PLANTILLA.includes(tipo));

    readonly form: FormGroup<Record<keyof PlantillaFormularioValor, FormControl>>;
    listas: ListasPlantilla = listasPlantillaVacias();
    prerrequisitosTipos: PrerequisiteType[] = [];

    // Catálogos
    manuales: OpcionCatalogo[] = [];
    tamanos: OpcionCatalogo[] = [];
    tiposDado: OpcionCatalogo[] = [];
    pasosModificacion: OpcionCatalogo[] = [];
    tiposCriatura: OpcionCatalogo[] = [];
    maniobrabilidades: OpcionCatalogo[] = [];
    alineamientos: OpcionCatalogo[] = [];
    actitudes: OpcionCatalogo[] = [];
    raciales: OpcionCatalogo[] = [];
    conjuros: OpcionCatalogo[] = [];
    subtipos: OpcionCatalogo[] = [];
    dotes: Dote[] = [];
    dotesOpciones: OpcionCatalogo[] = [];
    habilidades: HabilidadBasicaDetalle[] = [];
    habilidadesOpciones: OpcionCatalogo[] = [];

    readonly catalogContext: PrerequisiteCatalogContext = {
        getCatalog: (tipo) => this.catalogoPrerrequisito(tipo),
        getCatalogName: (tipo, id) => this.catalogoPrerrequisito(tipo).find((item) => item.id === toInt(id))?.nombre ?? '',
        getDoteExtraOptions: () => [],
        dotePermiteExtra: () => false,
        getGlobalExtraOptions: () => [],
        habilidadPermiteExtra: () => false,
        especialPermiteExtra: () => false,
    };
    /** Todos los catálogos se cargan al abrir: no hay nada que esperar al añadir un requisito. */
    readonly asegurarCatalogos = (): Promise<void> => Promise.resolve();

    // Modificar
    plantillaCargada: Plantilla | null = null;
    private cuerpoInicial: PlantillaCreateRequest | null = null;
    private conDgLicInicial = false;
    /** Las frases de la API de los requisitos tal como llegaron, por `uid` (con la firma de la fila). */
    private frasesApi = new Map<string, string>();
    cambios: string[] = [];
    pasosConCambios: number[] = [];
    gruposLectura: GrupoPrerrequisitos[] = [];
    hayFrasesProvisionales = false;

    // Estado
    guardando = false;
    cargandoEdicion = false;
    puedeCrear = false;
    puedeActualizar = false;
    /** El error global (en el `bloque-error` del marco) y el del campo que la API dice que falla (de `CAMPOS_PLANTILLA`). */
    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS_PLANTILLA,
        raiz: 'plantilla',
        control: (campo) => this.form.controls[campo as keyof PlantillaFormularioValor],
        firma: (campo) => this.firmaCampo(campo),
        irAPaso: (paso) => this.pasoActual = paso,
    });
    /** Las tarjetas de rasgos plegadas en el móvil (en el escritorio siempre están abiertas). */
    plegadas: Record<ListaRasgos, boolean> = {
        raciales: true, ataquesEspeciales: true, sortilegas: true, dotes: true, habilidades: true, subtipos: true,
    };

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private plantillaSvc: PlantillaService,
        private manualSvc: ManualService,
        private tamanoSvc: TamanoService,
        private razaCatalogosSvc: RazaCatalogosService,
        private tipoCriaturaSvc: TipoCriaturaService,
        private alineamientoSvc: AlineamientoService,
        private racialSvc: RacialService,
        private conjuroSvc: ConjuroService,
        private doteSvc: DoteService,
        private habilidadSvc: HabilidadService,
        private subtipoSvc: SubtipoService,
        private prerrequisitosTiposSvc: PrerrequisitosTiposService,
    ) {
        const inicial = valorPlantillaNueva();
        const controles = {} as Record<keyof PlantillaFormularioValor, FormControl>;
        (Object.keys(inicial) as (keyof PlantillaFormularioValor)[]).forEach((campo) => {
            const valor = inicial[campo];
            controles[campo] = new FormControl(valor, typeof valor === 'number' ? [entero] : []);
        });
        controles.nombre.setValidators([Validators.required, Validators.maxLength(100)]);
        controles.id_manual.setValidators([Validators.required, Validators.min(1)]);
        controles.id_tamano.setValidators([elegido, entero]);
        controles.pagina.addValidators(Validators.min(0));
        Object.values(controles).forEach((control) => control.updateValueAndValidity({ emitEvent: false }));
        this.form = this.fb.group(controles);
    }

    ngOnInit(): void {
        void this.prerrequisitosTiposSvc.cargar();
        this.actualizarPermisos();
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.alCambiar());
        this.cargarCatalogos();
        this.cargarEdicionSiAplica();
        this.alCambiar();
    }

    ngOnChanges(cambios: SimpleChanges): void {
        if ((cambios['modo'] || cambios['idPlantilla']) && !cambios['modo']?.firstChange && !cambios['idPlantilla']?.firstChange)
            this.cargarEdicionSiAplica();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get esEdicion(): boolean {
        return this.modo === 'editar';
    }

    get errorGlobal(): string {
        return this.errores.global;
    }

    get errorCampo(): ErrorDeCampo | null {
        return this.errores.campo;
    }

    get puedeGuardar(): boolean {
        return this.esEdicion ? this.puedeActualizar : this.puedeCrear;
    }

    get avisoPermisos(): string {
        if (this.cargandoEdicion || this.puedeGuardar)
            return '';
        return this.esEdicion ? 'No tienes permisos para modificar plantillas.' : 'No tienes permisos para crear plantillas.';
    }

    get textoAccion(): string {
        return this.esEdicion ? 'Guardar cambios' : 'Crear plantilla';
    }

    get textoGuardando(): string {
        return this.esEdicion ? 'Guardando cambios…' : 'Creando plantilla…';
    }

    /** En modificar: «Modificar · Plantilla · <manual, p. N>»; en crear, el marco pone «Paso N de 5». */
    get lineaManual(): string {
        const manual = this.plantillaCargada?.Manual;
        const nombre = toText(manual?.Nombre).trim();
        if (!this.esEdicion || !nombre)
            return '';
        const pagina = toInt(manual?.Pagina);
        return pagina > 0 ? `${nombre}, p. ${pagina}` : nombre;
    }

    get hayCambios(): boolean {
        return this.cambios.length > 0;
    }

    /** La nota del pie: en modificar, «N cambios: Nombre, Tamaño…»; con un error de la API, su paso. */
    get notaPie(): string {
        if (!this.esEdicion || this.cargandoEdicion)
            return '';
        if (!this.hayCambios)
            return 'Sin cambios todavía.';
        const etiquetas = this.cambios.map((campo) => CAMPOS_PLANTILLA[campo].etiqueta);
        return `${this.cambios.length === 1 ? '1 cambio' : `${this.cambios.length} cambios`}: ${etiquetas.join(', ')}`;
    }

    get accionDesactivada(): boolean {
        return this.cargandoEdicion || (this.esEdicion && !this.hayCambios);
    }

    // Campos

    etiqueta(campo: string): string {
        const base = CAMPOS_PLANTILLA[campo]?.etiqueta ?? campo;
        return this.cambiado(campo) ? `${base} · cambiado` : base;
    }

    cambiado(campo: string): boolean {
        return this.esEdicion && this.cambios.includes(campo);
    }

    /** El mensaje de error de un campo: el de la API (si apunta a él) o el de la validación de la web. */
    errorDe(campo: string): string | null {
        const control = this.form.controls[campo as keyof PlantillaFormularioValor];
        if (!control)
            return this.errores.mensajeDe(campo);
        if (!control.touched || control.valid)
            return null;
        if (control.hasError('api'))
            return control.getError('api');
        if (control.hasError('required') || control.hasError('min'))
            return campo === 'nombre' ? 'El nombre es obligatorio.' : 'Elige uno.';
        if (control.hasError('maxlength'))
            return 'Máximo 100 caracteres.';
        if (control.hasError('entero'))
            return 'Tiene que ser un número entero.';
        return null;
    }

    control(campo: string): FormControl {
        return this.form.controls[campo as keyof PlantillaFormularioValor];
    }

    elegir(campo: keyof PlantillaFormularioValor, id: number): void {
        const control = this.form.controls[campo];
        control.setValue(id);
        control.markAsTouched();
    }

    alternar(campo: 'oficial' | 'traducido' | 'act_dg' | 'con_dg_lic'): void {
        alternarControl(this.form.controls[campo]);
    }

    setNacimiento(heredada: boolean): void {
        this.form.controls.nacimiento.setValue(heredada);
    }

    // Rasgos (paso 3)

    contar(lista: ListaRasgos): number {
        return this.listas[lista].length;
    }

    idsDe(lista: ListaRasgos): number[] {
        return this.listas[lista].map((fila) => fila.id);
    }

    plegada(lista: ListaRasgos): boolean {
        return this.plegadas[lista];
    }

    alternarPlegada(lista: ListaRasgos): void {
        this.plegadas = { ...this.plegadas, [lista]: !this.plegadas[lista] };
    }

    anadirRasgo(lista: ListaRasgos, id: number): void {
        const opcion = this.opcionesDe(lista).find((item) => item.id === toInt(id));
        if (!opcion || this.idsDe(lista).includes(opcion.id))
            return;
        const base = { uid: this.uid(), id: opcion.id, nombre: opcion.nombre };
        if (lista === 'subtipos')
            this.listas.subtipos = [...this.listas.subtipos, base];
        else if (lista === 'habilidades')
            this.listas.habilidades = [...this.listas.habilidades, { ...base, rangos: 0, id_extra: ID_EXTRA_HABILIDAD_SIN_EXTRA, varios: '' }];
        else if (lista === 'sortilegas')
            this.listas.sortilegas = [...this.listas.sortilegas, { ...base, dg: 1, nivel_lanzador: 1, usos_diarios: '' }];
        else if (lista === 'dotes')
            this.listas.dotes = [...this.listas.dotes, { ...base, dg: 1, id_extra: -1 }];
        else
            this.listas[lista] = [...this.listas[lista], { ...base, dg: 1 }];
        this.alCambiar();
    }

    quitarRasgo(lista: ListaRasgos, uid: string): void {
        (this.listas as unknown as Record<ListaRasgos, { uid: string; }[]>)[lista] = this.listas[lista].filter((fila) => fila.uid !== uid);
        this.alCambiar();
    }

    opcionesDe(lista: ListaRasgos): OpcionCatalogo[] {
        if (lista === 'raciales' || lista === 'ataquesEspeciales')
            return this.raciales;
        if (lista === 'sortilegas')
            return this.conjuros;
        if (lista === 'dotes')
            return this.dotesOpciones;
        if (lista === 'habilidades')
            return this.habilidadesOpciones;
        return this.subtipos;
    }

    extrasDote(fila: FilaDotePlantilla): OpcionCatalogo[] {
        return extrasDisponiblesDeDote(this.dotes.find((item) => item.Id === fila.id))
            .map((item) => ({ id: toInt(item.Id), nombre: toText(item.Nombre) }));
    }

    extrasHabilidad(fila: FilaHabilidadPlantilla): OpcionCatalogo[] {
        return (this.habilidades.find((item) => item.Id_habilidad === fila.id)?.Extras ?? [])
            .map((item) => ({ id: toInt(item.Id_extra), nombre: toText(item.Extra) }))
            .filter((item) => item.id > 0);
    }

    trackByUid(_: number, fila: { uid: string; }): string {
        return fila.uid;
    }

    // Requisitos (paso 4)

    anadirRequisito(tipo: PrerequisiteType): void {
        const { fila, tipos } = filaNuevaDePrerrequisito(tipo, TIPOS_PRERREQUISITO_PLANTILLA, this.prerrequisitosTipos, () => this.uid());
        this.prerrequisitosTipos = tipos;
        this.listas.prerrequisitos = [...this.listas.prerrequisitos, fila];
        this.alCambiar();
    }

    alCambiarTiposRequisito(tipos: PrerequisiteType[]): void {
        this.prerrequisitosTipos = tipos;
    }

    alCambiarRequisitos(filas: PrerequisiteRowModel[]): void {
        this.listas.prerrequisitos = filas;
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
        if (arePrerequisitesIncomplete(this.listas.prerrequisitos, this.prerrequisitosTipos)) {
            this.errores.global = 'Completa o quita los requisitos sin terminar.';
            this.pasoActual = CAMPOS_PLANTILLA['prerrequisitos'].paso;
            return;
        }

        const cuerpo = this.cuerpoActual();
        this.guardando = true;
        try {
            if (this.esEdicion) {
                const respuesta = await this.plantillaSvc.actualizarPlantilla(toInt(this.idPlantilla), cuerpo);
                await avisarGuardado(PLANTILLA, true, respuesta.message);
                if (respuesta.plantilla) {
                    this.hidratar(respuesta.plantilla);
                    this.plantillaActualizada.emit(respuesta.plantilla);
                }
                this.cerrar.emit();
            } else {
                const respuesta = await this.plantillaSvc.crearPlantilla(cuerpo);
                await avisarGuardado(PLANTILLA, false, respuesta.message);
                this.plantillaCreada.emit(respuesta.plantilla);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, this.esEdicion ? 'No se ha podido actualizar la plantilla.' : 'No se ha podido crear la plantilla.');
        } finally {
            this.guardando = false;
        }
    }

    /** Vuelve a la plantilla tal como llegó. */
    descartar(): void {
        if (this.plantillaCargada)
            this.hidratar(this.plantillaCargada);
    }

    async confirmarSalidaSiHayCambios(): Promise<boolean> {
        if (!this.esEdicion || !this.hayCambios)
            return true;
        return confirmarCierreConCambios('de la plantilla');
    }

    /** El cuerpo del alta (y del `PUT`) con lo que hay ahora en el formulario. */
    cuerpoActual(): PlantillaCreateRequest {
        return construirPlantillaRequest(this.form.getRawValue() as PlantillaFormularioValor, this.listas);
    }

    /** Cualquier cambio en el formulario o en las listas: recalcula lo cambiado y la lectura de los requisitos. */
    alCambiar(): void {
        // El error de la API en un campo se va en cuanto se corrige ese campo.
        this.errores.seguirCambios();
        if (this.esEdicion && this.cuerpoInicial) {
            const valor = this.form.getRawValue() as PlantillaFormularioValor;
            this.cambios = camposCambiados(this.cuerpoInicial, this.cuerpoActual(), this.conDgLicInicial, valor.con_dg_lic === true);
        } else {
            this.cambios = [];
        }
        this.pasosConCambios = Array.from(new Set(this.cambios.map((campo) => CAMPOS_PLANTILLA[campo].paso)));
        this.recalcularLectura();
    }

    /** Lo que vale ahora un campo (un escalar del formulario o una lista), para saber si se ha corregido. */
    private firmaCampo(campo: string): string {
        const control = this.form.controls[campo as keyof PlantillaFormularioValor];
        if (control)
            return JSON.stringify(control.value ?? null);
        const cuerpo = this.cuerpoActual() as unknown as Record<string, unknown>;
        return JSON.stringify(cuerpo[campo] ?? null);
    }

    private recalcularLectura(): void {
        const porTipo: Record<string, { Opcional: number; Frase: string; }[]> = {};
        let provisionales = false;
        this.listas.prerrequisitos.forEach((fila) => {
            if (!getPrerequisiteDefinition(fila.tipo).isComplete(fila))
                return;
            const guardada = this.frasesApi.get(fila.uid);
            const firma = `${firmaFilaPrerrequisito(fila)}|`;
            let frase = guardada?.startsWith(firma) ? guardada.slice(firma.length) : '';
            if (!frase) {
                frase = this.fraseProvisional(fila);
                provisionales = true;
            }
            (porTipo[fila.tipo] ??= []).push({ Opcional: Math.max(0, toInt(fila.opcional)), Frase: frase });
        });
        this.gruposLectura = agruparPrerrequisitos(porTipo);
        this.hayFrasesProvisionales = provisionales;
    }

    /**
     * Mientras no se guarde, un requisito nuevo o cambiado no tiene la frase de la API (la escribe el backend, en un solo
     * sitio): se enseña su tipo y su valor, y una nota lo dice.
     */
    private fraseProvisional(fila: PrerequisiteRowModel): string {
        const definicion = getPrerequisiteDefinition(fila.tipo);
        const nombre = (id: number) => this.catalogContext.getCatalogName(fila.tipo, id);
        let valor: string;
        if (fila.tipo === 'criaturas_compatibles')
            valor = `${nombre(fila.id)} → ${toInt(fila.id_destino) > 0 ? nombre(toInt(fila.id_destino)) : 'conserva su tipo'}`;
        else if (definicion.editorKind === 'value-only')
            valor = `${toInt(fila.valor)}`;
        else if (definicion.editorKind === 'catalog-plus-value')
            valor = `${nombre(fila.id)} ${toInt(fila.valor)}`;
        else
            valor = nombre(fila.id);
        return `${nombreTipoPrerrequisito(fila.tipo)}: ${valor}`;
    }

    private catalogoPrerrequisito(tipo: PrerequisiteType): PrerequisiteCatalogItem[] {
        switch (tipo) {
            case 'actitud_requerido':
            case 'actitud_prohibido':
                return this.actitudes;
            case 'alineamiento_requerido':
                return this.alineamientos;
            case 'caracteristica':
                return [...CATALOGO_CARACTERISTICAS];
            case 'criaturas_compatibles':
                return this.tiposCriatura;
            case 'tamano_minimo':
            case 'tamano_maximo':
                return this.tamanos;
            case 'subtipo':
            case 'subtipo_prohibido':
                return this.subtipos;
            case 'dote':
                return this.dotesOpciones;
            default:
                return [];
        }
    }

    private cargarEdicionSiAplica(): void {
        const id = toInt(this.idPlantilla);
        if (!this.esEdicion || id <= 0)
            return;
        this.cargandoEdicion = true;
        this.plantillaSvc.getPlantillaFresca(id).pipe(take(1), takeUntil(this.destroy$)).subscribe({
            next: (plantilla) => {
                this.cargandoEdicion = false;
                this.hidratar(plantilla);
            },
            error: (error) => {
                this.cargandoEdicion = false;
                this.errores.global = mensajeDeError(error, 'No se ha podido cargar la plantilla.');
            },
        });
    }

    /** Rellena el formulario con una plantilla y la toma como punto de partida de los cambios. */
    hidratar(plantilla: Plantilla): void {
        this.plantillaCargada = plantilla;
        const valor = valorDesdePlantilla(plantilla);
        this.form.reset(valor, { emitEvent: false });
        const listas = listasDesdePlantilla(plantilla, () => this.uid());
        const { filas, frases } = filasDesdePrerrequisitosPlantilla(plantilla.Prerrequisitos, () => this.uid());
        listas.prerrequisitos = filas;
        this.listas = listas;
        this.frasesApi = frases;
        this.prerrequisitosTipos = tiposConFilas(TIPOS_PRERREQUISITO_PLANTILLA, filas);
        this.errores.limpiar();
        this.cuerpoInicial = this.cuerpoActual();
        this.conDgLicInicial = valor.con_dg_lic;
        this.alCambiar();
    }

    private reiniciar(): void {
        this.form.reset(valorPlantillaNueva(), { emitEvent: false });
        this.listas = listasPlantillaVacias();
        this.prerrequisitosTipos = [];
        this.frasesApi = new Map();
        this.pasoActual = 0;
        this.alCambiar();
    }

    private actualizarPermisos(): void {
        // La API pide el permiso de creación de `plantillas` también para modificar (`PUT /plantillas/<id>`).
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'plantillas');
        this.puedeActualizar = this.puedeCrear;
    }

    private cargarCatalogos(): void {
        const opciones = opcionesDeCatalogo;
        const porId = (lista: OpcionCatalogo[]) => [...lista].sort((a, b) => a.id - b.id);
        const suscribir = <T>(fuente: Observable<T>, siguiente: (valor: T) => void) =>
            fuente.pipe(takeUntil(this.destroy$)).subscribe({ next: siguiente, error: () => undefined });

        suscribir(this.manualSvc.getManuales(), (items) => this.manuales = opciones(items));
        // El listado de tamaños no trae el 0, «Depende» (el de la criatura base), que es el de casi todas las plantillas.
        let tamanoBase: OpcionCatalogo[] = [];
        let tamanosListado: OpcionCatalogo[] = [];
        const unirTamanos = () => this.tamanos = porId([...tamanoBase, ...tamanosListado.filter((item) => item.id !== 0)]);
        suscribir(this.tamanoSvc.getTamanos(), (items) => { tamanosListado = opciones(items); unirTamanos(); });
        suscribir(this.tamanoSvc.getTamano(0).pipe(take(1)), (item) => { tamanoBase = opciones(item ? [item] : []); unirTamanos(); });
        suscribir(this.razaCatalogosSvc.getTiposDado(), (items) => this.tiposDado = porId(opciones(items)));
        suscribir(this.razaCatalogosSvc.getManiobrabilidades(), (items) => this.maniobrabilidades = porId(opciones(items)).filter((item) => item.id > 0));
        suscribir(this.razaCatalogosSvc.getActitudes(), (items) => this.actitudes = opciones(items));
        suscribir(this.tipoCriaturaSvc.getTiposCriatura(), (items) => this.tiposCriatura = opciones(items));
        suscribir(this.alineamientoSvc.getAlineamientosCombinacionesCatalogo(), (items) => this.alineamientos = (items ?? [])
            .map((item) => ({ id: toInt(item?.Id), nombre: nombreCombinacionAlineamiento(item) }))
            .filter((item) => item.nombre.length > 0)
            .sort((a, b) => compararTexto(a.nombre, b.nombre)));
        suscribir(this.racialSvc.getRaciales(), (items) => this.raciales = opciones(items));
        suscribir(this.conjuroSvc.getConjuros(), (items) => this.conjuros = opciones(items));
        suscribir(this.subtipoSvc.getSubtipos(), (items) => this.subtipos = opciones(items).filter((item) => item.id > 0));
        suscribir(this.doteSvc.getDotes(), (items) => {
            this.dotes = items ?? [];
            this.dotesOpciones = opciones(items);
        });
        suscribir(this.habilidadSvc.getHabilidades(), (items) => {
            this.habilidades = items ?? [];
            this.habilidadesOpciones = (items ?? [])
                .map((item) => ({ id: toInt(item.Id_habilidad), nombre: toText(item.Nombre).trim() }))
                .filter((item) => item.id > 0 && item.nombre.length > 0)
                .sort((a, b) => compararTexto(a.nombre, b.nombre));
        });
        // No hay catálogo de pasos de modificación en el contrato: salen de los que ya usan las plantillas, más el 0
        // (no cambia, que la lectura da como relleno).
        suscribir(this.plantillaSvc.getPlantillas(), (items) => {
            const pasos = new Map<number, string>([[0, TEXTO_SIN_CAMBIO]]);
            (items ?? []).forEach((plantilla) => [plantilla.Modificacion_tamano, plantilla.Modificacion_dg].forEach((paso) => {
                const id = toInt(paso?.Id_paso_modificacion);
                const nombre = toText(paso?.Nombre).trim();
                if (id !== 0 && nombre.length > 0)
                    pasos.set(id, nombre);
            }));
            this.pasosModificacion = Array.from(pasos.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.id - b.id);
        });
    }

    private uid(): string {
        this.uidContador += 1;
        return `plantilla_${this.uidContador}`;
    }
}
