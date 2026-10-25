import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Personaje } from 'src/app/interfaces/personaje';
import { datosIdeaDePersonaje, DisponibilidadIa, IdeasIaError, IdeasIaService, MAX_DETALLES_IMAGEN_IA } from 'src/app/services/ideas-ia.service';
import {
    ImagenesPersonaje,
    ImagenesPersonajeService,
    MAX_BYTES_IMAGEN,
    TIPOS_IMAGEN_PERSONAJE,
    TipoImagenPersonaje,
} from 'src/app/services/imagenes-personaje.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import Swal from 'sweetalert2';

const NOMBRES: Record<TipoImagenPersonaje, string> = { retrato: 'Retrato', cuerpo: 'Cuerpo entero' };

/**
 * Las imágenes del personaje (propietario, 2026-10-23): un retrato y una de cuerpo entero, que ve quien ve la ficha.
 * Lo principal es que su dueño las suba; generarlas con IA (OpenAI, con su clave) es una opción, con detalles de su
 * aspecto si quiere. La API las deja todas en WebP con las mismas medidas. Nadie más las cambia.
 */
@Component({
    selector: 'app-imagenes-personaje',
    templateUrl: './imagenes-personaje.component.html',
    styleUrls: ['./ideas-ia.component.sass'],
    standalone: false
})
export class ImagenesPersonajeComponent implements OnInit, OnChanges, OnDestroy {
    @Input() pj: Personaje | null = null;

    readonly tipos = TIPOS_IMAGEN_PERSONAJE;
    imagenes: ImagenesPersonaje = { retrato: null, cuerpo: null };
    /** La dirección `blob:` de cada imagen descargada. */
    urls: Partial<Record<TipoImagenPersonaje, string>> = {};
    disponibilidad: DisponibilidadIa = 'sin_sesion';
    /** El tipo con el panel de «Con IA» abierto. */
    conIa: TipoImagenPersonaje | null = null;
    detalles = '';
    readonly maxDetalles = MAX_DETALLES_IMAGEN_IA;
    /** El tipo que se está subiendo o generando. */
    ocupado: TipoImagenPersonaje | null = null;
    error: IdeasIaError | null = null;

    private estadoSub?: Subscription;
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
            void this.leer();
        }
    }

    ngOnDestroy(): void {
        this.estadoSub?.unsubscribe();
        this.olvidarUrls();
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
        if (archivo.size > MAX_BYTES_IMAGEN) {
            this.error = new IdeasIaError('La imagen no puede pasar de 10 MB.', 'imagen_demasiado_grande', 413);
            return;
        }
        await this.cambiar(tipo, () => this.imagenesSvc.subir(Number(this.pj?.Id), tipo, archivo, archivo.name));
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
            if (consulta === this.consulta && this.imagenes[tipo] === imagen)
                this.urls = { ...this.urls, [tipo]: URL.createObjectURL(archivo) };
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
    }

    private olvidarUrls(): void {
        this.tipos.forEach(tipo => this.olvidarUrl(tipo));
    }
}
