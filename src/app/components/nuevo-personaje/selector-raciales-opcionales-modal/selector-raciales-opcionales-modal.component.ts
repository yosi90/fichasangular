import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import { SeleccionRacialesOpcionales } from 'src/app/services/utils/racial-opcionales';
import { RacialEvaluacionResultado } from 'src/app/services/utils/racial-prerrequisitos';

export interface GrupoRacialOpcionalModal {
    grupo: number;
    opciones: {
        clave: string;
        racial: RacialDetalle;
        estado: RacialEvaluacionResultado['estado'];
        razones: string[];
        advertencias: string[];
    }[];
}

@Component({
    selector: 'app-selector-raciales-opcionales-modal',
    templateUrl: './selector-raciales-opcionales-modal.component.html',
    styleUrls: ['./selector-raciales-opcionales-modal.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorRacialesOpcionalesModalComponent implements OnChanges {
    @Input() grupos: GrupoRacialOpcionalModal[] = [];
    @Input() titulo = 'Seleccionar raciales opcionales';
    @Input() razaContextoNombre = '';

    @Output() cerrar = new EventEmitter<void>();
    @Output() confirmar = new EventEmitter<SeleccionRacialesOpcionales>();
    @Output() info = new EventEmitter<void>();
    @Output() verDetalleRacial = new EventEmitter<RacialReferencia>();

    seleccion: SeleccionRacialesOpcionales = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['grupos'])
            this.sanitizarSeleccion();
    }

    get requiereSeleccion(): boolean {
        return this.grupos.length > 0;
    }

    get seleccionCompleta(): boolean {
        return this.grupos.every((grupo) => {
            const habilitadas = grupo.opciones.filter((opcion) => this.esOpcionHabilitada(opcion));
            if (habilitadas.length < 1)
                return false;
            const valor = `${this.seleccion[grupo.grupo] ?? ''}`.trim();
            return valor.length > 0 && habilitadas.some((opcion) => opcion.clave === valor);
        });
    }

    get puedeConfirmar(): boolean {
        return !this.requiereSeleccion || this.seleccionCompleta;
    }

    onSeleccionar(grupo: number, clave: string, habilitada: boolean): void {
        if (!habilitada)
            return;
        this.seleccion = {
            ...this.seleccion,
            [grupo]: clave,
        };
    }

    esSeleccionada(grupo: number, clave: string): boolean {
        return `${this.seleccion[grupo] ?? ''}` === `${clave ?? ''}`;
    }

    onCerrar(): void {
        this.cerrar.emit();
    }

    onInfo(): void {
        this.info.emit();
    }

    onConfirmar(): void {
        if (!this.puedeConfirmar)
            return;

        this.confirmar.emit({ ...this.seleccion });
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

    trackByGrupo(_index: number, item: GrupoRacialOpcionalModal): number {
        return Number(item.grupo);
    }

    trackByOpcion(
        _index: number,
        item: {
            clave: string;
            racial: RacialDetalle;
            estado: RacialEvaluacionResultado['estado'];
            razones: string[];
            advertencias: string[];
        }
    ): string {
        return item.clave;
    }

    esOpcionHabilitada(opcion: {
        estado: RacialEvaluacionResultado['estado'];
    }): boolean {
        return opcion.estado !== 'blocked';
    }

    grupoSinOpcionesHabilitadas(grupo: GrupoRacialOpcionalModal): boolean {
        return grupo.opciones.every((opcion) => !this.esOpcionHabilitada(opcion));
    }

    getTextoBloqueo(opcion: {
        razones: string[];
    }): string {
        return `${opcion?.razones?.[0] ?? ''}`.trim() || 'No cumple los prerrequisitos para esta elección.';
    }

    getTextoAdvertencia(opcion: {
        advertencias: string[];
    }): string {
        return `${opcion?.advertencias?.[0] ?? ''}`.trim();
    }

    tieneDetalleRacial(racial: RacialDetalle): boolean {
        const nombre = `${racial?.Nombre ?? ''}`.trim();
        return nombre.length > 0;
    }

    onVerDetalleRacial(racial: RacialDetalle, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        if (!this.tieneDetalleRacial(racial))
            return;

        const id = Number(racial?.Id);
        this.verDetalleRacial.emit({
            id: Number.isFinite(id) && id > 0 ? id : null,
            nombre: `${racial?.Nombre ?? ''}`.trim(),
        });
    }

    private sanitizarSeleccion(): void {
        const siguiente: SeleccionRacialesOpcionales = {};

        this.grupos.forEach((grupo) => {
            const seleccionado = `${this.seleccion[grupo.grupo] ?? ''}`.trim();
            if (seleccionado.length < 1)
                return;
            const existe = grupo.opciones.some((opcion) => `${opcion.clave}` === seleccionado && this.esOpcionHabilitada(opcion));
            if (existe)
                siguiente[grupo.grupo] = seleccionado;
        });

        this.seleccion = siguiente;
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
