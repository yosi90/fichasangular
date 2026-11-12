import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { environment } from 'src/environments/environment';
import { crearDetalleApi } from 'src/testing/personaje-detalle-api';
import { respuestaSesiones } from 'src/testing/sesiones-api';
import { simularTokenApi } from 'src/testing/simular-token-api';
import { PersonajeService } from './personaje.service';
import { SesionesService, esSesionDesactualizada, leerHistorial, leerRespuestaSesion } from './sesiones.service';
import { AppToastService } from './app-toast.service';
import { AVISO_REGLAS_IGNORADAS } from './utils/reglas-ignoradas';

describe('SesionesService', () => {
    let http: { request: jasmine.Spy; };
    let servicio: SesionesService;

    beforeEach(() => {
        simularTokenApi('token');
        http = { request: jasmine.createSpy('request') };
        servicio = new SesionesService({ currentUser: { uid: 'u' } } as any, http as any);
    });

    describe('lo que lee de la API (respuestas reales de rol_dev)', () => {
        it('el historial: de la 0 a la última, con permisos, PX, resumen, relato y eventos con su texto tal cual', () => {
            const historial = leerHistorial(respuestaSesiones('historial_con_abierta'));

            expect(historial.puedeApuntar).toBeTrue();
            expect(historial.veNotas).toBeTrue();
            expect(historial.sesiones.map((sesion) => [sesion.numero, sesion.estado])).toEqual([[0, 'cerrada'], [1, 'cerrada'], [2, 'abierta']]);
            expect(historial.experiencia).toEqual({
                px: 1000, nivel: 2, pxNivelActual: 1000, pxSiguienteNivel: 3000, puedeSubir: false, nivelesPorSubir: 0,
                sesionAbierta: { numero: 2, titulo: 'Sesión 2' },
            });
            const primera = historial.sesiones[1];
            expect(primera.titulo).toBe('El camino de Zorvintal');
            expect(primera.fechaJuego).toBe('2026-11-12');
            expect(primera.notas).toBe('Secreto del máster');
            expect(primera.resumen).toEqual({ pxInicio: 0, pxFin: 1000, poInicio: 85, poFin: 132, nepInicio: 1, nepFin: 2 });
            expect(primera.eventos.map((evento) => evento.tipo)).toEqual(
                ['experiencia', 'dinero', 'compra', 'objeto_obtenido', 'venta', 'nota', 'subida_nivel']);
            expect(primera.eventos[0].texto).toBe('+1.000 PX por los bandidos del vado');
            expect(primera.eventos[0].actorRol).toBe('master');
            expect(primera.relato.startsWith('Sesión 1 «El camino de Zorvintal» · 12 nov 2026 · +1.000 PX')).toBeTrue();
            expect(historial.sesiones[0].resumen.poInicio).toBeNull();
        });

        it('a quien ve la ficha sin apuntar: sin notas ni eventos de nota', () => {
            const ajeno = leerHistorial(respuestaSesiones('historial_ajeno'));

            expect(ajeno.puedeApuntar).toBeFalse();
            expect(ajeno.veNotas).toBeFalse();
            expect(ajeno.sesiones.every((sesion) => sesion.notas === null)).toBeTrue();
            expect(ajeno.sesiones[1].eventos.some((evento) => evento.tipo === 'nota')).toBeFalse();
        });

        it('cada escritura: la sesión con su versión nueva, los PX y el evento (o lo deshecho)', () => {
            const venta = leerRespuestaSesion(respuestaSesiones('venta'));
            expect(venta.sesion.version).toBe(respuestaSesiones<any>('venta').sesion.version);
            expect(venta.sesion.eventos.at(-1)).toEqual(jasmine.objectContaining({
                tipo: 'venta', texto: 'vendió daga por 1 po (la mitad de 2)', po: 1, deshacible: true,
            }));
            expect(venta.sesion.eventos.slice(0, -1).every((evento) => !evento.deshacible)).toBeTrue();
            expect(venta.experiencia?.puedeSubir).toBeTrue();

            const deshecho = leerRespuestaSesion(respuestaSesiones('deshacer'));
            expect(deshecho.deshecho?.tipo).toBe('subida_nivel');
            expect(deshecho.deshecho?.texto.startsWith('subió a nivel 2')).toBeTrue();
        });

        it('los PX de la ficha (`experiencia` de GET /personajes/{id}) pasan a la ficha; sin ella, los de su NEP', () => {
            const personajes = new PersonajeService({ currentUser: null } as any, {} as any);
            const experiencia = respuestaSesiones<any>('venta').experiencia;
            const conPx = personajes.fichaDeApi(crearDetalleApi({ experiencia, nivelEfectivo: 1 }));
            expect(conPx.Experiencia).toBe(1000);
            expect(conPx.ExperienciaSesiones?.puedeSubir).toBeTrue();
            const sinPx = personajes.fichaDeApi(crearDetalleApi({ nivelEfectivo: 3 }));
            expect(sinPx.Experiencia).toBe(3000);
            expect(sinPx.ExperienciaSesiones).toBeNull();
        });
    });

    describe('las rutas', () => {
        const base = `${environment.apiUrl}personajes/129/sesiones`;
        const ultima = () => http.request.calls.mostRecent().args;
        const sesion = { numero: 1, version: '000000000060581e' };

        beforeEach(() => http.request.and.returnValue(of(respuestaSesiones('venta'))));

        it('el historial y una sesión, con el Bearer', async () => {
            http.request.and.returnValue(of(respuestaSesiones('historial')));
            await servicio.historial(129);
            expect(ultima()[0]).toBe('GET');
            expect(ultima()[1]).toBe(base);
            expect(ultima()[2].headers.get('Authorization')).toBe('Bearer token');

            http.request.and.returnValue(of({ ...respuestaSesiones<any>('detalle_abierta'), ficha: crearDetalleApi() }));
            const detalle = await servicio.sesion(129, 1);
            expect(ultima()[1]).toBe(`${base}/1`);
            expect(detalle.sesion.numero).toBe(1);
            expect(detalle.ficha).toEqual(jasmine.objectContaining({ i: crearDetalleApi()['i'] }));
        });

        it('cada escritura manda la `version` de la última respuesta', async () => {
            await servicio.apuntar(129, sesion, { tipo: 'experiencia', px: 1000, concepto: 'los bandidos del vado' });
            expect(ultima()).toEqual(['POST', `${base}/1/eventos`, jasmine.objectContaining({
                body: { tipo: 'experiencia', px: 1000, concepto: 'los bandidos del vado', version: sesion.version },
            })]);

            await servicio.comprar(129, sesion, { piezas: [{ tipo: 'arma', id: 5, cantidad: 2 }] });
            expect(ultima()[1]).toBe(`${base}/1/compras`);
            expect(ultima()[2].body).toEqual({ piezas: [{ tipo: 'arma', id: 5, cantidad: 2 }], version: sesion.version });

            await servicio.cambiar(129, sesion, { fechaJuego: null });
            expect(ultima()[0]).toBe('PATCH');
            expect(ultima()[2].body).toEqual({ fechaJuego: null, version: sesion.version });

            for (const [accion, ruta] of [['deshacer', 'deshacer'], ['cerrar', 'cerrar'], ['reabrir', 'reabrir']] as const) {
                await servicio[accion](129, sesion);
                expect(ultima()[1]).toBe(`${base}/1/${ruta}`);
                expect(ultima()[2].body).toEqual({ version: sesion.version });
            }
        });

        it('la compra, el botín y la subida de un PNJ avisan de las reglas de su campaña que se ha saltado', async () => {
            const toasts = jasmine.createSpyObj<AppToastService>('AppToastService', ['showInfo']);
            const conAviso = new SesionesService({ currentUser: { uid: 'u' } } as any, http as any, toasts);
            const regla = { code: 'precio_maximo_por_objeto', mensaje: 'La campaña de este personaje no deja comprar piezas de más de 10 po.', field: 'piezas[0]' };

            http.request.and.returnValue(of({ ...respuestaSesiones<any>('venta'), reglasIgnoradas: [regla] }));
            const compra = await conAviso.comprar(129, sesion, { piezas: [{ tipo: 'arma', id: 30 }] });
            expect(compra.reglasIgnoradas).toEqual([regla]);
            expect(toasts.showInfo).toHaveBeenCalledOnceWith(AVISO_REGLAS_IGNORADAS, jasmine.objectContaining({ lista: [regla.mensaje] }));

            await conAviso.apuntar(129, sesion, { tipo: 'objeto_obtenido', origen: 'botin', pieza: { tipo: 'arma', id: 180 } } as any);
            http.request.and.returnValue(of({
                ...respuestaSesiones<any>('venta'), subida: { idEvento: 9, numeroSesion: 1, nivel: 2, nivelesPorSubir: 0 }, reglasIgnoradas: [regla],
            }));
            await conAviso.subirNivel(129, {} as any);
            expect(toasts.showInfo).toHaveBeenCalledTimes(3);

            // Sin nada que se salte, ningún aviso.
            http.request.and.returnValue(of(respuestaSesiones('venta')));
            expect((await conAviso.apuntar(129, sesion, { tipo: 'dinero', po: 5 })).reglasIgnoradas).toEqual([]);
            expect(toasts.showInfo).toHaveBeenCalledTimes(3);
        });

        it('abrir no lleva versión (no hay sesión todavía)', async () => {
            http.request.and.returnValue(of(respuestaSesiones('abrir')));
            const respuesta = await servicio.abrir(129, { titulo: 'El camino de Zorvintal' });
            expect(ultima()[1]).toBe(base);
            expect(ultima()[2].body).toEqual({ titulo: 'El camino de Zorvintal' });
            expect(respuesta.sesion.numero).toBe(1);
        });

        it('el 409 sesion_desactualizada llega con su código y su texto (respuesta real)', async () => {
            http.request.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: respuestaSesiones('desactualizada') })));
            let error: unknown = null;
            try {
                await servicio.apuntar(129, sesion, { tipo: 'dinero', po: 5 });
            } catch (e) {
                error = e;
            }
            expect(error instanceof ProfileApiError).toBeTrue();
            expect(esSesionDesactualizada(error)).toBeTrue();
            expect((error as ProfileApiError).field).toBe('version');
            expect((error as ProfileApiError).message).toContain('vuelve a cargarla');
        });
    });
});
