import { FormBuilder } from '@angular/forms';
import { Subject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { NuevaRacialComponent } from './nueva-racial.component';

describe('NuevaRacialComponent', () => {
    let component: NuevaRacialComponent;
    let canCreate: boolean;
    let canUpdate: boolean;
    let racialSvc: jasmine.SpyObj<any>;
    const acl$ = new Subject<void>();
    const isLoggedIn$ = new Subject<boolean>();
    const buildRacial = (overrides: Partial<any> = {}) => ({
        Id: 41,
        Nombre: 'Piel pétrea',
        Descripcion: '',
        Oficial: true,
        Dotes: [],
        Habilidades: { Base: [], Custom: [] },
        Caracteristicas: [],
        Salvaciones: [],
        Sortilegas: [],
        Ataques: [],
        Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
        Prerrequisitos: { raza: [], caracteristica: [] },
        ...overrides,
    });

    beforeEach(() => {
        canCreate = true;
        canUpdate = true;
        racialSvc = jasmine.createSpyObj('RacialService', ['crearRacial', 'actualizarRacial', 'getRacial']);
        racialSvc.crearRacial.and.resolveTo({
            message: 'Creado',
            idRacial: 41,
            racial: buildRacial(),
        });
        racialSvc.actualizarRacial.and.resolveTo({
            message: 'Actualizado',
            idRacial: 41,
            racial: buildRacial({ Nombre: 'Piel pétrea mejorada' }),
        });
        racialSvc.getRacial.and.returnValue(of(buildRacial()));

        component = new NuevaRacialComponent(
            new FormBuilder(),
            {
                acl$: acl$.asObservable(),
                isLoggedIn$: isLoggedIn$.asObservable(),
                can: jasmine.createSpy('can').and.callFake((resource: string, action: string) => {
                    if (resource === 'razas' && action === 'create')
                        return canCreate;
                    if (resource === 'raciales' && action === 'update')
                        return canUpdate;
                    return false;
                }),
                getPermissionDeniedMessage: jasmine.createSpy('getPermissionDeniedMessage').and.returnValue('Sin permisos suficientes.'),
            } as any,
            racialSvc as any,
            { getDotes: () => of([{ Id: 5, Nombre: 'Alerta', Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] } }]) } as any,
            {
                getHabilidades: () => of([{ Id_habilidad: 7, Nombre: 'Avistar', Extras: [], Soporta_extra: false }]),
                getHabilidadesCustom: () => of([{ Id_habilidad: 8, Nombre: 'Saber antiguo', Extras: [], Soporta_extra: false }]),
            } as any,
            { getConjuros: () => of([{ Id: 9, Nombre: 'Luz' }]) } as any,
            { getRazas: () => of([{ Id: 2, Nombre: 'Elfo' }]) } as any,
        );
        spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('construye payload mínimo válido con nombre', () => {
        component.form.patchValue({ nombre: 'Piel pétrea', descripcion: '' });

        const payload = (component as any).construirPayload();

        expect(payload).toEqual({ racial: { nombre: 'Piel pétrea', oficial: true } });
    });

    it('permite alternar oficial y lo incluye en el payload', () => {
        component.form.patchValue({ nombre: 'Piel pétrea' });

        component.toggleOficial();
        const payload = (component as any).construirPayload();

        expect(component.form.controls.oficial.value).toBeFalse();
        expect(payload.racial.oficial).toBeFalse();
    });

    it('construye dotes con id_extra -1 cuando no hay extra', () => {
        component.form.patchValue({ nombre: 'Piel pétrea' });
        component.doteRows = [{ uid: 'd1', id_dote: 5, id_extra: 0, busqueda: 'Alerta', extraBusqueda: '' }];

        const payload = (component as any).construirPayload();

        expect(payload.dotes).toEqual([{ id_dote: 5, id_extra: -1 }]);
    });

    it('construye habilidades base, custom, salvaciones, sortílegas y ataques', () => {
        component.form.patchValue({ nombre: 'Piel pétrea' });
        component.habilidadesBaseRows = [{
            uid: 'hb1',
            id_habilidad: 7,
            rangos: 2,
            id_extra: 0,
            se_considera_clasea: true,
            condicion: '',
            busqueda: 'Avistar',
            extraBusqueda: '',
        }];
        component.habilidadesCustomRows = [{
            uid: 'hc1',
            id_habilidad: 8,
            rangos: 3,
            id_extra: 0,
            se_considera_clasea: false,
            busqueda: 'Saber antiguo',
            extraBusqueda: '',
        }];
        component.salvacionesRows = [{ uid: 's1', id_salvacion: 1, cantidad: 2, condicion: '' }];
        component.sortilegasRows = [{ uid: 'so1', id_conjuro: 9, nivel_lanzador: 1, usos_diarios: '', busqueda: 'Luz' }];
        component.ataquesRows = [{ uid: 'a1', descripcion: 'Mordisco 1d6' }];

        const payload = (component as any).construirPayload();

        expect(payload.habilidades.base).toEqual([jasmine.objectContaining({
            id_habilidad: 7,
            rangos: 2,
            id_extra: -1,
            se_considera_clasea: true,
            condicion: 'No especifica',
        })]);
        expect(payload.habilidades.custom).toEqual([jasmine.objectContaining({
            id_habilidad: 8,
            rangos: 3,
            id_extra: -1,
        })]);
        expect(payload.salvaciones).toEqual([{ id_salvacion: 1, cantidad: 2, condicion: 'No especifica' }]);
        expect(payload.sortilegas).toEqual([{ id_conjuro: 9, nivel_lanzador: 1, usos_diarios: '1/día' }]);
        expect(payload.ataques).toEqual([{ descripcion: 'Mordisco 1d6' }]);
    });

    it('mapea prerrequisitos de raza y característica desde el editor compartido', () => {
        component.form.patchValue({ nombre: 'Piel pétrea' });
        component.prerrequisitosSeleccionados = ['raza', 'caracteristica'];
        component.prerrequisitosRows = [
            { uid: 'r1', tipo: 'raza', id: 2, valor: 1, opcional: 0, id_extra: null, repetido: 1, requiere_extra: false, salvacion_tipo: 'fortaleza' },
            { uid: 'c1', tipo: 'caracteristica', id: 1, valor: 13, opcional: 2, id_extra: null, repetido: 1, requiere_extra: false, salvacion_tipo: 'fortaleza' },
        ];

        const payload = (component as any).construirPayload();

        expect(payload.prerrequisitos).toEqual({
            raza: [{ id_raza: 2 }],
            caracteristica: [{ id_caracteristica: 1, cantidad: 13, opcional: 2 }],
        });
    });

    it('no arrastra filas residuales de prerrequisitos desmarcados al payload', () => {
        component.form.patchValue({ nombre: 'Piel pétrea' });
        component.prerrequisitosSeleccionados = [];
        component.prerrequisitosRows = [
            { uid: 'r1', tipo: 'raza', id: 2, valor: 1, opcional: 0, id_extra: null, repetido: 1, requiere_extra: false, salvacion_tipo: 'fortaleza' },
        ];

        const payload = (component as any).construirPayload();

        expect(payload.prerrequisitos).toBeUndefined();
    });

    it('ofrece la raza en creación en modo modal y no la envía como id inexistente', () => {
        component.permitirRazaEnCreacionPrerrequisito = true;
        component.form.patchValue({ nombre: 'Piel pétrea' });
        component.prerrequisitosSeleccionados = ['raza'];
        component.prerrequisitosRows = [
            { uid: 'r1', tipo: 'raza', id: 2147483647, valor: 1, opcional: 0, id_extra: null, repetido: 1, requiere_extra: false, salvacion_tipo: 'fortaleza' },
        ];

        const catalogo = (component as any).getCatalogoPrerrequisito('raza');
        const payload = (component as any).construirPayload();

        expect(catalogo[0]).toEqual({ id: 2147483647, nombre: 'La raza que estoy creando' });
        expect(payload.prerrequisitos).toBeUndefined();
        expect((component as any).tienePrerrequisitoRazaEnCreacion()).toBeTrue();
    });

    it('emite racialCreado tras crear correctamente', async () => {
        component.form.patchValue({ nombre: 'Piel pétrea' });
        const emitSpy = spyOn(component.racialCreado, 'emit');

        await component.crearRacial();

        expect(racialSvc.crearRacial).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({
            idRacial: 41,
            nombre: 'Piel pétrea',
        }));
    });

    it('emite si el racial creado tiene prerrequisito de raza', async () => {
        component.form.patchValue({ nombre: 'Entrenamiento élfico' });
        component.prerrequisitosSeleccionados = ['raza'];
        component.prerrequisitosRows = [
            { uid: 'r1', tipo: 'raza', id: 2, valor: 1, opcional: 0, id_extra: null, repetido: 1, requiere_extra: false, salvacion_tipo: 'fortaleza' },
        ];
        const emitSpy = spyOn(component.racialCreado, 'emit');

        await component.crearRacial();

        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({
            tienePrerrequisitoRaza: true,
        }));
    });

    it('emite marca local cuando el prerrequisito es la raza en creación', async () => {
        component.permitirRazaEnCreacionPrerrequisito = true;
        component.form.patchValue({ nombre: 'Entrenamiento propio' });
        component.prerrequisitosSeleccionados = ['raza'];
        component.prerrequisitosRows = [
            { uid: 'r1', tipo: 'raza', id: 2147483647, valor: 1, opcional: 0, id_extra: null, repetido: 1, requiere_extra: false, salvacion_tipo: 'fortaleza' },
        ];
        const emitSpy = spyOn(component.racialCreado, 'emit');

        await component.crearRacial();

        expect(racialSvc.crearRacial.calls.mostRecent().args[0].prerrequisitos).toBeUndefined();
        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({
            tienePrerrequisitoRaza: false,
            prerrequisitoRazaEnCreacion: true,
        }));
    });

    it('bloquea creación sin razas.create', async () => {
        canCreate = false;
        isLoggedIn$.next(true);
        component.form.patchValue({ nombre: 'Piel pétrea' });

        await component.crearRacial();

        expect(racialSvc.crearRacial).not.toHaveBeenCalled();
    });

    it('hidrata modo edición desde GET /razas/raciales/{id}', () => {
        const detalle = buildRacial({
            Nombre: 'Linaje de piedra',
            Descripcion: 'Descripción editada',
            Dotes: [{ Id_dote: 5, Dote: 'Alerta', Id_extra: 0, Extra: '' }],
            Habilidades: {
                Base: [{ Id_habilidad: 7, Habilidad: 'Avistar', Rangos: 2, Id_extra: 0, Condicion: 'No especifica', Se_considera_clasea: true }],
                Custom: [{ Id_habilidad: 8, Habilidad: 'Saber antiguo', Rangos: 3, Id_extra: 0, Se_considera_clasea: false }],
            },
            Caracteristicas: [{ Id_caracteristica: 1, Cantidad: 2 }],
            Salvaciones: [{ Id_salvacion: 1, Cantidad: 2, Condicion: 'No especifica' }],
            Sortilegas: [{ Conjuro: { Id: 9, Nombre: 'Luz' }, Nivel_lanzador: '1', Usos_diarios: '1/día' }],
            Ataques: [{ Descripcion: 'Mordisco 1d6' }],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: true },
            Prerrequisitos: {
                raza: [{ id_raza: 2 }],
                caracteristica: [{ id_caracteristica: 1, cantidad: 13, opcional: 2 }],
            },
        });
        racialSvc.getRacial.and.returnValue(of(detalle));
        component.modo = 'editar';
        component.idRacial = 41;

        component.ngOnChanges({
            modo: { currentValue: 'editar', previousValue: 'crear', firstChange: false, isFirstChange: () => false },
            idRacial: { currentValue: 41, previousValue: null, firstChange: false, isFirstChange: () => false },
        });

        expect(racialSvc.getRacial).toHaveBeenCalledWith(41);
        expect(component.form.value.nombre).toBe('Linaje de piedra');
        expect(component.form.value.oficial).toBeTrue();
        expect(component.doteRows[0].id_dote).toBe(5);
        expect(component.habilidadesBaseRows[0].id_habilidad).toBe(7);
        expect(component.caracteristicasRows[0].id_caracteristica).toBe(1);
        expect(component.prerrequisitosSeleccionados).toEqual(['raza', 'caracteristica']);
        expect(component.isDirty).toBeFalse();
    });

    it('usa PUT para actualizar en modo edición', async () => {
        racialSvc.getRacial.and.returnValues(
            of(buildRacial()),
            of(buildRacial({ Nombre: 'Piel pétrea mejorada' })),
        );
        racialSvc.actualizarRacial.and.resolveTo({
            message: 'Actualizado',
            idRacial: 41,
            racial: buildRacial({ Nombre: 'Piel pétrea mejorada' }),
        });
        component.modo = 'editar';
        component.idRacial = 41;
        component.ngOnChanges({
            modo: { currentValue: 'editar', previousValue: 'crear', firstChange: false, isFirstChange: () => false },
            idRacial: { currentValue: 41, previousValue: null, firstChange: false, isFirstChange: () => false },
        });
        component.form.patchValue({ nombre: 'Piel pétrea mejorada' });
        const emitSpy = spyOn(component.racialActualizado, 'emit');
        const cerrarSpy = spyOn(component.cerrar, 'emit');

        await component.guardarRacial();

        expect(racialSvc.actualizarRacial).toHaveBeenCalledWith(41, jasmine.objectContaining({
            racial: jasmine.objectContaining({ nombre: 'Piel pétrea mejorada', oficial: true }),
        }));
        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
            title: 'Racial actualizado',
            showConfirmButton: true,
            showCloseButton: true,
            confirmButtonText: 'Cerrar',
        }));
        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({
            Nombre: 'Piel pétrea mejorada',
        }));
        expect(cerrarSpy).toHaveBeenCalled();
        expect(component.isDirty).toBeFalse();
    });

    it('limpia residuos de prerrequisito de raza también al actualizar', async () => {
        racialSvc.getRacial.and.returnValue(of(buildRacial()));
        component.modo = 'editar';
        component.idRacial = 41;
        component.ngOnChanges({
            modo: { currentValue: 'editar', previousValue: 'crear', firstChange: false, isFirstChange: () => false },
            idRacial: { currentValue: 41, previousValue: null, firstChange: false, isFirstChange: () => false },
        });
        component.form.patchValue({ nombre: 'Piel pétrea' });
        component.prerrequisitosSeleccionados = [];
        component.prerrequisitosRows = [
            { uid: 'r1', tipo: 'raza', id: 2, valor: 1, opcional: 0, id_extra: null, repetido: 1, requiere_extra: false, salvacion_tipo: 'fortaleza' },
        ];

        await component.guardarRacial();

        expect(racialSvc.actualizarRacial.calls.mostRecent().args[1].prerrequisitos).toBeUndefined();
    });

    it('dirty solo cambia con modificaciones reales', () => {
        const detalle = buildRacial({
            Nombre: 'Linaje de piedra',
            Descripcion: 'Descripción editada',
        });
        racialSvc.getRacial.and.returnValue(of(detalle));
        component.modo = 'editar';
        component.idRacial = 41;
        component.ngOnChanges({
            modo: { currentValue: 'editar', previousValue: 'crear', firstChange: false, isFirstChange: () => false },
            idRacial: { currentValue: 41, previousValue: null, firstChange: false, isFirstChange: () => false },
        });

        expect(component.isDirty).toBeFalse();

        component.form.patchValue({ nombre: 'Linaje de piedra' });
        expect(component.isDirty).toBeFalse();

        component.toggleOficial();
        expect(component.isDirty).toBeTrue();
        component.toggleOficial();
        expect(component.isDirty).toBeFalse();

        component.form.patchValue({ nombre: 'Linaje de hierro' });
        expect(component.isDirty).toBeTrue();
    });

    it('confirma salida solo en edición con cambios pendientes', async () => {
        racialSvc.getRacial.and.returnValue(of(buildRacial({ Nombre: 'Linaje de piedra' })));
        component.modo = 'editar';
        component.idRacial = 41;
        component.ngOnChanges({
            modo: { currentValue: 'editar', previousValue: 'crear', firstChange: false, isFirstChange: () => false },
            idRacial: { currentValue: 41, previousValue: null, firstChange: false, isFirstChange: () => false },
        });
        component.form.patchValue({ nombre: 'Linaje de hierro' });

        const permitido = await component.confirmarSalidaSiHayCambios();

        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
            title: 'Hay cambios sin guardar',
        }));
        expect(permitido).toBeTrue();
    });
});
