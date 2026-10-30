import { Pipe, PipeTransform } from '@angular/core';
import { textoManualListado } from '../../detalles/ficha/ficha';

/** `{{ fila.Manual | manualListado }}` o `{{ fila.Manual | manualListado: fila.Pagina }}`: «Razas de Faerûn · p. 131». */
@Pipe({
    name: 'manualListado',
    standalone: false
})
export class ManualListadoPipe implements PipeTransform {
    transform(manual: Parameters<typeof textoManualListado>[0], pagina?: number | string | null): string {
        return textoManualListado(manual, pagina);
    }
}
