import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ChatAnnouncementPayload, ChatMessage } from '../interfaces/chat';
import { AppToastService } from './app-toast.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class ChatAlertService implements OnDestroy {
    private initialized = false;
    private readonly handledMessageIds = new Set<number>();
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
                    this.handledMessageIds.clear();
            })
        );
        this.subscriptions.add(
            this.chatRealtimeSvc.alertCandidate$.subscribe((message) => this.handleAlert(message))
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private handleAlert(message: ChatMessage): void {
        const messageId = Math.trunc(Number(message?.messageId));
        if (!Number.isFinite(messageId) || messageId <= 0)
            return;
        if (this.isOwnMessage(message))
            return;
        if (this.handledMessageIds.has(messageId))
            return;
        this.handledMessageIds.add(messageId);

        if (message.notification) {
            this.enqueueSwal(message);
            return;
        }

        if (this.chatRealtimeSvc.isConversationFocused(message.conversationId))
            return;

        if (message.announcement) {
            this.showAnnouncementToast(message.announcement, message);
            return;
        }

        if (message.sender.isSystemUser === true || `${message.sender.uid ?? ''}`.trim() === 'system:yosiftware') {
            this.appToastSvc.showSystem(this.buildSystemToast(message), { durationMs: 7600 });
            return;
        }

        this.appToastSvc.showInfo(this.buildUserMessageToast(message));
    }

    private showAnnouncementToast(announcement: ChatAnnouncementPayload, message: ChatMessage): void {
        const title = `${announcement.title ?? ''}`.trim();
        if (announcement.code === 'chat.new_chat') {
            this.appToastSvc.showInfo(title || 'Tienes una conversación nueva.');
            return;
        }

        if (announcement.code === 'chat.new_message') {
            this.appToastSvc.showInfo(title || this.buildUserMessageToast(message));
            return;
        }

        this.appToastSvc.showInfo(title || this.buildUserMessageToast(message));
    }

    private buildUserMessageToast(message: ChatMessage): string {
        const senderLabel = `${message.sender.displayName ?? ''}`.trim() || 'Usuario';
        const preview = this.buildPreview(message.body);
        return preview.length > 0 ? `${senderLabel}: ${preview}` : `${senderLabel} te ha enviado un mensaje.`;
    }

    private buildSystemToast(message: ChatMessage): string {
        const preview = this.buildPreview(message.body);
        return preview.length > 0 ? `Yosiftware: ${preview}` : 'Yosiftware te ha enviado un aviso.';
    }

    private enqueueSwal(message: ChatMessage): void {
        this.swalQueue = this.swalQueue
            .then(() => this.showNotificationSwal(message))
            .catch(() => undefined);
    }

    private async showNotificationSwal(message: ChatMessage): Promise<void> {
        const notification = message.notification;
        if (!notification)
            return;

        const canOpenMessages = notification.action?.target === 'social.messages'
            && Math.trunc(Number(notification.action?.conversationId)) > 0;
        const result = await Swal.fire({
            icon: 'info',
            title: `${notification.title ?? ''}`.trim() || 'Nuevo aviso',
            text: `${message.body ?? ''}`.trim() || `${notification.title ?? ''}`.trim() || 'Tienes un nuevo aviso.',
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

    private isOwnMessage(message: ChatMessage): boolean {
        const senderUid = `${message?.sender?.uid ?? ''}`.trim();
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        return senderUid.length > 0 && currentUid.length > 0 && senderUid === currentUid;
    }
}
