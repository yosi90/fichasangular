import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    PrerequisiteCatalogItem,
    PrerequisiteEditorDefinition,
    PrerequisiteRowModel,
} from './prerrequisito-editor.models';

/** El valor del selector para el comodín 0 del catálogo (el 0 es «Seleccionar…», sin elegir). */
export const VALOR_COMODIN = 'comodin';

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

    readonly valorComodin = VALOR_COMODIN;

    get valorSeleccionado(): number | string {
        return this.row.comodin === true ? VALOR_COMODIN : this.row.id;
    }

    elegir(valor: number | string): void {
        this.patchChange.emit(valor === VALOR_COMODIN ? { id: 0, comodin: true } : { id: Number(valor), comodin: false });
    }
}
