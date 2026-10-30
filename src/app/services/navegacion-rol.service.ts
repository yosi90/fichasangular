import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ManualAsociadoDetalle } from '../interfaces/manual-asociado';
import { ManualReferenciaNavegacion } from '../interfaces/manual-referencia-navegacion';

/**
 * Abrir algo en las pestañas desde fuera de ellas: la búsqueda global (Ctrl+K), el menú «Manuales» de la cinta, un enlace
 * a un manual, una entrada del detalle de un manual o la entrada «Dados» del menú lateral. Las pestañas
 * (`TabControlComponent`) son las únicas que lo escuchan y lo abren como si viniera de su listado: `lista` es el nombre
 * con el que se abre el listado («razas», «munición»…), `item` la fila del listado y `texto`, lo que se pone en el
 * buscador del listado al abrirlo. `dados` abre la pestaña «Dados» (una sola: si ya está abierta, va a ella).
 */
export type AperturaRol =
    | { readonly clase: 'detalle'; readonly lista: string; readonly item: unknown }
    | { readonly clase: 'personaje'; readonly id: number }
    | { readonly clase: 'listado'; readonly lista: string; readonly texto?: string }
    | { readonly clase: 'manual'; readonly manual: ManualAsociadoDetalle }
    | { readonly clase: 'referencia-manual'; readonly referencia: ManualReferenciaNavegacion }
    | { readonly clase: 'dados' };

@Injectable({
    providedIn: 'root'
})
export class NavegacionRolService {
    private readonly aperturasSubject = new Subject<AperturaRol>();
    readonly aperturas$: Observable<AperturaRol> = this.aperturasSubject.asObservable();

    abrir(apertura: AperturaRol): void {
        this.aperturasSubject.next(apertura);
    }
}
