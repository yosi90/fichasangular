import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { DisciplinaConjurosService } from './disciplina-conjuros.service';

describe('DisciplinaConjurosService', () => {
    it('RenovarDisciplinas persiste solo respuestas canónicas de la API', async () => {
        const contextMock = {
            run: jasmine.createSpy('run').and.returnValue(Promise.resolve()),
        } as unknown as FirebaseInjectionContextService;
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([
                { i: 1, n: 'Legacy', ne: 'Legacy', sd: ['Uno'] },
                { Id: 2, Nombre: 'Psicoquinesis', Nombre_esp: 'Psicoquineta', Subdisciplinas: ['Telecinesis'] },
            ])),
        };
        spyOn(Swal, 'fire').and.resolveTo({} as any);

        const service = new DisciplinaConjurosService({} as any, httpMock as any, contextMock);

        const ok = await service.RenovarDisciplinas();

        expect(ok).toBeTrue();
        expect((contextMock.run as jasmine.Spy).calls.count()).toBe(1);
    });
});
