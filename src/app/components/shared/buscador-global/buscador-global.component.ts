import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Injectable, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription, combineLatest } from 'rxjs';
import { BuscadorGlobalService } from 'src/app/services/buscador-global.service';
import {
    ElementoBusqueda, FuenteBusqueda, GrupoResultados, LETRAS_MINIMAS_BUSQUEDA, buscarEnFuentes, textoVerTodos,
} from 'src/app/services/utils/busqueda-global';
import { iconoRol } from 'src/app/services/utils/iconos-rol';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

/** Una fila que se puede elegir con el teclado: un resultado o «Ver los N en el listado». */
interface OpcionBuscador {
    readonly id: string;
    readonly activar: () => void;
}

interface GrupoPintado {
    readonly grupo: GrupoResultados;
    readonly elementos: readonly { elemento: ElementoBusqueda; indice: number }[];
    readonly verTodos: { texto: string; indice: number } | null;
}

/**
 * La ventana de la búsqueda global (lienzo «Rol: las vistas que faltan», vista 5): un campo (combobox) y los
 * resultados agrupados por tipo, con su icono. ↑ ↓ mueven, Intro abre, Esc cierra; el foco se queda en el campo.
 */
@Component({
    selector: 'app-buscador-global',
    templateUrl: './buscador-global.component.html',
    styleUrls: ['./buscador-global.component.sass'],
    standalone: false
})
export class BuscadorGlobalComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('campo', { static: true }) campo!: ElementRef<HTMLInputElement>;
    @ViewChild('resultados', { static: true }) resultados!: ElementRef<HTMLElement>;

    texto = '';
    grupos: GrupoPintado[] = [];
    opciones: OpcionBuscador[] = [];
    activa = 0;
    mensaje = '';
    /** Lo que oye el lector de pantalla al cambiar los resultados. */
    anuncio = '';

    private fuentes: FuenteBusqueda[] = [];
    private objetos: FuenteBusqueda | null = null;
    private suscripcion?: Subscription;

    constructor(
        private buscador: BuscadorGlobalService,
        private ventana: BuscadorGlobalVentanaService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.buscador.cargarFuentes();
        this.suscripcion = combineLatest([this.buscador.fuentes$, this.buscador.objetos$]).subscribe(([fuentes, objetos]) => {
            this.fuentes = fuentes;
            this.objetos = objetos;
            this.recalcular(false);
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.campo.nativeElement.focus());
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
        this.buscador.buscarTexto('');
    }

    get idActiva(): string | null {
        return this.opciones[this.activa]?.id ?? null;
    }

    alEscribir(texto: string): void {
        this.texto = texto;
        this.buscador.buscarTexto(texto);
        this.recalcular(true);
    }

    alPulsarTecla(evento: KeyboardEvent): void {
        const total = this.opciones.length;
        if (evento.key === 'ArrowDown') {
            if (total > 0)
                this.marcar((this.activa + 1) % total);
        } else if (evento.key === 'ArrowUp') {
            if (total > 0)
                this.marcar((this.activa - 1 + total) % total);
        } else if (evento.key === 'Enter') {
            this.opciones[this.activa]?.activar();
        } else if (evento.key === 'Escape') {
            this.ventana.cerrar();
        } else if (evento.key === 'Tab') {
            // El foco se queda en el campo: la ventana solo tiene ese sitio para el teclado.
        } else
            return;
        evento.preventDefault();
        evento.stopPropagation();
    }

    marcar(indice: number): void {
        if (indice === this.activa)
            return;
        this.activa = indice;
        this.cdr.detectChanges();
        const id = this.idActiva;
        if (id)
            this.resultados.nativeElement.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ block: 'nearest' });
    }

    cerrar(): void {
        this.ventana.cerrar();
    }

    /** El icono (y su grupo de color) de un tipo, para el título de cada grupo. */
    readonly iconoDe = iconoRol;

    private recalcular(reiniciarActiva: boolean): void {
        const fuentes = this.conObjetos();
        const grupos = buscarEnFuentes(this.texto, fuentes);
        const opciones: OpcionBuscador[] = [];
        this.grupos = grupos.map((grupo) => {
            const elementos = grupo.elementos.map((elemento) => {
                const indice = opciones.push({ id: this.idOpcion(elemento.clave), activar: () => this.activarElemento(elemento) }) - 1;
                return { elemento, indice };
            });
            const texto = textoVerTodos(grupo);
            let verTodos: GrupoPintado['verTodos'] = null;
            if (texto && grupo.lista) {
                const lista = grupo.lista;
                verTodos = { texto, indice: opciones.push({ id: this.idOpcion(`todos:${grupo.id}`), activar: () => this.verTodos(lista) }) - 1 };
            }
            return { grupo, elementos, verTodos };
        });
        this.opciones = opciones;
        if (reiniciarActiva || this.activa >= opciones.length)
            this.activa = 0;
        this.mensaje = this.mensajeEstado();
        const resultados = grupos.reduce((suma, grupo) => suma + grupo.elementos.length, 0);
        this.anuncio = this.mensaje || `${resultados} ${resultados === 1 ? 'resultado' : 'resultados'}`;
    }

    /** Los objetos los busca la API: su grupo va detrás de los conjuntos (o al final). */
    private conObjetos(): FuenteBusqueda[] {
        if (!this.objetos)
            return this.fuentes;
        const fuentes = [...this.fuentes];
        const conjuntos = fuentes.findIndex((fuente) => fuente.id === 'conjuntos');
        fuentes.splice(conjuntos >= 0 ? conjuntos + 1 : fuentes.length, 0, this.objetos);
        return fuentes;
    }

    private mensajeEstado(): string {
        const escrito = normalizarTexto(this.texto, true);
        if (escrito.length < LETRAS_MINIMAS_BUSQUEDA)
            return 'Escribe al menos dos letras';
        if (this.grupos.length < 1)
            return this.fuentes.some((fuente) => fuente.estado === 'cargando') ? 'Cargando…' : `Nada con «${this.texto.trim()}»`;
        return '';
    }

    private idOpcion(clave: string): string {
        return `buscador-global-${normalizarTexto(clave).replace(/[^a-z0-9]+/g, '-')}`;
    }

    private activarElemento(elemento: ElementoBusqueda): void {
        this.ventana.cerrar();
        elemento.abrir();
    }

    private verTodos(lista: string): void {
        this.ventana.cerrar();
        this.buscador.abrirListado(lista, this.texto.trim());
    }
}

/**
 * Abre y cierra la ventana de la búsqueda global en un overlay de CDK (640 px, a 12 vh de arriba, fondo oscuro).
 * Al cerrarla, el foco vuelve a donde estaba.
 */
@Injectable({
    providedIn: 'root'
})
export class BuscadorGlobalVentanaService {
    private overlayRef: OverlayRef | null = null;
    private focoAnterior: HTMLElement | null = null;

    constructor(private overlay: Overlay, private injector: Injector) { }

    get abierta(): boolean {
        return this.overlayRef !== null;
    }

    alternar(): void {
        if (this.abierta)
            this.cerrar();
        else
            this.abrir();
    }

    abrir(): void {
        if (this.overlayRef)
            return;
        this.focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.overlayRef = this.overlay.create({
            hasBackdrop: true,
            backdropClass: 'buscador-global-fondo',
            panelClass: 'buscador-global-panel',
            positionStrategy: this.overlay.position().global().centerHorizontally().top('12vh'),
            scrollStrategy: this.overlay.scrollStrategies.block(),
            width: 640,
            maxWidth: 'calc(100vw - 16px)',
        });
        this.overlayRef.backdropClick().subscribe(() => this.cerrar());
        this.overlayRef.attach(new ComponentPortal(BuscadorGlobalComponent, null, this.injector));
    }

    cerrar(): void {
        if (!this.overlayRef)
            return;
        this.overlayRef.dispose();
        this.overlayRef = null;
        const foco = this.focoAnterior;
        this.focoAnterior = null;
        if (foco?.isConnected)
            foco.focus();
    }
}
