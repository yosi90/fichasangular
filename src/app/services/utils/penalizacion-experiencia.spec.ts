import {
    ClaseParaPenalizacion,
    clasePredilectaDeRaza,
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
        expect(penalizacion.predilectas).toEqual([]);
    });

    it('un enano (predilecta: guerrero) mago 4 / guerrero 1 / pícaro 1 pierde un 20 %: el guerrero no cuenta', () => {
        const clases = [clase(MAGO, 'mago', 4), clase(GUERRERO, 'guerrero', 1), clase(PICARO, 'pícaro', 1)];
        const penalizacion = penalizacionExperiencia(clases, { id: GUERRERO, comodin: null });
        expect(penalizacion.porcentaje).toBe(20);
        expect(penalizacion.penalizadas).toEqual(['pícaro 1']);
        expect(penalizacion.predilectas).toEqual(['guerrero 1']);
    });

    it('un humano (predilecta: cualquiera) no cuenta su clase de más nivel: guerrero 4 / pícaro 1 / explorador 1, 0 %', () => {
        const penalizacion = penalizacionExperiencia(guerrero4Picaro1Explorador1, { id: 0, comodin: 'cualquiera' });
        expect(penalizacion.porcentaje).toBe(0);
        expect(penalizacion.predilectas).toEqual(['guerrero 4']);
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

describe('penalizacionExperiencia sin clase predilecta (tercera tanda de reglas)', () => {
    const dragon = [clase(GUERRERO, 'guerrero', 5), clase(8, 'hechicero', 3), clase(PICARO, 'pícaro', 1)];

    it('un dragón (su libro no le da clase predilecta: «Ninguna») guerrero 5 / hechicero 3 / pícaro 1 pierde un 40 %', () => {
        const penalizacion = penalizacionExperiencia(dragon, { id: 0, comodin: null });
        expect(penalizacion.porcentaje).toBe(40);
        expect(penalizacion.penalizadas).toEqual(['hechicero 3', 'pícaro 1']);
        expect(penalizacion.predilectas).toEqual([]);
        expect(penalizacionExperiencia(dragon, null).porcentaje).toBe(40);
    });

    it('con «Cualquiera» la de más nivel no cuenta: el mismo, un 20 %', () => {
        expect(penalizacionExperiencia(dragon, { id: 0, comodin: 'cualquiera' }).porcentaje).toBe(20);
    });
});

describe('penalizacionExperiencia con varias clases predilectas (la prole de Bahamut, Races of the Dragon, pág. 10)', () => {
    it('un elfo prole (mago y guerrero) guerrero 4 / pícaro 1 / mago 1 no pierde nada: las dos predilectas no cuentan', () => {
        const clases = [clase(GUERRERO, 'guerrero', 4), clase(PICARO, 'pícaro', 1), clase(MAGO, 'mago', 1)];
        const penalizacion = penalizacionExperiencia(clases, { id: MAGO, comodin: null, otras: [GUERRERO] });
        expect(penalizacion.porcentaje).toBe(0);
        expect(penalizacion.predilectas).toEqual(['guerrero 4', 'mago 1']);
        // Sin guerrero (el elfo sin mutar), −20 %.
        expect(penalizacionExperiencia(clases, { id: MAGO, comodin: null }).porcentaje).toBe(20);
    });

    it('un humano prole («Cualquiera» y guerrero) no cuenta su clase de más nivel ni el guerrero', () => {
        const clases = [clase(MAGO, 'mago', 6), clase(GUERRERO, 'guerrero', 1), clase(PICARO, 'pícaro', 4)];
        const penalizacion = penalizacionExperiencia(clases, { id: 0, comodin: 'cualquiera', otras: [GUERRERO] });
        expect(penalizacion.porcentaje).toBe(0);
        expect(penalizacion.predilectas).toEqual(['mago 6', 'guerrero 1']);
        // Si su clase de más nivel ya es guerrero, la comodín no da otra: guerrero 6 / mago 4 / pícaro 1, −20 %.
        const guerrero6 = [clase(GUERRERO, 'guerrero', 6), clase(MAGO, 'mago', 4), clase(PICARO, 'pícaro', 1)];
        expect(penalizacionExperiencia(guerrero6, { id: 0, comodin: 'cualquiera', otras: [GUERRERO] }).porcentaje).toBe(20);
    });

    it('el texto las nombra todas', () => {
        const clases = [clase(EXPLORADOR, 'explorador', 4), clase(PICARO, 'pícaro', 1), clase(GUERRERO, 'guerrero', 2), clase(MAGO, 'mago', 1)];
        const texto = textoPenalizacionExperiencia(penalizacionExperiencia(clases, { id: MAGO, comodin: null, otras: [GUERRERO] }));
        expect(texto).toContain('No cuentan guerrero 2 y mago 1, sus clases predilectas.');
    });

    it('clasePredilectaDeRaza lee las de la API y de la caché', () => {
        expect(clasePredilectaDeRaza({ Id_clase_predilecta: 9, Clases_predilectas_extra: [{ Id: 7, Nombre: 'Guerrero' }] }))
            .toEqual({ id: 9, comodin: null, otras: [7] });
        expect(clasePredilectaDeRaza({ Id_clase_predilecta: 0, Clase_predilecta_comodin: 'cualquiera' }))
            .toEqual({ id: 0, comodin: 'cualquiera', otras: [] });
        expect(clasePredilectaDeRaza(null)).toBeNull();
    });
});
