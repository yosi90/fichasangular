import { of, Subject } from 'rxjs';
import { BaseMenuComponent } from './base-menu.component';

describe('BaseMenuComponent', () => {
    let canCreateRazas: boolean;
    let permissions: Record<string, boolean>;
    let component: BaseMenuComponent;
    let dialogOpenSpy: jasmine.Spy;
    let userSvc: any;

    beforeEach(() => {
        canCreateRazas = true;
        permissions = {};
        dialogOpenSpy = jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(undefined) });
        userSvc = {
            Usuario: { nombre: '', correo: '', permisos: 0 },
            isLoggedIn$: new Subject<boolean>(),
            can: jasmine.createSpy().and.callFake((resource: string, action: string) => {
                if (resource === 'razas' && action === 'create')
                    return canCreateRazas;
                return permissions[`${resource}:${action}`] === true;
            }),
            getPermissionDeniedMessage: jasmine.createSpy().and.returnValue('Sin permisos suficientes.'),
            logOut: jasmine.createSpy(),
        };
        component = new BaseMenuComponent({ open: dialogOpenSpy } as any, userSvc as any, {} as any);
        component.primero = { expanded: true, close: jasmine.createSpy() } as any;
        component.segundo = { expanded: false, close: jasmine.createSpy() } as any;
        component.tercero = { expanded: false, close: jasmine.createSpy() } as any;
        component.cuarto = { expanded: false, close: jasmine.createSpy() } as any;
    });

    it('abre la insercion de razas desde el menu principal', () => {
        const emitSpy = spyOn(component.ListadoTab, 'emit');

        component.onInsertarRaza();

        expect(emitSpy).toHaveBeenCalledOnceWith({ tipo: 'razas', operacion: 'insertar' });
        expect(component.primero.close).toHaveBeenCalled();
    });

    it('no abre la insercion de razas sin permiso create', () => {
        canCreateRazas = false;
        const emitSpy = spyOn(component.ListadoTab, 'emit');

        component.onInsertarRaza();

        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('abre el dialogo de sesion al intentar crear personaje como invitado', () => {
        const emitSpy = spyOn(component.NuevoPersonajeTab, 'emit');

        component.AbrirNuevoPersonaje();

        expect(dialogOpenSpy).toHaveBeenCalled();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('abre nuevo personaje si el usuario autenticado puede crear personajes', () => {
        userSvc.Usuario = { nombre: 'Aldric', correo: 'aldric@test.com', permisos: 0 };
        permissions['personajes:create'] = true;
        const emitSpy = spyOn(component.NuevoPersonajeTab, 'emit');

        component.AbrirNuevoPersonaje();

        expect(dialogOpenSpy).not.toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalled();
    });

    it('mantiene bloqueado nuevo personaje para usuario autenticado sin permiso', () => {
        userSvc.Usuario = { nombre: 'Aldric', correo: 'aldric@test.com', permisos: 0 };
        const emitSpy = spyOn(component.NuevoPersonajeTab, 'emit');

        component.AbrirNuevoPersonaje();

        expect(dialogOpenSpy).not.toHaveBeenCalled();
        expect(emitSpy).not.toHaveBeenCalled();
        expect(component.nuevoPersonajeDeshabilitado).toBeTrue();
    });

    it('detecta cuando Otros no tiene opciones accionables', () => {
        canCreateRazas = false;

        expect(component.tieneOpcionesOtros('insertar')).toBeFalse();
        expect(component.tieneOpcionesOtros('modificar')).toBeFalse();

        permissions['armas:create'] = true;
        permissions['armaduras:update'] = true;

        expect(component.tieneOpcionesOtros('insertar')).toBeTrue();
        expect(component.tieneOpcionesOtros('modificar')).toBeTrue();
        expect(component.tieneOpcionesOtros('detalles')).toBeTrue();
    });

    it('abre la inserción de raciales con permiso de creación de razas', () => {
        const emitSpy = spyOn(component.ListadoTab, 'emit');

        component.onInsertarRacial();

        expect(emitSpy).toHaveBeenCalledOnceWith({ tipo: 'raciales', operacion: 'insertar' });
        expect(component.primero.close).toHaveBeenCalled();
    });

    it('no abre la inserción de raciales sin razas.create', () => {
        canCreateRazas = false;
        const emitSpy = spyOn(component.ListadoTab, 'emit');

        component.onInsertarRacial();

        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('abre la modificación de raciales con permiso update', () => {
        permissions['raciales:update'] = true;
        const emitSpy = spyOn(component.ListadoTab, 'emit');

        component.onModificarRacial();

        expect(emitSpy).toHaveBeenCalledOnceWith({ tipo: 'raciales', operacion: 'modificar' });
        expect(component.primero.close).toHaveBeenCalled();
    });

    it('no abre la modificación de raciales sin permiso update', () => {
        const emitSpy = spyOn(component.ListadoTab, 'emit');

        component.onModificarRacial();

        expect(emitSpy).not.toHaveBeenCalled();
    });
});
