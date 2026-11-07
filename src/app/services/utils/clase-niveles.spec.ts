import { armaduraNaturalDeClase, daDgEnNivel, dgsDeClase, doteDeLaTabla, hitosDotesProgresion, tieneTablaPorNivel } from './clase-niveles';
import { normalizeClase } from '../clase.service';
import { claseDeMonstruoApi, ENGENDRO_VAMPIRICO, MOHRG, MOMIA, NECROFAGO, TUMULARIO } from 'src/testing/clases-de-monstruo-api';

const sinTabla = { Desglose_niveles: [1, 2, 3].map((Nivel) => ({ Nivel, Dg: true, Dote: null, Armadura_natural: 0 })) };

/** La regla de dotes de antes de las clases con tabla (`getHitosDotesProgresion` hasta el 2026-11-07). */
function hitosDeAntes(dgsRaza: number, dgsPlantillas: number, nivelesClase: number): number[] {
    const dgs = dgsRaza + dgsPlantillas + nivelesClase;
    const primerDgRacial = dgsRaza > 0;
    const dotesDeLaRaza = primerDgRacial ? 1 + Math.floor(dgsRaza / 3) : 0;
    const total = dgs > dgsRaza ? Math.max(0, 1 + Math.floor(dgs / 3) - dotesDeLaRaza) : 0;
    if (total < 1)
        return [];
    const hitos: number[] = primerDgRacial ? [] : [1];
    for (let nivel = 3; nivel <= dgs; nivel += 3)
        hitos.push(nivel);
    return hitos.slice(Math.max(0, hitos.length - total));
}

describe('clase-niveles (la tabla por nivel de las clases de monstruo)', () => {
    it('una clase sin tabla da un DG en cada nivel, las dotes de siempre y ninguna armadura natural', () => {
        expect(tieneTablaPorNivel(sinTabla)).toBeFalse();
        expect(tieneTablaPorNivel({ Desglose_niveles: [{ Nivel: 1 }] })).toBeFalse();
        expect(tieneTablaPorNivel(null)).toBeFalse();
        expect(dgsDeClase(sinTabla, 3)).toBe(3);
        // Sin tabla cuenta su nivel aunque falten filas (un borrador o una clase recortada).
        expect(dgsDeClase(sinTabla, 7)).toBe(7);
        expect(daDgEnNivel(sinTabla, 2)).toBeTrue();
        expect(doteDeLaTabla(sinTabla, 1)).toBeNull();
        expect(armaduraNaturalDeClase(sinTabla, 3)).toBe(0);
    });

    it('los DG, las dotes y la armadura natural de las cinco tablas del libro', () => {
        const casos = [
            { tabla: ENGENDRO_VAMPIRICO, dgs: 4, an: 3 },
            { tabla: MOHRG, dgs: 14, an: 9 },
            { tabla: MOMIA, dgs: 8, an: 10 },
            { tabla: NECROFAGO, dgs: 4, an: 4 },
            { tabla: TUMULARIO, dgs: 4, an: 4 },
        ];
        casos.forEach(({ tabla, dgs, an }) => {
            const clase = normalizeClase(claseDeMonstruoApi(tabla));
            const maximo = clase.Nivel_max_claseo;
            expect(tieneTablaPorNivel(clase)).withContext(tabla.nombre).toBeTrue();
            expect(dgsDeClase(clase, maximo)).withContext(tabla.nombre).toBe(dgs);
            expect(armaduraNaturalDeClase(clase, maximo)).withContext(tabla.nombre).toBe(an);
            expect(hitosDotesProgresion({ dgsRaza: 0, dgsPlantillas: 0, clases: [{ clase, nivel: maximo }] }))
                .withContext(tabla.nombre).toEqual(tabla.dotes);
        });
    });

    it('el engendro vampírico, nivel a nivel: 3 DG a 5.º y la armadura natural total de cada fila (no la suma)', () => {
        const engendro = normalizeClase(claseDeMonstruoApi(ENGENDRO_VAMPIRICO));
        expect([1, 2, 3, 4, 5, 6, 7, 8].map((nivel) => dgsDeClase(engendro, nivel))).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
        expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map((nivel) => armaduraNaturalDeClase(engendro, nivel))).toEqual([0, 0, 1, 1, 2, 2, 2, 3, 3]);
        expect(daDgEnNivel(engendro, 2)).toBeFalse();
        expect(doteDeLaTabla(engendro, 6)).toBeTrue();
        expect(doteDeLaTabla(engendro, 3)).toBeFalse();
    });

    it('con una clase de monstruo y otra después: la tabla en sus niveles y lo de siempre en los demás (engendro 8 / guerrero 4)', () => {
        const engendro = normalizeClase(claseDeMonstruoApi(ENGENDRO_VAMPIRICO));
        expect(hitosDotesProgresion({ dgsRaza: 0, dgsPlantillas: 0, clases: [{ clase: engendro, nivel: 8 }, { clase: sinTabla, nivel: 4 }] }))
            .toEqual([1, 6, 9, 12]);
        // Con DG raciales (el gnoll, 2), la tabla empieza en el 3.er nivel de personaje.
        expect(hitosDotesProgresion({ dgsRaza: 2, dgsPlantillas: 0, clases: [{ clase: engendro, nivel: 8 }] })).toEqual([3, 8]);
    });

    it('sin clases con tabla, la regla de siempre (los mismos hitos que antes en todas las combinaciones)', () => {
        for (let dgsRaza = 0; dgsRaza <= 7; dgsRaza++)
            for (let dgsPlantillas = 0; dgsPlantillas <= 3; dgsPlantillas++)
                for (let niveles = 0; niveles <= 20; niveles++) {
                    // Dos clases sin tabla que suman esos niveles.
                    const primera = Math.ceil(niveles / 2);
                    const clases = [{ clase: sinTabla, nivel: primera }, { clase: null, nivel: niveles - primera }];
                    expect(hitosDotesProgresion({ dgsRaza, dgsPlantillas, clases }))
                        .withContext(`${dgsRaza} DG raciales, ${dgsPlantillas} de plantilla, ${niveles} niveles`)
                        .toEqual(hitosDeAntes(dgsRaza, dgsPlantillas, niveles));
                }
    });
});
