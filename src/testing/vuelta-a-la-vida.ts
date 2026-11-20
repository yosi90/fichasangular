/*
 * Un muerto viviente de clase de monstruo al que se le devuelve la vida (*Libris Mortis*, pág. 35; contrato en
 * `personajes.md`, «Devolver la vida a un muerto viviente»): el guerrero enano 4 / engendro vampírico 1 del ejemplo del
 * contrato (el guerrero enano 5 que se convirtió), su `entrada` (la de `GET /personajes/{id}/sesiones/{numero}`, sin
 * Constitución, con su puntuación guardada) y lo que arma el motor de la creación antes y después de devolverle la raza de
 * antes. Para las pruebas de `vuelta-a-la-vida.spec.ts` y la pantalla.
 */
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { caracteristicas, ENGENDRO, EXPULSAR, GUERRERO, REPRENDER } from './conversion-muerto-viviente';

export { claseGuerrero, ENGENDRO, EXPULSAR, GUERRERO, REPRENDER, SUSTITUIDOS } from './conversion-muerto-viviente';

/** El clérigo y la aptitud de 1.er nivel del engendro. */
export const CLERIGO = 2;
export const APTITUD_ENGENDRO = 3087;
/** Las dos aptitudes de expulsar que la raza pasa a reprender (en `rol_dev`, las dos van a la misma). */
export const EXPULSAR_O_REPRENDER = 30;
export const SUSTITUIDOS_DOS = [
    { Especial: { Id: EXPULSAR_O_REPRENDER, Nombre: 'Expulsar o reprender muertos vivientes' }, Especial_nuevo: { Id: REPRENDER, Nombre: 'Reprender muertos vivientes' } },
    { Especial: { Id: EXPULSAR, Nombre: 'Expulsar muertos vivientes' }, Especial_nuevo: { Id: REPRENDER, Nombre: 'Reprender muertos vivientes' } },
];

/** El engendro vampírico de la tabla: 1.er nivel con DG, ataque +0 y Voluntad +2. */
export const claseEngendro: any = {
    Id: ENGENDRO, Nombre: 'Engendro vampírico', Puntos_habilidad: { Id: 1, Valor: 4 }, Conjuros: {}, Nivel_max_claseo: 8, Progresion_obligatoria: true,
    Desglose_niveles: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        Nivel: n, Ataque_base: `+${n < 3 ? 0 : n < 7 ? 1 : 2}`, Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
        Dotes: [], Especiales: [], Dg: [1, 3, 5, 7].includes(n), Dote: [1, 6].includes(n),
    })),
};

/** Un clérigo que expulsa muertos vivientes a 1.er nivel (la aptitud de su tabla). */
export const claseClerigo: any = {
    Id: CLERIGO, Nombre: 'Clérigo', Puntos_habilidad: { Id: 1, Valor: 2 }, Conjuros: {},
    Desglose_niveles: [1, 2, 3, 4].map((n) => ({
        Nivel: n, Ataque_base: `+${n - 1}`, Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+2' }, Dotes: [],
        Especiales: n === 1 ? [{ Especial: { Id: EXPULSAR_O_REPRENDER, Nombre: 'Expulsar o reprender muertos vivientes' }, Id_extra: 0 }] : [],
    })),
};

export function nivelDe(idClase: number, n: number, tirada: number, elecciones: any[] = [], ordenConocido = true): any {
    return { idClase, nivelClase: n, pg: { tirada, maximo: idClase !== ENGENDRO && n === 1 }, elecciones, ordenConocido };
}

/** El 1.er nivel del engendro, con lo que se eligió en él (su dote, su aptitud y sus rangos). */
export function nivelEngendro(tirada = 7): any {
    return nivelDe(ENGENDRO, 1, tirada, [
        { tipo: 'dote', idElemento: 77, idExtra: 0, origen: 'Engendro vampírico nivel 1' },
        { tipo: 'especial', idElemento: APTITUD_ENGENDRO, idExtra: 0 },
        { tipo: 'rangos', idElemento: 40, idExtra: 0, valor: 4 },
    ]);
}

/**
 * El guerrero enano 4 / engendro vampírico 1 (tiradas 10, 6, 7 y 4 y el d12 7): 34 PG sin Constitución, su puntuación
 * guardada (14), la Fuerza de la raza (18), el agrandado y reprender en lugar de expulsar. `guerrero`, sus niveles de
 * guerrero; `engendro`, los del engendro (con sus tiradas).
 */
export function enanoEngendro(guerrero = [10, 6, 7, 4], engendro: number[] = [7], puntosGolpe = 34): PersonajeCreateRequestDto {
    const con = { valor: 14, minimo: 0, perdido: true };
    return {
        personaje: { nombre: 'Tordek', idRaza: 1009, idRazaBase: 2, idTipoCriatura: 13, ataqueBase: `+${guerrero.length}`, puntosGolpe } as any,
        caracteristicas: { ...caracteristicas(14, 18), constitucion: con },
        tamano: { idTamano: 5, origen: 'Web' },
        modificadores: {} as any,
        colecciones: {
            clases: [
                ...(guerrero.length ? [{ idClase: GUERRERO, nivel: guerrero.length }] : []),
                { idClase: ENGENDRO, nivel: engendro.length },
            ],
            dotes: [
                { idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 5, idExtra: 0, origen: 'Nivel 3', sinPrerrequisitos: true },
                { idDote: 77, idExtra: 0, origen: 'Engendro vampírico nivel 1' },
            ],
            especiales: [{ idEspecial: REPRENDER, idExtra: 0 }, { idEspecial: APTITUD_ENGENDRO, idExtra: 0 }],
            idiomas: [{ idIdioma: 1 }, { idIdioma: 4 }], dominios: [], conjurosConocidos: [],
            subtipos: [{ idSubtipo: 3 }, { idSubtipo: 50 }],
            raciales: [{ idRacial: 900 }, { idRacial: 12 }],
            habilidades: { base: [{ idHabilidad: 40, idExtra: 0, clasea: true, rangos: 10 }], custom: [] },
        } as any,
        niveles: [
            ...guerrero.map((t, i) => nivelDe(GUERRERO, i + 1, t)),
            ...engendro.map((t, i) => i === 0 ? nivelEngendro(t) : nivelDe(ENGENDRO, i + 1, t)),
        ],
    } as PersonajeCreateRequestDto;
}

/**
 * Lo que arma el motor antes de devolverle la vida y después (sin el engendro y con la raza de antes): la Fuerza sin el +2
 * de la raza, el tipo humanoide, sin el agrandado ni el rasgo del engendro (900), sin su dote ni su aptitud y con expulsar
 * otra vez (que la ficha no toma del motor: sale de la tabla de su clase).
 */
export function cuerposDeLaVuelta(): { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; } {
    const antes: any = {
        personaje: { idRaza: 1009, idRazaBase: 2, idTipoCriatura: 13, ataqueBase: '+4' },
        caracteristicas: { ...caracteristicas(14, 18), constitucion: { valor: 0, minimo: 0, perdido: true } },
        colecciones: {
            dotes: [{ idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 5, idExtra: 0, origen: 'Nivel 3' }, { idDote: 77, idExtra: 0, origen: 'Engendro vampírico nivel 1' }],
            especiales: [{ idEspecial: REPRENDER, idExtra: 0 }, { idEspecial: APTITUD_ENGENDRO, idExtra: 0 }],
            idiomas: [{ idIdioma: 1 }, { idIdioma: 4 }], subtipos: [{ idSubtipo: 3 }, { idSubtipo: 50 }],
            raciales: [{ idRacial: 900 }, { idRacial: 12 }],
            habilidades: { base: [{ idHabilidad: 40, idExtra: 0, clasea: true, rangos: 10 }], custom: [] },
        },
    };
    const despues: any = JSON.parse(JSON.stringify(antes));
    despues.personaje = { idRaza: 2, idTipoCriatura: 11, ataqueBase: '+4' };
    despues.caracteristicas.fuerza.valor = 16;
    despues.caracteristicas.constitucion = { valor: 14, minimo: 0, perdido: false };
    despues.colecciones.subtipos = [{ idSubtipo: 3 }];
    despues.colecciones.raciales = [{ idRacial: 12 }];
    despues.colecciones.dotes = [{ idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 5, idExtra: 0, origen: 'Nivel 3' }];
    despues.colecciones.especiales = [{ idEspecial: EXPULSAR, idExtra: 0 }];
    despues.colecciones.habilidades.base[0].rangos = 6;
    return { antes, despues };
}
