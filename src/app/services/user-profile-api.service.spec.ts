import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { createDefaultUserSettings } from '../interfaces/user-settings';
import { ProfileApiError } from '../interfaces/user-account';
import { UserProfileApiService } from './user-profile-api.service';

describe('UserProfileApiService', () => {
    const authMock = {
        currentUser: {
            getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-settings'),
        },
    } as any;

    it('getMySettings preserva allowDirectMessagesFromNonFriends y envia Bearer', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            version: 1,
            nuevo_personaje: {
                generador_config: null,
                preview_minimizada: null,
                preview_restaurada: null,
            },
            perfil: {
                visibilidadPorDefectoPersonajes: true,
                mostrarPerfilPublico: true,
                allowDirectMessagesFromNonFriends: true,
            },
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const settings = await service.getMySettings();

        expect(settings.perfil.allowDirectMessagesFromNonFriends).toBeTrue();
        const options = httpMock.get.calls.mostRecent().args[1];
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
    });

    it('replaceMySettings hace round-trip del flag allowDirectMessagesFromNonFriends', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.put.and.callFake((_url: string, body: any) => of(body));
        const service = new UserProfileApiService(httpMock, authMock);
        const settings = createDefaultUserSettings();
        settings.perfil.visibilidadPorDefectoPersonajes = true;
        settings.perfil.allowDirectMessagesFromNonFriends = true;

        const response = await service.replaceMySettings(settings);

        expect(response.perfil.allowDirectMessagesFromNonFriends).toBeTrue();
        const [, body, options] = httpMock.put.calls.mostRecent().args;
        expect(body.perfil.allowDirectMessagesFromNonFriends).toBeTrue();
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
    });

    it('getMySettings normaliza defaults sin truncar el documento', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            version: 1,
            perfil: {
                mostrarPerfilPublico: false,
            },
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const settings = await service.getMySettings();

        expect(settings.version).toBe(1);
        expect(settings.nuevo_personaje.generador_config).toBeNull();
        expect(settings.perfil.mostrarPerfilPublico).toBeFalse();
        expect(settings.perfil.allowDirectMessagesFromNonFriends).toBeFalse();
    });

    it('createRoleRequest envia Bearer, normaliza el rol y refresca el estado resultante', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.post.and.returnValue(of(null));
        httpMock.get.and.returnValue(of({
            currentRole: 'jugador',
            requestedRole: 'master',
            status: 'pending',
            blockedUntilUtc: '',
            requestId: '12',
            requestedAtUtc: '2026-03-11T12:00:00.000Z',
            resolvedAtUtc: '',
            eligible: false,
            reasonCode: '',
            currentRoleAtRequest: 'jugador',
            adminComment: '',
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const status = await service.createRoleRequest('MASTER' as any);

        const [, postBody, postOptions] = httpMock.post.calls.argsFor(0);
        expect(postBody).toEqual({ requestedRole: 'master' });
        expect(postOptions.headers.get('Authorization')).toBe('Bearer token-settings');
        const [, getOptions] = httpMock.get.calls.argsFor(0);
        expect(getOptions.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(status.requestId).toBe(12);
        expect(status.blockedUntilUtc).toBeNull();
        expect(status.adminComment).toBeNull();
    });

    it('listRoleRequests filtra parametros invalidos y normaliza los items admin', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of([{
            requestId: '5',
            userId: 'user-1',
            status: 'pending',
            requestedRole: 'master',
            currentRoleAtRequest: 'jugador',
            requestedAtUtc: '2026-03-11T11:00:00.000Z',
            requestedByUserId: '',
            resolvedAtUtc: '',
            resolvedByUserId: '',
            blockedUntilUtc: '',
            adminComment: '',
            uid: 'firebase-user-1',
            displayName: 'Yosi',
            email: '',
            currentRole: 'jugador',
        }]));
        const service = new UserProfileApiService(httpMock, authMock);

        const items = await service.listRoleRequests({
            status: 'pending',
            requestedRole: 'invalido' as any,
        });

        const [, options] = httpMock.get.calls.mostRecent().args;
        expect(options.params).toEqual({ status: 'pending' });
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(items[0].requestId).toBe(5);
        expect(items[0].requestedByUserId).toBeNull();
        expect(items[0].email).toBeNull();
    });

    it('resolveRoleRequest envia decision y limpia adminComment vacio a null', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.patch.and.returnValue(of(void 0));
        const service = new UserProfileApiService(httpMock, authMock);

        await service.resolveRoleRequest(9, {
            decision: 'reject',
            blockedUntilUtc: null,
            adminComment: '   ',
        });

        const [url, body, options] = httpMock.patch.calls.mostRecent().args;
        expect(url).toContain('/usuarios/role-requests/9');
        expect(body).toEqual({
            decision: 'reject',
            blockedUntilUtc: null,
            adminComment: null,
        });
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
    });

    it('getPublicProfile usa cache positiva y evita repetir la llamada HTTP', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            uid: 'uid-publico',
            displayName: 'Perfil publico',
            photoThumbUrl: null,
            memberSince: '2026-01-01T00:00:00.000Z',
            stats: {
                totalPersonajes: 3,
                publicos: 2,
            },
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const first = await service.getPublicProfile('uid-publico');
        const second = await service.getPublicProfile('uid-publico');

        expect(first.displayName).toBe('Perfil publico');
        expect(second.displayName).toBe('Perfil publico');
        expect(httpMock.get.calls.count()).toBe(1);
    });

    it('hasPublicProfile devuelve false en 404 y reutiliza la cache negativa', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(throwError(() => new HttpErrorResponse({
            status: 404,
            error: {
                code: 'PUBLIC_PROFILE_NOT_FOUND',
                message: 'Perfil no disponible',
            },
        })));
        const service = new UserProfileApiService(httpMock, authMock);

        const exists = await service.hasPublicProfile('uid-ausente');

        expect(exists).toBeFalse();
        expect(httpMock.get.calls.count()).toBe(1);

        await expectAsync(service.getPublicProfile('uid-ausente')).toBeRejectedWith(
            jasmine.any(ProfileApiError)
        );
        expect(httpMock.get.calls.count()).toBe(1);
    });
});
