import { AbstractControl } from '@angular/forms';

/**
 * Quitar una fila de una lista repetible (guía de inserciones, «Filas repetibles»): si era la última, queda una fila
 * vacía, para que el bloque siga disponible. Devuelve una lista nueva.
 */
export function quitarFila<T>(filas: readonly T[], indice: number, vacia: () => T): T[] {
    const resto = filas.filter((_, posicion) => posicion !== indice);
    return resto.length > 0 ? resto : [vacia()];
}

/** Alterna un control de sí o no (el chip «Oficial» y los demás chips de estado) y lo marca como tocado. */
export function alternarControl(control: AbstractControl): void {
    control.setValue(control.value !== true);
    control.markAsDirty();
    control.markAsTouched();
}
