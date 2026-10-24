import { HttpErrorResponse } from '@angular/common/http';
import { ElementoDeCatalogo, errorDeCatalogo } from './error-catalogo';

const RAZA: ElementoDeCatalogo = { singular: 'raza', plural: 'razas', femenino: true };
const ESPECIAL: ElementoDeCatalogo = { singular: 'especial', plural: 'especiales', femenino: false };

function http(status: number, error: unknown = null): HttpErrorResponse {
    return new HttpErrorResponse({ status, error });
}

describe('errorDeCatalogo', () => {
    it('da una frase por estado, en femenino', () => {
        const casos: [number, string][] = [
            [400, 'Los datos de la raza no son válidos.'],
            [401, 'Tu sesión no es válida para crear razas.'],
            [403, 'No tienes permisos para crear razas.'],
            [404, 'No se ha encontrado la raza o algo a lo que apunta.'],
            [409, 'Ya existe una raza con ese nombre.'],
            [500, 'No se ha podido crear la raza.'],
            [502, 'No se ha podido crear la raza.'],
            [0, 'No se ha podido crear la raza.'],
        ];
        for (const [status, frase] of casos)
            expect(errorDeCatalogo(http(status), 'crear', RAZA).message).withContext(`${status}`).toBe(frase);
    });

    it('da una frase por estado, en masculino y al actualizar', () => {
        const casos: [number, string][] = [
            [400, 'Los datos del especial no son válidos.'],
            [401, 'Tu sesión no es válida para actualizar especiales.'],
            [403, 'No tienes permisos para actualizar especiales.'],
            [404, 'No se ha encontrado el especial o algo a lo que apunta.'],
            [409, 'Ya existe un especial con ese nombre.'],
            [503, 'No se ha podido actualizar el especial.'],
        ];
        for (const [status, frase] of casos)
            expect(errorDeCatalogo(http(status), 'actualizar', ESPECIAL).message).withContext(`${status}`).toBe(frase);
    });

    it('pone detrás el mensaje de la API: primero su error, luego su message', () => {
        expect(errorDeCatalogo(http(403, { error: 'Falta razas.create', message: 'otro' }), 'crear', RAZA).message)
            .toBe('No tienes permisos para crear razas. Falta razas.create');
        expect(errorDeCatalogo(http(409, { error: '  ', message: 'Nombre repetido' }), 'crear', RAZA).message)
            .toBe('Ya existe una raza con ese nombre. Nombre repetido');
        expect(errorDeCatalogo(http(500, '  Caída  '), 'crear', RAZA).message)
            .toBe('No se ha podido crear la raza. Caída');
        expect(errorDeCatalogo(http(400, { detail: 'no se usa' }), 'crear', RAZA).message)
            .toBe('Los datos de la raza no son válidos.');
    });

    it('lo que no es una respuesta HTTP se devuelve tal cual', () => {
        const propio = new Error('Debes iniciar sesión para gestionar razas');
        expect(errorDeCatalogo(propio, 'crear', RAZA)).toBe(propio);
        expect(errorDeCatalogo('raro', 'actualizar', ESPECIAL).message).toBe('No se ha podido actualizar el especial.');
    });
});
