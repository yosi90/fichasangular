import { resolverExtraHabilidadVisible } from './habilidad-extra-visible';

describe('resolverExtraHabilidadVisible', () => {
    it('devuelve Elegir cuando idExtra es 0 y está permitido', () => {
        const result = resolverExtraHabilidadVisible({
            extra: '',
            idExtra: 0,
            allowIdZeroAsChoose: true,
        });

        expect(result).toBe('Elegir');
    });

    it('no muestra nada cuando idExtra es -1', () => {
        const result = resolverExtraHabilidadVisible({
            extra: 'Elegir',
            idExtra: -1,
            allowIdZeroAsChoose: true,
            soportaExtra: true,
        });

        expect(result).toBe('');
    });

    it('no muestra el texto "-1" como extra', () => {
        const result = resolverExtraHabilidadVisible({
            extra: '-1',
            idExtra: 0,
            allowIdZeroAsChoose: false,
            soportaExtra: false,
        });

        expect(result).toBe('');
    });
});

describe('resolverExtraHabilidadVisible con el contrato sin relleno', () => {
    it('un Id_extra null (sin extra) no se lee como el 0 de «Elegir»', () => {
        expect(resolverExtraHabilidadVisible({ extra: null, idExtra: null, soportaExtra: true, allowIdZeroAsChoose: true })).toBe('');
    });

    it('con Extra_comodin «elegir» o «cualquiera» manda la marca; con null, el id y el texto', () => {
        expect(resolverExtraHabilidadVisible({ extra: 'Elegir', idExtra: 0, extraComodin: 'elegir' })).toBe('Elegir');
        expect(resolverExtraHabilidadVisible({ extra: 'Cualquiera', idExtra: 13, extraComodin: 'cualquiera' })).toBe('Cualquiera');
        expect(resolverExtraHabilidadVisible({ extra: null, idExtra: null, extraComodin: null, allowIdZeroAsChoose: true })).toBe('');
        expect(resolverExtraHabilidadVisible({ extra: ' Arcano ', idExtra: 3, extraComodin: null })).toBe('Arcano');
    });

    it('sin marca (el borrador de la creación), «Elegir» sigue saliendo del texto', () => {
        expect(resolverExtraHabilidadVisible({ extra: 'elegir', idExtra: 0 })).toBe('Elegir');
    });
});
