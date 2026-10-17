import { fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';

import { CampanaService } from './campana.service';
import { CampaignRealtimeSyncService } from './campaign-realtime-sync.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { CampaignListItem } from '../interfaces/campaign-management';
import { simularTokenApi } from 'src/testing/simular-token-api';

describe('CampanaService', () => {
    beforeEach(() => simularTokenApi('token'));

    let httpMock: { get: jasmine.Spy; post: jasmine.Spy; patch: jasmine.Spy; delete: jasmine.Spy; };
    let service: CampanaService;
    let invalidations$: Subject<any>;
    let campaignRealtimeSyncSvcMock: jasmine.SpyObj<CampaignRealtimeSyncService>;
    let privateUserFirestoreSvcMock: { listCampaigns: jasmine.Spy; watchCampaigns: jasmine.Spy; };
    let watchState: { next: ((items: any[]) => void) | null; };

    beforeEach(() => {
        sessionStorage.clear();
        httpMock = {
            get: jasmine.createSpy('get'),
            post: jasmine.createSpy('post'),
            patch: jasmine.createSpy('patch'),
            delete: jasmine.createSpy('delete'),
        };
        invalidations$ = new Subject<any>();
        watchState = { next: null };
        campaignRealtimeSyncSvcMock = jasmine.createSpyObj<CampaignRealtimeSyncService>(
            'CampaignRealtimeSyncService',
            ['notifyLocalChange'],
            { listInvalidations$: invalidations$.asObservable() }
        );
        privateUserFirestoreSvcMock = {
            listCampaigns: jasmine.createSpy('listCampaigns').and.resolveTo([]),
            watchCampaigns: jasmine.createSpy('watchCampaigns').and.callFake((next: (items: any[]) => void) => {
                watchState.next = next;
                return () => undefined;
            }),
        };

        service = new CampanaService(
            { currentUser: { uid: 'actor-1', getIdToken: async () => 'token' } } as any,
            httpMock as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            campaignRealtimeSyncSvcMock,
            privateUserFirestoreSvcMock as any
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

    it('createCampaign serializa nepMaximoPersonajeNuevo cuando se informa', async () => {
        httpMock.post.and.returnValue(of({ idCampana: 7, nombre: 'Campaña nueva' }));

        await service.createCampaign({
            nombre: 'Campaña nueva',
            politicaCreacion: {
                tiradaMinimaCaracteristica: 8,
                nepMaximoPersonajeNuevo: 6,
                maxTablasDadosCaracteristicas: 2,
                permitirHomebrewGeneral: true,
                permitirVentajasDesventajas: true,
                permitirIgnorarRestriccionesAlineamiento: false,
                maxFuentesHomebrewGeneralesPorPersonaje: null,
            },
        });

        expect(httpMock.post).toHaveBeenCalled();
        expect(httpMock.post.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
            politicaCreacion: jasmine.objectContaining({
                nepMaximoPersonajeNuevo: 6,
            }),
        }));
    });

    it('createCampaign limpia el límite de fuentes cuando se permite homebrew general', async () => {
        httpMock.post.and.returnValue(of({ idCampana: 7, nombre: 'Campaña nueva' }));

        await service.createCampaign({
            nombre: 'Campaña nueva',
            politicaCreacion: {
                permitirHomebrewGeneral: true,
                maxFuentesHomebrewGeneralesPorPersonaje: 0,
            },
        });

        expect(httpMock.post.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
            politicaCreacion: jasmine.objectContaining({
                permitirHomebrewGeneral: true,
                maxFuentesHomebrewGeneralesPorPersonaje: null,
            }),
        }));
    });

    it('createCampaign rechaza nombres demasiado cortos', async () => {
        await expectAsync(service.createCampaign('Mini')).toBeRejectedWithError(
            'El nombre de campaña debe tener entre 5 y 150 caracteres.'
        );
        expect(httpMock.post).not.toHaveBeenCalled();
    });

    it('createCampaign rechaza nombres formados solo por números', async () => {
        await expectAsync(service.createCampaign('12345')).toBeRejectedWithError(
            'El nombre de campaña no puede estar formado solo por números.'
        );
        expect(httpMock.post).not.toHaveBeenCalled();
    });

    it('updateCampaign rechaza nombres demasiado largos', async () => {
        await expectAsync(service.updateCampaign(7, { nombre: 'a'.repeat(151) })).toBeRejectedWithError(
            'El nombre de campaña debe tener entre 5 y 150 caracteres.'
        );
        expect(httpMock.patch).not.toHaveBeenCalled();
    });

    it('traduce errores de nombre duplicado a un mensaje funcional', async () => {
        httpMock.post.and.returnValue(new Subject<any>().asObservable());
        httpMock.post.and.callFake(() => {
            throw new HttpErrorResponse({
                status: 500,
                error: {
                    message: "Violation of UNIQUE KEY constraint 'UQ_Campanas_Nombre'. Cannot insert duplicate key row in object 'dbo.Campanas' with unique index 'IX_Campanas_Nombre'.",
                },
            });
        });

        await expectAsync(service.createCampaign('Costa de la Espada')).toBeRejectedWithError(
            'Ese nombre ya está en uso por otra campaña.'
        );
    });

    it('traduce errores vagos de integridad al renombrar una campaña como nombre ya usado', async () => {
        httpMock.patch.and.callFake(() => {
            throw new HttpErrorResponse({
                status: 409,
                error: {
                    message: 'Error de integridad de datos.',
                },
            });
        });

        await expectAsync(service.updateCampaign(7, { nombre: 'Costa de la Espada' })).toBeRejectedWithError(
            'Ese nombre ya está en uso por otra campaña.'
        );
    });

    it('listSocialCampaigns recupera campañas propias aunque la proyección privada llegue sin membresía activa', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña propia', campaignRole: null, membershipStatus: null, isOwner: true },
        ]);
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7')) {
                return of({
                    idCampana: 7,
                    nombre: 'Campaña propia',
                    ownerUid: 'actor-1',
                    activeMasterUid: 'actor-1',
                    tramas: [],
                });
            }
            throw new Error(`URL inesperada: ${url}`);
        });

        const campaigns = await service.listSocialCampaigns();

        expect(campaigns).toEqual([{
            id: 7,
            nombre: 'Campaña propia',
            campaignRole: 'master',
            membershipStatus: 'activo',
            isOwner: true,
        }]);
    });

    it('listSocialCampaigns sustituye nombres sintéticos por el nombre real de la campaña', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña 7', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7')) {
                return of({
                    idCampana: 7,
                    nombre: 'Caballeros de Cormyr',
                    ownerUid: 'actor-1',
                    activeMasterUid: 'actor-1',
                    tramas: [],
                });
            }
            throw new Error(`URL inesperada: ${url}`);
        });

        const campaigns = await service.listSocialCampaigns();

        expect(campaigns).toEqual([{
            id: 7,
            nombre: 'Caballeros de Cormyr',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }]);
    });

    it('getCampaignDetail normaliza nepMaximoPersonajeNuevo desde la API', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7')) {
                return of({
                    idCampana: 7,
                    nombre: 'Campaña propia',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    ownerUid: 'actor-1',
                    activeMasterUid: 'actor-1',
                    politicaCreacion: {
                        tiradaMinimaCaracteristica: 8,
                        nepMaximoPersonajeNuevo: 6,
                        maxTablasDadosCaracteristicas: 2,
                        permitirHomebrewGeneral: true,
                        permitirVentajasDesventajas: true,
                        permitirIgnorarRestriccionesAlineamiento: false,
                        maxFuentesHomebrewGeneralesPorPersonaje: null,
                    },
                    tramas: [],
                });
            }
            if (url.endsWith('campanas/7/jugadores'))
                return of([]);
            if (url.endsWith('campanas/7/invitaciones'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await service.getCampaignDetail(7);

        expect(detail.politicaCreacion.nepMaximoPersonajeNuevo).toBe(6);
    });

    it('getListCampanas añade la opción sintética Sin campaña para campañas con membresía activa', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        httpMock.get.and.callFake((url: string) => {
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
                if (value.length < 2)
                    return;
                resolve(value);
                subscription.unsubscribe();
            });
            watchState.next?.([
                { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
            ]);
        });

        expect(campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Campaña visible']);
    });

    it('getListCampanas vuelve a emitir tras una invalidación realtime o local', fakeAsync(() => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
            { id: 8, nombre: 'Campaña nueva', campaignRole: 'jugador', membershipStatus: 'activo' },
        ]);
        httpMock.get.and.callFake((url: string) => {
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
        watchState.next?.([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        tick();

        invalidations$.next({
            code: 'system.campaign_invitation_resolved',
            campaignId: 7,
            conversationId: null,
            source: 'remote',
        });
        tick();

        expect(emissions).toEqual([
            ['Sin campaña'],
            ['Sin campaña', 'Campaña visible'],
            ['Sin campaña', 'Campaña visible', 'Campaña nueva'],
        ]);

        subscription.unsubscribe();
    }));

    it('getListCampanas pausa la expansión actor-scoped mientras usage está pendiente y la rearma al aceptar', fakeAsync(() => {
        const complianceProfile$ = new BehaviorSubject<any>(null);
        let blockedByCompliance = false;
        const firestoreBackedService = new CampanaService(
            { currentUser: { uid: 'actor-1', getIdToken: async () => 'token' } } as any,
            httpMock as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            campaignRealtimeSyncSvcMock,
            privateUserFirestoreSvcMock as any,
            {
                currentPrivateProfile$: complianceProfile$.asObservable(),
                getAccessRestriction: jasmine.createSpy('getAccessRestriction').and.callFake(() =>
                    blockedByCompliance ? 'mustAcceptUsage' : null
                ),
            } as any,
        );
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7')) {
                return of({
                    i: 7,
                    n: 'Campaña visible',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [],
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

        watchState.next?.([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        tick();
        expect(emissions).toContain(['Sin campaña', 'Campaña visible']);
        const httpCallsBeforeBlock = httpMock.get.calls.count();

        blockedByCompliance = true;
        complianceProfile$.next({
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });
        tick();
        expect(emissions[emissions.length - 1]).toEqual(['Sin campaña']);

        tick(30000);
        expect(httpMock.get.calls.count()).toBe(httpCallsBeforeBlock);

        blockedByCompliance = false;
        complianceProfile$.next({
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });
        tick();

        expect(httpMock.get.calls.count()).toBeGreaterThan(httpCallsBeforeBlock);
        expect(emissions[emissions.length - 1]).toEqual(['Sin campaña', 'Campaña visible']);

        subscription.unsubscribe();
    }));

    it('getListCampanas detiene el polling cuando no quedan suscriptores', fakeAsync(() => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        httpMock.get.and.callFake((url: string) => {
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
        watchState.next?.([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        tick();

        expect(privateUserFirestoreSvcMock.listCampaigns.calls.count()).toBe(0);
        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas\/7$/)).length).toBe(1);

        tick(30000);
        expect(privateUserFirestoreSvcMock.listCampaigns.calls.count()).toBe(1);
        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas\/7$/)).length).toBe(2);

        subscription.unsubscribe();
        tick(30000);

        expect(privateUserFirestoreSvcMock.listCampaigns.calls.count()).toBe(1);
        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas\/7$/)).length).toBe(2);
    }));

    it('getListCampanas evita rehidratar detalles si detailRevision no cambia en el polling ligero', fakeAsync(() => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo', detailRevision: 'campaign-7:aaa' },
        ]);
        httpMock.get.and.callFake((url: string) => {
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
        watchState.next?.([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo', detailRevision: 'campaign-7:aaa' },
        ]);
        tick();

        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas\/7$/)).length).toBe(1);

        tick(30000);
        expect(privateUserFirestoreSvcMock.listCampaigns.calls.count()).toBe(1);
        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas\/7$/)).length).toBe(1);

        tick(270000);
        expect(privateUserFirestoreSvcMock.listCampaigns.calls.count()).toBeGreaterThan(1);
        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas\/7$/)).length).toBe(1);

        subscription.unsubscribe();
    }));

    it('getListCampanas mantiene refresco REST defensivo si falta detailRevision', fakeAsync(() => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        httpMock.get.and.callFake((url: string) => {
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
        watchState.next?.([
            { id: 7, nombre: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        tick();

        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas\/7$/)).length).toBe(1);

        tick(30000);
        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas\/7$/)).length).toBe(2);

        subscription.unsubscribe();
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

    it('getListCampanas expone de forma optimista una campaña creada antes de que Firestore emita', fakeAsync(() => {
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

        httpMock.post.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of({ idCampana: 7, nombre: 'Caballeros de Cormyr' });
            throw new Error(`URL inesperada: ${url}`);
        });
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Caballeros de Cormyr',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [],
                });
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

        void firestoreBackedService.createCampaign('Caballeros de Cormyr');
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
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña propia', campaignRole: 'master', membershipStatus: 'activo' },
            { id: 8, nombre: 'Campaña expulsado', campaignRole: 'jugador', membershipStatus: 'expulsado' },
            { id: 9, nombre: 'Campaña legacy owner', campaignRole: null, membershipStatus: null },
        ]);
        httpMock.get.and.callFake((url: string) => {
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
                if (value.length < 2)
                    return;
                resolve(value);
                subscription.unsubscribe();
            });
            watchState.next?.([
                { id: 7, nombre: 'Campaña propia', campaignRole: 'master', membershipStatus: 'activo' },
                { id: 8, nombre: 'Campaña expulsado', campaignRole: 'jugador', membershipStatus: 'expulsado' },
                { id: 9, nombre: 'Campaña legacy owner', campaignRole: null, membershipStatus: null },
            ]);
        });

        expect(campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Campaña propia']);
        expect(privateUserFirestoreSvcMock.listCampaigns).not.toHaveBeenCalled();
        expect(httpMock.get.calls.allArgs().map((args) => args[0])).toEqual([
            jasmine.stringMatching(/campanas\/7$/),
        ]);
    });

    it('getListCampanas reutiliza el árbol actor-scoped de detalle para preservar tramas solo master', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Caballeros de Cormyr', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        httpMock.get.and.callFake((url: string) => {
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
                if (value.length < 2)
                    return;
                resolve(value);
                subscription.unsubscribe();
            });
            watchState.next?.([
                { id: 7, nombre: 'Caballeros de Cormyr', campaignRole: 'master', membershipStatus: 'activo' },
            ]);
        });

        expect(campanas[1].Tramas.map((item: any) => item.Nombre)).toEqual([
            'Buscando a razidir',
            'Invasión de cormyr',
        ]);
        expect(campanas[1].Tramas[1].VisibleParaJugadores).toBeFalse();
        expect(campanas[1].Tramas[1].Subtramas[0].Nombre).toBe('Partida 1');
    });

    it('getListCampanas sustituye nombres sintéticos del read model por el nombre canónico del detalle', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña 7', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    i: 7,
                    n: 'Caballeros de Cormyr',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    tramas: [],
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        const observable = await service.getListCampanas();
        const campanas = await new Promise<any[]>((resolve) => {
            const subscription = observable.subscribe((value) => {
                if (value.length < 2)
                    return;
                resolve(value);
                subscription.unsubscribe();
            });
            watchState.next?.([
                { id: 7, nombre: 'Campaña 7', campaignRole: 'master', membershipStatus: 'activo' },
            ]);
        });

        expect(campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Caballeros de Cormyr']);
    });

    it('listVisibleCampaigns normaliza rol y estado de membresía', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 9, nombre: 'Costa', campaignRole: 'master', membershipStatus: 'activo' },
            { id: 10, nombre: 'Bosque', campaignRole: 'jugador', membershipStatus: 'expulsado' },
        ]);

        const campaigns = await service.listVisibleCampaigns();

        expect(campaigns).toEqual([
            { id: 9, nombre: 'Costa', campaignRole: 'master', membershipStatus: 'activo' },
            { id: 10, nombre: 'Bosque', campaignRole: 'jugador', membershipStatus: 'expulsado' },
        ]);
    });

    it('listVisibleCampaigns tolera alias legacy para rol y estado', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 9, nombre: 'Costa', campaignRole: 'master', membershipStatus: 'activo' },
            { id: 10, nombre: 'Bosque', campaignRole: 'jugador', membershipStatus: 'expulsado' },
        ]);

        const campaigns = await service.listVisibleCampaigns();

        expect(campaigns).toEqual([
            { id: 9, nombre: 'Costa', campaignRole: 'master', membershipStatus: 'activo' },
            { id: 10, nombre: 'Bosque', campaignRole: 'jugador', membershipStatus: 'expulsado' },
        ]);
    });

    it('listVisibleCampaigns preserva null en campañas legacy donde el actor solo es owner', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 12, nombre: 'Legacy propia', campaignRole: null, membershipStatus: null },
        ]);

        const campaigns = await service.listVisibleCampaigns();

        expect(campaigns).toEqual([
            { id: 12, nombre: 'Legacy propia', campaignRole: null, membershipStatus: null },
        ]);
    });

    it('listProfileCampaigns conserva membresías activas y campañas propias sin membresía directa', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Legacy propia', campaignRole: null, membershipStatus: null },
            { id: 8, nombre: 'Aventureros', campaignRole: 'jugador', membershipStatus: 'activo' },
            { id: 9, nombre: 'Ajena visible', campaignRole: null, membershipStatus: null },
            { id: 10, nombre: 'Expulsado', campaignRole: 'jugador', membershipStatus: 'expulsado' },
        ]);
        httpMock.get.and.callFake((url: string) => {
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
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        const campaigns = await service.listProfileCampaigns();

        expect(campaigns).toEqual([
            { id: 7, nombre: 'Legacy propia', campaignRole: null, membershipStatus: null, isOwner: true },
            { id: 8, nombre: 'Aventureros', campaignRole: 'jugador', membershipStatus: 'activo' },
        ]);
    });

    it('listProfileCampaigns sustituye nombres sintéticos del summary por el nombre real', async () => {
        privateUserFirestoreSvcMock.listCampaigns.and.resolveTo([
            { id: 7, nombre: 'Campaña 7', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    idCampana: 7,
                    nombre: 'Caballeros de Cormyr',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    ownerUid: 'actor-1',
                    activeMasterUid: 'actor-1',
                    tramas: [],
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        const campaigns = await service.listProfileCampaigns();

        expect(campaigns).toEqual([
            { id: 7, nombre: 'Caballeros de Cormyr', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
    });

    it('watchCampaignSummaries corrige nombres sintéticos del watcher y no vuelve a degradarlos', fakeAsync(() => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    idCampana: 7,
                    nombre: 'Caballeros de Cormyr',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    ownerUid: 'actor-1',
                    activeMasterUid: 'actor-1',
                    tramas: [],
                });
            throw new Error(`URL inesperada: ${url}`);
        });

        const emissions: CampaignListItem[][] = [];
        const stop = service.watchCampaignSummaries((items) => emissions.push(items));

        watchState.next?.([
            { id: 7, nombre: 'Campaña', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        tick();

        watchState.next?.([
            { id: 7, nombre: 'Campaña', campaignRole: 'master', membershipStatus: 'activo' },
        ]);
        tick();

        expect(emissions).toEqual([
            [{ id: 7, nombre: 'Caballeros de Cormyr', campaignRole: 'master', membershipStatus: 'activo' }],
            [{ id: 7, nombre: 'Caballeros de Cormyr', campaignRole: 'master', membershipStatus: 'activo' }],
        ]);
        expect(httpMock.get.calls.allArgs().filter((args) => `${args[0]}`.match(/campanas\/7$/)).length).toBe(1);

        stop();
    }));

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

    it('getCampaignDetail normaliza política permisiva legacy con límite 0 como sin límite', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    idCampana: 7,
                    nombre: 'Campaña visible',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    politicaCreacion: {
                        permitirHomebrewGeneral: true,
                        maxFuentesHomebrewGeneralesPorPersonaje: 0,
                    },
                    tramas: [],
                });
            if (url.endsWith('campanas/7/jugadores'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await service.getCampaignDetail(7, true);

        expect(detail.politicaCreacion.permitirHomebrewGeneral).toBeTrue();
        expect(detail.politicaCreacion.maxFuentesHomebrewGeneralesPorPersonaje).toBeNull();
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
        expect(detail.espacio).toBeNull();
        expect(detail.pendingTransfer).toBeNull();
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

    it('getCampaignDetail del máster trae el espacio y lo pendiente de la plataforma', async () => {
        const spacesMock = {
            espacio: jasmine.createSpy('espacio').and.resolveTo({ id: 41, traspaso: { cuenta: 'uid-jugador', rolSaliente: 'jugador', caduca: null } }),
            invitacionesEnviadas: jasmine.createSpy('invitacionesEnviadas').and.resolveTo([{ id: 3, cuenta: null, alias: null, correo: 'a***@x.es', creada: null, caduca: null }]),
            solicitudes: jasmine.createSpy('solicitudes').and.resolveTo([{ id: 5, cuenta: 'uid-x', alias: 'x', nombre: null, mensaje: 'Hola', creada: null }]),
        };
        const spacesService = new CampanaService(
            { currentUser: { uid: 'actor-1', getIdToken: async () => 'token' } } as any,
            httpMock as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            campaignRealtimeSyncSvcMock,
            privateUserFirestoreSvcMock as any,
            undefined,
            spacesMock as any,
        );
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({
                    idCampana: 7,
                    nombre: 'La tumba',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    espacio: { id: 41, entrada: 'solicitud' },
                    tramas: [],
                });
            if (url.endsWith('campanas/7/jugadores'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await spacesService.getCampaignDetail(7);

        expect(detail.espacio).toEqual({ id: 41, entrada: 'solicitud' });
        expect(detail.pendingInvitations.length).toBe(1);
        expect(detail.joinRequests.length).toBe(1);
        expect(detail.pendingTransfer?.cuenta).toBe('uid-jugador');
        expect(spacesMock.invitacionesEnviadas).toHaveBeenCalledWith(41);
    });

    it('getCampaignDetail de un jugador no pide a la plataforma invitaciones ni solicitudes', async () => {
        const spacesMock = {
            espacio: jasmine.createSpy('espacio').and.rejectWith(new Error('caída')),
            invitacionesEnviadas: jasmine.createSpy('invitacionesEnviadas'),
            solicitudes: jasmine.createSpy('solicitudes'),
        };
        const spacesService = new CampanaService(
            { currentUser: { uid: 'actor-1', getIdToken: async () => 'token' } } as any,
            httpMock as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            campaignRealtimeSyncSvcMock,
            privateUserFirestoreSvcMock as any,
            undefined,
            spacesMock as any,
        );
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7'))
                return of({ idCampana: 7, nombre: 'La tumba', campaignRole: 'jugador', membershipStatus: 'activo', espacio: { id: 41, entrada: 'invitacion' }, tramas: [] });
            if (url.endsWith('campanas/7/jugadores'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await spacesService.getCampaignDetail(7);

        expect(detail.espacio).toEqual({ id: 41, entrada: 'invitacion' });
        expect(detail.pendingTransfer).toBeNull();
        expect(spacesMock.invitacionesEnviadas).not.toHaveBeenCalled();
        expect(spacesMock.solicitudes).not.toHaveBeenCalled();
    });

    it('syncMembership pide a la API que se ponga al día y avisa del cambio aunque falle', async () => {
        httpMock.post.and.callFake((url: string) => {
            if (url.endsWith('campanas/pertenencia/sincronizar'))
                return of({ aplicados: 1 });
            throw new Error(`URL inesperada: ${url}`);
        });
        await service.syncMembership(7);
        expect(httpMock.post.calls.mostRecent().args[0]).toMatch(/campanas\/pertenencia\/sincronizar$/);
        expect(campaignRealtimeSyncSvcMock.notifyLocalChange).toHaveBeenCalledWith(7);

        httpMock.post.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
        await expectAsync(service.syncMembership(7)).toBeResolved();
    });

    it('getCampaignEntry da la campaña con solicitudes y null si no se enseña', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas/7/entrada'))
                return of({ idCampana: 7, nombre: 'La tumba', masterDisplayName: 'Ana', esMiembro: false, espacio: { id: 41, entrada: 'solicitud' } });
            if (url.endsWith('campanas/8/entrada'))
                return throwError(() => new HttpErrorResponse({ status: 404 }));
            throw new Error(`URL inesperada: ${url}`);
        });

        expect(await service.getCampaignEntry(7)).toEqual({
            idCampana: 7,
            nombre: 'La tumba',
            masterDisplayName: 'Ana',
            esMiembro: false,
            espacio: { id: 41, entrada: 'solicitud' },
        });
        expect(await service.getCampaignEntry(8)).toBeNull();
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
