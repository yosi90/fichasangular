import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { NivelQuePierdeComponent } from 'src/app/components/sesiones/nivel-que-pierde/nivel-que-pierde.component';
import { Clase } from 'src/app/interfaces/clase';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { Raza } from 'src/app/interfaces/raza';
import { ExperienciaPersonaje, MAXIMO_CONCEPTO_EVENTO, NivelPerdido, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { AppToastService } from 'src/app/services/app-toast.service';
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
    FilaPerdida, filasDelNivelPerdido, indiceDelNivelQueSePierde, nombresDeLaFicha, ordenPorConocer, perdidaDelNivel, quitarElNivelDelMotor,
    ResultadoPerdida,
} from 'src/app/services/utils/perder-nivel';
import { razaPorEdades } from 'src/app/services/utils/razas-por-edades';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';
import {
    cambiosDeLaVuelta, conLaConstitucionDeVuelta, EstadoDeLaVuelta, especialesDeLasTablas, estadoDeLaVuelta, fichaDeLaVuelta,
    indiceDelUltimoNivelDeLaClase, MedioDeLaVuelta, MEDIOS_DE_LA_VUELTA, nepTrasLaVuelta,
    NO_SIRVEN_PARA_LA_VUELTA, pxTrasLaVuelta, sumarPerdidas,
} from 'src/app/services/utils/vuelta-a-la-vida';

/**
 * Devolver la vida a un muerto viviente de clase de monstruo (*Libris Mortis*, pág. 35; roadmap de sesiones, fase 7;
 * contrato en `personajes.md`, «Devolver la vida a un muerto viviente»): el medio (*resurrección*, *deseo* o *milagro*, que
 * le quitan además un nivel, o *resurrección verdadera*, que no), el concepto, lo que cambia a la vista y confirmar
 * (`POST /personajes/{id}/vuelta-a-la-vida`). La ficha se hace con el motor de la creación en su propia instancia
 * (`MotorDesdeFichaService`): sin todos los niveles de la clase de monstruo, uno a uno como en «Perder un nivel»
 * (`perdidaDelNivel`), con la raza de antes (`NuevoPersonajeService.devolverLaRazaBase`), su Constitución guardada y, con
 * *resurrección*, sin el último nivel de clase que le queda (o 2 puntos de Constitución con un solo DG). Lo que no se puede
 * (los `409` del contrato) se enseña deshabilitado, con su porqué. Se abre desde «Devolver la vida» del historial
 * (`SubidaNivelPuertaService.solicitarVuelta`) en su pestaña.
 */
@Component({
    selector: 'app-devolver-la-vida',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, NivelQuePierdeComponent],
    templateUrl: './devolver-la-vida.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class DevolverLaVidaComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

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

    constructor(
        public svc: NuevoPersonajeService,
        auth: Auth,
        private sesionesSvc: SesionesService,
        private puerta: SubidaNivelPuertaService,
        private motor: MotorDesdeFichaService,
        private razaSvc: RazaService,
        private toasts: AppToastService,
    ) {
        this.cuenta = new MismaCuenta(auth);
    }

    ngOnInit(): void {
        void this.cargar();
    }

    ngOnDestroy(): void {
        this.cuenta.destruir();
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

    /** Si pierde además el último nivel de clase que le queda (con *resurrección* y más de un DG sin la clase de monstruo). */
    get pierdeOtroNivel(): boolean {
        return this.pierdeNivel && !this.impedimento && toInt(this.estado?.dgsSinLaClase) > 1;
    }

    /** Si con un solo DG sin la clase de monstruo pierde 2 puntos de Constitución en lugar del nivel. */
    get pierdeConstitucion(): boolean {
        return this.pierdeNivel && !this.impedimento && toInt(this.estado?.dgsSinLaClase) === 1;
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

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.cuenta.fijar();
        try {
            const leida = await this.motor.cargarSesionDeJuego(this.svc, this.idPersonaje, () => this.cuenta.sigue(), {
                sinPermiso: 'Solo su dueño o el máster de su campaña pueden devolverle la vida.',
                sinSesion: 'Para devolverle la vida hace falta una sesión de juego abierta: ábrela desde el historial.',
            }, { alLeer: (historial) => this.experiencia = historial.experiencia });
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
        if (this.motivoDelMedio(medio) || this.pierdeNivel === medio.pierdeNivel)
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
     */
    calcular(): void {
        const svc = this.svc;
        const entrada = this.entrada!;
        const clase = this.claseDeMonstruo!;
        const estado = this.estado!;
        const antes = this.motor.cuerpoDelMotor(svc, entrada);
        const pjAntes: Personaje = JSON.parse(JSON.stringify(svc.PersonajeCreacion));
        const rotasAntes = svc.dotesSinSusPrerrequisitos();
        const nombres = nombresDeLaFicha(svc, this.pj, entrada);
        const nep = toInt(this.experiencia?.nivel);
        const nivelesClaseAntes = (entrada.colecciones?.clases ?? []).reduce((suma, c) => suma + Math.max(0, toInt(c?.nivel)), 0);
        const razaDelNep = this.combinada ?? this.raza!;

        // Los niveles de la clase de monstruo, del último al primero, con lo que dieron.
        let ficha = entrada;
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

        // La raza de antes y su Constitución (con un solo DG y resurrección, 2 puntos menos).
        const vuelta = conLaConstitucionDeVuelta(ficha, this.constitucionGuardada ?? 0, dgs);
        ficha = vuelta.ficha;
        let exacto = vuelta.pg.exacto && perdidas.every((p) => p.pg.exacto);
        if (this.pierdeConstitucion) {
            const menos = fichaConConstitucionPerdida(ficha, 1);
            if (!menos)
                return;
            ficha = menos.ficha;
        }
        svc.devolverLaRazaBase(this.combinada, toInt(ficha.caracteristicas?.constitucion?.valor));

        // Con resurrección y más de un DG, el nivel de más: el último de clase que le queda, como en «Perder un nivel».
        let nivelDeMas: { fila: FilaPerdida; loQueDaba: FilaPerdida[]; } | null = null;
        const avisos = perdidas.flatMap((p) => p.avisos);
        if (this.pierdeOtroNivel) {
            const indice = indiceDelNivelQueSePierde(ficha.niveles, this.idClaseElegida);
            if (indice === null) {
                this.falta = 'Elige la clase que pierde el nivel de más.';
                return;
            }
            const { resultado, nivel, filaDelNivel } = perdidaDelNivel(svc, this.motor, {
                entrada: ficha, indice, dgs, incremento: this.incrementoElegido, dote: this.pideDote ? doteDeLaClave(this.doteElegida) : null,
            });
            quitarElNivelDelMotor(svc, resultado, nivel.idClase, indice);
            nivelDeMas = { fila: filaDelNivel, loQueDaba: filasDelNivelPerdido(resultado, nombresDeLaFicha(svc, this.pj, ficha)) };
            avisos.push(...resultado.avisos);
            exacto = exacto && resultado.pg.exacto;
            ficha = resultado.ficha;
        }

        // Las dotes, vueltas a evaluar con todo: las que se quedan sin un prerrequisito y las que lo vuelven a cumplir.
        const despues = this.motor.cuerpoDelMotor(svc, entrada);
        const clave = (d: { idDote: unknown; idExtra: unknown; }) => `${toInt(d.idDote)}|${Math.max(0, toInt(d.idExtra))}`;
        const rotas = svc.dotesSinSusPrerrequisitos();
        const rotasAntesClaves = new Set(rotasAntes.map(clave));
        const rotasClaves = new Set(rotas.map(clave));
        const marcar = rotas.filter((d) => !rotasAntesClaves.has(clave(d)));
        const desmarcar = (entrada.colecciones?.dotes ?? []).filter((d: any) => d?.sinPrerrequisitos && !rotasClaves.has(clave(d)))
            .map((d: any) => ({ idDote: toInt(d.idDote), idExtra: toInt(d.idExtra), origen: `${d.origen ?? ''}` }));

        const sustituidos = razaDelNep.Especiales_sustituidos ?? this.raza!.Especiales_sustituidos ?? [];
        this.ficha = fichaDeLaVuelta({
            entrada, sinLosNiveles: ficha, antes, despues, sustituidos, marcar, desmarcar,
            deLasTablas: especialesDeLasTablas((ficha.colecciones?.clases ?? []).map((c) => ({ clase: svc.claseDelCatalogo(c.idClase), nivel: toInt(c.nivel) }))),
        });

        const quitados = estado.nivelesDeLaClase + (nivelDeMas ? 1 : 0);
        const nepTrasQuitar = nepTrasLaVuelta(nep, estado.nivelesDeLaClase, razaDelNep, this.razaDeAntes!, nivelesClaseAntes);
        const nepFinal = nivelDeMas ? nepTrasLaVuelta(nep, quitados, razaDelNep, this.razaDeAntes!, nivelesClaseAntes) : null;
        const px = toInt(this.experiencia?.px);
        const pxs = pxTrasLaVuelta(px, nepTrasQuitar, nepFinal);
        this.nepDespues = nepFinal ?? nepTrasQuitar;
        this.pxDespues = pxs.despues;
        const idsAntes = new Set((entrada.colecciones?.especiales ?? []).map((e: any) => toInt(e?.idEspecial)));
        const idsDespues = new Set((this.ficha.colecciones?.especiales ?? []).map((e: any) => toInt(e?.idEspecial)));
        const suma = sumarPerdidas(perdidas);
        this.cambios = cambiosDeLaVuelta({
            antes: pjAntes, despues: svc.PersonajeCreacion,
            raza: `${this.raza!.Nombre ?? ''}`, razaDeAntes: `${this.razaDeAntes!.Nombre ?? ''}`,
            claseDeMonstruo: `${clase.Nombre ?? ''}`, nivelesDeLaClase: estado.nivelesDeLaClase,
            loQueDaban: suma ? filasDelNivelPerdido(suma, nombres) : [],
            nivelDeMas, pierdeConstitucion: this.pierdeConstitucion, constitucion: toInt(ficha.caracteristicas?.constitucion?.valor),
            nep: { antes: nep, despues: this.nepDespues },
            px: { antes: px, enMedio: pxs.enMedio, despues: pxs.despues },
            pg: { antes: toInt(entrada.personaje.puntosGolpe), despues: toInt(ficha.personaje.puntosGolpe), exacto },
            aptitudes: sustituidos.filter((s) => idsDespues.has(toInt(s.Especial?.Id)) && !idsAntes.has(toInt(s.Especial?.Id)))
                .map((s) => ({ antes: idsAntes.has(toInt(s.Especial_nuevo?.Id)) ? s.Especial_nuevo.Nombre : '—', ahora: s.Especial.Nombre })),
            vuelvenAValer: desmarcar.map((d) => rotasAntes.find((r) => clave(r) === clave(d))?.nombre ?? nombres.dote(d.idDote, d.idExtra)),
            sinPoderUsar: marcar.map((d) => d.nombre),
        });
        this.avisos = Array.from(new Set(avisos));
    }

    // --- Guardar -------------------------------------------------------------------------------------------------------

    get puedeGuardar(): boolean {
        return !!this.ficha && !this.impedimento && !this.falta && !this.calculando && !this.guardando && (!this.pideDote || !!this.doteElegida);
    }

    async guardar(): Promise<void> {
        if (!this.puedeGuardar || !this.sesion || !this.ficha)
            return;
        const nombre = this.pj?.Nombre || 'El personaje';
        const raza = `${this.razaDeAntes?.Nombre ?? ''}`.toLowerCase();
        const r = await Swal.fire({
            icon: 'warning', title: 'Devolver la vida',
            text: `${nombre} pierde todos sus niveles de ${this.claseDeMonstruo?.Nombre ?? 'su clase de monstruo'} y vuelve a ser ${raza}`
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
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido devolver la vida al personaje.';
        } finally {
            this.guardando = false;
        }
    }

    cancelar(): void {
        this.alTerminar?.();
    }
}
