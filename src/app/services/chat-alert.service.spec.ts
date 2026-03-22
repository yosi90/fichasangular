import { fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { ChatAlertService } from './chat-alert.service';

describe('ChatAlertService', () => {
    let alertCandidate$: Subject<any>;
    let chatRealtimeSvc: any;
    let appToastSvc: any;
    let navSvc: any;
    let userSvc: any;
    let service: ChatAlertService;

    function buildCandidate(partial: Record<string, any>): any {
        return {
            alertKey: partial['alertKey'] ?? `alert-${partial['messageId'] ?? partial['conversationId'] ?? 'x'}`,
            source: partial['source'] ?? 'message',
            messageId: partial['messageId'] ?? null,
            conversationId: partial['conversationId'] ?? 0,
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
        };
        appToastSvc = jasmine.createSpyObj('AppToastService', ['showInfo', 'showSystem']);
        navSvc = jasmine.createSpyObj('UserProfileNavigationService', ['openSocial']);
        userSvc = {
            isLoggedIn$: new Subject<boolean>(),
            CurrentUserUid: 'uid-propio',
        };
        service = new ChatAlertService(chatRealtimeSvc, appToastSvc, navSvc, userSvc);
    });

    it('muestra Swal para notification y abre Social > mensajes al confirmar', fakeAsync(() => {
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
        expect(navSvc.openSocial).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'mensajes',
            conversationId: 55,
        }));
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

        expect(appToastSvc.showInfo).toHaveBeenCalledWith('Tienes una conversación nueva');
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

        expect(appToastSvc.showInfo).toHaveBeenCalledWith('Yuna: Mensaje normal');
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

        expect(appToastSvc.showSystem).toHaveBeenCalledWith('Yosiftware te ha enviado un aviso.', { durationMs: 7600 });
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
});
