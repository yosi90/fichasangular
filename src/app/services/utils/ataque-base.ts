import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { toInt } from 'src/app/services/utils/normalizacion';

/**
 * El ataque base con sus ataques adicionales (Manual del jugador, cap. 3, tabla 3-1): con +6 se gana un segundo ataque
 * a −5, con +11 un tercero y con +16 un cuarto; como en las tablas de las clases, «+6/+1». Sirve también para la suma de
 * varias clases, los DG raciales y las plantillas. Quien lea el número toma el primero (`primerEntero`).
 */

export const PASO_ATAQUE_ADICIONAL = 5;
export const MAXIMO_ATAQUES_POR_ATAQUE_BASE = 4;

export function textoAtaqueBase(ataqueBase: number): string {
    const base = toInt(ataqueBase);
    const ataques = [base];
    while (ataques.length < MAXIMO_ATAQUES_POR_ATAQUE_BASE && ataques[ataques.length - 1] - PASO_ATAQUE_ADICIONAL >= 1)
        ataques.push(ataques[ataques.length - 1] - PASO_ATAQUE_ADICIONAL);
    return ataques.map((ataque) => textoConSigno(ataque)).join('/');
}
