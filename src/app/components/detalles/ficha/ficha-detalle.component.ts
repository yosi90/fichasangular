import { Component, ViewEncapsulation } from '@angular/core';

/**
 * La raíz de una pantalla de detalle: pone la ficha común y carga sus estilos, que son globales (con el prefijo
 * `ficha-`) para que valgan también en lo que cada pantalla proyecta: listas, enlaces y tablas.
 */
@Component({
    selector: 'app-ficha-detalle',
    template: '<div class="ficha"><ng-content></ng-content></div>',
    styleUrls: ['./ficha.sass'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class FichaDetalleComponent { }
