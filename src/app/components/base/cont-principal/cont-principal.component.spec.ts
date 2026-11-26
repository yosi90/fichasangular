import { Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MenuLateral } from 'src/app/services/tema-web/temas-web';
import { ACCIONES_DEL_MENU } from '../menu-catalogo/acciones-del-menu';
import { MenuCatalogoComponent } from '../menu-catalogo/menu-catalogo.component';
import { ContPrincipalComponent } from './cont-principal.component';

describe('ContPrincipalComponent: el menú lateral de cada tema', () => {
    let menu: BehaviorSubject<MenuLateral>;
    let marco: any;
    let usuario: any;
    let componente: ContPrincipalComponent;

    beforeEach(() => {
        menu = new BehaviorSubject<MenuLateral>('accion');
        marco = {
            esMovil$: new BehaviorSubject(false),
            enCajon$: new BehaviorSubject(false),
            menuAbierto$: new BehaviorSubject(false),
            cerrarMenu: jasmine.createSpy('cerrarMenu'),
        };
        usuario = {
            IsLoggedIn: true,
            can: jasmine.createSpy('can').and.returnValue(true),
            entrar: jasmine.createSpy('entrar').and.resolveTo(true),
            normasDeCreacionPendientes: false,
            asegurarNormasDeCreacion: jasmine.createSpy('asegurarNormasDeCreacion').and.resolveTo(true),
        };
        componente = new ContPrincipalComponent(marco, usuario, { menuLateral$: menu } as any, Injector.create({ providers: [] }));
    });

    afterEach(() => componente.ngOnDestroy());

    it('con A y C, el menú de siempre, sin cargar el de B', () => {
        expect(componente.menuLateral).toBe('accion');
        expect(componente.menuCatalogo).toBeNull();
    });

    it('con B, carga bajo demanda el menú por catálogo', async () => {
        menu.next('catalogo');
        expect(componente.menuLateral).toBe('catalogo');
        await (componente as any).cargarMenuCatalogo();
        expect(componente.menuCatalogo).toBe(MenuCatalogoComponent);
        menu.next('accion');
        expect(componente.menuLateral).toBe('accion');
    });

    it('lo que pide el menú por catálogo: el listado de un catálogo y «Nuevo personaje», con sus comprobaciones', () => {
        const acciones = componente.injectorMenu.get(ACCIONES_DEL_MENU);
        acciones.abrirListado('munición');
        expect(componente.TipoListado).toBe('munición');
        expect(componente.OperacionListado).toBe('detalles');
        expect(componente.Listado).toBe(1);
        expect(marco.cerrarMenu).toHaveBeenCalled();

        acciones.nuevoPersonaje();
        expect(componente.NuevoPersonaje).toBe(1);

        usuario.can.and.returnValue(false);
        acciones.nuevoPersonaje();
        expect(componente.NuevoPersonaje).toBe(1);

        usuario.IsLoggedIn = false;
        componente.solicitarNuevoPersonaje();
        expect(usuario.entrar).toHaveBeenCalled();
        expect(componente.NuevoPersonaje).toBe(1);
    });

    it('el plegable (700-960 px): el menú en un cajón, sin el resto del móvil; el móvil, las dos cosas', () => {
        expect(componente.enCajon).toBeFalse();
        expect(componente.esMovil).toBeFalse();

        marco.enCajon$.next(true);
        expect(componente.enCajon).toBeTrue();
        expect(componente.esMovil).toBeFalse();

        componente.alCerrarCajon();
        expect(marco.cerrarMenu).toHaveBeenCalledTimes(1);

        marco.esMovil$.next(true);
        expect(componente.esMovil).toBeTrue();
        expect(componente.enCajon).toBeTrue();
    });

    it('en la pantalla ancha, el menú fijo no avisa al cerrarse', () => {
        componente.alCerrarCajon();
        expect(marco.cerrarMenu).not.toHaveBeenCalled();
    });
});
