import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ConjuroCreateRequest } from '../interfaces/conjuros-api';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { ConjuroService } from './conjuro.service';
import { normalizeConjuroApi, normalizeConjuroLegacy } from './utils/conjuro-mapper';

const firebaseContextMock = {
    run: <T>(fn: () => T) => fn(),
} as FirebaseInjectionContextService;

describe('ConjuroService', () => {
    const authMock = {
        currentUser: {
            getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-conjuro'),
        },
    } as any;

    class TestConjuroService extends ConjuroService {
        conjuroSnapshotFactory: (() => any) | null = null;
        conjurosSnapshotFactory: (() => any) | null = null;

        protected override watchConjuroPath(_id: number, onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.conjuroSnapshotFactory ? this.conjuroSnapshotFactory() : null);
            return () => undefined;
        }

        protected override watchConjurosPath(onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.conjurosSnapshotFactory ? this.conjurosSnapshotFactory() : null);
            return () => undefined;
        }
    }

    function createConjuroApiSummaryRaw(overrides: any = {}): any {
        return {
            i: 9,
            n: 'Luz',
            d: 'Ilumina un area pequena',
            tl: '1 accion estandar',
            ac: 'Corto',
            es: {
                Id: 1,
                Nombre: 'Evocacion',
                Nombre_esp: 'Luz',
                Prohibible: 1,
            },
            di: {
                Id: 2,
                Nombre: 'Clariaudiencia',
                Nombre_esp: '',
                Subdisciplinas: [{ Id: 3, Nombre: 'Vision' }],
            },
            m: 'PHB p.249',
            ob: '',
            ef: 'Globo de luz',
            ar: '',
            arc: 1,
            div: 0,
            psi: 0,
            alm: 0,
            dur: '10 min/nivel',
            t_s: 'Ninguna',
            r_c: 0,
            r_p: 0,
            d_c: 'V, M',
            per: 0,
            pp: 0,
            da: '',
            des: [{ Id: 5, Nombre: 'Luz' }],
            ncl: [{ Id_clase: 4, Clase: 'Mago', Nivel: 0, Espontaneo: false }],
            nd: [],
            ndis: [],
            coms: [{ Id_componente: 1, Componente: 'Verbal' }],
            o: true,
            ...overrides,
        };
    }

    function crearPayload(): ConjuroCreateRequest {
        return {
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

    it('normaliza el payload HTTP canonico de conjuro', () => {
        const conjuro = normalizeConjuroApi(createConjuroApiSummaryRaw());

        expect(conjuro.Id).toBe(9);
        expect(conjuro.Nombre).toBe('Luz');
        expect(conjuro.Escuela.Nombre_especial).toBe('Luz');
        expect(conjuro.Disciplina.Subdisciplinas).toEqual([{ Id: 3, Nombre: 'Vision' }]);
        expect(conjuro.Nivel_clase).toEqual([{
            Id_clase: 4,
            Clase: 'Mago',
            Nivel: 0,
            Espontaneo: false,
        }]);
        expect(conjuro.Componentes).toEqual([{ Id_componente: 1, Componente: 'Verbal' }]);
    });

    it('descarta aliases legacy en el mapper HTTP de conjuro', () => {
        const conjuro = normalizeConjuroApi(createConjuroApiSummaryRaw({
            Id: 9,
            Nombre: 'Conjuro canonico',
            es: {
                Id: 1,
                Nombre: 'Evocacion',
                Nombre_especial: 'Legacy alias',
                Prohibible: 1,
            },
            di: {
                Id: 2,
                Nombre: 'Clariaudiencia',
                Nombre_especial: 'Legacy alias',
                Subdisciplinas: [{ foo: 3, bar: 'Vision' }],
            },
            alm: undefined,
            Alma: 1,
            des: [{ i: 5, n: 'Luz' }],
            ncl: undefined,
            Nivel_clase: [{ id_clase: 4, Clase: 'Mago', nivel: 0, espontaneo: true }],
            coms: [{ i: 1, n: 'Verbal' }],
        }));

        expect(conjuro.Id).toBe(9);
        expect(conjuro.Nombre).toBe('Conjuro canonico');
        expect(conjuro.Escuela.Nombre_especial).toBe('');
        expect(conjuro.Disciplina.Nombre_especial).toBe('');
        expect(conjuro.Disciplina.Subdisciplinas).toEqual([]);
        expect(conjuro.Alma).toBeFalse();
        expect(conjuro.Descriptores).toEqual([]);
        expect(conjuro.Nivel_clase).toEqual([]);
        expect(conjuro.Componentes).toEqual([]);
    });

    it('mantiene compatibilidad legacy en el mapper compartido de conjuro', () => {
        const conjuro = normalizeConjuroLegacy({
            Id: 9,
            Nombre: 'Conjuro legacy',
            Descripcion: 'Legacy',
            Tiempo_lanzamiento: '1 accion estandar',
            Alcance: 'Corto',
            Escuela: {
                Id: 1,
                Nombre: 'Evocacion',
                Nombre_especial: 'Legacy alias',
                Prohibible: 1,
            },
            Disciplina: {
                Id: 2,
                Nombre: 'Clariaudiencia',
                Nombre_especial: 'Legacy alias',
                Subdisciplinas: [{ i: 3, n: 'Vision' }],
            },
            Manual: 'PHB p.249',
            Efecto: 'Globo de luz',
            Alma: 1,
            Descriptores: [{ i: 5, n: 'Luz' }],
            Nivel_clase: [{ id_clase: 4, Clase: 'Mago', nivel: 0, espontaneo: true }],
            Componentes: [{ i: 1, n: 'Verbal' }],
            Oficial: true,
        });

        expect(conjuro.Id).toBe(9);
        expect(conjuro.Nombre).toBe('Conjuro legacy');
        expect(conjuro.Escuela.Nombre_especial).toBe('Legacy alias');
        expect(conjuro.Disciplina.Nombre_especial).toBe('Legacy alias');
        expect(conjuro.Disciplina.Subdisciplinas).toEqual([{ Id: 3, Nombre: 'Vision' }]);
        expect(conjuro.Alma).toBeTrue();
        expect(conjuro.Descriptores).toEqual([{ Id: 5, Nombre: 'Luz' }]);
        expect(conjuro.Nivel_clase).toEqual([{
            Id_clase: 4,
            Clase: 'Mago',
            Nivel: 0,
            Espontaneo: true,
        }]);
        expect(conjuro.Componentes).toEqual([{ Id_componente: 1, Componente: 'Verbal' }]);
    });

    it('devuelve respuesta normalizada cuando el POST es exitoso', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(of({ message: 'Conjuro creado', idConjuro: 9 }));
        httpMock.get.and.returnValue(of([]));
        const service = new ConjuroService(authMock, {} as any, httpMock, firebaseContextMock);

        const response = await service.crearConjuro(crearPayload());

        expect(response.idConjuro).toBe(9);
        expect(response).toEqual({
            message: 'Conjuro creado',
            idConjuro: 9,
        });
        expect(httpMock.post.calls.mostRecent().args[1]).not.toEqual(jasmine.objectContaining({ uid: jasmine.anything() }));
        expect(httpMock.post).toHaveBeenCalledWith(
            jasmine.any(String),
            jasmine.any(Object),
            jasmine.objectContaining({
                headers: jasmine.objectContaining({
                    Authorization: 'Bearer token-conjuro',
                }),
            })
        );
        const body = JSON.stringify(httpMock.post.calls.mostRecent().args[1]);
        expect(body).not.toContain('uid');
        expect(body).not.toContain('firebaseUid');
        expect(body).not.toContain('createdAt');
    });

    it('mapea 409 de duplicado a mensaje específico de nombre', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(
            throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'nombre de conjuro duplicado' } }))
        );
        const service = new ConjuroService(authMock, {} as any, httpMock, firebaseContextMock);

        await expectAsync(service.crearConjuro(crearPayload()))
            .toBeRejectedWithError('Ya existe un conjuro con ese nombre.');
    });

    it('mapea 403 a error de permisos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(
            throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'forbidden' } }))
        );
        const service = new ConjuroService(authMock, {} as any, httpMock, firebaseContextMock);

        await expectAsync(service.crearConjuro(crearPayload()))
            .toBeRejectedWithError(/No tienes permisos para crear conjuros/);
    });

    it('getConjuro usa fallback HTTP cuando no existe cache RTDB', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.get.and.returnValue(of({ Id: 9, Nombre: 'Luz', Escuela: { Id: 1, Nombre: 'Evocacion' } }));
        spyOn(Swal, 'fire');
        const service = new TestConjuroService(authMock, {} as any, httpMock, firebaseContextMock);
        service.conjuroSnapshotFactory = () => ({
            exists: () => false,
            val: () => null,
        });

        const emitted = await firstValueFrom(service.getConjuro(9));

        expect(httpMock.get).toHaveBeenCalledWith(jasmine.stringMatching(/conjuros\/9$/));
        expect(emitted.Id).toBe(9);
        expect(emitted.Nombre).toBe('Luz');
    });

    it('getConjuro mantiene la ruta legacy cacheada cuando RTDB sí tiene dato', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        const service = new TestConjuroService(authMock, {} as any, httpMock, firebaseContextMock);
        service.conjuroSnapshotFactory = () => ({
            exists: () => true,
            val: () => ({ Id: 9, Nombre: 'Luz cacheada', Escuela: { Id: 1, Nombre: 'Evocacion' } }),
        });

        const emitted = await firstValueFrom(service.getConjuro(9));

        expect(httpMock.get).not.toHaveBeenCalled();
        expect(emitted.Nombre).toBe('Luz cacheada');
    });

    it('getConjuros usa fallback HTTP cuando no existe la colección cacheada', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.get.and.returnValue(of([
            { Id: 9, Nombre: 'Luz' },
            { Id: 10, Nombre: 'Escudo' },
        ]));
        spyOn(Swal, 'fire');
        const service = new TestConjuroService(authMock, {} as any, httpMock, firebaseContextMock);
        service.conjurosSnapshotFactory = () => ({
            exists: () => false,
            forEach: () => undefined,
        });

        const emitted = await firstValueFrom(service.getConjuros());

        expect(httpMock.get).toHaveBeenCalledWith(jasmine.stringMatching(/conjuros$/));
        expect(emitted.map((item) => item.Nombre)).toEqual(['Luz', 'Escudo']);
    });

    it('getConjuros mantiene la ruta legacy cacheada cuando RTDB sí tiene datos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        const service = new TestConjuroService(authMock, {} as any, httpMock, firebaseContextMock);
        service.conjurosSnapshotFactory = () => ({
            exists: () => true,
            forEach: (callback: (item: any) => void) => {
                callback({ val: () => ({ Id: 9, Nombre: 'Luz cacheada' }) });
                callback({ val: () => ({ Id: 10, Nombre: 'Escudo cacheado' }) });
            }
        });

        const emitted = await firstValueFrom(service.getConjuros());

        expect(httpMock.get).not.toHaveBeenCalled();
        expect(emitted.map((item) => item.Nombre)).toEqual(['Luz cacheada', 'Escudo cacheado']);
    });
});
