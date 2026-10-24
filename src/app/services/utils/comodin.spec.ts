import { esFilaComodin, esNombreComodin, leerComodin } from './comodin';

describe('comodines', () => {
    it('leerComodin solo reconoce «elegir» y «cualquiera»; lo demás (y lo que no está en la RTDB) es null', () => {
        expect(leerComodin('elegir')).toBe('elegir');
        expect(leerComodin('cualquiera')).toBe('cualquiera');
        for (const valor of [null, undefined, '', 'Elegir', 'otro', 0])
            expect(leerComodin(valor)).withContext(`${valor}`).toBeNull();
    });

    it('esFilaComodin mira la marca Comodin de la fila, no su id ni su nombre', () => {
        expect(esFilaComodin({ Comodin: 'cualquiera' })).toBeTrue();
        expect(esFilaComodin({ Comodin: null })).toBeFalse();
        expect(esFilaComodin({ Id: 0, Nombre: 'Cualquiera' } as any)).toBeFalse();
        expect(esFilaComodin(undefined)).toBeFalse();
    });

    it('esNombreComodin: manda la marca de la API; sin marca (el borrador), el texto', () => {
        expect(esNombreComodin({ Nombre: 'Cualquiera', Comodin: 'cualquiera' }, 'cualquiera')).toBeTrue();
        expect(esNombreComodin({ Nombre: 'Cualquiera', Comodin: null }, 'cualquiera')).toBeFalse();
        expect(esNombreComodin({ Nombre: 'Cualquiera' }, 'cualquiera')).toBeTrue();
        expect(esNombreComodin({ Nombre: 'Evocación' }, 'cualquiera')).toBeFalse();
    });
});
