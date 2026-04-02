import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { createDefaultUserSettings } from 'src/app/interfaces/user-settings';
import { SocialHubComponent } from './social-hub.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { SocialApiService } from 'src/app/services/social-api.service';
import { SocialRealtimeService } from 'src/app/services/social-realtime.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';

describe('SocialHubComponent', () => {
    let fixture: ComponentFixture<SocialHubComponent>;
    let component: SocialHubComponent;
    let isLoggedIn$: BehaviorSubject<boolean>;
    let conversations$: BehaviorSubject<any[]>;
    let unreadUserCount$: BehaviorSubject<number>;
    let unreadSystemCount$: BehaviorSubject<number>;
    let messageCreated$: Subject<any>;
    let messageRead$: Subject<any>;
    let floatingListWindow$: BehaviorSubject<any>;
    let chatApiSvc: jasmine.SpyObj<ChatApiService>;
    let campanaSvc: jasmine.SpyObj<CampanaService>;
    let campaignRealtimeSyncSvc: jasmine.SpyObj<CampaignRealtimeSyncService>;
    let socialApiSvc: jasmine.SpyObj<SocialApiService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;
    let userSettingsSvc: jasmine.SpyObj<UserSettingsService>;
    let chatFloatingSvc: jasmine.SpyObj<ChatFloatingService>;
    let apiActionGuardSvc: jasmine.SpyObj<ApiActionGuardService>;
    let appToastSvc: jasmine.SpyObj<AppToastService>;

    beforeEach(async () => {
        sessionStorage.clear();
        isLoggedIn$ = new BehaviorSubject<boolean>(false);
        conversations$ = new BehaviorSubject<any[]>([]);
        unreadUserCount$ = new BehaviorSubject<number>(0);
        unreadSystemCount$ = new BehaviorSubject<number>(0);
        messageCreated$ = new Subject<any>();
        messageRead$ = new Subject<any>();
        floatingListWindow$ = new BehaviorSubject<any>(null);
        socialApiSvc = jasmine.createSpyObj<SocialApiService>('SocialApiService', [
            'searchUsers',
            'listFriends',
            'listReceivedFriendRequests',
            'listSentFriendRequests',
            'watchFriends',
            'watchReceivedFriendRequests',
            'watchSentFriendRequests',
            'listBlocks',
            'sendFriendRequest',
            'resolveFriendRequest',
            'deleteFriend',
            'blockUser',
            'unblockUser',
        ]);
        socialApiSvc.searchUsers.and.resolveTo([
            { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true },
        ] as any);
        socialApiSvc.watchFriends.and.returnValue(null);
        socialApiSvc.watchReceivedFriendRequests.and.returnValue(null);
        socialApiSvc.watchSentFriendRequests.and.returnValue(null);
        socialApiSvc.listFriends.and.resolveTo({ items: [], meta: { totalCount: 0, limit: 25, offset: 0, hasMore: false } });
        socialApiSvc.listReceivedFriendRequests.and.resolveTo({ items: [], meta: { totalCount: 0, limit: 25, offset: 0, hasMore: false } });
        socialApiSvc.listSentFriendRequests.and.resolveTo({ items: [], meta: { totalCount: 0, limit: 25, offset: 0, hasMore: false } });
        socialApiSvc.listBlocks.and.resolveTo([]);

        chatApiSvc = jasmine.createSpyObj<ChatApiService>('ChatApiService', [
            'createOrOpenDirect',
            'ensureCampaignConversation',
            'createGroup',
            'renameGroup',
            'addGroupParticipant',
            'removeGroupParticipant',
            'getConversationDetail',
            'listMessages',
            'sendMessage',
            'markAsRead',
        ]);
        chatApiSvc.listMessages.and.resolveTo([]);
        chatApiSvc.getConversationDetail.and.resolveTo({
            conversationId: 9,
            type: 'campaign',
            title: 'Caballeros de Cormyr',
            photoThumbUrl: null,
            campaignId: 4,
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
            participants: [
                {
                    uid: 'uid-master',
                    displayName: 'MrYosi90',
                    photoThumbUrl: 'master.webp',
                    isSystemUser: false,
                    participantRole: 'admin',
                    participantStatus: 'active',
                    joinedAtUtc: null,
                    leftAtUtc: null,
                },
            ],
        } as any);
        campanaSvc = jasmine.createSpyObj<CampanaService>('CampanaService', [
            'listReceivedCampaignInvitations',
            'listSocialCampaigns',
            'getCampaignDetail',
            'resolveCampaignInvitation',
        ]);
        campanaSvc.listReceivedCampaignInvitations.and.resolveTo([]);
        campanaSvc.listSocialCampaigns.and.resolveTo([]);
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 4,
                nombre: 'Caballeros de Cormyr',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-master',
            ownerDisplayName: 'MrYosi90',
            activeMasterUid: 'uid-master',
            activeMasterDisplayName: 'MrYosi90',
            canRecoverMaster: false,
            politicaCreacion: {
                tiradaMinimaCaracteristica: null,
                maxTablasDadosCaracteristicas: null,
                permitirHomebrewGeneral: true,
                permitirVentajasDesventajas: true,
                permitirIgnorarRestriccionesAlineamiento: false,
                maxFuentesHomebrewGeneralesPorPersonaje: null,
            },
            members: [],
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        } as any);
        campaignRealtimeSyncSvc = jasmine.createSpyObj<CampaignRealtimeSyncService>('CampaignRealtimeSyncService', [], {
            events$: new Subject<any>().asObservable(),
        });

        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openPublicProfile', 'openSocial', 'openPrivateProfile', 'openAdminPanel']);
        userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', ['loadProfileSettings']);
        chatFloatingSvc = jasmine.createSpyObj<ChatFloatingService>('ChatFloatingService', ['applyProfileSettings', 'openOrFocusListWindow', 'openConversation'], {
            isBubbleFeatureEnabled: true,
            listWindow$: floatingListWindow$.asObservable(),
        });
        apiActionGuardSvc = jasmine.createSpyObj<ApiActionGuardService>('ApiActionGuardService', ['shouldAllow']);
        apiActionGuardSvc.shouldAllow.and.returnValue({
            status: 'allowed',
            blockedUntil: null,
            blocksToday: 0,
            sessionLocked: false,
            newlyBlocked: false,
            newlySessionLocked: false,
        });
        appToastSvc = jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError', 'showInfo', 'showSystem']);
        userSettingsSvc.loadProfileSettings.and.resolveTo({
            ...createDefaultUserSettings().perfil,
            allowDirectMessagesFromNonFriends: true,
        });

        await TestBed.configureTestingModule({
            declarations: [SocialHubComponent],
            imports: [FormsModule],
            providers: [
                {
                    provide: UserService,
                    useValue: {
                        isLoggedIn$,
                        CurrentUserUid: 'uid-1',
                        getAccessRestrictionMessage: jasmine.createSpy('getAccessRestrictionMessage').and.returnValue(''),
                        getComplianceErrorMessage: jasmine.createSpy('getComplianceErrorMessage').and.returnValue(''),
                    },
                },
                { provide: SocialApiService, useValue: socialApiSvc },
                { provide: CampanaService, useValue: campanaSvc },
                { provide: CampaignRealtimeSyncService, useValue: campaignRealtimeSyncSvc },
                { provide: ChatApiService, useValue: chatApiSvc },
                {
                    provide: ChatRealtimeService,
                    useValue: {
                        conversations$,
                        unreadUserCount$,
                        unreadSystemCount$,
                        messageRead$,
                        messageCreated$,
                        refreshConversations: jasmine.createSpy('refreshConversations').and.resolveTo(),
                        upsertConversation: jasmine.createSpy('upsertConversation'),
                        setActiveConversationId: jasmine.createSpy('setActiveConversationId'),
                        markConversationReadLocally: jasmine.createSpy('markConversationReadLocally'),
                    },
                },
                {
                    provide: SocialRealtimeService,
                    useValue: {
                        activate: jasmine.createSpy('activate'),
                        deactivate: jasmine.createSpy('deactivate'),
                        events$: new Subject<any>().asObservable(),
                        refetchRequested$: new Subject<void>().asObservable(),
                    },
                },
                { provide: UserProfileNavigationService, useValue: userProfileNavSvc },
                { provide: UserSettingsService, useValue: userSettingsSvc },
                { provide: ChatFloatingService, useValue: chatFloatingSvc },
                { provide: ApiActionGuardService, useValue: apiActionGuardSvc },
                { provide: AppToastService, useValue: appToastSvc },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(SocialHubComponent);
        component = fixture.componentInstance;
    });

    it('permite buscar usuarios en modo invitado', fakeAsync(() => {
        fixture.detectChanges();

        component.searchQuery = 'yu';
        component.onSearchQueryChange();
        tick(251);

        expect(socialApiSvc.searchUsers).toHaveBeenCalledWith('yu', 12);
        expect(component.searchResults.length).toBe(1);
        expect(component.visibleSearchResults.length).toBe(1);
    }));

    it('expone las nuevas secciones V3 en el orden acordado', () => {
        fixture.detectChanges();

        expect(component.sections.map((item) => item.id)).toEqual([
            'resumen',
            'comunidad',
            'actividad',
            'convocatorias',
            'amistades',
            'bloqueos',
            'campanas',
            'mensajes',
        ]);
    });

    it('expone una acción para abrir la campaña desde un mensaje del sistema', () => {
        fixture.detectChanges();

        const message = {
            messageId: 41,
            conversationId: 9,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Tu invitación de campaña ha sido aceptada.',
            sentAtUtc: '2026-03-26T10:00:00.000Z',
            notification: {
                code: 'system.campaign_invitation_resolved',
                title: 'Invitación resuelta',
                action: {
                    target: 'social.messages',
                    conversationId: 9,
                },
                context: {
                    campaignId: 4,
                },
            },
            announcement: null,
        } as any;

        expect(component.getMessageActionLabel(message)).toBe('Abrir campaña');

        component.runMessageAction(message);

        expect(userProfileNavSvc.openSocial).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'campanas',
            campaignId: 4,
        }));
    });

    it('mantiene campañas visibles aunque falle la carga de invitaciones', fakeAsync(() => {
        campanaSvc.listSocialCampaigns.and.resolveTo([
            { id: 4, nombre: 'Caballeros de Cormyr', campaignRole: 'master', membershipStatus: 'activo' },
        ] as any);
        campanaSvc.listReceivedCampaignInvitations.and.rejectWith(new Error('Fallo invitaciones'));

        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.selectSection('campanas');
        tick();

        expect(component.campaigns.map((item: any) => item.id)).toEqual([4]);
        expect(component.campaignInvitations).toEqual([]);
        expect(component.campaignInvitationsErrorMessage).toBe('Fallo invitaciones');
        expect(component.campaignsErrorMessage).toBe('');
    }));

    it('expone una acción para abrir solicitudes desde un aviso admin del sistema', () => {
        fixture.detectChanges();

        const message = {
            messageId: 42,
            conversationId: 10,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Nueva solicitud de rol pendiente.',
            sentAtUtc: '2026-03-26T10:00:00.000Z',
            notification: {
                code: 'system.role_request_created',
                title: 'Nueva solicitud de rol',
                action: {
                    target: 'admin.role_requests',
                    conversationId: 10,
                },
                context: {
                    requestId: 12,
                },
            },
            announcement: null,
        } as any;

        expect(component.getMessageActionLabel(message)).toBe('Abrir solicitudes');

        component.runMessageAction(message);

        expect(userProfileNavSvc.openAdminPanel).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'role-requests',
            pendingOnly: true,
        }));
    });

    it('excluye al usuario actual de la búsqueda social', fakeAsync(() => {
        socialApiSvc.searchUsers.and.resolveTo([
            { uid: 'uid-1', displayName: 'Yo', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true },
            { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true },
        ] as any);
        fixture.detectChanges();

        void component.runSearch('yo');
        tick();

        expect(component.searchResults.map((item: any) => item.uid)).toEqual(['uid-2']);
    }));

    it('filtra amistades y bloqueos por texto local', () => {
        fixture.detectChanges();

        component.friends = [
            { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true, friendsSince: null },
            { uid: 'uid-3', displayName: 'Marcus', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true, friendsSince: null },
        ];
        component.blocks = [
            { uid: 'uid-4', displayName: 'Rogue Mage', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false, blockedAtUtc: null },
            { uid: 'uid-5', displayName: 'Bandit', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false, blockedAtUtc: null },
        ];

        component.friendsFilterQuery = 'yun';
        component.blocksFilterQuery = 'mage';

        expect(component.visibleFriends.map((item: any) => item.uid)).toEqual(['uid-2']);
        expect(component.visibleBlocks.map((item: any) => item.uid)).toEqual(['uid-4']);
    });

    it('usa watchers realtime privados para amistades y solicitudes cuando están disponibles', fakeAsync(() => {
        socialApiSvc.watchFriends.and.callFake((next: (result: any) => void) => {
            next({
                items: [
                    { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true, friendsSince: null },
                ],
                meta: { totalCount: 1, limit: 25, offset: 0, hasMore: false },
            });
            return () => undefined;
        });
        socialApiSvc.watchReceivedFriendRequests.and.callFake((next: (result: any) => void) => {
            next({
                items: [
                    {
                        requestId: 7,
                        direction: 'received',
                        status: 'pending',
                        createdAtUtc: null,
                        target: { uid: 'uid-3', displayName: 'Marcus', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true },
                    },
                ],
                meta: { totalCount: 1, limit: 25, offset: 0, hasMore: false },
            });
            return () => undefined;
        });
        socialApiSvc.watchSentFriendRequests.and.callFake((next: (result: any) => void) => {
            next({
                items: [],
                meta: { totalCount: 0, limit: 25, offset: 0, hasMore: false },
            });
            return () => undefined;
        });

        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        expect(component.friends.map((item: any) => item.uid)).toEqual(['uid-2']);
        expect(component.receivedRequests.map((item: any) => item.requestId)).toEqual([7]);
        expect(socialApiSvc.listFriends).not.toHaveBeenCalled();
        expect(socialApiSvc.listReceivedFriendRequests).not.toHaveBeenCalled();
        expect(socialApiSvc.listSentFriendRequests).not.toHaveBeenCalled();
        expect(socialApiSvc.listBlocks).toHaveBeenCalled();
    }));

    it('solo permite mensaje en búsqueda si es amistad o acepta directos de no amigos', () => {
        fixture.detectChanges();
        isLoggedIn$.next(true);

        component.friends = [
            { uid: 'uid-friend', displayName: 'Amigo', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false, friendsSince: null },
        ];

        expect(component.canStartConversation({
            uid: 'uid-friend',
            displayName: 'Amigo',
            photoThumbUrl: null,
            allowDirectMessagesFromNonFriends: false,
        })).toBeTrue();

        expect(component.canStartConversation({
            uid: 'uid-closed',
            displayName: 'Cerrado',
            photoThumbUrl: null,
            allowDirectMessagesFromNonFriends: false,
        })).toBeFalse();

        expect(component.canStartConversation({
            uid: 'uid-open',
            displayName: 'Abierto',
            photoThumbUrl: null,
            allowDirectMessagesFromNonFriends: true,
        })).toBeTrue();
    });

    it('abre un perfil público desde resultados de búsqueda', () => {
        fixture.detectChanges();

        component.viewPublicProfile({ uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true });

        expect(userProfileNavSvc.openPublicProfile).toHaveBeenCalledWith({
            uid: 'uid-2',
            initialDisplayName: 'Yuna',
        });
    });

    it('muestra eliminar amistad en búsqueda para relaciones friend y reutiliza la mutación canónica', fakeAsync(() => {
        socialApiSvc.deleteFriend.and.resolveTo();

        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.currentSection = 'amistades';
        component.searchResults = [
            { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false },
        ] as any;
        component.friends = [
            { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false, friendsSince: null },
        ] as any;
        fixture.detectChanges();

        const searchBlock: HTMLElement | null = fixture.nativeElement.querySelector('.social-search-block');
        const deleteButton = searchBlock?.querySelector('button[aria-label="Eliminar amistad"]') as HTMLButtonElement | null;

        expect(deleteButton).withContext('La búsqueda debe exponer la acción contextual para amistades activas.').not.toBeNull();

        deleteButton?.click();
        tick();

        expect(socialApiSvc.deleteFriend).toHaveBeenCalledWith('uid-2');
    }));

    it('activa el realtime social solo cuando la sesión está abierta', fakeAsync(() => {
        const socialRealtimeSvc = TestBed.inject(SocialRealtimeService) as jasmine.SpyObj<SocialRealtimeService>;
        fixture.detectChanges();

        expect(socialRealtimeSvc.activate).not.toHaveBeenCalled();

        isLoggedIn$.next(true);
        tick();

        expect(socialRealtimeSvc.activate).toHaveBeenCalled();

        isLoggedIn$.next(false);
        tick();

        expect(socialRealtimeSvc.deactivate).toHaveBeenCalled();
    }));

    it('etiqueta los toasts de amistad con la categoría amistad', fakeAsync(() => {
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        fixture.detectChanges();

        void component.sendFriendRequest({
            uid: 'uid-2',
            displayName: 'Yuna',
            photoThumbUrl: null,
            allowDirectMessagesFromNonFriends: true,
        });
        tick();

        expect(toastSvc.showSuccess).toHaveBeenCalledWith('Solicitud de amistad enviada.', {
            category: 'amistad',
        });
    }));

    it('muestra Nuevo chat si el actor permite directos con no-amigos', fakeAsync(() => {
        fixture.detectChanges();

        isLoggedIn$.next(true);
        tick();
        component.currentSection = 'mensajes';
        fixture.detectChanges();

        expect(component.canOpenNewDirect).toBeTrue();
        expect(fixture.nativeElement.textContent).toContain('Nuevo chat');
    }));

    it('mantiene Nuevo chat visible aunque el actor no acepte directos de desconocidos', fakeAsync(() => {
        userSettingsSvc.loadProfileSettings.and.resolveTo({
            ...createDefaultUserSettings().perfil,
            allowDirectMessagesFromNonFriends: false,
        });

        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.currentSection = 'mensajes';
        fixture.detectChanges();

        expect(component.actorAllowsNonFriendDM).toBeFalse();
        expect(component.canOpenNewDirect).toBeTrue();
        expect(fixture.nativeElement.textContent).toContain('Nuevo chat');
    }));

    it('permite abrir o traer la ventana flotante desde Social/Mensajes', fakeAsync(() => {
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.openFloatingChatWindow();

        expect(chatFloatingSvc.openOrFocusListWindow).toHaveBeenCalled();
    }));

    it('oculta el botón de ventana flotante si la ventana ya está abierta', fakeAsync(() => {
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.currentSection = 'mensajes';
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Ventana flotante');

        floatingListWindow$.next({ open: true });
        fixture.detectChanges();

        expect(component.canOpenFloatingChatWindow).toBeFalse();
        expect(fixture.nativeElement.textContent).not.toContain('Ventana flotante');
    }));

    it('popea la conversación activa a burbuja cuando la feature está disponible', () => {
        fixture.detectChanges();
        component.activeConversationSummary = {
            conversationId: 55,
            type: 'direct',
            title: 'Yuna',
            photoThumbUrl: null,
            campaignId: null,
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: 'uid-2',
            lastMessageNotification: null,
        } as any;

        component.popOutActiveConversation();

        expect(chatFloatingSvc.openConversation).toHaveBeenCalledWith(55);
    });

    it('carga detalle con participantes al seleccionar una conversación', fakeAsync(() => {
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        void component.selectConversation({
            conversationId: 9,
            type: 'campaign',
            title: 'Caballeros de Cormyr',
            photoThumbUrl: null,
            campaignId: 4,
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
        });
        tick();

        expect(chatApiSvc.getConversationDetail).toHaveBeenCalledWith(9);
        expect(component.activeParticipants.length).toBe(1);
        expect(component.activeParticipants[0].participantRole).toBe('admin');
        expect(component.getParticipantLabel(component.activeParticipants[0])).toBe('MrYosi90');
    }));

    it('filtra resultados de Nuevo chat por self, bloqueados, duplicados y setting de DM', () => {
        fixture.detectChanges();
        component.isLoggedIn = true;

        component.blocks = [
            { uid: 'uid-blocked', displayName: 'Bloqueado', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false, blockedAtUtc: null },
        ];
        component.friends = [
            { uid: 'uid-friend', displayName: 'Amistad', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false, friendsSince: null } as any,
        ];
        component.conversations = [
            {
                conversationId: 12,
                type: 'direct',
                title: 'Yuna',
                photoThumbUrl: null,
                campaignId: null,
                participantRole: 'member',
                participantStatus: 'active',
                lastMessagePreview: null,
                lastMessageAtUtc: null,
                unreadCount: 0,
                canSend: true,
                isSystemConversation: false,
                counterpartUid: 'uid-existing',
                lastMessageNotification: null,
            },
        ];
        component.newDirectResults = [
            { uid: 'uid-1', displayName: 'Yo', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true },
            { uid: 'uid-blocked', displayName: 'Bloqueado', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true },
            { uid: 'uid-existing', displayName: 'Existente', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true },
            { uid: 'uid-friend', displayName: 'Amistad', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false },
            { uid: 'uid-closed', displayName: 'Cerrado', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false },
            { uid: 'uid-open', displayName: 'Abierto', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true },
        ];

        expect(component.visibleNewDirectResults.map((item: any) => item.uid)).toEqual(['uid-friend', 'uid-open']);
    });

    it('abre el perfil público desde el avatar de un mensaje humano', () => {
        fixture.detectChanges();

        component.openMessageSenderProfile({
            messageId: 1,
            conversationId: 9,
            body: 'Hola',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            sender: {
                uid: 'uid-2',
                displayName: 'Yuna',
                photoThumbUrl: 'thumb.webp',
                isSystemUser: false,
            },
            notification: null,
            announcement: null,
        });

        expect(userProfileNavSvc.openPublicProfile).toHaveBeenCalledWith({
            uid: 'uid-2',
            initialDisplayName: 'Yuna',
        });
    });

    it('usa avatar por defecto para participantes humanos sin photoThumbUrl', () => {
        fixture.detectChanges();

        const avatarUrl = component.getParticipantAvatarUrl({
            uid: 'uid-yuna',
            displayName: 'Yuna',
            photoThumbUrl: null,
            isSystemUser: false,
            participantRole: 'member',
            participantStatus: 'active',
            joinedAtUtc: null,
            leftAtUtc: null,
        });

        expect(avatarUrl).toMatch(/^assets\/img\/default(Guy|Girl)\.png$/);
    });

    it('inserta mensajes entrantes en la conversación activa y la marca como leída', fakeAsync(() => {
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        void component.selectConversation({
            conversationId: 9,
            type: 'campaign',
            title: 'Caballeros de Cormyr',
            photoThumbUrl: null,
            campaignId: 4,
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
        });
        tick();

        messageCreated$.next({
            messageId: 91,
            conversationId: 9,
            body: 'Hola desde realtime',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            sender: {
                uid: 'uid-2',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            notification: null,
            announcement: null,
        });
        tick();

        expect(component.activeMessages.map((item: any) => item.messageId)).toEqual([91]);
        expect(chatApiSvc.markAsRead).toHaveBeenCalledWith(9, 91);
    }));

    it('no duplica mensajes realtime ya presentes en la conversación activa', fakeAsync(() => {
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        void component.selectConversation({
            conversationId: 9,
            type: 'campaign',
            title: 'Caballeros de Cormyr',
            photoThumbUrl: null,
            campaignId: 4,
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
        });
        tick();

        const incoming = {
            messageId: 92,
            conversationId: 9,
            body: 'Duplicado',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            sender: {
                uid: 'uid-2',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            notification: null,
            announcement: null,
        };

        messageCreated$.next(incoming);
        messageCreated$.next(incoming);
        tick();

        expect(component.activeMessages.map((item: any) => item.messageId)).toEqual([92]);
    }));

    it('no repite markAsRead para el mismo último messageId ya confirmado', fakeAsync(() => {
        fixture.detectChanges();
        component.activeConversationSummary = {
            conversationId: 77,
            type: 'direct',
            title: 'Yuna',
            photoThumbUrl: null,
            campaignId: null,
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 1,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: 'uid-2',
            lastMessageNotification: null,
        } as any;
        component.activeMessages = [{
            messageId: 501,
            conversationId: 77,
            body: 'Hola',
            sentAtUtc: '2026-03-15T14:00:00.000Z',
            sender: {
                uid: 'uid-2',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            notification: null,
            announcement: null,
        }];

        void (component as any).markActiveConversationAsRead();
        tick();
        void (component as any).markActiveConversationAsRead();
        tick();

        expect(chatApiSvc.markAsRead).toHaveBeenCalledTimes(1);
        expect(chatApiSvc.markAsRead).toHaveBeenCalledWith(77, 501);
    }));

    it('usa message.read del propio usuario como acuse y evita reintentar el mismo read receipt', fakeAsync(() => {
        fixture.detectChanges();
        component.activeConversationSummary = {
            conversationId: 78,
            type: 'direct',
            title: 'Yuna',
            photoThumbUrl: null,
            campaignId: null,
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 1,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: 'uid-2',
            lastMessageNotification: null,
        } as any;
        component.activeMessages = [{
            messageId: 601,
            conversationId: 78,
            body: 'Hola',
            sentAtUtc: '2026-03-15T14:00:00.000Z',
            sender: {
                uid: 'uid-2',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            notification: null,
            announcement: null,
        }];

        void (component as any).markActiveConversationAsRead();
        tick();

        messageRead$.next({
            conversationId: 78,
            lastReadMessageId: 601,
            userId: 'user-1',
            uid: 'uid-1',
        });
        tick();

        void (component as any).markActiveConversationAsRead();
        tick();

        expect(chatApiSvc.markAsRead).toHaveBeenCalledTimes(1);
        expect(chatApiSvc.markAsRead).toHaveBeenCalledWith(78, 601);
    }));

    it('filtra conversaciones por tipo y mantiene la activa si sigue visible', fakeAsync(() => {
        chatApiSvc.getConversationDetail.and.resolveTo({
            conversationId: 20,
            type: 'group',
            title: 'Grupo de prueba',
            photoThumbUrl: null,
            campaignId: null,
            participantRole: 'admin',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
            participants: [],
        } as any);
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        conversations$.next([
            {
                conversationId: 10,
                type: 'direct',
                title: 'Yuna',
                photoThumbUrl: null,
                campaignId: null,
                participantRole: 'member',
                participantStatus: 'active',
                lastMessagePreview: null,
                lastMessageAtUtc: null,
                unreadCount: 0,
                canSend: true,
                isSystemConversation: false,
                counterpartUid: 'uid-2',
                lastMessageNotification: null,
            },
            {
                conversationId: 20,
                type: 'group',
                title: 'Grupo de prueba',
                photoThumbUrl: null,
                campaignId: null,
                participantRole: 'admin',
                participantStatus: 'active',
                lastMessagePreview: null,
                lastMessageAtUtc: null,
                unreadCount: 0,
                canSend: true,
                isSystemConversation: false,
                counterpartUid: null,
                lastMessageNotification: null,
            },
        ] as any);
        void component.selectConversation(conversations$.value[1] as any);
        tick();

        component.selectConversationFilter('group');

        expect(component.filteredConversations.map((item: any) => item.conversationId)).toEqual([20]);
        expect(component.activeConversation?.conversationId).toBe(20);
    }));

    it('crea un grupo desde Social y abre la conversación resultante', fakeAsync(() => {
        socialApiSvc.listFriends.and.resolveTo({
            items: [
                { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true, friendsSince: null },
            ],
            meta: { totalCount: 1, limit: 25, offset: 0, hasMore: false },
        } as any);
        chatApiSvc.createGroup.and.resolveTo({
            conversationId: 44,
            type: 'group',
            title: 'Grupo de prueba',
            photoThumbUrl: null,
            campaignId: null,
            participantRole: 'admin',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
            participants: [],
        } as any);

        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.openNewGroupComposer();
        component.newGroupDraft.title = 'Grupo de prueba';
        component.toggleNewGroupParticipant(component.friends[0]);
        void component.createGroup();
        tick();

        expect(chatApiSvc.createGroup).toHaveBeenCalledWith('Grupo de prueba', ['uid-2']);
        expect((TestBed.inject(ChatRealtimeService) as any).upsertConversation).toHaveBeenCalled();
        expect(component.activeConversation?.conversationId).toBe(44);
    }));

    it('bloquea createGroup localmente cuando compliance exige aceptar normas de uso', fakeAsync(() => {
        const userSvc = TestBed.inject(UserService) as any;
        userSvc.getAccessRestrictionMessage.and.returnValue('Debes aceptar las normas de uso vigentes antes de continuar.');

        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.openNewGroupComposer();
        component.newGroupDraft.title = 'Grupo restringido';
        component.newGroupDraft.participantUids = ['uid-2'];
        void component.createGroup();
        tick();

        expect(chatApiSvc.createGroup).not.toHaveBeenCalled();
        expect(apiActionGuardSvc.shouldAllow).not.toHaveBeenCalledWith('uid-1', 'social.group.create');
        expect(appToastSvc.showError).toHaveBeenCalledWith('Debes aceptar las normas de uso vigentes antes de continuar.');
    }));

    it('traduce mustAcceptUsage al fallar una mutación social con 403 funcional', fakeAsync(() => {
        const userSvc = TestBed.inject(UserService) as any;
        userSvc.getComplianceErrorMessage.and.returnValue('Debes aceptar las normas de uso vigentes antes de continuar.');
        chatApiSvc.createGroup.and.rejectWith({ status: 403, code: 'mustAcceptUsage', message: 'Forbidden' });

        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.openNewGroupComposer();
        component.newGroupDraft.title = 'Grupo restringido';
        component.newGroupDraft.participantUids = ['uid-2'];
        void component.createGroup();
        tick();

        expect(appToastSvc.showError).toHaveBeenCalledWith('Debes aceptar las normas de uso vigentes antes de continuar.');
    }));

    it('renombra el grupo activo y refresca el detalle local', fakeAsync(() => {
        fixture.detectChanges();
        component.activeConversationSummary = {
            conversationId: 30,
            type: 'group',
            title: 'Viejo nombre',
            photoThumbUrl: null,
            campaignId: null,
            participantRole: 'admin',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
        } as any;
        component.activeConversationDetail = {
            ...component.activeConversationSummary,
            participants: [],
        } as any;
        component.groupRenameDraft = 'Nuevo nombre';
        chatApiSvc.renameGroup.and.resolveTo({
            ...component.activeConversationSummary,
            title: 'Nuevo nombre',
            participants: [],
        } as any);

        void component.saveActiveGroupName();
        tick();

        expect(chatApiSvc.renameGroup).toHaveBeenCalledWith(30, 'Nuevo nombre');
        expect(component.activeConversation?.title).toBe('Nuevo nombre');
    }));

    it('añade y retira participantes en grupos administrables', fakeAsync(() => {
        component.friends = [
            { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true, friendsSince: null },
        ];
        component.activeConversationSummary = {
            conversationId: 31,
            type: 'group',
            title: 'Grupo',
            photoThumbUrl: null,
            campaignId: null,
            participantRole: 'admin',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
        } as any;
        component.activeConversationDetail = {
            ...component.activeConversationSummary,
            participants: [
                {
                    uid: 'uid-1',
                    displayName: 'Yo',
                    photoThumbUrl: null,
                    isSystemUser: false,
                    participantRole: 'admin',
                    participantStatus: 'active',
                    joinedAtUtc: null,
                    leftAtUtc: null,
                },
            ],
        } as any;
        chatApiSvc.addGroupParticipant.and.resolveTo({
            ...component.activeConversationSummary,
            participants: [
                ...component.activeConversationDetail!.participants,
                {
                    uid: 'uid-2',
                    displayName: 'Yuna',
                    photoThumbUrl: null,
                    isSystemUser: false,
                    participantRole: 'member',
                    participantStatus: 'active',
                    joinedAtUtc: null,
                    leftAtUtc: null,
                },
            ],
        } as any);
        chatApiSvc.removeGroupParticipant.and.resolveTo({
            ...component.activeConversationSummary,
            participants: [
                component.activeConversationDetail!.participants[0],
            ],
        } as any);

        void component.addFriendToActiveGroup(component.friends[0]);
        tick();
        expect(component.activeParticipants.map((item: any) => item.uid)).toEqual(['uid-1', 'uid-2']);

        void component.removeParticipantFromActiveGroup(component.activeParticipants[1]);
        tick();
        expect(component.activeParticipants.map((item: any) => item.uid)).toEqual(['uid-1']);
    }));
});
