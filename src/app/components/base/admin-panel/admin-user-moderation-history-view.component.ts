import { Component, Input } from '@angular/core';
import { UserModerationHistoryResult, UserModerationSanction } from 'src/app/interfaces/user-moderation';
import { ModerationAdminHistoryItemDto, ModerationAdminHistoryResponseDto, ModerationProgressCaseDto, UsuarioAclResponseDto } from 'src/app/interfaces/usuarios-api';
import { AuthProviderType } from 'src/app/interfaces/user-profile';
import { UserRole } from 'src/app/interfaces/user-acl';

@Component({
    selector: 'app-admin-user-moderation-history-view',
    templateUrl: './admin-user-moderation-history-view.component.html',
    styleUrls: ['./admin-user-moderation-history-view.component.sass'],
    standalone: false
})
export class AdminUserModerationHistoryViewComponent {
    @Input() preview: UsuarioAclResponseDto | null = null;
    @Input() history: ModerationAdminHistoryResponseDto | null = null;
    @Input() loading: boolean = false;
    @Input() statusLabel: string = '';

    private readonly dateFormatter = new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    get hasContent(): boolean {
        return !!this.preview || !!this.history;
    }

    get progressItems(): ModerationProgressCaseDto[] {
        return this.history?.progressByCase ?? [];
    }

    get historyItems(): ModerationAdminHistoryItemDto[] {
        return this.history?.items ?? [];
    }

    roleLabel(role: UserRole | null | undefined): string {
        if (role === 'admin')
            return 'Admin';
        if (role === 'colaborador')
            return 'Colaborador';
        if (role === 'master')
            return 'Master';
        if (role === 'jugador')
            return 'Jugador';
        return 'Sin rol';
    }

    authProviderLabel(provider: AuthProviderType | null | undefined): string {
        const normalized = `${provider ?? ''}`.trim().toLowerCase();
        if (normalized === 'password' || normalized === 'correo')
            return 'Correo';
        if (normalized === 'google')
            return 'Google';
        return normalized.length > 0 ? normalized : 'Sin proveedor';
    }

    moderationResultLabel(result: UserModerationHistoryResult | null | undefined): string {
        if (result === 'reported')
            return 'Reportada';
        if (result === 'sanctioned')
            return 'Sancionada';
        if (result === 'banned')
            return 'Ban efectivo';
        return 'Sin resultado';
    }

    moderationModeLabel(mode: string | null | undefined): string {
        const normalized = `${mode ?? ''}`.trim().toLowerCase();
        if (normalized === 'force_sanction')
            return 'Sanción forzada';
        if (normalized === 'report')
            return 'Reporte';
        if (normalized === 'technical_signal_auto')
            return 'Señal técnica';
        return normalized.length > 0 ? normalized : 'Sin modo';
    }

    moderationProgressLabel(item: ModerationProgressCaseDto): string {
        const stage = item.currentStageIndex !== null ? `Etapa ${item.currentStageIndex}` : 'Etapa n/d';
        const pending = item.pendingReports !== null ? `${item.pendingReports} pendientes` : 'pendientes n/d';
        const sanction = item.activeSanction ? ` · ${this.moderationSanctionLabel(item.activeSanction)}` : '';
        return `${stage} · ${pending}${sanction}`;
    }

    moderationSanctionLabel(sanction: UserModerationSanction | null | undefined): string {
        if (!sanction)
            return 'Sin sanción';

        const label = `${sanction.name ?? sanction.code ?? sanction.kind ?? 'Sanción'}`.trim();
        if (sanction.isPermanent)
            return `${label} permanente`;
        if (`${sanction.endsAtUtc ?? ''}`.trim().length > 0)
            return `${label} hasta ${this.formatearFechaUtc(sanction.endsAtUtc, 'fecha no disponible')}`;
        return label;
    }

    moderationHistoryDetailLabel(item: ModerationAdminHistoryItemDto): string {
        const details: string[] = [];
        if (`${item.clientDate ?? ''}`.trim().length > 0)
            details.push(`Cliente: ${item.clientDate}`);
        if (item.localBlockCountToday !== null)
            details.push(`Bloqueos día: ${item.localBlockCountToday}`);
        if (item.triggeredStageIndex !== null)
            details.push(`Etapa disparada: ${item.triggeredStageIndex}`);
        if (item.triggeredSanctionId !== null)
            details.push(`Sanción: #${item.triggeredSanctionId}`);
        return details.join(' · ');
    }

    moderationObjectPreview(value: Record<string, any> | null | undefined): string {
        if (!value)
            return '';

        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return '';
        }
    }

    formatearFechaUtc(value: string | null | undefined, fallback: string = 'Sin dato'): string {
        const text = `${value ?? ''}`.trim();
        if (text.length < 1)
            return fallback;

        const parsed = new Date(text);
        if (Number.isNaN(parsed.getTime()))
            return fallback;
        return this.dateFormatter.format(parsed).replace(',', '');
    }

    trackByModerationProgress(index: number, item: ModerationProgressCaseDto): string {
        return `${item?.caseId ?? index}:${item?.caseCode ?? ''}`;
    }

    trackByModerationHistory(index: number, item: ModerationAdminHistoryItemDto): string {
        return `${item?.incidentId ?? index}`;
    }
}
