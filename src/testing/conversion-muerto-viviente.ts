/*
 * Un guerrero enano que se convierte en engendro vampírico (*Libris Mortis*, pág. 34; el ejemplo del libro): su `entrada`
 * (la de `GET /personajes/{id}/sesiones/{numero}`, con sus niveles y lo que eligió en ellos) y lo que arma el motor de la
 * creación antes y después de la raza mutada y del 1.er nivel de la clase de monstruo. Para las pruebas de la conversión
 * (`conversion-muerto-viviente.spec.ts` y la pantalla de la raza mutada).
 */
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';

export const GUERRERO = 7;
export const ENGENDRO = 482;
export const EXPULSAR = 31;
export const REPRENDER = 32;
export const SUSTITUIDOS = [{ Especial: { Id: EXPULSAR, Nombre: 'Expulsar muertos vivientes' }, Especial_nuevo: { Id: REPRENDER, Nombre: 'Reprender muertos vivientes' } }];

export const claseGuerrero: any = {
    Id: GUERRERO, Nombre: 'Guerrero', Puntos_habilidad: { Id: 1, Valor: 2 }, Conjuros: {},
    Desglose_niveles: [1, 2, 3, 4, 5].map((ab) => ({ Nivel: ab, Ataque_base: `+${ab}`, Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' }, Dotes: [], Especiales: [] })),
};

export function caracteristicas(con: number, fuerza = 16): any {
    const c = (valor: number) => ({ valor, minimo: 0, perdido: false });
    return { fuerza: c(fuerza), destreza: c(12), constitucion: c(con), inteligencia: c(10), sabiduria: c(10), carisma: c(8) };
}

export function nivel(n: number, tirada: number, elecciones: any[] = []): any {
    return { idClase: GUERRERO, nivelClase: n, pg: { tirada, maximo: n === 1 }, elecciones, ordenConocido: true };
}

/** El guerrero enano con Con 14 (+2): sus niveles con su tirada, la dote de 1.er nivel y la aptitud de expulsar. */
export function enanoGuerrero(niveles: any[], puntosGolpe: number): PersonajeCreateRequestDto {
    return {
        personaje: { nombre: 'Tordek', idRaza: 2, idTipoCriatura: 11, ataqueBase: `+${niveles.length}`, puntosGolpe } as any,
        caracteristicas: caracteristicas(14),
        tamano: { idTamano: 5, origen: 'Web' },
        modificadores: {} as any,
        colecciones: {
            clases: [{ idClase: GUERRERO, nivel: niveles.length }],
            dotes: [{ idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 5, idExtra: 0, origen: 'Nivel 3' }],
            especiales: [{ idEspecial: EXPULSAR, idExtra: 0 }], idiomas: [{ idIdioma: 1 }, { idIdioma: 4 }], dominios: [], conjurosConocidos: [],
            subtipos: [{ idSubtipo: 3 }],
            habilidades: { base: [{ idHabilidad: 40, idExtra: 0, clasea: true, rangos: 8 }], custom: [] },
        } as any,
        niveles,
    } as PersonajeCreateRequestDto;
}

/** Lo que arma el motor antes de la raza y el nivel nuevo (tras perder el nivel) y después. */
export function cuerpos(): { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; } {
    const antes: any = {
        personaje: { idRaza: 2, idTipoCriatura: 11, ataqueBase: '+4' },
        caracteristicas: caracteristicas(14),
        colecciones: {
            dotes: [{ idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 5, idExtra: 0, origen: 'Nivel 3' }],
            especiales: [{ idEspecial: EXPULSAR, idExtra: 0 }], idiomas: [{ idIdioma: 1 }, { idIdioma: 4 }], subtipos: [{ idSubtipo: 3 }],
            habilidades: { base: [{ idHabilidad: 40, idExtra: 0, clasea: true, rangos: 6 }], custom: [] },
        },
    };
    const despues: any = JSON.parse(JSON.stringify(antes));
    despues.personaje = { idRaza: 1009, idTipoCriatura: 13, ataqueBase: '+4' };
    // La raza: Fue +2, sin Constitución (el tipo muerto viviente), el agrandado; la mutación «sustituye» los idiomas (al crear).
    despues.caracteristicas.fuerza.valor = 18;
    despues.caracteristicas.constitucion = { valor: 0, minimo: 0, perdido: true };
    despues.colecciones.subtipos = [{ idSubtipo: 3 }, { idSubtipo: 50 }];
    despues.colecciones.idiomas = [{ idIdioma: 1 }];
    // El 1.er nivel del engendro: su dote, su aptitud y sus rangos; y la aptitud ya sustituida.
    despues.colecciones.dotes.push({ idDote: 77, idExtra: 0, origen: 'Engendro vampírico nivel 1' });
    despues.colecciones.especiales = [{ idEspecial: REPRENDER, idExtra: 0 }, { idEspecial: 3087, idExtra: 0 }];
    despues.colecciones.habilidades.base[0].rangos = 10;
    return { antes, despues };
}
