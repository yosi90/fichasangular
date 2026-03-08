import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PrerequisiteEditorDefinition, PrerequisiteRowModel } from './prerrequisito-editor.models';

@Component({
    selector: 'app-prerrequisito-value-editor',
    templateUrl: './prerrequisito-value-editor.component.html',
    styleUrls: ['./prerrequisito-row-editor.component.sass'],
    standalone: false,
})
export class PrerrequisitoValueEditorComponent {
    @Input() row!: PrerequisiteRowModel;
    @Input() definition!: PrerequisiteEditorDefinition;
    @Input() disabled: boolean = false;

    @Output() patchChange = new EventEmitter<Partial<PrerequisiteRowModel>>();
}
