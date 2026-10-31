import { Component, EventEmitter, forwardRef, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { ConjuroCatalogItem, SubdisciplinaCatalogItem } from 'src/app/interfaces/conjuro-catalogos';
import { ConjuroCreateNivelRef, ConjuroCreateRequest, ConjuroEditable, ConjuroVariante } from 'src/app/interfaces/conjuros-api';
import { DisciplinaConjuros } from 'src/app/interfaces/disciplina-conjuros';
import { DominioDetalle } from 'src/app/interfaces/dominio';
import { EscuelaConjuros } from 'src/app/interfaces/escuela-conjuros';
import { Manual } from 'src/app/interfaces/manual';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroCatalogosService } from 'src/app/services/conjuro-catalogos.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { DominioService } from 'src/app/services/dominio.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { ManualService } from 'src/app/services/manual.service';
import { SubdisciplinaConjurosService } from 'src/app/services/subdisciplina-conjuros.service';
import { UserService } from 'src/app/services/user.service';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { OpcionCatalogo, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';
import { EdicionDeCatalogo } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario } from '../insercion-marco/errores-de-formulario';
import { ModoInsercion } from '../insercion-marco/insercion-marco.component';
import { CONJURO } from 'src/app/services/utils/nombres-de-catalogo';
import { textoOSinEspecificar } from 'src/app/services/utils/texto-sin-especificar';
import { alternarControl, elegirEnControl } from '../insercion-marco/filas-repetibles';
import { normalizarTexto, toArray, toInt } from 'src/app/services/utils/normalizacion';
import { porNombre } from 'src/app/services/utils/orden-texto';

interface CrearConjuroEmitPayload {
    idConjuro: number;
    nombre: string;
}

interface NivelEditorRow {
    uid: string;
    id: number;
    nivel: number;
    espontaneo: boolean;
}

type NivelFieldKey = 'id_clase' | 'id_dominio' | 'id_disciplina';

/**
 * Los campos del conjuro por su clave en el cuerpo del alta (`conjuro.<campo>` y las listas), para que un error de la API
 * con `field` vaya a su campo (`ErroresDeFormulario`). El conjuro no tiene pasos: todos en el 0.
 */
const CAMPOS_CONJURO: CamposDeFormulario = Object.fromEntries([
    ['nombre', 'Nombre'], ['descripcion', 'Descripción'], ['id_manual', 'Manual'], ['pagina', 'Página'],
    ['id_tiempo_lanz', 'Tiempo de lanzamiento'], ['id_alcance', 'Alcance'], ['objetivo', 'Objetivo'], ['efecto', 'Efecto'],
    ['area', 'Área'], ['duracion', 'Duración'], ['tipo_salvacion', 'Tiro de salvación'],
    ['descripcion_componentes', 'Componentes'], ['id_escuela', 'Escuela'], ['id_disciplina', 'Disciplina'],
    ['id_subdisciplina', 'Subdisciplina'], ['puntos_poder', 'Puntos de poder'], ['descripcion_aumentos', 'Aumentos'],
    ['coste_material', 'Coste del componente material'], ['coste_px', 'Coste en PX'], ['componentes', 'Componentes'],
    ['descriptores', 'Descriptores'], ['niveles_clase', 'Niveles por clase'], ['niveles_dominio', 'Niveles por dominio'],
    ['niveles_disciplina', 'Niveles por disciplina'],
].map(([clave, etiqueta]) => [clave, { etiqueta, paso: 0 }]));

/** Los textos del conjuro que la API da `null` si son de relleno («no especifica») y se devuelven así al guardar. */
const TEXTOS_CONJURO: ReadonlyArray<[keyof ConjuroEditable, string]> = [
    ['Descripcion', 'descripcion'], ['Objetivo', 'objetivo'], ['Efecto', 'efecto'], ['Area', 'area'],
    ['Duracion', 'duracion'], ['Tipo_salvacion', 'tipo_salvacion'], ['Descripcion_componentes', 'descripcion_componentes'],
    ['Descripcion_aumentos', 'descripcion_aumentos'],
];
type NivelCollectionKey = 'baseClase' | 'baseDominio' | 'psiClase' | 'psiDisciplina';

@Component({
    selector: 'app-nueva-conjuro',
    templateUrl: './nueva-conjuro.component.html',
    styleUrls: ['./nueva-conjuro.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevaConjuroComponent) }],
})
export class NuevaConjuroComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    private readonly destroy$ = new Subject<void>();
    private nextRowId: number = 1;
    private readonly componentesBase = new Set([
        'somatico',
        'verbal',
        'material',
        'experiencia',
        'foco',
        'foco divino',
        'foco o foco divino',
        'material o foco divino',
    ]);
    private readonly componentesPsionicos = new Set([
        'olfativo',
        'olfavito',
        'material',
        'visual',
        'mental',
        'auditivo',
    ]);

    /** «Modificar conjuro» es esta misma pantalla con el conjuro cargado (`modo="editar"` e `idConjuro`). */
    @Input() modo: ModoInsercion = 'crear';
    @Input() idConjuro: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() conjuroCreado = new EventEmitter<CrearConjuroEmitPayload>();
    @Output() conjuroActualizado = new EventEmitter<Conjuro>();

    guardando: boolean = false;
    puedeCrear: boolean = false;
    varianteActiva: ConjuroVariante = 'base';
    conjurosExistentes: Conjuro[] = [];
    manuales: Manual[] = [];
    manualesOpciones: OpcionCatalogo[] = [];
    /** Los componentes del conjuro cargado: salen aunque no estén en la lista de su variante (la «Esencia» de Incarnum). */
    private componentesDeLaEntrada = new Set<number>();
    tiemposLanzamiento: ConjuroCatalogItem[] = [];
    alcances: ConjuroCatalogItem[] = [];
    componentesCatalogo: ConjuroCatalogItem[] = [];
    descriptoresCatalogo: ConjuroCatalogItem[] = [];
    escuelas: EscuelaConjuros[] = [];
    disciplinas: DisciplinaConjuros[] = [];
    subdisciplinasCatalogo: SubdisciplinaCatalogItem[] = [];
    dominios: DominioDetalle[] = [];
    clasesBase: Clase[] = [];
    clasesPsionicas: Clase[] = [];
    subdisciplinasActuales: Array<{ Id: number; Nombre: string; }> = [];
    componentesSeleccionados: number[] = [];
    descriptoresSeleccionados: number[] = [];
    nivelesBaseClase: NivelEditorRow[] = [];
    nivelesBaseDominio: NivelEditorRow[] = [];
    nivelesPsiClase: NivelEditorRow[] = [];
    nivelesPsiDisciplina: NivelEditorRow[] = [];

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
        descripcion: ['', [Validators.required, Validators.minLength(10)]],
        id_manual: [0, [Validators.min(1)]],
        pagina: [1, [Validators.required, Validators.min(0)]],
        id_tiempo_lanz: [0, [Validators.min(1)]],
        id_alcance: [0, [Validators.min(1)]],
        objetivo: [''],
        efecto: [''],
        area: [''],
        duracion: ['', [Validators.required]],
        tipo_salvacion: [''],
        descripcion_componentes: [''],
        permanente: [false],
        oficial: [true],
        arcano: [true],
        divino: [false],
        id_escuela: [0],
        resistencia_conjuros: [false],
        id_disciplina: [0],
        id_subdisciplina: [0],
        puntos_poder: [0, [Validators.min(0)]],
        descripcion_aumentos: [''],
        resistencia_poderes: [false],
        // Opcionales: el coste del componente material caro (po, con decimales) y de PX; vacíos, sin coste.
        coste_material: [null as number | null, [Validators.min(0)]],
        coste_px: [null as number | null, [Validators.min(0)]],
    });

    /** «Modificar conjuro»: el conjuro por su `GET`, si hay cambios y la pregunta al cerrar (`insercion-marco`). */
    readonly edicion = new EdicionDeCatalogo<ConjuroEditable>({
        nombre: CONJURO,
        modo: () => this.modo,
        id: () => this.idConjuro,
        obtener: (id) => this.conjuroSvc.getConjuroFresco(id),
        hidratar: (conjuro) => this.hidratarDesdeConjuro(conjuro),
        foto: () => this.foto(),
        destruir$: this.destroy$,
    });

    /** El error global (en el `bloque-error` del marco) y, si la API lo da, el de su campo. */
    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS_CONJURO,
        raiz: 'conjuro',
        control: (campo) => (this.form.controls as Record<string, AbstractControl>)[campo],
        firma: (campo) => JSON.stringify((this.form.controls as Record<string, AbstractControl>)[campo]?.value ?? this.foto()),
        irAPaso: () => undefined,
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private conjuroSvc: ConjuroService,
        private conjuroCatalogosSvc: ConjuroCatalogosService,
        private manualSvc: ManualService,
        private escuelaSvc: EscuelaConjurosService,
        private disciplinaSvc: DisciplinaConjurosService,
        private subdisciplinaSvc: SubdisciplinaConjurosService,
        private dominioSvc: DominioService,
        private claseSvc: ClaseService,
    ) { }

    ngOnInit(): void {
        this.nivelesBaseClase = [this.crearNivelRow()];
        this.nivelesBaseDominio = [this.crearNivelRow()];
        this.nivelesPsiClase = [this.crearNivelRow()];
        this.nivelesPsiDisciplina = [this.crearNivelRow()];

        this.recalcularPermisos();
        this.userSvc.acl$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.recalcularPermisos());
        this.userSvc.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.recalcularPermisos());

        this.form.controls.id_disciplina.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.sincronizarSubdisciplinas());

        this.conjuroSvc.getConjuros()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (conjuros) => {
                    this.conjurosExistentes = Array.isArray(conjuros) ? conjuros : [];
                },
                error: () => {
                    this.conjurosExistentes = [];
                }
            });

        this.manualSvc.getManuales()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (manuales) => {
                    this.manuales = (Array.isArray(manuales) ? manuales : [])
                        .sort(porNombre);
                    this.manualesOpciones = opcionesDeCatalogo(this.manuales);
                    this.sincronizarManualSeleccionado();
                },
                error: () => {
                    this.manuales = [];
                    this.manualesOpciones = [];
                }
            });

        this.conjuroCatalogosSvc.getComponentes()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (componentes) => {
                    this.componentesCatalogo = Array.isArray(componentes) ? componentes : [];
                    this.sincronizarComponentesPorVariante();
                },
                error: () => {
                    this.componentesCatalogo = [];
                    this.componentesSeleccionados = [];
                }
            });

        this.conjuroCatalogosSvc.getTiemposLanzamiento()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (tiempos) => {
                    this.tiemposLanzamiento = Array.isArray(tiempos) ? tiempos : [];
                    this.sincronizarSelectPorDefecto('id_tiempo_lanz', this.tiemposLanzamiento);
                },
                error: () => {
                    this.tiemposLanzamiento = [];
                }
            });

        this.conjuroCatalogosSvc.getAlcances()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (alcances) => {
                    this.alcances = Array.isArray(alcances) ? alcances : [];
                    this.sincronizarSelectPorDefecto('id_alcance', this.alcances);
                },
                error: () => {
                    this.alcances = [];
                }
            });

        this.conjuroCatalogosSvc.getDescriptores()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (descriptores) => {
                    this.descriptoresCatalogo = Array.isArray(descriptores) ? descriptores : [];
                },
                error: () => {
                    this.descriptoresCatalogo = [];
                }
            });

        this.escuelaSvc.getEscuelas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (escuelas) => {
                    this.escuelas = (Array.isArray(escuelas) ? escuelas : [])
                        .filter((item) => toInt(item?.Id, 0) > 0)
                        .sort(porNombre);
                },
                error: () => {
                    this.escuelas = [];
                }
            });

        this.disciplinaSvc.getDisciplinas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (disciplinas) => {
                    this.disciplinas = (Array.isArray(disciplinas) ? disciplinas : [])
                        .filter((item) => toInt(item?.Id, 0) > 0)
                        .sort(porNombre);
                    this.sincronizarSubdisciplinas();
                },
                error: () => {
                    this.disciplinas = [];
                    this.subdisciplinasActuales = [];
                }
            });

        this.subdisciplinaSvc.getSubdisciplinas()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (subdisciplinas) => {
                    this.subdisciplinasCatalogo = Array.isArray(subdisciplinas) ? subdisciplinas : [];
                    this.sincronizarSubdisciplinas();
                },
                error: () => {
                    this.subdisciplinasCatalogo = [];
                    this.sincronizarSubdisciplinas();
                }
            });

        this.dominioSvc.getDominios()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (dominios) => {
                    this.dominios = (Array.isArray(dominios) ? dominios : [])
                        .filter((item) => toInt(item?.Id, 0) > 0)
                        .sort(porNombre);
                },
                error: () => {
                    this.dominios = [];
                }
            });

        this.claseSvc.getClases()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (clases) => {
                    const lista = Array.isArray(clases) ? clases : [];
                    this.clasesBase = lista
                        .filter((clase) => clase?.Conjuros?.Arcanos === true || clase?.Conjuros?.Divinos === true)
                        .sort(porNombre);
                    this.clasesPsionicas = lista
                        .filter((clase) => clase?.Conjuros?.Psionicos === true)
                        .sort(porNombre);
                },
                error: () => {
                    this.clasesBase = [];
                    this.clasesPsionicas = [];
                }
            });

        this.form.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.errores.seguirCambios());

        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(cambios: SimpleChanges): void {
        if (cambios['modo'] || cambios['idConjuro'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get editando(): boolean {
        return this.edicion.editando;
    }

    get textoAccionPrincipal(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    async confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    get mensajePermisosInsuficientes(): string {
        return this.userSvc.getPermissionDeniedMessage();
    }

    get descripcionComponentesLabel(): string {
        return this.varianteActiva === 'base'
            ? 'Descripción del foco'
            : 'Descripción del despliegue';
    }

    get tituloComponentes(): string {
        return this.varianteActiva === 'base' ? 'Componentes' : 'Despliegues';
    }

    get componentesCatalogoActual(): ConjuroCatalogItem[] {
        const permitidos = this.varianteActualEsBase ? this.componentesBase : this.componentesPsionicos;
        return (this.componentesCatalogo ?? [])
            .filter((item) => permitidos.has(normalizarTexto(item?.Nombre ?? '')) || this.componentesDeLaEntrada.has(toInt(item?.Id, 0)))
            .map((item) => ({
                ...item,
                Nombre: this.getEtiquetaComponente(item),
            }))
            .sort(porNombre);
    }

    get varianteActualEsBase(): boolean {
        return this.varianteActiva === 'base';
    }

    get mensajeResumenVariante(): string {
        return this.varianteActualEsBase
            ? 'Configura un conjuro arcano y/o divino con escuela, niveles por clase y dominios opcionales.'
            : 'Configura un poder psiónico con disciplina, subdisciplina opcional y sus niveles asociados.';
    }

    toggleOficial(): void {
        alternarControl(this.form.controls.oficial);
    }

    toggleResistencia(): void {
        alternarControl(this.varianteActualEsBase ? this.form.controls.resistencia_conjuros : this.form.controls.resistencia_poderes);
    }

    togglePermanente(): void {
        alternarControl(this.form.controls.permanente);
    }

    get resistenciaActiva(): boolean {
        return this.varianteActualEsBase
            ? this.form.controls.resistencia_conjuros.value === true
            : this.form.controls.resistencia_poderes.value === true;
    }

    get etiquetaResistencia(): string {
        return this.varianteActualEsBase
            ? 'Permite resistencia a conjuros'
            : 'Permite resistencia a poderes';
    }

    toggleNaturaleza(flag: 'arcano' | 'divino'): void {
        if (this.varianteActiva !== 'base') {
            this.varianteActiva = 'base';
            this.form.patchValue({
                arcano: false,
                divino: false,
            });
            this.sincronizarComponentesPorVariante();
        }
        alternarControl(this.form.controls[flag]);
    }

    activarPsionico(): void {
        if (this.varianteActiva === 'psionico')
            return;
        this.varianteActiva = 'psionico';
        this.form.patchValue({
            arcano: false,
            divino: false,
        });
        this.sincronizarComponentesPorVariante();
    }

    get psionicoActivo(): boolean {
        return this.varianteActiva === 'psionico';
    }

    onToggleComponente(id: number, checked: boolean): void {
        this.componentesSeleccionados = checked
            ? this.uniqueSorted([...this.componentesSeleccionados, id])
            : this.componentesSeleccionados.filter((item) => item !== id);
    }

    onToggleDescriptor(id: number, checked: boolean): void {
        this.descriptoresSeleccionados = checked
            ? this.uniqueSorted([...this.descriptoresSeleccionados, id])
            : this.descriptoresSeleccionados.filter((item) => item !== id);
    }

    isComponenteSeleccionado(id: number): boolean {
        return this.componentesSeleccionados.includes(toInt(id, 0));
    }

    isDescriptorSeleccionado(id: number): boolean {
        return this.descriptoresSeleccionados.includes(toInt(id, 0));
    }

    getEtiquetaComponente(item: ConjuroCatalogItem): string {
        const nombre = `${item?.Nombre ?? ''}`.trim();
        if (normalizarTexto(nombre) === 'olfavito')
            return 'Olfativo';
        return nombre;
    }

    seleccionarManual(id: number): void {
        elegirEnControl(this.form.controls.id_manual, toInt(id, 0));
    }

    agregarNivel(coleccion: NivelCollectionKey): void {
        this.getNivelRows(coleccion).push(this.crearNivelRow());
    }

    eliminarNivel(coleccion: NivelCollectionKey, index: number): void {
        const rows = this.getNivelRows(coleccion);
        if (rows.length <= 1) {
            rows[0] = this.crearNivelRow();
            return;
        }
        rows.splice(index, 1);
    }

    actualizarNivel(coleccion: NivelCollectionKey, index: number, patch: Partial<NivelEditorRow>): void {
        const rows = this.getNivelRows(coleccion);
        const actual = rows[index];
        if (!actual)
            return;
        rows[index] = {
            ...actual,
            ...patch,
            id: patch.id !== undefined ? toInt(patch.id, 0) : actual.id,
            nivel: patch.nivel !== undefined ? toInt(patch.nivel, 0) : actual.nivel,
            espontaneo: patch.espontaneo !== undefined ? patch.espontaneo === true : actual.espontaneo,
        };
    }

    getNivelRows(coleccion: NivelCollectionKey): NivelEditorRow[] {
        if (coleccion === 'baseClase')
            return this.nivelesBaseClase;
        if (coleccion === 'baseDominio')
            return this.nivelesBaseDominio;
        if (coleccion === 'psiClase')
            return this.nivelesPsiClase;
        return this.nivelesPsiDisciplina;
    }

    /** Crea el conjuro o, en «Modificar», lo guarda entero (`PUT /conjuros/<id>`, el mismo cuerpo que el alta). */
    async guardarConjuro(): Promise<void> {
        if (this.guardando || this.edicion.cargando)
            return;
        if (!this.puedeCrear) {
            await avisarSinPermisos(this.mensajePermisosInsuficientes);
            return;
        }

        this.errores.limpiar();
        this.form.markAllAsTouched();
        const errorDominio = this.validarReglasDominio();
        if (this.form.invalid || errorDominio.length > 0) {
            this.errores.global = errorDominio.length > 0 ? errorDominio : 'Revisa los campos obligatorios.';
            this.errores.irAlPrimerError();
            return;
        }

        let payload: ConjuroCreateRequest;
        try {
            payload = this.buildPayload();
        } catch (error: unknown) {
            this.errores.mostrar(error, 'Revisa las filas de niveles configuradas.');
            return;
        }

        const editando = this.editando;
        this.guardando = true;
        try {
            if (editando) {
                const respuesta = await this.conjuroSvc.actualizarConjuro(this.edicion.id, payload);
                await avisarGuardado(CONJURO, true, respuesta.message);
                this.hidratarDesdeConjuro(respuesta.conjuro);
                this.conjuroActualizado.emit(respuesta.conjuro);
                this.cerrar.emit();
            } else {
                const respuesta = await this.conjuroSvc.crearConjuro(payload);
                await avisarGuardado(CONJURO, false, respuesta.message);
                this.conjuroCreado.emit({ idConjuro: respuesta.idConjuro, nombre: payload.conjuro.nombre });
                this.resetFormulario();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, editando ? 'No se ha podido actualizar el conjuro.' : 'No se ha podido crear el conjuro.');
        } finally {
            this.guardando = false;
        }
    }

    /** Rellena el formulario con el conjuro de la API (su `GET` o la respuesta de guardar). */
    private hidratarDesdeConjuro(conjuro: ConjuroEditable): void {
        const psionico = conjuro?.Psionico === true;
        const textos = Object.fromEntries(TEXTOS_CONJURO.map(([lectura, campo]) => {
            const valor = `${conjuro?.[lectura] ?? ''}`;
            // Vacío en la lectura es un texto de relleno de la base (o nada): los obligatorios y los que la API dio
            // `null` vuelven como «No especifica».
            const sinEspecificar = (conjuro?.Textos_sin_especificar ?? []).includes(lectura) || campo === 'duracion' || campo === 'tipo_salvacion' || campo === 'descripcion';
            return [campo, sinEspecificar ? textoOSinEspecificar(valor) : valor];
        }));
        this.varianteActiva = psionico ? 'psionico' : 'base';
        this.componentesDeLaEntrada = new Set((conjuro?.Componentes ?? []).map((item) => toInt(item?.Id_componente, 0)));
        this.form.reset({
            nombre: conjuro?.Nombre ?? '',
            ...textos,
            id_manual: toInt(conjuro?.Id_manual, 0),
            pagina: toInt(conjuro?.Pagina, 0),
            id_tiempo_lanz: toInt(conjuro?.Id_tiempo_lanzamiento, 0),
            id_alcance: toInt(conjuro?.Id_alcance, 0),
            permanente: conjuro?.Permanente === true,
            oficial: conjuro?.Oficial === true,
            arcano: !psionico && conjuro?.Arcano === true,
            divino: !psionico && conjuro?.Divino === true,
            id_escuela: psionico ? 0 : toInt(conjuro?.Escuela?.Id, 0),
            resistencia_conjuros: !psionico && conjuro?.Resistencia_conjuros === true,
            id_disciplina: psionico ? toInt(conjuro?.Disciplina?.Id, 0) : 0,
            id_subdisciplina: psionico ? toInt(conjuro?.Id_subdisciplina, 0) : 0,
            puntos_poder: psionico ? toInt(conjuro?.Puntos_poder, 0) : 0,
            resistencia_poderes: psionico && conjuro?.Resistencia_poderes === true,
            coste_material: conjuro?.Coste_material ?? null,
            coste_px: conjuro?.Coste_px ?? null,
        });
        this.componentesSeleccionados = this.uniqueSorted((conjuro?.Componentes ?? []).map((item) => item?.Id_componente));
        this.descriptoresSeleccionados = this.uniqueSorted((conjuro?.Descriptores ?? []).map((item) => item?.Id));
        const filas = (items: { Nivel: number; Espontaneo: boolean; }[], id: (item: any) => unknown): NivelEditorRow[] => {
            const salida = (items ?? []).map((item) => ({ ...this.crearNivelRow(), id: toInt(id(item), 0), nivel: toInt(item?.Nivel, 0), espontaneo: item?.Espontaneo === true }));
            return salida.length > 0 ? salida : [this.crearNivelRow()];
        };
        this.nivelesBaseClase = psionico ? [this.crearNivelRow()] : filas(conjuro?.Nivel_clase, (item) => item?.Id_clase);
        this.nivelesBaseDominio = filas(psionico ? [] : conjuro?.Nivel_dominio, (item) => item?.Id_dominio);
        this.nivelesPsiClase = psionico ? filas(conjuro?.Nivel_clase, (item) => item?.Id_clase) : [this.crearNivelRow()];
        this.nivelesPsiDisciplina = filas(psionico ? conjuro?.Nivel_disciplinas : [], (item) => item?.Id_disciplina);
        this.sincronizarSubdisciplinas();
        this.errores.limpiar();
        this.edicion.tomarPuntoDePartida();
    }

    /** Lo que se compara para saber si hay cambios: el cuerpo que se mandaría (sin lanzar si hay filas repetidas). */
    private foto(): string {
        try {
            return JSON.stringify(this.buildPayload());
        } catch {
            return JSON.stringify({ form: this.form.getRawValue(), niveles: [this.nivelesBaseClase, this.nivelesBaseDominio, this.nivelesPsiClase, this.nivelesPsiDisciplina] });
        }
    }

    private buildPayload(): ConjuroCreateRequest {
        const raw = this.form.getRawValue();
        const conjuroBase = {
            variante: this.varianteActiva,
            nombre: `${raw.nombre ?? ''}`.trim(),
            descripcion: `${raw.descripcion ?? ''}`.trim(),
            id_manual: toInt(raw.id_manual, 0),
            pagina: toInt(raw.pagina, 0),
            id_tiempo_lanz: toInt(raw.id_tiempo_lanz, 0),
            id_alcance: toInt(raw.id_alcance, 0),
            objetivo: `${raw.objetivo ?? ''}`.trim(),
            efecto: `${raw.efecto ?? ''}`.trim(),
            area: `${raw.area ?? ''}`.trim(),
            duracion: `${raw.duracion ?? ''}`.trim(),
            tipo_salvacion: `${raw.tipo_salvacion ?? ''}`.trim(),
            descripcion_componentes: `${raw.descripcion_componentes ?? ''}`.trim(),
            permanente: raw.permanente === true,
            oficial: raw.oficial === true,
            ...this.costes(raw.coste_material, raw.coste_px),
        };

        if (this.varianteActualEsBase) {
            return {
                conjuro: {
                    ...conjuroBase,
                    variante: 'base',
                    arcano: raw.arcano === true,
                    divino: raw.divino === true,
                    id_escuela: toInt(raw.id_escuela, 0),
                    resistencia_conjuros: raw.resistencia_conjuros === true,
                },
                componentes: this.uniqueSorted(this.componentesSeleccionados),
                descriptores: this.uniqueSorted(this.descriptoresSeleccionados),
                niveles_clase: this.normalizarNiveles(this.nivelesBaseClase, 'id_clase'),
                niveles_dominio: this.normalizarNiveles(this.nivelesBaseDominio, 'id_dominio'),
            };
        }

        return {
            conjuro: {
                ...conjuroBase,
                variante: 'psionico',
                id_disciplina: toInt(raw.id_disciplina, 0),
                id_subdisciplina: toInt(raw.id_subdisciplina, 0),
                puntos_poder: toInt(raw.puntos_poder, 0),
                descripcion_aumentos: `${raw.descripcion_aumentos ?? ''}`.trim(),
                resistencia_poderes: raw.resistencia_poderes === true,
            },
            componentes: this.uniqueSorted(this.componentesSeleccionados),
            descriptores: this.uniqueSorted(this.descriptoresSeleccionados),
            niveles_clase: this.normalizarNiveles(this.nivelesPsiClase, 'id_clase'),
            niveles_disciplina: this.normalizarNiveles(this.nivelesPsiDisciplina, 'id_disciplina'),
        };
    }

    /** Los costes opcionales: solo los que tienen un número (vacíos, el conjuro no tiene ese coste). */
    private costes(material: unknown, px: unknown): { coste_material?: number; coste_px?: number; } {
        const numero = (valor: unknown) => valor === null || valor === undefined || `${valor}`.trim() === '' ? null : Number(valor);
        const salida: { coste_material?: number; coste_px?: number; } = {};
        const costeMaterial = numero(material);
        const costePx = numero(px);
        if (costeMaterial !== null && Number.isFinite(costeMaterial))
            salida.coste_material = costeMaterial;
        if (costePx !== null && Number.isFinite(costePx))
            salida.coste_px = costePx;
        return salida;
    }

    private resetFormulario(): void {
        const variante = this.varianteActiva;
        this.form.reset({
            nombre: '',
            descripcion: '',
            id_manual: 0,
            pagina: 1,
            id_tiempo_lanz: 0,
            id_alcance: 0,
            objetivo: '',
            efecto: '',
            area: '',
            duracion: '',
            tipo_salvacion: '',
            descripcion_componentes: '',
            permanente: false,
            oficial: true,
            arcano: variante === 'base',
            divino: false,
            id_escuela: 0,
            resistencia_conjuros: false,
            id_disciplina: 0,
            id_subdisciplina: 0,
            puntos_poder: 0,
            descripcion_aumentos: '',
            resistencia_poderes: false,
            coste_material: null,
            coste_px: null,
        });
        this.varianteActiva = variante;
        this.componentesDeLaEntrada = new Set<number>();
        this.errores.limpiar();
        this.edicion.olvidar();
        this.componentesSeleccionados = [];
        this.descriptoresSeleccionados = [];
        this.nivelesBaseClase = [this.crearNivelRow()];
        this.nivelesBaseDominio = [this.crearNivelRow()];
        this.nivelesPsiClase = [this.crearNivelRow()];
        this.nivelesPsiDisciplina = [this.crearNivelRow()];
        this.sincronizarManualSeleccionado();
        this.sincronizarSelectPorDefecto('id_tiempo_lanz', this.tiemposLanzamiento);
        this.sincronizarSelectPorDefecto('id_alcance', this.alcances);
        this.sincronizarSubdisciplinas();
    }

    private recalcularPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'conjuros');
    }

    private sincronizarManualSeleccionado(): void {
        // En «Modificar» manda el manual del conjuro cargado.
        if (this.manuales.length < 1 || this.editando)
            return;
        const idActual = toInt(this.form.controls.id_manual.value, -1);
        if (this.manuales.some((manual) => toInt(manual?.Id, 0) === idActual))
            return;
        const manualPredeterminado = this.manuales.find(
            (manual) => normalizarTexto(manual?.Nombre ?? '') === 'compendio de conjuros'
        );
        this.form.controls.id_manual.setValue(
            toInt(manualPredeterminado?.Id ?? this.manuales[0]?.Id, 0)
        );
    }

    private sincronizarSelectPorDefecto(
        control: 'id_tiempo_lanz' | 'id_alcance',
        items: ConjuroCatalogItem[]
    ): void {
        if (items.length < 1 || this.editando)
            return;
        const idActual = toInt(this.form.controls[control].value, -1);
        if (items.some((item) => item.Id === idActual))
            return;
        this.form.controls[control].setValue(toInt(items[0]?.Id, 0));
    }

    private sincronizarSubdisciplinas(): void {
        const idDisciplina = toInt(this.form.controls.id_disciplina.value, 0);
        const desdeCache = (this.subdisciplinasCatalogo ?? [])
            .filter((item) => toInt(item?.id_disciplina, 0) === idDisciplina)
            .map((item) => ({
                Id: toInt(item?.Id, 0),
                Nombre: `${item?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.Id > 0 && item.Nombre.length > 0)
            .sort(porNombre);

        if (desdeCache.length > 0) {
            this.subdisciplinasActuales = desdeCache;
        } else {
            const disciplina = this.disciplinas.find((item: any) =>
                toInt(item?.Id ?? item?.id ?? item?.i, 0) === idDisciplina
            );
            this.subdisciplinasActuales = toArray((disciplina as any)?.Subdisciplinas ?? (disciplina as any)?.subdisciplinas ?? (disciplina as any)?.sd)
                .map((item, index) => {
                    if (typeof item === 'string')
                        return { Id: index + 1, Nombre: `${item}`.trim() };
                    return {
                        Id: toInt((item as any)?.Id ?? (item as any)?.id ?? (item as any)?.i, 0),
                        Nombre: `${(item as any)?.Nombre ?? (item as any)?.nombre ?? (item as any)?.n ?? ''}`.trim(),
                    };
                })
                .filter((item) => {
                    const nombre = normalizarTexto(item.Nombre);
                    return item.Nombre.length > 0 && nombre !== 'ninguna' && nombre !== 'sin subdisciplina';
                })
                .sort(porNombre);
        }

        const idSubdisciplina = toInt(this.form.controls.id_subdisciplina.value, 0);
        if (idSubdisciplina > 0 && !this.subdisciplinasActuales.some((item) => item.Id === idSubdisciplina))
            this.form.controls.id_subdisciplina.setValue(0);
    }

    private sincronizarComponentesPorVariante(): void {
        const idsValidos = new Set(this.componentesCatalogoActual.map((item) => toInt(item?.Id, 0)));
        this.componentesSeleccionados = this.componentesSeleccionados.filter((id) => idsValidos.has(toInt(id, 0)));
    }

    private validarReglasDominio(): string {
        const nombre = `${this.form.controls.nombre.value ?? ''}`.trim();
        if (this.edicion.nombreOcupado(this.conjurosExistentes, nombre))
            return 'Ya existe un conjuro con ese nombre (comparación normalizada).';

        if (this.varianteActualEsBase) {
            if (this.form.controls.arcano.value !== true && this.form.controls.divino.value !== true)
                return 'Un conjuro base debe ser arcano, divino o ambos.';
            if (toInt(this.form.controls.id_escuela.value, 0) <= 0)
                return 'Debes seleccionar una escuela válida para el conjuro base.';
        } else {
            if (toInt(this.form.controls.id_disciplina.value, 0) <= 0)
                return 'Debes seleccionar una disciplina válida para el conjuro psiónico.';
            if (this.form.controls.puntos_poder.value === null || this.form.controls.puntos_poder.value === undefined || `${this.form.controls.puntos_poder.value}`.trim() === '')
                return 'Debes indicar el coste en puntos de poder.';
            const idSubdisciplina = toInt(this.form.controls.id_subdisciplina.value, 0);
            if (idSubdisciplina > 0 && !this.subdisciplinasActuales.some((item) => item.Id === idSubdisciplina))
                return 'La subdisciplina seleccionada no pertenece a la disciplina actual.';
        }

        try {
            if (this.varianteActualEsBase) {
                this.normalizarNiveles(this.nivelesBaseClase, 'id_clase');
                this.normalizarNiveles(this.nivelesBaseDominio, 'id_dominio');
            } else {
                this.normalizarNiveles(this.nivelesPsiClase, 'id_clase');
                this.normalizarNiveles(this.nivelesPsiDisciplina, 'id_disciplina');
            }
        } catch (error: any) {
            return `${error?.message ?? 'Hay filas de niveles duplicadas con datos incompatibles.'}`;
        }

        return '';
    }

    private normalizarNiveles(rows: NivelEditorRow[], idField: NivelFieldKey): ConjuroCreateNivelRef[] {
        const unique = new Map<number, ConjuroCreateNivelRef>();

        (Array.isArray(rows) ? rows : []).forEach((row) => {
            const id = toInt(row?.id, 0);
            if (id <= 0)
                return;

            const item: ConjuroCreateNivelRef = {
                [idField]: id,
                nivel: toInt(row?.nivel, 0),
                espontaneo: row?.espontaneo === true,
            };

            const existente = unique.get(id);
            if (!existente) {
                unique.set(id, item);
                return;
            }

            if (existente.nivel !== item.nivel || existente.espontaneo !== item.espontaneo)
                throw new Error(`La relación ${idField}=${id} aparece repetida con nivel o espontaneidad distintos.`);
        });

        return Array.from(unique.values()).sort((a, b) => {
            const left = toInt(a[idField], 0);
            const right = toInt(b[idField], 0);
            return left - right;
        });
    }

    private crearNivelRow(): NivelEditorRow {
        const id = this.nextRowId++;
        return {
            uid: `nivel-${id}`,
            id: 0,
            nivel: 0,
            espontaneo: false,
        };
    }

    private uniqueSorted(ids: number[]): number[] {
        return Array.from(new Set((ids ?? []).map((id) => toInt(id, 0)).filter((id) => id > 0))).sort((a, b) => a - b);
    }

}
