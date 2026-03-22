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

    it('getMyProfile usa Firestore privado cuando el read model esta disponible', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        const privateUserFirestoreSvcMock = {
            getMyProfile: jasmine.createSpy('getMyProfile').and.resolveTo({
                uid: 'uid-firestore',
                displayName: 'Perfil privado',
                bio: 'Bio',
                genderIdentity: null,
                pronouns: null,
                email: 'perfil@test.dev',
                emailVerified: true,
                authProvider: 'correo',
                photoUrl: null,
                photoThumbUrl: null,
                createdAt: null,
                lastSeenAt: null,
                role: 'jugador',
                permissions: {
                    personajes: { create: true },
                },
            }),
        };
        const service = new UserProfileApiService(httpMock, authMock, privateUserFirestoreSvcMock as any);

        const profile = await service.getMyProfile();

        expect(profile.uid).toBe('uid-firestore');
        expect(profile.permissions['personajes']?.create).toBeTrue();
        expect(httpMock.get).not.toHaveBeenCalled();
    });

    it('getMySettings usa Firestore privado cuando el read model esta disponible', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        const privateUserFirestoreSvcMock = {
            getMySettings: jasmine.createSpy('getMySettings').and.resolveTo({
                version: 1,
                nuevo_personaje: {
                    generador_config: null,
                    preview_minimizada: null,
                    preview_restaurada: null,
                },
                perfil: {
                    visibilidadPorDefectoPersonajes: true,
                    mostrarPerfilPublico: false,
                    allowDirectMessagesFromNonFriends: true,
                },
            }),
        };
        const service = new UserProfileApiService(httpMock, authMock, privateUserFirestoreSvcMock as any);

        const settings = await service.getMySettings();

        expect(settings.perfil.mostrarPerfilPublico).toBeFalse();
        expect(settings.perfil.allowDirectMessagesFromNonFriends).toBeTrue();
        expect(httpMock.get).not.toHaveBeenCalled();
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

    it('getMyProfile normaliza bio, genero, pronombres y permisos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            uid: ' uid-1 ',
            displayName: ' Perfil API ',
            bio: '  Bio con saltos\r\nextra  ',
            genderIdentity: ' No binario ',
            pronouns: ' elle ',
            email: ' perfil@test.dev ',
            emailVerified: true,
            authProvider: 'correo',
            photoUrl: '',
            photoThumbUrl: ' thumb.webp ',
            createdAt: '2026-03-09T12:00:00.000Z',
            lastSeenAt: '2026-03-10T12:00:00.000Z',
            role: 'master',
            permissions: {
                campanas: { create: 1 },
                personajes: { create: true },
                ' ': { create: true },
            },
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const profile = await service.getMyProfile();

        expect(profile.uid).toBe('uid-1');
        expect(profile.bio).toBe('Bio con saltos\nextra');
        expect(profile.genderIdentity).toBe('No binario');
        expect(profile.pronouns).toBe('elle');
        expect(profile.photoUrl).toBeNull();
        expect(profile.photoThumbUrl).toBe('thumb.webp');
        expect(profile.permissions).toEqual({
            campanas: { create: false },
            personajes: { create: true },
        });
        const options = httpMock.get.calls.mostRecent().args[1];
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
    });

    it('updateMyProfile envia Bearer y limpia campos opcionales vacios a null', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.patch.and.returnValue(of({
            uid: 'uid-1',
            displayName: 'Nombre nuevo',
            bio: null,
            genderIdentity: null,
            pronouns: null,
            email: 'perfil@test.dev',
            emailVerified: true,
            authProvider: 'correo',
            photoUrl: null,
            photoThumbUrl: null,
            createdAt: null,
            lastSeenAt: null,
            role: 'jugador',
            permissions: {},
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const profile = await service.updateMyProfile({
            displayName: '  Nombre nuevo ',
            bio: '   ',
            genderIdentity: ' ',
            pronouns: '',
        });

        const [url, body, options] = httpMock.patch.calls.mostRecent().args;
        expect(url).toContain('/usuarios/me');
        expect(body).toEqual({
            displayName: 'Nombre nuevo',
            bio: null,
            genderIdentity: null,
            pronouns: null,
        });
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(profile.displayName).toBe('Nombre nuevo');
        expect(profile.bio).toBeNull();
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
            requestComment: '  Quiero dirigir una campaña propia.  ',
            adminComment: '',
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const status = await service.createRoleRequest('MASTER' as any, '  Quiero dirigir una campaña propia.  ');

        const [, postBody, postOptions] = httpMock.post.calls.argsFor(0);
        expect(postBody).toEqual({
            requestedRole: 'master',
            requestComment: 'Quiero dirigir una campaña propia.',
        });
        expect(postOptions.headers.get('Authorization')).toBe('Bearer token-settings');
        const [, getOptions] = httpMock.get.calls.argsFor(0);
        expect(getOptions.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(status.requestId).toBe(12);
        expect(status.blockedUntilUtc).toBeNull();
        expect(status.requestComment).toBe('Quiero dirigir una campaña propia.');
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
            requestComment: '  Me encargo de revisar contenido y campañas. ',
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
        expect(items[0].requestComment).toBe('Me encargo de revisar contenido y campañas.');
        expect(items[0].email).toBeNull();
    });

    it('resolveRoleRequest envia el body canonico y limpia adminComment vacio a null', async () => {
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
            notifyUser: true,
        });
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
    });

    it('getPublicProfile usa cache positiva y evita repetir la llamada HTTP', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            uid: 'uid-publico',
            displayName: ' Perfil publico ',
            bio: '  Jugador narrativo  ',
            pronouns: ' elle/they ',
            photoThumbUrl: null,
            memberSince: '2026-01-01T00:00:00.000Z',
            stats: {
                totalPersonajes: '3',
                publicos: 2,
                campanasActivas: -1,
                campanasMaster: '4',
                campanasCreadas: null,
            },
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const first = await service.getPublicProfile('uid-publico');
        const second = await service.getPublicProfile('uid-publico');

        expect(first.displayName).toBe('Perfil publico');
        expect(first.bio).toBe('Jugador narrativo');
        expect(first.pronouns).toBe('elle/they');
        expect(first.stats).toEqual({
            totalPersonajes: 3,
            publicos: 2,
            campanasActivas: 0,
            campanasMaster: 4,
            campanasCreadas: 0,
        });
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
