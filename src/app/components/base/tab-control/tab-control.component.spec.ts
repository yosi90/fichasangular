import { fakeAsync, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { TabControlComponent } from './tab-control.component';

function crearComponente(overrides?: { pSvc?: any; }): TabControlComponent {
    const userSvc = { Usuario: { permisos: 0 }, permisos$: of(0) } as any;
    const ngZone = { run: (fn: () => void) => fn() } as any;
    const monstruoSvc = { getMonstruo: jasmine.createSpy('getMonstruo').and.returnValue(of({ Id: 90, Nombre: 'Grifo' })) } as any;
    const armaSvc = { getArma: jasmine.createSpy('getArma').and.returnValue(of({ Id: 70, Nombre: 'Espada larga' })) } as any;
    const armaduraSvc = { getArmadura: jasmine.createSpy('getArmadura').and.returnValue(of({ Id: 71, Nombre: 'Escudo pesado', Es_escudo: true })) } as any;
    const deidadSvc = {
        getDeidad: jasmine.createSpy('getDeidad').and.returnValue(of({ Id: 72, Nombre: 'Heironeous' })),
        getDeidades: jasmine.createSpy('getDeidades').and.returnValue(of([{ Id: 72, Nombre: 'Heironeous' }])),
    } as any;
    const pSvc = overrides?.pSvc ?? {} as any;
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
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        ngZone,
    );

    const buildTabs = () => {
        const tabs: any[] = [{ textLabel: 'Personajes' }];
        if (component.usrPerm === 1)
            tabs.push({ textLabel: 'Panel de administración' });
        (component.detallesPersonajeAbiertos ?? []).forEach((pj: any) => tabs.push({ textLabel: pj.Nombre }));
        if (component.AbrirNuevoPersonajeTab)
            tabs.push({ textLabel: 'Nuevo personaje' });
        (component.listadoTabsAbiertos ?? []).forEach((tab: any) => tabs.push({ textLabel: component.getEtiquetaListadoTab(tab) }));
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
        (component.detallesDeidadAbiertos ?? []).forEach((deidad: any) => tabs.push({ textLabel: component.getEtiquetaDeidad(deidad) }));
        tabs.push({ textLabel: 'Información importante' });
        return tabs;
    };

    (component as any).TabGroup = {
        selectedIndex: 0,
        _tabs: { toArray: () => buildTabs() },
    };
    (component as any).activeTabKey = 'base:personajes';
    (component as any).__monstruoSvc = monstruoSvc;

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

    it('abre detalle de armadura por id', () => {
        const component = crearComponente();

        component.abrirDetallesArmaduraPorId(71);

        expect(component.detallesArmaduraAbiertos.length).toBe(1);
    });

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

        expect(component.listadoTabsAbiertos.length).toBe(0);
        expect((component as any).activeTabKey).toBe('clase:15');
    }));
});
