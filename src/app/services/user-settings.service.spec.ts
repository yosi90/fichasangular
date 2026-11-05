import { createDefaultUserSettings } from '../interfaces/user-settings';
import { UserSettingsService } from './user-settings.service';

describe('UserSettingsService', () => {
    function createServiceStub(): any {
        return Object.create(UserSettingsService.prototype) as any;
    }

    it('completa defaults cuando perfil.notificaciones no existe', () => {
        const service = createServiceStub();

        const normalized = service.normalizeSettingsDocument({
            version: 1,
            nuevo_personaje: {
                generador_config: null,
                preview_minimizada: null,
                preview_restaurada: null,
            },
            perfil: {
                visibilidadPorDefectoPersonajes: true,
                mostrarPerfilPublico: false,
                allowDirectMessagesFromNonFriends: true,
                autoAbrirVentanaChats: true,
                permitirBurbujasChat: true,
            },
            mensajeria_flotante: null,
        } as any);

        expect(normalized.perfil.notificaciones).toEqual({
            mensajes: true,
            amistad: true,
            campanas: true,
            cuentaSistema: true,
        });
        expect(normalized.perfil.autoAbrirVentanaChats).toBeTrue();
        expect(normalized.perfil.permitirBurbujasChat).toBeTrue();
        expect(normalized.mensajeria_flotante).toBeNull();
    });

    it('saveProfileSettings conserva el bloque de notificaciones y permite actualizarlo', async () => {
        const service = createServiceStub();
        const existing = createDefaultUserSettings();
        existing.perfil.notificaciones = {
            mensajes: false,
            amistad: true,
            campanas: false,
            cuentaSistema: true,
        };
        service.loadSettings = jasmine.createSpy('loadSettings').and.resolveTo(existing);
        service.saveSettings = jasmine.createSpy('saveSettings').and.callFake(async (payload: any) => payload);

        const perfil = await service.saveProfileSettings({
            mostrarPerfilPublico: false,
            notificaciones: {
                mensajes: false,
                amistad: false,
                campanas: true,
                cuentaSistema: false,
            },
        });

        expect(service.saveSettings).toHaveBeenCalledWith(jasmine.objectContaining({
            perfil: jasmine.objectContaining({
                mostrarPerfilPublico: false,
                visibilidadPorDefectoPersonajes: false,
                allowDirectMessagesFromNonFriends: false,
                autoAbrirVentanaChats: true,
                permitirBurbujasChat: true,
                notificaciones: {
                    mensajes: false,
                    amistad: false,
                    campanas: true,
                    cuentaSistema: false,
                },
            }),
        }));
        expect(perfil.notificaciones).toEqual({
            mensajes: false,
            amistad: false,
            campanas: true,
            cuentaSistema: false,
        });
    });

    it('«Abrir Novedades al entrar» está activada por defecto y solo se apaga con false', () => {
        const service = createServiceStub();

        expect(createDefaultUserSettings().perfil.abrirNovedadesAlEntrar).toBeTrue();
        expect(service.normalizeSettingsDocument({ version: 1, perfil: {} } as any).perfil.abrirNovedadesAlEntrar).toBeTrue();
        expect(service.normalizeSettingsDocument({ version: 1, perfil: { abrirNovedadesAlEntrar: false } } as any)
            .perfil.abrirNovedadesAlEntrar).toBeFalse();
    });

    it('guarda «Abrir Novedades al entrar» en los ajustes de Rol de la plataforma', async () => {
        const service = createServiceStub();
        service.hasCurrentUid = jasmine.createSpy('hasCurrentUid').and.resolveTo(true);
        service.platformSessionSvc = jasmine.createSpyObj('PlatformSessionService', ['guardarAjustes']);
        service.platformSessionSvc.guardarAjustes.and.callFake(async (cambios: any) => ({ version: 2, documento: cambios }));
        service.loadSettings = jasmine.createSpy('loadSettings').and.resolveTo(createDefaultUserSettings());

        const perfil = await service.saveProfileSettings({ abrirNovedadesAlEntrar: false });

        expect(service.platformSessionSvc.guardarAjustes.calls.mostRecent().args[0].perfil.abrirNovedadesAlEntrar).toBeFalse();
        expect(perfil.abrirNovedadesAlEntrar).toBeFalse();
    });

    it('lee «Abrir Novedades al entrar» de la plataforma sin esperar a Firebase', async () => {
        const service = createServiceStub();
        service.platformSessionSvc = jasmine.createSpyObj('PlatformSessionService', ['leerAjustes']);
        service.platformSessionSvc.leerAjustes.and.resolveTo({ version: 3, documento: { version: 1, perfil: { abrirNovedadesAlEntrar: false } } });

        expect(await service.loadAbrirNovedadesAlEntrar()).toBeFalse();

        service.platformSessionSvc.leerAjustes.and.resolveTo(null);
        expect(await service.loadAbrirNovedadesAlEntrar()).toBeTrue();
    });
});
