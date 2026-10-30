import { Injectable, Provider } from '@angular/core';
import { MAT_PAGINATOR_DEFAULT_OPTIONS, MatPaginatorDefaultOptions, MatPaginatorIntl } from '@angular/material/paginator';

/**
 * El paginador de Material en español para toda la web (lienzo «Rol: las vistas que faltan», vista 4: hoy salía en
 * inglés): «Por página», «1–25 de 240» y los nombres de sus botones. Se da una vez en `AppModule`.
 */
@Injectable()
export class PaginadorEs extends MatPaginatorIntl {
    override itemsPerPageLabel = 'Por página';
    override nextPageLabel = 'Página siguiente';
    override previousPageLabel = 'Página anterior';
    override firstPageLabel = 'Primera página';
    override lastPageLabel = 'Última página';

    override getRangeLabel = (pagina: number, porPagina: number, total: number): string => {
        if (total < 1 || porPagina < 1)
            return `0 de ${Math.max(total, 0)}`;
        const inicio = pagina * porPagina;
        const fin = Math.min(inicio + porPagina, total);
        return `${Math.min(inicio + 1, total)}–${fin} de ${total}`;
    };
}

/** Las opciones de tamaño de página de los listados, con 25 por defecto. */
export const TAMANOS_PAGINA = [10, 25, 50, 100];
export const TAMANO_PAGINA_POR_DEFECTO = 25;

/**
 * Lo que tienen todos los paginadores de la web sin escribirlo en cada plantilla: los tamaños, 25 por página y los
 * botones de primera y última página. Un `mat-paginator` solo pone lo suyo (su `aria-label`).
 */
export const OPCIONES_PAGINADOR: MatPaginatorDefaultOptions = {
    pageSize: TAMANO_PAGINA_POR_DEFECTO,
    pageSizeOptions: TAMANOS_PAGINA,
    showFirstLastButtons: true,
};

/** En `AppModule`: el paginador en español y sus opciones comunes. */
export const PROVEEDORES_PAGINADOR: Provider[] = [
    { provide: MatPaginatorIntl, useClass: PaginadorEs },
    { provide: MAT_PAGINATOR_DEFAULT_OPTIONS, useValue: OPCIONES_PAGINADOR },
];
