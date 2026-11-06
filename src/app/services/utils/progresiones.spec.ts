import { basesDeDgsDelTipo, valorDeProgresion } from './progresiones';

describe('progresiones', () => {
    const buena = ['+2', '+3', '+3', '+4', '+4', '+5', '+5', '+6', '+6', '+7', '+7', '+8', '+8', '+9', '+9', '+10', '+10', '+11', '+11', '+12'];
    const mala = ['+0', '+0', '+1', '+1', '+1', '+2', '+2', '+2', '+3', '+3', '+3', '+4', '+4', '+4', '+5', '+5', '+5', '+6', '+6', '+6'];
    const media = ['+0', '+1', '+2', '+3', '+3', '+4', '+5', '+6/+1', '+6/+1', '+7/+2', '+8/+3', '+9/+4', '+9/+4', '+10/+5', '+11/+6/+1', '+12/+7/+2', '+12/+7/+2', '+13/+8/+3', '+14/+9/+4', '+15/+10/+5'];
    const catalogo = {
        ataques_base: [{ Id: 2, Nombre: 'Medio', Valores: media }],
        salvaciones: [{ Id: 1, Nombre: 'Buena', Valores: buena }, { Id: 2, Nombre: 'Mala', Valores: mala }],
    };
    const animal = { Id_ataque: 2, Id_fortaleza: 1, Id_reflejos: 1, Id_voluntad: 2 };

    it('el valor a unos DG: el primer número («+6/+1» es +6) y 0 sin DG', () => {
        expect(valorDeProgresion(buena, 1)).toBe(2);
        expect(valorDeProgresion(media, 8)).toBe(6);
        expect(valorDeProgresion(media, 0)).toBe(0);
        expect(valorDeProgresion([], 3)).toBe(0);
    });

    it('pasados los 20 sigue su ritmo, como la API (ciclos de 12)', () => {
        expect(valorDeProgresion(buena, 21)).toBe(12);
        expect(valorDeProgresion(buena, 22)).toBe(13);
        expect(valorDeProgresion(mala, 24)).toBe(8);
    });

    it('un animal de 2 DG: ataque +1, Fort +3, Ref +3, Vol +0; de 1 DG: +0, +2, +2, +0 (MM, «Animal»)', () => {
        expect(basesDeDgsDelTipo(animal, 2, catalogo)).toEqual({ ataqueBase: 1, fortaleza: 3, reflejos: 3, voluntad: 0 });
        expect(basesDeDgsDelTipo(animal, 1, catalogo)).toEqual({ ataqueBase: 0, fortaleza: 2, reflejos: 2, voluntad: 0 });
    });

    it('sin el tipo, sin el catálogo o sin una de sus progresiones, null', () => {
        expect(basesDeDgsDelTipo(null, 2, catalogo)).toBeNull();
        expect(basesDeDgsDelTipo(animal, 2, null)).toBeNull();
        expect(basesDeDgsDelTipo({ ...animal, Id_ataque: 1 }, 2, catalogo)).toBeNull();
        expect(basesDeDgsDelTipo({ ...animal, Id_voluntad: 0 }, 2, catalogo)).toBeNull();
    });
});
