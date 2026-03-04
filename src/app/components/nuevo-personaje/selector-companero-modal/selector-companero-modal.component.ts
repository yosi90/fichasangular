import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CompaneroMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { CompaneroPlantillaSelector } from 'src/app/services/utils/companero-reglas';

export interface SelectorCompaneroConfirmacion {
    companero: CompaneroMonstruoDetalle;
    plantilla: CompaneroPlantillaSelector;
    nombre: string;
    nivel: number | null;
}

export interface SelectorCompaneroBloqueadoItem {
    companero: CompaneroMonstruoDetalle;
    razones: string[];
    nivelMinimoRequerido: number | null;
}

@Component({
    selector: 'app-selector-companero-modal',
    templateUrl: './selector-companero-modal.component.html',
    styleUrls: ['./selector-companero-modal.component.sass']
})
export class SelectorCompaneroModalComponent {
    @Input() titulo = 'Seleccionar compañero animal';
    @Input() companerosElegibles: CompaneroMonstruoDetalle[] = [];
    @Input() companerosBloqueados: SelectorCompaneroBloqueadoItem[] = [];
    @Input() nivelesRequeridos: Record<string, number> = {};
    @Input() companerosSeleccionados: CompaneroMonstruoDetalle[] = [];
    @Input() plantillaSeleccionada: CompaneroPlantillaSelector | null = null;
    @Input() incluirHomebrew = false;
    @Input() cuposDisponibles = 0;
    @Input() nombreCompanero = '';
    @Input() nivelesDisponibles: number[] = [];
    @Input() nivelSeleccionado: number | null = null;

    @Output() confirmar = new EventEmitter<SelectorCompaneroConfirmacion>();
    @Output() omitir = new EventEmitter<void>();
    @Output() detalle = new EventEmitter<CompaneroMonstruoDetalle>();
    @Output() plantillaChange = new EventEmitter<CompaneroPlantillaSelector | null>();
    @Output() incluirHomebrewChange = new EventEmitter<boolean>();
    @Output() nombreCompaneroChange = new EventEmitter<string>();
    @Output() nivelChange = new EventEmitter<number | null>();

    filtroTexto = '';
    mostrarSoloElegibles = true;
    idCompaneroSeleccionado = 0;
    idPlantillaSeleccionada = 0;

    get companerosFiltrados(): CompaneroMonstruoDetalle[] {
        const filtro = this.normalizarTexto(this.filtroTexto);
        const listado = this.companerosListado;
        if (filtro.length < 1)
            return listado;
        return listado.filter((companero) =>
            this.normalizarTexto(companero?.Nombre ?? '').includes(filtro)
        );
    }

    get cantidadCompanerosListado(): number {
        return this.companerosListado.length;
    }

    get companerosColumnaA(): CompaneroMonstruoDetalle[] {
        return this.companerosFiltrados.filter((_item, index) => index % 3 === 0);
    }

    get companerosColumnaB(): CompaneroMonstruoDetalle[] {
        return this.companerosFiltrados.filter((_item, index) => index % 3 === 1);
    }

    get companerosColumnaC(): CompaneroMonstruoDetalle[] {
        return this.companerosFiltrados.filter((_item, index) => index % 3 === 2);
    }

    get puedeConfirmar(): boolean {
        return this.companerosFiltrados.some((companero) =>
            this.esSeleccionado(companero) && this.esCompaneroElegible(companero)
        );
    }

    get previewCompaneros(): CompaneroMonstruoDetalle[] {
        const base = [...(this.companerosSeleccionados ?? [])];
        const seleccionado = this.companerosFiltrados.find((companero) => this.esSeleccionado(companero));
        if (!seleccionado)
            return base;
        const existe = base.some((item) =>
            Number(item?.Id_companero) === Number(seleccionado?.Id_companero)
            && Number(item?.Plantilla?.Id) === Number(seleccionado?.Plantilla?.Id)
        );
        if (!existe)
            base.push(seleccionado);
        return base.sort((a, b) =>
            `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' })
        );
    }

    onSeleccionarCompanero(companero: CompaneroMonstruoDetalle): void {
        this.idCompaneroSeleccionado = Number(companero?.Id_companero ?? 0);
        this.idPlantillaSeleccionada = Number(companero?.Plantilla?.Id ?? 0);
    }

    onCambiarPlantilla(value: CompaneroPlantillaSelector | null): void {
        const plantilla = value ? this.normalizarPlantilla(value) : null;
        this.plantillaChange.emit(plantilla);
        this.idCompaneroSeleccionado = 0;
        this.idPlantillaSeleccionada = 0;
    }

    onCambiarHomebrew(value: boolean): void {
        this.incluirHomebrewChange.emit(!!value);
        this.idCompaneroSeleccionado = 0;
        this.idPlantillaSeleccionada = 0;
    }

    onCambiarNombreCompanero(value: string): void {
        this.nombreCompaneroChange.emit(`${value ?? ''}`);
    }

    onCambiarNivel(value: number | null): void {
        const nivel = value === null || value === undefined ? null : Number(value);
        this.nivelChange.emit(Number.isFinite(Number(nivel)) ? Math.max(0, Math.trunc(Number(nivel))) : null);
        this.idCompaneroSeleccionado = 0;
        this.idPlantillaSeleccionada = 0;
    }

    onAbrirDetalle(companero: CompaneroMonstruoDetalle, event?: Event): void {
        event?.stopPropagation();
        this.detalle.emit(companero);
    }

    onAlternarSoloElegibles(): void {
        this.mostrarSoloElegibles = !this.mostrarSoloElegibles;
        this.idCompaneroSeleccionado = 0;
        this.idPlantillaSeleccionada = 0;
    }

    onConfirmar(): void {
        const companero = this.companerosFiltrados.find((item) => this.esSeleccionado(item));
        if (!companero || !this.esCompaneroElegible(companero))
            return;
        this.confirmar.emit({
            companero,
            plantilla: this.getSelectorPlantillaDesdeId(Number(companero?.Plantilla?.Id ?? 1)),
            nombre: `${this.nombreCompanero ?? ''}`.trim(),
            nivel: this.nivelSeleccionado === null ? null : Number(this.nivelSeleccionado),
        });
    }

    onOmitir(): void {
        this.omitir.emit();
    }

    esSeleccionado(companero: CompaneroMonstruoDetalle): boolean {
        return Number(this.idCompaneroSeleccionado) === Number(companero?.Id_companero)
            && Number(this.idPlantillaSeleccionada) === Number(companero?.Plantilla?.Id);
    }

    getEtiquetaPlantilla(idPlantilla: number): string {
        if (idPlantilla === 2)
            return 'Elevado';
        if (idPlantilla === 3)
            return 'Sabandija';
        return 'Base';
    }

    esCompaneroElegible(companero: CompaneroMonstruoDetalle): boolean {
        return (this.companerosElegibles ?? []).some((item) => this.sonMismoCompanero(item, companero));
    }

    getEtiquetaEstado(companero: CompaneroMonstruoDetalle): string {
        return this.esCompaneroElegible(companero) ? 'Elegible' : 'Bloqueada';
    }

    getMotivosBloqueo(companero: CompaneroMonstruoDetalle): string[] {
        const bloqueado = (this.companerosBloqueados ?? []).find((item) => this.sonMismoCompanero(item?.companero, companero));
        if (!bloqueado)
            return [];
        return Array.from(new Set((bloqueado.razones ?? []).filter((motivo) => `${motivo ?? ''}`.trim().length > 0)));
    }

    getNivelRequerido(companero: CompaneroMonstruoDetalle): number | null {
        const nivel = Number(this.nivelesRequeridos?.[this.getClaveCompanero(companero)] ?? 0);
        if (!Number.isFinite(nivel) || nivel <= 0)
            return null;
        return Math.trunc(nivel);
    }

    getTooltipNivelDruida(nivel: number | null): string {
        const nivelTexto = Number.isFinite(Number(nivel)) && Number(nivel) > 0 ? Math.trunc(Number(nivel)) : 0;
        return `Para poder obtener este compañero animal es necesario tener al menos ${nivelTexto} nivel de druida. Recuerda que el nivel de druida no solo se obtiene con la clase druida, también otras como explorador otorgan nivel de druida (mitad).`;
    }

    trackByCompanero(index: number, companero: CompaneroMonstruoDetalle): string {
        return `${index}:${Number(companero?.Id_companero ?? 0)}:${Number(companero?.Plantilla?.Id ?? 0)}`;
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

    private normalizarPlantilla(value: CompaneroPlantillaSelector | string): CompaneroPlantillaSelector {
        const normalized = this.normalizarTexto(`${value ?? ''}`);
        if (normalized.includes('elevado'))
            return 'elevado';
        if (normalized.includes('sabandija'))
            return 'sabandija';
        return 'base';
    }

    private getSelectorPlantillaDesdeId(idPlantilla: number): CompaneroPlantillaSelector {
        if (idPlantilla === 2)
            return 'elevado';
        if (idPlantilla === 3)
            return 'sabandija';
        return 'base';
    }

    private esElementoInteractivo(target: HTMLElement | null): boolean {
        if (!target)
            return false;
        if (target.isContentEditable)
            return true;
        const selector = 'input, textarea, select, button, a, [role="button"], [role="checkbox"], [role="option"], [role="listbox"], [role="menuitem"], .cdk-overlay-pane';
        return !!target.closest(selector);
    }

    private get companerosListado(): CompaneroMonstruoDetalle[] {
        const elegibles = [...(this.companerosElegibles ?? [])];
        if (this.mostrarSoloElegibles)
            return elegibles;
        const dedupe = new Map<string, CompaneroMonstruoDetalle>();
        elegibles.forEach((companero) => {
            dedupe.set(this.getClaveCompanero(companero), companero);
        });
        (this.companerosBloqueados ?? []).forEach((item) => {
            const companero = item?.companero;
            if (!companero)
                return;
            const clave = this.getClaveCompanero(companero);
            if (!dedupe.has(clave))
                dedupe.set(clave, companero);
        });
        return Array.from(dedupe.values());
    }

    private getClaveCompanero(companero: CompaneroMonstruoDetalle | null | undefined): string {
        return `${Number(companero?.Id_companero ?? 0)}:${Number(companero?.Plantilla?.Id ?? 0)}`;
    }

    private sonMismoCompanero(a: CompaneroMonstruoDetalle | null | undefined, b: CompaneroMonstruoDetalle | null | undefined): boolean {
        return this.getClaveCompanero(a) === this.getClaveCompanero(b);
    }

    private normalizarTexto(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
