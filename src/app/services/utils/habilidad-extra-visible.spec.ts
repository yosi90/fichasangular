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
