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
    const ruta = `${environment.apiUrl}personajes/12/voz`;

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

    it('lee la voz guardada con el token de la API', async () => {
        const { resultado, peticion } = await responder(servicio.guardada(12), 'GET', ruta, {
            texto: 'Hola', proveedor: 'elevenlabs', voz: 'emilio', nombreVoz: 'Emilio', modelo: 'm', tipo: 'audio/mpeg', creada: 'x',
            audio: '/personajes/12/voz/audio',
        });
        expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-api');
        expect((resultado as any).nombreVoz).toBe('Emilio');
    });

    it('sin voz guardada es null, y sin sesión no manda token', async () => {
        sesion.estado = { tipo: 'sin_sesion' };
        const { resultado, peticion } = await responder(servicio.guardada(12), 'GET', ruta,
            { error: 'Este personaje aún no tiene voz.', code: 'sin_voz' }, { status: 404, statusText: 'Not Found' });
        expect(resultado).toBeNull();
        expect(peticion.request.headers.has('Authorization')).toBeFalse();
    });

    it('genera con la voz elegida', async () => {
        const cuerpo = { texto: 'Hola', proveedor: 'openai' as const, voz: 'alloy', nombreVoz: 'Alloy' };
        const { peticion } = await responder(servicio.generar(12, cuerpo), 'POST', ruta, { ...cuerpo, modelo: 'tts-1', tipo: 'audio/mpeg', creada: 'x' });
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
