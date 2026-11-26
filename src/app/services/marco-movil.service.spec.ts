import { BreakpointState } from '@angular/cdk/layout';
import { NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { CONSULTA_CAJON, CONSULTA_MOVIL, MarcoMovilService } from './marco-movil.service';

describe('MarcoMovilService', () => {
    let movil$: Subject<BreakpointState>;
    let cajon$: Subject<BreakpointState>;
    let servicio: MarcoMovilService;
    let back: jasmine.Spy;
    /** Un ancho de pantalla: el móvil (< 700 px) va siempre con el menú en un cajón (< 960 px). */
    const estado$ = {
        next: (estado: BreakpointState) => {
            cajon$.next(estado);
            movil$.next(estado);
        },
    };

    beforeEach(() => {
        movil$ = new Subject<BreakpointState>();
        cajon$ = new Subject<BreakpointState>();
        spyOn(history, 'pushState');
        back = spyOn(history, 'back');
        const consultas: Record<string, Subject<BreakpointState>> = { [CONSULTA_MOVIL]: movil$, [CONSULTA_CAJON]: cajon$ };
        servicio = new MarcoMovilService({ observe: (consulta: string) => consultas[consulta] } as any, { run: (fn: () => void) => fn() } as NgZone);
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

    it('en el plegable (700-960 px) el menú va en un cajón, sin ser el móvil', () => {
        let movil: boolean | undefined;
        let cajon: boolean | undefined;
        servicio.esMovil$.subscribe((valor) => movil = valor);
        servicio.enCajon$.subscribe((valor) => cajon = valor);
        cajon$.next({ matches: true, breakpoints: {} });
        movil$.next({ matches: false, breakpoints: {} });
        expect(cajon).toBeTrue();
        expect(movil).toBeFalse();

        servicio.abrirMenu();
        expect(servicio.menuAbierto).toBeTrue();

        // Por encima de 960 px, el menú vuelve a ser fijo y el cajón se cierra.
        cajon$.next({ matches: false, breakpoints: {} });
        expect(servicio.enCajon).toBeFalse();
        expect(servicio.menuAbierto).toBeFalse();
    });

    it('del móvil al plegable abierto, el cajón abierto se queda', () => {
        estado$.next({ matches: true, breakpoints: {} });
        servicio.abrirMenu();
        movil$.next({ matches: false, breakpoints: {} });
        expect(servicio.menuAbierto).toBeTrue();
    });
});
