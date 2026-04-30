import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { ManualService } from './manual.service';

describe('ManualService', () => {
    it('RenovarManuales persiste solo respuestas canónicas de la API', async () => {
        const contextMock = {
            run: jasmine.createSpy('run').and.returnValue(Promise.resolve()),
        } as unknown as FirebaseInjectionContextService;
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([
                { i: 7, n: 'Legacy' },
                { Id: 8, Nombre: 'Manual válido', Incluye_dotes: 1, Oficial: true },
            ])),
        };
        spyOn(Swal, 'fire').and.resolveTo({} as any);

        const service = new ManualService({} as any, httpMock as any, contextMock);

        const ok = await service.RenovarManuales();

        expect(ok).toBeTrue();
        expect((contextMock.run as jasmine.Spy).calls.count()).toBe(1);
    });

    it('patchManualFlags rechaza respuestas abreviadas de la API', async () => {
        const service = new ManualService(
            {} as any,
            {
                patch: jasmine.createSpy('patch').and.returnValue(of({ i: 8, n: 'Legacy' })),
            } as any,
            { run: (fn: any) => fn() } as any,
            { currentUser: { getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-manual') } } as any
        );

        await expectAsync(service.patchManualFlags(8, { Incluye_dotes: true }))
            .toBeRejectedWithError('La API devolvió un manual inválido');
    });

    it('patchManualFlags envia Bearer y solo flags de contenido', async () => {
        const httpMock = {
            patch: jasmine.createSpy('patch').and.returnValue(of({
                Id: 8,
                Nombre: 'Manual válido',
                Incluye_dotes: 1,
                Oficial: true,
            })),
        };
        const service = new ManualService(
            {} as any,
            httpMock as any,
            { run: (fn: any) => fn() } as any,
            { currentUser: { getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-manual') } } as any
        );

        await service.patchManualFlags(8, { Incluye_dotes: true, Incluye_conjuros: false });

        expect(httpMock.patch).toHaveBeenCalledWith(
            `${environment.apiUrl}manuales/8`,
            { Incluye_dotes: true, Incluye_conjuros: false },
            { headers: { Authorization: 'Bearer token-manual' } }
        );
        const body = JSON.stringify(httpMock.patch.calls.mostRecent().args[1]);
        expect(body).not.toContain('uid');
        expect(body).not.toContain('firebaseUid');
        expect(body).not.toContain('createdAt');
        expect(body).not.toContain('createdBy');
        expect(body).not.toContain('modifiedBy');
    });

    it('patchManualFlags exige sesion antes de llamar a la API', async () => {
        const httpMock = {
            patch: jasmine.createSpy('patch'),
        };
        const service = new ManualService(
            {} as any,
            httpMock as any,
            { run: (fn: any) => fn() } as any,
            { currentUser: null } as any
        );

        await expectAsync(service.patchManualFlags(8, { Incluye_dotes: true }))
            .toBeRejectedWithError('Sesión no iniciada');
        expect(httpMock.patch).not.toHaveBeenCalled();
    });

    it('patchManualFlags traduce 401 y 403 de contrato autenticado', async () => {
        const auth = { currentUser: { getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-manual') } } as any;
        const httpMock = {
            patch: jasmine.createSpy('patch')
                .and.returnValues(
                    throwError(() => new HttpErrorResponse({ status: 401 })),
                    throwError(() => new HttpErrorResponse({ status: 403 })),
                ),
        };
        const service = new ManualService(
            {} as any,
            httpMock as any,
            { run: (fn: any) => fn() } as any,
            auth
        );

        await expectAsync(service.patchManualFlags(8, { Incluye_dotes: true }))
            .toBeRejectedWithError('Sesión no válida para actualizar manuales');
        await expectAsync(service.patchManualFlags(8, { Incluye_dotes: true }))
            .toBeRejectedWithError('No tienes permisos para actualizar manuales');
    });
});
