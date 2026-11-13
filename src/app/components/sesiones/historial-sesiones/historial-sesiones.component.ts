import { NgComponentOutlet } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, Type } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Clase } from 'src/app/interfaces/clase';
import { Personaje } from 'src/app/interfaces/personaje';
import { ExperienciaPersonaje, HistorialSesiones, MAXIMO_TITULO_SESION, RespuestaSesion, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { SesionesService } from 'src/app/services/sesiones.service';
import { DatosLibresComponent } from '../datos-libres/datos-libres.component';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { cambiosSesion, fechaSesion, tituloSesion } from 'src/app/services/utils/sesiones-texto';
import { toNumber } from 'src/app/services/utils/normalizacion';

/** Lo que recibe el panel de la sesión abierta (con carga diferida): ver `SesionPanelComponent`. */
type EntradasPanel = {
    pj: Personaje;
    clases: Clase[];
    sesion: SesionPersonaje;
    puedeApuntar: boolean;
    veNotas: boolean;
    experiencia: ExperienciaPersonaje | null;
    alCambiar: (respuesta: RespuestaSesion) => void;
    alSalir: () => void;
};

/** Una sesión como se pinta en la lista. */
interface FilaSesion {
    sesion: SesionPersonaje;
    titulo: string;
    fecha: string;
    /** «+3.000 PX · +45 po», de su resumen (lo que se ve plegada en el móvil). */
    cambios: string;
    abierta: boolean;
    /** La sesión de juego abierta (no la 0): la de «Seguir la sesión». */
    deJuego: boolean;
    /** Las frases de sus eventos (las de la API, tal cual); si no tiene, su relato. */
    lineas: string[];
    puedeReabrir: boolean;
}

/**
 * La pestaña «Historial» de la ficha (lienzo de sesiones, pantallas 1 y 5): la sesión de juego abierta arriba con
 * «Seguir la sesión», después las cerradas de la más nueva a la más vieja con su relato (una línea por evento) y, al
 * final, la sesión 0. «Nueva sesión» (título y fecha opcionales) si no hay ninguna de juego abierta y se puede apuntar.
 * Cada sesión lleva «Ver la ficha en esta sesión». Las notas, solo si las ve (`veNotas`). En el móvil, las cerradas van
 * plegadas. Se carga con carga diferida al abrir la pestaña, y el panel de la sesión abierta, al seguirla.
 */
@Component({
    selector: 'app-historial-sesiones',
    templateUrl: './historial-sesiones.component.html',
    styleUrls: ['./historial-sesiones.component.sass'],
    imports: [FormsModule, MatButtonModule, MatIconModule, MatTooltipModule, NgComponentOutlet, DatosLibresComponent],
})
export class HistorialSesionesComponent implements OnInit, OnChanges, OnDestroy {
    /** La ficha de ahora (la vuelve a leer la ficha tras cada cambio). */
    @Input() pj!: Personaje;
    /** El catálogo de clases (para los libros de conjuros del panel). */
    @Input() clases: Clase[] = [];
    /** Tras cada escritura: los PX de ahora, para la barra de la ficha (que además vuelve a leer la ficha). */
    @Input() alCambiar: (experiencia: ExperienciaPersonaje | null) => void = () => undefined;
    /** «Ver la ficha en esta sesión»: el número y la última, para las flechas. */
    @Input() alVerVersion: (numero: number, ultima: number) => void = () => undefined;

    readonly maximoTitulo = MAXIMO_TITULO_SESION;

    cargando = true;
    error = '';
    datos: HistorialSesiones | null = null;
    filas: FilaSesion[] = [];
    /** Las plegables (móvil) que se han desplegado. */
    desplegadas = new Set<number>();

    nuevaAbierta = false;
    nuevaTitulo = '';
    nuevaFecha = '';
    abriendo = false;
    errorNueva = '';
    reabriendo = false;

    panelComponente: Type<unknown> | null = null;
    panelEntradas: EntradasPanel | null = null;

    private subidasSub?: Subscription;

    constructor(
        private sesionesSvc: SesionesService,
        private puertaSubida: SubidaNivelPuertaService,
    ) { }

    ngOnInit(): void {
        this.subidasSub = this.puertaSubida.subidasHechas$.subscribe((id) => {
            if (id === this.idPersonaje)
                void this.cargar();
        });
        void this.cargar();
    }

    /** La ficha vuelta a leer llega también al panel (su equipo, su dinero, sus clases). */
    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['pj'] || changes['clases']) && this.panelEntradas)
            this.panelEntradas = { ...this.panelEntradas, pj: this.pj, clases: this.clases };
    }

    ngOnDestroy(): void {
        this.subidasSub?.unsubscribe();
    }

    get idPersonaje(): number {
        return toNumber(this.pj?.Id);
    }

    get puedeApuntar(): boolean {
        return !!this.datos?.puedeApuntar;
    }

    /** La sesión de juego abierta (la 0 abierta no cuenta: no admite eventos). */
    get abiertaDeJuego(): SesionPersonaje | null {
        return this.datos?.sesiones.find((sesion) => sesion.estado === 'abierta' && sesion.numero > 0) ?? null;
    }

    /** «Corregir la ficha» (fase 6): quien apunta, con una sesión abierta (la de juego o la 0, donde queda la corrección). */
    get puedeCorregir(): boolean {
        return this.puedeApuntar && !!this.datos?.sesiones.some((sesion) => sesion.estado === 'abierta');
    }

    corregir(): void {
        this.puertaSubida.solicitarCorreccion(this.idPersonaje);
    }

    /** «Adquirir una plantilla» (fase 7): quien apunta, con una sesión de juego abierta (en la 0 se eligen al crear). */
    get puedeAdquirirPlantilla(): boolean {
        return this.puedeApuntar && !!this.abiertaDeJuego;
    }

    adquirirPlantilla(): void {
        this.puertaSubida.solicitarPlantilla(this.idPersonaje);
    }

    /** «Perder un nivel» (fase 7, segunda tanda): quien apunta, con una sesión de juego abierta, como la plantilla. */
    perderNivel(): void {
        this.puertaSubida.solicitarPerdida(this.idPersonaje);
    }

    /** Los datos libres (fase 6): el formulario se abre aquí mismo. */
    datosAbiertos = false;

    readonly alTerminarDatos = (guardado: boolean): void => {
        this.datosAbiertos = false;
        if (guardado)
            this.puertaSubida.subidaHecha(this.idPersonaje);
    };

    get puedeAbrirNueva(): boolean {
        return this.puedeApuntar && this.abiertaDeJuego === null;
    }

    /** Si abrir la siguiente cierra la compra inicial (la sesión 0 sigue abierta). */
    get cierraCompraInicial(): boolean {
        return !!this.datos?.sesiones.some((sesion) => sesion.numero === 0 && sesion.estado === 'abierta');
    }

    get enElPanel(): boolean {
        return this.panelEntradas !== null;
    }

    async cargar(): Promise<void> {
        this.cargando = this.datos === null;
        this.error = '';
        try {
            this.ponerDatos(await this.sesionesSvc.historial(this.idPersonaje));
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido cargar el historial.';
        } finally {
            this.cargando = false;
        }
        if (this.panelEntradas) {
            const sesion = this.datos?.sesiones.find((s) => s.numero === this.panelEntradas!.sesion.numero && s.estado === 'abierta');
            if (sesion)
                this.panelEntradas = { ...this.panelEntradas, sesion, pj: this.pj, experiencia: this.datos?.experiencia ?? null };
            else
                this.salirDelPanel(false);
        }
    }

    alternar(numero: number): void {
        if (this.desplegadas.has(numero))
            this.desplegadas.delete(numero);
        else
            this.desplegadas.add(numero);
    }

    verVersion(fila: FilaSesion): void {
        const ultima = Math.max(0, ...(this.datos?.sesiones ?? []).map((sesion) => sesion.numero));
        this.alVerVersion(fila.sesion.numero, ultima);
    }

    mostrarNueva(): void {
        this.nuevaAbierta = true;
        this.errorNueva = '';
    }

    cancelarNueva(): void {
        this.nuevaAbierta = false;
        this.nuevaTitulo = '';
        this.nuevaFecha = '';
        this.errorNueva = '';
    }

    /** «Nueva sesión»: abre la siguiente (con el título y la fecha, si se ponen) y entra en su panel. */
    async abrirNueva(): Promise<void> {
        if (!this.puedeAbrirNueva || this.abriendo)
            return;
        const titulo = this.nuevaTitulo.trim();
        if (titulo.length > MAXIMO_TITULO_SESION) {
            this.errorNueva = `El título puede tener como mucho ${MAXIMO_TITULO_SESION} caracteres.`;
            return;
        }
        this.abriendo = true;
        this.errorNueva = '';
        try {
            const respuesta = await this.sesionesSvc.abrir(this.idPersonaje, {
                ...(titulo ? { titulo } : {}),
                ...(this.nuevaFecha ? { fechaJuego: this.nuevaFecha } : {}),
            });
            this.cancelarNueva();
            this.alCambiar(respuesta.experiencia);
            await this.cargar();
            const abierta = this.datos?.sesiones.find((sesion) => sesion.numero === respuesta.sesion.numero) ?? respuesta.sesion;
            await this.seguir(abierta);
        } catch (error: any) {
            this.errorNueva = `${error?.message ?? ''}`.trim() || 'No se ha podido abrir la sesión.';
        } finally {
            this.abriendo = false;
        }
    }

    /** «Reabrir»: la última sesión, si está cerrada y no hay otra abierta. */
    async reabrir(fila: FilaSesion): Promise<void> {
        if (!fila.puedeReabrir || this.reabriendo)
            return;
        const confirmacion = await Swal.fire({
            icon: 'question',
            title: `¿Reabrir la sesión ${fila.sesion.numero}?`,
            text: fila.sesion.numero === 0
                ? 'Se vuelve a abrir la compra inicial.'
                : 'Podrás apuntar y deshacer en ella otra vez; su versión se guarda de nuevo al cerrarla.',
            showCancelButton: true,
            confirmButtonText: 'Reabrir',
            cancelButtonText: 'Cancelar',
            target: document.body,
            heightAuto: false,
            scrollbarPadding: false,
        });
        if (!confirmacion.isConfirmed)
            return;
        this.reabriendo = true;
        try {
            const respuesta = await this.sesionesSvc.reabrir(this.idPersonaje, fila.sesion);
            this.alCambiar(respuesta.experiencia);
            await this.cargar();
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido reabrir la sesión.';
        } finally {
            this.reabriendo = false;
        }
    }

    /** «Seguir la sesión»: el panel de la sesión abierta (se carga la primera vez). */
    async seguir(sesion: SesionPersonaje): Promise<void> {
        if (!this.panelComponente) {
            const { SesionPanelComponent } = await import('src/app/components/sesiones/sesion-panel/sesion-panel.component');
            this.panelComponente = SesionPanelComponent;
        }
        this.panelEntradas = {
            pj: this.pj,
            clases: this.clases,
            sesion,
            puedeApuntar: this.puedeApuntar,
            veNotas: !!this.datos?.veNotas,
            experiencia: this.datos?.experiencia ?? this.pj?.ExperienciaSesiones ?? null,
            alCambiar: this.alCambiarPanel,
            alSalir: this.alSalirPanel,
        };
    }

    salirDelPanel(recargar: boolean = true): void {
        this.panelEntradas = null;
        if (recargar)
            void this.cargar();
    }

    trackFila(_indice: number, fila: FilaSesion): number {
        return fila.sesion.numero;
    }

    /** Lo que apunta el panel: la sesión al día en la lista y los PX en la ficha. */
    private readonly alCambiarPanel = (respuesta: RespuestaSesion): void => {
        if (this.datos) {
            const sesiones = this.datos.sesiones.map((sesion) => sesion.numero === respuesta.sesion.numero ? respuesta.sesion : sesion);
            this.ponerDatos({ ...this.datos, sesiones, experiencia: respuesta.experiencia ?? this.datos.experiencia });
        }
        if (this.panelEntradas)
            this.panelEntradas = { ...this.panelEntradas, sesion: respuesta.sesion, experiencia: respuesta.experiencia ?? this.panelEntradas.experiencia };
        this.alCambiar(respuesta.experiencia);
    };

    private readonly alSalirPanel = (): void => this.salirDelPanel();

    private ponerDatos(datos: HistorialSesiones): void {
        this.datos = datos;
        const ultima = Math.max(0, ...datos.sesiones.map((sesion) => sesion.numero));
        const hayAbierta = datos.sesiones.some((sesion) => sesion.estado === 'abierta');
        // La de juego abierta arriba; las demás, de la más nueva a la más vieja (la 0, al final).
        this.filas = [...datos.sesiones]
            .sort((a, b) => Number(b.estado === 'abierta' && b.numero > 0) - Number(a.estado === 'abierta' && a.numero > 0) || b.numero - a.numero)
            .map((sesion) => ({
                sesion,
                titulo: tituloSesion(sesion),
                fecha: fechaSesion(sesion),
                cambios: cambiosSesion(sesion.resumen),
                abierta: sesion.estado === 'abierta',
                deJuego: sesion.estado === 'abierta' && sesion.numero > 0,
                lineas: sesion.eventos.length > 0 ? sesion.eventos.map((evento) => evento.texto).filter(Boolean) : [sesion.relato].filter(Boolean),
                puedeReabrir: datos.puedeApuntar && !hayAbierta && sesion.estado === 'cerrada' && sesion.numero === ultima,
            }));
    }
}
