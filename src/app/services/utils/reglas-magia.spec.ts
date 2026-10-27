import { normalizeClase } from '../clase.service';
import {
    conjurosAdicionales,
    conjurosDiariosPorNivel,
    nivelDeClaveConjuro,
    nivelLanzadorDeClase,
    prohibidasAlEspecializarse,
    puedeLanzarNivelConjuro,
    puntosPoderAdicionales,
    puntuacionLanzamiento,
} from './reglas-magia';

describe('reglas-magia', () => {
    it('conjuros adicionales de la tabla 1-1 del MJ: con +3, uno de nivel 1 a 3; con +5, dos de nivel 1; ninguno de nivel 0', () => {
        expect([0, 1, 2, 3, 4].map((nivel) => conjurosAdicionales(3, nivel))).toEqual([0, 1, 1, 1, 0]);
        expect(conjurosAdicionales(5, 1)).toBe(2);
        expect(conjurosAdicionales(-1, 1)).toBe(0);
    });

    it('para lanzar un conjuro hace falta la característica a 10 + su nivel (MJ cap. 1)', () => {
        expect(puedeLanzarNivelConjuro(10, 0)).toBeTrue();
        expect(puedeLanzarNivelConjuro(10, 1)).toBeFalse();
        expect(puedeLanzarNivelConjuro(9, 0)).toBeFalse();
        expect(puedeLanzarNivelConjuro(null, 5)).toBeTrue();
    });

    it('puntos de poder adicionales (MPE tabla 2-1): ⌊mod × nivel de manifestador / 2⌋', () => {
        expect(puntosPoderAdicionales(3, 1)).toBe(1);
        expect(puntosPoderAdicionales(3, 10)).toBe(15);
        expect(puntosPoderAdicionales(-1, 4)).toBe(0);
    });

    it('la característica de lanzamiento sale de la clase (`Mod_salv_conjuros`)', () => {
        const clerigo = normalizeClase({ Mod_salv_conjuros: 'Sabiduría' });
        expect(puntuacionLanzamiento({ Sabiduria: 16 }, clerigo)).toBe(16);
        expect(puntuacionLanzamiento({ Sabiduria: 16 }, normalizeClase({ Mod_salv_conjuros: 'No aplica' }))).toBeNull();
    });

    it('nivel de lanzador del paladín: la mitad de su nivel desde que lanza (MJ cap. 3), por el dato de la clase', () => {
        const paladin = normalizeClase({ Conjuros: { Nivel_lanzador_divisor: 2 } });
        const mago = normalizeClase({ Conjuros: {} });
        expect(nivelLanzadorDeClase(paladin, 1, 4, 0)).toBe(2);
        expect(nivelLanzadorDeClase(paladin, 0, 3, 0)).toBe(0);
        expect(nivelLanzadorDeClase(paladin, 17, 20, 0)).toBe(10);
        expect(nivelLanzadorDeClase(mago, 7, 5, 2)).toBe(7);
    });

    it('las escuelas que prohíbe el especialista salen del dato de la escuela (la adivinación, 1), nunca negativas', () => {
        expect(prohibidasAlEspecializarse({ Prohibidas_al_especializarse: 2 })).toBe(2);
        expect(prohibidasAlEspecializarse({ Prohibidas_al_especializarse: 1 })).toBe(1);
        expect(prohibidasAlEspecializarse({ Prohibidas_al_especializarse: -1 })).toBe(0);
        expect(prohibidasAlEspecializarse(null)).toBe(0);
    });

    it('lee el nivel de las claves de la tabla de la clase («Nivel_3» o «3») y descarta las que no nombran uno', () => {
        expect(nivelDeClaveConjuro('Nivel_3')).toBe(3);
        expect(nivelDeClaveConjuro('0')).toBe(0);
        expect(nivelDeClaveConjuro('Total')).toBe(-1);
        expect(conjurosDiariosPorNivel({ Nivel_0: 3, Nivel_1: '1', Nivel_2: -1, Nivel_3: 'x', Total: 4 }))
            .toEqual({ 0: 3, 1: 1, 2: -1, 3: -1 });
        expect(conjurosDiariosPorNivel(null)).toEqual({});
    });
});
