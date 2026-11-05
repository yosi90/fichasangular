import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { PlatformSessionService } from './platform-session.service';
import { PlatformSocialError, PlatformSocialService, nombreVisiblePersona, urlAvatar } from './platform-social.service';

describe('PlatformSocialService', () => {
    const api = environment.plataforma.apiUrl;
    let service: PlatformSocialService;
    let http: HttpTestingController;
    let sesion: { tokenPlataforma: jasmine.Spy; conversacionDirecta: jasmine.Spy };

    beforeEach(() => {
        sesion = {
            tokenPlataforma: jasmine.createSpy('tokenPlataforma').and.resolveTo('token-plataforma'),
            conversacionDirecta: jasmine.createSpy('conversacionDirecta').and.resolveTo(41),
        };
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: PlatformSessionService, useValue: sesion },
            ],
        });
        service = TestBed.inject(PlatformSocialService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    async function peticion(url: string) {
        for (let i = 0; i < 10; i++) {
            const encontradas = http.match(url);
            if (encontradas.length > 0)
                return encontradas[0];
            await Promise.resolve();
        }
        return http.expectOne(url);
    }

    it('lee las amistades por cursor, con el token de la plataforma', async () => {
        const primera = service.amistades();
        const req = await peticion(`${api}/v1/social/amistades`);
        expect(req.request.headers.get('Authorization')).toBe('Bearer token-plataforma');
        req.flush({ vinculos: [{ persona: { id: 'c1', alias: 'yuna', nombre: 'Yuna', privado: false, avatar: null }, desde: '2026-11-01', relacion: null }], cursor: 'abc' });
        expect((await primera).cursor).toBe('abc');

        const segunda = service.amistades('abc');
        (await peticion(`${api}/v1/social/amistades?cursor=abc`)).flush({ vinculos: [], cursor: null });
        expect(await segunda).toEqual({ vinculos: [], cursor: null });
    });

    it('lee los bloqueos, las solicitudes de cada tipo y el resumen', async () => {
        const bloqueos = service.bloqueos();
        (await peticion(`${api}/v1/social/bloqueos`)).flush({ vinculos: [], cursor: null });
        expect((await bloqueos).vinculos).toEqual([]);

        const enviadas = service.solicitudes('enviadas');
        (await peticion(`${api}/v1/social/amistades/solicitudes?tipo=enviadas`)).flush({ solicitudes: [{ id: 3 }] });
        expect((await enviadas).map((s) => s.id)).toEqual([3]);

        const resumen = service.resumen();
        (await peticion(`${api}/v1/social/resumen`)).flush({ solicitudesRecibidas: 2, solicitudesEnviadas: 0, amistades: 4, seguidos: 0, seguidores: 0, bloqueos: 1 });
        expect((await resumen).amistades).toBe(4);
    });

    it('busca personas solo entre 2 y 60 caracteres', async () => {
        expect(await service.buscarPersonas(' a ')).toEqual([]);
        expect(await service.buscarPersonas('x'.repeat(61))).toEqual([]);

        const busqueda = service.buscarPersonas(' yu na ');
        (await peticion(`${api}/v1/personas?q=yu%20na`)).flush({ personas: [{ id: 'c1', alias: 'yuna', nombre: null, privado: true, avatar: null }] });
        expect((await busqueda).map((p) => p.alias)).toEqual(['yuna']);
    });

    it('un bloqueo no se revela: la persona «no está disponible», como si no existiera', async () => {
        const relacion = service.relacion('c9');
        (await peticion(`${api}/v1/personas/c9/relacion`)).flush({ error: 'x', code: 'persona_no_encontrada' }, { status: 404, statusText: 'Not Found' });

        const error = await relacion.then(() => null, (e) => e);
        expect(error).toEqual(jasmine.any(PlatformSocialError));
        expect(error.message).toBe('Esta persona no está disponible.');
    });

    it('explica los límites de la plataforma en frases', async () => {
        const pedir = service.pedirAmistad('c1');
        (await peticion(`${api}/v1/social/amistades/solicitudes`)).flush({ error: 'x', code: 'demasiadas_solicitudes' }, { status: 429, statusText: 'Too Many' });
        expect((await pedir.then(() => null, (e) => e)).message).toBe('Has enviado demasiadas solicitudes de amistad hoy.');
    });

    it('abre la directa por el SDK y traduce solo_entre_amistades', async () => {
        expect(await service.conversacionDirecta('c1')).toBe(41);
        expect(sesion.conversacionDirecta).toHaveBeenCalledWith('c1');

        sesion.conversacionDirecta.and.rejectWith(Object.assign(new Error('No'), { code: 'solo_entre_amistades' }));
        const error = await service.conversacionDirecta('c2').then(() => null, (e) => e);
        expect(error.code).toBe('solo_entre_amistades');
        expect(error.message).toBe('Solo puedes escribir por privado a tus amistades.');
    });

    it('nombre visible y avatar completos, sin enseñar el id', () => {
        expect(nombreVisiblePersona({ alias: 'yuna', nombre: 'Yuna Rivers' })).toBe('Yuna Rivers');
        expect(nombreVisiblePersona({ alias: 'yuna', nombre: null })).toBe('@yuna');
        expect(urlAvatar(null)).toBeNull();
        expect(urlAvatar({ url: '/v1/perfiles/c1/avatar', miniatura: '/v1/perfiles/c1/avatar/miniatura?v=2' }, 'https://api.test/'))
            .toBe('https://api.test/v1/perfiles/c1/avatar/miniatura?v=2');
        expect(urlAvatar({ url: 'https://cdn.test/a.webp', miniatura: 'https://cdn.test/m.webp' })).toBe('https://cdn.test/m.webp');
    });
});
