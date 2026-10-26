import { Clase } from 'src/app/interfaces/clase';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';

// Las reglas de la magia que la creación aplica antes de guardar (la ficha guardada trae sus cifras de la API, que
// calcula lo mismo en `utils/conjuros_diarios.py`):
// - Para lanzar o aprender un conjuro hace falta la característica de lanzamiento a 10 + su nivel (MJ cap. 1).
// - Conjuros adicionales por característica alta (MJ tabla 1-1) y puntos de poder adicionales (Manual de psiónica
//   expandido, tabla 2-1).
// - El nivel de lanzador de una clase que lo divide (paladín y explorador: la mitad de su nivel; MJ cap. 3).

/** Las seis características del borrador de la creación, por su nombre sin tildes. */
export interface PuntuacionesCaracteristicas {
    Fuerza?: number;
    Destreza?: number;
    Constitucion?: number;
    Inteligencia?: number;
    Sabiduria?: number;
    Carisma?: number;
}

const CLAVES: Record<string, keyof PuntuacionesCaracteristicas> = {
    fuerza: 'Fuerza',
    destreza: 'Destreza',
    constitucion: 'Constitucion',
    inteligencia: 'Inteligencia',
    sabiduria: 'Sabiduria',
    carisma: 'Carisma',
};

/** La puntuación de la característica de lanzamiento de la clase (`Mod_salv_conjuros`), o `null` si no tiene. */
export function puntuacionLanzamiento(personaje: PuntuacionesCaracteristicas | null | undefined, clase: Clase | null | undefined): number | null {
    const clave = CLAVES[normalizarTexto(clase?.Mod_salv_conjuros ?? '')];
    if (!clave)
        return null;
    const valor = Number(personaje?.[clave]);
    return Number.isFinite(valor) && valor > 0 ? Math.trunc(valor) : null;
}

/** El modificador de una puntuación: (valor − 10) / 2, hacia abajo. */
export function modificadorDePuntuacion(puntuacion: number | null): number {
    return puntuacion === null ? 0 : Math.floor((puntuacion - 10) / 2);
}

/** Si la característica de lanzamiento llega a 10 + el nivel del conjuro. Sin característica (`null`) no limita. */
export function puedeLanzarNivelConjuro(puntuacion: number | null, nivelConjuro: number): boolean {
    return puntuacion === null || puntuacion >= 10 + nivelConjuro;
}

/** Los conjuros adicionales de la tabla 1-1 del MJ (ninguno en el nivel 0). */
export function conjurosAdicionales(modificador: number, nivelConjuro: number): number {
    if (nivelConjuro < 1 || modificador < nivelConjuro)
        return 0;
    return 1 + Math.floor((modificador - nivelConjuro) / 4);
}

/** Los puntos de poder adicionales de la tabla 2-1 del Manual de psiónica expandido: ⌊mod × nivel / 2⌋. */
export function puntosPoderAdicionales(modificador: number, nivelManifestador: number): number {
    if (modificador <= 0 || nivelManifestador <= 0)
        return 0;
    return Math.floor((modificador * nivelManifestador) / 2);
}

/**
 * El nivel de lanzador de una clase: su progresión (niveles con conjuros más los aumentos de prestigio) o, si la clase
 * lo divide (`Nivel_lanzador_divisor`), su nivel efectivo (nivel de clase más aumentos) entre el divisor, en cuanto
 * empieza a lanzar. Paladín 4: progresión 1, nivel de lanzador 2.
 */
export function nivelLanzadorDeClase(clase: Clase | null | undefined, progresion: number, nivelClase: number, aumentos: number): number {
    if (progresion < 1)
        return 0;
    const divisor = Math.max(1, toInt(clase?.Conjuros?.Nivel_lanzador_divisor, 1));
    if (divisor <= 1)
        return progresion;
    return Math.floor((Math.max(0, nivelClase) + Math.max(0, aumentos)) / divisor);
}
