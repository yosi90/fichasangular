import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { TipoRol } from 'src/app/services/utils/iconos-rol';

/** Lo que dice la cabecera según se cree o se modifique. */
export type ModoInsercion = 'crear' | 'editar';

/**
 * El marco común de las inserciones y modificaciones de catálogo (lienzo «Rol: las vistas que faltan», vista 7,
 * aprobado por el propietario el 2026-10-30), con las piezas de la creación de personaje: cabecera `$primary` con la
 * raya rosa («Insertar · Raza · Paso 1 de 5», el nombre que se va escribiendo y la etiqueta Oficial u Homebrew), una
 * fila de pasos a la que **sí se puede saltar** (son botones), el aviso ámbar de permisos, el cuerpo que proyecta cada
 * formulario y un pie fijo con «Anterior», «Siguiente: …», una nota y la acción principal abajo a la derecha.
 *
 * Va dentro del `<form>` de cada inserción: la acción principal es `type="submit"` y envía ese formulario, así que cada
 * inserción conserva su `(ngSubmit)` y sus validaciones. Los estilos son globales con el prefijo `insercion-` (como los
 * de la creación) para que valgan en lo que proyecta cada formulario (`insercion-paso`, `insercion-tarjeta`…).
 * Guía: `docs/guias-estilo/GUIA_ESTILO_INSERCIONES.md`.
 */
@Component({
    selector: 'app-insercion-marco',
    templateUrl: './insercion-marco.component.html',
    styleUrls: ['./insercion-marco.component.sass'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class InsercionMarcoComponent {
    @Input() modo: ModoInsercion = 'crear';
    /** El tipo de lo que se inserta, con mayúscula: «Raza», «Clase», «Dote»… */
    @Input() tipo = '';
    /** Lo que sustituye a «Paso N de M» en la línea del tipo («Modificar · Plantilla · Manual de monstruos, p. 12»). */
    @Input() detalleTipo: string | null | undefined = '';
    /** El icono del catálogo (`ICONOS_ROL`): recuadro 56/38 a la izquierda; en ventana, 40/28. Sin él, la cabecera queda igual. */
    @Input() iconoTipo: TipoRol | null = null;
    /** El nombre que se va escribiendo (o el real, al modificar). Sin nombre, «Sin nombre todavía». */
    @Input() nombre: string | null | undefined = '';
    /** `true` «Oficial», `false` «Homebrew»; `null`, nada. */
    @Input() oficial: boolean | null | undefined = null;
    /** Los nombres de los pasos. Con uno o ninguno, no hay fila de pasos ni «Anterior» y «Siguiente». */
    @Input() pasos: readonly string[] = [];
    @Input() pasoActual = 0;
    @Output() pasoActualChange = new EventEmitter<number>();
    /** Los pasos con cambios sin guardar (al modificar): llevan un punto ámbar. */
    @Input() pasosConCambios: readonly number[] = [];
    /** Sin permisos: el aviso ámbar de arriba; además, desactiva la acción principal y lo explica en el pie. */
    @Input() avisoPermisos: string | null | undefined = '';
    /** «Cargando clase…», mientras se trae lo que se va a modificar. */
    @Input() cargando: string | null | undefined = '';
    /** Un error global del formulario, en un `bloque-error` arriba. */
    @Input() error: string | null | undefined = '';
    /** «Crear raza», «Guardar cambios»… */
    @Input() textoAccion = 'Guardar';
    @Input() textoGuardando = 'Guardando…';
    @Input() guardando = false;
    /** Desactiva la acción principal por un motivo propio del formulario (los permisos ya los cuenta `avisoPermisos`). */
    @Input() accionDesactivada = false;
    /** La nota del pie, a la izquierda de la acción. */
    @Input() nota: string | null | undefined = '';
    /** Con `false`, la acción principal es un botón normal y emite `accion` en vez de enviar el formulario. */
    @Input() enviaFormulario = true;
    /** Dentro de una ventana: cabecera más compacta y, si `cerrable`, la ✕. */
    @Input() enVentana = false;
    @Input() cerrable = false;
    @Output() accion = new EventEmitter<void>();
    @Output() cerrar = new EventEmitter<void>();

    @ViewChild('cabecera', { static: true }) cabecera?: ElementRef<HTMLElement>;

    get nombreVisible(): string {
        return `${this.nombre ?? ''}`.trim();
    }

    get conPasos(): boolean {
        return this.pasos.length > 1;
    }

    /** «Insertar · Raza · Paso 1 de 5». */
    get lineaTipo(): string {
        const partes = [this.modo === 'editar' ? 'Modificar' : 'Insertar'];
        if (`${this.tipo ?? ''}`.trim().length > 0)
            partes.push(this.tipo.trim());
        const detalle = `${this.detalleTipo ?? ''}`.trim();
        if (detalle.length > 0)
            partes.push(detalle);
        else if (this.conPasos)
            partes.push(this.textoPaso(this.pasoActual));
        return partes.join(' · ');
    }

    /** «Paso 3 de 5»; con el nombre, «Paso 3 de 5: Rasgos» (el desplegable del móvil). */
    textoPaso(indice: number, conNombre = false): string {
        const base = `Paso ${indice + 1} de ${this.pasos.length}`;
        return conNombre ? `${base}: ${this.pasos[indice]}` : base;
    }

    pasoConCambios(indice: number): boolean {
        return this.pasosConCambios.includes(indice);
    }

    get sinPermisos(): boolean {
        return `${this.avisoPermisos ?? ''}`.trim().length > 0;
    }

    get accionBloqueada(): boolean {
        return this.guardando || this.accionDesactivada || this.sinPermisos;
    }

    get notaVisible(): string {
        const nota = `${this.nota ?? ''}`.trim();
        if (nota.length > 0)
            return nota;
        return this.sinPermisos ? 'No puedes guardar sin permisos.' : '';
    }

    get siguientePaso(): string | null {
        return this.pasoActual < this.pasos.length - 1 ? this.pasos[this.pasoActual + 1] : null;
    }

    irAPaso(indice: number): void {
        const destino = Math.trunc(Number(indice));
        if (!Number.isFinite(destino) || destino < 0 || destino >= this.pasos.length || destino === this.pasoActual)
            return;
        this.pasoActual = destino;
        this.pasoActualChange.emit(destino);
        this.cabecera?.nativeElement.scrollIntoView?.({ block: 'nearest' });
    }

    pulsarAccion(): void {
        if (!this.enviaFormulario && !this.accionBloqueada)
            this.accion.emit();
    }
}
