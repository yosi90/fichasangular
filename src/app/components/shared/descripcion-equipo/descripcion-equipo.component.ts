import { Component, Input } from '@angular/core';
import { OrigenDescripcion } from 'src/app/interfaces/equipo';
import { ayudaOrigenDescripcion, textoOrigenDescripcion } from 'src/app/services/utils/equipo-texto';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

/**
 * La descripción de una entrada del equipo con su origen: un resumen propio o el texto del SRD (nunca el texto del
 * libro; `docs/publica/OBJETOS_FRONT.md`). El manual y la página van en el detalle, para quien quiera el texto completo.
 */
@Component({
    selector: 'app-descripcion-equipo',
    templateUrl: './descripcion-equipo.component.html',
    styleUrls: ['./descripcion-equipo.component.sass'],
    standalone: false
})
export class DescripcionEquipoComponent {
    @Input() descripcion: string | null | undefined = '';
    @Input() origen: OrigenDescripcion = 'propia';
    @Input() nombreOriginal: string | null | undefined = null;
    @Input() traducido = false;

    get visible(): boolean {
        return tieneTextoVisible(this.descripcion) || this.traducido;
    }

    get textoOrigen(): string {
        return textoOrigenDescripcion(this.origen);
    }

    get ayudaOrigen(): string {
        return ayudaOrigenDescripcion(this.origen);
    }

    get tieneDescripcion(): boolean {
        return tieneTextoVisible(this.descripcion);
    }
}
