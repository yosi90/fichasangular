import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FamiliarMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { FamiliarPlantillaId } from 'src/app/services/utils/familiar-reglas';

export interface SelectorFamiliarConfirmacion {
    familiar: FamiliarMonstruoDetalle;
    plantilla: FamiliarPlantillaId;
    nombre: string;
}

@Component({
    selector: 'app-selector-familiar-modal',
    templateUrl: './selector-familiar-modal.component.html',
    styleUrls: ['./selector-familiar-modal.component.sass']
})
export class SelectorFamiliarModalComponent {
    @Input() titulo = 'Seleccionar familiar';
    @Input() familiaresElegibles: FamiliarMonstruoDetalle[] = [];
    @Input() familiaresSeleccionados: FamiliarMonstruoDetalle[] = [];
    @Input() plantillaSeleccionada: FamiliarPlantillaId = 1;
    @Input() incluirHomebrew = false;
    @Input() cuposDisponibles = 0;
    @Input() nombreFamiliar = '';

    @Output() confirmar = new EventEmitter<SelectorFamiliarConfirmacion>();
    @Output() omitir = new EventEmitter<void>();
    @Output() detalle = new EventEmitter<FamiliarMonstruoDetalle>();
    @Output() plantillaChange = new EventEmitter<FamiliarPlantillaId>();
    @Output() incluirHomebrewChange = new EventEmitter<boolean>();
    @Output() nombreFamiliarChange = new EventEmitter<string>();

    filtroTexto = '';
    idFamiliarSeleccionado = 0;
    idPlantillaSeleccionada = 0;

    get familiaresFiltrados(): FamiliarMonstruoDetalle[] {
        const filtro = this.normalizarTexto(this.filtroTexto);
        if (filtro.length < 1)
            return [...(this.familiaresElegibles ?? [])];
        return (this.familiaresElegibles ?? []).filter((familiar) =>
            this.normalizarTexto(familiar?.Nombre ?? '').includes(filtro)
        );
    }

    get familiaresColumnaA(): FamiliarMonstruoDetalle[] {
        return this.familiaresFiltrados.filter((_item, index) => index % 3 === 0);
    }

    get familiaresColumnaB(): FamiliarMonstruoDetalle[] {
        return this.familiaresFiltrados.filter((_item, index) => index % 3 === 1);
    }

    get familiaresColumnaC(): FamiliarMonstruoDetalle[] {
        return this.familiaresFiltrados.filter((_item, index) => index % 3 === 2);
    }

    get puedeConfirmar(): boolean {
        return this.familiaresFiltrados.some((familiar) =>
            this.esSeleccionado(familiar)
        );
    }

    get previewFamiliares(): FamiliarMonstruoDetalle[] {
        const base = [...(this.familiaresSeleccionados ?? [])];
        const seleccionado = this.familiaresFiltrados.find((familiar) => this.esSeleccionado(familiar));
        if (!seleccionado)
            return base;
        const existe = base.some((item) =>
            Number(item?.Id_familiar) === Number(seleccionado?.Id_familiar)
            && Number(item?.Plantilla?.Id) === Number(seleccionado?.Plantilla?.Id)
        );
        if (!existe)
            base.push(seleccionado);
        return base.sort((a, b) =>
            `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' })
        );
    }

    onSeleccionarFamiliar(familiar: FamiliarMonstruoDetalle): void {
        this.idFamiliarSeleccionado = Number(familiar?.Id_familiar ?? 0);
        this.idPlantillaSeleccionada = Number(familiar?.Plantilla?.Id ?? 0);
    }

    onCambiarPlantilla(value: FamiliarPlantillaId): void {
        const parsed = Number(value);
        if (parsed < 1 || parsed > 5)
            return;
        const plantilla = parsed as FamiliarPlantillaId;
        this.plantillaChange.emit(plantilla);
        this.idFamiliarSeleccionado = 0;
        this.idPlantillaSeleccionada = 0;
    }

    onCambiarHomebrew(value: boolean): void {
        this.incluirHomebrewChange.emit(!!value);
        this.idFamiliarSeleccionado = 0;
        this.idPlantillaSeleccionada = 0;
    }

    onCambiarNombreFamiliar(value: string): void {
        this.nombreFamiliarChange.emit(`${value ?? ''}`);
    }

    onAbrirDetalle(familiar: FamiliarMonstruoDetalle, event?: Event): void {
        event?.stopPropagation();
        this.detalle.emit(familiar);
    }

    onConfirmar(): void {
        const familiar = this.familiaresFiltrados.find((item) => this.esSeleccionado(item));
        if (!familiar)
            return;
        this.confirmar.emit({
            familiar,
            plantilla: this.plantillaSeleccionada,
            nombre: `${this.nombreFamiliar ?? ''}`.trim(),
        });
    }

    onOmitir(): void {
        this.omitir.emit();
    }

    esSeleccionado(familiar: FamiliarMonstruoDetalle): boolean {
        return Number(this.idFamiliarSeleccionado) === Number(familiar?.Id_familiar)
            && Number(this.idPlantillaSeleccionada) === Number(familiar?.Plantilla?.Id);
    }

    getEtiquetaPlantilla(idPlantilla: number): string {
        if (idPlantilla === 2)
            return 'Draconica';
        if (idPlantilla === 3)
            return 'Celestial';
        if (idPlantilla === 4)
            return 'Remendado';
        if (idPlantilla === 5)
            return 'Mejorado';
        return 'Basica';
    }

    trackByFamiliar(index: number, familiar: FamiliarMonstruoDetalle): string {
        return `${index}:${Number(familiar?.Id_familiar ?? 0)}:${Number(familiar?.Plantilla?.Id ?? 0)}`;
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
}
