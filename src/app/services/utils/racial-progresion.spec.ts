import { normalizarProgresionRacial, normalizeRacial } from './racial-mapper';
import { aplicarProgresionRacial, frasesProgresionRacial, tieneProgresionRacial, velocidadConProgresion } from './racial-progresion';

// Los mismos casos que la regla de la API (`tests/test_racial_progresion.py`): los aspectos de la prole de Bahamut
// (Races of the Dragon, págs. 9-10) y del nacido del Infierno (Fiendish Codex II, pág. 78).

const racial = (Id: number, Nombre: string, Progresion: any[] = []) => normalizeRacial({ Id, Nombre, Descripcion: '', Oficial: true, Progresion });
const fila = (Desde: number, extra: Record<string, any> = {}) => ({
    Medida: 'dg', Desde, Gana: null, Sustituye: null, Tipo_dote: null, Velocidad: null, Valor: null, Frase: `A los ${Desde} DG`, ...extra,
});
const ref = (r: { Id: number; Nombre: string; }) => ({ Id: r.Id, Nombre: r.Nombre });
const VO30 = racial(901, "Visión en la oscuridad 30'");
const VO60 = racial(8, "Visión en la oscuridad 60'");
const VO90 = racial(902, "Visión en la oscuridad 90'");
const PENUMBRA = racial(18, 'Visión en la penumbra');
const TRIPLE = racial(903, 'Visión en la penumbra triple');
const CIEGO = racial(905, "Sentido ciego 30'");

const MENTE = racial(38, 'Aspecto dracónico (mente)', [
    fila(1, { Gana: VO30 }), fila(1, { Gana: PENUMBRA }), fila(6, { Gana: VO60, Sustituye: ref(VO30) }),
    fila(9, { Gana: VO90, Sustituye: ref(VO60) }), fila(9, { Gana: TRIPLE, Sustituye: ref(PENUMBRA) }), fila(15, { Gana: CIEGO }),
]);
const CORAZON = racial(34, 'Aspecto dracónico (corazón)', [1, 3, 6, 9, 12, 15, 18].map((d, i) => fila(d, { Valor: `${i + 1}d8` })));
const ALAS = racial(41, 'Aspecto dracónico (alas)', [
    fila(6, { Gana: racial(908, 'Vuelo (aspecto dracónico de las alas)'), Velocidad: { Tipo: 'Volar', Pies: 30, Maniobrabilidad: { Id: 3, Nombre: 'Regular' } } }),
]);
const CUERPO = racial(4846, 'Aspecto infernal (cuerpo)', [fila(4, { Tipo_dote: { Id: 88, Nombre: 'Tocado por diablos' } }), fila(14, { Tipo_dote: { Id: 88, Nombre: 'Tocado por diablos' } })]);

const nombres = (r: { raciales: { Nombre: string; }[]; }) => r.raciales.map((x) => x.Nombre);

describe('racial-progresion: lo que crece con los DG o llega por nivel', () => {
    it('lee la Progresion del contrato y la deja vacía si no viene', () => {
        expect(MENTE.Progresion?.length).toBe(6);
        expect(MENTE.Progresion?.[2].Sustituye).toEqual({ Id: 901, Nombre: "Visión en la oscuridad 30'" });
        expect(MENTE.Progresion?.[2].Gana?.Progresion).toEqual([]);
        expect(racial(1, 'Sin nada').Progresion).toEqual([]);
        expect(normalizarProgresionRacial([{ Medida: 'dg', Desde: 0 }, null, { Medida: 'nivel', Desde: 2, Valor: '2d8' }], normalizeRacial)
            .map((f) => [f.Medida, f.Desde, f.Valor])).toEqual([['nivel', 2, '2d8']]);
        expect(tieneProgresionRacial([VO30, MENTE])).toBeTrue();
        expect(tieneProgresionRacial([VO30])).toBeFalse();
    });

    it('la mente: 30\' y penumbra; 60\' a 6 DG; 90\' y la penumbra triple a 9; sentido ciego a 15', () => {
        expect(nombres(aplicarProgresionRacial([MENTE], { dg: 5, nivel: 5 })))
            .toEqual(['Aspecto dracónico (mente)', 'Visión en la penumbra', "Visión en la oscuridad 30'"]);
        expect(nombres(aplicarProgresionRacial([MENTE], { dg: 6, nivel: 6 })))
            .toEqual(['Aspecto dracónico (mente)', "Visión en la oscuridad 60'", 'Visión en la penumbra']);
        const a9 = nombres(aplicarProgresionRacial([MENTE], { dg: 9, nivel: 9 }));
        expect(a9).toContain("Visión en la oscuridad 90'");
        expect(a9).toContain('Visión en la penumbra triple');
        expect(a9).not.toContain('Visión en la penumbra');
        expect(nombres(aplicarProgresionRacial([MENTE], { dg: 15, nivel: 15 }))).toContain("Sentido ciego 30'");
        const ganado = aplicarProgresionRacial([MENTE], { dg: 6, nivel: 6 }).raciales.find((x) => x.Id === 8)!;
        expect(ganado.Origen).toBe('Aspecto dracónico (mente), a los 6 DG');
        expect(aplicarProgresionRacial([MENTE], { dg: 1, nivel: 1 }).raciales.find((x) => x.Id === 901)!.Origen)
            .toBe('Aspecto dracónico (mente), a 1 DG');
        expect(MENTE.Origen).toBe('');
    });

    it('el corazón: el aliento crece 1d8 cada 3 DG', () => {
        for (const [dg, valor] of [[1, '1d8'], [2, '1d8'], [3, '2d8'], [6, '3d8'], [18, '7d8'], [20, '7d8']] as const)
            expect(aplicarProgresionRacial([CORAZON], { dg, nivel: dg }).raciales[0].Valor).withContext(`${dg}`).toBe(valor);
    });

    it('las alas: vuelo a 30\' (regular) a los 6 DG, sin bajar una velocidad mayor', () => {
        expect(aplicarProgresionRacial([ALAS], { dg: 5, nivel: 5 }).velocidades).toEqual({});
        const a6 = aplicarProgresionRacial([ALAS], { dg: 6, nivel: 6 });
        expect(a6.velocidades).toEqual({ Volar: { Pies: 30, Maniobrabilidad: { Id: 3, Nombre: 'Regular' } } });
        expect(velocidadConProgresion(0, 'Volar', a6.velocidades)).toBe(30);
        expect(velocidadConProgresion(60, 'Volar', a6.velocidades)).toBe(60);
    });

    it('el cuerpo del nacido del Infierno: una dote de tipo Tocado por diablos a 4 y otra a 14 DG; por nivel cuenta el nivel', () => {
        expect(aplicarProgresionRacial([CUERPO], { dg: 3, nivel: 3 }).dotes).toEqual([]);
        expect(aplicarProgresionRacial([CUERPO], { dg: 14, nivel: 14 }).dotes.map((d) => [d.Desde, d.Tipo_dote.Nombre, d.Clave]))
            .toEqual([[4, 'Tocado por diablos', '4846:dg:4:88'], [14, 'Tocado por diablos', '4846:dg:14:88']]);
        const sigilo = racial(1, 'Sigilo', [fila(2, { Medida: 'nivel', Gana: CIEGO })]);
        expect(nombres(aplicarProgresionRacial([sigilo], { dg: 5, nivel: 1 }))).toEqual(['Sigilo']);
        expect(nombres(aplicarProgresionRacial([sigilo], { dg: 1, nivel: 2 }))).toEqual(['Sigilo', "Sentido ciego 30'"]);
    });

    it('no repite lo que ya tiene y da las frases para el detalle', () => {
        const r = aplicarProgresionRacial([MENTE, { ...VO60, Origen: 'Aspecto dracónico (mente), a los 6 DG' }], { dg: 6, nivel: 6 });
        expect(r.raciales.filter((x) => x.Id === 8).length).toBe(1);
        expect(frasesProgresionRacial(CORAZON)?.length).toBe(7);
        expect(frasesProgresionRacial(VO30)).toBeNull();
    });
});
