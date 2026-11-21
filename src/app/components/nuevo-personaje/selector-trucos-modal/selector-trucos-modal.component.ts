import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CompaneroMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { Truco } from 'src/app/interfaces/truco';
import {
    TrucoConMotivo, contextoDeTrucosDelCompanero, motivoTrucoAdicional, porMotivoYNombre, trucosAdicionalesPendientes, trucosQueSeOfrecen,
} from 'src/app/services/utils/companero-trucos';
import { costeDeLosTrucos } from 'src/app/services/utils/truco-coste';

/**
 * Los trucos adicionales del compañero animal (contrato: `personajes.md`, «Los trucos del compañero»): los trucos sueltos
 * del catálogo, juzgados con lo que ya sabe y con los que se van eligiendo (un truco que pide otro se puede elegir en
 * cuanto se elige el que pide), hasta gastar sus trucos adicionales. «Omitir» los deja pendientes.
 */
@Component({
    selector: 'app-selector-trucos-modal',
    templateUrl: './selector-trucos-modal.component.html',
    styleUrls: ['./selector-trucos-modal.component.sass'],
    standalone: false
})
export class SelectorTrucosModalComponent {
    @Input() titulo = 'Trucos adicionales';
    @Input() companero: CompaneroMonstruoDetalle | null = null;
    @Input() catalogo: Truco[] = [];
    /** Si se ofrecen también los homebrew (una ficha que ya no es oficial). */
    @Input() incluirHomebrew = false;

    /** Los ids de los elegidos, en el orden en que se eligieron. */
    @Output() confirmar = new EventEmitter<number[]>();
    @Output() omitir = new EventEmitter<void>();

    /** Los elegidos, en orden. */
    elegidos: Truco[] = [];
    /** El que se ve en el detalle. */
    enDetalle: Truco | null = null;

    get pendientes(): number {
        return trucosAdicionalesPendientes(this.companero);
    }

    /** Lo que le queda con los que lleva elegidos. */
    get quedan(): number {
        return Math.max(0, this.pendientes - costeDeLosTrucos(this.elegidos));
    }

    /** Los que se ofrecen: primero los que puede elegir y después los demás, con su motivo; los elegidos, como elegibles. */
    get opciones(): TrucoConMotivo[] {
        const elegidos = new Set(this.elegidos.map((t) => t.Id));
        const otros = this.elegidos;
        return trucosQueSeOfrecen(this.catalogo, this.incluirHomebrew)
            .map((truco): TrucoConMotivo => ({
                truco,
                motivo: elegidos.has(truco.Id)
                    ? null
                    : motivoTrucoAdicional(truco, contextoDeTrucosDelCompanero(this.companero, this.catalogo, otros)),
            }))
            .sort(porMotivoYNombre);
    }

    get hayAlgunoQueCabe(): boolean {
        return this.opciones.some((o) => o.motivo === null && !this.esElegido(o.truco));
    }

    get puedeConfirmar(): boolean {
        return this.elegidos.length > 0 && (this.quedan < 1 || !this.hayAlgunoQueCabe);
    }

    get textoPendiente(): string {
        if (this.quedan < 1)
            return 'Selección completa';
        return this.quedan === 1 ? 'Le queda 1 truco adicional por elegir' : `Le quedan ${this.quedan} trucos adicionales por elegir`;
    }

    esElegido(truco: Truco): boolean {
        return this.elegidos.some((t) => t.Id === truco.Id);
    }

    motivoDe(truco: Truco): string | null {
        return this.opciones.find((o) => o.truco.Id === truco.Id)?.motivo ?? null;
    }

    trackByTruco(_index: number, opcion: TrucoConMotivo): number {
        return opcion.truco.Id;
    }

    /**
     * Lo enseña en el detalle y, si se puede, lo elige o lo quita. Al quitar uno, se quitan también los elegidos después
     * que ya no valdrían sin él (el que lo pedía).
     */
    alternar(opcion: TrucoConMotivo): void {
        this.enDetalle = opcion.truco;
        if (this.esElegido(opcion.truco)) {
            const sin = this.elegidos.filter((t) => t.Id !== opcion.truco.Id);
            this.elegidos = [];
            sin.forEach((t) => {
                if (motivoTrucoAdicional(t, contextoDeTrucosDelCompanero(this.companero, this.catalogo, this.elegidos)) === null)
                    this.elegidos = [...this.elegidos, t];
            });
            return;
        }
        if (opcion.motivo === null)
            this.elegidos = [...this.elegidos, opcion.truco];
    }

    onConfirmar(): void {
        if (this.puedeConfirmar)
            this.confirmar.emit(this.elegidos.map((t) => t.Id));
    }

    onOmitir(): void {
        this.omitir.emit();
    }
}
