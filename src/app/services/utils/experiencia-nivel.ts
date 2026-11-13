import { toInt } from 'src/app/services/utils/normalizacion';

/**
 * Experiencia mínima para tener `nivel` (Manual del jugador): cada nivel pide 1000 × el nivel anterior más que el
 * previo, así que el nivel 1 empieza en 0, el 2 en 1000, el 3 en 3000… Un nivel no válido cuenta como 0.
 */
export function experienciaParaNivel(nivel: number): number {
    const n = Math.max(0, toInt(nivel));
    return n > 0 ? 1000 * n * (n - 1) / 2 : 0;
}

/** El nivel que dan unos PX (el más alto cuyos PX mínimos no pasan de ellos; al menos el 1): la inversa, como la API. */
export function nivelPorExperiencia(px: number): number {
    const total = Math.max(0, toInt(px));
    let nivel = 1;
    while (nivel < 1000 && experienciaParaNivel(nivel + 1) <= total)
        nivel++;
    return nivel;
}
