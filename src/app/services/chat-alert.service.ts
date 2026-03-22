import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ChatAlertCandidate, ChatAnnouncementPayload } from '../interfaces/chat';
import { AppToastService } from './app-toast.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class ChatAlertService implements OnDestroy {
    private initialized = false;
    private readonly handledAlertKeys = new Set<string>();
    private readonly subscriptions = new Subscription();
    private swalQueue: Promise<void> = Promise.resolve();

    constructor(
        private chatRealtimeSvc: ChatRealtimeService,
        private appToastSvc: AppToastService,
        private userProfileNavSvc: UserProfileNavigationService,
        private userSvc: UserService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.subscriptions.add(
            this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
                if (loggedIn !== true)
                    this.handledAlertKeys.clear();
            })
        );
        this.subscriptions.add(
            this.chatRealtimeSvc.alertCandidate$.subscribe((candidate) => this.handleAlert(candidate))
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private handleAlert(candidate: ChatAlertCandidate): void {
        const alertKey = `${candidate?.alertKey ?? ''}`.trim();
        if (alertKey.length < 1)
            return;
        if (this.isOwnMessage(candidate))
            return;
        if (this.handledAlertKeys.has(alertKey))
            return;
        this.handledAlertKeys.add(alertKey);

        if (candidate.notification) {
            this.enqueueSwal(candidate);
            return;
        }

        if (this.chatRealtimeSvc.isConversationFocused(candidate.conversationId))
            return;

        if (candidate.announcement) {
            this.showAnnouncementToast(candidate.announcement, candidate);
            return;
        }

        if (candidate.sender.isSystemUser === true || `${candidate.sender.uid ?? ''}`.trim() === 'system:yosiftware') {
            this.appToastSvc.showSystem(this.buildSystemToast(candidate), { durationMs: 7600 });
            return;
        }

        this.appToastSvc.showInfo(this.buildUserMessageToast(candidate));
    }

    private showAnnouncementToast(announcement: ChatAnnouncementPayload, candidate: ChatAlertCandidate): void {
        const title = `${announcement.title ?? ''}`.trim();
        if (announcement.code === 'chat.new_chat') {
            this.appToastSvc.showInfo(title || 'Tienes una conversación nueva.');
            return;
        }

        if (announcement.code === 'chat.new_message') {
            this.appToastSvc.showInfo(title || this.buildUserMessageToast(candidate));
            return;
        }

        this.appToastSvc.showInfo(title || this.buildUserMessageToast(candidate));
    }

    private buildUserMessageToast(candidate: ChatAlertCandidate): string {
        const senderLabel = `${candidate.sender.displayName ?? ''}`.trim() || 'Usuario';
        const preview = this.buildPreview(candidate.body);
        return preview.length > 0 ? `${senderLabel}: ${preview}` : `${senderLabel} te ha enviado un mensaje.`;
    }

    private buildSystemToast(candidate: ChatAlertCandidate): string {
        const preview = this.buildPreview(candidate.body);
        return preview.length > 0 ? `Yosiftware: ${preview}` : 'Yosiftware te ha enviado un aviso.';
    }

    private enqueueSwal(candidate: ChatAlertCandidate): void {
        this.swalQueue = this.swalQueue
            .then(() => this.showNotificationSwal(candidate))
            .catch(() => undefined);
    }

    private async showNotificationSwal(candidate: ChatAlertCandidate): Promise<void> {
        const notification = candidate.notification;
        if (!notification)
            return;

        const canOpenMessages = notification.action?.target === 'social.messages'
            && Math.trunc(Number(notification.action?.conversationId)) > 0;
        const result = await Swal.fire({
            icon: 'info',
            title: `${notification.title ?? ''}`.trim() || 'Nuevo aviso',
            text: `${candidate.body ?? ''}`.trim() || `${notification.title ?? ''}`.trim() || 'Tienes un nuevo aviso.',
            showCancelButton: canOpenMessages,
            confirmButtonText: canOpenMessages ? 'Abrir mensajes' : 'Aceptar',
            cancelButtonText: canOpenMessages ? 'Cerrar' : undefined,
            focusConfirm: false,
        });

        if (!canOpenMessages || !result.isConfirmed)
            return;

        this.userProfileNavSvc.openSocial({
            section: 'mensajes',
            conversationId: Math.trunc(Number(notification.action?.conversationId)),
            requestId: Date.now(),
        });
    }

    private buildPreview(body: string): string {
        const normalized = `${body ?? ''}`.replace(/\s+/g, ' ').trim();
        if (normalized.length <= 120)
            return normalized;
        return `${normalized.slice(0, 117).trim()}...`;
    }

    private isOwnMessage(candidate: ChatAlertCandidate): boolean {
        const senderUid = `${candidate?.sender?.uid ?? ''}`.trim();
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        return senderUid.length > 0 && currentUid.length > 0 && senderUid === currentUid;
    }
}
