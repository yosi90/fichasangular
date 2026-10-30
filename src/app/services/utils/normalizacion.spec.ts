import { normalizarTexto, redondearCentesimas, textosUnicos, toBoolean, toInt, toPositiveInt } from './normalizacion';

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

describe('normalizarTexto', () => {
    it('quita tildes, mayúsculas y espacios a los lados', () => {
        expect(normalizarTexto('  Élfico  Alto ')).toBe('elfico  alto');
        expect(normalizarTexto(null)).toBe('');
    });

    it('con juntarEspacios, los espacios seguidos cuentan como uno (los buscadores)', () => {
        expect(normalizarTexto('  Élfico \t  Alto ', true)).toBe('elfico alto');
    });
});

describe('toInt', () => {
    it('trunca y usa el valor por defecto si no es un número finito', () => {
        expect(toInt('3.9')).toBe(3);
        expect(toInt(-2.5)).toBe(-2);
        expect(toInt('x', 7)).toBe(7);
        expect(toInt(Infinity)).toBe(0);
    });
});

describe('toPositiveInt', () => {
    it('trunca y se queda con los enteros mayores que 0', () => {
        expect(toPositiveInt(7)).toBe(7);
        expect(toPositiveInt('12')).toBe(12);
        expect(toPositiveInt(3.9)).toBe(3);
    });

    it('da null con 0, negativos, vacíos y lo que no es un número', () => {
        for (const valor of [0, 0.5, -1, '', ' ', null, undefined, 'abc', NaN, Infinity])
            expect(toPositiveInt(valor)).withContext(JSON.stringify(valor)).toBeNull();
    });
});

describe('textosUnicos', () => {
    it('quita los vacíos y los repetidos sin mirar tildes ni mayúsculas, y conserva la primera forma', () => {
        expect(textosUnicos(['Elfo', '', 'elfo ', 'Semiélfo', 'semielfo', '  '])).toEqual(['Elfo', 'Semiélfo']);
    });
});

describe('redondearCentesimas', () => {
    it('redondea a centésimas y lee como 0 lo que no es un número finito', () => {
        expect(redondearCentesimas(10 / 3)).toBe(3.33);
        expect(redondearCentesimas(0.125)).toBe(0.13);
        expect(redondearCentesimas(Number.NaN)).toBe(0);
        expect(redondearCentesimas(Number.POSITIVE_INFINITY)).toBe(0);
    });
});
