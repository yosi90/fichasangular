import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { EnemigoPredilectoDetalle } from 'src/app/interfaces/enemigo-predilecto-detalle';
import { EnemigoPredilectoSeleccion } from 'src/app/interfaces/enemigo-predilecto-seleccion';

@Component({
    selector: 'app-selector-enemigo-predilecto-modal',
    templateUrl: './selector-enemigo-predilecto-modal.component.html',
    styleUrls: ['./selector-enemigo-predilecto-modal.component.sass']
})
export class SelectorEnemigoPredilectoModalComponent {
    @Input() titulo = 'Seleccionar enemigo predilecto';
    @Input() enemigos: EnemigoPredilectoDetalle[] = [];
    @Input() enemigosYaElegidos: EnemigoPredilectoSeleccion[] = [];

    @Output() confirmar = new EventEmitter<number>();

    idSeleccionado = 0;
    filtroTexto = '';

    get enemigosDisponibles(): EnemigoPredilectoDetalle[] {
        return [...(this.enemigos ?? [])]
            .map((item) => ({
                Id: Number(item?.Id ?? 0),
                Nombre: `${item?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => Number.isFinite(item.Id) && item.Id > 0 && item.Nombre.length > 0)
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    get enemigosFiltrados(): EnemigoPredilectoDetalle[] {
        const filtro = this.normalizarTexto(this.filtroTexto);
        if (filtro.length < 1)
            return this.enemigosDisponibles;

        return this.enemigosDisponibles.filter((enemigo) =>
            this.normalizarTexto(enemigo?.Nombre ?? '').includes(filtro)
        );
    }

    get enemigosColumnaA(): EnemigoPredilectoDetalle[] {
        return this.enemigosFiltrados.filter((_item, index) => index % 3 === 0);
    }

    get enemigosColumnaB(): EnemigoPredilectoDetalle[] {
        return this.enemigosFiltrados.filter((_item, index) => index % 3 === 1);
    }

    get enemigosColumnaC(): EnemigoPredilectoDetalle[] {
        return this.enemigosFiltrados.filter((_item, index) => index % 3 === 2);
    }

    get previewEnemigos(): EnemigoPredilectoSeleccion[] {
        const base = this.normalizarEnemigosYaElegidos(this.enemigosYaElegidos);
        const seleccionadoId = Number(this.idSeleccionado);
        if (!Number.isFinite(seleccionadoId) || seleccionadoId <= 0)
            return base;

        const enemigoSeleccionado = this.enemigosDisponibles.find((enemigo) => enemigo.Id === seleccionadoId);
        const nombreSeleccionado = `${enemigoSeleccionado?.Nombre ?? ''}`.trim();
        if (nombreSeleccionado.length < 1)
            return base;

        const existente = base.find((item) => Number(item?.id) === seleccionadoId);
        if (!existente) {
            return [
                ...base,
                {
                    id: seleccionadoId,
                    nombre: nombreSeleccionado,
                    bono: 2,
                    veces: 1,
                }
            ].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
        }

        return base
            .map((item) => {
                if (Number(item?.id) !== seleccionadoId)
                    return item;
                return {
                    ...item,
                    nombre: nombreSeleccionado,
                    bono: Math.max(0, Number(item?.bono ?? 0)) + 2,
                    veces: Math.max(0, Number(item?.veces ?? 0)) + 1,
                };
            })
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    get puedeConfirmar(): boolean {
        const id = Number(this.idSeleccionado);
        return this.enemigosDisponibles.some((enemigo) => enemigo.Id === id);
    }

    onSeleccionar(id: number): void {
        const parsed = Number(id);
        if (!Number.isFinite(parsed) || parsed <= 0)
            return;
        this.idSeleccionado = parsed;
    }

    onConfirmar(): void {
        if (!this.puedeConfirmar)
            return;
        this.confirmar.emit(Number(this.idSeleccionado));
    }

    onSeleccionarFilaTeclado(id: number, event: Event): void {
        event.preventDefault();
        this.onSeleccionar(id);
    }

    esSeleccionado(id: number): boolean {
        return Number(this.idSeleccionado) === Number(id);
    }

    trackByEnemigoId(_index: number, item: EnemigoPredilectoDetalle): number {
        return Number(item?.Id ?? 0);
    }

    trackByPreviewEnemigoId(_index: number, item: EnemigoPredilectoSeleccion): number {
        return Number(item?.id ?? 0);
    }

    @HostListener('document:keydown.enter', ['$event'])
    onEnter(event: KeyboardEvent): void {
        if (event.repeat || this.esElementoInteractivo(event.target as HTMLElement | null))
            return;
        if (!this.puedeConfirmar)
            return;

        event.preventDefault();
        this.onConfirmar();
    }

    private esElementoInteractivo(target: HTMLElement | null): boolean {
        if (!target)
            return false;
        if (target.isContentEditable)
            return true;
        const selector = 'input, textarea, select, button, a, [role="button"], [role="checkbox"], [role="option"], [role="listbox"], [role="menuitem"], .cdk-overlay-pane';
        return !!target.closest(selector);
    }

    private normalizarTexto(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private normalizarEnemigosYaElegidos(value: EnemigoPredilectoSeleccion[] | null | undefined): EnemigoPredilectoSeleccion[] {
        const lista = Array.isArray(value) ? value : [];
        return lista
            .map((item) => ({
                id: Number(item?.id ?? 0),
                nombre: `${item?.nombre ?? ''}`.trim(),
                bono: Math.max(0, Number(item?.bono ?? 0)),
                veces: Math.max(0, Number(item?.veces ?? 0)),
            }))
            .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.nombre.length > 0 && item.bono > 0)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }
}
