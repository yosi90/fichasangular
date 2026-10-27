import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { Clase } from 'src/app/interfaces/clase';
import { modificadorCaracteristica } from 'src/app/services/utils/caracteristicas';
import { normalizarTexto, toBoolean, toInt, toNumber } from 'src/app/services/utils/normalizacion';

// Las reglas de la magia que la creación aplica antes de guardar (la ficha guardada trae sus cifras de la API, que
// calcula lo mismo en `utils/conjuros_diarios.py`):
// - Para lanzar o aprender un conjuro hace falta la característica de lanzamiento a 10 + su nivel (MJ cap. 1).
// - Conjuros adicionales por característica alta (MJ tabla 1-1) y puntos de poder adicionales (Manual de psiónica
//   expandido, tabla 2-1).
// - El nivel de lanzador de una clase que lo divide (paladín y explorador: la mitad de su nivel; MJ cap. 3).

/** La puntuación de la característica de lanzamiento de la clase (`Mod_salv_conjuros`), o `null` si no tiene. */
export function puntuacionLanzamiento(
    personaje: Partial<Record<Caracteristica, number>> | null | undefined,
    clase: Clase | null | undefined
): number | null {
    const nombre = normalizarTexto(clase?.Mod_salv_conjuros ?? '');
    const clave = CARACTERISTICAS.find((caracteristica) => normalizarTexto(caracteristica) === nombre);
    if (!clave)
        return null;
    const valor = Number(personaje?.[clave]);
    return Number.isFinite(valor) && valor > 0 ? Math.trunc(valor) : null;
}

/** El modificador de una puntuación (`modificadorCaracteristica`); sin característica (`null`), +0. */
export function modificadorDePuntuacion(puntuacion: number | null): number {
    return puntuacion === null ? 0 : modificadorCaracteristica(puntuacion);
}

/**
 * Si un mago puede especializarse en la escuela, o un psiónico elegir la disciplina: lo dicen sus datos (Universal no;
 * MJ cap. 3).
 */
export function esEspecializable(escuelaODisciplina: { Id?: number; Especializable?: boolean; } | null | undefined): boolean {
    return toNumber(escuelaODisciplina?.Id) > 0 && toBoolean(escuelaODisciplina?.Especializable);
}

/**
 * Cuántas escuelas prohíbe el mago que se especializa en esa escuela, o cuántas disciplinas el psiónico de esa disciplina:
 * lo dicen sus datos, no su nombre (2; la adivinación, 1, MJ cap. 3; ninguna en el Manual de psiónica expandido).
 */
export function prohibidasAlEspecializarse(
    escuelaODisciplina: { Prohibidas_al_especializarse?: number; } | null | undefined
): number {
    return Math.max(0, toInt(escuelaODisciplina?.Prohibidas_al_especializarse));
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

/**
 * El nivel de conjuro de una clave de las tablas de la clase (`Conjuros_diarios`, `Conjuros_conocidos_nivel_a_nivel`):
 * «Nivel_3» o «3» dan 3; lo que no nombra un nivel, -1.
 */
export function nivelDeClaveConjuro(clave: string): number {
    const texto = `${clave ?? ''}`.trim();
    if (texto.length < 1)
        return -1;
    const directo = Number(texto);
    if (Number.isFinite(directo))
        return Math.trunc(directo);
    const encontrado = texto.match(/nivel[_\s-]*(\d+)/i);
    return encontrado ? Math.trunc(Number(encontrado[1])) : -1;
}

/**
 * Los conjuros al día de una fila de la tabla de la clase (`Conjuros_diarios`) por nivel de conjuro; -1 (o lo que no es
 * un número) es sin acceso. Las claves que no nombran un nivel se descartan.
 */
export function conjurosDiariosPorNivel(mapa: Record<string, unknown> | null | undefined): Record<number, number> {
    const resultado: Record<number, number> = {};
    Object.entries(mapa ?? {}).forEach(([clave, valor]) => {
        const nivel = nivelDeClaveConjuro(clave);
        if (nivel >= 0)
            resultado[nivel] = toInt(valor, -1);
    });
    return resultado;
}
