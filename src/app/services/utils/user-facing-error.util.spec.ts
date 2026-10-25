import { HttpErrorResponse } from '@angular/common/http';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { toUserFacingErrorMessage } from './user-facing-error.util';

describe('toUserFacingErrorMessage', () => {
    it('de una respuesta de la API, su error (nunca su message)', () => {
        const error = new HttpErrorResponse({ status: 404, error: { error: 'Convocatoria no encontrada.', code: 'no_encontrado', message: 'otro' } });

        expect(toUserFacingErrorMessage(error, 'Respaldo.')).toBe('Convocatoria no encontrada.');
        expect(toUserFacingErrorMessage(new HttpErrorResponse({ status: 400, error: { message: 'Solo message' } }), 'Respaldo.')).toBe('Respaldo.');
    });

    it('falta la sesión: lo dice el código, no el texto', () => {
        const caducado = new HttpErrorResponse({ status: 401, error: { error: 'Tienes que iniciar sesión.', code: 'TOKEN_EXPIRED' } });

        expect(toUserFacingErrorMessage(caducado, 'Respaldo.')).toBe('Necesitas iniciar sesión para continuar.');
        expect(toUserFacingErrorMessage(ProfileApiError.sinSesion('sin_sesion'), 'Respaldo.')).toBe('Necesitas iniciar sesión para continuar.');
        expect(toUserFacingErrorMessage(new ProfileApiError('No autorizado', 'unauthorized_algo', 401), 'Respaldo.')).toBe('No autorizado');
    });

    it('en un fallo del servidor, con el código de la incidencia, también si el texto se sustituye', () => {
        const interno = new HttpErrorResponse({ status: 500, error: { error: 'Error interno del servidor.', code: 'error_interno', debug: { requestId: 'r1' } } });
        const tecnico = new HttpErrorResponse({ status: 500, error: { error: 'Fallo de SQL', code: 'error_interno', debug: { requestId: 'r2' } } });

        expect(toUserFacingErrorMessage(interno, 'Respaldo.')).toBe('Error interno del servidor. Código de la incidencia: r1');
        expect(toUserFacingErrorMessage(tecnico, 'Respaldo.')).toBe('Respaldo. Código de la incidencia: r2');
    });

    it('un texto técnico (propio o de Angular) se sustituye por el de respaldo', () => {
        expect(toUserFacingErrorMessage('Http failure response for /x: 500 Internal Server Error', 'Respaldo.')).toBe('Respaldo.');
        expect(toUserFacingErrorMessage(new Error('Forbidden'), 'Respaldo.')).toBe('Respaldo.');
        expect(toUserFacingErrorMessage(new Error('Campaña inválida.'), 'Respaldo.')).toBe('Campaña inválida.');
        expect(toUserFacingErrorMessage(null, '')).toBe('No se pudo completar la acción.');
    });
});
