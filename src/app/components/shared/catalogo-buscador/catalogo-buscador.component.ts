import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { normalizarTexto, toInt, toText } from 'src/app/services/utils/normalizacion';
import { compararTexto } from 'src/app/services/utils/orden-texto';

/** Una opción de un catálogo: su id y su nombre. */
export interface OpcionCatalogo {
    id: number;
    nombre: string;
}

/**
 * Las opciones de un catálogo de la API (`{ Id, Nombre }`) para el buscador: sin las que no tienen nombre y por orden
 * alfabético en español.
 */
export function opcionesDeCatalogo(items: readonly { Id?: unknown; Nombre?: unknown; }[] | null | undefined): OpcionCatalogo[] {
    return (items ?? []).map((item) => ({ id: toInt(item?.Id), nombre: toText(item?.Nombre).trim() }))
        .filter((item) => item.nombre.length > 0)
        .sort((a, b) => compararTexto(a.nombre, b.nombre));
}

/** Cuántas opciones enseña a la vez (se afina escribiendo). */
const MAXIMO_OPCIONES = 50;

/**
 * Un campo que busca en un catálogo amplio (manuales, raciales, conjuros, dotes…) con autocompletado, como pide la guía
 * de inserciones: filtra por texto normalizado y deja visible el nombre de lo elegido. Con `anadir`, es el «Añadir…» de
 * una lista: tras elegir se vacía y no ofrece lo que ya está (`excluir`). Es el selector de manual (con la página al
 * lado, un campo numérico) y de cualquier catálogo de las inserciones nuevas.
 */
@Component({
    selector: 'app-catalogo-buscador',
    templateUrl: './catalogo-buscador.component.html',
    styleUrls: ['./catalogo-buscador.component.sass'],
    standalone: false,
})
export class CatalogoBuscadorComponent implements OnChanges {
    @Input() etiqueta = '';
    @Input() opciones: readonly OpcionCatalogo[] = [];
    /** El id elegido (sin `anadir`); `null` o un id que no está, nada. */
    @Input() valor: number | null = null;
    @Input() anadir = false;
    @Input() excluir: readonly number[] = [];
    @Input() deshabilitado = false;
    @Input() placeholder = '';
    /** El error que enseña bajo el campo (el de la API o el de la validación). */
    @Input() error: string | null = null;
    @Output() elegir = new EventEmitter<number>();

    texto = '';

    ngOnChanges(): void {
        if (!this.anadir)
            this.texto = this.nombreDe(this.valor);
    }

    get filtradas(): OpcionCatalogo[] {
        const consulta = normalizarTexto(this.texto, true);
        const fuera = new Set(this.excluir);
        const coincide = (opcion: OpcionCatalogo) => consulta.length < 1
            || (!this.anadir && this.texto === this.nombreDe(this.valor))
            || normalizarTexto(opcion.nombre, true).includes(consulta);
        return this.opciones.filter((opcion) => !fuera.has(opcion.id) && coincide(opcion)).slice(0, MAXIMO_OPCIONES);
    }

    seleccionar(id: number): void {
        this.elegir.emit(id);
        this.texto = this.anadir ? '' : this.nombreDe(id);
    }

    restaurar(): void {
        if (!this.anadir)
            this.texto = this.nombreDe(this.valor);
    }

    readonly mostrar = (): string => this.texto;

    private nombreDe(id: number | null): string {
        return this.opciones.find((opcion) => opcion.id === id)?.nombre ?? '';
    }
}
