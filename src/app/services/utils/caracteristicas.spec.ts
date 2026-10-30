import { MonstruoCaracteristicas } from 'src/app/interfaces/monstruo';
import {
    CATALOGO_CARACTERISTICAS,
    modificadorCaracteristica,
    modificadorParaSumar,
    textoCaracteristicaMonstruo,
    textoModificadorCaracteristica,
    textoValorCaracteristica,
} from './caracteristicas';

const constructo: MonstruoCaracteristicas = {
    Fuerza: 16, Fuerza_modificador: 3,
    Destreza: 9, Destreza_modificador: -1,
    Constitucion: null, Constitucion_modificador: null,
    Inteligencia: 11, Inteligencia_modificador: 0,
    Sabiduria: 20, Sabiduria_modificador: 5,
    Carisma: 15, Carisma_modificador: 2,
};

describe('caracteristicas', () => {
    it('el modificador del borrador: (valor − 10) / 2 hacia abajo', () => {
        expect(modificadorCaracteristica(10)).toBe(0);
        expect(modificadorCaracteristica(11)).toBe(0);
        expect(modificadorCaracteristica(9)).toBe(-1);
        expect(modificadorCaracteristica(18)).toBe(4);
        expect(modificadorCaracteristica(1)).toBe(-5);
    });

    it('el valor y el modificador de la API, con signo y «—» sin valor', () => {
        expect(textoValorCaracteristica(constructo, 'Fuerza')).toBe('16');
        expect(textoModificadorCaracteristica(constructo, 'Fuerza')).toBe('+3');
        expect(textoModificadorCaracteristica(constructo, 'Inteligencia')).toBe('+0');
        expect(textoModificadorCaracteristica(constructo, 'Destreza')).toBe('-1');
        expect(textoValorCaracteristica(constructo, 'Constitucion')).toBe('—');
        expect(textoModificadorCaracteristica(constructo, 'Constitucion')).toBe('—');
    });

    it('«16 (+3)» con el modificador entre paréntesis, y «—» solo, sin paréntesis', () => {
        expect(textoCaracteristicaMonstruo(constructo, 'Fuerza')).toBe('16 (+3)');
        expect(textoCaracteristicaMonstruo(constructo, 'Inteligencia')).toBe('11 (+0)');
        expect(textoCaracteristicaMonstruo(constructo, 'Constitucion')).toBe('—');
        expect(textoCaracteristicaMonstruo(null, 'Fuerza')).toBe('—');
    });

    it('para sumar a un total, una característica sin valor cuenta +0', () => {
        expect(modificadorParaSumar(constructo, 'Sabiduria')).toBe(5);
        expect(modificadorParaSumar(constructo, 'Constitucion')).toBe(0);
    });
});

describe('CATALOGO_CARACTERISTICAS', () => {
    it('da las seis por su Id_caracteristica, con sus tildes', () => {
        expect(CATALOGO_CARACTERISTICAS).toEqual([
            { id: 1, nombre: 'Fuerza' },
            { id: 2, nombre: 'Destreza' },
            { id: 3, nombre: 'Constitución' },
            { id: 4, nombre: 'Inteligencia' },
            { id: 5, nombre: 'Sabiduría' },
            { id: 6, nombre: 'Carisma' },
        ]);
    });
});
