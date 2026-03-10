import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';
import { AdminRoleRequestNotifierService } from './admin-role-request-notifier.service';

describe('AdminRoleRequestNotifierService', () => {
    it('muestra alerta y abre admin panel cuando detecta pendientes al entrar un admin', fakeAsync(() => {
        const esAdmin$ = new BehaviorSubject<boolean>(false);
        const userSvc = {
            esAdmin$,
            CurrentUserUid: 'admin-1',
        } as any;
        const userProfileApiSvc = {
            listPendingMasterRoleRequests: jasmine.createSpy('listPendingMasterRoleRequests').and.resolveTo([
                { requestId: 1 },
                { requestId: 2 },
            ]),
        } as any;
        const navSvc = {
            openAdminPanel: jasmine.createSpy('openAdminPanel'),
        } as any;
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        const service = new AdminRoleRequestNotifierService(userSvc, userProfileApiSvc, navSvc);

        service.init();
        esAdmin$.next(true);
        tick();

        expect(userProfileApiSvc.listPendingMasterRoleRequests).toHaveBeenCalled();
        expect(Swal.fire).toHaveBeenCalled();
        expect(navSvc.openAdminPanel).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'role-requests',
            pendingOnly: true,
        }));
    }));
});
