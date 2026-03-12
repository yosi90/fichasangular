import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { UserProfileApiService } from './user-profile-api.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class AdminRoleRequestNotifierService implements OnDestroy {
    private initialized = false;
    private adminStateSub: Subscription | null = null;
    private pollSub: Subscription | null = null;
    private pendingCount: number | null = null;
    private checking = false;
    private alertInFlight = false;

    constructor(
        private userSvc: UserService,
        private userProfileApiSvc: UserProfileApiService,
        private userProfileNavSvc: UserProfileNavigationService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.adminStateSub = this.userSvc.esAdmin$.subscribe((isAdmin) => {
            if (isAdmin === true) {
                this.startPolling();
                void this.checkPendingRequests(true);
                return;
            }

            this.stopPolling();
            this.pendingCount = null;
            this.alertInFlight = false;
        });
    }

    ngOnDestroy(): void {
        this.stopPolling();
        this.adminStateSub?.unsubscribe();
        this.adminStateSub = null;
    }

    private startPolling(): void {
        if (this.pollSub)
            return;

        this.pollSub = interval(5 * 60 * 1000).subscribe(() => {
            void this.checkPendingRequests(false);
        });
    }

    private stopPolling(): void {
        this.pollSub?.unsubscribe();
        this.pollSub = null;
    }

    private async checkPendingRequests(notifyOnAnyPending: boolean): Promise<void> {
        if (this.checking)
            return;
        if (this.userSvc.CurrentUserUid.length < 1)
            return;

        this.checking = true;
        try {
            const requests = await this.userProfileApiSvc.listRoleRequests({
                status: 'pending',
                requestedRole: 'master',
            });
            const count = requests.length;
            const previous = this.pendingCount;
            this.pendingCount = count;

            if (count < 1)
                return;

            if (notifyOnAnyPending || previous === null || count > previous)
                await this.showPendingRequestsAlert(count);
        } catch {
            // La notificación es best-effort y no debe romper el arranque de la app.
        } finally {
            this.checking = false;
        }
    }

    private async showPendingRequestsAlert(count: number): Promise<void> {
        if (this.alertInFlight)
            return;

        this.alertInFlight = true;
        try {
            const result = await Swal.fire({
                icon: 'info',
                title: 'Tienes peticiones por supervisar',
                text: count === 1
                    ? 'Hay 1 solicitud pendiente de master.'
                    : `Hay ${count} solicitudes pendientes de master.`,
                showCancelButton: true,
                confirmButtonText: 'Revisar ahora',
                cancelButtonText: 'Más tarde',
            });

            if (result.isConfirmed) {
                this.userProfileNavSvc.openAdminPanel({
                    section: 'role-requests',
                    pendingOnly: true,
                    requestId: Date.now(),
                });
            }
        } finally {
            this.alertInFlight = false;
        }
    }
}
