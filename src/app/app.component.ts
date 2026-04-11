import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, fromEvent, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { CompliancePolicyNoticeService } from './services/compliance-policy-notice.service';
import { AdminRoleRequestNotifierService } from './services/admin-role-request-notifier.service';
import { CampaignRealtimeSyncService } from './services/campaign-realtime-sync.service';
import { ChatAlertService } from './services/chat-alert.service';
import { ChatFloatingService } from './services/chat-floating.service';
import { ChatRealtimeService } from './services/chat-realtime.service';
import { SessionNotificationCenterService } from './services/session-notification-center.service';
import { SocialAlertPreferencesService } from './services/social-alert-preferences.service';
import { toUserFacingErrorMessage } from './services/utils/user-facing-error.util';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.sass'],
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
    private static swalConfigurado = false;
    private readonly destroy$ = new Subject<void>();
    height: number = typeof window !== 'undefined' ? window.innerHeight : 0;
    width: number = typeof window !== 'undefined' ? window.innerWidth : 0;
    resize$: Observable<Event> = fromEvent(window, 'resize');

    constructor(
        private compliancePolicyNoticeSvc: CompliancePolicyNoticeService,
        private adminRoleRequestNotifierSvc: AdminRoleRequestNotifierService,
        private campaignRealtimeSyncSvc: CampaignRealtimeSyncService,
        private chatRealtimeSvc: ChatRealtimeService,
        private chatFloatingSvc: ChatFloatingService,
        private chatAlertSvc: ChatAlertService,
        private sessionNotificationCenterSvc: SessionNotificationCenterService,
        private socialAlertPrefsSvc: SocialAlertPreferencesService,
    ) { }

    async ngOnInit(): Promise<void> {
        this.configurarSwalGlobal();
        this.compliancePolicyNoticeSvc.init();
        this.adminRoleRequestNotifierSvc.init();
        this.chatRealtimeSvc.init();
        this.chatFloatingSvc.init();
        this.campaignRealtimeSyncSvc.init();
        this.socialAlertPrefsSvc.init();
        this.chatAlertSvc.init();
        this.resize$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.height = window.innerHeight;
                this.width = window.innerWidth;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get isDesktopLayout(): boolean {
        return this.width > 1250 && this.height > 700 && this.height < this.width;
    }

    private configurarSwalGlobal(): void {
        if (AppComponent.swalConfigurado)
            return;

        const originalFire = (Swal.fire as any).bind(Swal);
        const baseConfig = {
            target: typeof document !== 'undefined' ? document.body : undefined,
            heightAuto: false,
            scrollbarPadding: false,
        };

        (Swal as any).fire = ((...args: any[]) => {
            const normalizedArgs = this.sessionNotificationCenterSvc.prepareSwalInvocation(args);

            if (normalizedArgs.length === 0)
                return originalFire(baseConfig);

            if (normalizedArgs.length === 1 && normalizedArgs[0] && typeof normalizedArgs[0] === 'object' && !Array.isArray(normalizedArgs[0])) {
                const options = normalizedArgs[0];
                return originalFire({
                    ...baseConfig,
                    ...options,
                    text: this.sanitizeSwalText(options?.text, options?.title, options?.icon),
                });
            }

            if (normalizedArgs.length <= 3) {
                const [title, text, icon] = normalizedArgs;
                return originalFire({
                    ...baseConfig,
                    title,
                    text: this.sanitizeSwalText(text, title, icon),
                    icon,
                });
            }

            return originalFire(...normalizedArgs);
        }) as typeof Swal.fire;

        AppComponent.swalConfigurado = true;
    }

    private sanitizeSwalText(rawText: any, title: any, icon: any): string | undefined {
        const text = `${rawText ?? ''}`.trim();
        if (text.length < 1)
            return undefined;

        const fallback = this.resolveSwalFallback(title, icon);
        return toUserFacingErrorMessage(text, fallback);
    }

    private resolveSwalFallback(title: any, icon: any): string {
        const normalizedTitle = `${title ?? ''}`.trim();
        const normalizedIcon = `${icon ?? ''}`.trim().toLowerCase();
        const genericTitle = normalizedTitle.length < 1
            || normalizedTitle.localeCompare('error', 'es', { sensitivity: 'base' }) === 0
            || normalizedTitle.localeCompare('warning', 'es', { sensitivity: 'base' }) === 0
            || normalizedTitle.localeCompare('aviso', 'es', { sensitivity: 'base' }) === 0;

        if (!genericTitle)
            return normalizedTitle.endsWith('.') ? normalizedTitle : `${normalizedTitle}.`;
        if (normalizedIcon === 'success')
            return 'Acción completada.';
        if (normalizedIcon === 'info')
            return 'Hay un aviso para revisar.';
        return 'No se pudo completar la acción.';
    }
}

