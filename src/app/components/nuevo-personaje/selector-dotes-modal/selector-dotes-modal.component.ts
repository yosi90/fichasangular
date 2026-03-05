import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Dote } from 'src/app/interfaces/dote';
import { DoteSeleccionConfirmada, DoteSelectorCandidato, DotePendienteState } from 'src/app/services/nuevo-personaje.service';

@Component({
    selector: 'app-selector-dotes-modal',
    templateUrl: './selector-dotes-modal.component.html',
    styleUrls: ['./selector-dotes-modal.component.sass'],
    standalone: false
})
export class SelectorDotesModalComponent {
    @Input() titulo: string = 'Seleccionar dote';
    @Input() pendiente: DotePendienteState | null = null;
    @Input() pendientesRestantes: number = 0;
    @Input() candidatos: DoteSelectorCandidato[] = [];

    @Output() confirmar = new EventEmitter<DoteSeleccionConfirmada>();
    @Output() omitir = new EventEmitter<void>();
    @Output() detalle = new EventEmitter<Dote>();

    filtroTexto = '';
    filtroManual = 'Cualquiera';
    filtroTipo = 'Cualquiera';
    mostrarSoloElegibles = false;
    idDoteSeleccionada = 0;
    idExtraSeleccionado = 0;

    get candidatosFiltrados(): DoteSelectorCandidato[] {
        const textoNorm = this.normalizarTexto(this.filtroTexto);
        const manualNorm = this.normalizarTexto(this.filtroManual);
        const tipoNorm = this.normalizarTexto(this.filtroTipo);

        return (this.candidatos ?? [])
            .filter((candidato) => {
                if (!this.mostrarSoloElegibles)
                    return true;
                return this.esCandidatoElegible(candidato);
            })
            .filter((candidato) => {
                if (textoNorm.length < 1)
                    return true;
                const nombre = this.normalizarTexto(candidato?.dote?.Nombre ?? '');
                const descripcion = this.normalizarTexto(candidato?.dote?.Descripcion ?? '');
                const beneficio = this.normalizarTexto(candidato?.dote?.Beneficio ?? '');
                return nombre.includes(textoNorm) || descripcion.includes(textoNorm) || beneficio.includes(textoNorm);
            })
            .filter((candidato) => {
                if (manualNorm.length < 1 || manualNorm === this.normalizarTexto('Cualquiera'))
                    return true;
                return this.normalizarTexto(candidato?.dote?.Manual?.Nombre ?? '') === manualNorm;
            })
            .filter((candidato) => {
                if (tipoNorm.length < 1 || tipoNorm === this.normalizarTexto('Cualquiera'))
                    return true;
                return (candidato?.dote?.Tipos ?? [])
                    .some((tipo) => this.normalizarTexto(tipo?.Nombre ?? '') === tipoNorm);
            })
            .sort((a, b) => `${a?.dote?.Nombre ?? ''}`.localeCompare(`${b?.dote?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
    }

    get candidatosColumnaA(): DoteSelectorCandidato[] {
        return this.candidatosFiltrados.filter((_candidato, index) => index % 2 === 0);
    }

    get candidatosColumnaB(): DoteSelectorCandidato[] {
        return this.candidatosFiltrados.filter((_candidato, index) => index % 2 === 1);
    }

    get candidatoSeleccionado(): DoteSelectorCandidato | null {
        const id = this.toNumber(this.idDoteSeleccionada);
        if (id <= 0)
            return null;
        return (this.candidatos ?? []).find((candidato) => this.toNumber(candidato?.dote?.Id) === id) ?? null;
    }

    get extrasCandidatoSeleccionado(): Array<{ Id: number; Nombre: string; }> {
        const candidato = this.candidatoSeleccionado;
        if (!candidato)
            return [];
        return (candidato.extrasDisponibles ?? [])
            .map((extra) => ({
                Id: this.toNumber(extra?.Id),
                Nombre: `${extra?.Nombre ?? ''}`.trim(),
            }))
            .filter((extra) => extra.Id > 0 && extra.Nombre.length > 0);
    }

    get requiereExtraSeleccionado(): boolean {
        return !!this.candidatoSeleccionado?.requiereExtra;
    }

    get cantidadElegibles(): number {
        return (this.candidatos ?? []).filter((candidato) => this.esCandidatoElegible(candidato)).length;
    }

    get manualesDisponibles(): string[] {
        const base = (this.candidatos ?? [])
            .map((candidato) => `${candidato?.dote?.Manual?.Nombre ?? ''}`.trim())
            .filter((nombre) => nombre.length > 0);
        return ['Cualquiera', ...Array.from(new Set(base)).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
    }

    get tiposDisponibles(): string[] {
        const tipos = (this.candidatos ?? [])
            .flatMap((candidato) => candidato?.dote?.Tipos ?? [])
            .map((tipo) => `${tipo?.Nombre ?? ''}`.trim())
            .filter((nombre) => nombre.length > 0);
        return ['Cualquiera', ...Array.from(new Set(tipos)).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
    }

    get textoPendientes(): string {
        if (this.pendientesRestantes <= 1)
            return '1 dote pendiente en cola';
        return `${this.pendientesRestantes} dotes pendientes en cola`;
    }

    getFuenteTexto(pendiente: DotePendienteState): string {
        if (!pendiente)
            return 'Fuente: dote adicional';
        if (pendiente.fuente === 'nivel')
            return 'Fuente: dote por nivel';
        if (pendiente.fuente === 'raza_dg')
            return `Fuente: DGs de raza: ${pendiente.origen || 'Raza'}`;
        return 'Fuente: dote adicional';
    }

    get puedeConfirmar(): boolean {
        const candidato = this.candidatoSeleccionado;
        if (!candidato || !this.esCandidatoElegible(candidato))
            return false;

        if (!candidato.requiereExtra)
            return true;

        return this.extrasCandidatoSeleccionado.some((extra) => this.toNumber(extra?.Id) === this.toNumber(this.idExtraSeleccionado));
    }

    trackByDoteId = (_index: number, candidato: DoteSelectorCandidato): number => {
        const parsed = Number(candidato?.dote?.Id);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    esSeleccionada(candidato: DoteSelectorCandidato): boolean {
        return this.toNumber(candidato?.dote?.Id) === this.toNumber(this.idDoteSeleccionada);
    }

    esCandidatoElegible(candidato: DoteSelectorCandidato): boolean {
        if (!candidato || candidato.restringidaPorTipo || !candidato.repeticionValida)
            return false;
        return candidato.evaluacion?.estado === 'eligible';
    }

    getEtiquetaEstado(candidato: DoteSelectorCandidato): string {
        if (this.esCandidatoElegible(candidato))
            return 'Elegible';
        if (candidato?.evaluacion?.estado === 'blocked_unknown')
            return 'Formato no soportado';
        return 'Bloqueada';
    }

    getMotivosBloqueo(candidato: DoteSelectorCandidato): string[] {
        const motivos: string[] = [];
        if (candidato?.restringidaPorTipo)
            motivos.push('No cumple la restricción de tipo para esta dote pendiente.');
        if (!candidato?.repeticionValida)
            motivos.push('Regla de repetición no cumplida.');
        motivos.push(...(candidato?.evaluacion?.razones ?? []));
        return Array.from(new Set(motivos.filter((motivo) => `${motivo ?? ''}`.trim().length > 0)));
    }

    getTiposTexto(candidato: DoteSelectorCandidato): string {
        const tipos = (candidato?.dote?.Tipos ?? [])
            .map((tipo) => `${tipo?.Nombre ?? ''}`.trim())
            .filter((nombre) => nombre.length > 0);
        return tipos.length > 0 ? tipos.join(', ') : 'Sin tipo';
    }

    seleccionarCandidato(candidato: DoteSelectorCandidato): void {
        if (!candidato)
            return;
        this.idDoteSeleccionada = this.toNumber(candidato?.dote?.Id);
        this.idExtraSeleccionado = 0;
    }

    onAlternarSoloElegibles(): void {
        this.mostrarSoloElegibles = !this.mostrarSoloElegibles;
    }

    onOmitir(): void {
        this.omitir.emit();
    }

    onVerDetalle(candidato: DoteSelectorCandidato): void {
        const dote = candidato?.dote;
        if (!dote)
            return;
        this.detalle.emit(dote);
    }

    onConfirmar(): void {
        if (!this.puedeConfirmar)
            return;

        const candidato = this.candidatoSeleccionado;
        if (!candidato)
            return;

        const idDote = this.toNumber(candidato?.dote?.Id);
        const idExtra = candidato.requiereExtra ? this.toNumber(this.idExtraSeleccionado) : 0;
        const extraNombre = candidato.requiereExtra
            ? (this.extrasCandidatoSeleccionado.find((extra) => this.toNumber(extra?.Id) === idExtra)?.Nombre ?? '')
            : 'No aplica';

        this.confirmar.emit({
            idDote,
            idExtra,
            extra: `${extraNombre ?? ''}`.trim(),
        });
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

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private normalizarTexto(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
