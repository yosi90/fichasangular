import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { SocialLfgSectionComponent } from './social-lfg-section.component';
import { SocialRealtimeService } from 'src/app/services/social-realtime.service';
import { SocialV3ApiService } from 'src/app/services/social-v3-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { AppToastService } from 'src/app/services/app-toast.service';

describe('SocialLfgSectionComponent', () => {
    let fixture: ComponentFixture<SocialLfgSectionComponent>;
    let component: SocialLfgSectionComponent;
    let socialV3ApiSvc: jasmine.SpyObj<SocialV3ApiService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;
    let appToastSvc: jasmine.SpyObj<AppToastService>;
    let events$: Subject<any>;
    let refetchRequested$: Subject<void>;

    beforeEach(async () => {
        events$ = new Subject<any>();
        refetchRequested$ = new Subject<void>();
        socialV3ApiSvc = jasmine.createSpyObj<SocialV3ApiService>('SocialV3ApiService', [
            'listLfgPosts',
            'getLfgPost',
            'createLfgPost',
            'updateLfgPost',
            'listLfgApplications',
            'createLfgApplication',
            'updateLfgApplication',
            'openLfgContactConversation',
        ]);
        socialV3ApiSvc.listLfgPosts.and.resolveTo({
            items: [{
                id: 3,
                title: 'Mesa 3.5',
                summary: 'Resumen',
                gameSystem: 'D&D 3.5',
                campaignStyle: 'sandbox',
                slotsTotal: 5,
                slotsOpen: 2,
                scheduleText: 'Sábados',
                language: 'es',
                visibility: 'global',
                status: 'open',
                author: {
                    uid: 'uid-master',
                    displayName: 'Master',
                    photoThumbUrl: null,
                },
                createdAtUtc: null,
                updatedAtUtc: null,
            }],
            meta: {
                total: 1,
                limit: 12,
                offset: 0,
                hasMore: false,
            },
        } as any);
        socialV3ApiSvc.getLfgPost.and.callFake(async (postId: number) => ({
            id: postId,
            title: 'Mesa 3.5',
            summary: 'Resumen',
            gameSystem: 'D&D 3.5',
            campaignStyle: 'sandbox',
            slotsTotal: 5,
            slotsOpen: 2,
            scheduleText: 'Sábados',
            language: 'es',
            visibility: 'global',
            status: 'open',
            author: {
                uid: 'uid-master',
                displayName: 'Master',
                photoThumbUrl: null,
            },
            createdAtUtc: null,
            updatedAtUtc: null,
        }) as any);
        socialV3ApiSvc.createLfgPost.and.resolveTo({
            id: 9,
            title: 'Mesa nueva',
            summary: 'Resumen nuevo',
            gameSystem: 'D&D 3.5',
            campaignStyle: 'intriga',
            slotsTotal: 4,
            slotsOpen: 4,
            scheduleText: 'Domingos',
            language: 'es',
            visibility: 'global',
            status: 'open',
            author: {
                uid: 'uid-actor',
                displayName: 'Actor',
                photoThumbUrl: null,
            },
            createdAtUtc: null,
            updatedAtUtc: null,
        } as any);
        socialV3ApiSvc.listLfgApplications.and.resolveTo({
            items: [{
                applicationId: 7,
                postId: 3,
                status: 'pending',
                message: 'Quiero entrar',
                applicant: {
                    uid: 'uid-actor',
                    displayName: 'Actor',
                    photoThumbUrl: null,
                },
                createdAtUtc: null,
                resolvedAtUtc: null,
                permissions: {
                    canResolve: false,
                    canWithdraw: true,
                },
            }],
            meta: {
                total: 1,
                limit: 25,
                offset: 0,
                hasMore: false,
            },
        } as any);
        socialV3ApiSvc.updateLfgApplication.and.callFake(async (postId: number, applicationId: number, status: string) => ({
            applicationId,
            postId,
            status,
            message: 'Quiero entrar',
            applicant: {
                uid: 'uid-actor',
                displayName: 'Actor',
                photoThumbUrl: null,
            },
            createdAtUtc: null,
            resolvedAtUtc: null,
            permissions: {
                canResolve: false,
                canWithdraw: true,
            },
        }) as any);
        socialV3ApiSvc.openLfgContactConversation.and.resolveTo({
            conversationId: 44,
            created: true,
            type: 'direct',
        });

        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openSocial', 'openPublicProfile']);
        appToastSvc = jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError']);

        await TestBed.configureTestingModule({
            declarations: [SocialLfgSectionComponent],
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
                {
                    provide: UserService,
                    useValue: {
                        CurrentUserUid: 'uid-actor',
                        getComplianceErrorMessage: () => '',
                    },
                },
                { provide: UserProfileNavigationService, useValue: userProfileNavSvc },
                { provide: AppToastService, useValue: appToastSvc },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(SocialLfgSectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('carga posts al entrar con sesión y selecciona el primero', fakeAsync(() => {
        component.isLoggedIn = true;

        component.ngOnChanges();
        tick();

        expect(socialV3ApiSvc.listLfgPosts).toHaveBeenCalled();
        expect(component.posts.length).toBe(1);
        expect(component.selectedPost?.id).toBe(3);
        expect(socialV3ApiSvc.listLfgApplications).toHaveBeenCalledWith(3, {
            status: null,
            limit: 25,
            offset: 0,
        });
    }));

    it('abre el modo creación y guarda una convocatoria nueva', fakeAsync(() => {
        component.isLoggedIn = true;
        component.startCreatePost();
        component.selectedScheduleDays = ['sunday'];
        component.scheduleTimeMasked = '18:00';
        component.draft = {
            title: 'Mesa nueva',
            summary: 'Resumen nuevo',
            gameSystem: 'D&D 3.5',
            campaignStyle: 'intriga',
            slotsTotal: 4,
            scheduleText: '',
            language: 'es',
            visibility: 'global',
            status: 'open',
        };

        void component.saveDraft();
        tick();

        expect(socialV3ApiSvc.createLfgPost).toHaveBeenCalled();
        expect(component.editorMode).toBe('view');
        expect(component.selectedPost?.id).toBe(9);
        expect(appToastSvc.showSuccess).toHaveBeenCalledWith('Convocatoria creada.');
    }));

    it('bloquea guardar una convocatoria con campos de texto solo numericos', () => {
        component.isLoggedIn = true;
        component.startCreatePost();
        component.selectedScheduleDays = ['friday'];
        component.scheduleTimeMasked = '20:00';
        component.draft = {
            title: '1234',
            summary: '5678',
            gameSystem: '35',
            campaignStyle: '999',
            slotsTotal: 4,
            scheduleText: '',
            language: '123',
            visibility: 'global',
            status: 'open',
        };

        void component.saveDraft();

        expect(socialV3ApiSvc.createLfgPost).not.toHaveBeenCalled();
        expect(appToastSvc.showError).toHaveBeenCalledWith('El título debe incluir texto real y no solo números.');
    });

    it('normaliza alias de idioma y permite texto libre en los autocompletes', fakeAsync(() => {
        component.isLoggedIn = true;
        component.startCreatePost();
        component.selectedScheduleDays = ['sunday'];
        component.scheduleTimeMasked = '18:00';
        component.draft = {
            title: 'Mesa en Cormyr',
            summary: 'Campaña abierta para explorar el reino.',
            gameSystem: 'D&D 3.5',
            campaignStyle: 'Hexcrawl marítimo',
            slotsTotal: 4,
            scheduleText: '',
            language: 'es',
            visibility: 'global',
            status: 'open',
        };

        expect(component.filteredCampaignStyleOptions[0]).toBe('Hexcrawl marítimo');
        expect(component.filteredLanguageOptions[0]).toBe('es');

        void component.saveDraft();
        tick();

        expect(socialV3ApiSvc.createLfgPost).toHaveBeenCalledWith(jasmine.objectContaining({
            campaignStyle: 'Hexcrawl marítimo',
            language: 'Español',
            scheduleText: 'Domingos a las 18:00',
        }));
    }));

    it('bloquea guardar una convocatoria sin hora válida en formato 00:00', () => {
        component.isLoggedIn = true;
        component.selectedPost = {
            id: 3,
            author: { uid: 'uid-actor', displayName: 'Actor', photoThumbUrl: null },
            status: 'open',
        } as any;
        component.editorMode = 'edit';
        component.selectedScheduleDays = ['friday'];
        component.scheduleTimeMasked = '1_:__';
        component.draft = {
            title: 'Mesa de Greyhawk',
            summary: 'Campaña semanal estable',
            gameSystem: 'D&D 3.5',
            campaignStyle: 'sandbox',
            slotsTotal: 4,
            scheduleText: '',
            language: 'es',
            visibility: 'global',
            status: 'open',
        };

        void component.saveDraft();

        expect(socialV3ApiSvc.updateLfgPost).not.toHaveBeenCalled();
        expect(appToastSvc.showError).toHaveBeenCalledWith('El horario debe incluir una hora válida en formato 00:00.');
    });

    it('bloquea guardar una convocatoria sin seleccionar días', () => {
        component.isLoggedIn = true;
        component.startCreatePost();
        component.scheduleTimeMasked = '18:00';
        component.draft = {
            title: 'Mesa semanal',
            summary: 'Campaña estable',
            gameSystem: 'D&D 3.5',
            campaignStyle: 'Sandbox',
            slotsTotal: 4,
            scheduleText: '',
            language: 'Español',
            visibility: 'global',
            status: 'open',
        };

        void component.saveDraft();

        expect(socialV3ApiSvc.createLfgPost).not.toHaveBeenCalled();
        expect(appToastSvc.showError).toHaveBeenCalledWith('Debes seleccionar al menos un día de la semana.');
    });

    it('parsea y recompone el horario semanal al editar una convocatoria existente', () => {
        component.selectedPost = {
            id: 3,
            title: 'Mesa 3.5',
            summary: 'Resumen',
            gameSystem: 'D&D 3.5',
            campaignStyle: 'sandbox',
            slotsTotal: 5,
            scheduleText: 'Lunes y Miércoles a las 16:30',
            language: 'es',
            visibility: 'global',
            status: 'open',
            author: { uid: 'uid-actor', displayName: 'Actor', photoThumbUrl: null },
        } as any;

        component.startEditSelectedPost();

        expect(component.selectedScheduleDays).toEqual(['monday', 'wednesday']);
        expect(component.scheduleTimeMasked).toBe('16:30');
    });

    it('permite escribir sobre la máscara de hora carácter a carácter', fakeAsync(() => {
        const input = document.createElement('input');
        input.value = '__:__';
        component.scheduleTimeMasked = '__:__';

        input.setSelectionRange(0, 0);
        component.onScheduleTimeKeydown({
            key: '1',
            target: input,
            preventDefault: () => undefined,
        } as any);
        tick();
        expect(component.scheduleTimeMasked).toBe('1_:__');

        input.setSelectionRange(1, 1);
        component.onScheduleTimeKeydown({
            key: '8',
            target: input,
            preventDefault: () => undefined,
        } as any);
        tick();
        expect(component.scheduleTimeMasked).toBe('18:__');

        input.setSelectionRange(3, 3);
        component.onScheduleTimeKeydown({
            key: '3',
            target: input,
            preventDefault: () => undefined,
        } as any);
        tick();
        component.onScheduleTimeKeydown({
            key: '0',
            target: input,
            preventDefault: () => undefined,
        } as any);
        tick();
        expect(component.scheduleTimeMasked).toBe('18:30');
    }));

    it('retira una aplicación propia y reconcilia con refetch', fakeAsync(() => {
        component.isLoggedIn = true;
        component.selectedPost = {
            id: 3,
            author: { uid: 'uid-master', displayName: 'Master', photoThumbUrl: null },
            status: 'open',
        } as any;
        component.applications = [{
            applicationId: 7,
            postId: 3,
            status: 'pending',
            message: 'Quiero entrar',
            applicant: { uid: 'uid-actor', displayName: 'Actor', photoThumbUrl: null },
            createdAtUtc: null,
            resolvedAtUtc: null,
            permissions: { canResolve: false, canWithdraw: true },
        }];

        void component.resolveApplication(component.applications[0], 'withdrawn');
        tick();

        expect(socialV3ApiSvc.updateLfgApplication).toHaveBeenCalledWith(3, 7, 'withdrawn');
    }));

    it('abre la conversación contextual y navega a Social > Mensajes', fakeAsync(() => {
        component.selectedPost = {
            id: 3,
            author: { uid: 'uid-master', displayName: 'Master', photoThumbUrl: null },
        } as any;

        void component.openContactConversation();
        tick();

        expect(userProfileNavSvc.openSocial).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'mensajes',
            conversationId: 44,
        }));
    }));

    it('no ofrece abrir conversación contextual sobre una convocatoria propia', () => {
        component.selectedPost = {
            id: 3,
            author: { uid: 'uid-actor', displayName: 'Actor', photoThumbUrl: null },
        } as any;

        expect(component.canOpenContactConversation).toBeFalse();
    });

    it('actualiza la lista por realtime cuando entra un post compatible', () => {
        component.isLoggedIn = true;
        component.statusFilter = 'open';
        component.posts = [];

        events$.next({
            type: 'lfg.post_created',
            payload: {
                id: 12,
                title: 'Post realtime',
                summary: 'Resumen',
                gameSystem: 'D&D 3.5',
                campaignStyle: 'sandbox',
                slotsTotal: 4,
                slotsOpen: 4,
                scheduleText: 'Viernes',
                language: 'es',
                visibility: 'global',
                status: 'open',
                author: {
                    uid: 'uid-master',
                    displayName: 'Master',
                    photoThumbUrl: null,
                },
                createdAtUtc: null,
                updatedAtUtc: null,
            },
        });

        expect(component.posts.map((item) => item.id)).toEqual([12]);
    });
});
