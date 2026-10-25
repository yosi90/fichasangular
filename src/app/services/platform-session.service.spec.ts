import { NgZone } from '@angular/core';
import { ProfileApiError } from '../interfaces/user-account';
import { cabeceraApiConFirebase, EstadoPlataforma, PlatformSessionService, recargandoPorCambioDeIdentidad } from './platform-session.service';
import { simularTokenApi } from 'src/testing/simular-token-api';

class PlatformSessionServicePrueba extends PlatformSessionService {
    recargas = 0;

    protected override recargarPagina(): void {
        this.recargas++;
    }

    aplicar(estado: EstadoPlataforma): void {
        (this as any).aplicarEstado(estado);
    }
}

function conSesion(id: string): EstadoPlataforma {
    return { tipo: 'con_sesion', cuenta: { id, alias: id, correo: null } };
}

describe('PlatformSessionService, cambio de cuenta', () => {
    let servicio: PlatformSessionServicePrueba;
    let emitidos: EstadoPlataforma[];

    beforeEach(() => {
        servicio = new PlatformSessionServicePrueba(new NgZone({ enableLongStackTrace: false }));
        emitidos = [];
        servicio.estado$.subscribe((estado) => emitidos.push(estado));
    });

    it('entrar por primera vez no recarga', () => {
        servicio.aplicar({ tipo: 'sin_sesion' });
        servicio.aplicar(conSesion('a'));

        expect(servicio.recargas).toBe(0);
        expect(servicio.cuenta?.id).toBe('a');
    });

    it('la misma cuenta otra vez (renovar, restricciones) no recarga', () => {
        servicio.aplicar(conSesion('a'));
        servicio.aplicar({ ...conSesion('a'), restricciones: { alcances: ['comunidad'] } } as EstadoPlataforma);

        expect(servicio.recargas).toBe(0);
        expect(emitidos.length).toBe(3);
    });

    it('de A a B recarga sin enseñar B a nadie', () => {
        servicio.aplicar(conSesion('a'));
        servicio.aplicar(conSesion('b'));

        expect(servicio.recargas).toBe(1);
        expect(servicio.cuenta?.id).toBe('a');
        expect(emitidos.some((estado) => estado.tipo === 'con_sesion' && estado.cuenta.id === 'b')).toBeFalse();
        expect(recargandoPorCambioDeIdentidad()).toBeTrue();
    });

    it('salir con una cuenta abierta también recarga, una sola vez', () => {
        servicio.aplicar(conSesion('a'));
        servicio.aplicar({ tipo: 'sin_sesion' });
        servicio.aplicar(conSesion('b'));

        expect(servicio.recargas).toBe(1);
        expect(emitidos.some((estado) => estado.tipo === 'sin_sesion')).toBeFalse();
    });

    it('comprobar o perder la plataforma un momento no cuenta como cambio', () => {
        servicio.aplicar(conSesion('a'));
        servicio.aplicar({ tipo: 'comprobando' });
        servicio.aplicar({ tipo: 'no_disponible' });
        servicio.aplicar(conSesion('a'));

        expect(servicio.recargas).toBe(0);
    });
});

describe('cabeceraApiConFirebase', () => {
    const conFirebase = { currentUser: { uid: 'a' } };

    it('manda el token de la API de Rol como Bearer', async () => {
        simularTokenApi('token-api');

        expect(await cabeceraApiConFirebase(conFirebase)).toEqual({ Authorization: 'Bearer token-api' });
    });

    it('sin la sesión de Firebase no pide el token', async () => {
        const token = simularTokenApi('token-api');

        await expectAsync(cabeceraApiConFirebase({ currentUser: null })).toBeRejectedWithError('Necesitas iniciar sesión para continuar.');
        expect(token).not.toHaveBeenCalled();
    });

    it('sin token, el error que construya quien llama', async () => {
        simularTokenApi('  ');

        await expectAsync(cabeceraApiConFirebase(conFirebase)).toBeRejectedWithError('Necesitas iniciar sesión para continuar.');
        const error = await cabeceraApiConFirebase(conFirebase, ProfileApiError.sinSesion).catch((e) => e);
        expect(error).toEqual(jasmine.any(ProfileApiError));
        expect(error.code).toBe('TOKEN_INVALID');
        expect(error.status).toBe(401);
    });

    it('sin sesión, ProfileApiError.sinSesion da UNAUTHORIZED', async () => {
        const error = await cabeceraApiConFirebase(null, ProfileApiError.sinSesion).catch((e) => e);

        expect(error.message).toBe('Necesitas iniciar sesión para continuar.');
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.status).toBe(401);
    });
});
