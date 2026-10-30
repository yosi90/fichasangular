import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Abrir un elemento de rol, un personaje o un listado desde fuera de las pestañas (la búsqueda global, Ctrl+K). Las
 * pestañas (`TabControlComponent`) lo escuchan y lo abren como si viniera de su listado: `lista` es el nombre con el
 * que se abre el listado («razas», «munición»…) y `item`, la fila del listado.
 */
export type AperturaRol =
    | { readonly clase: 'detalle'; readonly lista: string; readonly item: unknown }
    | { readonly clase: 'personaje'; readonly id: number }
    | { readonly clase: 'listado'; readonly lista: string };

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
