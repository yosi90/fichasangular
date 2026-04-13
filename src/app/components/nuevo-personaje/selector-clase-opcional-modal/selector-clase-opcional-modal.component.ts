import { Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';

export interface SelectorClaseOpcionalModalOpcion {
    clave: string;
    tipo: 'dote' | 'especial';
    nombre: string;
    extra: string;
}

@Component({
    selector: 'app-selector-clase-opcional-modal',
    templateUrl: './selector-clase-opcional-modal.component.html',
    styleUrls: ['./selector-clase-opcional-modal.component.sass'],
    standalone: false
})
export class SelectorClaseOpcionalModalComponent implements OnChanges {
    @Input() titulo = 'Grupo opcional';
    @Input() descripcion = 'Elige una opción para continuar con el nivel de clase.';
    @Input() opciones: SelectorClaseOpcionalModalOpcion[] = [];

    @Output() confirmar = new EventEmitter<string>();
    @Output() cerrar = new EventEmitter<void>();

    claveSeleccionada = '';

    ngOnChanges(): void {
        const actual = `${this.claveSeleccionada ?? ''}`.trim();
        const existe = (this.opciones ?? []).some((item) => `${item?.clave ?? ''}`.trim() === actual);
        this.claveSeleccionada = existe ? actual : '';
    }

    get puedeConfirmar(): boolean {
        const clave = `${this.claveSeleccionada ?? ''}`.trim();
        if (clave.length < 1)
            return false;
        return (this.opciones ?? []).some((item) => `${item?.clave ?? ''}`.trim() === clave);
    }

    trackByClave(_index: number, opcion: SelectorClaseOpcionalModalOpcion): string {
        return `${opcion?.clave ?? ''}`;
    }

    seleccionarOpcion(clave: string): void {
        const valor = `${clave ?? ''}`.trim();
        if (valor.length < 1)
            return;
        this.claveSeleccionada = valor;
    }

    esOpcionSeleccionada(clave: string): boolean {
        return `${clave ?? ''}`.trim() === `${this.claveSeleccionada ?? ''}`.trim();
    }

    getEtiquetaTipo(tipo: 'dote' | 'especial'): string {
        return tipo === 'dote' ? 'Dote' : 'Especial';
    }

    onConfirmar(): void {
        if (!this.puedeConfirmar)
            return;
        this.confirmar.emit(`${this.claveSeleccionada ?? ''}`.trim());
    }

    onCerrar(): void {
        this.cerrar.emit();
    }

    @HostListener('document:keydown.enter', ['$event'])
    onEnterPresionado(event: KeyboardEvent): void {
        if (event.repeat || this.esElementoInteractivoParaEnter(event.target as HTMLElement | null))
            return;
        if (!this.puedeConfirmar)
            return;

        event.preventDefault();
        this.onConfirmar();
    }

    private esElementoInteractivoParaEnter(target: HTMLElement | null): boolean {
        if (!target)
            return false;
        if (target.isContentEditable)
            return true;

        const selectorBloqueado = 'input, textarea, select, button, a, [role="button"], [role="checkbox"], [role="option"], [role="listbox"], [role="menuitem"], .cdk-overlay-pane';
        return !!target.closest(selectorBloqueado);
    }
}
