import { costeRangoHabilidad, limiteRangosHabilidad, puntosHabilidadDgRaciales, puntosHabilidadNivelClase } from './puntos-habilidad';

describe('puntos de habilidad por nivel de clase (MJ cap. 4)', () => {
    it('×4 solo en el primer nivel del personaje', () => {
        expect(puntosHabilidadNivelClase({ puntosClase: 2, modInteligencia: 0, primerNivelPersonaje: true })).toBe(8);
        expect(puntosHabilidadNivelClase({ puntosClase: 2, modInteligencia: 0, primerNivelPersonaje: false })).toBe(2);
    });

    it('explorador 4 / mago 1 con Int 18 (+4): 76 puntos, no 94', () => {
        const niveles = [
            puntosHabilidadNivelClase({ puntosClase: 6, modInteligencia: 4, primerNivelPersonaje: true }),
            puntosHabilidadNivelClase({ puntosClase: 6, modInteligencia: 4, primerNivelPersonaje: false }),
            puntosHabilidadNivelClase({ puntosClase: 6, modInteligencia: 4, primerNivelPersonaje: false }),
            puntosHabilidadNivelClase({ puntosClase: 6, modInteligencia: 4, primerNivelPersonaje: false }),
            puntosHabilidadNivelClase({ puntosClase: 2, modInteligencia: 4, primerNivelPersonaje: false }),
        ];
        expect(niveles.reduce((a, b) => a + b, 0)).toBe(76);
    });

    it('al menos 1 punto por nivel aunque la Inteligencia reste', () => {
        expect(puntosHabilidadNivelClase({ puntosClase: 2, modInteligencia: -4, primerNivelPersonaje: false })).toBe(1);
        expect(puntosHabilidadNivelClase({ puntosClase: 2, modInteligencia: -4, primerNivelPersonaje: true })).toBe(4);
    });
});

describe('rangos de habilidad (MJ cap. 4)', () => {
    it('clásea: 1 punto por rango y tope nivel + 3', () => {
        expect(costeRangoHabilidad(true)).toBe(1);
        expect(limiteRangosHabilidad(1, true)).toBe(4);
        expect(limiteRangosHabilidad(5, true)).toBe(8);
    });

    it('transclásea: 2 puntos por rango y tope ⌊(nivel + 3) / 2⌋', () => {
        expect(costeRangoHabilidad(false)).toBe(2);
        expect(limiteRangosHabilidad(1, false)).toBe(2);
        expect(limiteRangosHabilidad(2, false)).toBe(2);
        expect(limiteRangosHabilidad(5, false)).toBe(4);
    });
});

describe('puntos de habilidad de los DG raciales (MM cap. 1)', () => {
    it('centauro (4 DG, 2 por DG): (2 + Int) × 7, con la Inteligencia negativa y un mínimo de 1 por DG', () => {
        expect(puntosHabilidadDgRaciales({ puntosPorDg: 2, multiplicador: 7, modInteligencia: 1 })).toBe(21);
        expect(puntosHabilidadDgRaciales({ puntosPorDg: 2, multiplicador: 7, modInteligencia: 0 })).toBe(14);
        expect(puntosHabilidadDgRaciales({ puntosPorDg: 2, multiplicador: 7, modInteligencia: -1 })).toBe(7);
        expect(puntosHabilidadDgRaciales({ puntosPorDg: 2, multiplicador: 7, modInteligencia: -3 })).toBe(7);
    });
});
