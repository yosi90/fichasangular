import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { DoteCreateRequest } from '../interfaces/dotes-api';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { DoteService } from './dote.service';

const firebaseContextMock = {
    run: <T>(fn: () => T) => fn(),
} as FirebaseInjectionContextService;

describe('DoteService crearDote', () => {
    function crearPayload(): DoteCreateRequest {
        return {
            uid: 'uid-1',
            dote: {
                nombre: 'Dote prueba',
                beneficio: 'Beneficio',
                descripcion: 'Descripcion de prueba',
                normal: 'No especifica',
                especial: 'No especifica',
                id_manual: 1,
                pagina: 1,
                id_tipo: 1,
                id_tipo2: 2,
                oficial: true,
                repetible: false,
                repetible_distinto_extra: false,
                repetible_comb: false,
                comp_arma: false,
                extra_arma: false,
                extra_armadura_armaduras: false,
                extra_armadura_escudos: false,
                extra_escuela: false,
                extra_habilidad: false,
            },
        };
    }

    it('devuelve respuesta normalizada cuando el POST es exitoso', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(of({ message: 'Dote creada', idDote: 9, uid: 'uid-1' }));
        httpMock.get.and.returnValue(throwError(() => new Error('refresh fail')));
        const service = new DoteService({} as any, httpMock, firebaseContextMock);

        const response = await service.crearDote(crearPayload());

        expect(response.idDote).toBe(9);
        expect(response.uid).toBe('uid-1');
    });

    it('mapea 409 de duplicado a mensaje específico de nombre', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(
            throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'nombre de dote duplicado' } }))
        );
        const service = new DoteService({} as any, httpMock, firebaseContextMock);

        await expectAsync(service.crearDote(crearPayload()))
            .toBeRejectedWithError('Ya existe una dote con ese nombre.');
    });

    it('mapea 403 a error de permisos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(
            throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'forbidden' } }))
        );
        const service = new DoteService({} as any, httpMock, firebaseContextMock);

        await expectAsync(service.crearDote(crearPayload()))
            .toBeRejectedWithError(/No tienes permisos para crear dotes/);
    });
});
