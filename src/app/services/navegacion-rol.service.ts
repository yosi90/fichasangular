import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, distinctUntilChanged } from 'rxjs';
import { ManualAsociadoDetalle } from '../interfaces/manual-asociado';
import { ManualReferenciaNavegacion } from '../interfaces/manual-referencia-navegacion';
import { normalizarTexto } from './utils/normalizacion';

/**
 * Abrir algo en las pestañas desde fuera de ellas: la búsqueda global (Ctrl+K), el menú «Manuales» de la cinta, un enlace
 * a un manual, una entrada del detalle de un manual, las entradas «Dados» y «Personajes» del menú lateral o «Nueva …» de
 * la cabecera de un listado (en B). Las pestañas (`TabControlComponent`) son las únicas que lo escuchan y lo abren como
 * si viniera de su listado: `lista` es el nombre con el que se abre el listado («razas», «munición»…), `item` la fila
 * del listado y `texto`, lo que se pone en el buscador del listado al abrirlo. `dados`, `novedades` y `personajes` van a
 * su pestaña (una sola: si ya está abierta, va a ella); `insercion`, a la de «Nueva …» de esa lista.
 */
export type AperturaRol =
    | { readonly clase: 'detalle'; readonly lista: string; readonly item: unknown }
    | { readonly clase: 'personaje'; readonly id: number }
    | { readonly clase: 'listado'; readonly lista: string; readonly texto?: string }
    | { readonly clase: 'insercion'; readonly lista: string }
    | { readonly clase: 'manual'; readonly manual: ManualAsociadoDetalle }
    | { readonly clase: 'referencia-manual'; readonly referencia: ManualReferenciaNavegacion }
    | { readonly clase: 'dados' }
    | { readonly clase: 'novedades' }
    | { readonly clase: 'personajes' };

/** Las claves de las pestañas fijas que el menú lateral marca cuando se están viendo. */
export const CLAVE_PESTANA_PERSONAJES = 'base:personajes';
export const CLAVE_PESTANA_DADOS = 'base:dados';

/** La clave de la pestaña de un listado («listado:detalles:materiales-especiales»): una por lista y operación. */
export function claveDePestanaListado(lista: string, operacion: string): string {
    const tipo = normalizarTexto(lista).replace(/\s+/g, '-');
    const accion = normalizarTexto(operacion).replace(/\s+/g, '-');
    return `listado:${accion}:${tipo}`;
}

@Injectable({
    providedIn: 'root'
})
export class NavegacionRolService {
    private readonly aperturasSubject = new Subject<AperturaRol>();
    readonly aperturas$: Observable<AperturaRol> = this.aperturasSubject.asObservable();
    private readonly pestanaActivaSubject = new BehaviorSubject<string>(CLAVE_PESTANA_PERSONAJES);
    /** La clave de la pestaña que se está viendo: la anuncian las pestañas y la lee el menú por catálogo de B. */
    readonly pestanaActiva$: Observable<string> = this.pestanaActivaSubject.pipe(distinctUntilChanged());

    abrir(apertura: AperturaRol): void {
        this.aperturasSubject.next(apertura);
    }

    anunciarPestanaActiva(clave: string): void {
        this.pestanaActivaSubject.next(clave);
    }
}
