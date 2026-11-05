import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, HttpHeaders, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { simularTokenApi } from 'src/testing/simular-token-api';
import { CODIGO_NORMAS_PENDIENTES, NormasCreacionInterceptor } from './normas-creacion.interceptor';
import { UserService } from './user.service';

describe('NormasCreacionInterceptor', () => {
    const url = `${environment.apiUrl}personajes/add`;
    const RECHAZO = { error: 'Tienes que aceptar las normas de Rol.', code: CODIGO_NORMAS_PENDIENTES };

    let http: HttpClient;
    let control: HttpTestingController;
    let usuario: { asegurarNormasDeCreacion: jasmine.Spy };

    beforeEach(() => {
        usuario = { asegurarNormasDeCreacion: jasmine.createSpy('asegurarNormasDeCreacion').and.resolveTo(true) };
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                { provide: HTTP_INTERCEPTORS, useClass: NormasCreacionInterceptor, multi: true },
                { provide: UserService, useValue: usuario },
            ],
        });
        http = TestBed.inject(HttpClient);
        control = TestBed.inject(HttpTestingController);
        simularTokenApi('token-nuevo');
    });

    afterEach(() => control.verify());

    async function esperar(): Promise<void> {
        for (let i = 0; i < 10; i++)
            await Promise.resolve();
    }

    it('si la API pide las normas, las ofrece y, aceptadas, repite la petición con el token nuevo', async () => {
        const respuesta = firstValueFrom(http.post(url, { nombre: 'Aldric' }, { headers: new HttpHeaders({ Authorization: 'Bearer token-viejo' }) }));
        control.expectOne(url).flush(RECHAZO, { status: 403, statusText: 'Forbidden' });
        await esperar();

        expect(usuario.asegurarNormasDeCreacion).toHaveBeenCalledOnceWith(true);
        const repetida = control.expectOne(url);
        expect(repetida.request.headers.get('Authorization')).toBe('Bearer token-nuevo');
        expect(repetida.request.body).toEqual({ nombre: 'Aldric' });
        repetida.flush({ idPersonaje: 5 });

        expect(await respuesta).toEqual({ idPersonaje: 5 });
    });

    it('con «Ahora no», a quien llamó le llega el rechazo de siempre', async () => {
        usuario.asegurarNormasDeCreacion.and.resolveTo(false);
        const respuesta = firstValueFrom(http.post(url, {})).then(() => null, (e) => e);
        control.expectOne(url).flush(RECHAZO, { status: 403, statusText: 'Forbidden' });

        const error = await respuesta;
        expect(error).toEqual(jasmine.any(HttpErrorResponse));
        expect(error.error.code).toBe(CODIGO_NORMAS_PENDIENTES);
        control.expectNone(url);
    });

    it('no toca los demás errores ni las llamadas a otras APIs', async () => {
        const otro = firstValueFrom(http.post(url, {})).then(() => null, (e) => e);
        control.expectOne(url).flush({ error: 'Sin permisos.', code: 'FORBIDDEN' }, { status: 403, statusText: 'Forbidden' });
        expect((await otro).status).toBe(403);

        const plataforma = `${environment.plataforma.apiUrl}/v1/perfil`;
        const ajena = firstValueFrom(http.get(plataforma)).then(() => null, (e) => e);
        control.expectOne(plataforma).flush(RECHAZO, { status: 403, statusText: 'Forbidden' });
        expect((await ajena).status).toBe(403);

        expect(usuario.asegurarNormasDeCreacion).not.toHaveBeenCalled();
    });
});
