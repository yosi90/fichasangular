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

    readonly minimos: number[] = Array.from({ length: 11 }, (_, i) => i + 3);
    readonly tablasPermitidasOpciones: number[] = [1, 2, 3, 4, 5];
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

    get tituloModal(): string {
        const nombre = this.nuevoPSvc.PersonajeCreacion?.Nombre?.trim() ?? '';
        return nombre.length > 0
            ? `Repartiendo las características de ${nombre}`
            : 'Repartiendo las características de [Nombre del personaje]';
    }

    onMinimoChange(value: number): void {
        this.nuevoPSvc.setMinimoGenerador(Number(value));
    }

    onTablasPermitidasChange(value: number): void {
        this.nuevoPSvc.setTablasPermitidasGenerador(Number(value));
    }

    get tablasVisibles(): { numero: number; valores: number[]; }[] {
        return Array.from({ length: this.estado.tablasPermitidas }, (_, i) => {
            const numero = i + 1;
            return {
                numero,
                valores: this.nuevoPSvc.getTiradasTabla(numero),
            };
        });
    }

    seleccionarTabla(tabla: number): void {
        this.nuevoPSvc.seleccionarTablaGenerador(tabla);
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

    onClickCaracteristica(caracteristica: CaracteristicaKey): void {
        this.nuevoPSvc.desasignarCaracteristicaGenerador(caracteristica);
    }

    onClickPoolItem(index: number): void {
        if (this.estado.poolDisponible[index] >= 0) {
            return;
        }
        this.nuevoPSvc.desasignarDesdeIndicePoolGenerador(index);
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

    isTablaSeleccionada(tabla: number): boolean {
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
        if (this.estado.tablaSeleccionada === null) {
            return true;
        }

        if (caracteristica === 'Constitucion' && this.pierdeConstitucion) {
            return true;
        }

        return this.estado.asignaciones[caracteristica] !== null;
    }

    caracteristicaConValor(caracteristica: CaracteristicaKey): boolean {
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

    isPoolItemUsado(index: number): boolean {
        return this.estado.poolDisponible[index] < 0;
    }
}
