import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { CampanaService } from './campana.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

class CampanaServiceTestDouble extends CampanaService {
    writeCalls: any[] = [];

    protected override writeCampanasCachePayload(payload: any): Promise<void> {
        this.writeCalls.push(payload);
        return Promise.resolve();
    }
}

describe('CampanaService', () => {
    let httpMock: { get: jasmine.Spy; post: jasmine.Spy; patch: jasmine.Spy; delete: jasmine.Spy; };
    let service: CampanaServiceTestDouble;

    beforeEach(() => {
        httpMock = {
            get: jasmine.createSpy('get'),
            post: jasmine.createSpy('post'),
            patch: jasmine.createSpy('patch'),
            delete: jasmine.createSpy('delete'),
        };

        spyOn(Swal, 'fire').and.resolveTo({} as any);

        service = new CampanaServiceTestDouble(
            { currentUser: { uid: 'actor-1', getIdToken: async () => 'token' } } as any,
            {} as any,
            httpMock as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService
        );
    });

    it('RenovarCampañasFirebase usa rutas canonicas y conserva el shape anidado del cache', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña de prueba' }]);
            if (url.endsWith('tramas/campana/7'))
                return of([{ i: 11, n: 'Trama principal' }]);
            if (url.endsWith('subtramas/trama/11'))
                return of([{ i: 21, n: 'Subtrama alfa' }]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const ok = await service.RenovarCampañasFirebase();

        expect(ok).toBeTrue();
        expect(httpMock.get.calls.allArgs().map((args) => args[0])).toEqual([
            jasmine.stringMatching(/campanas$/),
            jasmine.stringMatching(/tramas\/campana\/7$/),
            jasmine.stringMatching(/subtramas\/trama\/11$/),
        ]);
        expect(service.writeCalls).toEqual([{
            '7': {
                Nombre: 'Campaña de prueba',
                Tramas: [{
                    Id: 11,
                    Nombre: 'Trama principal',
                    Subtramas: [{
                        Id: 21,
                        Nombre: 'Subtrama alfa',
                    }],
                }],
            },
        }]);
    });

    it('createCampaign refresca la cache derivada completa en best-effort', async () => {
        httpMock.post.and.returnValue(of({ idCampana: 7, nombre: 'Campaña nueva' }));
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña nueva' }]);
            if (url.endsWith('tramas/campana/7'))
                return of([{ i: 11, n: 'Trama principal' }]);
            if (url.endsWith('subtramas/trama/11'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const created = await service.createCampaign('Campaña nueva');

        expect(created).toEqual({
            id: 7,
            nombre: 'Campaña nueva',
            campaignRole: 'master',
            membershipStatus: 'activo',
        });
        expect(service.writeCalls).toEqual([{
            '7': {
                Nombre: 'Campaña nueva',
                Tramas: [{
                    Id: 11,
                    Nombre: 'Trama principal',
                    Subtramas: [],
                }],
            },
        }]);
    });

    it('createCampaign no falla si el refresh best-effort de cache revienta', async () => {
        httpMock.post.and.returnValue(of({ idCampana: 7, nombre: 'Campaña nueva' }));
        httpMock.get.and.returnValue(throwError(() => new Error('refresh fail')));

        const created = await service.createCampaign('Campaña nueva');

        expect(created.id).toBe(7);
        expect(service.writeCalls).toEqual([]);
    });

    it('getListCampanas añade la opción sintética Sin campaña para campañas con membresía activa', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' }]);
            if (url.endsWith('tramas/campana/7'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const observable = await service.getListCampanas();
        const campanas = await new Promise<any[]>((resolve) => observable.subscribe(resolve));

        expect(campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Campaña visible']);
    });

    it('getListCampanas excluye campañas sin membresía activa del actor', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([
                    { i: 7, n: 'Campaña propia', campaignRole: 'master', membershipStatus: 'activo' },
                    { i: 8, n: 'Campaña expulsado', campaignRole: 'jugador', membershipStatus: 'expulsado' },
                    { i: 9, n: 'Campaña legacy owner', campaignRole: null, membershipStatus: null },
                ]);
            if (url.endsWith('tramas/campana/7'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const observable = await service.getListCampanas();
        const campanas = await new Promise<any[]>((resolve) => observable.subscribe(resolve));

        expect(campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Campaña propia']);
        expect(httpMock.get.calls.allArgs().map((args) => args[0])).toEqual([
            jasmine.stringMatching(/campanas$/),
            jasmine.stringMatching(/tramas\/campana\/7$/),
        ]);
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
                });
            if (url.endsWith('campanas/7/jugadores'))
                return of([{ uid: 'uid-master', displayName: 'Master', campaignRole: 'master', membershipStatus: 'activo', isActive: true }]);
            if (url.endsWith('tramas/campana/7'))
                return of([{ i: 11, n: 'Trama principal' }]);
            if (url.endsWith('subtramas/trama/11'))
                return of([{ i: 21, n: 'Subtrama alfa' }]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const detail = await service.getCampaignDetail(7, true);

        expect(detail.campaign.nombre).toBe('Campaña visible');
        expect(detail.ownerUid).toBe('uid-owner');
        expect(detail.activeMasterUid).toBe('uid-master');
        expect(detail.includeInactiveMembers).toBeTrue();
        expect(detail.members[0].uid).toBe('uid-master');
        expect(detail.tramas[0].subtramas[0].nombre).toBe('Subtrama alfa');
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

    it('addCampaignMember envía Bearer y targetUid al endpoint canónico', async () => {
        httpMock.post.and.callFake((url: string, body: any, options: any) => {
            if (url.endsWith('campanas/7/jugadores')) {
                expect(body).toEqual({ targetUid: 'uid-target' });
                expect(options.headers.get('Authorization')).toBe('Bearer token');
                return of({ message: 'ok' });
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

        await service.addCampaignMember(7, 'uid-target');

        expect(httpMock.post.calls.count()).toBe(1);
        expect(httpMock.post.calls.mostRecent().args[0]).toMatch(/campanas\/7\/jugadores$/);
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
