import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { cifra, combinarTexto, datoDemasiadoLargo, datosIdeaDePersonaje, IdeasIaError, IdeasIaService, limpiarDatos } from './ideas-ia.service';
import { PlatformSessionService } from './platform-session.service';

describe('IdeasIaService', () => {
    let service: IdeasIaService;
    let http: HttpTestingController;
    let session: { estado: any; tokenApi: jasmine.Spy; tokenPlataforma: jasmine.Spy; urlSocial: jasmine.Spy };

    const urlEstado = `${environment.plataforma.apiUrl}/v1/ia/estado`;
    const urlModelos = `${environment.plataforma.apiUrl}/v1/ia/modelos`;
    const urlIdeas = `${environment.apiUrl}personajes/ideas`;

    async function esperarPeticion(url: string) {
        for (let i = 0; i < 20; i++) {
            const encontradas = http.match(url);
            if (encontradas.length > 0)
                return encontradas[0];
            await Promise.resolve();
        }
        return http.expectOne(url);
    }

    /** Responde a `GET /v1/ia/estado`, que `pedir` consulta para saber el proveedor preferido (kit 1.54). */
    async function responderEstado(preferidos: Record<string, string | null> = {}, listos: string[] = ['anthropic', 'openai']) {
        (await esperarPeticion(urlEstado)).flush({ proveedores: listos.map(proveedor => ({ proveedor, estado: 'lista' })), preferidos });
    }

    beforeEach(() => {
        session = {
            estado: { tipo: 'con_sesion', cuenta: { id: 'c1', alias: 'yosi', correo: null } },
            tokenApi: jasmine.createSpy('tokenApi').and.resolveTo('token-api'),
            tokenPlataforma: jasmine.createSpy('tokenPlataforma').and.resolveTo('token-plataforma'),
            urlSocial: jasmine.createSpy('urlSocial').and.callFake((vista: string) => `https://qa-social.yosiftware.es/?vista=${vista}`),
        };
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: PlatformSessionService, useValue: session },
            ],
        });
        service = TestBed.inject(IdeasIaService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('sin sesión no pregunta a la plataforma', async () => {
        session.estado = { tipo: 'sin_sesion' };
        expect(await service.disponibilidad()).toBe('sin_sesion');
        expect(session.tokenPlataforma).not.toHaveBeenCalled();
    });

    it('está lista si algún proveedor tiene clave lista, con el token de la plataforma', async () => {
        const promesa = service.disponibilidad();
        const req = await esperarPeticion(urlEstado);
        expect(req.request.headers.get('Authorization')).toBe('Bearer token-plataforma');
        req.flush({ proveedores: [{ proveedor: 'anthropic', estado: 'sin_clave_de_ia' }, { proveedor: 'openai', estado: 'lista' }] });
        expect(await promesa).toBe('lista');
    });

    it('sin ninguna clave lista enlaza la gestión, y comparte la consulta un momento', async () => {
        const primera = service.disponibilidad();
        const segunda = service.disponibilidad();
        const req = await esperarPeticion(urlEstado);
        req.flush({ proveedores: [{ proveedor: 'anthropic', estado: 'tope_sin_fijar' }, { proveedor: 'openai', estado: 'sin_clave_de_ia' }] });
        expect(await primera).toBe('sin_clave');
        expect(await segunda).toBe('sin_clave');
        expect(service.urlGestion).toBe('https://qa-social.yosiftware.es/?vista=claves-ia');

        service.olvidarEstado();
        const tercera = service.disponibilidad();
        (await esperarPeticion(urlEstado)).flush({ proveedores: [{ proveedor: 'openai', estado: 'lista' }] });
        expect(await tercera).toBe('lista');
    });

    it('si la plataforma falla, no se ofrece', async () => {
        const promesa = service.disponibilidad();
        (await esperarPeticion(urlEstado)).flush({ error: 'x' }, { status: 503, statusText: 'No' });
        expect(await promesa).toBe('no_disponible');
    });

    it('pide la idea a la API de Rol con el token de la API y sin campos vacíos', async () => {
        const promesa = service.pedir('trasfondo', { nombre: ' Thorin ', raza: '', clases: [{ nombre: 'Guerrero', nivel: 3 }, { nombre: ' ' }] });
        await responderEstado();
        const req = await esperarPeticion(urlIdeas);
        expect(req.request.method).toBe('POST');
        expect(req.request.headers.get('Authorization')).toBe('Bearer token-api');
        expect(req.request.body).toEqual({ tipo: 'trasfondo', datos: { nombre: 'Thorin', clases: [{ nombre: 'Guerrero', nivel: 3 }] } });
        req.flush({ texto: ' Nació en la forja. ', proveedor: 'anthropic', modelo: 'claude-haiku-5-5', recortada: false });
        expect(await promesa).toEqual({ texto: 'Nació en la forja.', proveedor: 'anthropic', modelo: 'claude-haiku-5-5', recortada: false });
    });

    it('manda el modelo elegido de la lista', async () => {
        service.seleccion.set({ proveedor: 'openai', modelo: 'gpt-5.4', nombre: 'gpt-5.4' });
        const promesa = service.pedir('frase', {});
        const req = await esperarPeticion(urlIdeas);
        expect(req.request.body).toEqual({ tipo: 'frase', datos: {}, proveedor: 'openai', modelo: 'gpt-5.4' });
        req.flush({ texto: 'Hola', proveedor: 'openai', modelo: 'gpt-5.4', recortada: true });
        expect((await promesa).recortada).toBeTrue();
    });

    it('sin modelo elegido, manda el proveedor preferido para el texto si está listo (kit 1.54)', async () => {
        const promesa = service.pedir('frase', {});
        await responderEstado({ texto: 'openai', voz: 'elevenlabs' });
        const req = await esperarPeticion(urlIdeas);
        expect(req.request.body).toEqual({ tipo: 'frase', datos: {}, proveedor: 'openai' });
        req.flush({ texto: 'Hola', proveedor: 'openai', modelo: 'gpt-5.4-mini', recortada: false });
        await promesa;
    });

    it('si el preferido no está listo, no manda proveedor y decide la API', async () => {
        const promesa = service.pedir('frase', {});
        await responderEstado({ texto: 'openai' }, ['anthropic']);
        const req = await esperarPeticion(urlIdeas);
        expect(req.request.body).toEqual({ tipo: 'frase', datos: {} });
        req.flush({ texto: 'Hola', proveedor: 'anthropic', modelo: 'claude-haiku-5-5', recortada: false });
        await promesa;
        expect(await service.preferido('texto')).toBeNull();
    });

    it('traduce los errores con el formato objetivo y olvida el estado si es de la clave', async () => {
        const olvidar = spyOn(service, 'olvidarEstado').and.callThrough();
        const promesa = service.pedir('frase', {});
        await responderEstado();
        (await esperarPeticion(urlIdeas)).flush(
            { error: 'Tu clave de IA no tiene un tope de gasto.', code: 'tope_sin_fijar', field: null, debug: { message: 'x', requestId: 'r' } },
            { status: 409, statusText: 'Conflict' },
        );
        const error = await promesa.catch(e => e);
        expect(error).toEqual(jasmine.any(IdeasIaError));
        expect(error.message).toBe('Tu clave de IA no tiene un tope de gasto.');
        expect(error.code).toBe('tope_sin_fijar');
        expect(error.status).toBe(409);
        expect(error.esDeLaClave).toBeTrue();
        expect(olvidar).toHaveBeenCalled();
    });

    it('un dato más largo que su máximo no se pide (kit 1.58) y se explica como la API', async () => {
        const error = await service.pedir('trasfondo', { nombre: 'Thorin', trasfondo: 'y'.repeat(20001) }).catch(e => e);
        expect(error instanceof IdeasIaError).toBeTrue();
        expect(error.code).toBe('texto_demasiado_largo');
        expect(error.field).toBe('datos.trasfondo');
        expect(error.message).toBe('El trasfondo: como mucho, 20 000 caracteres.');
        http.expectNone(urlIdeas);
        http.expectNone(urlEstado);
    });

    it('sin sesión de la API no llama', async () => {
        session.tokenApi.and.rejectWith(new Error('Sesión no iniciada'));
        const promesa = service.pedir('frase', {}).catch(e => e);
        await responderEstado();
        const error = await promesa;
        expect(error.code).toBe('UNAUTHORIZED');
        http.expectNone(urlIdeas);
    });

    it('lista los modelos de la clave por proveedor', async () => {
        const promesa = service.modelos();
        (await esperarPeticion(urlModelos)).flush({ proveedores: [
            { proveedor: 'anthropic', modelos: [{ id: 'claude-haiku-5-5', nombre: 'Claude Haiku 5.5' }, { id: '' }], error: null },
            { proveedor: 'openai', modelos: [], error: 'sin_clave_de_ia' },
            { proveedor: 'otro', modelos: [{ id: 'x' }] },
        ] });
        expect(await promesa).toEqual([
            { proveedor: 'anthropic', modelos: [{ id: 'claude-haiku-5-5', nombre: 'Claude Haiku 5.5' }], error: null },
            { proveedor: 'openai', modelos: [], error: 'sin_clave_de_ia' },
        ]);
    });
});

describe('ideas-ia: datos y texto', () => {
    it('saca los datos de un personaje sin la campaña por defecto', () => {
        const datos = datosIdeaDePersonaje({
            Nombre: 'Thorin', Raza: { Nombre: 'Enano' } as any, desgloseClases: [{ Nombre: 'Guerrero', Nivel: 3 }],
            Alineamiento: 'Legal bueno', Deidad: 'Moradin', Genero: 'Masculino', Edad: 0, Region: { Id: 1, Nombre: 'Montañas' },
            Campana: 'Sin campaña', Contexto: '', Personalidad: 'Gruñón',
        });
        expect(datos).toEqual({
            nombre: 'Thorin', raza: 'Enano', alineamiento: 'Legal bueno', deidad: 'Moradin', genero: 'Masculino',
            region: 'Montañas', personalidad: 'Gruñón', clases: [{ nombre: 'Guerrero', nivel: 3 }],
        });
        expect(datosIdeaDePersonaje(null)).toEqual({});
        expect(limpiarDatos({ edad: 120, campana: 'La costa' })).toEqual({ campana: 'La costa', edad: 120 });
    });

    it('cuenta los textos como la API: los cortos sin espacios de sobra, los largos con sus párrafos', () => {
        expect(limpiarDatos({ nombre: ' Thorin   Escudo\n de Roble ', trasfondo: ' Uno.\n\nDos. ' }))
            .toEqual({ nombre: 'Thorin Escudo de Roble', trasfondo: 'Uno.\n\nDos.' });
        expect(datoDemasiadoLargo({ nombre: 'x'.repeat(150), trasfondo: 'y'.repeat(20000), personalidad: 'z'.repeat(10000) })).toBeNull();
        expect(datoDemasiadoLargo({ nombre: 'x'.repeat(151) })?.message).toBe('El nombre: como mucho, 150 caracteres.');
        expect(datoDemasiadoLargo({ clases: [{ nombre: 'c'.repeat(101) }] })?.field).toBe('datos.clases.nombre');
        expect(cifra(2000)).toBe('2000');
        expect(cifra(10000)).toBe('10 000');
    });

    it('sustituye o añade al final con una línea en blanco', () => {
        expect(combinarTexto('Viejo', 'Nuevo', 'sustituir')).toBe('Nuevo');
        expect(combinarTexto('Viejo\n', ' Nuevo ', 'anadir')).toBe('Viejo\n\nNuevo');
        expect(combinarTexto('  ', 'Nuevo', 'anadir')).toBe('Nuevo');
    });
});
