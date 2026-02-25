import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TabControlComponent } from './tab-control.component';

function crearComponente(): TabControlComponent {
    const userSvc = { Usuario: { permisos: 0 }, permisos$: of(0) } as any;
    const ngZone = { run: (fn: () => void) => fn() } as any;
    const component = new TabControlComponent(
        userSvc,
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
        {} as any,
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
        if (component.AbrirListadoTab)
            tabs.push({ textLabel: `Lista de ${component.ListadoTabTipo}` });
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
        tabs.push({ textLabel: 'Información importante' });
        return tabs;
    };

    (component as any).TabGroup = {
        selectedIndex: 0,
        _tabs: { toArray: () => buildTabs() },
    };
    (component as any).activeTabKey = 'base:personajes';

    return component;
}

describe('TabControlComponent navegación por origen', () => {
    const crearClase = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);
    const crearConjuro = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);
    const crearRaza = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);

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
});
