import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Raza } from 'src/app/interfaces/raza';
import { AsignacionCaracteristicas, NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';

type CaracteristicaKey = keyof AsignacionCaracteristicas;

@Component({
    selector: 'app-generador-caracteristicas-modal',
    templateUrl: './generador-caracteristicas-modal.component.html',
    styleUrls: ['./generador-caracteristicas-modal.component.sass']
})
export class GeneradorCaracteristicasModalComponent {
    @Input() raza!: Raza;
    @Input() pierdeConstitucion = false;

    @Output() cerrar: EventEmitter<void> = new EventEmitter<void>();
    @Output() finalizar: EventEmitter<AsignacionCaracteristicas> = new EventEmitter<AsignacionCaracteristicas>();

    readonly subtitulo = 'Elige una de estas tres tablas de tiradas. Han sido aleatorizadas según la tirada mínima';
    readonly minimos: number[] = Array.from({ length: 11 }, (_, i) => i + 3);
    readonly caracteristicas: { key: CaracteristicaKey; label: string; }[] = [
        { key: 'Fuerza', label: 'Fuerza' },
        { key: 'Destreza', label: 'Destreza' },
        { key: 'Constitucion', label: 'Constitución' },
        { key: 'Inteligencia', label: 'Inteligencia' },
        { key: 'Sabiduria', label: 'Sabiduría' },
        { key: 'Carisma', label: 'Carisma' },
    ];

    constructor(private nuevoPSvc: NuevoPersonajeService) {
        this.nuevoPSvc.abrirModalCaracteristicas();
    }

    get estado() {
        return this.nuevoPSvc.EstadoFlujo.generador;
    }

    get puedeFinalizar(): boolean {
        return this.nuevoPSvc.puedeFinalizarGenerador();
    }

    get tabla1(): number[] {
        return this.nuevoPSvc.getTiradasTabla(1);
    }

    get tabla2(): number[] {
        return this.nuevoPSvc.getTiradasTabla(2);
    }

    get tabla3(): number[] {
        return this.nuevoPSvc.getTiradasTabla(3);
    }

    onMinimoChange(value: number): void {
        this.nuevoPSvc.setMinimoGenerador(Number(value));
    }

    seleccionarTabla(tabla: 1 | 2 | 3): void {
        this.nuevoPSvc.seleccionarTablaGenerador(tabla);
    }

    fijarOReiniciar(): void {
        if (!this.estado.tablaFijada) {
            this.nuevoPSvc.fijarTablaGenerador();
            return;
        }
        this.nuevoPSvc.resetearGeneradorCaracteristicas();
    }

    permitirSoltar(event: DragEvent): void {
        event.preventDefault();
    }

    iniciarArrastre(index: number, event: DragEvent): void {
        const valor = this.estado.poolDisponible[index];
        if (valor < 0 || !event.dataTransfer) {
            event.preventDefault();
            return;
        }

        event.dataTransfer.setData('text/plain', `${index}`);
        event.dataTransfer.effectAllowed = 'copyMove';
    }

    soltarEnCaracteristica(caracteristica: CaracteristicaKey, event: DragEvent): void {
        event.preventDefault();
        const data = event.dataTransfer?.getData('text/plain') ?? '';
        const index = Number(data);
        if (!Number.isFinite(index)) {
            return;
        }

        this.nuevoPSvc.asignarDesdePoolACaracteristica(caracteristica, index);
    }

    cerrarModal(): void {
        this.cerrar.emit();
    }

    finalizarAsignacion(): void {
        if (!this.puedeFinalizar) {
            return;
        }

        this.finalizar.emit(this.nuevoPSvc.getAsignacionesGenerador());
    }

    isTablaSeleccionada(tabla: 1 | 2 | 3): boolean {
        return this.estado.tablaSeleccionada === tabla;
    }

    getValorAsignado(caracteristica: CaracteristicaKey): string {
        if (caracteristica === 'Constitucion' && this.pierdeConstitucion) {
            return '-';
        }

        const value = this.estado.asignaciones[caracteristica];
        return value === null ? 'Soltar aquí' : `${value}`;
    }

    caracteristicaBloqueada(caracteristica: CaracteristicaKey): boolean {
        if (!this.estado.tablaFijada) {
            return true;
        }

        if (caracteristica === 'Constitucion' && this.pierdeConstitucion) {
            return true;
        }

        return this.estado.asignaciones[caracteristica] !== null;
    }

    getModRacial(caracteristica: CaracteristicaKey): number {
        return Number(this.raza?.Modificadores?.[caracteristica] ?? 0);
    }

    formatMod(value: number): string {
        return value > 0 ? `+${value}` : `${value}`;
    }

    getPoolValor(index: number): string {
        const value = this.estado.poolDisponible[index];
        return value < 0 ? 'Usado' : `${value}`;
    }
}
