import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, fromEvent, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { CampaignRealtimeSyncService } from './services/campaign-realtime-sync.service';
import { CampaignSpacesBridgeService } from './services/campaign-spaces-bridge.service';
import { ChatFloatingService } from './services/chat-floating.service';
import { FirebaseSessionBridgeService } from './services/firebase-session-bridge.service';
import { PlatformSessionService } from './services/platform-session.service';
import { toUserFacingErrorMessage } from './services/utils/user-facing-error.util';
import { compararTexto } from 'src/app/services/utils/orden-texto';

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
        private campaignRealtimeSyncSvc: CampaignRealtimeSyncService,
        private platformSessionSvc: PlatformSessionService,
        private firebaseSessionBridgeSvc: FirebaseSessionBridgeService,
        private chatFloatingSvc: ChatFloatingService,
        private campaignSpacesBridgeSvc: CampaignSpacesBridgeService,
    ) { }

    async ngOnInit(): Promise<void> {
        this.configurarSwalGlobal();
        this.firebaseSessionBridgeSvc.iniciar();
        this.platformSessionSvc.iniciar();
        this.campaignRealtimeSyncSvc.init();
        this.chatFloatingSvc.init();
        this.campaignSpacesBridgeSvc.init();
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
        return ChatFloatingService.esEscritorio(this.width, this.height);
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
            const normalizedArgs = args;

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
            || compararTexto(normalizedTitle, 'error') === 0
            || compararTexto(normalizedTitle, 'warning') === 0
            || compararTexto(normalizedTitle, 'aviso') === 0;

        if (!genericTitle)
            return normalizedTitle.endsWith('.') ? normalizedTitle : `${normalizedTitle}.`;
        if (normalizedIcon === 'success')
            return 'Acción completada.';
        if (normalizedIcon === 'info')
            return 'Hay un aviso para revisar.';
        return 'No se pudo completar la acción.';
    }
}

