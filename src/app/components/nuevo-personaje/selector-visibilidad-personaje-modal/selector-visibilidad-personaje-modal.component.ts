import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { esElementoInteractivoParaEnter } from 'src/app/services/utils/teclado';

@Component({
    selector: 'app-selector-visibilidad-personaje-modal',
    templateUrl: './selector-visibilidad-personaje-modal.component.html',
    styleUrls: ['./selector-visibilidad-personaje-modal.component.sass'],
    standalone: false
})
export class SelectorVisibilidadPersonajeModalComponent implements OnChanges {
    @Input() seleccionInicial: boolean | null = null;
    @Input() bloqueado = false;
    /** Un PNJ nace privado (contrato de los dragones jugables): solo «Solo para mí», sin poder cambiarlo. */
    @Input() soloPrivado = false;

    @Output() confirmar = new EventEmitter<boolean>();
    @Output() cerrar = new EventEmitter<void>();

    seleccion: boolean | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['seleccionInicial'] || changes['soloPrivado'])
            this.seleccion = this.soloPrivado ? false : this.seleccionInicial;
    }

    get puedeConfirmar(): boolean {
        return !this.bloqueado && this.seleccion !== null;
    }

    onSeleccionar(visibleOtros: boolean): void {
        if (this.bloqueado || (this.soloPrivado && visibleOtros))
            return;
        this.seleccion = visibleOtros;
    }

    onConfirmar(): void {
        if (this.bloqueado)
            return;
        if (this.seleccion === null)
            return;
        this.confirmar.emit(this.soloPrivado ? false : this.seleccion);
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
        if (event.repeat || esElementoInteractivoParaEnter(event.target as HTMLElement | null))
            return;
        if (!this.puedeConfirmar)
            return;
        event.preventDefault();
        this.onConfirmar();
    }
}
