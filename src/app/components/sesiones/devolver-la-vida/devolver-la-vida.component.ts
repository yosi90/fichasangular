import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { ClasesDelNivelComponent } from 'src/app/components/sesiones/clases-del-nivel/clases-del-nivel.component';
import { ConjurosDelNivelComponent, nombreDeConjuro } from 'src/app/components/sesiones/conjuros-del-nivel/conjuros-del-nivel.component';
import { HuecoDeSelectores } from 'src/app/components/sesiones/hueco-selectores';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { NivelQuePierdeComponent } from 'src/app/components/sesiones/nivel-que-pierde/nivel-que-pierde.component';
import {
    catalogosDelNivel, ClaseDelNivel, clasesParaElNivel, resolverDotesPendientes, resolverIncrementoPendiente, tomarNivelDeClase,
} from 'src/app/components/sesiones/pasos-con-selectores';
import { PasosSesionComponent } from 'src/app/components/sesiones/pasos-sesion/pasos-sesion.component';
import { RepartoRangosComponent } from 'src/app/components/sesiones/reparto-rangos/reparto-rangos.component';
import { Clase } from 'src/app/interfaces/clase';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateNivelEleccionDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { Raza } from 'src/app/interfaces/raza';
import { ExperienciaPersonaje, MAXIMO_CONCEPTO_EVENTO, NivelPerdido, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { AppToastService } from 'src/app/services/app-toast.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { EnemigoPredilectoService } from 'src/app/services/enemigo-predilecto.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { RazaService } from 'src/app/services/raza.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { CambioPlantilla } from 'src/app/services/utils/adquirir-plantilla';
import { MOMENTO_DESPUES } from 'src/app/services/utils/adquirir-raza-mutada';
import { daDgEnNivel, daDotePorNivelDePersonaje, daIncrementoPorNivelDePersonaje } from 'src/app/services/utils/clase-niveles';
import { toInt } from 'src/app/services/utils/normalizacion';
import {
    caracteristicaMasAlta, caracteristicasDelIncrementoPerdido, clasesQuePuedenPerder, doteDeLaClave, dotesQuePuedePerder, fichaConConstitucionPerdida,
    FilaPerdida, filasDelNivelPerdido, indiceDelNivelQueSePierde, marcarDotesSinPrerrequisitos, NombresDeLaFicha, nombresDeLaFicha, ordenPorConocer,
    perdidaDelNivel, quitarElNivelDelMotor, ResultadoPerdida,
} from 'src/app/services/utils/perder-nivel';
import { razaPorEdades } from 'src/app/services/utils/razas-por-edades';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';
import { fichaDeLaSubida } from 'src/app/services/utils/subida-nivel';
import { cambiosDeLaSubida } from 'src/app/services/utils/subida-nivel-vista';
import { confirmarEleccionHomebrew } from 'src/app/services/utils/confirmar-homebrew';
import { motivosQueConfirmar } from 'src/app/services/utils/personaje-oficialidad';
import { campanaDejaSaltarAlineamiento } from 'src/app/services/utils/politica-campana';
import {
    apartarLoDelPrimerNivel, cambiosDeLaVuelta, conLaConstitucionDeVuelta, esClaseParaVolverSinDg, EstadoDeLaVuelta, especialesDeLasTablas,
    estadoDeLaVuelta, fichaDeLaVuelta, indiceDelUltimoNivelDeLaClase, MedioDeLaVuelta, MEDIOS_DE_LA_VUELTA, nepTrasLaVuelta,
    NO_SIRVEN_PARA_LA_VUELTA, pgDelPrimerNivel, pxTrasLaVuelta, restringidasCerradasAlVolver, sumarPerdidas,
} from 'src/app/services/utils/vuelta-a-la-vida';

/** Los pasos del 1.er nivel que gana quien se queda sin ningún DG (los de la subida que tocan a 1.er nivel; los PG van al máximo). */
export type PasoNivelNuevo = 'clase' | 'incremento' | 'habilidades' | 'dotes' | 'conjuros' | 'resumen';

/** Lo que queda tras quitarle la clase de monstruo, devolverle la raza de antes y su Constitución: sobre ello va lo demás. */
interface SinLaClaseDeMonstruo {
    /** El cuerpo del motor, la ficha del motor y las dotes sin sus prerrequisitos de antes de todo. */
    antes: PersonajeCreateRequestDto;
    pjAntes: Personaje;
    rotasAntes: ReturnType<NuevoPersonajeService['dotesSinSusPrerrequisitos']>;
    nombres: NombresDeLaFicha;
    /** La `entrada` sin los niveles de la clase de monstruo y con la Constitución con que vuelve (o 2 menos). */
    ficha: PersonajeCreateRequestDto;
    /** Sus DG sin la clase de monstruo. */
    dgs: number;
    perdidas: ResultadoPerdida[];
    exacto: boolean;
    /** Lo del 1.er nivel del personaje que no se fue con ellos (sin ningún DG pasa al 1.er nivel nuevo). */
    delPrimerNivel: PersonajeCreateNivelEleccionDto[];
}

/** Sin ningún DG, lo que hay antes de tomar el 1.er nivel nuevo: la ficha de la vuelta y lo que arma el motor entonces. */
interface AntesDelNivelNuevo extends SinLaClaseDeMonstruo {
    fichaVuelta: PersonajeCreateRequestDto;
    cuerpo: PersonajeCreateRequestDto;
    pj: Personaje;
}

/**
 * Devolver la vida a un muerto viviente de clase de monstruo (*Libris Mortis*, pág. 35; roadmap de sesiones, fase 7;
 * contrato en `personajes.md`, «Devolver la vida a un muerto viviente»): el medio (*resurrección*, *deseo* o *milagro*, que
 * le quitan además un nivel, o *resurrección verdadera*, que no), el concepto, lo que cambia a la vista y confirmar
 * (`POST /personajes/{id}/vuelta-a-la-vida`). La ficha se hace con el motor de la creación en su propia instancia
 * (`MotorDesdeFichaService`): sin todos los niveles de la clase de monstruo, uno a uno como en «Perder un nivel»
 * (`perdidaDelNivel`), con la raza de antes (`NuevoPersonajeService.devolverLaRazaBase`), su Constitución guardada y, con
 * *resurrección*, sin el último nivel de clase que le queda (o 2 puntos de Constitución con un solo DG). Si no le queda
 * ningún DG, gana el 1.er nivel de una clase básica con los pasos de la subida (`clasesParaElNivel`, `tomarNivelDeClase`,
 * `app-reparto-rangos`, `app-conjuros-del-nivel`): los PG al máximo y, con *resurrección*, 2 puntos de Constitución. Lo que
 * no se puede (los `409` del contrato) se enseña deshabilitado, con su porqué. Se abre desde «Devolver la vida» del
 * historial (`SubidaNivelPuertaService.solicitarVuelta`) en su pestaña.
 */
@Component({
    selector: 'app-devolver-la-vida',
    standalone: true,
    imports: [
        CommonModule, MatButtonModule, MatIconModule, ClasesDelNivelComponent, ConjurosDelNivelComponent, NivelQuePierdeComponent,
        PasosSesionComponent, RepartoRangosComponent,
    ],
    templateUrl: './devolver-la-vida.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class DevolverLaVidaComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    @ViewChild('modalHost', { read: ViewContainerRef }) modalHost?: ViewContainerRef;

    readonly medios = MEDIOS_DE_LA_VUELTA;
    readonly noSirven = NO_SIRVEN_PARA_LA_VUELTA;
    readonly maximoConcepto = MAXIMO_CONCEPTO_EVENTO;

    cargando = true;
    calculando = false;
    guardando = false;
    error = '';

    pj: Personaje | null = null;
    entrada: PersonajeCreateRequestDto | null = null;
    sesion: SesionPersonaje | null = null;
    experiencia: ExperienciaPersonaje | null = null;
    private nivelesPerdidos: NivelPerdido[] = [];
    /** Quién apunta (`rolActor` del historial): el máster se salta la política de su campaña (con aviso de la API). */
    rolActor: 'jugador' | 'master' | null = null;

    /** Su raza de ahora (la mutada), la de antes (su base) y la combinada que da la API (de donde salen sus ajustes). */
    raza: Raza | null = null;
    razaDeAntes: Raza | null = null;
    private combinada: Raza | null = null;
    claseDeMonstruo: Clase | null = null;
    /** Sus DG de ahora (de clase, raciales y de plantilla). */
    dgs = 0;
    estado: EstadoDeLaVuelta | null = null;

    /** `true` con *resurrección*, *deseo* o *milagro*; `false` con *resurrección verdadera*. */
    pierdeNivel = true;
    concepto = '';
    /** Con el orden de sus niveles por conocer: la clase que pierde el nivel de más, el incremento y la dote de su DG. */
    idClaseElegida: number | null = null;
    incrementoElegido: number | null = null;
    doteElegida = '';

    /** Sin ningún DG: los pasos de su 1.er nivel, las clases que puede tomar y la elegida (con el dado de su DG). */
    paso: PasoNivelNuevo = 'clase';
    pasos: PasoNivelNuevo[] = ['clase', 'resumen'];
    clasesNuevas: ClaseDelNivel[] = [];
    claseNueva: Clase | null = null;
    carasNueva = 0;
    /** Si la clase nueva se toma contra su alineamiento, como homebrew (la decisión `alineamiento_clase`). */
    claseContraAlineamiento = false;
    /** Sin ningún DG, lo de antes de tomar su 1.er nivel (`null` mientras no esté). */
    base: AntesDelNivelNuevo | null = null;

    /** Lo que se manda y lo que se enseña, de la última vez que se calculó. */
    ficha: PersonajeCreateRequestDto | null = null;
    cambios: CambioPlantilla[] = [];
    avisos: string[] = [];
    nepDespues: number | null = null;
    pxDespues: number | null = null;
    /** Lo que impide calcularlo con lo elegido (la clase del nivel de más sin elegir). */
    falta = '';

    private turno = 0;
    private readonly cuenta: MismaCuenta;
    private readonly selectores = new HuecoDeSelectores(() => this.modalHost);

    constructor(
        public svc: NuevoPersonajeService,
        auth: Auth,
        private sesionesSvc: SesionesService,
        private puerta: SubidaNivelPuertaService,
        private motor: MotorDesdeFichaService,
        private razaSvc: RazaService,
        private toasts: AppToastService,
        private escuelaSvc: EscuelaConjurosService,
        private disciplinaSvc: DisciplinaConjurosService,
        private enemigoSvc: EnemigoPredilectoService,
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

    px(valor: number): string {
        return formatoPx(valor);
    }

    /** La puntuación de Constitución guardada (la de cuando vivía), o `null` si no la tiene. */
    get constitucionGuardada(): number | null {
        const con = this.entrada?.caracteristicas?.constitucion;
        return con && toInt(con.valor) > 0 ? toInt(con.valor) : null;
    }

    /** Por qué no se le puede devolver la vida así (los `409` del contrato), o vacío. */
    get motivo(): string {
        return this.estado?.motivo ?? '';
    }

    /** Por qué no con un medio (con *resurrección*, el nivel de más), o `null`. */
    motivoDelMedio(medio: MedioDeLaVuelta): string | null {
        return medio.pierdeNivel ? this.estado?.motivoConResurreccion ?? null : null;
    }

    /** Lo que bloquea el botón: lo de siempre o lo del medio elegido. */
    get impedimento(): string {
        return this.motivo || (this.pierdeNivel ? this.estado?.motivoConResurreccion ?? '' : '');
    }

    /** Si sin la clase de monstruo no le queda ningún DG: gana el 1.er nivel de una clase básica. */
    get ganaNivel(): boolean {
        return !!this.estado?.ganaNivel && !this.motivo;
    }

    /** Si pierde además el último nivel de clase que le queda (con *resurrección* y más de un DG sin la clase de monstruo). */
    get pierdeOtroNivel(): boolean {
        return this.pierdeNivel && !this.impedimento && toInt(this.estado?.dgsSinLaClase) > 1;
    }

    /**
     * Si pierde 2 puntos de Constitución en lugar del nivel: con *resurrección* y un solo DG sin la clase de monstruo, o sin
     * ninguno (con el 1.er nivel que gana).
     */
    get pierdeConstitucion(): boolean {
        return this.pierdeNivel && !this.impedimento && toInt(this.estado?.dgsSinLaClase) <= 1;
    }

    /** Sus niveles sin los de la clase de monstruo: los que tiene que mirar el nivel de más. */
    private get nivelesSinLaClase() {
        return (this.entrada?.niveles ?? []).filter((n) => toInt(n?.idClase) !== toInt(this.claseDeMonstruo?.Id));
    }

    /** Con el orden de sus niveles por conocer, el nivel de más lo elige el jugador (la clase, y sin registro su incremento y su dote). */
    get eligeElNivel(): boolean {
        return this.pierdeOtroNivel && ordenPorConocer(this.nivelesSinLaClase);
    }

    get clases(): Array<{ id: number; nombre: string; nivel: number; }> {
        return clasesQuePuedenPerder(this.svc, this.entrada).filter((c) => c.id !== toInt(this.claseDeMonstruo?.Id));
    }

    get pideIncremento(): boolean {
        return this.eligeElNivel && daIncrementoPorNivelDePersonaje(toInt(this.estado?.dgsSinLaClase));
    }

    get pideDote(): boolean {
        return this.eligeElNivel && daDotePorNivelDePersonaje(toInt(this.estado?.dgsSinLaClase));
    }

    get caracteristicas(): Array<{ id: number; nombre: string; valor: number; }> {
        return caracteristicasDelIncrementoPerdido(this.entrada);
    }

    get dotes(): Array<{ clave: string; nombre: string; }> {
        return dotesQuePuedePerder(this.pj);
    }

    /** El texto de cada paso del 1.er nivel nuevo en la fila de pasos (`app-pasos-sesion`), con su número. */
    readonly etiquetaPaso = (paso: PasoNivelNuevo): string => {
        const nombres: Record<PasoNivelNuevo, string> = {
            clase: this.claseNueva ? `Clase: ${this.claseNueva.Nombre.toLowerCase()}` : 'Clase',
            incremento: 'Incremento',
            habilidades: 'Habilidades',
            dotes: 'Dotes',
            conjuros: 'Conjuros',
            resumen: 'Resumen',
        };
        return `${this.pasos.indexOf(paso) + 1} · ${nombres[paso]}`;
    };

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.cuenta.fijar();
        try {
            const leida = await this.motor.cargarSesionDeJuego(this.svc, this.idPersonaje, () => this.cuenta.sigue(), {
                sinPermiso: 'Solo su dueño o el máster de su campaña pueden devolverle la vida.',
                sinSesion: 'Para devolverle la vida hace falta una sesión de juego abierta: ábrela desde el historial.',
            }, {
                alLeer: (historial) => {
                    this.experiencia = historial.experiencia;
                    this.rolActor = historial.rolActor ?? null;
                },
            });
            if (!leida)
                return;
            const { cargada } = leida;
            this.sesion = cargada.sesion;
            this.entrada = cargada.entrada;
            this.pj = cargada.pj;
            this.nivelesPerdidos = cargada.nivelesPerdidos ?? [];
            await this.motor.hidratar(this.svc, this.pj, this.entrada, this.nivelesPerdidos);
            if (!this.cuenta.sigue())
                return;
            this.raza = this.svc.RazaSeleccionada ? JSON.parse(JSON.stringify(this.svc.RazaSeleccionada)) : null;
            this.razaDeAntes = this.svc.RazaBaseSeleccionadaCompleta ? JSON.parse(JSON.stringify(this.svc.RazaBaseSeleccionadaCompleta)) : null;
            const idClase = toInt(this.raza?.Clase_de_monstruo?.Id);
            this.claseDeMonstruo = idClase > 0 && this.razaDeAntes ? this.svc.claseDelCatalogo(idClase) : null;
            if (idClase > 0 && this.razaDeAntes && !this.claseDeMonstruo)
                throw new Error(`No se encuentra la clase de monstruo «${this.raza?.Clase_de_monstruo?.Nombre ?? ''}» en el catálogo de clases.`);
            this.dgs = toInt(this.pj.Nivel_personaje);
            this.combinada = await this.leerCombinada();
            if (!this.cuenta.sigue())
                return;
            this.estado = estadoDeLaVuelta({
                claseDeMonstruo: this.claseDeMonstruo, niveles: this.entrada.niveles, clases: this.entrada.colecciones?.clases ?? [],
                dgs: this.dgs, constitucion: this.constitucionGuardada,
            });
            this.pierdeNivel = !this.estado.motivoConResurreccion;
            this.idClaseElegida = this.clases[this.clases.length - 1]?.id ?? null;
            this.incrementoElegido = caracteristicaMasAlta(this.entrada);
            await this.recalcular();
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la vuelta a la vida.';
        } finally {
            this.cargando = false;
        }
    }

    /** La raza mutada sobre su base, como la da la API (sus ajustes, sus rasgos, sus aptitudes sustituidas); sin ella, `null`. */
    private async leerCombinada(): Promise<Raza | null> {
        if (!this.raza || !this.razaDeAntes || !this.claseDeMonstruo)
            return null;
        const paso = razaPorEdades(this.razaDeAntes) ? toInt(this.entrada?.personaje?.idPasoEdad) || null : null;
        try {
            return await this.razaSvc.getRazaSobreBase(this.raza.Id, this.razaDeAntes.Id, paso, MOMENTO_DESPUES);
        } catch {
            return null;
        }
    }

    // --- Lo que elige ------------------------------------------------------------------------------------------------

    elegirMedio(medio: MedioDeLaVuelta): void {
        // Con el 1.er nivel nuevo ya empezado, el medio no cambia: su Constitución ya cuenta en él (se empieza de nuevo).
        if (this.motivoDelMedio(medio) || this.pierdeNivel === medio.pierdeNivel || this.claseNueva)
            return;
        this.pierdeNivel = medio.pierdeNivel;
        void this.recalcular();
    }

    elegirClase(id: string): void {
        this.idClaseElegida = toInt(id) || null;
        void this.recalcular();
    }

    elegirIncremento(id: string): void {
        this.incrementoElegido = toInt(id) || null;
        void this.recalcular();
    }

    elegirDote(clave: string): void {
        this.doteElegida = clave;
        void this.recalcular();
    }

    /** Vuelve a hacer la ficha con lo elegido: el motor, otra vez desde la ficha guardada (cada cálculo lo cambia). */
    async recalcular(): Promise<void> {
        const turno = ++this.turno;
        this.ficha = null;
        this.nepDespues = null;
        this.pxDespues = null;
        this.cambios = [];
        this.avisos = [];
        this.falta = '';
        this.reiniciarNivelNuevo();
        if (!this.pj || !this.entrada || !this.estado || this.impedimento || !this.claseDeMonstruo || !this.raza || !this.razaDeAntes)
            return;
        this.calculando = true;
        try {
            await this.motor.hidratar(this.svc, this.pj, this.entrada, this.nivelesPerdidos);
            if (turno !== this.turno || !this.cuenta.sigue())
                return;
            this.calcular();
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la vuelta a la vida.';
        } finally {
            if (turno === this.turno)
                this.calculando = false;
        }
    }

    /**
     * La ficha que se manda y «Lo que cambia», con el motor recién hidratado (las reglas, en el dictamen del máster de Rol,
     * en el roadmap): quita uno a uno los niveles de la clase de monstruo con lo que dieron, le devuelve la raza de antes y
     * su Constitución y, con *resurrección*, el nivel de más o los 2 puntos de Constitución. Las dotes, vueltas a evaluar.
     * Sin ningún DG, deja el motor listo para su 1.er nivel nuevo (`base`) y la ficha se hace al cerrarlo.
     */
    calcular(): void {
        const svc = this.svc;
        const entrada = this.entrada!;
        const estado = this.estado!;
        const sin = this.quitarLaClaseDeMonstruo();
        if (!sin)
            return;
        const razaDelNep = this.combinada ?? this.raza!;
        const sustituidos = razaDelNep.Especiales_sustituidos ?? this.raza!.Especiales_sustituidos ?? [];
        if (this.ganaNivel) {
            const cuerpo = this.motor.cuerpoDelMotor(svc, entrada);
            this.base = {
                ...sin, cuerpo, pj: JSON.parse(JSON.stringify(svc.PersonajeCreacion)),
                fichaVuelta: fichaDeLaVuelta({
                    entrada, sinLosNiveles: sin.ficha, antes: sin.antes, despues: cuerpo, sustituidos, marcar: [], desmarcar: [], deLasTablas: [],
                }),
            };
            this.clasesNuevas = this.clasesParaVolver();
            return;
        }
        let ficha = sin.ficha;
        let exacto = sin.exacto;
        const nep = toInt(this.experiencia?.nivel);
        const nivelesClaseAntes = this.nivelesDeClaseAntes;

        // Con resurrección y más de un DG, el nivel de más: el último de clase que le queda, como en «Perder un nivel».
        let nivelDeMas: { fila: FilaPerdida; loQueDaba: FilaPerdida[]; } | null = null;
        const avisos = sin.perdidas.flatMap((p) => p.avisos);
        if (this.pierdeOtroNivel) {
            const indice = indiceDelNivelQueSePierde(ficha.niveles, this.idClaseElegida);
            if (indice === null) {
                this.falta = 'Elige la clase que pierde el nivel de más.';
                return;
            }
            const { resultado, nivel, filaDelNivel } = perdidaDelNivel(svc, this.motor, {
                entrada: ficha, indice, dgs: sin.dgs, incremento: this.incrementoElegido, dote: this.pideDote ? doteDeLaClave(this.doteElegida) : null,
            });
            quitarElNivelDelMotor(svc, resultado, nivel.idClase, indice);
            nivelDeMas = { fila: filaDelNivel, loQueDaba: filasDelNivelPerdido(resultado, nombresDeLaFicha(svc, this.pj, ficha)) };
            avisos.push(...resultado.avisos);
            exacto = exacto && resultado.pg.exacto;
            ficha = resultado.ficha;
        }

        // Las dotes, vueltas a evaluar con todo: las que se quedan sin un prerrequisito y las que lo vuelven a cumplir.
        const despues = this.motor.cuerpoDelMotor(svc, entrada);
        const { marcar, desmarcar } = this.dotesVueltasAEvaluar(sin.rotasAntes);
        this.ficha = fichaDeLaVuelta({
            entrada, sinLosNiveles: ficha, antes: sin.antes, despues, sustituidos, marcar, desmarcar,
            deLasTablas: especialesDeLasTablas((ficha.colecciones?.clases ?? []).map((c) => ({ clase: svc.claseDelCatalogo(c.idClase), nivel: toInt(c.nivel) }))),
        });

        const quitados = estado.nivelesDeLaClase + (nivelDeMas ? 1 : 0);
        const nepTrasQuitar = nepTrasLaVuelta(nep, estado.nivelesDeLaClase, razaDelNep, this.razaDeAntes!, nivelesClaseAntes);
        const nepFinal = nivelDeMas ? nepTrasLaVuelta(nep, quitados, razaDelNep, this.razaDeAntes!, nivelesClaseAntes) : null;
        const px = toInt(this.experiencia?.px);
        const pxs = pxTrasLaVuelta(px, nepTrasQuitar, nepFinal);
        this.nepDespues = nepFinal ?? nepTrasQuitar;
        this.pxDespues = pxs.despues;
        this.cambios = cambiosDeLaVuelta({
            ...this.loComunDelResumen(sin, this.ficha, marcar, desmarcar),
            nivelDeMas,
            px: { antes: px, enMedio: pxs.enMedio, despues: pxs.despues },
            pg: { antes: toInt(entrada.personaje.puntosGolpe), despues: toInt(ficha.personaje.puntosGolpe), exacto },
        });
        this.avisos = Array.from(new Set(avisos));
    }

    /**
     * Quita del motor uno a uno los niveles de la clase de monstruo, del último al primero, con lo que dieron; le devuelve su
     * Constitución (con *resurrección* y uno o ningún DG, 2 puntos menos) y la raza de antes. Sin ningún DG, lo del 1.er nivel
     * del personaje (la dote adicional del humano, los idiomas por Inteligencia) no se va con ellos. `null` si la Constitución
     * no da para los 2 puntos.
     */
    private quitarLaClaseDeMonstruo(): SinLaClaseDeMonstruo | null {
        const svc = this.svc;
        const entrada = this.entrada!;
        const clase = this.claseDeMonstruo!;
        const estado = this.estado!;
        const antes = this.motor.cuerpoDelMotor(svc, entrada);
        const pjAntes: Personaje = JSON.parse(JSON.stringify(svc.PersonajeCreacion));
        const rotasAntes = svc.dotesSinSusPrerrequisitos();
        const nombres = nombresDeLaFicha(svc, this.pj, entrada);
        const apartado = estado.ganaNivel ? apartarLoDelPrimerNivel(entrada, clase.Id) : { entrada, delPrimerNivel: [] };

        let ficha = apartado.entrada;
        let dgs = this.dgs;
        const perdidas: ResultadoPerdida[] = [];
        for (let i = 0; i < estado.nivelesDeLaClase; i++) {
            const indice = indiceDelUltimoNivelDeLaClase(ficha.niveles, clase.Id);
            if (indice === null)
                break;
            const nivel = ficha.niveles![indice];
            const { resultado } = perdidaDelNivel(svc, this.motor, { entrada: ficha, indice, dgs, incremento: null, dote: null });
            quitarElNivelDelMotor(svc, resultado, nivel.idClase, indice);
            perdidas.push(resultado);
            if (daDgEnNivel(clase, toInt(nivel.nivelClase)))
                dgs -= 1;
            ficha = resultado.ficha;
        }

        // La raza de antes y su Constitución (con uno o ningún DG y resurrección, 2 puntos menos).
        const vuelta = conLaConstitucionDeVuelta(ficha, this.constitucionGuardada ?? 0, dgs);
        ficha = vuelta.ficha;
        const exacto = vuelta.pg.exacto && perdidas.every((p) => p.pg.exacto);
        if (this.pierdeConstitucion) {
            const menos = fichaConConstitucionPerdida(ficha, 1);
            if (!menos)
                return null;
            ficha = menos.ficha;
        }
        svc.devolverLaRazaBase(this.combinada, toInt(ficha.caracteristicas?.constitucion?.valor));
        return { antes, pjAntes, rotasAntes, nombres, ficha, dgs: Math.max(0, dgs), perdidas, exacto, delPrimerNivel: apartado.delPrimerNivel };
    }

    /** Sus niveles de clase de ahora (con los de la clase de monstruo). */
    private get nivelesDeClaseAntes(): number {
        return (this.entrada?.colecciones?.clases ?? []).reduce((suma, c) => suma + Math.max(0, toInt(c?.nivel)), 0);
    }

    /** Las dotes, con el motor de ahora: las que se quedan sin un prerrequisito (`marcar`) y las que lo vuelven a cumplir. */
    private dotesVueltasAEvaluar(rotasAntes: SinLaClaseDeMonstruo['rotasAntes']) {
        const clave = (d: { idDote: unknown; idExtra: unknown; }) => `${toInt(d.idDote)}|${Math.max(0, toInt(d.idExtra))}`;
        const rotas = this.svc.dotesSinSusPrerrequisitos();
        const rotasAntesClaves = new Set(rotasAntes.map(clave));
        const rotasClaves = new Set(rotas.map(clave));
        const marcar = rotas.filter((d) => !rotasAntesClaves.has(clave(d)));
        const desmarcar = (this.entrada?.colecciones?.dotes ?? []).filter((d: any) => d?.sinPrerrequisitos && !rotasClaves.has(clave(d)))
            .map((d: any) => ({ idDote: toInt(d.idDote), idExtra: toInt(d.idExtra), origen: `${d.origen ?? ''}` }));
        return { marcar, desmarcar, nombre: (d: { idDote: number; idExtra: number; }) => rotasAntes.find((r) => clave(r) === clave(d))?.nombre };
    }

    /** Lo de «Lo que cambia» que no depende del nivel de más ni del 1.er nivel nuevo. */
    private loComunDelResumen(sin: SinLaClaseDeMonstruo, ficha: PersonajeCreateRequestDto, marcar: Array<{ nombre: string; }>,
        desmarcar: Array<{ idDote: number; idExtra: number; }>) {
        const entrada = this.entrada!;
        const razaDelNep = this.combinada ?? this.raza!;
        const sustituidos = razaDelNep.Especiales_sustituidos ?? this.raza!.Especiales_sustituidos ?? [];
        const idsAntes = new Set((entrada.colecciones?.especiales ?? []).map((e: any) => toInt(e?.idEspecial)));
        const idsDespues = new Set((ficha.colecciones?.especiales ?? []).map((e: any) => toInt(e?.idEspecial)));
        const suma = sumarPerdidas(sin.perdidas);
        const nombre = this.dotesVueltasAEvaluar(sin.rotasAntes).nombre;
        return {
            antes: sin.pjAntes, despues: this.svc.PersonajeCreacion,
            raza: `${this.raza!.Nombre ?? ''}`, razaDeAntes: `${this.razaDeAntes!.Nombre ?? ''}`,
            claseDeMonstruo: `${this.claseDeMonstruo!.Nombre ?? ''}`, nivelesDeLaClase: this.estado!.nivelesDeLaClase,
            loQueDaban: suma ? filasDelNivelPerdido(suma, sin.nombres) : [],
            pierdeConstitucion: this.pierdeConstitucion, constitucion: toInt(ficha.caracteristicas?.constitucion?.valor),
            nep: { antes: toInt(this.experiencia?.nivel), despues: toInt(this.nepDespues) },
            aptitudes: sustituidos.filter((s) => idsDespues.has(toInt(s.Especial?.Id)) && !idsAntes.has(toInt(s.Especial?.Id)))
                .map((s) => ({ antes: idsAntes.has(toInt(s.Especial_nuevo?.Id)) ? s.Especial_nuevo.Nombre : '—', ahora: s.Especial.Nombre })),
            vuelvenAValer: desmarcar.map((d) => nombre(d) ?? sin.nombres.dote(d.idDote, d.idExtra)),
            sinPoderUsar: marcar.map((d) => d.nombre),
        };
    }

    // --- Sin ningún DG: el 1.er nivel de una clase básica -------------------------------------------------------------

    /**
     * Si su 1.er nivel puede ser de una clase que no admite su alineamiento, como homebrew (como al crear, con la decisión
     * `alineamiento_clase`): el máster y un PNJ, que se saltan la política de la campaña (`reglasIgnoradas`), o quien la
     * campaña deje (`campanaDejaSaltarAlineamiento`; sin campaña, siempre). Si no, la API responde
     * `400 alineamiento_no_permitido_campana`; sin la decisión, `400 clase_ex`.
     */
    get puedeSaltarAlineamiento(): boolean {
        return this.rolActor === 'master' || this.entrada?.personaje?.tipo === 'pnj' || campanaDejaSaltarAlineamiento(this.pj?.PoliticaCompra);
    }

    /**
     * Las clases de su 1.er nivel nuevo: las de la subida (`clasesParaElNivel`, con el motor ya sin la clase de monstruo y
     * con la raza de antes: su alineamiento, sus prerrequisitos de ahora), solo las básicas (`esClaseParaVolverSinDg`) y
     * con el paladín y el monje cerrados si los tuvo antes de la clase de monstruo (`restringidasCerradasAlVolver`). Las que
     * solo impide su alineamiento, con «Elegir igualmente» si se lo puede saltar (`puedeSaltarAlineamiento`).
     */
    private clasesParaVolver(): ClaseDelNivel[] {
        const cerradas = restringidasCerradasAlVolver({
            nivelesPerdidos: this.nivelesPerdidos, claseDeMonstruo: this.claseDeMonstruo!, clase: (id) => this.svc.claseDelCatalogo(id),
            libres: (this.svc.RazaSeleccionada?.Clases_multiclase_libre ?? []).map((l) => toInt(l?.Id)),
        });
        return clasesParaElNivel(this.svc, this.pj?.Oficial, { saltarAlineamiento: this.puedeSaltarAlineamiento })
            .filter((c) => esClaseParaVolverSinDg(c.clase))
            .map((c) => cerradas.has(toInt(c.clase.Id))
                ? { ...c, elegible: false, soloAlineamiento: false, motivo: cerradas.get(toInt(c.clase.Id))! } : c);
    }

    /** Su 1.er nivel en la clase elegida, con los selectores de la subida, y los pasos que da (los PG, al máximo, sin paso). */
    async elegirClaseNueva(clase: Clase): Promise<void> {
        if (this.claseNueva || this.guardando || !this.base)
            return;
        // Contra su alineamiento, como al crear: avisar antes de volver homebrew la ficha.
        const item = this.clasesNuevas.find((c) => toInt(c.clase.Id) === toInt(clase.Id));
        const contraAlineamiento = !!item?.soloAlineamiento && !item.elegible;
        if (contraAlineamiento) {
            const motivos = motivosQueConfirmar([`${clase.Nombre} contra su alineamiento (${item.motivo})`], this.pj?.Oficial === false);
            if (motivos.length > 0 && !await confirmarEleccionHomebrew(`Elegir ${clase.Nombre}`, motivos))
                return;
        }
        const nivel = await tomarNivelDeClase(this.svc, this.selectores, clase,
            catalogosDelNivel(this.motor, this.escuelaSvc, this.disciplinaSvc, this.enemigoSvc), { permitirBloqueoSoloAlineamiento: contraAlineamiento });
        if (nivel.estado === 'cancelado')
            return;
        if (nivel.estado === 'deshacer') {
            await this.empezarDeNuevo(false);
            return;
        }
        this.claseNueva = clase;
        this.claseContraAlineamiento = contraAlineamiento;
        this.carasNueva = this.svc.carasDadoGolpeDeClase(clase);
        this.svc.iniciarDistribucionHabilidadesPorClase(clase);
        this.pasos = [
            'clase',
            ...(this.svc.getAumentosCaracteristicaPendientes().length > 0 ? ['incremento' as const] : []),
            ...(this.svc.EstadoFlujo.habilidades.activa ? ['habilidades' as const] : []),
            ...(this.svc.getDotesPendientes().some((d) => d.estado === 'pendiente') ? ['dotes' as const] : []),
            ...(this.svc.getConjurosSesionActual().activa ? ['conjuros' as const] : []),
            'resumen',
        ];
        await this.siguiente();
    }

    /** El siguiente paso de su 1.er nivel; los que se resuelven con un selector se abren al llegar. */
    async siguiente(): Promise<void> {
        const siguiente = this.pasos[this.pasos.indexOf(this.paso) + 1] ?? 'resumen';
        this.paso = siguiente;
        if (siguiente === 'incremento') {
            await resolverIncrementoPendiente(this.svc, this.selectores, 'Incremento de característica de su 1.er nivel');
            if (this.svc.EstadoFlujo.habilidades.activa && this.claseNueva)
                this.svc.iniciarDistribucionHabilidadesPorClase(this.claseNueva);
            await this.siguiente();
        } else if (siguiente === 'dotes') {
            if (await resolverDotesPendientes(this.svc, this.selectores))
                await this.siguiente();
        } else if (siguiente === 'resumen')
            this.cerrarElNivelNuevo();
    }

    cerrarHabilidades(): void {
        if (!this.svc.puedeCerrarDistribucionHabilidades())
            return;
        this.svc.cerrarDistribucionHabilidades();
        void this.siguiente();
    }

    cerrarConjuros(): void {
        if (!this.svc.puedeCerrarSesionConjuros())
            return;
        this.svc.cerrarSesionConjuros();
        void this.siguiente();
    }

    /**
     * La ficha con su 1.er nivel nuevo y «Lo que cambia»: la de la vuelta con lo que cambia el motor al tomarlo
     * (`fichaDeLaSubida`: las dotes, las aptitudes, los idiomas, los conjuros y los rangos de ese nivel), el nivel al final
     * con sus elecciones (y lo del 1.er nivel que conservaba), los PG al máximo y las dotes vueltas a evaluar. El NEP y los
     * PX, con el nivel nuevo (el humano engendro vampírico 3 con 3.000 PX queda en 1 con 500).
     */
    private cerrarElNivelNuevo(): void {
        const b = this.base;
        const clase = this.claseNueva;
        if (!b || !clase || !this.entrada)
            return;
        const svc = this.svc;
        const elecciones = svc.getEleccionesDelNivelEnCurso();
        const pg = pgDelPrimerNivel(this.carasNueva, toInt(b.fichaVuelta.caracteristicas?.constitucion?.valor));
        const conElNivel = fichaDeLaSubida({
            entrada: b.fichaVuelta, antes: b.cuerpo, despues: this.motor.cuerpoDelMotor(svc, this.entrada), idClase: toInt(clase.Id),
            nivel: { idClase: toInt(clase.Id), nivelClase: 1, elecciones: [...b.delPrimerNivel, ...elecciones] }, puntosGolpe: pg.total,
        });
        const { marcar, desmarcar } = this.dotesVueltasAEvaluar(b.rotasAntes);
        this.ficha = marcarDotesSinPrerrequisitos(conElNivel, marcar, desmarcar);
        // Contra su alineamiento, la decisión homebrew de la clase, como al crear.
        if (this.claseContraAlineamiento && !(this.ficha.decisionesHomebrew ?? [])
            .some((d) => d.tipo === 'alineamiento_clase' && toInt(d.idElemento) === toInt(clase.Id)))
            this.ficha.decisionesHomebrew = [...(this.ficha.decisionesHomebrew ?? []), { tipo: 'alineamiento_clase', idElemento: toInt(clase.Id) }];

        const razaDelNep = this.combinada ?? this.raza!;
        // Sin la clase de monstruo y con el nivel nuevo: uno menos de los que quita.
        this.nepDespues = nepTrasLaVuelta(toInt(this.experiencia?.nivel), this.estado!.nivelesDeLaClase - 1, razaDelNep, this.razaDeAntes!, this.nivelesDeClaseAntes);
        const px = toInt(this.experiencia?.px);
        const pxs = pxTrasLaVuelta(px, this.nepDespues, null);
        this.pxDespues = pxs.despues;
        this.cambios = cambiosDeLaVuelta({
            ...this.loComunDelResumen(b, this.ficha, marcar, desmarcar),
            nivelDeMas: null,
            px: { antes: px, enMedio: pxs.enMedio, despues: pxs.despues },
            pg: { antes: toInt(this.entrada.personaje.puntosGolpe), despues: pg.total, exacto: true },
            nivelNuevo: {
                clase: `${clase.Nombre ?? ''}`, caras: this.carasNueva,
                filas: cambiosDeLaSubida({
                    antes: b.pj, despues: svc.PersonajeCreacion, clase, nivelClase: 1, nivelNuevo: 1, pg: null, tirada: null, caras: this.carasNueva,
                    elecciones, nombreConjuro: (id) => nombreDeConjuro(svc, id), reciclado: null,
                }).filter((f) => f.que !== 'Clase'),
            },
        });
        this.avisos = Array.from(new Set(b.perdidas.flatMap((p) => p.avisos)));
    }

    /** «Empezar de nuevo» su 1.er nivel (con confirmación): el motor otra vez sin la clase de monstruo, y la lista de clases. */
    async empezarDeNuevo(confirmar = true): Promise<void> {
        if (confirmar) {
            const r = await Swal.fire({
                icon: 'question', title: 'Empezar su 1.er nivel de nuevo', text: 'Se pierde lo elegido en su 1.er nivel.',
                showCancelButton: true, confirmButtonText: 'Empezar de nuevo', cancelButtonText: 'Seguir',
                target: document.body, heightAuto: false, scrollbarPadding: false,
            });
            if (!r.isConfirmed)
                return;
        }
        await this.recalcular();
    }

    private reiniciarNivelNuevo(): void {
        this.selectores.cerrar();
        this.base = null;
        this.clasesNuevas = [];
        this.claseNueva = null;
        this.claseContraAlineamiento = false;
        this.carasNueva = 0;
        this.pasos = ['clase', 'resumen'];
        this.paso = 'clase';
    }

    // --- Guardar -------------------------------------------------------------------------------------------------------

    get puedeGuardar(): boolean {
        return !!this.ficha && !this.impedimento && !this.falta && !this.calculando && !this.guardando && (!this.pideDote || !!this.doteElegida)
            && (!this.ganaNivel || (!!this.claseNueva && this.paso === 'resumen'));
    }

    async guardar(): Promise<void> {
        if (!this.puedeGuardar || !this.sesion || !this.ficha)
            return;
        const nombre = this.pj?.Nombre || 'El personaje';
        const raza = `${this.razaDeAntes?.Nombre ?? ''}`.toLowerCase();
        const nivelNuevo = this.ganaNivel && this.claseNueva ? `, con su 1.er nivel de ${this.claseNueva.Nombre.toLowerCase()}` : '';
        const r = await Swal.fire({
            icon: 'warning', title: 'Devolver la vida',
            text: `${nombre} pierde todos sus niveles de ${this.claseDeMonstruo?.Nombre ?? 'su clase de monstruo'} y vuelve a ser ${raza}${nivelNuevo}`
                + (this.pierdeConstitucion ? ', con 2 puntos menos de Constitución' : this.pierdeOtroNivel ? ', con un nivel menos' : '')
                + '. Lo que pierde no se restablece. Se puede deshacer mientras la sesión siga abierta.',
            showCancelButton: true, confirmButtonText: 'Devolver la vida', cancelButtonText: 'Volver',
            target: document.body, heightAuto: false, scrollbarPadding: false,
        });
        if (!r.isConfirmed)
            return;
        this.guardando = true;
        this.error = '';
        try {
            const concepto = this.concepto.trim().slice(0, MAXIMO_CONCEPTO_EVENTO);
            const respuesta = await this.sesionesSvc.devolverLaVida(this.idPersonaje, {
                pierdeNivel: this.pierdeNivel,
                ...(concepto ? { concepto } : {}),
                ...(this.eligeElNivel && this.idClaseElegida ? { idClase: this.idClaseElegida } : {}),
                ficha: this.ficha,
                version: this.sesion.version,
            });
            if (!this.cuenta.sigue())
                return;
            // La frase del historial (la de la API), con su nombre delante.
            const evento = respuesta.sesion.eventos.find((e) => e.id === respuesta.vuelta.idEvento && e.tipo === 'vuelta_a_la_vida');
            this.toasts.showSuccess(evento?.texto
                ? `${nombre} ${evento.texto}`
                : `${nombre} ha vuelto a la vida: vuelve a ser ${`${respuesta.vuelta.raza.nombre || raza}`.toLowerCase()}.`);
            this.puerta.subidaHecha(this.idPersonaje);
            this.alTerminar?.();
        } catch (error: any) {
            if (!this.cuenta.sigue())
                return;
            // La frase de la API (también la de la clase nueva, con `field: ficha.colecciones.clases`: `vuelta_clase_nueva_no_valida`,
            // `multiclase_restringida`, `clase_ex`, `alineamiento_no_permitido_campana`), en el aviso de arriba.
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido devolver la vida al personaje.';
        } finally {
            this.guardando = false;
        }
    }

    cancelar(): void {
        this.alTerminar?.();
    }
}
