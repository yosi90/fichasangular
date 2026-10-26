import { Component, Input } from '@angular/core';
import { DatoFicha } from './ficha';

/**
 * Lo que cambia una plantilla o un subtipo en las características: los modificadores y los mínimos
 * (`datosModificadoresCaracteristicas`, `datosMinimosCaracteristicas`), cada uno con su subtítulo. Va dentro de una
 * `<app-ficha-seccion titulo="Características">`, que la pantalla pinta solo si hay alguno.
 */
@Component({
    selector: 'app-ficha-caracteristicas',
    template: `
        <div class="ficha-grupo" *ngIf="modificadores.length > 0">
            <h3 class="ficha-subtitulo">Modificadores</h3>
            <app-ficha-datos [datos]="modificadores" [columnas]="3" [tarjeta]="false" titulo="Modificadores de característica"></app-ficha-datos>
        </div>
        <div class="ficha-grupo" *ngIf="minimos.length > 0">
            <h3 class="ficha-subtitulo">Mínimos</h3>
            <app-ficha-datos [datos]="minimos" [columnas]="3" [tarjeta]="false" titulo="Características mínimas"></app-ficha-datos>
        </div>`,
    standalone: false
})
export class FichaCaracteristicasComponent {
    @Input() modificadores: DatoFicha[] = [];
    @Input() minimos: DatoFicha[] = [];
}
