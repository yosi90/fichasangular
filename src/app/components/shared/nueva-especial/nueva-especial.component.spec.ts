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
        habilidadSvc = jasmine.createSpyObj('HabilidadService', ['getHabilidades', 'getHabilidadesCustom', 'crearHabilidadCustom', 'actualizarHabilidadCustom'], {
            habilidadesCustomMutadas$: new Subject().asObservable(),
        });
        especialSvc.crearEspecial.and.resolveTo({ message: 'Creado', idEspecial: 77, especial: buildEspecial() });
        especialSvc.actualizarEspecial.and.resolveTo({ message: 'Actualizado', idEspecial: 77, especial: buildEspecial({ Nombre: 'Aura superior' }) });
        especialSvc.getEspecialFresco.and.returnValue(of(buildEspecial()));
        habilidadSvc.getHabilidades.and.returnValue(of([{ Id_habilidad: 8, Nombre: 'Avistar', Id_caracteristica: 5, Caracteristica: 'Sabiduría', Extras: [], Soporta_extra: false }]));
        habilidadSvc.getHabilidadesCustom.and.returnValue(of([{ Id_habilidad: 12, Nombre: 'Pilotar aeronave', Id_caracteristica: 3, Caracteristica: 'Inteligencia', Extras: [], Soporta_extra: false }]));
        habilidadSvc.crearHabilidadCustom.and.resolveTo({
            message: 'Creada',
            idHabilidad: 13,
            habilidad: { Id_habilidad: 13, Nombre: 'Pilotar dirigible', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] },
        });
        habilidadSvc.actualizarHabilidadCustom.and.resolveTo({
            message: 'Actualizada',
            idHabilidad: 12,
            habilidad: { Id_habilidad: 12, Nombre: 'Pilotar aeronave mayor', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] },
        });

        component = new NuevaEspecialComponent(
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
        );
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
            { uid: 'h1', tipo: 'base', id_habilidad: 8, id_extra: -1, rangos: 2, busqueda: 'Avistar', extraBusqueda: '' },
            { uid: 'h2', tipo: 'custom', id_habilidad: 0, id_extra: -1, rangos: 0, busqueda: '', extraBusqueda: '' },
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
            Habilidades: [{ Id_habilidad: 12, Habilidad: 'Pilotar aeronave', Id_extra: -1, Extra: '', Rangos: 3 }],
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
        expect(component.habilidadRows[0].tipo).toBe('custom');
        expect(component.isDirty).toBeFalse();

        component.form.patchValue({ nombre: 'Aura superior' });
        expect(component.isDirty).toBeTrue();
    });

    it('crea habilidad custom desde el modal y la selecciona', async () => {
        component.abrirCrearCustom();
        component.customForm.patchValue({ nombre: 'Pilotar dirigible', id_caracteristica: 4 });

        await component.guardarCustomModal();

        expect(habilidadSvc.crearHabilidadCustom).toHaveBeenCalledWith({ nombre: 'Pilotar dirigible', id_caracteristica: 4 });
        expect(component.habilidadRows.some((row) => row.tipo === 'custom' && row.id_habilidad === 13)).toBeTrue();
        expect(component.customModalAbierto).toBeFalse();
    });

    it('edita habilidad custom seleccionada desde su fila', async () => {
        const row = { uid: 'h1', tipo: 'custom' as const, id_habilidad: 12, id_extra: -1, rangos: 1, busqueda: 'Pilotar aeronave', extraBusqueda: '' };
        component.habilidadRows = [row];
        component.abrirEditarCustom(row);
        component.customForm.patchValue({ nombre: 'Pilotar aeronave mayor', id_caracteristica: 4 });

        await component.guardarCustomModal();

        expect(habilidadSvc.actualizarHabilidadCustom).toHaveBeenCalledWith(12, { nombre: 'Pilotar aeronave mayor', id_caracteristica: 4 });
        expect(component.habilidadRows[0].busqueda).toBe('Pilotar aeronave mayor');
    });
});

