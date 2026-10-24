import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Manual } from 'src/app/interfaces/manual';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

type ManualAutocompleteOption = Manual | string;

@Component({
    selector: 'app-manual-autocomplete',
    templateUrl: './manual-autocomplete.component.html',
    styleUrls: ['./manual-autocomplete.component.sass'],
    standalone: false
})
export class ManualAutocompleteComponent implements OnChanges {
    @Input() label = 'Manual';
    @Input() manuales: ManualAutocompleteOption[] = [];
    @Input() value: string | number | null = 'Cualquiera';
    @Input() includeAny = true;
    @Input() anyLabel = 'Cualquiera';
    @Input() anyValue: string | number = 'Cualquiera';
    @Input() clearValue: string | number = 'Cualquiera';
    @Input() valueMode: 'name' | 'id' = 'name';
    @Input() disabled = false;
    @Input() placeholder = 'Buscar manual';

    @Output() valueChange = new EventEmitter<string | number>();
    @Output() selectionChange = new EventEmitter<string | number>();

    searchText = '';

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['value'] || changes['manuales'] || changes['includeAny'] || changes['anyLabel'] || changes['anyValue'])
            this.syncSearchTextFromValue();
    }

    get opcionesFiltradas(): ManualAutocompleteOption[] {
        const query = normalizarTexto(this.searchText, true);
        return [...(Array.isArray(this.manuales) ? this.manuales : [])]
            .filter((manual) => !this.esOpcionAnyDuplicada(manual))
            .filter((manual) => query.length < 1 || normalizarTexto(this.getOptionLabel(manual), true).includes(query))
            .slice(0, 40);
    }

    onInput(value: string): void {
        this.searchText = value ?? '';
        if (!this.valorActualCoincideConTexto()) {
            this.emitValue(this.clearValue, false);
        }
    }

    seleccionar(value: string | number): void {
        this.emitValue(value, true);
        this.syncSearchTextFromValue();
    }

    limpiar(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.emitValue(this.clearValue, true);
        this.syncSearchTextFromValue();
    }

    onBlur(): void {
        this.syncSearchTextFromValue();
    }

    hasValue(): boolean {
        return normalizarTexto(this.searchText, true).length > 0 && `${this.value ?? ''}` !== `${this.clearValue ?? ''}`;
    }

    getOptionValue(manual: ManualAutocompleteOption): string | number {
        if (this.valueMode === 'id' && typeof manual !== 'string')
            return Number(manual?.Id ?? 0);
        return this.getOptionLabel(manual);
    }

    getOptionLabel(manual: ManualAutocompleteOption): string {
        return typeof manual === 'string'
            ? manual
            : `${manual?.Nombre ?? ''}`.trim();
    }

    trackByOption = (_: number, manual: ManualAutocompleteOption): string | number => {
        return this.getOptionValue(manual);
    };

    private emitValue(value: string | number, notifySelection: boolean): void {
        if (`${this.value ?? ''}` !== `${value ?? ''}`) {
            this.value = value;
            this.valueChange.emit(value);
        }
        if (notifySelection)
            this.selectionChange.emit(value);
    }

    private syncSearchTextFromValue(): void {
        if (this.includeAny && `${this.value ?? ''}` === `${this.anyValue ?? ''}`) {
            this.searchText = this.anyLabel;
            return;
        }

        const option = this.findOptionByValue(this.value);
        this.searchText = option ? this.getOptionLabel(option) : '';
    }

    private findOptionByValue(value: string | number | null): ManualAutocompleteOption | undefined {
        return (this.manuales ?? []).find((manual) => `${this.getOptionValue(manual)}` === `${value ?? ''}`);
    }

    private valorActualCoincideConTexto(): boolean {
        if (this.includeAny && `${this.value ?? ''}` === `${this.anyValue ?? ''}`)
            return normalizarTexto(this.searchText, true) === normalizarTexto(this.anyLabel, true);
        const option = this.findOptionByValue(this.value);
        return !!option && normalizarTexto(this.searchText, true) === normalizarTexto(this.getOptionLabel(option), true);
    }

    private esOpcionAnyDuplicada(manual: ManualAutocompleteOption): boolean {
        return this.includeAny && `${this.getOptionValue(manual)}` === `${this.anyValue}`;
    }

}
