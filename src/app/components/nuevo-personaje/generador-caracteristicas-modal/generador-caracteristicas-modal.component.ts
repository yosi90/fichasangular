import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Raza } from 'src/app/interfaces/raza';
import {
    AsignacionCaracteristicas,
    GeneradorAutoCuestionario,
    GeneradorAutoDiagnostico,
    GeneradorAutoPreguntaOpcion,
    GeneradorAutoRecomendacion,
    GeneradorAutoRespuestaQ1,
    GeneradorAutoRespuestaQ2,
    GeneradorAutoRespuestaQ3,
    GeneradorAutoRespuestaQ4,
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
    readonly opcionesQ1: GeneradorAutoPreguntaOpcion<GeneradorAutoRespuestaQ1>[] = [
        {
            key: 'acero_musculo',
            label: 'Acero y músculo',
            description: 'Me flipa pegar, empujar o partir cosas.',
        },
        {
            key: 'rapidez_precision',
            label: 'Rapidez y precisión',
            description: 'Esquivar, moverme y atacar donde duele.',
        },
        {
            key: 'magia_arcana',
            label: 'Magia arcana',
            description: 'Hechizos, control, explosiones y trucos.',
        },
        {
            key: 'fe_naturaleza_espiritu',
            label: 'Fe / naturaleza / espíritu',
            description: 'Milagros, bendiciones y comunión.',
        },
        {
            key: 'voluntad_psionica',
            label: 'Voluntad mental / psiónica',
            description: 'Disciplina y poder interior.',
        },
        {
            key: 'labia_presencia',
            label: 'Labia / presencia',
            description: 'Inspirar, manipular, liderar o intimidar.',
        },
    ];
    readonly opcionesQ4: GeneradorAutoPreguntaOpcion<GeneradorAutoRespuestaQ4>[] = [
        {
            key: 'aguante',
            label: 'Caerme o aguantar poco',
            description: 'Necesito más resistencia.',
        },
        {
            key: 'acierto',
            label: 'No acertar golpes/disparos',
            description: 'Quiero fiabilidad al impactar.',
        },
        {
            key: 'potencia_conjuros',
            label: 'Conjuros flojos o fallando',
            description: 'Quiero potencia mágica consistente.',
        },
        {
            key: 'percepcion',
            label: 'No enterarme de nada',
            description: 'No quiero caer en trampas o sorpresas.',
        },
        {
            key: 'social',
            label: 'Quedar mal socialmente',
            description: 'Quiero presencia y solvencia social.',
        },
    ];

    modalCuestionarioAutoAbierto = false;
    cuestionarioAuto: GeneradorAutoCuestionario = {};
    diagnosticoAuto: GeneradorAutoDiagnostico | null = null;
    autoStepperIndex = 0;
    private resolverCuestionarioAuto: ((respuesta: GeneradorAutoCuestionario | null) => void) | null = null;

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

    get q2Opciones(): GeneradorAutoPreguntaOpcion<GeneradorAutoRespuestaQ2>[] {
        return this.nuevoPSvc.getOpcionesQ2(this.cuestionarioAuto.q1 ?? null);
    }

    get q3Opciones(): GeneradorAutoPreguntaOpcion<GeneradorAutoRespuestaQ3>[] {
        return this.nuevoPSvc.getOpcionesQ3(this.cuestionarioAuto.q1 ?? null);
    }

    get mostrarPregunta4(): boolean {
        return !!this.diagnosticoAuto?.requierePregunta4;
    }

    get puedeAplicarCuestionarioAuto(): boolean {
        if (!this.cuestionarioAuto.q1 || !this.cuestionarioAuto.q2 || !this.cuestionarioAuto.q3)
            return false;
        if (this.mostrarPregunta4)
            return !!this.cuestionarioAuto.q4;
        return true;
    }

    get q1Respondida(): boolean {
        return !!this.cuestionarioAuto.q1;
    }

    get q2Respondida(): boolean {
        return !!this.cuestionarioAuto.q2;
    }

    get q3Respondida(): boolean {
        return !!this.cuestionarioAuto.q3;
    }

    get q4Respondida(): boolean {
        return !!this.cuestionarioAuto.q4;
    }

    get recomendacionAuto(): GeneradorAutoRecomendacion | null {
        return this.diagnosticoAuto?.recomendacion ?? null;
    }

    get textoPregunta2(): string {
        const q1 = this.cuestionarioAuto.q1;
        if (q1 === 'magia_arcana')
            return 'Cuando se lía, ¿cómo prefieres canalizar magia y posicionarte?';
        if (q1 === 'acero_musculo')
            return 'Cuando se lía, ¿entras a romper líneas o juegas más táctico?';
        if (q1 === 'labia_presencia')
            return 'Cuando se lía, ¿lideras desde delante o desde retaguardia?';
        return 'Cuando se lía, tú…';
    }

    get textoPregunta3(): string {
        const q1 = this.cuestionarioAuto.q1;
        if (q1 === 'labia_presencia')
            return 'Fuera de combate, lo que más disfrutas explotar es…';
        if (q1 === 'magia_arcana' || q1 === 'voluntad_psionica')
            return 'Fuera de combate, ¿dónde quieres destacar además de tu poder?';
        return 'Fuera de combate, lo que más disfruto es…';
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

    onSeleccionarQ1(q1: GeneradorAutoRespuestaQ1): void {
        this.cuestionarioAuto = { q1 };
        this.recalcularDiagnosticoYPersistir();
    }

    onSeleccionarQ2(q2: GeneradorAutoRespuestaQ2): void {
        this.cuestionarioAuto = {
            ...this.cuestionarioAuto,
            q2,
        };
        this.recalcularDiagnosticoYPersistir();
    }

    onSeleccionarQ3(q3: GeneradorAutoRespuestaQ3): void {
        this.cuestionarioAuto = {
            ...this.cuestionarioAuto,
            q3,
        };
        this.recalcularDiagnosticoYPersistir();
    }

    onSeleccionarQ4(q4: GeneradorAutoRespuestaQ4): void {
        this.cuestionarioAuto = {
            ...this.cuestionarioAuto,
            q4,
        };
        this.recalcularDiagnosticoYPersistir();
    }

    cerrarModal(): void {
        if (this.modalCuestionarioAutoAbierto)
            this.cancelarCuestionarioAuto();
        this.cerrar.emit();
    }

    finalizarAsignacion(): void {
        if (!this.puedeFinalizar) {
            return;
        }

        this.finalizar.emit(this.nuevoPSvc.getAsignacionesGenerador());
    }

    async repartirAutomaticamente(): Promise<void> {
        if (this.modalCuestionarioAutoAbierto)
            return;

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

        const cuestionario = await this.solicitarCuestionarioAuto();
        if (!cuestionario)
            return;

        const resultado = this.nuevoPSvc.autoRepartirGenerador(cuestionario);
        if (!resultado.aplicado) {
            await Swal.fire({
                icon: 'warning',
                title: 'No se pudo repartir',
                text: 'No se pudo completar el reparto automático con la configuración actual.',
                showConfirmButton: true,
            });
        }
    }

    cancelarCuestionarioAuto(): void {
        this.cerrarCuestionarioAuto(null);
    }

    confirmarCuestionarioAuto(): void {
        if (!this.puedeAplicarCuestionarioAuto)
            return;

        const payload: GeneradorAutoCuestionario = {
            q1: this.cuestionarioAuto.q1,
            q2: this.cuestionarioAuto.q2,
            q3: this.cuestionarioAuto.q3,
        };
        if (this.mostrarPregunta4)
            payload.q4 = this.cuestionarioAuto.q4;

        this.nuevoPSvc.setAutoRepartoGuardado(payload, this.diagnosticoAuto ?? undefined);
        this.cerrarCuestionarioAuto(payload);
    }

    @HostListener('document:keydown.enter', ['$event'])
    onEnterPresionado(event: KeyboardEvent): void {
        if (this.modalCuestionarioAutoAbierto) {
            event.preventDefault();
            if (this.puedeAplicarCuestionarioAuto)
                this.confirmarCuestionarioAuto();
            return;
        }

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

    private async solicitarCuestionarioAuto(): Promise<GeneradorAutoCuestionario | null> {
        this.modalCuestionarioAutoAbierto = true;
        this.hidratarCuestionarioAuto();
        return new Promise((resolve) => {
            this.resolverCuestionarioAuto = resolve;
        });
    }

    private hidratarCuestionarioAuto(): void {
        const guardado = this.nuevoPSvc.getAutoRepartoGuardado();
        this.cuestionarioAuto = guardado?.respuestas
            ? { ...guardado.respuestas }
            : {};
        this.recalcularDiagnosticoYPersistir(false);
        this.autoStepperIndex = this.getPrimerPasoPendiente();
    }

    private recalcularDiagnosticoYPersistir(persistir = true): void {
        this.diagnosticoAuto = this.nuevoPSvc.evaluarCuestionarioAuto(this.cuestionarioAuto);
        if (!this.mostrarPregunta4 && this.cuestionarioAuto.q4) {
            this.cuestionarioAuto = {
                ...this.cuestionarioAuto,
                q4: undefined,
            };
            this.diagnosticoAuto = this.nuevoPSvc.evaluarCuestionarioAuto(this.cuestionarioAuto);
        }

        if (persistir)
            this.nuevoPSvc.setAutoRepartoGuardado(this.cuestionarioAuto, this.diagnosticoAuto);
    }

    private getPrimerPasoPendiente(): number {
        if (!this.cuestionarioAuto.q1)
            return 0;
        if (!this.cuestionarioAuto.q2)
            return 1;
        if (!this.cuestionarioAuto.q3)
            return 2;
        if (this.mostrarPregunta4 && !this.cuestionarioAuto.q4)
            return 3;
        return this.mostrarPregunta4 ? 4 : 3;
    }

    private cerrarCuestionarioAuto(respuesta: GeneradorAutoCuestionario | null): void {
        this.modalCuestionarioAutoAbierto = false;
        const resolver = this.resolverCuestionarioAuto;
        this.resolverCuestionarioAuto = null;
        if (resolver)
            resolver(respuesta);
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
