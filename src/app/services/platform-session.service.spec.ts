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

/** Lo justo del SDK de la plataforma: su estado y unos tokens que se resuelven cuando dice la prueba. */
class SdkFalso {
    estado: EstadoPlataforma = { tipo: 'comprobando' };
    pendientes: Array<{ resolver: (token: string | null) => void; plataforma: boolean }> = [];
    oyentes: Array<(estado: EstadoPlataforma) => void> = [];

    alCambiar(oyente: (estado: EstadoPlataforma) => void): () => void {
        this.oyentes.push(oyente);
        return () => undefined;
    }

    token(): Promise<string | null> {
        return new Promise((resolver) => this.pendientes.push({ resolver, plataforma: false }));
    }

    tokenPlataforma(): Promise<string | null> {
        return new Promise((resolver) => this.pendientes.push({ resolver, plataforma: true }));
    }

    /** El SDK cambia de estado (y lo anuncia por `alCambiar`, como el de verdad). */
    cambiar(estado: EstadoPlataforma): void {
        this.estado = estado;
        this.oyentes.forEach((oyente) => oyente(estado));
    }

    /** Resuelve el primer token pendiente con el de la cuenta que tenga el SDK en ese momento. */
    dar(): void {
        const pendiente = this.pendientes.shift()!;
        const cuenta = this.estado.tipo === 'con_sesion' ? this.estado.cuenta.id : null;
        pendiente.resolver(cuenta ? `${pendiente.plataforma ? 'plataforma' : 'api'}-${cuenta}` : null);
    }
}

/** Deja que corran las promesas encadenadas (cargar el SDK, pedir el token). */
const esperar = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('PlatformSessionService, tokens al cambiar de cuenta (CAMBIO_DE_CUENTA.md)', () => {
    let servicio: PlatformSessionServicePrueba;
    let sdk: SdkFalso;
    let anterior: unknown;

    beforeEach(async () => {
        anterior = (window as any).yosiftware;
        sdk = new SdkFalso();
        (window as any).yosiftware = sdk;
        servicio = new PlatformSessionServicePrueba(new NgZone({ enableLongStackTrace: false }));
        servicio.iniciar();
        await esperar();
        sdk.cambiar(conSesion('a'));
    });

    afterEach(() => {
        (window as any).yosiftware = anterior;
    });

    async function codigoDe(promesa: Promise<unknown>): Promise<string> {
        const error = await promesa.then(() => null, (e) => e);
        return error?.code ?? 'sin error';
    }

    it('da el token de la cuenta que ve la página', async () => {
        const token = servicio.tokenApi();
        await esperar();
        sdk.dar();

        expect(await token).toBe('api-a');
        expect(servicio.recargas).toBe(0);
    });

    it('A → B mientras se espera el token: no da el de B y recarga', async () => {
        const token = servicio.tokenApi();
        await esperar();
        sdk.estado = conSesion('b'); // el SDK ya tiene B, aún sin anunciarlo
        sdk.dar();

        expect(await codigoDe(token)).toBe('CAMBIO_DE_IDENTIDAD');
        expect(servicio.recargas).toBe(1);
    });

    it('una escritura de A que pide el token tarde no sale como B', async () => {
        const cabecera = cabeceraApiConFirebase({ currentUser: { uid: 'a' } });
        await esperar();
        sdk.cambiar(conSesion('b'));
        sdk.dar();

        expect(await codigoDe(cabecera)).toBe('CAMBIO_DE_IDENTIDAD');
        expect(emitidaLaCuenta(servicio, 'b')).toBeFalse();
    });

    it('A → B → A: tras el aviso yosiftware:identidad ningún token, aunque vuelva A', async () => {
        const token = servicio.tokenPlataforma();
        await esperar();
        window.dispatchEvent(new Event('yosiftware:identidad'));
        sdk.estado = conSesion('b');
        sdk.estado = conSesion('a');
        sdk.dar();

        expect(await codigoDe(token)).toBe('CAMBIO_DE_IDENTIDAD');
        expect(await codigoDe(servicio.tokenApi())).toBe('CAMBIO_DE_IDENTIDAD');
        expect(sdk.pendientes.length).toBe(0); // ni siquiera se le pide al SDK
        expect(servicio.recargas).toBe(1);
    });

    it('cerrar la sesión o una revocación al volver a la pestaña: sin token y recarga una vez', async () => {
        const token = servicio.tokenApi();
        await esperar();
        sdk.cambiar({ tipo: 'sin_sesion', motivo: 'revocada' });
        sdk.dar();

        expect(await codigoDe(token)).toBe('CAMBIO_DE_IDENTIDAD');
        expect(await codigoDe(servicio.tokenPlataforma())).toBe('CAMBIO_DE_IDENTIDAD');
        expect(servicio.recargas).toBe(1);
        expect(recargandoPorCambioDeIdentidad()).toBeTrue();
    });

    it('sin red (no_disponible) no es otra cuenta: no recarga y no da token', async () => {
        const token = servicio.tokenApi();
        await esperar();
        sdk.cambiar({ tipo: 'no_disponible' });
        sdk.dar();

        expect(await codigoDe(token)).toBe('UNAUTHORIZED');
        expect(servicio.recargas).toBe(0);
        sdk.cambiar(conSesion('a'));
        const otro = servicio.tokenApi();
        await esperar();
        sdk.dar();
        expect(await otro).toBe('api-a');
    });
});

function emitidaLaCuenta(servicio: PlatformSessionService, id: string): boolean {
    return servicio.cuenta?.id === id;
}

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
