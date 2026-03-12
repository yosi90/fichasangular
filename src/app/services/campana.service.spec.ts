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
            { currentUser: { getIdToken: async () => 'token' } } as any,
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

    it('getListCampanas añade la opción sintética Sin campaña', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible' }]);
            if (url.endsWith('tramas/campana/7'))
                return of([]);
            throw new Error(`URL inesperada: ${url}`);
        });

        const observable = await service.getListCampanas();
        const campanas = await new Promise<any[]>((resolve) => observable.subscribe(resolve));

        expect(campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Campaña visible']);
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

    it('getCampaignDetail compone miembros y árbol de tramas actor-scoped', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' }]);
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
        expect(detail.includeInactiveMembers).toBeTrue();
        expect(detail.members[0].uid).toBe('uid-master');
        expect(detail.tramas[0].subtramas[0].nombre).toBe('Subtrama alfa');
    });

    it('descarta miembros malformados sin uid canónico', async () => {
        httpMock.get.and.callFake((url: string) => {
            if (url.endsWith('campanas'))
                return of([{ i: 7, n: 'Campaña visible', campaignRole: 'master', membershipStatus: 'activo' }]);
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
