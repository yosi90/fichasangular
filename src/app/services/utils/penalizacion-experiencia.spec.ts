import {
    ClaseParaPenalizacion,
    etiquetaPenalizacionExperiencia,
    penalizacionExperiencia,
    textoPenalizacionExperiencia,
} from './penalizacion-experiencia';

// Ids como los de los datos (los de `rol_dev`), pero la regla no los mira: solo compara con el de la raza.
const GUERRERO = 7;
const PICARO = 12;
const EXPLORADOR = 6;
const MAGO = 9;

function clase(id: number, nombre: string, nivel: number, prestigio = false): ClaseParaPenalizacion {
    return { id, nombre, nivel, prestigio };
}

describe('penalizacionExperiencia (MJ cap. 3, «Experiencia en multiclase»)', () => {
    const guerrero4Picaro1Explorador1 = [clase(GUERRERO, 'guerrero', 4), clase(PICARO, 'pícaro', 1), clase(EXPLORADOR, 'explorador', 1)];

    it('un elfo (predilecta: mago) guerrero 4 / pícaro 1 / explorador 1 pierde un 40 %', () => {
        const penalizacion = penalizacionExperiencia(guerrero4Picaro1Explorador1, { id: MAGO, comodin: null });
        expect(penalizacion.porcentaje).toBe(40);
        expect(penalizacion.penalizadas).toEqual(['pícaro 1', 'explorador 1']);
        expect(penalizacion.referencia).toBe('guerrero 4');
        expect(penalizacion.predilecta).toBeNull();
    });

    it('un enano (predilecta: guerrero) mago 4 / guerrero 1 / pícaro 1 pierde un 20 %: el guerrero no cuenta', () => {
        const clases = [clase(MAGO, 'mago', 4), clase(GUERRERO, 'guerrero', 1), clase(PICARO, 'pícaro', 1)];
        const penalizacion = penalizacionExperiencia(clases, { id: GUERRERO, comodin: null });
        expect(penalizacion.porcentaje).toBe(20);
        expect(penalizacion.penalizadas).toEqual(['pícaro 1']);
        expect(penalizacion.predilecta).toBe('guerrero 1');
    });

    it('un humano (predilecta: cualquiera) no cuenta su clase de más nivel: guerrero 4 / pícaro 1 / explorador 1, 0 %', () => {
        const penalizacion = penalizacionExperiencia(guerrero4Picaro1Explorador1, { id: 0, comodin: 'cualquiera' });
        expect(penalizacion.porcentaje).toBe(0);
        expect(penalizacion.predilecta).toBe('guerrero 4');
    });

    it('a un nivel o menos de la más alta no hay penalización', () => {
        expect(penalizacionExperiencia([clase(GUERRERO, 'guerrero', 3), clase(PICARO, 'pícaro', 2)], { id: MAGO, comodin: null }).porcentaje).toBe(0);
        expect(penalizacionExperiencia([clase(GUERRERO, 'guerrero', 3), clase(PICARO, 'pícaro', 1)], { id: MAGO, comodin: null }).porcentaje).toBe(20);
    });

    it('las clases de prestigio no cuentan', () => {
        const clases = [clase(GUERRERO, 'guerrero', 6), clase(500, 'caballero protector', 1, true)];
        expect(penalizacionExperiencia(clases, { id: MAGO, comodin: null }).porcentaje).toBe(0);
    });

    it('con una sola clase, o sin clases, no hay penalización', () => {
        expect(penalizacionExperiencia([clase(GUERRERO, 'guerrero', 5)], { id: MAGO, comodin: null }).porcentaje).toBe(0);
        expect(penalizacionExperiencia([], { id: MAGO, comodin: null }).porcentaje).toBe(0);
        expect(penalizacionExperiencia(null, null).porcentaje).toBe(0);
    });

    it('sin clase predilecta en los datos cuentan todas', () => {
        expect(penalizacionExperiencia(guerrero4Picaro1Explorador1, null).porcentaje).toBe(40);
    });

    it('dice cuánto y por qué', () => {
        const penalizacion = penalizacionExperiencia(
            [clase(MAGO, 'mago', 4), clase(GUERRERO, 'guerrero', 1), clase(PICARO, 'pícaro', 1)],
            { id: GUERRERO, comodin: null },
        );
        expect(etiquetaPenalizacionExperiencia(penalizacion)).toBe('−20 % de PX');
        expect(textoPenalizacionExperiencia(penalizacion)).toBe(
            'Gana un 20 % menos de experiencia: pícaro 1 está a más de un nivel de mago 4 (Manual del jugador, '
            + '«Experiencia en multiclase»). No cuenta guerrero 1, su clase predilecta.');
        expect(etiquetaPenalizacionExperiencia(penalizacionExperiencia([], null))).toBe('');
        expect(textoPenalizacionExperiencia(null)).toBe('');
    });
});
