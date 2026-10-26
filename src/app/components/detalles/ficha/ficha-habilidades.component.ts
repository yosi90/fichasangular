import { Component, Input } from '@angular/core';
import { HabilidadFicha } from './criatura';

/**
 * Las habilidades que da una criatura o lo que la cambia (`habilidadesVisibles`), en tablas `ficha-pares`: «Avistar …
 * +2», con «Varios» debajo. Las base y las custom van en grupos; el título «Base» solo sale si también hay custom. Va
 * dentro de una `<app-ficha-lateral>`, que la pantalla pinta solo si hay alguna.
 */
@Component({
    selector: 'app-ficha-habilidades',
    template: `
        <div class="ficha-grupo" *ngIf="base.length > 0">
            <h3 class="ficha-subtitulo" *ngIf="custom.length > 0">Base</h3>
            <ng-container *ngTemplateOutlet="tabla; context: { $implicit: base }"></ng-container>
        </div>
        <div class="ficha-grupo" *ngIf="custom.length > 0">
            <h3 class="ficha-subtitulo">Custom</h3>
            <ng-container *ngTemplateOutlet="tabla; context: { $implicit: custom }"></ng-container>
        </div>
        <ng-template #tabla let-filas>
            <table class="ficha-pares">
                <tbody>
                    <tr *ngFor="let habilidad of filas">
                        <td>
                            {{habilidad.nombre}}
                            <div class="ficha-nota" *ngIf="habilidad.nota">{{habilidad.nota}}</div>
                        </td>
                        <td>{{habilidad.valor}}</td>
                    </tr>
                </tbody>
            </table>
        </ng-template>`,
    standalone: false
})
export class FichaHabilidadesComponent {
    @Input() base: HabilidadFicha[] = [];
    @Input() custom: HabilidadFicha[] = [];
}
