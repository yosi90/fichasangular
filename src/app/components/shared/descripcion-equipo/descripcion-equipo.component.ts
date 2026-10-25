import { Component, Input } from '@angular/core';
import { OrigenDescripcion } from 'src/app/interfaces/equipo';
import { ayudaOrigenDescripcion, textoOrigenDescripcion } from 'src/app/services/utils/equipo-texto';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

/** Si hay algo que enseñar de la descripción de una entrada del equipo: su texto o que está traducida. */
export function descripcionEquipoVisible(entrada: { Descripcion?: string | null; Traducido?: boolean | null } | null | undefined): boolean {
    return tieneTextoVisible(entrada?.Descripcion) || !!entrada?.Traducido;
}

/**
 * La descripción de una entrada del equipo con su origen: un resumen propio o el texto del SRD (nunca el texto del
 * libro; `docs/publica/OBJETOS_FRONT.md`), y «Traducido» con el nombre original. El manual y la página van en la
 * cabecera del detalle, para quien quiera el texto completo.
 *
 * Va dentro de la sección «Descripción» de la ficha común de los detalles, que la pantalla pinta solo si
 * `descripcionEquipoVisible`:
 * `<app-ficha-seccion titulo="Descripción" *ngIf="…"><app-descripcion-equipo …></app-descripcion-equipo></app-ficha-seccion>`.
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
        return descripcionEquipoVisible({ Descripcion: this.descripcion, Traducido: this.traducido });
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

    get tieneNombreOriginal(): boolean {
        return tieneTextoVisible(this.nombreOriginal);
    }
}
