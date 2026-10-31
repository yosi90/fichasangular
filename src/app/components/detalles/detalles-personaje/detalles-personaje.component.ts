import { Component, DoCheck, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import {
    CasillaFicha,
    DatoFicha,
    DatoFranja,
    EtiquetaFicha,
    caracteristicaPerdida,
    casillasCaracteristicasPersonaje,
    datoFranjaVelocidad,
    dotesVisiblesPersonaje,
    esVisibleEnPersonaje,
    tieneCaracteristicasGeneradas,
    datosVisibles,
    modeloIncarnumFicha,
    ModeloIncarnumFicha,
    sortilegasVisibles,
    textoClasePersonaje,
    unirTipo,
} from 'src/app/components/detalles/ficha';
import { AptitudSortilega } from 'src/app/interfaces/aptitud-sortilega';
import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContextual, DoteLegacy } from 'src/app/interfaces/dote-contextual';
import { EnemigoPredilectoSeleccion } from 'src/app/interfaces/enemigo-predilecto-seleccion';
import { MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { CaracteristicaPerdidaKey, Personaje, PersonajeNivelLanzadorResumen } from 'src/app/interfaces/personaje';
import { PersonajeEquipoPiezaDto, PersonajeModificadorEquipoDto } from 'src/app/interfaces/personajes-api';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { RegionDetalle } from 'src/app/interfaces/region';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { ClaseService } from 'src/app/services/clase.service';
import { FichasDescargaBackgroundService } from 'src/app/services/fichas-descarga-background.service';
import { ListaPersonajesService } from 'src/app/services/listas/lista-personajes.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { RegionService } from 'src/app/services/region.service';
import { UserService } from 'src/app/services/user.service';
import { esNombreComodin } from 'src/app/services/utils/comodin';
import {
    detallesPiezaEquipo,
    formatoNumero,
    nombreConCantidad,
    textoConSigno,
    textoDestrezaMaxima,
    textoEquipadoPieza,
    textoModificadorEquipo,
    textoPeso,
    textoPrecio,
} from 'src/app/services/utils/equipo-texto';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { buildManiobrabilidadInfoSecciones, ManiobrabilidadLike, tieneManiobrabilidadVisible } from 'src/app/services/utils/maniobrabilidad-info';
import { calcularNivelesLanzadorPersonaje } from 'src/app/services/utils/nivel-lanzador-personaje';
import { normalizarTexto, toArray, toBoolean, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import {
    origenesDePartes,
    sumarPartes,
    textoBonosHabilidad,
    textoDesglose,
    TipoSalvacion,
    totalesPersonaje,
    totalHabilidad,
} from 'src/app/services/utils/personaje-totales';
import { clavePorCuenta, guardarPreferenciaLocal, leerPreferenciaLocal } from 'src/app/services/utils/preferencia-local';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import Swal from 'sweetalert2';
import { destinoEnTablist } from 'src/app/services/utils/teclado';
import { edadesDeLaRaza, etapaEdad, EtapaEdad, textoEnvejecimiento } from 'src/app/services/utils/edad-personaje';
import { esPnj, textoNivelPersonaje, textoVd } from 'src/app/services/utils/tipo-personaje';
import {
    aptitudesDeEdadPersonaje, AptitudesDeEdadFicha, etiquetasTipoPersonaje, lanzamientoRacialPersonaje, LanzamientoRacialFicha,
    razaConCategoriaPersonaje
} from '../ficha/personaje-edad';

/** Cómo se enseña la ficha: toda en una página o con pestañas internas (las dos propuestas aprobadas del lienzo). */
export type VistaFicha = 'pagina' | 'pestanas';
export type PestanaFicha = 'combate' | 'habilidades' | 'capacidades' | 'magia' | 'incarnum' | 'equipo' | 'historia';

/** La vista que se recuerda en este navegador, por cuenta (`clavePorCuenta`); sin cuenta, con este sufijo. */
export const PREFIJO_PREFERENCIA_VISTA = 'rol.ficha.vista';
const SUFIJO_SIN_CUENTA = 'sin-cuenta';
export const VISTA_POR_DEFECTO: VistaFicha = 'pestanas';

const NOMBRES_PESTANAS: Record<PestanaFicha, string> = {
    combate: 'Combate',
    habilidades: 'Habilidades',
    capacidades: 'Capacidades',
    magia: 'Magia',
    incarnum: 'Incarnum',
    equipo: 'Equipo',
    historia: 'Historia',
};

/** Una salvación como se enseña: el total y, por separado, la parte de clase, la de varios y la del equipo con sus orígenes. */
interface SalvacionVisible {
    nombre: string;
    total: number;
    desglose: string;
    clase: number;
    claseOrigenes: string;
    varios: number;
    variosOrigenes: string;
    equipo: number;
    equipoOrigenes: string;
}

const SALVACIONES: { tipo: TipoSalvacion; nombre: string; }[] = [
    { tipo: 'fortaleza', nombre: 'Fortaleza' },
    { tipo: 'reflejos', nombre: 'Reflejos' },
    { tipo: 'voluntad', nombre: 'Voluntad' },
];

interface VentajaVisible {
    nombre: string;
    origen?: string;
}

/** Una fila de una tabla de pares (`ficha-pares`): el nombre con su nota debajo y el valor a la derecha. */
interface FilaPares {
    nombre: string;
    valor: string;
    nota?: string;
    ayuda?: string;
}

/**
 * Una entrada de una lista: el texto, una nota pequeña detrás y un tooltip. `ref` es lo que se abre al pulsarla y
 * `clave`, su id (no se ve; cuenta al comparar dos cálculos).
 */
interface EntradaLista<T = unknown> {
    texto: string;
    nota?: string;
    ayuda?: string;
    clave?: string;
    ref?: T;
}

interface HabilidadFila {
    nombre: string;
    car: string;
    rangos: number;
    total: string;
    nota: string;
}

interface LanzadorFila {
    clase: string;
    texto: string;
    detalle: string;
}

/**
 * Todo lo que pinta la ficha, calculado una vez al recibir el personaje. Las dos vistas leen lo mismo; solo cambia la
 * colocación. Las referencias que se abren al pulsar van en `ref`, que no cuenta al comparar dos cálculos.
 */
interface ModeloFicha {
    tipoPagina: string;
    tipoPestanas: string;
    etiquetas: EtiquetaFicha[];
    creador: { nombre: string; enlace: boolean; } | null;
    datos: DatoFicha[];
    franja: DatoFranja[];
    caracteristicas: CasillaFicha[];
    casillasPagina: CasillaFicha[];
    salvaciones: FilaPares[];
    defensa: FilaPares[];
    presaIniciativa: FilaPares[];
    defensasEspeciales: FilaPares[];
    enemigos: FilaPares[];
    habilidades: HabilidadFila[];
    habilidadesConRangos: HabilidadFila[];
    verHabilidades: boolean;
    dotes: EntradaLista<DoteLegacy>[];
    aptitudes: EntradaLista<string>[];
    raciales: EntradaLista<RacialReferencia>[];
    rasgosTipo: EntradaLista<Rasgo>[];
    plantillas: EntradaLista<any>[];
    ventajas: EntradaLista<VentajaVisible>[];
    idiomas: EntradaLista[];
    magia: DatoFicha[];
    lanzadores: LanzadorFila[];
    /** Dragones jugables: el lanzamiento racial y las aptitudes con su cifra y su CD a su edad; `null` si no tiene. */
    lanzamientoRacial: LanzamientoRacialFicha | null;
    aptitudesEdad: AptitudesDeEdadFicha | null;
    conjuros: EntradaLista<Conjuro>[];
    sortilegas: EntradaLista<AptitudSortilega>[];
    /** Magic of Incarnum: lo que calcula la API (`incarnum`) y la formación de partida; `null` si no tiene nada. */
    incarnum: ModeloIncarnumFicha | null;
    piezas: EntradaLista[];
    equipo: DatoFicha[];
    carga: DatoFicha[];
    modificadoresEquipo: EntradaLista[];
    sinEquipo: boolean;
    familiares: EntradaLista<MonstruoDetalle>[];
    companeros: EntradaLista<MonstruoDetalle>[];
    personalidad: string;
    contexto: string;
    multimedia: boolean;
    pestanas: { id: PestanaFicha; nombre: string; }[];
}

/** Un desglose de varias líneas (los tooltips) en una sola, para la nota de una fila: «Destreza +2 · Varios +1». */
function enLinea(texto: string): string {
    return texto.replace(/\n/g, ' · ');
}

/** Al comparar dos cálculos (en la vista previa de la creación) no cuentan las referencias, solo lo que se ve. */
function sinReferencias(clave: string, valor: unknown): unknown {
    return clave === 'ref' ? undefined : valor;
}

let siguienteId = 0;

@Component({
    selector: 'app-detalles-personaje',
    templateUrl: './detalles-personaje.component.html',
    styleUrls: ['./detalles-personaje.component.sass'],
    standalone: false
})
export class DetallesPersonajeComponent implements OnInit, OnChanges, DoCheck, OnDestroy {
    private pjData!: Personaje;

    @Input()
    set pj(value: Personaje) {
        this.pjData = value;
        if (this.iniciado)
            this.calcular();
    }

    get pj(): Personaje {
        return this.pjData;
    }

    @Input() clasesCatalogo: Clase[] = [];
    @Input() mostrarBotonGenerarPdf = true;
    @Input() esPreviewNuevoPersonaje = false;
    @Input() caracteristicasConfirmadas = false;

    /** Lo que pinta la ficha (ver `ModeloFicha`). */
    m: ModeloFicha = this.modeloVacio();
    vista: VistaFicha = VISTA_POR_DEFECTO;
    pestana: PestanaFicha = 'combate';
    verTodasHabilidades = false;
    readonly idFicha = `ficha-personaje-${++siguienteId}`;

    nivelPersonaje = 0;
    readonly nivelDisclaimer = 'Nivel de personaje: suma de niveles de clase y ajustes de nivel (raza y plantillas). No incluye los DG raciales adicionales.';
    readonly nepDisclaimer = 'Nivel efectivo de personaje: suma del nivel de sus clases, los DG extra y los ajustes de nivel. Es el que fija el oro inicial o el nivel de encuentro.';
    readonly velDisclaimer = 'Medido en pies: 5 pies equivalen a una casilla.';
    caDisclaimer = '';
    iniciativa = '+0';
    iniciativaDesglose = '';
    presa = '+0';
    presaDesglose = '';
    presaDisponible = false;
    salvacionesVisibles: SalvacionVisible[] = [];
    actualizandoVisibilidad = false;
    actualizandoArchivado = false;
    mostrarInfoManiobrabilidad = false;
    etiquetaCreador = 'Desconocido';
    perfilPublicoDisponible = false;
    nivelesLanzador: PersonajeNivelLanzadorResumen[] = [];

    private iniciado = false;
    private firma = '';
    private cuentaPreferencia: string | null | undefined = undefined;
    private regionesSub?: Subscription;
    private clasesSub?: Subscription;
    private sesionSub?: Subscription;
    private catalogoRegiones: RegionDetalle[] = [];
    private clasesCatalogoInterno: Clase[] = [];

    constructor(
        private fichasDescargaBgSvc: FichasDescargaBackgroundService,
        private claseSvc: ClaseService,
        private pSvc: PersonajeService,
        private listaPersonajesSvc: ListaPersonajesService,
        private regionSvc: RegionService,
        private userSvc: UserService,
        private platformSessionSvc: PlatformSessionService,
        private hostElement: ElementRef<HTMLElement>,
    ) { }

    ngOnInit(): void {
        this.iniciado = true;
        this.leerVistaGuardada();
        // La cuenta puede confirmarse después de abrir la ficha: entonces se lee su preferencia.
        this.sesionSub = this.platformSessionSvc.estado$?.subscribe(() => this.leerVistaGuardada());
        this.cargarCatalogoRegiones();
        this.cargarCatalogoClasesSiNecesario();
        this.calcular();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.iniciado)
            return;
        if (changes['clasesCatalogo'])
            this.cargarCatalogoClasesSiNecesario();
        if (changes['clasesCatalogo'] || changes['esPreviewNuevoPersonaje'] || changes['caracteristicasConfirmadas'])
            this.calcular();
    }

    /**
     * La vista previa de la creación cambia el personaje sin sustituirlo: allí se recalcula en cada revisión y la ficha
     * solo se vuelve a pintar si cambia algo de lo que se ve. La ficha de la API no cambia por dentro.
     */
    ngDoCheck(): void {
        if (this.iniciado && this.esPreviewNuevoPersonaje)
            this.calcular();
    }

    ngOnDestroy(): void {
        this.regionesSub?.unsubscribe();
        this.clasesSub?.unsubscribe();
        this.sesionSub?.unsubscribe();
    }

    // Vista y pestañas

    cambiarVista(vista: VistaFicha): void {
        if (this.vista === vista)
            return;
        this.vista = vista;
        guardarPreferenciaLocal(this.claveVista(), vista);
    }

    get pestanaActiva(): PestanaFicha {
        return this.m.pestanas.some((p) => p.id === this.pestana) ? this.pestana : (this.m.pestanas[0]?.id ?? 'combate');
    }

    elegirPestana(pestana: PestanaFicha): void {
        this.pestana = pestana;
    }

    idPestana(pestana: PestanaFicha): string {
        return `${this.idFicha}-pestana-${pestana}`;
    }

    get idPanel(): string {
        return `${this.idFicha}-panel`;
    }

    /** Las flechas, Inicio y Fin mueven la pestaña elegida, como en un tablist del navegador. */
    moverPestana(evento: KeyboardEvent): void {
        const ids = this.m.pestanas.map((p) => p.id);
        const actual = ids.indexOf(this.pestanaActiva);
        const destino = destinoEnTablist(evento.key, actual, ids.length);
        if (destino === null)
            return;
        evento.preventDefault();
        this.pestana = ids[destino];
        Promise.resolve().then(() => this.hostElement.nativeElement.querySelector<HTMLElement>(`#${this.idPestana(this.pestana)}`)?.focus());
    }

    get habilidadesVistas(): HabilidadFila[] {
        return this.verTodasHabilidades ? this.m.habilidades : this.m.habilidadesConRangos;
    }

    /** Si `<app-ficha-datos>` pintaría alguno de los datos (`datosVisibles`), para no pintar una tarjeta vacía. */
    tieneDatos(datos: DatoFicha[]): boolean {
        return datosVisibles(datos).length > 0;
    }

    // Lo que abre cada lista al pulsar una entrada (su `ref`).
    readonly abrirDote = (dote: DoteLegacy) => this.verDetallesDote(dote);
    readonly abrirEspecial = (nombre: string) => this.verDetallesEspecialPorNombre(nombre);
    readonly abrirVentaja = (ventaja: VentajaVisible) => this.verDetallesVentajaPorNombre(ventaja);
    readonly abrirConjuro = (conjuro: Conjuro) => this.verDetallesConjuro(conjuro);
    readonly abrirSortilega = (sortilega: AptitudSortilega) => this.verDetallesSortilega(sortilega);
    readonly abrirMonstruo = (monstruo: MonstruoDetalle) => this.verDetallesMonstruo(monstruo);
    readonly abrirRacial = (racial: RacialReferencia) => this.verDetallesRacialPorNombre(racial);
    readonly abrirRasgo = (rasgo: Rasgo) => this.verDetallesRasgo(rasgo);
    readonly abrirPlantilla = (plantilla: unknown) => this.verDetallesPlantilla(plantilla);

    private claveVista(): string {
        return clavePorCuenta(PREFIJO_PREFERENCIA_VISTA, this.platformSessionSvc.cuenta?.id)
            ?? `${PREFIJO_PREFERENCIA_VISTA}.${SUFIJO_SIN_CUENTA}`;
    }

    private leerVistaGuardada(): void {
        const cuenta = this.platformSessionSvc.cuenta?.id ?? null;
        if (cuenta === this.cuentaPreferencia)
            return;
        this.cuentaPreferencia = cuenta;
        const guardada = leerPreferenciaLocal(this.claveVista());
        this.vista = guardada === 'pagina' || guardada === 'pestanas' ? guardada : VISTA_POR_DEFECTO;
    }

    // PDF, visibilidad y archivado

    generarFicha() {
        const pjFicha: Personaje = {
            ...this.pj,
            Jugador: this.resolverNombreJugadorFicha(),
            Niveles_lanzador: this.getNivelesLanzadorVisibles(),
        };
        this.fichasDescargaBgSvc.descargarFichas(pjFicha, {
            incluirConjuros: true,
            incluirFamiliares: false,
            incluirCompaneros: false,
        });
    }

    get mostrarControlVisibilidad(): boolean {
        return !this.esPreviewNuevoPersonaje
            && toNumber(this.pj?.Id) > 0
            && this.actorPuedeGestionarEstadoPersonaje();
    }

    get personajeVisiblePublicamente(): boolean {
        return toBoolean(this.pj?.visible_otros_usuarios);
    }

    get personajeArchivado(): boolean {
        return toBoolean(this.pj?.Archivado);
    }

    get actualizandoEstadoPersonaje(): boolean {
        return this.actualizandoVisibilidad || this.actualizandoArchivado;
    }

    get chipCreadorClickable(): boolean {
        // La ficha de comunidad necesita sesión; si la persona no la enseña, la pestaña lo dice.
        return this.perfilPublicoDisponible && this.userSvc.IsLoggedIn;
    }

    async actualizarVisibilidad(visible: boolean): Promise<void> {
        if (!this.mostrarControlVisibilidad || this.actualizandoEstadoPersonaje)
            return;
        if (!await this.haySesion('Inicia sesión para poder cambiar la visibilidad del personaje.'))
            return;

        this.actualizandoVisibilidad = true;
        try {
            await this.pSvc.actualizarVisibilidadPersonaje(this.pj.Id, visible);
            this.pj.visible_otros_usuarios = visible;
            this.listaPersonajesSvc.actualizarVisibilidadEnCache(this.pj.Id, visible);
            this.calcular();
        } catch (error: any) {
            await this.avisar('No se pudo actualizar la visibilidad', error);
        } finally {
            this.actualizandoVisibilidad = false;
        }
    }

    async actualizarArchivado(archivado: boolean): Promise<void> {
        if (!this.mostrarControlVisibilidad || this.actualizandoEstadoPersonaje)
            return;
        if (!await this.haySesion('Inicia sesión para poder cambiar el archivado del personaje.'))
            return;

        this.actualizandoArchivado = true;
        try {
            await this.pSvc.actualizarArchivadoPersonaje(this.pj.Id, archivado);
            this.pj.Archivado = archivado;
            this.listaPersonajesSvc.actualizarArchivadoEnCache(this.pj.Id, archivado);
            this.calcular();
        } catch (error: any) {
            await this.avisar('No se pudo actualizar el archivado', error);
        } finally {
            this.actualizandoArchivado = false;
        }
    }

    private async haySesion(texto: string): Promise<boolean> {
        if (`${this.userSvc.CurrentUserUid ?? ''}`.trim().length > 0)
            return true;
        await Swal.fire({
            icon: 'warning',
            title: 'No hay sesión activa',
            text: texto,
            showConfirmButton: true,
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
        return false;
    }

    private async avisar(titulo: string, error: any): Promise<void> {
        await Swal.fire({
            icon: 'warning',
            title: titulo,
            text: error?.message ?? 'Error no identificado',
            showConfirmButton: true,
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
    }

    // Catálogos

    private cargarCatalogoRegiones(): void {
        this.regionesSub?.unsubscribe();
        this.regionesSub = this.regionSvc.getRegiones().subscribe({
            next: (regiones) => {
                this.catalogoRegiones = regiones ?? [];
                this.calcular();
            },
            error: () => {
                this.catalogoRegiones = [];
            },
        });
    }

    private cargarCatalogoClasesSiNecesario(): void {
        if ((this.clasesCatalogo ?? []).length > 0 || this.clasesSub)
            return;

        this.clasesSub = this.claseSvc.getClases().subscribe({
            next: (clases) => {
                this.clasesCatalogoInterno = clases ?? [];
                this.calcular();
            },
            error: () => {
                this.clasesCatalogoInterno = [];
            },
        });
    }

    private getCatalogoClasesEfectivo(): Clase[] {
        return (this.clasesCatalogo ?? []).length > 0 ? this.clasesCatalogo : this.clasesCatalogoInterno;
    }

    private actualizarNivelesLanzadorDerivados(): void {
        const catalogo = this.getCatalogoClasesEfectivo();
        this.nivelesLanzador = catalogo.length > 0
            ? calcularNivelesLanzadorPersonaje(this.pj, catalogo)
            : (this.pj?.Niveles_lanzador ?? []);
        if (this.pj)
            this.pj.Niveles_lanzador = this.nivelesLanzador;
    }

    getNivelesLanzadorVisibles(): PersonajeNivelLanzadorResumen[] {
        return (this.nivelesLanzador ?? []).filter((nivel) => toNumber(nivel?.nivelLanzador) > 0);
    }

    // Creador

    private ownerUidNormalizado(): string {
        return `${this.pj?.ownerUid ?? ''}`.trim();
    }

    private actorPuedeGestionarEstadoPersonaje(): boolean {
        const actorUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        const ownerUid = this.ownerUidNormalizado();
        return actorUid.length > 0 && ownerUid.length > 0 && actorUid === ownerUid;
    }

    private resolverNombreJugadorFicha(): string {
        const jugadorActual = `${this.pj?.Jugador ?? ''}`.trim();
        if (jugadorActual.length > 0)
            return jugadorActual;

        const etiqueta = `${this.etiquetaCreador ?? ''}`.trim();
        if (etiqueta.length > 0 && etiqueta !== 'Desconocido' && etiqueta !== 'Tú')
            return etiqueta;

        const nombreSesion = `${this.userSvc?.Usuario?.nombre ?? ''}`.trim();
        if (nombreSesion.length > 0 && nombreSesion !== 'Invitado')
            return nombreSesion;

        return '';
    }

    private actualizarEtiquetaCreador(): void {
        const ownerUid = this.ownerUidNormalizado();
        const ownerDisplayName = `${this.pj?.ownerDisplayName ?? ''}`.trim();
        const uidActual = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        if (ownerUid.length > 0 && uidActual.length > 0 && ownerUid === uidActual) {
            this.etiquetaCreador = 'Tú';
            this.perfilPublicoDisponible = false;
            return;
        }
        this.etiquetaCreador = ownerDisplayName.length > 0 ? ownerDisplayName : 'Desconocido';
        this.perfilPublicoDisponible = ownerUid.length > 0;
    }

    // Reglas de lo que se ve

    /** En la ficha de un personaje, «Cualquiera» tampoco es una elección real y se oculta. */
    private esVisible(texto: string | null | undefined): boolean {
        return esVisibleEnPersonaje(texto);
    }

    private texto(texto: string | null | undefined): string {
        return this.esVisible(texto) ? `${texto}`.trim() : '';
    }

    private positivo(valor: unknown): boolean {
        const numero = Number(valor);
        return Number.isFinite(numero) && numero > 0;
    }

    /**
     * Las partes del NEP: los DG raciales (los de la raza y los que dan las plantillas), los niveles de clase y los
     * ajustes de nivel (raza y plantillas). El NEP lo da la API; esto solo explica de dónde sale.
     */
    private partesNep(): { dg: number; clase: number; ajuste: number; } {
        const plantillas = this.pj?.Plantillas ?? [];
        return {
            dg: toNumber(this.pj?.Raza?.Dgs_adicionales?.Cantidad) + plantillas.reduce((c, p) => c + toNumber(p?.Multiplicador_dgs_lic), 0),
            clase: (this.pj?.desgloseClases ?? []).reduce((c, d) => c + toNumber(d?.Nivel), 0),
            ajuste: toNumber(this.pj?.Raza?.Ajuste_nivel) + plantillas.reduce((c, p) => c + toNumber(p?.Ajuste_nivel), 0),
        };
    }

    private getNivelPersonaje(): number {
        const { clase, ajuste } = this.partesNep();
        return clase + ajuste;
    }

    /** «4 DG raciales + 8 de clase + 2 de ajuste»: de dónde sale el NEP. */
    private textoDesgloseNep(): string {
        const { dg, clase, ajuste } = this.partesNep();
        return [
            dg > 0 ? `${dg} DG raciales` : '',
            clase > 0 ? `${clase} de clase` : '',
            ajuste > 0 ? `${ajuste} de ajuste` : '',
        ].filter(Boolean).join(' + ');
    }

    private tieneExpVisible(): boolean {
        if (this.esPreviewNuevoPersonaje && this.tieneContextoNepParaPreview())
            return true;
        return this.positivo(this.pj?.Experiencia);
    }

    private tieneContextoNepParaPreview(): boolean {
        const { dg, clase, ajuste } = this.partesNep();
        return dg > 0 || clase > 0 || ajuste > 0;
    }

    /** En la vista previa, las características ya generadas: entonces se enseñan la iniciativa y la carga aunque valgan 0. */
    private tieneCaracteristicasParaPreview(): boolean {
        return this.esPreviewNuevoPersonaje && (this.caracteristicasConfirmadas || this.tieneCaracteristicasVisibles());
    }

    /** Sin generar (todas a 10 y sus modificadores a 0), las características no se enseñan. */
    private tieneCaracteristicasVisibles(): boolean {
        return tieneCaracteristicasGeneradas(this.pj);
    }

    tieneCaracteristicaPerdida(key: CaracteristicaPerdidaKey): boolean {
        return caracteristicaPerdida(this.pj, key);
    }

    tienePresaVisible(): boolean {
        return this.presaDisponible;
    }

    /** Si lleva puesta armadura o escudo: entonces se enseñan la Destreza máxima, el penalizador y el fallo arcano. */
    get llevaArmaduraPuesta(): boolean {
        return this.piezasEquipo.some((pieza) => pieza.equipado && !!pieza.armadura);
    }

    /** Las piezas del equipo que compró al final de la creación (vacío en las fichas sin compra y en la creación). */
    get piezasEquipo(): PersonajeEquipoPiezaDto[] {
        return this.pj?.Equipo ?? [];
    }

    private get modificadoresEquipo(): PersonajeModificadorEquipoDto[] {
        return this.pj?.ModificadoresEquipo ?? [];
    }

    private nombreRegionPrincipal(): string {
        const directo = this.texto(this.pj?.Region?.Nombre);
        if (directo)
            return directo;
        const idRegion = this.obtenerIdRegionPersonaje();
        if (idRegion <= 0)
            return '';
        const catalogo = this.catalogoRegiones.find((item) => toNumber(item?.Id) === idRegion);
        return `${catalogo?.Nombre ?? ''}`.trim() || `#${idRegion}`;
    }

    private obtenerIdRegionPersonaje(): number {
        const parsed = Math.trunc(Number(this.pj?.Id_region ?? this.pj?.Region?.Id));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    private textoAltura(): string | null {
        const altura = Number(this.pj?.Altura);
        if (!this.positivo(altura))
            return null;
        // Las fichas antiguas la guardan en centímetros.
        const metros = altura >= 10 ? altura / 100 : altura;
        return `${metros.toFixed(2).replace('.', ',')} m`;
    }

    mostrarManiobrabilidad(): boolean {
        return this.positivo(this.pj?.Volar) && tieneManiobrabilidadVisible(this.getManiobrabilidadPersonaje());
    }

    getManiobrabilidadPersonaje(): ManiobrabilidadLike | null {
        const directa = (this.pj as any)?.Maniobrabilidad;
        if (tieneManiobrabilidadVisible(directa))
            return directa;
        const raza = (this.pj as any)?.Raza?.Maniobrabilidad;
        if (tieneManiobrabilidadVisible(raza))
            return raza;
        const plantilla = (this.pj?.Plantillas ?? [])
            .map((item: any) => item?.Maniobrabilidad)
            .find((item: any) => tieneManiobrabilidadVisible(typeof item === 'string' ? { Nombre: item } : item));
        if (plantilla && typeof plantilla === 'string')
            return { Nombre: plantilla };
        return plantilla ?? null;
    }

    getManiobrabilidadNombre(): string {
        return `${this.getManiobrabilidadPersonaje()?.Nombre ?? ''}`.trim();
    }

    abrirInfoManiobrabilidad(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.mostrarInfoManiobrabilidad = true;
    }

    cerrarInfoManiobrabilidad(): void {
        this.mostrarInfoManiobrabilidad = false;
    }

    getManiobrabilidadInfoSecciones() {
        return buildManiobrabilidadInfoSecciones(this.getManiobrabilidadPersonaje());
    }

    /**
     * La etapa de la vida por la edad y las edades de la raza, con su envejecimiento (`services/utils/edad-personaje.ts`),
     * o `null` si no hay edad o la raza no trae sus edades.
     */
    /** La etapa de la vida (Manual del jugador); una raza por edades no la tiene: su edad es su categoría. */
    get madurezEdad(): EtapaEdad | null {
        if (this.pj?.CategoriaEdad)
            return null;
        return etapaEdad(this.pj?.Edad, this.pj?.Raza);
    }

    private getTooltipMadurezEdad(madurez: EtapaEdad): string {
        const edades = edadesDeLaRaza(this.pj?.Raza).map(({ nombre, valor }) => `${nombre}: ${valor}`).join(' | ');
        const envejecimiento = textoEnvejecimiento(madurez);
        return envejecimiento ? `${edades}
${envejecimiento}` : edades;
    }

    getSubtiposVisibles(): SubtipoRef[] {
        return (this.pj?.Subtipos ?? []).filter((s) => this.esVisible(s?.Nombre));
    }

    getPlantillasVisibles() {
        return (this.pj?.Plantillas ?? []).filter((p: any) => this.esVisible(p?.Nombre));
    }

    getSubchipsLanzadorClase(claseDesglose: Personaje['desgloseClases'][number]): string[] {
        const nombreClase = `${claseDesglose?.Nombre ?? ''}`.trim();
        if (!this.esVisible(nombreClase))
            return [];

        const claseCatalogo = this.obtenerClaseCatalogoPorNombre(nombreClase);
        if (!claseCatalogo?.Conjuros)
            return [];

        const conjuros = claseCatalogo.Conjuros;
        const esLanzador = !!conjuros.Arcanos || !!conjuros.Divinos || !!conjuros.Psionicos;
        if (!esLanzador)
            return [];

        const chips: string[] = [];
        if (conjuros.Arcanos)
            chips.push('Lanzador arcano');
        if (conjuros.Divinos)
            chips.push('Lanzador divino');
        if (conjuros.Psionicos)
            chips.push('Lanzador psiónico');
        const resumenLanzador = this.getNivelLanzadorResumenClase(nombreClase);
        // El nivel de lanzador lo da la API en la ficha (con el divisor del paladín y el explorador); si no, el calculado.
        const nivelLanzadorApi = claseDesglose?.Nivel_lanzador;
        if (typeof nivelLanzadorApi === 'number' && nivelLanzadorApi > 0)
            chips.push(`Nivel de lanzador ${nivelLanzadorApi}`);
        else if (resumenLanzador)
            chips.push(`Nivel de lanzador ${resumenLanzador.nivelLanzador}`);
        // Con la clase de su lanzamiento racial, el nivel de su raza se suma para los conjuros (*Draconomicón*, pág. 24).
        const nivelRacial = toNumber(claseDesglose?.Nivel_lanzamiento_racial);
        if (nivelRacial > 0)
            chips.push(`${nivelRacial} de su raza`);
        if (conjuros.Lanzamiento_espontaneo)
            chips.push('Lanzamiento espontáneo');
        if (conjuros.Dependientes_alineamiento)
            chips.push('Dependiente de alineamiento');
        const caracteristicaLanzamiento = `${claseDesglose?.Caracteristica_lanzamiento ?? ''}`.trim();
        if (caracteristicaLanzamiento.length > 0)
            chips.push(`Salvación (${caracteristicaLanzamiento})`);

        const nivelClase = Math.max(0, toNumber(claseDesglose?.Nivel));
        const nivelDetalleObjetivo = resumenLanzador?.nivelDesgloseLanzador ?? nivelClase;
        const detalleNivel = this.obtenerDetalleNivelClase(claseCatalogo, nivelDetalleObjetivo);
        const puntosPoder = claseDesglose?.Puntos_poder;
        if (puntosPoder)
            chips.push(puntosPoder.puedeManifestar ? `Puntos de poder ${puntosPoder.total}` : 'Sin poderes: característica de 9 o menos');
        const diarios = this.formatearConjurosDiarios(claseDesglose?.Conjuros_diarios);
        if (diarios.length > 0)
            chips.push(`Conjuros al día ${diarios}`);
        if (detalleNivel) {
            if (conjuros.Psionicos) {
                const reserva = toNumber(detalleNivel?.Reserva_psionica);
                if (reserva > 0 && !puntosPoder)
                    chips.push(`Reserva ${reserva}`);
                const poderMax = toNumber(detalleNivel?.Nivel_max_poder_accesible_nivel_lanzadorPsionico);
                if (poderMax >= 0)
                    chips.push(`Poder máximo ${poderMax}`);
            }

            if ((conjuros.Arcanos || conjuros.Divinos) && diarios.length < 1) {
                const nivelesDiarios = this.formatearNivelesDiariosAccesibles(detalleNivel?.Conjuros_diarios);
                if (nivelesDiarios.length > 0)
                    chips.push(`Niveles diarios ${nivelesDiarios}`);
            }

            if (conjuros.Conocidos_total) {
                const totalConocidos = toNumber(detalleNivel?.Conjuros_conocidos_total);
                if (totalConocidos > 0)
                    chips.push(`Conocidos ${totalConocidos}`);
            }

            if (conjuros.Conocidos_nivel_a_nivel) {
                const conocidosPorNivel = this.formatearConocidosPorNivel(detalleNivel?.Conjuros_conocidos_nivel_a_nivel);
                if (conocidosPorNivel.length > 0)
                    chips.push(`Conocidos por nivel ${conocidosPorNivel}`);
            }
        }

        return Array.from(new Set(chips));
    }

    /** La pestaña Incarnum: el bloque de la API y, del catálogo, desde qué nivel abre cada chakra cada clase. */
    private calcularIncarnum(clases: Personaje['desgloseClases']): ModeloIncarnumFicha | null {
        return modeloIncarnumFicha(this.pj?.Incarnum, clases.map((clase) => ({
            nombre: clase.Nombre.trim(),
            nivel: toNumber(clase.Nivel),
            moldeado: this.obtenerClaseCatalogoPorNombre(clase.Nombre)?.Moldeado ?? null,
        })));
    }

    private obtenerClaseCatalogoPorNombre(nombreClase: string): Clase | null {
        const nombreNormalizado = normalizarTexto(nombreClase);
        if (nombreNormalizado.length < 1)
            return null;
        return this.getCatalogoClasesEfectivo().find((clase) => normalizarTexto(clase?.Nombre ?? '') === nombreNormalizado) ?? null;
    }

    private getNivelLanzadorResumenClase(nombreClase: string): PersonajeNivelLanzadorResumen | null {
        const nombreNormalizado = normalizarTexto(nombreClase);
        if (nombreNormalizado.length < 1)
            return null;
        return (this.nivelesLanzador ?? []).find((resumen) => normalizarTexto(resumen?.nombreClase ?? '') === nombreNormalizado) ?? null;
    }

    private obtenerDetalleNivelClase(clase: Clase, nivelClase: number): any | null {
        const nivelObjetivo = Math.max(1, toInt(nivelClase));
        const desglose = Array.isArray(clase?.Desglose_niveles) ? clase.Desglose_niveles : [];
        return desglose.find((nivel) => toInt(nivel?.Nivel) === nivelObjetivo) ?? null;
    }

    /**
     * Los conjuros al día que da la API, por nivel («0: 4 · 1: 2+1»): el total y, si los hay, cuántos son adicionales
     * (por característica, del especialista o de dominio). Un nivel que la característica no deja lanzar no sale.
     */
    private formatearConjurosDiarios(niveles: Personaje['desgloseClases'][number]['Conjuros_diarios']): string {
        return (niveles ?? [])
            .filter((nivel) => nivel?.puedeLanzar && toNumber(nivel?.total) > 0)
            .map((nivel) => {
                const extra = toNumber(nivel.adicionales) + toNumber(nivel.especialista) + toNumber(nivel.dominio);
                return `${nivel.nivel}: ${extra > 0 ? `${toNumber(nivel.base)}+${extra}` : toNumber(nivel.total)}`;
            })
            .join(' · ');
    }

    private formatearNivelesDiariosAccesibles(mapa: Record<string, number> | null | undefined): string {
        if (!mapa)
            return '';
        return Object.keys(mapa)
            .map((key) => ({ nivel: this.parseNivelConjuroKey(key), valor: toNumber((mapa as Record<string, any>)[key]) }))
            .filter((item) => Number.isFinite(item.nivel) && item.nivel >= 0 && item.valor >= 0)
            .map((item) => item.nivel)
            .filter((nivel, indice, lista) => lista.indexOf(nivel) === indice)
            .sort((a, b) => a - b)
            .join(', ');
    }

    private formatearConocidosPorNivel(mapa: Record<string, number> | null | undefined): string {
        if (!mapa)
            return '';
        return Object.keys(mapa)
            .map((key) => ({ nivel: this.parseNivelConjuroKey(key), valor: toNumber((mapa as Record<string, any>)[key]) }))
            .filter((item) => Number.isFinite(item.nivel) && item.nivel >= 0 && item.valor > 0)
            .sort((a, b) => a.nivel - b.nivel)
            .map((item) => `${item.nivel}:${item.valor}`)
            .join(' ');
    }

    private parseNivelConjuroKey(key: string): number {
        const raw = `${key ?? ''}`.trim();
        if (raw.length < 1)
            return -1;
        const directo = Number(raw);
        if (Number.isFinite(directo))
            return Math.trunc(directo);
        const match = raw.match(/nivel[_\s-]*(\d+)/i);
        return match && match[1] ? Math.trunc(Number(match[1])) : -1;
    }

    private tienePersonalidadVisible(): boolean {
        const value = normalizarTexto(this.pj?.Personalidad ?? '');
        return this.esVisible(value) && value !== normalizarTexto('Rellena un fisco puto vago.');
    }

    private tieneContextoVisible(): boolean {
        const value = normalizarTexto(this.pj?.Contexto ?? '');
        return this.esVisible(value) && value !== normalizarTexto('Eres totalmente antirol hijo mio.');
    }

    getExtraVisibleEspecial(especial: Personaje['Claseas'][number]): string {
        // La ficha de la API marca el comodín; «Cualquiera» no es una elección y no se enseña. El borrador de la
        // creación aún trae el texto de relleno.
        if (especial?.Extra_comodin !== undefined)
            return especial.Extra_comodin === 'cualquiera' ? '' : `${especial?.Extra ?? ''}`.trim();
        return this.texto(especial?.Extra);
    }

    getExtraVisibleHabilidad(habilidad: Record<string, any> | null | undefined): string {
        const item = habilidad ?? {};
        // La ficha de la API ya da el extra visible («Elegir» si está por escoger) y `null` sin extra.
        if (item['Extra_comodin'] !== undefined)
            return `${item['Extra'] ?? ''}`.trim();
        const hasIdExtra = ['Id_extra', 'id_extra', 'i_ex', 'ie'].some((clave) => Object.prototype.hasOwnProperty.call(item, clave));

        return resolverExtraHabilidadVisible({
            extra: item['Extra'] ?? item['extra'] ?? '',
            idExtra: item['Id_extra'] ?? item['id_extra'] ?? item['i_ex'] ?? item['ie'],
            soportaExtra: item['Soporta_extra'] ?? item['soporta_extra'] ?? ((item['Extras'] ?? item['extras'] ?? []).length > 0),
            allowIdZeroAsChoose: hasIdExtra,
        });
    }

    private toPositiveNumberOrNull(...values: any[]): number | null {
        for (const value of values) {
            const parsed = Number(value);
            if (Number.isFinite(parsed) && parsed > 0)
                return parsed;
        }
        return null;
    }

    getRacialesVisibles(): RacialReferencia[] {
        const racialesDesdePersonaje = toArray((this.pj as any)?.Raciales);
        const racialesFuente = racialesDesdePersonaje.length > 0
            ? racialesDesdePersonaje
            : toArray((this.pj as any)?.Raza?.Raciales);

        return racialesFuente
            .map((racial: RacialDetalle | string | Record<string, any>) => {
                if (typeof racial === 'string')
                    return { id: null, nombre: racial.trim() };

                const raw = racial as Record<string, any>;
                const origen = `${raw?.['Origen'] ?? raw?.['origen'] ?? raw?.['o'] ?? ''}`.trim();
                return {
                    id: this.toPositiveNumberOrNull(raw?.['Id'], raw?.['id'], raw?.['i']),
                    nombre: `${raw?.['Nombre'] ?? raw?.['nombre'] ?? raw?.['n'] ?? ''}`.trim(),
                    origen: origen.length > 0 ? origen : undefined,
                };
            })
            .filter((racial) => this.esVisible(racial.nombre));
    }

    getDominiosVisibles(): string[] {
        return toArray((this.pj as any)?.Dominios)
            .map((dominio: string | Record<string, any>) => typeof dominio === 'string'
                ? dominio.trim()
                : `${dominio?.['Nombre'] ?? dominio?.['nombre'] ?? dominio?.['N'] ?? dominio?.['n'] ?? ''}`.trim())
            .filter((nombre) => this.esVisible(nombre));
    }

    getEnemigosPredilectosVisibles(): EnemigoPredilectoSeleccion[] {
        return toArray((this.pj as any)?.enemigosPredilectos)
            .map((item: Record<string, any>) => ({
                id: toNumber(item?.['id'] ?? item?.['Id']),
                nombre: `${item?.['nombre'] ?? item?.['Nombre'] ?? ''}`.trim(),
                bono: Math.max(0, toNumber(item?.['bono'] ?? item?.['Bono'])),
                veces: Math.max(0, toNumber(item?.['veces'] ?? item?.['Veces'])),
            }))
            .filter((item) => item.id > 0 && this.esVisible(item.nombre) && item.bono > 0)
            .sort((a, b) => compararTexto(a.nombre, b.nombre));
    }

    getEscuelasProhibidasVisibles(): string[] {
        const crudas = Array.isArray(this.pj?.Escuelas_prohibidas) ? this.pj.Escuelas_prohibidas : [];
        return crudas
            .map((item: string | { Nombre?: string; }) => typeof item === 'string' ? item.trim() : `${item?.Nombre ?? ''}`.trim())
            .filter((nombre) => this.esVisible(nombre));
    }

    tieneEscuelasProhibidasVisibles(): boolean {
        return this.getEscuelasProhibidasVisibles().length > 0;
    }

    /** La escuela especialista, si la hay: «Cualquiera» (`espaComodin` en la ficha) es que no se especializa. */
    private tieneEscuelaEspecialista(): boolean {
        const escuela = this.pj?.Escuela_especialista;
        return `${escuela?.Nombre ?? ''}`.trim().length > 0 && !esNombreComodin(escuela, 'cualquiera');
    }

    getVentajasVisibles(): VentajaVisible[] {
        return (this.pj?.Ventajas ?? [])
            .map((ventaja) => typeof ventaja === 'string'
                ? this.normalizarVentajaReferencia({ nombre: ventaja.trim() })
                : this.normalizarVentajaReferencia({ nombre: `${ventaja?.Nombre ?? ''}`.trim(), origen: `${ventaja?.Origen ?? ''}`.trim() || undefined }))
            .filter((v) => this.esVisible(v.nombre));
    }

    private getOrigenRasgoTipo(rasgo: Rasgo): string {
        return this.texto(rasgo?.Origen) || this.texto(this.pj?.Tipo_criatura?.Nombre);
    }

    /** «Ventaja: Voluntad de hierro» o el origen «ventaja» pasan a nombre y origen («Ventaja» o «Desventaja»). */
    private normalizarVentajaReferencia(ventaja: VentajaVisible): VentajaVisible {
        const origenRaw = `${ventaja?.origen ?? ''}`.trim();
        const nombreRaw = `${ventaja?.nombre ?? ''}`.trim();
        const origenVisible = this.esVisible(origenRaw) ? origenRaw : undefined;
        if (nombreRaw.length < 1)
            return { nombre: '', origen: origenVisible };

        const origenExplicito = normalizarTexto(origenRaw);
        if (origenExplicito === 'ventaja' || origenExplicito === 'desventaja')
            return { nombre: nombreRaw, origen: origenExplicito === 'ventaja' ? 'Ventaja' : 'Desventaja' };

        const prefijo = nombreRaw.match(/^\s*(ventaja|desventaja)\s*[:\-]\s*(.+)$/i);
        if (prefijo)
            return { nombre: `${prefijo[2] ?? ''}`.trim(), origen: normalizarTexto(prefijo[1]) === 'ventaja' ? 'Ventaja' : 'Desventaja' };

        return { nombre: nombreRaw, origen: origenVisible };
    }

    // El cálculo

    /**
     * Calcula todo lo que pinta la ficha. Si no cambia nada de lo que se ve (la vista previa recalcula en cada
     * revisión), conserva el cálculo anterior para no volver a pintar la ficha entera.
     */
    private calcular(): void {
        if (!this.pj)
            return;
        this.actualizarEtiquetaCreador();
        this.actualizarNivelesLanzadorDerivados();
        this.nivelPersonaje = this.getNivelPersonaje();
        this.actualizarTotales();
        const modelo = this.construirModelo();
        const firma = JSON.stringify(modelo, sinReferencias);
        if (firma === this.firma)
            return;
        this.firma = firma;
        this.m = modelo;
    }

    private actualizarTotales(): void {
        const totales = totalesPersonaje(this.pj);
        this.iniciativa = textoConSigno(toNumber(totales.iniciativa.total));
        this.iniciativaDesglose = textoDesglose(totales.iniciativa);
        this.presaDisponible = !!totales.presa;
        this.presa = textoConSigno(toNumber(totales.presa?.total));
        this.presaDesglose = textoDesglose(totales.presa);
        this.caDisclaimer = this.pj.Defensa
            ? textoDesglose(this.pj.Defensa.ca)
            : [
                ['Armadura natural', this.pj.Armadura_natural],
                ['Desvío', this.pj.Ca_desvio],
                ['Varios', this.pj.Ca_varios],
            ].filter(([, valor]) => toNumber(valor) !== 0).map(([nombre, valor]) => `${nombre} ${textoConSigno(toNumber(valor))}`).join('\n');
        this.salvacionesVisibles = SALVACIONES.map(({ tipo, nombre }) => {
            const salvacion = totales.salvaciones[tipo];
            return {
                nombre,
                total: toNumber(salvacion?.total),
                desglose: textoDesglose(salvacion),
                clase: sumarPartes(salvacion, 'clase'),
                claseOrigenes: origenesDePartes(salvacion, 'clase').join(', '),
                varios: sumarPartes(salvacion, 'varios'),
                variosOrigenes: origenesDePartes(salvacion, 'varios').join(', '),
                equipo: sumarPartes(salvacion, 'equipo'),
                equipoOrigenes: origenesDePartes(salvacion, 'equipo').join(', '),
            };
        });
    }

    private construirModelo(): ModeloFicha {
        const pj = this.pj;
        const preview = this.esPreviewNuevoPersonaje;
        const raza = this.texto(razaConCategoriaPersonaje(pj));
        const clases = (pj.desgloseClases ?? []).filter((c) => this.esVisible(c?.Nombre));
        const textoClases = clases.map((c) => textoClasePersonaje(c)).join(' / ');
        const alineamiento = this.texto(pj.Alineamiento);

        const modelo: ModeloFicha = {
            ...this.modeloVacio(),
            tipoPagina: unirTipo([esPnj(pj.tipo) ? 'Personaje no jugador' : 'Personaje', raza, textoClases]),
            tipoPestanas: unirTipo([raza, textoClases, textoNivelPersonaje({ tipo: pj.tipo, nep: pj.NEP, vd: pj.vd }), alineamiento]),
            etiquetas: this.calcularEtiquetas(),
            creador: preview ? null : {
                nombre: this.etiquetaCreador === 'Tú' ? 'ti' : this.etiquetaCreador,
                enlace: this.chipCreadorClickable,
            },
            datos: this.calcularDatos(clases),
            franja: this.calcularFranja(),
            caracteristicas: this.calcularCaracteristicas(),
            salvaciones: this.salvacionesVisibles.map((s) => ({ nombre: s.nombre, valor: textoConSigno(s.total), nota: enLinea(s.desglose) })),
            defensa: this.calcularDefensa(),
            presaIniciativa: this.calcularPresaIniciativa(),
            defensasEspeciales: [
                ...(pj.Rds ?? []).map((r) => ({ nombre: 'Reducción de daño', valor: `${r?.Modificador ?? ''}`.trim(), nota: this.texto(r?.Origen) })),
                ...(pj.Rcs ?? []).map((r) => ({ nombre: 'Resistencia a conjuros', valor: `${r?.Modificador ?? ''}`.trim(), nota: this.texto(r?.Origen) })),
                ...(pj.Res ?? []).map((r) => ({ nombre: 'Resistencia a la energía', valor: `${r?.Modificador ?? ''}`.trim(), nota: this.texto(r?.Origen) })),
            ].filter((fila) => fila.valor.length > 0),
            enemigos: this.getEnemigosPredilectosVisibles().map((e) => ({
                nombre: e.nombre,
                valor: textoConSigno(e.bono),
                nota: e.veces > 1 ? `${e.veces} veces` : '',
            })),
            dotes: dotesVisiblesPersonaje(pj).map((d) => ({ texto: d.texto, nota: this.texto(d.ref.Origen), ref: d.ref })),
            aptitudes: (pj.Claseas ?? []).filter((c) => this.esVisible(c?.Nombre)).map((c) => {
                const extra = this.getExtraVisibleEspecial(c);
                return { texto: c.Nombre.trim() + (extra ? ` (${extra})` : ''), ref: c.Nombre.trim() };
            }),
            raciales: this.getRacialesVisibles().map((r) => ({ texto: r.nombre, nota: this.texto(r.origen), clave: `${r.id ?? ''}`, ref: r })),
            rasgosTipo: (pj.Tipo_criatura?.Rasgos ?? []).filter((r) => this.esVisible(r?.Nombre)).map((r) => ({
                texto: r.Nombre.trim(),
                nota: this.getOrigenRasgoTipo(r),
                clave: `${r.Id ?? ''}`,
                ref: r,
            })),
            plantillas: this.getPlantillasVisibles().map((p: any) => ({ texto: `${p.Nombre}`.trim(), nota: this.detallePlantilla(p), clave: `${p.Id ?? ''}`, ref: p })),
            ventajas: this.getVentajasVisibles().map((v) => ({ texto: v.nombre, nota: v.origen ?? '', ref: v })),
            idiomas: (pj.Idiomas ?? []).filter((i) => this.esVisible(i?.Nombre)).map((i) => ({
                texto: i.Nombre.trim(),
                nota: this.texto(i.Origen),
                ayuda: this.texto(i.Descripcion),
            })),
            magia: this.calcularMagia(),
            lanzamientoRacial: lanzamientoRacialPersonaje(pj),
            aptitudesEdad: aptitudesDeEdadPersonaje(pj),
            lanzadores: clases
                .map((c) => ({ clase: c.Nombre.trim(), texto: textoClasePersonaje(c), detalle: this.getSubchipsLanzadorClase(c).join(' · ') }))
                .filter((l) => l.detalle.length > 0),
            conjuros: (pj.Conjuros ?? []).filter((c) => this.esVisible(c?.Nombre)).map((c) => ({ texto: c.Nombre.trim(), clave: `${c.Id ?? ''}`, ref: c })),
            sortilegas: this.calcularSortilegas(),
            incarnum: this.calcularIncarnum(clases),
            ...this.calcularEquipo(),
            familiares: this.monstruosVisibles((pj as any).Familiares),
            companeros: this.monstruosVisibles((pj as any).Companeros),
            personalidad: this.tienePersonalidadVisible() ? `${pj.Personalidad}`.trim() : '',
            contexto: this.tieneContextoVisible() ? `${pj.Contexto}`.trim() : '',
            multimedia: !preview,
        };
        modelo.casillasPagina = [...modelo.caracteristicas, ...this.calcularCasillasSalvaciones()];
        Object.assign(modelo, this.calcularHabilidades());
        modelo.pestanas = this.calcularPestanas(modelo);
        return modelo;
    }

    private modeloVacio(): ModeloFicha {
        return {
            tipoPagina: '', tipoPestanas: '', etiquetas: [], creador: null, datos: [], franja: [], caracteristicas: [], casillasPagina: [],
            salvaciones: [], defensa: [], presaIniciativa: [], defensasEspeciales: [], enemigos: [], habilidades: [],
            habilidadesConRangos: [], verHabilidades: false, dotes: [], aptitudes: [], raciales: [], rasgosTipo: [], plantillas: [],
            ventajas: [], idiomas: [], magia: [], lanzadores: [], lanzamientoRacial: null, aptitudesEdad: null, conjuros: [], sortilegas: [],
            incarnum: null, piezas: [], equipo: [], carga: [],
            modificadoresEquipo: [], sinEquipo: false, familiares: [], companeros: [], personalidad: '', contexto: '',
            multimedia: false, pestanas: [],
        };
    }

    private calcularEtiquetas(): EtiquetaFicha[] {
        // PJ o PNJ se ve en todas partes (decisión del propietario del 2026-10-31): el PNJ, con su VD.
        const tipo = etiquetasTipoPersonaje(this.pj);
        if (this.esPreviewNuevoPersonaje || toNumber(this.pj?.Id) <= 0)
            return tipo;
        return [
            ...tipo,
            this.personajeVisiblePublicamente
                ? { texto: 'Público', ayuda: 'Lo puede ver cualquiera' }
                : { texto: 'Privado', ayuda: 'Solo lo ven quien lo creó y su campaña' },
            ...(this.personajeArchivado ? [{ texto: 'Archivado' }] : []),
        ];
    }

    private calcularDatos(clases: Personaje['desgloseClases']): DatoFicha[] {
        const pj = this.pj;
        const preview = this.esPreviewNuevoPersonaje;
        const idRaza = toNumber(pj.Raza?.Id);
        const subtipos = this.getSubtiposVisibles();
        const dgsRaza = pj.Raza?.Dgs_adicionales;
        const madurez = this.madurezEdad;
        const deidad = this.texto(pj.Deidad);
        return [
            {
                etiqueta: 'Raza',
                valor: this.texto(pj.Raza?.Nombre) || null,
                detalle: this.texto(pj.Raza?.Tamano?.Nombre) ? `· ${pj.Raza.Tamano.Nombre.trim()}` : null,
                alPulsar: idRaza > 0 ? () => this.verDetallesRaza(this.pj.Raza.Id) : undefined,
            },
            this.datoTamano(),
            {
                etiqueta: 'Tipo de criatura',
                valor: this.texto(pj.Tipo_criatura?.Nombre) || null,
                alPulsar: () => this.verDetallesTipoCriatura(this.pj.Tipo_criatura),
            },
            {
                etiqueta: 'Subtipos',
                valor: subtipos.map((s) => s.Nombre.trim()).join(', ') || null,
                enlaces: subtipos.map((s) => ({ texto: s.Nombre.trim(), alPulsar: () => this.verDetallesSubtipo(s) })),
            },
            { etiqueta: 'Raza base', valor: this.texto(pj.RazaBase?.Nombre) || null },
            {
                etiqueta: clases.length > 1 ? 'Clases' : 'Clase',
                valor: clases.map((c) => textoClasePersonaje(c)).join(', ') || null,
                enlaces: clases.map((c) => ({ texto: textoClasePersonaje(c), alPulsar: () => this.verDetallesClase(c.Nombre) })),
            },
            { etiqueta: 'Nivel', valor: this.positivo(this.nivelPersonaje) ? this.nivelPersonaje : null, ayuda: this.nivelDisclaimer },
            {
                etiqueta: 'Valor de desafío (VD)',
                valor: esPnj(pj.tipo) && typeof pj.vd === 'number' ? textoVd(pj.vd) : null,
                ayuda: 'Orientativo: el de su raza a su edad, más sus niveles de clase (Manual de monstruos, pág. 294).',
            },
            {
                etiqueta: 'Nivel efectivo (NEP)',
                valor: !esPnj(pj.tipo) && this.positivo(pj.NEP) ? toNumber(pj.NEP) : null,
                detalle: this.textoDesgloseNep() ? `· ${this.textoDesgloseNep()}` : null,
                ayuda: this.nepDisclaimer,
            },
            { etiqueta: 'Experiencia', valor: this.tieneExpVisible() ? `${formatoNumero(toNumber(pj.Experiencia))} PX` : null },
            {
                etiqueta: 'DG raciales',
                valor: this.positivo(dgsRaza?.Cantidad)
                    ? `+${dgsRaza.Cantidad}${`${dgsRaza.Dado ?? ''}`.trim().toLowerCase()}${this.texto(dgsRaza.Tipo_criatura) ? ` de ${dgsRaza.Tipo_criatura.trim()}` : ''}`
                    : null,
            },
            { etiqueta: 'Ajuste de nivel', valor: this.positivo(pj.Raza?.Ajuste_nivel) ? `+${toNumber(pj.Raza.Ajuste_nivel)}` : null },
            { etiqueta: 'Alineamiento', valor: this.texto(pj.Alineamiento) || null },
            { etiqueta: 'Deidad', valor: deidad || null, alPulsar: deidad ? () => this.verDetallesDeidadPorNombre(this.pj.Deidad) : undefined },
            { etiqueta: 'Región', valor: this.obtenerIdRegionPersonaje() > 0 ? this.nombreRegionPrincipal() : null },
            { etiqueta: 'Género', valor: this.texto(pj.Genero) || null },
            { etiqueta: 'Edad', valor: this.positivo(pj.Edad) ? `${toNumber(pj.Edad)} años` : null },
            { etiqueta: 'Categoría de edad', valor: this.texto(pj.CategoriaEdad?.categoria?.Nombre) || null },
            {
                etiqueta: 'Madurez',
                valor: madurez?.nombre ?? null,
                detalle: textoEnvejecimiento(madurez) ? `· ${textoEnvejecimiento(madurez)}` : null,
                ayuda: madurez ? this.getTooltipMadurezEdad(madurez) : null,
            },
            { etiqueta: 'Altura', valor: this.textoAltura() },
            { etiqueta: 'Peso', valor: this.positivo(pj.Peso) ? `${formatoNumero(toNumber(pj.Peso))} kg` : null },
            { etiqueta: 'Campaña', valor: preview ? null : this.texto(pj.Campana) || null },
            { etiqueta: 'Trama', valor: preview ? null : this.texto(pj.Trama) || null },
            { etiqueta: 'Subtrama', valor: preview ? null : this.texto(pj.Subtrama) || null },
        ];
    }

    /**
     * El tamaño que cuenta (`tamano` de la ficha): el de la raza movido por las aptitudes que lo cambian, con su espacio y
     * su alcance. Si no es el de la raza, la ayuda dice por qué («Mediano por su raza; Tamaño imponente +1»).
     */
    private datoTamano(): DatoFicha {
        const tamano = this.pj?.Tamano_efectivo;
        const pies = (valor: number | null | undefined) => valor === null || valor === undefined ? null : `${formatoNumero(Number(valor))}'`;
        const medidas = [
            pies(tamano?.espacio) ? `espacio ${pies(tamano?.espacio)}` : null,
            pies(tamano?.alcance) ? `alcance ${pies(tamano?.alcance)}` : null,
        ].filter((parte): parte is string => !!parte);
        const cambia = !!tamano && tamano.pasos !== 0;
        return {
            etiqueta: 'Tamaño',
            valor: this.texto(tamano?.nombre) || null,
            detalle: medidas.length > 0 ? `· ${medidas.join(' · ')}` : null,
            ayuda: cambia
                ? [`${this.texto(tamano?.base?.Nombre)} por su raza`, ...(tamano?.origenes ?? []).map((origen) => `${origen.origen} ${textoConSigno(origen.pasos)}`)].join('; ')
                : null,
        };
    }

    private calcularFranja(): DatoFranja[] {
        const pj = this.pj;
        const defensa = pj.Defensa;
        return [
            { etiqueta: 'Puntos de golpe', etiquetaCorta: 'PG', valor: this.positivo(pj.Vida) ? toNumber(pj.Vida) : null },
            {
                etiqueta: 'Clase de armadura',
                etiquetaCorta: 'CA',
                valor: this.positivo(pj.Ca) ? toNumber(pj.Ca) : null,
                detalle: defensa ? `toque ${defensa.toque.total} · desprev. ${defensa.desprevenido.total}` : null,
                ayuda: this.caDisclaimer,
            },
            { etiqueta: 'Iniciativa', valor: this.iniciativaVisible() ? this.iniciativa : null, ayuda: this.iniciativaDesglose },
            { etiqueta: 'Ataque base', valor: this.texto(pj.Ataque_base) || null },
            { etiqueta: 'Presa', valor: this.presaDisponible ? this.presa : null, ayuda: this.presaDesglose },
            {
                ...datoFranjaVelocidad(pj, this.mostrarManiobrabilidad()
                    ? { maniobrabilidad: this.getManiobrabilidadNombre(), abrirReglas: (evento: Event) => this.abrirInfoManiobrabilidad(evento) }
                    : null),
                ayuda: this.velDisclaimer,
            },
        ];
    }

    /** La iniciativa se enseña siempre en la ficha; en la vista previa, con las características ya generadas o si no es +0. */
    private iniciativaVisible(): boolean {
        return !this.esPreviewNuevoPersonaje || this.tieneCaracteristicasParaPreview() || this.iniciativa !== '+0';
    }

    private calcularCaracteristicas(): CasillaFicha[] {
        return casillasCaracteristicasPersonaje(this.pj);
    }

    private calcularCasillasSalvaciones(): CasillaFicha[] {
        return this.salvacionesVisibles.map((s) => {
            const detalle = [
                `clase ${textoConSigno(s.clase)}`,
                s.varios !== 0 ? `varios ${textoConSigno(s.varios)}` : '',
                s.equipo !== 0 ? `equipo ${textoConSigno(s.equipo)}` : '',
            ].filter(Boolean).join(' · ');
            return {
                abreviatura: s.nombre.toUpperCase(),
                nombre: s.nombre,
                valor: textoConSigno(s.total),
                detalle,
                ayuda: s.desglose,
                texto: `${s.nombre} ${textoConSigno(s.total)}`,
                secundaria: true,
            };
        });
    }

    private calcularDefensa(): FilaPares[] {
        const pj = this.pj;
        const defensa = pj.Defensa;
        const filas: FilaPares[] = [];
        if (this.positivo(pj.Ca))
            filas.push({ nombre: 'Clase de armadura', valor: `${toNumber(pj.Ca)}`, nota: enLinea(this.caDisclaimer) });
        if (!defensa)
            return filas;
        filas.push(
            { nombre: 'Toque', valor: `${defensa.toque.total}`, nota: textoDesglose(defensa.toque, ' · ') },
            { nombre: 'Desprevenido', valor: `${defensa.desprevenido.total}`, nota: textoDesglose(defensa.desprevenido, ' · ') },
        );
        if (this.llevaArmaduraPuesta) {
            filas.push({ nombre: 'Destreza máxima', valor: textoDestrezaMaxima(defensa.destrezaMaxima), nota: 'La menor de la armadura y el escudo que lleva puestos' });
            if (toNumber(defensa.penalizadorArmadura) !== 0)
                filas.push({ nombre: 'Penalizador de armadura', valor: `${defensa.penalizadorArmadura}` });
            if (toNumber(defensa.falloConjuroArcano) !== 0)
                filas.push({ nombre: 'Fallo de conjuro arcano', valor: `${defensa.falloConjuroArcano}%` });
        }
        return filas;
    }

    private calcularPresaIniciativa(): FilaPares[] {
        const filas: FilaPares[] = [];
        if (this.iniciativaVisible())
            filas.push({ nombre: 'Iniciativa', valor: this.iniciativa, nota: enLinea(this.iniciativaDesglose) });
        if (this.presaDisponible)
            filas.push({ nombre: 'Presa', valor: this.presa, nota: enLinea(this.presaDesglose) });
        return filas;
    }

    private calcularHabilidades(): Pick<ModeloFicha, 'habilidades' | 'habilidadesConRangos' | 'verHabilidades'> {
        const todas = (this.pj.Habilidades ?? []).filter((h) => this.esVisible(h?.Nombre));
        const fila = (h: Personaje['Habilidades'][number]): HabilidadFila => {
            const extra = this.getExtraVisibleHabilidad(h);
            return {
                nombre: h.Nombre.trim() + (tieneTextoVisible(extra) ? ` (${extra})` : ''),
                car: `${h.Car ?? ''}`.trim().slice(0, 3),
                rangos: toNumber(h.Rangos) + toNumber(h.Rangos_varios),
                total: textoConSigno(totalHabilidad(h)),
                nota: [h.Clasea ? 'de clase' : '', this.texto(h.Varios), textoBonosHabilidad(h)].filter(Boolean).join(' · '),
            };
        };
        const habilidades = todas.map(fila);
        const habilidadesConRangos = todas
            .filter((h) => toNumber(h.Rangos) + toNumber(h.Rangos_varios) > 0 || this.esVisible(h.Varios))
            .map(fila);
        return {
            habilidades,
            habilidadesConRangos,
            // En la vista previa solo se enseñan si ya tiene rangos en alguna; en la ficha, también para ver todas.
            verHabilidades: habilidadesConRangos.length > 0 || (!this.esPreviewNuevoPersonaje && habilidades.length > 0),
        };
    }

    private detallePlantilla(p: any): string {
        return [
            toNumber(p?.Multiplicador_dgs_lic) > 0 ? `${toNumber(p.Multiplicador_dgs_lic)}${`${p?.Tipo_dgs_lic ?? ''}`.trim()} DG adicionales` : '',
            toNumber(p?.Suma_dgs_lic) > 0 ? `+${toNumber(p.Suma_dgs_lic)} PG` : '',
            toNumber(p?.Ajuste_nivel) > 0 ? `ajuste de nivel +${toNumber(p.Ajuste_nivel)}` : '',
            p?.Heredada ? 'heredada' : 'adquirida',
        ].filter(Boolean).join(' · ');
    }

    private calcularMagia(): DatoFicha[] {
        const pj = this.pj;
        const prohibidas = this.getEscuelasProhibidasVisibles();
        return [
            { etiqueta: 'Escuela especialista', valor: this.tieneEscuelaEspecialista() ? this.texto(pj.Escuela_especialista?.Nombre) || null : null },
            { etiqueta: 'Escuelas prohibidas', valor: prohibidas.join(', ') || null },
            {
                etiqueta: 'Disciplina especialista',
                valor: this.esVisible(pj.Disciplina_especialista?.Nombre)
                    ? this.texto(pj.Disciplina_especialista.Calificativo) || this.texto(pj.Disciplina_especialista.Nombre)
                    : null,
            },
            { etiqueta: 'Disciplina prohibida', valor: this.texto(pj.Disciplina_prohibida) || null },
            { etiqueta: 'Dominios', valor: this.getDominiosVisibles().join(', ') || null },
        ];
    }

    private calcularSortilegas(): EntradaLista<AptitudSortilega>[] {
        const fuente = (this.pj.Sortilegas ?? []).filter((s) => this.esVisible(s?.Conjuro?.Nombre));
        const lineas = sortilegasVisibles(fuente.map((s) => ({ ...s, Dg: s.Dgs_necesarios })));
        return fuente.map((s, i) => ({
            texto: lineas[i]?.nombre ?? `${s.Conjuro.Nombre}`.trim(),
            nota: [lineas[i]?.detalle ?? '', this.texto(s.Descripcion)].filter(Boolean).join(' · '),
            ayuda: this.texto(s.Origen) ? `Origen: ${s.Origen.trim()}` : '',
            clave: `${s.Conjuro.Id ?? ''}`,
            ref: s,
        }));
    }

    private calcularEquipo(): Pick<ModeloFicha, 'piezas' | 'equipo' | 'carga' | 'modificadoresEquipo' | 'sinEquipo'> {
        const pj = this.pj;
        const piezas = this.piezasEquipo;
        const cargaVisible = (valor: unknown) => this.tieneCaracteristicasParaPreview()
            ? Number.isFinite(Number(valor))
            : this.positivo(valor);
        const kg = (lb: number) => formatoNumero(Math.round(lb * 0.453592 * 100) / 100);
        const ligera = toNumber(pj.Capacidad_carga?.Ligera);
        const media = toNumber(pj.Capacidad_carga?.Media);
        const pesada = toNumber(pj.Capacidad_carga?.Pesada);
        return {
            piezas: piezas.map((pieza) => ({
                texto: nombreConCantidad(pieza),
                nota: [textoEquipadoPieza(pieza), ...detallesPiezaEquipo(pieza)].filter(Boolean).join(' · '),
                ayuda: this.texto(pieza.notas),
            })),
            equipo: [
                { etiqueta: 'Peso total', valor: piezas.length > 0 ? textoPeso(pj.PesoEquipo ?? 0) : null, ayuda: 'El peso de todo lo que lleva' },
                {
                    etiqueta: 'Dinero',
                    valor: pj.Dinero ? textoPrecio(pj.Dinero.po ?? 0) : null,
                    ayuda: pj.Dinero ? `Dinero inicial: ${textoPrecio(pj.Dinero.dineroInicial ?? 0)}` : null,
                },
            ],
            carga: [
                { etiqueta: 'Carga ligera', valor: cargaVisible(pj.Capacidad_carga?.Ligera) ? textoPeso(ligera) : null, ayuda: `${kg(ligera)} kg` },
                { etiqueta: 'Carga media', valor: cargaVisible(pj.Capacidad_carga?.Media) ? textoPeso(media) : null, ayuda: `${kg(media)} kg` },
                {
                    etiqueta: 'Carga pesada',
                    valor: cargaVisible(pj.Capacidad_carga?.Pesada) ? textoPeso(pesada) : null,
                    ayuda: `${kg(pesada)} kg\nLevantar sobre la cabeza: ${textoPeso(pesada)}\nLevantar del suelo: ${textoPeso(pesada * 2)}\nEmpujar o arrastrar: ${textoPeso(pesada * 5)}`,
                },
            ],
            modificadoresEquipo: this.modificadoresEquipo.map((modificador) => ({
                texto: textoModificadorEquipo(modificador),
                nota: this.texto(modificador.origen),
                ayuda: modificador.sumado ? 'Ya está sumado en la ficha' : 'Se enseña, pero la ficha aún no lo suma',
            })),
            sinEquipo: !this.esPreviewNuevoPersonaje && piezas.length < 1,
        };
    }

    private monstruosVisibles(lista: unknown): EntradaLista<MonstruoDetalle>[] {
        return toArray(lista)
            .map((item) => item as MonstruoDetalle)
            .filter((monstruo) => toNumber(monstruo?.Id) > 0 && this.esVisible(monstruo?.Nombre))
            .sort(porNombre)
            .map((monstruo) => ({ texto: `${monstruo.Nombre}`.trim(), clave: `${monstruo.Id}`, ref: monstruo }));
    }

    private calcularPestanas(m: ModeloFicha): ModeloFicha['pestanas'] {
        const hay = (...listas: unknown[][]) => listas.some((lista) => lista.length > 0);
        const visibles: Record<PestanaFicha, boolean> = {
            combate: true,
            habilidades: m.verHabilidades,
            capacidades: !!m.aptitudesEdad || hay(m.dotes, m.aptitudes, m.raciales, m.rasgosTipo, m.plantillas, m.ventajas, m.idiomas, m.familiares, m.companeros),
            magia: !!m.lanzamientoRacial || this.tieneDatos(m.magia) || hay(m.lanzadores, m.conjuros, m.sortilegas),
            incarnum: !!m.incarnum,
            equipo: this.tieneDatos(m.equipo) || this.tieneDatos(m.carga) || hay(m.piezas, m.modificadoresEquipo) || m.sinEquipo,
            historia: true,
        };
        return (Object.keys(NOMBRES_PESTANAS) as PestanaFicha[])
            .filter((id) => visibles[id])
            .map((id) => ({ id, nombre: NOMBRES_PESTANAS[id] }));
    }

    // Salidas: los enlaces a otros detalles

    @Output() ventajaDetallesPorNombre: EventEmitter<{ nombre: string; origen?: string; }> = new EventEmitter<{ nombre: string; origen?: string; }>();
    verDetallesVentajaPorNombre(ventaja: VentajaVisible): void {
        const referencia = this.normalizarVentajaReferencia(ventaja);
        const nombre = `${referencia.nombre ?? ''}`.trim();
        if (!this.esVisible(nombre))
            return;
        this.ventajaDetallesPorNombre.emit({ nombre, origen: referencia.origen });
    }

    @Output() deidadDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    verDetallesDeidadPorNombre(nombreDeidad: string): void {
        const nombre = `${nombreDeidad ?? ''}`.trim();
        if (this.esVisible(nombre))
            this.deidadDetallesPorNombre.emit(nombre);
    }

    toDoteContextualFallback(dote: DoteLegacy): DoteContextual {
        const fallbackDote: Dote = {
            Id: 0,
            Nombre: dote.Nombre,
            Descripcion: dote.Descripcion,
            Beneficio: dote.Beneficio,
            Normal: '',
            Especial: '',
            Manual: { Id: 0, Nombre: 'Desconocido', Pagina: dote.Pagina ?? 0 },
            Tipos: [],
            Repetible: 0,
            Repetible_distinto_extra: 0,
            Repetible_comb: 0,
            Comp_arma: 0,
            Oficial: true,
            Extras_soportados: {
                Extra_arma: 0,
                Extra_armadura_armaduras: 0,
                Extra_armadura_escudos: 0,
                Extra_armadura: 0,
                Extra_escuela: 0,
                Extra_habilidad: 0,
            },
            Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] },
            Extras_de_todo_el_catalogo: { Armas: false, Armaduras: false, Escuelas: false, Habilidades: false },
            Modificadores: {},
            Prerrequisitos: {},
        };

        return {
            Dote: fallbackDote,
            Contexto: {
                Entidad: 'personaje',
                Id_personaje: this.pj.Id,
                Id_extra: -1,
                Extra: dote.Extra ?? '',
                Origen: dote.Origen ?? 'Desconocido',
            }
        };
    }

    @Output() doteDetalles: EventEmitter<DoteContextual> = new EventEmitter<DoteContextual>();
    verDetallesDote(dote: DoteLegacy) {
        const contextual = (this.pj.DotesContextuales ?? []).find((dc) =>
            dc.Dote.Nombre === dote.Nombre && (dc.Contexto.Extra ?? '') === (dote.Extra ?? ''));
        this.doteDetalles.emit(contextual ?? this.toDoteContextualFallback(dote));
    }

    @Output() conjuroDetalles: EventEmitter<Conjuro> = new EventEmitter<Conjuro>();
    verDetallesConjuro(value: Conjuro) {
        this.conjuroDetalles.emit(value);
    }

    @Output() sortilegaDetalles: EventEmitter<AptitudSortilega> = new EventEmitter<AptitudSortilega>();
    verDetallesSortilega(value: AptitudSortilega) {
        if (this.pj.Sortilegas)
            this.sortilegaDetalles.emit(value);
    }

    @Output() tipoDetalles: EventEmitter<TipoCriatura> = new EventEmitter<TipoCriatura>();
    verDetallesTipoCriatura(value: TipoCriatura) {
        this.tipoDetalles.emit(value);
    }

    @Output() razaDetalles: EventEmitter<number> = new EventEmitter<number>();
    verDetallesRaza(idRaza: number) {
        const id = Number(idRaza);
        if (Number.isFinite(id) && id > 0)
            this.razaDetalles.emit(id);
    }

    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    verDetallesRasgo(value: Rasgo) {
        this.rasgoDetalles.emit(value);
    }

    @Output() fusionDetallesId: EventEmitter<number> = new EventEmitter<number>();
    verDetallesFusion(id: number | null): void {
        if (Number(id) > 0)
            this.fusionDetallesId.emit(Number(id));
    }

    @Output() chakraDetallesId: EventEmitter<number> = new EventEmitter<number>();
    verDetallesChakra(id: number): void {
        if (Number(id) > 0)
            this.chakraDetallesId.emit(Number(id));
    }

    @Output() claseDetalles: EventEmitter<string> = new EventEmitter<string>();
    verDetallesClase(nombreClase: string) {
        if (nombreClase && nombreClase.trim().length > 0)
            this.claseDetalles.emit(nombreClase.trim());
    }

    @Output() perfilPublicoDetalles: EventEmitter<{ uid: string; initialDisplayName?: string | null; }> =
        new EventEmitter<{ uid: string; initialDisplayName?: string | null; }>();
    verPerfilPublicoCreador(): void {
        const ownerUid = this.ownerUidNormalizado();
        if (ownerUid.length < 1 || !this.chipCreadorClickable)
            return;
        this.perfilPublicoDetalles.emit({
            uid: ownerUid,
            initialDisplayName: `${this.pj?.ownerDisplayName ?? ''}`.trim() || null,
        });
    }

    @Output() especialDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    verDetallesEspecialPorNombre(nombreEspecial: string) {
        if (this.esVisible(nombreEspecial))
            this.especialDetallesPorNombre.emit(nombreEspecial.trim());
    }

    @Output() racialDetallesPorNombre: EventEmitter<RacialReferencia> = new EventEmitter<RacialReferencia>();
    verDetallesRacialPorNombre(racial: RacialReferencia) {
        const nombreRacial = `${racial?.nombre ?? ''}`.trim();
        if (!this.esVisible(nombreRacial))
            return;
        this.racialDetallesPorNombre.emit({
            id: Number.isFinite(Number(racial?.id)) && Number(racial.id) > 0 ? Number(racial.id) : null,
            nombre: nombreRacial,
        });
    }

    @Output() plantillaDetalles: EventEmitter<{ id?: number | null; nombre: string; }> = new EventEmitter<{ id?: number | null; nombre: string; }>();
    verDetallesPlantilla(plantilla: any) {
        const nombre = `${plantilla?.Nombre ?? ''}`.trim();
        if (!this.esVisible(nombre))
            return;
        const id = Number(plantilla?.Id);
        this.plantillaDetalles.emit({ id: Number.isFinite(id) && id > 0 ? id : null, nombre });
    }

    @Output() monstruoDetalles: EventEmitter<MonstruoDetalle> = new EventEmitter<MonstruoDetalle>();
    verDetallesMonstruo(monstruo: MonstruoDetalle): void {
        const id = toNumber(monstruo?.Id);
        if (Number.isFinite(id) && id > 0)
            this.monstruoDetalles.emit(monstruo);
    }

    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();
    verDetallesSubtipo(subtipo: SubtipoRef) {
        const nombre = `${subtipo?.Nombre ?? ''}`.trim();
        if (!this.esVisible(nombre))
            return;
        const id = Number(subtipo?.Id);
        this.subtipoDetalles.emit({ Id: Number.isFinite(id) && id > 0 ? id : null, Nombre: nombre });
    }
}
