import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { HuecoDeSelectores } from 'src/app/components/sesiones/hueco-selectores';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { resolverDotesPendientes, resolverIncrementoPendiente, tiradasPermitidasDe } from 'src/app/components/sesiones/pasos-con-selectores';
import { RepartoRangosComponent } from 'src/app/components/sesiones/reparto-rangos/reparto-rangos.component';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { ExperienciaPersonaje, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { CampanaService } from 'src/app/services/campana.service';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { cambiosDeLaPlantilla, CambioPlantilla, esPlantillaAdquirible, fichaDeLaPlantilla, loQuePierdeDeSuMagia, PgPlantilla, puntosGolpeTrasPlantilla } from 'src/app/services/utils/adquirir-plantilla';
import { evaluarAlineamientoClase } from 'src/app/services/utils/alineamiento-clase';
import { evaluarAlineamientoRaza } from 'src/app/services/utils/alineamiento-raza';
import { getAlineamientoBasicoIdPorNombre } from 'src/app/services/utils/alineamiento-contrato';
import { caracteristicasPerdidasDe, modificadorCaracteristica } from 'src/app/services/utils/caracteristicas';
import { ajusteDePlantillas, dgsDePlantilla } from 'src/app/services/utils/nivel-personaje';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';
import { confirmarEleccionHomebrew } from 'src/app/services/utils/confirmar-homebrew';
import { DecisionHomebrew, motivoHomebrew, motivosQueConfirmar } from 'src/app/services/utils/personaje-oficialidad';
import { evaluarPlantillaParaElegir, PlantillaEvaluacionParaElegir } from 'src/app/services/utils/plantilla-elegibilidad';
import { campanaDejaSaltarAlineamiento, campanaDejaSaltarRequisitosPlantilla, modoHomebrewDeCampana } from 'src/app/services/utils/politica-campana';
import { carasDado } from 'src/app/services/utils/puntos-golpe';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';

export type PasoPlantilla = 'plantilla' | 'incremento' | 'pg' | 'habilidades' | 'dotes' | 'resumen';

/**
 * Una clase que deja de admitir el alineamiento que fija la plantilla (el paladín que se vuelve vampiro): queda ex (la
 * regla) o, si se puede (`puedeMantener`), se mantiene como homebrew con la decisión `alineamiento_clase`.
 */
export interface ClaseContraAlineamiento {
    idClase: number;
    nombre: string;
    razones: string[];
    pierde: string[];
    expiacion: boolean;
    puedeMantener: boolean;
    /** Por qué no se puede mantener (la campaña no deja saltarse el alineamiento). */
    motivoNoMantener?: string;
    mantenida: boolean;
}

/** Una plantilla de la lista, con lo que dice su evaluación (la de la creación) y si se puede elegir. */
export interface OpcionPlantilla {
    plantilla: Plantilla;
    estado: 'elegible' | 'saltable' | 'bloqueada';
    motivo: string;
}

/**
 * Adquirir una plantilla con el personaje ya creado (roadmap de sesiones, fase 7): la lista de las que puede adquirir con
 * la misma evaluación que el paso de plantillas de la creación (`evaluarPlantillaParaElegir` con el contexto del motor),
 * los pasos que dispara (el incremento y las dotes por los DG que añade, sus PG, sus rangos) con los selectores de la
 * creación (en el hueco común, `HuecoDeSelectores`) y el resumen con lo que cambia antes de guardar
 * (`POST /personajes/{id}/plantillas`). Usa el motor de la creación en su propia instancia (`MotorDesdeFichaService`) y las
 * piezas de la subida (`subir-nivel.component.sass`, `app-reparto-rangos`).
 * Se abre desde «Adquirir una plantilla» del historial (`SubidaNivelPuertaService.solicitarPlantilla`) en su pestaña.
 */
@Component({
    selector: 'app-adquirir-plantilla',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, RepartoRangosComponent],
    templateUrl: './adquirir-plantilla.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class AdquirirPlantillaComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    @ViewChild('modalHost', { read: ViewContainerRef }) modalHost?: ViewContainerRef;

    cargando = true;
    guardando = false;
    error = '';
    paso: PasoPlantilla = 'plantilla';
    pasos: PasoPlantilla[] = ['plantilla', 'resumen'];

    pj: Personaje | null = null;
    entrada: PersonajeCreateRequestDto | null = null;
    sesion: SesionPersonaje | null = null;
    experiencia: ExperienciaPersonaje | null = null;
    /** Con qué rol apunta quien la adquiere: el máster (y un PNJ) se salta la política de la campaña, con aviso. */
    rolActor: 'jugador' | 'master' | null = null;

    opciones: OpcionPlantilla[] = [];
    mirada: OpcionPlantilla | null = null;
    elegida: Plantilla | null = null;
    /** Se adquiere sin cumplir sus prerrequisitos (homebrew: `requisitos_plantilla`). */
    sinRequisitos = false;
    /** Las po que cuesta las paga otro (un mecenas, o ya se apuntaron): no salen de su saldo. */
    poPagadasPorOtro = false;

    /** Lo que cuesta adquirir la elegida (los PX y las po se cobran al guardar; los niveles se pierden antes). */
    get coste(): { px: number; po: number; niveles: number; } | null {
        const c = this.elegida?.Coste_al_adquirir;
        return c && (c.Px > 0 || c.Po > 0 || c.Niveles_perdidos > 0) ? { px: c.Px, po: c.Po, niveles: c.Niveles_perdidos } : null;
    }

    textoPx(valor: number): string {
        return formatoPx(valor);
    }

    tiradasPermitidas = 1;
    /** Cada tirada, todos los DG nuevos a la vez; se queda con la que elija. */
    tiradas: number[][] = [];
    tiradaElegida: number | null = null;
    pg: PgPlantilla | null = null;
    cambios: CambioPlantilla[] = [];
    /** Las clases que dejan de admitir su alineamiento con la plantilla: ex, o mantenidas como homebrew. */
    clasesContraAlineamiento: ClaseContraAlineamiento[] = [];
    /** Las que se mantienen como homebrew (la decisión `alineamiento_clase`), por su id. */
    private clasesMantenidas = new Set<number>();

    private antes: PersonajeCreateRequestDto | null = null;
    private pjAntes: Personaje | null = null;
    private carasClaseAntes = new Map<number, number>();
    private carasRacialAntes = 0;
    private modConAntes = 0;
    /** La cuenta con la que se abrió: lo que llega después de cerrarla o de cambiar de cuenta se descarta. */
    private readonly cuenta: MismaCuenta;
    private readonly selectores = new HuecoDeSelectores(() => this.modalHost);

    constructor(
        public svc: NuevoPersonajeService,
        auth: Auth,
        private sesionesSvc: SesionesService,
        private puerta: SubidaNivelPuertaService,
        private campanaSvc: CampanaService,
        private motor: MotorDesdeFichaService,
        private plantillaSvc: PlantillaService,
        private navegacion: NavegacionRolService,
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

    get dgsNuevos(): number {
        return dgsDePlantilla(this.elegida);
    }

    get carasNuevos(): number {
        return carasDado(this.elegida?.Licantronia_dg?.Dado);
    }

    get nepDespues(): number {
        return toInt(this.experiencia?.nivel) + ajusteDePlantillas([this.elegida]) + this.dgsNuevos;
    }

    get puedeSeguirPg(): boolean {
        return this.dgsNuevos < 1 || this.tiradaElegida !== null;
    }

    px(valor: number): string {
        return formatoPx(valor);
    }

    etiquetaPaso(paso: PasoPlantilla): string {
        const nombres: Record<PasoPlantilla, string> = {
            plantilla: this.elegida ? `Plantilla: ${this.elegida.Nombre}` : 'Plantilla',
            incremento: 'Incremento',
            pg: 'Puntos de golpe',
            habilidades: 'Habilidades',
            dotes: 'Dotes',
            resumen: 'Resumen',
        };
        return `${this.pasos.indexOf(paso) + 1} · ${nombres[paso]}`;
    }

    estadoPaso(paso: PasoPlantilla): 'hecho' | 'actual' | 'pendiente' {
        const i = this.pasos.indexOf(paso);
        const actual = this.pasos.indexOf(this.paso);
        return i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente';
    }

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.cuenta.fijar();
        try {
            const historial = await this.sesionesSvc.historial(this.idPersonaje);
            this.experiencia = historial.experiencia;
            this.rolActor = historial.rolActor ?? null;
            const abierta = toInt(historial.experiencia?.sesionAbierta?.numero);
            if (!historial.puedeApuntar)
                throw new Error('Solo su dueño o el máster de su campaña pueden darle una plantilla.');
            if (abierta < 1)
                throw new Error('Para adquirir una plantilla hace falta una sesión de juego abierta: ábrela desde el historial.');
            const cargada = await this.motor.cargarSesion(this.svc, this.idPersonaje, abierta, () => this.cuenta.sigue());
            if (!cargada)
                return;
            this.sesion = cargada.sesion;
            this.entrada = cargada.entrada;
            this.pj = cargada.pj;
            this.tiradasPermitidas = await tiradasPermitidasDe(this.entrada, this.campanaSvc);
            await this.hidratar();
            const catalogo = await this.motor.primero(this.plantillaSvc.getPlantillas());
            if (!this.cuenta.sigue())
                return;
            this.recalcularOpciones(catalogo ?? []);
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la plantilla.';
        } finally {
            this.cargando = false;
        }
    }

    private async hidratar(): Promise<void> {
        await this.motor.hidratar(this.svc, this.pj!, this.entrada!);
        this.antes = this.motor.cuerpoDelMotor(this.svc, this.entrada!);
        this.pjAntes = JSON.parse(JSON.stringify(this.svc.PersonajeCreacion));
        this.carasClaseAntes = new Map((this.entrada!.niveles ?? []).map((n) =>
            [toInt(n?.idClase), this.svc.carasDadoGolpeDeClase(this.svc.claseDelCatalogo(n?.idClase))] as const));
        this.carasRacialAntes = this.svc.carasDadoGolpeRacial();
        this.modConAntes = this.modConstitucion();
    }

    private modConstitucion(): number {
        const p = this.svc.PersonajeCreacion;
        return caracteristicasPerdidasDe(p).Constitucion ? 0 : toInt(p.ModConstitucion);
    }

    // --- La plantilla --------------------------------------------------------------------------------------------------

    /** Las que puede adquirir: las adquiridas que no tiene, con la evaluación de la creación y la política de su campaña. */
    private recalcularOpciones(catalogo: Plantilla[]): void {
        const tiene = new Set((this.entrada?.colecciones?.plantillas ?? []).map((p) => toInt(p?.idPlantilla)));
        const homebrewPj = this.pj?.Oficial === false;
        const ctx = this.svc.getContextoEvaluacionPlantillas(this.svc.RazaSeleccionada, true);
        const sinHomebrew = modoHomebrewDeCampana(this.pj?.PoliticaCompra) === 'forbidden';
        const salta = this.rolActor === 'master' || this.entrada?.personaje?.tipo === 'pnj';
        // Sin sus requisitos, con la regla de la creación: solo si la campaña admite homebrew sin límite (o se salta su política).
        const saltaRequisitos = salta || campanaDejaSaltarRequisitosPlantilla(this.pj?.PoliticaCompra);
        const actuales = this.svc.EstadoFlujo.plantillas.seleccionadas ?? [];
        const alineamiento = this.svc.PersonajeCreacion.Alineamiento;
        this.opciones = (catalogo ?? [])
            .filter((p) => esPlantillaAdquirible(p) && !tiene.has(toInt(p.Id)))
            .map((plantilla) => this.opcion(plantilla, evaluarPlantillaParaElegir(plantilla, ctx, alineamiento, actuales),
                sinHomebrew && !salta, saltaRequisitos))
            .filter((o) => o.estado !== 'bloqueada' || o.plantilla.Oficial !== false || homebrewPj || !sinHomebrew)
            .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || a.plantilla.Nombre.localeCompare(b.plantilla.Nombre, 'es'));
    }

    /**
     * Una plantilla de la lista: antes que nada, el homebrew que no admite la campaña; después, la evaluación de la creación
     * (`evaluarPlantillaParaElegir`: sus reglas y el alineamiento con las que ya tiene, que no se salta) y, si solo fallan
     * sus prerrequisitos (`saltable`), si la campaña deja saltárselos (`saltaRequisitos`).
     */
    private opcion(plantilla: Plantilla, evaluacion: PlantillaEvaluacionParaElegir, bloqueaHomebrew: boolean,
        saltaRequisitos: boolean): OpcionPlantilla {
        if (bloqueaHomebrew && plantilla.Oficial === false)
            return { plantilla, estado: 'bloqueada', motivo: 'La campaña no admite contenido homebrew.' };
        if (evaluacion.estado === 'eligible')
            return { plantilla, estado: 'elegible', motivo: '' };
        const motivo = evaluacion.razones.join(' · ') || 'No cumple sus prerrequisitos.';
        if (evaluacion.saltable && !saltaRequisitos)
            return { plantilla, estado: 'bloqueada', motivo: `${motivo} · La campaña no admite homebrew: no se pueden saltar sus requisitos.` };
        return { plantilla, estado: evaluacion.saltable ? 'saltable' : 'bloqueada', motivo };
    }

    mirar(opcion: OpcionPlantilla): void {
        this.mirada = this.mirada?.plantilla.Id === opcion.plantilla.Id ? null : opcion;
    }

    verDetalles(plantilla: Plantilla): void {
        this.navegacion.abrir({ clase: 'detalle', lista: 'plantillas', item: plantilla });
    }

    /** «Elegir»: avisa antes si vuelve homebrew la ficha (una plantilla homebrew, o sin sus requisitos) y la aplica. */
    async elegir(opcion: OpcionPlantilla): Promise<void> {
        if (this.elegida || this.guardando || opcion.estado === 'bloqueada')
            return;
        const plantilla = opcion.plantilla;
        const motivos = motivosQueConfirmar([
            motivoHomebrew('plantilla', plantilla),
            opcion.estado === 'saltable' ? `Plantilla sin sus requisitos: ${plantilla.Nombre} (${opcion.motivo})` : null,
        ], this.pj?.Oficial === false);
        if (motivos.length > 0 && !await confirmarEleccionHomebrew(`Adquirir ${plantilla.Nombre}`, motivos))
            return;
        if (!this.svc.agregarPlantillaSeleccion(this.svc.EstadoFlujo.plantillas.disponibles.find((p) => p.Id === plantilla.Id) ?? plantilla))
            return;
        this.elegida = plantilla;
        this.sinRequisitos = opcion.estado === 'saltable';
        this.mirada = null;
        const contexto = `Plantilla ${plantilla.Nombre}`;
        // Los DG que añade cuentan para los incrementos y las dotes por DG totales (Manual de monstruos, pág. 178).
        this.svc.registrarAumentosPendientesPorProgresion(contexto);
        this.svc.confirmarSeleccionActualPlantillas();
        const conRangos = this.svc.iniciarDistribucionHabilidadesPorPlantillasDG([plantilla]);
        this.svc.registrarDotesPendientesPorProgresion(contexto);
        this.pasos = [
            'plantilla',
            ...(this.svc.getAumentosCaracteristicaPendientes().length > 0 ? ['incremento' as const] : []),
            'pg',
            ...(conRangos ? ['habilidades' as const] : []),
            ...(this.svc.getDotesPendientes().some((d) => d.estado === 'pendiente') ? ['dotes' as const] : []),
            'resumen',
        ];
        this.calcularPg();
        await this.siguiente();
    }

    // --- Los pasos -----------------------------------------------------------------------------------------------------

    async siguiente(): Promise<void> {
        const i = this.pasos.indexOf(this.paso);
        const siguiente = this.pasos[i + 1] ?? 'resumen';
        this.paso = siguiente;
        if (siguiente === 'incremento')
            await this.resolverIncremento();
        else if (siguiente === 'dotes')
            await this.resolverDotes();
        else if (siguiente === 'pg')
            this.calcularPg();
        else if (siguiente === 'resumen')
            this.prepararResumen();
    }

    private async resolverIncremento(): Promise<void> {
        await resolverIncrementoPendiente(this.svc, this.selectores, 'Incremento de característica por sus DG nuevos');
        await this.siguiente();
    }

    private async resolverDotes(): Promise<void> {
        if (await resolverDotesPendientes(this.svc, this.selectores))
            await this.siguiente();
    }

    // PG
    tirar(): void {
        if (this.tiradas.length >= this.tiradasPermitidas || this.dgsNuevos < 1 || this.carasNuevos < 1)
            return;
        const tirada = Array.from({ length: this.dgsNuevos }, () => 1 + Math.floor(Math.random() * this.carasNuevos));
        this.tiradas = [...this.tiradas, tirada];
        const suma = (t: number[]) => t.reduce((a, b) => a + b, 0);
        this.tiradaElegida = this.tiradas.reduce((mejor, t, i) => suma(t) > suma(this.tiradas[mejor]) ? i : mejor, 0);
        this.calcularPg();
    }

    elegirTirada(indice: number): void {
        this.tiradaElegida = indice;
        this.calcularPg();
    }

    sumaTirada(tirada: number[]): number {
        return tirada.reduce((a, b) => a + b, 0);
    }

    /** La Constitución con la que suman los DG nuevos: la de su forma animal (Manual de monstruos, «Licántropo»). */
    private modConNuevos(): number {
        const p = this.svc.PersonajeCreacion;
        if (caracteristicasPerdidasDe(p).Constitucion)
            return 0;
        return modificadorCaracteristica(toInt(p.Constitucion) + toInt(this.elegida?.Modificadores_forma_animal?.Constitucion));
    }

    private calcularPg(): void {
        if (!this.entrada || !this.elegida)
            return;
        const clase = (id: number) => this.svc.claseDelCatalogo(id);
        this.pg = puntosGolpeTrasPlantilla({
            entrada: this.entrada,
            dgsAntes: toInt(this.pj?.Nivel_personaje),
            modConAntes: this.modConAntes,
            modConDespues: this.modConstitucion(),
            carasClaseAntes: (id) => this.carasClaseAntes.get(id) ?? this.svc.carasDadoGolpeDeClase(clase(id)),
            carasClaseDespues: (id) => this.svc.carasDadoGolpeDeClase(clase(id)),
            carasRacialAntes: this.carasRacialAntes,
            carasRacialDespues: this.svc.carasDadoGolpeRacial(),
            tiradasNuevas: this.tiradaElegida !== null ? this.tiradas[this.tiradaElegida] ?? [] : [],
            modConNuevos: this.modConNuevos(),
        });
    }

    // Habilidades (la tabla es `app-reparto-rangos`, la de la subida)
    cerrarHabilidades(): void {
        if (!this.svc.puedeCerrarDistribucionHabilidades())
            return;
        this.svc.cerrarDistribucionHabilidades();
        void this.siguiente();
    }

    // --- El resumen y el guardado --------------------------------------------------------------------------------------

    private idAlineamientoDespues(): number | null {
        const antes = normalizarTexto(this.pjAntes?.Alineamiento ?? '');
        const ahora = normalizarTexto(this.svc.PersonajeCreacion.Alineamiento ?? '');
        return ahora && ahora !== antes ? toInt(getAlineamientoBasicoIdPorNombre(ahora)) || null : null;
    }

    private prepararResumen(): void {
        this.calcularPg();
        this.clasesContraAlineamiento = this.clasesQueDejanSuAlineamiento();
        this.cambios = cambiosDeLaPlantilla({
            antes: this.pjAntes!,
            despues: this.svc.PersonajeCreacion,
            plantilla: this.elegida!,
            pg: this.pg,
            tiradas: this.tiradaElegida !== null ? this.tiradas[this.tiradaElegida] ?? [] : [],
            experiencia: this.experiencia,
            nepDespues: this.nepDespues,
            exClases: this.clasesContraAlineamiento,
            razaContraAlineamiento: this.razaContraElAlineamientoNuevo(),
        });
    }

    /**
     * Las clases que dejan de admitir su alineamiento si la plantilla se lo cambia (el paladín que se vuelve vampiro): se
     * quedan sus niveles, pierde lo que dice su clase (`Ex`) y no puede subir en ella (MJ pág. 55; Manual de monstruos,
     * pág. 179): queda ex. No es homebrew: es la regla (dictamen del máster de Rol, fase 7). Con el evaluador común
     * (`evaluarAlineamientoClase`); la API lo deriva igual (`utils/ex_clases.py`).
     */
    private clasesQueDejanSuAlineamiento(): ClaseContraAlineamiento[] {
        if (this.idAlineamientoDespues() === null)
            return [];
        const alineamiento = this.svc.PersonajeCreacion.Alineamiento;
        const puede = this.puedeMantenerClaseContraAlineamiento;
        // La deidad no cambia al adquirir una plantilla: cuenta para la regla de la deidad de sus clases (el cruzado divino).
        const deidad = this.svc.deidadDelPersonaje();
        return (this.entrada?.colecciones?.clases ?? []).flatMap((c) => {
            const clase = this.svc.claseDelCatalogo(c?.idClase);
            const antes = evaluarAlineamientoClase(clase, { alineamiento: this.pjAntes?.Alineamiento ?? '', deidad });
            const despues = evaluarAlineamientoClase(clase, { alineamiento, deidad });
            if (!clase || !despues.estricta || antes.estricta)
                return [];
            const idClase = toInt(clase.Id);
            const pierde = [...(clase.Ex?.Especiales ?? []).map((e) => e.Nombre), ...loQuePierdeDeSuMagia(clase)];
            return [{
                idClase, nombre: `${clase.Nombre}`, razones: despues.incumple, pierde, expiacion: !!clase.Ex?.Requiere_expiacion,
                puedeMantener: puede, mantenida: puede && this.clasesMantenidas.has(idClase),
                motivoNoMantener: puede ? undefined : 'la campaña no deja saltarse las restricciones de alineamiento',
            }];
        });
    }

    /**
     * Si se puede mantener como homebrew una clase que deja de admitir su alineamiento (la decisión `alineamiento_clase`,
     * dictamen del máster de Rol): el máster y un PNJ, que se saltan la política de la campaña (con aviso:
     * `reglasIgnoradas`), o quien la campaña deje saltarse el alineamiento (`campanaDejaSaltarAlineamiento`; sin campaña,
     * siempre). La API aplica la misma regla (`decisiones_homebrew.incumplimientos_politica`).
     */
    get puedeMantenerClaseContraAlineamiento(): boolean {
        return this.rolActor === 'master' || this.entrada?.personaje?.tipo === 'pnj'
            || campanaDejaSaltarAlineamiento(this.pj?.PoliticaCompra);
    }

    /** El aviso del máster de la campaña: mantener una clase contra su alineamiento se salta la política de su campaña. */
    get avisoDelMaster(): string {
        return this.rolActor === 'master' && this.pj?.PoliticaCompra && !campanaDejaSaltarAlineamiento(this.pj.PoliticaCompra)
            && this.clasesContraAlineamiento.some((c) => c.puedeMantener)
            ? 'Como máster, puedes mantener la clase aunque tu campaña no deje saltarse el alineamiento: al guardar te diremos qué reglas se salta.'
            : '';
    }

    /** «Mantenerla (homebrew)»: avisa antes de volver homebrew la ficha, y la clase conserva lo que le da (no queda ex). */
    async mantenerClase(clase: ClaseContraAlineamiento): Promise<void> {
        if (!clase.puedeMantener || clase.mantenida || this.guardando)
            return;
        const yaEsHomebrew = this.pj?.Oficial === false || this.sinRequisitos || this.elegida?.Oficial === false
            || this.clasesMantenidas.size > 0;
        const motivos = motivosQueConfirmar([`${clase.nombre} contra su alineamiento (${clase.razones.join(' · ')})`], yaEsHomebrew);
        if (motivos.length > 0 && !await confirmarEleccionHomebrew(`Mantener ${clase.nombre}`, motivos))
            return;
        this.clasesMantenidas.add(clase.idClase);
        this.prepararResumen();
    }

    /** «Dejarla ex»: vuelve a la regla (conserva sus niveles, pierde lo que dice su clase y no sube). */
    dejarEx(clase: ClaseContraAlineamiento): void {
        this.clasesMantenidas.delete(clase.idClase);
        this.prepararResumen();
    }

    /**
     * Lo que exige su raza si la plantilla fija un alineamiento que la raza no suele tener (un elfo vampiro): con la regla
     * común de la raza (`alineamiento-raza.ts`), solo un aviso. No es homebrew: manda el alineamiento de la plantilla
     * (Manual de monstruos, pág. 291).
     */
    private razaContraElAlineamientoNuevo(): string | null {
        if (this.idAlineamientoDespues() === null)
            return null;
        const raza = this.svc.RazaSeleccionada?.Alineamiento;
        const ahora = evaluarAlineamientoRaza(raza, this.svc.PersonajeCreacion.Alineamiento);
        return ahora && !evaluarAlineamientoRaza(raza, this.pjAntes?.Alineamiento ?? '') ? ahora.requerido : null;
    }

    private fichaParaGuardar(): PersonajeCreateRequestDto {
        const idAlineamiento = this.idAlineamientoDespues();
        return fichaDeLaPlantilla({
            entrada: this.entrada!,
            antes: this.antes!,
            despues: this.motor.cuerpoDelMotor(this.svc, this.entrada!, idAlineamiento),
            idPlantilla: toInt(this.elegida?.Id),
            puntosGolpe: this.pg?.total ?? toInt(this.entrada?.personaje.puntosGolpe),
            idAlineamiento,
            decisionesNuevas: this.decisionesNuevas(),
        });
    }

    /** Lo que vuelve homebrew la adquisición: sin sus requisitos y las clases que se mantienen contra su alineamiento. */
    private decisionesNuevas(): DecisionHomebrew[] {
        return [
            ...(this.sinRequisitos ? [{ tipo: 'requisitos_plantilla' as const, idElemento: toInt(this.elegida?.Id) }] : []),
            ...this.clasesContraAlineamiento.filter((c) => c.mantenida)
                .map((c) => ({ tipo: 'alineamiento_clase' as const, idElemento: c.idClase })),
        ];
    }

    async guardar(): Promise<void> {
        if (this.guardando || !this.elegida || !this.sesion || !this.puedeSeguirPg)
            return;
        this.guardando = true;
        this.error = '';
        try {
            const tiradas = this.tiradaElegida !== null ? this.tiradas[this.tiradaElegida] ?? [] : [];
            await this.sesionesSvc.adquirirPlantilla(this.idPersonaje, {
                idPlantilla: toInt(this.elegida.Id),
                ficha: this.fichaParaGuardar(),
                version: this.sesion.version,
                ...(this.dgsNuevos > 0 ? { pg: { tiradas } } : {}),
                ...(this.coste && this.coste.po > 0 && this.poPagadasPorOtro ? { poPagadasPorOtro: true } : {}),
            });
            if (!this.cuenta.sigue())
                return;
            this.puerta.subidaHecha(this.idPersonaje);
            this.alTerminar?.();
        } catch (error: any) {
            if (!this.cuenta.sigue())
                return;
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido adquirir la plantilla.';
            if (`${error?.field ?? ''}`.startsWith('pg') && this.pasos.includes('pg'))
                this.paso = 'pg';
        } finally {
            this.guardando = false;
        }
    }

    async descartar(): Promise<void> {
        const r = await Swal.fire({
            icon: 'question', title: 'Empezar de nuevo', text: 'Se pierde la plantilla elegida y lo que has elegido con ella.',
            showCancelButton: true, confirmButtonText: 'Empezar de nuevo', cancelButtonText: 'Seguir',
            target: document.body, heightAuto: false, scrollbarPadding: false,
        });
        if (!r.isConfirmed)
            return;
        this.elegida = null;
        this.sinRequisitos = false;
        this.pasos = ['plantilla', 'resumen'];
        this.paso = 'plantilla';
        this.tiradas = [];
        this.tiradaElegida = null;
        this.pg = null;
        this.cambios = [];
        this.clasesContraAlineamiento = [];
        this.clasesMantenidas = new Set();
        this.error = '';
        await this.hidratar();
    }

    cancelar(): void {
        this.alTerminar?.();
    }

}

const ORDEN_ESTADO: Record<OpcionPlantilla['estado'], number> = { elegible: 0, saltable: 1, bloqueada: 2 };
