import { Subject } from 'rxjs';
import { BaseMenuComponent } from './base-menu.component';

// Las normas de Rol se piden al pulsar crear, no desactivan los botones (decisión 5 de la ronda de noviembre).
describe('BaseMenuComponent con las normas de Rol pendientes', () => {
    let component: BaseMenuComponent;
    let userSvc: any;

    beforeEach(() => {
        userSvc = {
            Usuario: { nombre: 'Aldric', correo: '', permisos: 0 },
            IsLoggedIn: true,
            isLoggedIn$: new Subject<boolean>(),
            entrar: jasmine.createSpy('entrar').and.resolveTo(true),
            can: jasmine.createSpy('can').and.returnValue(true),
            getPermissionDeniedMessage: jasmine.createSpy().and.returnValue('Sin permisos suficientes.'),
            normasDeCreacionPendientes: true,
            asegurarNormasDeCreacion: jasmine.createSpy('asegurarNormasDeCreacion').and.resolveTo(true),
        };
        component = new BaseMenuComponent(userSvc, {} as any);
        for (const panel of ['primero', 'segundo', 'tercero', 'cuarto'] as const)
            component[panel] = { expanded: false, close: jasmine.createSpy() } as any;
    });

    it('«Nuevo personaje» no sale desactivado por faltar las normas', () => {
        expect(component.nuevoPersonajeDeshabilitado).toBeFalse();
        expect(component.tooltipNuevoPersonaje).toBe('');
        expect(component.puedeGestionar('razas')).toBeTrue();
    });

    it('al pulsar «Nuevo personaje» pide las normas y, aceptadas, abre la creación', async () => {
        const emitSpy = spyOn(component.NuevoPersonajeTab, 'emit');

        component.AbrirNuevoPersonaje();
        expect(userSvc.asegurarNormasDeCreacion).toHaveBeenCalled();
        expect(emitSpy).not.toHaveBeenCalled();
        await Promise.resolve();
        await Promise.resolve();

        expect(emitSpy).toHaveBeenCalled();
    });

    it('con «Ahora no» no abre nada', async () => {
        userSvc.asegurarNormasDeCreacion.and.resolveTo(false);
        const nuevo = spyOn(component.NuevoPersonajeTab, 'emit');
        const listado = spyOn(component.ListadoTab, 'emit');

        component.AbrirNuevoPersonaje();
        component.abrirOperacion('dotes', 'insertar');
        await Promise.resolve();
        await Promise.resolve();

        expect(nuevo).not.toHaveBeenCalled();
        expect(listado).not.toHaveBeenCalled();
    });

    it('Insertar y Modificar pasan por las normas antes de abrir su pestaña', async () => {
        const listado = spyOn(component.ListadoTab, 'emit');

        component.abrirOperacion('dotes', 'modificar');
        await Promise.resolve();
        await Promise.resolve();

        expect(userSvc.asegurarNormasDeCreacion).toHaveBeenCalledTimes(1);
        expect(listado).toHaveBeenCalledOnceWith({ tipo: 'dotes', operacion: 'modificar' });
    });

    it('sin permiso de crear sigue sin abrir ni pedir las normas', () => {
        userSvc.can.and.returnValue(false);
        const nuevo = spyOn(component.NuevoPersonajeTab, 'emit');

        component.AbrirNuevoPersonaje();

        expect(component.nuevoPersonajeDeshabilitado).toBeTrue();
        expect(userSvc.asegurarNormasDeCreacion).not.toHaveBeenCalled();
        expect(nuevo).not.toHaveBeenCalled();
    });
});
