import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
    PrerequisiteCatalogContext,
    PrerequisiteGroupModel,
    PrerequisiteRowModel,
    PrerequisiteType,
} from './prerrequisito-editor.models';
import {
    getPrerequisiteDefinition,
    syncPrerequisiteRows,
    updatePrerequisiteRow,
} from './prerrequisito-editor.registry';

@Component({
    selector: 'app-prerrequisito-editor-host',
    templateUrl: './prerrequisito-editor-host.component.html',
    styleUrls: ['./prerrequisito-editor-host.component.sass'],
    standalone: false,
})
export class PrerrequisitoEditorHostComponent implements OnChanges {
    @Input() selectedTypes: PrerequisiteType[] = [];
    @Input() rows: PrerequisiteRowModel[] = [];
    @Input() catalogContext!: PrerequisiteCatalogContext;
    @Input() disabled: boolean = false;
    @Input() emptyMessage: string = 'Marca los prerrequisitos aplicables y despues configura sus valores.';
    @Input() loadingMessage: string = 'Cargando configuracion de prerrequisitos...';
    @Input() ensureCatalogs: ((types: PrerequisiteType[]) => Promise<void>) | null = null;

    @Output() selectedTypesChange = new EventEmitter<PrerequisiteType[]>();
    @Output() rowsChange = new EventEmitter<PrerequisiteRowModel[]>();

    groupedRows: PrerequisiteGroupModel[] = [];
    loading: boolean = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedTypes'] || changes['rows'])
            this.rebuildGroups();
    }

    async prepareTypes(types: PrerequisiteType[]): Promise<void> {
        const nextTypes = [...types];
        this.loading = true;

        try {
            if (this.ensureCatalogs)
                await this.ensureCatalogs(nextTypes);

            const nextRows = syncPrerequisiteRows(this.rows, nextTypes);
            this.selectedTypesChange.emit(nextTypes);
            this.rowsChange.emit(nextRows);
            this.rows = nextRows;
            this.selectedTypes = nextTypes;
            this.rebuildGroups();
        } finally {
            this.loading = false;
        }
    }

    addRow(type: PrerequisiteType): void {
        const definition = getPrerequisiteDefinition(type);
        const nextRows = [...this.rows, definition.createDefaultRow()];
        this.emitRows(nextRows);
    }

    removeRow(uid: string): void {
        const row = this.rows.find((item) => item.uid === uid);
        if (!row)
            return;

        const nextRows = this.rows.filter((item) => item.uid !== uid);
        const nextSelectedTypes = nextRows.some((item) => item.tipo === row.tipo)
            ? [...this.selectedTypes]
            : this.selectedTypes.filter((type) => type !== row.tipo);

        this.selectedTypes = nextSelectedTypes;
        this.rows = nextRows;
        this.selectedTypesChange.emit(nextSelectedTypes);
        this.rowsChange.emit(nextRows);
        this.rebuildGroups();
    }

    updateRow(uid: string, patch: Partial<PrerequisiteRowModel>): void {
        if (!this.catalogContext)
            return;
        const nextRows = updatePrerequisiteRow(this.rows, uid, patch, this.catalogContext);
        this.emitRows(nextRows);
    }

    getCatalog(type: PrerequisiteType) {
        return this.catalogContext?.getCatalog(type) ?? [];
    }

    getDoteExtraOptions(idDote: number) {
        return this.catalogContext?.getDoteExtraOptions(idDote) ?? [];
    }

    trackByGroup(_: number, group: PrerequisiteGroupModel): string {
        return group.type;
    }

    trackByRow(_: number, row: PrerequisiteRowModel): string {
        return row.uid;
    }

    private emitRows(nextRows: PrerequisiteRowModel[]): void {
        this.rows = nextRows;
        this.rowsChange.emit(nextRows);
        this.rebuildGroups();
    }

    private rebuildGroups(): void {
        this.groupedRows = this.selectedTypes.map((type) => {
            const definition = getPrerequisiteDefinition(type);
            return {
                type,
                label: definition.label,
                definition,
                rows: this.rows.filter((row) => row.tipo === type),
            };
        });
    }
}
