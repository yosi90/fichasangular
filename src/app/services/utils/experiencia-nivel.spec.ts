import { experienciaParaNivel, nivelPorExperiencia } from './experiencia-nivel';

describe('experienciaParaNivel', () => {
    it('da la experiencia mínima de cada nivel', () => {
        expect([0, 1, 2, 3, 4, 5, 20].map(experienciaParaNivel)).toEqual([0, 0, 1000, 3000, 6000, 10000, 190000]);
    });

    it('un nivel no válido cuenta como 0', () => {
        expect(experienciaParaNivel(-2)).toBe(0);
        expect(experienciaParaNivel(NaN)).toBe(0);
        expect(experienciaParaNivel(3.7)).toBe(3000);
    });
});

describe('nivelPorExperiencia', () => {
    it('es la inversa de experienciaParaNivel, como la API', () => {
        expect([0, 999, 1000, 2999, 3000, 45000, 44999].map(nivelPorExperiencia)).toEqual([1, 1, 2, 2, 3, 10, 9]);
    });
});
