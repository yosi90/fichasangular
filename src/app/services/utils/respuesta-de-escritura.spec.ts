import { leerRespuestaDeEscritura } from './respuesta-de-escritura';

describe('leerRespuestaDeEscritura', () => {
    it('lee el message y el id de su clave', () => {
        expect(leerRespuestaDeEscritura({ message: 'Dote creada', idDote: '12', dote: {} }, 'idDote'))
            .toEqual({ message: 'Dote creada', id: 12 });
    });

    it('sin message, el de por defecto', () => {
        expect(leerRespuestaDeEscritura({ idRaza: 3 }, 'idRaza', 'Raza creada')).toEqual({ message: 'Raza creada', id: 3 });
        expect(leerRespuestaDeEscritura({ idRaza: 3 }, 'idRaza').message).toBe('');
    });

    it('sin un id válido, falla', () => {
        expect(() => leerRespuestaDeEscritura({ message: 'ok' }, 'idConjuro')).toThrowError('La API no devolvió un idConjuro válido.');
        expect(() => leerRespuestaDeEscritura({ idConjuro: 0 }, 'idConjuro')).toThrowError();
        expect(() => leerRespuestaDeEscritura(null, 'idConjuro')).toThrowError();
    });
});
