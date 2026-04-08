import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ChatAlertCandidate } from '../interfaces/chat';
import { SessionNotificationSwalOptions } from '../interfaces/session-notification';
import { AdminUsersService } from './admin-users.service';
import { ChatApiService } from './chat-api.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class AdminRoleRequestNotifierService implements OnDestroy {
    private initialized = false;
    private adminStateSub: Subscription | null = null;
    private realtimeAlertsSub: Subscription | null = null;
    private alertInFlight = false;
    private isAdminActive = false;
    private readonly handledRealtimeAlertKeys = new Set<string>();
    private latestRealtimeRoleRequestAlert: ChatAlertCandidate | null = null;

    constructor(
        private userSvc: UserService,
        private adminUsersSvc: AdminUsersService,
        private userProfileNavSvc: UserProfileNavigationService,
        private chatRealtimeSvc: ChatRealtimeService,
        private chatApiSvc: ChatApiService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.adminStateSub = this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
            if (loggedIn === true)
                return;

            this.isAdminActive = false;
            this.alertInFlight = false;
            this.handledRealtimeAlertKeys.clear();
            this.latestRealtimeRoleRequestAlert = null;
        });
        this.realtimeAlertsSub = this.chatRealtimeSvc.alertCandidate$.subscribe((candidate) => {
            void this.handleRealtimeAlert(candidate);
        });
    }

    ngOnDestroy(): void {
        this.adminStateSub?.unsubscribe();
        this.adminStateSub = null;
        this.realtimeAlertsSub?.unsubscribe();
        this.realtimeAlertsSub = null;
    }

    private async handleRealtimeAlert(candidate: ChatAlertCandidate | null | undefined): Promise<void> {
        if (!this.isAdminActive)
            await this.refreshAdminRuntimeAccess();
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
        await this.showPendingRequestsAlert();
    }

    private async showPendingRequestsAlert(): Promise<void> {
        if (this.alertInFlight)
            return;

        this.alertInFlight = true;
        try {
            const openRoleRequests = async (): Promise<void> => {
                await this.markLatestAdminNotificationAsRead();
                this.userProfileNavSvc.openAdminPanel({
                    section: 'role-requests',
                    pendingOnly: true,
                    requestId: Date.now(),
                });
            };
            const result = await Swal.fire({
                icon: 'info',
                title: 'Tienes peticiones por supervisar',
                text: 'Ha llegado una nueva solicitud de rol o hay pendientes por revisar.',
                showCancelButton: true,
                confirmButtonText: 'Revisar ahora',
                cancelButtonText: 'Más tarde',
                sessionNotification: {
                    include: true,
                    level: 'info',
                    title: 'Tienes peticiones por supervisar',
                    message: 'Ha llegado una nueva solicitud de rol o hay pendientes por revisar.',
                    actionLabel: 'Revisar ahora',
                    action: () => openRoleRequests(),
                },
            } as SessionNotificationSwalOptions);

            if (result.isConfirmed)
                await openRoleRequests();
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

    private async refreshAdminRuntimeAccess(): Promise<void> {
        try {
            await this.adminUsersSvc.assertAdminAccess();
            this.isAdminActive = true;
        } catch {
            this.isAdminActive = false;
        }
    }
}
