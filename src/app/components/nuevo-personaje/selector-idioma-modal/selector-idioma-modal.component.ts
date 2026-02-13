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
    @Output() confirmar = new EventEmitter<IdiomaDetalle>();
    @Output() incluirHomebrewChange = new EventEmitter<boolean>();

    idiomaSeleccionadoId: number | null = null;

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

    get idiomaSeleccionado(): IdiomaDetalle | null {
        if (this.idiomaSeleccionadoId === null)
            return null;
        return this.idiomasDisponibles.find(i => i.Id === this.idiomaSeleccionadoId) ?? null;
    }

    get cantidadPendiente(): number {
        const objetivo = Math.max(0, Math.trunc(Number(this.cantidadObjetivo) || 0));
        const seleccionada = Math.max(0, Math.trunc(Number(this.cantidadSeleccionada) || 0));
        return Math.max(0, objetivo - seleccionada);
    }

    get puedeCerrar(): boolean {
        return !this.bloquearCierreHastaCompletar || this.cantidadPendiente < 1;
    }

    get textoPendiente(): string {
        const pendiente = this.cantidadPendiente;
        if (pendiente === 1)
            return 'Falta 1 idioma por elegir';
        return `Faltan ${pendiente} idiomas por elegir`;
    }

    onToggleHomebrew(): void {
        if (!this.personajeOficial)
            return;

        const siguiente = !this.incluirHomebrew;
        this.incluirHomebrew = siguiente;
        this.idiomaSeleccionadoId = null;
        this.incluirHomebrewChange.emit(siguiente);
    }

    onConfirmar(): void {
        if (!this.idiomaSeleccionado)
            return;
        this.confirmar.emit(this.idiomaSeleccionado);
        this.idiomaSeleccionadoId = null;
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
