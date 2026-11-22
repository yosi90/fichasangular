import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import {
    SelectorCompaneroConfirmacion, SelectorCompaneroModalComponent,
} from 'src/app/components/nuevo-personaje/selector-companero-modal/selector-companero-modal.component';
import { SelectorDotesModalComponent } from 'src/app/components/nuevo-personaje/selector-dotes-modal/selector-dotes-modal.component';
import {
    SelectorEspecialidadMagicaConfirmacion, SelectorEspecialidadMagicaModalComponent,
} from 'src/app/components/nuevo-personaje/selector-especialidad-magica-modal/selector-especialidad-magica-modal.component';
import {
    SelectorFamiliarConfirmacion, SelectorFamiliarModalComponent,
} from 'src/app/components/nuevo-personaje/selector-familiar-modal/selector-familiar-modal.component';
import { HuecoDeSelectores } from 'src/app/components/sesiones/hueco-selectores';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { ClasesDelNivelComponent } from 'src/app/components/sesiones/clases-del-nivel/clases-del-nivel.component';
import { ConjurosDelNivelComponent, nombreDeConjuro } from 'src/app/components/sesiones/conjuros-del-nivel/conjuros-del-nivel.component';
import {
    avisarPaso, catalogosDelNivel, ClaseDelNivel, clasesParaElNivel, doteElegidaEnElHueco, resolverDotesPendientes, resolverLoQueEligeElCompanero, resolverIncrementoPendiente,
    tiradasPermitidasDe, tomarNivelDeClase,
} from 'src/app/components/sesiones/pasos-con-selectores';
import { PasosSesionComponent } from 'src/app/components/sesiones/pasos-sesion/pasos-sesion.component';
import { RepartoRangosComponent } from 'src/app/components/sesiones/reparto-rangos/reparto-rangos.component';
import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { EscuelaConjuros } from 'src/app/interfaces/escuela-conjuros';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateNivelEleccionDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { ExperienciaPersonaje, NivelPerdido, SesionPersonaje, TipoDeMascota } from 'src/app/interfaces/sesiones';
import { CampanaService } from 'src/app/services/campana.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { EnemigoPredilectoService } from 'src/app/services/enemigo-predilecto.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { EspecialService } from 'src/app/services/especial.service';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import {
    DotePendienteState, DoteSelectorCandidato, DoteSeleccionConfirmada, IntercambioConjurosNivel, NuevoPersonajeService,
} from 'src/app/services/nuevo-personaje.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { daDgEnNivel } from 'src/app/services/utils/clase-niveles';
import { claveCompanero, construirCatalogoCompanerosDesdeMonstruos } from 'src/app/services/utils/companero-reglas';
import { claveFamiliar, construirCatalogoFamiliaresDesdeMonstruos } from 'src/app/services/utils/familiar-reglas';
import { mismoExtra, toInt } from 'src/app/services/utils/normalizacion';
import { dotesQueVuelvenACumplir, marcarDotesSinPrerrequisitos } from 'src/app/services/utils/perder-nivel';
import { ofreceHomebrewALaFicha } from 'src/app/services/utils/politica-campana';
import {
    aplicarReciclajeAlMotor,
    aptitudesDelReciclaje,
    ClaseConConocidos,
    conjurosParaAprender,
    conocidosParaReciclar,
    DestinoDeRangos,
    destinosDeRangos,
    DoteReciclable,
    dominiosParaReciclar,
    dotesParaReciclar,
    esPlanDeRasgo,
    fichaConElReciclaje,
    filaDelReciclaje,
    filasDelReciclaje,
    HabilidadConRangos,
    habilidadesConRangos,
    huecoDeLaDoteReciclada,
    IdiomaReciclable,
    idiomasParaReciclar,
    loQueDejariaDeCumplir,
    MAXIMO_CONJUROS_RECICLADOS,
    MAXIMO_RANGOS_RECICLADOS,
    motivoDeLaEscuela,
    motivoDeLaMascota,
    PlanReciclaje,
    rasgosParaReciclar,
    reciclajeDelPlan,
} from 'src/app/services/utils/reciclaje';
import {
    aptitudesConElegir, candidatasEnLugarDe, cambiosDelRasgo, HuecoDeRasgo, huecoDeLaDoteDelRasgo, mismaFila, nombreConExtra, nombreDeLoQueTiene, nombreDeOpcion, OpcionDeRasgo,
    PlanRasgo,
} from 'src/app/services/utils/reciclaje-rasgos';
import {
    claseConEspecializacion, HuecoDeDominio, HuecoDeEscuela, huecoDeEscuela, nombreDeLaEspecializacion, OpcionDeDominio, PlanDominio,
    planDelDominio, planDeLaEscuela, PlanEscuela,
} from 'src/app/services/utils/reciclaje-dominio-escuela';
import {
    CatalogosDeMascotas, conLosRangosDelCompaneroNuevo, CriaturaDeMascota, entradasDelCompaneroReciclado, entradasDelFamiliarReciclado, HuecoDeMascota,
    huecosDeMascota, nombreDeLaCriatura, nombreDeLaMascota, PlanMascota, planDeLaMascota,
} from 'src/app/services/utils/reciclaje-mascota';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';
import { cambiosDeLasMascotas, sinLoQueYaNoDaLaMascota } from 'src/app/services/utils/mascota-al-dia';
import { sinMascotaNueva, TEXTOS_MASCOTA } from 'src/app/services/utils/mascota-sesion';
import { claveBorradorSubida, fichaDeLaSubida, PgSubida, pgTrasCambioDeCon } from 'src/app/services/utils/subida-nivel';
import { cambiosDeLaSubida, CambioSubida, campoDelErrorASubida, PasoSubida } from 'src/app/services/utils/subida-nivel-vista';

/** El borrador de la subida (`fichas35.subidaNivel.draft.v1.<uid>.<id>`), solo de esta cuenta y este personaje. */
interface BorradorSubida {
    version: 1;
    uid: string;
    idPersonaje: number;
    versionSesion: string;
    actualizado: number;
    paso: PasoSubida;
    idClase: number;
    motor: unknown;
    antes: PersonajeCreateRequestDto;
    tiradas: number[];
    tiradaElegida: number | null;
    olvidado: { idConjuro: number; idClase: number; } | null;
    /** Lo reciclado (ya en el motor): el plan, la ficha con el cambio y las clases que exige (los rangos a otra de clase). */
    reciclaje?: { plan: PlanReciclaje; entrada: PersonajeCreateRequestDto; clases: number[] | null; } | null;
}

/**
 * Lo que se puede elegir en el paso «Reciclar» (MJ II, tablas 8-1 y 8-2; aún sin niveles de sustitución): un dominio, la
 * escuela del mago y la mascota van con «Reciclar un rasgo de clase».
 */
type TipoDeReciclaje = 'ninguno' | Exclude<PlanReciclaje['tipo'], 'dominio' | 'escuela' | 'mascota'>;

/** Un cambio de conjuros a medio elegir: la clase, el que olvida y el que aprende en su lugar. */
interface CambioDeConjuro {
    idClase: number | null;
    olvida: number | null;
    aprende: number | null;
}

const CADUCIDAD_BORRADOR_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * La subida de nivel (roadmap de sesiones, fase 4; lienzo «Rol: sesiones y subida de nivel», pantalla 4): solo los pasos
 * que dispara el nivel, con el motor y los selectores de la creación (su propia instancia de `NuevoPersonajeService`, que
 * no toca la creación en curso) y, al final, el resumen con la diferencia antes de guardar (`POST /personajes/{id}/niveles`).
 * Se abre desde la ficha (`SubidaNivelPuertaService.solicitar`) en su pestaña, con carga diferida.
 */
@Component({
    selector: 'app-subir-nivel',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, ClasesDelNivelComponent, ConjurosDelNivelComponent, PasosSesionComponent, RepartoRangosComponent],
    templateUrl: './subir-nivel.component.html',
    styleUrls: ['./subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class SubirNivelComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    @ViewChild('modalHost', { read: ViewContainerRef }) modalHost?: ViewContainerRef;

    cargando = true;
    guardando = false;
    error = '';
    /** El paso donde enseñar el error de la API (con su frase). */
    errorPaso: PasoSubida | null = null;
    paso: PasoSubida = 'clase';
    pasos: PasoSubida[] = ['clase', 'resumen'];
    /** Si la subida deja reciclar: la campaña (`politicaCompra.permitirReciclaje`); sin campaña o en un PNJ, sí. */
    permiteReciclar = false;

    pj: Personaje | null = null;
    entrada: PersonajeCreateRequestDto | null = null;
    /** Los niveles que ha perdido (fase 7): un nivel perdido de otra clase cierra al paladín y al monje (MJ pág. 55). */
    private nivelesPerdidos: NivelPerdido[] = [];
    sesion: SesionPersonaje | null = null;
    experiencia: ExperienciaPersonaje | null = null;
    clases: ClaseDelNivel[] = [];
    claseElegida: Clase | null = null;
    nivelClase = 0;

    tiradasPermitidas = 1;
    tiradas: number[] = [];
    tiradaElegida: number | null = null;
    carasDg = 0;
    daDg = true;
    pg: PgSubida | null = null;

    intercambio: IntercambioConjurosNivel | null = null;
    olvidado: { idConjuro: number; idClase: number; nivel: number; } | null = null;
    idNuevoIntercambio: number | null = null;

    cambios: CambioSubida[] = [];

    // El reciclaje (Manual del jugador II, págs. 194-196): qué se elige en el paso y lo que ofrece cada tipo.
    readonly maximoRangos = MAXIMO_RANGOS_RECICLADOS;
    readonly maximoConjuros = MAXIMO_CONJUROS_RECICLADOS;
    tipoReciclaje: TipoDeReciclaje = 'ninguno';
    opcionesReciclaje: Array<{ tipo: TipoDeReciclaje; etiqueta: string; motivo: string; }> = [];
    dotesReciclables: DoteReciclable[] = [];
    /** La dote que se recicla y la que entra en su hueco (elegida en el selector de la creación). */
    planDote: Extract<PlanReciclaje, { tipo: 'dote'; }> | null = null;
    idiomasReciclables: IdiomaReciclable[] = [];
    idiomasAprendibles: Array<{ idIdioma: number; nombre: string; }> = [];
    idiomaQuita: number | null = null;
    idiomaPone: number | null = null;
    habilidadesReciclables: HabilidadConRangos[] = [];
    rangosOrigen: number | null = null;
    rangosDestino: number | null = null;
    rangosCantidad = 1;
    destinosRangos: DestinoDeRangos[] = [];
    /** Lo que dejaría de cumplir quitar esos rangos («Maestro del saber (No cumple: Saber (religión) 8 rangos)»). */
    bloqueoRangos = '';
    clasesConConocidos: ClaseConConocidos[] = [];
    cambiosConjuros: CambioDeConjuro[] = [{ idClase: null, olvida: null, aprende: null }];
    /** Los huecos de rasgo de clase (los grupos de la tabla de sus clases y las aptitudes con «Elegir»), con su motivo si no. */
    rasgosReciclables: HuecoDeRasgo[] = [];
    /** El hueco cuyas otras opciones se enseñan, y la que entra en su lugar (con la dote elegida, si la da). */
    rasgoElegido: HuecoDeRasgo | null = null;
    planRasgo: PlanRasgo | null = null;
    /** Los dominios de sus clases que los dan, con los que puede poner en su lugar; el elegido y el que entra. */
    dominiosReciclables: HuecoDeDominio[] = [];
    dominioElegido: HuecoDeDominio | null = null;
    planDominio: PlanDominio | null = null;
    /** La escuela del mago (la especialización y las prohibidas), si una clase se la da, y la que entra. */
    escuelaReciclable: HuecoDeEscuela | null = null;
    planEscuela: PlanEscuela | null = null;
    /** El catálogo de escuelas (solo si una de sus clases da especialización). */
    private escuelas: EscuelaConjuros[] = [];
    /** Su compañero animal y su familiar, en la clase que se los da, y la criatura que entra en lugar de una. */
    mascotasReciclables: HuecoDeMascota[] = [];
    planMascota: PlanMascota | null = null;
    /** Los catálogos de la creación de las mascotas (solo si tiene alguna). */
    private catalogosMascotas: CatalogosDeMascotas = { companeros: null, familiares: null };
    readonly nombreDeLaCriatura = nombreDeLaCriatura;
    readonly nombreDeLaMascota = nombreDeLaMascota;
    readonly nombreDeLoQueTiene = nombreDeLoQueTiene;
    readonly nombreDeOpcion = nombreDeOpcion;
    readonly nombreDeLaEspecializacion = nombreDeLaEspecializacion;
    /** Lo reciclado, ya hecho en el motor: va en el cuerpo de la subida y en la primera fila del resumen. */
    plan: PlanReciclaje | null = null;
    /** La `entrada` con el reciclaje hecho: la ficha sobre la que va el nivel. */
    private entradaReciclada: PersonajeCreateRequestDto | null = null;
    /** Las clases que puede subir si los rangos van a una habilidad que solo es de clase para alguna de ellas. */
    private clasesDelReciclaje: number[] | null = null;
    private antes: PersonajeCreateRequestDto | null = null;
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
        private escuelaSvc: EscuelaConjurosService,
        private disciplinaSvc: DisciplinaConjurosService,
        private enemigoSvc: EnemigoPredilectoService,
        private especialSvc: EspecialService,
        private monstruoSvc: MonstruoService,
    ) {
        this.cuenta = new MismaCuenta(auth);
    }

    ngOnInit(): void {
        void this.cargar();
    }

    ngOnDestroy(): void {
        this.cuenta.destruir();
        this.cerrarModal();
    }

    get nivelNuevo(): number {
        return toInt(this.experiencia?.nivel) + 1;
    }

    get puedeSeguir(): boolean {
        return toInt(this.experiencia?.nivelesPorSubir) > 1;
    }

    px(valor: number): string {
        return formatoPx(valor);
    }

    nombreConjuro(id: number): string {
        return nombreDeConjuro(this.svc, id);
    }

    /** El texto de cada paso en la fila de pasos (`app-pasos-sesion`), con su número. */
    readonly etiquetaPaso = (paso: PasoSubida): string => {
        const nombres: Record<PasoSubida, string> = {
            reciclar: 'Reciclar',
            clase: this.claseElegida ? `Clase: ${this.claseElegida.Nombre.toLowerCase()}` : 'Clase',
            incremento: 'Incremento',
            pg: 'Puntos de golpe',
            habilidades: 'Habilidades',
            dotes: 'Dotes',
            conjuros: 'Conjuros',
            intercambio: 'Cambiar un conjuro',
            companero: 'Habilidades del compañero',
            resumen: 'Resumen',
        };
        return `${this.pasos.indexOf(paso) + 1} · ${nombres[paso]}`;
    };

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.errorPaso = null;
        this.cuenta.fijar();
        try {
            const leida = await this.motor.cargarSesionDeJuego(this.svc, this.idPersonaje, () => this.cuenta.sigue(), {
                sinPermiso: 'Solo su dueño o el máster de su campaña pueden subirle de nivel.',
                sinSesion: 'Para subir de nivel hace falta una sesión de juego abierta: ábrela desde el historial.',
            }, {
                alLeer: (historial) => this.experiencia = historial.experiencia,
                exigir: (historial) => historial.experiencia?.puedeSubir ? null : 'Aún no le llegan los PX para el siguiente nivel.',
            });
            if (!leida)
                return;
            const { sesion, entrada, pj, nivelesPerdidos } = leida.cargada;
            this.nivelesPerdidos = nivelesPerdidos ?? [];
            this.sesion = sesion;
            this.entrada = entrada;
            this.pj = pj;
            this.tiradasPermitidas = await tiradasPermitidasDe(entrada, this.campanaSvc);
            this.permiteReciclar = pj.PoliticaCompra?.permitirReciclaje !== false;
            this.pasos = this.pasosIniciales();
            await this.hidratar();
            if (!this.cuenta.sigue())
                return;
            if (!await this.restaurarBorrador())
                this.irA(this.pasos[0]);
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la subida de nivel.';
        } finally {
            this.cargando = false;
        }
    }

    private async hidratar(): Promise<void> {
        await this.motor.hidratar(this.svc, this.pj!, this.entrada!, this.nivelesPerdidos);
        this.antes = this.cuerpoDelMotor();
        this.recalcularClases();
        await this.prepararReciclaje();
    }

    /** Los pasos antes de elegir la clase: «Reciclar», si la campaña lo deja, la clase y el resumen. */
    private pasosIniciales(): PasoSubida[] {
        return [...(this.permiteReciclar ? ['reciclar' as const] : []), 'clase', 'resumen'];
    }

    /** La ficha sobre la que va el nivel: la `entrada`, con lo reciclado si lo hay. */
    private get entradaDelNivel(): PersonajeCreateRequestDto {
        return this.entradaReciclada ?? this.entrada!;
    }

    /** El cuerpo del alta que arma el motor ahora (para la diferencia de la subida). */
    private cuerpoDelMotor(): PersonajeCreateRequestDto {
        return this.motor.cuerpoDelMotor(this.svc, this.entrada!);
    }

    // --- La clase ------------------------------------------------------------------------------------------------------

    private recalcularClases(): void {
        this.clases = clasesParaElNivel(this.svc, this.pj?.Oficial)
            .map((item) => this.clasesDelReciclaje && item.elegible && !this.clasesDelReciclaje.includes(toInt(item.clase.Id))
                ? { ...item, elegible: false, motivo: this.motivoClaseDelReciclaje() }
                : item);
    }

    private motivoClaseDelReciclaje(): string {
        const plan = this.plan?.tipo === 'rangos' ? this.plan : null;
        const nombres = (this.clasesDelReciclaje ?? []).map((id) => this.svc.claseDelCatalogo(id)?.Nombre).filter((n) => !!n);
        return `Los rangos reciclados van a ${plan?.pone.nombre ?? 'una habilidad'}, que solo es de clase para ${nombres.join(' o ')}: este nivel tiene que ser de ${nombres.length > 1 ? 'una de ellas' : 'esa clase'}.`;
    }

    async elegirClase(clase: Clase): Promise<void> {
        if (this.claseElegida || this.guardando)
            return;
        const nivel = await tomarNivelDeClase(this.svc, this.selectores, clase,
            catalogosDelNivel(this.motor, this.escuelaSvc, this.disciplinaSvc, this.enemigoSvc, this.especialSvc));
        if (nivel.estado === 'cancelado')
            return;
        if (nivel.estado === 'deshacer') {
            await this.descartar(false);
            return;
        }
        this.claseElegida = clase;
        this.nivelClase = nivel.nivelClase;
        this.daDg = daDgEnNivel(clase, this.nivelClase);
        // Con una plantilla que actualiza los DG (el vampiro), su dado: d12.
        this.carasDg = this.svc.carasDadoGolpeDeClase(clase);
        this.svc.iniciarDistribucionHabilidadesPorClase(clase);
        this.intercambio = this.svc.getIntercambioConjurosDelNivel();
        this.pasos = [
            ...(this.permiteReciclar ? ['reciclar' as const] : []),
            'clase',
            ...(this.svc.getAumentosCaracteristicaPendientes().length > 0 ? ['incremento' as const] : []),
            ...(this.daDg && this.carasDg > 0 ? ['pg' as const] : []),
            ...(this.svc.EstadoFlujo.habilidades.activa ? ['habilidades' as const] : []),
            ...(this.svc.getDotesPendientes().some((d) => d.estado === 'pendiente') ? ['dotes' as const] : []),
            ...(this.svc.getConjurosSesionActual().activa ? ['conjuros' as const] : []),
            ...(this.intercambio ? ['intercambio' as const] : []),
            ...(this.repartirRangosDelCompanero || this.svc.companeroTieneAlgoQueElegir() ? ['companero' as const] : []),
            'resumen',
        ];
        await this.siguiente();
    }

    /**
     * Si recicla el compañero animal: sus rangos se eligen de nuevo, como al crearlo (los puntos de sus DG adicionales, con el
     * nivel ya subido), en el paso «Habilidades del compañero», antes del resumen.
     */
    private get repartirRangosDelCompanero(): boolean {
        return this.plan?.tipo === 'mascota' && this.plan.hueco.mascota === 'companero';
    }

    // --- El reciclaje (Manual del jugador II, págs. 194-196) ------------------------------------------------------------

    /** Lo que ofrece cada tipo, con el personaje de antes de subir (el motor recién hidratado). */
    private async prepararReciclaje(): Promise<void> {
        this.tipoReciclaje = 'ninguno';
        this.planDote = null;
        this.rasgosReciclables = [];
        this.rasgoElegido = null;
        this.planRasgo = null;
        this.dominiosReciclables = [];
        this.dominioElegido = null;
        this.planDominio = null;
        this.escuelaReciclable = null;
        this.planEscuela = null;
        this.mascotasReciclables = [];
        this.planMascota = null;
        this.idiomaQuita = this.idiomaPone = null;
        this.rangosOrigen = this.rangosDestino = null;
        this.rangosCantidad = 1;
        this.destinosRangos = [];
        this.bloqueoRangos = '';
        this.dotesReciclables = [];
        this.idiomasReciclables = [];
        this.idiomasAprendibles = [];
        this.habilidadesReciclables = [];
        this.clasesConConocidos = [];
        this.cambiosConjuros = [{ idClase: null, olvida: null, aprende: null }];
        if (!this.permiteReciclar || !this.entrada)
            return;
        this.rasgosReciclables = rasgosParaReciclar(this.svc, await this.aptitudesConElegir());
        this.dominiosReciclables = dominiosParaReciclar(this.svc, this.entrada, this.nivelDeAntes, this.conHomebrew);
        this.escuelas = claseConEspecializacion(this.svc) ? await this.catalogoDeEscuelas() : [];
        this.escuelaReciclable = huecoDeEscuela(this.svc, this.escuelas);
        this.catalogosMascotas = await this.catalogosDeMascotas();
        this.mascotasReciclables = huecosDeMascota(this.svc, this.entrada, this.catalogosMascotas);
        this.dotesReciclables = dotesParaReciclar(this.svc, this.rasgosReciclables);
        const idiomas = idiomasParaReciclar(this.svc, this.entrada, this.conHomebrew);
        this.idiomasReciclables = idiomas.quitables;
        this.idiomasAprendibles = idiomas.aprendibles;
        this.habilidadesReciclables = habilidadesConRangos(this.svc, this.entrada);
        this.clasesConConocidos = conocidosParaReciclar(this.svc, this.entrada);
        this.cambiosConjuros = [this.cambioDeConjuroVacio()];
        this.opcionesReciclaje = this.opcionesDeReciclaje();
    }

    /** El detalle de las aptitudes con «Elegir» de sus clases (sus extras), o `null` si no se puede leer. */
    private async aptitudesConElegir(): Promise<Map<number, EspecialClaseDetalle | null>> {
        const ids = aptitudesConElegir(this.svc);
        const detalles = await Promise.all(ids.map((id) => this.motor.primero(this.especialSvc.getEspecial(id))));
        return new Map(ids.map((id, i) => [id, detalles[i]]));
    }

    /** El catálogo de escuelas de magia, o ninguna si no se puede leer. */
    private async catalogoDeEscuelas(): Promise<EscuelaConjuros[]> {
        try {
            return (await this.motor.primero(this.escuelaSvc.getEscuelas())) ?? [];
        } catch {
            return [];
        }
    }

    /**
     * Los catálogos de la creación del compañero y del familiar (de los monstruos), solo de las mascotas que tiene; `null` el
     * que no se puede leer (el hueco lo dice).
     */
    private async catalogosDeMascotas(): Promise<CatalogosDeMascotas> {
        const conCompanero = !!this.entrada?.companero;
        const conFamiliar = !!this.entrada?.familiar;
        if (!conCompanero && !conFamiliar)
            return { companeros: null, familiares: null };
        try {
            const monstruos = (await this.motor.primero(this.monstruoSvc.getMonstruos())) ?? [];
            return {
                companeros: conCompanero ? construirCatalogoCompanerosDesdeMonstruos(monstruos) : null,
                familiares: conFamiliar ? construirCatalogoFamiliaresDesdeMonstruos(monstruos) : null,
            };
        } catch {
            return { companeros: null, familiares: null };
        }
    }

    /** Su nivel de personaje antes de subir (el tope de los rangos). */
    private get nivelDeAntes(): number {
        return toInt(this.pj?.Nivel_personaje) || toInt(this.experiencia?.nivel);
    }

    private cambioDeConjuroVacio(): CambioDeConjuro {
        return { idClase: this.clasesConConocidos.length === 1 ? this.clasesConConocidos[0].id : null, olvida: null, aprende: null };
    }

    /** Si se ofrecen elementos homebrew al reciclar (`ofreceHomebrewALaFicha`). */
    private get conHomebrew(): boolean {
        return ofreceHomebrewALaFicha(this.pj?.Oficial, this.pj?.PoliticaCompra);
    }

    /** Los tipos del paso, con el motivo si no hay nada de ese tipo que mirar (al preparar el paso). */
    private opcionesDeReciclaje(): Array<{ tipo: TipoDeReciclaje; etiqueta: string; motivo: string; }> {
        return [
            { tipo: 'ninguno', etiqueta: 'No reciclar nada', motivo: '' },
            { tipo: 'dote', etiqueta: 'Reciclar una dote', motivo: this.dotesReciclables.length ? '' : 'No tiene dotes propias.' },
            { tipo: 'idioma', etiqueta: 'Reciclar un idioma', motivo: this.idiomasReciclables.length ? '' : 'No conoce ningún idioma.' },
            { tipo: 'rangos', etiqueta: 'Reciclar habilidades', motivo: this.habilidadesReciclables.length ? '' : 'No tiene rangos comprados.' },
            { tipo: 'conjuros', etiqueta: 'Reciclar conjuros', motivo: this.clasesConConocidos.length ? '' : 'Ninguna de sus clases tiene conocidos limitados (una tabla de conocidos).' },
            {
                tipo: 'rasgo', etiqueta: 'Reciclar un rasgo de clase',
                motivo: this.rasgosReciclables.length || this.dominiosReciclables.length || this.escuelaReciclable || this.mascotasReciclables.length
                    ? '' : 'Ninguna de sus clases le ha dado a elegir entre opciones de su tabla, dominios, una escuela ni una mascota.',
            },
        ];
    }

    elegirTipoReciclaje(tipo: TipoDeReciclaje): void {
        if (!this.empezada)
            this.tipoReciclaje = tipo;
    }

    /**
     * Otra dote en el hueco de la que se recicla, con el selector de dotes de la creación: sus candidatas se evalúan con el
     * personaje de antes de subir, sin la que se va y en el nivel en que se eligió (`huecoDeLaDoteReciclada`). El motor se
     * deja como estaba: el cambio se hace al continuar.
     */
    async elegirDoteReciclada(dote: DoteReciclable): Promise<void> {
        if (dote.motivo || this.empezada)
            return;
        const estado = this.svc.exportarEstadoSubida();
        try {
            const hueco = huecoDeLaDoteReciclada(this.svc, dote, this.conHomebrew);
            if (!hueco)
                return;
            const elegida = await this.otraDoteEnElHueco(hueco, `Reciclar ${dote.nombre}: otra dote en su lugar`,
                { id: dote.idDote, idExtra: dote.idExtra, nombre: dote.nombre }, 'Con el personaje de antes de subir, y sin la que se recicla, no la cumple. Elige otra.');
            if (elegida)
                this.planDote = { tipo: 'dote', quita: dote, seleccion: elegida.seleccion, pone: elegida.pone };
        } finally {
            this.svc.restaurarEstadoSubida(estado);
        }
    }

    /** Enseña las otras opciones del hueco (el de la tabla de su clase, en ese nivel). */
    elegirRasgo(hueco: HuecoDeRasgo): void {
        if (hueco.motivo || this.empezada)
            return;
        if (this.rasgoElegido !== hueco)
            this.planRasgo = null;
        this.soloElRasgo('tabla');
        this.rasgoElegido = hueco;
    }

    /** Al elegir un hueco de un tipo, los otros se olvidan: se recicla un solo rasgo. */
    private soloElRasgo(tipo: 'tabla' | 'dominio' | 'escuela' | 'mascota'): void {
        if (tipo !== 'tabla') {
            this.rasgoElegido = null;
            this.planRasgo = null;
        }
        if (tipo !== 'dominio') {
            this.dominioElegido = null;
            this.planDominio = null;
        }
        if (tipo !== 'escuela')
            this.planEscuela = null;
        if (tipo !== 'mascota')
            this.planMascota = null;
    }

    /** Enseña los dominios que puede poner en lugar de ese (los de su deidad que no tiene). */
    elegirDominio(hueco: HuecoDeDominio): void {
        if (hueco.motivo || this.empezada)
            return;
        if (this.dominioElegido !== hueco)
            this.planDominio = null;
        this.soloElRasgo('dominio');
        this.dominioElegido = hueco;
    }

    /** Otro dominio en lugar del elegido, con lo que cambia solo (su poder, sus dotes, sus habilidades y sus conjuros). */
    async elegirOpcionDominio(opcion: OpcionDeDominio): Promise<void> {
        const hueco = this.dominioElegido;
        if (!hueco || opcion.motivo || this.empezada)
            return;
        this.planDominio = planDelDominio(this.svc, hueco, opcion);
        if (!this.planDominio)
            await avisarPaso('No se puede elegir ese dominio', `No se ha podido cambiar ${hueco.tiene.nombre} por ${opcion.nombre}: falta en el catálogo de dominios.`);
    }

    /** Lo que cambia solo con el dominio o la escuela elegidos («Dotes del dominio: — → Soltura con un arma (maza)»). */
    get derivadosDelDominioOLaEscuela(): string {
        const plan = this.planDominio ?? this.planEscuela;
        return (plan?.derivados ?? []).map((d) => `${d.que.toLowerCase()}, ${d.antes} → ${d.ahora}`).join('; ');
    }

    /**
     * Otra especialización, con el selector de la creación (las escuelas que puede elegir; sin homebrew si la ficha no lo
     * admite): legal en el 1.er nivel y que no deje sin cumplir lo que tiene (una dote o una clase de prestigio que pide
     * lanzar conjuros de una escuela que pasa a estar prohibida). El motor se deja como estaba: el cambio se hace al continuar.
     */
    async cambiarEscuela(): Promise<void> {
        const hueco = this.escuelaReciclable;
        if (!hueco || hueco.motivo || this.empezada)
            return;
        const escuelas = this.escuelas.filter((e) => this.conHomebrew || e.Oficial !== false);
        const elegida = await this.abrirModal<SelectorEspecialidadMagicaConfirmacion>(SelectorEspecialidadMagicaModalComponent, {
            titulo: 'Reciclar la especialización', nombreClase: hueco.clase, mostrarArcano: true, mostrarPsionico: false, escuelas,
            escuelaFija: hueco.escuelaFija, disciplinas: [], cancelable: true,
        }, ['confirmar'], ['cancelar']);
        if (!elegida?.arcana)
            return;
        const { plan, motivo } = planDeLaEscuela(this.svc, hueco, elegida.arcana, escuelas);
        const bloqueo = plan ? motivoDeLaEscuela(this.svc, plan) : motivo;
        if (!plan || bloqueo) {
            await avisarPaso('No se puede elegir esa especialización', bloqueo ?? 'No es legal en el 1.er nivel.');
            return;
        }
        this.soloElRasgo('escuela');
        this.planEscuela = plan;
    }

    /**
     * Otra criatura para la mascota del hueco, con el selector de la creación: las de la lista de sus clases con una fila del
     * nivel de la elección o menos, cada una con su motivo si no vale (su dote, su ajuste o su ataque base, con el personaje
     * de antes de subir). Si lo que eligió después depende de la que se va, no la cambia (`motivoDeLaMascota`). El motor se
     * deja como estaba: el cambio se hace al continuar.
     */
    async cambiarMascota(hueco: HuecoDeMascota): Promise<void> {
        if (hueco.motivo || this.empezada)
            return;
        const elegida = hueco.mascota === 'companero' ? await this.otroCompanero(hueco) : await this.otroFamiliar(hueco);
        if (!elegida)
            return;
        const { plan, motivo } = planDeLaMascota(this.svc, hueco, elegida.criatura, elegida.nombre);
        const bloqueo = plan ? motivoDeLaMascota(this.svc, plan) : motivo;
        if (!plan || bloqueo) {
            await avisarPaso(`No se puede elegir ${elegida.criatura.Nombre}`, bloqueo ?? `No puede tenerlo como ${nombreDeLaMascota(hueco.mascota)}.`);
            return;
        }
        this.soloElRasgo('mascota');
        this.planMascota = plan;
    }

    /** Si tiene un compañero animal que reciclar: la nota de liberarlo y llamar a otro (MJ, pág. 35), que no es el reciclaje. */
    get tieneCompaneroReciclable(): boolean {
        return this.mascotasReciclables.some((m) => m.mascota === 'companero');
    }

    /** El homebrew del selector de una mascota al abrirlo, como al crear: con una ficha homebrew, sí. */
    private get homebrewDelSelector(): boolean {
        return this.pj?.Oficial === false;
    }

    /** El compañero que entra, del selector del compañero de la creación (con sus filtros); `null` si se cancela. */
    private async otroCompanero(hueco: HuecoDeMascota): Promise<{ criatura: CriaturaDeMascota; nombre: string; } | null> {
        const catalogo = this.catalogosMascotas.companeros ?? [];
        let homebrew = this.homebrewDelSelector;
        let nivel: number | null = null;
        const entradas = () => {
            const e = entradasDelCompaneroReciclado(this.svc, hueco, catalogo, { incluirHomebrew: this.conHomebrew && homebrew, nivelSeleccionado: nivel });
            nivel = e.nivelSeleccionado;
            return {
                companerosElegibles: e.elegibles, companerosBloqueados: e.bloqueados, nivelesRequeridos: e.nivelesRequeridos, ajustes: e.ajustes,
                nivelesDisponibles: e.nivelesDisponibles, nivelSeleccionado: e.nivelSeleccionado, incluirHomebrew: homebrew,
            };
        };
        const seleccion = await this.abrirModal<SelectorCompaneroConfirmacion>(SelectorCompaneroModalComponent, {
            titulo: `Reciclar el compañero animal ${hueco.nombrePropio || nombreDeLaCriatura(hueco.tiene)}`, cuposDisponibles: 0, nombreCompanero: '', ...entradas(),
        }, ['confirmar'], ['omitir'], {}, {
            incluirHomebrewChange: (valor: boolean) => { homebrew = !!valor; return entradas(); },
            nivelChange: (valor: number | null) => { nivel = valor; return entradas(); },
            nombreCompaneroChange: (valor: string) => ({ nombreCompanero: `${valor ?? ''}` }),
        });
        const criatura = seleccion ? catalogo.find((c) => claveCompanero(c) === claveCompanero(seleccion.companero)) : null;
        return criatura && seleccion ? { criatura, nombre: seleccion.nombre } : null;
    }

    /** El familiar que entra, del selector del familiar de la creación (con sus filtros); `null` si se cancela. */
    private async otroFamiliar(hueco: HuecoDeMascota): Promise<{ criatura: CriaturaDeMascota; nombre: string; } | null> {
        const catalogo = this.catalogosMascotas.familiares ?? [];
        let homebrew = this.homebrewDelSelector;
        let plantilla: number | null = null;
        const entradas = () => {
            const e = entradasDelFamiliarReciclado(this.svc, hueco, catalogo, { incluirHomebrew: this.conHomebrew && homebrew, plantillaSeleccionada: plantilla });
            return {
                familiaresElegibles: e.elegibles, familiaresBloqueados: e.bloqueados, nivelesRequeridos: e.nivelesRequeridos,
                plantillasDisponibles: e.plantillas, plantillaSeleccionada: plantilla, incluirHomebrew: homebrew,
            };
        };
        const seleccion = await this.abrirModal<SelectorFamiliarConfirmacion>(SelectorFamiliarModalComponent, {
            titulo: `Reciclar el familiar ${hueco.nombrePropio || nombreDeLaCriatura(hueco.tiene)}`, cuposDisponibles: 0, nombreFamiliar: '', ...entradas(),
        }, ['confirmar'], ['omitir'], {}, {
            incluirHomebrewChange: (valor: boolean) => { homebrew = !!valor; return entradas(); },
            plantillaChange: (valor: number | null) => { plantilla = valor === null || valor === undefined ? null : toInt(valor) || null; return entradas(); },
            nombreFamiliarChange: (valor: string) => ({ nombreFamiliar: `${valor ?? ''}` }),
        });
        const criatura = seleccion ? catalogo.find((c) => claveFamiliar(c) === claveFamiliar(seleccion.familiar)) : null;
        return criatura && seleccion ? { criatura, nombre: seleccion.nombre } : null;
    }

    /** El texto de una opción del hueco: la aptitud que da una dote, también la que se elija con ella. */
    textoDeOpcion(hueco: HuecoDeRasgo, opcion: OpcionDeRasgo): string {
        const elegida = this.planRasgo?.hueco === hueco && this.planRasgo.pone === opcion ? this.planRasgo.doteElegida?.dote : null;
        if (elegida)
            return nombreDeOpcion(opcion, elegida);
        if (!opcion.daDote)
            return nombreDeOpcion(opcion);
        return mismaFila(hueco.tiene, opcion)
            ? `${nombreDeOpcion(opcion)}: otra dote en lugar de ${nombreConExtra(hueco.doteQueTiene)}`
            : `${nombreDeOpcion(opcion)}: eliges la dote`;
    }

    /** Lo que cambia solo con la opción elegida («Disparo rápido en lugar de Combate con dos armas»). */
    get derivadosDelRasgo(): string {
        return (this.planRasgo?.cambios ?? []).filter((c) => c.derivado)
            .map((c) => c.nombrePone && c.nombreQuita ? `${c.nombrePone} en lugar de ${c.nombreQuita}` : c.nombrePone ? `gana ${c.nombrePone}` : `pierde ${c.nombreQuita}`)
            .join('; ');
    }

    /**
     * Otra opción en el hueco del rasgo. La que da a elegir una dote (la «Dote adicional» del mago) abre el selector de dotes
     * de la creación con las de su tipo, juzgadas con el personaje de antes de subir, sin lo que se va y en el nivel del hueco
     * (`huecoDeLaDoteDelRasgo`). El motor se deja como estaba: el cambio se hace al continuar.
     */
    async elegirOpcionRasgo(opcion: OpcionDeRasgo): Promise<void> {
        const hueco = this.rasgoElegido;
        if (!hueco || opcion.motivo || this.empezada)
            return;
        const cambios = cambiosDelRasgo(this.svc, hueco, opcion);
        if (!opcion.daDote) {
            this.planRasgo = { tipo: 'rasgo', hueco, pone: opcion, doteElegida: null, cambios };
            return;
        }
        this.planRasgo = null;
        const estado = this.svc.exportarEstadoSubida();
        try {
            const delHueco = huecoDeLaDoteDelRasgo(this.svc, hueco, opcion, cambios);
            const candidatos = candidatasEnLugarDe(delHueco?.candidatos ?? [], null, this.conHomebrew);
            if (!delHueco || !candidatos.some((c) => c.evaluacion?.estado === 'eligible' && c.repeticionValida && !c.restringidaPorTipo)) {
                await avisarPaso('No hay ninguna dote que elegir', `Con ${nombreDeOpcion(opcion)} no puede elegir ninguna dote: no cumple los prerrequisitos de ninguna en ese nivel.`);
                return;
            }
            const elegida = await this.otraDoteEnElHueco({ pendiente: delHueco.pendiente, candidatos }, `${hueco.clase}, nivel ${hueco.nivelClase}: ${nombreDeOpcion(opcion)}`,
                hueco.tiene.daDote ? hueco.doteQueTiene : null,
                'Con el personaje de antes de subir, en el nivel del hueco y sin lo que se recicla, no la cumple. Elige otra.');
            if (!elegida)
                return;
            const { seleccion, pone } = elegida;
            this.planRasgo = {
                tipo: 'rasgo', hueco, pone: opcion, cambios,
                doteElegida: { seleccion, dote: { id: pone.idDote, idExtra: pone.idExtra, nombre: pone.nombre, extra: pone.extra, origen: `${delHueco.pendiente.origenFijo ?? ''}` } },
            };
        } finally {
            this.svc.restaurarEstadoSubida(estado);
        }
    }

    /**
     * Otra dote en el hueco de una dote que se recicla (la dote reciclada o la que da la aptitud de un rasgo), con el selector
     * de dotes de la creación: no vale la misma que se va (`quitada`) ni una que el motor no deja poner (`noLaCumple`). La
     * deja puesta en el motor; quien llama lo deja como estaba. `null` si se cancela o no vale.
     */
    private async otraDoteEnElHueco(hueco: { pendiente: DotePendienteState; candidatos: DoteSelectorCandidato[]; }, titulo: string,
        quitada: { id: number; idExtra: number; nombre: string; } | null, noLaCumple: string)
        : Promise<{ seleccion: DoteSeleccionConfirmada; pone: ReturnType<typeof doteElegidaEnElHueco>; } | null> {
        const seleccion = await this.abrirModal<DoteSeleccionConfirmada>(SelectorDotesModalComponent, {
            titulo, pendiente: hueco.pendiente, candidatos: hueco.candidatos, pendientesRestantes: 1,
        }, ['confirmar'], ['omitir']);
        if (!seleccion)
            return null;
        if (quitada && toInt(seleccion.idDote) === quitada.id && mismoExtra(seleccion.idExtra, quitada.idExtra)) {
            await avisarPaso('La misma dote', `Para reciclar ${quitada.nombre} hay que elegir otra que no tenga.`);
            return null;
        }
        if (!this.svc.aplicarDotePendiente(hueco.pendiente.id, seleccion)) {
            await avisarPaso('No se puede elegir esa dote', noLaCumple);
            return null;
        }
        return { seleccion, pone: doteElegidaEnElHueco(this.svc, hueco.pendiente, seleccion) };
    }

    get habilidadOrigen(): HabilidadConRangos | null {
        return this.habilidadesReciclables.find((h) => h.idHabilidad === this.rangosOrigen) ?? null;
    }

    /** Cuántos rangos se pueden traspasar desde la de origen: de 1 a 4, sin pasar de los que tiene comprados. */
    get cantidadesRangos(): number[] {
        const maximo = Math.min(this.maximoRangos, this.habilidadOrigen?.rangos ?? 0);
        return Array.from({ length: Math.max(0, maximo) }, (_, i) => i + 1);
    }

    /** Con el origen y los rangos elegidos: los destinos (con su motivo si no valen) y si quitarlos rompe algo que tiene. */
    cambiarRangos(): void {
        const origen = this.habilidadOrigen;
        this.rangosCantidad = Math.min(Math.max(1, toInt(this.rangosCantidad)), Math.max(1, this.cantidadesRangos.length));
        if (!origen || !this.entrada) {
            this.destinosRangos = [];
            this.bloqueoRangos = '';
            this.rangosDestino = null;
            return;
        }
        const puedeSubir = this.clases.filter((c) => c.elegible).map((c) => c.clase);
        this.destinosRangos = destinosDeRangos(this.svc, this.entrada, origen, this.rangosCantidad, this.nivelDeAntes, puedeSubir);
        if (!this.destinosRangos.some((d) => d.idHabilidad === this.rangosDestino && !d.motivo))
            this.rangosDestino = null;
        const rotas = loQueDejariaDeCumplir(this.svc, { rangos: { idHabilidad: origen.idHabilidad, idExtra: origen.idExtra, rangos: this.rangosCantidad } });
        this.bloqueoRangos = rotas.length > 0 ? `Sin esos rangos dejaría de cumplir lo que tiene: ${rotas.join('; ')}.` : '';
    }

    /** La de destino elegida, si solo es de clase para alguna de las clases que puede subir (la subida tendrá que ser de ellas). */
    get clasesDelDestino(): string {
        const destino = this.destinosRangos.find((d) => d.idHabilidad === this.rangosDestino);
        return (destino?.clases ?? []).map((c) => c.nombre).join(' o ');
    }

    claseConConocidos(id: number | null): ClaseConConocidos | null {
        return this.clasesConConocidos.find((c) => c.id === toInt(id)) ?? null;
    }

    /** Los que puede aprender en lugar del que olvida en ese cambio: de su clase, del mismo nivel y que no conozca. */
    aprendiblesDe(cambio: CambioDeConjuro): Conjuro[] {
        const clase = this.claseConConocidos(cambio.idClase);
        const olvidado = clase?.conocidos.find((c) => c.idConjuro === toInt(cambio.olvida));
        if (!clase || !olvidado || !this.entrada)
            return [];
        const otros = this.cambiosConjuros.filter((c) => c !== cambio && toInt(c.idClase) === clase.id).map((c) => toInt(c.aprende));
        return conjurosParaAprender(this.svc, this.entrada, clase, olvidado.nivel, this.conHomebrew, otros);
    }

    /** Si el conocido ya lo olvida otro cambio. */
    olvidadoEnOtro(cambio: CambioDeConjuro, idConjuro: number): boolean {
        return this.cambiosConjuros.some((c) => c !== cambio && toInt(c.idClase) === toInt(cambio.idClase) && toInt(c.olvida) === toInt(idConjuro));
    }

    cambiarConjuro(cambio: CambioDeConjuro, campo: 'clase' | 'olvida'): void {
        if (campo === 'clase')
            cambio.olvida = null;
        cambio.aprende = null;
    }

    anadirCambioConjuro(): void {
        if (this.cambiosConjuros.length < this.maximoConjuros)
            this.cambiosConjuros = [...this.cambiosConjuros, this.cambioDeConjuroVacio()];
    }

    quitarCambioConjuro(cambio: CambioDeConjuro): void {
        this.cambiosConjuros = this.cambiosConjuros.length > 1 ? this.cambiosConjuros.filter((c) => c !== cambio) : [this.cambioDeConjuroVacio()];
    }

    /** El reciclaje elegido en el paso, completo; `null` si no recicla nada o falta algo. */
    private planElegido(): PlanReciclaje | null {
        if (this.tipoReciclaje === 'dote')
            return this.planDote;
        if (this.tipoReciclaje === 'rasgo')
            return this.planRasgo ?? this.planDominio ?? this.planEscuela ?? this.planMascota;
        if (this.tipoReciclaje === 'idioma') {
            const quita = this.idiomasReciclables.find((i) => i.idIdioma === toInt(this.idiomaQuita) && !i.motivo);
            const pone = this.idiomasAprendibles.find((i) => i.idIdioma === toInt(this.idiomaPone));
            return quita && pone ? { tipo: 'idioma', quita: { idIdioma: quita.idIdioma, nombre: quita.nombre }, pone: { ...pone } } : null;
        }
        if (this.tipoReciclaje === 'rangos') {
            const origen = this.habilidadOrigen;
            const destino = this.destinosRangos.find((d) => d.idHabilidad === toInt(this.rangosDestino) && !d.motivo);
            if (!origen || !destino || this.bloqueoRangos || !this.cantidadesRangos.includes(toInt(this.rangosCantidad)))
                return null;
            return {
                tipo: 'rangos', rangos: toInt(this.rangosCantidad),
                quita: { idHabilidad: origen.idHabilidad, idExtra: origen.idExtra, nombre: origen.nombre },
                pone: { idHabilidad: destino.idHabilidad, idExtra: destino.idExtra, nombre: destino.nombre },
            };
        }
        if (this.tipoReciclaje === 'conjuros') {
            const cambios: Extract<PlanReciclaje, { tipo: 'conjuros'; }>['cambios'] = [];
            for (const c of this.cambiosConjuros) {
                const clase = this.claseConConocidos(c.idClase);
                const olvida = clase?.conocidos.find((x) => x.idConjuro === toInt(c.olvida) && !x.motivo);
                const aprende = this.aprendiblesDe(c).find((x) => toInt(x.Id) === toInt(c.aprende));
                if (!clase || !olvida || !aprende || this.olvidadoEnOtro(c, olvida.idConjuro))
                    return null;
                cambios.push({ idClase: clase.id, clase: clase.nombre, olvida: { id: olvida.idConjuro, nombre: olvida.nombre }, aprende: { id: toInt(aprende.Id), nombre: `${aprende.Nombre}` } });
            }
            return cambios.length > 0 ? { tipo: 'conjuros', cambios } : null;
        }
        return null;
    }

    get puedeConfirmarReciclaje(): boolean {
        return this.tipoReciclaje === 'ninguno' || !!this.planElegido();
    }

    /** Lo reciclado, en una frase para el paso ya cerrado («Alerta → Esquiva»). */
    get filaReciclada(): CambioSubida | null {
        return this.plan ? filaDelReciclaje(this.plan) : null;
    }

    /**
     * Cierra «Reciclar»: hace el cambio en el motor (el nivel sigue con él), arma la ficha con el cambio y sigue con la
     * clase. Si los rangos van a una habilidad que solo es de clase para alguna de las que puede subir, la clase tiene que
     * ser una de ellas.
     */
    async confirmarReciclaje(): Promise<void> {
        if (this.empezada || !this.puedeConfirmarReciclaje)
            return;
        const plan = this.planElegido();
        if (plan) {
            if (!aplicarReciclajeAlMotor(this.svc, plan)) {
                await avisarPaso('No se puede reciclar', 'Lo elegido ya no vale con el personaje de ahora. Elige otra cosa.');
                await this.hidratar();
                return;
            }
            const destino = plan.tipo === 'rangos' ? this.destinosRangos.find((d) => d.idHabilidad === plan.pone.idHabilidad) ?? null : null;
            this.plan = plan;
            const despues = this.cuerpoDelMotor();
            this.entradaReciclada = fichaConElReciclaje(this.entrada!, reciclajeDelPlan(plan), {
                origenDote: plan.tipo === 'dote' ? plan.quita.origen : undefined,
                claseaDestino: !!destino && destino.clases === null,
                rasgo: esPlanDeRasgo(plan) ? plan : undefined,
                // Lo que daba lo antiguo y lo que da lo nuevo: la API guarda tal cual los modificadores que llegan.
                motor: this.antes ? { antes: this.antes, despues } : null,
            });
            this.clasesDelReciclaje = destino?.clases ? destino.clases.map((c) => c.id) : null;
            this.antes = despues;
        }
        await this.siguiente();
    }

    // --- Los pasos -----------------------------------------------------------------------------------------------------

    /** El siguiente paso de la lista; los que se resuelven con un selector se abren al llegar. */
    async siguiente(): Promise<void> {
        const i = this.pasos.indexOf(this.paso);
        const siguiente = this.pasos[i + 1] ?? 'resumen';
        // Los rangos del compañero (el nuevo, o los de sus DG adicionales nuevos), con sus puntos; sin ellos, sus mejoras y
        // sus dotes, si las tiene (en sus selectores), y el paso sobra.
        if (siguiente === 'companero' && !this.svc.iniciarDistribucionHabilidadesCompanero('clases')) {
            await resolverLoQueEligeElCompanero(this.svc, this.selectores);
            this.pasos = this.pasos.filter((p) => p !== 'companero');
            await this.siguiente();
            return;
        }
        this.irA(siguiente);
        if (siguiente === 'incremento')
            await this.resolverIncremento();
        else if (siguiente === 'dotes')
            await this.resolverDotes();
        else if (siguiente === 'resumen')
            this.prepararResumen();
        this.guardarBorrador();
    }

    private irA(paso: PasoSubida): void {
        this.paso = paso;
        if (paso === 'clase')
            this.recalcularClases();
    }

    /** Desde «Reciclar» tras un error del reciclaje: el nivel ya está hecho, así que vuelve al resumen. */
    volverAlResumen(): void {
        this.irA('resumen');
    }

    private async resolverIncremento(): Promise<void> {
        await resolverIncrementoPendiente(this.svc, this.selectores, `Incremento de característica del nivel ${this.nivelNuevo}`);
        // Con más Inteligencia, los puntos de este nivel también suben (MJ p. 59): el reparto se vuelve a abrir.
        if (this.svc.EstadoFlujo.habilidades.activa && this.claseElegida)
            this.svc.iniciarDistribucionHabilidadesPorClase(this.claseElegida);
        await this.siguiente();
    }

    private async resolverDotes(): Promise<void> {
        if (await resolverDotesPendientes(this.svc, this.selectores))
            await this.siguiente();
    }

    // PG
    tirar(): void {
        if (this.tiradas.length >= this.tiradasPermitidas || this.carasDg < 1)
            return;
        const tirada = 1 + Math.floor(Math.random() * this.carasDg);
        this.tiradas = [...this.tiradas, tirada];
        this.tiradaElegida = Math.max(this.tiradaElegida ?? 0, tirada);
        this.calcularPg();
        this.guardarBorrador();
    }

    elegirTirada(tirada: number): void {
        this.tiradaElegida = tirada;
        this.calcularPg();
        this.guardarBorrador();
    }

    private calcularPg(): void {
        this.pg = pgTrasCambioDeCon(this.entrada!, toInt(this.pj?.Nivel_personaje),
            toInt(this.svc.PersonajeCreacion.ModConstitucion), this.daDg ? this.tiradaElegida : null);
    }

    get puedeSeguirPg(): boolean {
        return !this.daDg || this.tiradaElegida !== null;
    }

    // Habilidades (la tabla es `app-reparto-rangos`), también las del compañero que se recicla
    async cerrarHabilidades(): Promise<void> {
        if (!this.svc.puedeCerrarDistribucionHabilidades())
            return;
        this.svc.cerrarDistribucionHabilidades();
        // Con los rangos del compañero ya puestos, sus mejoras y sus dotes.
        if (this.paso === 'companero')
            await resolverLoQueEligeElCompanero(this.svc, this.selectores);
        await this.siguiente();
    }

    // Conjuros (la lista es `app-conjuros-del-nivel`)
    cerrarConjuros(): void {
        if (!this.svc.puedeCerrarSesionConjuros())
            return;
        this.svc.cerrarSesionConjuros();
        this.intercambio = this.svc.getIntercambioConjurosDelNivel();
        if (this.intercambio && !this.pasos.includes('intercambio'))
            this.pasos.splice(this.pasos.indexOf('resumen'), 0, 'intercambio');
        void this.siguiente();
    }

    // Intercambio
    elegirOlvidado(idConjuro: number): void {
        const o = this.intercambio?.olvidables.find((x) => toInt(x.conjuro?.Id) === toInt(idConjuro));
        this.olvidado = o ? { idConjuro: toInt(o.conjuro.Id), idClase: this.intercambio!.clase.id, nivel: o.nivel } : null;
        this.idNuevoIntercambio = null;
    }

    get candidatosIntercambio(): Conjuro[] {
        return this.olvidado && this.intercambio ? this.intercambio.candidatos(this.olvidado.nivel) : [];
    }

    cerrarIntercambio(cambiar: boolean): void {
        if (cambiar) {
            if (!this.olvidado || !this.idNuevoIntercambio || !this.svc.aplicarIntercambioConjuro(this.olvidado.idConjuro, this.idNuevoIntercambio))
                return;
        } else
            this.olvidado = null;
        void this.siguiente();
    }

    // --- El resumen y el guardado --------------------------------------------------------------------------------------

    private prepararResumen(): void {
        this.calcularPg();
        this.cambios = cambiosDeLaSubida({
            antes: this.pj!,
            despues: this.svc.PersonajeCreacion,
            clase: this.claseElegida,
            nivelClase: this.nivelClase,
            nivelNuevo: this.nivelNuevo,
            pg: this.pg,
            tirada: this.daDg ? this.tiradaElegida : null,
            caras: this.carasDg,
            elecciones: this.svc.getEleccionesDelNivelEnCurso(),
            nombreConjuro: (id) => this.nombreConjuro(id),
            reciclado: this.plan
                ? {
                    filas: filasDelReciclaje(this.plan), idiomaNuevo: this.plan.tipo === 'idioma' ? this.plan.pone.nombre : undefined,
                    aptitudesNuevas: aptitudesDelReciclaje(this.plan), dominioNuevo: this.plan.tipo === 'dominio' ? this.plan.pone.nombre : undefined,
                }
                : null,
        });
        // Lo que le pasa a su mascota con el nivel nuevo: sus valores, o que vuelve a cumplir su fila (o que queda inactiva).
        const entrada = this.entradaDelNivel;
        if (entrada.companero || entrada.familiar) {
            const estado = this.svc.ponerMascotasAlDia();
            this.cambios = [...this.cambios, ...cambiosDeLasMascotas(entrada,
                () => this.fichaDeLaSubidaSinMarcas(this.svc.getEleccionesDelNivelEnCurso()), estado, this.svc.nombresDeLoQueEligeLaMascota())];
        }
    }

    private fichaParaGuardar(): PersonajeCreateRequestDto {
        const elecciones: PersonajeCreateNivelEleccionDto[] = this.svc.getEleccionesDelNivelEnCurso();
        // Las dotes que conservaba sin sus prerrequisitos (tras perder un nivel) y que con este nivel vuelve a cumplir
        // vuelven a valer (Manual del jugador, pág. 87).
        const yaCumple = dotesQueVuelvenACumplir(this.entradaDelNivel.colecciones?.dotes, this.svc.dotesSinSusPrerrequisitos());
        return marcarDotesSinPrerrequisitos(this.fichaDeLaSubidaSinMarcas(elecciones), [], yaCumple);
    }

    private fichaDeLaSubidaSinMarcas(elecciones: PersonajeCreateNivelEleccionDto[]): PersonajeCreateRequestDto {
        // Sus mascotas, juzgadas otra vez con el nivel nuevo (la API lo hace aunque el bloque no cambie: contrato, «La mascota
        // inactiva…»): la inactiva que vuelve a cumplir, activa; la que no cumple, inactiva. Al aplicar el nivel ya se activa.
        this.svc.ponerMascotasAlDia();
        const despues = this.cuerpoDelMotor();
        // El compañero que se recicla, con los rangos que se han repartido otra vez.
        const ficha = conLosRangosDelCompaneroNuevo(this.fichaDeLaSubidaDelMotor(elecciones, despues), this.plan?.tipo === 'mascota' ? this.plan : null, despues);
        return sinMascotaNueva(sinLoQueYaNoDaLaMascota(ficha, this.antes!, despues, this.svc.loQueDanLasMascotasAlAmo()), this.antes!);
    }

    private fichaDeLaSubidaDelMotor(elecciones: PersonajeCreateNivelEleccionDto[], despues: PersonajeCreateRequestDto): PersonajeCreateRequestDto {
        return fichaDeLaSubida({
            entrada: this.entradaDelNivel,
            antes: this.antes!,
            despues,
            idClase: toInt(this.claseElegida?.Id),
            nivel: { idClase: toInt(this.claseElegida?.Id), nivelClase: this.nivelClase, elecciones },
            puntosGolpe: this.pg?.total ?? toInt(this.entrada?.personaje.puntosGolpe),
            olvidados: elecciones.filter((e) => e.tipo === 'conjuro_olvidado')
                .map((e) => ({ idConjuro: toInt(e.idElemento), idClase: toInt(e.idExtra) })),
        });
    }

    async guardar(seguir: boolean): Promise<void> {
        if (this.guardando || !this.claseElegida || !this.sesion || !this.puedeSeguirPg)
            return;
        this.guardando = true;
        this.error = '';
        this.errorPaso = null;
        try {
            const respuesta = await this.sesionesSvc.subirNivel(this.idPersonaje, {
                idClase: toInt(this.claseElegida.Id),
                ...(this.daDg && this.tiradaElegida !== null ? { pg: { tirada: this.tiradaElegida, tiradas: [...this.tiradas] } } : {}),
                ficha: this.fichaParaGuardar(),
                version: this.sesion.version,
                ...(this.plan ? { reciclaje: reciclajeDelPlan(this.plan) } : {}),
            });
            if (!this.cuenta.sigue())
                return;
            this.borrarBorrador();
            this.puerta.subidaHecha(this.idPersonaje);
            if (seguir && respuesta.subida.nivelesPorSubir > 0) {
                this.reiniciarEstado();
                await this.cargar();
                return;
            }
            const nueva = this.mascotaQuePuedeObtener();
            this.alTerminar?.();
            if (nueva)
                await this.ofrecerObtenerLaMascota(nueva);
        } catch (error: any) {
            if (!this.cuenta.sigue())
                return;
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido guardar la subida.';
            this.errorPaso = campoDelErrorASubida(error?.code, error?.field, this.pasos);
            if (this.errorPaso !== 'resumen' && this.errorPaso !== 'clase')
                this.irA(this.errorPaso);
        } finally {
            this.guardando = false;
        }
    }

    /**
     * La mascota que le da ahora una clase con el hueco vacío (el explorador que llega a 4.º, el mago nuevo): la subida no la
     * trae (contrato, «La mascota fuera del reciclaje»: `400 subida_cambio_no_permitido`), se obtiene después con «Obtener».
     */
    private mascotaQuePuedeObtener(): TipoDeMascota | null {
        if (!this.antes?.companero && toInt(this.svc.getEstadoCuposCompanero().cuposDisponibles) > 0)
            return 'companero';
        if (!this.antes?.familiar && toInt(this.svc.getEstadoCuposFamiliar().cuposDisponibles) > 0)
            return 'familiar';
        return null;
    }

    private async ofrecerObtenerLaMascota(mascota: TipoDeMascota): Promise<void> {
        const r = await Swal.fire({
            icon: 'info', title: mascota === 'companero' ? 'Puede tener un compañero animal' : 'Puede tener un familiar',
            text: mascota === 'companero'
                ? 'Con este nivel le toca un compañero animal: se llama con una ceremonia de 24 horas de oración (Manual del jugador, pág. 35).'
                : 'Con este nivel puede tener un familiar: cuesta 24 horas y sus po (Manual del jugador, pág. 45).',
            showCancelButton: true, confirmButtonText: TEXTOS_MASCOTA[mascota].obtener,
            cancelButtonText: 'Ahora no', target: document.body, heightAuto: false, scrollbarPadding: false,
        });
        if (r.isConfirmed)
            this.puerta.solicitarMascota(this.idPersonaje, 'obtener', mascota);
    }

    async descartar(confirmar = true): Promise<void> {
        if (confirmar) {
            const r = await Swal.fire({
                icon: 'question', title: 'Empezar la subida de nuevo', text: 'Se pierde lo elegido en este nivel.',
                showCancelButton: true, confirmButtonText: 'Empezar de nuevo', cancelButtonText: 'Seguir',
                target: document.body, heightAuto: false, scrollbarPadding: false,
            });
            if (!r.isConfirmed)
                return;
        }
        this.borrarBorrador();
        this.reiniciarEstado();
        await this.hidratar();
        this.irA(this.pasos[0]);
    }

    cancelar(): void {
        this.alTerminar?.();
    }

    /** Si ya hay algo hecho que «Empezar de nuevo» deshace: la clase o lo reciclado. */
    get empezada(): boolean {
        return !!this.claseElegida || !!this.plan;
    }

    private reiniciarEstado(): void {
        this.claseElegida = null;
        this.nivelClase = 0;
        this.pasos = this.pasosIniciales();
        this.plan = null;
        this.entradaReciclada = null;
        this.clasesDelReciclaje = null;
        this.tiradas = [];
        this.tiradaElegida = null;
        this.pg = null;
        this.intercambio = null;
        this.olvidado = null;
        this.idNuevoIntercambio = null;
        this.cambios = [];
    }

    // --- El borrador (por cuenta y personaje) --------------------------------------------------------------------------

    private guardarBorrador(): void {
        if (!this.cuenta.sigue() || !this.empezada || !this.sesion || !this.antes)
            return;
        const borrador: BorradorSubida = {
            version: 1, uid: this.cuenta.uid, idPersonaje: this.idPersonaje, versionSesion: this.sesion.version, actualizado: Date.now(),
            paso: this.paso, idClase: toInt(this.claseElegida?.Id), motor: this.svc.exportarEstadoSubida(), antes: this.antes,
            tiradas: this.tiradas, tiradaElegida: this.tiradaElegida, olvidado: this.olvidado,
            reciclaje: this.plan && this.entradaReciclada ? { plan: this.plan, entrada: this.entradaReciclada, clases: this.clasesDelReciclaje } : null,
        };
        try {
            localStorage.setItem(claveBorradorSubida(this.cuenta.uid, this.idPersonaje), JSON.stringify({ ...borrador, pasos: this.pasos, nivelClase: this.nivelClase }));
        } catch { /* sin almacenamiento, la subida sigue sin borrador */ }
    }

    private borrarBorrador(): void {
        try {
            localStorage.removeItem(claveBorradorSubida(this.cuenta.uid, this.idPersonaje));
        } catch { /* sin almacenamiento */ }
    }

    /** Si hay un borrador de esta cuenta, este personaje y esta versión de la sesión, se ofrece seguir con él. */
    private async restaurarBorrador(): Promise<boolean> {
        let borrador: (BorradorSubida & { pasos?: PasoSubida[]; nivelClase?: number; }) | null = null;
        try {
            borrador = JSON.parse(localStorage.getItem(claveBorradorSubida(this.cuenta.uid, this.idPersonaje)) ?? 'null');
        } catch {
            borrador = null;
        }
        if (!borrador)
            return false;
        const vale = borrador.version === 1 && borrador.uid === this.cuenta.uid && toInt(borrador.idPersonaje) === toInt(this.idPersonaje)
            && borrador.versionSesion === this.sesion?.version && Date.now() - toInt(borrador.actualizado) < CADUCIDAD_BORRADOR_MS;
        if (!vale) {
            this.borrarBorrador();
            return false;
        }
        const r = await Swal.fire({
            icon: 'question', title: 'Tienes una subida a medias', text: 'Puedes seguir donde lo dejaste o empezarla de nuevo.',
            showCancelButton: true, confirmButtonText: 'Seguir', cancelButtonText: 'Empezar de nuevo',
            target: document.body, heightAuto: false, scrollbarPadding: false,
        });
        // Sin clase, el borrador de lo reciclado antes de elegirla.
        const clase = toInt(borrador.idClase) > 0 ? this.svc.claseDelCatalogo(borrador.idClase) : null;
        const reciclaje = borrador.reciclaje ?? null;
        if (!r.isConfirmed || (toInt(borrador.idClase) > 0 && !clase) || (!clase && !reciclaje)
            || !this.svc.restaurarEstadoSubida(borrador.motor)) {
            this.borrarBorrador();
            return false;
        }
        this.antes = borrador.antes;
        this.plan = reciclaje?.plan ?? null;
        this.entradaReciclada = reciclaje?.entrada ?? null;
        this.clasesDelReciclaje = reciclaje?.clases ?? null;
        this.claseElegida = clase;
        this.nivelClase = toInt(borrador.nivelClase);
        this.pasos = borrador.pasos ?? this.pasosIniciales();
        this.tiradas = borrador.tiradas ?? [];
        this.tiradaElegida = borrador.tiradaElegida ?? null;
        this.daDg = clase ? daDgEnNivel(clase, this.nivelClase) : true;
        // Con una plantilla que actualiza los DG (el vampiro), su dado: d12.
        this.carasDg = clase ? this.svc.carasDadoGolpeDeClase(clase) : 0;
        this.intercambio = clase ? this.svc.getIntercambioConjurosDelNivel() : null;
        this.olvidado = borrador.olvidado ? { ...borrador.olvidado, nivel: -1 } as any : null;
        this.calcularPg();
        this.irA(borrador.paso);
        if (borrador.paso === 'resumen')
            this.prepararResumen();
        return true;
    }

    // --- Los selectores de la creación ---------------------------------------------------------------------------------

    private abrirModal<T>(tipo: Type<unknown>, entradas: Record<string, unknown>, aceptar: string[], rechazar: string[],
        fijos: Record<string, unknown> = {}, cambios: Record<string, (valor: any) => Record<string, unknown>> = {}): Promise<T | null> {
        return this.selectores.abrir<T>(tipo, entradas, aceptar, rechazar, fijos, cambios);
    }

    private cerrarModal(): void {
        this.selectores.cerrar();
    }
}
