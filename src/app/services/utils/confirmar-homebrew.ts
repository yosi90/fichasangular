import Swal from 'sweetalert2';

/** El aviso de siempre cuando una elección se salta una regla del sistema y vuelve homebrew el personaje. */
export const AVISO_HOMEBREW_REGLA_SALTADA = '<strong>Esta elección está saltándose una regla importante del sistema. El personaje quedará marcado como Homebrew y será una rareza excepcional en el mundo.</strong>';

/**
 * Confirma elegir algo que vuelve homebrew la ficha (un elemento homebrew, una plantilla sin sus requisitos, una edad sin
 * ajuste para un PJ…): sus motivos en lista y el aviso de homebrew de siempre (guía de nuevo personaje, «Homebrew»:
 * avisar antes, no después). `true` si acepta. La usan la creación y la adquisición de una plantilla (sesiones, fase 7).
 */
export async function confirmarEleccionHomebrew(titulo: string, motivos: string[]): Promise<boolean> {
    const lista = motivos.map((motivo) => `<li>${motivo}</li>`).join('');
    const confirmacion = await Swal.fire({
        icon: 'warning',
        title: titulo,
        html: `<ul style="text-align:left; margin-top: 4px;">${lista}</ul>${AVISO_HOMEBREW_REGLA_SALTADA}`,
        showCancelButton: true,
        confirmButtonText: 'Aceptar y elegir',
        cancelButtonText: 'Cancelar',
        target: document.body,
        heightAuto: false,
        scrollbarPadding: false,
    });
    return confirmacion.isConfirmed;
}
