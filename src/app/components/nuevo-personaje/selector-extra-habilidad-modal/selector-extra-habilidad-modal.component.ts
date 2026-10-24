import { Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { esElementoInteractivoParaEnter } from 'src/app/services/utils/teclado';

export interface SelectorExtraHabilidadModalOpcion {
    valor: string;
    descripcion: string;
}

@Component({
    selector: 'app-selector-extra-habilidad-modal',
    templateUrl: './selector-extra-habilidad-modal.component.html',
    styleUrls: ['./selector-extra-habilidad-modal.component.sass'],
    standalone: false
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
        const existe = (this.opciones ?? []).some((item) => normalizarTexto(item?.valor ?? '') === normalizarTexto(inicial));
        this.valorSeleccionado = existe ? inicial : '';
        this.filtroTexto = '';
    }

    get opcionesFiltradas(): SelectorExtraHabilidadModalOpcion[] {
        const filtro = normalizarTexto(this.filtroTexto);
        return (this.opciones ?? [])
            .filter((opcion) => `${opcion?.valor ?? ''}`.trim().length > 0)
            .filter((opcion) => {
                if (filtro.length < 1)
                    return true;
                const valor = normalizarTexto(opcion?.valor ?? '');
                const descripcion = normalizarTexto(opcion?.descripcion ?? '');
                return valor.includes(filtro) || descripcion.includes(filtro);
            })
            .sort((a, b) => `${a?.valor ?? ''}`.localeCompare(`${b?.valor ?? ''}`, 'es', { sensitivity: 'base' }));
    }

    get puedeConfirmar(): boolean {
        const valor = `${this.valorSeleccionado ?? ''}`.trim();
        if (valor.length < 1)
            return false;
        return (this.opciones ?? []).some((opcion) => normalizarTexto(opcion?.valor ?? '') === normalizarTexto(valor));
    }

    seleccionarOpcion(valor: string): void {
        const candidato = `${valor ?? ''}`.trim();
        if (candidato.length < 1)
            return;
        this.valorSeleccionado = candidato;
    }

    esOpcionSeleccionada(valor: string): boolean {
        return normalizarTexto(valor ?? '') === normalizarTexto(this.valorSeleccionado ?? '');
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
        if (event.repeat || esElementoInteractivoParaEnter(event.target as HTMLElement | null))
            return;
        if (!this.puedeConfirmar)
            return;

        event.preventDefault();
        this.onConfirmar();
    }
}
