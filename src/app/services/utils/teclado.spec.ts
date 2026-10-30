import { destinoEnTablist } from './teclado';

describe('destinoEnTablist', () => {
    it('las flechas pasan a la siguiente o la anterior dando la vuelta', () => {
        expect(destinoEnTablist('ArrowRight', 0, 3)).toBe(1);
        expect(destinoEnTablist('ArrowRight', 2, 3)).toBe(0);
        expect(destinoEnTablist('ArrowLeft', 1, 3)).toBe(0);
        expect(destinoEnTablist('ArrowLeft', 0, 3)).toBe(2);
    });

    it('Inicio va a la primera y Fin a la última', () => {
        expect(destinoEnTablist('Home', 2, 3)).toBe(0);
        expect(destinoEnTablist('End', 0, 3)).toBe(2);
    });

    it('las demás teclas, o una fila sin pestañas, no mueven', () => {
        expect(destinoEnTablist('Enter', 0, 3)).toBeNull();
        expect(destinoEnTablist('ArrowDown', 0, 3)).toBeNull();
        expect(destinoEnTablist('ArrowRight', 0, 0)).toBeNull();
    });
});
