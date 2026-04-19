import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PublicUserProfileComponent } from './public-user-profile.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { SocialApiService } from 'src/app/services/social-api.service';
import { SocialV3ApiService } from 'src/app/services/social-v3-api.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';

describe('PublicUserProfileComponent', () => {
    let fixture: ComponentFixture<PublicUserProfileComponent>;
    let component: PublicUserProfileComponent;
    let apiSvc: jasmine.SpyObj<UserProfileApiService>;
    let socialV3ApiSvc: jasmine.SpyObj<SocialV3ApiService>;
    let socialApiSvc: jasmine.SpyObj<SocialApiService>;
    let appToastSvc: jasmine.SpyObj<AppToastService>;

    beforeEach(async () => {
        apiSvc = jasmine.createSpyObj<UserProfileApiService>('UserProfileApiService', ['getPublicProfile']);
        socialV3ApiSvc = jasmine.createSpyObj<SocialV3ApiService>('SocialV3ApiService', ['getRelationshipProfile']);
        socialApiSvc = jasmine.createSpyObj<SocialApiService>('SocialApiService', [
            'sendFriendRequest',
            'listReceivedFriendRequests',
            'listSentFriendRequests',
            'resolveFriendRequest',
        ]);
        appToastSvc = jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError']);

        await TestBed.configureTestingModule({
            declarations: [PublicUserProfileComponent],
            imports: [
                MatButtonModule,
                MatIconModule,
            ],
            providers: [
                { provide: UserProfileApiService, useValue: apiSvc },
                { provide: SocialV3ApiService, useValue: socialV3ApiSvc },
                { provide: SocialApiService, useValue: socialApiSvc },
                { provide: AppToastService, useValue: appToastSvc },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PublicUserProfileComponent);
        component = fixture.componentInstance;
    });

    it('renderiza bio, pronombres y cinco estadisticas cuando existen', fakeAsync(() => {
        apiSvc.getPublicProfile.and.resolveTo({
            uid: 'uid-publico',
            displayName: 'Perfil publico',
            bio: 'Jugador de campañas largas.',
            pronouns: 'elle/they',
            photoThumbUrl: null,
            memberSince: '2026-01-01T00:00:00.000Z',
            stats: {
                totalPersonajes: 2,
                publicos: 1,
                campanasActivas: 3,
                campanasMaster: 1,
                campanasCreadas: 2,
            },
        });

        component.uid = 'uid-publico';
        component.ngOnChanges({
            uid: new SimpleChange('', 'uid-publico', true),
        });
        tick();
        fixture.detectChanges();

        const html = fixture.nativeElement as HTMLElement;
        expect(html.textContent).toContain('Perfil publico');
        expect(html.textContent).toContain('elle/they');
        expect(html.textContent).toContain('Jugador de campañas largas.');
        expect(html.querySelectorAll('.public-profile-stat').length).toBe(5);
        expect(html.textContent).toContain('Campañas activas');
        expect(html.textContent).toContain('Campañas creadas');
    }));

    it('oculta bio y pronombres cuando no existen', fakeAsync(() => {
        apiSvc.getPublicProfile.and.resolveTo({
            uid: 'uid-publico',
            displayName: 'Perfil minimo',
            bio: null,
            pronouns: null,
            photoThumbUrl: null,
            memberSince: null,
            stats: {
                totalPersonajes: 0,
                publicos: 0,
                campanasActivas: 0,
                campanasMaster: 0,
                campanasCreadas: 0,
            },
        });

        component.uid = 'uid-publico';
        component.ngOnChanges({
            uid: new SimpleChange('', 'uid-publico', true),
        });
        tick();
        fixture.detectChanges();

        const html = fixture.nativeElement as HTMLElement;
        expect(html.querySelector('.public-profile-pronouns')).toBeNull();
        expect(html.querySelector('.public-profile-bio')).toBeNull();
        expect(html.querySelectorAll('.public-profile-stat').length).toBe(5);
    }));

    it('carga el perfil relacional cuando se abre en modo relationship', fakeAsync(() => {
        socialV3ApiSvc.getRelationshipProfile.and.resolveTo({
            profile: {
                uid: 'uid-social',
                displayName: 'Perfil social',
                photoThumbUrl: null,
                bio: 'Juega campañas abiertas.',
                pronouns: 'ella',
                joinedAtUtc: '2026-01-01T00:00:00.000Z',
            },
            relationship: {
                state: 'friend',
                blockedByActor: false,
                blockedActor: false,
                mutualFriendsCount: 2,
                mutualCampaignsCount: 1,
            },
            visibility: {
                showAuthenticatedBlock: true,
                showFriendsBlock: true,
                showRecentActivity: true,
            },
            stats: {
                totalCharacters: 3,
                publicCharacters: 2,
                activeCampaigns: 1,
                campaignsAsMaster: 1,
                campaignsCreated: 1,
            },
            recentActivity: [{
                kind: 'campaign.created',
                createdAtUtc: '2026-03-20T10:00:00.000Z',
                summary: 'Creó una campaña nueva.',
            }],
        });

        component.uid = 'uid-social';
        component.mode = 'relationship';
        component.ngOnChanges({
            uid: new SimpleChange('', 'uid-social', true),
            mode: new SimpleChange('public', 'relationship', true),
        });
        tick();
        fixture.detectChanges();

        const html = fixture.nativeElement as HTMLElement;
        expect(socialV3ApiSvc.getRelationshipProfile).toHaveBeenCalledWith('uid-social');
        expect(html.textContent).toContain('Perfil social relacional');
        expect(html.textContent).toContain('Amistad activa.');
        expect(html.textContent).toContain('Amistades en común');
        expect(html.textContent).toContain('Actividad reciente');
    }));

    it('acepta una solicitud recibida desde el perfil relacional usando el requestId privado', fakeAsync(() => {
        socialV3ApiSvc.getRelationshipProfile.and.resolveTo({
            profile: {
                uid: 'uid-social',
                displayName: 'Perfil social',
                photoThumbUrl: null,
                bio: null,
                pronouns: null,
                joinedAtUtc: '2026-01-01T00:00:00.000Z',
            },
            relationship: {
                state: 'incoming_request',
                blockedByActor: false,
                blockedActor: false,
                mutualFriendsCount: 0,
                mutualCampaignsCount: 0,
            },
            visibility: {
                showAuthenticatedBlock: true,
                showFriendsBlock: false,
                showRecentActivity: false,
            },
            stats: {
                totalCharacters: 0,
                publicCharacters: 0,
                activeCampaigns: 0,
                campaignsAsMaster: 0,
                campaignsCreated: 0,
            },
            recentActivity: [],
        });
        socialApiSvc.listReceivedFriendRequests.and.resolveTo({
            items: [{
                requestId: 77,
                direction: 'received',
                status: 'pending',
                createdAtUtc: null,
                target: {
                    uid: 'uid-social',
                    displayName: 'Perfil social',
                    photoThumbUrl: null,
                    allowDirectMessagesFromNonFriends: true,
                },
            }],
            meta: { totalCount: 1, limit: 25, offset: 0, hasMore: false },
        });
        socialApiSvc.resolveFriendRequest.and.resolveTo({
            message: 'Solicitud aceptada.',
            item: null,
        });

        component.uid = 'uid-social';
        component.mode = 'relationship';
        component.ngOnChanges({
            uid: new SimpleChange('', 'uid-social', true),
            mode: new SimpleChange('public', 'relationship', true),
        });
        tick();

        void component.acceptFriendRequest();
        tick();

        expect(socialApiSvc.resolveFriendRequest).toHaveBeenCalledWith(77, 'accept');
        expect(appToastSvc.showSuccess).toHaveBeenCalledWith('Solicitud aceptada.', { category: 'amistad' });
    }));
});
