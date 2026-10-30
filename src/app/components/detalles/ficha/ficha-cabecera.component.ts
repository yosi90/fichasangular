import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ManualReferencia } from 'src/app/interfaces/manual';
import { TipoRol } from 'src/app/services/utils/iconos-rol';
import { textoVisible, tieneNumeroVisible } from 'src/app/services/utils/texto-visible';
import { EtiquetaFicha, esTextoCorto, etiquetasVisibles, separarManualTexto } from './ficha';

/**
 * La cabecera de la ficha: el icono de su catálogo (si se da), el tipo en versalitas, el nombre, una línea opcional en cursiva y, a la derecha, el manual
 * con su página y las etiquetas (Oficial u Homebrew y las propias del tipo). Lo que se proyecte (botones, acciones)
 * va a la derecha, bajo las etiquetas; lo que lleve el atributo `fichaCabeceraPie` («Creado por…»), bajo el nombre.
 */
@Component({
    selector: 'app-ficha-cabecera',
    templateUrl: './ficha-cabecera.component.html',
    standalone: false
})
export class FichaCabeceraComponent implements OnChanges {
    /** El tipo, ya unido («Dote · General · Guerrero»; ver `unirTipo`). */
    @Input() tipo: string | null = null;
    @Input() nombre: string | null = null;
    /** La descripción corta, en cursiva. Si no es un solo párrafo corto (`esTextoCorto`), no se enseña aquí. */
    @Input() subtitulo: string | null | undefined = null;
    /** El manual: la referencia de la API (nombre y página) o el texto que ya trae la página. */
    @Input() manual: ManualReferencia | string | null | undefined = null;
    /** `true` enseña «Oficial»; `false`, «Homebrew» en ámbar; sin dar, nada. */
    @Input() oficial: boolean | null | undefined = undefined;
    @Input() etiquetas: (string | EtiquetaFicha)[] | null | undefined = [];
    /** El icono de su catálogo (`ICONOS_ROL`), en su recuadro a la izquierda del tipo y el nombre (56/38; compacta, 40/28). Sin él, la cabecera queda como antes. */
    @Input() icono: TipoRol | null = null;
    /** Más baja, en una fila: el nombre con el tipo al lado y las etiquetas y acciones a la derecha. */
    @Input() compacta = false;
    /** Pulsar el manual abre su detalle. Si nadie escucha, el manual es solo texto. */
    @Output() abrirManual = new EventEmitter<void>();

    get subtituloVisible(): boolean {
        return esTextoCorto(this.subtitulo);
    }

    get nombreManual(): string {
        if (typeof this.manual === 'string')
            return separarManualTexto(this.manual).nombre;
        return textoVisible(this.manual?.Nombre);
    }

    get paginaManual(): number | null {
        if (typeof this.manual === 'string')
            return separarManualTexto(this.manual).pagina;
        const pagina = this.manual?.Pagina;
        return tieneNumeroVisible(pagina) ? Number(pagina) : null;
    }

    get manualNavegable(): boolean {
        return this.abrirManual.observed;
    }

    /** Las etiquetas que se pintan: las propias y, al final, la de Oficial u Homebrew. */
    etiquetasCabecera: EtiquetaFicha[] = [];

    ngOnChanges(): void {
        const propias = etiquetasVisibles(this.etiquetas);
        if (this.oficial === true)
            this.etiquetasCabecera = [...propias, { texto: 'Oficial' }];
        else if (this.oficial === false)
            this.etiquetasCabecera = [...propias, { texto: 'Homebrew', ayuda: 'No es contenido oficial', aviso: true }];
        else
            this.etiquetasCabecera = propias;
    }
}
