import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SocialCommunitySectionComponent } from './social-community-section.component';
import { SocialV3ApiService } from 'src/app/services/social-v3-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';

describe('SocialCommunitySectionComponent', () => {
    let fixture: ComponentFixture<SocialCommunitySectionComponent>;
    let component: SocialCommunitySectionComponent;
    let socialV3ApiSvc: jasmine.SpyObj<SocialV3ApiService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;

    beforeEach(async () => {
        socialV3ApiSvc = jasmine.createSpyObj<SocialV3ApiService>('SocialV3ApiService', [
            'listCommunityUsers',
            'getCommunityStats',
            'getCommunityRankings',
        ]);
        socialV3ApiSvc.listCommunityUsers.and.resolveTo({
            items: [{
                uid: 'uid-2',
                displayName: 'Yuna',
                photoThumbUrl: null,
                role: 'master',
                joinedAtUtc: null,
                lastSeenAtUtc: null,
                publicStats: {
                    totalCharacters: 4,
                    publicCharacters: 3,
                    activeCampaigns: 2,
                    campaignsAsMaster: 1,
                    campaignsCreated: 1,
                },
                relationship: {
                    state: 'friend',
                    canOpenProfile: true,
                },
            }],
            meta: {
                total: 1,
                limit: 12,
                offset: 0,
                hasMore: false,
            },
        } as any);
        socialV3ApiSvc.getCommunityStats.and.resolveTo({
            visibleUsers: 12,
            publicCharacters: 20,
            activeCampaigns: 8,
            activeGroups: 3,
            friendLinks: 15,
        });
        socialV3ApiSvc.getCommunityRankings.and.resolveTo({
            metric: 'public_characters',
            generatedAtUtc: null,
            items: [{
                position: 1,
                uid: 'uid-2',
                displayName: 'Yuna',
                photoThumbUrl: null,
                value: 3,
            }],
        });

        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openPublicProfile']);

        await TestBed.configureTestingModule({
            declarations: [SocialCommunitySectionComponent],
            imports: [FormsModule],
            providers: [
                { provide: SocialV3ApiService, useValue: socialV3ApiSvc },
                { provide: UserProfileNavigationService, useValue: userProfileNavSvc },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(SocialCommunitySectionComponent);
        component = fixture.componentInstance;
    });

    it('carga comunidad, stats y rankings al entrar con sesión', fakeAsync(() => {
        component.isLoggedIn = true;

        component.ngOnChanges();
        tick();

        expect(socialV3ApiSvc.listCommunityUsers).toHaveBeenCalled();
        expect(socialV3ApiSvc.getCommunityStats).toHaveBeenCalled();
        expect(socialV3ApiSvc.getCommunityRankings).toHaveBeenCalledWith('public_characters', 8);
        expect(component.users.length).toBe(1);
        expect(component.statCards[0]).toEqual({ label: 'Usuarios visibles', value: 12 });
    }));

    it('abre perfil relacional reutilizando la tab existente', () => {
        component.openRelationshipProfile({
            uid: 'uid-2',
            displayName: 'Yuna',
        } as any);

        expect(userProfileNavSvc.openPublicProfile).toHaveBeenCalledWith({
            uid: 'uid-2',
            initialDisplayName: 'Yuna',
            mode: 'relationship',
        });
    });

    it('resetea su estado al salir de sesión', () => {
        component.users = [{
            uid: 'uid-2',
            displayName: 'Yuna',
        } as any];
        component.stats = {
            visibleUsers: 12,
            publicCharacters: 20,
            activeCampaigns: 8,
            activeGroups: 3,
            friendLinks: 15,
        };
        component.rankings = {
            metric: 'public_characters',
            generatedAtUtc: null,
            items: [],
        };
        component.errorMessage = 'boom';
        component.isLoggedIn = false;

        component.ngOnChanges();

        expect(component.users).toEqual([]);
        expect(component.stats).toBeNull();
        expect(component.rankings).toBeNull();
        expect(component.errorMessage).toBe('');
    });
});
