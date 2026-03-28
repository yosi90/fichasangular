import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';
import { AdminRoleRequestNotifierService } from './admin-role-request-notifier.service';

describe('AdminRoleRequestNotifierService', () => {
    it('reacciona al aviso realtime system.role_request_created y refresca el panel admin', fakeAsync(() => {
        const isLoggedIn$ = new BehaviorSubject<boolean>(true);
        const alertCandidate$ = new BehaviorSubject<any>(null);
        const userSvc = {
            isLoggedIn$,
            CurrentUserUid: 'admin-1',
        } as any;
        const adminUsersSvc = jasmine.createSpyObj('AdminUsersService', ['assertAdminAccess']);
        adminUsersSvc.assertAdminAccess.and.resolveTo();
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

        const service = new AdminRoleRequestNotifierService(userSvc, adminUsersSvc, navSvc, chatRealtimeSvc, chatApiSvc);

        service.init();
        tick();
        alertCandidate$.next({
            alertKey: 'admin-role-request-created',
            notification: {
                code: 'system.role_request_created',
                action: {
                    target: 'admin.role_requests',
                    conversationId: 55,
                },
            },
        });
        tick();

        expect(Swal.fire).toHaveBeenCalled();
        expect(navSvc.openAdminPanel).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'role-requests',
            pendingOnly: true,
        }));
        expect(chatApiSvc.markAsRead).toHaveBeenCalledWith(55, 90);
        expect(chatRealtimeSvc.markConversationReadLocally).toHaveBeenCalledWith(55);
    }));

    it('ignora avisos admin si la sesión no tiene permisos admin activos', fakeAsync(() => {
        const isLoggedIn$ = new BehaviorSubject<boolean>(true);
        const alertCandidate$ = new BehaviorSubject<any>(null);
        const userSvc = {
            isLoggedIn$,
            CurrentUserUid: 'user-no-admin',
        } as any;
        const adminUsersSvc = jasmine.createSpyObj('AdminUsersService', ['assertAdminAccess']);
        adminUsersSvc.assertAdminAccess.and.rejectWith(new Error('No autorizado'));
        const navSvc = {
            openAdminPanel: jasmine.createSpy('openAdminPanel'),
        } as any;
        const chatRealtimeSvc = {
            alertCandidate$,
            findSystemConversationId: jasmine.createSpy('findSystemConversationId').and.returnValue(0),
            markConversationReadLocally: jasmine.createSpy('markConversationReadLocally'),
        } as any;
        const chatApiSvc = jasmine.createSpyObj('ChatApiService', ['listMessages', 'markAsRead']);
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        const service = new AdminRoleRequestNotifierService(userSvc, adminUsersSvc, navSvc, chatRealtimeSvc, chatApiSvc);

        service.init();
        tick();
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

        expect(Swal.fire).not.toHaveBeenCalled();
        expect(navSvc.openAdminPanel).not.toHaveBeenCalled();
    }));
});
