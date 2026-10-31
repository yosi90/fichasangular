import { calcularPuntosGolpe, dgsRacialesQueCuentan, EntradaPuntosGolpe } from './puntos-golpe';

describe('puntos-golpe', () => {
    function entrada(parcial: Partial<EntradaPuntosGolpe>): EntradaPuntosGolpe {
        return {
            dgsRaciales: { cantidad: 0, caras: 8 },
            nivelesClase: [],
            dgsPlantillas: [],
            modConstitucion: 0,
            bonoPorDg: 0,
            bonoPlano: 0,
            tirar: () => 1,
            ...parcial,
        };
    }

    it('ogro con 4 DG d8 y Con +2: 8 + 3d8 + Con × 4, el primer DG racial al máximo (GDM, pág. 172)', () => {
        const tiradas: number[] = [];
        const resultado = calcularPuntosGolpe(entrada({
            dgsRaciales: { cantidad: 4, caras: 8 },
            modConstitucion: 2,
            tirar: (caras) => { tiradas.push(caras); return 3; },
        }));

        expect(tiradas).toEqual([8, 8, 8]);
        expect(resultado.total).toBe(8 + 3 * 3 + 2 * 4);
        expect(resultado.maximo).toBe(8 * 4 + 2 * 4);
        expect(resultado.tiradas).toBe(3);
        expect(resultado.dgsRaciales).toBe(4);
    });

    it('con DG raciales ningún nivel de clase va al máximo: centauro (4 DG d8) guerrero 2', () => {
        const resultado = calcularPuntosGolpe(entrada({
            dgsRaciales: { cantidad: 4, caras: 8 },
            nivelesClase: [{ cantidad: 2, caras: 10 }],
            tirar: () => 2,
        }));

        expect(resultado.total).toBe(8 + 3 * 2 + 2 * 2);
        expect(resultado.tiradas).toBe(5);
    });

    it('sin DG raciales, el primer nivel de clase va al máximo y los demás se tiran', () => {
        const resultado = calcularPuntosGolpe(entrada({
            nivelesClase: [{ cantidad: 1, caras: 10 }, { cantidad: 1, caras: 4 }],
            tirar: () => 3,
        }));

        expect(resultado.total).toBe(10 + 3);
        expect(resultado.tiradas).toBe(1);
    });

    it('1 DG racial o menos: con un nivel de clase, el DG racial no suma y el primer nivel de clase va al máximo', () => {
        const resultado = calcularPuntosGolpe(entrada({
            dgsRaciales: { cantidad: 1, caras: 8 },
            nivelesClase: [{ cantidad: 2, caras: 6 }],
            tirar: () => 4,
        }));

        expect(resultado.total).toBe(6 + 4);
        expect(resultado.maximo).toBe(12);
        expect(resultado.tiradas).toBe(1);
        expect(resultado.dgsRaciales).toBe(0);
    });

    it('los DG de plantilla nunca son el primero: se tiran todos', () => {
        const resultado = calcularPuntosGolpe(entrada({
            nivelesClase: [{ cantidad: 1, caras: 10 }],
            dgsPlantillas: [{ cantidad: 2, caras: 8 }],
            tirar: () => 5,
        }));

        expect(resultado.total).toBe(10 + 5 + 5);
        expect(resultado.tiradas).toBe(2);
    });

    it('dgsRacialesQueCuentan: 1 o menos con nivel de clase, ninguno; sin clase o con 2 o más, los de la raza', () => {
        expect(dgsRacialesQueCuentan(1, 1)).toBe(0);
        expect(dgsRacialesQueCuentan(0, 3)).toBe(0);
        expect(dgsRacialesQueCuentan(1, 0)).toBe(1);
        expect(dgsRacialesQueCuentan(2, 1)).toBe(2);
        expect(dgsRacialesQueCuentan(-3, 0)).toBe(0);
    });
});
