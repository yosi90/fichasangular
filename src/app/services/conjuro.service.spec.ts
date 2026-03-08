import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ConjuroCreateRequest } from '../interfaces/conjuros-api';
import { ConjuroService } from './conjuro.service';

describe('ConjuroService crearConjuro', () => {
    function crearPayload(): ConjuroCreateRequest {
        return {
            uid: 'uid-1',
            conjuro: {
                variante: 'base',
                nombre: 'Conjuro prueba',
                descripcion: 'Descripcion de prueba',
                id_manual: 1,
                pagina: 12,
                id_tiempo_lanz: 1,
                id_alcance: 1,
                objetivo: '',
                efecto: 'Efecto',
                area: '',
                duracion: 'Instantaneo',
                tipo_salvacion: 'Voluntad niega',
                descripcion_componentes: 'Foco menor',
                permanente: false,
                oficial: true,
                arcano: true,
                divino: false,
                id_escuela: 1,
                resistencia_conjuros: true,
            },
            componentes: [1],
            descriptores: [2],
            niveles_clase: [{ id_clase: 4, nivel: 2, espontaneo: false }],
        };
    }

    it('devuelve respuesta normalizada cuando el POST es exitoso', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(of({ message: 'Conjuro creado', idConjuro: 9, uid: 'uid-1' }));
        httpMock.get.and.returnValue(of([]));
        const service = new ConjuroService({} as any, httpMock);

        const response = await service.crearConjuro(crearPayload());

        expect(response.idConjuro).toBe(9);
        expect(response.uid).toBe('uid-1');
    });

    it('mapea 409 de duplicado a mensaje específico de nombre', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(
            throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'nombre de conjuro duplicado' } }))
        );
        const service = new ConjuroService({} as any, httpMock);

        await expectAsync(service.crearConjuro(crearPayload()))
            .toBeRejectedWithError('Ya existe un conjuro con ese nombre.');
    });

    it('mapea 403 a error de permisos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(
            throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'forbidden' } }))
        );
        const service = new ConjuroService({} as any, httpMock);

        await expectAsync(service.crearConjuro(crearPayload()))
            .toBeRejectedWithError(/No tienes permisos para crear conjuros/);
    });
});
