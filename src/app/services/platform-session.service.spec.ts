import { NgZone } from '@angular/core';
import { EstadoPlataforma, PlatformSessionService, recargandoPorCambioDeIdentidad } from './platform-session.service';

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
