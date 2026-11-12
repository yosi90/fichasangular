import { enteroEntre, idNombres, idsUnicosOrdenados, normalizarTexto, redondearCentesimas, textosUnicos, toBoolean, toInt, toIntOrNull, toPositiveInt, idNombre } from './normalizacion';

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

describe('idsUnicosOrdenados', () => {
    it('trunca, quita repetidos y lo que no es un número y ordena de menor a mayor, desde 1', () => {
        expect(idsUnicosOrdenados([3, '1', 2.7, 3, 0, -4, 'abc', null, undefined])).toEqual([1, 2, 3]);
        expect(idsUnicosOrdenados(null)).toEqual([]);
    });

    it('con mínimo 0 conserva el comodín 0', () => {
        expect(idsUnicosOrdenados([5, 0, 0, -1, 'x'], 0)).toEqual([0, 5]);
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

describe('toIntOrNull', () => {
    it('trunca el número, también en texto y con signo', () => {
        expect(toIntOrNull(7)).toBe(7);
        expect(toIntOrNull('12')).toBe(12);
        expect(toIntOrNull(-3.9)).toBe(-3);
        expect(toIntOrNull(0)).toBe(0);
    });

    it('da null si no hay número: un dato que falta no es un 0', () => {
        for (const valor of ['', ' ', null, undefined, 'abc', NaN, Infinity])
            expect(toIntOrNull(valor)).withContext(JSON.stringify(valor)).toBeNull();
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

describe('enteroEntre', () => {
    it('trunca y lleva el entero a sus límites', () => {
        expect(enteroEntre(7.9, 3, 13, 13)).toBe(7);
        expect(enteroEntre('20', 3, 13, 13)).toBe(13);
        expect(enteroEntre(-4, 1, 5, 3)).toBe(1);
    });

    it('lo que no es un número da el valor de reserva, sin acotar', () => {
        expect(enteroEntre('abc', 3, 13, 13)).toBe(13);
        expect(enteroEntre(undefined, 0, 99, null)).toBeNull();
        expect(enteroEntre(null, 1, 5, 3)).toBe(1);
    });
});

describe('idNombre', () => {
    it('con id o con nombre (conIdONombre); sin ninguno de los dos, o si no es un objeto, null', () => {
        const conNombre = { filtro: 'conIdONombre' } as const;
        expect(idNombre({ Id: '4', Nombre: ' Carisma ' }, conNombre)).toEqual({ Id: 4, Nombre: 'Carisma' });
        expect(idNombre({ Nombre: 'Joven' }, conNombre)).toEqual({ Id: 0, Nombre: 'Joven' });
        expect(idNombre({ Id: 0, Nombre: '  ' }, conNombre)).toBeNull();
        expect(idNombre(null, conNombre)).toBeNull();
        expect(idNombre('Carisma', conNombre)).toBeNull();
    });

    it('con id (conId, por defecto): sin id, null aunque traiga nombre', () => {
        expect(idNombre({ Id: 7, Nombre: 'Monje' })).toEqual({ Id: 7, Nombre: 'Monje' });
        expect(idNombre({ Id: 0, Nombre: 'Elegir' })).toBeNull();
        expect(idNombre(undefined)).toBeNull();
    });

    it('es la regla de cada elemento de idNombres', () => {
        const crudos = [{ Id: 3, Nombre: ' Legal ' }, { Id: 0, Nombre: 'Elegir' }, { Id: 0, Nombre: ' ' }, 'x', null];
        (['conId', 'conIdONombre'] as const).forEach((filtro) =>
            expect(idNombres(crudos, { filtro })).toEqual(crudos.map((c) => idNombre(c, { filtro })).filter((c) => c !== null) as any));
    });
});

describe('idNombres', () => {
    const crudos = [
        { Id: 3, Nombre: ' Legal bueno ' },
        { Id: '7', Nombre: 'Caótico neutral' },
        { Id: 0, Nombre: 'Elegir' },
        { Id: 0, Nombre: '  ' },
        { Nombre: 'Sin id' },
        null,
        5,
        'texto',
    ];

    it('por defecto, solo los que tienen id, con el id entero y el nombre sin espacios a los lados', () => {
        expect(idNombres(crudos)).toEqual([
            { Id: 3, Nombre: 'Legal bueno' },
            { Id: 7, Nombre: 'Caótico neutral' },
        ]);
    });

    it('con «conIdONombre», también los que solo traen nombre', () => {
        expect(idNombres(crudos, { filtro: 'conIdONombre' })).toEqual([
            { Id: 3, Nombre: 'Legal bueno' },
            { Id: 7, Nombre: 'Caótico neutral' },
            { Id: 0, Nombre: 'Elegir' },
            { Id: 0, Nombre: 'Sin id' },
        ]);
    });

    it('nunca deja uno sin id ni nombre, ni lo que no es un objeto', () => {
        for (const filtro of ['conId', 'conIdONombre'] as const)
            expect(idNombres(crudos, { filtro }).some((item) => item.Id === 0 && item.Nombre === ''))
                .withContext(filtro).toBeFalse();
    });

    it('lee los valores de un objeto (las listas de la RTDB) salvo con «soloLista»', () => {
        const rtdb = { a: { Id: 1, Nombre: 'Uno' }, b: { Id: 2, Nombre: 'Dos' } };
        expect(idNombres(rtdb)).toEqual([{ Id: 1, Nombre: 'Uno' }, { Id: 2, Nombre: 'Dos' }]);
        expect(idNombres(rtdb, { soloLista: true })).toEqual([]);
        expect(idNombres([{ Id: 1, Nombre: 'Uno' }], { soloLista: true })).toEqual([{ Id: 1, Nombre: 'Uno' }]);
    });

    it('sin lista, una lista vacía', () => {
        for (const valor of [null, undefined, '', 0, 'texto'])
            expect(idNombres(valor)).withContext(JSON.stringify(valor)).toEqual([]);
    });
});
