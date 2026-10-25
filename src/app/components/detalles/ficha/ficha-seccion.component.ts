import { Component, Input } from '@angular/core';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

/**
 * Una sección de texto de la columna izquierda: título en versalitas y la prosa en Markdown (`<app-texto-manual>`).
 * Con `texto`, la sección se oculta sola si el texto es `null`, vacío o de relleno. Sin `texto`, enseña lo que se
 * proyecte (una lista, pares de etiqueta y valor…) y la pantalla decide con `*ngIf` si se pinta.
 */
@Component({
    selector: 'app-ficha-seccion',
    template: `
        <section class="ficha-seccion" [class.ficha-oculta]="!visible">
            <ng-container *ngIf="visible">
                <h2 class="ficha-titulo" *ngIf="titulo">{{titulo}}</h2>
                <app-texto-manual class="ficha-texto" *ngIf="conTexto" [texto]="texto"></app-texto-manual>
            </ng-container>
            <ng-content></ng-content>
        </section>`,
    standalone: false
})
export class FichaSeccionComponent {
    @Input() titulo: string | null = null;

    private textoActual: string | null | undefined = undefined;
    /** Si la pantalla le ha dado un texto (aunque sea `null`): entonces solo se ve si el texto es visible. */
    conTexto = false;

    @Input() set texto(valor: string | null | undefined) {
        this.conTexto = true;
        this.textoActual = valor;
    }
    get texto(): string | null | undefined {
        return this.textoActual;
    }

    get visible(): boolean {
        return !this.conTexto || tieneTextoVisible(this.textoActual);
    }
}
