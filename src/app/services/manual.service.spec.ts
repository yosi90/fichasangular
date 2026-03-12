import { of } from 'rxjs';
import Swal from 'sweetalert2';
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
            { run: (fn: any) => fn() } as any
        );

        await expectAsync(service.patchManualFlags(8, { Incluye_dotes: true }))
            .toBeRejectedWithError('La API devolvió un manual inválido');
    });
});
