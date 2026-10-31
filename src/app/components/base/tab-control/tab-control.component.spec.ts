import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { BehaviorSubject, of, Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { TabControlComponent } from './tab-control.component';

function crearComponente(overrides?: { pSvc?: any; }): TabControlComponent {
    const isLoggedIn$ = new BehaviorSubject<boolean>(false);
    const permisos$ = new BehaviorSubject<number>(0);
    const banStatus$ = new BehaviorSubject<any>({
        restriction: null,
        sanction: null,
        isActiveNow: false,
        endsAtUtc: null,
        expiresInMs: null,
    });
    const userSvc = {
        Usuario: { permisos: 0 },
        isLoggedIn$,
        permisos$,
        banStatus$,
    } as any;
    const ngZone = { run: (fn: () => void) => fn() } as any;
    const monstruoSvc = { getMonstruo: jasmine.createSpy('getMonstruo').and.returnValue(of({ Id: 90, Nombre: 'Grifo' })) } as any;
    const armaSvc = { getArma: jasmine.createSpy('getArma').and.returnValue(of({ Id: 70, Nombre: 'Espada larga' })) } as any;
    const armaduraSvc = { getArmadura: jasmine.createSpy('getArmadura').and.returnValue(of({ Id: 71, Nombre: 'Escudo pesado', Es_escudo: true })) } as any;
    const deidadSvc = {
        getDeidad: jasmine.createSpy('getDeidad').and.returnValue(of({ Id: 72, Nombre: 'Heironeous' })),
        getDeidades: jasmine.createSpy('getDeidades').and.returnValue(of([{ Id: 72, Nombre: 'Heironeous' }])),
    } as any;
    const equipoSvc = {
        getEntrada: jasmine.createSpy('getEntrada').and.callFake((tipo: string, id: number) => of({ tipo, item: { Id: id, Nombre: 'Flechas' } })),
    } as any;
    const incarnumSvc = {
        getFusion: jasmine.createSpy('getFusion').and.callFake((id: number) => of({ Id: id, Nombre: 'Yelmo de cristal' })),
        getChakra: jasmine.createSpy('getChakra').and.callFake((id: number) => of({ Id: id, Nombre: 'Corona' })),
    } as any;
    const pSvc = overrides?.pSvc ?? {} as any;
    const navegacionRolSvc = { aperturas$: new Subject<any>() } as any;
    const userProfileNavSvc = {
        privateProfileOpen$: new Subject<any>(),
        publicProfileOpen$: new Subject<any>(),
        socialOpen$: new Subject<any>(),
        ayudaOpen$: new Subject<any>(),
    } as any;
    const component = new TabControlComponent(
        userSvc,
        pSvc,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        monstruoSvc,
        armaSvc,
        armaduraSvc,
        deidadSvc,
        { resetearCreacionNuevoPersonaje: jasmine.createSpy('resetearCreacionNuevoPersonaje') } as any,
        navegacionRolSvc,
        ngZone,
        userProfileNavSvc,
        equipoSvc,
        incarnumSvc,
    );

    const buildTabs = () => {
        const tabs: any[] = [];
        tabs.push({ textLabel: 'Personajes' });
        if (component.usrLoggedIn && component.privateProfileTabOpen)
            tabs.push({ textLabel: 'Mi perfil' });
        if (component.socialTabOpen)
            tabs.push({ textLabel: 'Social' });
        if (component.ayudaTabOpen)
            tabs.push({ textLabel: 'Ayuda' });
        if (component.dadosTabOpen)
            tabs.push({ textLabel: 'Dados' });
        (component.detallesPersonajeAbiertos ?? []).forEach((pj: any) => tabs.push({ textLabel: pj.Nombre }));
        (component.publicProfileTabs ?? []).forEach((tab: any) => tabs.push({ textLabel: component.getEtiquetaPerfilPublico(tab) }));
        if (component.AbrirNuevoPersonajeTab)
            tabs.push({ textLabel: 'Nuevo personaje' });
        (component.listadoTabsAbiertos ?? []).forEach((tab: any) => tabs.push({ textLabel: component.getEtiquetaListadoTab(tab) }));
        Object.values(component.ediciones ?? {}).forEach((abiertas: any) => abiertas.forEach((tab: any) => tabs.push({ textLabel: component.etiquetaEdicion(tab) })));
        (component.detallesManualAbiertos ?? []).forEach((manual: any) => tabs.push({ textLabel: component.getEtiquetaManual(manual) }));
        (component.detallesRazaAbiertos ?? []).forEach((raza: any) => tabs.push({ textLabel: raza.Nombre }));
        (component.detallesConjuroAbiertos ?? []).forEach((conjuro: any) => tabs.push({ textLabel: conjuro.Nombre }));
        (component.detallesSortilegaAbiertos ?? []).forEach((tupla: any) => tabs.push({ textLabel: tupla.ap.Conjuro.Nombre }));
        (component.detallesTipoCriaturaAbiertos ?? []).forEach((tipo: any) => tabs.push({ textLabel: tipo.Nombre }));
        (component.detallesRasgoAbiertos ?? []).forEach((rasgo: any) => tabs.push({ textLabel: rasgo.Nombre }));
        (component.detallesClaseAbiertos ?? []).forEach((clase: any) => tabs.push({ textLabel: component.getEtiquetaClase(clase) }));
        (component.detallesEspecialAbiertos ?? []).forEach((especial: any) => tabs.push({ textLabel: component.getEtiquetaEspecial(especial) }));
        (component.detallesRacialAbiertos ?? []).forEach((racial: any) => tabs.push({ textLabel: component.getEtiquetaRacial(racial) }));
        (component.detallesDoteAbiertos ?? []).forEach((dote: any) => tabs.push({ textLabel: component.getEtiquetaDote(dote) }));
        (component.detallesVentajaAbiertos ?? []).forEach((ventaja: any) => tabs.push({ textLabel: component.getEtiquetaVentaja(ventaja) }));
        (component.detallesPlantillaAbiertos ?? []).forEach((plantilla: any) => tabs.push({ textLabel: component.getEtiquetaPlantilla(plantilla) }));
        (component.detallesSubtipoAbiertos ?? []).forEach((subtipo: any) => tabs.push({ textLabel: component.getEtiquetaSubtipo(subtipo) }));
        (component.detallesMonstruoAbiertos ?? []).forEach((monstruo: any) => tabs.push({ textLabel: component.getEtiquetaMonstruo(monstruo) }));
        (component.detallesArmaAbiertos ?? []).forEach((arma: any) => tabs.push({ textLabel: component.getEtiquetaArma(arma) }));
        (component.detallesArmaduraAbiertos ?? []).forEach((armadura: any) => tabs.push({ textLabel: component.getEtiquetaArmadura(armadura) }));
        (component.detallesEquipoAbiertos ?? []).forEach((entrada: any) => tabs.push({ textLabel: component.getEtiquetaEquipo(entrada) }));
        (component.detallesDeidadAbiertos ?? []).forEach((deidad: any) => tabs.push({ textLabel: component.getEtiquetaDeidad(deidad) }));
        (component.detallesFusionAbiertos ?? []).forEach((fusion: any) => tabs.push({ textLabel: component.getEtiquetaFusion(fusion) }));
        (component.detallesChakraAbiertos ?? []).forEach((chakra: any) => tabs.push({ textLabel: component.getEtiquetaChakra(chakra) }));
        return tabs;
    };

    (component as any).TabGroup = {
        selectedIndex: 0,
        _tabs: { toArray: () => buildTabs() },
    };
    (component as any).activeTabKey = 'base:personajes';
    (component as any).__monstruoSvc = monstruoSvc;
    (component as any).__equipoSvc = equipoSvc;
    (component as any).__incarnumSvc = incarnumSvc;
    (component as any).__userSvc = userSvc;
    (component as any).__isLoggedIn$ = isLoggedIn$;
    (component as any).__permisos$ = permisos$;
    (component as any).__banStatus$ = banStatus$;
    (component as any).__userProfileNavSvc = userProfileNavSvc;
    (component as any).__navegacionRolSvc = navegacionRolSvc;

    return component;
}

describe('TabControlComponent navegación por origen', () => {
    const crearClase = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);
    const crearConjuro = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);
    const crearRaza = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);
    const crearMonstruo = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);

    it('cierra pestaña activa y vuelve a su origen inmediato', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(11, 'Guerrero');
        const conjuro = crearConjuro(77, 'Bola de fuego');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirDetallesConjuro(conjuro);
        tick(120);

        component.quitarDetallesConjuro(conjuro);

        expect((component as any).activeTabKey).toBe('clase:11');
        expect(component.detallesConjuroAbiertos.length).toBe(0);
    }));

    it('usa fallback a personajes si el origen ya no existe', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(12, 'Mago');
        const conjuro = crearConjuro(78, 'Misil mágico');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirDetallesConjuro(conjuro);
        tick(120);

        component.quitarDetallesClase(clase);
        expect((component as any).activeTabKey).toBe('conjuro:78');

        component.quitarDetallesConjuro(conjuro);
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('no relinka origen al reabrir una pestaña ya abierta', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(13, 'Clérigo');

        component.abrirDetallesClase(clase);
        tick(120);

        component.AbrirNuevoPersonajeTab = 1;
        (component as any).selectTabByKey('base:nuevo');
        component.abrirDetallesClase(clase);

        component.quitarDetallesClase(clase);

        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('cerrar pestaña en segundo plano mantiene la pestaña activa actual', fakeAsync(() => {
        const component = crearComponente();
        const raza = crearRaza(4, 'Elfo');
        const conjuro = crearConjuro(80, 'Escudo');

        component.abrirDetallesRaza(raza);
        tick(120);
        component.abrirDetallesConjuro(conjuro);
        tick(120);

        component.quitarDetallesRaza(raza);

        expect((component as any).activeTabKey).toBe('conjuro:80');
    }));

    it('ESC aplica la misma política de retorno por origen', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(14, 'Druida');
        const conjuro = crearConjuro(81, 'Convocar aliado');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirDetallesConjuro(conjuro);
        tick(120);

        component.onEscPressed();

        expect((component as any).activeTabKey).toBe('clase:14');
        expect(component.detallesConjuroAbiertos.length).toBe(0);
    }));

    it('abre detalle de monstruo desde listado dinámico', fakeAsync(() => {
        const component = crearComponente();
        const monstruo = crearMonstruo(21, 'Hidra');

        component.abrirListadoTab('monstruos', 'detalles');
        tick(120);
        component.recibirObjetoListado({ item: monstruo, tipo: 'monstruos' });
        tick(120);

        expect(component.detallesMonstruoAbiertos.length).toBe(1);
        expect((component as any).activeTabKey).toBe('monstruo:21');
    }));

    it('abre detalle de arma desde listado dinámico', fakeAsync(() => {
        const component = crearComponente();
        const arma = { Id: 31, Nombre: 'Espada larga' } as any;

        component.abrirListadoTab('armas', 'detalles');
        tick(120);
        component.recibirObjetoListado({ item: arma, tipo: 'armas' });
        tick(120);

        expect(component.detallesArmaAbiertos.length).toBe(1);
        expect((component as any).activeTabKey).toBe('arma:31');
    }));

    it('en modificar raciales la fila abre una tab de edición y no el detalle', fakeAsync(() => {
        const component = crearComponente();
        const racial = {
            Id: 41,
            Nombre: 'Alas',
        } as any;

        component.abrirListadoTab('raciales', 'modificar');
        tick(120);
        component.recibirObjetoListado({ item: racial, tipo: 'raciales' }, 'modificar');
        tick(120);

        expect(component.ediciones.racial).toEqual([{
            key: 'edicion:racial:41',
            tipo: 'racial',
            id: 41,
            nombre: 'Alas',
        }]);
        expect(component.detallesRacialAbiertos.length).toBe(0);
        expect((component as any).activeTabKey).toBe('edicion:racial:41');
    }));

    it('abrir detalles desde listado de raciales sigue abriendo el detalle', fakeAsync(() => {
        const component = crearComponente();
        const racial = {
            Id: 42,
            Nombre: 'Visión en la penumbra',
            Descripcion: '',
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        } as any;

        component.abrirListadoTab('raciales', 'modificar');
        tick(120);
        component.recibirObjetoListado({ item: racial, tipo: 'raciales' }, 'detalles');
        tick(120);

        expect(component.detallesRacialAbiertos.length).toBe(1);
        expect(component.ediciones.racial.length).toBe(0);
        expect((component as any).activeTabKey).toBe('racial:42');
    }));

    it('avisa antes de cerrar una edición de racial con cambios pendientes', async () => {
        const component = crearComponente();
        component.ediciones.racial = [{
            key: 'edicion:racial:41',
            tipo: 'racial',
            id: 41,
            nombre: 'Alas',
        }];
        (component as any).editoresDeCatalogo = {
            toArray: () => [{
                editorTabKey: 'edicion:racial:41',
                confirmarSalidaSiHayCambios: jasmine.createSpy('confirmarSalidaSiHayCambios').and.resolveTo(false),
            }],
        };

        const cerrado = await component.quitarEdicion('edicion:racial:41');

        expect(cerrado).toBeFalse();
        expect(component.ediciones.racial.length).toBe(1);
    });

    it('actualizar un racial sustituye su detalle abierto y renombra la tab de edición', () => {
        const component = crearComponente();
        component.detallesRacialAbiertos = [{
            Id: 41,
            Nombre: 'Alas',
        } as any];
        component.ediciones.racial = [{
            key: 'edicion:racial:41',
            tipo: 'racial',
            id: 41,
            nombre: 'Alas',
        }];

        component.onEdicionGuardada('racial', {
            Id: 41,
            Nombre: 'Alas perfeccionadas',
            Descripcion: 'Nueva descripción',
            Oficial: true,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        });

        expect(component.detallesRacialAbiertos[0].Nombre).toBe('Alas perfeccionadas');
        expect(component.ediciones.racial[0].nombre).toBe('Alas perfeccionadas');
    });

    it('cada catálogo con «Modificar» abre su pestaña desde su listado, una sola vez, y la refresca al guardar', fakeAsync(() => {
        const component = crearComponente();
        component.detallesIdiomaAbiertos = [{ Id: 7, Nombre: 'Dracónico', Descripcion: '', Secreto: false, Oficial: true } as any];

        component.recibirObjetoListado({ item: { Id: 7, Nombre: 'Dracónico' }, tipo: 'idiomas' }, 'modificar');
        tick(120);
        component.recibirObjetoListado({ item: { Id: 7, Nombre: 'Dracónico' }, tipo: 'idiomas' }, 'modificar');
        tick(120);
        component.recibirObjetoListado({ item: { Id: 3, Nombre: 'Vampiro' }, tipo: 'plantillas' }, 'modificar');
        tick(120);

        expect(component.ediciones.idioma.map((tab) => tab.key)).toEqual(['edicion:idioma:7']);
        expect(component.ediciones.plantilla.map((tab) => tab.key)).toEqual(['edicion:plantilla:3']);
        expect(component.etiquetaEdicion(component.ediciones.plantilla[0])).toBe('Modificar: Vampiro');
        expect(component.textoEdicion(component.ediciones.idioma[0])).toBe('Editar Dracónico');

        component.onEdicionGuardada('idioma', { Id: 7, Nombre: 'Dracónico antiguo' });
        expect(component.ediciones.idioma[0].nombre).toBe('Dracónico antiguo');
        expect(component.detallesIdiomaAbiertos[0].Nombre).toBe('Dracónico antiguo');
    }));

    it('un listado sin «Modificar» todavía abre el detalle aunque venga del menú de modificar', fakeAsync(() => {
        const component = crearComponente();

        component.recibirObjetoListado({ item: { Id: 5, Nombre: 'Humanoide' } as any, tipo: 'tipos de criatura' }, 'modificar');
        tick(120);

        expect(Object.values(component.ediciones).every((abiertas) => abiertas.length === 0)).toBeTrue();
        expect(component.detallesTipoCriaturaAbiertos.length).toBe(1);
    }));

    it('una raza del menú de modificar abre su pestaña de «Modificar» y, al guardarla, refresca su detalle', fakeAsync(() => {
        const component = crearComponente();
        component.detallesRazaAbiertos = [{ Id: 5, Nombre: 'Orco' } as any];

        component.recibirObjetoListado({ item: { Id: 5, Nombre: 'Orco' } as any, tipo: 'razas' }, 'modificar');
        tick(120);

        expect(component.ediciones.raza).toEqual([{ key: 'edicion:raza:5', tipo: 'raza', id: 5, nombre: 'Orco' }]);
        component.onEdicionGuardada('raza', { Id: 5, Nombre: 'Orco gris' } as any);
        expect(component.detallesRazaAbiertos[0].Nombre).toBe('Orco gris');
        expect(component.ediciones.raza[0].nombre).toBe('Orco gris');
    }));

    it('cerrar edición de racial sin cambios quita la tab cuando el editor lo emite', async () => {
        const component = crearComponente();
        component.ediciones.racial = [{
            key: 'edicion:racial:41',
            tipo: 'racial',
            id: 41,
            nombre: 'Alas',
        }];
        (component as any).editoresDeCatalogo = {
            toArray: () => [{
                editorTabKey: 'edicion:racial:41',
                confirmarSalidaSiHayCambios: jasmine.createSpy('confirmarSalidaSiHayCambios').and.resolveTo(true),
            }],
        };

        const cerrado = await component.quitarEdicion('edicion:racial:41');

        expect(cerrado).toBeTrue();
        expect(component.ediciones.racial.length).toBe(0);
    });

    it('abre el detalle de un objeto desde su listado y lo cierra volviendo al listado', fakeAsync(() => {
        const component = crearComponente();
        const objeto = { Id: 40, Nombre: 'Capa de resistencia +1' } as any;

        component.abrirListadoTab('objetos', 'detalles');
        tick(120);
        component.recibirObjetoListado({ item: { tipo: 'objeto', item: objeto }, tipo: 'objetos' });
        tick(120);

        expect(component.detallesEquipoAbiertos.length).toBe(1);
        expect((component as any).activeTabKey).toBe('equipo:objeto:40');
        expect(component.getEtiquetaEquipo(component.detallesEquipoAbiertos[0])).toBe('Capa de resistencia +1 (Objeto)');

        component.recibirObjetoListado({ item: { tipo: 'objeto', item: objeto }, tipo: 'objetos' });
        expect(component.detallesEquipoAbiertos.length).toBe(1);

        component.quitarDetallesEquipo(component.detallesEquipoAbiertos[0]);
        tick(120);
        expect(component.detallesEquipoAbiertos.length).toBe(0);
        expect((component as any).activeTabKey).toBe('listado:detalles:objetos');
    }));

    it('abre la munición por id con su tipo', () => {
        const component = crearComponente();

        component.abrirDetallesEquipoPorId({ tipo: 'municion', id: 1 });

        expect((component as any).__equipoSvc.getEntrada).toHaveBeenCalledWith('municion', 1);
        expect(component.detallesEquipoAbiertos.map((e) => e.tipo)).toEqual(['municion']);
    });

    it('abre detalle de armadura por id', () => {
        const component = crearComponente();

        component.abrirDetallesArmaduraPorId(71);

        expect(component.detallesArmaduraAbiertos.length).toBe(1);
    });

    it('abre fusiones y chakras por id una sola vez y los cierra por su etiqueta', fakeAsync(() => {
        const component = crearComponente();

        component.abrirDetallesFusionPorId(12);
        component.abrirDetallesFusionPorId(12);
        component.abrirDetallesChakraPorId(34);
        tick(120);

        expect((component as any).__incarnumSvc.getFusion).toHaveBeenCalledTimes(1);
        expect(component.detallesFusionAbiertos.map((f) => f.Id)).toEqual([12]);
        expect(component.detallesChakraAbiertos.map((c) => c.Id)).toEqual([34]);
        expect((component as any).activeTabKey).toBe('chakra:34');

        expect(component.quitarDetallesFusion('Yelmo de cristal (Fusión)')).toBeTrue();
        tick(120);
        expect(component.detallesFusionAbiertos.length).toBe(0);
        expect(component.quitarDetallesChakra(component.detallesChakraAbiertos[0])).toBeTrue();
        tick(120);
        expect(component.detallesChakraAbiertos.length).toBe(0);
    }));

    it('abre detalle de deidad por id', () => {
        const component = crearComponente();

        component.abrirDetallesDeidadPorId(72);

        expect(component.detallesDeidadAbiertos.length).toBe(1);
    });

    it('abre detalle de deidad por nombre', () => {
        const component = crearComponente();

        component.abrirDetallesDeidadPorNombre('Heironeous');

        expect(component.detallesDeidadAbiertos.length).toBe(1);
    });

    it('navegación desde manual enruta tipo monstruo por id', () => {
        const component = crearComponente();
        const spy = spyOn(component, 'abrirDetallesMonstruoPorId');

        (component as any).abrirDesdeManual({ tipo: 'monstruo', id: 44, nombre: 'Mantícora', manualId: 2 });

        expect(spy).toHaveBeenCalledWith(44);
    });

    it('ESC cierra monstruo y vuelve al origen', fakeAsync(() => {
        const component = crearComponente();
        const raza = crearRaza(4, 'Elfo');
        const monstruo = crearMonstruo(66, 'Lobo terrible');

        component.abrirDetallesRaza(raza);
        tick(120);
        component.abrirDetallesMonstruo(monstruo);
        tick(120);

        component.onEscPressed();

        expect(component.detallesMonstruoAbiertos.length).toBe(0);
        expect((component as any).activeTabKey).toBe('raza:4');
    }));

    it('onNuevoPersonajeFinalizado cierra nuevo personaje y abre detalles', () => {
        const component = crearComponente();
        const cerrarSpy = spyOn(component, 'quitarNuevoPersonaje');
        const abrirSpy = spyOn(component, 'abrirDetallesPersonaje').and.resolveTo();

        component.onNuevoPersonajeFinalizado(123);

        expect(cerrarSpy).toHaveBeenCalled();
        expect(abrirSpy).toHaveBeenCalledWith(123);
    });

    it('abrirDetallesPersonaje no duplica pestañas ante nuevas emisiones del mismo observable', fakeAsync(() => {
        const subject = new Subject<any>();
        const pSvc = {
            getDetallesPersonaje: jasmine.createSpy('getDetallesPersonaje').and.resolveTo(subject.asObservable()),
        };
        const component = crearComponente({ pSvc });

        void component.abrirDetallesPersonaje(42);
        tick();

        subject.next({ Id: 42, Nombre: 'Druida' } as any);
        tick(120);
        expect(component.detallesPersonajeAbiertos.length).toBe(1);

        subject.next({ Id: 42, Nombre: 'Druida actualizado' } as any);
        tick(120);
        expect(component.detallesPersonajeAbiertos.length).toBe(1);
    }));

    it('mantiene pestañas separadas para listado e insercion', fakeAsync(() => {
        const component = crearComponente();

        component.abrirListadoTab('dotes', 'detalles');
        tick(120);
        component.abrirListadoTab('conjuros', 'insertar');
        tick(120);

        expect(component.listadoTabsAbiertos.map((tab) => tab.key)).toEqual([
            'listado:detalles:dotes',
            'listado:insertar:conjuros',
        ]);
        expect((component as any).activeTabKey).toBe('listado:insertar:conjuros');
    }));

    it('ESC cierra la pestaña de listado activa y vuelve al origen', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(15, 'Explorador');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirListadoTab('dotes', 'detalles');
        tick(120);

        component.onEscPressed();
        flushMicrotasks();

        expect(component.listadoTabsAbiertos.length).toBe(0);
        expect((component as any).activeTabKey).toBe('clase:15');
    }));

    it('avisa antes de cerrar insertar razas si hay raciales pendientes', async () => {
        const component = crearComponente();
        component.abrirListadoTab('razas', 'insertar');
        const insercion = {
            edicion: { editando: false },
            confirmarSalidaConRacialesPendientes: jasmine.createSpy('confirmarSalidaConRacialesPendientes').and.resolveTo(false),
        };
        const modificacion = {
            edicion: { editando: true },
            confirmarSalidaConRacialesPendientes: jasmine.createSpy('confirmarSalidaConRacialesPendientes').and.resolveTo(true),
        };
        // La de «Modificar» puede ir antes en las pestañas: pregunta la de «Nueva raza».
        (component as any).nuevasRazasInsertadas = { find: (fn: (c: any) => boolean) => [modificacion, insercion].find(fn) };

        const cerrado = await component.quitarListado('listado:insertar:razas');

        expect(cerrado).toBeFalse();
        expect(component.listadoTabsAbiertos.length).toBe(1);
    });

    it('abre mi perfil como tab dinamica y la puede cerrar con ESC', fakeAsync(() => {
        const component = crearComponente();
        component.usrLoggedIn = true;

        component.abrirPerfilPrivado();
        tick(120);

        expect(component.privateProfileTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:perfil');

        component.onEscPressed();

        expect(component.privateProfileTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('abre social como tab dinámica y la puede cerrar con ESC', fakeAsync(() => {
        const component = crearComponente();

        component.abrirSocial({ section: 'amistades', requestId: 4 });
        tick(120);

        expect(component.socialTabOpen).toBeTrue();
        expect(component.socialOpenRequest?.section).toBe('amistades');
        expect((component as any).activeTabKey).toBe('base:social');

        component.onEscPressed();

        expect(component.socialTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('la Ayuda es una sola pestaña: se abre en su sección, cambia de sección sin abrir otra y se cierra con ESC', fakeAsync(() => {
        const component = crearComponente();

        component.abrirAyuda({ seccion: 'novedades', id: 1 });
        tick(120);
        expect(component.ayudaTabOpen).toBeTrue();
        expect(component.ayudaSolicitud?.seccion).toBe('novedades');
        expect((component as any).activeTabKey).toBe('base:ayuda');

        component.abrirAyuda({ seccion: 'legal', id: 2 });
        tick(120);
        expect(component.ayudaSolicitud?.seccion).toBe('legal');
        expect((component as any).buildOrderedTabKeys().filter((k: string) => k === 'base:ayuda').length).toBe(1);

        component.onEscPressed();
        expect(component.ayudaTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('los Dados son una sola pestaña: el menú la abre por el bus, si ya está abierta va a ella y se cierra con ESC', fakeAsync(() => {
        const component = crearComponente();
        component.ngOnInit();
        const navegacion = (component as any).__navegacionRolSvc;

        navegacion.aperturas$.next({ clase: 'dados' });
        tick(120);
        expect(component.dadosTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:dados');

        component.abrirAyuda();
        tick(120);
        navegacion.aperturas$.next({ clase: 'dados' });
        tick(120);
        expect((component as any).activeTabKey).toBe('base:dados');
        expect((component as any).buildOrderedTabKeys().filter((k: string) => k === 'base:dados').length).toBe(1);

        component.onEscPressed();
        expect(component.dadosTabOpen).toBeFalse();
        component.ngOnDestroy();
    }));

    it('al cerrar sesión se cierra la pestaña de los Dados', fakeAsync(() => {
        const component = crearComponente();
        component.ngOnInit();
        (component as any).__isLoggedIn$.next(true);
        component.abrirDados();
        tick(120);
        (component as any).__isLoggedIn$.next(false);
        expect(component.dadosTabOpen).toBeFalse();
        component.ngOnDestroy();
    }));

    it('cerrar la Ayuda vuelve al origen', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(17, 'Paladín');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirAyuda();
        tick(120);

        component.quitarAyuda();

        expect(component.ayudaTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('clase:17');
    }));

    it('las pestañas de inserción dicen «Nueva …» y las de edición «Editar …»', () => {
        const component = crearComponente();
        expect(component.getEtiquetaListadoTab({ key: 'listado:razas:insertar', tipo: 'razas', operacion: 'insertar' } as any)).toBe('Nueva raza');
        expect(component.getEtiquetaListadoTab({ key: 'listado:conjuros:insertar', tipo: 'conjuros', operacion: 'insertar' } as any)).toBe('Nuevo conjuro');
        expect(component.getEtiquetaListadoTab({ key: 'listado:razas:detalles', tipo: 'razas', operacion: 'detalles' } as any)).toBe('Lista de razas');
        expect(component.getEtiquetaListadoTab({ key: 'listado:armaduras:detalles', tipo: 'armaduras', operacion: 'detalles' } as any)).toBe('Lista de armaduras y escudos');
        expect(component.etiquetaEdicion({ key: 'r', tipo: 'racial', id: 1, nombre: 'Visión en la oscuridad' })).toBe('Editar racial: Visión en la oscuridad');
    });

    it('la pestaña de una dote enseña su nombre con la elección; el tooltip, también de dónde viene', () => {
        const component = crearComponente();
        const dote = { Dote: { Id: 3, Nombre: 'Soltura con un arma' }, Contexto: { Entidad: 'personaje', Id_extra: 4, Extra: 'Espada larga' } } as any;
        expect(component.getNombreDoteTab(dote)).toBe('Soltura con un arma: Espada larga');
        expect(component.getEtiquetaDote(dote)).toBe('Soltura con un arma (Dote - personaje: Espada larga)');
    });

    it('cada pestaña lleva el icono de su catálogo y variante', () => {
        const component = crearComponente();
        expect(component.tipoRolDeListado('fusiones del alma')).toBe('fusion');
        expect(component.tipoRolDeClase({ Prestigio: true } as any)).toBe('clase-prestigio');
        expect(component.tipoRolDeVentaja({ Coste: 1 } as any)).toBe('desventaja');
        expect(component.tipoRolDeEquipo('conjunto')).toBe('conjunto');
    });

    it('lo que abre la búsqueda global va como si viniera de su listado', () => {
        const component = crearComponente();
        const recibir = spyOn(component, 'recibirObjetoListado');
        const personaje = spyOn(component, 'abrirDetallesPersonaje').and.resolveTo();
        const listado = spyOn(component, 'abrirListadoTab');
        const raza = { Id: 3, Nombre: 'Azurín' };

        component.abrirDesdeNavegacion({ clase: 'detalle', lista: 'razas', item: raza });
        component.abrirDesdeNavegacion({ clase: 'personaje', id: 9 });
        component.abrirDesdeNavegacion({ clase: 'listado', lista: 'dotes' });
        component.abrirDesdeNavegacion({ clase: 'listado', lista: 'dotes', texto: 'azur' });

        expect(recibir).toHaveBeenCalledWith({ item: raza, tipo: 'razas' }, 'detalles');
        expect(personaje).toHaveBeenCalledWith(9);
        expect(listado).toHaveBeenCalledWith('dotes', 'detalles', undefined);
        expect(listado).toHaveBeenCalledWith('dotes', 'detalles', 'azur');
    });

    it('los manuales abren su detalle y sus entradas por el mismo bus', () => {
        const component = crearComponente();
        const manual = spyOn(component, 'abrirDetallesManual');
        const dote = spyOn(component, 'abrirDetallesDotePorId');
        const libro = { Id: 7, Nombre: 'Manual del jugador' } as any;

        component.abrirDesdeNavegacion({ clase: 'manual', manual: libro });
        component.abrirDesdeNavegacion({ clase: 'referencia-manual', referencia: { tipo: 'dote', id: 4, nombre: 'Soltura', manualId: 7 } });

        expect(manual).toHaveBeenCalledWith(libro);
        expect(dote).toHaveBeenCalledWith(4);
    });

    it('«Ver los N» pone el texto en el listado nuevo o en el que ya estaba abierto', () => {
        const component = crearComponente();
        (component as any).focusOpenedTab = () => undefined;
        (component as any).selectTabByKey = () => undefined;

        component.abrirListadoTab('dotes', 'detalles', 'azur');
        expect(component.listadoTabsAbiertos[0].texto).toBe('azur');

        component.abrirListadoTab('dotes', 'detalles', 'toque');
        expect(component.listadoTabsAbiertos.length).toBe(1);
        expect(component.listadoTabsAbiertos[0].texto).toBe('toque');
    });
});
