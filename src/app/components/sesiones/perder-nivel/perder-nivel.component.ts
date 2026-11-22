import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { NivelQuePierdeComponent } from 'src/app/components/sesiones/nivel-que-pierde/nivel-que-pierde.component';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { ExperienciaPersonaje, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { daDotePorNivelDePersonaje, daIncrementoPorNivelDePersonaje } from 'src/app/services/utils/clase-niveles';
import { toInt } from 'src/app/services/utils/normalizacion';
import {
    CAUSAS_PERDIDA, CausaPerdida, caracteristicaMasAlta, caracteristicasDelIncrementoPerdido, clasesQuePuedenPerder, doteDeLaClave,
    dotesQuePuedePerder, fichaConConstitucionPerdida, FilaPerdida, indiceDelNivelQueSePierde, marcarDotesSinPrerrequisitos,
    ordenPorConocer, pxTrasPerder, pxTrasPerderExperiencia, quitadoVacio, ResultadoPerdida,
} from 'src/app/services/utils/perder-nivel';
import {
    DoteSinPrerrequisitos, filaSinPrerrequisitos, filasDeLaPerdidaConTodo, perdidaDeUnNivelConTodo,
} from 'src/app/services/utils/perdida-con-todo';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';
import { filasDeLasMascotas, perdidaConSusMascotas } from 'src/app/services/utils/mascota-al-dia';
import { esConversion } from 'src/app/services/utils/conversion-muerto-viviente';
import { motivoRevivirSinConstitucion } from 'src/app/services/utils/vuelta-a-la-vida';

/**
 * Perder un nivel con el personaje ya creado (roadmap de sesiones, fase 7, segunda tanda): la causa (volver a la vida,
 * un nivel negativo permanente, el coste de una plantilla u otra) y un concepto, lo que pierde a la vista (el último nivel
 * que ganó con lo que eligió en él: `fichaSinElNivel`; con un solo DG, al volver a la vida, 2 puntos de Constitución) y
 * confirmar (`POST /personajes/{id}/niveles/perdida`). La subida siguiente vuelve a pedir lo de ese nivel.
 * Se abre desde «Perder un nivel» del historial (`SubidaNivelPuertaService.solicitar(id, 'perdida')`) en su pestaña. Usa el motor
 * de la creación en su propia instancia (`MotorDesdeFichaService`) para el catálogo de clases y el dado de golpe.
 */
@Component({
    selector: 'app-perder-nivel',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, NivelQuePierdeComponent],
    templateUrl: './perder-nivel.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class PerderNivelComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    readonly causas = CAUSAS_PERDIDA;
    cargando = true;
    guardando = false;
    error = '';

    pj: Personaje | null = null;
    entrada: PersonajeCreateRequestDto | null = null;
    sesion: SesionPersonaje | null = null;
    experiencia: ExperienciaPersonaje | null = null;

    causa: CausaPerdida = 'revivir';
    concepto = '';
    /** Con la causa `experiencia`: los PX que pierde (0, el siguiente nivel de una pérdida que baja varios). */
    pxPerdidos = 0;
    /** Las dotes que se quedan sin un prerrequisito: se conservan sin poder usarse (MJ pág. 87). */
    sinPrerrequisitos: DoteSinPrerrequisitos[] = [];
    /** Con el orden de sus niveles por conocer: la clase que pierde el nivel, la característica del incremento y la dote. */
    idClaseElegida: number | null = null;
    incrementoElegido: number | null = null;
    doteElegida = '';

    /** Sus DG antes de perderlo (de clase, raciales y de plantilla): con uno solo, al volver a la vida pierde Constitución. */
    dgs = 0;
    resultado: ResultadoPerdida | null = null;
    filas: FilaPerdida[] = [];
    /** Por qué no se puede (un solo DG con otra causa, sin Constitución…): bloquea el botón. */
    impedimento = '';

    private readonly cuenta: MismaCuenta;

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
    }

    get unSoloDg(): boolean {
        return this.dgs <= 1;
    }

    /** Si no se sabe en qué orden ganó sus niveles (las fichas de antes del historial): elige la clase el jugador. */
    get sinOrden(): boolean {
        return ordenPorConocer(this.entrada?.niveles);
    }

    get clases(): Array<{ id: number; nombre: string; nivel: number; }> {
        return clasesQuePuedenPerder(this.svc, this.entrada);
    }

    /** Sin su registro, si el DG que pierde daba incremento o dote (cada 4 y 1.º y cada 3). */
    get pideIncremento(): boolean {
        return this.sinOrden && !this.unSoloDg && daIncrementoPorNivelDePersonaje(this.dgs);
    }

    get pideDote(): boolean {
        return this.sinOrden && !this.unSoloDg && daDotePorNivelDePersonaje(this.dgs);
    }

    get caracteristicas(): Array<{ id: number; nombre: string; valor: number; }> {
        return caracteristicasDelIncrementoPerdido(this.entrada);
    }

    /** Las dotes que puede perder sin registro: las suyas (no las de su raza ni sus plantillas). */
    get dotes(): Array<{ clave: string; nombre: string; }> {
        return dotesQuePuedePerder(this.pj);
    }

    px(valor: number): string {
        return formatoPx(valor);
    }

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.cuenta.fijar();
        try {
            const leida = await this.motor.cargarSesionDeJuego(this.svc, this.idPersonaje, () => this.cuenta.sigue(), {
                sinPermiso: 'Solo su dueño o el máster de su campaña pueden apuntar que pierde un nivel.',
                sinSesion: 'Para perder un nivel hace falta una sesión de juego abierta: ábrela desde el historial.',
            }, { alLeer: (historial) => this.experiencia = historial.experiencia });
            if (!leida)
                return;
            const { cargada } = leida;
            this.sesion = cargada.sesion;
            this.entrada = cargada.entrada;
            this.pj = cargada.pj;
            await this.motor.hidratar(this.svc, this.pj, this.entrada, cargada.nivelesPerdidos);
            if (!this.cuenta.sigue())
                return;
            this.dgs = toInt(this.pj.Nivel_personaje);
            if ((this.entrada.colecciones?.clases ?? []).length < 1)
                throw new Error('No tiene niveles de clase que perder: perder un DG racial aún no se puede apuntar.');
            this.idClaseElegida = this.sinOrden ? this.clases[this.clases.length - 1]?.id ?? null : null;
            this.incrementoElegido = this.entrada ? caracteristicaMasAlta(this.entrada) : null;
            this.recalcular();
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la pérdida del nivel.';
        } finally {
            this.cargando = false;
        }
    }

    // --- Lo que pierde ---------------------------------------------------------------------------------------------

    elegirCausa(causa: string): void {
        this.causa = (CAUSAS_PERDIDA.find((c) => c.valor === causa)?.valor ?? 'otro');
        this.recalcular();
    }

    elegirPx(valor: string): void {
        this.pxPerdidos = Math.max(0, toInt(valor));
        this.recalcular();
    }

    /** Sin Constitución es inmune a la consunción de energía (MM pág. 306); un rasgo que lo diga, lo comprueba la API. */
    get sinConstitucion(): boolean {
        return !!(this.entrada?.caracteristicas as any)?.constitucion?.perdido;
    }

    elegirClase(id: string): void {
        this.idClaseElegida = toInt(id) || null;
        this.recalcular();
    }

    elegirIncremento(id: string): void {
        this.incrementoElegido = toInt(id) || null;
        this.recalcular();
    }

    elegirDote(clave: string): void {
        this.doteElegida = clave;
        this.recalcular();
    }

    /** «Lo que pierde», con las reglas del dictamen del máster de Rol (en el roadmap, «Perder un nivel»). */
    recalcular(): void {
        this.resultado = null;
        this.filas = [];
        this.impedimento = '';
        this.sinPrerrequisitos = [];
        const entrada = this.entrada;
        if (!entrada)
            return;
        const px = toInt(this.experiencia?.px);
        const nep = toInt(this.experiencia?.nivel);
        if (this.causa === 'nivel_negativo' && this.sinConstitucion) {
            this.impedimento = 'No tiene Constitución: es inmune a la consunción de energía y un nivel negativo no le quita un nivel (Manual de monstruos, pág. 306).';
            return;
        }
        if (this.causa === 'revivir' && this.sinConstitucion) {
            this.impedimento = motivoRevivirSinConstitucion(esConversion(this.svc.RazaSeleccionada));
            return;
        }
        const porExperiencia = this.causa === 'experiencia' ? pxTrasPerderExperiencia(px, this.pxPerdidos) : null;
        if (porExperiencia && !porExperiencia.bajaNivel) {
            this.impedimento = `Perder ${this.px(this.pxPerdidos)} PX no le baja del nivel que le dan sus PX: apúntalos como PX gastados, sin perder un nivel.`;
            return;
        }
        if (this.unSoloDg) {
            if (this.causa !== 'revivir') {
                this.impedimento = this.causa === 'nivel_negativo'
                    ? 'Con un solo DG, un nivel negativo que se hace permanente lo mata: no pierde un nivel (Guía del DM, pág. 291).'
                    : this.causa === 'plantilla'
                        ? 'Con un solo DG no tiene niveles que perder: la criatura queda destruida (Libris Mortis, pág. 116).'
                        : 'Con un solo DG no tiene un nivel que perder.';
                return;
            }
            const con = fichaConConstitucionPerdida(entrada, this.dgs);
            if (!con) {
                this.impedimento = 'Con su Constitución no se le puede devolver la vida: los 2 puntos que pierde la dejarían en 0 (Manual del jugador, pág. 285).';
                return;
            }
            this.sinPrerrequisitos = this.svc.dotesSinPrerrequisitosTrasPerder({ caracteristica: { clave: 'Constitucion', menos: con.antes - con.despues } });
            // Sin el nivel, sus mascotas no cambian de nivel; el familiar, sí de PG (la mitad de los de su amo).
            const conMascotas = perdidaConSusMascotas(this.svc, this.motor, entrada, {
                ficha: marcarDotesSinPrerrequisitos(con.ficha, this.sinPrerrequisitos), quitado: quitadoVacio(),
                pg: { ...con.pg, exacto: true }, ataqueBase: { antes: '', despues: '' }, salvaciones: {}, avisos: [],
            }, null);
            this.resultado = conMascotas.resultado;
            this.filas = [
                { que: 'Constitución', antes: `${con.antes}`, ahora: `${con.despues}` },
                { que: 'Puntos de golpe', antes: `${con.pg.antes}`, ahora: `${con.pg.despues}` },
                { que: 'PX', antes: this.px(px), ahora: `${this.px(px)} (los conserva)` },
                ...filaSinPrerrequisitos(this.sinPrerrequisitos),
                ...filasDeLasMascotas(entrada, this.resultado.ficha, conMascotas.estado, this.svc.nombresDeLoQueEligeLaMascota()),
            ];
            return;
        }
        const indice = indiceDelNivelQueSePierde(entrada.niveles, this.idClaseElegida);
        if (indice === null) {
            this.impedimento = 'Elige la clase que pierde el nivel.';
            return;
        }
        // Con todo lo que se le cae: las dotes sin sus prerrequisitos y sus mascotas, juzgadas otra vez sin el nivel
        // (`perdidaDeUnNivelConTodo`, la misma que la mascota perdida que baja un nivel).
        const perdida = perdidaDeUnNivelConTodo(this.svc, this.motor, {
            entrada, indice, dgs: this.dgs, incremento: this.incrementoElegido, dote: this.pideDote ? doteDeLaClave(this.doteElegida) : null,
        });
        this.sinPrerrequisitos = perdida.sinPrerrequisitos;
        this.resultado = perdida.resultado;
        this.filas = [
            perdida.filaDelNivel,
            { que: 'NEP', antes: `${nep}`, ahora: `${nep - 1}` },
            { que: 'PX', antes: this.px(px), ahora: this.px(porExperiencia ? porExperiencia.px : pxTrasPerder(px, nep - 1)) },
            ...filasDeLaPerdidaConTodo(this.svc, this.pj, entrada, perdida),
        ];
    }

    // --- Guardar -------------------------------------------------------------------------------------------------------

    get puedeGuardar(): boolean {
        return !!this.resultado && !this.impedimento && !this.guardando && (!this.pideDote || !!this.doteElegida);
    }

    async guardar(): Promise<void> {
        if (!this.puedeGuardar || !this.sesion || !this.resultado)
            return;
        const r = await Swal.fire({
            icon: 'warning', title: 'Perder un nivel',
            text: this.unSoloDg
                ? 'Pierde 2 puntos de Constitución en lugar del nivel. Se puede deshacer mientras la sesión siga abierta.'
                : 'Pierde el nivel con lo que se ve en la lista. Lo vuelve a subir cuando le lleguen los PX, eligiendo otra vez lo de ese nivel. Se puede deshacer mientras la sesión siga abierta.',
            showCancelButton: true, confirmButtonText: 'Perder el nivel', cancelButtonText: 'Volver',
            target: document.body, heightAuto: false, scrollbarPadding: false,
        });
        if (!r.isConfirmed)
            return;
        this.guardando = true;
        this.error = '';
        try {
            const concepto = this.concepto.trim();
            await this.sesionesSvc.perderNivel(this.idPersonaje, {
                causa: this.causa,
                ...(this.causa === 'experiencia' ? { px: this.pxPerdidos } : {}),
                ...(concepto ? { concepto } : {}),
                ...(this.sinOrden && this.idClaseElegida ? { idClase: this.idClaseElegida } : {}),
                ficha: this.resultado.ficha,
                version: this.sesion.version,
            });
            if (!this.cuenta.sigue())
                return;
            this.puerta.subidaHecha(this.idPersonaje);
            this.alTerminar?.();
        } catch (error: any) {
            if (!this.cuenta.sigue())
                return;
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido apuntar la pérdida del nivel.';
        } finally {
            this.guardando = false;
        }
    }

    cancelar(): void {
        this.alTerminar?.();
    }
}
