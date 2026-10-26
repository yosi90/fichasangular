/**
 * Preferencias de la persona en este navegador (`localStorage`), separadas por cuenta como pide
 * `ecosistema-kit/CAMBIO_DE_CUENTA.md`. El entorno ya lo separa el origen: desarrollo (`rol.dev.yosiftware.es`) y
 * producción (`rol.yosiftware.es`) tienen cada uno su `localStorage`. Si el navegador no deja guardar (modo privado,
 * datos bloqueados), se sigue sin la preferencia.
 */

/** La clave de una preferencia para esa cuenta («rol.voz.ultima.<id>»), o `null` sin cuenta. */
export function clavePorCuenta(prefijo: string, cuenta: string | null | undefined): string | null {
    const id = `${cuenta ?? ''}`.trim();
    return id ? `${prefijo}.${id}` : null;
}

export function leerPreferenciaLocal(clave: string | null): string | null {
    if (!clave)
        return null;
    try {
        return localStorage.getItem(clave);
    } catch {
        return null;
    }
}

/** Guarda la preferencia; con `null`, la olvida. */
export function guardarPreferenciaLocal(clave: string | null, valor: string | null): void {
    if (!clave)
        return;
    try {
        if (valor === null)
            localStorage.removeItem(clave);
        else
            localStorage.setItem(clave, valor);
    } catch {
        // Sin almacenamiento, la próxima vez se vuelve a la opción por defecto.
    }
}
