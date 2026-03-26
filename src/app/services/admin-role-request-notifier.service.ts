import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';
import { ChatAlertCandidate } from '../interfaces/chat';
import { ChatApiService } from './chat-api.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { UserProfileApiService } from './user-profile-api.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class AdminRoleRequestNotifierService implements OnDestroy {
    private initialized = false;
    private adminStateSub: Subscription | null = null;
    private realtimeAlertsSub: Subscription | null = null;
    private pollSub: Subscription | null = null;
    private pendingCount: number | null = null;
    private checking = false;
    private alertInFlight = false;
    private isAdminActive = false;
    private readonly handledRealtimeAlertKeys = new Set<string>();
    private latestRealtimeRoleRequestAlert: ChatAlertCandidate | null = null;

    constructor(
        private userSvc: UserService,
        private userProfileApiSvc: UserProfileApiService,
        private userProfileNavSvc: UserProfileNavigationService,
        private chatRealtimeSvc: ChatRealtimeService,
        private chatApiSvc: ChatApiService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.adminStateSub = this.userSvc.esAdmin$.subscribe((isAdmin) => {
            this.isAdminActive = isAdmin === true;
            if (isAdmin === true) {
                this.startPolling();
                void this.checkPendingRequests(true);
                return;
            }

            this.stopPolling();
            this.pendingCount = null;
            this.alertInFlight = false;
            this.handledRealtimeAlertKeys.clear();
            this.latestRealtimeRoleRequestAlert = null;
        });
        this.realtimeAlertsSub = this.chatRealtimeSvc.alertCandidate$.subscribe((candidate) => {
            void this.handleRealtimeAlert(candidate);
        });
    }

    ngOnDestroy(): void {
        this.stopPolling();
        this.adminStateSub?.unsubscribe();
        this.adminStateSub = null;
        this.realtimeAlertsSub?.unsubscribe();
        this.realtimeAlertsSub = null;
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

    private async handleRealtimeAlert(candidate: ChatAlertCandidate | null | undefined): Promise<void> {
        if (!this.isAdminActive)
            return;

        const notificationCode = `${candidate?.notification?.code ?? ''}`.trim().toLowerCase();
        const actionTarget = `${candidate?.notification?.action?.target ?? ''}`.trim().toLowerCase();
        if (notificationCode !== 'system.role_request_created' || actionTarget !== 'admin.role_requests')
            return;

        const alertKey = `${candidate?.alertKey ?? ''}`.trim();
        if (alertKey.length > 0) {
            if (this.handledRealtimeAlertKeys.has(alertKey))
                return;
            this.handledRealtimeAlertKeys.add(alertKey);
        }

        this.latestRealtimeRoleRequestAlert = candidate ?? null;
        await this.checkPendingRequests(true);
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
                    ? 'Hay 1 solicitud de rol pendiente.'
                    : `Hay ${count} solicitudes de rol pendientes.`,
                showCancelButton: true,
                confirmButtonText: 'Revisar ahora',
                cancelButtonText: 'Más tarde',
            });

            if (result.isConfirmed) {
                await this.markLatestAdminNotificationAsRead();
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

    private async markLatestAdminNotificationAsRead(): Promise<void> {
        const candidateConversationId = Math.trunc(Number(this.latestRealtimeRoleRequestAlert?.notification?.action?.conversationId));
        const conversationId = Number.isFinite(candidateConversationId) && candidateConversationId > 0
            ? candidateConversationId
            : this.chatRealtimeSvc.findSystemConversationId('system:yosiftware');
        if (!conversationId)
            return;

        try {
            const candidateMessageId = Math.trunc(Number(this.latestRealtimeRoleRequestAlert?.messageId));
            const lastMessageId = Number.isFinite(candidateMessageId) && candidateMessageId > 0
                ? candidateMessageId
                : this.resolveLastMessageId(await this.chatApiSvc.listMessages(conversationId, null, 25));
            if (!Number.isFinite(lastMessageId) || lastMessageId <= 0)
                return;

            await this.chatApiSvc.markAsRead(conversationId, lastMessageId);
            this.chatRealtimeSvc.markConversationReadLocally(conversationId);
        } catch {
            // El refresco del panel admin no debe romperse si falla este marcado de lectura.
        }
    }

    private resolveLastMessageId(messages: any[]): number {
        const lastMessage = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;
        const lastMessageId = Math.trunc(Number(lastMessage?.messageId));
        return Number.isFinite(lastMessageId) && lastMessageId > 0 ? lastMessageId : 0;
    }
}
