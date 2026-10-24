import { conOpcionSinValor } from './opcion-sin-valor';

describe('conOpcionSinValor', () => {
    const sinVuelo = { Id: 0, Nombre: 'No vuela' };

    it('pone delante la opción del editor si el catálogo ya no trae la fila 0', () => {
        expect(conOpcionSinValor([{ Id: 1, Nombre: 'Torpe' }], sinVuelo)).toEqual([sinVuelo, { Id: 1, Nombre: 'Torpe' }]);
        expect(conOpcionSinValor(null, sinVuelo)).toEqual([sinVuelo]);
    });

    it('no la repite si el catálogo aún trae la fila 0 (una caché sin renovar)', () => {
        const cache = [{ Id: 0, Nombre: 'No vuela' }, { Id: 1, Nombre: 'Torpe' }];
        expect(conOpcionSinValor(cache, { Id: 0, Nombre: 'Otro' })).toBe(cache);
    });
});
