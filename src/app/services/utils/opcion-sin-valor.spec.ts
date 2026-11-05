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

    it('con otra opción, la compara por su id (la que tiene la entrada cargada)', () => {
        const tipos = [{ Id: 1, Nombre: 'Cortante' }, { Id: 2, Nombre: 'Perforante' }];
        expect(conOpcionSinValor(tipos, { Id: 2, Nombre: 'Perforante' })).toBe(tipos);
        expect(conOpcionSinValor(tipos, { Id: 9, Nombre: 'Rara' })).toEqual([{ Id: 9, Nombre: 'Rara' }, ...tipos]);
    });
});
