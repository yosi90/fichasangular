import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * El chip «Incluir homebrew» de los listados de la creación (plantillas, clases y conjuros): marcado, «Homebrew incluido»;
 * con la ficha ya homebrew (`forzado`) sale marcado y no se puede tocar (guía de nuevo personaje, «Homebrew»). Cada
 * listado lleva su estado y su `alternar`.
 */
@Component({
    selector: 'app-chip-homebrew',
    templateUrl: './chip-homebrew.component.html',
    styleUrls: ['./chip-homebrew.component.sass'],
    standalone: false,
})
export class ChipHomebrewComponent {
    /** Si el listado incluye el homebrew (el getter `…Efectivo` del listado). */
    @Input() incluido = false;
    /** La ficha ya es homebrew: se ofrece todo y el chip no se toca. */
    @Input() forzado = false;
    @Output() alternar = new EventEmitter<void>();
}
