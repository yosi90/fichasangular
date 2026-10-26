import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ManualReferencia } from 'src/app/interfaces/manual';
import { textoVisible, tieneNumeroVisible } from 'src/app/services/utils/texto-visible';
import { EtiquetaFicha, esTextoCorto, etiquetasVisibles } from './ficha';

/**
 * La cabecera de la ficha: el tipo en versalitas, el nombre, una línea opcional en cursiva y, a la derecha, el manual
 * con su página y las etiquetas (Oficial u Homebrew y las propias del tipo). Lo que se proyecte (botones, acciones)
 * va a la derecha, bajo las etiquetas.
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
    /** Pulsar el manual abre su detalle. Si nadie escucha, el manual es solo texto. */
    @Output() abrirManual = new EventEmitter<void>();

    get subtituloVisible(): boolean {
        return esTextoCorto(this.subtitulo);
    }

    get nombreManual(): string {
        const nombre = typeof this.manual === 'string' ? this.manual : this.manual?.Nombre;
        return textoVisible(nombre);
    }

    get paginaManual(): number | null {
        const pagina = typeof this.manual === 'string' ? null : this.manual?.Pagina;
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
