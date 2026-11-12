import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DominioService } from 'src/app/services/dominio.service';
import { DoteService } from 'src/app/services/dote.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { NuevaRazaDraftService } from 'src/app/services/nueva-raza-draft.service';
import { RacialService } from 'src/app/services/racial.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { RazaService } from 'src/app/services/raza.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { UserService } from 'src/app/services/user.service';
import { PrerrequisitosTiposService } from 'src/app/services/prerrequisitos-tipos.service';
import { CategoriaEdadService } from 'src/app/services/categoria-edad.service';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { normalizeRazaApi } from 'src/app/services/utils/raza-mapper';
import { NuevaRazaComponent } from './nueva-raza.component';
import { ModeloMutacion } from 'src/app/interfaces/razas-api';

function tipoMutacion(Clave: string, Nombre: string, Sujeto: 'raza_base' | 'personaje' | 'creacion', Catalogo: string | null,
                      pide: { referencia?: boolean; cantidad?: boolean; texto?: boolean; } = {}) {
    return {
        Clave, Nombre, Ejemplo: '', Sujeto, Dato: Clave, Comparador: 'es', Catalogo,
        Pide_referencia: pide.referencia === true, Pide_cantidad: pide.cantidad === true, Pide_texto: pide.texto === true,
    };
}

/**
 * Lo que admite una raza mutada (`GET /razas/mutaciones/modelo`, fase 3): los tipos son datos de la API, también uno que
 * no está en el registro del código (`dgs_raciales_maximos`).
 */
const MODELO_MUTACION: ModeloMutacion = {
    Tipos_de_prerrequisito: [
        tipoMutacion('actitud_requerido', 'Actitud requerida', 'personaje', 'actitudes', { referencia: true }),
        tipoMutacion('alineamiento_requerido', 'Alineamiento requerido', 'personaje', 'alineamientos_basicos', { referencia: true }),
        tipoMutacion('tipo_criatura', 'Tipo de criatura', 'raza_base', 'tipos_criatura', { referencia: true }),
        tipoMutacion('caracteristica', 'Característica mínima', 'personaje', 'caracteristicas', { referencia: true, cantidad: true }),
        tipoMutacion('condicion_master', 'Condición que confirma el máster', 'personaje', null, { texto: true }),
        tipoMutacion('dgs_raciales_maximos', 'DG raciales máximos de la raza base', 'raza_base', null, { cantidad: true }),
        // Los del personaje que quedaban fuera de la fase 3 (R6 y R9, 2026-11-12): el NEP, una dote y el nivel de lanzador.
        tipoMutacion('nep_max', 'NEP máximo', 'personaje', null, { cantidad: true }),
        tipoMutacion('dote', 'Dote', 'personaje', 'dotes', { referencia: true }),
        tipoMutacion('nivel_lanzador', 'Nivel de lanzador', 'personaje', null, { cantidad: true }),
    ],
    Campos: [
        { Campo: 'Tamano', Nombre: 'Tamaño', Clase: 'tamano', Por_defecto: 'sustituir_si_hay',
          Operaciones: ['heredar', 'sustituir', 'sustituir_si_hay', 'pasos'], Catalogo_elementos: null },
        { Campo: 'Raciales', Nombre: 'Rasgos raciales', Clase: 'lista', Por_defecto: 'unir',
          Operaciones: ['heredar', 'sustituir', 'sustituir_si_hay', 'unir', 'quitar', 'conservar'], Catalogo_elementos: 'raciales' },
        { Campo: 'Correr', Nombre: 'Velocidad', Clase: 'numero', Por_defecto: 'sustituir_si_hay',
          Operaciones: ['heredar', 'sustituir', 'sustituir_si_hay', 'sumar', 'maximo', 'minimo'], Catalogo_elementos: null },
    ],
    // Las que llevan valor, como las da la API (`Operaciones[].Valor`): los pasos y el mínimo de un `sumar`.
    Operaciones: [
        { Clave: 'heredar', Nombre: 'Heredar', Descripcion: 'lo de la raza base', Valor: null },
        { Clave: 'sustituir_si_hay', Nombre: 'Sustituir si lo trae', Descripcion: 'lo de la mutación si lo trae', Valor: null },
        { Clave: 'sumar', Nombre: 'Sumar', Descripcion: 'lo de la mutación sumado a lo de la raza base',
          Valor: { Nombre: 'Mínimo del resultado', Obligatorio: false, Minimo: -1000, Maximo: 1000 } },
        { Clave: 'pasos', Nombre: 'Pasos de tamaño', Descripcion: 'categorías de tamaño sobre la raza base',
          Valor: { Nombre: 'Categorías (±)', Obligatorio: true, Minimo: -8, Maximo: 8 } },
        { Clave: 'quitar', Nombre: 'Quitar de la base', Descripcion: 'lo de la raza base sin estos', Valor: null },
    ],
    Catalogos: {
        actitudes: [{ Id: 1, Nombre: 'Legal' }, { Id: 4, Nombre: 'Bueno' }],
        alineamientos_basicos: [{ Id: 2, Nombre: 'Legal bueno' }],
        caracteristicas: [{ Id: 4, Nombre: 'Inteligencia' }],
        momentos: [{ Id: 1, Nombre: 'Al crear el personaje' }],
    },
};

/** El catálogo de categorías de edad (`GET /categorias-edad`), con los ids de prueba. */
const CATEGORIAS_EDAD = [
    { Id: 1, Nombre: 'Cría', Orden_tipico: 1, Oficial: true, Manual: { Id: 1, Nombre: 'Manual base', Pagina: 74 } },
    { Id: 3, Nombre: 'Joven', Orden_tipico: 3, Oficial: true, Manual: { Id: 1, Nombre: 'Manual base', Pagina: 74 } },
    { Id: 6, Nombre: 'Adulto', Orden_tipico: 6, Oficial: true, Manual: { Id: 1, Nombre: 'Manual base', Pagina: 74 } },
    { Id: 12, Nombre: 'Gran sierpe', Orden_tipico: 12, Oficial: true, Manual: { Id: 1, Nombre: 'Manual base', Pagina: 74 } },
];

describe('NuevaRazaComponent', () => {
    let fixture: ComponentFixture<NuevaRazaComponent>;
    let component: NuevaRazaComponent;
    let canCreate: boolean;
    let currentUid: string;
    let razaSvc: jasmine.SpyObj<RazaService>;
    let racialSvc: jasmine.SpyObj<RacialService>;
    let draftSvc: NuevaRazaDraftService;
    const acl$ = new Subject<void>();
    const isLoggedIn$ = new Subject<boolean>();

    beforeEach(async () => {
        canCreate = true;
        currentUid = '';
        localStorage.clear();
        razaSvc = jasmine.createSpyObj<RazaService>('RazaService', ['getRazas', 'crearRaza', 'getRazaFresca', 'actualizarRaza', 'getModeloMutacion']);
        razaSvc.getModeloMutacion.and.resolveTo(MODELO_MUTACION);
        racialSvc = jasmine.createSpyObj<RacialService>('RacialService', ['getRaciales', 'anadirPrerrequisitosRacial']);
        razaSvc.getRazas.and.returnValue(of([]));
        razaSvc.crearRaza.and.resolveTo({ message: 'ok', idRaza: 99 });
        racialSvc.getRaciales.and.returnValue(of([{ Id: 15, Nombre: 'Vision en la penumbra' } as any]));
        racialSvc.anadirPrerrequisitosRacial.and.callFake(async (idRacial: number, prerrequisitos: any) => ({
            message: 'ok',
            idRacial,
            racial: {
                Id: idRacial,
                Nombre: idRacial === 41 ? 'Entrenamiento propio' : 'Vision en la penumbra',
                Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
                Prerrequisitos: { raza: prerrequisitos?.raza ?? [], caracteristica: [] },
            } as any,
        }));

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule],
            declarations: [NuevaRazaComponent],
            providers: [
                { provide: RazaService, useValue: razaSvc },
                { provide: PrerrequisitosTiposService, useValue: { cargar: () => Promise.resolve() } },
                { provide: CategoriaEdadService, useValue: { getCategoriasEdad: () => of(CATEGORIAS_EDAD) } },
                { provide: UserService, useValue: {
                    acl$: acl$.asObservable(),
                    isLoggedIn$: isLoggedIn$.asObservable(),
                    get CurrentUserUid() { return currentUid; },
                    can: jasmine.createSpy().and.callFake(() => canCreate),
                    getPermissionDeniedMessage: jasmine.createSpy().and.returnValue('Sin permisos suficientes.'),
                } },
                { provide: ManualService, useValue: { getManuales: () => of([{ Id: 1, Nombre: 'Manual base', Incluye_razas: true, Oficial: true }]) } },
                { provide: ClaseService, useValue: { getClases: () => of([{ Id: 1, Nombre: 'Guerrero' }]) } },
                { provide: TamanoService, useValue: { getTamanos: () => of([
                    { Id: 3, Nombre: 'Grande', Modificador: -1, Modificador_presa: 4 },
                    { Id: 2, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
                ]) } },
                { provide: TipoCriaturaService, useValue: { getTiposCriatura: () => of([{ Id: 3, Nombre: 'Humanoide' }, { Id: 4, Nombre: 'Gigante' }]) } },
                { provide: AlineamientoService, useValue: {
                    getAlineamientosCombinacionesCatalogo: () => of([
                        { Id: 0, Basico: { Id: 0, Nombre: 'No aplica' }, Ley: { Id: 0, Nombre: 'No aplica' }, Moral: { Id: 0, Nombre: 'No aplica' }, Prioridad: { Id: 0, Nombre: 'Sin prioridad', Descripcion: 'No condiciona el alineamiento.' } },
                        { Id: 7, Basico: { Id: 2, Nombre: 'Legal bueno' }, Ley: { Id: 10, Nombre: 'Ninguna preferencia' }, Moral: { Id: 10, Nombre: 'Ninguna preferencia' }, Prioridad: { Id: 1, Nombre: 'Debe tenerse en cuenta', Descripcion: '' } },
                        { Id: 10, Basico: { Id: 2, Nombre: 'Legal bueno' }, Ley: { Id: 10, Nombre: 'Ninguna preferencia' }, Moral: { Id: 10, Nombre: 'Ninguna preferencia' }, Prioridad: { Id: 2, Nombre: 'Importante', Descripcion: '' } },
                        { Id: 9, Basico: { Id: 0, Nombre: 'No aplica' }, Ley: { Id: 2, Nombre: 'Casi siempre legal' }, Moral: { Id: 4, Nombre: 'Casi siempre bueno' }, Prioridad: { Id: 2, Nombre: 'Importante', Descripcion: 'Tendencia importante.' } },
                    ]),
                    // Como la API desde el 2026-10-24: sin las filas 0 de relleno («No aplica», «Sin prioridad»).
                    getAlineamientosBasicosCatalogo: () => of([
                        { Id: 2, Nombre: 'Legal bueno' },
                    ]),
                    getAlineamientosPrioridadesCatalogo: () => of([
                        { Id: 4, Nombre: 'Final', Descripcion: 'Marca interna.' },
                        { Id: 2, Nombre: 'Importante', Descripcion: 'Tendencia importante.' },
                        { Id: 1, Nombre: 'Debe tenerse en cuenta', Descripcion: 'Debe respetarse.' },
                    ]),
                    getAlineamientosPreferenciaLeyCatalogo: () => of([
                        { Id: 2, Nombre: 'Casi siempre legal', Descripcion: '' },
                        { Id: 10, Nombre: 'Ninguna preferencia', Descripcion: '' },
                    ]),
                    getAlineamientosPreferenciaMoralCatalogo: () => of([
                        { Id: 4, Nombre: 'Casi siempre bueno', Descripcion: '' },
                        { Id: 10, Nombre: 'Ninguna preferencia', Descripcion: '' },
                    ]),
                } },
                { provide: SubtipoService, useValue: { getSubtipos: () => of([{ Id: 8, Nombre: 'Humano' }, { Id: 6, Nombre: 'Dragon' }]) } },
                { provide: IdiomaService, useValue: { getIdiomas: () => of([{ Id: 9, Nombre: 'Comun' }, { Id: 7, Nombre: 'Draconico' }]) } },
                { provide: HabilidadService, useValue: {
                    getHabilidades: () => of([{ Id_habilidad: 11, Nombre: 'Avistar' }, { Id_habilidad: 12, Nombre: 'Escuchar' }]),
                    getHabilidadesCustom: () => of([{ Id_habilidad: 13, Nombre: 'Saber antiguo' }]),
                    habilidadesCustomMutadas$: new Subject<any>(),
                } },
                { provide: DoteService, useValue: { getDotes: () => of([{ Id: 14, Nombre: 'Alerta', Extras_soportados: {}, Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] } }]) } },
                { provide: RacialService, useValue: racialSvc },
                { provide: ConjuroService, useValue: { getConjuros: () => of([{ Id: 16, Nombre: 'Luz' }]) } },
                { provide: DominioService, useValue: { getDominios: () => of([{ Id: 2, Nombre: 'Aire' }, { Id: 20, Nombre: 'Ley' }]) } },
                { provide: ArmaService, useValue: { getArmas: () => of([{ Id: 17, Nombre: 'Espada larga' }]) } },
                { provide: ArmaduraService, useValue: { getArmaduras: () => of([{ Id: 23, Nombre: 'Camisote de mallas' }]) } },
                { provide: GrupoArmaService, useValue: { getGruposArmas: () => of([{ Id: 18, Nombre: 'Armas marciales' }]) } },
                { provide: GrupoArmaduraService, useValue: { getGruposArmaduras: () => of([{ Id: 19, Nombre: 'Armadura ligera' }]) } },
                { provide: RazaCatalogosService, useValue: {
                    getManiobrabilidades: () => of([
                        {
                            Id: 22,
                            Nombre: 'Buena',
                            Velocidad_avance: 'Normal',
                            Flotar: 0,
                            Volar_atras: 0,
                            Contramarcha: 0,
                            Giro: '90 grados',
                            Rotacion: '180 grados',
                            Giro_max: '180 grados',
                            Angulo_ascenso: '60 grados',
                            Velocidad_ascenso: 'Mitad',
                            Angulo_descenso: 'Cualquiera',
                            Descenso_ascenso: 1,
                        },
                        {
                            Id: 21,
                            Nombre: 'Media',
                            Velocidad_avance: 'La mitad',
                            Flotar: 0,
                            Volar_atras: 1,
                            Contramarcha: 0,
                            Giro: '45 grados',
                            Rotacion: '90 grados',
                            Giro_max: '90 grados',
                            Angulo_ascenso: '60 grados',
                            Velocidad_ascenso: 'Mitad',
                            Angulo_descenso: 'Cualquiera',
                            Descenso_ascenso: 1,
                        },
                    ]),
                    getTiposDado: () => of([{ Id: 23, Nombre: 'd10' }, { Id: 22, Nombre: 'd8' }]),
                    getActitudes: () => of([{ Id: 1, Nombre: 'Legal' }, { Id: 4, Nombre: 'Buena' }]),
                } },
            ],
        })
            .overrideComponent(NuevaRazaComponent, { set: { template: '' } })
            .compileComponents();

        fixture = TestBed.createComponent(NuevaRazaComponent);
        component = fixture.componentInstance;
        draftSvc = TestBed.inject(NuevaRazaDraftService);
        fixture.detectChanges();
        await fixture.whenStable();
        setFormularioValido();
    });

    afterEach(() => {
        fixture?.destroy();
        localStorage.clear();
    });

    function setFormularioValido(): void {
        component.form.patchValue({
            nombre: 'Nueva raza',
            descripcion: 'Descripcion suficientemente larga',
            id_manual: 1,
            id_clase_predilecta: 1,
            id_tamano: 2,
            id_tipo_criatura: 3,
            id_tipo_criatura_dgs: 3,
            id_alineamiento: 0,
            id_prioridad_alineamiento: 0,
            id_maniobrabilidad: 21,
            id_tipo_dado: 22,
            edad_adulto: 18,
            edad_mediana: 35,
            edad_viejo: 53,
            edad_venerable: 70,
            altura_rango_inf: 1.5,
            altura_rango_sup: 1.9,
            peso_rango_inf: 50,
            peso_rango_sup: 90,
        });
        component.form.updateValueAndValidity();
    }

    /** Una fila del editor de un tipo de prerrequisito de mutación (`mutacion.<clave>`). */
    function prerreqRow(tipo: string, id: number, opcional: number = 0): any {
        return {
            uid: `${tipo}-${id}-${opcional}`,
            tipo: `mutacion.${tipo}`,
            id,
            valor: 0,
            opcional,
            id_extra: null,
            repetido: 1,
            requiere_extra: false,
            salvacion_tipo: 'fortaleza',
        };
    }

    function crearDraftContenido(partial?: any): any {
        return {
            selectedIndex: 3,
            formValue: {
                ...(component as any).getFormularioDefaultValues(),
                nombre: 'Raza en borrador',
                descripcion: 'Descripción de borrador suficientemente larga',
                id_manual: 1,
                id_clase_predilecta: 1,
                id_tamano: 2,
                id_tipo_criatura: 3,
                edad_adulto: 18,
                edad_mediana: 35,
                edad_viejo: 53,
                edad_venerable: 70,
                altura_rango_inf: 1.5,
                altura_rango_sup: 1.9,
                peso_rango_inf: 50,
                peso_rango_sup: 90,
                mutada: true,
                tamano_mutacion_dependiente: true,
            },
            selections: {
                subtiposSeleccionados: [8],
                idiomasSeleccionados: [9],
                armasCompetenciaSeleccionadas: [17],
                armadurasCompetenciaSeleccionadas: [23],
                gruposArmaSeleccionados: [18],
                gruposArmaduraSeleccionados: [19],
            },
            searches: {
                clasePredilectaBusqueda: 'Guerrero',
                tipoCriaturaDgsBusqueda: '',
            },
            relacionQueries: {
                subtiposSeleccionados: '',
                idiomasSeleccionados: 'com',
                armasCompetenciaSeleccionadas: '',
                armadurasCompetenciaSeleccionadas: '',
                gruposArmaSeleccionados: '',
                gruposArmaduraSeleccionados: '',
            },
            rows: {
                habilidadesBaseRows: [{ uid: 'hb', id_habilidad: 11, cantidad: 2, id_extra: 0, varios: 'No especifica', busqueda: 'Avistar' }],
                habilidadesCustomRows: [{ uid: 'hc', id_habilidad: 13, cantidad: 1, busqueda: 'Saber' }],
                dotesRows: [{ uid: 'd', id_dote: 14, id_extra: 0, busqueda: 'Alerta' }],
                racialesRows: [{ uid: 'r', id_racial: 15, opcional: 0, busqueda: 'Vision' }],
                racialesPendientesRazaEnCreacionIds: [],
                sortilegiosRows: [{ uid: 's', id_conjuro: 16, nivel_lanzador: 2, usos_diarios: '1/dia', descripcion: 'No especifica', busqueda: 'Luz' }],
                prerrequisitosMutacionRows: [prerreqRow('tipo_criatura', 3, 2)],
                prerrequisitosMutacionSeleccionados: ['mutacion.tipo_criatura'],
                cambiosMutacionRows: [{ uid: 'cm', campo: 'Tamano', operacion: 'heredar', valor: null, elementos: [] }],
            },
            ...partial,
        };
    }

    async function recrearComponenteConUid(uid: string): Promise<void> {
        fixture.destroy();
        currentUid = uid;
        fixture = TestBed.createComponent(NuevaRazaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await Promise.resolve();
        await Promise.resolve();
    }

    it('construye payload completo con nucleo y relaciones deduplicadas', () => {
        component.subtiposSeleccionados = [8, 6, 8];
        component.idiomasSeleccionados = [9, 7, 9];
        component.armasCompetenciaSeleccionadas = [17, 17];
        component.armadurasCompetenciaSeleccionadas = [23, 23];
        component.gruposArmaSeleccionados = [18, 18];
        component.gruposArmaduraSeleccionados = [19, 19];
        component.habilidadesBaseRows = [
            { uid: 'a', id_habilidad: 11, cantidad: 2, id_extra: 0, varios: '' },
            { uid: 'b', id_habilidad: 11, cantidad: 2, id_extra: 0, varios: 'No especifica' },
        ];
        component.habilidadesCustomRows = [{ uid: 'c', id_habilidad: 13, cantidad: 1 }];
        component.dotesRows = [
            { uid: 'd', id_dote: 14, id_extra: 0 },
            { uid: 'e', id_dote: 14, id_extra: 0 },
        ];
        component.racialesRows = [{ uid: 'f', id_racial: 15, opcional: 0 }];
        component.sortilegiosRows = [{ uid: 'g', id_conjuro: 16, nivel_lanzador: 3, usos_diarios: '1/dia', descripcion: '' }];
        component.prerrequisitosMutacionSeleccionados = ['mutacion.actitud_requerido', 'mutacion.tipo_criatura'];
        component.prerrequisitosMutacionRows = [
            prerreqRow('actitud_requerido', 4, 1),
            prerreqRow('actitud_requerido', 1, 1),
            prerreqRow('tipo_criatura', 3),
            prerreqRow('tipo_criatura', 4, 2),
        ];
        component.form.patchValue({ mutada: true });
        component.form.patchValue({ dgs_extra: 1, id_tipo_dado: 22 });

        const payload = component.buildPayload();

        expect(payload.raza).toEqual(jasmine.objectContaining({
            nombre: 'Nueva raza',
            descripcion: 'Descripcion suficientemente larga',
            id_manual: 1,
            id_tamano: 2,
            id_tipo_criatura: 3,
            id_maniobrabilidad: 21,
            id_tipo_dado: 22,
            mutada: true,
        }));
        expect(payload.subtipos).toEqual([6, 8]);
        expect(payload.idiomas).toEqual([7, 9]);
        expect(payload.competencias).toEqual({ armas: [17], armaduras: [23], gruposArma: [18], gruposArmadura: [19] });
        expect(payload.habilidades?.base).toEqual([{
            id_habilidad: 11,
            cantidad: 2,
            varios: 'No especifica',
        }]);
        expect(payload.habilidades?.custom).toEqual([{ id_habilidad: 13, cantidad: 1 }]);
        expect(payload.dotes).toEqual([{ id_dote: 14 }]);
        expect(payload.raciales).toEqual([{ id_racial: 15, opcional: 0 }]);
        expect(payload.sortilegios).toEqual([{ id_conjuro: 16, nivel_lanzador: 3, usos_diarios: '1/dia', descripcion: 'No especifica' }]);
        expect(payload.prerrequisitos_mutacion).toEqual([
            { tipo: 'actitud_requerido', id_referencia: 4, opcional: 1 },
            { tipo: 'actitud_requerido', id_referencia: 1, opcional: 1 },
            { tipo: 'tipo_criatura', id_referencia: 3 },
            { tipo: 'tipo_criatura', id_referencia: 4, opcional: 2 },
        ]);
        expect(payload.cambios_mutacion).toEqual([]);
        expect((payload as any).uid).toBeUndefined();
        expect((payload as any).firebaseUid).toBeUndefined();
        expect((payload as any).createdAt).toBeUndefined();
        expect((payload.raza as any).heredada).toBeUndefined();
        expect((payload as any).plantillasNoObtenibles).toBeUndefined();
    });

    it('manda la parte condicional de una habilidad base (lo que suma solo en un caso) y exige las dos mitades', () => {
        component.habilidadesBaseRows = [
            { uid: 'a', id_habilidad: 16, cantidad: 2, id_extra: 0, varios: '', cantidad_condicional: 2, condicion: ' bajo tierra ' },
            { uid: 'b', id_habilidad: 15, cantidad: 2, id_extra: 0, varios: '', cantidad_condicional: 0, condicion: '' },
        ];
        expect(component.buildPayload().habilidades?.base).toEqual([
            { id_habilidad: 16, cantidad: 2, varios: 'No especifica', cantidad_condicional: 2, condicion: 'bajo tierra' },
            { id_habilidad: 15, cantidad: 2, varios: 'No especifica' },
        ]);

        component.habilidadesBaseRows = [{ uid: 'a', id_habilidad: 16, cantidad: 2, id_extra: 0, varios: '', cantidad_condicional: 0, condicion: 'bajo tierra' }];
        expect((component as any).validarReglasDominio()).toContain('lo que suma y cuándo');
    });

    it('añade y selecciona automáticamente un racial creado desde el modal', () => {
        component.raciales = [{ Id: 15, Nombre: 'Visión en la penumbra' } as any];
        component.racialesRows = [{ uid: 'r1', id_racial: 0, opcional: 1, busqueda: '' }];
        component.modalNuevoRacialVisible = true;

        component.onRacialCreadoDesdeModal({
            idRacial: 40,
            nombre: 'Piel pétrea',
            racial: { Id: 40, Nombre: 'Piel pétrea' } as any,
        });

        expect(component.modalNuevoRacialVisible).toBeFalse();
        expect(component.raciales.map((racial) => racial.Nombre)).toEqual(['Piel pétrea', 'Visión en la penumbra']);
        expect(component.racialesRows[0]).toEqual(jasmine.objectContaining({
            id_racial: 40,
            opcional: 0,
            busqueda: 'Piel pétrea',
        }));
    });

    it('selecciona automáticamente el racial creado para la raza en creación', () => {
        component.racialesRows = [{ uid: 'r1', id_racial: 0, opcional: 1, busqueda: '' }];
        component.modalNuevoRacialVisible = true;

        component.onRacialCreadoDesdeModal({
            idRacial: 41,
            nombre: 'Entrenamiento propio',
            racial: {
                Id: 41,
                Nombre: 'Entrenamiento propio',
                Prerrequisitos_flags: { raza: false },
                Prerrequisitos: { raza: [] },
            } as any,
            prerrequisitoRazaEnCreacion: true,
        });

        expect(component.modalNuevoRacialVisible).toBeFalse();
        expect(component.racialesRows[0]).toEqual(jasmine.objectContaining({
            id_racial: 41,
            opcional: 0,
            busqueda: 'Entrenamiento propio',
        }));
        expect(component.tieneRacialesPendientesRazaEnCreacion()).toBeTrue();
    });

    it('no ofrece raciales con prerrequisitos de raza en nueva raza', () => {
        component.raciales = [
            { Id: 15, Nombre: 'Visión en la penumbra', Prerrequisitos_flags: { raza: false }, Prerrequisitos: { raza: [] } } as any,
            { Id: 16, Nombre: 'Entrenamiento élfico', Prerrequisitos_flags: { raza: true }, Prerrequisitos: { raza: [{ Id_raza: 2 }] } } as any,
        ];

        const opciones = component.getRacialesFiltrados({ uid: 'r1', id_racial: 0, opcional: 0, busqueda: '' });

        expect(opciones.map((racial) => racial.Id)).toEqual([15]);
    });

    it('no selecciona automáticamente un racial creado con prerrequisito de raza', () => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        component.racialesRows = [{ uid: 'r1', id_racial: 0, opcional: 0, busqueda: '' }];
        component.modalNuevoRacialVisible = true;

        component.onRacialCreadoDesdeModal({
            idRacial: 40,
            nombre: 'Entrenamiento élfico',
            racial: {
                Id: 40,
                Nombre: 'Entrenamiento élfico',
                Prerrequisitos_flags: { raza: true },
                Prerrequisitos: { raza: [{ id_raza: 2 }] },
            } as any,
            tienePrerrequisitoRaza: true,
        });

        expect(component.modalNuevoRacialVisible).toBeFalse();
        expect(component.racialesRows[0]).toEqual(jasmine.objectContaining({
            id_racial: 0,
            busqueda: '',
        }));
        expect(component.raciales.some((racial) => racial.Id === 40)).toBeTrue();
        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
            title: 'Racial creado sin añadir',
        }));
    });

    it('bloquea nombre duplicado normalizado', () => {
        component.razasExistentes = [{ Id: 1, Nombre: 'Élfo   lunar' } as any];
        component.form.patchValue({ nombre: 'Elfo lunar' });

        const error = (component as any).validarReglasDominio();

        expect(error).toContain('Ya existe una raza');
    });

    it('deja guardar una raza mutada sin prerrequisitos (fase 3)', () => {
        component.form.patchValue({ mutada: true });

        expect((component as any).validarReglasDominio()).toBeNull();
        expect(component.buildPayload().prerrequisitos_mutacion).toEqual([]);
    });

    it('no envia prerrequisitos ni cambios de mutación cuando no es mutada', () => {
        component.form.patchValue({ mutada: false });
        component.prerrequisitosMutacionSeleccionados = ['mutacion.actitud_requerido'];
        component.prerrequisitosMutacionRows = [prerreqRow('actitud_requerido', 4)];

        const payload = component.buildPayload();

        expect(payload.raza.mutada).toBeFalse();
        expect('tamano_mutacion_dependiente' in payload.raza).toBeFalse();
        expect(payload.prerrequisitos_mutacion).toBeUndefined();
        expect(payload.cambios_mutacion).toBeUndefined();
        expect((payload as any).prerrequisitos).toBeUndefined();
    });

    it('limpia prerrequisitos y cambios al desactivar mutada', () => {
        component.form.patchValue({ mutada: true });
        component.prerrequisitosMutacionSeleccionados = ['mutacion.actitud_requerido', 'mutacion.tipo_criatura'];
        component.prerrequisitosMutacionRows = [prerreqRow('actitud_requerido', 4), prerreqRow('tipo_criatura', 3)];
        component.agregarCambioMutacion();
        component.selectorPrerrequisitosMutacionVisible = true;

        component.form.patchValue({ mutada: false });

        expect(component.prerrequisitosMutacionSeleccionados).toEqual([]);
        expect(component.prerrequisitosMutacionRows).toEqual([]);
        expect(component.cambiosMutacionRows).toEqual([]);
        expect(component.selectorPrerrequisitosMutacionVisible).toBeFalse();
    });

    it('ofrece los tipos de prerrequisito del modelo de la API, también uno que solo existe como datos', () => {
        expect(component.prerrequisitosMutacionOpciones.map((opcion) => [opcion.key, opcion.label])).toEqual([
            ['mutacion.actitud_requerido', 'Actitud requerida'],
            ['mutacion.alineamiento_requerido', 'Alineamiento requerido'],
            ['mutacion.tipo_criatura', 'Tipo de criatura'],
            ['mutacion.caracteristica', 'Característica mínima'],
            ['mutacion.condicion_master', 'Condición que confirma el máster'],
            ['mutacion.dgs_raciales_maximos', 'DG raciales máximos de la raza base'],
            ['mutacion.nep_max', 'NEP máximo'],
            ['mutacion.dote', 'Dote'],
            ['mutacion.nivel_lanzador', 'Nivel de lanzador'],
        ]);
        // La referencia sale del catálogo que dice el tipo: los pequeños, del modelo; los grandes, de los del formulario.
        const contexto = component.prerrequisitosMutacionCatalogContext;
        expect(contexto.getCatalog('mutacion.actitud_requerido')).toEqual([{ id: 1, nombre: 'Legal' }, { id: 4, nombre: 'Bueno' }]);
        expect(contexto.getCatalog('mutacion.tipo_criatura').map((item) => item.nombre)).toEqual(['Gigante', 'Humanoide']);
    });

    it('el NEP máximo, una dote (del catálogo de dotes del formulario) y el nivel de lanzador, como los demás tipos', () => {
        component.dotes = [{ Id: 30, Nombre: 'Alerta' }, { Id: 31, Nombre: 'Soltura con un arma' }] as any;
        expect(component.prerrequisitosMutacionCatalogContext.getCatalog('mutacion.dote'))
            .toEqual([{ id: 30, nombre: 'Alerta' }, { id: 31, nombre: 'Soltura con un arma' }]);
        component.form.patchValue({ mutada: true });
        component.prerrequisitosMutacionSeleccionados = ['mutacion.nep_max', 'mutacion.dote', 'mutacion.nivel_lanzador'];
        component.prerrequisitosMutacionRows = [
            { ...prerreqRow('nep_max', 0), valor: 15 },
            prerreqRow('dote', 30),
            { ...prerreqRow('nivel_lanzador', 0), valor: 11 },
        ];

        expect((component as any).validarReglasDominio()).toBeNull();
        expect(component.buildPayload().prerrequisitos_mutacion).toEqual([
            { tipo: 'nep_max', cantidad: 15 },
            { tipo: 'dote', id_referencia: 30 },
            { tipo: 'nivel_lanzador', cantidad: 11 },
        ]);
    });

    it('manda cada tipo con lo que pide: la referencia, la cantidad o el texto', () => {
        component.form.patchValue({ mutada: true });
        component.prerrequisitosMutacionSeleccionados = ['mutacion.caracteristica', 'mutacion.condicion_master',
            'mutacion.dgs_raciales_maximos', 'mutacion.alineamiento_requerido'];
        component.prerrequisitosMutacionRows = [
            { ...prerreqRow('caracteristica', 4), valor: 3 },
            { ...prerreqRow('condicion_master', 0), texto: '  Completar el Rito del Renacimiento ' },
            { ...prerreqRow('dgs_raciales_maximos', 0), valor: 0 },
            prerreqRow('alineamiento_requerido', 2, 3),
        ];

        expect((component as any).validarReglasDominio()).toBeNull();
        expect(component.buildPayload().prerrequisitos_mutacion).toEqual([
            { tipo: 'caracteristica', id_referencia: 4, cantidad: 3 },
            { tipo: 'condicion_master', texto: 'Completar el Rito del Renacimiento' },
            { tipo: 'dgs_raciales_maximos', cantidad: 0 },
            // El alineamiento, por su básico (la API ya no pide la combinación).
            { tipo: 'alineamiento_requerido', id_referencia: 2, opcional: 3 },
        ]);
    });

    it('no deja guardar un prerrequisito sin completar', () => {
        component.form.patchValue({ mutada: true });
        component.prerrequisitosMutacionSeleccionados = ['mutacion.condicion_master'];
        component.prerrequisitosMutacionRows = [{ ...prerreqRow('condicion_master', 0), texto: '' }];

        expect((component as any).validarReglasDominio()).toContain('pendientes de completar');
    });

    it('los cambios sobre la raza base: campo, operación y lo que va con ella', () => {
        component.form.patchValue({ mutada: true });
        component.agregarCambioMutacion();
        component.agregarCambioMutacion();
        const [tamano, raciales] = component.cambiosMutacionRows;

        // Un campo no se repite y la regla de hoy no se ofrece (sin fila es la que se aplica).
        component.actualizarCambioMutacion(tamano.uid, { campo: 'Tamano' });
        expect(component.camposMutacionLibres(component.cambiosMutacionRows[1]).map((campo) => campo.Campo)).toEqual(['Raciales', 'Correr']);
        expect(component.operacionesMutacion(component.cambiosMutacionRows[0])).toEqual(['heredar', 'sustituir', 'pasos']);
        component.actualizarCambioMutacion(tamano.uid, { operacion: 'pasos' });
        expect(component.cambiosMutacionRows[0].valor).toBe(1);
        component.actualizarCambioMutacion(raciales.uid, { campo: 'Raciales', operacion: 'quitar' });
        expect((component as any).validarReglasDominio()).toContain('Elige qué elementos');
        component.actualizarCambioMutacion(raciales.uid, { elementos: [15, 15] });
        expect(component.elementosDeCambio(component.cambiosMutacionRows[1])).toEqual([{ id: 15, nombre: 'Vision en la penumbra' }]);

        expect((component as any).validarReglasDominio()).toBeNull();
        expect(component.buildPayload().cambios_mutacion).toEqual([
            { campo: 'Tamano', operacion: 'pasos', valor: 1 },
            { campo: 'Raciales', operacion: 'quitar', elementos: [15] },
        ]);

        // Otro campo vuelve a empezar la operación y lo que va con ella.
        component.actualizarCambioMutacion(raciales.uid, { campo: 'Tamano' });
        expect(component.cambiosMutacionRows[1]).toEqual(jasmine.objectContaining({ operacion: '', valor: null, elementos: [] }));
        expect((component as any).validarReglasDominio()).toContain('un solo cambio');
    });

    it('el mínimo de un «sumar» sale del modelo, es opcional y se conserva al editar (la momia de Libris Mortis)', () => {
        component.form.patchValue({ mutada: true });
        component.agregarCambioMutacion();
        const [correr] = component.cambiosMutacionRows;
        component.actualizarCambioMutacion(correr.uid, { campo: 'Correr', operacion: 'sumar' });

        // Con valor, pero sin uno por defecto: sin escribirlo, la suma no tiene mínimo y no se manda.
        expect(component.valorDeOperacion('sumar')?.Nombre).toBe('Mínimo del resultado');
        expect(component.operacionConValor('maximo')).toBeFalse();
        expect(component.cambiosMutacionRows[0].valor).toBeNull();
        expect((component as any).validarReglasDominio()).toBeNull();
        expect(component.buildPayload().cambios_mutacion).toEqual([{ campo: 'Correr', operacion: 'sumar' }]);

        // −10', hasta un mínimo de 10' (pág. 38).
        component.actualizarCambioMutacion(correr.uid, { valor: component.valorDeEntrada('10') });
        expect(component.buildPayload().cambios_mutacion).toEqual([{ campo: 'Correr', operacion: 'sumar', valor: 10 }]);
        component.actualizarCambioMutacion(correr.uid, { valor: component.valorDeEntrada('') });
        expect(component.cambiosMutacionRows[0].valor).toBeNull();

        // Otra operación sin valor lo quita.
        component.actualizarCambioMutacion(correr.uid, { valor: 10 });
        component.actualizarCambioMutacion(correr.uid, { operacion: 'maximo' });
        expect(component.cambiosMutacionRows[0].valor).toBeNull();
    });

    it('carga prioridades de alineamiento desde catalogo de servicio', () => {
        // La 0 «Sin prioridad» ya no viene del catálogo: es la opción del editor, sin descripción propia.
        expect(component.prioridadesAlineamiento).toEqual([
            { Id: 0, Nombre: 'Sin prioridad', Descripcion: '' },
            { Id: 1, Nombre: 'Debe tenerse en cuenta', Descripcion: 'Debe respetarse.' },
            { Id: 2, Nombre: 'Importante', Descripcion: 'Tendencia importante.' },
            { Id: 4, Nombre: 'Final', Descripcion: 'Marca interna.' },
        ]);
        expect(component.getPrioridadesAlineamientoVisibles().map((item) => item.Nombre)).toEqual([
            'Sin prioridad',
            'Debe tenerse en cuenta',
            'Importante',
        ]);
    });

    it('mantiene por id los listados de alineamiento y tamaños', () => {
        expect(component.tamanos.map((item) => item.Id)).toEqual([2, 3]);
        expect(component.alineamientos.map((item) => item.Id)).toEqual([0, 7, 9, 10]);
        expect(component.alineamientosBasicos.map((item) => item.Id)).toEqual([0, 2]);
        expect(component.preferenciasLey.map((item) => item.Id)).toEqual([0, 2, 10]);
        expect(component.preferenciasMoral.map((item) => item.Id)).toEqual([0, 4, 10]);
    });

    it('explica alineamiento con prioridades de catalogo', () => {
        const secciones = component.getAlineamientoInfoSecciones();
        const texto = JSON.stringify(secciones);

        expect(texto).toContain('Cada raza puede o no condicionar');
        expect(texto).toContain('Sin prioridad: No condiciona el alineamiento del personaje; sirve para razas sin tendencia propia.');
        expect(texto).toContain('Importante: Tendencia importante.');
        expect(texto).not.toContain('Final');
    });

    it('resuelve alineamiento principal desde alineamiento basico y prioridad', () => {
        component.form.patchValue({
            alineamiento_modo: 'basico',
            id_alineamiento_basico: 2,
            id_prioridad_alineamiento: 2,
        });

        expect(component.form.controls.id_alineamiento.value).toBe(10);
        expect(component.buildPayload().raza.id_alineamiento).toBe(10);
    });

    it('resuelve alineamiento principal desde preferencias legal, moral y prioridad', () => {
        component.form.patchValue({
            alineamiento_modo: 'preferencia',
            id_prioridad_alineamiento: 2,
            id_preferencia_ley: 2,
            id_preferencia_moral: 4,
        });

        expect(component.form.controls.id_alineamiento.value).toBe(9);
        expect(component.buildPayload().raza.id_alineamiento).toBe(9);
    });

    it('deja invalido el alineamiento si no existe combinacion', () => {
        component.form.patchValue({
            alineamiento_modo: 'preferencia',
            id_prioridad_alineamiento: 1,
            id_preferencia_ley: 2,
            id_preferencia_moral: 4,
        });

        expect(component.form.controls.id_alineamiento.value).toBe(-1);
        expect(component.form.controls.id_alineamiento.invalid).toBeTrue();
    });

    it('permite no aplica con sin prioridad como alineamiento canonico', () => {
        component.form.patchValue({
            alineamiento_modo: 'basico',
            id_alineamiento_basico: 0,
            id_prioridad_alineamiento: 0,
        });

        expect(component.form.controls.id_prioridad_alineamiento.valid).toBeTrue();
        expect(component.form.controls.id_alineamiento.value).toBe(0);
        expect(component.form.controls.id_alineamiento.valid).toBeTrue();
        expect(component.buildPayload().raza.id_alineamiento).toBe(0);
    });

    it('actualiza booleanos desde helpers de chips', () => {
        component.toggleBooleanControl('oficial');
        component.toggleBooleanControl('mutada');

        expect(component.form.controls.oficial.value).toBeFalse();
        expect(component.form.controls.mutada.value).toBeTrue();
        expect(component.form.controls.mutada.dirty).toBeTrue();

        component.toggleBooleanControl('mutada');
        expect(component.form.controls.mutada.value).toBeFalse();
    });

    it('bloquea dotes con extra requerido sin extra seleccionado', () => {
        component.dotes = [{
            Id: 30,
            Nombre: 'Competencia con arma',
            Extras_soportados: { Extra_arma: 1, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0 },
            Extras_disponibles: { Armas: [{ Id: 17, Nombre: 'Espada larga' }], Armaduras: [], Escuelas: [], Habilidades: [] },
        } as any];
        component.dotesRows = [{ uid: 'd', id_dote: 30, id_extra: 0 }];

        const error = (component as any).validarReglasDominio();

        expect(error).toContain('requiere extra');
    });

    it('usa extra seleccionado de habilidad base cuando la habilidad lo soporta', () => {
        component.habilidades = [{
            Id: 11,
            Id_habilidad: 11,
            Nombre: 'Artesania',
            Soporta_extra: true,
            Extras: [{ Id_extra: 77, Extra: 'Alquimia', Descripcion: '' }],
        } as any];
        component.habilidadesBaseRows = [{
            uid: 'a',
            id_habilidad: 11,
            cantidad: 2,
            id_extra: 77,
            varios: '',
        }];

        const payload = component.buildPayload();

        expect(payload.habilidades?.base).toEqual([{
            id_habilidad: 11,
            cantidad: 2,
            id_extra: 77,
            varios: 'No especifica',
        }]);
    });

    it('permite extra Elegir con id 0 en habilidades base con extra libre', () => {
        component.habilidades = [{
            Id: 31,
            Id_habilidad: 31,
            Nombre: 'Saber',
            Soporta_extra: true,
            Extras: [],
        } as any];
        component.habilidadesBaseRows = [{
            uid: 'a',
            id_habilidad: 31,
            cantidad: 1,
            id_extra: 0,
            varios: 'No especifica',
        }];

        const extras = component.getExtrasHabilidadBase(component.habilidadesBaseRows[0]);
        const payload = component.buildPayload();

        expect(extras).toContain(jasmine.objectContaining({ Id: 0, Nombre: 'Elegir' }));
        expect(payload.habilidades?.base).toEqual([{
            id_habilidad: 31,
            cantidad: 1,
            id_extra: 0,
            varios: 'No especifica',
        }]);
    });

    it('omite extra en habilidad base sin extras soportados', () => {
        component.habilidades = [{
            Id: 12,
            Id_habilidad: 12,
            Nombre: 'Avistar',
            Soporta_extra: false,
            Extras: [],
        } as any];
        component.habilidadesBaseRows = [{
            uid: 'a',
            id_habilidad: 12,
            cantidad: 2,
            id_extra: 77,
            varios: 'No especifica',
        }];

        const payload = component.buildPayload();

        expect(payload.habilidades?.base?.[0]).toEqual({
            id_habilidad: 12,
            cantidad: 2,
            varios: 'No especifica',
        });
    });

    it('filtra relaciones y excluye ids ya seleccionados', () => {
        component.idiomas = [
            { Id: 7, Nombre: 'Draconico' },
            { Id: 9, Nombre: 'Comun' },
        ] as any;
        component.idiomasSeleccionados = [9, 9];
        component.actualizarRelacionQuery('idiomasSeleccionados', 'dra');

        const opciones = component.getOpcionesRelacion('idiomasSeleccionados', component.idiomas);

        expect(opciones.map((item: any) => item.Id)).toEqual([7]);
        component.agregarSeleccion('idiomasSeleccionados', 7);
        component.agregarSeleccion('idiomasSeleccionados', 7);
        expect(component.idiomasSeleccionados).toEqual([7, 9]);
    });

    it('admite varios subtipos, como guarda la API (el haraknín tiene cinco)', () => {
        component.agregarSeleccion('subtiposSeleccionados', 8);
        component.agregarSeleccion('subtiposSeleccionados', 6);
        component.agregarSeleccion('subtiposSeleccionados', 8);

        expect(component.subtiposSeleccionados).toEqual([6, 8]);
        expect(component.getOpcionesRelacion('subtiposSeleccionados', component.subtipos)).toEqual([]);
        component.quitarSeleccion('subtiposSeleccionados', 8);
        expect(component.buildPayload().subtipos).toEqual([6]);
    });

    it('elige el manual con el buscador común y la clase predilecta, también «Cualquiera»', () => {
        expect(component.opcionesManuales).toEqual([{ id: 1, nombre: 'Manual base' }]);
        component.seleccionarManual(1);
        component.actualizarClasePredilectaBusqueda('gue');
        expect(component.form.controls.id_clase_predilecta.value).toBeNull();
        expect(component.form.controls.id_clase_predilecta.invalid).toBeTrue();
        component.seleccionarClasePredilecta(1);

        expect(component.clasePredilectaBusqueda).toBe('Guerrero');
        expect(component.displayClasePredilectaAutocomplete(1)).toBe('Guerrero');
        expect(component.buildPayload().raza.id_manual).toBe(1);
        expect(component.buildPayload().raza.id_clase_predilecta).toBe(1);

        // La 0 de la base: el humano y el semielfo no tienen una clase predilecta concreta.
        component.actualizarClasePredilectaBusqueda('cual');
        expect(component.getClasesPredilectasFiltradas().map((clase) => clase.Nombre)).toEqual(['Cualquiera']);
        component.seleccionarClasePredilecta(0);
        expect(component.form.controls.id_clase_predilecta.valid).toBeTrue();
        expect(component.clasePredilectaBusqueda).toBe('Cualquiera');
        expect(component.buildPayload().raza.id_clase_predilecta).toBe(0);
        expect(component.displayClasePredilectaAutocomplete(null)).toBe('');
    });

    it('ordena tipos de dado por id y filtra tipo criatura DG como autocomplete', () => {
        expect(component.tiposDado.map((item) => item.Id)).toEqual([22, 23]);

        component.form.patchValue({ dgs_extra: 1 });
        component.actualizarTipoCriaturaDgsBusqueda('gig');
        expect(component.form.controls.id_tipo_criatura_dgs.value).toBe(0);
        expect(component.getTiposCriaturaDgsFiltrados().map((item) => item.Nombre)).toEqual(['Gigante']);

        component.seleccionarTipoCriaturaDgs(4);

        expect(component.tipoCriaturaDgsBusqueda).toBe('Gigante');
        expect(component.buildPayload().raza.id_tipo_criatura_dgs).toBe(4);
    });

    it('solo exige y envia campos de DGS cuando hay DG extra', () => {
        component.form.patchValue({
            dgs_extra: 1,
            ataque_base: 2,
            dotes_dg: 1,
            puntos_hab: 4,
            puntos_hab_mult: 2,
            id_tipo_dado: 22,
            id_tipo_criatura_dgs: 3,
        });
        component.form.controls.dgs_extra.setValue(0);
        component.form.updateValueAndValidity();

        expect(component.tieneDgsExtra()).toBeFalse();
        expect(component.form.controls.id_tipo_dado.valid).toBeTrue();
        expect(component.form.controls.id_tipo_criatura_dgs.valid).toBeTrue();
        expect(component.buildPayload().raza).toEqual(jasmine.objectContaining({
            ataque_base: 0,
            dotes_dg: 0,
            puntos_hab: 0,
            puntos_hab_mult: 0,
            id_tipo_dado: 22,
            id_tipo_criatura_dgs: 3,
        }));

        component.form.patchValue({ dgs_extra: 1 });
        expect(component.tieneDgsExtra()).toBeTrue();
        expect(component.form.controls.id_tipo_dado.value).toBe(22);
        expect(component.form.controls.id_tipo_criatura_dgs.value).toBe(3);
        expect(component.buildPayload().raza).toEqual(jasmine.objectContaining({
            id_tipo_dado: 22,
            id_tipo_criatura_dgs: 3,
        }));
    });

    it('muestra informacion del tamaño seleccionado con modificadores', () => {
        component.form.patchValue({ id_tamano: 3 });

        const secciones = component.getTamanoInfoSecciones();
        const texto = JSON.stringify(secciones);

        expect(texto).toContain('Grande');
        expect(texto).toContain('Modificador de tamaño: -1.');
        expect(texto).toContain('Modificador de presa: +4.');
    });

    it('muestra informacion completa de la maniobrabilidad seleccionada', () => {
        component.form.patchValue({ volar: 40, id_maniobrabilidad: 21 });

        const secciones = component.getManiobrabilidadInfoSecciones();
        const texto = JSON.stringify(secciones);

        expect(texto).toContain('Media');
        expect(texto).toContain('Velocidad de avance: La mitad.');
        expect(texto).toContain('Volar atrás: Sí.');
        expect(texto).toContain('Giro maximo: 90 grados.');
    });

    it('oculta no vuela del selector visible y ordena maniobrabilidades por id', () => {
        // La API ya no lista la maniobrabilidad 0 «No vuela»: la pone el editor, con su id 0.
        expect(component.maniobrabilidades.map((item) => item.Id)).toEqual([0, 21, 22]);
        expect(component.maniobrabilidades[0].Nombre).toBe('No vuela');
        expect(component.getManiobrabilidadesVisibles().map((item) => item.Nombre)).toEqual(['Media', 'Buena']);

        component.form.controls.id_maniobrabilidad.setValue(0);
        component.form.controls.volar.setValue(40);

        expect(component.form.controls.id_maniobrabilidad.value).toBe(21);
    });

    it('ofrece sus propias opciones «sin X» con el id 0 que la API ya no lista, y son el valor por defecto', () => {
        expect(component.alineamientosBasicos[0]).toEqual(jasmine.objectContaining({ Id: 0, Nombre: 'No aplica' }));
        expect(component.preferenciasLey[0]).toEqual(jasmine.objectContaining({ Id: 0, Nombre: 'No aplica' }));
        expect(component.preferenciasMoral[0]).toEqual(jasmine.objectContaining({ Id: 0, Nombre: 'No aplica' }));
        expect(component.getPrioridadesAlineamientoVisibles().map((item) => item.Id)).toContain(0);

        expect(component.form.controls.id_alineamiento_basico.value).toBe(0);
        expect(component.form.controls.id_prioridad_alineamiento.value).toBe(0);
        // «No aplica» con «Sin prioridad» es la combinación 0, como cuando la API listaba esas filas.
        expect(component.form.controls.id_alineamiento.value).toBe(0);
    });

    it('sincroniza maniobrabilidad como no vuela cuando no hay velocidad de vuelo', () => {
        component.form.patchValue({ volar: 40, id_maniobrabilidad: 21 });
        expect(component.tieneVelocidadVuelo()).toBeTrue();

        component.form.patchValue({ volar: 0 });

        expect(component.tieneVelocidadVuelo()).toBeFalse();
        expect(component.form.controls.id_maniobrabilidad.value).toBe(0);
        expect(component.buildPayload().raza.id_maniobrabilidad).toBe(0);
    });

    it('valida rangos y orden de edades', () => {
        component.form.patchValue({
            altura_rango_inf: 1.9,
            altura_rango_sup: 1.5,
            edad_adulto: 30,
            edad_mediana: 20,
        });
        component.form.updateValueAndValidity();

        expect(component.form.errors?.['rangosInvalidos']).toBeTrue();
    });

    it('valida limites de cuerpo, edades y otros valores numericos', () => {
        component.form.patchValue({
            altura_rango_inf: -1,
            altura_rango_sup: 10.01,
            peso_rango_inf: -1,
            peso_rango_sup: 100000,
            edad_adulto: -1,
            ajuste_nivel: -1,
            dotes_extra: 11,
            puntos_extra_1: 21,
            puntos_extra: 21,
        });
        component.form.updateValueAndValidity();

        expect(component.form.controls.altura_rango_inf.invalid).toBeTrue();
        expect(component.form.controls.altura_rango_sup.invalid).toBeTrue();
        expect(component.form.controls.peso_rango_inf.invalid).toBeTrue();
        expect(component.form.controls.peso_rango_sup.invalid).toBeTrue();
        expect(component.form.controls.edad_adulto.invalid).toBeTrue();
        expect(component.form.controls.ajuste_nivel.invalid).toBeTrue();
        expect(component.form.controls.dotes_extra.invalid).toBeTrue();
        expect(component.form.controls.puntos_extra_1.invalid).toBeTrue();
        expect(component.form.controls.puntos_extra.invalid).toBeTrue();
    });

    it('conserva altura decimal en metros dentro del payload', () => {
        component.form.patchValue({
            altura_rango_inf: 1.52,
            altura_rango_sup: 1.87,
        });

        const payload = component.buildPayload();

        expect(payload.raza.altura_rango_inf).toBe(1.52);
        expect(payload.raza.altura_rango_sup).toBe(1.87);

        // Y los pesos con sus decimales (el elfo: de 38,5 a 61,2 kg).
        component.form.patchValue({ peso_rango_inf: 38.5, peso_rango_sup: 61.2 });
        expect(component.buildPayload().raza.peso_rango_inf).toBe(38.5);
        expect(component.buildPayload().raza.peso_rango_sup).toBe(61.2);
    });

    it('permite textos tecnicos vacios como no especifica y valida longitudes si se rellenan', () => {
        component.form.patchValue({
            ataques_naturales: '',
            reduccion_dano: '',
            resistencia_conjuros: '',
            resistencia_energia: '',
        });
        component.form.updateValueAndValidity();

        expect(component.form.controls.ataques_naturales.valid).toBeTrue();
        expect(component.form.controls.reduccion_dano.valid).toBeTrue();
        expect(component.buildPayload().raza.ataques_naturales).toBe('No especifica');
        expect(component.buildPayload().raza.reduccion_dano).toBe('No especifica');

        // Textos cortos de los manuales («14» de resistencia a conjuros) valen; el límite es el de la API.
        component.form.patchValue({ ataques_naturales: 'abc', resistencia_conjuros: '14', reduccion_dano: 'x'.repeat(1001) });
        component.form.updateValueAndValidity();

        expect(component.form.controls.ataques_naturales.valid).toBeTrue();
        expect(component.form.controls.resistencia_conjuros.valid).toBeTrue();
        expect(component.form.controls.reduccion_dano.invalid).toBeTrue();
    });

    it('deja a 0 las alturas, los pesos y las edades que el manual no da, como la API', () => {
        component.form.patchValue({
            altura_rango_inf: 0, altura_rango_sup: 0, peso_rango_inf: 0, peso_rango_sup: 0,
            edad_adulto: 0, edad_mediana: 200, edad_viejo: 300, edad_venerable: 400,
        });
        component.form.updateValueAndValidity();

        expect(component.form.valid).toBeTrue();
    });

    it('limita velocidades, espacio y alcance a rangos de creacion', () => {
        component.form.patchValue({
            correr: 201,
            nadar: 201,
            volar: 201,
            trepar: 201,
            excavar: 201,
            espacio: 41,
            alcance: 41,
        });
        component.form.updateValueAndValidity();

        expect(component.form.controls.correr.invalid).toBeTrue();
        expect(component.form.controls.nadar.invalid).toBeTrue();
        expect(component.form.controls.volar.invalid).toBeTrue();
        expect(component.form.controls.trepar.invalid).toBeTrue();
        expect(component.form.controls.excavar.invalid).toBeTrue();
        expect(component.form.controls.espacio.invalid).toBeTrue();
        expect(component.form.controls.alcance.invalid).toBeTrue();
    });

    it('muestra prompt y restaura borrador local al continuar', async () => {
        const uid = 'uid-restaura-raza';
        draftSvc.guardarBorradorLocal(uid, crearDraftContenido());
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await recrearComponenteConUid(uid);

        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
            icon: 'question',
            title: 'Borrador encontrado',
            confirmButtonText: 'Continuar borrador',
            denyButtonText: 'Empezar de cero',
        }));
        expect(component.pasoActivoIndex).toBe(3);
        expect(component.form.controls.nombre.value).toBe('Raza en borrador');
        expect(component.form.controls.mutada.value).toBeTrue();
        expect(component.subtiposSeleccionados).toEqual([8]);
        expect(component.idiomasSeleccionados).toEqual([9]);
        expect(component.habilidadesBaseRows[0].id_habilidad).toBe(11);
        expect(component.prerrequisitosMutacionSeleccionados).toEqual(['mutacion.tipo_criatura']);
        expect(component.cambiosMutacionRows.map((row) => [row.campo, row.operacion])).toEqual([['Tamano', 'heredar']]);
        expect(component.prerrequisitosMutacionRows[0].id).toBe(3);
    });

    it('descarta borrador y empieza de cero al rechazar restauracion', async () => {
        const uid = 'uid-reset-raza';
        draftSvc.guardarBorradorLocal(uid, crearDraftContenido());
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        await recrearComponenteConUid(uid);

        expect(draftSvc.leerBorradorLocal(uid)).toBeNull();
        expect(component.pasoActivoIndex).toBe(0);
        expect(component.form.controls.nombre.value).toBe('');
        expect(component.subtiposSeleccionados).toEqual([]);
        expect(component.prerrequisitosMutacionSeleccionados).toEqual([]);
    });

    it('no persiste un borrador con valores iniciales vacios', async () => {
        const uid = 'uid-vacio-raza';

        await recrearComponenteConUid(uid);
        (component as any).persistirBorradorLocalAhora();

        expect(draftSvc.leerBorradorLocal(uid)).toBeNull();
    });

    it('persiste borrador al cerrar o recargar', async () => {
        const uid = 'uid-cierre-raza';
        await recrearComponenteConUid(uid);
        component.form.patchValue({
            nombre: 'Raza persistida',
            descripcion: 'Descripción suficientemente larga para persistir',
        });
        component.pasoActivoIndex = 2;

        component.onBeforeUnload();

        const borrador = draftSvc.leerBorradorLocal(uid);
        expect(borrador?.formValue['nombre']).toBe('Raza persistida');
        expect(borrador?.selectedIndex).toBe(2);
    });

    it('persiste y restaura raciales pendientes de completar la raza en creación', async () => {
        const uid = 'uid-raciales-pendientes';
        await recrearComponenteConUid(uid);
        component.form.patchValue({
            nombre: 'Raza persistida',
            descripcion: 'Descripción suficientemente larga para persistir',
        });
        component.onRacialCreadoDesdeModal({
            idRacial: 41,
            nombre: 'Entrenamiento propio',
            racial: { Id: 41, Nombre: 'Entrenamiento propio', Prerrequisitos_flags: { raza: false }, Prerrequisitos: { raza: [] } } as any,
            prerrequisitoRazaEnCreacion: true,
        });

        component.onBeforeUnload();
        fixture.destroy();
        currentUid = uid;
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        fixture = TestBed.createComponent(NuevaRazaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await Promise.resolve();

        expect(component.tieneRacialesPendientesRazaEnCreacion()).toBeTrue();
    });

    it('completa prerrequisitos pendientes cuando la raza se crea', async () => {
        setFormularioValido();
        component.onRacialCreadoDesdeModal({
            idRacial: 41,
            nombre: 'Entrenamiento propio',
            racial: { Id: 41, Nombre: 'Entrenamiento propio', Prerrequisitos_flags: { raza: false }, Prerrequisitos: { raza: [] } } as any,
            prerrequisitoRazaEnCreacion: true,
        });
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.guardarRaza();

        expect(racialSvc.anadirPrerrequisitosRacial).toHaveBeenCalledWith(41, {
            raza: [{ id_raza: 99 }],
        });
        expect(component.tieneRacialesPendientesRazaEnCreacion()).toBeFalse();
    });

    it('hace log del payload antes de crear la raza', async () => {
        setFormularioValido();
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        const consoleSpy = spyOn(console, 'log');

        await component.guardarRaza();

        expect(consoleSpy).toHaveBeenCalledWith(
            '[NuevaRaza] Payload crear raza',
            razaSvc.crearRaza.calls.mostRecent().args[0]
        );
    });

    it('avisa al intentar salir si quedan raciales pendientes de completar', async () => {
        component.onRacialCreadoDesdeModal({
            idRacial: 41,
            nombre: 'Entrenamiento propio',
            racial: { Id: 41, Nombre: 'Entrenamiento propio', Prerrequisitos_flags: { raza: false }, Prerrequisitos: { raza: [] } } as any,
            prerrequisitoRazaEnCreacion: true,
        });
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        const puedeCerrar = await component.confirmarSalidaConRacialesPendientes();

        expect(puedeCerrar).toBeFalse();
        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
            title: 'Racial pendiente de completar',
        }));
    });

    it('limpia borrador tras crear raza correctamente', async () => {
        const uid = 'uid-creada-raza';
        await recrearComponenteConUid(uid);
        setFormularioValido();
        (component as any).persistirBorradorLocalAhora();
        expect(draftSvc.leerBorradorLocal(uid)).not.toBeNull();
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.guardarRaza();

        expect(draftSvc.leerBorradorLocal(uid)).toBeNull();
    });

    it('conserva borrador si falla la creacion de raza', async () => {
        const uid = 'uid-error-raza';
        await recrearComponenteConUid(uid);
        setFormularioValido();
        (component as any).persistirBorradorLocalAhora();
        razaSvc.crearRaza.and.rejectWith(new Error('Fallo backend'));
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.guardarRaza();

        expect(draftSvc.leerBorradorLocal(uid)).not.toBeNull();
    });

    it('usa mensaje de permisos y no llama al servicio cuando no puede crear', async () => {
        canCreate = false;
        (component as any).recalcularPermisos();
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.guardarRaza();

        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
            icon: 'warning',
            title: 'Permisos insuficientes',
            text: 'Sin permisos suficientes.',
        }));
        expect(razaSvc.crearRaza).not.toHaveBeenCalled();
    });

    describe('al modificar', () => {
        /** Una raza como la da `GET /razas/{id}` (con las referencias de «Modificar»), con los ids de los catálogos de prueba. */
        function razaDeLaApi(extra: Record<string, unknown> = {}): any {
            return {
                i: 24, n: 'Elfo', Descripcion: 'Los elfos viven en los bosques antiguos.', an: null, esp: 5, alc: 5,
                ma: 'Manual base, Página: 14', c: 'Guerrero', o: true,
                m: { Fuerza: 0, Destreza: 2, Constitucion: -2, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
                aju: 0, t: { Id: 2, Nombre: 'Mediano' }, man: null, tc: { Id: 3, Nombre: 'Humanoide' },
                ali: { Id: 9 }, va: 0, ant: 0, co: 30, na: 0, vo: 0, tr: 0, ex: 0,
                ari: '1.37', ars: '1.67', pri: '38.50', prs: '61.20', ea: 110, em: 250, ev: 400, eve: 700,
                rd: null, rc: '14', re: null, mu: 0, tmd: 0, pr: {},
                dg: { Cantidad: 0 },
                Dotes_adicionales: 0, Puntos_habilidad_extra_primer_nivel: 0, Puntos_habilidad_extra_por_nivel: 0, Cuadrupedo: false,
                Competencias: { Armas: [{ Id: 17, Nombre: 'Espada larga' }], Armaduras: [], Grupos_arma: [], Grupos_armadura: [] },
                Habilidades: {
                    Base: [{ Id_habilidad: 11, Habilidad: 'Avistar', Cantidad: 2, Id_extra: -1, Extra: '-', Varios: 'No especifica' }],
                    Custom: [],
                },
                Idiomas: [{ Id: 9, Nombre: 'Comun' }, { Id: 7, Nombre: 'Draconico' }],
                subtipos: [{ Id: 8, Nombre: 'Humano' }, { Id: 6, Nombre: 'Dragon' }],
                dotes: [{ Dote: { Id: 14, Nombre: 'Alerta' }, Contexto: { Entidad: 'raza', Id_raza: 24, Id_extra: 0, Extra: 'No aplica' } }],
                rac: [{ Id: 15, Nombre: 'Vision en la penumbra', Opcional: 0 }],
                sor: [{ Conjuro: { Id: 16, Nombre: 'Luz' }, Nivel_lanzador: '1', Usos_diarios: '1/día', Descripcion: 'No especifica' }],
                Lanzamiento: null, Categorias_edad: [], Pasos_edad: [],
                Manual: { Id: 1, Nombre: 'Manual base', Pagina: 14 },
                Clase_predilecta: { Id: 1, Nombre: 'Guerrero' },
                Dgs_raciales: {
                    Cantidad: 0, Id_dado: 0, Id_tipo_criatura: 0, Ataque_base: 0, Fortaleza: 0, Reflejos: 0, Voluntad: 0,
                    Dotes_extra: 0, Puntos_habilidad: 0, Multiplicador_puntos_habilidad: 0,
                },
                ...extra,
            };
        }

        async function crearEnModificar(raw: any): Promise<void> {
            fixture.destroy();
            currentUid = 'uid-modificar';
            razaSvc.getRazaFresca.and.returnValue(of(normalizeRazaApi(raw)));
            fixture = TestBed.createComponent(NuevaRazaComponent);
            component = fixture.componentInstance;
            component.modo = 'editar';
            component.idRaza = Number(raw.i);
            component.editorTabKey = `edicion:raza:${raw.i}`;
            fixture.detectChanges();
            await Promise.resolve();
            await Promise.resolve();
        }

        it('sin DG raciales, las salvaciones y el ataque base van a 0 y no se editan; con DG, sí', async () => {
            // Una raza aún con el +1 del mediano en las salvaciones de DG (antes de razas_mediano_suerte.sql).
            await crearEnModificar(razaDeLaApi({
                Dgs_raciales: {
                    Cantidad: 0, Id_dado: 0, Id_tipo_criatura: 0, Ataque_base: 1, Fortaleza: 1, Reflejos: 1, Voluntad: 1,
                    Dotes_extra: 0, Puntos_habilidad: 0, Multiplicador_puntos_habilidad: 0,
                },
            }));
            expect(component.form.controls.fortaleza.disabled).toBeTrue();
            expect(component.form.controls.voluntad.disabled).toBeTrue();
            expect(component.buildPayload().raza).toEqual(jasmine.objectContaining({ dgs_extra: 0, ataque_base: 0, fortaleza: 0, reflejos: 0, voluntad: 0 }));

            component.form.controls.dgs_extra.setValue(2);
            expect(component.form.controls.fortaleza.enabled).toBeTrue();
            component.form.patchValue({ fortaleza: 3 });
            expect(component.buildPayload().raza.fortaleza).toBe(3);
        });

        it('admite pesos de más de 999,99 (el centauro de Races of the Wild)', async () => {
            await crearEnModificar(razaDeLaApi());
            component.form.patchValue({ peso_rango_sup: 1060.52 });
            expect(component.form.controls.peso_rango_sup.valid).toBeTrue();
            component.form.patchValue({ peso_rango_sup: 100000 });
            expect(component.form.controls.peso_rango_sup.valid).toBeFalse();
        });

        it('rellena la pantalla con su GET y, sin tocar nada, manda lo mismo que llegó', async () => {
            await crearEnModificar(razaDeLaApi());

            expect(razaSvc.getRazaFresca).toHaveBeenCalledWith(24);
            expect(component.edicion.hayCambios).toBeFalse();
            expect(component.edicion.textoAccion(false)).toBe('Guardar cambios');
            expect(component.edicion.textoAccion(true)).toBe('Guardando cambios…');
            expect(component.form.valid).toBeTrue();
            const payload = component.buildPayload();
            expect(payload.raza).toEqual(jasmine.objectContaining({
                nombre: 'Elfo', id_manual: 1, pagina: 14, id_clase_predilecta: 1, id_tamano: 2, id_tipo_criatura: 3,
                mod_des: 2, mod_cons: -2, altura_rango_inf: 1.37, peso_rango_inf: 38.5, peso_rango_sup: 61.2, edad_venerable: 700,
                ataques_naturales: 'No especifica', resistencia_conjuros: '14', id_alineamiento: 9,
                // Sin DG raciales, los que guardaba (los tipos 0) y las salvaciones de DG a 0.
                dgs_extra: 0, fortaleza: 0, reflejos: 0, voluntad: 0, id_tipo_dado: 0, id_tipo_criatura_dgs: 0,
                cuadrupedo: false, id_clase_lanzamiento: null, nivel_lanzamiento: 0,
            }));
            expect(payload.subtipos).toEqual([6, 8]);
            expect(payload.idiomas).toEqual([7, 9]);
            expect(payload.competencias?.armas).toEqual([17]);
            // -1: sin extra; no se manda y la API guarda -1, como estaba.
            expect(payload.habilidades?.base).toEqual([{ id_habilidad: 11, cantidad: 2, varios: 'No especifica' }]);
            expect(payload.dotes).toEqual([{ id_dote: 14 }]);
            expect(payload.raciales).toEqual([{ id_racial: 15, opcional: 0 }]);
            expect(payload.sortilegios).toEqual([{ id_conjuro: 16, nivel_lanzador: 1, usos_diarios: '1/día', descripcion: 'No especifica' }]);
            expect(payload.lanzamiento_listas).toEqual([]);

            component.form.patchValue({ nombre: 'Elfo gris' });
            expect(component.edicion.hayCambios).toBeTrue();
        });

        it('no ofrece ni guarda el borrador de «Nueva raza»', async () => {
            draftSvc.guardarBorradorLocal('uid-modificar', crearDraftContenido());
            const fire = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

            await crearEnModificar(razaDeLaApi());
            component.form.patchValue({ nombre: 'Elfo gris' });
            component.onBeforeUnload();

            expect(fire).not.toHaveBeenCalled();
            expect(component.form.controls.nombre.value).toBe('Elfo gris');
            expect(draftSvc.leerBorradorLocal('uid-modificar')?.formValue['nombre']).toBe('Raza en borrador');
        });

        it('guarda con PUT, avisa, emite la raza nueva y cierra', async () => {
            await crearEnModificar(razaDeLaApi());
            const guardada = normalizeRazaApi(razaDeLaApi({ n: 'Elfo gris' }));
            razaSvc.actualizarRaza.and.resolveTo({ message: 'Raza actualizada exitosamente', idRaza: 24, raza: guardada });
            const fire = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
            const emitidas: any[] = [];
            let cerrada = false;
            component.razaActualizada.subscribe((raza) => emitidas.push(raza));
            component.cerrar.subscribe(() => cerrada = true);
            component.form.patchValue({ nombre: 'Elfo gris' });

            await component.guardarRaza();

            expect(razaSvc.actualizarRaza).toHaveBeenCalledWith(24, jasmine.objectContaining({
                raza: jasmine.objectContaining({ nombre: 'Elfo gris' }),
            }));
            expect(razaSvc.crearRaza).not.toHaveBeenCalled();
            expect(fire).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Raza actualizada', text: 'Raza actualizada exitosamente' }));
            expect(emitidas).toEqual([guardada]);
            expect(cerrada).toBeTrue();
            expect(component.edicion.hayCambios).toBeFalse();
        });

        it('un error de la API con su campo va al marco y al paso del campo', async () => {
            await crearEnModificar(razaDeLaApi());
            razaSvc.actualizarRaza.and.rejectWith(new ProfileApiError('Ya existe una raza con ese nombre.', 'nombre_duplicado', 409, 'raza.nombre'));
            component.pasoActivoIndex = 3;

            await component.guardarRaza();

            expect(component.errores.global).toBe('Ya existe una raza con ese nombre.');
            expect(component.errores.campo?.campo).toBe('nombre');
            expect(component.pasoActivoIndex).toBe(0);
            expect(component.form.controls.nombre.hasError('api')).toBeTrue();
        });

        it('el VD de sus PNJ: lo carga de su GET y, sin tocar nada, manda lo mismo', async () => {
            await crearEnModificar(razaDeLaApi({
                n: 'Ogro', dg: { Cantidad: 4 },
                Dgs_raciales: {
                    Cantidad: 4, Id_dado: 22, Id_tipo_criatura: 4, Ataque_base: 3, Fortaleza: 4, Reflejos: 1, Voluntad: 1,
                    Dotes_extra: 2, Puntos_habilidad: 2, Multiplicador_puntos_habilidad: 7,
                },
                Vd: 3, Vd_mod_clases_pj: null, Vd_mod_clases_pnj: null, Clases_asociadas: [{ Id: 1, Nombre: 'Guerrero' }],
            }));

            expect(component.edicion.hayCambios).toBeFalse();
            expect(component.form.valid).toBeTrue();
            expect(component.form.controls.vd.value).toBe(3);
            expect(component.clasesAsociadas).toEqual([{ id: 1, nombre: 'Guerrero' }]);
            const payload = component.buildPayload();
            expect(payload.raza).toEqual(jasmine.objectContaining({ vd: 3, vd_mod_clases_pj: null, vd_mod_clases_pnj: null }));
            expect(payload.clases_asociadas).toEqual([1]);

            component.quitarDe('clases_asociadas', { id: 1 });
            expect(component.edicion.hayCambios).toBeTrue();
            expect(component.buildPayload().clases_asociadas).toEqual([]);
        });

        it('los idiomas adicionales: carga la lista de su GET y, sin tocar nada, manda lo mismo', async () => {
            await crearEnModificar(razaDeLaApi({
                n: 'Enano', Idiomas_adicionales_cualquiera: false,
                Idiomas_adicionales: [{ Id: 9, Nombre: 'Comun', Secreto: false, Oficial: true }, { Id: 7, Nombre: 'Draconico', Secreto: false, Oficial: true }],
            }));

            expect(component.edicion.hayCambios).toBeFalse();
            expect(component.idiomasAdicionalesCualquiera).toBeFalse();
            expect(component.idiomasAdicionales).toEqual([{ id: 9, nombre: 'Comun' }, { id: 7, nombre: 'Draconico' }]);
            const payload = component.buildPayload();
            expect(payload.raza.idiomas_adicionales_cualquiera).toBeFalse();
            expect(payload.idiomas_adicionales).toEqual([7, 9]);

            component.quitarDe('idiomas_adicionales', { id: 7 });
            expect(component.edicion.hayCambios).toBeTrue();
            expect(component.buildPayload().idiomas_adicionales).toEqual([9]);
        });

        it('una raza con «cualquier idioma» (o sin el dato) la carga así y manda la lista vacía', async () => {
            await crearEnModificar(razaDeLaApi({ Idiomas_adicionales_cualquiera: true, Idiomas_adicionales: [] }));

            expect(component.edicion.hayCambios).toBeFalse();
            expect(component.idiomasAdicionalesCualquiera).toBeTrue();
            expect(component.buildPayload().idiomas_adicionales).toEqual([]);

            component.toggleBooleanControl('idiomas_adicionales_cualquiera');
            expect(component.edicion.hayCambios).toBeTrue();
            expect(component.buildPayload().raza.idiomas_adicionales_cualquiera).toBeFalse();
        });

        it('un error de la API en los idiomas adicionales va a su lista y al paso «Idiomas»', async () => {
            await crearEnModificar(razaDeLaApi({ Idiomas_adicionales_cualquiera: false, Idiomas_adicionales: [{ Id: 9, Nombre: 'Comun' }] }));
            razaSvc.actualizarRaza.and.rejectWith(new ProfileApiError('No se ha encontrado el idioma adicional.', 'no_encontrado', 404, 'idiomas_adicionales[0]'));
            component.form.patchValue({ nombre: 'Enano de las colinas' });
            component.pasoActivoIndex = 4;

            await component.guardarRaza();

            expect(component.pasoActivoIndex).toBe(2);
            expect(component.errores.mensajeDe('idiomas_adicionales')).toBe('No se ha encontrado el idioma adicional.');

            // El error se queda en la lista hasta que cambia (como el de las clases asociadas).
            expect(component.form.controls.idiomas_adicionales.hasError('api')).toBeTrue();
            component.quitarDe('idiomas_adicionales', { id: 9 });
            expect(component.form.controls.idiomas_adicionales.hasError('api')).toBeFalse();

            razaSvc.actualizarRaza.and.rejectWith(new ProfileApiError("'raza.idiomas_adicionales_cualquiera' debe ser booleano.", 'peticion_no_valida', 400, 'raza.idiomas_adicionales_cualquiera'));
            component.pasoActivoIndex = 0;
            await component.guardarRaza();

            expect(component.errores.campo?.campo).toBe('idiomas_adicionales_cualquiera');
            expect(component.pasoActivoIndex).toBe(2);
        });

        it('sin DG raciales carga los ajustes por clases y no manda el VD ni las asociadas (la API conserva lo que haya)', async () => {
            await crearEnModificar(razaDeLaApi({
                n: 'Drow', Vd: 1, Vd_mod_clases_pj: 1, Vd_mod_clases_pnj: 0, Clases_asociadas: [{ Id: 1, Nombre: 'Guerrero' }],
            }));

            expect(component.edicion.hayCambios).toBeFalse();
            const payload = component.buildPayload();
            expect(payload.raza).toEqual(jasmine.objectContaining({ vd_mod_clases_pj: 1, vd_mod_clases_pnj: 0 }));
            expect('vd' in payload.raza).toBeFalse();
            expect('clases_asociadas' in payload).toBeFalse();
        });

        it('un error de la API en el VD o en las clases asociadas va a su campo y al paso «Valores»', async () => {
            await crearEnModificar(razaDeLaApi({
                dg: { Cantidad: 2 },
                Dgs_raciales: {
                    Cantidad: 2, Id_dado: 22, Id_tipo_criatura: 3, Ataque_base: 1, Fortaleza: 0, Reflejos: 3, Voluntad: 0,
                    Dotes_extra: 1, Puntos_habilidad: 2, Multiplicador_puntos_habilidad: 5,
                },
                Vd: 1,
            }));
            razaSvc.actualizarRaza.and.rejectWith(new ProfileApiError("'raza.vd' debe ser mayor que 0 (o null, sin dato).", 'peticion_no_valida', 400, 'raza.vd'));
            component.form.patchValue({ nombre: 'Elfo de las cuevas' });
            component.pasoActivoIndex = 4;

            await component.guardarRaza();

            expect(component.errores.campo?.campo).toBe('vd');
            expect(component.pasoActivoIndex).toBe(1);
            expect(component.form.controls.vd.hasError('api')).toBeTrue();

            razaSvc.actualizarRaza.and.rejectWith(new ProfileApiError('La clase asociada no existe.', 'no_encontrado', 404, 'clases_asociadas'));
            component.form.patchValue({ vd: 2 });
            component.pasoActivoIndex = 0;
            await component.guardarRaza();

            expect(component.pasoActivoIndex).toBe(1);
            expect(component.errores.mensajeDe('clases_asociadas')).toBe('La clase asociada no existe.');
        });

        /** Una categoría de edad como la da la API (cría del dragón azul, *Manual de monstruos 1*). */
        function categoriaApi(extra: Record<string, unknown> = {}): any {
            return {
                Orden: 1, Categoria: { Id: 1, Nombre: 'Cría' }, Edad_desde: 0, Edad_hasta: 5, Tamano: { Id: 3, Nombre: 'Grande' },
                Espacio: 5, Alcance: 5, Dgs: 6, Ajuste_nivel: 4, Vd: 3,
                Caracteristicas: { Fuerza: 17, Destreza: 10, Constitucion: 15, Inteligencia: 10, Sabiduria: 11, Carisma: 10 },
                Modificadores: { Fuerza: 6, Destreza: 0, Constitucion: 4, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
                Armadura_natural: 6, Velocidades: { Correr: 40, Nadar: 0, Volar: 100, Trepar: 0, Excavar: 20 },
                Maniobrabilidad: { Id: 21, Nombre: 'Media' }, Ataques_naturales: 'Mordisco 1d8, 2 garras 1d6', Rd: null, Rc: null,
                Re: 'Inmunidad a la electricidad', Nivel_lanzamiento: 0, Nivel_lanzador_sortilegas: 1,
                Raciales: [{ Id: 15, Nombre: 'Vision en la penumbra', Valor: "Línea de 60' (2d8)", Caracteristica_cd: null }],
                Sortilegas: [{ Conjuro: { Id: 16, Nombre: 'Luz' }, Usos_diarios: '3/día', Descripcion: '' }],
                ...extra,
            };
        }

        it('en una raza por edades carga sus edades para editarlas y, sin tocar nada, manda las mismas con sus pasos', async () => {
            await crearEnModificar(razaDeLaApi({
                n: 'Dragón azul',
                dg: { Cantidad: 6 },
                Dgs_raciales: {
                    Cantidad: 6, Id_dado: 22, Id_tipo_criatura: 4, Ataque_base: 6, Fortaleza: 5, Reflejos: 5, Voluntad: 5,
                    Dotes_extra: 3, Puntos_habilidad: 9, Multiplicador_puntos_habilidad: 6,
                },
                Lanzamiento: {
                    Clase: { Id: 1, Nombre: 'Guerrero' }, Nivel: 0,
                    Listas: [{ Tipo: 'dominio', Id: 2, Nombre: 'Aire' }, { Tipo: 'clase', Id: 1, Nombre: 'Guerrero' }],
                },
                Categorias_edad: [
                    categoriaApi(),
                    categoriaApi({
                        Orden: 2, Categoria: { Id: 12, Nombre: 'Gran sierpe' }, Edad_desde: 1201, Edad_hasta: null, Dgs: 39,
                        Ajuste_nivel: null, Vd: 25, Nivel_lanzamiento: 19, Rd: '20/mágica', Rc: '29',
                        Caracteristicas: { Fuerza: 45, Destreza: 10, Constitucion: 31, Inteligencia: 24, Sabiduria: 25, Carisma: null },
                        Raciales: [], Sortilegas: [],
                    }),
                ],
                Pasos_edad: [
                    { Id: 3002, Edad: 3, Categoria: { Id: 1, Nombre: 'Cría' }, Orden: 1, Dgs: 7, Ajuste_nivel: 4, Armadura_natural: 7 },
                    { Id: 3001, Edad: 0, Categoria: { Id: 1, Nombre: 'Cría' }, Orden: 1, Dgs: 6, Ajuste_nivel: 4, Armadura_natural: 6 },
                    { Id: 3003, Edad: 1201, Categoria: { Id: 12, Nombre: 'Gran sierpe' }, Orden: 2, Dgs: 39, Ajuste_nivel: null, Armadura_natural: 39 },
                ],
            }));

            expect(component.porEdades).toBeTrue();
            expect(component.esRazaPorEdades).toBeTrue();
            expect(component.edades.categorias.map((fila) => fila.id_categoria_edad)).toEqual([1, 12]);
            expect(component.edicion.hayCambios).toBeFalse();
            const payload = component.buildPayload();
            expect(payload.raza).toEqual(jasmine.objectContaining({ id_clase_lanzamiento: 1, nivel_lanzamiento: 0, dgs_extra: 6 }));
            expect(payload.lanzamiento_listas).toEqual([{ id_dominio: 2 }, { id_clase: 1 }]);
            expect(component.nombreListaLanzamiento({ tipo: 'dominio', id: 2 })).toBe('Dominio de Aire');
            expect(payload.categorias_edad?.[0]).toEqual({
                id_categoria_edad: 1, edad_desde: 0, edad_hasta: 5, id_tamano: 3, espacio: 5, alcance: 5, dgs: 6, ajuste_nivel: 4,
                vd: 3, fuerza: 17, destreza: 10, constitucion: 15, inteligencia: 10, sabiduria: 11, carisma: 10,
                armadura_natural: 6, correr: 40, nadar: 0, volar: 100, trepar: 0, excavar: 20, id_maniobrabilidad: 21,
                ataques_naturales: 'Mordisco 1d8, 2 garras 1d6', reduccion_dano: null, resistencia_conjuros: null,
                resistencia_energia: 'Inmunidad a la electricidad', nivel_lanzamiento: 0, nivel_lanzador_sortilegas: 1,
                raciales: [{ id_racial: 15, valor: "Línea de 60' (2d8)" }],
                sortilegas: [{ id_conjuro: 16, usos_diarios: '3/día', descripcion: '' }],
            });
            // La puntuación «—» (null) va como 0; sin tope, `null`.
            expect(payload.categorias_edad?.[1]).toEqual(jasmine.objectContaining({ edad_hasta: null, ajuste_nivel: null, carisma: 0 }));
            expect(payload.categorias_edad?.[1]).toEqual(jasmine.objectContaining({ reduccion_dano: '20/mágica', resistencia_conjuros: '29', nivel_lanzamiento: 19 }));
            // Los pasos, por edad y con su id: la API los conserva (los personajes apuntan a ellos).
            expect(payload.pasos_edad).toEqual([
                { id: 3001, edad: 0, id_categoria_edad: 1, dgs: 6, ajuste_nivel: 4, armadura_natural: 6 },
                { id: 3002, edad: 3, id_categoria_edad: 1, dgs: 7, ajuste_nivel: 4, armadura_natural: 7 },
                { id: 3003, edad: 1201, id_categoria_edad: 12, dgs: 39, ajuste_nivel: null, armadura_natural: 39 },
            ]);

            component.edades.pasos[1].dgs = 8;
            expect(component.edicion.hayCambios).toBeTrue();
        });

        it('apagar «crece por edades» manda la raza sin edades', async () => {
            await crearEnModificar(razaDeLaApi({
                dg: { Cantidad: 6 },
                Categorias_edad: [categoriaApi()],
                Pasos_edad: [{ Id: 3001, Edad: 0, Categoria: { Id: 1, Nombre: 'Cría' }, Orden: 1, Dgs: 6, Ajuste_nivel: 4, Armadura_natural: 6 }],
            }));

            component.alternarPorEdades(false);

            const payload = component.buildPayload();
            expect(payload.categorias_edad).toEqual([]);
            expect(payload.pasos_edad).toEqual([]);
            expect(component.edicion.hayCambios).toBeTrue();
        });

        it('un error de la API en las edades va al paso «Edades»', async () => {
            await crearEnModificar(razaDeLaApi());
            razaSvc.actualizarRaza.and.rejectWith(new ProfileApiError(
                'No se puede quitar la edad de 0 años: la usa 1 personaje.', 'paso_edad_en_uso', 409, 'pasos_edad'));
            component.form.patchValue({ nombre: 'Elfo gris' });

            await component.guardarRaza();

            expect(component.pasoActivoIndex).toBe(4);
            expect(component.errorDeEdades).toBe('No se puede quitar la edad de 0 años: la usa 1 personaje.');
        });

        it('acepta los raciales que piden esta misma raza', async () => {
            await crearEnModificar(razaDeLaApi());
            const propio = { Id: 41, Nombre: 'Entrenamiento élfico', Prerrequisitos_flags: { raza: true }, Prerrequisitos: { raza: [{ Id_raza: 24 }] } } as any;
            const ajeno = { Id: 42, Nombre: 'Furia enana', Prerrequisitos_flags: { raza: true }, Prerrequisitos: { raza: [{ Id_raza: 3 }] } } as any;
            component.raciales = [propio, ajeno];

            expect(component.getRacialesCompatibles().map((racial) => racial.Id)).toEqual([41]);
        });
    });

    it('el lanzamiento racial de una raza nueva: la clase, su nivel y sus listas', () => {
        expect(component.buildPayload().raza).toEqual(jasmine.objectContaining({ id_clase_lanzamiento: null, nivel_lanzamiento: 0 }));

        component.seleccionarClaseLanzamiento(1);
        component.form.patchValue({ nivel_lanzamiento: 7 });
        component.agregarListaLanzamiento('dominio', 20);
        component.agregarListaLanzamiento('dominio', 20);
        component.agregarListaLanzamiento('clase', 1);
        expect(component.idsListasLanzamiento('dominio')).toEqual([20]);
        let payload = component.buildPayload();
        expect(payload.raza).toEqual(jasmine.objectContaining({ id_clase_lanzamiento: 1, nivel_lanzamiento: 7 }));
        expect(payload.lanzamiento_listas).toEqual([{ id_dominio: 20 }, { id_clase: 1 }]);

        component.quitarListaLanzamiento({ tipo: 'dominio', id: 20 });
        expect(component.buildPayload().lanzamiento_listas).toEqual([{ id_clase: 1 }]);
        component.quitarLanzamiento();
        payload = component.buildPayload();
        expect(payload.raza).toEqual(jasmine.objectContaining({ id_clase_lanzamiento: null, nivel_lanzamiento: 0 }));
        expect(payload.lanzamiento_listas).toEqual([]);
    });

    it('manda si la raza carga como un cuadrúpedo', () => {
        component.toggleBooleanControl('cuadrupedo');
        expect(component.buildPayload().raza.cuadrupedo).toBeTrue();
    });

    describe('los idiomas adicionales por Inteligencia (una raza nueva)', () => {
        it('empieza con «cualquier idioma» y la lista vacía, como el humano', () => {
            const payload = component.buildPayload();
            expect(payload.raza.idiomas_adicionales_cualquiera).toBeTrue();
            expect(payload.idiomas_adicionales).toEqual([]);
            // Las opciones salen del catálogo de idiomas.
            expect(component.opcionesIdiomas.map((opcion) => opcion.id).sort()).toEqual([7, 9]);
        });

        it('sin «cualquiera» manda la lista elegida, sin repetir y ordenada; con él, la lista no se manda pero se queda', () => {
            component.toggleBooleanControl('idiomas_adicionales_cualquiera');
            component.anadirA('idiomas_adicionales', 9);
            component.anadirA('idiomas_adicionales', 7);
            component.anadirA('idiomas_adicionales', 9);

            expect(component.idiomasAdicionales).toEqual([{ id: 9, nombre: 'Comun' }, { id: 7, nombre: 'Draconico' }]);
            let payload = component.buildPayload();
            expect(payload.raza.idiomas_adicionales_cualquiera).toBeFalse();
            expect(payload.idiomas_adicionales).toEqual([7, 9]);

            component.toggleBooleanControl('idiomas_adicionales_cualquiera');
            payload = component.buildPayload();
            expect(payload.raza.idiomas_adicionales_cualquiera).toBeTrue();
            expect(payload.idiomas_adicionales).toEqual([]);
            expect(component.idiomasAdicionales.length).toBe(2);

            component.toggleBooleanControl('idiomas_adicionales_cualquiera');
            component.quitarDe('idiomas_adicionales', { id: 9 });
            expect(component.buildPayload().idiomas_adicionales).toEqual([7]);
        });
    });

    describe('el VD de sus PNJ (una raza nueva)', () => {
        it('sin DG raciales no manda el VD de la raza ni sus clases asociadas, y los ajustes vacíos van a null', () => {
            component.form.patchValue({ vd: 3, clases_asociadas: [{ id: 1, nombre: 'Guerrero' }] });
            component.form.controls.dgs_extra.setValue(0);

            const payload = component.buildPayload();
            expect('vd' in payload.raza).toBeFalse();
            expect('clases_asociadas' in payload).toBeFalse();
            expect(payload.raza).toEqual(jasmine.objectContaining({ vd_mod_clases_pj: null, vd_mod_clases_pnj: null }));
            // Escondido, el VD no impide guardar aunque no valga.
            component.form.patchValue({ vd: -2 });
            expect(component.form.controls.vd.valid).toBeTrue();
        });

        it('en una raza por edades no pide ni manda el VD de la raza: cuenta el de cada categoría', () => {
            component.form.controls.dgs_extra.setValue(4);
            component.form.patchValue({ vd: 3 });
            expect(component.pideVdDeRaza()).toBeTrue();
            expect(component.buildPayload().raza).toEqual(jasmine.objectContaining({ vd: 3 }));

            component.alternarPorEdades(true);
            expect(component.pideVdDeRaza()).toBeFalse();
            expect('vd' in component.buildPayload().raza).toBeFalse();
            // Escondido, no impide guardar aunque no valga.
            component.form.patchValue({ vd: -2 });
            expect(component.form.controls.vd.valid).toBeTrue();
        });

        it('manda los ajustes por clases de PJ y de PNJ, enteros, también sin DG raciales (el drow, +1 y 0)', () => {
            component.form.patchValue({ vd_mod_clases_pj: 1, vd_mod_clases_pnj: 0 });
            expect(component.buildPayload().raza).toEqual(jasmine.objectContaining({ vd_mod_clases_pj: 1, vd_mod_clases_pnj: 0 }));

            component.form.patchValue({ vd_mod_clases_pj: null, vd_mod_clases_pnj: -3 });
            expect(component.buildPayload().raza).toEqual(jasmine.objectContaining({ vd_mod_clases_pj: null, vd_mod_clases_pnj: -3 }));

            component.form.patchValue({ vd_mod_clases_pnj: 1.5 });
            expect(component.form.controls.vd_mod_clases_pnj.hasError('entero')).toBeTrue();
            expect(component.form.valid).toBeFalse();

            // De −10 a +10, como la API.
            component.form.patchValue({ vd_mod_clases_pnj: -10, vd_mod_clases_pj: 11 });
            expect(component.form.controls.vd_mod_clases_pnj.valid).toBeTrue();
            expect(component.form.controls.vd_mod_clases_pj.hasError('max')).toBeTrue();
            component.form.patchValue({ vd_mod_clases_pj: -11 });
            expect(component.form.controls.vd_mod_clases_pj.hasError('min')).toBeTrue();
        });

        it('con DG raciales manda el VD de la raza (mayor que 0, hasta 999,99; vacío, sin dato) y sus clases asociadas', () => {
            component.form.patchValue({ dgs_extra: 4, id_tipo_dado: 22, id_tipo_criatura_dgs: 3 });
            let payload = component.buildPayload();
            expect(payload.raza.vd).toBeNull();
            expect(payload.clases_asociadas).toEqual([]);

            component.form.patchValue({ vd: 0.5 });
            expect(component.form.controls.vd.valid).toBeTrue();
            expect(component.buildPayload().raza.vd).toBe(0.5);
            component.form.patchValue({ vd: 2.456 });
            expect(component.buildPayload().raza.vd).toBe(2.46);
            [0, -1, 1000].forEach((vd) => {
                component.form.patchValue({ vd });
                expect(component.form.controls.vd.hasError('vdDeRaza')).withContext(`${vd}`).toBeTrue();
            });
            component.form.patchValue({ vd: 999.99 });
            expect(component.form.controls.vd.valid).toBeTrue();
            component.form.patchValue({ vd: 3 });

            component.anadirA('clases_asociadas', 1);
            component.anadirA('clases_asociadas', 1);
            component.anadirA('clases_asociadas', 404);
            expect(component.clasesAsociadas).toEqual([{ id: 1, nombre: 'Guerrero' }]);
            payload = component.buildPayload();
            expect(payload.raza.vd).toBe(3);
            expect(payload.clases_asociadas).toEqual([1]);

            component.quitarDe('clases_asociadas', { id: 1 });
            expect(component.buildPayload().clases_asociadas).toEqual([]);
        });

        it('no ofrece como asociadas las clases de PNJ (`Clase_pnj`), que nunca lo son', async () => {
            const claseSvc = TestBed.inject(ClaseService) as any;
            claseSvc.getClases = () => of([
                { Id: 1, Nombre: 'Guerrero' },
                { Id: 2, Nombre: 'Combatiente', Clase_pnj: true },
                { Id: 3, Nombre: 'Hechicero', Clase_pnj: false },
            ]);
            await recrearComponenteConUid('');

            expect(component.opcionesClasesAsociadas.map((opcion) => opcion.nombre)).toEqual(['Guerrero', 'Hechicero']);
            expect(component.opcionesClasesLanzamiento.map((opcion) => opcion.nombre)).toContain('Combatiente');
        });

        it('las otras clases predilectas y la multiclase libre (solo las clases con restricción de multiclase)', async () => {
            const claseSvc = TestBed.inject(ClaseService) as any;
            claseSvc.getClases = () => of([
                { Id: 7, Nombre: 'Guerrero' },
                { Id: 11, Nombre: 'Paladín', Multiclase_restringida: true },
                { Id: 10, Nombre: 'Monje', Multiclase_restringida: true },
            ]);
            await recrearComponenteConUid('');

            expect(component.opcionesClasesMulticlaseLibre.map((opcion) => opcion.nombre)).toEqual(jasmine.arrayWithExactContents(['Monje', 'Paladín']));
            expect(component.opcionesClasesPredilectasExtra.map((opcion) => opcion.nombre))
                .toEqual(jasmine.arrayWithExactContents(['Guerrero', 'Monje', 'Paladín']));

            component.seleccionarClasePredilecta(7);
            component.anadirA('clases_predilectas_extra', 11);
            component.anadirA('clases_multiclase_libre', 11);
            component.anadirA('clases_multiclase_libre', 7);
            const payload = component.buildPayload();
            expect(payload.clases_predilectas_extra).toEqual([11]);
            expect(payload.clases_multiclase_libre).toEqual([11]);
        });

        it('se crea con su VD y sus clases asociadas', async () => {
            component.form.patchValue({ dgs_extra: 3, id_tipo_dado: 22, id_tipo_criatura_dgs: 3, vd: 2, vd_mod_clases_pnj: -2 });
            component.anadirA('clases_asociadas', 1);
            spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

            await component.guardarRaza();

            expect(razaSvc.crearRaza).toHaveBeenCalledWith(jasmine.objectContaining({
                raza: jasmine.objectContaining({ vd: 2, vd_mod_clases_pj: null, vd_mod_clases_pnj: -2 }),
                clases_asociadas: [1],
            }));
        });

        it('un borrador guarda el VD y las clases asociadas', async () => {
            draftSvc.guardarBorradorLocal('uid-vd', crearDraftContenido({
                formValue: {
                    ...crearDraftContenido().formValue,
                    dgs_extra: 2, id_tipo_dado: 22, id_tipo_criatura_dgs: 3, vd: 1, vd_mod_clases_pj: 2,
                    clases_asociadas: [{ id: 1, nombre: 'Guerrero' }],
                },
            }));
            spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

            await recrearComponenteConUid('uid-vd');

            expect(component.form.controls.vd.value).toBe(1);
            expect(component.buildPayload().clases_asociadas).toEqual([1]);
            expect(component.buildPayload().raza.vd_mod_clases_pj).toBe(2);
        });
    });

    describe('una raza nueva que crece por edades', () => {
        /** Un dragón homebrew de tres categorías del catálogo, con sus años. */
        function tresCategorias(): void {
            component.alternarPorEdades(true);
            const [cria] = component.edades.categorias;
            Object.assign(cria, { id_categoria_edad: 1, edad_desde: 0, edad_hasta: 9, id_tamano: 2, dgs: 4, ajuste_nivel: 3, vd: 2 });
            component.edades.categorias.push(
                { ...cria, uid: 'joven', id_categoria_edad: 3, edad_desde: 10, edad_hasta: 99, id_tamano: 3, dgs: 8, ajuste_nivel: 5, raciales: [], sortilegas: [] },
                { ...cria, uid: 'adulto', id_categoria_edad: 6, edad_desde: 100, edad_hasta: null, id_tamano: 3, dgs: 14, ajuste_nivel: null, vd: 9, raciales: [], sortilegas: [] },
            );
            component.edades.pasos.push(
                { uid: 'p1', id: null, edad: 0, id_categoria_edad: 1, dgs: 4, ajuste_nivel: 3, armadura_natural: 4 },
                { uid: 'p2', id: null, edad: 10, id_categoria_edad: 3, dgs: 8, ajuste_nivel: 5, armadura_natural: 8 },
                { uid: 'p3', id: null, edad: 100, id_categoria_edad: 6, dgs: 14, ajuste_nivel: null, armadura_natural: 14 },
            );
        }

        it('el interruptor empieza con una categoría y el nivel de lanzamiento de la raza a 0', () => {
            component.form.patchValue({ nivel_lanzamiento: 5 });
            component.alternarPorEdades(true);

            expect(component.porEdades).toBeTrue();
            expect(component.edades.categorias.length).toBe(1);
            expect(component.form.controls.nivel_lanzamiento.value).toBe(0);
        });

        it('manda sus categorías y sus pasos nuevos (sin id) y copia la primera edad a la raza', () => {
            tresCategorias();
            component.copiarPrimeraEdadALaRaza();

            const payload = component.buildPayload();
            expect(payload.categorias_edad?.map((categoria) => [categoria.id_categoria_edad, categoria.edad_desde, categoria.edad_hasta]))
                .toEqual([[1, 0, 9], [3, 10, 99], [6, 100, null]]);
            expect(payload.pasos_edad?.every((paso) => !('id' in paso))).toBeTrue();
            // La fila de la raza: la cría y su primer paso (DG, ajuste, tamaño y los ajustes de las puntuaciones del libro).
            expect(payload.raza).toEqual(jasmine.objectContaining({ dgs_extra: 4, ajuste_nivel: 3, id_tamano: 2, mod_fue: 0 }));
            expect(component.form.controls.fortaleza.enabled).toBeTrue();
        });

        it('no deja guardar unas edades que la API rechazaría, y lo dice en el paso «Edades»', async () => {
            tresCategorias();
            component.copiarPrimeraEdadALaRaza();
            component.edades.categorias[1].edad_desde = 5;

            await component.guardarRaza();

            expect(razaSvc.crearRaza).not.toHaveBeenCalled();
            expect(component.errores.global).toContain('se solapan');
            expect(component.pasoActivoIndex).toBe(4);
        });

        it('sin los DG raciales de su primer paso en la raza, avisa', async () => {
            tresCategorias();

            await component.guardarRaza();

            expect(razaSvc.crearRaza).not.toHaveBeenCalled();
            expect(component.errores.global).toContain('«DG extra» no puede ser 0');
        });

        it('se crea con sus edades', async () => {
            tresCategorias();
            component.copiarPrimeraEdadALaRaza();
            spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

            await component.guardarRaza();

            expect(razaSvc.crearRaza).toHaveBeenCalledWith(jasmine.objectContaining({
                categorias_edad: jasmine.arrayContaining([jasmine.objectContaining({ id_categoria_edad: 6, edad_hasta: null })]),
                pasos_edad: jasmine.arrayContaining([jasmine.objectContaining({ edad: 100, ajuste_nivel: null })]),
            }));
        });
    });
});
