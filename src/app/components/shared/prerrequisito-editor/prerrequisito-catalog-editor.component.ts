import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    PrerequisiteCatalogItem,
    PrerequisiteEditorDefinition,
    PrerequisiteRowModel,
} from './prerrequisito-editor.models';

@Component({
    selector: 'app-prerrequisito-catalog-editor',
    templateUrl: './prerrequisito-catalog-editor.component.html',
    styleUrls: ['./prerrequisito-row-editor.component.sass'],
    standalone: false,
})
export class PrerrequisitoCatalogEditorComponent {
    @Input() row!: PrerequisiteRowModel;
    @Input() definition!: PrerequisiteEditorDefinition;
    @Input() catalog: PrerequisiteCatalogItem[] = [];
    @Input() disabled: boolean = false;

    @Output() patchChange = new EventEmitter<Partial<PrerequisiteRowModel>>();
}
