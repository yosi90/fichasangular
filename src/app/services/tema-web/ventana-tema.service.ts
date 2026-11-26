import { DOCUMENT } from '@angular/common';
import { ApplicationRef, ComponentRef, EnvironmentInjector, Inject, Injectable, NgZone, Type, createComponent } from '@angular/core';
import type { VentanaTemaComponent } from 'src/app/components/shared/ventana-tema/ventana-tema.component';

/**
 * Abre la ventana de los temas (`VentanaTemaComponent`), que se carga bajo demanda para no crecer el bundle inicial: la
 * bienvenida y Opciones → Tema y modo. Una sola a la vez; `abrir` se resuelve al cerrarse.
 */
@Injectable({
    providedIn: 'root'
})
export class VentanaTemaService {
    private abierta: Promise<void> | null = null;

    constructor(
        private appRef: ApplicationRef,
        private injector: EnvironmentInjector,
        private zone: NgZone,
        @Inject(DOCUMENT) private document: Document,
    ) { }

    get estaAbierta(): boolean {
        return this.abierta !== null;
    }

    abrir(opciones: { bienvenida: boolean } = { bienvenida: false }): Promise<void> {
        // Dentro de la zona de Angular aunque lo pida algo de fuera (un aviso del SDK): sus clics repintan la ventana.
        this.abierta ??= this.zone.run(() => this.montar(opciones.bienvenida)).finally(() => this.abierta = null);
        return this.abierta;
    }

    protected async cargarComponente(): Promise<Type<VentanaTemaComponent>> {
        return (await import('src/app/components/shared/ventana-tema/ventana-tema.component')).VentanaTemaComponent;
    }

    private async montar(bienvenida: boolean): Promise<void> {
        const componente = await this.cargarComponente();
        const ref: ComponentRef<VentanaTemaComponent> = createComponent(componente, { environmentInjector: this.injector });
        ref.setInput('bienvenida', bienvenida);
        this.document.body.appendChild(ref.location.nativeElement);
        this.appRef.attachView(ref.hostView);
        ref.changeDetectorRef.detectChanges();
        await new Promise<void>((resolve) => ref.instance.cerrada.subscribe(() => resolve()));
        this.appRef.detachView(ref.hostView);
        ref.destroy();
    }
}
