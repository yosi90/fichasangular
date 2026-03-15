import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { createDefaultUserSettings } from 'src/app/interfaces/user-settings';
import { SocialHubComponent } from './social-hub.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { SocialApiService } from 'src/app/services/social-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';

describe('SocialHubComponent', () => {
    let fixture: ComponentFixture<SocialHubComponent>;
    let component: SocialHubComponent;
    let isLoggedIn$: BehaviorSubject<boolean>;
    let conversations$: BehaviorSubject<any[]>;
    let unreadUserCount$: BehaviorSubject<number>;
    let unreadSystemCount$: BehaviorSubject<number>;
    let messageCreated$: Subject<any>;
    let chatApiSvc: jasmine.SpyObj<ChatApiService>;
    let socialApiSvc: jasmine.SpyObj<SocialApiService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;
    let userSettingsSvc: jasmine.SpyObj<UserSettingsService>;

    beforeEach(async () => {
        isLoggedIn$ = new BehaviorSubject<boolean>(false);
        conversations$ = new BehaviorSubject<any[]>([]);
        unreadUserCount$ = new BehaviorSubject<number>(0);
        unreadSystemCount$ = new BehaviorSubject<number>(0);
        messageCreated$ = new Subject<any>();
        socialApiSvc = jasmine.createSpyObj<SocialApiService>('SocialApiService', [
            'searchUsers',
            'listFriends',
            'listReceivedFriendRequests',
            'listSentFriendRequests',
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

        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openPublicProfile', 'openSocial']);
        userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', ['loadProfileSettings']);
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
                    },
                },
                { provide: SocialApiService, useValue: socialApiSvc },
                { provide: ChatApiService, useValue: chatApiSvc },
                {
                    provide: ChatRealtimeService,
                    useValue: {
                        conversations$,
                        unreadUserCount$,
                        unreadSystemCount$,
                        messageCreated$,
                        refreshConversations: jasmine.createSpy('refreshConversations').and.resolveTo(),
                        upsertConversation: jasmine.createSpy('upsertConversation'),
                        setActiveConversationId: jasmine.createSpy('setActiveConversationId'),
                        markConversationReadLocally: jasmine.createSpy('markConversationReadLocally'),
                    },
                },
                { provide: UserProfileNavigationService, useValue: userProfileNavSvc },
                { provide: UserSettingsService, useValue: userSettingsSvc },
                {
                    provide: AppToastService,
                    useValue: jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError', 'showInfo', 'showSystem']),
                },
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

    it('muestra Nuevo chat si el actor permite directos con no-amigos', fakeAsync(() => {
        fixture.detectChanges();

        isLoggedIn$.next(true);
        tick();
        component.currentSection = 'mensajes';
        fixture.detectChanges();

        expect(component.canOpenNewDirect).toBeTrue();
        expect(fixture.nativeElement.textContent).toContain('Nuevo chat');
    }));

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

        component.blocks = [
            { uid: 'uid-blocked', displayName: 'Bloqueado', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false, blockedAtUtc: null },
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
            { uid: 'uid-closed', displayName: 'Cerrado', photoThumbUrl: null, allowDirectMessagesFromNonFriends: false },
            { uid: 'uid-open', displayName: 'Abierto', photoThumbUrl: null, allowDirectMessagesFromNonFriends: true },
        ];

        expect(component.visibleNewDirectResults.map((item: any) => item.uid)).toEqual(['uid-open']);
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
