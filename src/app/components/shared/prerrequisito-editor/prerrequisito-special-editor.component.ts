import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    PrerequisiteCatalogItem,
    PrerequisiteEditorDefinition,
    PrerequisiteRowModel,
} from './prerrequisito-editor.models';

@Component({
    selector: 'app-prerrequisito-special-editor',
    templateUrl: './prerrequisito-special-editor.component.html',
    styleUrls: ['./prerrequisito-row-editor.component.sass'],
    standalone: false,
})
export class PrerrequisitoSpecialEditorComponent {
    @Input() row!: PrerequisiteRowModel;
    @Input() definition!: PrerequisiteEditorDefinition;
    @Input() catalog: PrerequisiteCatalogItem[] = [];
    @Input() doteExtraOptions: PrerequisiteCatalogItem[] = [];
    @Input() globalExtraOptions: PrerequisiteCatalogItem[] = [];
    @Input() allowExtraSelector: boolean = false;
    @Input() extraDisabledMessage: string = 'Esta habilidad no puede tener extras.';
    @Input() disabled: boolean = false;

    @Output() patchChange = new EventEmitter<Partial<PrerequisiteRowModel>>();

    get extraOptions(): PrerequisiteCatalogItem[] {
        return this.definition.supportsCatalogExtraOptions ? this.doteExtraOptions : this.globalExtraOptions;
    }

    get showExtraSelector(): boolean {
        if (!this.definition.supportsExtraSelector)
            return false;
        return this.allowExtraSelector;
    }

    get showExtraDisabledMessage(): boolean {
        return !!this.definition.supportsExtraSelector
            && !this.definition.supportsCatalogExtraOptions
            && this.row.id > 0
            && !this.allowExtraSelector;
    }
}
