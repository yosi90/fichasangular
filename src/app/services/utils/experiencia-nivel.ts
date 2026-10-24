import { toInt } from 'src/app/services/utils/normalizacion';

/**
 * Experiencia mínima para tener `nivel` (Manual del jugador): cada nivel pide 1000 × el nivel anterior más que el
 * previo, así que el nivel 1 empieza en 0, el 2 en 1000, el 3 en 3000… Un nivel no válido cuenta como 0.
 */
export function experienciaParaNivel(nivel: number): number {
    const n = Math.max(0, toInt(nivel));
    return n > 0 ? 1000 * n * (n - 1) / 2 : 0;
}
