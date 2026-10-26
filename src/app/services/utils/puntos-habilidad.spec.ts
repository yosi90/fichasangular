import { puntosHabilidadNivelClase } from './puntos-habilidad';

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
