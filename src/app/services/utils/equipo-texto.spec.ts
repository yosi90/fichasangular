import { categoriaArmadura, textoConSigno, textoDestrezaMaxima, textoOrigenDescripcion, textoPeso, textoPrecio } from './equipo-texto';

describe('equipo-texto', () => {
    it('la Destreza máxima sin límite se enseña «Sin límite»', () => {
        expect(textoDestrezaMaxima(null)).toBe('Sin límite');
        expect(textoDestrezaMaxima(undefined)).toBe('Sin límite');
        expect(textoDestrezaMaxima(0)).toBe('+0');
        expect(textoDestrezaMaxima(4)).toBe('+4');
    });

    it('precio y peso con coma decimal, y «—» si no tienen', () => {
        expect(textoPrecio(0.5)).toBe('0,5 po');
        expect(textoPrecio(15)).toBe('15 po');
        expect(textoPrecio(null)).toBe('—');
        expect(textoPeso(0.5)).toBe('0,5 lb');
        expect(textoPeso(null)).toBe('—');
    });

    it('la categoría de una armadura es su peso y la de un escudo, su tipo', () => {
        expect(categoriaArmadura({ Es_escudo: false, Peso_armadura: { Nombre: 'Pesada' }, Tipo_escudo: null })).toBe('Pesada');
        expect(categoriaArmadura({ Es_escudo: true, Peso_armadura: null, Tipo_escudo: { Nombre: 'Pavés' } })).toBe('Escudo (pavés)');
        expect(categoriaArmadura({ Es_escudo: true, Peso_armadura: null, Tipo_escudo: null })).toBe('Escudo');
        expect(categoriaArmadura(null)).toBe('');
    });

    it('el origen del texto y el signo', () => {
        expect(textoOrigenDescripcion('srd')).toBe('Texto del SRD');
        expect(textoOrigenDescripcion('propia')).toBe('Descripción propia');
        expect(textoConSigno(-1)).toBe('-1');
        expect(textoConSigno(0)).toBe('+0');
    });
});
