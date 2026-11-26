import { NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TemaWebService } from 'src/app/services/tema-web/tema-web.service';
import { MODOS_WEB, ModoWeb, TEMAS_WEB, TemaWeb, definicionTema } from 'src/app/services/tema-web/temas-web';

export const AVISO_ELEGIR_TEMA = 'Elige un tema para seguir: puedes cambiarlo cuando quieras.';
export const AVISO_TEMA_SIN_GUARDAR = 'No se ha podido guardar en tu cuenta: el tema se queda en este navegador y se guardará la próxima vez.';

/**
 * La ventana de los temas: la bienvenida (una vez, a toda cuenta sin tema; no se cierra sin elegir) y la de Opciones →
 * Tema y modo. Un `<dialog>` modal nativo (Modern Web Guidance, «dialog»): el navegador pone el foco, el fondo inerte y
 * el Esc; en la bienvenida, `closedby="none"` y el `cancel` se para, y si aun así se cerrase (un navegador sin
 * `closedby`), se vuelve a abrir. Se carga bajo demanda (`VentanaTemaService`).
 */
@Component({
    selector: 'app-ventana-tema',
    imports: [NgFor, NgIf, MatIconModule],
    templateUrl: './ventana-tema.component.html',
    styleUrls: ['./ventana-tema.component.sass'],
})
export class VentanaTemaComponent implements AfterViewInit {
    @Input() bienvenida = false;
    @Output() readonly cerrada = new EventEmitter<void>();
    @ViewChild('dialogo', { static: true }) dialogo!: ElementRef<HTMLDialogElement>;

    readonly temas = TEMAS_WEB;
    readonly modos = MODOS_WEB;
    seleccion: TemaWeb;
    aviso = '';
    guardando = false;
    private elegido = false;

    constructor(private temaWeb: TemaWebService) {
        this.seleccion = temaWeb.estado.tema;
    }

    get modo(): ModoWeb {
        return this.temaWeb.estado.modo;
    }

    get claroListo(): boolean {
        return definicionTema(this.seleccion).claroListo;
    }

    ngAfterViewInit(): void {
        this.abrir();
    }

    async seleccionar(tema: TemaWeb): Promise<void> {
        this.seleccion = tema;
        this.aviso = '';
        if (this.bienvenida) {
            this.temaWeb.previsualizar(tema);
            return;
        }
        await this.guardar(tema);
    }

    elegirModo(modo: ModoWeb): void {
        this.temaWeb.elegirModo(modo);
    }

    async confirmar(): Promise<void> {
        if (this.bienvenida) {
            this.elegido = true;
            await this.guardar(this.seleccion);
        }
        this.cerrar();
    }

    cerrar(): void {
        if (this.dialogo.nativeElement.open)
            this.dialogo.nativeElement.close();
        else
            this.alCerrar();
    }

    /** Esc o el gesto atrás: en la bienvenida no cierran, y se dice por qué. */
    alCancelar(evento: Event): void {
        if (!this.bienvenida)
            return;
        evento.preventDefault();
        this.aviso = AVISO_ELEGIR_TEMA;
    }

    alCerrar(): void {
        if (this.bienvenida && !this.elegido) {
            this.aviso = AVISO_ELEGIR_TEMA;
            this.abrir();
            return;
        }
        this.cerrada.emit();
    }

    private abrir(): void {
        const dialogo = this.dialogo.nativeElement;
        if (!dialogo.open && typeof dialogo.showModal === 'function')
            dialogo.showModal();
    }

    private async guardar(tema: TemaWeb): Promise<void> {
        this.guardando = true;
        try {
            await this.temaWeb.elegirTema(tema);
        } catch {
            this.aviso = AVISO_TEMA_SIN_GUARDAR;
        } finally {
            this.guardando = false;
        }
    }
}
