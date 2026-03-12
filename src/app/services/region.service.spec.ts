import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { RegionService } from './region.service';

describe('RegionService', () => {
    it('RenovarRegiones persiste solo respuestas canónicas de la API', async () => {
        const contextMock = {
            run: jasmine.createSpy('run').and.returnValue(Promise.resolve()),
        } as unknown as FirebaseInjectionContextService;
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([
                { i: 1, n: 'Legacy' },
                { Id: 2, Nombre: 'Bosque', Oficial: true },
            ])),
        };
        spyOn(Swal, 'fire').and.resolveTo({} as any);

        const service = new RegionService({} as any, httpMock as any, contextMock);

        const ok = await service.RenovarRegiones();

        expect(ok).toBeTrue();
        expect((contextMock.run as jasmine.Spy).calls.count()).toBe(1);
    });
});
