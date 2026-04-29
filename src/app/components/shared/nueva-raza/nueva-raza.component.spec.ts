import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
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
import { NuevaRazaComponent } from './nueva-raza.component';

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
        razaSvc = jasmine.createSpyObj<RazaService>('RazaService', ['getRazas', 'crearRaza']);
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
                    getAlineamientosBasicosCatalogo: () => of([
                        { Id: 0, Nombre: 'No aplica' },
                        { Id: 2, Nombre: 'Legal bueno' },
                    ]),
                    getAlineamientosPrioridadesCatalogo: () => of([
                        { Id: 4, Nombre: 'Final', Descripcion: 'Marca interna.' },
                        { Id: 2, Nombre: 'Importante', Descripcion: 'Tendencia importante.' },
                        { Id: 1, Nombre: 'Debe tenerse en cuenta', Descripcion: 'Debe respetarse.' },
                        { Id: 0, Nombre: 'Sin prioridad', Descripcion: 'No condiciona el alineamiento.' },
                    ]),
                    getAlineamientosPreferenciaLeyCatalogo: () => of([
                        { Id: 0, Nombre: 'No aplica', Descripcion: '' },
                        { Id: 2, Nombre: 'Casi siempre legal', Descripcion: '' },
                        { Id: 10, Nombre: 'Ninguna preferencia', Descripcion: '' },
                    ]),
                    getAlineamientosPreferenciaMoralCatalogo: () => of([
                        { Id: 0, Nombre: 'No aplica', Descripcion: '' },
                        { Id: 4, Nombre: 'Casi siempre bueno', Descripcion: '' },
                        { Id: 10, Nombre: 'Ninguna preferencia', Descripcion: '' },
                    ]),
                } },
                { provide: SubtipoService, useValue: { getSubtipos: () => of([{ Id: 8, Nombre: 'Humano' }, { Id: 6, Nombre: 'Dragon' }]) } },
                { provide: IdiomaService, useValue: { getIdiomas: () => of([{ Id: 9, Nombre: 'Comun' }, { Id: 7, Nombre: 'Draconico' }]) } },
                { provide: HabilidadService, useValue: {
                    getHabilidades: () => of([{ Id_habilidad: 11, Nombre: 'Avistar' }, { Id_habilidad: 12, Nombre: 'Escuchar' }]),
                    getHabilidadesCustom: () => of([{ Id_habilidad: 13, Nombre: 'Saber antiguo' }]),
                } },
                { provide: DoteService, useValue: { getDotes: () => of([{ Id: 14, Nombre: 'Alerta', Extras_soportados: {}, Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] } }]) } },
                { provide: RacialService, useValue: racialSvc },
                { provide: ConjuroService, useValue: { getConjuros: () => of([{ Id: 16, Nombre: 'Luz' }]) } },
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
                        { Id: 20, Nombre: 'No vuela' },
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

    function prerreqRow(tipo: any, id: number, opcional: number = 0): any {
        return {
            uid: `${tipo}-${id}-${opcional}`,
            tipo,
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
                manualBusqueda: 'Manual base',
                clasePredilectaBusqueda: 'Guerrero',
                subtipoBusqueda: 'Humano',
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
                prerrequisitosMutacionSeleccionados: ['tipo_criatura'],
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
        component.prerrequisitosMutacionSeleccionados = ['actitud_requerido', 'tipo_criatura'];
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
        expect(payload.prerrequisitos).toEqual({
            actitud_requerido: [{ id_actitud: 4, opcional: 1 }, { id_actitud: 1, opcional: 1 }],
            tipo_criatura: [{ id_tipo_criatura: 3 }, { id_tipo_criatura: 4, opcional: 2 }],
        });
        expect((payload as any).uid).toBeUndefined();
        expect((payload as any).firebaseUid).toBeUndefined();
        expect((payload as any).createdAt).toBeUndefined();
        expect((payload.raza as any).heredada).toBeUndefined();
        expect((payload as any).plantillasNoObtenibles).toBeUndefined();
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

    it('bloquea raza mutada sin prerrequisitos', () => {
        component.form.patchValue({ mutada: true });

        const error = (component as any).validarReglasDominio();

        expect(error).toContain('prerrequisitos');
    });

    it('no envia prerrequisitos ni tamaño dependiente cuando no es mutada', () => {
        component.form.patchValue({ mutada: false, tamano_mutacion_dependiente: true });
        component.prerrequisitosMutacionSeleccionados = ['actitud_requerido'];
        component.prerrequisitosMutacionRows = [prerreqRow('actitud_requerido', 4)];

        const payload = component.buildPayload();

        expect(payload.raza.mutada).toBeFalse();
        expect(payload.raza.tamano_mutacion_dependiente).toBeFalse();
        expect(payload.prerrequisitos).toBeUndefined();
    });

    it('limpia prerrequisitos y tamaño dependiente al desactivar mutada', () => {
        component.form.patchValue({ mutada: true, tamano_mutacion_dependiente: true });
        component.prerrequisitosMutacionSeleccionados = ['actitud_requerido', 'alineamiento_requerido', 'tipo_criatura'];
        component.prerrequisitosMutacionRows = [
            prerreqRow('actitud_requerido', 4),
            prerreqRow('alineamiento_requerido', 2),
            prerreqRow('tipo_criatura', 3),
        ];
        component.selectorPrerrequisitosMutacionVisible = true;

        component.form.patchValue({ mutada: false });

        expect(component.form.controls.tamano_mutacion_dependiente.value).toBeFalse();
        expect(component.prerrequisitosMutacionSeleccionados).toEqual([]);
        expect(component.prerrequisitosMutacionRows).toEqual([]);
        expect(component.selectorPrerrequisitosMutacionVisible).toBeFalse();
    });

    it('carga actitudes desde catalogo de servicio', () => {
        expect(component.actitudes).toEqual([
            { Id: 4, Nombre: 'Buena' },
            { Id: 1, Nombre: 'Legal' },
        ]);
    });

    it('carga prioridades de alineamiento desde catalogo de servicio', () => {
        expect(component.prioridadesAlineamiento).toEqual([
            { Id: 0, Nombre: 'Sin prioridad', Descripcion: 'No condiciona el alineamiento.' },
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
        expect(texto).toContain('Sin prioridad: No condiciona el alineamiento.');
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

    it('resuelve prerrequisitos de alineamiento desde basicos antes de enviar', () => {
        component.form.patchValue({ mutada: true });
        component.prerrequisitosMutacionSeleccionados = ['alineamiento_requerido'];
        component.prerrequisitosMutacionRows = [prerreqRow('alineamiento_requerido', 2, 3)];

        const payload = component.buildPayload();

        expect(component.getAlineamientosBasicosPrerrequisito().map((item) => item.Nombre)).toEqual(['Legal bueno']);
        expect(payload.prerrequisitos?.alineamiento_requerido).toEqual([{ id_alineamiento: 7, opcional: 3 }]);
    });

    it('actualiza booleanos desde helpers de chips', () => {
        component.setBooleanControl('oficial', false);
        component.setBooleanControl('mutada', true);
        component.setBooleanControl('tamano_mutacion_dependiente', true);

        expect(component.form.controls.oficial.value).toBeFalse();
        expect(component.form.controls.mutada.value).toBeTrue();
        expect(component.form.controls.tamano_mutacion_dependiente.value).toBeTrue();

        component.toggleBooleanControl('mutada');
        expect(component.form.controls.mutada.value).toBeFalse();
        expect(component.form.controls.tamano_mutacion_dependiente.value).toBeFalse();
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

    it('mantiene un unico subtipo desde el selector de creacion', () => {
        component.seleccionarSubtipo(8);
        component.seleccionarSubtipo(6);

        expect(component.subtiposSeleccionados).toEqual([6]);
        expect(component.subtipoBusqueda).toBe('Dragon');
        expect(component.buildPayload().subtipos).toEqual([6]);
    });

    it('actualiza autocompletes de manual y clase manteniendo ids de payload', () => {
        component.actualizarManualBusqueda('man');
        component.seleccionarManual(1);
        component.actualizarClasePredilectaBusqueda('gue');
        component.seleccionarClasePredilecta(1);

        expect(component.manualBusqueda).toBe('Manual base');
        expect(component.clasePredilectaBusqueda).toBe('Guerrero');
        expect(component.displayManualAutocomplete(1)).toBe('Manual base');
        expect(component.displayClasePredilectaAutocomplete(1)).toBe('Guerrero');
        expect(component.buildPayload().raza.id_manual).toBe(1);
        expect(component.buildPayload().raza.id_clase_predilecta).toBe(1);
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
        expect(texto).toContain('Volar atras: Si.');
        expect(texto).toContain('Giro maximo: 90 grados.');
    });

    it('oculta no vuela del selector visible y ordena maniobrabilidades por id', () => {
        expect(component.maniobrabilidades.map((item) => item.Id)).toEqual([20, 21, 22]);
        expect(component.getManiobrabilidadesVisibles().map((item) => item.Nombre)).toEqual(['Media', 'Buena']);

        component.form.controls.id_maniobrabilidad.setValue(20);
        component.form.controls.volar.setValue(40);

        expect(component.form.controls.id_maniobrabilidad.value).toBe(21);
    });

    it('sincroniza maniobrabilidad como no vuela cuando no hay velocidad de vuelo', () => {
        component.form.patchValue({ volar: 40, id_maniobrabilidad: 21 });
        expect(component.tieneVelocidadVuelo()).toBeTrue();

        component.form.patchValue({ volar: 0 });

        expect(component.tieneVelocidadVuelo()).toBeFalse();
        expect(component.form.controls.id_maniobrabilidad.value).toBe(20);
        expect(component.buildPayload().raza.id_maniobrabilidad).toBe(20);
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
            altura_rango_inf: 0,
            altura_rango_sup: 10.01,
            peso_rango_inf: 0,
            peso_rango_sup: 10001,
            edad_adulto: 0,
            ajuste_nivel: 21,
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

        component.form.patchValue({ ataques_naturales: 'abc', reduccion_dano: 'abc' });
        component.form.updateValueAndValidity();

        expect(component.form.controls.ataques_naturales.invalid).toBeTrue();
        expect(component.form.controls.reduccion_dano.invalid).toBeTrue();
    });

    it('limita velocidades, espacio y alcance a rangos de creacion', () => {
        component.form.patchValue({
            correr: 201,
            nadar: 201,
            volar: 201,
            trepar: 201,
            escalar: 201,
            espacio: 41,
            alcance: 41,
        });
        component.form.updateValueAndValidity();

        expect(component.form.controls.correr.invalid).toBeTrue();
        expect(component.form.controls.nadar.invalid).toBeTrue();
        expect(component.form.controls.volar.invalid).toBeTrue();
        expect(component.form.controls.trepar.invalid).toBeTrue();
        expect(component.form.controls.escalar.invalid).toBeTrue();
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
        expect(component.prerrequisitosMutacionSeleccionados).toEqual(['tipo_criatura']);
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

        await component.crearRaza();

        expect(racialSvc.anadirPrerrequisitosRacial).toHaveBeenCalledWith(41, {
            raza: [{ id_raza: 99 }],
        });
        expect(component.tieneRacialesPendientesRazaEnCreacion()).toBeFalse();
    });

    it('hace log del payload antes de crear la raza', async () => {
        setFormularioValido();
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        const consoleSpy = spyOn(console, 'log');

        await component.crearRaza();

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

        await component.crearRaza();

        expect(draftSvc.leerBorradorLocal(uid)).toBeNull();
    });

    it('conserva borrador si falla la creacion de raza', async () => {
        const uid = 'uid-error-raza';
        await recrearComponenteConUid(uid);
        setFormularioValido();
        (component as any).persistirBorradorLocalAhora();
        razaSvc.crearRaza.and.rejectWith(new Error('Fallo backend'));
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.crearRaza();

        expect(draftSvc.leerBorradorLocal(uid)).not.toBeNull();
    });

    it('usa mensaje de permisos y no llama al servicio cuando no puede crear', async () => {
        canCreate = false;
        (component as any).recalcularPermisos();
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.crearRaza();

        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
            icon: 'warning',
            title: 'Permisos insuficientes',
            text: 'Sin permisos suficientes.',
        }));
        expect(razaSvc.crearRaza).not.toHaveBeenCalled();
    });
});
