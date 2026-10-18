import { Component, Input } from '@angular/core';
import { analizarTextoManual, BloqueTexto } from './texto-manual';

/** Pinta un texto de los manuales con su formato (párrafos, cursiva, negrita, títulos y tablas). */
@Component({
    selector: 'app-texto-manual',
    templateUrl: './texto-manual.component.html',
    styleUrls: ['./texto-manual.component.sass'],
    standalone: false
})
export class TextoManualComponent {
    bloques: BloqueTexto[] = [];

    @Input() set texto(valor: string | null | undefined) {
        this.bloques = analizarTextoManual(valor);
    }
}
