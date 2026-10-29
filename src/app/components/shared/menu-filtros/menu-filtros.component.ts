import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

/**
 * El botón de filtros de los listados y su menú, un solo componente para todos (antes, cada listado escribía el suyo y
 * una directiva lo abría al pasar el ratón). Se abre con clic, Enter o espacio y se cierra con clic fuera, Escape o el
 * mismo botón, como cualquier `mat-menu`. Un clic dentro del menú no lo cierra (los campos ya no necesitan parar el
 * evento). Lleva una cabecera con el título y, si alguien escucha `limpiar`, el botón «Limpiar filtros».
 *
 * El contenido son grupos `<app-menu-filtros-grupo titulo="…">` (los campos de búsqueda, las casillas y los chips).
 * Los estilos del panel están en `menu-filtros.component.sass`, sin encapsular, porque el panel se pinta en el overlay.
 */
@Component({
    selector: 'app-menu-filtros',
    templateUrl: './menu-filtros.component.html',
    styleUrls: ['./menu-filtros.component.sass'],
    encapsulation: ViewEncapsulation.None,
    standalone: false,
})
export class MenuFiltrosComponent {
    /** Nombre accesible y tooltip del botón («Filtros de razas»). */
    @Input() titulo = 'Filtros';
    /** Si hay algún filtro distinto del de por defecto: si no, «Limpiar filtros» está desactivado. */
    @Input() hayFiltros = true;
    @Output() limpiar = new EventEmitter<void>();

    get conLimpiar(): boolean {
        return this.limpiar.observed;
    }
}

/** Un grupo de filtros con su título («Buscar», «Mostrar»). */
@Component({
    selector: 'app-menu-filtros-grupo',
    template: `
        <section class="menu-filtros__grupo" [attr.aria-label]="titulo">
            <h3 class="menu-filtros__grupo-titulo">{{titulo}}</h3>
            <div class="menu-filtros__grupo-cuerpo" [class.menu-filtros__grupo-cuerpo--chips]="chips"><ng-content></ng-content></div>
        </section>`,
    standalone: false,
})
export class MenuFiltrosGrupoComponent {
    @Input() titulo = '';
    /** Los chips (o casillas) del grupo en fila, alineados y con salto de línea. */
    @Input() chips = false;
}

export const MENU_FILTROS_COMPONENTES = [MenuFiltrosComponent, MenuFiltrosGrupoComponent];

/** El texto escrito en el campo de búsqueda de un menú de filtros (el `ElementRef` de su `input`), sin espacios de sobra. */
export function textoDelFiltro(campo: { nativeElement?: { value?: string } } | null | undefined): string {
    return `${campo?.nativeElement?.value ?? ''}`.trim();
}

/** Vacía el campo de búsqueda de un menú de filtros («Limpiar filtros»). */
export function vaciarTextoDelFiltro(campo: { nativeElement?: { value?: string } } | null | undefined): void {
    if (campo?.nativeElement)
        campo.nativeElement.value = '';
}
