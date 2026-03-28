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
});
