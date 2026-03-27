import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { SocialActivitySectionComponent } from './social-activity-section.component';
import { SocialRealtimeService } from 'src/app/services/social-realtime.service';
import { SocialV3ApiService } from 'src/app/services/social-v3-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';

describe('SocialActivitySectionComponent', () => {
    let fixture: ComponentFixture<SocialActivitySectionComponent>;
    let component: SocialActivitySectionComponent;
    let socialV3ApiSvc: jasmine.SpyObj<SocialV3ApiService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;
    let events$: Subject<any>;
    let refetchRequested$: Subject<void>;

    beforeEach(async () => {
        events$ = new Subject<any>();
        refetchRequested$ = new Subject<void>();
        socialV3ApiSvc = jasmine.createSpyObj<SocialV3ApiService>('SocialV3ApiService', ['getFeed']);
        socialV3ApiSvc.getFeed.and.resolveTo({
            items: [{
                id: 'feed-1',
                kind: 'friendship.created',
                createdAtUtc: null,
                visibility: 'global',
                actor: {
                    uid: 'uid-2',
                    displayName: 'Yuna',
                    photoThumbUrl: null,
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
                metadata: {},
            }],
            meta: {
                total: 1,
                limit: 12,
                offset: 0,
                hasMore: false,
            },
        } as any);
        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openPublicProfile']);

        await TestBed.configureTestingModule({
            declarations: [SocialActivitySectionComponent],
            imports: [FormsModule],
            providers: [
                { provide: SocialV3ApiService, useValue: socialV3ApiSvc },
                {
                    provide: SocialRealtimeService,
                    useValue: {
                        events$: events$.asObservable(),
                        refetchRequested$: refetchRequested$.asObservable(),
                    },
                },
                { provide: UserProfileNavigationService, useValue: userProfileNavSvc },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(SocialActivitySectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('carga el feed al entrar con sesión', fakeAsync(() => {
        component.isLoggedIn = true;

        component.ngOnChanges();
        tick();

        expect(socialV3ApiSvc.getFeed).toHaveBeenCalledWith({
            scope: 'global',
            kind: null,
            limit: 12,
            offset: 0,
        });
        expect(component.items.map((item) => item.id)).toEqual(['feed-1']);
    }));

    it('refresca el feed tras una petición de refetch realtime', fakeAsync(() => {
        component.isLoggedIn = true;
        component.ngOnChanges();
        tick();
        socialV3ApiSvc.getFeed.calls.reset();

        refetchRequested$.next();
        tick();

        expect(socialV3ApiSvc.getFeed).toHaveBeenCalledTimes(1);
    }));

    it('inyecta items realtime compatibles con los filtros y deduplica por id', () => {
        component.isLoggedIn = true;
        component.scope = 'global';
        component.items = [{
            id: 'feed-1',
            kind: 'friendship.created',
            createdAtUtc: null,
            visibility: 'global',
            actor: { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null },
            subject: { type: 'user', id: 'uid-2', title: 'Yuna' },
            summary: 'old',
            cta: { type: 'open_profile', uid: 'uid-2' },
            metadata: {},
        }];

        events$.next({
            type: 'feed.item_created',
            payload: {
                id: 'feed-2',
                kind: 'campaign.created',
                createdAtUtc: null,
                visibility: 'global',
                actor: { uid: 'uid-3', displayName: 'Marcus', photoThumbUrl: null },
                subject: { type: 'campaign', id: '3', title: 'Mesa nueva' },
                summary: 'Marcus ha creado una campaña.',
                cta: { type: 'open_profile', uid: 'uid-3' },
                metadata: {},
            },
        });
        events$.next({
            type: 'feed.item_created',
            payload: {
                id: 'feed-2',
                kind: 'campaign.created',
                createdAtUtc: null,
                visibility: 'global',
                actor: { uid: 'uid-3', displayName: 'Marcus', photoThumbUrl: null },
                subject: { type: 'campaign', id: '3', title: 'Mesa nueva' },
                summary: 'Marcus ha creado una campaña.',
                cta: { type: 'open_profile', uid: 'uid-3' },
                metadata: {},
            },
        });

        expect(component.items.map((item) => item.id)).toEqual(['feed-2', 'feed-1']);
    });

    it('abre el perfil relacional desde una CTA de actividad', () => {
        component.openItemProfile({
            id: 'feed-1',
            actor: { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null },
            cta: { type: 'open_profile', uid: 'uid-2' },
        } as any);

        expect(userProfileNavSvc.openPublicProfile).toHaveBeenCalledWith({
            uid: 'uid-2',
            initialDisplayName: 'Yuna',
            mode: 'relationship',
        });
    });
});
