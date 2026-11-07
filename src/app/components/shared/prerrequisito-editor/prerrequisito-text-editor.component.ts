import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PrerequisiteEditorDefinition, PrerequisiteRowModel } from './prerrequisito-editor.models';

/** Una fila de un tipo que pide un texto (la condición que confirma el máster de una raza mutada). */
@Component({
    selector: 'app-prerrequisito-text-editor',
    templateUrl: './prerrequisito-text-editor.component.html',
    styleUrls: ['./prerrequisito-row-editor.component.sass'],
    standalone: false,
})
export class PrerrequisitoTextEditorComponent {
    @Input() row!: PrerequisiteRowModel;
    @Input() definition!: PrerequisiteEditorDefinition;
    @Input() disabled: boolean = false;

    @Output() patchChange = new EventEmitter<Partial<PrerequisiteRowModel>>();
}
