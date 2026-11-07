import {
    avisoPenalizacionConLimite,
    ClaseParaPenalizacion,
    clasePredilectaDeRaza,
    etiquetaPenalizacionExperiencia,
    limiteNepConPenalizacion,
    motivoLimiteNepCampana,
    nepMaximoConPenalizacion,
    penalizacionExperiencia,
    textoLimiteNepCampana,
    textoPenalizacionExperiencia,
} from './penalizacion-experiencia';

// Ids como los de los datos (los de `rol_dev`), pero la regla no los mira: solo compara con el de la raza.
const GUERRERO = 7;
const PICARO = 12;
const EXPLORADOR = 6;
const MAGO = 9;
const ARCHIMAGO = 15;

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

describe('el límite de NEP de la campaña con la penalización de PX (propietario, 2026-11-07)', () => {
    const elfo = { id: MAGO, comodin: null, otras: [] };
    const enano = { id: GUERRERO, comodin: null, otras: [] };

    it('el NEP máximo con cada penalización: límite 8 (28.000 PX)', () => {
        // −20 %: 22.400 PX (NEP 7, 21.000); −40 %: 16.800 (NEP 6); −100 %: 0 (NEP 1). Los mismos que la API.
        expect([0, 20, 40, 60, 100, 140].map((p) => nepMaximoConPenalizacion(8, p))).toEqual([8, 7, 6, 5, 1, 1]);
        expect([nepMaximoConPenalizacion(0, 20), nepMaximoConPenalizacion(1, 20), nepMaximoConPenalizacion(20, 0)]).toEqual([0, 1, 20]);
    });

    it('elfo mago 8 y elfo guerrero 4 / pícaro 4 llegan a 8; guerrero 5 / pícaro 3, a 7', () => {
        const mago8 = limiteNepConPenalizacion(8, penalizacionExperiencia([clase(MAGO, 'mago', 8)], elfo));
        const igualados = limiteNepConPenalizacion(8, penalizacionExperiencia([clase(GUERRERO, 'guerrero', 4), clase(PICARO, 'pícaro', 4)], elfo));
        const descompensado = limiteNepConPenalizacion(8, penalizacionExperiencia([clase(GUERRERO, 'guerrero', 5), clase(PICARO, 'pícaro', 3)], elfo));
        expect([mago8?.maximo, igualados?.maximo, descompensado?.maximo]).toEqual([8, 8, 7]);
        expect(motivoLimiteNepCampana(mago8, 8)).toBeNull();
        expect(motivoLimiteNepCampana(igualados, 8)).toBeNull();
        expect(motivoLimiteNepCampana(descompensado, 8))
            .toBe('bloqueada por campaña: con un 20 % de penalización de experiencia, su NEP máximo baja a 7 y tendría NEP 8');
        expect(motivoLimiteNepCampana(mago8, 9)).toBe('bloqueada por campaña: su NEP máximo es 8 y tendría NEP 9');
    });

    it('con la predilecta y una de prestigio no hay penalización ni baja el máximo', () => {
        // Elfo mago 5 / guerrero 1 / archimago 2: mago es su predilecta y archimago, de prestigio.
        const elfoArchimago = [clase(MAGO, 'mago', 5), clase(GUERRERO, 'guerrero', 1), clase(ARCHIMAGO, 'archimago', 2, true)];
        expect(limiteNepConPenalizacion(8, penalizacionExperiencia(elfoArchimago, elfo))?.maximo).toBe(8);
        // El mismo con un enano (predilecta: guerrero): mago 5 / pícaro 1 cuentan, −20 %, NEP 7.
        const enanoArchimago = [clase(MAGO, 'mago', 5), clase(PICARO, 'pícaro', 1), clase(ARCHIMAGO, 'archimago', 2, true)];
        expect(limiteNepConPenalizacion(8, penalizacionExperiencia(enanoArchimago, enano))?.maximo).toBe(7);
    });

    it('sin límite no cambia nada', () => {
        expect(limiteNepConPenalizacion(null, { porcentaje: 40, penalizadas: [], referencia: null, predilectas: [] })).toBeNull();
        expect(motivoLimiteNepCampana(null, 30)).toBeNull();
        expect(avisoPenalizacionConLimite(null, 0)).toBe('');
        expect(textoLimiteNepCampana(null, 6)).toBe('');
    });

    it('avisa al multiclasear solo si la penalización aparece o sube, y enseña el máximo efectivo', () => {
        const con20 = limiteNepConPenalizacion(8, { porcentaje: 20, penalizadas: ['pícaro 3'], referencia: 'guerrero 5', predilectas: [] });
        expect(avisoPenalizacionConLimite(con20, 0))
            .toBe('Con esta clase tendrá un 20 % de penalización de experiencia: en esta campaña, su nivel máximo (NEP) baja de 8 a 7.');
        expect(avisoPenalizacionConLimite(con20, 20)).toBe('');
        expect(textoLimiteNepCampana(con20, 6))
            .toBe('La campaña limita el NEP de los personajes nuevos a 8; ahora tiene NEP 6. Con su penalización de experiencia (20 %), su NEP máximo es 7.');
        expect(textoLimiteNepCampana(limiteNepConPenalizacion(8, null), 6)).toBe('La campaña limita el NEP de los personajes nuevos a 8; ahora tiene NEP 6.');
    });
});
