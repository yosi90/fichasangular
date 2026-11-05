import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NormasCreacionError } from '../interfaces/normas-rol';
import { NormasCreacionService } from './normas-creacion.service';
import { EstadoPlataforma, PlatformSessionService } from './platform-session.service';

describe('NormasCreacionService', () => {
    const urlNormas = `${environment.plataforma.apiUrl}/v1/webs/rol/normas`;
    const urlAceptar = `${environment.plataforma.apiUrl}/v1/cuenta/normas/7/aceptacion`;
    const CUENTA = { id: 'c1', alias: 'aldric', correo: null };
    const PENDIENTES = { id: 7, version: 2, titulo: 'Normas de Rol', importante: true, publicadas: '2026-11-01' };
    const NORMAS = { id: 7, version: 2, titulo: 'Normas de Rol', texto: '### Qué es Rol\n\nUn creador de fichas.', importante: true, publicadas: '2026-11-01' };

    let service: NormasCreacionService;
    let http: HttpTestingController;
    let estado$: BehaviorSubject<EstadoPlataforma>;
    let sesion: { estado$: any; readonly estado: EstadoPlataforma; tokenPlataforma: jasmine.Spy; renovarSesion: jasmine.Spy };
    let dialog: { open: jasmine.Spy };

    beforeEach(() => {
        estado$ = new BehaviorSubject<EstadoPlataforma>({ tipo: 'con_sesion', cuenta: CUENTA, normasPendientes: PENDIENTES });
        sesion = {
            estado$: estado$.asObservable(),
            get estado() { return estado$.value; },
            tokenPlataforma: jasmine.createSpy('tokenPlataforma').and.resolveTo('token-plataforma'),
            // Lo que hace el SDK al renovar: el estado llega sin normas pendientes.
            renovarSesion: jasmine.createSpy('renovarSesion').and.callFake(async () => {
                estado$.next({ tipo: 'con_sesion', cuenta: CUENTA });
                return estado$.value;
            }),
        };
        dialog = { open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(true) }) };
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: PlatformSessionService, useValue: sesion },
                { provide: MatDialog, useValue: dialog },
            ],
        });
        service = TestBed.inject(NormasCreacionService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('lee las normas vigentes de Rol sin token', async () => {
        const promesa = service.leer();
        const req = http.expectOne(urlNormas);
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.has('Authorization')).toBeFalse();
        req.flush(NORMAS);

        expect(await promesa).toEqual(NORMAS);
    });

    it('si no puede leerlas, lo dice en una frase', async () => {
        const promesa = service.leer();
        http.expectOne(urlNormas).flush({ error: 'x', code: 'normas_no_encontradas' }, { status: 404, statusText: 'Not Found' });

        await expectAsync(promesa).toBeRejectedWith(jasmine.any(NormasCreacionError));
    });

    it('acepta con el token de la plataforma y espera a la sesión renovada', async () => {
        const promesa = service.aceptar(7);
        await Promise.resolve();
        await Promise.resolve();
        const req = http.expectOne(urlAceptar);
        expect(req.request.method).toBe('POST');
        expect(req.request.headers.get('Authorization')).toBe('Bearer token-plataforma');
        req.flush(NORMAS);

        await promesa;
        expect(sesion.renovarSesion).toHaveBeenCalled();
        expect(estado$.value).toEqual({ tipo: 'con_sesion', cuenta: CUENTA });
    });

    it('si las normas cambiaron mientras se leían, falla con normas_no_vigentes', async () => {
        const promesa = service.aceptar(7);
        await Promise.resolve();
        await Promise.resolve();
        http.expectOne(urlAceptar).flush({ error: 'Ya no son las vigentes.', code: 'normas_no_vigentes' }, { status: 409, statusText: 'Conflict' });

        const error = await promesa.then(() => null, (e) => e);
        expect(error).toEqual(jasmine.any(NormasCreacionError));
        expect(error.code).toBe('normas_no_vigentes');
        expect(sesion.renovarSesion).not.toHaveBeenCalled();
    });

    it('si la sesión no llega renovada, avisa en vez de seguir con el token viejo', fakeAsync(() => {
        sesion.renovarSesion.and.callFake(async () => estado$.value);
        let error: any = null;
        service.aceptar(7).catch((e) => error = e);
        flushMicrotasks();
        http.expectOne(urlAceptar).flush(NORMAS);
        flushMicrotasks();
        tick(5_000);

        expect(error).toEqual(jasmine.any(NormasCreacionError));
        expect(error.code).toBe('sin_renovar');
    }));

    it('abre la ventana una sola vez aunque la pidan dos a la vez, y devuelve lo que se decide', async () => {
        const [a, b] = await Promise.all([service.pedir(), service.pedir()]);

        expect(a).toBeTrue();
        expect(b).toBeTrue();
        expect(dialog.open).toHaveBeenCalledTimes(1);
    });

    it('«Ahora no» (o cerrar la ventana) resuelve false', async () => {
        dialog.open.and.returnValue({ afterClosed: () => of(undefined) });

        expect(await service.pedir()).toBeFalse();
    });
});
