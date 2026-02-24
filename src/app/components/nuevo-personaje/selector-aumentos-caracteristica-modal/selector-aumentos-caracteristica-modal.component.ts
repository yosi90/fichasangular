import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import {
    AsignacionAumentoCaracteristica,
    AumentoCaracteristicaPendiente,
    CaracteristicaKeyAumento,
} from 'src/app/services/nuevo-personaje.service';

type CaracteristicaKey = CaracteristicaKeyAumento;

@Component({
    selector: 'app-selector-aumentos-caracteristica-modal',
    templateUrl: './selector-aumentos-caracteristica-modal.component.html',
    styleUrls: ['./selector-aumentos-caracteristica-modal.component.sass']
})
export class SelectorAumentosCaracteristicaModalComponent {
    @Input() titulo = 'Seleccionar aumentos de caracteristica';
    @Input() pendientes: AumentoCaracteristicaPendiente[] = [];
    @Input() caracteristicasActuales: Record<CaracteristicaKey, number> = {
        Fuerza: 0,
        Destreza: 0,
        Constitucion: 0,
        Inteligencia: 0,
        Sabiduria: 0,
        Carisma: 0,
    };
    @Input() caracteristicasPerdidas: Partial<Record<CaracteristicaKey, boolean>> | null = null;
    @Input() topesCaracteristicas: Partial<Record<CaracteristicaKey, number>> = {};

    @Output() cerrar = new EventEmitter<void>();
    @Output() confirmar = new EventEmitter<AsignacionAumentoCaracteristica[]>();

    readonly caracteristicas: { key: CaracteristicaKey; label: string; }[] = [
        { key: 'Fuerza', label: 'Fuerza' },
        { key: 'Destreza', label: 'Destreza' },
        { key: 'Constitucion', label: 'Constitucion' },
        { key: 'Inteligencia', label: 'Inteligencia' },
        { key: 'Sabiduria', label: 'Sabiduria' },
        { key: 'Carisma', label: 'Carisma' },
    ];

    private asignaciones = new Map<number, CaracteristicaKey>();

    get pendientesNormalizados(): AumentoCaracteristicaPendiente[] {
        return (this.pendientes ?? [])
            .map((pendiente) => ({
                id: Number(pendiente?.id ?? 0),
                valor: Math.max(1, Math.trunc(Number(pendiente?.valor ?? 1))),
                origen: `${pendiente?.origen ?? ''}`.trim(),
                descripcion: `${pendiente?.descripcion ?? ''}`.trim(),
            }))
            .filter((pendiente) => Number.isFinite(pendiente.id) && pendiente.id > 0);
    }

    get cantidadPendiente(): number {
        return this.pendientesNormalizados
            .filter((pendiente) => !this.asignaciones.has(pendiente.id))
            .length;
    }

    get puedeConfirmar(): boolean {
        return this.pendientesNormalizados.length > 0 && this.cantidadPendiente < 1;
    }

    get puedeCerrar(): boolean {
        return false;
    }

    get textoPendiente(): string {
        if (this.cantidadPendiente < 1)
            return 'Seleccion completa';
        if (this.cantidadPendiente === 1)
            return 'Falta 1 aumento por asignar';
        return `Faltan ${this.cantidadPendiente} aumentos por asignar`;
    }

    trackByPendienteId(_index: number, pendiente: AumentoCaracteristicaPendiente): number {
        return Number(pendiente?.id ?? 0);
    }

    getAsignacionPendiente(idPendiente: number): CaracteristicaKey | '' {
        return this.asignaciones.get(Number(idPendiente)) ?? '';
    }

    onAsignarPendiente(idPendiente: number, caracteristica: string): void {
        const id = Number(idPendiente);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const valor = `${caracteristica ?? ''}`.trim();
        if (!this.esCaracteristicaValida(valor)) {
            this.asignaciones.delete(id);
            return;
        }
        if (this.esCaracteristicaPerdida(valor))
            return;

        this.asignaciones.set(id, valor);
    }

    onLimpiarPendiente(idPendiente: number): void {
        const id = Number(idPendiente);
        if (!Number.isFinite(id) || id <= 0)
            return;
        this.asignaciones.delete(id);
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

    onCerrar(): void {
        if (!this.puedeCerrar)
            return;
        this.cerrar.emit();
    }

    onConfirmar(): void {
        if (!this.puedeConfirmar)
            return;

        const asignaciones: AsignacionAumentoCaracteristica[] = [];
        for (const pendiente of this.pendientesNormalizados) {
            const caracteristica = this.asignaciones.get(pendiente.id);
            if (!caracteristica)
                return;
            asignaciones.push({
                idPendiente: pendiente.id,
                caracteristica,
            });
        }

        this.confirmar.emit(asignaciones);
    }

    isCaracteristicaOpcionDeshabilitada(caracteristica: CaracteristicaKey): boolean {
        return this.esCaracteristicaPerdida(caracteristica);
    }

    getIncrementoSeleccionado(caracteristica: CaracteristicaKey): number {
        return this.pendientesNormalizados.reduce((acc, pendiente) => {
            const seleccion = this.asignaciones.get(pendiente.id);
            if (seleccion !== caracteristica)
                return acc;
            return acc + Math.max(0, Number(pendiente?.valor ?? 0));
        }, 0);
    }

    getValorProyectado(caracteristica: CaracteristicaKey): number {
        const actual = Number(this.caracteristicasActuales?.[caracteristica] ?? 0);
        return actual + this.getIncrementoSeleccionado(caracteristica);
    }

    tieneAvisoTope(caracteristica: CaracteristicaKey): boolean {
        const tope = this.getTope(caracteristica);
        if (tope === null)
            return false;
        const incremento = this.getIncrementoSeleccionado(caracteristica);
        if (incremento < 1)
            return false;
        return this.getValorProyectado(caracteristica) > tope;
    }

    getAvisoTope(caracteristica: CaracteristicaKey): string {
        const tope = this.getTope(caracteristica);
        if (tope === null || !this.tieneAvisoTope(caracteristica))
            return '';

        const actual = Number(this.caracteristicasActuales?.[caracteristica] ?? 0);
        const proyectado = this.getValorProyectado(caracteristica);
        if (actual >= tope)
            return `Ya estaba en el maximo (${tope}) y pasara a ${proyectado}.`;
        return `Supera el maximo (${tope}) y pasara a ${proyectado}.`;
    }

    private getTope(caracteristica: CaracteristicaKey): number | null {
        const valor = Number(this.topesCaracteristicas?.[caracteristica] ?? 0);
        if (!Number.isFinite(valor) || valor <= 0)
            return null;
        return Math.trunc(valor);
    }

    private esCaracteristicaPerdida(caracteristica: CaracteristicaKey): boolean {
        return this.toBoolean((this.caracteristicasPerdidas as Record<string, any> | null)?.[caracteristica]);
    }

    private esCaracteristicaValida(valor: string): valor is CaracteristicaKey {
        return this.caracteristicas.some((caracteristica) => caracteristica.key === valor);
    }

    private toBoolean(value: any): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value === 1;
        if (typeof value === 'string') {
            const normalizado = value.trim().toLowerCase();
            return normalizado === '1' || normalizado === 'true' || normalizado === 'si' || normalizado === 'sí';
        }
        return false;
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
