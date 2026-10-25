import { HttpErrorResponse } from '@angular/common/http';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import {
    codigoDeError,
    ERROR_GENERICO_API,
    ERROR_SIN_CONEXION,
    errorDePerfil,
    esErrorDeSesion,
    leerErrorDeApi,
    mensajeDeError,
    textoParaMostrar,
} from './error-api';

function http(status: number, error: unknown = null): HttpErrorResponse {
    return new HttpErrorResponse({ status, error });
}

const CUERPO = {
    error: 'Ya existe una raza con ese nombre.',
    code: 'nombre_duplicado',
    field: 'nombre',
    debug: { message: 'nombre_duplicado', requestId: '9c1f0e5b2a8d4f7e8b3c6a1d2e4f5a6b' },
    message: 'Otro texto de transición',
};

describe('leerErrorDeApi', () => {
    it('lee error, code, field y debug.requestId del formato único', () => {
        expect(leerErrorDeApi(http(409, CUERPO))).toEqual({
            mensaje: 'Ya existe una raza con ese nombre.',
            codigo: 'nombre_duplicado',
            campo: 'nombre',
            requestId: '9c1f0e5b2a8d4f7e8b3c6a1d2e4f5a6b',
            estado: 409,
            deLaApi: true,
        });
    });

    it('nunca lee message ni la primera clave del cuerpo', () => {
        const leido = leerErrorDeApi(http(400, { message: 'Solo message', detail: 'x' }), 'No se ha podido guardar.');

        expect(leido.mensaje).toBe('No se ha podido guardar.');
        expect(leido.deLaApi).toBeFalse();
        expect(leido.codigo).toBe('');
        expect(leido.campo).toBeNull();
        expect(leido.requestId).toBeNull();
    });

    it('sin respuesta (estado 0), el texto de sin conexión', () => {
        const leido = leerErrorDeApi(http(0), 'No se ha podido guardar.');

        expect(leido.mensaje).toBe(ERROR_SIN_CONEXION);
        expect(leido.estado).toBe(0);
        expect(leido.deLaApi).toBeFalse();
    });

    it('con un cuerpo que no es el de la API (el HTML de un proxy, un texto, una lista), el de respaldo', () => {
        expect(leerErrorDeApi(http(502, '<html><body>Bad gateway</body></html>'), 'Respaldo.').mensaje).toBe('Respaldo.');
        expect(leerErrorDeApi(http(500, ['x']), 'Respaldo.').mensaje).toBe('Respaldo.');
        expect(leerErrorDeApi(http(500, { error: '   ', code: 7 })).mensaje).toBe(ERROR_GENERICO_API);
        expect(leerErrorDeApi(http(500, { error: '   ', code: 7 })).codigo).toBe('');
    });
});

describe('textoParaMostrar', () => {
    it('en un fallo del servidor con requestId, añade el código de la incidencia', () => {
        expect(textoParaMostrar({ mensaje: 'Error interno del servidor.', estado: 500, requestId: 'abc' }))
            .toBe('Error interno del servidor. Código de la incidencia: abc');
        expect(textoParaMostrar({ mensaje: 'Sin punto', estado: 503, requestId: 'abc' }))
            .toBe('Sin punto. Código de la incidencia: abc');
    });

    it('en los demás casos, solo el mensaje', () => {
        expect(textoParaMostrar({ mensaje: 'No encontrado.', estado: 404, requestId: 'abc' })).toBe('No encontrado.');
        expect(textoParaMostrar({ mensaje: 'Caído.', estado: 502, requestId: null })).toBe('Caído.');
    });
});

describe('mensajeDeError', () => {
    it('de una respuesta HTTP, el error de la API (con la incidencia si es un 5xx); nunca el texto de Angular', () => {
        expect(mensajeDeError(http(404, CUERPO), 'Respaldo.')).toBe('Ya existe una raza con ese nombre.');
        expect(mensajeDeError(http(500, { error: 'Error interno del servidor.', debug: { requestId: 'r1' } }), 'Respaldo.'))
            .toBe('Error interno del servidor. Código de la incidencia: r1');
        expect(mensajeDeError(http(404), 'Respaldo.')).toBe('Respaldo.');
    });

    it('de un error propio, su message; de un texto, el texto; si no, el de respaldo', () => {
        expect(mensajeDeError(new Error('Propio'), 'Respaldo.')).toBe('Propio');
        expect(mensajeDeError('  Texto  ', 'Respaldo.')).toBe('Texto');
        expect(mensajeDeError(new Error(''), 'Respaldo.')).toBe('Respaldo.');
        expect(mensajeDeError(null, 'Respaldo.')).toBe('Respaldo.');
    });
});

describe('codigoDeError y esErrorDeSesion', () => {
    it('leen el code de la API o el de un error propio', () => {
        expect(codigoDeError(http(409, CUERPO))).toBe('nombre_duplicado');
        expect(codigoDeError(new ProfileApiError('x', 'CREATION_POLICY_ACCEPTANCE_REQUIRED', 403))).toBe('CREATION_POLICY_ACCEPTANCE_REQUIRED');
        expect(codigoDeError('texto')).toBe('');
    });

    it('la sesión se reconoce por los códigos de la API, no por subcadenas', () => {
        for (const code of ['UNAUTHORIZED', 'TOKEN_INVALID', 'TOKEN_EXPIRED', 'sin_sesion'])
            expect(esErrorDeSesion(http(401, { error: 'Tienes que iniciar sesión.', code }))).withContext(code).toBeTrue();
        expect(esErrorDeSesion(ProfileApiError.sinSesion('sin_token'))).toBeTrue();
        expect(esErrorDeSesion(http(401, { error: 'x', code: 'unauthorized_extra' }))).toBeFalse();
        expect(esErrorDeSesion(new Error('Sesión no iniciada'))).toBeFalse();
    });
});

describe('errorDePerfil', () => {
    it('una respuesta HTTP, con el texto para enseñar, su código y su estado', () => {
        const error = errorDePerfil(http(500, { error: 'Error de base de datos.', code: 'error_de_base_de_datos', debug: { requestId: 'r2' } }), 'Respaldo.');

        expect(error).toEqual(jasmine.any(ProfileApiError));
        expect(error.message).toBe('Error de base de datos. Código de la incidencia: r2');
        expect(error.code).toBe('error_de_base_de_datos');
        expect(error.status).toBe(500);
    });

    it('un ProfileApiError se devuelve tal cual; otro error, con su message', () => {
        const propio = new ProfileApiError('Propio', 'X', 400);
        expect(errorDePerfil(propio, 'Respaldo.')).toBe(propio);
        expect(errorDePerfil(new Error('La API no devolvió un id.'), 'Respaldo.').message).toBe('La API no devolvió un id.');
    });
});
