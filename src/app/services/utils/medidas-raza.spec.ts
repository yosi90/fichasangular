import { alturaFueraDeRango, pesoFueraDeRango, textoRangoAltura, textoRangoPeso } from './medidas-raza';

describe('medidas-raza: la altura y el peso de la raza', () => {
    const enano = { Altura_rango_inf: 1.2, Altura_rango_sup: 1.45, Peso_rango_inf: 50, Peso_rango_sup: 95.5 };

    it('el rango en texto, con coma decimal y su unidad; vacío si la raza no lo da', () => {
        expect(textoRangoAltura(enano)).toBe('1,2-1,45 m');
        expect(textoRangoPeso(enano)).toBe('50-95,5 kg');
        expect(textoRangoAltura({ Altura_rango_inf: 0, Altura_rango_sup: 0 })).toBe('');
        expect(textoRangoPeso({})).toBe('');
        expect(textoRangoAltura(null)).toBe('');
    });

    it('fuera del rango, solo si la raza lo da', () => {
        expect(alturaFueraDeRango(1.5, enano)).toBeTrue();
        expect(alturaFueraDeRango(1.3, enano)).toBeFalse();
        expect(pesoFueraDeRango(40, enano)).toBeTrue();
        expect(pesoFueraDeRango(40, { Peso_rango_inf: 0, Peso_rango_sup: 0 })).toBeFalse();
    });
});
