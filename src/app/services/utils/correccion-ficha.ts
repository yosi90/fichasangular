import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { PersonajeCreateNivelEleccionDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { toInt } from './normalizacion';
import { DecisionHomebrew } from './personaje-oficialidad';
import { aplicarHabilidadesDelMotor, aplicarModificadoresDelMotor } from './subida-nivel';

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

/**
 * La clave de una dote de la ficha (su id, su extra y su origen), para ver cuáles de `dotesSinSusPrerrequisitos` son
 * nuevas. La usan el motor (`dotesSinPrerrequisitosTrasPerder`), el reciclaje y la raza mutada adquirida.
 */
export function claveDoteDeLaFicha(d: DoteDeLaFicha): string {
    return `${d.idDote}|${d.idExtra}|${d.origen}`;
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
    /** Las dotes elegidas en el hueco de una quitada (`registrarDoteEnLugarDe`), con su nivel en `niveles` (o `null`). */
    dotesNuevas?: Array<DoteDeLaFicha & { indiceNivel: number | null; }>;
    /** Los datos de la ficha que se corrigen tal cual (alineamiento, deidad, edad, altura, peso). */
    personaje?: Partial<Pick<PersonajeCreateRequestDto['personaje'], 'idAlineamiento' | 'deidad' | 'edad' | 'altura' | 'peso'>>;
    /** Las tiradas de PG corregidas: el índice del nivel en `niveles` y la nueva (solo el máster; sin campaña, el dueño). */
    tiradasPg?: Record<number, number>;
    /**
     * Los rangos repartidos otra vez (nivel a nivel): el cuerpo del motor antes y después del reparto (la diferencia de
     * cada habilidad, como la subida) y los rangos de cada nivel, en el orden de `niveles`.
     */
    rangos?: {
        antes: PersonajeCreateRequestDto;
        despues: PersonajeCreateRequestDto;
        porNivel: PersonajeCreateNivelEleccionDto[][];
    } | null;
    /**
     * Las decisiones homebrew que se vuelven a calcular con lo corregido (las de estos `tipos` se sustituyen por
     * `decisiones`): el alineamiento de una clase, la edad, la altura y el peso.
     */
    decisionesRecalculadas?: { tipos: string[]; decisiones: DecisionHomebrew[]; } | null;
    /**
     * El cuerpo del motor al cargar la ficha y con lo corregido: lo que cambian los modificadores y los rangos varios (lo
     * que daba la dote quitada y lo que da la que entra en su hueco), que la API guarda tal cual.
     */
    motor?: { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; } | null;
}

/**
 * Quita de `lista` el primer elemento que cumple `es` y lo devuelve (o `undefined` si no hay ninguno). Lo usan la
 * corrección, la pérdida de nivel (`perder-nivel.ts`) y el reciclaje (`reciclaje.ts`).
 */
export function sacarPrimero<T>(lista: T[] | undefined, es: (x: T) => boolean): T | undefined {
    const i = (lista ?? []).findIndex(es);
    return i < 0 ? undefined : lista!.splice(i, 1)[0];
}

/**
 * Quita de `dotes` (las `colecciones.dotes` de la ficha) la dote con ese id y extra, con -1 (sin extra) y 0 («Elegir»)
 * como el mismo, como la API (`extra_comparable`): primero la que tiene ese `origen`, si se da, y si no, la primera; con
 * `cualquierExtra`, en último caso, la primera con ese id. La devuelve (o `undefined`). Lo usan la corrección, la pérdida
 * de nivel y el reciclaje.
 */
export function sacarDoteDeLaFicha(dotes: any[] | undefined, idDote: number, idExtra: number, origen?: string | null,
    opciones: { cualquierExtra?: boolean; } = {}): any | undefined {
    const extra = (valor: unknown) => Math.max(0, toInt(valor));
    const es = (x: any) => toInt(x?.idDote) === toInt(idDote) && extra(x?.idExtra) === extra(idExtra);
    return (origen ? sacarPrimero(dotes, (x) => es(x) && `${x?.origen ?? ''}` === origen) : undefined)
        ?? sacarPrimero(dotes, es)
        ?? (opciones.cualquierExtra ? sacarPrimero(dotes, (x) => toInt(x?.idDote) === toInt(idDote)) : undefined);
}

/** Las elecciones de los niveles guardados sin la de ese tipo y ese elemento (la primera, de abajo arriba). */
function quitarEleccion(ficha: PersonajeCreateRequestDto, tipo: string, idElemento: number, idExtra: number | null): void {
    for (const nivel of [...(ficha.niveles ?? [])].reverse()) {
        if (sacarPrimero(nivel.elecciones, (e) => e.tipo === tipo && toInt(e.idElemento) === toInt(idElemento)
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
        sacarDoteDeLaFicha(col.dotes, d.idDote, d.idExtra, d.origen);
        quitarEleccion(ficha, 'dote', d.idDote, d.idExtra);
    });
    (cambios.dotesNuevas ?? []).forEach((d) => {
        col.dotes.push({ idDote: d.idDote, idExtra: d.idExtra, origen: d.origen });
        const nivel = d.indiceNivel !== null ? ficha.niveles?.[d.indiceNivel] : undefined;
        if (nivel)
            nivel.elecciones = [...(nivel.elecciones ?? []), { tipo: 'dote', idElemento: d.idDote, idExtra: d.idExtra, origen: d.origen }];
    });
    Object.entries(cambios.personaje ?? {}).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null)
            (ficha.personaje as any)[clave] = valor;
    });
    Object.entries(cambios.tiradasPg ?? {}).forEach(([indice, tirada]) => {
        const nivel = ficha.niveles?.[toInt(indice)];
        if (nivel?.pg && !nivel.pg.maximo)
            nivel.pg = { ...nivel.pg, tirada: toInt(tirada) };
    });
    if (cambios.motor) {
        aplicarModificadoresDelMotor(ficha, cambios.motor.antes, cambios.motor.despues);
        // Con los rangos repartidos otra vez, sus varios van con ellos (abajo).
        if (!cambios.rangos)
            aplicarHabilidadesDelMotor(ficha, cambios.motor.antes, cambios.motor.despues, true);
    }
    if (cambios.rangos) {
        aplicarHabilidadesDelMotor(ficha, cambios.rangos.antes, cambios.rangos.despues);
        (ficha.niveles ?? []).forEach((nivel, i) => {
            nivel.elecciones = [...(nivel.elecciones ?? []).filter((e) => e.tipo !== 'rangos'), ...(cambios.rangos!.porNivel[i] ?? [])];
        });
    }
    col.idiomas = [...(col.idiomas ?? [])];
    cambios.idiomasQuitados.forEach((id) => {
        sacarPrimero(col.idiomas, (x: any) => toInt(x?.idIdioma) === toInt(id));
        quitarEleccion(ficha, 'idioma', id, null);
    });
    col.conjurosConocidos = [...(col.conjurosConocidos ?? [])];
    cambios.conjurosQuitados.forEach((c) => {
        sacarPrimero(col.conjurosConocidos, (x: any) => !x?.copiado && toInt(x?.idConjuro) === c.idConjuro
            && (c.idClase === null || toInt(x?.idClase) === c.idClase));
        quitarEleccion(ficha, 'conjuro', c.idConjuro, c.idClase);
    });

    const recalculadas = cambios.decisionesRecalculadas;
    const decisiones = [...(ficha.decisionesHomebrew ?? [])
        .filter((d) => !recalculadas || !recalculadas.tipos.includes(d.tipo)), ...(recalculadas?.decisiones ?? [])];
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
