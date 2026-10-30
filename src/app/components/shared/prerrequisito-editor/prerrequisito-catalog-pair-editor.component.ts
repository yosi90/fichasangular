import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    PrerequisiteCatalogItem,
    PrerequisiteEditorDefinition,
    PrerequisiteRowModel,
} from './prerrequisito-editor.models';

/**
 * Una fila con dos elementos del mismo catálogo: el que se pide (`id`) y en qué se convierte (`id_destino`). Es la de
 * `criaturas_compatibles` de las plantillas: el tipo de criatura al que se aplica y el que tiene después; el 0 del
 * segundo es «cualquiera», la criatura conserva su tipo (`Tipo_nuevo_comodin` del contrato).
 */
@Component({
    selector: 'app-prerrequisito-catalog-pair-editor',
    templateUrl: './prerrequisito-catalog-pair-editor.component.html',
    styleUrls: ['./prerrequisito-row-editor.component.sass'],
    standalone: false,
})
export class PrerrequisitoCatalogPairEditorComponent {
    @Input() row!: PrerequisiteRowModel;
    @Input() definition!: PrerequisiteEditorDefinition;
    @Input() catalog: PrerequisiteCatalogItem[] = [];
    @Input() disabled: boolean = false;

    @Output() patchChange = new EventEmitter<Partial<PrerequisiteRowModel>>();

    /** El 0 del segundo: la criatura no cambia de tipo (lo que la frase de la API llama «conserva su tipo»). */
    readonly nombreSinCambio = 'Conserva su tipo';

    /** Lo que se pide: sin el 0, que no es un tipo. */
    get origenes(): PrerequisiteCatalogItem[] {
        return this.catalog.filter((item) => item.id > 0);
    }
}
