import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SelectorDominioItem {
    id: number;
    nombre: string;
    oficial: boolean;
}

@Component({
    selector: 'app-selector-dominios-modal',
    templateUrl: './selector-dominios-modal.component.html',
    styleUrls: ['./selector-dominios-modal.component.sass']
})
export class SelectorDominiosModalComponent {
    @Input() opciones: SelectorDominioItem[] = [];
    @Input() titulo = 'Seleccionar dominios';
    @Input() cantidadObjetivo = 1;
    @Input() cantidadSeleccionada = 0;
    @Input() bloquearCierreHastaCompletar = false;

    @Output() cerrar = new EventEmitter<void>();
    @Output() confirmar = new EventEmitter<number[]>();

    private seleccionados = new Set<number>();

    get seleccionActual(): number[] {
        return Array.from(this.seleccionados.values());
    }

    get cantidadSeleccionActual(): number {
        return this.seleccionActual.length;
    }

    get cantidadPendiente(): number {
        const objetivo = this.objetivoNormalizado;
        return Math.max(0, objetivo - this.cantidadSeleccionActual);
    }

    get puedeCerrar(): boolean {
        return !this.bloquearCierreHastaCompletar || this.cantidadPendiente < 1;
    }

    get puedeConfirmar(): boolean {
        return this.cantidadPendiente < 1;
    }

    get textoPendiente(): string {
        if (this.cantidadPendiente === 0)
            return 'Selección completa';
        if (this.cantidadPendiente === 1)
            return 'Falta 1 dominio por elegir';
        return `Faltan ${this.cantidadPendiente} dominios por elegir`;
    }

    trackByDominioId(_index: number, item: SelectorDominioItem): number {
        return Number(item?.id ?? 0);
    }

    isSeleccionado(id: number): boolean {
        return this.seleccionados.has(Number(id));
    }

    isBloqueadoPorLimite(id: number): boolean {
        return !this.isSeleccionado(id) && this.cantidadPendiente < 1;
    }

    onToggleDominio(id: number, checked: boolean): void {
        const dominioId = Number(id);
        if (!Number.isFinite(dominioId) || dominioId <= 0)
            return;

        if (!checked) {
            this.seleccionados.delete(dominioId);
            this.cantidadSeleccionada = this.cantidadSeleccionActual;
            return;
        }

        const objetivo = this.objetivoNormalizado;
        if (this.cantidadSeleccionActual >= objetivo)
            return;

        this.seleccionados.add(dominioId);
        this.cantidadSeleccionada = this.cantidadSeleccionActual;
    }

    onToggleDominioRow(id: number): void {
        if (this.isBloqueadoPorLimite(id))
            return;
        this.onToggleDominio(id, !this.isSeleccionado(id));
    }

    onToggleDominioRowTeclado(id: number, event: Event): void {
        event.preventDefault();
        this.onToggleDominioRow(id);
    }

    onCerrar(): void {
        if (!this.puedeCerrar)
            return;
        this.cerrar.emit();
    }

    onConfirmar(): void {
        if (!this.puedeConfirmar)
            return;
        this.confirmar.emit(this.seleccionActual);
    }

    private get objetivoNormalizado(): number {
        return Math.max(0, Math.trunc(Number(this.cantidadObjetivo) || 0));
    }
}
