import { FormBuilder } from '@angular/forms';
import { Subject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { NuevaRacialComponent } from './nueva-racial.component';

describe('NuevaRacialComponent', () => {
    let component: NuevaRacialComponent;
    let canCreate: boolean;
    let racialSvc: jasmine.SpyObj<any>;
    const acl$ = new Subject<void>();
    const isLoggedIn$ = new Subject<boolean>();

    beforeEach(() => {
        canCreate = true;
        racialSvc = jasmine.createSpyObj('RacialService', ['crearRacial']);
        racialSvc.crearRacial.and.resolveTo({
            message: 'Creado',
            idRacial: 41,
            racial: {
                Id: 41,
                Nombre: 'Piel pétrea',
                Descripcion: '',
                Dotes: [],
                Habilidades: { Base: [], Custom: [] },
                Caracteristicas: [],
                Salvaciones: [],
                Sortilegas: [],
                Ataques: [],
                Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
                Prerrequisitos: { raza: [], caracteristica: [] },
            },
        });

        component = new NuevaRacialComponent(
            new FormBuilder(),
            {
                acl$: acl$.asObservable(),
                isLoggedIn$: isLoggedIn$.asObservable(),
                can: jasmine.createSpy('can').and.callFake((resource: string, action: string) => resource === 'razas' && action === 'create' && canCreate),
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

        expect(payload).toEqual({ racial: { nombre: 'Piel pétrea' } });
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

    it('bloquea creación sin razas.create', async () => {
        canCreate = false;
        isLoggedIn$.next(true);
        component.form.patchValue({ nombre: 'Piel pétrea' });

        await component.crearRacial();

        expect(racialSvc.crearRacial).not.toHaveBeenCalled();
    });
});
