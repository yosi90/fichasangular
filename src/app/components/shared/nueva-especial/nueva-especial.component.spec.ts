import { FormBuilder } from '@angular/forms';
import { Subject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { NuevaEspecialComponent } from './nueva-especial.component';

describe('NuevaEspecialComponent', () => {
    let component: NuevaEspecialComponent;
    let especialSvc: jasmine.SpyObj<any>;
    let habilidadSvc: jasmine.SpyObj<any>;
    let canCreate: boolean;
    let canUpdate: boolean;
    let crearComponente: () => NuevaEspecialComponent;
    const acl$ = new Subject<void>();
    const isLoggedIn$ = new Subject<boolean>();

    const buildEspecial = (overrides: Partial<any> = {}) => ({
        Id: 77,
        Nombre: 'Aura de mando',
        Descripcion: 'Otorga bonificadores.',
        Oficial: true,
        Extra: false,
        Repetible: false,
        Repite_mismo_extra: false,
        Repite_combinacion: false,
        Activa_extra: false,
        Caracteristica: { Id: 0, Nombre: '' },
        Bonificadores: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 2, CA: 0, Armadura_natural: 0, RD: 0 },
        Flags_extra: { No_aplica: true, Da_CA: false, Da_armadura_natural: false, Da_RD: false, Da_velocidad: false },
        Subtipo: { Id: 0, Nombre: '' },
        Extras: [],
        Habilidades: [],
        ...overrides,
    });

    beforeEach(() => {
        canCreate = true;
        canUpdate = true;
        especialSvc = jasmine.createSpyObj('EspecialService', ['crearEspecial', 'actualizarEspecial', 'getEspecialFresco']);
        habilidadSvc = jasmine.createSpyObj('HabilidadService', ['getHabilidades', 'getHabilidadesCustom'], {
            habilidadesCustomMutadas$: new Subject().asObservable(),
        });
        especialSvc.crearEspecial.and.resolveTo({ message: 'Creado', idEspecial: 77, especial: buildEspecial() });
        especialSvc.actualizarEspecial.and.resolveTo({ message: 'Actualizado', idEspecial: 77, especial: buildEspecial({ Nombre: 'Aura superior' }) });
        especialSvc.getEspecialFresco.and.returnValue(of(buildEspecial()));
        habilidadSvc.getHabilidades.and.returnValue(of([{ Id_habilidad: 8, Nombre: 'Avistar', Id_caracteristica: 5, Caracteristica: 'Sabiduría', Extras: [], Soporta_extra: false }]));
        habilidadSvc.getHabilidadesCustom.and.returnValue(of([{ Id_habilidad: 12, Nombre: 'Pilotar aeronave', Id_caracteristica: 3, Caracteristica: 'Inteligencia', Extras: [], Soporta_extra: false }]));

        crearComponente = () => new NuevaEspecialComponent(
            new FormBuilder(),
            {
                acl$: acl$.asObservable(),
                isLoggedIn$: isLoggedIn$.asObservable(),
                can: jasmine.createSpy('can').and.callFake((resource: string, action: string) => {
                    if (resource === 'clases' && action === 'create')
                        return canCreate;
                    if ((resource === 'especiales' || resource === 'clases') && action === 'update')
                        return canUpdate;
                    return false;
                }),
                getPermissionDeniedMessage: jasmine.createSpy('getPermissionDeniedMessage').and.returnValue('Sin permisos suficientes.'),
            } as any,
            especialSvc as any,
            habilidadSvc as any,
            { getExtras: () => of([{ Id: 4, Nombre: 'Fuego' }]) } as any,
            { getSubtipos: () => of([{ Id: 9, Nombre: 'Fuego' }]) } as any,
            { getActitudes: () => of([{ Id: 4, Nombre: 'Bueno' }, { Id: 5, Nombre: 'Maligno' }]) } as any,
        );
        component = crearComponente();
        spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('construye payload completo y omite filas vacías', () => {
        component.form.patchValue({
            nombre: 'Aura de mando',
            descripcion: 'Otorga bonificadores.',
            oficial: false,
            extra: true,
            repetible: true,
            carisma: 2,
            da_ca: true,
            id_subtipo: 9,
        });
        component.extraRows = [
            { uid: 'e1', id_extra: 4, orden: 2, busqueda: 'Fuego' },
            { uid: 'e2', id_extra: 0, orden: 1, busqueda: '' },
        ];
        component.habilidadRows = [
            { uid: 'h1', id_habilidad: 8, id_extra: -1, rangos: 2, busqueda: 'Avistar', extraBusqueda: '' },
            { uid: 'h2', id_habilidad: 0, id_extra: -1, rangos: 0, busqueda: '', extraBusqueda: '' },
        ];

        const payload = (component as any).construirPayload();

        expect(payload.especial).toEqual(jasmine.objectContaining({
            nombre: 'Aura de mando',
            descripcion: 'Otorga bonificadores.',
            oficial: false,
            extra: true,
            repetible: true,
            id_subtipo: 9,
        }));
        expect(payload.especial.bonificadores.carisma).toBe(2);
        expect(payload.especial.flags_extra.da_ca).toBeTrue();
        expect(payload.extras).toEqual([{ id_extra: 4, orden: 2 }]);
        expect(payload.habilidades).toEqual([{ id_habilidad: 8, id_extra: -1, rangos: 2 }]);
    });

    it('hidrata modo edición desde GET fresco y detecta cambios', () => {
        especialSvc.getEspecialFresco.and.returnValue(of(buildEspecial({
            Extras: [{ Id_extra: 4, Extra: 'Fuego', Orden: 1 }],
            Habilidades: [{ Id_habilidad: 8, Habilidad: 'Avistar', Id_extra: -1, Extra: '', Rangos: 3 }],
        })));
        component.modo = 'editar';
        component.idEspecial = 77;

        component.ngOnChanges({
            modo: { currentValue: 'editar', previousValue: 'crear', firstChange: false, isFirstChange: () => false },
            idEspecial: { currentValue: 77, previousValue: null, firstChange: false, isFirstChange: () => false },
        });

        expect(especialSvc.getEspecialFresco).toHaveBeenCalledWith(77);
        expect(component.form.value.nombre).toBe('Aura de mando');
        expect(component.extraRows[0].id_extra).toBe(4);
        expect(component.habilidadRows[0]).toEqual(jasmine.objectContaining({ id_habilidad: 8, busqueda: 'Avistar', rangos: 3 }));
        expect(component.isDirty).toBeFalse();

        component.form.patchValue({ nombre: 'Aura superior' });
        expect(component.isDirty).toBeTrue();
    });

    it('manda el cambio de tamaño y los prerrequisitos de actitud, y los recupera al editar', () => {
        especialSvc.getEspecialFresco.and.returnValue(of(buildEspecial({
            Bonificadores: { ...buildEspecial().Bonificadores, Tamano_pasos: 1 },
            Prerrequisitos: {
                actitud_requerido: [{ Id_actitud: 4, Actitud: 'Bueno', Opcional: 0, Frase: 'Cualquier alineamiento bueno' }],
                actitud_prohibido: [],
            },
        })));
        component.modo = 'editar';
        component.idEspecial = 77;
        component.ngOnChanges({
            modo: { currentValue: 'editar', previousValue: 'crear', firstChange: false, isFirstChange: () => false },
            idEspecial: { currentValue: 77, previousValue: null, firstChange: false, isFirstChange: () => false },
        });

        expect(component.form.value.tamano_pasos).toBe(1);
        expect(component.prerrequisitosTipos).toEqual(['actitud_requerido']);
        expect(component.isDirty).toBeFalse();
        let payload = (component as any).construirPayload();
        expect(payload.especial.bonificadores.tamano_pasos).toBe(1);
        expect(payload.prerrequisitos).toEqual({ actitud_requerido: [{ id_actitud: 4, opcional: 0 }], actitud_prohibido: [] });

        component.anadirPrerrequisito('actitud_prohibido');
        component.alCambiarPrerrequisitos(component.prerrequisitosFilas.map((fila) => fila.tipo === 'actitud_prohibido' ? { ...fila, id: 5 } : fila));
        expect(component.isDirty).toBeTrue();
        payload = (component as any).construirPayload();
        expect(payload.prerrequisitos.actitud_prohibido).toEqual([{ id_actitud: 5, opcional: 0 }]);
    });

    it('un especial nuevo no cambia el tamaño ni pide actitud', () => {
        const payload = (component as any).construirPayload();
        expect(payload.especial.bonificadores.tamano_pasos).toBe(0);
        expect(payload.prerrequisitos).toEqual({ actitud_requerido: [], actitud_prohibido: [] });
        expect(component.catalogContext.getCatalog('actitud_requerido')).toEqual([{ id: 4, nombre: 'Bueno' }, { id: 5, nombre: 'Maligno' }]);
    });

    it('un especial nuevo no otorga nada; los chips de la creación mandan la dote, el familiar y el compañero', () => {
        expect(component.marcasOtorga.map((marca) => marca.clave)).toEqual(['otorga_dote', 'otorga_familiar', 'otorga_companero']);
        component.marcasOtorga.forEach((marca) => expect(marca.ayuda.length).toBeGreaterThan(0));
        let payload = (component as any).construirPayload();
        expect(payload.especial).toEqual(jasmine.objectContaining({ otorga_dote: false, otorga_familiar: false, otorga_companero: false }));

        component.toggleBoolean('otorga_dote');
        component.toggleBoolean('otorga_companero');
        payload = (component as any).construirPayload();
        expect(payload.especial).toEqual(jasmine.objectContaining({ otorga_dote: true, otorga_familiar: false, otorga_companero: true }));
    });

    it('al editar, carga lo que otorga, guardar sin tocar lo manda igual y cambiarlo cuenta como cambio', async () => {
        especialSvc.getEspecialFresco.and.returnValue(of(buildEspecial({ Otorga_dote: false, Otorga_familiar: true, Otorga_companero: true })));
        component.modo = 'editar';
        component.idEspecial = 77;
        component.ngOnChanges({
            modo: { currentValue: 'editar', previousValue: 'crear', firstChange: false, isFirstChange: () => false },
            idEspecial: { currentValue: 77, previousValue: null, firstChange: false, isFirstChange: () => false },
        });

        expect(component.form.value).toEqual(jasmine.objectContaining({ otorga_dote: false, otorga_familiar: true, otorga_companero: true }));
        expect(component.isDirty).toBeFalse();

        component.toggleBoolean('otorga_familiar');
        expect(component.isDirty).toBeTrue();
        component.toggleBoolean('otorga_familiar');
        expect(component.isDirty).toBeFalse();

        await component.guardarEspecial();
        const [id, payload] = especialSvc.actualizarEspecial.calls.mostRecent().args;
        expect(id).toBe(77);
        expect(payload.especial).toEqual(jasmine.objectContaining({ otorga_dote: false, otorga_familiar: true, otorga_companero: true }));
    });

    it('tras crear un especial que otorga un familiar, el formulario vuelve a no otorgar nada', async () => {
        component.form.patchValue({ nombre: 'Convocar familiar arcano' });
        component.toggleBoolean('otorga_familiar');

        await component.guardarEspecial();

        expect(especialSvc.crearEspecial.calls.mostRecent().args[0].especial.otorga_familiar).toBeTrue();
        expect(component.form.value).toEqual(jasmine.objectContaining({ otorga_dote: false, otorga_familiar: false, otorga_companero: false }));
    });

    it('solo da habilidades del catálogo: Artesanía 1 no pasa a la personalizada de su mismo id', () => {
        // En `rol_dev`, la habilidad 2 es Artesanía 1 y la personalizada 2, Autohipnosis; `especiales_habilidades` solo
        // apunta a `habilidades` (el contrato no tiene habilidades personalizadas en los especiales).
        component.ngOnDestroy();
        habilidadSvc.getHabilidades.and.returnValue(of([
            { Id_habilidad: 2, Nombre: 'Artesanía 1', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Soporta_extra: true, Extras: [{ Id_extra: 1, Extra: 'Alfarería' }] },
        ]));
        habilidadSvc.getHabilidadesCustom.and.returnValue(of([
            { Id_habilidad: 2, Nombre: 'Autohipnosis', Id_caracteristica: 5, Caracteristica: 'Sabiduría', Soporta_extra: false, Extras: [] },
        ]));
        especialSvc.getEspecialFresco.and.returnValue(of(buildEspecial({
            Habilidades: [{ Id_habilidad: 2, Habilidad: 'Artesanía 1', Id_extra: 1, Extra: 'Alfarería', Rangos: 2 }],
        })));
        component = crearComponente();
        component.modo = 'editar';
        component.idEspecial = 77;
        component.ngOnInit();

        const fila = component.habilidadRows[0];
        expect(fila.busqueda).toBe('Artesanía 1');
        expect(component.getHabilidadesFiltradas({ ...fila, busqueda: '' }).map((habilidad) => habilidad.Nombre)).toEqual(['Artesanía 1']);
        expect(component.getExtrasHabilidad(fila)).toEqual([{ Id_extra: 1, Extra: 'Alfarería' }]);
        expect((component as any).construirPayload().habilidades).toEqual([{ id_habilidad: 2, id_extra: 1, rangos: 2 }]);
        expect(component.isDirty).toBeFalse();
    });
});

