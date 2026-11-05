import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { TipoRol } from 'src/app/services/utils/iconos-rol';
import { OpcionCatalogo, nombreDeOpcion } from '../catalogo-buscador/catalogo-buscador.component';

/** Una fila de una lista de catálogo: el id del elemento, su nombre (si ya se sabe) y su `uid` si se repite el id. */
export interface FilaDeLista {
    id: number;
    nombre?: string;
    uid?: string;
}

/**
 * Una lista de elementos de un catálogo dentro de una inserción (guía de inserciones, «Filas repetibles»): una tarjeta con
 * su título y su cuenta («Rasgos · 3»), un estado vacío con borde discontinuo, una fila por elemento con su nombre y su
 * botón de quitar, y el «Añadir…» de `<app-catalogo-buscador [anadir]>`. Lo que lleva cada fila además del nombre (el
 * extra de una dote, los rangos de una habilidad…) lo pone quien la usa con un `<ng-template let-fila>` dentro.
 *
 * La lista no guarda nada: avisa de lo que se añade (`anadir`, el id elegido) y de lo que se quita (`quitar`, la fila), y
 * quien la usa cambia sus filas. Hito 9 del roadmap de inserciones: tipos de criatura, subtipos y deidades.
 */
@Component({
    selector: 'app-lista-de-catalogo',
    templateUrl: './lista-de-catalogo.component.html',
    styleUrls: ['./lista-de-catalogo.component.sass'],
    standalone: false,
})
export class ListaDeCatalogoComponent {
    @Input() titulo = '';
    @Input() icono: TipoRol | null = null;
    @Input() filas: readonly FilaDeLista[] = [];
    @Input() opciones: readonly OpcionCatalogo[] = [];
    @Input() vacio = 'Ninguno.';
    @Input() textoAnadir = 'Añadir';
    /** Si un mismo elemento puede ir en dos filas (una dote con extras distintos): entonces el «Añadir…» no lo esconde. */
    @Input() repetibles = false;
    @Input() deshabilitado = false;
    @Input() error: string | null = null;
    @Output() anadir = new EventEmitter<number>();
    @Output() quitar = new EventEmitter<FilaDeLista>();

    /** Lo que va en cada fila después del nombre, con la fila como `$implicit`. */
    @ContentChild(TemplateRef) plantillaFila: TemplateRef<{ $implicit: FilaDeLista; }> | null = null;

    get excluir(): number[] {
        return this.repetibles ? [] : this.filas.map((fila) => fila.id);
    }

    nombreDe(fila: FilaDeLista): string {
        return `${fila.nombre ?? ''}`.trim() || nombreDeOpcion(this.opciones, fila.id);
    }

    porClave(_: number, fila: FilaDeLista): string | number {
        return fila.uid ?? fila.id;
    }
}

/**
 * La lista con el elemento `id` de `opciones` añadido al final (si existe y, sin `repetible`, si no estaba ya). Las listas
 * de ids de las inserciones lo usan al recibir `anadir` de `<app-lista-de-catalogo>`.
 */
export function anadirALista<T extends FilaDeLista>(filas: readonly T[], opciones: readonly OpcionCatalogo[], id: number,
    nueva: (opcion: OpcionCatalogo) => T, repetible: boolean = false): T[] {
    const opcion = opciones.find((item) => item.id === id);
    if (!opcion || (!repetible && filas.some((fila) => fila.id === id)))
        return [...filas];
    return [...filas, nueva(opcion)];
}

/** Las filas de una lista de ids con su nombre, para enseñarlas mientras llega el catálogo. */
export function filasDeIds(elementos: readonly { Id?: unknown; Nombre?: unknown; }[] | null | undefined): FilaDeLista[] {
    return (elementos ?? []).map((elemento) => ({ id: Math.trunc(Number(elemento?.Id)), nombre: `${elemento?.Nombre ?? ''}` }))
        .filter((fila) => fila.id > 0);
}
