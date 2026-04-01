import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, fromEvent, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { CompliancePolicyNoticeService } from './services/compliance-policy-notice.service';
import { AdminRoleRequestNotifierService } from './services/admin-role-request-notifier.service';
import { CampaignRealtimeSyncService } from './services/campaign-realtime-sync.service';
import { ChatAlertService } from './services/chat-alert.service';
import { ChatFloatingService } from './services/chat-floating.service';
import { ChatRealtimeService } from './services/chat-realtime.service';
import { SocialAlertPreferencesService } from './services/social-alert-preferences.service';

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
            if (args.length === 0)
                return originalFire(baseConfig);

            if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0]))
                return originalFire({ ...baseConfig, ...args[0] });

            if (args.length <= 3) {
                const [title, text, icon] = args;
                return originalFire({
                    ...baseConfig,
                    title,
                    text,
                    icon,
                });
            }

            return originalFire(...args);
        }) as typeof Swal.fire;

        AppComponent.swalConfigurado = true;
    }
}

