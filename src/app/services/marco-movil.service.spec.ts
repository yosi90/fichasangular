import { BreakpointState } from '@angular/cdk/layout';
import { NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { MarcoMovilService } from './marco-movil.service';

describe('MarcoMovilService', () => {
    let estado$: Subject<BreakpointState>;
    let servicio: MarcoMovilService;
    let back: jasmine.Spy;

    beforeEach(() => {
        estado$ = new Subject<BreakpointState>();
        spyOn(history, 'pushState');
        back = spyOn(history, 'back');
        servicio = new MarcoMovilService({ observe: () => estado$ } as any, { run: (fn: () => void) => fn() } as NgZone);
    });

    afterEach(() => servicio.ngOnDestroy());

    it('en el escritorio el cajón no se abre', () => {
        estado$.next({ matches: false, breakpoints: {} });
        servicio.abrirMenu();
        expect(servicio.menuAbierto).toBeFalse();
    });

    it('en el móvil se abre con una entrada en el historial y se cierra deshaciéndola', () => {
        estado$.next({ matches: true, breakpoints: {} });
        servicio.abrirMenu();
        expect(servicio.menuAbierto).toBeTrue();
        expect(history.pushState).toHaveBeenCalled();
        spyOnProperty(history, 'state').and.returnValue({ rolMenu: true });
        servicio.cerrarMenu();
        expect(servicio.menuAbierto).toBeFalse();
        expect(back).toHaveBeenCalled();
    });

    it('el gesto atrás cierra el cajón y pasar a escritorio también', () => {
        estado$.next({ matches: true, breakpoints: {} });
        servicio.abrirMenu();
        window.dispatchEvent(new PopStateEvent('popstate'));
        expect(servicio.menuAbierto).toBeFalse();
        expect(back).not.toHaveBeenCalled();

        servicio.alternarMenu();
        expect(servicio.menuAbierto).toBeTrue();
        estado$.next({ matches: false, breakpoints: {} });
        expect(servicio.menuAbierto).toBeFalse();
    });
});
