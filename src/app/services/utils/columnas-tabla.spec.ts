import { conColumnaOpcional } from './columnas-tabla';

describe('conColumnaOpcional', () => {
    it('pone la columna al final al mostrarla y la quita al ocultarla', () => {
        expect(conColumnaOpcional(['Nombre', 'Manual'], 'Homebrew', true)).toEqual(['Nombre', 'Manual', 'Homebrew']);
        expect(conColumnaOpcional(['Nombre', 'Homebrew', 'Manual'], 'Homebrew', false)).toEqual(['Nombre', 'Manual']);
    });

    it('si ya está como debe, devuelve la misma lista', () => {
        const con = ['Nombre', 'Homebrew'];
        const sin = ['Nombre'];
        expect(conColumnaOpcional(con, 'Homebrew', true)).toBe(con);
        expect(conColumnaOpcional(sin, 'Homebrew', false)).toBe(sin);
    });
});
