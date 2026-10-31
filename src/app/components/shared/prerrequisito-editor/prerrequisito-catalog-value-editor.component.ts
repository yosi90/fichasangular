import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    PrerequisiteCatalogItem,
    PrerequisiteEditorDefinition,
    PrerequisiteRowModel,
} from './prerrequisito-editor.models';
import { idsUnicosOrdenados } from 'src/app/services/utils/normalizacion';

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
    /** Los extras de la habilidad elegida, para los que pide la fila con «requiere extra». */
    @Input() extraOptions: PrerequisiteCatalogItem[] = [];

    @Output() patchChange = new EventEmitter<Partial<PrerequisiteRowModel>>();

    get muestraExtras(): boolean {
        return this.definition.supportsRequiresExtra === true && this.allowRequiresExtra && this.row.requiere_extra === true;
    }

    elegirExtras(ids: number[]): void {
        this.patchChange.emit({ extras: idsUnicosOrdenados(ids, 0) });
    }

    readonly salvacionesCatalogo: Array<{ key: 'fortaleza' | 'reflejos' | 'voluntad'; label: string; }> = [
        { key: 'fortaleza', label: 'Fortaleza' },
        { key: 'reflejos', label: 'Reflejos' },
        { key: 'voluntad', label: 'Voluntad' },
    ];
}
