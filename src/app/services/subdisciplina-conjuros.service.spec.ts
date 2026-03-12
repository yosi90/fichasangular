import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { SubdisciplinaConjurosService } from './subdisciplina-conjuros.service';

describe('SubdisciplinaConjurosService', () => {
    it('RenovarSubdisciplinas persiste solo respuestas canónicas de la API', async () => {
        const contextMock = {
            run: jasmine.createSpy('run').and.returnValue(Promise.resolve()),
        } as unknown as FirebaseInjectionContextService;
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([
                { i: 1, n: 'Legacy', d: 9 },
                { Id: 2, Nombre: 'Telecinesis', Id_disciplina: 7 },
            ])),
        };
        spyOn(Swal, 'fire').and.resolveTo({} as any);

        const service = new SubdisciplinaConjurosService({} as any, httpMock as any, contextMock);

        const ok = await service.RenovarSubdisciplinas();

        expect(ok).toBeTrue();
        expect((contextMock.run as jasmine.Spy).calls.count()).toBe(1);
    });
});
