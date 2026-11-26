import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, distinctUntilChanged, map } from 'rxjs';

/**
 * Por debajo de 700 px, el marco es el del móvil (lienzo «Rol: las vistas que faltan», vista 10). Los estilos usan la
 * misma consulta con la mezcla `movil` de `src/assets/css/_marco.sass`; si cambia una, cambia la otra.
 */
export const CONSULTA_MOVIL = '(max-width: 699.98px)';

/**
 * Por debajo de 960 px, el menú lateral es un cajón, también en el plegable abierto (roadmap de los temas, fase 5: el
 * Honor abierto mide unos 719 × 781 px de CSS, y 781 de ancho en apaisado): el contenido usa todo el ancho y el listado,
 * el detalle y la creación conservan sus columnas. El resto del diseño del móvil sigue en `CONSULTA_MOVIL`. Los estilos
 * del cajón no llevan consulta: cuelgan de la clase `marco--cajon` que pone el marco (`ContPrincipalComponent`).
 */
export const CONSULTA_CAJON = '(max-width: 959.98px)';

/**
 * El marco en el móvil y el plegable: si la pantalla es la del móvil, si el menú va en un cajón y si ese cajón está
 * abierto. Lo leen la cinta (el botón «Menú»), el marco principal (`mat-sidenav` en modo over) y el menú (se cierra al
 * elegir). El gesto atrás cierra el cajón: al abrirlo se apila una entrada en el historial y, al volver, se cierra.
 */
@Injectable({
    providedIn: 'root'
})
export class MarcoMovilService implements OnDestroy {
    private readonly esMovilSubject = new BehaviorSubject<boolean>(false);
    readonly esMovil$: Observable<boolean> = this.esMovilSubject.pipe(distinctUntilChanged());
    private readonly enCajonSubject = new BehaviorSubject<boolean>(false);
    /** Si el menú lateral va en un cajón (por debajo de 960 px: el móvil y el plegable). */
    readonly enCajon$: Observable<boolean> = this.enCajonSubject.pipe(distinctUntilChanged());
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
        this.suscripcion = breakpoints.observe(CONSULTA_MOVIL).pipe(map((estado) => estado.matches))
            .subscribe((movil) => this.esMovilSubject.next(movil));
        this.suscripcion.add(breakpoints.observe(CONSULTA_CAJON).pipe(map((estado) => estado.matches)).subscribe((cajon) => {
            this.enCajonSubject.next(cajon);
            if (!cajon)
                this.cerrarMenu();
        }));
        window.addEventListener('popstate', this.alVolver);
    }

    get enCajon(): boolean {
        return this.enCajonSubject.value;
    }

    get menuAbierto(): boolean {
        return this.menuAbiertoSubject.value;
    }

    abrirMenu(): void {
        if (!this.enCajon || this.menuAbiertoSubject.value)
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
