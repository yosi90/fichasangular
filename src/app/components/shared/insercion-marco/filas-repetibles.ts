import { AbstractControl } from '@angular/forms';

/** Una fila de una lista que es un elemento de un catálogo (un subtipo, una aptitud, una dote…), con su `uid` de fila. */
export interface FilaNombrada {
    uid: string;
    id: number;
    nombre: string;
}

/**
 * Quitar una fila de una lista repetible (guía de inserciones, «Filas repetibles»): si era la última, queda una fila
 * vacía, para que el bloque siga disponible. Devuelve una lista nueva.
 */
export function quitarFila<T>(filas: readonly T[], indice: number, vacia: () => T): T[] {
    const resto = filas.filter((_, posicion) => posicion !== indice);
    return resto.length > 0 ? resto : [vacia()];
}

let filasCreadas = 0;

/**
 * El `uid` de una fila repetible nueva (`<prefijo>-<n>`), para su `trackBy` y para llevarle el error de la API: único en
 * toda la sesión, así que vale también para las filas que una pantalla reparte con sus piezas (`<app-equipo-magia>`).
 */
export function uidDeFila(prefijo: string): string {
    filasCreadas += 1;
    return `${prefijo}-${filasCreadas}`;
}

/** Alterna un control de sí o no (el chip «Oficial» y los demás chips de estado) y lo marca como tocado. */
export function alternarControl(control: AbstractControl): void {
    control.setValue(control.value !== true);
    control.markAsDirty();
    control.markAsTouched();
}

/** Deja vacío el control de un buscador que se puede quitar (su ✕, `buscador-con-quitar`) y lo marca como cambiado. */
export function vaciarControl(control: AbstractControl): void {
    control.setValue(null);
    control.markAsDirty();
}

/** Pone en un control el id elegido en `<app-catalogo-buscador>` (el manual, un tipo…) y lo marca como tocado. */
export function elegirEnControl(control: AbstractControl, id: number): void {
    control.setValue(id);
    control.markAsDirty();
    control.markAsTouched();
}
