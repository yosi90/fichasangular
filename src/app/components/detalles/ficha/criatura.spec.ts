import { nivelLanzadorEnCelda, textoNivelLanzadorSortilega, tieneNivelLanzadorFijo } from './criatura';

describe('El nivel de lanzador de una aptitud sortílega', () => {
    it('sin uno fijo (0 o vacío) no se enseña como «0» en ningún detalle', () => {
        for (const sin of [0, '0', '', null, undefined]) {
            expect(tieneNivelLanzadorFijo(sin)).withContext(`${sin}`).toBeFalse();
            expect(textoNivelLanzadorSortilega(sin)).withContext(`${sin}`).toBe('');
            expect(nivelLanzadorEnCelda(sin)).withContext(`${sin}`).toBe('—');
        }
    });

    it('con cifra o con texto, se enseña', () => {
        expect(textoNivelLanzadorSortilega(5)).toBe('NL 5');
        expect(nivelLanzadorEnCelda('5')).toBe('5');
        expect(tieneNivelLanzadorFijo('Igual a sus DG')).toBeTrue();
        expect(textoNivelLanzadorSortilega('Igual a sus DG')).toBe('Nivel de lanzador igual a sus DG');
        expect(nivelLanzadorEnCelda('Igual a sus DG')).toBe('Igual a sus DG');
    });
});
