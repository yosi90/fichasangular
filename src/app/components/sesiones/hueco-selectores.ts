import { ComponentRef, Type, ViewContainerRef } from '@angular/core';

/**
 * El hueco donde la subida de nivel, la corrección de la ficha y la adquisición de una plantilla abren los selectores de
 * la creación (declarados en `AppModule`, con `createComponent`): uno cada vez, con sus entradas, y la promesa de lo que
 * emita. Los pasos que resuelven igual con él (el incremento y las dotes pendientes) están en `pasos-con-selectores.ts`.
 */
export class HuecoDeSelectores {
    private abierto: ComponentRef<unknown> | null = null;

    /** `host`: el `ViewContainerRef` del hueco (`@ViewChild('modalHost', { read: ViewContainerRef })`). */
    constructor(private readonly host: () => ViewContainerRef | undefined) { }

    /**
     * Abre el selector `tipo` con sus entradas y resuelve con lo que emita en `aceptar` (su valor) o en `rechazar`
     * (`null`); `fijos` resuelve esas salidas con un valor. Sin hueco, `null`.
     */
    abrir<T>(tipo: Type<unknown>, entradas: Record<string, unknown>, aceptar: string[], rechazar: string[],
        fijos: Record<string, unknown> = {}): Promise<T | null> {
        this.cerrar();
        const host = this.host();
        if (!host)
            return Promise.resolve(null);
        const ref = host.createComponent(tipo);
        Object.entries(entradas).forEach(([k, v]) => ref.setInput(k, v));
        this.abierto = ref;
        return new Promise<T | null>((resolve) => {
            const terminar = (valor: T | null) => {
                this.cerrar();
                resolve(valor);
            };
            const instancia = ref.instance as Record<string, any>;
            aceptar.forEach((salida) => instancia[salida]?.subscribe((valor: T) => terminar(valor)));
            rechazar.forEach((salida) => instancia[salida]?.subscribe(() => terminar(null)));
            Object.entries(fijos).forEach(([salida, valor]) => instancia[salida]?.subscribe(() => terminar(valor as T)));
        });
    }

    cerrar(): void {
        this.abierto?.destroy();
        this.abierto = null;
    }
}
