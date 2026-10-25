import { Component, Input } from '@angular/core';

/**
 * Una tarjeta de la columna derecha, siempre a la vista (prerrequisitos, niveles por clase, componentes…). Va dentro de
 * `<app-ficha-cuerpo>`; si no hay nada que enseñar, la pantalla no la pinta (`*ngIf`).
 */
@Component({
    selector: 'app-ficha-lateral',
    template: `
        <section class="ficha-tarjeta ficha-lateral-tarjeta" [attr.aria-label]="titulo || null">
            <h2 class="ficha-titulo" *ngIf="titulo">{{titulo}}</h2>
            <ng-content></ng-content>
        </section>`,
    standalone: false
})
export class FichaLateralComponent {
    @Input() titulo: string | null = null;
}
