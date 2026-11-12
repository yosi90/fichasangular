import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { toInt } from './normalizacion';

/*
 * La corrección de la ficha (roadmap de sesiones, fase 6; guía `docs/publica/SESIONES_FRONT.md`, «Modificar y corregir»):
 * la web parte de la `entrada` de la sesión abierta y manda a `PUT /personajes/{id}/ficha` esa misma ficha con lo
 * corregido. Lo que sale del motor (las puntuaciones recalculadas desde su base, los PG con la Constitución retroactiva)
 * va como diferencia sobre lo guardado, y lo que se quita, quitado de la `entrada` y de las elecciones de sus niveles: así
 * no se pierde nada de lo que el motor no sabe leer de la ficha (orígenes, extras, competencias, la mascota…).
 */

/** Las claves de las características en la ficha del alta (en minúsculas, «fuerza») y en el motor («Fuerza»). */
export const CARACTERISTICAS_DEL_ALTA: ReadonlyArray<readonly [string, Caracteristica]> = CARACTERISTICAS
    .map((key) => [key.toLowerCase(), key] as const);

export interface DoteDeLaFicha {
    idDote: number;
    idExtra: number;
    origen: string;
}

export interface CambiosCorreccion {
    /** Lo que cambia cada puntuación (la del motor después menos la de antes). */
    caracteristicas: Partial<Record<Caracteristica, number>>;
    /** Los PG totales tras la corrección; `null`, los de antes. */
    puntosGolpe: number | null;
    dotesQuitadas: DoteDeLaFicha[];
    /** Las dotes que dejan de cumplir sus prerrequisitos y se mantienen (homebrew: `requisitos_dote`). */
    dotesMantenidas: number[];
    idiomasQuitados: number[];
    conjurosQuitados: Array<{ idConjuro: number; idClase: number | null; }>;
}

/** Quita el primer elemento que cumple `es` (y devuelve si lo ha quitado). */
function quitarPrimero<T>(lista: T[] | undefined, es: (x: T) => boolean): boolean {
    const i = (lista ?? []).findIndex(es);
    if (i < 0)
        return false;
    lista!.splice(i, 1);
    return true;
}

/** Las elecciones de los niveles guardados sin la de ese tipo y ese elemento (la primera, de abajo arriba). */
function quitarEleccion(ficha: PersonajeCreateRequestDto, tipo: string, idElemento: number, idExtra: number | null): void {
    for (const nivel of [...(ficha.niveles ?? [])].reverse()) {
        if (quitarPrimero(nivel.elecciones, (e) => e.tipo === tipo && toInt(e.idElemento) === toInt(idElemento)
            && (idExtra === null || toInt(e.idExtra) === toInt(idExtra))))
            return;
    }
}

/** La ficha de la corrección: la `entrada` con lo corregido. */
export function fichaDeLaCorreccion(entrada: PersonajeCreateRequestDto, cambios: CambiosCorreccion): PersonajeCreateRequestDto {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(entrada));
    CARACTERISTICAS_DEL_ALTA.forEach(([clave, key]) => {
        const delta = toInt(cambios.caracteristicas[key]);
        const guardada = (ficha.caracteristicas as any)?.[clave];
        if (delta !== 0 && guardada && !guardada.perdido)
            guardada.valor = toInt(guardada.valor) + delta;
    });
    if (cambios.puntosGolpe !== null)
        ficha.personaje.puntosGolpe = Math.max(0, toInt(cambios.puntosGolpe));

    const col: any = ficha.colecciones = { ...(ficha.colecciones ?? {}) };
    col.dotes = [...(col.dotes ?? [])];
    cambios.dotesQuitadas.forEach((d) => {
        quitarPrimero(col.dotes, (x: any) => toInt(x?.idDote) === d.idDote && toInt(x?.idExtra) === d.idExtra && `${x?.origen ?? ''}` === d.origen)
            || quitarPrimero(col.dotes, (x: any) => toInt(x?.idDote) === d.idDote && toInt(x?.idExtra) === d.idExtra);
        quitarEleccion(ficha, 'dote', d.idDote, d.idExtra);
    });
    col.idiomas = [...(col.idiomas ?? [])];
    cambios.idiomasQuitados.forEach((id) => {
        quitarPrimero(col.idiomas, (x: any) => toInt(x?.idIdioma) === toInt(id));
        quitarEleccion(ficha, 'idioma', id, null);
    });
    col.conjurosConocidos = [...(col.conjurosConocidos ?? [])];
    cambios.conjurosQuitados.forEach((c) => {
        quitarPrimero(col.conjurosConocidos, (x: any) => !x?.copiado && toInt(x?.idConjuro) === c.idConjuro
            && (c.idClase === null || toInt(x?.idClase) === c.idClase));
        quitarEleccion(ficha, 'conjuro', c.idConjuro, c.idClase);
    });

    const decisiones = [...(ficha.decisionesHomebrew ?? [])];
    cambios.dotesMantenidas.forEach((id) => {
        if (!decisiones.some((d) => d.tipo === 'requisitos_dote' && toInt(d.idElemento) === toInt(id)))
            decisiones.push({ tipo: 'requisitos_dote', idElemento: toInt(id) });
    });
    // Las que mantenía y ya no tiene (se ha quitado la dote): fuera, o la API las rechaza por no ser del personaje.
    const vigentes = decisiones.filter((d) => d.tipo !== 'requisitos_dote'
        || col.dotes.some((x: any) => toInt(x?.idDote) === toInt(d.idElemento)));
    if (vigentes.length > 0 || ficha.decisionesHomebrew !== undefined)
        ficha.decisionesHomebrew = vigentes;
    return ficha;
}
