import { ajustesEnvejecimiento, edadesDeLaRaza, edadFueraDelManual, EdadesRaza, etapaEdad, razaTieneEdades, textoEnvejecimiento } from './edad-personaje';

describe('edad-personaje (MJ, tablas 6-4 y 6-5, pág. 109)', () => {
    // El humano del Manual del jugador: mayoría de edad a los 15; mediana edad, 35; viejo, 53; venerable, 70.
    const humano: EdadesRaza = { Edad_adulto: 15, Edad_mediana: 35, Edad_viejo: 53, Edad_venerable: 70 };

    it('las etapas salen de las edades de la raza, y entre viejo y venerable es viejo', () => {
        expect(etapaEdad(14, humano)?.nombre).toBe('Joven');
        expect(etapaEdad(15, humano)?.nombre).toBe('Adulto');
        expect(etapaEdad(34, humano)?.nombre).toBe('Adulto');
        expect(etapaEdad(35, humano)?.nombre).toBe('Mediana edad');
        expect(etapaEdad(53, humano)?.nombre).toBe('Viejo');
        expect(etapaEdad(69, humano)?.nombre).toBe('Viejo');
        expect(etapaEdad(70, humano)?.nombre).toBe('Venerable');
        expect(etapaEdad(105, humano)?.nombre).toBe('Venerable');
    });

    it('los pasos se acumulan: −1/+1, −3/+2 y −6/+3', () => {
        expect(etapaEdad(20, humano)).toEqual(jasmine.objectContaining({ pasos: 0, fisico: 0, mental: 0 }));
        expect(etapaEdad(40, humano)).toEqual(jasmine.objectContaining({ pasos: 1, fisico: -1, mental: 1 }));
        expect(etapaEdad(60, humano)).toEqual(jasmine.objectContaining({ pasos: 2, fisico: -3, mental: 2 }));
        expect(etapaEdad(80, humano)).toEqual(jasmine.objectContaining({ pasos: 3, fisico: -6, mental: 3 }));
    });

    it('las edades de la raza, en orden y con su nombre corto; la que falta, 0', () => {
        expect(edadesDeLaRaza(humano)).toEqual([
            { nombre: 'Adulto', valor: 15 },
            { nombre: 'Mediana', valor: 35 },
            { nombre: 'Viejo', valor: 53 },
            { nombre: 'Venerable', valor: 70 },
        ]);
        expect(edadesDeLaRaza({ Edad_adulto: 20, Edad_mediana: null }).map((edad) => edad.valor)).toEqual([20, 0, 0, 0]);
        expect(edadesDeLaRaza(null).map((edad) => edad.nombre)).toEqual(['Adulto', 'Mediana', 'Viejo', 'Venerable']);
    });

    it('sin edad o sin las edades de la raza no hay etapa', () => {
        expect(etapaEdad(0, humano)).toBeNull();
        expect(etapaEdad(40, null)).toBeNull();
        expect(etapaEdad(40, { Edad_adulto: 0, Edad_mediana: 0, Edad_viejo: 0, Edad_venerable: 0 })).toBeNull();
        expect(razaTieneEdades({ Edad_adulto: 0, Edad_venerable: 0 })).toBeFalse();
        expect(razaTieneEdades(humano)).toBeTrue();
    });

    it('solo sale del manual por debajo de la mayoría de edad: pasada la venerable llega hasta la edad máxima', () => {
        expect(edadFueraDelManual(14, humano)).toBeTrue();
        expect(edadFueraDelManual(15, humano)).toBeFalse();
        expect(edadFueraDelManual(100, humano)).toBeFalse();
        expect(edadFueraDelManual(5, { Edad_adulto: 0, Edad_venerable: 0 })).toBeFalse();
    });

    it('el texto del envejecimiento', () => {
        expect(textoEnvejecimiento(etapaEdad(60, humano))).toBe('−3 a Fue, Des y Con; +2 a Int, Sab y Car');
        expect(textoEnvejecimiento(etapaEdad(20, humano))).toBe('');
    });

    it('los ajustes no bajan ninguna puntuación de 1 y no tocan las perdidas', () => {
        const venerable = etapaEdad(75, humano);
        const ajustes = ajustesEnvejecimiento(
            venerable,
            { Fuerza: 4, Destreza: 12, Constitucion: 10, Inteligencia: 10, Sabiduria: 8, Carisma: 9 },
            (clave) => clave === 'Constitucion',
        );

        expect(ajustes).toEqual([
            { clave: 'Fuerza', valor: -3 },
            { clave: 'Destreza', valor: -6 },
            { clave: 'Inteligencia', valor: 3 },
            { clave: 'Sabiduria', valor: 3 },
            { clave: 'Carisma', valor: 3 },
        ]);
        expect(ajustesEnvejecimiento(etapaEdad(30, humano), { Fuerza: 10 })).toEqual([]);
    });
});
