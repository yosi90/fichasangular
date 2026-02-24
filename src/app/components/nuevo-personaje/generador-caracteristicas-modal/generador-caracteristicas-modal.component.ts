import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Raza } from 'src/app/interfaces/raza';
import {
    AsignacionCaracteristicas,
    GeneradorAutoDetalle,
    GeneradorAutoEnfoque,
    GeneradorAutoPerfil,
    NuevoPersonajeService
} from 'src/app/services/nuevo-personaje.service';
import Swal from 'sweetalert2';

type CaracteristicaKey = keyof AsignacionCaracteristicas;
type CaracteristicasPerdidasState = Partial<Record<CaracteristicaKey, boolean>>;
interface PreviewCaracteristica {
    valorFinal: number;
    modificador: number;
}

@Component({
    selector: 'app-generador-caracteristicas-modal',
    templateUrl: './generador-caracteristicas-modal.component.html',
    styleUrls: ['./generador-caracteristicas-modal.component.sass']
})
export class GeneradorCaracteristicasModalComponent {
    @Input() raza!: Raza;
    @Input() caracteristicasPerdidas: CaracteristicasPerdidasState | null = null;
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

    async repartirAutomaticamente(): Promise<void> {
        if (this.tieneAsignacionesPrevias()) {
            const confirmar = await Swal.fire({
                icon: 'warning',
                title: 'Reemplazar asignación actual',
                text: 'Ya hay valores asignados. Si continúas, se reemplazarán por el nuevo reparto automático.',
                showCancelButton: true,
                confirmButtonText: 'Reemplazar',
                cancelButtonText: 'Cancelar',
            });
            if (!confirmar.isConfirmed)
                return;
        }

        const perfil = await this.solicitarPerfilAuto();
        if (!perfil)
            return;

        const resultado = this.nuevoPSvc.autoRepartirGenerador(perfil);
        if (!resultado.aplicado) {
            await Swal.fire({
                icon: 'warning',
                title: 'No se pudo repartir',
                text: 'No se pudo completar el reparto automático con la configuración actual.',
                showConfirmButton: true,
            });
        }
    }

    @HostListener('document:keydown.enter', ['$event'])
    onEnterPresionado(event: KeyboardEvent): void {
        if (event.repeat || this.esElementoInteractivoParaEnter(event.target as HTMLElement | null))
            return;
        if (!this.puedeFinalizar)
            return;

        event.preventDefault();
        this.finalizarAsignacion();
    }

    isTablaSeleccionada(tabla: number): boolean {
        return this.estado.tablaSeleccionada === tabla;
    }

    getValorAsignado(caracteristica: CaracteristicaKey): string {
        if (this.esCaracteristicaPerdida(caracteristica)) {
            return '-';
        }

        const value = this.estado.asignaciones[caracteristica];
        return value === null ? 'Soltar aquí' : `${value}`;
    }

    caracteristicaBloqueada(caracteristica: CaracteristicaKey): boolean {
        if (this.estado.tablaSeleccionada === null) {
            return true;
        }

        if (this.esCaracteristicaPerdida(caracteristica)) {
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

    getPreviewCaracteristica(caracteristica: CaracteristicaKey): PreviewCaracteristica | null {
        if (this.esCaracteristicaPerdida(caracteristica))
            return null;

        const baseAsignada = this.estado.asignaciones[caracteristica];
        if (baseAsignada === null)
            return null;

        const valorFinal = Number(baseAsignada) + this.getModRacial(caracteristica);
        return {
            valorFinal,
            modificador: this.getModCaracteristica(valorFinal),
        };
    }

    private getModCaracteristica(valor: number): number {
        return Math.floor((Number(valor) - 10) / 2);
    }

    private esCaracteristicaPerdida(caracteristica: CaracteristicaKey): boolean {
        const perdidaPorMapa = this.toBoolean((this.caracteristicasPerdidas as Record<string, any> | null)?.[caracteristica]);
        if (caracteristica === 'Constitucion')
            return perdidaPorMapa || this.toBoolean(this.pierdeConstitucion);
        return perdidaPorMapa;
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

    private tieneAsignacionesPrevias(): boolean {
        return this.caracteristicas
            .some((item) => !this.esCaracteristicaPerdida(item.key) && this.estado.asignaciones[item.key] !== null);
    }

    private async solicitarPerfilAuto(): Promise<GeneradorAutoPerfil | null> {
        const enfoqueResult = await Swal.fire({
            title: 'Reparto automático',
            text: '¿Tu enfoque principal será combate o roleo/exploración?',
            input: 'radio',
            inputOptions: {
                combate: 'Combate',
                roleo: 'Roleo / Exploración',
            },
            showCancelButton: true,
            confirmButtonText: 'Siguiente',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => !value ? 'Selecciona una opción.' : null,
        });

        if (!enfoqueResult.isConfirmed)
            return null;

        const enfoque = `${enfoqueResult.value ?? ''}` as GeneradorAutoEnfoque;
        const opcionesDetalle = this.getOpcionesDetallePorEnfoque(enfoque);
        if (Object.keys(opcionesDetalle).length < 1)
            return null;

        const detalleResult = await Swal.fire({
            title: 'Detalle del enfoque',
            text: 'Elige el estilo que mejor encaja con tu personaje.',
            input: 'radio',
            inputOptions: opcionesDetalle,
            showCancelButton: true,
            confirmButtonText: 'Aplicar reparto',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => !value ? 'Selecciona una opción.' : null,
        });

        if (!detalleResult.isConfirmed)
            return null;

        const detalle = `${detalleResult.value ?? ''}` as GeneradorAutoDetalle;
        if (!(detalle in opcionesDetalle))
            return null;
        return { enfoque, detalle };
    }

    private getOpcionesDetallePorEnfoque(enfoque: GeneradorAutoEnfoque): Record<string, string> {
        if (enfoque === 'combate') {
            return {
                atacante_fisico: 'Atacante físico (corta distancia)',
                tanque: 'Tanque',
                agil: 'Ágil (destreza)',
                lanzador_arcano: 'Lanzador arcano',
                lanzador_divino: 'Lanzador divino',
                lanzador_psionico: 'Lanzador psiónico',
            };
        }

        return {
            carismatico: 'Carismático (cara)',
            erudito: 'Erudito (conocimiento)',
            perceptivo: 'Perceptivo / intuición',
        };
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
