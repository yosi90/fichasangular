import { ArmaNatural, ArmaNaturalPlantilla, FormaArmaNatural, ModoArmaNatural } from 'src/app/interfaces/arma-natural';
import {
    contarArmasNaturales,
    cuerpoDeArmasNaturales,
    filaArmaNatural,
    filasDeArmasNaturales,
    leerArmasNaturales,
    leerArmasNaturalesPlantilla,
    problemaDeArmasNaturales,
    textoDeArmasNaturales,
} from './armas-naturales';

const ID = { Mordisco: 1, Garra: 2, Cornada: 3, Golpetazo: 4, Tentaculo: 6, Toque: 14 } as const;

function arma(nombre: keyof typeof ID, cantidad: number, primaria = true): ArmaNatural {
    return { Id_arma_natural: ID[nombre], Arma_natural: nombre, Cantidad: cantidad, Dano: null, Primaria: primaria, Texto: `${cantidad} ${nombre}` };
}

function dePlantilla(nombre: keyof typeof ID, cantidad: number, modo: ModoArmaNatural, forma: FormaArmaNatural = 'todas'): ArmaNaturalPlantilla {
    return { ...arma(nombre, cantidad), Modo: modo, Forma: forma };
}

const ELFO = { Armas_naturales: [] as ArmaNatural[] };
const HUMANO = {};
const TROLL = { Armas_naturales: [arma('Garra', 2), arma('Mordisco', 1)] };
const FORJADO = { Armas_naturales: [arma('Golpetazo', 1)] };

describe('contarArmasNaturales con las de las aptitudes de clase (las clases de monstruo, 2026-11-07)', () => {
    const arma = (id: number, nombre: string, cantidad: number) =>
        ({ Id_arma_natural: id, Arma_natural: nombre, Cantidad: cantidad, Dano: null, Primaria: true, Texto: nombre });

    it('una aptitud da su arma si no la tiene ya: el golpetazo de la raza mutada y el de su clase son uno', () => {
        expect(contarArmasNaturales({ Armas_naturales: [arma(4, 'Golpetazo', 1)] }, [], [arma(4, 'Golpetazo', 1)])).toBe(1);
    });

    it('el necrófago 2.º: el mordisco de la raza y de la clase y sus dos garras, tres', () => {
        expect(contarArmasNaturales({ Armas_naturales: [arma(1, 'Mordisco', 1)] }, [], [arma(1, 'Mordisco', 1), arma(2, 'Garra', 2)])).toBe(3);
    });

    it('sin aptitudes, lo de siempre', () => {
        expect(contarArmasNaturales({ Armas_naturales: [arma(1, 'Mordisco', 1)] })).toBe(1);
    });
});

describe('armas naturales', () => {
    it('se leen igual de la API y de la caché, y una plantilla trae su modo y su forma', () => {
        expect(leerArmasNaturales([{ Id_arma_natural: 2, Arma_natural: 'Garra', Cantidad: 2, Dano: '1d4', Primaria: true, Texto: '2 garras 1d4' }]))
            .toEqual([{ Id_arma_natural: 2, Arma_natural: 'Garra', Cantidad: 2, Dano: '1d4', Primaria: true, Texto: '2 garras 1d4' }]);
        expect(leerArmasNaturales(undefined)).toEqual([]);
        const [toque] = leerArmasNaturalesPlantilla([{ Id_arma_natural: 14, Arma_natural: 'Toque', Cantidad: 1, Dano: null, Primaria: true, Texto: 'Toque', Modo: 'sustituye', Forma: 'todas' }]);
        expect([toque.Modo, toque.Forma]).toEqual(['sustituye', 'todas']);
        expect(leerArmasNaturalesPlantilla([{ Id_arma_natural: 4, Arma_natural: 'Golpetazo', Cantidad: 1 }])[0].Modo).toBe('suma');
        expect(textoDeArmasNaturales(TROLL.Armas_naturales)).toBe('2 Garra, 1 Mordisco');
    });

    it('cuenta las de la raza: el elfo y el humano, ninguna; el troll, tres', () => {
        expect(contarArmasNaturales(ELFO)).toBe(0);
        expect(contarArmasNaturales(HUMANO)).toBe(0);
        expect(contarArmasNaturales(null)).toBe(0);
        expect(contarArmasNaturales(TROLL)).toBe(3);
    });

    it('una plantilla suma, da lo que falta, quita o sustituye', () => {
        const semidragon = { Armas_naturales: [dePlantilla('Garra', 2, 'minimo'), dePlantilla('Mordisco', 1, 'minimo')] };
        expect(contarArmasNaturales(ELFO, [semidragon])).toBe(3);
        expect(contarArmasNaturales(TROLL, [semidragon])).toBe(3);
        const vampiro = { Armas_naturales: [dePlantilla('Golpetazo', 1, 'minimo')] };
        expect(contarArmasNaturales(FORJADO, [vampiro])).toBe(1);
        expect(contarArmasNaturales(TROLL, [vampiro])).toBe(4);
        const semiilicido = { Armas_naturales: [dePlantilla('Mordisco', 0, 'quita'), dePlantilla('Tentaculo', 4, 'suma')] };
        expect(contarArmasNaturales(TROLL, [semiilicido])).toBe(6);
        const espectral = { Armas_naturales: [dePlantilla('Toque', 1, 'sustituye')] };
        expect(contarArmasNaturales(TROLL, [espectral])).toBe(1);
    });

    it('el licántropo cuenta la forma en que más tiene: el lobo, la híbrida', () => {
        const lobo = { Armas_naturales: [
            dePlantilla('Mordisco', 1, 'sustituye', 'animal'),
            dePlantilla('Garra', 2, 'sustituye', 'hibrida'),
            dePlantilla('Mordisco', 1, 'sustituye', 'hibrida'),
        ] };
        expect(contarArmasNaturales(HUMANO, [lobo])).toBe(3);
        const soloAnimal = { Armas_naturales: [dePlantilla('Mordisco', 1, 'sustituye', 'animal')] };
        expect(contarArmasNaturales(HUMANO, [soloAnimal])).toBe(1);
    });

    it('las filas del formulario vuelven al mismo cuerpo, y lo que no vale se avisa', () => {
        const plantilla = [dePlantilla('Mordisco', 0, 'quita'), { ...dePlantilla('Garra', 2, 'minimo', 'hibrida'), Dano: '1d4' }];
        const filas = filasDeArmasNaturales(plantilla);
        expect(cuerpoDeArmasNaturales(filas, true)).toEqual([
            { id_arma_natural: 1, cantidad: 0, dano: null, primaria: true, modo: 'quita', forma: 'todas' },
            { id_arma_natural: 2, cantidad: 2, dano: '1d4', primaria: true, modo: 'minimo', forma: 'hibrida' },
        ]);
        expect(cuerpoDeArmasNaturales(filasDeArmasNaturales(TROLL.Armas_naturales), false))
            .toEqual([{ id_arma_natural: 2, cantidad: 2, dano: null, primaria: true }, { id_arma_natural: 1, cantidad: 1, dano: null, primaria: true }]);
        expect(problemaDeArmasNaturales(filas, true)).toBeNull();

        const ala = filaArmaNatural({ Id: 9, Nombre: 'Ala', Nombre_plural: 'alas', Primaria: false, Oficial: true });
        expect(ala.primaria).toBeFalse();
        expect(problemaDeArmasNaturales([{ ...ala, cantidad: 0 }], false)).toBe('Ala: la cantidad va de 1 a 99.');
        expect(problemaDeArmasNaturales([ala, { ...ala, uid: 'otra' }], false)).toBe('Ala: ese tipo ya está.');
        expect(problemaDeArmasNaturales([ala, { ...ala, uid: 'otra', forma: 'animal' }], true)).toBeNull();
    });
});
