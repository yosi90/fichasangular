import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { DisciplinaConjuros } from 'src/app/interfaces/disciplina-conjuros';
import { EscuelaConjuros } from 'src/app/interfaces/escuela-conjuros';

export interface SelectorEspecialidadArcanaConfirmacion {
    especializar: boolean;
    escuelaEspecialistaId: number | null;
    escuelasProhibidasIds: number[];
}

export interface SelectorEspecialidadPsionicaConfirmacion {
    disciplinaEspecialistaId: number | null;
    disciplinaProhibidaId: number | null;
}

export interface SelectorEspecialidadMagicaConfirmacion {
    arcana?: SelectorEspecialidadArcanaConfirmacion;
    psionica?: SelectorEspecialidadPsionicaConfirmacion;
}

@Component({
    selector: 'app-selector-especialidad-magica-modal',
    templateUrl: './selector-especialidad-magica-modal.component.html',
    styleUrls: ['./selector-especialidad-magica-modal.component.sass'],
    standalone: false
})
export class SelectorEspecialidadMagicaModalComponent {
    @Input() titulo = 'Especialización mágica';
    @Input() nombreClase = '';
    @Input() mostrarArcano = false;
    @Input() mostrarPsionico = false;
    @Input() escuelas: EscuelaConjuros[] = [];
    @Input() disciplinas: DisciplinaConjuros[] = [];

    @Output() confirmar = new EventEmitter<SelectorEspecialidadMagicaConfirmacion>();

    arcanoEspecializar = false;
    arcanoEscuelaEspecialistaId: number | null = null;
    arcanoEscuelasProhibidasIds: number[] = [];

    psionicoDisciplinaEspecialistaId: number | null = null;
    psionicoDisciplinaProhibidaId: number | null = null;

    get escuelasEspecializables(): EscuelaConjuros[] {
        return (this.escuelas ?? [])
            .filter((escuela) => Number(escuela?.Id ?? 0) > 0)
            .sort((a, b) => `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
    }

    get escuelaEspecialistaSeleccionada(): EscuelaConjuros | null {
        const id = Number(this.arcanoEscuelaEspecialistaId ?? 0);
        if (!Number.isFinite(id) || id <= 0)
            return null;
        return this.escuelasEspecializables.find((escuela) => Number(escuela?.Id ?? 0) === id) ?? null;
    }

    get escuelasProhibibles(): EscuelaConjuros[] {
        const idEspecialista = Number(this.arcanoEscuelaEspecialistaId ?? 0);
        return this.escuelasEspecializables
            .filter((escuela) => Number(escuela?.Id ?? 0) !== idEspecialista)
            .filter((escuela) => !!escuela?.Prohibible)
            .filter((escuela) => this.normalizarTexto(escuela?.Nombre ?? '') !== 'adivinacion');
    }

    get disciplinasEspecializables(): DisciplinaConjuros[] {
        return (this.disciplinas ?? [])
            .filter((disciplina) => Number(disciplina?.Id ?? 0) > 0)
            .sort((a, b) => `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
    }

    get disciplinasProhibibles(): DisciplinaConjuros[] {
        const idEspecialista = Number(this.psionicoDisciplinaEspecialistaId ?? 0);
        return this.disciplinasEspecializables.filter((disciplina) => Number(disciplina?.Id ?? 0) !== idEspecialista);
    }

    get escuelasProhibidasRequeridas(): number {
        if (!this.arcanoEspecializar)
            return 0;
        const escuela = this.escuelaEspecialistaSeleccionada;
        if (!escuela)
            return 0;
        return this.normalizarTexto(escuela.Nombre) === 'adivinacion' ? 1 : 2;
    }

    get arcanoValido(): boolean {
        if (!this.mostrarArcano)
            return true;
        if (!this.arcanoEspecializar)
            return true;

        const idEspecialista = Number(this.arcanoEscuelaEspecialistaId ?? 0);
        if (!Number.isFinite(idEspecialista) || idEspecialista <= 0)
            return false;

        const idsProhibidas = this.idsEscuelasProhibidasSeleccionadas;
        if (idsProhibidas.length !== this.escuelasProhibidasRequeridas)
            return false;

        const permitidas = new Set(this.escuelasProhibibles.map((escuela) => Number(escuela?.Id ?? 0)));
        return idsProhibidas.every((id) => permitidas.has(id));
    }

    get psionicoValido(): boolean {
        if (!this.mostrarPsionico)
            return true;

        const idEspecialista = Number(this.psionicoDisciplinaEspecialistaId ?? 0);
        const idProhibida = Number(this.psionicoDisciplinaProhibidaId ?? 0);
        if (!Number.isFinite(idEspecialista) || idEspecialista <= 0)
            return false;
        if (!Number.isFinite(idProhibida) || idProhibida <= 0)
            return false;
        if (idEspecialista === idProhibida)
            return false;

        const idsValidos = new Set(this.disciplinasEspecializables.map((disciplina) => Number(disciplina?.Id ?? 0)));
        return idsValidos.has(idEspecialista) && idsValidos.has(idProhibida);
    }

    get puedeConfirmar(): boolean {
        return this.arcanoValido && this.psionicoValido;
    }

    get idsEscuelasProhibidasSeleccionadas(): number[] {
        return Array.from(new Set(
            (this.arcanoEscuelasProhibidasIds ?? [])
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id) && id > 0)
        ));
    }

    get textoArcanoEstado(): string {
        if (!this.arcanoEspecializar)
            return 'No especializado (válido)';
        const escuela = this.escuelaEspecialistaSeleccionada;
        if (!escuela)
            return 'Selecciona escuela especialista';
        const faltan = Math.max(0, this.escuelasProhibidasRequeridas - this.idsEscuelasProhibidasSeleccionadas.length);
        if (faltan < 1)
            return 'Selección arcana completa';
        if (faltan === 1)
            return 'Falta 1 escuela prohibida';
        return `Faltan ${faltan} escuelas prohibidas`;
    }

    onToggleArcanoEspecializar(value: boolean): void {
        this.arcanoEspecializar = !!value;
        if (!this.arcanoEspecializar) {
            this.arcanoEscuelaEspecialistaId = null;
            this.arcanoEscuelasProhibidasIds = [];
            return;
        }

        this.reconciliarEscuelasProhibidas();
    }

    onChangeEscuelaEspecialista(value: number | string | null): void {
        const id = this.toPositiveId(value);
        this.arcanoEscuelaEspecialistaId = id > 0 ? id : null;
        this.reconciliarEscuelasProhibidas();
    }

    isEscuelaProhibidaSeleccionada(idEscuela: number): boolean {
        return this.idsEscuelasProhibidasSeleccionadas.includes(Number(idEscuela));
    }

    isEscuelaProhibidaBloqueada(idEscuela: number): boolean {
        const id = Number(idEscuela ?? 0);
        const seleccionada = this.isEscuelaProhibidaSeleccionada(id);
        return !seleccionada && this.idsEscuelasProhibidasSeleccionadas.length >= this.escuelasProhibidasRequeridas;
    }

    onToggleEscuelaProhibida(idEscuela: number, checked: boolean): void {
        const id = this.toPositiveId(idEscuela);
        if (id <= 0)
            return;

        if (!checked) {
            this.arcanoEscuelasProhibidasIds = this.idsEscuelasProhibidasSeleccionadas.filter((actual) => actual !== id);
            return;
        }

        if (this.isEscuelaProhibidaBloqueada(id))
            return;

        this.arcanoEscuelasProhibidasIds = [...this.idsEscuelasProhibidasSeleccionadas, id];
    }

    onClickEscuelaProhibidaFila(idEscuela: number | string | null | undefined): void {
        const id = this.toPositiveId(idEscuela);
        if (id <= 0)
            return;

        if (this.isEscuelaProhibidaBloqueada(id))
            return;

        const siguienteEstado = !this.isEscuelaProhibidaSeleccionada(id);
        this.onToggleEscuelaProhibida(id, siguienteEstado);
    }

    onChangeDisciplinaEspecialista(value: number | string | null): void {
        const id = this.toPositiveId(value);
        this.psionicoDisciplinaEspecialistaId = id > 0 ? id : null;
        if (this.psionicoDisciplinaProhibidaId === this.psionicoDisciplinaEspecialistaId)
            this.psionicoDisciplinaProhibidaId = null;
    }

    onChangeDisciplinaProhibida(value: number | string | null): void {
        const id = this.toPositiveId(value);
        this.psionicoDisciplinaProhibidaId = id > 0 ? id : null;
    }

    onConfirmar(): void {
        if (!this.puedeConfirmar)
            return;

        const payload: SelectorEspecialidadMagicaConfirmacion = {
            arcana: this.mostrarArcano
                ? {
                    especializar: !!this.arcanoEspecializar,
                    escuelaEspecialistaId: this.arcanoEspecializar ? this.arcanoEscuelaEspecialistaId : null,
                    escuelasProhibidasIds: this.arcanoEspecializar ? this.idsEscuelasProhibidasSeleccionadas : [],
                }
                : undefined,
            psionica: this.mostrarPsionico
                ? {
                    disciplinaEspecialistaId: this.psionicoDisciplinaEspecialistaId,
                    disciplinaProhibidaId: this.psionicoDisciplinaProhibidaId,
                }
                : undefined,
        };

        this.confirmar.emit(payload);
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

    private reconciliarEscuelasProhibidas(): void {
        if (!this.arcanoEspecializar) {
            this.arcanoEscuelasProhibidasIds = [];
            return;
        }

        const idsPermitidos = new Set(this.escuelasProhibibles.map((escuela) => Number(escuela?.Id ?? 0)));
        const actual = this.idsEscuelasProhibidasSeleccionadas.filter((id) => idsPermitidos.has(id));
        this.arcanoEscuelasProhibidasIds = actual.slice(0, this.escuelasProhibidasRequeridas);
    }

    toPositiveId(value: number | string | null | undefined): number {
        const id = Number(value ?? 0);
        if (!Number.isFinite(id))
            return 0;
        return id > 0 ? id : 0;
    }

    private normalizarTexto(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
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
