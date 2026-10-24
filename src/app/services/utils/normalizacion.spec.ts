import { toBoolean } from './normalizacion';

describe('toBoolean', () => {
    it('es sí con true, 1 y los textos de sí, sin distinguir mayúsculas ni espacios alrededor', () => {
        for (const valor of [true, 1, '1', 'true', 'TRUE', ' True ', 'sí', 'SÍ', 'si', 'Si', 'yes', ' YES '])
            expect(toBoolean(valor)).withContext(JSON.stringify(valor)).toBeTrue();
    });

    it('es no con todo lo demás', () => {
        for (const valor of [false, 0, 2, -1, 0.5, '0', '2', 'false', 'no', 'No', '', ' ', 'verdadero', 's', {}, [], NaN])
            expect(toBoolean(valor)).withContext(JSON.stringify(valor)).toBeFalse();
    });

    it('sin valor (null o undefined) es no, o el valor por defecto que se pida', () => {
        expect(toBoolean(null)).toBeFalse();
        expect(toBoolean(undefined)).toBeFalse();
        expect(toBoolean(null, true)).toBeTrue();
        expect(toBoolean(undefined, true)).toBeTrue();
        expect(toBoolean('', true)).toBeFalse();
        expect(toBoolean(0, true)).toBeFalse();
    });
});
