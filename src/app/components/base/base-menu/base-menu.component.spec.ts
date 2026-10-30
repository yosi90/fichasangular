import { of, Subject } from 'rxjs';
import { BaseMenuComponent } from './base-menu.component';

describe('BaseMenuComponent', () => {
    let canCreateRazas: boolean;
    let permissions: Record<string, boolean>;
    let component: BaseMenuComponent;
    let logueado: boolean;
    let userSvc: any;

    beforeEach(() => {
        canCreateRazas = true;
        permissions = {};
        logueado = false;
        userSvc = {
            Usuario: { nombre: '', correo: '', permisos: 0 },
            get IsLoggedIn() {
                return logueado;
            },
            isLoggedIn$: new Subject<boolean>(),
            entrar: jasmine.createSpy('entrar').and.resolveTo(true),
            can: jasmine.createSpy().and.callFake((resource: string, action: string) => {
                if (resource === 'razas' && action === 'create')
                    return canCreateRazas;
                return permissions[`${resource}:${action}`] === true;
            }),
            getPermissionDeniedMessage: jasmine.createSpy().and.returnValue('Sin permisos suficientes.'),
            logOut: jasmine.createSpy(),
        };
        component = new BaseMenuComponent(userSvc as any, {} as any);
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

    it('la entrada «Dados» abre su pestaña por el bus de pestañas y cierra el cajón', () => {
        const navegacion = { abrir: jasmine.createSpy('abrir') };
        const marco = { cerrarMenu: jasmine.createSpy('cerrarMenu') };
        const conDados = new BaseMenuComponent(userSvc as any, {} as any, marco as any, navegacion as any);
        for (const panel of ['primero', 'segundo', 'tercero', 'cuarto'] as const)
            conDados[panel] = { expanded: false, close: jasmine.createSpy() } as any;

        conDados.abrirDados();

        expect(navegacion.abrir).toHaveBeenCalledOnceWith({ clase: 'dados' });
        expect(marco.cerrarMenu).toHaveBeenCalled();
    });

    it('no abre la insercion de razas sin permiso create', () => {
        canCreateRazas = false;
        const emitSpy = spyOn(component.ListadoTab, 'emit');

        component.onInsertarRaza();

        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('abre el acceso de Yosiftware al intentar crear personaje como invitado', () => {
        const emitSpy = spyOn(component.NuevoPersonajeTab, 'emit');

        component.AbrirNuevoPersonaje();

        expect(userSvc.entrar).toHaveBeenCalled();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('abre nuevo personaje si el usuario autenticado puede crear personajes', () => {
        userSvc.Usuario = { nombre: 'Aldric', correo: '', permisos: 0 };
        logueado = true;
        permissions['personajes:create'] = true;
        const emitSpy = spyOn(component.NuevoPersonajeTab, 'emit');

        component.AbrirNuevoPersonaje();

        expect(userSvc.entrar).not.toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalled();
    });

    it('mantiene bloqueado nuevo personaje para usuario autenticado sin permiso', () => {
        userSvc.Usuario = { nombre: 'Aldric', correo: 'aldric@test.com', permisos: 0 };
        logueado = true;
        const emitSpy = spyOn(component.NuevoPersonajeTab, 'emit');

        component.AbrirNuevoPersonaje();

        expect(userSvc.entrar).not.toHaveBeenCalled();
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

    it('ofrece los mismos grupos de «Otros» en Insertar, Modificar y Detalles', () => {
        const titulos = (seccion: 'insertar' | 'modificar' | 'detalles') => component.gruposOtros[seccion].map(grupo => grupo.titulo);

        expect(titulos('insertar')).toEqual(['Equipo', 'Rasgos y aptitudes', 'Criaturas y mundo']);
        expect(titulos('modificar')).toEqual(titulos('insertar'));
        expect(titulos('detalles')).toEqual(titulos('insertar'));
        expect(component.gruposOtros.detalles[0].opciones.map(opcion => opcion.etiqueta)).toEqual([
            'Armas', 'Armaduras y escudos', 'Munición', 'Materiales especiales',
            'Aptitudes de armas y armaduras', 'Objetos', 'Conjuntos de objetos',
        ]);
    });

    it('las fusiones del alma y los chakras van en «Rasgos y aptitudes» de los tres menús (Magic of Incarnum)', () => {
        for (const seccion of ['insertar', 'modificar', 'detalles'] as const) {
            const rasgos = component.gruposOtros[seccion].find((grupo) => grupo.id === 'rasgos')!;
            expect(rasgos.opciones.map((opcion) => opcion.etiqueta)).toEqual(jasmine.arrayContaining(['Fusiones del alma', 'Chakras']));
            expect(rasgos.opciones.length).toBeLessThanOrEqual(8);
        }
        const emitSpy = spyOn(component.ListadoTab, 'emit');
        component.gruposOtros.detalles.find((grupo) => grupo.id === 'rasgos')!.opciones
            .find((opcion) => opcion.etiqueta === 'Fusiones del alma')!.abrir();
        expect(emitSpy).toHaveBeenCalledOnceWith({ tipo: 'fusiones del alma', operacion: 'detalles' });
    });

    it('abre el listado de un grupo de Detalles y cierra el menú', () => {
        const emitSpy = spyOn(component.ListadoTab, 'emit');
        component.otrosAbierto = 'detalles:equipo';

        component.gruposOtros.detalles[0].opciones[0].abrir();

        expect(emitSpy).toHaveBeenCalledOnceWith({ tipo: 'armas', operacion: 'detalles' });
        expect(component.primero.close).toHaveBeenCalled();
        expect(component.otrosAbierto).toBeNull();
    });

    it('abre cada grupo por separado y lo cierra al pulsarlo otra vez', () => {
        const evento = new MouseEvent('click');

        component.toggleOtros('insertar', 'equipo', evento);
        expect(component.estaAbiertoOtros('insertar', 'equipo')).toBeTrue();
        expect(component.estaAbiertoOtros('insertar', 'rasgos')).toBeFalse();
        expect(component.estaAbiertoOtros('detalles', 'equipo')).toBeFalse();

        component.toggleOtros('insertar', 'rasgos', evento);
        expect(component.estaAbiertoOtros('insertar', 'rasgos')).toBeTrue();

        component.toggleOtros('insertar', 'rasgos', evento);
        expect(component.otrosAbierto).toBeNull();
    });

    it('marca sin opciones solo el grupo sin permisos', () => {
        canCreateRazas = false;
        permissions['armas:create'] = true;
        const [equipo, rasgos, mundo] = component.gruposOtros.insertar;

        expect(component.tieneOpcionesGrupo(equipo)).toBeTrue();
        expect(component.tieneOpcionesGrupo(rasgos)).toBeFalse();
        expect(component.tieneOpcionesGrupo(mundo)).toBeFalse();
    });

    it('cada opción de los grupos lleva el icono de su catálogo, el mismo en Insertar, Modificar y Detalles', () => {
        const tipos = (seccion: 'insertar' | 'modificar' | 'detalles') =>
            component.gruposOtros[seccion].map(grupo => grupo.opciones.map(opcion => `${opcion.etiqueta}:${opcion.tipo}`));
        expect(component.gruposOtros.detalles.flatMap(g => g.opciones).every(o => !!o.tipo)).toBeTrue();
        expect(tipos('insertar')).toEqual(tipos('modificar'));
        const detalles = tipos('detalles').flat();
        expect(tipos('insertar').flat().every(t => detalles.includes(t))).toBeTrue();
        expect(detalles).toContain('Munición:municion');
        expect(detalles).toContain('Ventajas y desventajas:ventaja');
        expect(detalles).toContain('Subtipos de criatura:subtipo');
        expect(detalles).toContain('Armaduras y escudos:armadura');
    });
});
