import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { EscuelaConjurosService } from './escuela-conjuros.service';

describe('EscuelaConjurosService', () => {
    it('RenovarEscuelas persiste solo respuestas canónicas de la API', async () => {
        const contextMock = {
            run: jasmine.createSpy('run').and.returnValue(Promise.resolve()),
        } as unknown as FirebaseInjectionContextService;
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([
                { i: 1, n: 'Legacy', ne: 'Legacy', p: 1 },
                { Id: 2, Nombre: 'Evocación', Nombre_esp: 'Evocador', Prohibible: 1 },
            ])),
        };
        spyOn(Swal, 'fire').and.resolveTo({} as any);

        const service = new EscuelaConjurosService({} as any, httpMock as any, contextMock);

        const ok = await service.RenovarEscuelas();

        expect(ok).toBeTrue();
        expect((contextMock.run as jasmine.Spy).calls.count()).toBe(1);
    });
});
