import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, distinctUntilChanged, map } from 'rxjs';

/** Por debajo de 700 px, el marco es el del móvil (lienzo «Rol: las vistas que faltan», vista 10). */
export const CONSULTA_MOVIL = '(max-width: 699.98px)';

/**
 * El marco en el móvil: si la pantalla es estrecha y si el cajón del menú está abierto. Lo leen la cinta (el botón
 * «Menú»), el marco principal (`mat-sidenav` en modo over) y el menú (se cierra al elegir). El gesto atrás del móvil
 * cierra el cajón: al abrirlo se apila una entrada en el historial y, al volver, se cierra.
 */
@Injectable({
    providedIn: 'root'
})
export class MarcoMovilService implements OnDestroy {
    private readonly esMovilSubject = new BehaviorSubject<boolean>(false);
    readonly esMovil$: Observable<boolean> = this.esMovilSubject.pipe(distinctUntilChanged());
    private readonly menuAbiertoSubject = new BehaviorSubject<boolean>(false);
    readonly menuAbierto$: Observable<boolean> = this.menuAbiertoSubject.pipe(distinctUntilChanged());
    private readonly suscripcion: Subscription;
    private conEntradaEnHistorial = false;
    private readonly alVolver = () => this.ngZone.run(() => {
        if (!this.menuAbiertoSubject.value)
            return;
        this.conEntradaEnHistorial = false;
        this.menuAbiertoSubject.next(false);
    });

    constructor(breakpoints: BreakpointObserver, private ngZone: NgZone) {
        this.suscripcion = breakpoints.observe(CONSULTA_MOVIL).pipe(map((estado) => estado.matches)).subscribe((movil) => {
            this.esMovilSubject.next(movil);
            if (!movil)
                this.cerrarMenu();
        });
        window.addEventListener('popstate', this.alVolver);
    }

    get esMovil(): boolean {
        return this.esMovilSubject.value;
    }

    get menuAbierto(): boolean {
        return this.menuAbiertoSubject.value;
    }

    abrirMenu(): void {
        if (!this.esMovil || this.menuAbiertoSubject.value)
            return;
        this.menuAbiertoSubject.next(true);
        history.pushState({ ...(history.state ?? {}), rolMenu: true }, '');
        this.conEntradaEnHistorial = true;
    }

    cerrarMenu(): void {
        if (!this.menuAbiertoSubject.value)
            return;
        this.menuAbiertoSubject.next(false);
        if (this.conEntradaEnHistorial) {
            this.conEntradaEnHistorial = false;
            if (history.state?.rolMenu)
                history.back();
        }
    }

    alternarMenu(): void {
        if (this.menuAbiertoSubject.value)
            this.cerrarMenu();
        else
            this.abrirMenu();
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
        window.removeEventListener('popstate', this.alVolver);
    }
}
