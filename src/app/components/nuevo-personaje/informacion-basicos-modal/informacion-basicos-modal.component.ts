import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

export interface InformacionBasicosModalSection {
    titulo?: string;
    lineas?: string[];
    items?: string[];
}

@Component({
    selector: 'app-informacion-basicos-modal',
    templateUrl: './informacion-basicos-modal.component.html',
    styleUrls: ['./informacion-basicos-modal.component.sass'],
    standalone: false
})
export class InformacionBasicosModalComponent {
    @Input() titulo = 'Informacion';
    @Input() icono = 'info';
    @Input() secciones: InformacionBasicosModalSection[] = [];

    @Output() cerrar = new EventEmitter<void>();

    onCerrar(): void {
        this.cerrar.emit();
    }

    @HostListener('document:keydown.escape', ['$event'])
    onEscape(event: KeyboardEvent): void {
        event.preventDefault();
        this.onCerrar();
    }
}
