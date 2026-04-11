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
                    mostrarPerfilPublico: true,
                    allowDirectMessagesFromNonFriends: true,
                },
            }),
        };
        const service = new UserProfileApiService(httpMock, authMock, privateUserFirestoreSvcMock as any);

        const settings = await service.getMySettings();

        expect(settings.perfil.allowDirectMessagesFromNonFriends).toBeTrue();
        expect(privateUserFirestoreSvcMock.getMySettings).toHaveBeenCalled();
        expect(httpMock.get).not.toHaveBeenCalled();
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

    it('getMyCompliance usa HTTP canonico con Bearer y normaliza la respuesta', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            uid: 'uid-1',
            banned: false,
            mustAcceptUsage: true,
            mustAcceptCreation: false,
            activeSanction: {
                sanctionId: '7',
                kind: 'temporary',
                code: 'manual-ban',
                name: 'Ban temporal',
                startsAtUtc: '2026-04-02T09:00:00Z',
                endsAtUtc: '2026-04-02T10:10:00Z',
                isPermanent: false,
            },
            usage: {
                versionTag: 'usage-v4',
                acceptedVersionMatchesActive: false,
            },
            creation: {
                versionCode: 'creation-v2',
                isAccepted: true,
            },
        }));
        const privateUserFirestoreSvcMock = {
            getMyProfile: jasmine.createSpy('getMyProfile'),
        };
        const service = new UserProfileApiService(httpMock, authMock, privateUserFirestoreSvcMock as any);

        const compliance = await service.getMyCompliance();

        expect(compliance?.banned).toBeTrue();
        expect(compliance?.mustAcceptUsage).toBeTrue();
        expect(compliance?.mustAcceptCreation).toBeFalse();
        expect(compliance?.activeSanction?.sanctionId).toBe(7);
        expect(compliance?.usage?.version).toBe('usage-v4');
        expect(compliance?.creation?.accepted).toBeTrue();
        expect(privateUserFirestoreSvcMock.getMyProfile).not.toHaveBeenCalled();
        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/me/compliance');
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
    });

    it('getMyCompliance obtiene currentUser e idToken dentro del injection context cuando está disponible', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            banned: false,
            mustAcceptUsage: false,
            mustAcceptCreation: false,
            activeSanction: null,
            usage: null,
            creation: null,
        }));
        const firebaseContextSvc = {
            run: jasmine.createSpy('run').and.callFake((fn: any) => fn()),
        } as any;
        const service = new UserProfileApiService(httpMock, authMock, undefined, firebaseContextSvc);

        await service.getMyCompliance();

        expect(firebaseContextSvc.run).toHaveBeenCalledTimes(2);
    });

    it('getMyCompliance sintetiza una sanción activa cuando backend expone moderationStatus y blockedUntilUtc sin activeSanction', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            banned: false,
            moderationStatus: 'blocked',
            blockedUntilUtc: '2026-04-08T20:00:00.000Z',
            isPermanent: false,
            mustAcceptUsage: false,
            mustAcceptCreation: false,
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const compliance = await service.getMyCompliance();

        expect(compliance?.banned).toBeTrue();
        expect(compliance?.activeSanction).toEqual(jasmine.objectContaining({
            kind: 'restriction',
            code: 'technical_account_restriction_temporary',
            endsAtUtc: '2026-04-08T20:00:00.000Z',
            isPermanent: false,
        }));
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
        const privateUserFirestoreSvcMock = {
            getMySettings: jasmine.createSpy('getMySettings').and.resolveTo({
                version: 1,
                perfil: {
                    mostrarPerfilPublico: false,
                },
            }),
        };
        const service = new UserProfileApiService(httpMock, authMock, privateUserFirestoreSvcMock as any);

        const settings = await service.getMySettings();

        expect(settings.version).toBe(1);
        expect(settings.nuevo_personaje.generador_config).toBeNull();
        expect(settings.perfil.mostrarPerfilPublico).toBeFalse();
        expect(settings.perfil.allowDirectMessagesFromNonFriends).toBeFalse();
    });

    it('getMyProfile normaliza bio, genero, pronombres y permisos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        const privateUserFirestoreSvcMock = {
            getMyProfile: jasmine.createSpy('getMyProfile').and.resolveTo({
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
                compliance: {
                    banned: false,
                    mustAcceptUsage: true,
                    mustAcceptCreation: false,
                    activeSanction: {
                        sanctionId: '7',
                        kind: 'temporary',
                        code: 'cooldown',
                        name: 'Cooldown',
                        startsAtUtc: '2026-04-01T10:00:00Z',
                        endsAtUtc: '2026-04-08T10:00:00Z',
                        isPermanent: false,
                    },
                    usage: {
                        version: '4',
                        accepted: false,
                    },
                    creation: {
                        version: '2',
                        accepted: true,
                    },
                },
            }),
        };
        const service = new UserProfileApiService(httpMock, authMock, privateUserFirestoreSvcMock as any);

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
        expect(profile.compliance?.mustAcceptUsage).toBeTrue();
        expect(profile.compliance?.usage?.version).toBe('4');
        expect(profile.compliance?.activeSanction?.sanctionId).toBe(7);
        expect(privateUserFirestoreSvcMock.getMyProfile).toHaveBeenCalled();
        expect(httpMock.get).not.toHaveBeenCalled();
    });

    it('getMyProfile falla si el read model privado no está disponible', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        const service = new UserProfileApiService(httpMock, authMock);

        await expectAsync(service.getMyProfile()).toBeRejectedWith(
            jasmine.objectContaining({
                code: 'PRIVATE_READ_MODEL_UNAVAILABLE',
            })
        );
        expect(httpMock.get).not.toHaveBeenCalled();
    });

    it('getMySettings falla si el read model privado no está disponible', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        const service = new UserProfileApiService(httpMock, authMock);

        await expectAsync(service.getMySettings()).toBeRejectedWith(
            jasmine.objectContaining({
                code: 'PRIVATE_READ_MODEL_UNAVAILABLE',
            })
        );
        expect(httpMock.get).not.toHaveBeenCalled();
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

    it('listRoleRequests no reintenta un 403 y expone el error de autorizacion', async () => {
        const authNoRetryMock = {
            currentUser: {
                getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-settings'),
            },
        } as any;
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(throwError(() => new HttpErrorResponse({
            status: 403,
            error: {
                code: 'FORBIDDEN',
                message: 'Solo admins',
            },
        })));
        const service = new UserProfileApiService(httpMock, authNoRetryMock);

        await expectAsync(service.listRoleRequests({ status: 'pending' })).toBeRejectedWith(
            jasmine.objectContaining({
                status: 403,
                code: 'FORBIDDEN',
            })
        );
        expect(authNoRetryMock.currentUser.getIdToken.calls.count()).toBe(1);
        expect(httpMock.get.calls.count()).toBe(1);
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

    it('listMyModerationHistory envia Bearer y normaliza la timeline actor-scoped', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            items: [{
                incidentId: '19',
                caseId: '8',
                caseCode: 'harassment',
                caseName: 'Acoso',
                mode: 'report',
                confirmedAtUtc: '2026-04-01T10:00:00Z',
                createdAtUtc: '2026-04-01T09:55:00Z',
                userVisibleMessage: '  Se ha confirmado una incidencia. ',
                result: 'sanctioned',
                sanction: {
                    sanctionId: '7',
                    kind: 'temporary',
                    code: 'cooldown',
                    name: 'Cooldown',
                    endsAtUtc: '2026-04-08T10:00:00Z',
                    isPermanent: false,
                },
            }],
            total: '11',
            limit: '10',
            offset: '0',
            hasMore: true,
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const response = await service.listMyModerationHistory(10, 0);

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/me/moderation/history');
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(options.params).toEqual({
            limit: '10',
            offset: '0',
        });
        expect(response.total).toBe(11);
        expect(response.hasMore).toBeTrue();
        expect(response.items[0].incidentId).toBe(19);
        expect(response.items[0].result).toBe('sanctioned');
        expect(response.items[0].userVisibleMessage).toBe('Se ha confirmado una incidencia.');
        expect(response.items[0].sanction?.sanctionId).toBe(7);
    });

    it('listMyModerationHistory acepta también la respuesta canónica como array directo', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of([{
            incidentId: '20',
            caseId: '9',
            caseCode: 'admin_manual_account_ban',
            caseName: 'Ban manual admin',
            mode: 'force_sanction',
            confirmedAtUtc: '2026-04-02T10:00:00Z',
            createdAtUtc: '2026-04-02T09:59:00Z',
            userVisibleMessage: 'Has sido sancionado por administración.',
            result: 'banned',
            sanction: {
                sanctionId: '8',
                kind: 'ban',
                code: 'admin_manual_account_ban',
                name: 'Ban manual admin',
                endsAtUtc: null,
                isPermanent: true,
            },
        }]));
        const service = new UserProfileApiService(httpMock, authMock);

        const response = await service.listMyModerationHistory(10, 0);

        expect(response.total).toBe(1);
        expect(response.hasMore).toBeFalse();
        expect(response.items.length).toBe(1);
        expect(response.items[0].result).toBe('banned');
        expect(response.items[0].mode).toBe('force_sanction');
        expect(response.items[0].sanction?.isPermanent).toBeTrue();
    });

    it('listMyModerationHistory preserva el flag isPermanent del backend cuando llega mezclado con endsAtUtc', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of([{
            incidentId: '21',
            caseId: '9',
            caseCode: 'admin_manual_account_ban',
            caseName: 'Ban manual admin',
            mode: 'force_sanction',
            confirmedAtUtc: '2026-04-02T10:00:00Z',
            createdAtUtc: '2026-04-02T09:59:00Z',
            userVisibleMessage: 'Has sido sancionado por administración.',
            result: 'banned',
            sanction: {
                sanctionId: '9',
                kind: 'ban',
                code: 'admin_manual_account_ban',
                name: 'Ban manual admin',
                endsAtUtc: '2026-04-02T10:11:00Z',
                isPermanent: true,
            },
        }]));
        const service = new UserProfileApiService(httpMock, authMock);

        const response = await service.listMyModerationHistory(10, 0);

        expect(response.items[0].sanction?.isPermanent).toBeTrue();
        expect(response.items[0].sanction?.endsAtUtc).toBe('2026-04-02T10:11:00Z');
    });

    it('getActivePolicy envia Bearer y normaliza la política activa actor-scoped', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            policyKind: 'creation',
            versionTag: '2',
            title: 'Normas de creación',
            markdown: '  # Reglas\n\nTexto editable.  ',
            effectiveAtUtc: '2026-04-01T10:00:00Z',
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const response = await service.getActivePolicy('creation');

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/me/policies/creation/active');
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(response).toEqual({
            kind: 'creation',
            version: '2',
            title: 'Normas de creación',
            markdown: '# Reglas\n\nTexto editable.',
            publishedAtUtc: '2026-04-01T10:00:00Z',
        });
    });

    it('acceptActivePolicy envia Bearer y normaliza policy + compliance recalculado', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.post.and.returnValue(of({
            policy: {
                kind: 'usage',
                version: '4',
                title: 'Normas de uso',
                markdown: '# Uso',
                publishedAtUtc: '2026-04-01T10:00:00Z',
            },
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: true,
                activeSanction: null,
                usage: {
                    version: '4',
                    accepted: true,
                    acceptedAtUtc: '2026-04-01T12:00:00Z',
                    publishedAtUtc: '2026-04-01T10:00:00Z',
                    title: 'Normas de uso',
                },
                creation: {
                    version: '2',
                    accepted: false,
                    acceptedAtUtc: null,
                    publishedAtUtc: '2026-04-01T10:00:00Z',
                    title: 'Normas de creación',
                },
            },
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const response = await service.acceptActivePolicy('usage');

        const [url, body, options] = httpMock.post.calls.mostRecent().args;
        expect(url).toContain('/usuarios/me/policies/usage/accept');
        expect(body).toEqual({});
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(response.policy?.kind).toBe('usage');
        expect(response.policy?.version).toBe('4');
        expect(response.compliance?.mustAcceptUsage).toBeFalse();
        expect(response.compliance?.creation?.accepted).toBeFalse();
    });

    it('reportAbuseLock envia Bearer y normaliza la respuesta actor-scoped', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.post.and.returnValue(of({
            status: 'banned',
            compliance: {
                banned: true,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const response = await service.reportAbuseLock({
            reason: 'frontend_api_button_spam',
            clientDate: '2026-03-28',
            localBlockCountToday: 3,
            source: 'web',
        });

        const [url, body, options] = httpMock.post.calls.mostRecent().args;
        expect(url).toContain('/usuarios/me/security/abuse-lock');
        expect(body).toEqual({
            reason: 'frontend_api_button_spam',
            clientDate: '2026-03-28',
            localBlockCountToday: 3,
            source: 'web',
        });
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(response.status).toBe('banned');
        expect(response.compliance?.banned).toBeTrue();
        expect(response.moderationStatus).toBeNull();
        expect(response.message).toBeNull();
        expect(response.activeSanction).toEqual(jasmine.objectContaining({
            kind: 'restriction',
            code: 'technical_account_restriction_permanent',
            name: 'Restricción permanente de cuenta',
            isPermanent: true,
        }));
        expect(response.blockedUntilUtc).toBeNull();
        expect(response.isPermanent).toBeNull();
        expect(response.restrictedActions).toEqual([]);
    });

    it('reportAbuseLock sintetiza compliance bloqueante cuando backend devuelve shape nuevo sin compliance explícito', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.post.and.returnValue(of({
            status: 'blocked',
            moderationStatus: 'blocked',
            message: 'Tu cuenta queda restringida temporalmente hasta que termine la sanción activa.',
            blockedUntilUtc: '2026-03-28T20:00:00.000Z',
            isPermanent: false,
            restrictedActions: ['social.messages', 'social.messages', 'campaigns.manage'],
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const response = await service.reportAbuseLock({
            reason: 'frontend_api_button_spam',
            clientDate: '2026-03-28',
            localBlockCountToday: 3,
            source: 'web',
        });

        expect(response.status).toBe('blocked');
        expect(response.moderationStatus).toBe('blocked');
        expect(response.message).toContain('restringida temporalmente');
        expect(response.blockedUntilUtc).toBe('2026-03-28T20:00:00.000Z');
        expect(response.isPermanent).toBeFalse();
        expect(response.restrictedActions).toEqual(['social.messages', 'campaigns.manage']);
        expect(response.activeSanction).toEqual(jasmine.objectContaining({
            kind: 'restriction',
            name: 'Restricción temporal de cuenta',
            endsAtUtc: '2026-03-28T20:00:00.000Z',
            isPermanent: false,
        }));
        expect(response.compliance).toEqual(jasmine.objectContaining({
            banned: true,
            mustAcceptUsage: false,
            mustAcceptCreation: false,
            activeSanction: jasmine.objectContaining({
                endsAtUtc: '2026-03-28T20:00:00.000Z',
            }),
        }));
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
