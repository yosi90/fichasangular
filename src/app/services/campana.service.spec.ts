import { fakeAsync, tick } from '@angular/core/testing';
import { Subject, of } from 'rxjs';

import { CampanaService } from './campana.service';
import { CampaignRealtimeSyncService } from './campaign-realtime-sync.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

describe('CampanaService', () => {
    let httpMock: { get: jasmine.Spy; post: jasmine.Spy; patch: jasmine.Spy; delete: jasmine.Spy; };
    let service: CampanaService;
    let invalidations$: Subject<any>;
    let campaignRealtimeSyncSvcMock: jasmine.SpyObj<CampaignRealtimeSyncService>;

    beforeEach(() => {
        httpMock = {
            get: jasmine.createSpy('get'),
            post: jasmine.createSpy('post'),
            patch: jasmine.createSpy('patch'),
            delete: jasmine.createSpy('delete'),
        };
        invalidations$ = new Subject<any>();
        campaignRealtimeSyncSvcMock = jasmine.createSpyObj<CampaignRealtimeSyncService>(
            'CampaignRealtimeSyncService',
            ['notifyLocalChange'],
            { listInvalidations$: invalidations$.asObservable() }
        );

        service = new CampanaService(
            { currentUser: { uid: 'actor-1', getIdToken: async () => 'token' } } as any,
            httpMock as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            campaignRealtimeSyncSvcMock
        );
    });

    it('createCampaign notifica cambio local sin rehidratar una cache RTDB derivada', async () => {
        httpMock.post.and.returnValue(of({ idCampana: 7, nombre: 'Campaña nueva' }));

        const created = await service.createCampaign('Campaña nueva');

        expect(created).toEqual({
            id: 7,
            nombre: 'Campaña nueva',
            campaignRole: 'master',
            membershipStatus: 'activo',
        });
        expect(campaignRealtimeSyncSvcMock.notifyLocalChange).toHaveBeenCalledWith(7);
        expect(httpMock.get).not.toHaveBeenCalled();
    });

    it('getListCampanas añade la opción sintética Sin campaña para campañas con membresía activa', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' }]);
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Campaña visible',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [],
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        const observable = await service.getListCampanas();
        const campanas = await new Promise<any[]>((resolve) => {
            const subscription = observable.subscribe((value) => {
                resolve(value);
                subscription.unsubscribe();
            });
        });

        expect(campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Campaña visible']);
    });

    it('getListCampanas vuelve a emitir tras una invalidación realtime o local', fakeAsync(() => {
        let cycle = 0;
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas')) {
                cycle += 1;
                if (cycle === 1)
                    return of([{ i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' }]);
                return of([
                    { i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
                    { i: 8, n: 'Campaña nueva', campaignRole: 'jugador', membershipStatus: 'activo' },
                ]);
            }
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Campaña visible',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [],
                });
            if (url.endsWith('campanas/8'))
                return of({
                    i: 8,
                    n: 'Campaña nueva',
                    campaignRole: 'jugador',
                    membershipStatus: 'activo',
                    tramas: [],
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        let observable: any;
        service.getListCampanas().then((value) => observable = value);
        tick();

        const emissions: string[][] = [];
        const subscription = observable.subscribe((campanas: any[]) => emissions.push(campanas.map((item) => item.Nombre)));
        tick();

        invalidations$.next({
            code: 'system.campaign_invitation_resolved',
            campaignId: 7,
            conversationId: null,
            source: 'remote',
        });
        tick();

        expect(emissions).toEqual([
            ['Sin campaña', 'Campaña visible'],
            ['Sin campaña', 'Campaña nueva', 'Campaña visible'],
        ]);

        subscription.unsubscribe();
    }));

    it('getListCampanas detiene el polling cuando no quedan suscriptores', fakeAsync(() => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' }]);
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Campaña visible',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [],
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        let observable: any;
        service.getListCampanas().then((value) => observable = value);
        tick();

        const subscription = observable.subscribe();
        tick();

        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas$/)).length).toBe(1);

        tick(30000);
        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas$/)).length).toBe(2);

        subscription.unsubscribe();
        tick(30000);

        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas$/)).length).toBe(2);
    }));

    it('getListCampanas usa watcher Firestore privado y reconstruye tramas tras invalidación', fakeAsync(() => {
        const watchState: { next: ((items: any[]) => void) | null; } = { next: null };
        let tramaCycle = 0;
        const privateUserFirestoreSvcMock = {
            watchCampaigns: jasmine.createSpy('watchCampaigns').and.callFake((next: (items: any[]) => void) => {
                watchState.next = next;
                return () => undefined;
            }),
            listCampaigns: jasmine.createSpy('listCampaigns').and.resolveTo([
                { id: 7, nombre: 'Campaña privada', campaignRole: 'master', membershipStatus: 'activo' },
            ]),
        };
        const firestoreBackedService = new CampanaService(
            { currentUser: { uid: 'actor-1', getIdToken: async () => 'token' } } as any,
            httpMock as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            campaignRealtimeSyncSvcMock,
            privateUserFirestoreSvcMock as any
        );

        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7')) {
                tramaCycle += 1;
                return of({
                    i: 7,
                    n: 'Campaña privada',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: tramaCycle === 1 ? [] : [{ i: 11, n: 'Trama viva', visibleParaJugadores: true, subtramas: [] }],
                });
            }
            throw new Error(`URL inesperada: ${url}`);
        });

        let observable: any;
        firestoreBackedService.getListCampanas().then((value) => observable = value);
        tick();

        const emissions: number[] = [];
        const subscription = observable.subscribe((campanas: any[]) => emissions.push(campanas[1]?.Tramas?.length ?? 0));
        tick();

        watchState.next?.([
            { id: 7, nombre: 'Campaña privada', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        tick();

        invalidations$.next({
            code: 'system.campaign_updated',
            campaignId: 7,
            conversationId: null,
            source: 'remote',
        });
        tick();

        expect(privateUserFirestoreSvcMock.watchCampaigns).toHaveBeenCalled();
        expect(httpMock.get.calls.allArgs().some((args) => `${args[0]}`.match(/campanas$/))).toBeFalse();
        expect(emissions).toEqual([0, 0, 1]);

        subscription.unsubscribe();
    }));

    it('getListCampanas expone de forma optimista una campaña aceptada antes de que Firestore emita', fakeAsync(() => {
        const watchState: { next: ((items: any[]) => void) | null; } = { next: null };
        const privateUserFirestoreSvcMock = {
            watchCampaigns: jasmine.createSpy('watchCampaigns').and.callFake((next: (items: any[]) => void) => {
                watchState.next = next;
                return () => undefined;
            }),
            listCampaigns: jasmine.createSpy('listCampaigns').and.resolveTo([]),
        };
        const firestoreBackedService = new CampanaService(
            { currentUser: { uid: 'actor-1', getIdToken: async () => 'token' } } as any,
            httpMock as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            campaignRealtimeSyncSvcMock,
            privateUserFirestoreSvcMock as any
        );

        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Caballeros de Cormyr',
                    campaignRole: 'jugador',
                    membershipStatus: 'activo',
                    tramas: [],
                });
            throw new Error(`URL inesperada: ${url}`);
        });
        httpMock.patch.and.callFake((url: string) => {
            if (url.endsWith('campanas/invitaciones/8')) {
                return of({
                    message: 'Invitacion aceptada',
                    invitation: {
                        inviteId: 8,
                        status: 'accepted',
                        createdAtUtc: '2026-03-13T10:15:00.000Z',
                        resolvedAtUtc: '2026-03-13T10:20:00.000Z',
                        campaignId: 7,
                        campaignName: 'Caballeros de Cormyr',
                        invitedUser: {
                            userId: 'user-2',
                            uid: 'actor-1',
                            displayName: 'Actor',
                            email: 'actor@test.dev',
                        },
                        invitedBy: {
                            userId: 'user-9',
                            uid: 'uid-master',
                            displayName: 'Master',
                            email: 'master@test.dev',
                        },
                        resolvedByUserId: 'user-2',
                    },
                });
            }
            throw new Error(`URL inesperada: ${url}`);
        });

        let observable: any;
        firestoreBackedService.getListCampanas().then((value) => observable = value);
        tick();

        const emissions: string[][] = [];
        const subscription = observable.subscribe((campanas: any[]) => emissions.push(campanas.map((item) => item.Nombre)));
        tick();

        watchState.next?.([]);
        tick();

        void firestoreBackedService.resolveCampaignInvitation(8, 'accept');
        tick();
        invalidations$.next({
            code: 'campaign.local_change',
            campaignId: 7,
            conversationId: null,
            source: 'local',
        });
        tick();

        expect(emissions).toContain(['Sin campaña', 'Caballeros de Cormyr']);
        subscription.unsubscribe();
    }));

    it('getListCampanas refleja de forma optimista un renombre antes de que Firestore converja', fakeAsync(() => {
        const watchState: { next: ((items: any[]) => void) | null; } = { next: null };
        const privateUserFirestoreSvcMock = {
            watchCampaigns: jasmine.createSpy('watchCampaigns').and.callFake((next: (items: any[]) => void) => {
                watchState.next = next;
                return () => undefined;
            }),
            listCampaigns: jasmine.createSpy('listCampaigns').and.resolveTo([
                { id: 7, nombre: 'Campaña vieja', campaignRole: 'master', membershipStatus: 'activo' },
            ]),
        };
        const firestoreBackedService = new CampanaService(
            { currentUser: { uid: 'actor-1', getIdToken: async () => 'token' } } as any,
            httpMock as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            campaignRealtimeSyncSvcMock,
            privateUserFirestoreSvcMock as any
        );

        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Campaña nueva',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [],
                });
            throw new Error(`URL inesperada: ${url}`);
        });
        httpMock.patch.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({});
            throw new Error(`URL inesperada: ${url}`);
        });

        let observable: any;
        firestoreBackedService.getListCampanas().then((value) => observable = value);
        tick();

        const emissions: string[][] = [];
        const subscription = observable.subscribe((campanas: any[]) => emissions.push(campanas.map((item) => item.Nombre)));
        tick();

        watchState.next?.([
            { id: 7, nombre: 'Campaña vieja', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        tick();

        void firestoreBackedService.updateCampaign(7, { nombre: 'Campaña nueva' });
        tick();
        invalidations$.next({
            code: 'campaign.local_change',
            campaignId: 7,
            conversationId: null,
            source: 'local',
        });
        tick();

        expect(emissions).toContain(['Sin campaña', 'Campaña nueva']);
        subscription.unsubscribe();
    }));

    it('getListCampanas excluye campañas sin membresía activa del actor', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([
                    { i: 7, n: 'Campaña propia', campaignRole: 'master', membershipStatus: 'activo' },
                    { i: 8, n: 'Campaña expulsado', campaignRole: 'jugador', membershipStatus: 'expulsado' },
                    { i: 9, n: 'Campaña legacy owner', campaignRole: null, membershipStatus: null },
                ]);
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Campaña propia',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [],
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        const observable = await service.getListCampanas();
        const campanas = await new Promise<any[]>((resolve) => {
            const subscription = observable.subscribe((value) => {
                resolve(value);
                subscription.unsubscribe();
            });
        });

        expect(campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Campaña propia']);
        expect(httpMock.get.calls.allArgs().map((args) => args[0])).toEqual([
            jasmine.stringMatching(/campanas$/),
            jasmine.stringMatching(/campanas\/7$/),
        ]);
    });

    it('getListCampanas reutiliza el árbol actor-scoped de detalle para preservar tramas solo master', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Caballeros de Cormyr', campaignRole: 'master', membershipStatus: 'activo' }]);
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Caballeros de Cormyr',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [
                        { i: 11, n: 'Buscando a razidir', visibleParaJugadores: true, subtramas: [] },
                        {
                            i: 12,
                            n: 'Invasión de cormyr',
                            visibleParaJugadores: false,
                            subtramas: [{ i: 21, n: 'Partida 1', visibleParaJugadores: false }],
                        },
                    ],
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        const observable = await service.getListCampanas();
        const campanas = await new Promise<any[]>((resolve) => {
            const subscription = observable.subscribe((value) => {
                resolve(value);
                subscription.unsubscribe();
            });
        });

        expect(campanas[1].Tramas.map((item: any) => item.Nombre)).toEqual([
            'Buscando a razidir',
            'Invasión de cormyr',
        ]);
        expect(campanas[1].Tramas[1].VisibleParaJugadores).toBeFalse();
        expect(campanas[1].Tramas[1].Subtramas[0].Nombre).toBe('Partida 1');
    });

    it('listVisibleCampaigns normaliza rol y estado de membresía', async () => {
        httpMock.get.and.returnValue(of([
            { i: 9, n: 'Costa', campaignRole: 'master', membershipStatus: 'activo' },
            { i: 10, n: 'Bosque', campaignRole: 'jugador', membershipStatus: 'expulsado' },
        ]));

        const campaigns = await service.listVisibleCampaigns();

        expect(campaigns).toEqual([
            { id: 10, nombre: 'Bosque', campaignRole: 'jugador', membershipStatus: 'expulsado' },
            { id: 9, nombre: 'Costa', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
    });

    it('listVisibleCampaigns tolera alias legacy para rol y estado', async () => {
        httpMock.get.and.returnValue(of([
            { i: 9, n: 'Costa', Role: 'master', Estado: 'activo' },
            { i: 10, n: 'Bosque', rolCampana: 'jugador', memberStatus: 'expulsado' },
        ]));

        const campaigns = await service.listVisibleCampaigns();

        expect(campaigns).toEqual([
            { id: 10, nombre: 'Bosque', campaignRole: 'jugador', membershipStatus: 'expulsado' },
            { id: 9, nombre: 'Costa', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
    });

    it('listVisibleCampaigns preserva null en campañas legacy donde el actor solo es owner', async () => {
        httpMock.get.and.returnValue(of([
            { i: 12, n: 'Legacy propia', campaignRole: null, membershipStatus: null },
        ]));

        const campaigns = await service.listVisibleCampaigns();

        expect(campaigns).toEqual([
            { id: 12, nombre: 'Legacy propia', campaignRole: null, membershipStatus: null },
        ]);
    });

    it('listProfileCampaigns conserva membresías activas y campañas propias sin membresía directa', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([
                    { i: 7, n: 'Legacy propia', campaignRole: null, membershipStatus: null },
                    { i: 8, n: 'Aventureros', campaignRole: 'jugador', membershipStatus: 'activo' },
                    { i: 9, n: 'Ajena visible', campaignRole: null, membershipStatus: null },
                    { i: 10, n: 'Expulsado', campaignRole: 'jugador', membershipStatus: 'expulsado' },
                ]);
            if (url.endsWith('campanas/7'))
                return of({
                    idCampana: 7,
                    nombre: 'Legacy propia',
                    campaignRole: null,
                    membershipStatus: null,
                    ownerUid: 'actor-1',
                    ownerDisplayName: 'Actor',
                    activeMasterUid: null,
                    activeMasterDisplayName: null,
                    canRecoverMaster: true,
                });
            if (url.endsWith('campanas/9'))
                return of({
                    idCampana: 9,
                    nombre: 'Ajena visible',
                    campaignRole: null,
                    membershipStatus: null,
                    ownerUid: 'other-owner',
                    ownerDisplayName: 'Otro',
                    activeMasterUid: 'uid-master',
                    activeMasterDisplayName: 'Master',
                    canRecoverMaster: false,
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        const campaigns = await service.listProfileCampaigns();

        expect(campaigns).toEqual([
            { id: 8, nombre: 'Aventureros', campaignRole: 'jugador', membershipStatus: 'activo' },
            { id: 7, nombre: 'Legacy propia', campaignRole: null, membershipStatus: null, isOwner: true },
        ]);
    });

    it('getCampaignDetail compone miembros y árbol de tramas actor-scoped', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    idCampana: 7,
                    nombre: 'Campaña visible',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    ownerUid: 'uid-owner',
                    ownerDisplayName: 'Owner',
                    activeMasterUid: 'uid-master',
                    activeMasterDisplayName: 'Master',
                    canRecoverMaster: false,
                    politicaCreacion: {
                        permitirHomebrewGeneral: true,
                    },
                    tramas: [{
                        i: 11,
                        n: 'Trama principal',
                        visibleParaJugadores: true,
                        subtramas: [{
                            i: 21,
                            n: 'Subtrama alfa',
                            visibleParaJugadores: false,
                        }],
                    }],
                });
            if (url.endsWith('campanas/7/jugadores'))
                return of([{ uid: 'uid-master', displayName: 'Master', campaignRole: 'master', membershipStatus: 'activo', isActive: true }]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await service.getCampaignDetail(7, true);

        expect(detail.campaign.nombre).toBe('Campaña visible');
        expect(detail.ownerUid).toBe('uid-owner');
        expect(detail.activeMasterUid).toBe('uid-master');
        expect(detail.includeInactiveMembers).toBeTrue();
        expect(detail.members[0].uid).toBe('uid-master');
        expect(detail.tramas[0].subtramas[0].nombre).toBe('Subtrama alfa');
        expect(detail.tramas[0].visibleParaJugadores).toBeTrue();
        expect(detail.tramas[0].subtramas[0].visibleParaJugadores).toBeFalse();
    });

    it('getCampaignDetail acepta el shape canónico idCampana/nombre para jugador sin master activo', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/9'))
                return of({
                    idCampana: 9,
                    nombre: 'Zorvintal',
                    campaignRole: 'jugador',
                    membershipStatus: 'activo',
                    ownerUid: 'uid-owner',
                    ownerDisplayName: 'Owner',
                    activeMasterUid: null,
                    activeMasterDisplayName: null,
                    canRecoverMaster: true,
                });
            if (url.endsWith('campanas/9/jugadores'))
                return of([{ uid: 'uid-owner', displayName: 'Owner', campaignRole: 'jugador', membershipStatus: 'activo', isActive: true }]);
            if (url.endsWith('tramas/campana/9'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await service.getCampaignDetail(9);

        expect(detail.campaign).toEqual({
            id: 9,
            nombre: 'Zorvintal',
            campaignRole: 'jugador',
            membershipStatus: 'activo',
        });
        expect(detail.canRecoverMaster).toBeTrue();
        expect(detail.activeMasterUid).toBeNull();
    });

    it('getCampaignDetail normaliza idTrama/idSubtrama canónicos del árbol embebido', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    idCampana: 7,
                    nombre: 'Campaña visible',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [{
                        idTrama: 31,
                        nombre: 'Trama canónica',
                        visibleParaJugadores: false,
                        subtramas: [{
                            idSubtrama: 41,
                            nombre: 'Subtrama canónica',
                            visibleParaJugadores: true,
                        }],
                    }],
                });
            if (url.endsWith('campanas/7/jugadores'))
                return of([{ uid: 'uid-master', displayName: 'Master', campaignRole: 'master', membershipStatus: 'activo', isActive: true }]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await service.getCampaignDetail(7);

        expect(detail.tramas).toEqual([
            jasmine.objectContaining({
                id: 31,
                nombre: 'Trama canónica',
                visibleParaJugadores: false,
                subtramas: [
                    jasmine.objectContaining({
                        id: 41,
                        nombre: 'Subtrama canónica',
                        visibleParaJugadores: true,
                    }),
                ],
            }),
        ]);
    });

    it('getCampaignDetail cae a /tramas/campana cuando el detalle no embebe el árbol', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    idCampana: 7,
                    nombre: 'Campaña visible',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                });
            if (url.endsWith('campanas/7/jugadores'))
                return of([{ uid: 'uid-master', displayName: 'Master', campaignRole: 'master', membershipStatus: 'activo', isActive: true }]);
            if (url.endsWith('tramas/campana/7'))
                return of([{ idTrama: 11, nombre: 'Trama desde endpoint', visibleParaJugadores: true }]);
            if (url.endsWith('subtramas/trama/11'))
                return of([{ idSubtrama: 21, nombre: 'Subtrama desde endpoint', visibleParaJugadores: false }]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await service.getCampaignDetail(7);

        expect(detail.tramas).toEqual([
            jasmine.objectContaining({
                id: 11,
                nombre: 'Trama desde endpoint',
                subtramas: [
                    jasmine.objectContaining({
                        id: 21,
                        nombre: 'Subtrama desde endpoint',
                        visibleParaJugadores: false,
                    }),
                ],
            }),
        ]);
    });

    it('descarta miembros malformados sin uid canónico', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Campaña visible',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    ownerUid: 'uid-owner',
                    ownerDisplayName: 'Owner',
                    activeMasterUid: 'uid-master',
                    activeMasterDisplayName: 'Master',
                    canRecoverMaster: false,
                });
            if (url.endsWith('campanas/7/jugadores'))
                return of([
                    { firebaseUid: 'legacy-only', displayName: 'Legacy roto', campaignRole: 'jugador', membershipStatus: 'activo' },
                    { uid: 'uid-master', displayName: 'Master', campaignRole: 'master', membershipStatus: 'activo' },
                ]);
            if (url.endsWith('tramas/campana/7'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await service.getCampaignDetail(7);

        expect(detail.members).toEqual([
            jasmine.objectContaining({ uid: 'uid-master', displayName: 'Master' }),
        ]);
    });

    it('recoverCampaignMaster usa la ruta canónica y refresca cache en best-effort', async () => {
        httpMock.post.and.callFake((url: string) => {
            if (url.endsWith('campanas/7/master/recover'))
                return of({ message: 'ok' });
            throw new Error(`URL inesperada: ${url}`);
        });
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' }]);
            if (url.endsWith('tramas/campana/7'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        await service.recoverCampaignMaster(7);

        expect(httpMock.post.calls.mostRecent().args[0]).toMatch(/campanas\/7\/master\/recover$/);
    });

    it('inviteCampaignMember envía Bearer y targetUid al endpoint canónico y devuelve invitación', async () => {
        httpMock.post.and.callFake((url: string, body: any, options: any) => {
            if (url.endsWith('campanas/7/jugadores')) {
                expect(body).toEqual({ targetUid: 'uid-target' });
                expect(options.headers.get('Authorization')).toBe('Bearer token');
                return of({
                    message: 'Invitacion enviada correctamente',
                    invitation: {
                        inviteId: 17,
                        status: 'pending',
                        createdAtUtc: '2026-03-13T10:15:00.000Z',
                        resolvedAtUtc: null,
                        campaignId: 7,
                        campaignName: 'Campaña visible',
                        invitedUser: {
                            userId: 'user-2',
                            uid: 'uid-target',
                            displayName: 'Jugador invitado',
                            email: 'jugador@test.dev',
                        },
                        invitedBy: {
                            userId: 'user-1',
                            uid: 'actor-1',
                            displayName: 'Actor',
                            email: 'actor@test.dev',
                        },
                        resolvedByUserId: null,
                    },
                });
            }
            throw new Error(`URL inesperada: ${url}`);
        });
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' }]);
            if (url.endsWith('tramas/campana/7'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const response = await service.inviteCampaignMember(7, 'uid-target');

        expect(httpMock.post.calls.count()).toBe(1);
        expect(httpMock.post.calls.mostRecent().args[0]).toMatch(/campanas\/7\/jugadores$/);
        expect(response.invitation.inviteId).toBe(17);
        expect(response.invitation.invitedUser.uid).toBe('uid-target');
    });

    it('listReceivedCampaignInvitations normaliza invitaciones pendientes', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/invitaciones/received'))
                return of([{
                    inviteId: 8,
                    status: 'pending',
                    createdAtUtc: '2026-03-13T10:15:00.000Z',
                    resolvedAtUtc: null,
                    campaignId: 7,
                    campaignName: 'Campaña visible',
                    invitedUser: {
                        userId: 'user-2',
                        uid: 'actor-1',
                        displayName: 'Actor',
                        email: 'actor@test.dev',
                    },
                    invitedBy: {
                        userId: 'user-9',
                        uid: 'uid-master',
                        displayName: 'Master',
                        email: 'master@test.dev',
                    },
                    resolvedByUserId: null,
                }]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const invitations = await service.listReceivedCampaignInvitations();

        expect(invitations).toEqual([jasmine.objectContaining({
            inviteId: 8,
            campaignId: 7,
            status: 'pending',
        })]);
    });

    it('resolveCampaignInvitation usa PATCH y refresca cache en best-effort', async () => {
        httpMock.patch.and.callFake((url: string, body: any) => {
            if (url.endsWith('campanas/invitaciones/8')) {
                expect(body).toEqual({ decision: 'accept' });
                return of({
                    message: 'Invitacion aceptada',
                    invitation: {
                        inviteId: 8,
                        status: 'accepted',
                        createdAtUtc: '2026-03-13T10:15:00.000Z',
                        resolvedAtUtc: '2026-03-13T10:20:00.000Z',
                        campaignId: 7,
                        campaignName: 'Campaña visible',
                        invitedUser: {
                            userId: 'user-2',
                            uid: 'actor-1',
                            displayName: 'Actor',
                            email: 'actor@test.dev',
                        },
                        invitedBy: {
                            userId: 'user-9',
                            uid: 'uid-master',
                            displayName: 'Master',
                            email: 'master@test.dev',
                        },
                        resolvedByUserId: 'user-2',
                    },
                });
            }
            throw new Error(`URL inesperada: ${url}`);
        });
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible', campaignRole: 'jugador', membershipStatus: 'activo' }]);
            if (url.endsWith('tramas/campana/7'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const response = await service.resolveCampaignInvitation(8, 'accept');

        expect(response.invitation.status).toBe('accepted');
        expect(httpMock.patch.calls.mostRecent().args[0]).toMatch(/campanas\/invitaciones\/8$/);
        expect(campaignRealtimeSyncSvcMock.notifyLocalChange).toHaveBeenCalledWith(7);
    });

    it('cancelCampaignInvitation usa DELETE contra la ruta canónica', async () => {
        httpMock.delete.and.callFake((url: string) => {
            if (url.endsWith('campanas/invitaciones/8'))
                return of(void 0);
            throw new Error(`URL inesperada: ${url}`);
        });
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' }]);
            if (url.endsWith('tramas/campana/7'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        await service.cancelCampaignInvitation(8);

        expect(httpMock.delete.calls.mostRecent().args[0]).toMatch(/campanas\/invitaciones\/8$/);
        expect(campaignRealtimeSyncSvcMock.notifyLocalChange).toHaveBeenCalled();
    });

    it('searchUsers usa el endpoint público de búsqueda', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('usuarios/search'))
                return of([{ uid: 'uid-1', displayName: 'Aldric', photoThumbUrl: 'thumb.webp' }]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const results = await service.searchUsers('al', 5);

        expect(results).toEqual([{
            uid: 'uid-1',
            displayName: 'Aldric',
            photoThumbUrl: 'thumb.webp',
        }]);
        const args = httpMock.get.calls.mostRecent().args[1];
        expect(args.params.q).toBe('al');
        expect(args.params.limit).toBe('5');
    });
});
