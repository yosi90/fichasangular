import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PrerequisiteRowModel } from './prerrequisito-editor.models';

@Component({
    selector: 'app-prerrequisito-flag-editor',
    templateUrl: './prerrequisito-flag-editor.component.html',
    styleUrls: ['./prerrequisito-row-editor.component.sass'],
    standalone: false,
})
export class PrerrequisitoFlagEditorComponent {
    @Input() row!: PrerequisiteRowModel;
    @Input() disabled: boolean = false;

    @Output() patchChange = new EventEmitter<Partial<PrerequisiteRowModel>>();
}
