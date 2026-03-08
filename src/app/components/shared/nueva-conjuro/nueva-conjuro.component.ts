import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { ConjuroCatalogItem, SubdisciplinaCatalogItem } from 'src/app/interfaces/conjuro-catalogos';
import { ConjuroCreateNivelRef, ConjuroCreateRequest, ConjuroCreateResponse, ConjuroVariante } from 'src/app/interfaces/conjuros-api';
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
type NivelCollectionKey = 'baseClase' | 'baseDominio' | 'psiClase' | 'psiDisciplina';

@Component({
    selector: 'app-nueva-conjuro',
    templateUrl: './nueva-conjuro.component.html',
    styleUrls: ['./nueva-conjuro.component.sass'],
    standalone: false
})
export class NuevaConjuroComponent implements OnInit, OnDestroy {
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

    @Output() conjuroCreado = new EventEmitter<CrearConjuroEmitPayload>();

    guardando: boolean = false;
    puedeCrear: boolean = false;
    varianteActiva: ConjuroVariante = 'base';
    conjurosExistentes: Conjuro[] = [];
    manuales: Manual[] = [];
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
                        .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                    this.sincronizarManualSeleccionado();
                },
                error: () => {
                    this.manuales = [];
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
                        .filter((item) => this.toInt(item?.Id, 0) > 0)
                        .sort((a, b) => `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
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
                        .filter((item) => this.toInt(item?.Id, 0) > 0)
                        .sort((a, b) => `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
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
                        .filter((item) => this.toInt(item?.Id, 0) > 0)
                        .sort((a, b) => `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
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
                        .sort((a, b) => `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
                    this.clasesPsionicas = lista
                        .filter((clase) => clase?.Conjuros?.Psionicos === true)
                        .sort((a, b) => `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
                },
                error: () => {
                    this.clasesBase = [];
                    this.clasesPsionicas = [];
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get textoAccionPrincipal(): string {
        return this.guardando ? 'Creando...' : 'Crear conjuro';
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
            .filter((item) => permitidos.has(this.normalizar(item?.Nombre ?? '')))
            .map((item) => ({
                ...item,
                Nombre: this.getEtiquetaComponente(item),
            }))
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
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
        this.form.controls.oficial.setValue(this.form.controls.oficial.value !== true);
    }

    toggleResistencia(): void {
        if (this.varianteActualEsBase) {
            this.form.controls.resistencia_conjuros.setValue(this.form.controls.resistencia_conjuros.value !== true);
            return;
        }
        this.form.controls.resistencia_poderes.setValue(this.form.controls.resistencia_poderes.value !== true);
    }

    togglePermanente(): void {
        this.form.controls.permanente.setValue(this.form.controls.permanente.value !== true);
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
        const control = this.form.controls[flag];
        control.setValue(control.value !== true);
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
        return this.componentesSeleccionados.includes(this.toInt(id, 0));
    }

    isDescriptorSeleccionado(id: number): boolean {
        return this.descriptoresSeleccionados.includes(this.toInt(id, 0));
    }

    getEtiquetaComponente(item: ConjuroCatalogItem): string {
        const nombre = `${item?.Nombre ?? ''}`.trim();
        if (this.normalizar(nombre) === 'olfavito')
            return 'Olfativo';
        return nombre;
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
            id: patch.id !== undefined ? this.toInt(patch.id, 0) : actual.id,
            nivel: patch.nivel !== undefined ? this.toInt(patch.nivel, 0) : actual.nivel,
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

    async crearConjuro(): Promise<void> {
        if (!this.puedeCrear) {
            await Swal.fire({
                icon: 'warning',
                title: 'Permisos insuficientes',
                text: 'Tu usuario no tiene permiso conjuros.create.',
                showConfirmButton: true
            });
            return;
        }

        this.form.markAllAsTouched();
        const errorDominio = this.validarReglasDominio();
        if (this.form.invalid || errorDominio.length > 0) {
            await Swal.fire({
                icon: 'warning',
                title: 'Formulario inválido',
                text: errorDominio.length > 0 ? errorDominio : 'Revisa los campos obligatorios.',
                showConfirmButton: true
            });
            return;
        }

        const uid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        if (uid.length < 1) {
            await Swal.fire({
                icon: 'warning',
                title: 'Sesión inválida',
                text: 'No se pudo resolver uid de Firebase para crear el conjuro.',
                showConfirmButton: true
            });
            return;
        }

        let payload: ConjuroCreateRequest;
        try {
            payload = this.buildPayload(uid);
        } catch (error: any) {
            await Swal.fire({
                icon: 'warning',
                title: 'Configuración inválida',
                text: `${error?.message ?? 'Revisa las filas de niveles configuradas.'}`,
                showConfirmButton: true
            });
            return;
        }

        this.guardando = true;
        try {
            const response = await this.conjuroSvc.crearConjuro(payload);
            this.notificarExito(response, payload.conjuro.nombre);
            this.resetFormulario();
        } catch (error: any) {
            await Swal.fire({
                icon: 'warning',
                title: 'No se pudo crear el conjuro',
                text: `${error?.message ?? 'Error no identificado'}`,
                showConfirmButton: true
            });
        } finally {
            this.guardando = false;
        }
    }

    private buildPayload(uid: string): ConjuroCreateRequest {
        const raw = this.form.getRawValue();
        const conjuroBase = {
            variante: this.varianteActiva,
            nombre: `${raw.nombre ?? ''}`.trim(),
            descripcion: `${raw.descripcion ?? ''}`.trim(),
            id_manual: this.toInt(raw.id_manual, 0),
            pagina: this.toInt(raw.pagina, 0),
            id_tiempo_lanz: this.toInt(raw.id_tiempo_lanz, 0),
            id_alcance: this.toInt(raw.id_alcance, 0),
            objetivo: `${raw.objetivo ?? ''}`.trim(),
            efecto: `${raw.efecto ?? ''}`.trim(),
            area: `${raw.area ?? ''}`.trim(),
            duracion: `${raw.duracion ?? ''}`.trim(),
            tipo_salvacion: `${raw.tipo_salvacion ?? ''}`.trim(),
            descripcion_componentes: `${raw.descripcion_componentes ?? ''}`.trim(),
            permanente: raw.permanente === true,
            oficial: raw.oficial === true,
        };

        if (this.varianteActualEsBase) {
            return {
                uid,
                conjuro: {
                    ...conjuroBase,
                    variante: 'base',
                    arcano: raw.arcano === true,
                    divino: raw.divino === true,
                    id_escuela: this.toInt(raw.id_escuela, 0),
                    resistencia_conjuros: raw.resistencia_conjuros === true,
                },
                componentes: this.uniqueSorted(this.componentesSeleccionados),
                descriptores: this.uniqueSorted(this.descriptoresSeleccionados),
                niveles_clase: this.normalizarNiveles(this.nivelesBaseClase, 'id_clase'),
                niveles_dominio: this.normalizarNiveles(this.nivelesBaseDominio, 'id_dominio'),
            };
        }

        return {
            uid,
            conjuro: {
                ...conjuroBase,
                variante: 'psionico',
                id_disciplina: this.toInt(raw.id_disciplina, 0),
                id_subdisciplina: this.toInt(raw.id_subdisciplina, 0),
                puntos_poder: this.toInt(raw.puntos_poder, 0),
                descripcion_aumentos: `${raw.descripcion_aumentos ?? ''}`.trim(),
                resistencia_poderes: raw.resistencia_poderes === true,
            },
            componentes: this.uniqueSorted(this.componentesSeleccionados),
            descriptores: this.uniqueSorted(this.descriptoresSeleccionados),
            niveles_clase: this.normalizarNiveles(this.nivelesPsiClase, 'id_clase'),
            niveles_disciplina: this.normalizarNiveles(this.nivelesPsiDisciplina, 'id_disciplina'),
        };
    }

    private notificarExito(response: ConjuroCreateResponse, nombre: string): void {
        void Swal.fire({
            icon: 'success',
            title: 'Conjuro creado',
            text: `${response?.message ?? 'Creación completada'} (id: ${response.idConjuro})`,
            timer: 2200,
            showConfirmButton: true
        });
        this.conjuroCreado.emit({
            idConjuro: response.idConjuro,
            nombre,
        });
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
        });
        this.varianteActiva = variante;
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
        this.puedeCrear = this.userSvc.can('conjuros', 'create');
    }

    private sincronizarManualSeleccionado(): void {
        if (this.manuales.length < 1)
            return;
        const idActual = this.toInt(this.form.controls.id_manual.value, -1);
        if (this.manuales.some((manual) => this.toInt(manual?.Id, 0) === idActual))
            return;
        const manualPredeterminado = this.manuales.find(
            (manual) => this.normalizar(manual?.Nombre ?? '') === 'compendio de conjuros'
        );
        this.form.controls.id_manual.setValue(
            this.toInt(manualPredeterminado?.Id ?? this.manuales[0]?.Id, 0)
        );
    }

    private sincronizarSelectPorDefecto(
        control: 'id_tiempo_lanz' | 'id_alcance',
        items: ConjuroCatalogItem[]
    ): void {
        if (items.length < 1)
            return;
        const idActual = this.toInt(this.form.controls[control].value, -1);
        if (items.some((item) => item.Id === idActual))
            return;
        this.form.controls[control].setValue(this.toInt(items[0]?.Id, 0));
    }

    private sincronizarSubdisciplinas(): void {
        const idDisciplina = this.toInt(this.form.controls.id_disciplina.value, 0);
        const desdeCache = (this.subdisciplinasCatalogo ?? [])
            .filter((item) => this.toInt(item?.id_disciplina, 0) === idDisciplina)
            .map((item) => ({
                Id: this.toInt(item?.Id, 0),
                Nombre: `${item?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.Id > 0 && item.Nombre.length > 0)
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));

        if (desdeCache.length > 0) {
            this.subdisciplinasActuales = desdeCache;
        } else {
            const disciplina = this.disciplinas.find((item: any) =>
                this.toInt(item?.Id ?? item?.id ?? item?.i, 0) === idDisciplina
            );
            this.subdisciplinasActuales = this.toArray((disciplina as any)?.Subdisciplinas ?? (disciplina as any)?.subdisciplinas ?? (disciplina as any)?.sd)
                .map((item, index) => {
                    if (typeof item === 'string')
                        return { Id: index + 1, Nombre: `${item}`.trim() };
                    return {
                        Id: this.toInt((item as any)?.Id ?? (item as any)?.id ?? (item as any)?.i, 0),
                        Nombre: `${(item as any)?.Nombre ?? (item as any)?.nombre ?? (item as any)?.n ?? ''}`.trim(),
                    };
                })
                .filter((item) => {
                    const nombre = this.normalizar(item.Nombre);
                    return item.Nombre.length > 0 && nombre !== 'ninguna' && nombre !== 'sin subdisciplina';
                })
                .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
        }

        const idSubdisciplina = this.toInt(this.form.controls.id_subdisciplina.value, 0);
        if (idSubdisciplina > 0 && !this.subdisciplinasActuales.some((item) => item.Id === idSubdisciplina))
            this.form.controls.id_subdisciplina.setValue(0);
    }

    private sincronizarComponentesPorVariante(): void {
        const idsValidos = new Set(this.componentesCatalogoActual.map((item) => this.toInt(item?.Id, 0)));
        this.componentesSeleccionados = this.componentesSeleccionados.filter((id) => idsValidos.has(this.toInt(id, 0)));
    }

    private validarReglasDominio(): string {
        const nombre = `${this.form.controls.nombre.value ?? ''}`.trim();
        if (this.esNombreDuplicado(nombre))
            return 'Ya existe un conjuro con ese nombre (comparación normalizada).';

        if (this.varianteActualEsBase) {
            if (this.form.controls.arcano.value !== true && this.form.controls.divino.value !== true)
                return 'Un conjuro base debe ser arcano, divino o ambos.';
            if (this.toInt(this.form.controls.id_escuela.value, 0) <= 0)
                return 'Debes seleccionar una escuela válida para el conjuro base.';
        } else {
            if (this.toInt(this.form.controls.id_disciplina.value, 0) <= 0)
                return 'Debes seleccionar una disciplina válida para el conjuro psiónico.';
            if (this.form.controls.puntos_poder.value === null || this.form.controls.puntos_poder.value === undefined || `${this.form.controls.puntos_poder.value}`.trim() === '')
                return 'Debes indicar el coste en puntos de poder.';
            const idSubdisciplina = this.toInt(this.form.controls.id_subdisciplina.value, 0);
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
            const id = this.toInt(row?.id, 0);
            if (id <= 0)
                return;

            const item: ConjuroCreateNivelRef = {
                [idField]: id,
                nivel: this.toInt(row?.nivel, 0),
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
            const left = this.toInt(a[idField], 0);
            const right = this.toInt(b[idField], 0);
            return left - right;
        });
    }

    private esNombreDuplicado(nombre: string): boolean {
        const objetivo = this.normalizar(nombre);
        if (objetivo.length < 1)
            return false;
        return this.conjurosExistentes.some((conjuro) => this.normalizar(conjuro?.Nombre ?? '') === objetivo);
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
        return Array.from(new Set((ids ?? []).map((id) => this.toInt(id, 0)).filter((id) => id > 0))).sort((a, b) => a - b);
    }

    private toInt(value: any, fallback: number): number {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private normalizar(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private toArray<T = any>(value: any): T[] {
        if (Array.isArray(value))
            return value;
        if (value && typeof value === 'object')
            return Object.values(value) as T[];
        return [];
    }
}
