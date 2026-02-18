import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';

@Component({
    selector: 'app-selector-idioma-modal',
    templateUrl: './selector-idioma-modal.component.html',
    styleUrls: ['./selector-idioma-modal.component.sass']
})
export class SelectorIdiomaModalComponent {
    @Input() idiomas: IdiomaDetalle[] = [];
    @Input() idiomasYaSeleccionados: string[] = [];
    @Input() personajeOficial = true;
    @Input() incluirHomebrew = false;
    @Input() titulo = 'Seleccionar idioma extra';
    @Input() cantidadObjetivo = 1;
    @Input() cantidadSeleccionada = 0;
    @Input() bloquearCierreHastaCompletar = false;

    @Output() cerrar = new EventEmitter<void>();
    @Output() confirmar = new EventEmitter<IdiomaDetalle[]>();
    @Output() incluirHomebrewChange = new EventEmitter<boolean>();

    private seleccionados = new Set<number>();

    get incluirHomebrewEfectivo(): boolean {
        return !this.personajeOficial || this.incluirHomebrew;
    }

    get idiomasDisponibles(): IdiomaDetalle[] {
        const yaIncluidos = new Set(this.idiomasYaSeleccionados.map((x) => this.normalizarTexto(x)));
        return this.idiomas
            .filter((idioma) => !idioma.Secreto)
            .filter((idioma) => !yaIncluidos.has(this.normalizarTexto(idioma.Nombre)))
            .filter((idioma) => this.incluirHomebrewEfectivo || idioma.Oficial)
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    get seleccionActual(): IdiomaDetalle[] {
        const seleccionados = this.idiomasDisponibles
            .filter((idioma) => this.seleccionados.has(Number(idioma.Id)));
        return seleccionados;
    }

    get cantidadSeleccionActual(): number {
        return this.seleccionActual.length;
    }

    get cantidadPendiente(): number {
        const objetivo = Math.max(0, Math.trunc(Number(this.cantidadObjetivo) || 0));
        return Math.max(0, objetivo - this.cantidadSeleccionActual);
    }

    get puedeCerrar(): boolean {
        return !this.bloquearCierreHastaCompletar || this.cantidadPendiente < 1;
    }

    get puedeConfirmar(): boolean {
        return this.cantidadPendiente < 1 && this.cantidadSeleccionActual > 0;
    }

    get textoPendiente(): string {
        const pendiente = this.cantidadPendiente;
        if (pendiente < 1)
            return 'Selección completa';
        if (pendiente === 1)
            return 'Falta 1 idioma por elegir';
        return `Faltan ${pendiente} idiomas por elegir`;
    }

    trackByIdiomaId(_index: number, idioma: IdiomaDetalle): number {
        return Number(idioma?.Id ?? 0);
    }

    isIdiomaSeleccionado(idIdioma: number): boolean {
        return this.seleccionados.has(Number(idIdioma));
    }

    isIdiomaBloqueadoPorLimite(idIdioma: number): boolean {
        return !this.isIdiomaSeleccionado(idIdioma) && this.cantidadPendiente < 1;
    }

    onToggleIdioma(idIdioma: number, checked: boolean): void {
        const id = Number(idIdioma);
        if (!Number.isFinite(id) || id <= 0)
            return;

        if (!checked) {
            this.seleccionados.delete(id);
            return;
        }

        if (this.isIdiomaBloqueadoPorLimite(id))
            return;

        this.seleccionados.add(id);
    }

    onToggleIdiomaRow(idIdioma: number): void {
        const id = Number(idIdioma);
        if (!Number.isFinite(id) || id <= 0)
            return;

        if (this.isIdiomaBloqueadoPorLimite(id))
            return;

        this.onToggleIdioma(id, !this.isIdiomaSeleccionado(id));
    }

    onToggleIdiomaRowTeclado(idIdioma: number, event: Event): void {
        event.preventDefault();
        this.onToggleIdiomaRow(idIdioma);
    }

    onToggleHomebrew(): void {
        if (!this.personajeOficial)
            return;

        const siguiente = !this.incluirHomebrew;
        this.incluirHomebrew = siguiente;
        this.seleccionados.clear();
        this.incluirHomebrewChange.emit(siguiente);
    }

    onConfirmar(): void {
        if (!this.puedeConfirmar)
            return;
        this.confirmar.emit(this.seleccionActual);
        this.seleccionados.clear();
    }

    onCerrar(): void {
        if (!this.puedeCerrar)
            return;
        this.cerrar.emit();
    }

    private normalizarTexto(valor: string): string {
        return `${valor ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
