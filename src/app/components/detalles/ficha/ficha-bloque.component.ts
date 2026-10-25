import { Component, Input } from '@angular/core';

/**
 * Una tarjeta a todo lo ancho, debajo del cuerpo: para las tablas (`<table class="ficha-tabla">`), como la progresión
 * por nivel de una clase. Si no hay nada que enseñar, la pantalla no la pinta (`*ngIf`).
 */
@Component({
    selector: 'app-ficha-bloque',
    template: `
        <section class="ficha-tarjeta ficha-bloque" [attr.aria-label]="titulo || null">
            <h2 class="ficha-titulo" *ngIf="titulo">{{titulo}}</h2>
            <div class="ficha-bloque__contenido"><ng-content></ng-content></div>
        </section>`,
    standalone: false
})
export class FichaBloqueComponent {
    @Input() titulo: string | null = null;
}
