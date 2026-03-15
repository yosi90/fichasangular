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
});
