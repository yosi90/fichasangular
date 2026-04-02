import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ModerationCaseListItemDto, ModerationIncidentCreateRequestDto } from 'src/app/interfaces/usuarios-api';
import { AdminUserRow } from 'src/app/services/admin-users.service';

type SanctionDurationPreset = '24h' | '72h' | '7d' | '30d' | 'permanent' | 'custom';
type SanctionCustomMode = 'datetime' | 'minutes';

@Component({
    selector: 'app-admin-user-sanction-modal',
    templateUrl: './admin-user-sanction-modal.component.html',
    styleUrls: ['./admin-user-sanction-modal.component.sass'],
    standalone: false
})
export class AdminUserSanctionModalComponent implements OnChanges {
    @Input() user: AdminUserRow | null = null;
    @Input() cases: readonly ModerationCaseListItemDto[] = [];
    @Input() saving: boolean = false;

    @Output() closeRequested = new EventEmitter<void>();
    @Output() submitRequested = new EventEmitter<ModerationIncidentCreateRequestDto>();

    selectedCaseCode = '';
    internalDescription = '';
    userVisibleMessage = '';
    durationPreset: SanctionDurationPreset = '7d';
    customMode: SanctionCustomMode = 'minutes';
    customEndsAtLocal = '';
    customMinutes: number | null = 60;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['user'])
            this.resetForm();

        if (changes['cases'] && !this.selectedCase)
            this.selectedCaseCode = this.availableCases[0]?.code ?? '';
    }

    get availableCases(): ModerationCaseListItemDto[] {
        return (this.cases ?? []).filter((item) => {
            if (!item || item.deleted === true)
                return false;
            const sourceMode = `${item.sourceMode ?? ''}`.trim().toLowerCase();
            return sourceMode !== 'technical_signal_auto';
        });
    }

    get selectedCase(): ModerationCaseListItemDto | null {
        return this.availableCases.find((item) => item.code === this.selectedCaseCode) ?? null;
    }

    get effectiveDurationLabel(): string {
        if (this.durationPreset === 'permanent')
            return 'Permanente';

        const endsAtUtc = this.resolveEndsAtUtc();
        if (!endsAtUtc)
            return 'Sin duración válida';

        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date(endsAtUtc)).replace(',', '');
    }

    get localTimeZoneLabel(): string {
        const offsetDate = this.isCustomDateTimeMode
            ? this.parseLocalDateTimeInput(this.customEndsAtLocal)
            : new Date();
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Zona local';
        const offsetMinutes = Number.isNaN(offsetDate.getTime()) ? -new Date().getTimezoneOffset() : -offsetDate.getTimezoneOffset();
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const absoluteMinutes = Math.abs(offsetMinutes);
        const hours = `${Math.floor(absoluteMinutes / 60)}`.padStart(2, '0');
        const minutes = `${absoluteMinutes % 60}`.padStart(2, '0');
        return `${zone} (UTC${sign}${hours}:${minutes})`;
    }

    get canSubmit(): boolean {
        return !!this.user
            && this.selectedCaseCode.trim().length > 0
            && this.internalDescription.trim().length > 0
            && this.userVisibleMessage.trim().length > 0
            && (this.durationPreset === 'permanent' || !!this.resolveEndsAtUtc())
            && !this.saving;
    }

    get isCustomDateTimeMode(): boolean {
        return this.durationPreset === 'custom' && this.customMode === 'datetime';
    }

    get isCustomMinutesMode(): boolean {
        return this.durationPreset === 'custom' && this.customMode === 'minutes';
    }

    get showCustomControls(): boolean {
        return this.durationPreset === 'custom';
    }

    caseLabel(item: ModerationCaseListItemDto): string {
        return `${item?.name ?? item?.code ?? 'Caso sin nombre'}`.trim();
    }

    stageSummary(item: ModerationCaseListItemDto | null): string {
        if (!item?.stages?.length)
            return 'Sin etapas configuradas';

        return item.stages
            .slice(0, 2)
            .map((stage) => {
                const threshold = stage.reportThreshold !== null ? `umbral ${stage.reportThreshold}` : 'umbral n/d';
                const sanction = `${stage.sanctionName ?? stage.sanctionCode ?? stage.sanctionKind ?? 'Sanción'}`.trim();
                return `Escalón configurado ${stage.stageIndex}: ${threshold} -> ${sanction}`;
            })
            .join(' · ');
    }

    onDurationPresetChange(value: SanctionDurationPreset | string): void {
        this.durationPreset = value === 'custom'
            || value === '24h'
            || value === '72h'
            || value === '7d'
            || value === '30d'
            || value === 'permanent'
            ? value
            : '7d';

        if (this.durationPreset !== 'custom')
            return;

        if (!this.customMode)
            this.customMode = 'minutes';
        if (!this.customMinutes || this.customMinutes < 1)
            this.customMinutes = 60;
        if (`${this.customEndsAtLocal ?? ''}`.trim().length < 1)
            this.customEndsAtLocal = this.toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000));
    }

    onBackdropClose(): void {
        if (!this.saving)
            this.closeRequested.emit();
    }

    onSubmit(): void {
        if (!this.canSubmit || !this.user)
            return;

        const payload: ModerationIncidentCreateRequestDto = {
            targetUid: this.user.uid,
            caseCode: this.selectedCaseCode,
            mode: 'force_sanction',
            sourceCode: 'manual_admin',
            internalDescription: this.internalDescription.trim(),
            userVisibleMessage: this.userVisibleMessage.trim(),
            sanctionOverride: this.durationPreset === 'permanent'
                ? { isPermanent: true }
                : { endsAtUtc: this.resolveEndsAtUtc() },
        };

        this.submitRequested.emit(payload);
    }

    private resetForm(): void {
        this.selectedCaseCode = this.availableCases[0]?.code ?? '';
        this.internalDescription = '';
        this.userVisibleMessage = '';
        this.durationPreset = '7d';
        this.customMode = 'minutes';
        this.customMinutes = 60;
        this.customEndsAtLocal = this.toLocalDateTimeValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }

    private resolveEndsAtUtc(): string | null {
        if (this.durationPreset === 'permanent')
            return null;

        if (this.durationPreset === 'custom') {
            if (this.customMode === 'minutes') {
                const minutes = Math.trunc(Number(this.customMinutes));
                if (!Number.isFinite(minutes) || minutes < 1)
                    return null;
                return new Date(Date.now() + minutes * 60 * 1000).toISOString();
            }

            const customValue = `${this.customEndsAtLocal ?? ''}`.trim();
            if (customValue.length < 1)
                return null;
            const parsed = this.parseLocalDateTimeInput(customValue);
            if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now())
                return null;
            return parsed.toISOString();
        }

        const hoursByPreset: Record<Exclude<SanctionDurationPreset, 'custom' | 'permanent'>, number> = {
            '24h': 24,
            '72h': 72,
            '7d': 24 * 7,
            '30d': 24 * 30,
        };
        const hours = hoursByPreset[this.durationPreset as Exclude<SanctionDurationPreset, 'custom' | 'permanent'>];
        return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }

    private toLocalDateTimeValue(value: Date): string {
        const year = value.getFullYear();
        const month = `${value.getMonth() + 1}`.padStart(2, '0');
        const day = `${value.getDate()}`.padStart(2, '0');
        const hours = `${value.getHours()}`.padStart(2, '0');
        const minutes = `${value.getMinutes()}`.padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    private parseLocalDateTimeInput(value: string): Date {
        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(`${value ?? ''}`.trim());
        if (!match)
            return new Date(NaN);

        const [, year, month, day, hours, minutes] = match;
        return new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hours),
            Number(minutes),
            0,
            0
        );
    }
}
