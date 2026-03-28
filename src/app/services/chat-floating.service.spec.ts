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

    it('aparta una burbuja tapada en el mismo lateral cuando otra la cubre mas del 50%', () => {
        service.applyProfileSettings(createDefaultUserSettings().perfil);
        service.openConversation(31);
        service.openConversation(32);

        service.updateConversationState(31, 'bubble', null, {
            version: 1,
            side: 'right',
            top: 100,
            updatedAt: Date.now(),
        });
        service.updateConversationState(32, 'bubble', null, {
            version: 1,
            side: 'right',
            top: 120,
            updatedAt: Date.now(),
        });

        let bubbles: any[] = [];
        service.bubbles$.subscribe((items) => bubbles = items);

        const bubble31 = bubbles.find((item) => item.conversationId === 31);
        const bubble32 = bubbles.find((item) => item.conversationId === 32);

        expect(bubble32?.bubblePlacement?.top).toBe(120);
        expect(bubble31?.bubblePlacement?.top).toBe(56);
    });

    it('no recoloca burbujas si estan en laterales opuestos aunque compartan top', () => {
        service.applyProfileSettings(createDefaultUserSettings().perfil);
        service.openConversation(41);
        service.openConversation(42);

        service.updateConversationState(41, 'bubble', null, {
            version: 1,
            side: 'left',
            top: 140,
            updatedAt: Date.now(),
        });
        service.updateConversationState(42, 'bubble', null, {
            version: 1,
            side: 'right',
            top: 140,
            updatedAt: Date.now(),
        });

        let bubbles: any[] = [];
        service.bubbles$.subscribe((items) => bubbles = items);

        expect(bubbles.find((item) => item.conversationId === 41)?.bubblePlacement?.top).toBe(140);
        expect(bubbles.find((item) => item.conversationId === 42)?.bubblePlacement?.top).toBe(140);
    });

    it('puede ocultar temporalmente la ventana-listado y las burbujas para un overlay y restaurarlas despues', () => {
        service.applyProfileSettings(createDefaultUserSettings().perfil);
        service.openOrFocusListWindow();
        service.openConversation(51);
        service.updateConversationState(51, 'bubble', null, {
            version: 1,
            side: 'right',
            top: 180,
            updatedAt: Date.now(),
        });

        const snapshot = service.hideAllFloatingWindowsForOverlay();

        let listWindow: any = null;
        let bubbles: any[] = [];
        service.listWindow$.subscribe((value) => listWindow = value);
        service.bubbles$.subscribe((items) => bubbles = items);

        expect(snapshot).not.toBeNull();
        expect(listWindow?.open).toBeFalse();
        expect(bubbles.length).toBe(0);

        service.restoreFloatingWindowsAfterOverlay(snapshot);

        expect(listWindow?.open).toBeTrue();
        expect(bubbles.length).toBe(1);
        expect(bubbles[0].conversationId).toBe(51);
        expect(bubbles[0].bubblePlacement?.top).toBe(180);
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

    it('no reabre la ventana-listado ya cerrada si la sesion reemite loggedIn con el mismo uid', fakeAsync(() => {
        service.init();
        isLoggedIn$.next(true);
        tick();

        service.closeListWindow();
        isLoggedIn$.next(true);
        tick();

        let listWindow: any = null;
        service.listWindow$.subscribe((value) => listWindow = value);

        expect(userSettingsSvc.loadSettings).toHaveBeenCalledTimes(1);
        expect(listWindow?.open).toBeFalse();
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
