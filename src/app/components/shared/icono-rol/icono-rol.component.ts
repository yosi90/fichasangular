import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from '@angular/core';
import { ICONOS_ROL, IconoRol, TipoRol, rutaIconoRol } from 'src/app/services/utils/iconos-rol';

/** El icono a 16 px va en el recuadro oscuro del menú (24 px); los demás, en el del color del grupo. */
const RECUADRO_POR_TAMANO: Readonly<Record<number, number>> = { 16: 24, 18: 28, 20: 30, 24: 36, 28: 40, 32: 48, 38: 56 };

/**
 * El icono de un elemento de rol (`ICONOS_ROL`), con el color de su grupo (`_iconos.sass`). Se pinta con el SVG como
 * máscara, así que toma el color de `--icono-rol-color`. `recuadro`: `true`, sobre el color del grupo al 16 % (filas,
 * cabeceras, búsqueda); `'oscuro'`, sobre `$primary` (menú lateral, donde el fondo claro no deja ver el color).
 * Con texto al lado es decoración (`aria-hidden`); con `solo`, lo lee el lector de pantalla con su etiqueta.
 */
@Component({
    selector: 'app-icono-rol',
    template: '<span class="icono-rol__dibujo" [style.width.px]="tamano" [style.height.px]="tamano" [style.mask-image]="mascara" [style.-webkit-mask-image]="mascara"></span>',
    styleUrls: ['./icono-rol.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class IconoRolComponent implements OnChanges {
    @Input({ required: true }) tipo!: TipoRol;
    /** El tamaño del dibujo, en px: 16 (menú), 18 (pestañas y filas), 20, 24 (tarjeta de campaña), 28, 32 (cabecera de campaña) o 38 (cabecera de la ficha). */
    @Input() tamano = 18;
    @Input() recuadro: boolean | 'oscuro' = false;
    /** Sin texto al lado: el icono se anuncia con su etiqueta (o con `etiqueta`, si se da). */
    @Input() solo = false;
    @Input() etiqueta: string | null = null;

    info: IconoRol = ICONOS_ROL.raza;
    mascara = '';

    @HostBinding('class') get clases(): string {
        const recuadro = this.recuadro === 'oscuro' ? ' icono-rol--oscuro' : this.recuadro ? ' icono-rol--recuadro' : '';
        return `icono-rol icono-rol--${this.info.grupo}${recuadro}`;
    }

    @HostBinding('style.width.px') get ancho(): number | null {
        return this.recuadro ? this.caja : null;
    }

    @HostBinding('style.height.px') get alto(): number | null {
        return this.recuadro ? this.caja : null;
    }

    @HostBinding('attr.role') get rol(): string | null {
        return this.solo ? 'img' : null;
    }

    @HostBinding('attr.aria-label') get nombreAccesible(): string | null {
        return this.solo ? (this.etiqueta || this.info.etiqueta) : null;
    }

    @HostBinding('attr.aria-hidden') get oculto(): string | null {
        return this.solo ? null : 'true';
    }

    get caja(): number {
        return RECUADRO_POR_TAMANO[this.tamano] ?? Math.round(this.tamano * 1.45);
    }

    ngOnChanges(): void {
        this.info = ICONOS_ROL[this.tipo];
        this.mascara = `url("${rutaIconoRol(this.tipo)}")`;
    }
}
