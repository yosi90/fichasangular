import { Observable, Subject, takeUntil } from 'rxjs';

/**
 * Carga un catálogo de una inserción mientras viva la pantalla (`destruir$`): lo que llega va a `alLlegar` y un fallo se
 * calla (la pantalla sigue con lo que tenga; el selector se queda vacío). Sin fuente (un servicio que no la tiene), nada.
 * Es lo que repetían `nuevo-equipo`, `nueva-plantilla` y `nueva-monstruo` (bugs.md del roadmap de inserciones, revisor
 * del hito 7).
 */
export function cargarCatalogo<T>(fuente: Observable<T> | null | undefined, destruir$: Subject<void>, alLlegar: (valor: T) => void): void {
    fuente?.pipe(takeUntil(destruir$)).subscribe({ next: alLlegar, error: () => undefined });
}
