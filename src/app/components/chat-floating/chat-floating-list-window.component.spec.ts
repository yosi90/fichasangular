import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ChatFloatingListWindowComponent } from './chat-floating-list-window.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { SocialApiService } from 'src/app/services/social-api.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';

describe('ChatFloatingListWindowComponent', () => {
    let fixture: ComponentFixture<ChatFloatingListWindowComponent>;
    let component: ChatFloatingListWindowComponent;
    let chatApiSvc: jasmine.SpyObj<ChatApiService>;
    let appToastSvc: jasmine.SpyObj<AppToastService>;
    let userSvcMock: any;

    beforeEach(async () => {
        chatApiSvc = jasmine.createSpyObj<ChatApiService>('ChatApiService', [
            'createOrOpenDirect',
            'createGroup',
        ]);
        appToastSvc = jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError']);
        userSvcMock = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-actor',
            getAccessRestrictionMessage: jasmine.createSpy('getAccessRestrictionMessage').and.returnValue(''),
            getComplianceErrorMessage: jasmine.createSpy('getComplianceErrorMessage').and.returnValue(''),
        };

        await TestBed.configureTestingModule({
            declarations: [ChatFloatingListWindowComponent],
            imports: [FormsModule],
            providers: [
                { provide: UserService, useValue: userSvcMock },
                {
                    provide: UserSettingsService,
                    useValue: jasmine.createSpyObj<UserSettingsService>('UserSettingsService', ['loadProfileSettings']),
                },
                {
                    provide: SocialApiService,
                    useValue: jasmine.createSpyObj<SocialApiService>('SocialApiService', ['listFriends', 'watchFriends', 'searchUsers']),
                },
                { provide: ChatApiService, useValue: chatApiSvc },
                {
                    provide: ChatRealtimeService,
                    useValue: {
                        conversations$: new BehaviorSubject<any[]>([]).asObservable(),
                        upsertConversation: jasmine.createSpy('upsertConversation'),
                    },
                },
                {
                    provide: ChatFloatingService,
                    useValue: jasmine.createSpyObj<ChatFloatingService>('ChatFloatingService', ['openConversation']),
                },
                { provide: AppToastService, useValue: appToastSvc },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatFloatingListWindowComponent);
        component = fixture.componentInstance;
    });

    it('bloquea abrir directos cuando compliance exige aceptar normas de uso', async () => {
        userSvcMock.getAccessRestrictionMessage.and.returnValue('Debes aceptar las normas de uso vigentes antes de continuar.');

        await component.openDirectFromSearch({
            uid: 'uid-2',
            displayName: 'Yuna',
            allowDirectMessagesFromNonFriends: true,
        } as any);

        expect(chatApiSvc.createOrOpenDirect).not.toHaveBeenCalled();
        expect(appToastSvc.showError).toHaveBeenCalledWith('Debes aceptar las normas de uso vigentes antes de continuar.');
    });

    it('traduce mustAcceptUsage al crear grupo desde la ventana flotante', async () => {
        component.isLoggedIn = true;
        component.newGroupDraft = {
            title: 'Grupo flotante',
            participantUids: ['uid-2'],
        };
        userSvcMock.getComplianceErrorMessage.and.returnValue('Debes aceptar las normas de uso vigentes antes de continuar.');
        chatApiSvc.createGroup.and.rejectWith({
            status: 403,
            code: 'mustAcceptUsage',
            message: 'Forbidden',
        });

        await component.createGroup();

        expect(appToastSvc.showError).toHaveBeenCalledWith('Debes aceptar las normas de uso vigentes antes de continuar.');
    });
});
