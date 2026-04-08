import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { ChatFloatingConversationWindowComponent } from './chat-floating-conversation-window.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { SocialApiService } from 'src/app/services/social-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';

describe('ChatFloatingConversationWindowComponent', () => {
    let fixture: ComponentFixture<ChatFloatingConversationWindowComponent>;
    let component: ChatFloatingConversationWindowComponent;
    let chatApiSvc: jasmine.SpyObj<ChatApiService>;
    let appToastSvc: jasmine.SpyObj<AppToastService>;
    let userSvcMock: any;

    beforeEach(async () => {
        chatApiSvc = jasmine.createSpyObj<ChatApiService>('ChatApiService', [
            'listMessages',
            'getConversationDetail',
            'sendMessage',
            'renameGroup',
            'addGroupParticipant',
            'removeGroupParticipant',
            'markAsRead',
        ]);
        appToastSvc = jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError']);
        userSvcMock = {
            CurrentUserUid: 'uid-actor',
            getAccessRestrictionMessage: jasmine.createSpy('getAccessRestrictionMessage').and.returnValue(''),
            getComplianceErrorMessage: jasmine.createSpy('getComplianceErrorMessage').and.returnValue(''),
        };

        await TestBed.configureTestingModule({
            declarations: [ChatFloatingConversationWindowComponent],
            imports: [FormsModule],
            providers: [
                { provide: UserService, useValue: userSvcMock },
                {
                    provide: SocialApiService,
                    useValue: jasmine.createSpyObj<SocialApiService>('SocialApiService', ['listFriends', 'watchFriends']),
                },
                { provide: ChatApiService, useValue: chatApiSvc },
                {
                    provide: ChatRealtimeService,
                    useValue: {
                        conversations$: new BehaviorSubject<any[]>([]).asObservable(),
                        messageCreated$: new Subject<any>().asObservable(),
                        messageRead$: new Subject<any>().asObservable(),
                        upsertConversation: jasmine.createSpy('upsertConversation'),
                        setActiveConversationId: jasmine.createSpy('setActiveConversationId'),
                        markConversationReadLocally: jasmine.createSpy('markConversationReadLocally'),
                        isConversationFocused: jasmine.createSpy('isConversationFocused').and.returnValue(false),
                    },
                },
                {
                    provide: ChatFloatingService,
                    useValue: jasmine.createSpyObj<ChatFloatingService>('ChatFloatingService', ['openConversation']),
                },
                {
                    provide: UserProfileNavigationService,
                    useValue: jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openPublicProfile', 'openSocial', 'openPrivateProfile', 'openAdminPanel']),
                },
                { provide: AppToastService, useValue: appToastSvc },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatFloatingConversationWindowComponent);
        component = fixture.componentInstance;
        component.conversationId = 9;
    });

    it('bloquea el envío de mensajes cuando compliance exige aceptar normas de uso', async () => {
        component.summary = {
            conversationId: 9,
            type: 'direct',
            title: 'Directo',
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
        component.sendDraft = 'Hola';
        userSvcMock.getAccessRestrictionMessage.and.returnValue('Debes aceptar las normas de uso vigentes antes de continuar.');

        await component.sendMessage();

        expect(chatApiSvc.sendMessage).not.toHaveBeenCalled();
        expect(component.errorMessage).toBe('Debes aceptar las normas de uso vigentes antes de continuar.');
    });

    it('traduce mustAcceptUsage al renombrar grupos desde la ventana flotante', async () => {
        component.summary = {
            conversationId: 9,
            type: 'group',
            title: 'Grupo',
            participantRole: 'admin',
            participantStatus: 'active',
        } as any;
        component.detail = {
            ...component.summary,
            participants: [],
        } as any;
        component.groupRenameDraft = 'Grupo nuevo';
        userSvcMock.getComplianceErrorMessage.and.returnValue('Debes aceptar las normas de uso vigentes antes de continuar.');
        chatApiSvc.renameGroup.and.rejectWith({
            status: 403,
            code: 'mustAcceptUsage',
            message: 'Forbidden',
        });
        chatApiSvc.getConversationDetail.and.resolveTo(component.detail as any);

        await component.saveActiveGroupName();

        expect(appToastSvc.showError).toHaveBeenCalledWith('Debes aceptar las normas de uso vigentes antes de continuar.');
    });

    it('marca como danger los mensajes de moderacion y baneo de Yosiftware', () => {
        expect(component.getMessageSystemTone({
            sender: { uid: 'system:yosiftware', isSystemUser: true },
            notification: { code: 'system.moderation_event' },
        } as any)).toBe('danger');

        expect(component.getMessageSystemTone({
            sender: { uid: 'system:yosiftware', isSystemUser: true },
            notification: { code: 'system.account_banned' },
        } as any)).toBe('danger');

        expect(component.getMessageSystemTone({
            sender: { uid: 'system:yosiftware', isSystemUser: true },
            notification: { code: 'system.account_updated' },
        } as any)).toBe('default');
    });
});
