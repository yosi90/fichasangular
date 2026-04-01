import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SocialV3ApiService } from './social-v3-api.service';

describe('SocialV3ApiService', () => {
    const authMock = {
        currentUser: {
            getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-social-v3'),
        },
    } as any;

    it('normaliza comunidad con stats relacionales y envelope paginado', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            items: [{
                uid: ' uid-2 ',
                displayName: ' Yuna ',
                photoThumbUrl: ' thumb.webp ',
                role: 'master',
                joinedAtUtc: '2026-03-10T10:00:00.000Z',
                lastSeenAtUtc: '2026-03-12T10:00:00.000Z',
                publicStats: {
                    totalCharacters: 4,
                    publicCharacters: 3,
                    activeCampaigns: 2,
                    campaignsAsMaster: 1,
                    campaignsCreated: 2,
                },
                relationship: {
                    state: 'friend',
                    canOpenProfile: true,
                },
            }],
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        }));
        const service = new SocialV3ApiService(httpMock, authMock);

        const result = await service.listCommunityUsers({
            query: 'yu',
            role: 'master',
            sort: 'active',
        });

        expect(result.items).toEqual([{
            uid: 'uid-2',
            displayName: 'Yuna',
            photoThumbUrl: 'thumb.webp',
            role: 'master',
            joinedAtUtc: '2026-03-10T10:00:00.000Z',
            lastSeenAtUtc: '2026-03-12T10:00:00.000Z',
            publicStats: {
                totalCharacters: 4,
                publicCharacters: 3,
                activeCampaigns: 2,
                campaignsAsMaster: 1,
                campaignsCreated: 2,
            },
            relationship: {
                state: 'friend',
                canOpenProfile: true,
            },
        }]);
        expect(result.meta).toEqual({
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        });

        const [, options] = httpMock.get.calls.mostRecent().args;
        expect(options.params).toEqual({
            query: 'yu',
            role: 'master',
            sort: 'active',
            limit: '25',
            offset: '0',
        });
    });

    it('normaliza feed y CTA open_profile', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            items: [{
                id: ' feed-1 ',
                kind: 'friendship.created',
                createdAtUtc: '2026-03-12T10:00:00.000Z',
                visibility: 'friends',
                actor: {
                    uid: ' uid-2 ',
                    displayName: ' Yuna ',
                    photoThumbUrl: ' thumb.webp ',
                },
                subject: {
                    type: 'user',
                    id: 'uid-2',
                    title: 'Yuna',
                },
                summary: ' Yuna y Marcus ahora son amistad. ',
                cta: {
                    type: 'open_profile',
                    uid: ' uid-2 ',
                },
                metadata: {
                    foo: 'bar',
                },
            }],
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        }));
        const service = new SocialV3ApiService(httpMock, authMock);

        const result = await service.getFeed({
            scope: 'friends',
            kind: 'friendship.created',
        });

        expect(result.items[0]).toEqual({
            id: 'feed-1',
            kind: 'friendship.created',
            createdAtUtc: '2026-03-12T10:00:00.000Z',
            visibility: 'friends',
            actor: {
                uid: 'uid-2',
                displayName: 'Yuna',
                photoThumbUrl: 'thumb.webp',
            },
            subject: {
                type: 'user',
                id: 'uid-2',
                title: 'Yuna',
            },
            summary: 'Yuna y Marcus ahora son amistad.',
            cta: {
                type: 'open_profile',
                uid: 'uid-2',
            },
            metadata: {
                foo: 'bar',
            },
        });
    });

    it('normaliza aplicaciones LFG con permisos por fila', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch']);
        httpMock.get.and.returnValue(of({
            items: [{
                applicationId: 8,
                postId: 3,
                status: 'accepted',
                message: ' Me interesa mucho la mesa ',
                applicant: {
                    uid: ' uid-9 ',
                    displayName: ' Marcus ',
                    photoThumbUrl: null,
                },
                createdAtUtc: '2026-03-20T10:00:00.000Z',
                resolvedAtUtc: '2026-03-21T10:00:00.000Z',
                permissions: {
                    canResolve: false,
                    canWithdraw: true,
                },
            }],
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        }));
        const service = new SocialV3ApiService(httpMock, authMock);

        const result = await service.listLfgApplications(3);

        expect(result.items[0]).toEqual({
            applicationId: 8,
            postId: 3,
            status: 'accepted',
            message: 'Me interesa mucho la mesa',
            applicant: {
                uid: 'uid-9',
                displayName: 'Marcus',
                photoThumbUrl: null,
            },
            createdAtUtc: '2026-03-20T10:00:00.000Z',
            resolvedAtUtc: '2026-03-21T10:00:00.000Z',
            permissions: {
                canResolve: false,
                canWithdraw: true,
            },
        });
    });

    it('bloquea en cliente un create LFG con el borrador vacío antes de tocar backend', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch']);
        const service = new SocialV3ApiService(httpMock, authMock);

        await expectAsync(service.createLfgPost({
            title: '',
            summary: '',
            gameSystem: 'D&D 3.5',
            campaignStyle: '',
            slotsTotal: 4,
            scheduleText: '',
            language: 'es',
            visibility: 'global',
            status: 'open',
        } as any)).toBeRejectedWith(jasmine.objectContaining({
            code: 'SOCIAL_LFG_TITLE_INVALID',
            status: 400,
        }));

        expect(httpMock.post).not.toHaveBeenCalled();
    });

    it('bloquea en cliente un patch LFG con horario inválido antes de tocar backend', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch']);
        const service = new SocialV3ApiService(httpMock, authMock);

        await expectAsync(service.updateLfgPost(3, {
            scheduleText: 'Viernes por la tarde',
        })).toBeRejectedWith(jasmine.objectContaining({
            code: 'SOCIAL_LFG_SCHEDULE_INVALID',
            status: 400,
        }));

        expect(httpMock.patch).not.toHaveBeenCalled();
    });

    it('normaliza la conversacion contextual LFG aunque llegue anidada', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch']);
        httpMock.post.and.returnValue(of({
            created: false,
            type: 'direct',
            conversation: {
                id: 44,
            },
        }));
        const service = new SocialV3ApiService(httpMock, authMock);

        const response = await service.openLfgContactConversation(3);

        expect(response).toEqual({
            conversationId: 44,
            created: false,
            type: 'direct',
        });
    });

    it('convierte localhost a 127.0.0.1 al construir la url websocket', () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch']);
        const service = new SocialV3ApiService(httpMock, authMock);

        const socketUrl = service.buildWebSocketUrl('http://localhost:3000/ws/social', 'ticket-1');

        expect(socketUrl).toBe('ws://127.0.0.1:3000/ws/social?ticket=ticket-1');
    });

    it('parsea eventos websocket conocidos e ignora desconocidos', () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch']);
        const service = new SocialV3ApiService(httpMock, authMock);

        const known = service.parseWebSocketEvent({
            type: 'lfg.post_created',
            payload: {
                id: 4,
                title: ' Mesa ',
                summary: ' Resumen ',
                gameSystem: 'D&D 3.5',
                campaignStyle: 'sandbox',
                slotsTotal: 5,
                slotsOpen: 2,
                scheduleText: 'Sábados',
                language: 'es',
                status: 'open',
                author: {
                    uid: 'uid-master',
                    displayName: 'Master',
                    photoThumbUrl: null,
                },
            },
        });
        const unknown = service.parseWebSocketEvent({ type: 'unknown', payload: {} });

        expect(known).toEqual({
            type: 'lfg.post_created',
            payload: jasmine.objectContaining({
                id: 4,
                title: 'Mesa',
            }),
        } as any);
        expect(unknown).toBeNull();
    });

    it('propaga errores http como ProfileApiError', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch']);
        httpMock.get.and.returnValue(throwError(() => new HttpErrorResponse({
            status: 401,
            error: {
                code: 'UNAUTHORIZED',
                message: 'No autorizado',
            },
        })));
        const service = new SocialV3ApiService(httpMock, authMock);

        await expectAsync(service.getCommunityStats()).toBeRejectedWith(
            jasmine.objectContaining({
                code: 'UNAUTHORIZED',
                status: 401,
                message: 'No autorizado',
            })
        );
    });
});
