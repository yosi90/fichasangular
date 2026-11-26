import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CompaneroMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { claveCompanero } from 'src/app/services/utils/companero-reglas';
import { textoDelAjuste } from 'src/app/services/utils/nivel-clase-monstruo';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { porNombre } from 'src/app/services/utils/orden-texto';

export interface SelectorCompaneroConfirmacion {
    companero: CompaneroMonstruoDetalle;
    nombre: string;
    nivel: number | null;
}

export interface SelectorCompaneroBloqueadoItem {
    companero: CompaneroMonstruoDetalle;
    razones: string[];
    nivelMinimoRequerido: number | null;
}

/**
 * El selector del compañero animal de la creación: los compañeros de la lista de sus clases, cada uno con su plantilla
 * (la de su fila: sin plantilla o «Celestial»), el nivel efectivo de druida que pide y el ajuste de su lista; los que no
 * puede elegir, con su motivo. Las reglas, de los datos (`services/utils/companero-reglas.ts`).
 */
@Component({
    selector: 'app-selector-companero-modal',
    templateUrl: './selector-companero-modal.component.html',
    styleUrls: ['./selector-companero-modal.component.sass'],
    standalone: false
})
export class SelectorCompaneroModalComponent {
    @Input() titulo = 'Seleccionar compañero animal';
    @Input() companerosElegibles: CompaneroMonstruoDetalle[] = [];
    @Input() companerosBloqueados: SelectorCompaneroBloqueadoItem[] = [];
    /** El nivel efectivo de druida que pide cada compañero (por `claveCompanero`). */
    @Input() nivelesRequeridos: Record<string, number> = {};
    /** El ajuste de la lista de cada compañero (por `claveCompanero`): 0 o menos, salvo en una fila de aptitud (R8, tanda 1b). */
    @Input() ajustes: Record<string, number> = {};
    @Input() companerosSeleccionados: CompaneroMonstruoDetalle[] = [];
    @Input() incluirHomebrew = false;
    @Input() cuposDisponibles = 0;
    @Input() nombreCompanero = '';
    @Input() nivelesDisponibles: number[] = [];
    @Input() nivelSeleccionado: number | null = null;
    /** El motivo por el que la API no aceptó el compañero que se mandó (`companero_no_disponible`, `companero_no_cuadra`). */
    @Input() errorApi = '';

    @Output() confirmar = new EventEmitter<SelectorCompaneroConfirmacion>();
    @Output() omitir = new EventEmitter<void>();
    @Output() detalle = new EventEmitter<CompaneroMonstruoDetalle>();
    @Output() incluirHomebrewChange = new EventEmitter<boolean>();
    @Output() nombreCompaneroChange = new EventEmitter<string>();
    @Output() nivelChange = new EventEmitter<number | null>();

    filtroTexto = '';
    mostrarSoloElegibles = true;
    claveSeleccionada = '';

    get companerosFiltrados(): CompaneroMonstruoDetalle[] {
        const filtro = normalizarTexto(this.filtroTexto);
        const listado = this.companerosListado;
        if (filtro.length < 1)
            return listado;
        return listado.filter((companero) =>
            normalizarTexto(companero?.Nombre ?? '').includes(filtro)
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
        if (!base.some((item) => claveCompanero(item) === claveCompanero(seleccionado)))
            base.push(seleccionado);
        return base.sort(porNombre);
    }

    onSeleccionarCompanero(companero: CompaneroMonstruoDetalle): void {
        this.claveSeleccionada = claveCompanero(companero);
    }

    onCambiarHomebrew(value: boolean): void {
        this.incluirHomebrewChange.emit(!!value);
        this.claveSeleccionada = '';
    }

    onCambiarNombreCompanero(value: string): void {
        this.nombreCompaneroChange.emit(`${value ?? ''}`);
    }

    onCambiarNivel(value: number | null): void {
        const nivel = value === null || value === undefined ? null : Number(value);
        this.nivelChange.emit(Number.isFinite(Number(nivel)) ? Math.max(0, Math.trunc(Number(nivel))) : null);
        this.claveSeleccionada = '';
    }

    onAbrirDetalle(companero: CompaneroMonstruoDetalle, event?: Event): void {
        event?.stopPropagation();
        this.detalle.emit(companero);
    }

    onAlternarSoloElegibles(): void {
        this.mostrarSoloElegibles = !this.mostrarSoloElegibles;
        this.claveSeleccionada = '';
    }

    onConfirmar(): void {
        const companero = this.companerosFiltrados.find((item) => this.esSeleccionado(item));
        if (!companero || !this.esCompaneroElegible(companero))
            return;
        this.confirmar.emit({
            companero,
            nombre: `${this.nombreCompanero ?? ''}`.trim(),
            nivel: this.nivelSeleccionado === null ? null : Number(this.nivelSeleccionado),
        });
    }

    onOmitir(): void {
        this.omitir.emit();
    }

    esSeleccionado(companero: CompaneroMonstruoDetalle): boolean {
        return this.claveSeleccionada.length > 0 && this.claveSeleccionada === claveCompanero(companero);
    }

    /** La plantilla del compañero (la de su fila de la lista); vacío sin plantilla. */
    getEtiquetaPlantilla(companero: CompaneroMonstruoDetalle | null | undefined): string {
        return Number(companero?.Plantilla?.Id ?? 0) > 0 ? `${companero?.Plantilla?.Nombre ?? ''}`.trim() : '';
    }

    /** El ajuste de su lista («−3»; el de una fila de aptitud puede sumar: «+3», el tejón del explorador gnomo); vacío si no ajusta. */
    getEtiquetaAjuste(companero: CompaneroMonstruoDetalle): string {
        return textoDelAjuste(this.ajustes?.[claveCompanero(companero)]);
    }

    esCompaneroElegible(companero: CompaneroMonstruoDetalle): boolean {
        return (this.companerosElegibles ?? []).some((item) => claveCompanero(item) === claveCompanero(companero));
    }

    getEtiquetaEstado(companero: CompaneroMonstruoDetalle): string {
        return this.esCompaneroElegible(companero) ? 'Elegible' : 'Bloqueada';
    }

    getMotivosBloqueo(companero: CompaneroMonstruoDetalle): string[] {
        const bloqueado = (this.companerosBloqueados ?? []).find((item) => claveCompanero(item?.companero) === claveCompanero(companero));
        if (!bloqueado)
            return [];
        return Array.from(new Set((bloqueado.razones ?? []).filter((motivo) => `${motivo ?? ''}`.trim().length > 0)));
    }

    getNivelRequerido(companero: CompaneroMonstruoDetalle): number | null {
        const nivel = Number(this.nivelesRequeridos?.[claveCompanero(companero)] ?? 0);
        if (!Number.isFinite(nivel) || nivel <= 0)
            return null;
        return Math.trunc(nivel);
    }

    /** Lo que pide su lista: el nivel efectivo de druida y, si lo tiene, el ajuste para la tabla del compañero. */
    getExplicacionNivel(companero: CompaneroMonstruoDetalle): string {
        const nivel = this.getNivelRequerido(companero);
        const ajuste = this.getEtiquetaAjuste(companero);
        const partes: string[] = [];
        if (nivel !== null)
            partes.push(`Pide un nivel efectivo de druida ${nivel}: se suman los niveles de tus clases que dan compañero animal, cada una como dice su tabla.`);
        if (ajuste.length > 0)
            partes.push(`Su lista ${ajuste.startsWith('+') ? 'suma' : 'resta'} ${ajuste.replace(/^[+−]/, '')} a ese nivel para la tabla del compañero (sus DG, sus bonos y sus aptitudes).`);
        return partes.join(' ');
    }

    trackByCompanero(index: number, companero: CompaneroMonstruoDetalle): string {
        return `${index}:${claveCompanero(companero)}`;
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

    private get companerosListado(): CompaneroMonstruoDetalle[] {
        const elegibles = [...(this.companerosElegibles ?? [])];
        if (this.mostrarSoloElegibles)
            return elegibles;
        const dedupe = new Map<string, CompaneroMonstruoDetalle>();
        elegibles.forEach((companero) => dedupe.set(claveCompanero(companero), companero));
        (this.companerosBloqueados ?? []).forEach((item) => {
            const companero = item?.companero;
            if (companero && !dedupe.has(claveCompanero(companero)))
                dedupe.set(claveCompanero(companero), companero);
        });
        return Array.from(dedupe.values());
    }
}
