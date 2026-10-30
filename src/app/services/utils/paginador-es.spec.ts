import { MAT_PAGINATOR_DEFAULT_OPTIONS, MatPaginatorIntl } from '@angular/material/paginator';
import { OPCIONES_PAGINADOR, PaginadorEs, PROVEEDORES_PAGINADOR, TAMANO_PAGINA_POR_DEFECTO, TAMANOS_PAGINA } from './paginador-es';

describe('PaginadorEs', () => {
    it('dice «Por página» y el rango en español', () => {
        const paginador = new PaginadorEs();
        expect(paginador.itemsPerPageLabel).toBe('Por página');
        expect(paginador.getRangeLabel(0, 25, 240)).toBe('1–25 de 240');
        expect(paginador.getRangeLabel(9, 25, 240)).toBe('226–240 de 240');
        expect(paginador.getRangeLabel(0, 25, 9)).toBe('1–9 de 9');
        expect(paginador.getRangeLabel(0, 25, 0)).toBe('0 de 0');
    });

    it('da a todos los paginadores 25 por página, los tamaños comunes y los botones de primera y última', () => {
        expect(OPCIONES_PAGINADOR).toEqual({ pageSize: TAMANO_PAGINA_POR_DEFECTO, pageSizeOptions: TAMANOS_PAGINA, showFirstLastButtons: true });
        expect(TAMANO_PAGINA_POR_DEFECTO).toBe(25);
        expect(TAMANOS_PAGINA).toContain(25);
        expect(PROVEEDORES_PAGINADOR).toEqual([
            { provide: MatPaginatorIntl, useClass: PaginadorEs },
            { provide: MAT_PAGINATOR_DEFAULT_OPTIONS, useValue: OPCIONES_PAGINADOR },
        ]);
    });
});
