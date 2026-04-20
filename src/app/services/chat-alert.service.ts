import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AppToastCategory } from '../interfaces/app-toast';
import { ChatAlertCandidate, ChatAnnouncementPayload } from '../interfaces/chat';
import { SessionNotificationSwalOptions } from '../interfaces/session-notification';
import { UserModerationSanction } from '../interfaces/user-moderation';
import { AppToastService } from './app-toast.service';
import { ChatApiService } from './chat-api.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { SocialAlertPreferencesService } from './social-alert-preferences.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class ChatAlertService implements OnDestroy {
    private readonly expiredBanNoticeStoragePrefix = 'f35:chat-alert:expired-ban';
    private initialized = false;
    private readonly handledAlertKeys = new Set<string>();
    private readonly subscriptions = new Subscription();
    private swalQueue: Promise<void> = Promise.resolve();

    constructor(
        private chatRealtimeSvc: ChatRealtimeService,
        private chatApiSvc: ChatApiService,
        private appToastSvc: AppToastService,
        private userProfileNavSvc: UserProfileNavigationService,
        private userSvc: UserService,
        private socialAlertPrefsSvc: SocialAlertPreferencesService,
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
        if (this.isAdminRoleRequestNotification(candidate))
            return;
        if (this.hasDismissedExpiredAccountBanAlert(candidate))
            return;
        if (this.handledAlertKeys.has(alertKey))
            return;
        this.handledAlertKeys.add(alertKey);

        if (this.isExpiredAccountBanAlert(candidate))
            this.rememberExpiredAccountBanAlert(candidate);

        this.maybeRefreshCanonicalCompliance(candidate);

        if (candidate.notification) {
            if (!this.socialAlertPrefsSvc.isEnabled(this.resolveCategory(candidate)))
                return;
            this.enqueueSwal(candidate);
            return;
        }

        if (this.chatRealtimeSvc.isConversationFocused(candidate.conversationId))
            return;

        if (candidate.announcement) {
            this.showAnnouncementToast(candidate.announcement, candidate);
            return;
        }

        const category = this.resolveCategory(candidate);
        if (!this.socialAlertPrefsSvc.isEnabled(category))
            return;

        if (candidate.sender.isSystemUser === true || `${candidate.sender.uid ?? ''}`.trim() === 'system:yosiftware') {
            this.appToastSvc.showSystem(this.buildSystemToast(candidate), {
                durationMs: 7600,
                category,
            });
            return;
        }

        this.appToastSvc.showInfo(this.buildUserMessageToast(candidate), {
            category,
        });
    }

    private showAnnouncementToast(announcement: ChatAnnouncementPayload, candidate: ChatAlertCandidate): void {
        const title = `${announcement.title ?? ''}`.trim();
        const category = this.resolveCategory(candidate);
        if (!this.socialAlertPrefsSvc.isEnabled(category))
            return;
        if (announcement.code === 'chat.new_chat') {
            this.appToastSvc.showInfo(title || 'Tienes una conversación nueva.', { category: 'mensajes' });
            return;
        }

        if (announcement.code === 'chat.new_message') {
            this.appToastSvc.showInfo(title || this.buildUserMessageToast(candidate), { category: 'mensajes' });
            return;
        }

        this.appToastSvc.showInfo(title || this.buildUserMessageToast(candidate), {
            category,
        });
    }

    private buildUserMessageToast(candidate: ChatAlertCandidate): string {
        const conversationTitle = `${candidate.conversationTitle ?? ''}`.trim();
        const senderLabel = `${candidate.sender.displayName ?? ''}`.trim() || 'Usuario';
        const preview = this.buildPreview(candidate.body);
        if (candidate.conversationType === 'campaign' && conversationTitle.length > 0)
            return preview.length > 0
                ? `Nuevo mensaje en el grupo de ${conversationTitle}: ${preview}`
                : `Nuevo mensaje en el grupo de ${conversationTitle}.`;
        if (candidate.conversationType === 'group' && conversationTitle.length > 0)
            return preview.length > 0
                ? `Nuevo mensaje en ${conversationTitle}: ${preview}`
                : `Nuevo mensaje en ${conversationTitle}.`;
        return preview.length > 0 ? `${senderLabel}: ${preview}` : `${senderLabel} te ha enviado un mensaje.`;
    }

    private buildSystemToast(candidate: ChatAlertCandidate): string {
        const preview = this.buildPreview(candidate.body);
        return preview.length > 0 ? `Yosiftware: ${preview}` : 'Yosiftware te ha enviado un aviso.';
    }

    private maybeRefreshCanonicalCompliance(candidate: ChatAlertCandidate): void {
        const code = `${candidate?.notification?.code ?? ''}`.trim().toLowerCase();
        if (code !== 'system.account_banned' && code !== 'system.moderation_event')
            return;
        const refreshTask = this.userSvc.refreshCurrentPrivateProfile?.();
        if (refreshTask && typeof (refreshTask as Promise<unknown>).catch === 'function')
            void refreshTask.catch(() => undefined);
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

        const isAccountBannedAlert = notification.code === 'system.account_banned';
        const currentBanStatus = typeof this.userSvc.getCurrentBanStatus === 'function'
            ? this.userSvc.getCurrentBanStatus()
            : null;
        const canOpenMessages = !isAccountBannedAlert
            && (notification.action?.target === 'social.messages' || this.isFeedbackNotification(candidate))
            && Math.trunc(Number(notification.action?.conversationId)) > 0;
        const notificationConversationId = Math.trunc(Number(notification.action?.conversationId));
        const campaignId = this.extractCampaignId(candidate);
        const canOpenCampaign = campaignId > 0
            && (notification.code === 'system.campaign_invitation_received'
                || notification.code === 'system.campaign_invitation_resolved');
        const canOpenRestriction = isAccountBannedAlert && currentBanStatus?.restriction === 'temporaryBan';
        const canOpenProfile = !isAccountBannedAlert && (notification.code === 'system.role_request_resolved'
            || notification.code === 'system.moderation_event');
        const primaryActionLabel = canOpenCampaign
            ? 'Abrir campaña'
            : canOpenRestriction
                ? 'Ver restricción'
                : canOpenProfile
                ? 'Abrir perfil'
                : canOpenMessages
                    ? 'Abrir mensajes'
                    : 'Entendido';
        const swalHtml = this.buildNotificationSwalHtml(candidate);
        const openPrimaryAction = async (): Promise<void> => {
            if (canOpenCampaign) {
                await this.markNotificationConversationAsRead(candidate, notificationConversationId);
                this.userProfileNavSvc.openSocial({
                    section: 'campanas',
                    campaignId,
                    requestId: Date.now(),
                });
                return;
            }
            if (canOpenRestriction) {
                await this.markNotificationConversationAsRead(candidate, notificationConversationId);
                this.userProfileNavSvc.openAccountRestriction({
                    section: 'resumen',
                    requestId: Date.now(),
                });
                return;
            }
            if (canOpenProfile) {
                await this.markNotificationConversationAsRead(candidate, notificationConversationId);
                this.userProfileNavSvc.openPrivateProfile({
                    section: 'resumen',
                    requestId: Date.now(),
                });
                return;
            }
            if (canOpenMessages) {
                await this.markNotificationConversationAsRead(candidate, notificationConversationId);
                this.userProfileNavSvc.openSocial({
                    section: 'mensajes',
                    conversationId: notificationConversationId,
                    requestId: Date.now(),
                });
            }
        };
        const result = await Swal.fire({
            icon: isAccountBannedAlert ? 'warning' : 'info',
            title: `${notification.title ?? ''}`.trim() || 'Nuevo aviso',
            text: swalHtml ? undefined : (`${candidate.body ?? ''}`.trim() || `${notification.title ?? ''}`.trim() || 'Tienes un nuevo aviso.'),
            html: swalHtml || undefined,
            showCancelButton: canOpenCampaign || canOpenRestriction || canOpenProfile || canOpenMessages,
            showDenyButton: (canOpenCampaign || canOpenProfile) && canOpenMessages,
            confirmButtonText: primaryActionLabel,
            denyButtonText: canOpenMessages ? 'Abrir mensajes' : undefined,
            cancelButtonText: canOpenCampaign || canOpenRestriction || canOpenProfile || canOpenMessages ? 'Cerrar' : undefined,
            focusConfirm: false,
            sessionNotification: {
                include: true,
                level: isAccountBannedAlert ? 'warning' : 'info',
                title: `${notification.title ?? ''}`.trim() || 'Nuevo aviso',
                message: `${candidate.body ?? ''}`.trim() || `${notification.title ?? ''}`.trim() || 'Tienes un nuevo aviso.',
                actionLabel: canOpenCampaign || canOpenRestriction || canOpenProfile || canOpenMessages
                    ? primaryActionLabel
                    : null,
                action: canOpenCampaign || canOpenRestriction || canOpenProfile || canOpenMessages
                    ? (() => openPrimaryAction())
                    : null,
            },
        } as SessionNotificationSwalOptions);

        if (result.isConfirmed) {
            await openPrimaryAction();
            return;
        }

        if (result.isDenied && canOpenMessages) {
            await this.markNotificationConversationAsRead(candidate, notificationConversationId);
            this.userProfileNavSvc.openSocial({
                section: 'mensajes',
                conversationId: notificationConversationId,
                requestId: Date.now(),
            });
        }
    }

    private buildPreview(body: string): string {
        const normalized = `${body ?? ''}`.replace(/\s+/g, ' ').trim();
        if (normalized.length <= 120)
            return normalized;
        return `${normalized.slice(0, 117).trim()}...`;
    }

    private buildNotificationSwalHtml(candidate: ChatAlertCandidate): string {
        const notificationCode = `${candidate?.notification?.code ?? ''}`.trim().toLowerCase();
        if (notificationCode !== 'system.account_banned')
            return '';

        const bodyParts = this.extractAccountBanCopy(candidate);
        const banStatus = typeof this.userSvc.getCurrentBanStatus === 'function'
            ? this.userSvc.getCurrentBanStatus()
            : null;
        const sanction = banStatus?.sanction ?? this.userSvc.getCurrentCompliance?.()?.activeSanction ?? null;
        const durationLabel = banStatus?.restriction === 'temporaryBan'
            ? `Duración del baneo: ${this.formatModerationSanctionLabel(sanction)}`
            : banStatus?.restriction === 'permanentBan'
                ? 'Duración del baneo: permanente'
                : 'La restricción ya ha terminado';
        const durationHint = banStatus?.restriction
            ? 'La duración se basa en la sanción activa registrada para tu cuenta.'
            : 'El aviso ha llegado después de que terminara la sanción activa.';

        return [
            '<div style="display:flex;flex-direction:column;gap:1rem;text-align:center;">',
            bodyParts.reason
                ? `  <p style="margin:0;color:rgba(33,37,41,.88);line-height:1.45;"><strong>Razón:</strong> ${this.escapeHtml(bodyParts.reason)}</p>`
                : '',
            bodyParts.extraMessage
                ? `  <p style="margin:0;color:rgba(33,37,41,.78);white-space:pre-line;line-height:1.45;">${this.escapeHtml(bodyParts.extraMessage)}</p>`
                : '',
            '  <div style="padding:.85rem 1rem;border-radius:1rem;background:rgba(255,99,132,.08);border:1px solid rgba(255,99,132,.22);text-align:left;">',
            `    <strong style="display:block;margin-bottom:.35rem;color:rgba(33,37,41,.92);">${this.escapeHtml(durationLabel)}</strong>`,
            `    <span style="display:block;color:rgba(33,37,41,.74);line-height:1.45;">${this.escapeHtml(durationHint)}</span>`,
            '  </div>',
            '</div>',
        ].filter((line) => line.length > 0).join('');
    }

    private extractCampaignId(candidate: ChatAlertCandidate): number {
        const notificationCampaignId = Math.trunc(Number(candidate.notification?.context?.['campaignId']));
        if (Number.isFinite(notificationCampaignId) && notificationCampaignId > 0)
            return notificationCampaignId;
        return Math.trunc(Number(candidate.campaignId)) > 0 ? Math.trunc(Number(candidate.campaignId)) : 0;
    }

    private isOwnMessage(candidate: ChatAlertCandidate): boolean {
        const senderUid = `${candidate?.sender?.uid ?? ''}`.trim();
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        return senderUid.length > 0 && currentUid.length > 0 && senderUid === currentUid;
    }

    private resolveCategory(candidate: ChatAlertCandidate): AppToastCategory {
        const announcementCode = `${candidate?.announcement?.code ?? ''}`.trim().toLowerCase();
        if (announcementCode === 'chat.new_chat' || announcementCode === 'chat.new_message')
            return 'mensajes';

        const notificationCode = `${candidate?.notification?.code ?? ''}`.trim().toLowerCase();
        if (notificationCode === 'system.campaign_invitation_received' || notificationCode === 'system.campaign_invitation_resolved')
            return 'campanas';
        if (notificationCode === 'system.feedback_created' || notificationCode === 'system.feedback_updated')
            return 'cuentaSistema';
        if (notificationCode === 'system.role_request_created')
            return 'cuentaSistema';
        if (notificationCode === 'system.role_request_resolved'
            || notificationCode === 'system.account_updated'
            || notificationCode === 'system.account_banned')
            return 'cuentaSistema';
        if (notificationCode.startsWith('system.')) {
            if (this.isFriendshipNotification(candidate))
                return 'amistad';
            return 'cuentaSistema';
        }

        if (candidate?.sender?.isSystemUser === true || `${candidate?.sender?.uid ?? ''}`.trim() === 'system:yosiftware')
            return 'cuentaSistema';

        return 'mensajes';
    }

    private isFriendshipNotification(candidate: ChatAlertCandidate): boolean {
        const campaignId = this.extractCampaignId(candidate);
        if (campaignId > 0)
            return false;

        const context = candidate.notification?.context ?? {};
        return ['targetUid', 'requesterUid', 'fromUid']
            .some((key) => `${context?.[key] ?? ''}`.trim().length > 0);
    }

    private isAdminRoleRequestNotification(candidate: ChatAlertCandidate): boolean {
        const notificationCode = `${candidate?.notification?.code ?? ''}`.trim().toLowerCase();
        const actionTarget = `${candidate?.notification?.action?.target ?? ''}`.trim().toLowerCase();
        return notificationCode === 'system.role_request_created' || actionTarget === 'admin.role_requests';
    }

    private isFeedbackNotification(candidate: ChatAlertCandidate): boolean {
        const notificationCode = `${candidate?.notification?.code ?? ''}`.trim().toLowerCase();
        return notificationCode === 'system.feedback_created' || notificationCode === 'system.feedback_updated';
    }

    private isExpiredAccountBanAlert(candidate: ChatAlertCandidate): boolean {
        const notificationCode = `${candidate?.notification?.code ?? ''}`.trim().toLowerCase();
        if (notificationCode !== 'system.account_banned')
            return false;
        const banStatus = typeof this.userSvc.getCurrentBanStatus === 'function'
            ? this.userSvc.getCurrentBanStatus()
            : null;
        return !banStatus?.restriction;
    }

    private hasDismissedExpiredAccountBanAlert(candidate: ChatAlertCandidate): boolean {
        if (!this.isExpiredAccountBanAlert(candidate))
            return false;
        const storageKey = this.buildExpiredAccountBanAlertStorageKey(candidate);
        if (storageKey.length < 1)
            return false;
        try {
            return localStorage.getItem(storageKey) !== null;
        } catch {
            return false;
        }
    }

    private rememberExpiredAccountBanAlert(candidate: ChatAlertCandidate): void {
        const storageKey = this.buildExpiredAccountBanAlertStorageKey(candidate);
        if (storageKey.length < 1)
            return;
        try {
            localStorage.setItem(storageKey, new Date().toISOString());
        } catch {
            // Ignorado: localStorage puede no estar disponible.
        }
    }

    private buildExpiredAccountBanAlertStorageKey(candidate: ChatAlertCandidate): string {
        const currentUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        if (currentUid.length < 1)
            return '';
        const messageId = Math.trunc(Number(candidate?.messageId));
        const fingerprint = Number.isFinite(messageId) && messageId > 0
            ? `message:${messageId}`
            : `alert:${`${candidate?.alertKey ?? ''}`.trim()}`;
        if (fingerprint.endsWith('alert:'))
            return '';
        return `${this.expiredBanNoticeStoragePrefix}:${currentUid}:${fingerprint}`;
    }

    private async markNotificationConversationAsRead(candidate: ChatAlertCandidate, conversationId: number): Promise<void> {
        const normalizedConversationId = Math.trunc(Number(conversationId));
        if (!Number.isFinite(normalizedConversationId) || normalizedConversationId <= 0)
            return;

        const directMessageId = Math.trunc(Number(candidate?.messageId));
        try {
            const lastMessageId = Number.isFinite(directMessageId) && directMessageId > 0
                ? directMessageId
                : this.resolveLastMessageId(
                    await this.chatApiSvc.listMessages(normalizedConversationId, null, 25)
                );
            if (!lastMessageId)
                return;

            await this.chatApiSvc.markAsRead(normalizedConversationId, lastMessageId);
            this.chatRealtimeSvc.markConversationReadLocally(normalizedConversationId);
        } catch {
            // La navegación principal no debe romperse si falla el marcado de lectura.
        }
    }

    private resolveLastMessageId(messages: ChatAlertCandidate[] | any[]): number {
        const candidate = Array.isArray(messages) && messages.length > 0
            ? messages[messages.length - 1]
            : null;
        const messageId = Math.trunc(Number(candidate?.messageId));
        return Number.isFinite(messageId) && messageId > 0 ? messageId : 0;
    }

    private formatModerationSanctionLabel(sanction: UserModerationSanction | null | undefined): string {
        if (!sanction)
            return 'no disponible';

        const label = `${sanction.name ?? sanction.code ?? sanction.kind ?? 'Sanción'}`.trim();
        if (sanction.isPermanent)
            return `${label} permanente`;
        const endsAtUtc = `${sanction.endsAtUtc ?? ''}`.trim();
        if (endsAtUtc.length > 0)
            return `${label} hasta ${this.formatDateTimeLabel(endsAtUtc)}`;
        return label;
    }

    private formatDateTimeLabel(value: string): string {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime()))
            return 'fecha no disponible';

        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(parsed).replace(',', '');
    }

    private extractAccountBanCopy(candidate: ChatAlertCandidate): { reason: string; extraMessage: string; } {
        const body = `${candidate?.body ?? ''}`.trim();
        const reasonMatch = /(?:nota del administrador|raz[oó]n)\s*:\s*([^\n]+)/i.exec(body);
        const lines = body
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        let reason = `${reasonMatch?.[1] ?? ''}`.trim();
        const extraLines = lines.filter((line) => {
            const normalized = line.toLowerCase();
            if (normalized.startsWith('tu cuenta ha sido actualizada por administración.')
                || normalized.startsWith('tu cuenta ha sido actualizada por administracion.')
                || normalized.startsWith('estado de cuenta:')) {
                return false;
            }
            if (normalized.startsWith('nota del administrador:') || normalized.startsWith('razón:') || normalized.startsWith('razon:')) {
                reason = reason || line.split(':').slice(1).join(':').trim();
                return false;
            }
            return true;
        });

        return {
            reason,
            extraMessage: extraLines.join('\n'),
        };
    }

    private escapeHtml(value: string): string {
        return `${value ?? ''}`
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
