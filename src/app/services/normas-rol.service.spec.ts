import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { NormasRolService } from './normas-rol.service';

describe('NormasRolService', () => {
    const url = `${environment.plataforma.apiUrl}/v1/webs/rol/normas`;
    let service: NormasRolService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(NormasRolService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('lee las normas vigentes de Rol sin token', async () => {
        const normas = service.leer();
        const req = http.expectOne(url);
        expect(req.request.headers.has('Authorization')).toBeFalse();
        req.flush({ id: 7, web: 'rol', version: 2, titulo: 'Normas de Rol', texto: '### Qué es Rol', importante: true, publicadas: '2026-11-01T10:00:00Z' });

        expect(await normas).toEqual({ id: 7, version: 2, titulo: 'Normas de Rol', texto: '### Qué es Rol', importante: true, publicadas: '2026-11-01T10:00:00Z' });
    });

    it('sin texto o sin normas publicadas, falla', async () => {
        const vacias = service.leer();
        http.expectOne(url).flush({ id: 7, texto: '  ' });
        await expectAsync(vacias).toBeRejected();

        const ninguna = service.leer();
        http.expectOne(url).flush({ code: 'normas_no_encontradas' }, { status: 404, statusText: 'Not Found' });
        await expectAsync(ninguna).toBeRejected();
    });
});
