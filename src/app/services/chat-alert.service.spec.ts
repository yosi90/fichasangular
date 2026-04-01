import { fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { ChatAlertService } from './chat-alert.service';

describe('ChatAlertService', () => {
    let alertCandidate$: Subject<any>;
    let chatRealtimeSvc: any;
    let chatApiSvc: any;
    let appToastSvc: any;
    let navSvc: any;
    let socialAlertPrefsSvc: any;
    let userSvc: any;
    let service: ChatAlertService;

    function buildCandidate(partial: Record<string, any>): any {
        return {
            alertKey: partial['alertKey'] ?? `alert-${partial['messageId'] ?? partial['conversationId'] ?? 'x'}`,
            source: partial['source'] ?? 'message',
            messageId: partial['messageId'] ?? null,
            conversationId: partial['conversationId'] ?? 0,
            conversationType: partial['conversationType'] ?? null,
            conversationTitle: partial['conversationTitle'] ?? null,
            campaignId: partial['campaignId'] ?? null,
            isSystemConversation: partial['isSystemConversation'] ?? false,
            sender: partial['sender'],
            body: partial['body'] ?? '',
            sentAtUtc: partial['sentAtUtc'] ?? '2026-03-13T12:00:00.000Z',
            notification: partial['notification'] ?? null,
            announcement: partial['announcement'] ?? null,
        };
    }

    beforeEach(() => {
        alertCandidate$ = new Subject<any>();
        chatRealtimeSvc = {
            alertCandidate$,
            isConversationFocused: jasmine.createSpy('isConversationFocused').and.returnValue(false),
            markConversationReadLocally: jasmine.createSpy('markConversationReadLocally'),
        };
        chatApiSvc = jasmine.createSpyObj('ChatApiService', ['listMessages', 'markAsRead']);
        chatApiSvc.listMessages.and.resolveTo([{ messageId: 55 }]);
        chatApiSvc.markAsRead.and.resolveTo({ conversationId: 55, lastReadMessageId: 55 });
        appToastSvc = jasmine.createSpyObj('AppToastService', ['showInfo', 'showSystem']);
        navSvc = jasmine.createSpyObj('UserProfileNavigationService', ['openSocial', 'openPrivateProfile']);
        socialAlertPrefsSvc = jasmine.createSpyObj('SocialAlertPreferencesService', ['isEnabled']);
        socialAlertPrefsSvc.isEnabled.and.returnValue(true);
        userSvc = {
            isLoggedIn$: new Subject<boolean>(),
            CurrentUserUid: 'uid-propio',
        };
        service = new ChatAlertService(chatRealtimeSvc, chatApiSvc, appToastSvc, navSvc, userSvc, socialAlertPrefsSvc);
    });

    it('muestra Swal para resolución de rol y abre el perfil al confirmar', fakeAsync(() => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 21,
            conversationId: 55,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Tu solicitud de rol ha sido aprobada.',
            notification: {
                code: 'system.role_request_resolved',
                title: 'Tu solicitud de rol ha sido aprobada',
                action: {
                    target: 'social.messages',
                    conversationId: 55,
                },
                context: {
                    status: 'approved',
                },
            },
        }));
        tick();

        expect(Swal.fire).toHaveBeenCalled();
        expect(navSvc.openPrivateProfile).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'resumen',
        }));
        expect(chatApiSvc.markAsRead).toHaveBeenCalledWith(55, 21);
        expect(chatRealtimeSvc.markConversationReadLocally).toHaveBeenCalledWith(55);
    }));

    it('muestra Swal para moderación y abre el resumen del perfil al confirmar', fakeAsync(() => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 91,
            conversationId: 71,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Se ha confirmado una incidencia en tu cuenta.',
            notification: {
                code: 'system.moderation_event',
                title: 'Nuevo evento de moderación',
                action: {
                    target: 'social.messages',
                    conversationId: 71,
                },
                context: {
                    result: 'reported',
                },
            },
        }));
        tick();

        expect(Swal.fire).toHaveBeenCalled();
        expect(navSvc.openPrivateProfile).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'resumen',
        }));
        expect(chatApiSvc.markAsRead).toHaveBeenCalledWith(71, 91);
    }));

    it('usa toast para announcement trivial y no abre Swal', () => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 22,
            conversationId: 56,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Hola',
            announcement: {
                code: 'chat.new_chat',
                title: 'Tienes una conversación nueva',
                action: {
                    target: 'social.messages',
                    conversationId: 56,
                },
                context: {},
            },
        }));

        expect(appToastSvc.showInfo).toHaveBeenCalledWith('Tienes una conversación nueva', {
            category: 'mensajes',
        });
        expect(swalSpy).not.toHaveBeenCalled();
    });

    it('usa toast para mensaje normal fuera de foco y no abre Swal', () => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 25,
            conversationId: 58,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Mensaje normal',
        }));

        expect(appToastSvc.showInfo).toHaveBeenCalledWith('Yuna: Mensaje normal', {
            category: 'mensajes',
        });
        expect(swalSpy).not.toHaveBeenCalled();
    });

    it('usa un toast más descriptivo para mensajes de campaña', () => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 28,
            conversationId: 61,
            conversationType: 'campaign',
            conversationTitle: 'Caballeros de Cormyr',
            campaignId: 7,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yosi',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'He subido el mapa nuevo.',
        }));

        expect(appToastSvc.showInfo).toHaveBeenCalledWith('Nuevo mensaje en el grupo de Caballeros de Cormyr: He subido el mapa nuevo.', {
            category: 'mensajes',
        });
        expect(swalSpy).not.toHaveBeenCalled();
    });

    it('usa toast de sistema para mensajes del sistema sin notification', () => {
        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 26,
            conversationId: 58,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: '',
        }));

        expect(appToastSvc.showSystem).toHaveBeenCalledWith('Yosiftware te ha enviado un aviso.', {
            durationMs: 7600,
            category: 'cuentaSistema',
        });
    });

    it('suprime toast si la conversación está enfocada pero no suprime Swal', fakeAsync(() => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
        chatRealtimeSvc.isConversationFocused.and.returnValue(true);

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 23,
            conversationId: 57,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Mensaje normal',
            announcement: {
                code: 'chat.new_message',
                title: null,
                action: null,
                context: {},
            },
        }));
        alertCandidate$.next(buildCandidate({
            messageId: 24,
            conversationId: 57,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Aviso importante',
            notification: {
                code: 'system.account_updated',
                title: 'Cuenta actualizada',
                action: null,
                context: {},
            },
        }));
        tick();

        expect(appToastSvc.showInfo).not.toHaveBeenCalled();
        expect(swalSpy).toHaveBeenCalledTimes(1);
    }));

    it('no muestra toast de mensajes si la categoría mensajes está silenciada', () => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
        socialAlertPrefsSvc.isEnabled.and.callFake((category: string) => category !== 'mensajes');

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 32,
            conversationId: 62,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Mensaje silenciado',
        }));

        expect(appToastSvc.showInfo).not.toHaveBeenCalled();
        expect(swalSpy).not.toHaveBeenCalled();
    });

    it('no muestra Swal pasivo de campaña si la categoría campañas está silenciada', fakeAsync(() => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
        socialAlertPrefsSvc.isEnabled.and.callFake((category: string) => category !== 'campanas');

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 33,
            conversationId: 63,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Has recibido una invitación de campaña.',
            notification: {
                code: 'system.campaign_invitation_received',
                title: 'Has recibido una invitación de campaña',
                action: {
                    target: 'social.messages',
                    conversationId: 63,
                },
                context: {
                    campaignId: 7,
                },
            },
        }));
        tick();

        expect(swalSpy).not.toHaveBeenCalled();
        expect(appToastSvc.showInfo).not.toHaveBeenCalled();
        expect(appToastSvc.showSystem).not.toHaveBeenCalled();
    }));

    it('mantiene visibles alertas de otras categorías aunque mensajes esté silenciado', fakeAsync(() => {
        socialAlertPrefsSvc.isEnabled.and.callFake((category: string) => category !== 'mensajes');
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 34,
            conversationId: 64,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Tu solicitud de rol ha sido aprobada.',
            notification: {
                code: 'system.role_request_resolved',
                title: 'Tu solicitud de rol ha sido aprobada',
                action: null,
                context: {
                    status: 'approved',
                },
            },
        }));
        tick();

        expect(Swal.fire).toHaveBeenCalledTimes(1);
    }));

    it('ignora la notificación admin.role_requests para dejarla al flujo específico del admin', fakeAsync(() => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 35,
            conversationId: 65,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Nueva solicitud de rol pendiente.',
            notification: {
                code: 'system.role_request_created',
                title: 'Nueva solicitud de rol',
                action: {
                    target: 'admin.role_requests',
                    conversationId: 65,
                },
                context: {
                    requestId: 19,
                },
            },
        }));
        tick();

        expect(swalSpy).not.toHaveBeenCalled();
        expect(appToastSvc.showInfo).not.toHaveBeenCalled();
        expect(appToastSvc.showSystem).not.toHaveBeenCalled();
    }));

    it('no alerta si recibe un mensaje propio por error', () => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        service.init();
        alertCandidate$.next(buildCandidate({
            messageId: 27,
            conversationId: 59,
            sender: {
                uid: 'uid-propio',
                displayName: 'Yo',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Mensaje propio',
        }));

        expect(appToastSvc.showInfo).not.toHaveBeenCalled();
        expect(appToastSvc.showSystem).not.toHaveBeenCalled();
        expect(swalSpy).not.toHaveBeenCalled();
    });

    it('no duplica alertas para la misma alertKey', fakeAsync(() => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        service.init();
        const message = buildCandidate({
            alertKey: 'same-alert',
            messageId: 30,
            conversationId: 60,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Aviso importante',
            notification: {
                code: 'system.account_banned',
                title: 'Cuenta suspendida',
                action: null,
                context: {},
            },
        });

        alertCandidate$.next(message);
        alertCandidate$.next(message);
        tick();

        expect(swalSpy).toHaveBeenCalledTimes(1);
    }));

    it('muestra Swal para notificación persistente recuperada por summary aunque no tenga messageId', fakeAsync(() => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        service.init();
        alertCandidate$.next(buildCandidate({
            alertKey: 'summary-55',
            source: 'conversation_summary',
            messageId: null,
            conversationId: 55,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Tu invitación de campaña ha sido aceptada.',
            notification: {
                code: 'system.campaign_invitation_resolved',
                title: 'Invitación resuelta',
                action: {
                    target: 'social.messages',
                    conversationId: 55,
                },
                context: {
                    campaignId: 7,
                },
            },
        }));
        tick();

        expect(Swal.fire).toHaveBeenCalledTimes(1);
    }));

    it('marca la conversación de sistema como leída al abrir una campaña desde la Swal', fakeAsync(() => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        chatApiSvc.listMessages.and.resolveTo([{ messageId: 70 }, { messageId: 71 }]);

        service.init();
        alertCandidate$.next(buildCandidate({
            alertKey: 'campaign-alert',
            messageId: null,
            conversationId: 66,
            campaignId: 7,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Has recibido una invitación de campaña.',
            notification: {
                code: 'system.campaign_invitation_received',
                title: 'Has recibido una invitación de campaña',
                action: {
                    target: 'social.messages',
                    conversationId: 66,
                },
                context: {
                    campaignId: 7,
                },
            },
        }));
        tick();

        expect(chatApiSvc.listMessages).toHaveBeenCalledWith(66, null, 25);
        expect(chatApiSvc.markAsRead).toHaveBeenCalledWith(66, 71);
        expect(chatRealtimeSvc.markConversationReadLocally).toHaveBeenCalledWith(66);
        expect(navSvc.openSocial).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'campanas',
            campaignId: 7,
        }));
    }));
});
