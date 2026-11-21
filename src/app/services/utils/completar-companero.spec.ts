import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { companeroCompletado, frasesDeLoQueLeFalta, rangosQueCambian } from './completar-companero';

describe('completar-companero (lo que le falta al compañero, fuera de una subida)', () => {
    const ficha = (rangos: number, dotes: any[] = []) => ({
        personaje: { nombre: 'Faren' }, colecciones: {},
        companero: { nombre: 'Gruk', idMonstruo: 3, dgAdi: 2, habilidades: [{ idHabilidad: 1, idExtra: -1, rangos }], dotes },
    } as unknown as PersonajeCreateRequestDto);

    it('lo que le falta, en frases', () => {
        expect(frasesDeLoQueLeFalta({ puntos: 1, dotes: [6], mejoras: [4, 8], trucos: 2 })).toEqual([
            '1 punto de habilidad', '1 dote (la de su 6.º DG)', '2 mejoras de característica (las de su 4.º y 8.º DG)', '2 trucos adicionales',
        ]);
        expect(frasesDeLoQueLeFalta({ puntos: 0, dotes: [], mejoras: [], trucos: 0 })).toEqual([]);
        expect(frasesDeLoQueLeFalta(null)).toEqual([]);
    });

    it('la ficha que se guarda: solo cambia el compañero, también sus rangos aunque no cambien sus DG', () => {
        const entrada = ficha(4);
        const despues = ficha(5, [{ idDote: 9, idExtra: 0, dg: 6 }]);
        const resultado = companeroCompletado(entrada, ficha(4), despues);
        expect(resultado.companero?.habilidades).toEqual([{ idHabilidad: 1, idExtra: -1, rangos: 5 }]);
        expect(resultado.companero?.dotes).toEqual([{ idDote: 9, idExtra: 0, dg: 6 }]);
        expect(resultado.personaje).toEqual(entrada.personaje);
        // La entrada no se toca.
        expect(entrada.companero?.habilidades?.[0].rangos).toBe(4);
    });

    it('los rangos que cambian, en una fila', () => {
        const nombre = (id: number) => id === 1 ? 'Avistar' : `habilidad ${id}`;
        expect(rangosQueCambian(ficha(4), ficha(5), nombre)).toEqual([{ que: 'Compañero animal (Gruk): rangos', antes: 'Avistar 4', ahora: 'Avistar 5' }]);
        expect(rangosQueCambian(ficha(4), ficha(4), nombre)).toEqual([]);
    });
});
