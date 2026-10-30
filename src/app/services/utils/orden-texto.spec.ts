import { compararTexto, porNombre, textosDistintos } from './orden-texto';

describe('compararTexto', () => {
    it('ordena en español sin distinguir tildes ni mayúsculas', () => {
        expect(['zorro', 'Ágil', 'beta', 'alfa', 'Ñu', 'nube'].sort(compararTexto))
            .toEqual(['Ágil', 'alfa', 'beta', 'nube', 'Ñu', 'zorro']);
        expect(compararTexto('Élfico', 'elfico')).toBe(0);
    });

    it('da el mismo resultado que el localeCompare que sustituye', () => {
        const pares: [string, string][] = [['Ágil', 'agil'], ['b', 'Á'], ['Ñu', 'nube'], ['abc', 'abd'], ['', 'a']];
        for (const [a, b] of pares)
            expect(Math.sign(compararTexto(a, b))).withContext(`${a}/${b}`)
                .toBe(Math.sign(a.localeCompare(b, 'es', { sensitivity: 'base' })));
    });

    it('lo que no viene cuenta como texto vacío', () => {
        expect(compararTexto(null, '')).toBe(0);
        expect(compararTexto(undefined, 'a')).toBeLessThan(0);
    });
});

describe('porNombre', () => {
    it('ordena por Nombre', () => {
        const lista = [{ Nombre: 'Orco' }, { Nombre: 'élfico' }, { Nombre: 'Enano' }, { Nombre: null }];
        expect(lista.sort(porNombre).map((x) => x.Nombre)).toEqual([null, 'élfico', 'Enano', 'Orco']);
    });
});

describe('textosDistintos', () => {
    it('da los textos recortados, sin vacíos ni repetidos, en el orden de compararTexto', () => {
        const lista = [{ M: ' Manual del jugador ' }, { M: 'Ármas' }, { M: null }, { M: '' }, { M: 'Manual del jugador' }, { M: 'alfa' }];
        expect(textosDistintos(lista, (x) => x.M)).toEqual(['alfa', 'Ármas', 'Manual del jugador']);
    });

    it('sin lista, ninguno', () => {
        expect(textosDistintos(null, (x: unknown) => x)).toEqual([]);
    });
});
