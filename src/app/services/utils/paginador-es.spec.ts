import { PaginadorEs } from './paginador-es';

describe('PaginadorEs', () => {
    it('dice «Por página» y el rango en español', () => {
        const paginador = new PaginadorEs();
        expect(paginador.itemsPerPageLabel).toBe('Por página');
        expect(paginador.getRangeLabel(0, 25, 240)).toBe('1–25 de 240');
        expect(paginador.getRangeLabel(9, 25, 240)).toBe('226–240 de 240');
        expect(paginador.getRangeLabel(0, 25, 9)).toBe('1–9 de 9');
        expect(paginador.getRangeLabel(0, 25, 0)).toBe('0 de 0');
    });
});
