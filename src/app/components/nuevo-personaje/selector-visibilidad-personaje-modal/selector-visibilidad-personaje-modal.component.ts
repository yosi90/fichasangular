import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-selector-visibilidad-personaje-modal',
    templateUrl: './selector-visibilidad-personaje-modal.component.html',
    styleUrls: ['./selector-visibilidad-personaje-modal.component.sass']
})
export class SelectorVisibilidadPersonajeModalComponent implements OnChanges {
    @Input() seleccionInicial: boolean | null = null;
    @Input() bloqueado = false;

    @Output() confirmar = new EventEmitter<boolean>();
    @Output() cerrar = new EventEmitter<void>();

    seleccion: boolean | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['seleccionInicial'])
            this.seleccion = this.seleccionInicial;
    }

    get puedeConfirmar(): boolean {
        return !this.bloqueado && this.seleccion !== null;
    }

    onSeleccionar(visibleOtros: boolean): void {
        if (this.bloqueado)
            return;
        this.seleccion = visibleOtros;
    }

    onConfirmar(): void {
        if (this.bloqueado)
            return;
        if (this.seleccion === null)
            return;
        this.confirmar.emit(this.seleccion);
    }

    onCerrar(): void {
        if (this.bloqueado)
            return;
        this.cerrar.emit();
    }

    @HostListener('document:keydown.enter', ['$event'])
    onEnterPresionado(event: KeyboardEvent): void {
        if (this.bloqueado)
            return;
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
