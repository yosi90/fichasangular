import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HuecoDeSelectores } from 'src/app/components/sesiones/hueco-selectores';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { resolverLoQueEligeElCompanero } from 'src/app/components/sesiones/pasos-con-selectores';
import { RepartoRangosComponent } from 'src/app/components/sesiones/reparto-rangos/reparto-rangos.component';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { SesionPersonaje } from 'src/app/interfaces/sesiones';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { nombreDelCompanero } from 'src/app/services/utils/companero-dotes';
import { FilaDeLaMascota, filasDeLasMascotas } from 'src/app/services/utils/mascota-al-dia';
import { companeroCompletado, frasesDeLoQueLeFalta, MOTIVO_COMPLETAR_COMPANERO, rangosQueCambian } from 'src/app/services/utils/completar-companero';

type PasoCompletar = 'inicio' | 'rangos' | 'resumen';

/**
 * Lo que le falta al compañero animal, fuera de una subida (contrato: SESIONES_FRONT, «Lo que la mascota tiene pendiente,
 * fuera de una subida»): sus puntos de habilidad sin gastar (también los de las fichas de antes), sus dotes, sus mejoras y
 * sus trucos adicionales, con los mismos selectores que la subida (`resolverLoQueEligeElCompanero` y el reparto de sus
 * rangos). Se guarda como una corrección (`PUT /personajes/{id}/ficha`) que solo cambia el compañero; si se sale sin
 * elegir, no se guarda nada.
 */
@Component({
    selector: 'app-completar-companero',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, RepartoRangosComponent],
    templateUrl: './completar-companero.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class CompletarCompaneroComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    @ViewChild('modalHost', { read: ViewContainerRef }) modalHost?: ViewContainerRef;

    cargando = true;
    guardando = false;
    eligiendo = false;
    error = '';
    paso: PasoCompletar = 'inicio';
    /** Si el compañero está listo para elegir (cargado, con su ficha de antes). */
    listo = false;
    readonly motivo = MOTIVO_COMPLETAR_COMPANERO;
    pj: Personaje | null = null;
    sesion: SesionPersonaje | null = null;
    /** Lo que le falta, en frases, al cargar. */
    falta: string[] = [];
    /** Lo que cambia, al terminar de elegir. */
    filas: FilaDeLaMascota[] = [];

    private entrada: PersonajeCreateRequestDto | null = null;
    private antes: PersonajeCreateRequestDto | null = null;
    private ficha: PersonajeCreateRequestDto | null = null;
    private readonly cuenta: MismaCuenta;
    private readonly selectores = new HuecoDeSelectores(() => this.modalHost);

    constructor(
        public svc: NuevoPersonajeService,
        auth: Auth,
        private sesionesSvc: SesionesService,
        private puerta: SubidaNivelPuertaService,
        private motor: MotorDesdeFichaService,
    ) {
        this.cuenta = new MismaCuenta(auth);
    }

    ngOnInit(): void {
        void this.cargar();
    }

    ngOnDestroy(): void {
        this.cuenta.destruir();
        this.selectores.cerrar();
    }

    get nombre(): string {
        return nombreDelCompanero(this.svc.PersonajeCreacion?.Companeros?.[0], 'su compañero animal');
    }

    get puedeGuardar(): boolean {
        return this.paso === 'resumen' && !this.guardando && this.filas.length > 0;
    }

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.listo = false;
        this.error = '';
        this.cuenta.fijar();
        try {
            const leida = await this.motor.cargarSesionDeJuego(this.svc, this.idPersonaje, () => this.cuenta.sigue(), {
                sinPermiso: 'Solo su dueño o el máster de su campaña pueden completar su compañero.',
                sinSesion: 'Para completar su compañero hace falta una sesión abierta: ábrela o reabre la última desde el historial.',
            }, { deCualquierTipo: true });
            if (!leida)
                return;
            const { cargada: { sesion, entrada, pj } } = leida;
            this.sesion = sesion;
            this.entrada = entrada;
            this.pj = pj;
            await this.motor.hidratar(this.svc, pj, entrada);
            if (!this.cuenta.sigue())
                return;
            if (!entrada.companero || !this.svc.PersonajeCreacion?.Companeros?.[0]) {
                this.error = 'Este personaje no tiene compañero animal.';
                return;
            }
            this.antes = this.motor.cuerpoDelMotor(this.svc, entrada);
            this.falta = frasesDeLoQueLeFalta(this.svc.loQueLeFaltaAlCompanero());
            this.listo = true;
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar el compañero.';
        } finally {
            this.cargando = false;
        }
    }

    /** Empieza a elegir: sus rangos (si le quedan puntos) y después sus mejoras, sus dotes y sus trucos. */
    async elegir(): Promise<void> {
        if (this.eligiendo)
            return;
        this.error = '';
        if (this.svc.iniciarDistribucionHabilidadesCompanero('clases')) {
            this.paso = 'rangos';
            return;
        }
        await this.loQueEligeConSusSelectores();
    }

    async cerrarRangos(): Promise<void> {
        if (!this.svc.puedeCerrarDistribucionHabilidades())
            return;
        this.svc.cerrarDistribucionHabilidades();
        await this.loQueEligeConSusSelectores();
    }

    private async loQueEligeConSusSelectores(): Promise<void> {
        this.eligiendo = true;
        try {
            await resolverLoQueEligeElCompanero(this.svc, this.selectores);
        } finally {
            this.eligiendo = false;
        }
        this.prepararResumen();
    }

    private prepararResumen(): void {
        if (!this.entrada || !this.antes)
            return;
        const despues = this.motor.cuerpoDelMotor(this.svc, this.entrada);
        this.ficha = companeroCompletado(this.entrada, this.antes, despues);
        const nombres = this.svc.nombresDeLoQueEligeLaMascota();
        this.filas = [
            ...rangosQueCambian(this.entrada, this.ficha, (id) => this.svc.EstadoFlujo.ventajas.catalogoHabilidades
                .find((h) => h.Id_habilidad === id)?.Nombre ?? `habilidad ${id}`),
            ...filasDeLasMascotas(this.entrada, this.ficha, {}, nombres),
        ];
        this.paso = 'resumen';
    }

    async guardar(): Promise<void> {
        if (!this.puedeGuardar || !this.sesion || !this.ficha)
            return;
        this.guardando = true;
        this.error = '';
        try {
            await this.sesionesSvc.corregirFicha(this.idPersonaje, {
                ficha: this.ficha, version: this.sesion.version, motivo: MOTIVO_COMPLETAR_COMPANERO,
            });
            if (!this.cuenta.sigue())
                return;
            this.puerta.subidaHecha(this.idPersonaje);
            this.alTerminar?.();
        } catch (error: any) {
            if (this.cuenta.sigue())
                this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido guardar lo que le faltaba al compañero.';
        } finally {
            this.guardando = false;
        }
    }

    /** Vuelve a empezar con la ficha guardada. */
    async empezarDeNuevo(): Promise<void> {
        this.selectores.cerrar();
        this.paso = 'inicio';
        this.filas = [];
        this.ficha = null;
        await this.cargar();
    }

    cancelar(): void {
        this.alTerminar?.();
    }
}
