import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { Subscription } from 'rxjs';
import { Personaje } from 'src/app/interfaces/personaje';
import { datosIdeaDePersonaje, DisponibilidadIa, IdeasIaError, IdeasIaService, MAX_DETALLES_IMAGEN_IA } from 'src/app/services/ideas-ia.service';
import {
    ImagenesPersonaje,
    ImagenesPersonajeService,
    indicacionesDeEncargo,
    MAX_BYTES_IMAGEN,
    TIPOS_IMAGEN_PERSONAJE,
    TipoImagenPersonaje,
} from 'src/app/services/imagenes-personaje.service';
import { EncargoPlataforma, PlatformSessionService } from 'src/app/services/platform-session.service';
import Swal from 'sweetalert2';

const NOMBRES: Record<TipoImagenPersonaje, string> = { retrato: 'Retrato', cuerpo: 'Cuerpo entero' };
/** Cuántas imágenes se piden en un encargo: la persona elige una (petición de la plataforma, kit 1.55). */
const MAXIMO_ENCARGO = 2;
/** Los errores de un encargo que ya no está para recoger (otra pestaña lo recogió, se canceló o caducó). */
const ENCARGO_YA_CERRADO = ['encargo_cerrado', 'encargo_en_otro_estado', 'encargo_no_encontrado', 'archivo_no_encontrado'];

/** `<yosi-encargos>` del SDK (ecosistema-kit/ENCARGOS.md): `cargar()` vuelve a leer su estado. */
type BotonDeEncargos = HTMLElement & { cargar?: () => Promise<void> };

/** Lo que se pide a otra web para un tipo de imagen: va en los atributos y propiedades de `<yosi-encargos>`. */
export interface PedidoDeImagen {
    titulo: string;
    idExterno: string;
    indicaciones: { texto: string; formato: string };
}

/** Lo que ha llegado de un encargo, mientras la persona elige qué imagen usa. */
export interface LlegadaDeEncargo {
    id: string;
    /** La web que lo ha hecho («p.i.c.»). */
    de: string;
    imagenes: { archivo: Blob; url: string }[];
    cerrando: boolean;
    boton: BotonDeEncargos | null;
}

/**
 * Las imágenes del personaje (propietario, 2026-10-23): un retrato y una de cuerpo entero, que ve quien ve la ficha.
 * Lo principal es que su dueño las suba; generarlas con IA (OpenAI, con su clave) es una opción, con detalles de su
 * aspecto si quiere. También puede encargarlas a otra web del ecosistema (p.i.c.) con `<yosi-encargos>`: lo que llega
 * lo elige aquí, se sube como cualquier otra y se recoge siempre (ecosistema-kit/ENCARGOS.md). La API las deja todas
 * en WebP con las mismas medidas. Nadie más las cambia.
 */
@Component({
    selector: 'app-imagenes-personaje',
    templateUrl: './imagenes-personaje.component.html',
    styleUrls: ['./ideas-ia.component.sass'],
    standalone: false
})
export class ImagenesPersonajeComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() pj: Personaje | null = null;
    @ViewChildren('botonEncargo') botonesEncargo?: QueryList<ElementRef<BotonDeEncargos>>;

    readonly tipos = TIPOS_IMAGEN_PERSONAJE;
    imagenes: ImagenesPersonaje = { retrato: null, cuerpo: null };
    /** La dirección `blob:` de cada imagen descargada. */
    urls: Partial<Record<TipoImagenPersonaje, string>> = {};
    /** Cada imagen descargada, para mandarla como referencia en un encargo. */
    archivos: Partial<Record<TipoImagenPersonaje, Blob>> = {};
    /** Lo que ha llegado de un encargo de cada tipo, por elegir. */
    llegadas: Partial<Record<TipoImagenPersonaje, LlegadaDeEncargo>> = {};
    readonly maximoEncargo = MAXIMO_ENCARGO;
    disponibilidad: DisponibilidadIa = 'sin_sesion';
    /** El tipo con el panel de «Con IA» abierto. */
    conIa: TipoImagenPersonaje | null = null;
    detalles = '';
    readonly maxDetalles = MAX_DETALLES_IMAGEN_IA;
    /** El tipo que se está subiendo o generando. */
    ocupado: TipoImagenPersonaje | null = null;
    error: IdeasIaError | null = null;

    private estadoSub?: Subscription;
    private botonesSub?: Subscription;
    private pedidos: { pj: Personaje | null; porTipo: Record<TipoImagenPersonaje, PedidoDeImagen> } | null = null;
    private consulta = 0;
    private consultaDeIa = 0;

    constructor(
        private imagenesSvc: ImagenesPersonajeService,
        private ideasIaSvc: IdeasIaService,
        private platformSessionSvc: PlatformSessionService,
    ) { }

    /** Si hay algo que enseñar: alguna imagen o, al dueño, los huecos para subirlas. */
    get visible(): boolean {
        return !!(this.imagenes.retrato || this.imagenes.cuerpo) || this.esDueno;
    }

    get esDueno(): boolean {
        const cuenta = `${this.platformSessionSvc.cuenta?.id ?? ''}`.trim();
        return cuenta.length > 0 && cuenta === `${this.pj?.ownerUid ?? ''}`.trim();
    }

    get iaLista(): boolean {
        return this.disponibilidad === 'lista';
    }

    get urlGestion(): string {
        return this.ideasIaSvc.urlGestion;
    }

    nombre(tipo: TipoImagenPersonaje): string {
        return NOMBRES[tipo];
    }

    /**
     * Lo que se pide a otra web para [tipo]. El `id-externo` (personaje y tipo) hace que el estado siga al recargar y
     * que no se pida dos veces; es el mismo objeto mientras no cambie el personaje, para no repintar el botón.
     */
    pedido(tipo: TipoImagenPersonaje): PedidoDeImagen {
        if (this.pedidos?.pj !== this.pj) {
            const datos = datosIdeaDePersonaje(this.pj);
            const nombre = `${this.pj?.Nombre ?? ''}`.trim();
            const pedido = (t: TipoImagenPersonaje): PedidoDeImagen => ({
                titulo: `${NOMBRES[t]} de ${nombre || 'tu personaje'}`.slice(0, 120),
                idExterno: `personaje-${Number(this.pj?.Id) || 0}-${t}`,
                indicaciones: indicacionesDeEncargo(t, datos),
            });
            this.pedidos = { pj: this.pj, porTipo: { retrato: pedido('retrato'), cuerpo: pedido('cuerpo') } };
        }
        return this.pedidos.porTipo[tipo];
    }

    /** La imagen de referencia del encargo: la que ya tiene de ese tipo o, si no, la otra, para que sea el mismo. */
    referencia(tipo: TipoImagenPersonaje): Blob | null {
        return this.archivos[tipo] ?? this.archivos[tipo === 'retrato' ? 'cuerpo' : 'retrato'] ?? null;
    }

    ngOnInit(): void {
        this.estadoSub = this.platformSessionSvc.estado$.subscribe(() => void this.comprobar());
        void this.leer();
    }

    ngOnChanges(changes: SimpleChanges): void {
        const anterior = changes['pj']?.previousValue as Personaje | null | undefined;
        const actual = changes['pj']?.currentValue as Personaje | null | undefined;
        if (changes['pj'] && !changes['pj'].firstChange && anterior?.Id !== actual?.Id) {
            this.error = null;
            this.conIa = null;
            this.olvidarLlegadas();
            void this.leer();
        }
    }

    // `<yosi-encargos>` lee su encargo al conectarse, quizá antes de que Angular le ponga el `id-externo`: se le pide
    // que vuelva a leerlo cuando ya lo tiene (al crearse cada botón: al saberse el dueño o cambiar el personaje).
    ngAfterViewInit(): void {
        this.botonesSub = this.botonesEncargo?.changes.subscribe(() => this.cargarBotones());
        this.cargarBotones();
    }

    ngOnDestroy(): void {
        this.estadoSub?.unsubscribe();
        this.botonesSub?.unsubscribe();
        this.olvidarUrls();
        this.olvidarLlegadas();
    }

    async leer(): Promise<void> {
        const consulta = ++this.consulta;
        const id = Number(this.pj?.Id);
        this.olvidarUrls();
        this.imagenes = { retrato: null, cuerpo: null };
        if (!(id > 0))
            return;
        try {
            const imagenes = await this.imagenesSvc.imagenes(id);
            if (consulta !== this.consulta)
                return;
            this.imagenes = imagenes;
            await Promise.all(this.tipos.map(tipo => this.descargar(tipo, consulta)));
        } catch {
            // Sin sus imágenes, el dueño aún puede subirlas.
        }
    }

    async subir(tipo: TipoImagenPersonaje, evento: Event): Promise<void> {
        const entrada = evento.target as HTMLInputElement;
        const archivo = entrada.files?.[0];
        entrada.value = '';
        if (!archivo || this.ocupado)
            return;
        await this.guardar(tipo, archivo, archivo.name);
    }

    /**
     * Ha llegado lo encargado (`yosi-encargo-entregado`, una vez por encargo y por botón; también al volver a la página
     * si aún no se había recogido): se traen las imágenes para que el dueño elija.
     */
    async alLlegarEncargo(tipo: TipoImagenPersonaje, evento: Event): Promise<void> {
        const encargo = (evento as CustomEvent<{ encargo?: EncargoPlataforma }>).detail?.encargo;
        const boton = (evento.currentTarget ?? null) as BotonDeEncargos | null;
        if (!encargo?.id || !this.esDueno || encargo.idExterno !== this.pedido(tipo).idExterno || this.llegadas[tipo]?.id === encargo.id)
            return;
        const consulta = this.consulta;
        try {
            const archivos = await this.platformSessionSvc.imagenesDelEncargo(encargo.id);
            if (consulta !== this.consulta || archivos.length < 1)
                return;
            this.olvidarLlegada(tipo);
            this.llegadas = {
                ...this.llegadas,
                [tipo]: { id: encargo.id, de: encargo.nombreDestino, boton, cerrando: false, imagenes: archivos.map(archivo => ({ archivo, url: URL.createObjectURL(archivo) })) },
            };
        } catch (error) {
            if (encargoYaCerrado(error))
                void boton?.cargar?.();
            else
                this.mostrarErrorDeEncargo(error, `No se han podido traer las imágenes de ${encargo.nombreDestino}.`);
        }
    }

    /** Usa una de las imágenes llegadas: se sube como cualquier otra y, guardada, se recoge el encargo. */
    async usarDelEncargo(tipo: TipoImagenPersonaje, archivo: Blob): Promise<void> {
        const llegada = this.llegadas[tipo];
        if (!llegada || llegada.cerrando || this.ocupado)
            return;
        if (await this.guardar(tipo, archivo, `${tipo}.webp`))
            await this.recogerEncargo(tipo);
    }

    /** No quiere ninguna: se recoge igual, para que la plataforma las borre (ecosistema-kit/ENCARGOS.md). */
    async descartarEncargo(tipo: TipoImagenPersonaje): Promise<void> {
        const llegada = this.llegadas[tipo];
        if (!llegada || llegada.cerrando || this.ocupado)
            return;
        const varias = llegada.imagenes.length > 1;
        if (!(await this.confirmar(`Se descartará${varias ? 'n las imágenes' : ' la imagen'} que ha enviado ${llegada.de}.`)))
            return;
        await this.recogerEncargo(tipo);
    }

    /** Se olvida lo llegado de un encargo de [tipo] (ya recogido, cancelado o de otro personaje). */
    olvidarLlegada(tipo: TipoImagenPersonaje): void {
        this.llegadas[tipo]?.imagenes.forEach(imagen => URL.revokeObjectURL(imagen.url));
        const { [tipo]: _, ...resto } = this.llegadas;
        this.llegadas = resto;
    }

    abrirIa(tipo: TipoImagenPersonaje): void {
        this.conIa = tipo;
        this.detalles = '';
        this.error = null;
    }

    async generar(): Promise<void> {
        const tipo = this.conIa;
        if (!tipo || this.ocupado)
            return;
        if (this.imagenes[tipo] && !(await this.confirmar(`Sustituirá ${tipo === 'retrato' ? 'el retrato' : 'la imagen de cuerpo entero'} que tiene ahora.`)))
            return;
        const modelo = this.ideasIaSvc.seleccionImagen()?.modelo;
        const detalles = this.detalles.trim();
        const hecho = await this.cambiar(tipo, () => this.imagenesSvc.generar(Number(this.pj?.Id), tipo, {
            datos: datosIdeaDePersonaje(this.pj),
            ...(detalles ? { detalles } : {}),
            ...(modelo ? { modelo } : {}),
        }));
        if (hecho)
            this.conIa = null;
    }

    async quitar(tipo: TipoImagenPersonaje): Promise<void> {
        if (this.ocupado || !(await this.confirmar(`Se quitará ${tipo === 'retrato' ? 'el retrato' : 'la imagen de cuerpo entero'} del personaje.`)))
            return;
        try {
            await this.imagenesSvc.quitar(Number(this.pj?.Id), tipo);
            this.imagenes = { ...this.imagenes, [tipo]: null };
            this.olvidarUrl(tipo);
        } catch (error) {
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido quitar la imagen.', '', 0);
        }
    }

    async comprobar(): Promise<void> {
        const consulta = ++this.consultaDeIa;
        const disponibilidad = await this.ideasIaSvc.disponibilidad();
        if (consulta === this.consultaDeIa)
            this.disponibilidad = disponibilidad;
    }

    /** Sube un archivo como imagen de [tipo] (de la persona o de un encargo). Devuelve si salió bien. */
    private async guardar(tipo: TipoImagenPersonaje, archivo: Blob, nombre: string): Promise<boolean> {
        if (archivo.size > MAX_BYTES_IMAGEN) {
            this.error = new IdeasIaError('La imagen no puede pasar de 10 MB.', 'imagen_demasiado_grande', 413);
            return false;
        }
        return this.cambiar(tipo, () => this.imagenesSvc.subir(Number(this.pj?.Id), tipo, archivo, nombre));
    }

    private async recogerEncargo(tipo: TipoImagenPersonaje): Promise<void> {
        const llegada = this.llegadas[tipo];
        if (!llegada)
            return;
        this.llegadas = { ...this.llegadas, [tipo]: { ...llegada, cerrando: true } };
        try {
            await this.platformSessionSvc.recogerEncargo(llegada.id);
        } catch (error) {
            if (!encargoYaCerrado(error)) {
                if (this.llegadas[tipo]?.id === llegada.id)
                    this.llegadas = { ...this.llegadas, [tipo]: { ...llegada, cerrando: false } };
                this.mostrarErrorDeEncargo(error, 'No se ha podido cerrar el encargo. Inténtalo de nuevo.');
                return;
            }
        }
        if (this.llegadas[tipo]?.id === llegada.id)
            this.olvidarLlegada(tipo);
        void llegada.boton?.cargar?.();
    }

    /** Los errores del SDK (y `CAMBIO_DE_IDENTIDAD`) traen `code` y una frase para la persona; sin ellos, [porDefecto]. */
    private mostrarErrorDeEncargo(error: unknown, porDefecto: string): void {
        const code = `${(error as { code?: unknown })?.code ?? ''}`;
        const mensaje = error instanceof Error && code && error.message ? error.message : porDefecto;
        this.error = new IdeasIaError(mensaje, code, Number((error as { status?: unknown })?.status) || 0);
    }

    private cargarBotones(): void {
        this.botonesEncargo?.forEach(boton => void boton.nativeElement.cargar?.());
    }

    /** Sube o genera la imagen de [tipo] y la enseña. Devuelve si salió bien. */
    private async cambiar(tipo: TipoImagenPersonaje, accion: () => Promise<ImagenesPersonaje[TipoImagenPersonaje]>): Promise<boolean> {
        this.ocupado = tipo;
        this.error = null;
        try {
            const imagen = await accion();
            this.imagenes = { ...this.imagenes, [tipo]: imagen };
            this.olvidarUrl(tipo);
            await this.descargar(tipo, this.consulta);
            return true;
        } catch (error) {
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido guardar la imagen.', '', 0);
            if (this.error.esDeLaClave)
                void this.comprobar();
            return false;
        } finally {
            this.ocupado = null;
        }
    }

    private async descargar(tipo: TipoImagenPersonaje, consulta: number): Promise<void> {
        const imagen = this.imagenes[tipo];
        if (!imagen)
            return;
        try {
            const archivo = await this.imagenesSvc.archivo(imagen.imagen);
            if (consulta === this.consulta && this.imagenes[tipo] === imagen) {
                this.urls = { ...this.urls, [tipo]: URL.createObjectURL(archivo) };
                this.archivos = { ...this.archivos, [tipo]: archivo };
            }
        } catch {
            // Se queda el hueco vacío.
        }
    }

    private async confirmar(texto: string): Promise<boolean> {
        const respuesta = await Swal.fire({
            icon: 'question',
            title: '¿Seguro?',
            text: texto,
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'Cancelar',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
        return respuesta.isConfirmed;
    }

    private olvidarUrl(tipo: TipoImagenPersonaje): void {
        const url = this.urls[tipo];
        if (url)
            URL.revokeObjectURL(url);
        const { [tipo]: _, ...resto } = this.urls;
        this.urls = resto;
        const { [tipo]: __, ...archivos } = this.archivos;
        this.archivos = archivos;
    }

    private olvidarUrls(): void {
        this.tipos.forEach(tipo => this.olvidarUrl(tipo));
    }

    private olvidarLlegadas(): void {
        this.tipos.forEach(tipo => this.olvidarLlegada(tipo));
    }
}

function encargoYaCerrado(error: unknown): boolean {
    return ENCARGO_YA_CERRADO.includes(`${(error as { code?: unknown })?.code ?? ''}`);
}
