import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';
import { AdminRoleRequestNotifierService } from './admin-role-request-notifier.service';

describe('AdminRoleRequestNotifierService', () => {
    it('muestra alerta y abre admin panel cuando detecta pendientes al entrar un admin', fakeAsync(() => {
        const esAdmin$ = new BehaviorSubject<boolean>(false);
        const alertCandidate$ = new BehaviorSubject<any>(null);
        const userSvc = {
            esAdmin$,
            CurrentUserUid: 'admin-1',
        } as any;
        const userProfileApiSvc = {
            listRoleRequests: jasmine.createSpy('listRoleRequests').and.resolveTo([
                { requestId: 1 },
                { requestId: 2 },
            ]),
        } as any;
        const navSvc = {
            openAdminPanel: jasmine.createSpy('openAdminPanel'),
        } as any;
        const chatRealtimeSvc = {
            alertCandidate$,
            findSystemConversationId: jasmine.createSpy('findSystemConversationId').and.returnValue(55),
            markConversationReadLocally: jasmine.createSpy('markConversationReadLocally'),
        } as any;
        const chatApiSvc = jasmine.createSpyObj('ChatApiService', ['listMessages', 'markAsRead']);
        chatApiSvc.listMessages.and.resolveTo([{ messageId: 90 }]);
        chatApiSvc.markAsRead.and.resolveTo({ conversationId: 55, lastReadMessageId: 90 });
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        const service = new AdminRoleRequestNotifierService(userSvc, userProfileApiSvc, navSvc, chatRealtimeSvc, chatApiSvc);

        service.init();
        esAdmin$.next(true);
        tick();

        expect(userProfileApiSvc.listRoleRequests).toHaveBeenCalledWith({
            status: 'pending',
        });
        expect(Swal.fire).toHaveBeenCalled();
        expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]?.text).toBe('Hay 2 solicitudes de rol pendientes.');
        expect(navSvc.openAdminPanel).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'role-requests',
            pendingOnly: true,
        }));
        expect(chatApiSvc.markAsRead).toHaveBeenCalledWith(55, 90);
        expect(chatRealtimeSvc.markConversationReadLocally).toHaveBeenCalledWith(55);
    }));

    it('reacciona al aviso realtime system.role_request_created y refresca el panel admin', fakeAsync(() => {
        const esAdmin$ = new BehaviorSubject<boolean>(true);
        const alertCandidate$ = new BehaviorSubject<any>(null);
        const userSvc = {
            esAdmin$,
            CurrentUserUid: 'admin-1',
        } as any;
        const userProfileApiSvc = {
            listRoleRequests: jasmine.createSpy('listRoleRequests').and.resolveTo([
                { requestId: 7 },
            ]),
        } as any;
        const navSvc = {
            openAdminPanel: jasmine.createSpy('openAdminPanel'),
        } as any;
        const chatRealtimeSvc = {
            alertCandidate$,
            findSystemConversationId: jasmine.createSpy('findSystemConversationId').and.returnValue(88),
            markConversationReadLocally: jasmine.createSpy('markConversationReadLocally'),
        } as any;
        const chatApiSvc = jasmine.createSpyObj('ChatApiService', ['listMessages', 'markAsRead']);
        chatApiSvc.listMessages.and.resolveTo([{ messageId: 120 }]);
        chatApiSvc.markAsRead.and.resolveTo({ conversationId: 88, lastReadMessageId: 120 });
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        const service = new AdminRoleRequestNotifierService(userSvc, userProfileApiSvc, navSvc, chatRealtimeSvc, chatApiSvc);

        service.init();
        tick();
        userProfileApiSvc.listRoleRequests.calls.reset();
        navSvc.openAdminPanel.calls.reset();
        chatApiSvc.markAsRead.calls.reset();

        alertCandidate$.next({
            alertKey: 'admin-role-request-created',
            notification: {
                code: 'system.role_request_created',
                action: {
                    target: 'admin.role_requests',
                    conversationId: 88,
                },
            },
        });
        tick();

        expect(userProfileApiSvc.listRoleRequests).toHaveBeenCalledWith({
            status: 'pending',
        });
        expect(Swal.fire).toHaveBeenCalled();
        expect(navSvc.openAdminPanel).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'role-requests',
            pendingOnly: true,
        }));
        expect(chatApiSvc.markAsRead).toHaveBeenCalledWith(88, 120);
    }));
});
