import { of } from 'rxjs';
import { SocialApiService } from './social-api.service';

describe('SocialApiService', () => {
    const authMock = {
        currentUser: {
            getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-social'),
        },
    } as any;

    it('searchUsers normaliza allowDirectMessagesFromNonFriends', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete']);
        httpMock.get.and.returnValue(of([
            {
                uid: ' uid-2 ',
                displayName: ' Yuna ',
                photoThumbUrl: ' thumb.webp ',
                allowDirectMessagesFromNonFriends: true,
            },
            {
                uid: 'uid-3',
                displayName: 'Rook',
                photoThumbUrl: null,
            },
        ]));
        const service = new SocialApiService(httpMock, authMock);

        const results = await service.searchUsers('yu', 12);

        expect(results).toEqual([
            {
                uid: 'uid-2',
                displayName: 'Yuna',
                photoThumbUrl: 'thumb.webp',
                allowDirectMessagesFromNonFriends: true,
            },
            {
                uid: 'uid-3',
                displayName: 'Rook',
                photoThumbUrl: null,
                allowDirectMessagesFromNonFriends: false,
            },
        ]);
        const [, options] = httpMock.get.calls.mostRecent().args;
        expect(options.params).toEqual({
            q: 'yu',
            limit: '12',
        });
    });

    it('listFriends usa Firestore privado cuando el read model esta disponible', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete']);
        const privateUserFirestoreSvcMock = {
            listFriends: jasmine.createSpy('listFriends').and.resolveTo({
                items: [{
                    uid: 'uid-2',
                    displayName: 'Yuna',
                    photoThumbUrl: null,
                    allowDirectMessagesFromNonFriends: true,
                    friendsSince: '2026-03-15T10:00:00.000Z',
                }],
                meta: {
                    totalCount: 1,
                    limit: 25,
                    offset: 0,
                    hasMore: false,
                },
            }),
        };
        const service = new SocialApiService(httpMock, authMock, privateUserFirestoreSvcMock as any);

        const result = await service.listFriends();

        expect(result.items[0].uid).toBe('uid-2');
        expect(httpMock.get).not.toHaveBeenCalled();
    });
});
