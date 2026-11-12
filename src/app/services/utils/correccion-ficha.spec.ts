import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { CambiosCorreccion, fichaDeLaCorreccion } from './correccion-ficha';

/*
 * La ficha que manda la corrección (fase 6 de las sesiones): la `entrada` con lo corregido. Lo que sale del motor (las
 * puntuaciones, los PG) va como diferencia sobre lo guardado; lo que se quita sale también de las elecciones de su nivel.
 */
describe('fichaDeLaCorreccion (la corrección de la ficha, fase 6)', () => {
    const entrada = (): PersonajeCreateRequestDto => ({
        personaje: { nombre: 'Brunilda', puntosGolpe: 12, idRaza: 3 } as any,
        caracteristicas: {
            fuerza: { valor: 15, minimo: 0, perdido: false },
            destreza: { valor: 12, minimo: 0, perdido: false },
            constitucion: { valor: 0, minimo: 0, perdido: true },
            inteligencia: { valor: 10, minimo: 0, perdido: false },
            sabiduria: { valor: 10, minimo: 0, perdido: false },
            carisma: { valor: 8, minimo: 0, perdido: false },
        } as any,
        tamano: { idTamano: 3 } as any,
        colecciones: {
            dotes: [
                { idDote: 2, idExtra: 0, origen: 'Dote de nivel 1' },
                { idDote: 9, idExtra: 4, origen: 'Guerrero nivel 2' },
            ],
            idiomas: [{ idIdioma: 1, origen: 'Raza' }, { idIdioma: 5, origen: 'Inteligencia' }],
            conjurosConocidos: [
                { idConjuro: 60, idClase: 8, origen: 'Hechicero nivel 1' },
                { idConjuro: 60, idClase: 8, copiado: true },
            ],
        } as any,
        niveles: [
            { idClase: 7, nivelClase: 1, elecciones: [{ tipo: 'dote', idElemento: 2, idExtra: 0 }, { tipo: 'idioma', idElemento: 5 }] },
            { idClase: 7, nivelClase: 2, elecciones: [{ tipo: 'dote', idElemento: 9, idExtra: 4 }] },
        ],
        decisionesHomebrew: [{ tipo: 'alineamiento_raza', idElemento: 3 }],
    });
    const sinCambios = (): CambiosCorreccion => ({
        caracteristicas: {}, puntosGolpe: null, dotesQuitadas: [], dotesMantenidas: [], idiomasQuitados: [], conjurosQuitados: [],
    });

    it('sin cambios, la misma entrada (y no la toca)', () => {
        const original = entrada();
        expect(fichaDeLaCorreccion(original, sinCambios())).toEqual(entrada());
        expect(original).toEqual(entrada());
    });

    it('las puntuaciones como diferencia sobre lo guardado (una perdida no cambia) y los PG del motor', () => {
        const ficha = fichaDeLaCorreccion(entrada(), { ...sinCambios(), caracteristicas: { Fuerza: 2, Constitucion: 1 }, puntosGolpe: 14 });
        expect((ficha.caracteristicas as any).fuerza.valor).toBe(17);
        expect((ficha.caracteristicas as any).constitucion.valor).toBe(0);
        expect(ficha.personaje.puntosGolpe).toBe(14);
    });

    it('lo que se quita sale de la ficha y de la elección de su nivel; los copiados al libro se quedan', () => {
        const ficha = fichaDeLaCorreccion(entrada(), {
            ...sinCambios(),
            dotesQuitadas: [{ idDote: 9, idExtra: 4, origen: 'Guerrero nivel 2' }],
            idiomasQuitados: [5],
            conjurosQuitados: [{ idConjuro: 60, idClase: 8 }],
        });
        expect((ficha.colecciones as any).dotes).toEqual([{ idDote: 2, idExtra: 0, origen: 'Dote de nivel 1' }]);
        expect((ficha.colecciones as any).idiomas).toEqual([{ idIdioma: 1, origen: 'Raza' }]);
        expect((ficha.colecciones as any).conjurosConocidos).toEqual([{ idConjuro: 60, idClase: 8, copiado: true }]);
        expect(ficha.niveles![0].elecciones).toEqual([{ tipo: 'dote', idElemento: 2, idExtra: 0 }]);
        expect(ficha.niveles![1].elecciones).toEqual([]);
    });

    it('una dote que se mantiene sin sus prerrequisitos es una decisión homebrew; si luego se quita, la decisión también', () => {
        const mantenida = fichaDeLaCorreccion(entrada(), { ...sinCambios(), dotesMantenidas: [9] });
        expect(mantenida.decisionesHomebrew).toEqual([{ tipo: 'alineamiento_raza', idElemento: 3 }, { tipo: 'requisitos_dote', idElemento: 9 }]);
        const quitada = fichaDeLaCorreccion(mantenida, { ...sinCambios(), dotesQuitadas: [{ idDote: 9, idExtra: 4, origen: 'Guerrero nivel 2' }] });
        expect(quitada.decisionesHomebrew).toEqual([{ tipo: 'alineamiento_raza', idElemento: 3 }]);
    });
});
