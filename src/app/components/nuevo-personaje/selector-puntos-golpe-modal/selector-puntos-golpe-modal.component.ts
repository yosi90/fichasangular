import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ResultadoCalculoVidaFinal } from 'src/app/services/nuevo-personaje.service';
import { esElementoInteractivoParaEnter } from 'src/app/services/utils/teclado';
import { MAX_TIRADAS_PUNTOS_GOLPE } from 'src/app/services/utils/puntos-golpe';

@Component({
    selector: 'app-selector-puntos-golpe-modal',
    templateUrl: './selector-puntos-golpe-modal.component.html',
    styleUrls: ['./selector-puntos-golpe-modal.component.sass'],
    standalone: false
})
export class SelectorPuntosGolpeModalComponent {
    @Input() resultado: ResultadoCalculoVidaFinal | null = null;
    @Input() tiradasRestantes = 0;
    @Input() tiradasTotales = MAX_TIRADAS_PUNTOS_GOLPE;

    @Output() recalcular = new EventEmitter<void>();
    @Output() siguiente = new EventEmitter<void>();
    @Output() cerrar = new EventEmitter<void>();

    get total(): number {
        return Math.max(0, Math.trunc(Number(this.resultado?.total ?? 0)));
    }

    get maximo(): number {
        return Math.max(0, Math.trunc(Number(this.resultado?.maximo ?? 0)));
    }

    get puedeRecalcular(): boolean {
        return this.tiradasRestantes > 0 && this.tiradasAleatorias > 0;
    }

    get puedeSiguiente(): boolean {
        return !!this.resultado;
    }

    get factores(): ResultadoCalculoVidaFinal['detalle']['flags'] {
        return this.resultado?.detalle?.flags ?? {
            dadosGolpe: false,
            dgsRacialesExtra: false,
            plantillasDgsAdicionales: false,
            plantillasAumentoReduccionDgs: false,
            plantillasActualizacionDgsRazaClase: false,
            dotesSumaAdicionalDgs: false,
        };
    }

    get tiradasAleatorias(): number {
        return Math.max(0, Math.trunc(Number(this.resultado?.detalle?.tiradasAleatorias ?? 0)));
    }

    get textoRecalcular(): string {
        if (this.tiradasAleatorias < 1)
            return 'Sin tiradas aleatorias';
        return `Recalcular (${this.tiradasRestantes})`;
    }

    get mensajeAleatoriedad(): string {
        if (this.tiradasAleatorias < 1) {
            return 'Este personaje no tiene dados aleatorios de vida en este punto; recalcular no cambia el total.';
        }
        if (this.tiradasAleatorias === 1) {
            return 'Cada recalculo vuelve a tirar 1 dado aleatorio de vida.';
        }
        return `Cada recalculo vuelve a tirar ${this.tiradasAleatorias} dados aleatorios de vida.`;
    }

    onRecalcular(): void {
        if (!this.puedeRecalcular)
            return;
        this.recalcular.emit();
    }

    onSiguiente(): void {
        if (!this.puedeSiguiente)
            return;
        this.siguiente.emit();
    }

    onCerrar(): void {
        this.cerrar.emit();
    }

    @HostListener('document:keydown.enter', ['$event'])
    onEnterPresionado(event: KeyboardEvent): void {
        if (event.repeat || esElementoInteractivoParaEnter(event.target as HTMLElement | null))
            return;
        if (!this.puedeSiguiente)
            return;
        event.preventDefault();
        this.onSiguiente();
    }
}
