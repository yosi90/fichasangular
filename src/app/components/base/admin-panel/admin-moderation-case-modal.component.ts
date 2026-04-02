import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
    AdminModerationCaseModalMode,
    AdminModerationCaseModalSubmit,
    ModerationCaseListItemDto,
    ModerationCasePatchRequestDto,
    ModerationCaseSourceMode,
    ModerationCaseStageDto,
    ModerationCaseStageUpsertDto,
} from 'src/app/interfaces/usuarios-api';

interface ModerationCaseStageDraft {
    reportThreshold: number | null;
    isPermanent: boolean;
    durationMinutes: number | null;
}

@Component({
    selector: 'app-admin-moderation-case-modal',
    templateUrl: './admin-moderation-case-modal.component.html',
    styleUrls: ['./admin-moderation-case-modal.component.sass'],
    standalone: false
})
export class AdminModerationCaseModalComponent implements OnChanges {
    @Input() mode: AdminModerationCaseModalMode = 'create';
    @Input() item: ModerationCaseListItemDto | null = null;
    @Input() saving: boolean = false;

    @Output() closeRequested = new EventEmitter<void>();
    @Output() saveRequested = new EventEmitter<AdminModerationCaseModalSubmit>();

    readonly sourceModeOptions: readonly ModerationCaseSourceMode[] = ['manual_only', 'technical_signal_auto'];

    code = '';
    name = '';
    description = '';
    sourceMode: ModerationCaseSourceMode = 'manual_only';
    enabled = true;
    stages: ModerationCaseStageDraft[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['mode'] || changes['item'])
            this.resetForm();
    }

    get isCreateMode(): boolean {
        return this.mode === 'create';
    }

    get isSystemSeed(): boolean {
        return this.item?.originType === 'system_seed';
    }

    get modalTitle(): string {
        return this.isCreateMode ? 'Nuevo supuesto moderable' : 'Modificar supuesto moderable';
    }

    get modalSubtitle(): string {
        if (this.isCreateMode)
            return 'Crea un caso manual y define su escalera de reincidencia.';
        return `${this.item?.code ?? this.item?.name ?? 'Caso'} · ${this.originTypeLabel}`;
    }

    get originTypeLabel(): string {
        if (this.isSystemSeed)
            return 'Caso seed del sistema';
        if (this.item?.originType === 'admin_custom')
            return 'Caso custom admin';
        return 'Caso moderable';
    }

    get sourceModeLocked(): boolean {
        return this.isCreateMode || this.isSystemSeed;
    }

    get identityLocked(): boolean {
        return this.isSystemSeed;
    }

    get canSave(): boolean {
        if (this.saving)
            return false;
        if (!this.isCreateMode && (!this.item || this.item.caseId < 1 || this.item.isDeleted))
            return false;
        if (this.code.trim().length < 1 || this.name.trim().length < 1 || this.description.trim().length < 1)
            return false;
        if (!this.sourceModeLocked && !this.isValidSourceMode(this.sourceMode))
            return false;
        return this.buildStages().length > 0;
    }

    get hasValidStages(): boolean {
        return this.buildStages().length > 0;
    }

    sourceModeLabel(value: ModerationCaseSourceMode | null | undefined): string {
        return value === 'technical_signal_auto' ? 'Señal técnica automática' : 'Manual admin';
    }

    stageDurationHint(stage: ModerationCaseStageDraft): string {
        if (stage.isPermanent)
            return 'La sanción de esta etapa será permanente.';
        const minutes = Math.trunc(Number(stage.durationMinutes));
        if (!Number.isFinite(minutes) || minutes < 1)
            return 'Indica una duración válida en minutos.';
        if (minutes % (24 * 60) === 0) {
            const days = minutes / (24 * 60);
            return `${days} día${days === 1 ? '' : 's'}`;
        }
        if (minutes % 60 === 0) {
            const hours = minutes / 60;
            return `${hours} hora${hours === 1 ? '' : 's'}`;
        }
        return `${minutes} minuto${minutes === 1 ? '' : 's'}`;
    }

    onBackdropClose(): void {
        if (!this.saving)
            this.closeRequested.emit();
    }

    addStage(): void {
        if (this.saving)
            return;

        this.stages = [
            ...this.stages,
            this.createDefaultStage(),
        ];
    }

    removeStage(index: number): void {
        if (this.saving || this.stages.length <= 1)
            return;

        this.stages = this.stages.filter((_, currentIndex) => currentIndex !== index);
    }

    onStagePermanentChange(index: number, checked: boolean): void {
        const current = this.stages[index];
        if (!current)
            return;

        const next = [...this.stages];
        next[index] = {
            ...current,
            isPermanent: checked,
            durationMinutes: checked ? null : (current.durationMinutes && current.durationMinutes > 0 ? current.durationMinutes : 60),
        };
        this.stages = next;
    }

    onSave(): void {
        if (!this.canSave)
            return;

        const stages = this.buildStages();
        if (stages.length < 1)
            return;

        const description = this.description.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
        const code = this.code.trim();
        const name = this.name.trim();

        if (this.isCreateMode) {
            this.saveRequested.emit({
                mode: 'create',
                createRequest: {
                    code,
                    name,
                    description,
                    sourceMode: 'manual_only',
                    enabled: this.enabled,
                    stages,
                },
            });
            return;
        }

        if (!this.item)
            return;

        const patchRequest: ModerationCasePatchRequestDto = this.isSystemSeed
            ? {
                description,
                enabled: this.enabled,
            }
            : {
                code,
                name,
                description,
                sourceMode: this.sourceMode,
                enabled: this.enabled,
            };

        this.saveRequested.emit({
            mode: 'edit',
            caseId: this.item.caseId,
            patchRequest,
            stagesRequest: { stages },
        });
    }

    private resetForm(): void {
        if (this.isCreateMode || !this.item) {
            this.code = '';
            this.name = '';
            this.description = '';
            this.sourceMode = 'manual_only';
            this.enabled = true;
            this.stages = [this.createDefaultStage()];
            return;
        }

        this.code = `${this.item.code ?? ''}`.trim();
        this.name = `${this.item.name ?? ''}`.trim();
        this.description = `${this.item.description ?? ''}`.trim();
        this.sourceMode = this.item.sourceMode === 'technical_signal_auto' ? 'technical_signal_auto' : 'manual_only';
        this.enabled = this.item.enabled !== false;
        this.stages = this.item.stages.length > 0
            ? this.item.stages.map((stage) => this.toStageDraft(stage))
            : [this.createDefaultStage()];
    }

    private buildStages(): ModerationCaseStageUpsertDto[] {
        return this.stages
            .map((stage, index) => this.normalizeStage(stage, index))
            .filter((stage): stage is ModerationCaseStageUpsertDto => !!stage);
    }

    private normalizeStage(stage: ModerationCaseStageDraft, index: number): ModerationCaseStageUpsertDto | null {
        const reportThreshold = Math.trunc(Number(stage.reportThreshold));
        if (!Number.isFinite(reportThreshold) || reportThreshold < 1)
            return null;

        if (stage.isPermanent) {
            return {
                stageIndex: index + 1,
                reportThreshold,
                isPermanent: true,
                durationMinutes: null,
            };
        }

        const durationMinutes = Math.trunc(Number(stage.durationMinutes));
        if (!Number.isFinite(durationMinutes) || durationMinutes < 1)
            return null;

        return {
            stageIndex: index + 1,
            reportThreshold,
            isPermanent: false,
            durationMinutes,
        };
    }

    private toStageDraft(stage: ModerationCaseStageDto): ModerationCaseStageDraft {
        return {
            reportThreshold: stage.reportThreshold ?? 1,
            isPermanent: stage.isPermanent === true,
            durationMinutes: stage.isPermanent === true ? null : (stage.durationMinutes ?? 60),
        };
    }

    private createDefaultStage(): ModerationCaseStageDraft {
        return {
            reportThreshold: 1,
            isPermanent: false,
            durationMinutes: 60,
        };
    }

    private isValidSourceMode(value: string | null | undefined): value is ModerationCaseSourceMode {
        return value === 'manual_only' || value === 'technical_signal_auto';
    }
}
