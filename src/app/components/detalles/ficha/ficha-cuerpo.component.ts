import { Component, ContentChildren, QueryList } from '@angular/core';
import { FichaLateralComponent } from './ficha-lateral.component';
import { FichaSeccionComponent } from './ficha-seccion.component';

/**
 * El cuerpo de la ficha, en dos columnas (2fr y 1fr) que se apilan en pantallas estrechas. Las
 * `<app-ficha-seccion>` hijas van a la izquierda, juntas en una tarjeta; las `<app-ficha-lateral>`, a la derecha. Sin
 * secciones visibles no se pinta la tarjeta izquierda, y sin laterales el texto ocupa todo el ancho.
 */
@Component({
    selector: 'app-ficha-cuerpo',
    template: `
        <div class="ficha-cuerpo" [class.ficha-cuerpo--sin-lateral]="!hayLateral" [class.ficha-cuerpo--sin-principal]="!hayPrincipal">
            <article class="ficha-tarjeta ficha-principal" [class.ficha-oculta]="!hayPrincipal">
                <ng-content select="app-ficha-seccion"></ng-content>
            </article>
            <div class="ficha-columna-lateral" [class.ficha-oculta]="!hayLateral">
                <ng-content select="app-ficha-lateral"></ng-content>
            </div>
        </div>`,
    standalone: false
})
export class FichaCuerpoComponent {
    @ContentChildren(FichaSeccionComponent) secciones?: QueryList<FichaSeccionComponent>;
    @ContentChildren(FichaLateralComponent) laterales?: QueryList<FichaLateralComponent>;

    get hayPrincipal(): boolean {
        return this.secciones?.some((seccion) => seccion.visible) ?? false;
    }

    get hayLateral(): boolean {
        return (this.laterales?.length ?? 0) > 0;
    }
}
