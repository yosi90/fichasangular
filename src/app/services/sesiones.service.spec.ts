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
import { ETIQUETA_EVENTO } from './utils/sesiones-texto';

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

        it('adquirir una plantilla (fase 7): la ruta, su cuerpo, el NEP de antes y de ahora y el evento nuevo con su frase', async () => {
            const venta = respuestaSesiones<any>('venta');
            const texto = 'adquirió la plantilla Licántropo (lobo) [Infectado] (NEP 5 → 9): Sabiduría 16 → 18, PG 10 → 24, 2 DG nuevos (tiradas 5, 3)';
            const evento = { ...venta.sesion.eventos[venta.sesion.eventos.length - 1], id: 99, tipo: 'plantilla_adquirida', texto, deshacible: true };
            http.request.and.returnValue(of({
                ...venta, sesion: { ...venta.sesion, eventos: [...venta.sesion.eventos.map((e: any) => ({ ...e, deshacible: false })), evento] },
                plantilla: { idEvento: 99, numeroSesion: 1, plantilla: { id: 9, nombre: 'Licántropo (lobo) [Infectado]' }, nepAntes: 5, nepDespues: 9 },
                reglasIgnoradas: [],
            }));
            const cuerpo = { idPlantilla: 9, ficha: {} as any, version: sesion.version, pg: { tiradas: [5, 3] } };
            const respuesta = await servicio.adquirirPlantilla(129, cuerpo);
            expect(ultima()).toEqual(['POST', `${environment.apiUrl}personajes/129/plantillas`, jasmine.objectContaining({ body: cuerpo })]);
            expect(respuesta.plantilla).toEqual({ idEvento: 99, numeroSesion: 1, id: 9, nombre: 'Licántropo (lobo) [Infectado]', nepAntes: 5, nepDespues: 9, coste: null });
            const ultimo = respuesta.sesion.eventos[respuesta.sesion.eventos.length - 1];
            expect([ultimo.tipo, ultimo.texto, ultimo.deshacible]).toEqual(['plantilla_adquirida', texto, true]);
        });

        it('lo que costó una plantilla, y lo que paga otro', async () => {
            const venta = respuestaSesiones<any>('venta');
            http.request.and.returnValue(of({
                ...venta, reglasIgnoradas: [],
                plantilla: { idEvento: 99, numeroSesion: 1, plantilla: { id: 4, nombre: 'Liche' }, nepAntes: 11, nepDespues: 15,
                    coste: { px: 4800, po: 0, poCoste: 120000, niveles: 0, poPagadasPorOtro: true } },
            }));
            const cuerpo = { idPlantilla: 4, ficha: {} as any, version: sesion.version, poPagadasPorOtro: true };
            const respuesta = await servicio.adquirirPlantilla(129, cuerpo);
            expect(ultima()[2].body.poPagadasPorOtro).toBeTrue();
            expect(respuesta.plantilla.coste).toEqual({ px: 4800, po: 0, poCoste: 120000, niveles: 0, poPagadasPorOtro: true });
        });

        it('adquirir una raza mutada (fase 7): la ruta, su cuerpo con el concepto, la raza y su base, lo que costó y el evento', async () => {
            const venta = respuestaSesiones<any>('venta');
            const texto = 'adquirió la raza mutada Prole de Bahamut (pagó 100 po): Constitución 14 → 16, Destreza 12 → 10, PG 30 → 38, '
                + 'quitó la dote Alerta, idioma Dracónico (el Rito del Renacimiento)';
            const evento = { ...venta.sesion.eventos[venta.sesion.eventos.length - 1], id: 101, tipo: 'raza_mutada_adquirida', texto, deshacible: true };
            http.request.and.returnValue(of({
                ...venta, sesion: { ...venta.sesion, eventos: [...venta.sesion.eventos.map((e: any) => ({ ...e, deshacible: false })), evento] },
                razaMutada: { idEvento: 101, numeroSesion: 1, raza: { id: 21, nombre: 'Prole de Bahamut' }, razaBase: { id: 25, nombre: 'Humano' },
                    nepAntes: 5, nepDespues: 5, coste: { px: 0, po: 100, poCoste: 100, poPagadasPorOtro: false } },
                reglasIgnoradas: [],
            }));
            const cuerpo = { idRaza: 21, ficha: {} as any, version: sesion.version, concepto: 'el Rito del Renacimiento' };
            const respuesta = await servicio.adquirirRazaMutada(129, cuerpo);
            expect(ultima()).toEqual(['POST', `${environment.apiUrl}personajes/129/raza-mutada`, jasmine.objectContaining({ body: cuerpo })]);
            expect(respuesta.razaMutada).toEqual({
                idEvento: 101, numeroSesion: 1, raza: { id: 21, nombre: 'Prole de Bahamut' }, razaBase: { id: 25, nombre: 'Humano' },
                nepAntes: 5, nepDespues: 5, coste: { px: 0, po: 100, poCoste: 100, poPagadasPorOtro: false }, conversion: null,
            });
            const ultimo = respuesta.sesion.eventos[respuesta.sesion.eventos.length - 1];
            expect([ultimo.tipo, ultimo.texto, ultimo.deshacible]).toEqual(['raza_mutada_adquirida', texto, true]);
        });

        it('una raza mutada que no cuesta nada (el nacido del Infierno), con el NEP que baja, y un id que no vale', async () => {
            http.request.and.returnValue(of({
                ...respuestaSesiones<any>('venta'), reglasIgnoradas: [],
                razaMutada: { idEvento: 7, numeroSesion: 2, raza: { id: 952, nombre: 'Nacido del Infierno' }, razaBase: { id: 308, nombre: 'Drow' },
                    nepAntes: 7, nepDespues: 5, coste: { px: 0, po: 0, poCoste: 0, poPagadasPorOtro: false } },
            }));
            const respuesta = await servicio.adquirirRazaMutada(129, { idRaza: 952, ficha: {} as any, version: sesion.version });
            expect(respuesta.razaMutada.coste).toEqual({ px: 0, po: 0, poCoste: 0, poPagadasPorOtro: false });
            expect([respuesta.razaMutada.nepAntes, respuesta.razaMutada.nepDespues]).toEqual([7, 5]);
            await expectAsync(servicio.adquirirRazaMutada(0, { idRaza: 952, ficha: {} as any, version: sesion.version })).toBeRejected();
        });

        it('convertirse en muerto viviente: el cuerpo con `pg` e `idClase`, la conversión de la respuesta y su evento', async () => {
            const venta = respuestaSesiones<any>('venta');
            const texto = 'se convirtió en engendro vampírico: −1 nivel de guerrero (queda en 4), +1 nivel de engendro vampírico, PX 12.000 → 8.000, '
                + 'PG 45 → 39, sin Constitución, tipo humanoide → muerto viviente (la consunción de energía de un vampiro)';
            const evento = { ...venta.sesion.eventos[venta.sesion.eventos.length - 1], id: 102, tipo: 'conversion_muerto_viviente', texto, px: -4000, deshacible: true };
            http.request.and.returnValue(of({
                ...venta, sesion: { ...venta.sesion, eventos: [...venta.sesion.eventos.map((e: any) => ({ ...e, deshacible: false })), evento] },
                razaMutada: { idEvento: 102, numeroSesion: 1, raza: { id: 1009, nombre: 'Engendro vampírico' }, razaBase: { id: 2, nombre: 'Enano' },
                    nepAntes: 5, nepDespues: 5, coste: { px: 0, po: 0, poCoste: 0, poPagadasPorOtro: false },
                    conversion: { perdida: { clase: { id: 7, nombre: 'Guerrero' }, nivelClase: 5 }, claseDeMonstruo: { id: 482, nombre: 'Engendro vampírico' }, pxAntes: 12000, pxDespues: 8000 } },
                reglasIgnoradas: [],
            }));
            const cuerpo = { idRaza: 1009, ficha: {} as any, version: sesion.version, pg: { tirada: 7, tiradas: [3, 7] }, concepto: 'la consunción de energía de un vampiro' };
            const respuesta = await servicio.adquirirRazaMutada(129, cuerpo);
            expect(ultima()).toEqual(['POST', `${environment.apiUrl}personajes/129/raza-mutada`, jasmine.objectContaining({ body: cuerpo })]);
            expect(respuesta.razaMutada.conversion).toEqual({
                perdida: { clase: { id: 7, nombre: 'Guerrero' }, nivelClase: 5 }, claseDeMonstruo: { id: 482, nombre: 'Engendro vampírico' }, pxAntes: 12000, pxDespues: 8000,
            });
            const ultimo = respuesta.sesion.eventos[respuesta.sesion.eventos.length - 1];
            expect([ultimo.tipo, ultimo.texto, ultimo.px, ultimo.deshacible]).toEqual(['conversion_muerto_viviente', texto, -4000, true]);
            expect(ETIQUETA_EVENTO['conversion_muerto_viviente']).toBe('Conversión');
        });

        it('la conversión del gnoll (sin niveles de clase): sin nivel perdido', async () => {
            http.request.and.returnValue(of({
                ...respuestaSesiones<any>('venta'), reglasIgnoradas: [],
                razaMutada: { idEvento: 8, numeroSesion: 2, raza: { id: 1009, nombre: 'Engendro vampírico' }, razaBase: { id: 18, nombre: 'Gnoll' },
                    nepAntes: 3, nepDespues: 4, coste: null,
                    conversion: { perdida: null, claseDeMonstruo: { id: 482, nombre: 'Engendro vampírico' }, pxAntes: 3500, pxDespues: 3500 } },
            }));
            const respuesta = await servicio.adquirirRazaMutada(129, { idRaza: 1009, ficha: {} as any, version: sesion.version, pg: { tirada: 5 } });
            expect(respuesta.razaMutada.conversion?.perdida).toBeNull();
            expect([respuesta.razaMutada.nepAntes, respuesta.razaMutada.nepDespues]).toEqual([3, 4]);
        });

        it('los niveles perdidos: la conversión (`conversion`) no se restablece; una causa que no conoce, sin causa', async () => {
            http.request.and.returnValue(of({
                ...respuestaSesiones<any>('detalle_abierta'), ficha: crearDetalleApi(),
                nivelesPerdidos: [
                    { idClase: 7, nivelClase: 5, ordenConocido: true, clasesAnteriores: [7], causa: 'conversion', restablecible: false },
                    { idClase: 7, nivelClase: 4, ordenConocido: true, clasesAnteriores: [7], causa: 'nivel_negativo', restablecible: true },
                    { idClase: 7, nivelClase: 3, ordenConocido: true, clasesAnteriores: [7], causa: 'otra_cosa' },
                ],
            }));
            const detalle = await servicio.sesion(129, 1);
            expect(detalle.nivelesPerdidos!.map((n) => [n.causa, n.restablecible])).toEqual([['conversion', false], ['nivel_negativo', true], [null, false]]);
        });

        it('un NEP que falta o no es un número se lee como null, no como 0 (toIntOrNull)', async () => {
            http.request.and.returnValue(of({
                ...respuestaSesiones<any>('venta'), reglasIgnoradas: [],
                razaMutada: { idEvento: 7, numeroSesion: 2, raza: { id: 952, nombre: 'Nacido del Infierno' }, razaBase: { id: 308, nombre: 'Drow' },
                    nepAntes: '', nepDespues: null, coste: null },
            }));
            const respuesta = await servicio.adquirirRazaMutada(129, { idRaza: 952, ficha: {} as any, version: sesion.version });
            expect([respuesta.razaMutada.nepAntes, respuesta.razaMutada.nepDespues, respuesta.razaMutada.coste]).toEqual([null, null, null]);
        });

        it('restablecer un nivel: la ruta, el conjuro y cuántos quedan; el historial dice cuántos se pueden', async () => {
            const venta = respuestaSesiones<any>('venta');
            http.request.and.returnValue(of({
                ...venta, reglasIgnoradas: [],
                restablecimiento: { idEvento: 7, numeroSesion: 1, conjuro: 'restablecimiento_mayor', clase: { id: 5, nombre: 'Guerrero' },
                    nivelClase: 5, nepAntes: 4, nepDespues: 5, pxAntes: 8000, pxDespues: 10000, quedan: 1 },
            }));
            const respuesta = await servicio.restablecerNivel(129, { conjuro: 'restablecimiento_mayor', nivelLanzador: 13, version: sesion.version });
            expect(ultima()).toEqual(['POST', `${environment.apiUrl}personajes/129/niveles/restablecimiento`,
                jasmine.objectContaining({ body: { conjuro: 'restablecimiento_mayor', nivelLanzador: 13, version: sesion.version } })]);
            expect(respuesta.restablecimiento).toEqual({ idEvento: 7, numeroSesion: 1, clase: { id: 5, nombre: 'Guerrero' }, nivelClase: 5,
                pxAntes: 8000, pxDespues: 10000, quedan: 1 });
            expect(leerHistorial({ ...respuestaSesiones<any>('historial'), nivelesRestablecibles: 2 }).nivelesRestablecibles).toBe(2);
            expect(leerHistorial(respuestaSesiones<any>('historial')).nivelesRestablecibles).toBe(0);
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
