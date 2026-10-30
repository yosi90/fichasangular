import { categoriaArmadura, nombreConCantidad, textoConSigno, textoDestrezaMaxima, textoMejora, textoOrigenDescripcion, textoPeso, textoPrecio, textoPrecioGenerico } from './equipo-texto';

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
        // El de los dados, con el menos tipográfico del lienzo.
        expect(textoConSigno(3, '−')).toBe('+3');
        expect(textoConSigno(-1, '−')).toBe('−1');
        expect(textoConSigno(0, '−')).toBe('+0');
    });

    it('la mejora, con la segunda cabeza de un arma doble solo si la lleva', () => {
        expect(textoMejora(2, null)).toBe('+2');
        expect(textoMejora(1, 1)).toBe('+1/+1');
        expect(textoMejora(1, 0)).toBe('+1');
    });

    it('el precio de un genérico y una pieza con su cantidad', () => {
        expect(textoPrecioGenerico({ Precio_por_nivel: 50 })).toBe('50 po × nivel × NL');
        expect(nombreConCantidad({ nombre: 'Flechas', cantidad: 20 })).toBe('Flechas ×20');
        expect(nombreConCantidad({ nombre: 'Espada larga', cantidad: 1 })).toBe('Espada larga');
    });
});
