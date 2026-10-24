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
