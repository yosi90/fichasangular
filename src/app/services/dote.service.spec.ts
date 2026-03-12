import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { DoteCreateRequest } from '../interfaces/dotes-api';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { DoteService } from './dote.service';
import { normalizeDoteApi, normalizeDoteLegacy } from './utils/dote-mapper';

const firebaseContextMock = {
    run: <T>(fn: () => T) => fn(),
} as FirebaseInjectionContextService;

describe('DoteService', () => {
    const authMock = {
        currentUser: {
            getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-dote'),
        },
    } as any;

    class TestDoteService extends DoteService {
        doteSnapshotFactory: (() => any) | null = null;
        dotesSnapshotFactory: (() => any) | null = null;

        protected override watchDotePath(_id: number, onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.doteSnapshotFactory ? this.doteSnapshotFactory() : null);
            return () => undefined;
        }

        protected override watchDotesPath(onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.dotesSnapshotFactory ? this.dotesSnapshotFactory() : null);
            return () => undefined;
        }
    }

    function createDoteApiRaw(overrides: any = {}): any {
        return {
            Id: 9,
            Nombre: 'Alerta',
            Descripcion: 'Siempre atento',
            Beneficio: '+2 a Escuchar y Avistar',
            Normal: 'No especifica',
            Especial: 'No especifica',
            Manual: {
                Id: 1,
                Nombre: 'PHB',
                Pagina: 10,
            },
            Tipos: [{ Id: 2, Nombre: 'General', Usado: 1 }],
            Repetible: 0,
            Repetible_distinto_extra: 0,
            Repetible_comb: 0,
            Comp_arma: 0,
            Oficial: true,
            Extras_soportados: {
                Extra_arma: 0,
                Extra_armadura: 1,
                Extra_armadura_armaduras: 1,
                Extra_armadura_escudos: 0,
                Extra_escuela: 0,
                Extra_habilidad: 0,
            },
            Extras_disponibles: {
                Armas: [],
                Armaduras: [{ Id: 3, Nombre: 'Escudo ligero', Es_escudo: true }],
                Escuelas: [],
                Habilidades: [],
            },
            Modificadores: {
                iniciativa: 2,
            },
            Prerrequisitos: {
                dote: [],
                caracteristica: [],
            },
            ...overrides,
        };
    }

    function crearPayload(): DoteCreateRequest {
        return {
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

    it('normaliza el payload HTTP canonico de dote', () => {
        const dote = normalizeDoteApi(createDoteApiRaw());

        expect(dote.Id).toBe(9);
        expect(dote.Nombre).toBe('Alerta');
        expect(dote.Manual).toEqual({ Id: 1, Nombre: 'PHB', Pagina: 10 });
        expect(dote.Tipos).toEqual([{ Id: 2, Nombre: 'General', Usado: 1 }]);
        expect(dote.Extras_disponibles.Armaduras).toEqual([{ Id: 3, Nombre: 'Escudo ligero', Es_escudo: true }]);
        expect(dote.Modificadores).toEqual({ iniciativa: 2 });
    });

    it('descarta aliases legacy en el mapper HTTP de dote', () => {
        const dote = normalizeDoteApi(createDoteApiRaw({
            Manual: 'PHB p.10',
            Tipos: [{ id: 2, nombre: 'General', usado: 1 }],
            Extras_disponibles: {
                Armas: [],
                Armaduras: [{ id: 3, nombre: 'Escudo ligero', Es_escudo: true }],
                Escuelas: [],
                Habilidades: [],
            },
            Extras_soportados: {
                Extra_arma: 0,
                Extra_armadura: 1,
            },
        }));

        expect(dote.Manual).toEqual({ Id: 0, Nombre: '', Pagina: 0 });
        expect(dote.Tipos).toEqual([]);
        expect(dote.Extras_disponibles.Armaduras).toEqual([]);
        expect(dote.Extras_soportados.Extra_armadura_armaduras).toBe(0);
        expect(dote.Extras_soportados.Extra_armadura_escudos).toBe(0);
        expect(dote.Extras_soportados.Extra_armadura).toBe(1);
    });

    it('mantiene compatibilidad legacy en el mapper compartido de dote', () => {
        const dote = normalizeDoteLegacy({
            Id: 9,
            Nombre: 'Alerta',
            Descripcion: 'Siempre atento',
            Beneficio: '+2 a Escuchar y Avistar',
            Manual: 'PHB p.10',
            Tipos: [{ Id: 2, Nombre: 'General', Usado: 1 }],
            Extras_soportados: {
                Extra_arma: 0,
                Extra_armadura: 1,
            },
            Extras_disponibles: {
                Armaduras: [{ Id: 3, Nombre: 'Escudo ligero', Es_escudo: true }],
            },
            Modificadores: {
                iniciativa: 2,
            },
            Prerrequisitos: {
                dote: [],
            },
        });

        expect(dote.Manual).toEqual({ Id: 0, Nombre: 'PHB p.10', Pagina: 0 });
        expect(dote.Tipos).toEqual([{ Id: 2, Nombre: 'General', Usado: 1 }]);
        expect(dote.Extras_disponibles.Armaduras).toEqual([{ Id: 3, Nombre: 'Escudo ligero', Es_escudo: true }]);
        expect(dote.Extras_soportados.Extra_armadura_armaduras).toBe(1);
        expect(dote.Extras_soportados.Extra_armadura_escudos).toBe(1);
    });

    it('devuelve respuesta normalizada cuando el POST es exitoso', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(of({ message: 'Dote creada', idDote: 9, uid: 'uid-1' }));
        httpMock.get.and.returnValue(throwError(() => new Error('refresh fail')));
        const service = new DoteService(authMock, {} as any, httpMock, firebaseContextMock);

        const response = await service.crearDote(crearPayload());

        expect(response.idDote).toBe(9);
        expect(response).toEqual({
            message: 'Dote creada',
            idDote: 9,
        });
        expect(httpMock.post.calls.mostRecent().args[1]).not.toEqual(jasmine.objectContaining({ uid: jasmine.anything() }));
        expect(httpMock.post).toHaveBeenCalledWith(
            jasmine.any(String),
            jasmine.any(Object),
            jasmine.objectContaining({
                headers: jasmine.objectContaining({
                    Authorization: 'Bearer token-dote',
                }),
            })
        );
    });

    it('mapea 409 de duplicado a mensaje específico de nombre', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(
            throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'nombre de dote duplicado' } }))
        );
        const service = new DoteService(authMock, {} as any, httpMock, firebaseContextMock);

        await expectAsync(service.crearDote(crearPayload()))
            .toBeRejectedWithError('Ya existe una dote con ese nombre.');
    });

    it('mapea 403 a error de permisos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.post.and.returnValue(
            throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'forbidden' } }))
        );
        const service = new DoteService(authMock, {} as any, httpMock, firebaseContextMock);

        await expectAsync(service.crearDote(crearPayload()))
            .toBeRejectedWithError(/No tienes permisos para crear dotes/);
    });

    it('getDote usa fallback HTTP cuando no existe cache RTDB', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.get.and.returnValue(of({ Id: 9, Nombre: 'Alerta' }));
        spyOn(Swal, 'fire');
        const service = new TestDoteService(authMock, {} as any, httpMock, firebaseContextMock);
        service.doteSnapshotFactory = () => ({
            exists: () => false,
            val: () => null,
        });

        const emitted = await firstValueFrom(service.getDote(9));

        expect(httpMock.get).toHaveBeenCalledWith(jasmine.stringMatching(/dotes\/9$/));
        expect(emitted.Id).toBe(9);
        expect(emitted.Nombre).toBe('Alerta');
    });

    it('getDote mantiene la ruta legacy cacheada cuando RTDB sí tiene dato', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        const service = new TestDoteService(authMock, {} as any, httpMock, firebaseContextMock);
        service.doteSnapshotFactory = () => ({
            exists: () => true,
            val: () => ({ Id: 9, Nombre: 'Alerta cacheada' }),
        });

        const emitted = await firstValueFrom(service.getDote(9));

        expect(httpMock.get).not.toHaveBeenCalled();
        expect(emitted.Nombre).toBe('Alerta cacheada');
    });

    it('getDotes usa fallback HTTP cuando no existe la colección cacheada', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        httpMock.get.and.returnValue(of([
            { Id: 9, Nombre: 'Alerta' },
            { Id: 10, Nombre: 'Soltura' },
        ]));
        spyOn(Swal, 'fire');
        const service = new TestDoteService(authMock, {} as any, httpMock, firebaseContextMock);
        service.dotesSnapshotFactory = () => ({
            exists: () => false,
            forEach: () => undefined,
        });

        const emitted = await firstValueFrom(service.getDotes());

        expect(httpMock.get).toHaveBeenCalledWith(jasmine.stringMatching(/dotes$/));
        expect(emitted.map((item) => item.Nombre)).toEqual(['Alerta', 'Soltura']);
    });

    it('getDotes mantiene la ruta legacy cacheada cuando RTDB sí tiene datos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post', 'get']);
        const service = new TestDoteService(authMock, {} as any, httpMock, firebaseContextMock);
        service.dotesSnapshotFactory = () => ({
            exists: () => true,
            forEach: (callback: (item: any) => void) => {
                callback({ val: () => ({ Id: 9, Nombre: 'Alerta cacheada' }) });
                callback({ val: () => ({ Id: 10, Nombre: 'Soltura cacheada' }) });
            }
        });

        const emitted = await firstValueFrom(service.getDotes());

        expect(httpMock.get).not.toHaveBeenCalled();
        expect(emitted.map((item) => item.Nombre)).toEqual(['Alerta cacheada', 'Soltura cacheada']);
    });
});
