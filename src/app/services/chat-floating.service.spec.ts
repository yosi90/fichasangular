import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ProfileApiError } from '../interfaces/user-account';
import { createDefaultUserSettings } from '../interfaces/user-settings';
import { ChatFloatingService } from './chat-floating.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { UserSettingsService } from './user-settings.service';
import { UserService } from './user.service';

describe('ChatFloatingService', () => {
    let service: ChatFloatingService;
    let isLoggedIn$: BehaviorSubject<boolean>;
    let userSettingsSvc: jasmine.SpyObj<UserSettingsService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;
    let chatRealtimeSvc: jasmine.SpyObj<ChatRealtimeService>;

    beforeEach(() => {
        isLoggedIn$ = new BehaviorSubject<boolean>(false);
        userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', ['loadSettings', 'saveSettings']);
        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openSocial']);
        chatRealtimeSvc = jasmine.createSpyObj<ChatRealtimeService>('ChatRealtimeService', ['setActiveConversationId', 'isConversationFocused', 'markConversationReadLocally']);

        userSettingsSvc.loadSettings.and.resolveTo(createDefaultUserSettings());
        userSettingsSvc.saveSettings.and.resolveTo(createDefaultUserSettings());
        chatRealtimeSvc.isConversationFocused.and.returnValue(false);

        TestBed.configureTestingModule({
            providers: [
                ChatFloatingService,
                {
                    provide: UserService,
                    useValue: {
                        isLoggedIn$,
                        CurrentUserUid: 'uid-1',
                    },
                },
                { provide: UserSettingsService, useValue: userSettingsSvc },
                { provide: UserProfileNavigationService, useValue: userProfileNavSvc },
                { provide: ChatRealtimeService, useValue: chatRealtimeSvc },
            ],
        });

        service = TestBed.inject(ChatFloatingService);
    });

    it('redirige a Social/Mensajes al abrir conversación si las burbujas están desactivadas', () => {
        service.applyProfileSettings({
            ...createDefaultUserSettings().perfil,
            permitirBurbujasChat: false,
        });

        service.openConversation(22);

        expect(userProfileNavSvc.openSocial).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'mensajes',
            conversationId: 22,
        }));
    });

    it('abre una burbuja y enfoca la conversación si las burbujas están activadas', () => {
        service.applyProfileSettings(createDefaultUserSettings().perfil);

        service.openConversation(31);

        let bubbles: any[] = [];
        service.bubbles$.subscribe((items) => bubbles = items);

        expect(bubbles.length).toBe(1);
        expect(bubbles[0].conversationId).toBe(31);
        expect(chatRealtimeSvc.setActiveConversationId).toHaveBeenCalledWith(31);
    });

    it('restaura la ventana-listado al iniciar si el setting de autoapertura sigue activo', fakeAsync(() => {
        service.init();
        isLoggedIn$.next(true);
        tick();

        let listWindow: any = null;
        service.listWindow$.subscribe((value) => listWindow = value);

        expect(userSettingsSvc.loadSettings).toHaveBeenCalled();
        expect(listWindow?.open).toBeTrue();
    }));

    it('persiste un bloque ventana_chat valido incluso si la ventana-listado aun no existe en runtime', fakeAsync(() => {
        service.openConversation(31);
        tick(250);

        const [payload] = userSettingsSvc.saveSettings.calls.mostRecent().args;
        expect(payload.mensajeria_flotante?.ventana_chat).toEqual(jasmine.objectContaining({
            version: 1,
            mode: 'window',
            restoredPlacement: null,
            minimizedPlacement: null,
        }));
    }));

    it('deja de persistir automáticamente cuando backend rechaza el nuevo shape de settings', fakeAsync(() => {
        userSettingsSvc.saveSettings.and.rejectWith(
            new ProfileApiError(`'perfil' contiene claves no soportadas o faltan obligatorias.`, '', 400)
        );

        service.updateListWindowState('minimized', null, null);
        tick(250);

        expect(userSettingsSvc.saveSettings).toHaveBeenCalledTimes(1);

        service.updateListWindowState('window', null, null);
        tick(250);

        expect(userSettingsSvc.saveSettings).toHaveBeenCalledTimes(1);
    }));
});
