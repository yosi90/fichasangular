import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TurnoDeVentanasService } from '../turno-de-ventanas.service';
import { TemaWebService } from './tema-web.service';
import { VentanaTemaService } from './ventana-tema.service';

export const MOTIVO_TURNO_TEMA = 'bienvenida-tema';

/**
 * La bienvenida de los temas (roadmap de los temas, «Decisiones acordadas»): toda cuenta que aún no tiene tema, ni en sus
 * ajustes ni en este navegador, ve una vez la ventana con los tres y no se cierra sin elegir uno. Mientras se sabe si le
 * toca o la tiene abierta, las ventanas de decisión que Rol abre sola esperan su turno (`TurnoDeVentanasService`).
 */
@Injectable({
    providedIn: 'root'
})
export class BienvenidaTemaService implements OnDestroy {
    private suscripcion: Subscription | null = null;
    private mostrando = false;

    constructor(
        private temaWeb: TemaWebService,
        private ventana: VentanaTemaService,
        private turno: TurnoDeVentanasService,
    ) { }

    iniciar(): void {
        if (this.suscripcion)
            return;
        this.suscripcion = this.temaWeb.bienvenida$.subscribe((bienvenida) => {
            if (bienvenida === 'no') {
                this.turno.soltar(MOTIVO_TURNO_TEMA);
                return;
            }
            this.turno.retener(MOTIVO_TURNO_TEMA);
            if (bienvenida === 'pendiente')
                this.mostrar();
        });
    }

    private mostrar(): void {
        if (this.mostrando)
            return;
        this.mostrando = true;
        // Si ya está abierta la de Opciones, la bienvenida sale al cerrarla, si aún no ha elegido.
        const yaAbierta = this.ventana.estaAbierta;
        this.ventana.abrir({ bienvenida: !yaAbierta })
            .then(() => {
                this.mostrando = false;
                if (yaAbierta && this.temaWeb.estado.bienvenida === 'pendiente')
                    this.mostrar();
            })
            // Si la ventana no carga (sin red), no se bloquea nada: lo intenta en la próxima carga de la página.
            .catch(() => {
                this.mostrando = false;
                this.turno.soltar(MOTIVO_TURNO_TEMA);
            });
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
    }
}
