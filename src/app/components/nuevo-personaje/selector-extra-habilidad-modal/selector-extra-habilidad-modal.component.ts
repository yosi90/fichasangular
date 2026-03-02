import { Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';

export interface SelectorExtraHabilidadModalOpcion {
    valor: string;
    descripcion: string;
}

@Component({
    selector: 'app-selector-extra-habilidad-modal',
    templateUrl: './selector-extra-habilidad-modal.component.html',
    styleUrls: ['./selector-extra-habilidad-modal.component.sass']
})
export class SelectorExtraHabilidadModalComponent implements OnChanges {
    @Input() titulo = 'Seleccionar extra';
    @Input() habilidadNombre = '';
    @Input() opciones: SelectorExtraHabilidadModalOpcion[] = [];
    @Input() valorSeleccionadoInicial = '';

    @Output() confirmar = new EventEmitter<string>();
    @Output() cerrar = new EventEmitter<void>();

    filtroTexto = '';
    valorSeleccionado = '';

    ngOnChanges(): void {
        const inicial = `${this.valorSeleccionadoInicial ?? ''}`.trim();
        const existe = (this.opciones ?? []).some((item) => this.normalizarTexto(item?.valor ?? '') === this.normalizarTexto(inicial));
        this.valorSeleccionado = existe ? inicial : '';
        this.filtroTexto = '';
    }

    get opcionesFiltradas(): SelectorExtraHabilidadModalOpcion[] {
        const filtro = this.normalizarTexto(this.filtroTexto);
        return (this.opciones ?? [])
            .filter((opcion) => `${opcion?.valor ?? ''}`.trim().length > 0)
            .filter((opcion) => {
                if (filtro.length < 1)
                    return true;
                const valor = this.normalizarTexto(opcion?.valor ?? '');
                const descripcion = this.normalizarTexto(opcion?.descripcion ?? '');
                return valor.includes(filtro) || descripcion.includes(filtro);
            })
            .sort((a, b) => `${a?.valor ?? ''}`.localeCompare(`${b?.valor ?? ''}`, 'es', { sensitivity: 'base' }));
    }

    get puedeConfirmar(): boolean {
        const valor = `${this.valorSeleccionado ?? ''}`.trim();
        if (valor.length < 1)
            return false;
        return (this.opciones ?? []).some((opcion) => this.normalizarTexto(opcion?.valor ?? '') === this.normalizarTexto(valor));
    }

    seleccionarOpcion(valor: string): void {
        const candidato = `${valor ?? ''}`.trim();
        if (candidato.length < 1)
            return;
        this.valorSeleccionado = candidato;
    }

    esOpcionSeleccionada(valor: string): boolean {
        return this.normalizarTexto(valor ?? '') === this.normalizarTexto(this.valorSeleccionado ?? '');
    }

    onConfirmar(): void {
        if (!this.puedeConfirmar)
            return;
        this.confirmar.emit(`${this.valorSeleccionado ?? ''}`.trim());
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

    private normalizarTexto(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
