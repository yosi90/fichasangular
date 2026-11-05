/**
 * El correo sin confirmar (kit 1.80, ecosistema-kit/ACCESO.md «El correo sin confirmar»): mientras la cuenta no lo
 * confirma, lo social de la plataforma (amistades, seguir, chat, espacios, denuncias) responde `403
 * correo_sin_confirmar`. Las páginas propias de Rol que llaman a esas rutas (amistades, perfiles, campañas en los
 * espacios) ofrecen confirmarlo ahí mismo y, si se confirma, repiten la petición una vez.
 */
export const CORREO_SIN_CONFIRMAR = 'correo_sin_confirmar';

export const MENSAJE_CORREO_SIN_CONFIRMAR = 'Confirma tu correo para usar la parte social de Yosiftware: amistades, chat y campañas compartidas.';

/** Quien abre la ventana del código: `PlatformSessionService.ofrecerConfirmarCorreo`. */
export interface ConfirmadorDeCorreo {
    ofrecerConfirmarCorreo(porAccion: boolean): Promise<boolean>;
}

export function esCorreoSinConfirmar(error: unknown): boolean {
    return `${(error as { code?: unknown } | null)?.code ?? ''}`.trim() === CORREO_SIN_CONFIRMAR;
}

/**
 * Hace la petición; si responde `correo_sin_confirmar`, ofrece confirmar el correo y, si se confirma, la repite una vez
 * (con el token nuevo, que `intento` vuelve a pedir). Si no, deja pasar el error. `porAccion`: la ha pulsado la persona
 * (no es una carga), así que la ventana se abre aunque antes dijera «Ahora no».
 */
export async function conCorreoConfirmado<T>(confirmador: ConfirmadorDeCorreo, porAccion: boolean, intento: () => Promise<T>): Promise<T> {
    try {
        return await intento();
    } catch (error) {
        if (!esCorreoSinConfirmar(error) || !(await confirmador.ofrecerConfirmarCorreo(porAccion)))
            throw error;
        return intento();
    }
}
