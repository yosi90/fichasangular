import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { IdeasIaError, IdeasIaService } from './ideas-ia.service';
import { PlatformSessionService } from './platform-session.service';
import { VozPersonajeService } from './voz-personaje.service';

describe('VozPersonajeService', () => {
    let servicio: VozPersonajeService;
    let http: HttpTestingController;
    let sesion: { estado: any; tokenApi: jasmine.Spy };
    let ideas: { olvidarEstado: jasmine.Spy };
    const ruta = `${environment.apiUrl}personajes/12/voces`;

    beforeEach(() => {
        sesion = { estado: { tipo: 'con_sesion' }, tokenApi: jasmine.createSpy('tokenApi').and.resolveTo('token-api') };
        ideas = { olvidarEstado: jasmine.createSpy('olvidarEstado') };
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: PlatformSessionService, useValue: sesion },
                { provide: IdeasIaService, useValue: ideas },
            ],
        });
        servicio = TestBed.inject(VozPersonajeService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    async function responder<T>(promesa: Promise<T>, metodo: string, url: string, cuerpo: any, opciones: any = {}) {
        await Promise.resolve();
        await Promise.resolve();
        const peticion = http.expectOne(r => r.url === url && r.method === metodo);
        peticion.flush(cuerpo, opciones);
        return { resultado: await promesa.catch(e => e), peticion };
    }

    it('lee sus voces guardadas con el token de la API', async () => {
        const { resultado, peticion } = await responder(servicio.voces(12), 'GET', ruta, {
            voces: [{
                id: 4, texto: 'Hola', proveedor: 'elevenlabs', voz: 'emilio', nombreVoz: 'Emilio', modelo: 'm', tipo: 'audio/mpeg', creada: 'x',
                audio: '/personajes/12/voces/4/audio',
            }],
            maximo: 3,
        });
        expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-api');
        expect((resultado as any).maximo).toBe(3);
        expect((resultado as any).voces[0].id).toBe(4);
        expect((resultado as any).voces[0].nombreVoz).toBe('Emilio');
    });

    it('sin voces la lista está vacía, y sin sesión no manda token', async () => {
        sesion.estado = { tipo: 'sin_sesion' };
        const { resultado, peticion } = await responder(servicio.voces(12), 'GET', ruta, { voces: [], maximo: 3 });
        expect((resultado as any).voces).toEqual([]);
        expect(peticion.request.headers.has('Authorization')).toBeFalse();
    });

    it('el audio y el descarte van a la voz concreta', async () => {
        const audio = await responder(servicio.audio(12, 4), 'GET', `${ruta}/4/audio`, new Blob(['mp3']));
        expect(audio.peticion.request.responseType).toBe('blob');
        const descarte = await responder(servicio.descartar(12, 4), 'DELETE', `${ruta}/4`, null, { status: 204, statusText: 'No Content' });
        expect(descarte.peticion.request.headers.get('Authorization')).toBe('Bearer token-api');
    });

    it('genera con la voz elegida', async () => {
        const cuerpo = { texto: 'Hola', proveedor: 'openai' as const, voz: 'alloy', nombreVoz: 'Alloy' };
        const { peticion } = await responder(servicio.generar(12, cuerpo), 'POST', ruta, { ...cuerpo, id: 5, modelo: 'tts-1', tipo: 'audio/mpeg', creada: 'x' });
        expect(peticion.request.body).toEqual(cuerpo);
    });

    it('un error de la clave se explica y olvida el estado de la IA', async () => {
        const { resultado } = await responder(servicio.generar(12, { texto: 'Hola', proveedor: 'elevenlabs', voz: 'v' }), 'POST', ruta,
            { error: 'Tus claves de IA han llegado a su tope.', code: 'tope_de_gasto' }, { status: 429, statusText: 'Too Many' });
        expect(resultado instanceof IdeasIaError).toBeTrue();
        expect((resultado as IdeasIaError).message).toBe('Tus claves de IA han llegado a su tope.');
        expect(ideas.olvidarEstado).toHaveBeenCalled();
    });

    it('generar sin sesión no llama a la API', async () => {
        sesion.estado = { tipo: 'sin_sesion' };
        const error = await servicio.generar(12, { texto: 'Hola', proveedor: 'elevenlabs', voz: 'v' }).catch(e => e);
        expect((error as IdeasIaError).status).toBe(401);
    });
});
