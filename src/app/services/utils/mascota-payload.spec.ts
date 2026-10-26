import { bonosFamiliarPorNivel, vidaMediaPorDados } from './mascota-payload';

describe('el familiar por nivel de su amo (MJ cap. 3)', () => {
    it('+1 a la armadura natural y +1 de Inteligencia cada dos niveles, desde 6', () => {
        expect(bonosFamiliarPorNivel(1)).toEqual({ ajusteArmaduraNatural: 1, inteligencia: 6, resistenciaConjuros: null });
        expect(bonosFamiliarPorNivel(2)).toEqual({ ajusteArmaduraNatural: 1, inteligencia: 6, resistenciaConjuros: null });
        expect(bonosFamiliarPorNivel(5)).toEqual({ ajusteArmaduraNatural: 3, inteligencia: 8, resistenciaConjuros: null });
        expect(bonosFamiliarPorNivel(20)).toEqual({ ajusteArmaduraNatural: 10, inteligencia: 15, resistenciaConjuros: 25 });
    });

    it('resistencia a conjuros de nivel + 5 desde el nivel 11', () => {
        expect(bonosFamiliarPorNivel(10).resistenciaConjuros).toBeNull();
        expect(bonosFamiliarPorNivel(11).resistenciaConjuros).toBe(16);
    });
});

describe('puntos de golpe medios de unos DG', () => {
    it('la media del dado y la Constitución por DG, con al menos 1 por DG', () => {
        expect(vidaMediaPorDados(6, 8, 2)).toBe(39);
        expect(vidaMediaPorDados(1, 4, -3)).toBe(1);
        expect(vidaMediaPorDados(0, 8, 2)).toBe(1);
    });
});
