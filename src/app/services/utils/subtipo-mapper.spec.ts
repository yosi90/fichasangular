import { normalizeSubtipoDetalle, normalizeSubtipoRefArray, normalizeSubtipoResumen } from './subtipo-mapper';

describe('subtipo-mapper', () => {
    it('normaliza referencias legacy desde string, array y objeto indexado', () => {
        const desdeString = normalizeSubtipoRefArray('Fuego| Frio |');
        const desdeArray = normalizeSubtipoRefArray([
            { Id: 1, Nombre: 'Fuego' },
            { i: 2, n: 'Frio' },
        ]);
        const desdeObjeto = normalizeSubtipoRefArray({
            a: { Id: 3, Nombre: 'Aire' },
            b: { Id: 4, Nombre: 'Tierra' },
        });

        expect(desdeString).toEqual([
            { Id: 0, Nombre: 'Fuego' },
            { Id: 0, Nombre: 'Frio' },
        ]);
        expect(desdeArray).toEqual([
            { Id: 1, Nombre: 'Fuego' },
            { Id: 2, Nombre: 'Frio' },
        ]);
        expect(desdeObjeto.map(s => s.Id)).toEqual([3, 4]);
    });

    it('normaliza resumen soportando contrato corto', () => {
        const resumen = normalizeSubtipoResumen({
            i: 9,
            n: 'Acuatico',
            d: 'Respira bajo el agua',
            ma: { Id: 2, Nombre: 'MM', Pagina: 23 },
            he: 1,
            o: 0,
        });

        expect(resumen.Id).toBe(9);
        expect(resumen.Nombre).toBe('Acuatico');
        expect(resumen.Manual.Nombre).toBe('MM');
        expect(resumen.Heredada).toBeTrue();
        expect(resumen.Oficial).toBeFalse();
    });

    it('normaliza detalle con defaults seguros', () => {
        const detalle = normalizeSubtipoDetalle({
            Id: 10,
            Nombre: 'Angelical',
            Manual: { Id: 1, Nombre: 'Manual', Pagina: 11 },
            Movimientos: { Correr: 30 },
            Habilidades: {
                Base: [{ Id_habilidad: 1, Habilidad: 'Avistar', Cantidad: 2 }],
                Custom: [{ Id_habilidad: 9, Habilidad: 'Custom', Cantidad: 4 }],
            },
            Sortilegas: [{
                Conjuro: { Id: 99, Nombre: 'Luz' },
                Nivel_lanzador: 1,
                Usos_diarios: '3/dia',
            }],
        });

        expect(detalle.Id).toBe(10);
        expect(detalle.Nombre).toBe('Angelical');
        expect(detalle.Movimientos.Correr).toBe(30);
        expect(detalle.Habilidades.Base[0].Habilidad).toBe('Avistar');
        expect(detalle.Habilidades.Custom[0].Cantidad).toBe(4);
        expect(detalle.Sortilegas[0].Conjuro.Nombre).toBe('Luz');
        expect(Array.isArray(detalle.Dotes)).toBeTrue();
    });
});
