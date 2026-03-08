import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    PrerequisiteCatalogItem,
    PrerequisiteEditorDefinition,
    PrerequisiteRowModel,
} from './prerrequisito-editor.models';

@Component({
    selector: 'app-prerrequisito-catalog-value-editor',
    templateUrl: './prerrequisito-catalog-value-editor.component.html',
    styleUrls: ['./prerrequisito-row-editor.component.sass'],
    standalone: false,
})
export class PrerrequisitoCatalogValueEditorComponent {
    @Input() row!: PrerequisiteRowModel;
    @Input() definition!: PrerequisiteEditorDefinition;
    @Input() catalog: PrerequisiteCatalogItem[] = [];
    @Input() disabled: boolean = false;
    @Input() allowRequiresExtra: boolean = false;

    @Output() patchChange = new EventEmitter<Partial<PrerequisiteRowModel>>();

    readonly salvacionesCatalogo: Array<{ key: 'fortaleza' | 'reflejos' | 'voluntad'; label: string; }> = [
        { key: 'fortaleza', label: 'Fortaleza' },
        { key: 'reflejos', label: 'Reflejos' },
        { key: 'voluntad', label: 'Voluntad' },
    ];
}
