import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Un prerrequisito cargado que el editor compartido no enseña como fila: su frase (la `Frase` de la API). */
export interface PrerrequisitoConservadoVisible {
    frase: string;
}

/**
 * «Se guardan tal cual»: los prerrequisitos de la entrada cargada que el editor compartido no puede enseñar como fila
 * (el comodín 0 de un catálogo sin `comodinLabel`, una fila incompleta de los datos…), como chips con su frase que se
 * pueden quitar. Lo que se manda al guardar lo decide cada formulario (la dote y la clase).
 */
@Component({
    selector: 'app-prerrequisitos-conservados',
    templateUrl: './prerrequisitos-conservados.component.html',
    styleUrls: ['./prerrequisitos-conservados.component.sass'],
    standalone: false,
})
export class PrerrequisitosConservadosComponent {
    @Input() conservados: readonly PrerrequisitoConservadoVisible[] = [];
    /** Chips con borde y fondo (los de la dote, como sus demás chips de prerrequisitos). */
    @Input() conBorde = false;
    /** El índice del que se quita. */
    @Output() quitar = new EventEmitter<number>();
}
