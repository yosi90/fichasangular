import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { DadosService, EstadoDados } from 'src/app/services/dados.service';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import {
    DADOS_FILA,
    DadoFila,
    MAXIMO_BONIFICADOR,
    ResultadoTirada,
    desgloseTirada,
    etiquetaDado,
    expresionTirada,
    horaTirada,
    textoTotal,
    tieneDados,
    tiradaConAlgo,
} from 'src/app/services/utils/dados';

/** Por debajo de este ancho de la pestaña, una sola columna y los dados pequeños (lienzo: «Móvil (< 768 px)»). */
export const ANCHO_COMPACTO_DADOS = 768;

/** Un resultado ya en texto: el último (con los dados en el desglose) o una fila del historial (sin ellos). */
interface ResultadoVisible {
    readonly expresion: string;
    readonly desglose: string;
    readonly total: string;
    readonly hora: string;
    /** 20 o 1 en una tirada de un solo d20; si no, `null`. */
    readonly natural: 20 | 1 | null;
}

function resultadoVisible(resultado: ResultadoTirada, conDados: boolean): ResultadoVisible {
    return {
        expresion: resultado.expresion,
        desglose: desgloseTirada(resultado, conDados),
        total: textoTotal(resultado.total),
        hora: horaTirada(resultado.fecha),
        natural: resultado.natural === 20 || resultado.natural === 1 ? resultado.natural : null,
    };
}

/**
 * La pestaña «Dados» (lienzo «Dados: Companion y web», aprobado por el propietario el 2026-10-30): se prepara una tirada
 * con la fila de dados y el bonificador, se tira en el navegador y se apunta en el historial de la sesión. El estado vive
 * en `DadosService`, así que sigue al cambiar de pestaña. Intro tira y Escape limpia solo con el foco dentro de la
 * pestaña (la raíz lo recibe al abrirla y al pulsar en ella): no hay atajos globales.
 */
@Component({
    selector: 'app-dados',
    templateUrl: './dados.component.html',
    styleUrls: ['./dados.component.sass'],
    standalone: false
})
export class DadosComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('raiz', { static: true }) raiz!: ElementRef<HTMLElement>;

    readonly dados = DADOS_FILA;
    readonly maximoBonificador = MAXIMO_BONIFICADOR;

    estado: EstadoDados;
    expresion = '';
    bonificador = '+0';
    conDados = false;
    conAlgo = false;
    ultimo: ResultadoVisible | null = null;
    historial: ResultadoVisible[] = [];
    /** La pestaña mide menos de 768 px: una columna y los dados de 44 × 48. */
    compacto = false;

    private suscripcion: Subscription | null = null;
    private observador: ResizeObserver | null = null;

    constructor(private dadosSvc: DadosService, private zone: NgZone) {
        this.estado = dadosSvc.estado;
    }

    ngOnInit(): void {
        this.suscripcion = this.dadosSvc.estado$.subscribe((estado) => this.pintar(estado));
        this.medir();
    }

    ngAfterViewInit(): void {
        // Al abrir la pestaña, el foco entra en ella para que Intro y Escape funcionen sin pulsar antes.
        this.enfocarRaiz();
    }

    /** «Limpiar» y «Borrar historial» desaparecen al pulsarlos: el foco vuelve a la pestaña y no se pierde. */
    enfocarRaiz(): void {
        this.raiz.nativeElement.focus({ preventScroll: true });
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
        this.observador?.disconnect();
    }

    cantidad(dado: DadoFila): number {
        return this.estado.tirada.reserva[dado.caras];
    }

    etiqueta(dado: DadoFila): string {
        return etiquetaDado(dado, this.cantidad(dado));
    }

    anadir(dado: DadoFila): void {
        this.dadosSvc.anadir(dado.caras);
    }

    /** Clic derecho: quita uno (y no abre el menú del navegador). */
    quitar(dado: DadoFila, evento: Event): void {
        evento.preventDefault();
        this.dadosSvc.quitar(dado.caras);
    }

    cambiarBonificador(cambio: number): void {
        this.dadosSvc.cambiarBonificador(cambio);
    }

    limpiar(): void {
        this.dadosSvc.limpiar();
    }

    tirar(): void {
        this.dadosSvc.tirar();
    }

    borrarHistorial(): void {
        this.dadosSvc.borrarHistorial();
    }

    /**
     * Intro tira (también con el foco en un dado o en el bonificador, que si no añadirían otro) y Escape limpia. En
     * «Tirar», «Limpiar» y «Borrar historial» Intro hace lo de su botón. Si no hay nada que limpiar, Escape sigue su
     * camino y cierra la pestaña, como en las demás.
     */
    alPulsarTecla(evento: KeyboardEvent): void {
        if (evento.defaultPrevented || evento.altKey || evento.ctrlKey || evento.metaKey)
            return;
        if (evento.key === 'Enter') {
            const objetivo = evento.target as HTMLElement | null;
            if (objetivo?.closest?.('[data-intro-nativo]'))
                return;
            evento.preventDefault();
            if (!evento.repeat)
                this.tirar();
        } else if (evento.key === 'Escape' && this.conAlgo) {
            evento.preventDefault();
            evento.stopPropagation();
            this.limpiar();
        }
    }

    trackDado(_: number, dado: DadoFila): number {
        return dado.caras;
    }

    /** La misma fila conserva su clave aunque entren tiradas nuevas por arriba (`trackBy` se llama sin `this`). */
    readonly trackFila = (indice: number): number => this.historial.length - indice;

    private pintar(estado: EstadoDados): void {
        this.estado = estado;
        this.expresion = expresionTirada(estado.tirada);
        this.bonificador = textoConSigno(estado.tirada.bonificador, '−');
        this.conDados = tieneDados(estado.tirada);
        this.conAlgo = tiradaConAlgo(estado.tirada);
        this.ultimo = estado.ultimo ? resultadoVisible(estado.ultimo, true) : null;
        this.historial = estado.historial.map((resultado) => resultadoVisible(resultado, false));
    }

    /** Se mide la pestaña, no la ventana: en el escritorio el menú lateral se come 250 px. */
    private medir(): void {
        const elemento = this.raiz.nativeElement;
        this.compacto = elemento.clientWidth > 0 && elemento.clientWidth < ANCHO_COMPACTO_DADOS;
        if (typeof ResizeObserver === 'undefined')
            return;
        this.observador = new ResizeObserver((entradas) => {
            const ancho = entradas[0]?.contentRect.width ?? 0;
            const compacto = ancho > 0 && ancho < ANCHO_COMPACTO_DADOS;
            if (compacto !== this.compacto)
                this.zone.run(() => this.compacto = compacto);
        });
        this.observador.observe(elemento);
    }
}
