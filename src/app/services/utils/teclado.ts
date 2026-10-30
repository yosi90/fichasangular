/**
 * Si Enter en `target` ya hace algo propio (escribir, pulsar un botón o un enlace, elegir en una lista o en un menú),
 * los modales no lo usan para confirmar.
 */
export function esElementoInteractivoParaEnter(target: HTMLElement | null): boolean {
    if (!target)
        return false;
    if (target.isContentEditable)
        return true;

    const selectorBloqueado = 'input, textarea, select, button, a, [role="button"], [role="checkbox"], [role="option"], [role="listbox"], [role="menuitem"], .cdk-overlay-pane';
    return !!target.closest(selectorBloqueado);
}

/**
 * El índice al que lleva una tecla en una fila de pestañas (patrón `tablist`): las flechas pasan a la siguiente o la
 * anterior dando la vuelta, Inicio a la primera y Fin a la última. `null` si la tecla no mueve o no hay pestañas.
 */
export function destinoEnTablist(tecla: string, actual: number, total: number): number | null {
    if (total < 1)
        return null;
    if (tecla === 'ArrowRight')
        return (actual + 1) % total;
    if (tecla === 'ArrowLeft')
        return (actual - 1 + total) % total;
    if (tecla === 'Home')
        return 0;
    if (tecla === 'End')
        return total - 1;
    return null;
}
