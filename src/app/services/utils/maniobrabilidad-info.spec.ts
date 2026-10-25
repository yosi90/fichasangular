import { buildManiobrabilidadInfoSecciones, formatearContramarcha, formatearPies } from './maniobrabilidad-info';

describe('maniobrabilidad-info', () => {
    it('la contramarcha: -1 no puede, 0 libre, n > 0 los pies que cuesta', () => {
        expect(formatearContramarcha(-1)).toBe('No');
        expect(formatearContramarcha(0)).toBe('Libre');
        expect(formatearContramarcha(5)).toBe("5'");
        expect(formatearContramarcha(null)).toBe('No especifica');
    });

    it('el descenso y ascenso, en pies (0 incluido)', () => {
        expect(formatearPies(20)).toBe("20'");
        expect(formatearPies(0)).toBe("0'");
        expect(formatearPies(undefined)).toBe('No especifica');
    });

    it('la perfecta tiene contramarcha libre, no «No»; flotar y volar hacia atrás siguen como sí/no', () => {
        const [seccion] = buildManiobrabilidadInfoSecciones({
            Nombre: 'Perfecta', Velocidad_avance: 'Ninguna', Flotar: 1, Volar_atras: 1, Contramarcha: 0, Descenso_ascenso: 0,
        });
        expect(seccion.items).toContain('Contramarcha: Libre.');
        expect(seccion.items).toContain("Descenso y ascenso: 0'.");
        expect(seccion.items).toContain('Flotar: Sí.');
        expect(seccion.items).toContain('Volar atrás: Sí.');
    });

    it('la buena cuesta 5 pies y la mala no puede', () => {
        const buena = buildManiobrabilidadInfoSecciones({ Nombre: 'Buena', Contramarcha: 5, Descenso_ascenso: 0 })[0];
        const mala = buildManiobrabilidadInfoSecciones({ Nombre: 'Mala', Contramarcha: -1, Descenso_ascenso: 10, Flotar: 0 })[0];
        expect(buena.items).toContain("Contramarcha: 5'.");
        expect(mala.items).toContain('Contramarcha: No.');
        expect(mala.items).toContain("Descenso y ascenso: 10'.");
        expect(mala.items).toContain('Flotar: No.');
    });
});
