import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { AccountRestrictionOpenRequest } from 'src/app/interfaces/user-account';
import { UserBanStatus } from 'src/app/interfaces/user-moderation';
import { UserService } from 'src/app/services/user.service';

@Component({
    selector: 'app-account-restriction-tab',
    templateUrl: './account-restriction-tab.component.html',
    styleUrls: ['./account-restriction-tab.component.sass'],
    standalone: false,
})
export class AccountRestrictionTabComponent implements OnInit, OnDestroy {
    @Input() openRequest: AccountRestrictionOpenRequest | null = null;

    banStatus: UserBanStatus | null = null;
    currentTimeMs = Date.now();
    private readonly subscription = new Subscription();
    private refreshTriggered = false;

    constructor(private userSvc: UserService) { }

    ngOnInit(): void {
        this.subscription.add(
            this.userSvc.banStatus$.subscribe((status) => {
                this.banStatus = status;
                if (status.restriction === 'temporaryBan' && (status.expiresInMs ?? 0) > 0)
                    this.refreshTriggered = false;
            })
        );
        this.subscription.add(
            interval(1000).subscribe(() => {
                this.currentTimeMs = Date.now();
                void this.tryRefreshWhenExpired();
            })
        );
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    get isTemporaryBan(): boolean {
        return this.banStatus?.restriction === 'temporaryBan';
    }

    get isPermanentBan(): boolean {
        return this.banStatus?.restriction === 'permanentBan';
    }

    get hasRestriction(): boolean {
        return this.isTemporaryBan || this.isPermanentBan;
    }

    get countdownLabel(): string {
        if (!this.isTemporaryBan)
            return 'Sin cuenta atrás activa';

        const remainingMs = this.remainingMs;
        if (remainingMs <= 0)
            return 'La restricción debería caducar en breve. Actualizando estado...';

        const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const timeLabel = `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`;
        return days > 0 ? `${days}d ${timeLabel}` : timeLabel;
    }

    get remainingMs(): number {
        if (!this.isTemporaryBan)
            return 0;
        const endsAtMs = this.endsAtMs;
        if (endsAtMs <= 0)
            return 0;
        return Math.max(0, endsAtMs - this.currentTimeMs);
    }

    get restrictionReason(): string {
        const label = `${this.banStatus?.sanction?.name ?? this.banStatus?.sanction?.code ?? this.banStatus?.sanction?.kind ?? ''}`.trim();
        return label.length > 0 ? label : 'Restricción de cuenta activa';
    }

    get endsAtLabel(): string {
        if (!this.isTemporaryBan)
            return 'Permanente';
        const endsAtMs = this.endsAtMs;
        if (endsAtMs <= 0)
            return 'Fecha no disponible';

        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(endsAtMs).replace(',', '');
    }

    private get endsAtMs(): number {
        const raw = `${this.banStatus?.endsAtUtc ?? ''}`.trim();
        if (raw.length < 1)
            return 0;
        const parsed = new Date(raw).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private async tryRefreshWhenExpired(): Promise<void> {
        if (!this.isTemporaryBan || this.refreshTriggered || this.remainingMs > 0)
            return;

        this.refreshTriggered = true;
        try {
            await this.userSvc.refreshCurrentPrivateProfile();
        } catch {
            this.refreshTriggered = false;
        }
    }
}
