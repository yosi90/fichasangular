import { Component, ComponentRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, catchError, firstValueFrom, of, take } from 'rxjs';
import Swal from 'sweetalert2';
import { TiendaSesionComponent } from 'src/app/components/sesiones/tienda-sesion/tienda-sesion.component';
import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCompraRequestDto, PersonajeEquipoPiezaDto } from 'src/app/interfaces/personajes-api';
import {
    EventoSesionDto,
    ExperienciaPersonaje,
    MAXIMO_CONCEPTO_EVENTO,
    MAXIMO_NOTAS_SESION,
    MAXIMO_TEXTO_NOTA,
    MAXIMO_TITULO_SESION,
    OrigenObjetoObtenido,
    RespuestaSesion,
    SesionEvento,
    SesionPersonaje,
} from 'src/app/interfaces/sesiones';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DeidadService } from 'src/app/services/deidad.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { SesionesService, esSesionDesactualizada } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { textoPrecio } from 'src/app/services/utils/equipo-texto';
import { nivelLanzadorMinimo, precioCopiaLibro } from 'src/app/services/utils/libro-conjuros';
import { normalizarTexto, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { modoHomebrewDeCampana } from 'src/app/services/utils/politica-campana';
import { ETIQUETA_EVENTO, barraExperiencia, cambiosSesion, formatoPx, pxConPenalizacion } from 'src/app/services/utils/sesiones-texto';
import {
    ArticuloTienda,
    POLITICA_TIENDA_LIBRE,
    PoliticaTienda,
    ReglaDineroInicial,
    articulosDeCatalogo,
    indicePiezaDelCampo,
    politicaTienda,
} from 'src/app/services/utils/tienda-equipo';

/** Los tipos de lo que se apunta (lienzo de sesiones, pantalla 2), cada uno con su formulario corto; «Comprar» abre la tienda. */
export type TipoApunte = 'experiencia' | 'dinero' | 'objeto' | 'comprar' | 'vender' | 'libro' | 'alineamiento' | 'nota';

/** Lo que apunta el máster en «Alineamiento y expiación»: el cambio en juego, la caída por conducta o la expiación. */
export type ModoAlineamiento = 'cambio' | 'caida' | 'expiacion';

/** Una opción de un catálogo pequeño (los alineamientos básicos, las deidades, las clases del personaje). */
interface OpcionPanel {
    Id: number;
    Nombre: string;
}

interface BotonApunte {
    id: TipoApunte;
    nombre: string;
}

/** Un libro de conjuros del personaje: una de sus clases con `Conjuros.Libro` (un dato de la clase, no su nombre). */
interface LibroPanel {
    clase: Clase;
    nivel: number;
}

/** Un conjuro que se puede copiar a ese libro, con su nivel en la clase y su precio estimado (la API pone el de verdad). */
interface ConjuroLibroPanel {
    conjuro: Conjuro;
    nivel: number;
    precio: number;
}

const MAXIMO_CONJUROS_LISTA = 30;
/** Los eventos del panel que cambian la ficha (su alineamiento, su deidad o sus ex clases): al apuntarlos o deshacerlos se vuelve a leer. */
const CAMBIAN_LA_FICHA: ReadonlySet<string> = new Set(['cambio_alineamiento', 'caida', 'expiacion']);
const AVISO_DESACTUALIZADA = 'Otra persona ha apuntado algo en esta sesión mientras la tenías abierta. Ya está al día: '
    + 'revisa lo que ha cambiado y, si hace falta, vuelve a apuntarlo.';

/**
 * El panel de la sesión abierta (lienzo de sesiones, pantallas 2 y 5): título, fecha y notas (las notas, solo si las
 * ve), los tipos de lo que se apunta con su formulario corto, la tienda de la creación para comprar con el saldo o
 * apuntar el botín, la lista de lo que ha pasado con «Deshacer» en el último, «Cerrar la sesión» y el aviso de la
 * subida. Cada escritura manda la `version` de la última respuesta; con `409 sesion_desactualizada` vuelve a cargar y lo
 * dice. Sin `puedeApuntar`, solo se lee. Los textos de los eventos son los de la API, tal cual.
 */
@Component({
    selector: 'app-sesion-panel',
    templateUrl: './sesion-panel.component.html',
    styleUrls: ['./sesion-panel.component.sass'],
    imports: [FormsModule, MatButtonModule, MatIconModule],
})
export class SesionPanelComponent implements OnChanges, OnDestroy {
    /** La ficha de ahora (su equipo para vender, su dinero, sus clases y su penalización de PX). */
    @Input() pj!: Personaje;
    @Input() clases: Clase[] = [];
    @Input() sesion!: SesionPersonaje;
    @Input() puedeApuntar = false;
    @Input() veNotas = false;
    @Input() experiencia: ExperienciaPersonaje | null = null;
    /**
     * Si apunta los cambios de alineamiento, las caídas y las expiaciones: el máster de su campaña o, sin campaña, el dueño
     * (Guía del DM, pág. 134; la API responde `403 solo_el_master` a los demás).
     */
    @Input() controlaAlineamiento = false;
    /** Tras cada escritura (o al volver a cargar): la sesión al día y los PX. */
    @Input() alCambiar: (respuesta: RespuestaSesion) => void = () => undefined;
    /** «Volver al historial» y al cerrar la sesión. */
    @Input() alSalir: () => void = () => undefined;

    @ViewChild('tiendaHost', { read: ViewContainerRef }) tiendaHost?: ViewContainerRef;

    readonly maximoTitulo = MAXIMO_TITULO_SESION;
    readonly maximoNotas = MAXIMO_NOTAS_SESION;
    readonly maximoConcepto = MAXIMO_CONCEPTO_EVENTO;
    readonly maximoNota = MAXIMO_TEXTO_NOTA;
    readonly etiquetaEvento = ETIQUETA_EVENTO;
    readonly textoPrecio = textoPrecio;

    actual!: SesionPersonaje;
    exp: ExperienciaPersonaje | null = null;
    guardando = false;
    error = '';
    aviso = '';

    // La cabecera
    titulo = '';
    fecha = '';
    notas = '';

    // Lo que se apunta
    tipo: TipoApunte | null = null;
    pxModo: 'gana' | 'gasta' = 'gana';
    px: number | null = null;
    pxConcepto = '';
    poModo: 'gana' | 'gasta' = 'gana';
    po: number | null = null;
    poConcepto = '';
    origenObjeto: OrigenObjetoObtenido = 'botin';
    venderModo: 'vende' | 'pierde' = 'vende';
    idPieza: number | null = null;
    cantidad = 1;
    perdidaConcepto = '';
    idLibro: number | null = null;
    busquedaConjuro = '';
    conjuroElegido: ConjuroLibroPanel | null = null;
    notaTexto = '';
    alineamientoModo: ModoAlineamiento = 'cambio';
    /** El básico nuevo (o el de la redención de la expiación); `null`, no cambia. */
    idBasico: number | null = null;
    /** La deidad nueva (0, sin deidad); `null`, no cambia. */
    idDeidad: number | null = null;
    alineamientoConcepto = '';
    motivoCaida = '';
    clasesAlineamiento = new Set<number>();
    voluntaria = false;
    lanzador = '';
    basicos: OpcionPanel[] = [];
    deidades: OpcionPanel[] = [];
    cargandoAlineamiento = false;

    cargandoTienda = false;
    cargandoConjuros = false;
    private conjurosCatalogo: Conjuro[] | null = null;
    private articulos: ArticuloTienda[] | null = null;
    private tienda: ComponentRef<TiendaSesionComponent> | null = null;
    /** El `field` del último error de la API («piezas[2]»), para señalar la pieza en la tienda. */
    private ultimoCampo: string | null = null;

    constructor(
        private sesionesSvc: SesionesService,
        private puertaSubida: SubidaNivelPuertaService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private equipoSvc: EquipoService,
        private conjuroSvc: ConjuroService,
        private alineamientoSvc: AlineamientoService,
        private deidadSvc: DeidadService,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['sesion'] && this.sesion)
            this.ponerSesion(this.sesion);
        if (changes['experiencia'])
            this.exp = this.experiencia;
    }

    ngOnDestroy(): void {
        this.cerrarTienda();
    }

    // Lo que se ve

    get idPersonaje(): number {
        return toNumber(this.pj?.Id);
    }

    get abierta(): boolean {
        return this.actual?.estado === 'abierta';
    }

    /** Si se puede escribir: quien apunta y en la sesión abierta. */
    get editable(): boolean {
        return this.puedeApuntar && this.abierta;
    }

    get cambios(): string {
        return this.actual ? cambiosSesion(this.actual.resumen) : '';
    }

    get saldo(): number {
        return toNumber(this.actual?.resumen?.poFin ?? this.pj?.Dinero?.po);
    }

    get eventos(): SesionEvento[] {
        return this.actual?.eventos ?? [];
    }

    get botones(): BotonApunte[] {
        return [
            { id: 'experiencia', nombre: 'Experiencia' },
            { id: 'dinero', nombre: 'Dinero' },
            { id: 'objeto', nombre: 'Objeto obtenido' },
            { id: 'comprar', nombre: 'Comprar' },
            { id: 'vender', nombre: 'Vender' },
            ...(this.libros.length > 0 && this.politica.copiarConjuros ? [{ id: 'libro' as const, nombre: 'Conjuro al libro' }] : []),
            ...(this.controlaAlineamiento ? [{ id: 'alineamiento' as const, nombre: 'Alineamiento y expiación' }] : []),
            { id: 'nota', nombre: 'Nota' },
        ];
    }

    /** «Con 6.100 PX puede subir a nivel 4.» y su botón, si le llegan los PX y puede apuntar. */
    get subida(): { texto: string; boton: string; } | null {
        if (!this.exp?.puedeSubir || !this.puedeApuntar)
            return null;
        const barra = barraExperiencia(this.exp);
        return {
            texto: `Con ${formatoPx(this.exp.px)} PX puede subir a nivel ${barra.siguienteNivel}.`,
            boton: barra.varios ? `${barra.boton} ${barra.varios}` : barra.boton,
        };
    }

    /** El % que pierde de lo que gana por multiclase ahora (Manual del jugador, cap. 3), el mismo cálculo que la API. */
    get penalizacion(): number {
        return toInt(this.pj?.Penalizacion_experiencia?.porcentaje);
    }

    /** Lo que se dice bajo los PX antes de apuntarlos. */
    get notaExperiencia(): string {
        const px = toInt(this.px);
        if (this.pxModo === 'gasta') {
            const margen = Math.max(0, toInt(this.exp?.px) - toInt(this.exp?.pxNivelActual));
            return `No puede bajar de los PX de su nivel: puede gastar hasta ${formatoPx(margen)} PX.`;
        }
        if (px < 1)
            return '';
        return this.penalizacion > 0
            ? `Con −${this.penalizacion} % por multiclase: ${formatoPx(pxConPenalizacion(px, this.penalizacion))} PX.`
            : `Sin penalización por multiclase: suma ${formatoPx(px)} PX.`;
    }

    /**
     * Lo que deja comprar su campaña (`PoliticaCompra` de la ficha; sin campaña, todo), leído como en la tienda de la
     * creación: objetos mágicos, a medida, el precio por pieza y copiar conjuros al libro.
     */
    get politica(): PoliticaTienda {
        return politicaTienda(this.pj?.PoliticaCompra);
    }

    /** En una campaña que no admite homebrew, solo lo oficial: en la compra, en el botín y en los conjuros para el libro. */
    get soloOficial(): boolean {
        return modoHomebrewDeCampana(this.pj?.PoliticaCompra) === 'forbidden';
    }

    /** Lo que tiene para vender o perder: las piezas de su equipo. */
    get piezas(): PersonajeEquipoPiezaDto[] {
        return (this.pj?.Equipo ?? []).filter((pieza) => toInt(pieza?.id) > 0);
    }

    get piezaElegida(): PersonajeEquipoPiezaDto | null {
        return this.piezas.find((pieza) => pieza.id === toInt(this.idPieza)) ?? null;
    }

    /** Sus clases con libro de conjuros (`Conjuros.Libro`), del catálogo. */
    get libros(): LibroPanel[] {
        return (this.pj?.desgloseClases ?? [])
            .map((entrada) => ({ clase: this.claseDelCatalogo(entrada), nivel: toInt(entrada?.Nivel) }))
            .filter((libro): libro is LibroPanel => !!libro.clase?.Conjuros?.Libro)
            .filter((libro, indice, todos) => todos.findIndex((otro) => otro.clase.Id === libro.clase.Id) === indice);
    }

    get libroElegido(): LibroPanel | null {
        return this.libros.find((libro) => libro.clase.Id === toInt(this.idLibro)) ?? null;
    }

    /** Los conjuros de la lista de esa clase que encajan con la búsqueda; la API comprueba si los puede copiar. */
    get conjurosDelLibro(): ConjuroLibroPanel[] {
        const libro = this.libroElegido;
        const busqueda = normalizarTexto(this.busquedaConjuro, true);
        if (!libro || !this.conjurosCatalogo || busqueda.length < 2)
            return [];
        return this.conjurosCatalogo
            .map((conjuro) => ({ conjuro, nivel: (conjuro.Nivel_clase ?? []).find((n) => toInt(n?.Id_clase) === libro.clase.Id)?.Nivel }))
            .filter((item): item is { conjuro: Conjuro; nivel: number; } => item.nivel !== undefined && item.nivel !== null)
            .filter((item) => !this.soloOficial || item.conjuro.Oficial)
            .filter((item) => normalizarTexto(item.conjuro.Nombre ?? '', true).includes(busqueda))
            .sort((a, b) => a.nivel - b.nivel || `${a.conjuro.Nombre}`.localeCompare(`${b.conjuro.Nombre}`, 'es'))
            .slice(0, MAXIMO_CONJUROS_LISTA)
            .map((item) => ({
                ...item,
                precio: precioCopiaLibro(item.nivel, nivelLanzadorMinimo(libro.clase, item.nivel) ?? 1, item.conjuro.Coste_material, item.conjuro.Coste_px).total,
            }));
    }

    /**
     * Las clases que pueden caer por su conducta (datos de la clase, como la API): las que solo se recuperan con una
     * expiación (`Ex.Requiere_expiacion`), las que no vuelven nunca (`Ex.Caida_sin_vuelta`: el caballero protector) y las
     * que pierden algo propio al caer (`Ex.Especiales_caida`), que no han caído ya.
     */
    get clasesQuePuedenCaer(): OpcionPanel[] {
        return this.clasesDelPersonaje((entrada, clase) => (clase?.Ex?.Requiere_expiacion === true
            || clase?.Ex?.Caida_sin_vuelta === true || (clase?.Ex?.Especiales_caida ?? []).length > 0)
            && entrada.Ex?.Necesita_expiacion !== true && entrada.Ex?.Sin_vuelta !== true);
    }

    /** Las clases caídas que una expiación puede devolver (`ex.necesitaExpiacion` de la ficha). */
    get clasesCaidas(): OpcionPanel[] {
        return this.clasesDelPersonaje((entrada) => entrada.Ex?.Necesita_expiacion === true);
    }

    /** Las clases de la caída o de la expiación, según el modo. */
    get clasesDelModo(): OpcionPanel[] {
        return this.alineamientoModo === 'caida' ? this.clasesQuePuedenCaer : this.alineamientoModo === 'expiacion' ? this.clasesCaidas : [];
    }

    /** Por qué no se puede apuntar aún lo del formulario abierto, o `null` si se puede. */
    get motivoNoApuntar(): string | null {
        switch (this.tipo) {
            case 'experiencia': {
                const px = Number(this.px);
                if (!Number.isInteger(px) || px < 1)
                    return 'Pon los PX (un número entero).';
                if (this.pxModo === 'gasta' && px > Math.max(0, toInt(this.exp?.px) - toInt(this.exp?.pxNivelActual)))
                    return 'No puede gastar tantos PX sin bajar de su nivel.';
                return this.pxConcepto.length > MAXIMO_CONCEPTO_EVENTO ? `El concepto puede tener como mucho ${MAXIMO_CONCEPTO_EVENTO} caracteres.` : null;
            }
            case 'dinero': {
                const po = Number(this.po);
                if (!Number.isFinite(po) || po <= 0 || Math.round(po * 100) !== po * 100)
                    return 'Pon la cantidad en po (con dos decimales como mucho).';
                if (this.poModo === 'gasta' && po > this.saldo)
                    return `No le llega: tiene ${textoPrecio(this.saldo)}.`;
                return this.poConcepto.length > MAXIMO_CONCEPTO_EVENTO ? `El concepto puede tener como mucho ${MAXIMO_CONCEPTO_EVENTO} caracteres.` : null;
            }
            case 'vender': {
                const pieza = this.piezaElegida;
                if (!pieza)
                    return 'Elige la pieza.';
                const cantidad = Number(this.cantidad);
                if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > Math.max(1, toInt(pieza.cantidad, 1)))
                    return `La cantidad va de 1 a ${Math.max(1, toInt(pieza.cantidad, 1))}.`;
                return this.perdidaConcepto.length > MAXIMO_CONCEPTO_EVENTO ? `El concepto puede tener como mucho ${MAXIMO_CONCEPTO_EVENTO} caracteres.` : null;
            }
            case 'libro':
                return this.libroElegido && this.conjuroElegido ? null : 'Elige el libro y el conjuro.';
            case 'alineamiento':
                return this.motivoNoApuntarAlineamiento();
            case 'nota': {
                const texto = this.notaTexto.trim();
                if (texto.length < 1)
                    return 'Escribe la nota.';
                return texto.length > MAXIMO_TEXTO_NOTA ? `La nota puede tener como mucho ${MAXIMO_TEXTO_NOTA} caracteres.` : null;
            }
            default:
                return null;
        }
    }

    // Acciones

    salir(): void {
        this.cerrarTienda();
        this.alSalir();
    }

    elegirTipo(tipo: TipoApunte): void {
        if (!this.editable || this.guardando)
            return;
        this.error = '';
        if (tipo === 'comprar') {
            this.tipo = null;
            void this.abrirTienda('compra');
            return;
        }
        this.tipo = this.tipo === tipo ? null : tipo;
        if (this.tipo === 'libro') {
            this.idLibro ??= this.libros[0]?.clase.Id ?? null;
            void this.cargarConjuros();
        }
        if (this.tipo === 'alineamiento')
            void this.cargarAlineamientos();
    }

    cancelarFormulario(): void {
        this.tipo = null;
        this.error = '';
    }

    elegirModoAlineamiento(modo: ModoAlineamiento): void {
        this.alineamientoModo = modo;
        this.clasesAlineamiento = new Set();
        this.idBasico = null;
        this.idDeidad = null;
        this.error = '';
    }

    alternarClaseAlineamiento(id: number): void {
        const clases = new Set(this.clasesAlineamiento);
        if (clases.has(id))
            clases.delete(id);
        else
            clases.add(id);
        this.clasesAlineamiento = clases;
    }

    elegirConjuro(item: ConjuroLibroPanel): void {
        this.conjuroElegido = item;
    }

    /** Apunta lo del formulario abierto (el objeto obtenido abre antes la tienda para elegirlo). */
    async apuntar(): Promise<void> {
        if (!this.editable || this.motivoNoApuntar !== null || this.guardando)
            return;
        if (this.tipo === 'objeto') {
            await this.abrirTienda('botin');
            return;
        }
        const evento = this.eventoDelFormulario();
        if (!evento)
            return;
        const hecho = await this.escribir(() => this.sesionesSvc.apuntar(this.idPersonaje, this.actual, evento));
        if (hecho)
            this.limpiarFormulario();
        if (hecho && CAMBIAN_LA_FICHA.has(evento.tipo))
            this.puertaSubida.subidaHecha(this.idPersonaje);
    }

    /** La cabecera: título, fecha y notas, al salir de cada campo si han cambiado. */
    async guardarCabecera(campo: 'titulo' | 'fecha' | 'notas'): Promise<void> {
        if (!this.puedeApuntar || this.guardando)
            return;
        if (campo === 'titulo') {
            const titulo = this.titulo.trim();
            if (titulo === this.actual.titulo)
                return;
            if (titulo.length < 1 || titulo.length > MAXIMO_TITULO_SESION) {
                this.error = titulo.length < 1 ? 'El título no puede quedar vacío.' : `El título puede tener como mucho ${MAXIMO_TITULO_SESION} caracteres.`;
                this.titulo = this.actual.titulo;
                return;
            }
            await this.escribir(() => this.sesionesSvc.cambiar(this.idPersonaje, this.actual, { titulo }));
        } else if (campo === 'fecha') {
            const fecha = this.fecha || null;
            if (fecha === this.actual.fechaJuego)
                return;
            await this.escribir(() => this.sesionesSvc.cambiar(this.idPersonaje, this.actual, { fechaJuego: fecha }));
        } else {
            const notas = this.notas.trim() || null;
            if (!this.veNotas || notas === (this.actual.notas?.trim() || null))
                return;
            if ((notas ?? '').length > MAXIMO_NOTAS_SESION) {
                this.error = `Las notas pueden tener como mucho ${MAXIMO_NOTAS_SESION} caracteres.`;
                return;
            }
            await this.escribir(() => this.sesionesSvc.cambiar(this.idPersonaje, this.actual, { notas }));
        }
    }

    /** «Deshacer» el último evento (LIFO), tras confirmarlo. */
    async deshacer(evento: SesionEvento): Promise<void> {
        if (!this.editable || !evento.deshacible || this.guardando)
            return;
        const confirmacion = await Swal.fire({
            icon: 'question',
            title: '¿Deshacer lo último?',
            text: evento.texto,
            showCancelButton: true,
            confirmButtonText: 'Deshacer',
            cancelButtonText: 'Cancelar',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
        if (confirmacion.isConfirmed && await this.escribir(() => this.sesionesSvc.deshacer(this.idPersonaje, this.actual))
            && CAMBIAN_LA_FICHA.has(evento.tipo))
            this.puertaSubida.subidaHecha(this.idPersonaje);
    }

    /** «Cerrar la sesión»: congela su versión de la ficha y vuelve al historial. */
    async cerrarSesion(): Promise<void> {
        if (!this.editable || this.guardando)
            return;
        const confirmacion = await Swal.fire({
            icon: 'question',
            title: `¿Cerrar la sesión ${this.actual.numero}?`,
            text: 'La ficha de ahora queda guardada como la versión de esta sesión. Mientras sea la última, podrás reabrirla.',
            showCancelButton: true,
            confirmButtonText: 'Cerrar la sesión',
            cancelButtonText: 'Seguir en ella',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
        if (!confirmacion.isConfirmed)
            return;
        if (await this.escribir(() => this.sesionesSvc.cerrar(this.idPersonaje, this.actual)))
            this.salir();
    }

    pedirSubida(): void {
        if (this.idPersonaje > 0)
            this.puertaSubida.solicitar(this.idPersonaje);
    }

    trackEvento(_indice: number, evento: SesionEvento): number {
        return evento.id;
    }

    // La tienda (la de la creación, `<app-tienda-equipo>` con su configuración de piezas)

    async abrirTienda(modo: 'compra' | 'botin'): Promise<void> {
        if (this.tienda || this.cargandoTienda || !this.tiendaHost)
            return;
        this.cargandoTienda = true;
        try {
            const articulos = await this.cargarArticulos();
            const conjuros = await this.cargarCatalogoConjuros();
            const ref = this.tiendaHost.createComponent(TiendaSesionComponent);
            ref.setInput('modo', modo);
            ref.setInput('titulo', modo === 'compra'
                ? `Comprar en la sesión ${this.actual.numero}`
                : `${this.origenObjeto === 'botin' ? 'Botín' : 'Regalo'} de la sesión ${this.actual.numero}`);
            ref.setInput('regla', this.reglaTienda(modo));
            ref.setInput('articulos', articulos);
            ref.setInput('conjuros', conjuros.map((conjuro) => ({ Id: conjuro.Id, Nombre: conjuro.Nombre })));
            ref.setInput('capacidadCarga', this.pj?.Capacidad_carga ?? null);
            // Al comprar, todo lo que deja su campaña; el botín o regalo no se compra: la API solo mira ahí lo homebrew.
            ref.setInput('politica', modo === 'compra' ? this.politica : POLITICA_TIENDA_LIBRE);
            ref.setInput('soloOficial', this.soloOficial);
            ref.instance.confirmar.subscribe((compra) => void this.confirmarTienda(modo, compra));
            ref.instance.cancelar.subscribe(() => this.cerrarTienda());
            this.tienda = ref;
        } finally {
            this.cargandoTienda = false;
        }
    }

    cerrarTienda(): void {
        this.tienda?.destroy();
        this.tienda = null;
    }

    // Lo de dentro

    private ponerSesion(sesion: SesionPersonaje): void {
        this.actual = sesion;
        this.titulo = sesion.titulo;
        this.fecha = sesion.fechaJuego ?? '';
        this.notas = sesion.notas ?? '';
    }

    /**
     * Una escritura: con la `version` de ahora; la respuesta deja la sesión al día (y la lista y la ficha, por
     * `alCambiar`). Con `409 sesion_desactualizada`, vuelve a cargar la sesión y lo dice. Devuelve si se guardó.
     */
    private async escribir(accion: () => Promise<RespuestaSesion>): Promise<boolean> {
        if (this.guardando)
            return false;
        this.guardando = true;
        this.error = '';
        this.aviso = '';
        this.ultimoCampo = null;
        try {
            this.aplicar(await accion());
            return true;
        } catch (error: any) {
            if (esSesionDesactualizada(error))
                await this.recargarDesactualizada();
            else
                this.error = this.mensaje(error);
            return false;
        } finally {
            this.guardando = false;
        }
    }

    private aplicar(respuesta: RespuestaSesion): void {
        this.ponerSesion(respuesta.sesion);
        if (respuesta.experiencia)
            this.exp = respuesta.experiencia;
        this.alCambiar(respuesta);
    }

    /** Otra persona apuntó entre medias: la sesión de ahora (y, si ya no está abierta, de vuelta al historial). */
    private async recargarDesactualizada(): Promise<void> {
        this.aviso = AVISO_DESACTUALIZADA;
        try {
            const historial = await this.sesionesSvc.historial(this.idPersonaje);
            const sesion = historial.sesiones.find((s) => s.numero === this.actual.numero);
            if (!sesion)
                return;
            this.aplicar({ sesion, experiencia: historial.experiencia });
        } catch (error: any) {
            this.error = this.mensaje(error);
        }
    }

    private eventoDelFormulario(): EventoSesionDto | null {
        const concepto = (texto: string) => texto.trim() ? { concepto: texto.trim() } : {};
        switch (this.tipo) {
            case 'experiencia':
                return { tipo: this.pxModo === 'gana' ? 'experiencia' : 'experiencia_gastada', px: toInt(this.px), ...concepto(this.pxConcepto) };
            case 'dinero': {
                const po = Math.round(Number(this.po) * 100) / 100;
                return { tipo: 'dinero', po: this.poModo === 'gana' ? po : -po, ...concepto(this.poConcepto) };
            }
            case 'vender': {
                const idPersonajeEquipo = toInt(this.idPieza);
                const cantidad = Math.max(1, toInt(this.cantidad, 1));
                return this.venderModo === 'vende'
                    ? { tipo: 'venta', idPersonajeEquipo, cantidad }
                    : { tipo: 'objeto_perdido', idPersonajeEquipo, cantidad, ...concepto(this.perdidaConcepto) };
            }
            case 'libro':
                return this.libroElegido && this.conjuroElegido
                    ? { tipo: 'conjuro_copiado', idConjuro: this.conjuroElegido.conjuro.Id, idClase: this.libroElegido.clase.Id }
                    : null;
            case 'alineamiento':
                return this.eventoDeAlineamiento();
            case 'nota':
                return { tipo: 'nota', texto: this.notaTexto.trim() };
            default:
                return null;
        }
    }

    private motivoNoApuntarAlineamiento(): string | null {
        if (this.cargandoAlineamiento)
            return 'Cargando los alineamientos y las deidades…';
        const largo = (texto: string, que: string) => texto.trim().length > MAXIMO_CONCEPTO_EVENTO
            ? `${que} puede tener como mucho ${MAXIMO_CONCEPTO_EVENTO} caracteres.` : null;
        if (this.alineamientoModo === 'cambio') {
            if (this.idBasico === null && this.idDeidad === null)
                return 'Elige el alineamiento nuevo, la deidad nueva o los dos.';
            return largo(this.alineamientoConcepto, 'El motivo');
        }
        if (this.clasesAlineamiento.size < 1)
            return this.alineamientoModo === 'caida' ? 'Elige la clase que cae.' : 'Elige la clase que recupera.';
        if (this.alineamientoModo === 'caida')
            return this.motivoCaida.trim().length < 1 ? 'Di por qué cae: un acto maligno, su código, su juramento…' : largo(this.motivoCaida, 'El motivo');
        return largo(this.lanzador, 'Quién la lanza') ?? largo(this.alineamientoConcepto, 'El motivo');
    }

    private eventoDeAlineamiento(): EventoSesionDto | null {
        const texto = (valor: string) => valor.trim() || undefined;
        const clases = [...this.clasesAlineamiento];
        if (this.alineamientoModo === 'caida')
            return { tipo: 'caida', clases, motivo: this.motivoCaida.trim() };
        if (this.alineamientoModo === 'expiacion')
            return {
                tipo: 'expiacion', clases, voluntaria: this.voluntaria,
                ...(this.idBasico !== null ? { idAlineamiento: this.idBasico } : {}),
                ...(texto(this.lanzador) ? { lanzador: texto(this.lanzador) } : {}),
                ...(texto(this.alineamientoConcepto) ? { concepto: texto(this.alineamientoConcepto) } : {}),
            };
        return {
            tipo: 'cambio_alineamiento',
            ...(this.idBasico !== null ? { idAlineamiento: this.idBasico } : {}),
            ...(this.idDeidad !== null ? { deidad: this.idDeidad } : {}),
            ...(texto(this.alineamientoConcepto) ? { concepto: texto(this.alineamientoConcepto) } : {}),
        };
    }

    /** Las clases del personaje (con su id del catálogo) que cumplen `filtro`, sin repetir. */
    private clasesDelPersonaje(filtro: (entrada: Personaje['desgloseClases'][number], clase: Clase | null) => boolean): OpcionPanel[] {
        return (this.pj?.desgloseClases ?? [])
            .map((entrada) => ({ entrada, clase: this.claseDelCatalogo(entrada) }))
            .filter(({ entrada, clase }) => !!clase && filtro(entrada, clase))
            .map(({ clase }) => ({ Id: clase!.Id, Nombre: clase!.Nombre }))
            .filter((opcion, indice, todas) => todas.findIndex((otra) => otra.Id === opcion.Id) === indice);
    }

    /** Los alineamientos básicos y las deidades del catálogo, al abrir el formulario (una vez). */
    private async cargarAlineamientos(): Promise<void> {
        if (this.basicos.length > 0 || this.cargandoAlineamiento)
            return;
        this.cargandoAlineamiento = true;
        try {
            const [basicos, deidades] = await Promise.all([
                firstValueFrom(this.alineamientoSvc.getAlineamientosBasicosCatalogo().pipe(take(1))),
                firstValueFrom(this.deidadSvc.getDeidades().pipe(take(1))),
            ]);
            this.basicos = (basicos ?? []).filter((b) => toInt(b?.Id) > 0).map((b) => ({ Id: toInt(b.Id), Nombre: b.Nombre }));
            this.deidades = (deidades ?? []).map((d) => ({ Id: toInt(d?.Id), Nombre: d.Nombre }))
                .sort((a, b) => a.Id === 0 ? -1 : b.Id === 0 ? 1 : a.Nombre.localeCompare(b.Nombre, 'es'));
        } catch (error: any) {
            this.error = this.mensaje(error);
        } finally {
            this.cargandoAlineamiento = false;
        }
    }

    private limpiarFormulario(): void {
        this.tipo = null;
        this.px = null;
        this.pxConcepto = '';
        this.po = null;
        this.poConcepto = '';
        this.idPieza = null;
        this.cantidad = 1;
        this.perdidaConcepto = '';
        this.busquedaConjuro = '';
        this.conjuroElegido = null;
        this.notaTexto = '';
        this.idBasico = null;
        this.idDeidad = null;
        this.alineamientoConcepto = '';
        this.motivoCaida = '';
        this.clasesAlineamiento = new Set();
        this.voluntaria = false;
        this.lanzador = '';
    }

    /** La compra paga del saldo (sin tope: la regla «libre» con el saldo de sugerido); el botín no se paga. */
    private reglaTienda(modo: 'compra' | 'botin'): ReglaDineroInicial {
        return modo === 'compra'
            ? { modo: 'libre', dados: null, multiplicador: 1, maximo: null, sugerido: this.saldo, descripcion: 'Lo paga del saldo.' }
            : { modo: 'libre', dados: null, multiplicador: 1, maximo: null, sugerido: 0, descripcion: 'No se paga.' };
    }

    private async confirmarTienda(modo: 'compra' | 'botin', compra: PersonajeCompraRequestDto): Promise<void> {
        const tienda = this.tienda;
        if (!tienda || this.guardando)
            return;
        tienda.setInput('guardando', true);
        tienda.setInput('error', '');
        tienda.setInput('piezaConError', null);
        if (modo === 'compra') {
            const hecho = await this.escribir(() => this.sesionesSvc.comprar(this.idPersonaje, this.actual, {
                piezas: compra.piezas,
                ...(compra.conjurosLibro?.length ? { conjurosLibro: compra.conjurosLibro } : {}),
            }));
            this.trasLaTienda(hecho, null);
            return;
        }
        // El botín: un evento por pieza, uno detrás de otro con la `version` de cada respuesta.
        const piezas = compra.piezas ?? [];
        for (let i = 0; i < piezas.length; i++) {
            const hecho = await this.escribir(() => this.sesionesSvc.apuntar(this.idPersonaje, this.actual, {
                tipo: 'objeto_obtenido', origen: this.origenObjeto, pieza: piezas[i],
            }));
            if (!hecho) {
                if (i > 0) {
                    this.error = `Se apuntaron ${i} de ${piezas.length}. ${this.error || this.aviso}`.trim();
                    this.cerrarTienda();
                    this.tipo = null;
                    return;
                }
                this.trasLaTienda(false, 0);
                return;
            }
        }
        this.trasLaTienda(true, null);
        this.limpiarFormulario();
    }

    /** Cierra la tienda si se guardó; si no, la deja abierta con el error (y la pieza que señala la API). */
    private trasLaTienda(hecho: boolean, piezaSiNoDice: number | null): void {
        const tienda = this.tienda;
        if (!tienda)
            return;
        if (hecho) {
            this.cerrarTienda();
            return;
        }
        tienda.setInput('guardando', false);
        tienda.setInput('error', this.error || this.aviso);
        tienda.setInput('piezaConError', indicePiezaDelCampo(this.ultimoCampo) ?? piezaSiNoDice);
        tienda.setInput('regla', this.reglaTienda(tienda.instance.modo));
        this.error = '';
    }

    private mensaje(error: any): string {
        this.ultimoCampo = typeof error?.field === 'string' ? error.field : null;
        return `${error?.message ?? ''}`.trim() || 'No se ha podido guardar.';
    }

    private async cargarArticulos(): Promise<ArticuloTienda[]> {
        if (this.articulos)
            return this.articulos;
        const lista = <T>(fuente: Observable<T[]>) => firstValueFrom(fuente.pipe(take(1), catchError(() => of([] as T[]))));
        const [armas, armaduras, municiones] = await Promise.all([
            lista(this.armaSvc.getArmas()),
            lista(this.armaduraSvc.getArmaduras()),
            lista(this.equipoSvc.getMuniciones()),
        ]);
        this.articulos = articulosDeCatalogo(armas, armaduras, municiones);
        return this.articulos;
    }

    private async cargarCatalogoConjuros(): Promise<Conjuro[]> {
        if (!this.conjurosCatalogo)
            this.conjurosCatalogo = await firstValueFrom(this.conjuroSvc.getConjuros().pipe(take(1), catchError(() => of([] as Conjuro[]))));
        return this.conjurosCatalogo ?? [];
    }

    private async cargarConjuros(): Promise<void> {
        if (this.conjurosCatalogo)
            return;
        this.cargandoConjuros = true;
        try {
            await this.cargarCatalogoConjuros();
        } finally {
            this.cargandoConjuros = false;
        }
    }

    /** La clase del catálogo de una de sus clases: por id (como la API) o, sin id, por nombre. */
    private claseDelCatalogo(entrada: { Id?: number; Nombre: string; }): Clase | null {
        const id = toInt(entrada?.Id);
        if (id > 0)
            return this.clases.find((clase) => clase.Id === id) ?? null;
        const nombre = normalizarTexto(entrada?.Nombre ?? '');
        return this.clases.find((clase) => normalizarTexto(clase?.Nombre ?? '') === nombre) ?? null;
    }
}
